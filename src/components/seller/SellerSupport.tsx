import { useState, useEffect, useRef } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Send, 
  Loader2, 
  Headphones,
  MessageSquare
} from 'lucide-react';

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
}

const SellerSupport = () => {
  const { profile } = useSellerContext();
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchMessages();
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark admin messages as read
      await supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('sender_type', 'admin');
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!user) return () => {};

    const channel = supabase
      .channel('seller-support')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as SupportMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!user || !newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          user_id: user.id,
          message: `[SELLER: ${profile.store_name}] ${newMessage.trim()}`,
          sender_type: 'user'
        });

      if (error) throw error;
      setNewMessage('');
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

  if (loading) {
    return (
      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-[calc(100vh-200px)] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">

      {/* Chat Card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden h-[calc(100vh-200px)] flex flex-col">
        {/* Chat Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-emerald-50">
          <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
            <Headphones className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Support Team</p>
            <p className="text-xs text-slate-500">We typically reply within a few hours</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <MessageSquare className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">No messages yet</h3>
              <p className="text-slate-500 text-sm text-center max-w-sm">
                Have a question or need help? Send us a message and we'll get back to you.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.sender_type === 'user'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}>
                    <p className="text-sm">{msg.message.replace(`[SELLER: ${profile.store_name}] `, '')}</p>
                    <p className={`text-[10px] mt-1 ${
                      msg.sender_type === 'user' ? 'text-emerald-100' : 'text-slate-400'
                    }`}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="border-slate-200 bg-white"
            />
            <Button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 px-4"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerSupport;
