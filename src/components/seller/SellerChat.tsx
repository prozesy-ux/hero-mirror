import { useState, useEffect, useRef } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Send, 
  Loader2, 
  MessageSquare,
  Search,
  User,
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  CheckCheck,
  Home,
  Bell,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

// Sidebar Icon Component
const SidebarIcon = ({ icon: Icon, active, onClick, label }: { 
  icon: React.ElementType; 
  active?: boolean; 
  onClick?: () => void;
  label?: string;
}) => (
  <button
    onClick={onClick}
    title={label}
    className={`p-3 rounded-xl cursor-pointer transition-all ${
      active ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
    }`}
  >
    <Icon size={22} />
  </button>
);

// Chat List Item Component
const ChatListItem = ({ 
  name, 
  lastMessage, 
  time, 
  unread,
  active,
  onClick 
}: { 
  name: string; 
  lastMessage: string; 
  time: string;
  unread?: number;
  active?: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors text-left ${
      active ? 'bg-gray-100' : 'hover:bg-gray-50'
    }`}
  >
    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
      {name.charAt(0).toUpperCase()}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline mb-0.5">
        <h4 className="text-sm font-semibold text-gray-800 truncate">{name}</h4>
        <span className="text-[10px] text-gray-400 whitespace-nowrap">{time}</span>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500 truncate pr-2">{lastMessage}</p>
        {unread && unread > 0 ? (
          <span className="flex items-center justify-center min-w-[16px] h-4 px-1 bg-black text-white text-[10px] rounded-full font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : (
          <CheckCheck size={14} className="text-blue-500 flex-shrink-0" />
        )}
      </div>
    </div>
  </button>
);

// Message Bubble Component
const MessageBubble = ({ 
  text, 
  time, 
  sent,
  senderLabel
}: { 
  text: string; 
  time: string; 
  sent: boolean;
  senderLabel?: string;
}) => (
  <div className={`flex flex-col mb-4 ${sent ? 'items-end' : 'items-start'}`}>
    {senderLabel && (
      <p className={`text-[10px] text-gray-400 mb-1 px-2 ${sent ? 'text-right' : 'text-left'}`}>
        {senderLabel}
      </p>
    )}
    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
      sent ? 'bg-black text-white rounded-tr-sm' : 'bg-[#F3F4F6] text-gray-800 rounded-tl-sm'
    }`}>
      <p className="whitespace-pre-wrap break-words">{text}</p>
    </div>
    <span className="text-[10px] text-gray-400 mt-1">{time}</span>
  </div>
);

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

  const selectedUserInfo = chatUsers.find(u => u.buyer_id === selectedUser);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32 mb-6 rounded-lg" />
        <div className="grid grid-cols-3 gap-4 h-[calc(100vh-180px)]">
          <Skeleton className="col-span-1 rounded-lg" />
          <Skeleton className="col-span-2 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-[24px] shadow-2xl overflow-hidden">
      {/* Left Icon Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex w-[80px] bg-black flex-col items-center py-8 gap-6">
        {/* Store Avatar */}
        <div className="mb-4">
          <Avatar className="w-10 h-10 border-2 border-white shadow-md">
            <AvatarFallback className="bg-gray-700 text-white text-sm">
              {profile.store_name?.charAt(0).toUpperCase() || 'S'}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Navigation Icons */}
        <div className="flex flex-col gap-3 flex-1">
          <SidebarIcon icon={Home} label="Dashboard" />
          <SidebarIcon icon={MessageSquare} active label="Messages" />
          <SidebarIcon icon={Bell} label="Notifications" />
          <SidebarIcon icon={Settings} label="Settings" />
        </div>
        
        {/* Logout at bottom */}
        <div className="mt-auto">
          <SidebarIcon icon={LogOut} label="Logout" />
        </div>
      </div>

      {/* Users List - w-[320px] */}
      <div className={cn(
        "w-full lg:w-[320px] bg-white border-r border-gray-100 flex flex-col",
        showChatOnMobile && "hidden lg:flex"
      )}>
        {/* Search Header */}
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8FAFC] border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-black/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Users List */}
        <ScrollArea className="flex-1 px-4">
          <section>
            <h3 className="text-sm font-bold text-gray-800 px-2 mb-3">Customers</h3>
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare size={40} className="text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No conversations yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredUsers.map((chatUser) => (
                  <ChatListItem
                    key={chatUser.buyer_id}
                    name={chatUser.full_name || chatUser.email.split('@')[0]}
                    lastMessage={chatUser.last_message}
                    time={format(new Date(chatUser.last_message_time), 'h:mm a')}
                    unread={chatUser.unread_count}
                    active={selectedUser === chatUser.buyer_id}
                    onClick={() => {
                      setSelectedUser(chatUser.buyer_id);
                      setShowChatOnMobile(true);
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </ScrollArea>
      </div>

      {/* Chat Area - flex-1 bg-[#F8FAFC] */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#F8FAFC]",
        !showChatOnMobile && "hidden lg:flex"
      )}>
        {selectedUser && selectedUserInfo ? (
          <>
            {/* Chat Header */}
            <header className="px-4 sm:px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Back button for mobile */}
                <button
                  onClick={() => setShowChatOnMobile(false)}
                  className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} className="text-gray-600" />
                </button>
                
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User size={18} className="text-gray-500" />
                </div>
                
                <div>
                  <h2 className="text-sm font-bold text-gray-800 leading-tight">
                    {selectedUserInfo.full_name || selectedUserInfo.email}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-tight">Customer</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Phone size={20} className="text-black cursor-pointer hover:opacity-70 hidden sm:block" />
                <Video size={20} className="text-black cursor-pointer hover:opacity-70 hidden sm:block" />
                <MoreVertical size={20} className="text-gray-400 cursor-pointer hover:text-black" />
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 chat-scrollbar">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare size={48} className="text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm font-medium">No messages yet</p>
                  <p className="text-gray-400 text-xs mt-1">Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSeller = msg.sender_type === 'seller';
                  const isSystem = msg.sender_type === 'system';
                  const isSupport = msg.sender_type === 'support';
                  
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-4">
                        <div className="bg-amber-50 rounded-xl px-4 py-2 max-w-[85%] border border-amber-200">
                          <p className="text-xs text-amber-700 text-center">{msg.message}</p>
                          <p className="text-[10px] text-amber-500 text-center mt-1">
                            {format(new Date(msg.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <MessageBubble
                      key={msg.id}
                      text={msg.message}
                      time={format(new Date(msg.created_at), 'h:mm a')}
                      sent={isSeller}
                      senderLabel={isSeller ? 'You' : isSupport ? '🛡️ Uptoza Support' : 'Customer'}
                    />
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 sm:p-6 pt-2">
              <div className="bg-white rounded-2xl p-2 flex items-center gap-2 shadow-sm border border-gray-100">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  disabled={sending}
                  className="flex-1 bg-transparent border-none outline-none text-sm px-3 text-gray-700 placeholder:text-gray-300 disabled:opacity-50"
                />
                
                <button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
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
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <MessageSquare size={40} className="text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-gray-500 text-sm">Choose a customer from the list to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerChat;
