import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
}

const BuyerSupportTickets = () => {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data as any);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from('support_messages').insert({
      user_id: user.id,
      message: newMessage.trim(),
      sender_type: 'buyer',
    });
    if (error) {
      toast.error('Failed to send message');
    } else {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), user_id: user.id, message: newMessage.trim(), sender_type: 'buyer', is_read: false, created_at: new Date().toISOString() }]);
      setNewMessage('');
      toast.success('Message sent!');
    }
    setSending(false);
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Support</h2>
      <div className="bg-white border rounded-lg flex flex-col" style={{ minHeight: '400px' }}>
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 text-slate-200" />
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : messages.map(m => (
            <div key={m.id} className={`flex ${m.sender_type === 'buyer' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-lg text-sm ${m.sender_type === 'buyer' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-800'}`}>
                <p>{m.message}</p>
                <p className={`text-xs mt-1 ${m.sender_type === 'buyer' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {format(new Date(m.created_at), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t p-3 flex gap-2">
          <Textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="text-sm resize-none"
            rows={2}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button onClick={handleSend} disabled={sending || !newMessage.trim()} className="bg-emerald-500 hover:bg-emerald-600 self-end">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BuyerSupportTickets;
