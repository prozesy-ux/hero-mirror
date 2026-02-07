import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Send, Loader2, Store, MessageCircle, Phone, Video, MoreVertical, Paperclip, X } from 'lucide-react';
import { format } from 'date-fns';

interface SellerChatMessage {
  id: string;
  seller_id: string;
  buyer_id: string;
  product_id: string | null;
  message: string;
  sender_type: 'buyer' | 'seller';
  is_read: boolean;
  created_at: string;
}

interface SellerChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  sellerName: string;
  productId?: string;
  productName?: string;
}

const SellerChatModal = ({ open, onOpenChange, sellerId, sellerName, productId, productName }: SellerChatModalProps) => {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<SellerChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && user && sellerId) {
      fetchMessages();
      const unsubscribe = subscribeToMessages();
      return () => unsubscribe();
    }
  }, [open, user, sellerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('seller_chats')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data as SellerChatMessage[]);
    }
    setLoading(false);
  };

  const subscribeToMessages = () => {
    if (!user) return () => {};

    const channel = supabase
      .channel(`seller-chat-${sellerId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seller_chats',
          filter: `seller_id=eq.${sellerId}`
        },
        (payload) => {
          const newMsg = payload.new as SellerChatMessage;
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
        seller_id: sellerId,
        buyer_id: user.id,
        product_id: productId || null,
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

  // Check if we should show "Today" badge
  const shouldShowTodayBadge = messages.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-0 rounded-xl max-w-lg max-h-[600px] flex flex-col p-0 overflow-hidden shadow-2xl gap-0">
        {/* Chat Header - 100px height */}
        <div className="h-[100px] bg-white border-b border-[#e5e5e5] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#2e3b5b] flex items-center justify-center">
              <Store size={20} className="text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[16px] font-semibold text-[#000929] tracking-[-0.32px]">{sellerName}</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#33b843] rounded-full" />
                <span className="text-[12px] text-[#bababa] tracking-[-0.24px] font-medium">Online</span>
              </div>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Phone size={20} className="text-[#000929]" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Video size={20} className="text-[#000929]" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical size={20} className="text-[#000929]" />
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[350px] bg-white">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-[#bababa]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle size={48} className="text-[#bababa] mb-3" />
              <p className="text-[#000929] text-sm font-medium">No messages yet</p>
              <p className="text-[#757575] text-xs mt-1">Start the conversation with the seller!</p>
            </div>
          ) : (
            <>
              {/* Today Badge */}
              {shouldShowTodayBadge && (
                <div className="flex justify-center py-1">
                  <span className="bg-white px-3 py-2 rounded text-[14px] font-semibold text-[#2e2a40] tracking-[-0.28px] shadow-sm border border-[#e5e5e5]">
                    Today
                  </span>
                </div>
              )}
              
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'buyer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col gap-2">
                    <div
                      className={`max-w-[272px] px-3 py-2 shadow-sm ${
                        msg.sender_type === 'buyer'
                          ? 'bg-[#2e3b5b] rounded-[10px_0px_10px_10px]'
                          : 'bg-[#000929] rounded-[0px_10px_10px_10px]'
                      }`}
                    >
                      <p className="font-raleway font-medium text-[14px] text-white tracking-[-0.28px] leading-[21px] whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                    <span className={`text-[12px] text-[#757575] tracking-[-0.12px] ${
                      msg.sender_type === 'buyer' ? 'text-right' : 'text-left'
                    }`}>
                      Today {format(new Date(msg.created_at), 'HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Footer - 80px height */}
        <div className="h-[80px] bg-white border-t border-[#e5e5e5] flex items-center gap-4 px-4">
          {/* Attach button */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Paperclip size={24} className="text-[#000929]" />
          </button>
          
          {/* Input field */}
          <div className="flex-1 h-[60px] bg-[#f7f7fd] rounded-[20px] flex items-center px-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 bg-transparent text-[14px] text-[#000929] placeholder:text-[#92929d] outline-none font-raleway"
              disabled={sending}
            />
          </div>
          
          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="w-11 h-11 bg-[#2e3b5b] disabled:bg-[#bababa] rounded-[10px] flex items-center justify-center transition-colors hover:bg-[#3d4d6d]"
          >
            {sending ? (
              <Loader2 size={20} className="animate-spin text-white" />
            ) : (
              <Send size={20} className="text-white" />
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SellerChatModal;
