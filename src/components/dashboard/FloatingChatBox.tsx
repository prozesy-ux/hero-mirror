import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  X, 
  Minus, 
  Send, 
  Loader2, 
  Store, 
  MessageCircle, 
  ChevronUp,
  Paperclip
} from 'lucide-react';
import { format } from 'date-fns';
import { ChatSession, useFloatingChat } from '@/contexts/FloatingChatContext';

interface ChatMessage {
  id: string;
  seller_id: string;
  buyer_id: string;
  product_id: string | null;
  message: string;
  sender_type: 'buyer' | 'seller';
  is_read: boolean;
  created_at: string;
}

interface FloatingChatBoxProps {
  session: ChatSession;
}

const FloatingChatBox = ({ session }: FloatingChatBoxProps) => {
  const { user } = useAuthContext();
  const { closeChat, minimizeChat, expandChat, updateUnreadCount } = useFloatingChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && session.sellerId) {
      fetchMessages();
      const unsubscribe = subscribeToMessages();
      return () => unsubscribe();
    }
  }, [user, session.sellerId]);

  useEffect(() => {
    if (!session.isMinimized) {
      scrollToBottom();
      markMessagesAsRead();
    }
  }, [messages, session.isMinimized]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const markMessagesAsRead = async () => {
    if (!user || session.isMinimized) return;
    
    await supabase
      .from('seller_chats')
      .update({ is_read: true })
      .eq('seller_id', session.sellerId)
      .eq('buyer_id', user.id)
      .eq('sender_type', 'seller')
      .eq('is_read', false);
    
    updateUnreadCount(session.id, 0);
  };

  const fetchMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('seller_chats')
      .select('*')
      .eq('seller_id', session.sellerId)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as ChatMessage[]);
      const unread = data.filter(m => m.sender_type === 'seller' && !m.is_read).length;
      updateUnreadCount(session.id, unread);
    }
    setLoading(false);
  };

  const subscribeToMessages = () => {
    if (!user) return () => {};

    const channel = supabase
      .channel(`floating-chat-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seller_chats',
          filter: `seller_id=eq.${session.sellerId}`
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (newMsg.buyer_id === user.id) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    const { error } = await supabase
      .from('seller_chats')
      .insert({
        seller_id: session.sellerId,
        buyer_id: user.id,
        product_id: session.productId || null,
        message: newMessage.trim(),
        sender_type: 'buyer'
      });

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } else {
      setNewMessage('');
      fetchMessages();
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Minimized state - show as small bubble
  if (session.isMinimized) {
    return (
      <button
        onClick={() => expandChat(session.id)}
        className="relative flex items-center gap-2 px-4 py-2.5 bg-[#2e3b5b] hover:bg-[#3d4d6d] text-white rounded-full shadow-lg transition-all hover:scale-105"
      >
        <Store size={16} />
        <span className="text-sm font-medium max-w-[100px] truncate">
          {session.sellerName}
        </span>
        {session.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff3e46] text-white text-xs rounded-full flex items-center justify-center font-bold">
            {session.unreadCount > 9 ? '9+' : session.unreadCount}
          </span>
        )}
        <ChevronUp size={14} />
      </button>
    );
  }

  // Expanded chat box
  return (
    <div className="w-[340px] h-[480px] bg-white rounded-xl shadow-2xl border border-[#e5e5e5] flex flex-col overflow-hidden">
      {/* Header - Reference design style */}
      <div className="h-[80px] bg-white border-b border-[#e5e5e5] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2e3b5b] flex items-center justify-center">
            <Store size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex flex-col gap-1">
            <h3 className="font-semibold text-[#000929] text-[14px] truncate tracking-[-0.28px]">{session.sellerName}</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#33b843] rounded-full" />
              <span className="text-[11px] text-[#bababa] tracking-[-0.22px]">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => minimizeChat(session.id)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Minimize"
          >
            <Minus size={14} className="text-[#000929]" />
          </button>
          <button
            onClick={() => closeChat(session.id)}
            className="p-1.5 hover:bg-red-50 text-[#000929] hover:text-red-600 rounded-lg transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-[#bababa]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle size={32} className="text-[#bababa] mb-2" />
            <p className="text-[#000929] text-xs font-medium">No messages yet</p>
            <p className="text-[#757575] text-[10px]">Start the conversation!</p>
          </div>
        ) : (
          <>
            {/* Today Badge */}
            <div className="flex justify-center py-1">
              <span className="bg-white px-2 py-1.5 rounded text-[12px] font-semibold text-[#2e2a40] tracking-[-0.24px] shadow-sm border border-[#e5e5e5]">
                Today
              </span>
            </div>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'buyer' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col gap-1.5">
                  <div
                    className={`max-w-[230px] px-3 py-2 shadow-sm ${
                      msg.sender_type === 'buyer'
                        ? 'bg-[#2e3b5b] rounded-[10px_0px_10px_10px]'
                        : 'bg-[#000929] rounded-[0px_10px_10px_10px]'
                    }`}
                  >
                    <p className="font-raleway font-medium text-[13px] text-white tracking-[-0.26px] leading-[20px] whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
                  </div>
                  <span className={`text-[10px] text-[#757575] tracking-[-0.1px] ${
                    msg.sender_type === 'buyer' ? 'text-right' : 'text-left'
                  }`}>
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Reference design style */}
      <div className="h-[70px] bg-white border-t border-[#e5e5e5] flex items-center gap-3 px-3">
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <Paperclip size={18} className="text-[#000929]" />
        </button>
        <div className="flex-1 h-[46px] bg-[#f7f7fd] rounded-[16px] flex items-center px-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-[13px] text-[#000929] placeholder:text-[#92929d] outline-none font-raleway"
            disabled={sending}
          />
        </div>
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim() || sending}
          className="w-10 h-10 bg-[#2e3b5b] disabled:bg-[#bababa] rounded-[10px] flex items-center justify-center transition-colors hover:bg-[#3d4d6d]"
        >
          {sending ? (
            <Loader2 size={16} className="animate-spin text-white" />
          ) : (
            <Send size={16} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
};

export default FloatingChatBox;
