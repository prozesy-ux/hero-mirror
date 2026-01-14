import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users, Search, Check, CheckCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
    
    // Get all unique users who have sent messages
    const { data: messagesData, error } = await supabase
      .from('support_messages')
      .select('user_id, message, sender_type, is_read, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat users:', error);
      setLoading(false);
      return;
    }

    // Group by user_id and get stats
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

    // Fetch user profiles
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

    // Sort by unread count, then by last message time
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

    // Update local state
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
      setNewMessage('');
      fetchMessages(selectedUser.user_id);
      toast.success('Message sent!');
    }
    setSending(false);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = users.reduce((sum, u) => sum + u.unread_count, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Support Chats</h1>
          <p className="text-gray-400 mt-1">Manage customer support conversations</p>
        </div>
        {totalUnread > 0 && (
          <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-xl">
            <MessageCircle className="text-red-400" size={18} />
            <span className="text-red-400 font-semibold">{totalUnread} unread</span>
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden flex" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Users List */}
        <div className="w-80 border-r border-gray-800 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Users */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 rounded-full border-2 border-gray-600 border-t-violet-500 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No conversations yet</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.user_id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full p-4 text-left transition-all border-b border-gray-800/50 ${
                    selectedUser?.user_id === user.user_id
                      ? 'bg-violet-500/20 border-l-2 border-l-violet-500'
                      : 'hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">
                          {user.full_name || user.email.split('@')[0]}
                        </span>
                        {user.unread_count > 0 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-500 text-white font-bold">
                            {user.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm truncate">{user.email}</p>
                      <p className="text-gray-400 text-sm truncate mt-1">{user.last_message}</p>
                    </div>
                    <span className="text-gray-600 text-xs whitespace-nowrap ml-2">
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
              <div className="p-4 border-b border-gray-800 bg-gray-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <span className="text-violet-400 font-bold">
                      {(selectedUser.full_name || selectedUser.email)[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {selectedUser.full_name || selectedUser.email.split('@')[0]}
                    </h3>
                    <p className="text-gray-500 text-sm">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.sender_type === 'admin'
                          ? 'bg-violet-500 text-white'
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs opacity-60">
                          {format(new Date(msg.created_at), 'h:mm a')}
                        </span>
                        {msg.sender_type === 'admin' && (
                          msg.is_read ? (
                            <CheckCheck size={14} className="opacity-60" />
                          ) : (
                            <Check size={14} className="opacity-60" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-800">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="bg-violet-500 hover:bg-violet-600 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Select a conversation</h3>
                <p className="text-gray-600">Choose a user from the list to view their messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatManagement;
