import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Send, Loader2, Store, MessageCircle } from 'lucide-react';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-black rounded max-w-lg max-h-[80vh] flex flex-col p-0 overflow-hidden">
        {/* Pink accent bar */}
        <div className="h-1 bg-[#FF90E8]" />
        
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded border border-black bg-[#FF90E8] flex items-center justify-center">
              <Store size={18} className="text-black" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{sellerName}</h3>
              {productName && (
                <p className="text-xs text-slate-500">About: {productName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] bg-[#FBF8F3]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle size={40} className="text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No messages yet</p>
              <p className="text-slate-400 text-xs">Start the conversation with the seller!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'buyer' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.sender_type === 'buyer'
                      ? 'bg-[#FF90E8] border border-black text-black rounded-br-none'
                      : 'bg-white border border-black text-black rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className={`text-[10px] mt-1 ${
                    msg.sender_type === 'buyer' ? 'text-black/60' : 'text-slate-400'
                  }`}>
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-white border border-black rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF90E8]/50"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="px-4 py-3 bg-[#FF90E8] border border-black disabled:bg-slate-200 disabled:border-slate-300 text-black rounded hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
            >
              {sending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SellerChatModal;
