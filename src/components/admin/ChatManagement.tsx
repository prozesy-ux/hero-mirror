import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users, Search, Check, CheckCheck, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { playSound } from '@/lib/sounds';

interface ChatUser {
  user_id: string;
  email: string;
  full_name: string | null;
  unread_count: number;
  last_message: string;
  last_message_at: string;
}

interface Message {
  id: string;
  user_id: string;
  message: string;
  sender_type: 'user' | 'admin';
  is_read: boolean;
  created_at: string;
}

const ChatManagement = () => {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [deletingAllChat, setDeletingAllChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatUsers();
    const unsubscribe = subscribeToMessages();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.user_id);
      markMessagesAsRead(selectedUser.user_id);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatUsers = async () => {
    setLoading(true);
    
    const { data: messagesData, error } = await supabase
      .from('support_messages')
      .select('user_id, message, sender_type, is_read, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat users:', error);
      setLoading(false);
      return;
    }

    const userMap = new Map<string, { 
      user_id: string; 
      unread_count: number; 
      last_message: string; 
      last_message_at: string 
    }>();

    messagesData?.forEach((msg) => {
      if (!userMap.has(msg.user_id)) {
        userMap.set(msg.user_id, {
          user_id: msg.user_id,
          unread_count: 0,
          last_message: msg.message,
          last_message_at: msg.created_at
        });
      }
      
      const userData = userMap.get(msg.user_id)!;
      if (msg.sender_type === 'user' && !msg.is_read) {
        userData.unread_count++;
      }
    });

    const userIds = Array.from(userMap.keys());
    if (userIds.length === 0) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
      .in('user_id', userIds);

    const chatUsers: ChatUser[] = userIds.map((userId) => {
      const profile = profiles?.find((p) => p.user_id === userId);
      const userData = userMap.get(userId)!;
      return {
        user_id: userId,
        email: profile?.email || 'Unknown',
        full_name: profile?.full_name || null,
        unread_count: userData.unread_count,
        last_message: userData.last_message,
        last_message_at: userData.last_message_at
      };
    });

    chatUsers.sort((a, b) => {
      if (b.unread_count !== a.unread_count) {
        return b.unread_count - a.unread_count;
      }
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

    setUsers(chatUsers);
    setLoading(false);
  };

  const fetchMessages = async (userId: string) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
    }
  };

  const markMessagesAsRead = async (userId: string) => {
    await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('sender_type', 'user')
      .eq('is_read', false);

    setUsers(prev => prev.map(u => 
      u.user_id === userId ? { ...u, unread_count: 0 } : u
    ));
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('admin-support-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages'
        },
        (payload) => {
          if (payload.new && (payload.new as Message).sender_type === 'user') {
            playSound('messageReceived');
          }
          fetchChatUsers();
          if (selectedUser && payload.new && (payload.new as Message).user_id === selectedUser.user_id) {
            fetchMessages(selectedUser.user_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    setSending(true);
    const { error } = await supabase
      .from('support_messages')
      .insert({
        user_id: selectedUser.user_id,
        message: newMessage.trim(),
        sender_type: 'admin',
        is_read: true
      });

    if (error) {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
    } else {
      playSound('messageSent');
      setNewMessage('');
      fetchMessages(selectedUser.user_id);
      toast.success('Message sent!');
    }
    setSending(false);
  };

  const canDeleteMessage = (createdAt: string): boolean => {
    const messageDate = new Date(createdAt);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return messageDate < oneDayAgo;
  };

  const handleDeleteMessage = async (messageId: string, createdAt: string) => {
    if (!canDeleteMessage(createdAt)) {
      toast.error('Can only delete messages older than 1 day');
      return;
    }
    
    if (!confirm('Delete this message?')) return;
    
    setDeletingMessageId(messageId);
    
    const { error } = await supabase
      .from('support_messages')
      .delete()
      .eq('id', messageId);
    
    setDeletingMessageId(null);
    
    if (error) {
      toast.error('Failed to delete message');
      console.error(error);
    } else {
      toast.success('Message deleted');
      if (selectedUser) {
        fetchMessages(selectedUser.user_id);
      }
      fetchChatUsers();
    }
  };

  const handleDeleteAllChat = async () => {
    if (!selectedUser) return;
    
    if (!confirm('Delete entire chat history with this user? Only messages older than 1 day will be deleted.')) return;
    
    setDeletingAllChat(true);
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase
      .from('support_messages')
      .delete()
      .eq('user_id', selectedUser.user_id)
      .lt('created_at', oneDayAgo);
    
    setDeletingAllChat(false);
    
    if (error) {
      toast.error('Failed to delete chat');
      console.error(error);
    } else {
      toast.success('Old messages deleted');
      fetchMessages(selectedUser.user_id);
      fetchChatUsers();
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = users.reduce((sum, u) => sum + u.unread_count, 0);

  return (
    <div>
      <div className="flex items-center justify-end mb-6">
        {totalUnread > 0 && (
          <div className="flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-xl">
            <MessageCircle className="text-red-400" size={18} />
            <span className="text-red-400 font-semibold">{totalUnread} unread</span>
          </div>
        )}
      </div>

      <div className="bg-[#09090b] border border-[#1a1a1a] rounded-2xl overflow-hidden flex" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Users List */}
        <div className="w-80 border-r border-[#1a1a1a] flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-[#1a1a1a]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full bg-[#050506] border border-[#1a1a1a] rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-[#252528]"
              />
            </div>
          </div>

          {/* Users */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-600">No conversations yet</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                  <button
                    key={user.user_id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full p-4 text-left transition-all border-b border-[#1a1a1a] ${
                      selectedUser?.user_id === user.user_id
                        ? 'bg-white text-black'
                        : 'hover:bg-[#0f0f11]'
                    }`}
                  >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold truncate ${selectedUser?.user_id === user.user_id ? 'text-black' : 'text-white'}`}>
                          {user.full_name || user.email.split('@')[0]}
                        </span>
                        {user.unread_count > 0 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-500 text-white font-bold">
                            {user.unread_count}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate ${selectedUser?.user_id === user.user_id ? 'text-black/60' : 'text-zinc-600'}`}>{user.email}</p>
                      <p className={`text-sm truncate mt-1 ${selectedUser?.user_id === user.user_id ? 'text-black/70' : 'text-zinc-500'}`}>{user.last_message}</p>
                    </div>
                    <span className={`text-xs whitespace-nowrap ml-2 ${selectedUser?.user_id === user.user_id ? 'text-black/50' : 'text-zinc-600'}`}>
                      {format(new Date(user.last_message_at), 'MMM d')}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[#1a1a1a] bg-[#0d0d0f]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                      <span className="text-white font-bold">
                        {(selectedUser.full_name || selectedUser.email)[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {selectedUser.full_name || selectedUser.email.split('@')[0]}
                      </h3>
                      <p className="text-zinc-600 text-sm">{selectedUser.email}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleDeleteAllChat}
                    disabled={deletingAllChat}
                    className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-all text-sm"
                  >
                    {deletingAllChat ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Delete Old Messages
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isDeletable = canDeleteMessage(msg.created_at);
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className="flex items-end gap-2">
                        {msg.sender_type === 'user' && isDeletable && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id, msg.created_at)}
                            disabled={deletingMessageId === msg.id}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                            title="Delete message (older than 1 day)"
                          >
                            {deletingMessageId === msg.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        )}
                        
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            msg.sender_type === 'admin'
                              ? 'bg-white text-black'
                              : 'bg-white/5 text-white'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`text-xs ${msg.sender_type === 'admin' ? 'text-black/50' : 'text-white/50'}`}>
                              {format(new Date(msg.created_at), 'h:mm a')}
                            </span>
                            {isDeletable && (
                              <span title="Can be deleted">
                                <AlertTriangle size={10} className={msg.sender_type === 'admin' ? 'text-black/30' : 'text-white/30'} />
                              </span>
                            )}
                            {msg.sender_type === 'admin' && (
                              msg.is_read ? (
                                <CheckCheck size={14} className="text-black/50" />
                              ) : (
                                <Check size={14} className="text-black/50" />
                              )
                            )}
                          </div>
                        </div>
                        
                        {msg.sender_type === 'admin' && isDeletable && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id, msg.created_at)}
                            disabled={deletingMessageId === msg.id}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                            title="Delete message (older than 1 day)"
                          >
                            {deletingMessageId === msg.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[#1a1a1a]">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-[#050506] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#252528]"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="flex items-center justify-center w-12 h-12 bg-white text-black rounded-xl hover:bg-white/90 transition-all disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
                <p className="text-zinc-600">Choose a user from the list to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatManagement;