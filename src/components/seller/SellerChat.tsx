import { useState, useEffect, useRef } from 'react';
import {
  Search, ChevronDown, ChevronLeft, Star, MoreHorizontal, Sparkles,
  Phone, Moon, User, Send, Type, Paperclip, Link,
  Smile, Mic, PenLine, Flag, X, Shuffle, MessageSquarePlus, BookOpen,
  MessageCircle, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ChatTicket {
  id: string; // buyer_id
  buyerName: string;
  buyerEmail: string;
  buyerAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  productName: string | null;
  ticketNumber: string;
}

interface ChatMessage {
  id: string;
  message: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
}

const SellerChat = () => {
  const { user } = useAuthContext();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<ChatTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeTicket = tickets.find(t => t.id === activeTicketId);

  // Get seller profile
  useEffect(() => {
    if (!user) return;
    const fetchSeller = async () => {
      const { data } = await supabase
        .from('seller_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (data) setSellerId(data.id);
    };
    fetchSeller();
  }, [user]);

  // Fetch chat conversations grouped by buyer
  useEffect(() => {
    if (!sellerId) return;
    const fetchConversations = async () => {
      // Get all chats for this seller
      const { data: chats } = await supabase
        .from('seller_chats')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (!chats || chats.length === 0) {
        setLoading(false);
        return;
      }

      // Group by buyer_id
      const buyerMap = new Map<string, any[]>();
      (chats as any[]).forEach(chat => {
        if (!buyerMap.has(chat.buyer_id)) {
          buyerMap.set(chat.buyer_id, []);
        }
        buyerMap.get(chat.buyer_id)!.push(chat);
      });

      // Get buyer profiles
      const buyerIds = Array.from(buyerMap.keys());
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', buyerIds);

      const profileMap = new Map<string, any>();
      (profiles || []).forEach(p => profileMap.set(p.user_id, p));

      let ticketCounter = 1;
      const conversationTickets: ChatTicket[] = buyerIds.map(buyerId => {
        const msgs = buyerMap.get(buyerId)!;
        const lastMsg = msgs[0]; // already sorted desc
        const profile = profileMap.get(buyerId);
        const unread = msgs.filter(m => m.sender_type === 'buyer' && !m.is_read).length;

        return {
          id: buyerId,
          buyerName: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
          buyerEmail: profile?.email || '',
          buyerAvatar: profile?.avatar_url || null,
          lastMessage: lastMsg.message,
          lastMessageTime: lastMsg.created_at,
          unreadCount: unread,
          productName: null,
          ticketNumber: `#TC-${String(ticketCounter++).padStart(4, '0')}`,
        };
      });

      // Sort by last message time
      conversationTickets.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

      setTickets(conversationTickets);
      if (!activeTicketId && conversationTickets.length > 0) {
        setActiveTicketId(conversationTickets[0].id);
      }
      setLoading(false);
    };
    fetchConversations();
  }, [sellerId]);

  // Fetch messages for active buyer
  useEffect(() => {
    if (!activeTicketId || !sellerId) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('seller_chats')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('buyer_id', activeTicketId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data as any[]);

      // Mark buyer messages as read
      await supabase
        .from('seller_chats')
        .update({ is_read: true })
        .eq('seller_id', sellerId)
        .eq('buyer_id', activeTicketId)
        .eq('sender_type', 'buyer')
        .eq('is_read', false);

      setTickets(prev => prev.map(t => t.id === activeTicketId ? { ...t, unreadCount: 0 } : t));
    };
    fetchMessages();

    // Realtime
    const channel = supabase
      .channel(`seller-chat-${sellerId}-${activeTicketId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_chats', filter: `seller_id=eq.${sellerId}` }, (payload) => {
        const msg = payload.new as any;
        if (msg?.buyer_id === activeTicketId) fetchMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTicketId, sellerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || !sellerId || !activeTicketId || sending) return;
    setSending(true);
    const { error } = await supabase.from('seller_chats').insert({
      seller_id: sellerId,
      buyer_id: activeTicketId,
      message: messageText.trim(),
      sender_type: 'seller',
    });
    if (error) {
      toast.error('Failed to send');
    } else {
      setMessageText('');
    }
    setSending(false);
  };

  const filteredTickets = tickets.filter(t =>
    t.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#64748b' }} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[600px]" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", fontSize: '14px', lineHeight: '1.5', color: '#0f172a' }}>

      {/* Ticket List Sidebar */}
      <aside className="w-[320px] border-r flex-col hidden lg:flex flex-shrink-0" style={{ borderColor: '#e2e8f0', background: '#fff' }}>
        <div style={{ padding: '24px 20px 16px' }}>
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold" style={{ fontSize: '15px' }}>Conversations {tickets.length}</span>
            <div className="flex items-center gap-1 cursor-pointer" style={{ fontSize: '13px', color: '#64748b' }}>
              Newest <ChevronDown size={14} />
            </div>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 rounded-lg pl-[38px] pr-3 outline-none transition-colors"
              style={{ border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a' }}
              onFocus={(e) => (e.target.style.borderColor = '#f97316')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#94a3b8', fontSize: '13px' }}>
              <MessageCircle size={24} className="mx-auto mb-2" />
              No conversations yet
            </div>
          ) : filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setActiveTicketId(ticket.id)}
              className={cn(
                "flex gap-3 p-4 rounded-lg cursor-pointer mb-1 transition-colors",
                activeTicketId === ticket.id
                  ? "border"
                  : "border border-transparent hover:bg-[#f8fafc]"
              )}
              style={activeTicketId === ticket.id ? { backgroundColor: '#eff6ff', borderColor: '#dbeafe' } : {}}
            >
              {ticket.buyerAvatar ? (
                <img src={ticket.buyerAvatar} className="w-10 h-10 rounded-full object-cover flex-shrink-0" style={{ background: '#e2e8f0' }} />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white" style={{ background: '#64748b', fontSize: '14px' }}>
                  {ticket.buyerName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold" style={{ fontSize: '13px' }}>{ticket.ticketNumber}</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{format(new Date(ticket.lastMessageTime), 'hh:mm a')}</span>
                </div>
                <div className="font-medium mb-1" style={{ fontSize: '13px', color: '#64748b' }}>{ticket.buyerName}</div>
                <div className="font-medium truncate" style={{ fontSize: '13px' }}>{ticket.lastMessage}</div>
              </div>
              {ticket.unreadCount > 0 && (
                <div className="flex flex-col justify-end">
                  <div className="flex items-center justify-center font-semibold text-white rounded-[9px]" style={{ background: '#ef4444', fontSize: '11px', height: '18px', minWidth: '18px', padding: '0 5px' }}>
                    {ticket.unreadCount}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col min-w-0" style={{ background: '#ffffff' }}>
        {!activeTicket ? (
          <div className="flex-1 flex items-center justify-center" style={{ color: '#94a3b8' }}>
            <div className="text-center">
              <MessageCircle size={40} className="mx-auto mb-3" />
              <p style={{ fontSize: '15px' }}>Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <header className="flex items-center justify-between flex-shrink-0 px-4 md:px-8" style={{ height: '72px', borderBottom: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer lg:hidden" style={{ border: '1px solid #e2e8f0', background: 'white' }} onClick={() => setActiveTicketId(null)}>
                  <ChevronLeft size={18} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ fontSize: '15px' }}>{activeTicket.ticketNumber}</span>
                  <span style={{ color: '#64748b' }}>•</span>
                  <span className="truncate max-w-[200px] md:max-w-[300px]" style={{ color: '#64748b', fontSize: '14px' }}>{activeTicket.buyerName}</span>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-[10px]">
                <div className="w-9 h-9 flex items-center justify-center cursor-pointer"><MoreHorizontal size={20} style={{ color: '#64748b' }} /></div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer" style={{ border: '1px solid #e2e8f0' }}><Sparkles size={16} style={{ color: '#f97316' }} /></div>
                <button className="h-9 px-4 rounded-lg flex items-center gap-2 font-medium cursor-pointer" style={{ border: '1px solid #e2e8f0', background: 'white', fontSize: '13px' }}><Phone size={16} /> Call</button>
                <button className="h-9 px-4 rounded-lg flex items-center gap-2 font-medium cursor-pointer" style={{ border: '1px solid #e2e8f0', background: 'white', fontSize: '13px' }}><Moon size={16} /> Snooze</button>
                <button className="h-9 px-4 rounded-lg flex items-center gap-2 font-medium cursor-pointer text-white" style={{ background: '#f97316', border: '1px solid #f97316', fontSize: '13px' }}>Close</button>
              </div>
            </header>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center" style={{ color: '#94a3b8' }}>
                  <div className="text-center">
                    <MessageCircle size={32} className="mx-auto mb-2" />
                    <p style={{ fontSize: '13px' }}>No messages yet</p>
                  </div>
                </div>
              ) : messages.map((msg) => {
                const isMe = msg.sender_type === 'seller';
                return (
                  <div key={msg.id} className={cn("flex gap-4", isMe ? "self-end flex-row-reverse" : "")} style={{ maxWidth: '80%' }}>
                    {isMe ? (
                      <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white" style={{ background: '#2563eb' }}>
                        <User size={16} />
                      </div>
                    ) : activeTicket.buyerAvatar ? (
                      <img src={activeTicket.buyerAvatar} className="w-9 h-9 rounded-full flex-shrink-0 object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white" style={{ background: '#64748b', fontSize: '14px' }}>
                        {activeTicket.buyerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={cn("flex flex-col gap-[6px]", isMe ? "items-end" : "")}>
                      <div className="font-semibold" style={{ fontSize: '13px' }}>{isMe ? 'You' : activeTicket.buyerName}</div>
                      <div
                        className="px-[18px] py-[14px] rounded-xl whitespace-pre-wrap break-words"
                        style={{
                          fontSize: '14px',
                          lineHeight: '1.6',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          ...(isMe
                            ? { background: '#eff6ff', color: '#1e3a8a', borderTopRightRadius: '4px' }
                            : { background: '#f1f5f9', borderTopLeftRadius: '4px' }),
                        }}
                      >
                        {msg.message}
                      </div>
                      <div className="flex items-center gap-[6px]" style={{ fontSize: '11px', color: '#64748b' }}>
                        {format(new Date(msg.created_at), 'hh:mm a')}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div style={{ padding: '16px 16px', borderTop: '1px solid #e2e8f0' }}>
              <div className="flex flex-col gap-4 p-4 rounded-xl" style={{ border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type messages here .."
                  className="w-full border-none outline-none resize-none"
                  style={{ fontFamily: 'inherit', fontSize: '14px', minHeight: '48px', color: '#0f172a' }}
                  disabled={sending}
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-4" style={{ color: '#94a3b8' }}>
                    <Type size={18} className="cursor-pointer hover:text-[#0f172a] transition-colors" />
                    <Paperclip size={18} className="cursor-pointer hover:text-[#0f172a] transition-colors" />
                    <Link size={18} className="cursor-pointer hover:text-[#0f172a] transition-colors" />
                    <Smile size={18} className="cursor-pointer hover:text-[#0f172a] transition-colors" />
                    <Mic size={18} className="cursor-pointer hover:text-[#0f172a] transition-colors" />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!messageText.trim() || sending}
                    className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer text-white transition-colors disabled:opacity-50"
                    style={{ background: '#0f172a' }}
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Details Panel */}
      {activeTicket && (
        <aside className="w-[300px] border-l flex-col hidden xl:flex flex-shrink-0" style={{ borderColor: '#e2e8f0', background: '#fff' }}>
          <div className="flex justify-between items-center p-6">
            <span className="font-semibold" style={{ fontSize: '16px' }}>Conversation details</span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white cursor-pointer" style={{ background: '#2563eb' }}>
              <PenLine size={14} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {/* Customer info */}
            <div className="mb-5 text-center">
              {activeTicket.buyerAvatar ? (
                <img src={activeTicket.buyerAvatar} className="w-16 h-16 rounded-full object-cover mx-auto mb-3" style={{ background: '#e2e8f0' }} />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold" style={{ background: '#64748b', fontSize: '24px' }}>
                  {activeTicket.buyerName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="font-semibold" style={{ fontSize: '15px' }}>{activeTicket.buyerName}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{activeTicket.buyerEmail}</div>
            </div>
            {/* Status */}
            <div className="mb-5">
              <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Status</label>
              <div className="w-full px-3 py-[10px] rounded-lg flex items-center justify-between" style={{ border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <div className="flex items-center gap-2">
                  <div className="w-[6px] h-[6px] rounded-full" style={{ background: '#22c55e' }} />
                  Active
                </div>
              </div>
            </div>
            {/* Attributes */}
            <div className="mb-5">
              <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Attributes</label>
              <div className="rounded-lg p-4" style={{ background: '#f8fafc' }}>
                {[
                  { key: 'Ticket', val: activeTicket.ticketNumber },
                  { key: 'Customer', val: activeTicket.buyerName },
                  { key: 'Email', val: activeTicket.buyerEmail },
                  { key: 'Last active', val: format(new Date(activeTicket.lastMessageTime), 'dd MMM yyyy, HH:mm') },
                ].map((attr, i, arr) => (
                  <div key={attr.key} className="flex justify-between items-center" style={{ fontSize: '12px', marginBottom: i < arr.length - 1 ? '12px' : 0 }}>
                    <span style={{ color: '#64748b' }}>{attr.key}</span>
                    <span className="font-semibold text-right max-w-[140px] truncate">{attr.val}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Note */}
            <div>
              <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Note</label>
              <div className="p-3 rounded-lg" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', minHeight: '40px' }}>
                No notes
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Right Toolbar Strip */}
      <div className="w-14 border-l flex-col items-center py-6 gap-6 hidden xl:flex flex-shrink-0" style={{ borderColor: '#e2e8f0', background: '#ffffff' }}>
        {[
          { icon: <Shuffle size={16} />, active: true },
          { icon: <MessageSquarePlus size={18} />, active: false },
          { icon: <BookOpen size={18} />, active: false },
          { icon: <MessageCircle size={18} />, active: false },
        ].map((btn, i) => (
          <div
            key={i}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all"
            style={btn.active ? { background: '#2563eb', color: 'white' } : { color: '#64748b' }}
          >
            {btn.icon}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SellerChat;
