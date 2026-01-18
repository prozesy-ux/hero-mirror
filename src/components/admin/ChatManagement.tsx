import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MessageCircle, Send, Users, Search, Check, CheckCheck, 
  Trash2, AlertTriangle, Loader2, Image, Video, FileText, 
  Download, Monitor, X, Store, User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { useAdminData } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { playSound } from '@/lib/sounds';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface ChatUser {
  user_id: string;
  email: string;
  full_name: string | null;
  unread_count: number;
  last_message: string;
  last_message_at: string;
}

interface SellerChatUser {
  seller_id: string;
  store_name: string;
  user_id: string;
  unread_count: number;
  last_message: string;
  last_message_at: string;
}

interface Message {
  id: string;
  user_id?: string;
  seller_id?: string;
  message: string;
  sender_type: 'user' | 'admin' | 'seller';
  is_read: boolean;
  created_at: string;
}

interface ChatAttachment {
  id: string;
  message_id: string | null;
  user_id?: string;
  seller_id?: string;
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
  const { supportMessages, sellerSupportMessages, profiles, sellerProfiles, isLoading, refreshTable } = useAdminDataContext();
  const { fetchData } = useAdminData();
  const [activeTab, setActiveTab] = useState<'users' | 'sellers'>('users');
  
  // User chat state
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [userMessages, setUserMessages] = useState<Message[]>([]);
  const [userAttachments, setUserAttachments] = useState<Map<string, ChatAttachment[]>>(new Map());
  
  // Seller chat state
  const [selectedSeller, setSelectedSeller] = useState<SellerChatUser | null>(null);
  const [sellerMessages, setSellerMessages] = useState<Message[]>([]);
  const [sellerAttachments, setSellerAttachments] = useState<Map<string, ChatAttachment[]>>(new Map());
  
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [deletingAllChat, setDeletingAllChat] = useState(false);
  const [activeScreenShare, setActiveScreenShare] = useState<ScreenShareSession | null>(null);
  const [showScreenShareModal, setShowScreenShareModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive user chat list
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

  // Derive seller chat list
  const sellers = useMemo(() => {
    const sellerMap = new Map<string, { 
      seller_id: string; 
      unread_count: number; 
      last_message: string; 
      last_message_at: string 
    }>();

    sellerSupportMessages.forEach((msg: any) => {
      if (!sellerMap.has(msg.seller_id)) {
        sellerMap.set(msg.seller_id, {
          seller_id: msg.seller_id,
          unread_count: 0,
          last_message: msg.message,
          last_message_at: msg.created_at
        });
      }
      
      const sellerData = sellerMap.get(msg.seller_id)!;
      if (msg.sender_type === 'seller' && !msg.is_read) {
        sellerData.unread_count++;
      }
    });

    const sellerProfileMap = new Map(sellerProfiles.map((p: any) => [p.id, p]));

    const chatSellers: SellerChatUser[] = Array.from(sellerMap.keys()).map((sellerId) => {
      const profile = sellerProfileMap.get(sellerId);
      const sellerData = sellerMap.get(sellerId)!;
      return {
        seller_id: sellerId,
        store_name: profile?.store_name || 'Unknown Store',
        user_id: profile?.user_id || '',
        unread_count: sellerData.unread_count,
        last_message: sellerData.last_message,
        last_message_at: sellerData.last_message_at
      };
    });

    chatSellers.sort((a, b) => {
      if (b.unread_count !== a.unread_count) {
        return b.unread_count - a.unread_count;
      }
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

    return chatSellers;
  }, [sellerSupportMessages, sellerProfiles]);

  // Fetch user messages
  useEffect(() => {
    if (selectedUser) {
      fetchUserMessages(selectedUser.user_id);
      markUserMessagesAsRead(selectedUser.user_id);
      checkActiveScreenShare(selectedUser.user_id);
    }
  }, [selectedUser]);

  // Fetch seller messages
  useEffect(() => {
    if (selectedSeller) {
      fetchSellerMessages(selectedSeller.seller_id);
      markSellerMessagesAsRead(selectedSeller.seller_id);
    }
  }, [selectedSeller]);

  useEffect(() => {
    scrollToBottom();
  }, [userMessages, sellerMessages]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('admin-support-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, (payload) => {
        if (payload.new && (payload.new as Message).sender_type === 'user') {
          playSound('messageReceived');
        }
        refreshTable('support_messages');
        if (selectedUser && payload.new && (payload.new as Message).user_id === selectedUser.user_id) {
          fetchUserMessages(selectedUser.user_id);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_support_messages' }, (payload) => {
        if (payload.new && (payload.new as Message).sender_type === 'seller') {
          playSound('messageReceived');
        }
        refreshTable('seller_support_messages');
        if (selectedSeller && payload.new && (payload.new as any).seller_id === selectedSeller.seller_id) {
          fetchSellerMessages(selectedSeller.seller_id);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'screen_share_sessions' }, () => {
        if (selectedUser) {
          checkActiveScreenShare(selectedUser.user_id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedUser, selectedSeller, refreshTable]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUserMessages = async (userId: string) => {
    const { data } = await fetchData<Message>('support_messages', {
      filters: [{ column: 'user_id', value: userId }],
      order: { column: 'created_at', ascending: true }
    });
    if (data) {
      setUserMessages(data as Message[]);
      
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
          setUserAttachments(attachmentMap);
        }
      }
    }
  };

  const fetchSellerMessages = async (sellerId: string) => {
    const { data } = await fetchData<Message>('seller_support_messages', {
      filters: [{ column: 'seller_id', value: sellerId }],
      order: { column: 'created_at', ascending: true }
    });
    if (data) {
      setSellerMessages(data as Message[]);
      
      const messageIds = (data as Message[]).map(m => m.id);
      if (messageIds.length > 0) {
        const { data: attachmentData } = await supabase
          .from('seller_chat_attachments')
          .select('*')
          .in('message_id', messageIds);
        
        if (attachmentData) {
          const attachmentMap = new Map<string, ChatAttachment[]>();
          attachmentData.forEach(att => {
            const existing = attachmentMap.get(att.message_id || '') || [];
            attachmentMap.set(att.message_id || '', [...existing, att]);
          });
          setSellerAttachments(attachmentMap);
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

  const markUserMessagesAsRead = async (userId: string) => {
    await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('sender_type', 'user')
      .eq('is_read', false);
  };

  const markSellerMessagesAsRead = async (sellerId: string) => {
    await supabase
      .from('seller_support_messages')
      .update({ is_read: true })
      .eq('seller_id', sellerId)
      .eq('sender_type', 'seller')
      .eq('is_read', false);
  };

  const sendUserMessage = async () => {
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
      
      // Create notification for the user
      const token = localStorage.getItem('admin_session_token');
      if (token) {
        try {
          await supabase.functions.invoke('admin-mutate-data', {
            body: {
              token,
              table: 'notifications',
              operation: 'insert',
              data: {
                user_id: selectedUser.user_id,
                type: 'message',
                title: 'New message from Support',
                message: newMessage.trim().substring(0, 100) + (newMessage.trim().length > 100 ? '...' : ''),
                is_read: false
              }
            }
          });
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }
      }
      
      setNewMessage('');
      fetchUserMessages(selectedUser.user_id);
      toast.success('Message sent!');
    }
    setSending(false);
  };

  const sendSellerMessage = async () => {
    if (!newMessage.trim() || !selectedSeller) return;

    setSending(true);
    const { error } = await supabase
      .from('seller_support_messages')
      .insert({
        seller_id: selectedSeller.seller_id,
        message: newMessage.trim(),
        sender_type: 'admin',
        is_read: true
      });

    if (error) {
      toast.error('Failed to send message');
    } else {
      playSound('messageSent');
      
      // Create seller notification
      const token = localStorage.getItem('admin_session_token');
      if (token) {
        try {
          await supabase.functions.invoke('admin-mutate-data', {
            body: {
              token,
              table: 'seller_notifications',
              operation: 'insert',
              data: {
                seller_id: selectedSeller.seller_id,
                type: 'message',
                title: 'New message from Support',
                message: newMessage.trim().substring(0, 100) + (newMessage.trim().length > 100 ? '...' : ''),
                is_read: false
              }
            }
          });
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }
      }
      
      setNewMessage('');
      fetchSellerMessages(selectedSeller.seller_id);
      toast.success('Message sent!');
    }
    setSending(false);
  };

  const canDeleteMessage = (createdAt: string): boolean => {
    const messageDate = new Date(createdAt);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return messageDate < oneDayAgo;
  };

  const handleDeleteUserMessage = async (messageId: string, createdAt: string) => {
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
      if (selectedUser) fetchUserMessages(selectedUser.user_id);
      refreshTable('support_messages');
    }
  };

  const handleDeleteSellerMessage = async (messageId: string, createdAt: string) => {
    if (!canDeleteMessage(createdAt)) {
      toast.error('Can only delete messages older than 1 day');
      return;
    }
    if (!confirm('Delete this message?')) return;
    
    setDeletingMessageId(messageId);
    
    const { error } = await supabase
      .from('seller_support_messages')
      .delete()
      .eq('id', messageId);
    
    setDeletingMessageId(null);
    
    if (error) {
      toast.error('Failed to delete message');
    } else {
      toast.success('Message deleted');
      if (selectedSeller) fetchSellerMessages(selectedSeller.seller_id);
      refreshTable('seller_support_messages');
    }
  };

  const handleDeleteAllUserChat = async () => {
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
      fetchUserMessages(selectedUser.user_id);
      refreshTable('support_messages');
    }
  };

  const handleDeleteAllSellerChat = async () => {
    if (!selectedSeller) return;
    if (!confirm('Delete entire chat history with this seller? Only messages older than 1 day will be deleted.')) return;
    
    setDeletingAllChat(true);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase
      .from('seller_support_messages')
      .delete()
      .eq('seller_id', selectedSeller.seller_id)
      .lt('created_at', oneDayAgo);
    
    setDeletingAllChat(false);
    
    if (error) {
      toast.error('Failed to delete chat');
    } else {
      toast.success('Old messages deleted');
      fetchSellerMessages(selectedSeller.seller_id);
      refreshTable('seller_support_messages');
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

  const filteredSellers = sellers.filter(seller =>
    seller.store_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUserUnread = users.reduce((sum, u) => sum + u.unread_count, 0);
  const totalSellerUnread = sellers.reduce((sum, s) => sum + s.unread_count, 0);

  const renderChatArea = (
    isUserChat: boolean,
    messages: Message[],
    attachments: Map<string, ChatAttachment[]>,
    selected: ChatUser | SellerChatUser | null,
    sendMessage: () => void,
    handleDeleteMessage: (id: string, createdAt: string) => void,
    handleDeleteAllChat: () => void
  ) => {
    if (!selected) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Select a Conversation</h3>
            <p className="text-gray-400">
              Choose a {isUserChat ? 'user' : 'seller'} from the list to start chatting
            </p>
          </div>
        </div>
      );
    }

    const displayName = isUserChat 
      ? (selected as ChatUser).full_name || (selected as ChatUser).email.split('@')[0]
      : (selected as SellerChatUser).store_name;

    const subText = isUserChat 
      ? (selected as ChatUser).email
      : 'Seller Store';

    return (
      <>
        <div className="p-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                {isUserChat ? (
                  <User className="text-white" size={18} />
                ) : (
                  <Store className="text-emerald-400" size={18} />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white">{displayName}</h3>
                <p className="text-gray-500 text-sm">{subText}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isUserChat && activeScreenShare && (
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
            const isAdminMsg = msg.sender_type === 'admin';
            
            return (
              <div
                key={msg.id}
                className={`flex ${isAdminMsg ? 'justify-end' : 'justify-start'} group`}
              >
                <div className="flex items-end gap-2">
                  {!isAdminMsg && isDeletable && (
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
                      isAdminMsg
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    
                    {msgAttachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msgAttachments.map((att) => (
                          <div key={att.id}>
                            {renderAttachment(att, isAdminMsg)}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-xs ${isAdminMsg ? 'text-black/50' : 'text-white/50'}`}>
                        {format(new Date(msg.created_at), 'h:mm a')}
                      </span>
                      {isDeletable && (
                        <AlertTriangle size={10} className={isAdminMsg ? 'text-black/30' : 'text-white/30'} />
                      )}
                      {isAdminMsg && (
                        msg.is_read ? <CheckCheck size={14} className="text-black/50" /> : <Check size={14} className="text-black/50" />
                      )}
                    </div>
                  </div>
                  
                  {isAdminMsg && isDeletable && (
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
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'users' | 'sellers')}>
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-black">
              <User size={16} />
              User Support
              {totalUserUnread > 0 && (
                <Badge className="bg-red-500 text-white text-xs ml-1">{totalUserUnread}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sellers" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-black">
              <Store size={16} />
              Seller Support
              {totalSellerUnread > 0 && (
                <Badge className="bg-red-500 text-white text-xs ml-1">{totalSellerUnread}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex" style={{ height: 'calc(100vh - 250px)' }}>
        {/* Users/Sellers List */}
        <div className="w-80 border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 border-b border-white/5">
                    <Skeleton className="h-4 w-24 bg-white/10 mb-2" />
                    <Skeleton className="h-3 w-32 bg-white/10" />
                  </div>
                ))}
              </div>
            ) : activeTab === 'users' ? (
              filteredUsers.length === 0 ? (
                <div className="p-6 text-center">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No user conversations yet</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.user_id}
                    onClick={() => { setSelectedUser(user); setSelectedSeller(null); }}
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
                        <p className={`text-sm truncate ${selectedUser?.user_id === user.user_id ? 'text-black/60' : 'text-gray-500'}`}>
                          {user.email}
                        </p>
                        <p className={`text-sm truncate mt-1 ${selectedUser?.user_id === user.user_id ? 'text-black/70' : 'text-gray-400'}`}>
                          {user.last_message}
                        </p>
                      </div>
                      <span className={`text-xs whitespace-nowrap ml-2 ${selectedUser?.user_id === user.user_id ? 'text-black/50' : 'text-gray-600'}`}>
                        {format(new Date(user.last_message_at), 'MMM d')}
                      </span>
                    </div>
                  </button>
                ))
              )
            ) : (
              filteredSellers.length === 0 ? (
                <div className="p-6 text-center">
                  <Store className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No seller conversations yet</p>
                </div>
              ) : (
                filteredSellers.map((seller) => (
                  <button
                    key={seller.seller_id}
                    onClick={() => { setSelectedSeller(seller); setSelectedUser(null); }}
                    className={`w-full p-4 text-left transition-all border-b border-white/5 ${
                      selectedSeller?.seller_id === seller.seller_id
                        ? 'bg-white text-black'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Store size={14} className={selectedSeller?.seller_id === seller.seller_id ? 'text-emerald-600' : 'text-emerald-400'} />
                          <span className={`font-semibold truncate ${selectedSeller?.seller_id === seller.seller_id ? 'text-black' : 'text-white'}`}>
                            {seller.store_name}
                          </span>
                          {seller.unread_count > 0 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-red-500 text-white font-bold">
                              {seller.unread_count}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate mt-1 ${selectedSeller?.seller_id === seller.seller_id ? 'text-black/70' : 'text-gray-400'}`}>
                          {seller.last_message}
                        </p>
                      </div>
                      <span className={`text-xs whitespace-nowrap ml-2 ${selectedSeller?.seller_id === seller.seller_id ? 'text-black/50' : 'text-gray-600'}`}>
                        {format(new Date(seller.last_message_at), 'MMM d')}
                      </span>
                    </div>
                  </button>
                ))
              )
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'users' 
            ? renderChatArea(true, userMessages, userAttachments, selectedUser, sendUserMessage, handleDeleteUserMessage, handleDeleteAllUserChat)
            : renderChatArea(false, sellerMessages, sellerAttachments, selectedSeller, sendSellerMessage, handleDeleteSellerMessage, handleDeleteAllSellerChat)
          }
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