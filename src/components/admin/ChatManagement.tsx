import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MessageCircle, Send, Users, Search, Check, CheckCheck, 
  Trash2, AlertTriangle, Loader2, Image, Video, FileText, 
  Download, Monitor, X, Store, User, UserPlus, Eye, LogOut, Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminMutate } from '@/hooks/useAdminMutate';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { playSound } from '@/lib/sounds';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface ChatJoinRequest {
  id: string;
  buyer_id: string;
  seller_id: string;
  reason: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  buyer_profile?: { email: string; full_name: string | null } | null;
  seller_profile?: { store_name: string } | null;
}

interface ChatMessage {
  id: string;
  buyer_id: string;
  seller_id: string;
  message: string;
  sender_type: 'buyer' | 'seller' | 'system' | 'support';
  created_at: string;
  admin_joined?: boolean;
}

interface ActiveChatSession {
  request: ChatJoinRequest;
  messages: ChatMessage[];
}

type MainTab = 'users' | 'sellers' | 'chat-requests';
type ChatRequestTab = 'pending' | 'active';

const ChatManagement = () => {
  const { supportMessages, sellerSupportMessages, profiles, sellerProfiles, isLoading, refreshTable } = useAdminDataContext();
  const { fetchData } = useAdminData();
  const { mutateData, insertData, updateData, deleteData, deleteWithFilters } = useAdminMutate();
  const [activeTab, setActiveTab] = useState<MainTab>('users');
  
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

  // Chat Join Requests state
  const [chatRequests, setChatRequests] = useState<ChatJoinRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ChatJoinRequest | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [processingRequest, setProcessingRequest] = useState(false);
  const [chatRequestTab, setChatRequestTab] = useState<ChatRequestTab>('pending');
  const [activeChatSession, setActiveChatSession] = useState<ActiveChatSession | null>(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

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

  // Fetch chat requests on mount
  useEffect(() => {
    fetchChatRequests();
  }, []);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_join_requests' }, () => {
        fetchChatRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedUser, selectedSeller, refreshTable]);

  // Realtime subscription for active chat session
  useEffect(() => {
    if (!activeChatSession) return;

    const channel = supabase
      .channel('support-chat-' + activeChatSession.request.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'seller_chats',
        filter: `buyer_id=eq.${activeChatSession.request.buyer_id}`
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        if (newMsg.seller_id === activeChatSession.request.seller_id) {
          setActiveChatSession(prev => prev ? {
            ...prev,
            messages: [...prev.messages, newMsg]
          } : null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChatSession?.request.id]);

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
        const { data: attachmentData } = await fetchData('chat_attachments', {
          filters: [{ column: 'message_id', operator: 'in', value: messageIds }]
        });
        
        if (attachmentData) {
          const attachmentMap = new Map<string, ChatAttachment[]>();
          (attachmentData as ChatAttachment[]).forEach(att => {
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
        const { data: attachmentData } = await fetchData('seller_chat_attachments', {
          filters: [{ column: 'message_id', operator: 'in', value: messageIds }]
        });
        
        if (attachmentData) {
          const attachmentMap = new Map<string, ChatAttachment[]>();
          (attachmentData as ChatAttachment[]).forEach(att => {
            const existing = attachmentMap.get(att.message_id || '') || [];
            attachmentMap.set(att.message_id || '', [...existing, att]);
          });
          setSellerAttachments(attachmentMap);
        }
      }
    }
  };

  const checkActiveScreenShare = async (userId: string) => {
    const { data } = await fetchData<ScreenShareSession>('screen_share_sessions', {
      filters: [
        { column: 'user_id', value: userId },
        { column: 'status', value: 'active' }
      ],
      order: { column: 'created_at', ascending: false },
      limit: 1
    });
    
    if (data && data.length > 0) {
      setActiveScreenShare(data[0]);
    } else {
      setActiveScreenShare(null);
    }
  };

  const markUserMessagesAsRead = async (userId: string) => {
    // Get unread messages first
    const { data: unreadMessages } = await fetchData<Message>('support_messages', {
      filters: [
        { column: 'user_id', value: userId },
        { column: 'sender_type', value: 'user' },
        { column: 'is_read', value: false }
      ]
    });

    if (unreadMessages && unreadMessages.length > 0) {
      // Update each message using admin mutate
      for (const msg of unreadMessages) {
        await updateData('support_messages', msg.id, { is_read: true });
      }
    }
  };

  const markSellerMessagesAsRead = async (sellerId: string) => {
    // Get unread messages first
    const { data: unreadMessages } = await fetchData<Message>('seller_support_messages', {
      filters: [
        { column: 'seller_id', value: sellerId },
        { column: 'sender_type', value: 'seller' },
        { column: 'is_read', value: false }
      ]
    });

    if (unreadMessages && unreadMessages.length > 0) {
      // Update each message using admin mutate
      for (const msg of unreadMessages) {
        await updateData('seller_support_messages', msg.id, { is_read: true });
      }
    }
  };

  const sendUserMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    setSending(true);
    
    const result = await insertData('support_messages', {
      user_id: selectedUser.user_id,
      message: newMessage.trim(),
      sender_type: 'admin',
      is_read: true
    });

    if (!result.success) {
      toast.error('Failed to send message');
    } else {
      playSound('messageSent');
      
      // Create notification
      await insertData('notifications', {
        user_id: selectedUser.user_id,
        type: 'message',
        title: 'New message from Support',
        message: newMessage.trim().substring(0, 100) + (newMessage.trim().length > 100 ? '...' : ''),
        is_read: false
      });
      
      setNewMessage('');
      fetchUserMessages(selectedUser.user_id);
      toast.success('Message sent!');
    }
    setSending(false);
  };

  const sendSellerMessage = async () => {
    if (!newMessage.trim() || !selectedSeller) return;

    setSending(true);
    
    const result = await insertData('seller_support_messages', {
      seller_id: selectedSeller.seller_id,
      message: newMessage.trim(),
      sender_type: 'admin',
      is_read: true
    });

    if (!result.success) {
      toast.error('Failed to send message');
    } else {
      playSound('messageSent');
      
      // Create notification
      await insertData('seller_notifications', {
        seller_id: selectedSeller.seller_id,
        type: 'message',
        title: 'New message from Support',
        message: newMessage.trim().substring(0, 100) + (newMessage.trim().length > 100 ? '...' : ''),
        is_read: false
      });
      
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
    
    const result = await deleteData('support_messages', messageId);
    
    setDeletingMessageId(null);
    
    if (!result.success) {
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
    
    const result = await deleteData('seller_support_messages', messageId);
    
    setDeletingMessageId(null);
    
    if (!result.success) {
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
    
    const result = await deleteWithFilters('support_messages', [
      { column: 'user_id', value: selectedUser.user_id },
      { column: 'created_at', operator: 'lt', value: oneDayAgo }
    ]);
    
    setDeletingAllChat(false);
    
    if (!result.success) {
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
    
    const result = await deleteWithFilters('seller_support_messages', [
      { column: 'seller_id', value: selectedSeller.seller_id },
      { column: 'created_at', operator: 'lt', value: oneDayAgo }
    ]);
    
    setDeletingAllChat(false);
    
    if (!result.success) {
      toast.error('Failed to delete chat');
    } else {
      toast.success('Old messages deleted');
      fetchSellerMessages(selectedSeller.seller_id);
      refreshTable('seller_support_messages');
    }
  };

  // Chat Join Requests Functions
  const fetchChatRequests = async () => {
    const { data, error } = await fetchData<ChatJoinRequest>('chat_join_requests', {
      order: { column: 'created_at', ascending: false }
    });

    if (!error && data) {
      const buyerIds = [...new Set(data.map(r => r.buyer_id))];
      const sellerIds = [...new Set(data.map(r => r.seller_id))];

      const [buyerProfiles, sellerProfilesData] = await Promise.all([
        fetchData('profiles', { filters: [{ column: 'user_id', operator: 'in', value: buyerIds }] }),
        fetchData('seller_profiles', { filters: [{ column: 'id', operator: 'in', value: sellerIds }] })
      ]);

      const enrichedData = data.map(request => ({
        ...request,
        buyer_profile: (buyerProfiles.data as any[])?.find(p => p.user_id === request.buyer_id) || null,
        seller_profile: (sellerProfilesData.data as any[])?.find(p => p.id === request.seller_id) || null
      }));

      setChatRequests(enrichedData);
    }
  };

  const fetchChatHistory = async (buyerId: string, sellerId: string) => {
    const { data } = await fetchData<ChatMessage>('seller_chats', {
      filters: [
        { column: 'buyer_id', value: buyerId },
        { column: 'seller_id', value: sellerId }
      ],
      order: { column: 'created_at', ascending: true },
      limit: 50
    });

    setChatMessages(data || []);
  };

  const handleJoinChat = async (request: ChatJoinRequest) => {
    setProcessingRequest(true);
    
    const result = await updateData('chat_join_requests', request.id, {
      status: 'joined',
      resolved_at: new Date().toISOString()
    });

    if (!result.success) {
      toast.error('Failed to join chat');
    } else {
      await insertData('seller_chats', {
        buyer_id: request.buyer_id,
        seller_id: request.seller_id,
        message: '🛡️ Uptoza Support has joined this conversation to help resolve your issue.',
        sender_type: 'system',
        admin_joined: true
      });

      toast.success('Joined chat successfully');
      setSelectedRequest(null);
      fetchChatRequests();
    }
    setProcessingRequest(false);
  };

  const handleDeclineRequest = async (request: ChatJoinRequest, notes: string) => {
    setProcessingRequest(true);
    
    const result = await updateData('chat_join_requests', request.id, {
      status: 'declined',
      admin_notes: notes,
      resolved_at: new Date().toISOString()
    });

    if (!result.success) {
      toast.error('Failed to decline request');
    } else {
      toast.success('Request declined');
      setSelectedRequest(null);
      fetchChatRequests();
    }
    setProcessingRequest(false);
  };

  const openActiveChat = async (request: ChatJoinRequest) => {
    const { data } = await fetchData<ChatMessage>('seller_chats', {
      filters: [
        { column: 'buyer_id', value: request.buyer_id },
        { column: 'seller_id', value: request.seller_id }
      ],
      order: { column: 'created_at', ascending: true },
      limit: 100
    });

    setActiveChatSession({
      request,
      messages: data || []
    });
  };

  const sendSupportMessage = async () => {
    if (!supportMessage.trim() || !activeChatSession || sendingMessage) return;
    
    setSendingMessage(true);
    
    const result = await insertData('seller_chats', {
      buyer_id: activeChatSession.request.buyer_id,
      seller_id: activeChatSession.request.seller_id,
      message: supportMessage.trim(),
      sender_type: 'support',
      admin_joined: true
    });

    if (!result.success) {
      toast.error('Failed to send message');
    } else {
      setSupportMessage('');
      const { data } = await fetchData<ChatMessage>('seller_chats', {
        filters: [
          { column: 'buyer_id', value: activeChatSession.request.buyer_id },
          { column: 'seller_id', value: activeChatSession.request.seller_id }
        ],
        order: { column: 'created_at', ascending: true },
        limit: 100
      });
      
      setActiveChatSession(prev => prev ? {
        ...prev,
        messages: data || []
      } : null);
    }
    
    setSendingMessage(false);
  };

  const handleCloseChat = async () => {
    if (!activeChatSession) return;
    
    await insertData('seller_chats', {
      buyer_id: activeChatSession.request.buyer_id,
      seller_id: activeChatSession.request.seller_id,
      message: '🛡️ Uptoza Support has left the conversation. Issue resolved.',
      sender_type: 'system',
      admin_joined: true
    });

    await updateData('chat_join_requests', activeChatSession.request.id, { status: 'resolved' });

    toast.success('Chat closed and marked as resolved');
    setActiveChatSession(null);
    fetchChatRequests();
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

  const pendingChatRequests = chatRequests.filter(r => r.status === 'pending');
  const joinedChatRequests = chatRequests.filter(r => r.status === 'joined');

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

  // Render Chat Requests Tab Content
  const renderChatRequestsContent = () => {
    // If active chat session is open, show full chat interface
    if (activeChatSession) {
      return (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 350px)' }}>
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Shield className="text-blue-400" size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Support Chat</h3>
                  <p className="text-gray-500 text-sm">
                    Buyer: {activeChatSession.request.buyer_profile?.email || 'Unknown'} • 
                    Seller: {activeChatSession.request.seller_profile?.store_name || 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveChatSession(null)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={handleCloseChat}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Close & Resolve
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="h-[calc(100%-140px)] p-4">
            <div className="space-y-4">
              {activeChatSession.messages.map((msg) => {
                const isSupportMsg = msg.sender_type === 'support';
                const isSystemMsg = msg.sender_type === 'system';
                const isBuyerMsg = msg.sender_type === 'buyer';

                if (isSystemMsg) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full text-sm">
                        {msg.message}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isSupportMsg ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        isSupportMsg
                          ? 'bg-blue-600 text-white'
                          : isBuyerMsg
                          ? 'bg-white/10 text-white'
                          : 'bg-emerald-600/20 text-emerald-400'
                      }`}
                    >
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {isSupportMsg ? 'Support' : isBuyerMsg ? 'Buyer' : 'Seller'}
                      </p>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {format(new Date(msg.created_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-3">
              <input
                type="text"
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendSupportMessage()}
                placeholder="Type support message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <Button
                onClick={sendSupportMessage}
                disabled={sendingMessage || !supportMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {sendingMessage ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Show pending/active tabs
    return (
      <Tabs value={chatRequestTab} onValueChange={(v) => setChatRequestTab(v as ChatRequestTab)}>
        <TabsList className="bg-white/5 border border-white/10 mb-4">
          <TabsTrigger value="pending" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-black">
            Pending
            {pendingChatRequests.length > 0 && (
              <Badge className="bg-red-500 text-white ml-1">{pendingChatRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-black">
            Active (Joined)
            {joinedChatRequests.length > 0 && (
              <Badge className="bg-blue-500 text-white ml-1">{joinedChatRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="bg-white/5 border border-white/10">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                Pending Support Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {pendingChatRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending support requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingChatRequests.map((request) => (
                    <div key={request.id} className="border border-white/10 rounded-xl p-4 space-y-3 bg-white/[0.02]">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/20">Action Required</Badge>
                            <span className="text-xs text-gray-500">
                              {format(new Date(request.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="font-medium text-white">
                            Buyer: {request.buyer_profile?.email || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-400">
                            Seller: {request.seller_profile?.store_name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                        <p className="text-sm font-medium text-amber-400">
                          Reason: {request.reason}
                        </p>
                        {request.description && (
                          <p className="text-sm text-amber-300/70 mt-1">
                            {request.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            fetchChatHistory(request.buyer_id, request.seller_id);
                          }}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Chat
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleJoinChat(request)}
                          disabled={processingRequest}
                          className="bg-white text-black hover:bg-gray-100"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Join Chat
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineRequest(request, 'Request declined')}
                          disabled={processingRequest}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card className="bg-white/5 border border-white/10">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-white">
                <MessageCircle className="h-5 w-5 text-blue-400" />
                Active Support Chats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {joinedChatRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active support chats</p>
                  <p className="text-sm mt-1">Join a pending request to start helping users</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {joinedChatRequests.map((request) => (
                    <div key={request.id} className="border border-white/10 rounded-xl p-4 space-y-3 bg-white/[0.02] hover:border-blue-500/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/20">Active</Badge>
                            <span className="text-xs text-gray-500">
                              Joined: {request.resolved_at ? format(new Date(request.resolved_at), 'MMM d, h:mm a') : 'N/A'}
                            </span>
                          </div>
                          <p className="font-medium text-white">
                            Buyer: {request.buyer_profile?.email || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-400">
                            Seller: {request.seller_profile?.store_name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <p className="text-sm font-medium text-gray-300">
                          Original Issue: {request.reason}
                        </p>
                        {request.description && (
                          <p className="text-sm text-gray-400 mt-1">
                            {request.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => openActiveChat(request)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Open Chat
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MainTab)}>
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
            <TabsTrigger value="chat-requests" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-black">
              <Shield size={16} />
              Chat Requests
              {pendingChatRequests.length > 0 && (
                <Badge className="bg-red-500 text-white text-xs ml-1 animate-pulse">{pendingChatRequests.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === 'chat-requests' ? (
        renderChatRequestsContent()
      ) : (
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
      )}

      {/* Screen Share Modal */}
      {showScreenShareModal && activeScreenShare && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Screen Share Session</h3>
              <button 
                onClick={() => setShowScreenShareModal(false)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <Monitor size={20} />
                  <span className="font-medium">Active Screen Share</span>
                </div>
                <p className="text-gray-400 text-sm">
                  The user is currently sharing their screen for support assistance.
                </p>
              </div>
              
              <div className="text-gray-400 text-sm">
                <p><strong>Session ID:</strong> {activeScreenShare.id}</p>
                <p><strong>Started:</strong> {format(new Date(activeScreenShare.created_at), 'h:mm a')}</p>
                {activeScreenShare.peer_id && (
                  <p><strong>Peer ID:</strong> {activeScreenShare.peer_id}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat History Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-2xl max-w-2xl w-full mx-4 border border-white/10 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Chat History</h3>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {chatMessages.map((msg) => {
                  const isBuyerMsg = msg.sender_type === 'buyer';
                  const isSystemMsg = msg.sender_type === 'system';

                  if (isSystemMsg) {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <div className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full text-sm">
                          {msg.message}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isBuyerMsg ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          isBuyerMsg
                            ? 'bg-white/10 text-white'
                            : 'bg-emerald-600/20 text-emerald-400'
                        }`}
                      >
                        <p className="text-xs font-medium mb-1 opacity-70">
                          {isBuyerMsg ? 'Buyer' : 'Seller'}
                        </p>
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        <p className="text-xs opacity-50 mt-1">
                          {format(new Date(msg.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatManagement;
