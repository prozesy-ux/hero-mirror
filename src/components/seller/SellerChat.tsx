import { useState } from 'react';
import {
  Search, ChevronDown, ChevronLeft, Star, MoreHorizontal, Sparkles,
  Phone, Moon, User, ArrowRightLeft, Send, Type, Paperclip, Link,
  Smile, Mic, PenLine, Flag, X, Shuffle, MessageSquarePlus, BookOpen,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================
// MOCK DATA - FROM HTML (no DB)
// =====================================================

const TICKETS = [
  {
    id: 'tc-0004-1',
    ticketId: '#TC-0004',
    name: 'David Newman',
    avatar: 'https://storage.googleapis.com/banani-avatars/avatar%2Fmale%2F35-50%2FNorth%20American%2F3',
    avatarType: 'img' as const,
    subject: 'System Login Failure',
    time: '09:46 am',
    unread: 2,
  },
  {
    id: 'tc-0001',
    ticketId: '#TC-0001',
    name: 'Emily Johnson',
    avatar: 'https://storage.googleapis.com/banani-avatars/avatar%2Ffemale%2F25-35%2FEuropean%2F5',
    avatarType: 'img' as const,
    subject: 'Request for Additional Storage...',
    time: '09:46 am',
    unread: 0,
  },
  {
    id: 'tc-0003',
    ticketId: '#TC-0003',
    name: '(747) 246-9411',
    avatar: '747',
    avatarType: 'text' as const,
    subject: 'Unable to access report',
    time: '09:46 am',
    unread: 0,
  },
  {
    id: 'tc-0004-2',
    ticketId: '#TC-0004',
    name: 'Brooklyn Simmons',
    avatar: 'https://storage.googleapis.com/banani-avatars/avatar%2Ffemale%2F18-25%2FAfrican%2F2',
    avatarType: 'img' as const,
    subject: 'File Upload Error',
    time: '09:46 am',
    unread: 1,
  },
  {
    id: 'tc-0007',
    ticketId: '#TC-0007',
    name: '(44) 1342 351',
    avatar: '44',
    avatarType: 'text' as const,
    subject: 'Unable to access report',
    time: '09:46 am',
    unread: 1,
  },
  {
    id: 'tc-0008',
    ticketId: '#TC-0008',
    name: 'Guy Hawkins',
    avatar: 'https://storage.googleapis.com/banani-avatars/avatar%2Fmale%2F25-35%2FSouth%20Asian%2F4',
    avatarType: 'img' as const,
    subject: 'Unexpected App Crash',
    time: '09:46 am',
    unread: 0,
  },
];

const MESSAGES = [
  {
    id: 'm1',
    type: 'customer' as const,
    name: 'Emily Johnson',
    avatar: 'https://storage.googleapis.com/banani-avatars/avatar%2Ffemale%2F25-35%2FEuropean%2F5',
    text: 'Hi, I need more storage and better server capacity.',
    time: '09:44 am',
    channel: 'Whatsapp',
  },
  {
    id: 'm2',
    type: 'ai' as const,
    name: 'EcomiqAI',
    text: 'Hello! I can assist with that. Are you looking for both additional storage and server upgrades? Can I transfer you to a customer service agent for further assistance?',
    time: '09:51 am',
    channel: 'Whatsapp',
  },
  {
    id: 'm3',
    type: 'customer' as const,
    name: 'Emily Johnson',
    avatar: 'https://storage.googleapis.com/banani-avatars/avatar%2Ffemale%2F25-35%2FEuropean%2F5',
    text: 'Yes, sure.',
    time: '09:44 am',
    channel: 'Whatsapp',
  },
  {
    id: 'm4',
    type: 'ai' as const,
    name: 'EcomiqAI',
    text: 'Connecting you now... please hold for a moment.',
    time: '09:51 am',
    channel: 'Whatsapp',
  },
  {
    id: 'sys1',
    type: 'system' as const,
    text: 'has connected to take over ticket',
    actor: 'Raihan Fikri',
    time: '09:52 AM',
    icon: 'user' as const,
  },
  {
    id: 'sys2',
    type: 'system' as const,
    text: 'Ticket change priority to',
    actor: 'Raihan Fikri',
    time: '09:52 AM',
    icon: 'swap' as const,
    pill: '• Medium',
  },
  {
    id: 'm5',
    type: 'agent' as const,
    name: 'Raihan Fikri',
    avatar: 'https://storage.googleapis.com/banani-avatars/avatar%2Fmale%2F25-35%2FSouth%20Asian%2F4',
    text: "Hi, thanks for waiting! I see you're looking for more storage and server capacity. Can we schedule a quick assessment to recommend the right solution for you?",
    time: '09:51 am',
    channel: 'Whatsapp',
  },
];

// =====================================================
// COMPONENT
// =====================================================

const SellerChat = () => {
  const [activeTicket, setActiveTicket] = useState('tc-0001');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [priority, setPriority] = useState('medium');

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[600px]" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", fontSize: '14px', lineHeight: '1.5', color: '#0f172a' }}>
      
      {/* 2. Ticket List Sidebar */}
      <aside className="w-[320px] border-r flex-col hidden lg:flex flex-shrink-0" style={{ borderColor: '#e2e8f0', background: '#fff' }}>
        <div style={{ padding: '24px 20px 16px' }}>
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold" style={{ fontSize: '15px' }}>Total ticket 24</span>
            <div className="flex items-center gap-1 cursor-pointer" style={{ fontSize: '13px', color: '#64748b' }}>
              Newest
              <ChevronDown size={14} />
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
          {TICKETS.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setActiveTicket(ticket.id)}
              className={cn(
                "flex gap-3 p-4 rounded-lg cursor-pointer mb-1 transition-colors",
                activeTicket === ticket.id
                  ? "border"
                  : "border border-transparent hover:bg-[#f8fafc]"
              )}
              style={activeTicket === ticket.id ? { backgroundColor: '#eff6ff', borderColor: '#dbeafe' } : {}}
            >
              {ticket.avatarType === 'img' ? (
                <img src={ticket.avatar} className="w-10 h-10 rounded-full object-cover flex-shrink-0" style={{ background: '#e2e8f0' }} />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold" style={{ fontSize: '10px', background: '#f1f5f9', color: '#64748b' }}>
                  {ticket.avatar}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold" style={{ fontSize: '13px' }}>{ticket.ticketId}</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{ticket.time}</span>
                </div>
                <div className="font-medium mb-1" style={{ fontSize: '13px', color: '#64748b' }}>{ticket.name}</div>
                <div className="font-medium truncate" style={{ fontSize: '13px' }}>{ticket.subject}</div>
              </div>
              {ticket.unread > 0 && (
                <div className="flex flex-col justify-end">
                  <div className="flex items-center justify-center font-semibold text-white rounded-[9px]" style={{ background: '#ef4444', fontSize: '11px', height: '18px', minWidth: '18px', padding: '0 5px' }}>
                    {ticket.unread}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* 3. Chat Area */}
      <main className="flex-1 flex flex-col min-w-0" style={{ background: '#ffffff' }}>
        {/* Chat Header */}
        <header className="flex items-center justify-between flex-shrink-0 px-8" style={{ height: '72px', borderBottom: '1px solid #e2e8f0' }}>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer" style={{ border: '1px solid #e2e8f0', background: 'white' }}>
              <ChevronLeft size={18} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ fontSize: '15px' }}>#TC-0001</span>
              <span style={{ color: '#64748b' }}>•</span>
              <span className="truncate max-w-[300px]" style={{ color: '#64748b', fontSize: '14px' }}>Request for Additional Storage and more server</span>
              <Star size={16} style={{ color: '#64748b', marginLeft: '4px', cursor: 'pointer' }} />
            </div>
          </div>
          <div className="flex items-center gap-[10px]">
            <div className="w-9 h-9 flex items-center justify-center cursor-pointer" style={{ background: 'transparent' }}>
              <MoreHorizontal size={20} style={{ color: '#64748b' }} />
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer" style={{ border: '1px solid #e2e8f0' }}>
              <Sparkles size={16} style={{ color: '#f97316' }} />
            </div>
            <button className="h-9 px-4 rounded-lg flex items-center gap-2 font-medium cursor-pointer" style={{ border: '1px solid #e2e8f0', background: 'white', fontSize: '13px' }}>
              <Phone size={16} /> Call
            </button>
            <button className="h-9 px-4 rounded-lg flex items-center gap-2 font-medium cursor-pointer" style={{ border: '1px solid #e2e8f0', background: 'white', fontSize: '13px' }}>
              <Moon size={16} /> Snooze
            </button>
            <button className="h-9 px-4 rounded-lg flex items-center gap-2 font-medium cursor-pointer text-white" style={{ background: '#f97316', border: '1px solid #f97316', fontSize: '13px' }}>
              Close
            </button>
          </div>
        </header>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
          {MESSAGES.map((msg) => {
            if (msg.type === 'system') {
              return (
                <div key={msg.id} className="self-center flex items-center gap-2 px-4 py-2 rounded-[20px]" style={{ fontSize: '12px', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: msg.icon === 'user' ? '#e0e7ff' : '#dbeafe', color: msg.icon === 'user' ? '#4338ca' : '#1d4ed8' }}>
                    {msg.icon === 'user' ? <User size={12} /> : <ArrowRightLeft size={12} />}
                  </div>
                  <span><strong>{msg.actor}</strong> {msg.text}</span>
                  {msg.pill && <span className="font-medium" style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #fcd34d' }}>{msg.pill}</span>}
                  <span style={{ opacity: 0.6 }}>{msg.time}</span>
                </div>
              );
            }

            const isMe = msg.type === 'ai' || msg.type === 'agent';

            return (
              <div key={msg.id} className={cn("flex gap-4", isMe ? "self-end flex-row-reverse" : "")} style={{ maxWidth: '80%' }}>
                {msg.type === 'ai' ? (
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white" style={{ background: '#8b5cf6' }}>
                    <Sparkles size={18} />
                  </div>
                ) : (
                  <img src={msg.avatar} className="w-9 h-9 rounded-full flex-shrink-0 object-cover" />
                )}
                <div className={cn("flex flex-col gap-[6px]", isMe ? "items-end" : "")}>
                  {msg.type === 'customer' && <div className="font-semibold" style={{ fontSize: '13px' }}>{msg.name}</div>}
                  {msg.type === 'ai' && (
                    <div className="flex items-center gap-[6px] font-medium" style={{ fontSize: '12px', color: '#7c3aed' }}>
                      <Sparkles size={12} /> Reply by EcomiqAI
                    </div>
                  )}
                  <div
                    className="px-[18px] py-[14px] rounded-xl"
                    style={{
                      fontSize: '14px',
                      lineHeight: '1.6',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      maxWidth: isMe ? '500px' : undefined,
                      ...(isMe
                        ? { background: '#eff6ff', color: '#1e3a8a', borderTopRightRadius: '4px' }
                        : { background: '#f1f5f9', borderTopLeftRadius: '4px' }),
                    }}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-[6px]" style={{ fontSize: '11px', color: '#64748b' }}>
                    {msg.time} • Via Whatsapp
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat Input */}
        <div style={{ padding: '24px 32px', borderTop: '1px solid #e2e8f0' }}>
          <div className="flex flex-col gap-4 p-4 rounded-xl" style={{ border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <div className="flex items-center gap-2 px-3 py-[6px] rounded-md cursor-pointer" style={{ border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 500, background: '#f8fafc' }}>
                  Whatsapp <ChevronDown size={14} style={{ opacity: 0.5 }} />
                </div>
                <div className="flex items-center gap-2 px-3 py-[6px] rounded-md cursor-pointer" style={{ fontSize: '12px', fontWeight: 500, background: 'white' }}>
                  <span style={{ opacity: 0.6 }}>From</span> <strong>CSFikri</strong> <ChevronDown size={14} style={{ opacity: 0.5 }} />
                </div>
              </div>
              <div className="flex items-center gap-2" style={{ fontSize: '13px', color: '#64748b' }}>
                <Sparkles size={14} /> Instant reply with AI
                <div className="w-9 h-5 rounded-[10px] relative cursor-pointer" style={{ background: '#e2e8f0' }}>
                  <div className="w-4 h-4 rounded-full absolute top-[2px] left-[2px]" style={{ background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type messages here .."
              className="w-full border-none outline-none resize-none"
              style={{ fontFamily: 'inherit', fontSize: '14px', minHeight: '48px', color: '#0f172a' }}
            />
            <div className="flex justify-between items-center">
              <div className="flex gap-4" style={{ color: '#94a3b8' }}>
                <Type size={18} className="cursor-pointer hover:text-[#0f172a] transition-colors" />
                <Paperclip size={18} className="cursor-pointer hover:text-[#0f172a] transition-colors" />
                <Link size={18} className="cursor-pointer hover:text-[#0f172a] transition-colors" />
                <Smile size={18} className="cursor-pointer hover:text-[#0f172a] transition-colors" />
                <Mic size={18} className="cursor-pointer hover:text-[#0f172a] transition-colors" />
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer text-white transition-colors" style={{ background: '#0f172a' }}>
                <Send size={18} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Details Panel */}
      <aside className="w-[300px] border-l flex-col hidden xl:flex flex-shrink-0" style={{ borderColor: '#e2e8f0', background: '#fff' }}>
        <div className="flex justify-between items-center p-6">
          <span className="font-semibold" style={{ fontSize: '16px' }}>Ticket details</span>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white cursor-pointer" style={{ background: '#2563eb' }}>
            <PenLine size={14} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Assignee */}
          <div className="mb-5">
            <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Assignee</label>
            <div className="w-full px-3 py-[10px] rounded-lg flex items-center justify-between cursor-pointer" style={{ border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div className="flex items-center gap-2">
                <img src="https://storage.googleapis.com/banani-avatars/avatar%2Fmale%2F25-35%2FSouth%20Asian%2F4" className="w-5 h-5 rounded-full" />
                Raihan Fikri
              </div>
              <ChevronDown size={14} style={{ opacity: 0.5 }} />
            </div>
          </div>
          {/* Team */}
          <div className="mb-5">
            <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Team</label>
            <div className="w-full px-3 py-[10px] rounded-lg flex items-center justify-between cursor-pointer" style={{ border: '1px solid #e2e8f0', fontSize: '13px' }}>
              Customer Service
              <ChevronDown size={14} style={{ opacity: 0.5 }} />
            </div>
          </div>
          {/* Ticket type */}
          <div className="mb-5">
            <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Ticket type</label>
            <div className="w-full px-3 py-[10px] rounded-lg flex items-center justify-between cursor-pointer" style={{ border: '1px solid #e2e8f0', fontSize: '13px' }}>
              Problem
              <ChevronDown size={14} style={{ opacity: 0.5 }} />
            </div>
          </div>
          {/* Status */}
          <div className="mb-5">
            <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Set status</label>
            <div className="w-full px-3 py-[10px] rounded-lg flex items-center justify-between cursor-pointer" style={{ border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div className="flex items-center gap-2">
                <Flag size={14} /> Open
              </div>
              <ChevronDown size={14} style={{ opacity: 0.5 }} />
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
                  onClick={() => setPriority(p.key)}
                  className="flex-1 flex items-center justify-center gap-[6px] py-2 rounded-md cursor-pointer"
                  style={{
                    border: '1px solid',
                    borderColor: priority === p.key ? '#fcd34d' : '#e2e8f0',
                    background: priority === p.key ? '#fef3c7' : 'transparent',
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
              Request for Additional Storage and more server
            </div>
          </div>
          {/* Tags */}
          <div className="mb-5">
            <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Tags</label>
            <div className="flex gap-2 flex-wrap">
              {['Question', 'Problem'].map((tag) => (
                <div key={tag} className="flex items-center gap-[6px] px-[10px] py-[6px] rounded-[20px] text-white font-medium" style={{ background: '#0f172a', fontSize: '11px' }}>
                  {tag} <X size={10} className="cursor-pointer" />
                </div>
              ))}
            </div>
          </div>
          {/* Attributes */}
          <div className="mb-5">
            <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Attributes</label>
            <div className="rounded-lg p-4" style={{ background: '#f8fafc' }}>
              {[
                { key: 'ID', val: 'TC-0001' },
                { key: 'Customer', val: 'Emily Johnson', hasAvatar: true },
                { key: 'Language', val: 'English UK' },
                { key: 'Date submitted', val: '04 Feb 2024, 13:00' },
              ].map((attr, i, arr) => (
                <div key={attr.key} className="flex justify-between items-center" style={{ fontSize: '12px', marginBottom: i < arr.length - 1 ? '12px' : 0 }}>
                  <span style={{ color: '#64748b' }}>{attr.key}</span>
                  <span className="font-semibold flex items-center gap-[6px]">
                    {attr.hasAvatar && (
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: '#94a3b8', fontSize: '9px' }}>E</div>
                    )}
                    {attr.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Note */}
          <div>
            <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Note</label>
          </div>
        </div>
      </aside>

      {/* 5. Right Toolbar Strip */}
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
