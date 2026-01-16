import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { playSound } from '@/lib/sounds';

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  sender_type: string;
  is_read: boolean | null;
  created_at: string | null;
}

const ChatSection = () => {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
      markMessagesAsRead();

      // Subscribe to new messages
      const channel = supabase
        .channel('support-messages-chat')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `user_id=eq.${user.id}`,
          },
        (payload) => {
            const newMsg = payload.new as SupportMessage;
            setMessages((prev) => [...prev, newMsg]);
            if (newMsg.sender_type === 'admin') {
              // Play notification sound when admin replies
              playSound('messageReceived');
              markMessagesAsRead();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!user) return;

    await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('sender_type', 'admin')
      .eq('is_read', false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sendingMessage) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase.from('support_messages').insert({
        user_id: user.id,
        message: newMessage.trim(),
        sender_type: 'user',
        is_read: false,
      });

      if (error) throw error;
      // Play sound when message sent successfully
      playSound('messageSent');
      setNewMessage('');
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-0 sm:px-0">

      {/* Chat Container - Full height on mobile */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Chat Header - Compact on mobile */}
        <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center gap-2.5 sm:gap-3 bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
            <MessageCircle className="text-white w-5 h-5 sm:w-[22px] sm:h-[22px]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-gray-900 font-bold text-base sm:text-lg truncate">Support Team</h3>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0"></span>
              <p className="text-gray-500 text-xs sm:text-sm truncate">Replies within hours</p>
            </div>
          </div>
        </div>

        {/* Messages Area - Shorter on mobile */}
        <div className="h-[320px] sm:h-[400px] lg:h-[450px] overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-b from-gray-50 to-white">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-violet-100 flex items-center justify-center mb-3 sm:mb-4">
                <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-violet-500" />
              </div>
              <h3 className="text-gray-900 font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Start a conversation</h3>
              <p className="text-gray-500 text-sm max-w-xs sm:max-w-sm">
                Have a question? Send us a message and we'll get back to you soon.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm ${
                    msg.sender_type === 'user'
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  <p
                    className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 ${
                      msg.sender_type === 'user' ? 'text-violet-200' : 'text-gray-400'
                    }`}
                  >
                    {format(new Date(msg.created_at || new Date()), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Compact on mobile */}
        <div className="p-3 sm:p-4 border-t border-gray-100 bg-white">
          <div className="flex gap-2 sm:gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sendingMessage}
              className="px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-1.5 sm:gap-2"
            >
              {sendingMessage ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSection;
