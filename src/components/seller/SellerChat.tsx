import { useState, useEffect, useRef } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
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
  User,
  Paperclip,
  Phone,
  Video,
  MoreVertical
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
        <Skeleton className="h-8 w-32 mb-6 rounded-lg" />
        <div className="grid grid-cols-3 gap-4 h-[calc(100vh-180px)]">
          <Skeleton className="col-span-1 rounded-xl" />
          <Skeleton className="col-span-2 rounded-xl" />
        </div>
      </div>
    );
  }

  const selectedUserData = chatUsers.find(u => u.buyer_id === selectedUser);

  return (
    <div className="space-y-4">
      {/* Unread Badge */}
      {totalUnread > 0 && (
        <div className="flex justify-end">
          <Badge className="bg-[#ff3e46] text-white text-xs px-2 py-1">
            {totalUnread} unread
          </Badge>
        </div>
      )}

      {/* Chat Interface - Reference Design */}
      <div className="flex h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)] border border-[#e5e5e5] rounded-xl overflow-hidden bg-white shadow-lg">
        {/* Users List - Contacts Sidebar */}
        <div className={`bg-white border-r border-[#e5e5e5] overflow-hidden flex flex-col ${
          showChatOnMobile ? 'hidden lg:flex' : 'flex'
        } w-full lg:w-80 flex-shrink-0`}>
          {/* Header */}
          <div className="p-4 border-b border-[#e5e5e5]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-semibold text-[#000929] tracking-[-0.4px]">Messaging</h1>
                {totalUnread > 0 && (
                  <span className="bg-[#ff3e46] text-[#9b171c] text-[12px] px-1.5 py-0.5 rounded">
                    {totalUnread}
                  </span>
                )}
              </div>
            </div>
            {/* Search */}
            <div className="relative h-[46px] bg-[#f7f7fd] rounded flex items-center px-4">
              <Search className="w-5 h-5 text-[#92929d]" />
              <input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent ml-3 text-[14px] text-[#000929] placeholder:text-[#92929d] outline-none"
              />
            </div>
          </div>

          {/* Contacts List */}
          <ScrollArea className="flex-1">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <MessageSquare className="h-10 w-10 text-[#bababa] mb-3" />
                <p className="text-[#757575] text-sm">No conversations</p>
              </div>
            ) : (
              <div className="py-2">
                {filteredUsers.map((chatUser, index) => (
                  <div key={chatUser.buyer_id}>
                    <button
                      onClick={() => {
                        setSelectedUser(chatUser.buyer_id);
                        setShowChatOnMobile(true);
                      }}
                      className={`w-full p-3 flex items-center gap-3 transition-all min-h-[72px] text-left ${
                        selectedUser === chatUser.buyer_id
                          ? 'bg-[#f7f7fd] rounded-[10px]'
                          : 'hover:bg-[#f7f7fd]'
                      }`}
                    >
                      <Avatar className="h-[52px] w-[52px] flex-shrink-0 rounded-[30px]">
                        <AvatarFallback className="bg-[#2e3b5b] text-white text-sm">
                          {(chatUser.full_name || chatUser.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-[14px] text-[#000929] truncate tracking-[-0.28px]">
                            {chatUser.full_name || chatUser.email.split('@')[0]}
                          </p>
                          <span className="text-[12px] text-[#76767c]/80 tracking-[-0.12px] flex-shrink-0">
                            {chatUser.last_message_time && format(new Date(chatUser.last_message_time), 'h:mm a')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p className={`text-[12px] truncate tracking-[-0.24px] ${
                            chatUser.unread_count > 0 ? 'text-[#000929] font-medium' : 'text-[#76767c]/80'
                          }`}>
                            {chatUser.last_message}
                          </p>
                          {chatUser.unread_count > 0 && (
                            <div className="w-2 h-2 bg-[#d82027] rounded-full flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </button>
                    {index < filteredUsers.length - 1 && (
                      <div className="mx-auto w-[312px] h-[1px] bg-[#e5e5e5]" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-white ${
          !showChatOnMobile ? 'hidden lg:flex' : 'flex'
        }`}>
          {selectedUser ? (
            <>
              {/* Chat Header - 100px height */}
              <div className="h-[100px] bg-white border-b border-[#e5e5e5] flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  {/* Back button for mobile */}
                  <button 
                    onClick={() => setShowChatOnMobile(false)}
                    className="lg:hidden p-2 -ml-2 hover:bg-[#f7f7fd] rounded-lg"
                  >
                    <svg className="w-5 h-5 text-[#000929]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <Avatar className="h-11 w-11 rounded-[40px]">
                    <AvatarFallback className="bg-[#2e3b5b] text-white">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold text-[16px] text-[#000929] tracking-[-0.32px]">
                      {selectedUserData?.full_name || selectedUserData?.email}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#33b843] rounded-full" />
                      <span className="text-[12px] text-[#bababa] tracking-[-0.24px] font-medium">Online</span>
                    </div>
                  </div>
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-4">
                  <button className="p-2 hover:bg-[#f7f7fd] rounded-lg transition-colors">
                    <Phone size={20} className="text-[#000929]" />
                  </button>
                  <button className="p-2 hover:bg-[#f7f7fd] rounded-lg transition-colors">
                    <Video size={20} className="text-[#000929]" />
                  </button>
                  <button className="p-2 hover:bg-[#f7f7fd] rounded-lg transition-colors">
                    <MoreVertical size={20} className="text-[#000929]" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {/* Today Badge */}
                  {messages.length > 0 && (
                    <div className="flex justify-center py-1">
                      <span className="bg-white px-3 py-2 rounded text-[14px] font-semibold text-[#2e2a40] tracking-[-0.28px] shadow-sm border border-[#e5e5e5]">
                        Today
                      </span>
                    </div>
                  )}
                  
                  {messages.map((msg) => {
                    const isSeller = msg.sender_type === 'seller';
                    const isSupport = msg.sender_type === 'support';
                    const isSystem = msg.sender_type === 'system';
                    
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
                        <div className="flex flex-col gap-2">
                          <div className={`max-w-[303px] px-3 py-2 shadow-sm ${
                            isSeller
                              ? 'bg-[#2e3b5b] rounded-[10px_0px_10px_10px]'
                              : isSupport
                                ? 'bg-blue-600 rounded-[0px_10px_10px_10px]'
                                : 'bg-[#000929] rounded-[0px_10px_10px_10px]'
                          }`}>
                            <p className="font-raleway font-medium text-[14px] text-white tracking-[-0.28px] leading-[21px] whitespace-pre-wrap">
                              {msg.message}
                            </p>
                          </div>
                          <span className={`text-[12px] text-[#757575] tracking-[-0.12px] ${
                            isSeller ? 'text-right' : 'text-left'
                          }`}>
                            Today {format(new Date(msg.created_at), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input - 80px height */}
              <div className="h-[80px] bg-white border-t border-[#e5e5e5] flex items-center gap-4 px-4">
                <button className="p-2 hover:bg-[#f7f7fd] rounded-lg transition-colors">
                  <Paperclip size={24} className="text-[#000929]" />
                </button>
                <div className="flex-1 h-[60px] bg-[#f7f7fd] rounded-[20px] flex items-center px-4">
                  <input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                    className="flex-1 bg-transparent text-[14px] text-[#000929] placeholder:text-[#92929d] outline-none font-raleway"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="w-11 h-11 bg-[#2e3b5b] disabled:bg-[#bababa] rounded-[10px] flex items-center justify-center transition-colors hover:bg-[#3d4d6d]"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <Send className="h-5 w-5 text-white" />
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-[#f7f7fd]">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                <MessageSquare className="h-10 w-10 text-[#2e3b5b]" />
              </div>
              <h3 className="font-semibold text-[#000929] mb-2">Select a conversation</h3>
              <p className="text-[#757575] text-sm text-center px-4">Choose a customer from the list to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerChat;
