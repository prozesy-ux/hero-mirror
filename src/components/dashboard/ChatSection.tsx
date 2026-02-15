import { useState, useEffect, useRef } from 'react';
import {
  Search, ChevronDown, ChevronLeft, Star, MoreHorizontal, Sparkles,
  Phone, Moon, User, Send, Type, Paperclip, Link,
  Smile, Mic, PenLine, Flag, X, Shuffle, MessageSquarePlus, BookOpen,
  MessageCircle, Loader2, Pin, PanelRightClose, PanelRightOpen,
  Settings, ChevronUp, Clock, Download, FileText, Image as ImageIcon,
  Play, Pause, Square, MicOff, ArrowUp, ArrowDown, Store
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, addHours, addDays, startOfTomorrow } from 'date-fns';

// ── Emoji Data ──
const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Smileys': ['😀','😂','😊','😍','🥰','😘','😎','🤩','😢','😭','😡','🤔','😴','🤗','😱','🥳','😇','🤓','😏','🙄','😬','🤑','🤮','🥺','😈'],
  'People': ['👋','👍','👎','👏','🤝','✌️','🤞','👌','🙏','💪','👈','👉','☝️','👆','🖐️','✋','🤚','🤙','👊','✊','🫶','❤️','🧡','💛','💚'],
  'Animals': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦄','🐝','🦋','🐢','🐍','🐙','🦀'],
  'Food': ['🍎','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍑','🥝','🍕','🍔','🌮','🍣','🍩','🍰','☕','🍺','🥤','🧁','🍪','🍫','🥐','🥑','🌶️'],
  'Travel': ['✈️','🚗','🚀','🏠','🏖️','🗽','🗼','🌍','🌎','🌏','⛰️','🏔️','🌋','🏝️','🏕️','🎡','🎢','🚂','🚁','⛵','🏰','🕌','⛩️','🌅','🌄'],
  'Objects': ['💻','📱','⌚','📷','🎮','🎧','💡','🔑','📦','✏️','📝','📌','📎','🔒','💎','🔔','📣','🎵','🎸','🎯','🏆','🎁','🎈','🎉','🎊'],
  'Symbols': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','❣️','✨','⭐','🌟','💫','⚡','🔥','💯','✅','❌','⚠️','♻️','🔴','🟢','🔵','⬛'],
};

// ── Theme Presets ──
const THEME_PRESETS: Record<string, { chatBg: string; userBubble: string; otherBubble: string; userText: string; otherText: string; label: string }> = {
  default: { chatBg: '#ffffff', userBubble: '#eff6ff', otherBubble: '#f1f5f9', userText: '#1e3a8a', otherText: '#0f172a', label: 'Default' },
  dark: { chatBg: '#1e293b', userBubble: '#1e40af', otherBubble: '#334155', userText: '#e0e7ff', otherText: '#e2e8f0', label: 'Dark' },
  whatsapp: { chatBg: '#e5ddd5', userBubble: '#dcf8c6', otherBubble: '#ffffff', userText: '#111b21', otherText: '#111b21', label: 'WhatsApp' },
  blueocean: { chatBg: '#0c4a6e', userBubble: '#0284c7', otherBubble: '#164e63', userText: '#e0f2fe', otherText: '#ccfbf1', label: 'Blue Ocean' },
  sunset: { chatBg: '#fdf2f8', userBubble: '#fce7f3', otherBubble: '#fff1f2', userText: '#831843', otherText: '#881337', label: 'Sunset' },
};

interface ChatTicket {
  id: string;
  sellerName: string;
  sellerStoreName: string | null;
  sellerAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  ticketNumber: string;
}

interface ChatMessage {
  id: string;
  message: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  is_voice_note?: boolean;
  is_pinned?: boolean;
}

interface ChatSettingsData {
  theme: string;
  bg_image_url: string | null;
  bg_color: string | null;
  bubble_style: string;
  font_size: string;
  notification_sound: boolean;
}

const ChatSection = () => {
  const { user } = useAuthContext();
  const [tickets, setTickets] = useState<ChatTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Feature States ──
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [emojiCategory, setEmojiCategory] = useState('Smileys');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [chatSearch, setChatSearch] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchIndex, setChatSearchIndex] = useState(0);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<string[]>([]);
  const [showPinnedBar, setShowPinnedBar] = useState(false);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);
  const [showDetailsPanel, setShowDetailsPanel] = useState(() => {
    const saved = localStorage.getItem('chat-details-panel');
    return saved !== 'false';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [chatSettings, setChatSettings] = useState<ChatSettingsData>({
    theme: 'default', bg_image_url: null, bg_color: null, bubble_style: 'rounded', font_size: 'medium', notification_sound: true,
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [contextMenuMsg, setContextMenuMsg] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const bgUploadRef = useRef<HTMLInputElement>(null);
  const [snoozedSellers, setSnoozedSellers] = useState<Record<string, string>>({});
  const [noteTexts, setNoteTexts] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState(false);
  const [currentNoteText, setCurrentNoteText] = useState('');

  const activeTicket = tickets.find(t => t.id === activeTicketId);
  const currentTheme = THEME_PRESETS[chatSettings.theme] || THEME_PRESETS.default;

  // ── Fetch chat settings ──
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from('chat_settings').select('*').eq('user_id', user.id).maybeSingle();
      if (data) setChatSettings({ theme: data.theme, bg_image_url: data.bg_image_url, bg_color: data.bg_color, bubble_style: data.bubble_style, font_size: data.font_size, notification_sound: data.notification_sound });
    };
    fetch();
  }, [user]);

  // ── Fetch pinned chats ──
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from('pinned_chats').select('seller_id').eq('user_id', user.id);
      if (data) setPinnedChats(data.map(d => d.seller_id).filter(Boolean) as string[]);
    };
    fetch();
  }, [user]);

  // ── Fetch conversations (from seller_chats, grouped by seller_id) ──
  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      const { data: chats } = await supabase
        .from('seller_chats')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (!chats || chats.length === 0) { setLoading(false); return; }

      // Group by seller_id
      const sellerMap = new Map<string, any[]>();
      (chats as any[]).forEach(chat => {
        if (!sellerMap.has(chat.seller_id)) sellerMap.set(chat.seller_id, []);
        sellerMap.get(chat.seller_id)!.push(chat);
      });

      const sellerIds = Array.from(sellerMap.keys());

      // Fetch seller profiles for names/avatars
      const { data: sellerProfiles } = await supabase
        .from('seller_profiles')
        .select('id, store_name, store_logo_url, user_id')
        .in('id', sellerIds);

      // Also fetch user profiles for seller names
      const sellerUserIds = (sellerProfiles || []).map(sp => sp.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', sellerUserIds);

      const sellerProfileMap = new Map<string, any>();
      (sellerProfiles || []).forEach(sp => sellerProfileMap.set(sp.id, sp));
      const profileMap = new Map<string, any>();
      (profiles || []).forEach(p => profileMap.set(p.user_id, p));

      let ticketCounter = 1;
      const conversationTickets: ChatTicket[] = sellerIds.map(sellerId => {
        const msgs = sellerMap.get(sellerId)!;
        const lastMsg = msgs[0];
        const sellerProfile = sellerProfileMap.get(sellerId);
        const userProfile = sellerProfile ? profileMap.get(sellerProfile.user_id) : null;
        const unread = msgs.filter(m => m.sender_type === 'seller' && !m.is_read).length;

        return {
          id: sellerId,
          sellerName: sellerProfile?.store_name || userProfile?.full_name || userProfile?.email?.split('@')[0] || 'Unknown Seller',
          sellerStoreName: sellerProfile?.store_name || null,
          sellerAvatar: sellerProfile?.store_logo_url || userProfile?.avatar_url || null,
          lastMessage: lastMsg.message,
          lastMessageTime: lastMsg.created_at,
          unreadCount: unread,
          ticketNumber: `#TC-${String(ticketCounter++).padStart(4, '0')}`,
        };
      });

      conversationTickets.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
      setTickets(conversationTickets);
      if (!activeTicketId && conversationTickets.length > 0) setActiveTicketId(conversationTickets[0].id);
      setLoading(false);
    };
    fetchConversations();
  }, [user]);

  // ── Fetch messages + pinned messages ──
  useEffect(() => {
    if (!activeTicketId || !user) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('seller_chats')
        .select('*')
        .eq('buyer_id', user.id)
        .eq('seller_id', activeTicketId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data as any[]);
      // Mark seller messages as read
      await supabase
        .from('seller_chats')
        .update({ is_read: true })
        .eq('buyer_id', user.id)
        .eq('seller_id', activeTicketId)
        .eq('sender_type', 'seller')
        .eq('is_read', false);
      setTickets(prev => prev.map(t => t.id === activeTicketId ? { ...t, unreadCount: 0 } : t));
    };
    const fetchPinned = async () => {
      const { data } = await supabase.from('pinned_messages').select('message_id').eq('user_id', user.id).eq('chat_id', activeTicketId);
      if (data) setPinnedMessages(data.map(d => d.message_id));
    };
    fetchMessages();
    fetchPinned();
    const channel = supabase
      .channel(`buyer-chat-${user.id}-${activeTicketId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'seller_chats',
        filter: `buyer_id=eq.${user.id}`
      }, (payload) => {
        const msg = payload.new as any;
        if (msg?.seller_id === activeTicketId) fetchMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTicketId, user]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { localStorage.setItem('chat-details-panel', String(showDetailsPanel)); }, [showDetailsPanel]);

  // ── Send message ──
  const handleSend = async (attachmentData?: { url: string; name: string; type: string; isVoice?: boolean }) => {
    if ((!messageText.trim() && !attachmentData) || !user || !activeTicketId || sending) return;
    setSending(true);
    const insertData: any = {
      seller_id: activeTicketId,
      buyer_id: user.id,
      message: messageText.trim() || (attachmentData?.isVoice ? '🎤 Voice note' : `📎 ${attachmentData?.name || 'File'}`),
      sender_type: 'buyer'
    };
    if (attachmentData) {
      insertData.attachment_url = attachmentData.url;
      insertData.attachment_name = attachmentData.name;
      insertData.attachment_type = attachmentData.type;
      insertData.is_voice_note = attachmentData.isVoice || false;
    }
    const { error } = await supabase.from('seller_chats').insert(insertData);
    if (error) toast.error('Failed to send');
    else setMessageText('');
    setSending(false);
  };

  // ── File Upload ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !activeTicketId) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return; }
    setUploadingFile(true);
    const path = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('chat-attachments').upload(path, file);
    if (error) { toast.error('Upload failed'); setUploadingFile(false); return; }
    const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path);
    await handleSend({ url: data.publicUrl, name: file.name, type: file.type });
    setUploadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Emoji ──
  const insertEmoji = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    textareaRef.current?.focus();
    const recent = JSON.parse(localStorage.getItem('recent-emojis') || '[]');
    localStorage.setItem('recent-emojis', JSON.stringify([emoji, ...recent.filter((e: string) => e !== emoji)].slice(0, 20)));
  };

  // ── Voice Recording ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (!user || !activeTicketId) return;
        const path = `${user.id}/voice-${Date.now()}.webm`;
        const { error } = await supabase.storage.from('chat-attachments').upload(path, audioBlob);
        if (error) { toast.error('Voice upload failed'); return; }
        const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path);
        await handleSend({ url: data.publicUrl, name: 'Voice note', type: 'audio/webm', isVoice: true });
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { toast.error('Microphone access denied'); }
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); if (recordingTimerRef.current) clearInterval(recordingTimerRef.current); };
  const cancelRecording = () => { if (mediaRecorderRef.current) { mediaRecorderRef.current.ondataavailable = null; mediaRecorderRef.current.onstop = null; mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop()); mediaRecorderRef.current.stop(); } setIsRecording(false); if (recordingTimerRef.current) clearInterval(recordingTimerRef.current); };

  // ── Pin Message ──
  const handlePinMessage = async (msgId: string) => {
    if (!user || !activeTicketId) return;
    if (pinnedMessages.includes(msgId)) {
      await supabase.from('pinned_messages').delete().eq('user_id', user.id).eq('message_id', msgId);
      setPinnedMessages(prev => prev.filter(id => id !== msgId));
      toast.success('Unpinned');
    } else {
      if (pinnedMessages.length >= 10) { toast.error('Max 10 pinned messages'); return; }
      await supabase.from('pinned_messages').insert({ user_id: user.id, chat_id: activeTicketId, message_id: msgId });
      setPinnedMessages(prev => [...prev, msgId]);
      toast.success('Pinned');
    }
    setContextMenuMsg(null);
  };

  // ── Pin Chat ──
  const handlePinChat = async (sellerId: string) => {
    if (!user) return;
    if (pinnedChats.includes(sellerId)) {
      await supabase.from('pinned_chats').delete().eq('user_id', user.id).eq('seller_id', sellerId);
      setPinnedChats(prev => prev.filter(id => id !== sellerId));
    } else {
      await supabase.from('pinned_chats').insert({ user_id: user.id, seller_id: sellerId });
      setPinnedChats(prev => [...prev, sellerId]);
    }
  };

  // ── Snooze (client-side) ──
  const handleSnooze = (sellerId: string, until: Date) => {
    setSnoozedSellers(prev => ({ ...prev, [sellerId]: until.toISOString() }));
    setShowSnoozeMenu(false);
    toast.success('Snoozed until ' + format(until, 'MMM dd, hh:mm a'));
  };

  // ── Save chat settings ──
  const saveChatSettings = async (newSettings: ChatSettingsData) => {
    if (!user) return;
    setChatSettings(newSettings);
    await supabase.from('chat_settings').upsert({ user_id: user.id, ...newSettings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/bg-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('chat-attachments').upload(path, file);
    if (error) { toast.error('Upload failed'); return; }
    const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path);
    saveChatSettings({ ...chatSettings, bg_image_url: data.publicUrl });
  };

  const chatSearchResults = chatSearch.trim() ? messages.filter(m => m.message.toLowerCase().includes(chatSearch.toLowerCase())) : [];

  const filteredTickets = tickets
    .filter(t => t.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) || t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aPinned = pinnedChats.includes(a.id);
      const bPinned = pinnedChats.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      const aSnoozed = !!snoozedSellers[a.id];
      const bSnoozed = !!snoozedSellers[b.id];
      if (aSnoozed && !bSnoozed) return 1;
      if (!aSnoozed && bSnoozed) return -1;
      const timeA = new Date(a.lastMessageTime).getTime();
      const timeB = new Date(b.lastMessageTime).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

  const fontSize = chatSettings.font_size === 'small' ? '13px' : chatSettings.font_size === 'large' ? '16px' : '14px';
  const bubbleRadius = chatSettings.bubble_style === 'sharp' ? '4px' : chatSettings.bubble_style === 'minimal' ? '0px' : '12px';

  if (loading) return <div className="flex items-center justify-center h-[calc(100vh-120px)]"><Loader2 className="w-8 h-8 animate-spin" style={{ color: '#64748b' }} /></div>;

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[600px]" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '14px', lineHeight: '1.5', color: '#0f172a' }}>
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.zip,.txt" />
      <input type="file" ref={bgUploadRef} className="hidden" accept="image/*" onChange={handleBgUpload} />

      {/* ── Conversation List Sidebar ── */}
      <aside className={cn("w-full lg:w-[320px] border-r flex-col flex-shrink-0", activeTicketId ? "hidden lg:flex" : "flex")} style={{ borderColor: '#e2e8f0', background: '#fff' }}>
        <div style={{ padding: '24px 20px 16px' }}>
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold" style={{ fontSize: '15px' }}>Chats {tickets.length}</span>
            <button onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')} className="flex items-center gap-1 cursor-pointer" style={{ fontSize: '13px', color: '#64748b' }}>
              {sortOrder === 'newest' ? 'Newest' : 'Oldest'} <ChevronDown size={14} />
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#64748b' }} />
            <input type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 rounded-lg pl-[38px] pr-3 outline-none" style={{ border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a' }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          {filteredTickets.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-4" style={{ color: '#cbd5e1' }} />
                <p className="font-semibold mb-1" style={{ fontSize: '15px', color: '#475569' }}>No conversations yet</p>
                <p style={{ color: '#94a3b8', fontSize: '13px' }}>Browse the marketplace to start chatting with sellers</p>
              </div>
            </div>
          ) : filteredTickets.map((ticket) => (
            <div key={ticket.id} onClick={() => setActiveTicketId(ticket.id)} className={cn("flex gap-3 p-4 rounded-lg cursor-pointer mb-1 transition-colors relative group", activeTicketId === ticket.id ? "border" : "border border-transparent hover:bg-[#f8fafc]")} style={activeTicketId === ticket.id ? { backgroundColor: '#eff6ff', borderColor: '#dbeafe' } : {}}>
              {pinnedChats.includes(ticket.id) && <Pin size={10} className="absolute top-2 right-2" style={{ color: '#2563eb' }} />}
              {snoozedSellers[ticket.id] && <Clock size={10} className="absolute top-2 right-6" style={{ color: '#f59e0b' }} />}
              {ticket.sellerAvatar ? <img src={ticket.sellerAvatar} className="w-10 h-10 rounded-full object-cover flex-shrink-0" style={{ background: '#e2e8f0' }} /> : <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white" style={{ background: '#2e3b5b', fontSize: '14px' }}><Store size={16} /></div>}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold" style={{ fontSize: '13px' }}>{ticket.sellerName}</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{format(new Date(ticket.lastMessageTime), 'hh:mm a')}</span>
                </div>
                <div className="font-medium mb-1" style={{ fontSize: '12px', color: '#64748b' }}>{ticket.ticketNumber}</div>
                <div className="font-medium truncate" style={{ fontSize: '13px' }}>{ticket.lastMessage}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handlePinChat(ticket.id); }} className="opacity-0 group-hover:opacity-100 absolute bottom-2 right-2 p-1 rounded" style={{ color: pinnedChats.includes(ticket.id) ? '#2563eb' : '#94a3b8' }}><Pin size={12} /></button>
              {ticket.unreadCount > 0 && <div className="flex flex-col justify-end"><div className="flex items-center justify-center font-semibold text-white rounded-[9px]" style={{ background: '#ef4444', fontSize: '11px', height: '18px', minWidth: '18px', padding: '0 5px' }}>{ticket.unreadCount}</div></div>}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Chat Area ── */}
      <main className={cn("flex-1 flex flex-col min-w-0", !activeTicketId ? "hidden lg:flex" : "flex")} style={{ background: '#ffffff' }}>
        {!activeTicket ? (
          <div className="flex-1 flex items-center justify-center" style={{ color: '#94a3b8' }}>
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-4" style={{ color: '#cbd5e1' }} />
              <p className="font-semibold mb-1" style={{ fontSize: '16px', color: '#475569' }}>Select a conversation</p>
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>Choose a chat from the sidebar to continue</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <header className="flex items-center justify-between flex-shrink-0 px-4 md:px-8" style={{ height: '72px', borderBottom: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer lg:hidden" style={{ border: '1px solid #e2e8f0' }} onClick={() => setActiveTicketId(null)}><ChevronLeft size={18} /></div>
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ fontSize: '15px' }}>{activeTicket.sellerName}</span>
                  <span style={{ color: '#64748b' }}>•</span>
                  <span className="truncate max-w-[200px] md:max-w-[300px]" style={{ color: '#64748b', fontSize: '14px' }}>{activeTicket.ticketNumber}</span>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-[10px]">
                <button onClick={() => setShowChatSearch(!showChatSearch)} className="w-9 h-9 flex items-center justify-center cursor-pointer rounded-lg" style={{ border: '1px solid #e2e8f0' }}><Search size={16} style={{ color: '#64748b' }} /></button>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer" style={{ border: '1px solid #e2e8f0' }}><Sparkles size={16} style={{ color: '#f97316' }} /></div>
                <div className="relative">
                  <button onClick={() => setShowSnoozeMenu(!showSnoozeMenu)} className="h-9 px-4 rounded-lg flex items-center gap-2 font-medium cursor-pointer" style={{ border: '1px solid #e2e8f0', background: 'white', fontSize: '13px' }}><Moon size={16} /> Snooze</button>
                  {showSnoozeMenu && (
                    <div className="absolute right-0 top-11 w-48 rounded-lg shadow-lg z-50 py-1" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                      {[{ label: '1 hour', fn: () => handleSnooze(activeTicketId!, addHours(new Date(), 1)) }, { label: '4 hours', fn: () => handleSnooze(activeTicketId!, addHours(new Date(), 4)) }, { label: 'Tomorrow 9am', fn: () => { const t = startOfTomorrow(); t.setHours(9); handleSnooze(activeTicketId!, t); } }, { label: 'Next week', fn: () => handleSnooze(activeTicketId!, addDays(new Date(), 7)) }].map(opt => (
                        <button key={opt.label} onClick={opt.fn} className="w-full text-left px-4 py-2 hover:bg-[#f1f5f9]" style={{ fontSize: '13px' }}>{opt.label}</button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setShowDetailsPanel(p => !p)} className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer" style={{ border: '1px solid #e2e8f0' }}>{showDetailsPanel ? <PanelRightClose size={16} style={{ color: '#64748b' }} /> : <PanelRightOpen size={16} style={{ color: '#64748b' }} />}</button>
              </div>
            </header>

            {/* Chat Search Bar */}
            {showChatSearch && (
              <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <Search size={14} style={{ color: '#64748b' }} />
                <input type="text" placeholder="Search messages..." value={chatSearch} onChange={(e) => { setChatSearch(e.target.value); setChatSearchIndex(0); }} className="flex-1 outline-none bg-transparent" style={{ fontSize: '13px' }} autoFocus />
                {chatSearchResults.length > 0 && <span style={{ fontSize: '12px', color: '#64748b' }}>{chatSearchIndex + 1}/{chatSearchResults.length}</span>}
                <button onClick={() => setChatSearchIndex(i => Math.max(0, i - 1))}><ArrowUp size={14} style={{ color: '#64748b' }} /></button>
                <button onClick={() => setChatSearchIndex(i => Math.min(chatSearchResults.length - 1, i + 1))}><ArrowDown size={14} style={{ color: '#64748b' }} /></button>
                <button onClick={() => { setShowChatSearch(false); setChatSearch(''); }}><X size={14} style={{ color: '#64748b' }} /></button>
              </div>
            )}

            {/* Pinned Messages Bar */}
            {pinnedMessages.length > 0 && (
              <div className="px-4 py-2 cursor-pointer flex items-center gap-2" style={{ borderBottom: '1px solid #e2e8f0', background: '#fefce8' }} onClick={() => setShowPinnedBar(!showPinnedBar)}>
                <Pin size={12} style={{ color: '#ca8a04' }} />
                <span style={{ fontSize: '12px', color: '#854d0e' }}>{pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? 's' : ''}</span>
                {showPinnedBar ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </div>
            )}
            {showPinnedBar && pinnedMessages.length > 0 && (
              <div className="px-4 py-2 max-h-32 overflow-y-auto" style={{ background: '#fffbeb', borderBottom: '1px solid #e2e8f0' }}>
                {messages.filter(m => pinnedMessages.includes(m.id)).map(m => (
                  <div key={m.id} className="flex items-center justify-between py-1" style={{ fontSize: '12px' }}>
                    <span className="truncate flex-1">{m.message}</span>
                    <button onClick={() => handlePinMessage(m.id)} style={{ color: '#dc2626', fontSize: '11px' }}>Unpin</button>
                  </div>
                ))}
              </div>
            )}

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6" style={{
              background: chatSettings.bg_image_url ? `url(${chatSettings.bg_image_url}) center/cover` : (chatSettings.bg_color || currentTheme.chatBg),
              fontSize,
            }}>
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center" style={{ color: '#94a3b8' }}><div className="text-center"><MessageCircle size={32} className="mx-auto mb-2" /><p style={{ fontSize: '13px' }}>No messages yet. Start the conversation!</p></div></div>
              ) : messages.map((msg) => {
                const isMe = msg.sender_type === 'buyer';
                const isHighlighted = chatSearch && msg.message.toLowerCase().includes(chatSearch.toLowerCase());
                const isCurrentSearch = chatSearchResults[chatSearchIndex]?.id === msg.id;
                return (
                  <div key={msg.id} className={cn("flex gap-4 relative group", isMe ? "self-end flex-row-reverse" : "")} style={{ maxWidth: '80%' }}
                    onContextMenu={(e) => { e.preventDefault(); setContextMenuMsg(msg.id); setContextMenuPos({ x: e.clientX, y: e.clientY }); }}>
                    {pinnedMessages.includes(msg.id) && <Pin size={10} className="absolute -top-2 right-0" style={{ color: '#ca8a04' }} />}
                    {isMe ? <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white" style={{ background: '#2563eb' }}><User size={16} /></div>
                    : activeTicket.sellerAvatar ? <img src={activeTicket.sellerAvatar} className="w-9 h-9 rounded-full flex-shrink-0 object-cover" />
                    : <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white" style={{ background: '#2e3b5b', fontSize: '14px' }}><Store size={16} /></div>}
                    <div className={cn("flex flex-col gap-[6px]", isMe ? "items-end" : "")}>
                      <div className="font-semibold" style={{ fontSize: '13px' }}>{isMe ? 'You' : activeTicket.sellerName}</div>
                      <div className="px-[18px] py-[14px] whitespace-pre-wrap break-words" style={{
                        lineHeight: '1.6', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', borderRadius: bubbleRadius,
                        ...(isMe ? { background: currentTheme.userBubble, color: currentTheme.userText } : { background: currentTheme.otherBubble, color: currentTheme.otherText }),
                        ...(isHighlighted ? { outline: '2px solid #f59e0b' } : {}),
                        ...(isCurrentSearch ? { outline: '3px solid #ef4444' } : {}),
                      }}>
                        {msg.is_voice_note && msg.attachment_url ? <audio controls src={msg.attachment_url} style={{ maxWidth: '240px' }} />
                        : msg.attachment_url ? (
                          <div>
                            {msg.attachment_type?.startsWith('image/') ? <img src={msg.attachment_url} alt={msg.attachment_name || 'Image'} className="rounded-lg max-w-[240px] max-h-[180px] object-cover cursor-pointer mb-2" onClick={() => window.open(msg.attachment_url!, '_blank')} />
                            : <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg mb-2" style={{ background: 'rgba(0,0,0,0.05)' }}><FileText size={16} /> <span style={{ fontSize: '12px' }}>{msg.attachment_name || 'File'}</span> <Download size={14} /></a>}
                            {msg.message && !msg.message.startsWith('📎') && !msg.message.startsWith('🎤') && <div>{msg.message}</div>}
                          </div>
                        ) : msg.message}
                      </div>
                      <div className="flex items-center gap-[6px]" style={{ fontSize: '11px', color: '#64748b' }}>{format(new Date(msg.created_at), 'hh:mm a')}</div>
                    </div>
                    <button onClick={() => handlePinMessage(msg.id)} className="opacity-0 group-hover:opacity-100 self-center p-1 rounded" style={{ color: pinnedMessages.includes(msg.id) ? '#ca8a04' : '#94a3b8' }}><Pin size={12} /></button>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Context Menu */}
            {contextMenuMsg && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setContextMenuMsg(null)} />
                <div className="fixed z-50 rounded-lg shadow-lg py-1" style={{ left: contextMenuPos.x, top: contextMenuPos.y, background: '#fff', border: '1px solid #e2e8f0', minWidth: '140px' }}>
                  <button onClick={() => handlePinMessage(contextMenuMsg)} className="w-full text-left px-4 py-2 hover:bg-[#f1f5f9] flex items-center gap-2" style={{ fontSize: '13px' }}>
                    <Pin size={14} /> {pinnedMessages.includes(contextMenuMsg) ? 'Unpin' : 'Pin message'}
                  </button>
                </div>
              </>
            )}

            {/* Chat Input */}
            <div style={{ padding: '16px 16px', borderTop: '1px solid #e2e8f0' }}>
              {isRecording ? (
                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ border: '1px solid #ef4444', background: '#fef2f2' }}>
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>Recording... {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}</span>
                  <div className="flex-1" />
                  <button onClick={cancelRecording} className="p-2 rounded-lg hover:bg-red-100"><X size={18} style={{ color: '#ef4444' }} /></button>
                  <button onClick={stopRecording} className="p-2 rounded-lg text-white" style={{ background: '#ef4444' }}><Square size={18} /></button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 p-4 rounded-xl" style={{ border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <textarea ref={textareaRef} value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Type messages here .." className="w-full border-none outline-none resize-none" style={{ fontFamily: 'inherit', fontSize: '14px', minHeight: '48px', color: '#0f172a' }} disabled={sending || uploadingFile} />
                  <div className="flex justify-between items-center">
                    <div className="flex gap-4 relative" style={{ color: '#94a3b8' }}>
                      <Type size={18} className="cursor-pointer hover:text-[#0f172a] transition-colors" />
                      <Paperclip size={18} className={cn("cursor-pointer hover:text-[#0f172a] transition-colors", uploadingFile && "animate-spin")} onClick={() => fileInputRef.current?.click()} />
                      <div className="relative">
                        <Smile size={18} className="cursor-pointer hover:text-[#0f172a] transition-colors" onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
                        {showEmojiPicker && (
                          <div className="absolute bottom-8 left-0 w-[320px] h-[360px] rounded-xl shadow-xl z-50 flex flex-col" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                            <div className="p-2"><input type="text" placeholder="Search emoji..." value={emojiSearch} onChange={(e) => setEmojiSearch(e.target.value)} className="w-full h-8 rounded-lg px-3 outline-none" style={{ border: '1px solid #e2e8f0', fontSize: '12px' }} /></div>
                            <div className="flex gap-1 px-2 overflow-x-auto flex-shrink-0">
                              {['Recent', ...Object.keys(EMOJI_CATEGORIES)].map(cat => (
                                <button key={cat} onClick={() => setEmojiCategory(cat)} className={cn("px-2 py-1 rounded-md whitespace-nowrap", emojiCategory === cat ? 'bg-[#eff6ff] text-[#2563eb]' : '')} style={{ fontSize: '11px' }}>{cat}</button>
                              ))}
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 grid grid-cols-8 gap-1">
                              {(emojiCategory === 'Recent' ? JSON.parse(localStorage.getItem('recent-emojis') || '[]') : (EMOJI_CATEGORIES[emojiCategory] || []))
                                .filter((e: string) => !emojiSearch || e.includes(emojiSearch))
                                .map((emoji: string, i: number) => (
                                  <button key={`${emoji}-${i}`} onClick={() => insertEmoji(emoji)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#f1f5f9] text-lg">{emoji}</button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <Mic size={18} className="cursor-pointer hover:text-[#0f172a] transition-colors" onClick={startRecording} />
                    </div>
                    <button onClick={() => handleSend()} disabled={!messageText.trim() || sending} className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer text-white transition-colors disabled:opacity-50" style={{ background: '#0f172a' }}>
                      {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ── Details Panel ── */}
      {activeTicket && showDetailsPanel && (
        <aside className="w-[300px] border-l flex-col hidden xl:flex flex-shrink-0" style={{ borderColor: '#e2e8f0', background: '#fff' }}>
          <div className="flex justify-between items-center p-6">
            <span className="font-semibold" style={{ fontSize: '16px' }}>Conversation details</span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white cursor-pointer" style={{ background: '#2563eb' }}><PenLine size={14} /></div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="mb-5 text-center">
              {activeTicket.sellerAvatar ? <img src={activeTicket.sellerAvatar} className="w-16 h-16 rounded-full object-cover mx-auto mb-3" style={{ background: '#e2e8f0' }} /> : <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold" style={{ background: '#2e3b5b', fontSize: '24px' }}><Store size={28} /></div>}
              <div className="font-semibold" style={{ fontSize: '15px' }}>{activeTicket.sellerName}</div>
              {activeTicket.sellerStoreName && <div style={{ fontSize: '12px', color: '#64748b' }}>{activeTicket.sellerStoreName}</div>}
            </div>
            <div className="mb-5"><label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Status</label><div className="w-full px-3 py-[10px] rounded-lg flex items-center gap-2" style={{ border: '1px solid #e2e8f0', fontSize: '13px' }}><div className="w-[6px] h-[6px] rounded-full" style={{ background: '#22c55e' }} />Active</div></div>
            <div className="mb-5"><label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Attributes</label><div className="rounded-lg p-4" style={{ background: '#f8fafc' }}>{[{ key: 'Chat', val: activeTicket.ticketNumber }, { key: 'Seller', val: activeTicket.sellerName }, { key: 'Last active', val: format(new Date(activeTicket.lastMessageTime), 'dd MMM yyyy, HH:mm') }].map((attr, i, arr) => (<div key={attr.key} className="flex justify-between items-center" style={{ fontSize: '12px', marginBottom: i < arr.length - 1 ? '12px' : 0 }}><span style={{ color: '#64748b' }}>{attr.key}</span><span className="font-semibold text-right max-w-[140px] truncate">{attr.val}</span></div>))}</div></div>
            {/* Editable Note */}
            <div>
              <label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Note</label>
              {editingNote ? (
                <div>
                  <textarea value={currentNoteText} onChange={(e) => setCurrentNoteText(e.target.value)} className="w-full p-3 rounded-lg outline-none resize-none" style={{ background: '#f8fafc', border: '1px solid #2563eb', fontSize: '12px', minHeight: '60px' }} autoFocus />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => { setNoteTexts(prev => ({ ...prev, [activeTicket.id]: currentNoteText })); setEditingNote(false); toast.success('Note saved'); }} className="px-3 py-1 rounded text-white" style={{ background: '#2563eb', fontSize: '11px' }}>Save</button>
                    <button onClick={() => setEditingNote(false)} className="px-3 py-1 rounded" style={{ border: '1px solid #e2e8f0', fontSize: '11px' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div onClick={() => { setEditingNote(true); setCurrentNoteText(noteTexts[activeTicket.id] || ''); }} className="p-3 rounded-lg cursor-pointer hover:border-[#2563eb]" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', minHeight: '40px' }}>
                  {noteTexts[activeTicket.id] || 'Click to add notes...'}
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ── Right Toolbar Strip ── */}
      <div className="w-14 border-l flex-col items-center py-6 gap-6 hidden xl:flex flex-shrink-0" style={{ borderColor: '#e2e8f0', background: '#ffffff' }}>
        {[
          { icon: <Shuffle size={16} />, active: true, onClick: () => {} },
          { icon: <MessageSquarePlus size={18} />, active: false, onClick: () => {} },
          { icon: <BookOpen size={18} />, active: false, onClick: () => {} },
          { icon: <Settings size={18} />, active: showSettings, onClick: () => setShowSettings(!showSettings) },
        ].map((btn, i) => (
          <div key={i} onClick={btn.onClick} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all" style={btn.active ? { background: '#2563eb', color: 'white' } : { color: '#64748b' }}>{btn.icon}</div>
        ))}
      </div>

      {/* ── Settings Modal ── */}
      {showSettings && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowSettings(false)} />
          <div className="fixed right-20 top-20 w-[340px] rounded-xl shadow-2xl z-50 p-6" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="flex justify-between items-center mb-6"><span className="font-semibold" style={{ fontSize: '16px' }}>Chat Settings</span><X size={18} className="cursor-pointer" style={{ color: '#64748b' }} onClick={() => setShowSettings(false)} /></div>
            <div className="mb-5"><label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Theme</label><div className="grid grid-cols-3 gap-2">{Object.entries(THEME_PRESETS).map(([key, theme]) => (<button key={key} onClick={() => saveChatSettings({ ...chatSettings, theme: key })} className={cn("p-2 rounded-lg text-center", chatSettings.theme === key ? 'ring-2 ring-blue-500' : '')} style={{ border: '1px solid #e2e8f0', fontSize: '11px' }}><div className="w-full h-6 rounded mb-1" style={{ background: theme.chatBg, border: '1px solid #e2e8f0' }} />{theme.label}</button>))}</div></div>
            <div className="mb-5"><label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Background Image</label><div className="flex gap-2"><button onClick={() => bgUploadRef.current?.click()} className="flex-1 h-9 rounded-lg flex items-center justify-center gap-1" style={{ border: '1px solid #e2e8f0', fontSize: '12px' }}><ImageIcon size={14} /> Upload</button>{chatSettings.bg_image_url && <button onClick={() => saveChatSettings({ ...chatSettings, bg_image_url: null })} className="h-9 px-3 rounded-lg" style={{ border: '1px solid #e2e8f0', fontSize: '12px', color: '#ef4444' }}>Remove</button>}</div></div>
            <div className="mb-5"><label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Bubble Style</label><div className="flex gap-2">{['rounded', 'sharp', 'minimal'].map(style => (<button key={style} onClick={() => saveChatSettings({ ...chatSettings, bubble_style: style })} className={cn("flex-1 py-2 rounded-lg capitalize", chatSettings.bubble_style === style ? 'ring-2 ring-blue-500' : '')} style={{ border: '1px solid #e2e8f0', fontSize: '12px' }}>{style}</button>))}</div></div>
            <div className="mb-5"><label className="block font-medium mb-2" style={{ fontSize: '13px' }}>Font Size</label><div className="flex gap-2">{['small', 'medium', 'large'].map(size => (<button key={size} onClick={() => saveChatSettings({ ...chatSettings, font_size: size })} className={cn("flex-1 py-2 rounded-lg capitalize", chatSettings.font_size === size ? 'ring-2 ring-blue-500' : '')} style={{ border: '1px solid #e2e8f0', fontSize: '12px' }}>{size}</button>))}</div></div>
            <div className="flex items-center justify-between"><label className="font-medium" style={{ fontSize: '13px' }}>Notification Sound</label><button onClick={() => saveChatSettings({ ...chatSettings, notification_sound: !chatSettings.notification_sound })} className="w-10 h-6 rounded-full relative transition-colors" style={{ background: chatSettings.notification_sound ? '#2563eb' : '#e2e8f0' }}><div className="w-4 h-4 rounded-full bg-white absolute top-1 transition-transform" style={{ left: chatSettings.notification_sound ? '22px' : '4px' }} /></button></div>
          </div>
        </>
      )}

      {showEmojiPicker && <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />}
      {showSnoozeMenu && <div className="fixed inset-0 z-30" onClick={() => setShowSnoozeMenu(false)} />}
    </div>
  );
};

export default ChatSection;
