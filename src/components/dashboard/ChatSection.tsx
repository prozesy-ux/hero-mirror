import { useState, useRef } from 'react';
import { Send, Search, Phone, MoreVertical, ChevronDown, Paperclip, Play, Pause } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { playSound } from '@/lib/sounds';
import { cn } from '@/lib/utils';

// =====================================================
// EXACT DEMO DATA FROM HTML - DO NOT CHANGE
// =====================================================

const DEMO_CONTACTS = [
  {
    id: 'demo-1',
    name: 'Eten Hunt',
    avatar: 'https://c.animaapp.com/mlcbgbe2563Pxt/img/photo.png',
    role: 'Agents',
    lastMessage: "Thank you very much. I'm glad ...",
    unread: false,
    active: true
  },
  {
    id: 'demo-2',
    name: 'Jakob Saris',
    avatar: 'https://c.animaapp.com/mlcbgbe2563Pxt/img/people.png',
    role: 'Property manager',
    lastMessage: 'You : Sure! let me tell you about w…',
    unread: false,
    active: false
  },
  {
    id: 'demo-3',
    name: 'Jeremy Zucker',
    avatar: 'https://c.animaapp.com/mlcbgbe2563Pxt/img/people-1.png',
    role: '4 m Ago',
    lastMessage: 'You : Sure! let me teach you about  ...',
    unread: false,
    active: false
  },
  {
    id: 'demo-4',
    name: 'Nadia Lauren',
    avatar: 'https://c.animaapp.com/mlcbgbe2563Pxt/img/people-2.png',
    role: '5 m Ago',
    lastMessage: 'Is there anything I can help? Just ...',
    unread: true,
    active: false
  },
  {
    id: 'demo-5',
    name: 'Jeremy Zucker',
    avatar: 'https://c.animaapp.com/mlcbgbe2563Pxt/img/people-3.png',
    role: '4 m Ago',
    lastMessage: 'You : Sure! let me teach you about  ...',
    unread: false,
    active: false
  }
];

const DEMO_RECEIVED_MESSAGES = [
  {
    id: 'r1',
    images: [
      'https://c.animaapp.com/mlcbgbe2563Pxt/img/image-2.png',
      'https://c.animaapp.com/mlcbgbe2563Pxt/img/image-3.png'
    ],
    text: 'Good question. How about just discussing it?',
    time: 'Today 11:55'
  },
  {
    id: 'r2',
    images: [],
    text: 'Yes of course, Are there problems with your job?',
    time: 'Today 11:53'
  },
  {
    id: 'r3',
    images: [
      'https://c.animaapp.com/mlcbgbe2563Pxt/img/-----image-1.png',
      'https://c.animaapp.com/mlcbgbe2563Pxt/img/-----image-1.png'
    ],
    text: 'Good question. How about just discussing it?',
    time: 'Today 11:55'
  }
];

const DEMO_SENT_MESSAGES = [
  {
    id: 's1',
    hasVoice: true,
    text: 'Of course. Thank you so much for taking your time.',
    time: 'Today 11:56'
  },
  {
    id: 's2',
    hasVoice: false,
    text: 'Morning Eten Hunt, I have a question about my job!',
    time: 'Today 11:52'
  }
];

// =====================================================
// COMPONENT - EXACT HTML COPY
// =====================================================

const ChatSection = () => {
  const { user } = useAuthContext();
  const [selectedContact, setSelectedContact] = useState(DEMO_CONTACTS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!user || sendingMessage) return;

    setSendingMessage(true);
    try {
      await supabase
        .from('support_messages')
        .insert({
          user_id: user.id,
          message: newMessage.trim(),
          sender_type: 'user',
          is_read: false,
        });

      playSound('messageSent');
      setNewMessage('');
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="flex h-[882px]" style={{ fontFamily: "'Plus Jakarta Sans', Helvetica, sans-serif" }}>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple className="hidden" />

      {/* =====================================================
          CONTACTS SIDEBAR - width: 400px
          ===================================================== */}
      <aside className="w-[400px] bg-white overflow-hidden flex-shrink-0">
        {/* Contacts Header - padding: 24px 20px, gap: 12px */}
        <div className="p-[24px_20px] flex flex-col gap-3">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            {/* Title with badge */}
            <div className="flex items-center gap-1 px-1">
              <h1 
                className="text-[24px] font-semibold tracking-[-0.72px]" 
                style={{ color: 'rgba(0, 9, 41, 1)' }}
              >
                Messaging
              </h1>
              <span 
                className="text-[12px] font-normal px-[3px] py-1 rounded-[2px]"
                style={{ 
                  backgroundColor: '#ff3e46', 
                  color: '#9b171c',
                  fontFamily: "'Roboto', Helvetica"
                }}
              >
                137
              </span>
            </div>
            
            {/* Filter button */}
            <button 
              className="flex items-center gap-1 p-1 bg-white rounded border cursor-pointer"
              style={{ 
                borderColor: '#f7f7fd',
                fontFamily: "'Raleway', Helvetica",
                fontWeight: 500,
                fontSize: '14px',
                color: 'rgba(0, 9, 41, 1)'
              }}
            >
              <span>Agents</span>
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>
          
          {/* Search - height: 46px, bg: #f7f7fd, radius: 4px */}
          <div 
            className="relative h-[46px] flex items-center px-4 rounded"
            style={{ backgroundColor: 'rgba(247, 247, 253, 1)' }}
          >
            <Search className="w-5 h-5" style={{ color: '#92929d' }} />
            <input
              type="text"
              placeholder="Search in dashboard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none bg-transparent ml-3 text-[14px] outline-none"
              style={{ 
                fontFamily: "'Poppins', Helvetica",
                color: '#92929d'
              }}
            />
          </div>
        </div>

        {/* Contacts List - height: 765px */}
        <div className="h-[765px] overflow-y-auto">
          {DEMO_CONTACTS.map((contact, index) => (
            <div key={contact.id}>
              {/* Contact Item - padding: 10px 20px, gap: 12px */}
              <button
                onClick={() => setSelectedContact(contact)}
                className={cn(
                  "w-full flex items-center gap-3 p-[10px_20px] text-left transition-colors border-none cursor-pointer",
                  selectedContact.id === contact.id 
                    ? "rounded-[10px]" 
                    : "bg-transparent hover:bg-[rgba(247,247,253,1)]"
                )}
                style={{ 
                  backgroundColor: selectedContact.id === contact.id ? 'rgba(247, 247, 253, 1)' : 'transparent'
                }}
              >
                {/* Avatar - 52x52, radius: 30px */}
                <img 
                  src={contact.avatar} 
                  alt={contact.name}
                  className="w-[52px] h-[52px] rounded-[30px] object-cover flex-shrink-0"
                />

                {/* Contact Info - gap: 8px */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  {/* Name & Time Row */}
                  <div className="flex items-start justify-between gap-2">
                    <span 
                      className="font-medium text-[14px] tracking-[-0.28px] whitespace-nowrap"
                      style={{ 
                        fontFamily: "'Inter', Helvetica",
                        color: 'rgba(0, 9, 41, 1)'
                      }}
                    >
                      {contact.name}
                    </span>
                    <span 
                      className="text-[12px] tracking-[-0.12px] whitespace-nowrap"
                      style={{ color: 'rgba(118, 118, 124, 0.8)' }}
                    >
                      {contact.role}
                    </span>
                  </div>
                  
                  {/* Message & Indicator Row */}
                  <div className="flex items-center justify-between gap-2">
                    <p 
                      className={cn(
                        "text-[12px] tracking-[-0.24px] overflow-hidden text-ellipsis whitespace-nowrap",
                        contact.unread && "font-medium"
                      )}
                      style={{ 
                        color: contact.unread ? 'rgba(0, 9, 41, 1)' : 'rgba(118, 118, 124, 0.8)'
                      }}
                    >
                      {contact.lastMessage}
                    </p>
                    {contact.unread ? (
                      <div className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: 'rgba(216, 32, 39, 1)' }}
                        />
                      </div>
                    ) : (
                      <img 
                        src="https://c.animaapp.com/mlcbgbe2563Pxt/img/done-all.svg" 
                        alt="Read" 
                        className="w-[18px] h-[18px] flex-shrink-0"
                      />
                    )}
                  </div>
                </div>
              </button>
              
              {/* Separator - width: 312px, height: 1px, bg: #e5e5e5 */}
              {index < DEMO_CONTACTS.length - 1 && (
                <div className="w-[312px] h-[1px] mx-auto" style={{ backgroundColor: '#e5e5e5' }} />
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* =====================================================
          CHAT AREA - width: 881px, height: 882px
          ===================================================== */}
      <div className="w-[881px] h-[882px] relative flex flex-col">
        {/* Chat Header - height: 100px, padding: 0 24px */}
        <header 
          className="h-[100px] flex items-center justify-between px-6 flex-shrink-0"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 1)',
            borderBottom: '1px solid #e5e5e5'
          }}
        >
          {/* User Info - gap: 12px */}
          <div className="flex items-center gap-3">
            {/* Avatar - 44x44, radius: 40px */}
            <img 
              src="https://c.animaapp.com/mlcbgbe2563Pxt/img/people-13.png"
              alt={selectedContact.name}
              className="w-[44px] h-[44px] rounded-[40px] object-cover"
            />
            
            {/* User Details - gap: 8px */}
            <div className="flex flex-col gap-2">
              <h2 
                className="text-[16px] font-semibold tracking-[-0.32px]"
                style={{ color: 'rgba(0, 9, 41, 1)' }}
              >
                {selectedContact.name}
              </h2>
              {/* Online Status - gap: 8px */}
              <div className="flex items-center gap-2">
                <div className="w-[18px] h-[18px] flex items-center justify-center">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'rgba(51, 184, 67, 1)' }}
                  />
                </div>
                <span 
                  className="text-[12px] tracking-[-0.24px] font-medium"
                  style={{ color: 'rgba(186, 186, 186, 1)' }}
                >
                  Online
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons - gap: 24px */}
          <div className="flex items-center gap-6">
            <button className="p-0 bg-transparent border-none cursor-pointer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23 7L16 12L23 17V7Z" stroke="rgba(0, 9, 41, 1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="1" y="5" width="15" height="14" rx="2" stroke="rgba(0, 9, 41, 1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="p-0 bg-transparent border-none cursor-pointer">
              <Phone className="w-6 h-6" style={{ color: 'rgba(0, 9, 41, 1)' }} />
            </button>
            <button className="p-0 bg-transparent border-none cursor-pointer">
              <MoreVertical className="w-6 h-6" style={{ color: 'rgba(0, 9, 41, 1)' }} />
            </button>
          </div>
        </header>

        {/* Today Badge */}
        <div className="flex justify-center pt-1" style={{ backgroundColor: 'white' }}>
          <span 
            className="py-2 px-3 rounded text-[14px] font-semibold tracking-[-0.28px]"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 1)',
              color: 'rgba(46, 42, 64, 1)',
              boxShadow: '0px 1px 3px rgba(237, 98, 20, 0.1)'
            }}
          >
            Today
          </span>
        </div>

        {/* Messages Container - height: 700px, padding: 8px 24px */}
        <div 
          className="h-[700px] overflow-y-auto p-[8px_24px] flex-1"
          style={{ backgroundColor: 'white' }}
        >
          {/* Messages Wrapper - flex, justify-between, gap: 16px */}
          <div className="flex justify-between gap-4">
            {/* ===== RECEIVED MESSAGES - LEFT SIDE ===== */}
            {/* gap: 53px */}
            <div className="flex flex-col gap-[53px]">
              {DEMO_RECEIVED_MESSAGES.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-[7px]">
                  {/* Message Images - gap: 12px */}
                  {msg.images.length > 0 && (
                    <div className="flex gap-3">
                      {msg.images.map((img, idx) => (
                        <img 
                          key={idx}
                          src={img} 
                          alt="Message attachment" 
                          className="w-[112px] h-[120px] rounded-[12px] object-cover"
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Message Bubble Wrapper - width: 272px, gap: 10px */}
                  <div className="flex flex-col gap-[10px] w-[272px]">
                    {/* Message Bubble - bg: dark, radius: 0 10 10 10 */}
                    <div 
                      className="rounded-[0px_10px_10px_10px] p-[8px_12px]"
                      style={{ 
                        backgroundColor: 'rgba(0, 9, 41, 1)',
                        boxShadow: '0px 1px 3px rgba(237, 98, 20, 0.1)'
                      }}
                    >
                      <p 
                        className="font-medium text-[14px] tracking-[-0.28px] leading-[21px]"
                        style={{ 
                          fontFamily: "'Raleway', Helvetica",
                          color: 'rgba(255, 255, 255, 1)'
                        }}
                      >
                        {msg.text}
                      </p>
                    </div>
                    {/* Message Time */}
                    <span 
                      className="text-[12px] tracking-[-0.12px]"
                      style={{ color: 'rgba(117, 117, 117, 1)' }}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* ===== SENT MESSAGES - RIGHT SIDE ===== */}
            {/* gap: 170px */}
            <div className="flex flex-col gap-[170px]">
              {DEMO_SENT_MESSAGES.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-[10px]">
                  {/* Voice Message - width: 264px, height: 53.05px */}
                  {msg.hasVoice && (
                    <div 
                      className="w-[264px] h-[53.05px] rounded-[10px_10px_4px_10px] flex items-center px-3 gap-2 self-end"
                      style={{ backgroundColor: 'rgba(46, 59, 91, 1)' }}
                    >
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 text-white" />
                        ) : (
                          <Play className="w-4 h-4 text-white ml-0.5" />
                        )}
                      </button>
                      {/* Waveform visualization */}
                      <div className="flex items-center gap-[2px] flex-1">
                        {[...Array(30)].map((_, i) => (
                          <div 
                            key={i}
                            className="w-[2px] rounded-full bg-white/60"
                            style={{ 
                              height: `${Math.random() * 20 + 5}px`
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-white text-[12px]">10:12</span>
                    </div>
                  )}
                  
                  {/* Sent Bubble Wrapper - width: 303px, gap: 10px */}
                  <div className="flex flex-col gap-[10px] w-[303px] items-end">
                    {/* Sent Bubble - bg: rentsell-primary, radius: 10 0 10 10 */}
                    <div 
                      className="rounded-[10px_0px_10px_10px] p-[8px_12px] w-full"
                      style={{ 
                        backgroundColor: 'rgba(46, 59, 91, 1)',
                        boxShadow: '0px 1px 3px rgba(115, 20, 237, 0.1)'
                      }}
                    >
                      <p 
                        className="font-medium text-[14px] tracking-[-0.28px] leading-[21px]"
                        style={{ 
                          fontFamily: "'Raleway', Helvetica",
                          color: 'rgba(255, 255, 255, 1)'
                        }}
                      >
                        {msg.text}
                      </p>
                    </div>
                    {/* Message Time - right aligned */}
                    <span 
                      className="text-[12px] tracking-[-0.12px] text-right"
                      style={{ color: 'rgba(117, 117, 117, 1)' }}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== CHAT FOOTER ===== */}
        {/* height: 80px, gap: 24px, padding: 0 15px */}
        <footer 
          className="absolute bottom-0 left-0 w-full h-[80px] flex items-center gap-6 px-[15px]"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 1)',
            borderTop: '1px solid #e5e5e5'
          }}
        >
          {/* More Button */}
          <button className="p-0 bg-transparent border-none cursor-pointer">
            <MoreVertical className="w-6 h-6" style={{ color: 'rgba(0, 9, 41, 1)' }} />
          </button>

          {/* Input Wrapper - height: 60px, radius: 20px */}
          <div 
            className="flex-1 h-[60px] rounded-[20px] flex items-center px-4"
            style={{ backgroundColor: 'rgba(247, 247, 253, 1)' }}
          >
            <input
              type="text"
              placeholder="Type your message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 border-none bg-transparent text-[14px] outline-none"
              style={{ 
                fontFamily: "'Poppins', Helvetica",
                color: '#92929d'
              }}
            />
          </div>

          {/* Attachment Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-0 bg-transparent border-none cursor-pointer"
          >
            <Paperclip className="w-6 h-6" style={{ color: 'rgba(0, 9, 41, 1)' }} />
          </button>

          {/* Send Button - padding: 10px, radius: 10px */}
          <button 
            onClick={handleSendMessage}
            disabled={sendingMessage || !newMessage.trim()}
            className="p-[10px] rounded-[10px] border-none cursor-pointer flex items-center justify-center disabled:opacity-50"
            style={{ backgroundColor: 'rgba(46, 59, 91, 1)' }}
          >
            <Send className="w-6 h-6 text-white" />
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ChatSection;
