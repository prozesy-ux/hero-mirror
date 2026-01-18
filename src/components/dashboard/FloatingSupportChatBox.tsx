import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  X, 
  Minus, 
  Send, 
  Loader2, 
  MessageCircle, 
  ChevronUp,
  Headphones
} from 'lucide-react';
import { format } from 'date-fns';
import { ChatSession, useFloatingChat } from '@/contexts/FloatingChatContext';

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  sender_type: 'user' | 'admin';
  is_read: boolean;
  created_at: string;
}

interface FloatingSupportChatBoxProps {
  session: ChatSession;
}

const FloatingSupportChatBox = ({ session }: FloatingSupportChatBoxProps) => {
  const { user } = useAuthContext();
  const { closeChat, minimizeChat, expandChat, updateUnreadCount } = useFloatingChat();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchMessages();
      const unsubscribe = subscribeToMessages();
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (!session.isMinimized) {
      scrollToBottom();
      markMessagesAsRead();
    }
  }, [messages, session.isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markMessagesAsRead = async () => {
    if (!user || session.isMinimized) return;
    
    await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('sender_type', 'admin')
      .eq('is_read', false);
    
    updateUnreadCount(session.id, 0);
  };

  const fetchMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as SupportMessage[]);
      const unread = data.filter(m => m.sender_type === 'admin' && !m.is_read).length;
      updateUnreadCount(session.id, unread);
    }
    setLoading(false);
  };

  const subscribeToMessages = () => {
    if (!user) return () => {};

    const channel = supabase
      .channel(`floating-support-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchMessages();
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
      .from('support_messages')
      .insert({
        user_id: user.id,
        message: newMessage.trim(),
        sender_type: 'user'
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
        className="relative flex items-center gap-2 px-4 py-2.5 bg-violet-500 hover:bg-violet-600 text-white rounded-full shadow-lg transition-all hover:scale-105"
      >
        <Headphones size={16} />
        <span className="text-sm font-medium max-w-[100px] truncate">
          Uptoza Support
        </span>
        {session.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {session.unreadCount > 9 ? '9+' : session.unreadCount}
          </span>
        )}
        <ChevronUp size={14} />
      </button>
    );
  }

  // Expanded chat box
  return (
    <div className="w-[340px] h-[450px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-violet-50 to-purple-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-violet-500 flex items-center justify-center">
            <Headphones size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-sm truncate">Uptoza Support</h3>
            {session.productName && (
              <p className="text-[10px] text-gray-500 truncate">Re: {session.productName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => minimizeChat(session.id)}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
            title="Minimize"
          >
            <Minus size={14} className="text-gray-600" />
          </button>
          <button
            onClick={() => closeChat(session.id)}
            className="p-1.5 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-lg transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle size={32} className="text-gray-300 mb-2" />
            <p className="text-gray-500 text-xs">No messages yet</p>
            <p className="text-gray-400 text-[10px]">Ask us anything!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                  msg.sender_type === 'user'
                    ? 'bg-violet-500 text-white rounded-br-md'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                <p className={`text-[9px] mt-0.5 ${
                  msg.sender_type === 'user' ? 'text-violet-100' : 'text-gray-400'
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
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-3 py-2 bg-violet-500 hover:bg-violet-600 disabled:bg-gray-300 text-white rounded-xl transition-colors flex items-center"
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingSupportChatBox;
