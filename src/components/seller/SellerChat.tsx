import { useState, useEffect, useRef } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Send, 
  Loader2, 
  MessageSquare,
  Search,
  User
} from 'lucide-react';

interface ChatMessage {
  id: string;
  seller_id: string;
  buyer_id: string;
  product_id: string | null;
  message: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
}

interface ChatUser {
  buyer_id: string;
  email: string;
  full_name: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

const SellerChat = () => {
  const { profile } = useSellerContext();
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatUsers();
    const cleanup = subscribeToMessages();
    return cleanup;
  }, [profile.id]);

  // Auto-open first chat when loaded
  useEffect(() => {
    if (chatUsers.length > 0 && !selectedUser && !loading) {
      setSelectedUser(chatUsers[0].buyer_id);
      setShowChatOnMobile(true);
    }
  }, [chatUsers, selectedUser, loading]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser);
      markAsRead(selectedUser);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchChatUsers = async () => {
    try {
      const { data: chats, error } = await supabase
        .from('seller_chats')
        .select('buyer_id, message, created_at, is_read, sender_type')
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const buyerMap = new Map<string, {
        last_message: string;
        last_message_time: string;
        unread_count: number;
      }>();

      chats?.forEach((chat) => {
        if (!buyerMap.has(chat.buyer_id)) {
          buyerMap.set(chat.buyer_id, {
            last_message: chat.message,
            last_message_time: chat.created_at,
            unread_count: 0
          });
        }
        if (!chat.is_read && chat.sender_type === 'buyer') {
          const existing = buyerMap.get(chat.buyer_id)!;
          existing.unread_count++;
        }
      });

      const buyerIds = Array.from(buyerMap.keys());
      if (buyerIds.length === 0) {
        setChatUsers([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', buyerIds);

      const users: ChatUser[] = buyerIds.map((buyerId) => {
        const buyerProfile = profiles?.find(p => p.user_id === buyerId);
        const chatInfo = buyerMap.get(buyerId)!;
        return {
          buyer_id: buyerId,
          email: buyerProfile?.email || 'Unknown',
          full_name: buyerProfile?.full_name || null,
          ...chatInfo
        };
      });

      users.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );

      setChatUsers(users);
    } catch (error) {
      console.error('Error fetching chat users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (buyerId: string) => {
    const { data, error } = await supabase
      .from('seller_chats')
      .select('*')
      .eq('seller_id', profile.id)
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: true });

    if (!error) setMessages(data || []);
  };

  const markAsRead = async (buyerId: string) => {
    await supabase
      .from('seller_chats')
      .update({ is_read: true })
      .eq('seller_id', profile.id)
      .eq('buyer_id', buyerId)
      .eq('sender_type', 'buyer');
    
    fetchChatUsers();
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('seller-chats')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'seller_chats',
        filter: `seller_id=eq.${profile.id}`
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        if (newMsg.buyer_id === selectedUser) {
          setMessages(prev => [...prev, newMsg]);
          if (newMsg.sender_type === 'buyer') {
            markAsRead(newMsg.buyer_id);
          }
        }
        fetchChatUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('seller_chats')
        .insert({
          seller_id: profile.id,
          buyer_id: selectedUser,
          message: newMessage.trim(),
          sender_type: 'seller'
        });

      if (error) throw error;
      setNewMessage('');
      // FIX: Refetch messages after sending so seller sees their own message
      await fetchMessages(selectedUser);
      fetchChatUsers();
    } catch (error: any) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredUsers = chatUsers.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = chatUsers.reduce((sum, u) => sum + u.unread_count, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32 mb-6 border border-slate-200 rounded-xl" />
        <div className="grid grid-cols-3 gap-4 h-[calc(100vh-180px)]">
          <Skeleton className="col-span-1 rounded-xl border border-slate-200" />
          <Skeleton className="col-span-2 rounded-xl border border-slate-200" />
        </div>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      {/* Unread Badge */}
      {totalUnread > 0 && (
        <div className="flex justify-end mb-3 sm:mb-4">
          <Badge className="bg-emerald-500 text-white text-xs">
            {totalUnread} unread
          </Badge>
        </div>
      )}

      {/* Chat Interface */}
      <div className="flex h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)] gap-3 sm:gap-4">
        {/* Users List - Hidden on mobile when chat is open */}
        <div className={`bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col ${
          showChatOnMobile ? 'hidden lg:flex' : 'flex'
        } w-full lg:w-80 flex-shrink-0`}>
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-slate-200 bg-slate-50"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">No conversations</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredUsers.map((chatUser) => (
                  <button
                    key={chatUser.buyer_id}
                    onClick={() => {
                      setSelectedUser(chatUser.buyer_id);
                      setShowChatOnMobile(true);
                    }}
                    className={`w-full p-3 rounded-lg text-left transition-all min-h-[64px] ${
                      selectedUser === chatUser.buyer_id
                        ? 'bg-emerald-50 border border-emerald-100'
                        : 'hover:bg-slate-50 active:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-slate-100 text-slate-600 text-sm">
                          {(chatUser.full_name || chatUser.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm text-slate-900 truncate">
                            {chatUser.full_name || chatUser.email.split('@')[0]}
                          </p>
                          {chatUser.unread_count > 0 && (
                            <Badge className="bg-emerald-500 text-white text-[10px] h-5 min-w-[18px] flex-shrink-0">
                              {chatUser.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{chatUser.last_message}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area - Full screen on mobile when active */}
        <div className={`flex-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col ${
          !showChatOnMobile ? 'hidden lg:flex' : 'flex'
        }`}>
          {selectedUser ? (
            <>
              {/* Chat Header with back button */}
              <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center gap-3">
                {/* Back button for mobile */}
                <button 
                  onClick={() => setShowChatOnMobile(false)}
                  className="lg:hidden p-2 -ml-1 hover:bg-slate-100 rounded-lg active:scale-95 transition-all"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback className="bg-slate-100">
                    <User className="h-4 w-4 text-slate-500" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 truncate">
                    {chatUsers.find(u => u.buyer_id === selectedUser)?.full_name || 
                     chatUsers.find(u => u.buyer_id === selectedUser)?.email}
                  </p>
                  <p className="text-xs text-slate-500">Customer</p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isSeller = msg.sender_type === 'seller';
                    const isSupport = msg.sender_type === 'support';
                    const isSystem = msg.sender_type === 'system';
                    
                    // Sender label
                    const senderLabel = isSeller ? 'You' : 
                                        isSupport ? '🛡️ Uptoza Support' : 
                                        isSystem ? '' : 
                                        'Customer';
                    
                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center my-3">
                          <div className="bg-amber-50 rounded-xl px-4 py-2 max-w-[85%] border border-amber-200">
                            <p className="text-xs text-amber-700 text-center">{msg.message}</p>
                            <p className="text-[10px] text-amber-500 text-center mt-1">
                              {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isSeller ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="max-w-[75%]">
                          {/* Sender Label */}
                          <p className={`text-[10px] text-slate-500 mb-1 px-2 ${isSeller ? 'text-right' : 'text-left'}`}>
                            {senderLabel}
                          </p>
                          <div className={`rounded-2xl px-4 py-2.5 ${
                            isSeller
                              ? 'bg-emerald-500 text-white'
                              : isSupport
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-900'
                          }`}>
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-[10px] mt-1 ${
                              isSeller ? 'text-emerald-100' : isSupport ? 'text-blue-100' : 'text-slate-400'
                            }`}>
                              {format(new Date(msg.created_at), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 sm:p-4 border-t border-slate-100">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                    className="border-slate-200 h-10 sm:h-auto"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="bg-emerald-500 hover:bg-emerald-600 px-3 sm:px-4 min-w-[44px]"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-slate-50/50">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <MessageSquare className="h-10 w-10 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Select a conversation</h3>
              <p className="text-slate-500 text-sm text-center px-4">Choose a customer from the list to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerChat;
