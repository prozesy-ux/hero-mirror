import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, ChevronDown, ChevronLeft, Star, MoreHorizontal, Sparkles,
  Phone, Moon, User, ArrowRightLeft, Send, Type, Paperclip, Link,
  Smile, Mic, PenLine, Flag, X, Shuffle, MessageSquarePlus, BookOpen,
  MessageCircle, Plus, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  ticket_type: string;
  assigned_to: string | null;
  assigned_team: string | null;
  tags: string[];
  notes: string | null;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface Message {
  id: string;
  user_id: string;
  message: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
  ticket_id: string | null;
}

const ChatSection = () => {
  const { user, profile } = useAuthContext();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newFirstMessage, setNewFirstMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeTicket = tickets.find(t => t.id === activeTicketId) || null;

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .is('seller_id', null)
      .order('updated_at', { ascending: false });
    if (data) {
      setTickets(data as any);
      if (!activeTicketId && data.length > 0) setActiveTicketId(data[0].id);
    }
    setLoading(false);
  }, [user, activeTicketId]);

  // Fetch messages for active ticket
  const fetchMessages = useCallback(async () => {
    if (!activeTicketId || !user) return;
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', activeTicketId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as any);
  }, [activeTicketId, user]);

  // Unread count per ticket
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const fetchUnreadCounts = useCallback(async () => {
    if (!user || tickets.length === 0) return;
    const { data } = await supabase
      .from('support_messages')
      .select('ticket_id, is_read')
      .eq('user_id', user.id)
      .eq('sender_type', 'admin')
      .eq('is_read', false);
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((m: any) => {
        if (m.ticket_id) counts[m.ticket_id] = (counts[m.ticket_id] || 0) + 1;
      });
      setUnreadCounts(counts);
    }
  }, [user, tickets]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => { fetchUnreadCounts(); }, [fetchUnreadCounts]);

  // Mark messages as read when opening a ticket
  useEffect(() => {
    if (!activeTicketId || !user) return;
    supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('ticket_id', activeTicketId)
      .eq('user_id', user.id)
      .eq('sender_type', 'admin')
      .eq('is_read', false)
      .then(() => fetchUnreadCounts());
  }, [activeTicketId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('buyer-chat-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages', filter: `user_id=eq.${user.id}` }, () => {
        fetchMessages();
        fetchUnreadCounts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${user.id}` }, () => {
        fetchTickets();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchMessages, fetchTickets, fetchUnreadCounts]);

  // Send message
  const handleSend = async () => {
    if (!messageText.trim() || !user || !activeTicketId) return;
    setSending(true);
    const { error } = await supabase.from('support_messages').insert({
      user_id: user.id,
      message: messageText.trim(),
      sender_type: 'buyer',
      ticket_id: activeTicketId,
    });
    if (error) {
      toast.error('Failed to send message');
    } else {
      setMessageText('');
      // Update ticket updated_at
      await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', activeTicketId);
    }
    setSending(false);
  };

  // Create new ticket
  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newFirstMessage.trim() || !user) return;
    setCreatingTicket(true);
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({ user_id: user.id, subject: newSubject.trim() } as any)
      .select()
      .single();
    if (error || !ticket) {
      toast.error('Failed to create ticket');
      setCreatingTicket(false);
      return;
    }
    await supabase.from('support_messages').insert({
      user_id: user.id,
      message: newFirstMessage.trim(),
      sender_type: 'buyer',
      ticket_id: ticket.id,
    });
    setNewSubject('');
    setNewFirstMessage('');
    setShowNewTicket(false);
    setActiveTicketId(ticket.id);
    await fetchTickets();
    setCreatingTicket(false);
    toast.success('Ticket created!');
  };

  // Toggle star
  const toggleStar = async () => {
    if (!activeTicket) return;
    await supabase.from('support_tickets').update({ is_starred: !activeTicket.is_starred }).eq('id', activeTicket.id);
    fetchTickets();
  };

  // Update priority
  const updatePriority = async (p: string) => {
    if (!activeTicket) return;
    await supabase.from('support_tickets').update({ priority: p }).eq('id', activeTicket.id);
    fetchTickets();
  };

  // Close/reopen ticket
  const toggleTicketStatus = async () => {
    if (!activeTicket) return;
    const newStatus = activeTicket.status === 'closed' ? 'open' : 'closed';
    await supabase.from('support_tickets').update({ 
      status: newStatus, 
      resolved_at: newStatus === 'closed' ? new Date().toISOString() : null 
    }).eq('id', activeTicket.id);
    fetchTickets();
    toast.success(newStatus === 'closed' ? 'Ticket closed' : 'Ticket reopened');
  };

  const filteredTickets = tickets.filter(t =>
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'You';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#64748b' }} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[600px]" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", fontSize: '14px', lineHeight: '1.5', color: '#0f172a' }}>
      
      {/* Ticket List Sidebar */}
      <aside className="w-[320px] border-r flex-col hidden lg:flex flex-shrink-0" style={{ borderColor: '#e2e8f0', background: '#fff' }}>
        <div style={{ padding: '24px 20px 16px' }}>
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold" style={{ fontSize: '15px' }}>Tickets ({tickets.length})</span>
            <button
              onClick={() => setShowNewTicket(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white font-medium"
              style={{ background: '#f97316', fontSize: '12px' }}
            >
              <Plus size={14} /> New
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 rounded-lg pl-[38px] pr-3 outline-none transition-colors"
              style={{ border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a' }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#94a3b8', fontSize: '13px' }}>
              No tickets yet
            </div>
          ) : filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setActiveTicketId(ticket.id)}
              className={cn(
                "flex gap-3 p-4 rounded-lg cursor-pointer mb-1 transition-colors",
                activeTicketId === ticket.id ? "border" : "border border-transparent hover:bg-[#f8fafc]"
              )}
              style={activeTicketId === ticket.id ? { backgroundColor: '#eff6ff', borderColor: '#dbeafe' } : {}}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f1f5f9', color: '#64748b' }}>
                <MessageCircle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold" style={{ fontSize: '13px' }}>#{ticket.ticket_number}</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{format(new Date(ticket.updated_at), 'h:mm a')}</span>
                </div>
                <div className="font-medium mb-1" style={{ fontSize: '13px', color: '#64748b' }}>
                  {ticket.status === 'closed' ? '✓ Closed' : ticket.status === 'in_progress' ? '⏳ In Progress' : '● Open'}
                </div>
                <div className="font-medium truncate" style={{ fontSize: '13px' }}>{ticket.subject}</div>
              </div>
              {(unreadCounts[ticket.id] || 0) > 0 && (
                <div className="flex flex-col justify-end">
                  <div className="flex items-center justify-center font-semibold text-white rounded-[9px]" style={{ background: '#ef4444', fontSize: '11px', height: '18px', minWidth: '18px', padding: '0 5px' }}>
                    {unreadCounts[ticket.id]}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col min-w-0" style={{ background: '#ffffff' }}>
        {/* New Ticket Modal */}
        {showNewTicket && (
          <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="bg-white rounded-xl p-6 w-[90%] max-w-[480px] shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold" style={{ fontSize: '16px' }}>New Support Ticket</h3>
                <X size={20} className="cursor-pointer" style={{ color: '#64748b' }} onClick={() => setShowNewTicket(false)} />
              </div>
              <input
                placeholder="Subject"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                className="w-full h-10 rounded-lg px-3 mb-3 outline-none"
                style={{ border: '1px solid #e2e8f0', fontSize: '14px' }}
              />
              <textarea
                placeholder="Describe your issue..."
                value={newFirstMessage}
                onChange={e => setNewFirstMessage(e.target.value)}
                className="w-full rounded-lg px-3 py-2 outline-none resize-none"
                style={{ border: '1px solid #e2e8f0', fontSize: '14px', minHeight: '100px' }}
              />
              <button
                onClick={handleCreateTicket}
                disabled={creatingTicket || !newSubject.trim() || !newFirstMessage.trim()}
                className="mt-3 w-full h-10 rounded-lg text-white font-medium disabled:opacity-50"
                style={{ background: '#f97316', fontSize: '14px' }}
              >
                {creatingTicket ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </div>
        )}

        {!activeTicket ? (
          <div className="flex-1 flex items-center justify-center" style={{ color: '#94a3b8' }}>
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-3" />
              <p style={{ fontSize: '15px' }}>Select a ticket or create a new one</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <header className="flex items-center justify-between flex-shrink-0 px-8" style={{ height: '72px', borderBottom: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer lg:hidden" style={{ border: '1px solid #e2e8f0', background: 'white' }} onClick={() => setActiveTicketId(null)}>
                  <ChevronLeft size={18} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ fontSize: '15px' }}>#{activeTicket.ticket_number}</span>
                  <span style={{ color: '#64748b' }}>•</span>
                  <span className="truncate max-w-[300px]" style={{ color: '#64748b', fontSize: '14px' }}>{activeTicket.subject}</span>
                  <Star
                    size={16}
                    onClick={toggleStar}
                    className="cursor-pointer"
                    style={{ color: activeTicket.is_starred ? '#f59e0b' : '#64748b', fill: activeTicket.is_starred ? '#f59e0b' : 'none' }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-[10px]">
                <button
                  onClick={toggleTicketStatus}
                  className="h-9 px-4 rounded-lg flex items-center gap-2 font-medium cursor-pointer text-white"
                  style={{ background: activeTicket.status === 'closed' ? '#22c55e' : '#f97316', fontSize: '13px' }}
                >
                  {activeTicket.status === 'closed' ? 'Reopen' : 'Close'}
                </button>
              </div>
            </header>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
              {messages.length === 0 ? (
                <div className="text-center py-12" style={{ color: '#94a3b8' }}>
                  <MessageCircle size={32} className="mx-auto mb-2" />
                  <p style={{ fontSize: '13px' }}>No messages in this ticket yet</p>
                </div>
              ) : messages.map((msg) => {
                const isAdmin = msg.sender_type === 'admin';
                return (
                  <div key={msg.id} className={cn("flex gap-4", isAdmin ? "self-end flex-row-reverse" : "")} style={{ maxWidth: '80%' }}>
                    {isAdmin ? (
                      <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white" style={{ background: '#8b5cf6' }}>
                        <Sparkles size={18} />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: '#f1f5f9', color: '#64748b' }}>
                        <User size={18} />
                      </div>
                    )}
                    <div className={cn("flex flex-col gap-[6px]", isAdmin ? "items-end" : "")}>
                      {!isAdmin && <div className="font-semibold" style={{ fontSize: '13px' }}>{displayName}</div>}
                      {isAdmin && (
                        <div className="flex items-center gap-[6px] font-medium" style={{ fontSize: '12px', color: '#7c3aed' }}>
                          <Sparkles size={12} /> Support Agent
                        </div>
                      )}
                      <div
                        className="px-[18px] py-[14px] rounded-xl"
                        style={{
                          fontSize: '14px', lineHeight: '1.6',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          ...(isAdmin
                            ? { background: '#eff6ff', color: '#1e3a8a', borderTopRightRadius: '4px' }
                            : { background: '#f1f5f9', borderTopLeftRadius: '4px' }),
                        }}
                      >
                        {msg.message}
                      </div>
                      <div className="flex items-center gap-[6px]" style={{ fontSize: '11px', color: '#64748b' }}>
                        {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            {activeTicket.status !== 'closed' && (
              <div style={{ padding: '24px 32px', borderTop: '1px solid #e2e8f0' }}>
                <div className="flex flex-col gap-4 p-4 rounded-xl" style={{ border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full border-none outline-none resize-none"
                    style={{ fontFamily: 'inherit', fontSize: '14px', minHeight: '48px', color: '#0f172a' }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex gap-4" style={{ color: '#94a3b8' }}>
                      <Paperclip size={18} className="cursor-pointer hover:text-[#0f172a] transition-colors" />
                      <Smile size={18} className="cursor-pointer hover:text-[#0f172a] transition-colors" />
                    </div>
                    <button
                      onClick={handleSend}
                      disabled={sending || !messageText.trim()}
                      className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer text-white transition-colors disabled:opacity-50"
                      style={{ background: '#0f172a' }}
                    >
                      {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Details Panel */}
      {activeTicket && (
        <aside className="w-[300px] border-l flex-col hidden xl:flex flex-shrink-0" style={{ borderColor: '#e2e8f0', background: '#fff' }}>
          <div className="flex justify-between items-center p-6">
            <span className="font-semibold" style={{ fontSize: '16px' }}>Ticket details</span>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {/* Assignee */}
            <div className="mb-5">
              <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Assignee</label>
              <div className="w-full px-3 py-[10px] rounded-lg flex items-center gap-2" style={{ border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <User size={14} style={{ color: '#64748b' }} />
                {activeTicket.assigned_to || 'Unassigned'}
              </div>
            </div>
            {/* Team */}
            <div className="mb-5">
              <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Team</label>
              <div className="w-full px-3 py-[10px] rounded-lg" style={{ border: '1px solid #e2e8f0', fontSize: '13px' }}>
                {activeTicket.assigned_team || 'Customer Service'}
              </div>
            </div>
            {/* Ticket type */}
            <div className="mb-5">
              <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Ticket type</label>
              <div className="w-full px-3 py-[10px] rounded-lg capitalize" style={{ border: '1px solid #e2e8f0', fontSize: '13px' }}>
                {activeTicket.ticket_type || 'Problem'}
              </div>
            </div>
            {/* Status */}
            <div className="mb-5">
              <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Status</label>
              <div className="w-full px-3 py-[10px] rounded-lg flex items-center gap-2 capitalize" style={{ border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <Flag size={14} /> {activeTicket.status}
              </div>
            </div>
            {/* Priority */}
            <div className="mb-5">
              <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Set priority</label>
              <div className="flex gap-2">
                {[
                  { key: 'low', label: 'Low', color: '#22c55e' },
                  { key: 'medium', label: 'Medium', color: '#f59e0b' },
                  { key: 'high', label: 'High', color: '#ef4444' },
                ].map((p) => (
                  <div
                    key={p.key}
                    onClick={() => updatePriority(p.key)}
                    className="flex-1 flex items-center justify-center gap-[6px] py-2 rounded-md cursor-pointer"
                    style={{
                      border: '1px solid',
                      borderColor: activeTicket.priority === p.key ? '#fcd34d' : '#e2e8f0',
                      background: activeTicket.priority === p.key ? '#fef3c7' : 'transparent',
                      fontSize: '12px',
                    }}
                  >
                    <div className="w-[6px] h-[6px] rounded-full" style={{ background: p.color }} />
                    {p.label}
                  </div>
                ))}
              </div>
            </div>
            {/* Subject */}
            <div className="mb-5">
              <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Subject</label>
              <div className="p-3 rounded-lg" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '13px', lineHeight: '1.4', color: '#1e293b' }}>
                {activeTicket.subject}
              </div>
            </div>
            {/* Tags */}
            {activeTicket.tags && activeTicket.tags.length > 0 && (
              <div className="mb-5">
                <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Tags</label>
                <div className="flex gap-2 flex-wrap">
                  {activeTicket.tags.map((tag) => (
                    <div key={tag} className="flex items-center gap-[6px] px-[10px] py-[6px] rounded-[20px] text-white font-medium" style={{ background: '#0f172a', fontSize: '11px' }}>
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Attributes */}
            <div className="mb-5">
              <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Attributes</label>
              <div className="rounded-lg p-4" style={{ background: '#f8fafc' }}>
                {[
                  { key: 'ID', val: activeTicket.ticket_number },
                  { key: 'Created', val: format(new Date(activeTicket.created_at), 'dd MMM yyyy, HH:mm') },
                  ...(activeTicket.resolved_at ? [{ key: 'Resolved', val: format(new Date(activeTicket.resolved_at), 'dd MMM yyyy, HH:mm') }] : []),
                ].map((attr, i, arr) => (
                  <div key={attr.key} className="flex justify-between items-center" style={{ fontSize: '12px', marginBottom: i < arr.length - 1 ? '12px' : 0 }}>
                    <span style={{ color: '#64748b' }}>{attr.key}</span>
                    <span className="font-semibold">{attr.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Right Toolbar Strip */}
      <div className="w-14 border-l flex-col items-center py-6 gap-6 hidden xl:flex flex-shrink-0" style={{ borderColor: '#e2e8f0', background: '#ffffff' }}>
        {[
          { icon: <Shuffle size={16} />, active: true },
          { icon: <MessageSquarePlus size={18} />, active: false, onClick: () => setShowNewTicket(true) },
          { icon: <BookOpen size={18} />, active: false },
          { icon: <MessageCircle size={18} />, active: false },
        ].map((btn, i) => (
          <div
            key={i}
            onClick={btn.onClick}
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

export default ChatSection;
