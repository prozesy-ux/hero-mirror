import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MessageCircle, Send, Users, Search, Check, CheckCheck, 
  Trash2, AlertTriangle, Loader2, Image, Video, FileText, 
  Download, Monitor, X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { useAdminData } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { playSound } from '@/lib/sounds';
import { Skeleton } from '@/components/ui/skeleton';

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

interface ChatAttachment {
  id: string;
  message_id: string | null;
  user_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
}

interface ScreenShareSession {
  id: string;
  user_id: string;
  status: string;
  peer_id: string | null;
  created_at: string;
  ended_at: string | null;
}

const ChatManagement = () => {
  const { supportMessages, profiles, isLoading, refreshTable } = useAdminDataContext();
  const { fetchData } = useAdminData();
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Map<string, ChatAttachment[]>>(new Map());
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [deletingAllChat, setDeletingAllChat] = useState(false);
  const [activeScreenShare, setActiveScreenShare] = useState<ScreenShareSession | null>(null);
  const [showScreenShareModal, setShowScreenShareModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const users = useMemo(() => {
    const userMap = new Map<string, { 
      user_id: string; 
      unread_count: number; 
      last_message: string; 
      last_message_at: string 
    }>();

    supportMessages.forEach((msg: any) => {
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

    const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));

    const chatUsers: ChatUser[] = Array.from(userMap.keys()).map((userId) => {
      const profile = profileMap.get(userId);
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

    return chatUsers;
  }, [supportMessages, profiles]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.user_id);
      markMessagesAsRead(selectedUser.user_id);
      checkActiveScreenShare(selectedUser.user_id);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-support-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, (payload) => {
        if (payload.new && (payload.new as Message).sender_type === 'user') {
          playSound('messageReceived');
        }
        refreshTable('support_messages');
        if (selectedUser && payload.new && (payload.new as Message).user_id === selectedUser.user_id) {
          fetchMessages(selectedUser.user_id);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'screen_share_sessions' }, () => {
        if (selectedUser) {
          checkActiveScreenShare(selectedUser.user_id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedUser, refreshTable]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (userId: string) => {
    const { data } = await fetchData<Message>('support_messages', {
      filters: [{ column: 'user_id', value: userId }],
      order: { column: 'created_at', ascending: true }
    });
    if (data) {
      setMessages(data as Message[]);
      
      // Fetch attachments
      const messageIds = (data as Message[]).map(m => m.id);
      if (messageIds.length > 0) {
        const { data: attachmentData } = await supabase
          .from('chat_attachments')
          .select('*')
          .in('message_id', messageIds);
        
        if (attachmentData) {
          const attachmentMap = new Map<string, ChatAttachment[]>();
          attachmentData.forEach(att => {
            const existing = attachmentMap.get(att.message_id || '') || [];
            attachmentMap.set(att.message_id || '', [...existing, att]);
          });
          setAttachments(attachmentMap);
        }
      }
    }
  };

  const checkActiveScreenShare = async (userId: string) => {
    const { data } = await supabase
      .from('screen_share_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (data && data.length > 0) {
      setActiveScreenShare(data[0] as ScreenShareSession);
    } else {
      setActiveScreenShare(null);
    }
  };

  const markMessagesAsRead = async (userId: string) => {
    await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('sender_type', 'user')
      .eq('is_read', false);
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
    } else {
      toast.success('Message deleted');
      if (selectedUser) fetchMessages(selectedUser.user_id);
      refreshTable('support_messages');
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
    } else {
      toast.success('Old messages deleted');
      fetchMessages(selectedUser.user_id);
      refreshTable('support_messages');
    }
  };

  const renderAttachment = (att: ChatAttachment, isAdmin: boolean) => {
    const bgClass = isAdmin ? 'bg-black/10' : 'bg-white/10';
    const hoverClass = isAdmin ? 'hover:bg-black/20' : 'hover:bg-white/20';
    
    if (att.file_type === 'image') {
      return (
        <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="block">
          <img 
            src={att.file_url} 
            alt={att.file_name} 
            className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-white/20"
          />
        </a>
      );
    }
    
    if (att.file_type === 'video') {
      return (
        <div className="relative max-w-[250px]">
          <video 
            src={att.file_url} 
            controls 
            className="rounded-lg max-h-[200px]"
          />
        </div>
      );
    }
    
    return (
      <a 
        href={att.file_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className={`flex items-center gap-2 px-3 py-2 ${bgClass} ${hoverClass} rounded-lg transition-colors`}
      >
        <FileText size={18} />
        <span className="text-sm truncate max-w-[150px]">{att.file_name}</span>
        <Download size={14} />
      </a>
    );
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
          <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-xl">
            <MessageCircle className="text-red-400" size={18} />
            <span className="text-red-400 font-semibold">{totalUnread} unread</span>
          </div>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Users List */}
        <div className="w-80 border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 border-b border-white/5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24 bg-white/10" />
                        <Skeleton className="h-3 w-32 bg-white/10" />
                        <Skeleton className="h-3 w-40 bg-white/10" />
                      </div>
                      <Skeleton className="h-3 w-12 bg-white/10" />
                    </div>
                  </div>
                ))}
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
                  className={`w-full p-4 text-left transition-all border-b border-white/5 ${
                    selectedUser?.user_id === user.user_id
                      ? 'bg-white text-black'
                      : 'hover:bg-white/5'
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
                      <p className={`text-sm truncate ${selectedUser?.user_id === user.user_id ? 'text-black/60' : 'text-gray-500'}`}>{user.email}</p>
                      <p className={`text-sm truncate mt-1 ${selectedUser?.user_id === user.user_id ? 'text-black/70' : 'text-gray-400'}`}>{user.last_message}</p>
                    </div>
                    <span className={`text-xs whitespace-nowrap ml-2 ${selectedUser?.user_id === user.user_id ? 'text-black/50' : 'text-gray-600'}`}>
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
              <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-white font-bold">
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
                  
                  <div className="flex items-center gap-2">
                    {/* Screen Share Indicator */}
                    {activeScreenShare && (
                      <button
                        onClick={() => setShowScreenShareModal(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors text-sm animate-pulse"
                      >
                        <Monitor size={16} />
                        User Sharing Screen
                      </button>
                    )}
                    
                    <button
                      onClick={handleDeleteAllChat}
                      disabled={deletingAllChat}
                      className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors text-sm"
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
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isDeletable = canDeleteMessage(msg.created_at);
                  const msgAttachments = attachments.get(msg.id) || [];
                  
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
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          
                          {/* Attachments */}
                          {msgAttachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {msgAttachments.map((att) => (
                                <div key={att.id}>
                                  {renderAttachment(att, msg.sender_type === 'admin')}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`text-xs ${msg.sender_type === 'admin' ? 'text-black/50' : 'text-white/50'}`}>
                              {format(new Date(msg.created_at), 'h:mm a')}
                            </span>
                            {isDeletable && (
                              <AlertTriangle size={10} className={msg.sender_type === 'admin' ? 'text-black/30' : 'text-white/30'} />
                            )}
                            {msg.sender_type === 'admin' && (
                              msg.is_read ? <CheckCheck size={14} className="text-black/50" /> : <Check size={14} className="text-black/50" />
                            )}
                          </div>
                        </div>
                        
                        {msg.sender_type === 'admin' && isDeletable && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id, msg.created_at)}
                            disabled={deletingMessageId === msg.id}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
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

              <div className="p-4 border-t border-white/10">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select a Conversation</h3>
                <p className="text-gray-400">Choose a user from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Screen Share Modal */}
      {showScreenShareModal && activeScreenShare && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Monitor className="text-green-400" size={20} />
                <h3 className="text-white font-semibold">
                  {selectedUser?.full_name || selectedUser?.email} is sharing their screen
                </h3>
              </div>
              <button
                onClick={() => setShowScreenShareModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 text-center">
              <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Monitor className="text-green-400" size={40} />
              </div>
              <h4 className="text-white text-lg font-medium mb-2">Screen Share Active</h4>
              <p className="text-gray-400 mb-4">
                The user has started sharing their screen. In a full implementation,
                you would see their screen here via WebRTC connection.
              </p>
              <p className="text-gray-500 text-sm">
                Session started: {format(new Date(activeScreenShare.created_at), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatManagement;