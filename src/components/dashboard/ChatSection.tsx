import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Send, Loader2, Image, Video, Paperclip, 
  X, Download, FileText, StopCircle, Circle, Headphones, Store, ArrowLeft, Search, AlertTriangle,
  Home, Bell, Settings, LogOut, Phone, MoreVertical, CheckCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { playSound } from '@/lib/sounds';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Types
interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  sender_type: string;
  is_read: boolean | null;
  created_at: string | null;
}

interface SellerMessage {
  id: string;
  buyer_id: string;
  seller_id: string;
  message: string;
  sender_type: string;
  is_read: boolean | null;
  created_at: string | null;
  product_id: string | null;
}

interface ChatAttachment {
  id: string;
  message_id: string | null;
  user_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
}

interface Conversation {
  id: string;
  type: 'support' | 'seller';
  name: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string | null;
  unreadCount: number;
  sellerId?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Sidebar Icon Component
const SidebarIcon = ({ icon: Icon, active, onClick, label }: { 
  icon: React.ElementType; 
  active?: boolean; 
  onClick?: () => void;
  label?: string;
}) => (
  <button
    onClick={onClick}
    title={label}
    className={`p-3 rounded-xl cursor-pointer transition-all ${
      active ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
    }`}
  >
    <Icon size={22} />
  </button>
);

// Chat List Item Component
const ChatListItem = ({ 
  avatar, 
  icon,
  name, 
  lastMessage, 
  time, 
  unread,
  isRead,
  active,
  onClick 
}: { 
  avatar?: string;
  icon?: React.ReactNode;
  name: string; 
  lastMessage: string; 
  time: string;
  unread?: number;
  isRead?: boolean;
  active?: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors text-left ${
      active ? 'bg-gray-100' : 'hover:bg-gray-50'
    }`}
  >
    <div className="relative">
      {avatar ? (
        <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
      ) : icon ? (
        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
          {icon}
        </div>
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline mb-0.5">
        <h4 className="text-sm font-semibold text-gray-800 truncate">{name}</h4>
        <span className="text-[10px] text-gray-400 whitespace-nowrap">{time}</span>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500 truncate pr-2">{lastMessage}</p>
        {unread && unread > 0 ? (
          <span className="flex items-center justify-center min-w-[16px] h-4 px-1 bg-black text-white text-[10px] rounded-full font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : isRead ? (
          <CheckCheck size={14} className="text-blue-500 flex-shrink-0" />
        ) : null}
      </div>
    </div>
  </button>
);

// Message Bubble Component
const MessageBubble = ({ 
  text, 
  time, 
  sent,
  senderLabel,
  attachments 
}: { 
  text: string; 
  time: string; 
  sent: boolean;
  senderLabel?: string;
  attachments?: React.ReactNode;
}) => (
  <div className={`flex flex-col mb-4 ${sent ? 'items-end' : 'items-start'}`}>
    {senderLabel && (
      <p className={`text-[10px] text-gray-400 mb-1 px-2 ${sent ? 'text-right' : 'text-left'}`}>
        {senderLabel}
      </p>
    )}
    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
      sent ? 'bg-black text-white rounded-tr-sm' : 'bg-[#F3F4F6] text-gray-800 rounded-tl-sm'
    }`}>
      <p className="whitespace-pre-wrap break-words">{text}</p>
      {attachments}
    </div>
    <span className="text-[10px] text-gray-400 mt-1">{time}</span>
  </div>
);

const ChatSection = () => {
  const { user } = useAuthContext();
  
  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Messages state
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [sellerMessages, setSellerMessages] = useState<SellerMessage[]>([]);
  const [attachments, setAttachments] = useState<Map<string, ChatAttachment[]>>(new Map());
  
  // Input state
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  // Screen Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mobile view state
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch all conversations
  useEffect(() => {
    if (user) {
      fetchConversations();
      
      const supportChannel = supabase
        .channel('support-messages-multichat')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          fetchConversations();
          if (selectedConversation?.type === 'support') {
            fetchSupportMessages();
          }
        })
        .subscribe();
      
      const sellerChannel = supabase
        .channel('seller-chats-multichat')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'seller_chats',
          filter: `buyer_id=eq.${user.id}`,
        }, () => {
          fetchConversations();
          if (selectedConversation?.type === 'seller') {
            fetchSellerMessages(selectedConversation.sellerId!);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(supportChannel);
        supabase.removeChannel(sellerChannel);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
      };
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      if (selectedConversation.type === 'support') {
        fetchSupportMessages();
      } else if (selectedConversation.sellerId) {
        fetchSellerMessages(selectedConversation.sellerId);
      }
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [supportMessages, sellerMessages]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const convos: Conversation[] = [];
      
      const { data: supportData } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      const { count: supportUnread } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('sender_type', 'admin')
        .eq('is_read', false);
      
      convos.push({
        id: 'support',
        type: 'support',
        name: 'Uptoza Support',
        lastMessage: supportData?.[0]?.message || 'Start a conversation...',
        lastMessageTime: supportData?.[0]?.created_at || null,
        unreadCount: supportUnread || 0,
      });
      
      const { data: sellerChats } = await supabase
        .from('seller_chats')
        .select('seller_id, message, created_at, is_read, sender_type')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (sellerChats && sellerChats.length > 0) {
        const sellerGroups = new Map<string, { lastMessage: string; lastTime: string; unread: number }>();
        
        sellerChats.forEach(chat => {
          if (!sellerGroups.has(chat.seller_id)) {
            sellerGroups.set(chat.seller_id, {
              lastMessage: chat.message,
              lastTime: chat.created_at || '',
              unread: 0
            });
          }
          if (chat.sender_type === 'seller' && !chat.is_read) {
            const group = sellerGroups.get(chat.seller_id)!;
            group.unread++;
          }
        });
        
        const sellerIds = Array.from(sellerGroups.keys());
        const { data: sellerProfiles } = await supabase
          .from('seller_profiles')
          .select('id, store_name, store_logo_url')
          .in('id', sellerIds);
        
        if (sellerProfiles) {
          sellerProfiles.forEach(seller => {
            const group = sellerGroups.get(seller.id);
            if (group) {
              convos.push({
                id: `seller-${seller.id}`,
                type: 'seller',
                name: seller.store_name,
                avatar: seller.store_logo_url || undefined,
                lastMessage: group.lastMessage,
                lastMessageTime: group.lastTime,
                unreadCount: group.unread,
                sellerId: seller.id,
              });
            }
          });
        }
      }
      
      convos.sort((a, b) => {
        if (a.type === 'support' && !a.lastMessageTime) return -1;
        if (b.type === 'support' && !b.lastMessageTime) return 1;
        return new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime();
      });
      
      setConversations(convos);
      
      if (!selectedConversation && convos.length > 0) {
        setSelectedConversation(convos[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSupportMessages(data || []);
      
      if (data && data.length > 0) {
        const messageIds = data.map(m => m.id);
        const { data: attachmentData } = await supabase
          .from('chat_attachments')
          .select('*')
          .in('message_id', messageIds);
        
        if (attachmentData) {
          const attachmentMap = new Map<string, ChatAttachment[]>();
          attachmentData.forEach(att => {
            const existing = attachmentMap.get(att.message_id || '') || [];
            attachmentMap.set(att.message_id || '', [...existing, att]);
          });
          setAttachments(attachmentMap);
        }
      }
      
      await supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('sender_type', 'admin')
        .eq('is_read', false);
        
    } catch (error) {
      console.error('Error fetching support messages:', error);
    }
  };

  const fetchSellerMessages = async (sellerId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('seller_chats')
        .select('*')
        .eq('buyer_id', user.id)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSellerMessages(data || []);
      
      await supabase
        .from('seller_chats')
        .update({ is_read: true })
        .eq('buyer_id', user.id)
        .eq('seller_id', sellerId)
        .eq('sender_type', 'seller')
        .eq('is_read', false);
        
      fetchConversations();
    } catch (error) {
      console.error('Error fetching seller messages:', error);
    }
  };

  const uploadFile = async (file: File): Promise<ChatAttachment | null> => {
    if (!user) return null;
    
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File ${file.name} is too large. Max size is 50MB.`);
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    let fileType: 'image' | 'video' | 'file' = 'file';
    if (file.type.startsWith('image/')) fileType = 'image';
    else if (file.type.startsWith('video/')) fileType = 'video';

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast.error(`Failed to upload ${file.name}`);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(fileName);

    return {
      id: '',
      message_id: null,
      user_id: user.id,
      file_url: publicUrl,
      file_type: fileType,
      file_name: file.name,
      file_size: file.size,
      created_at: new Date().toISOString()
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && pendingFiles.length === 0) return;
    if (!user || sendingMessage || !selectedConversation) return;

    setSendingMessage(true);
    setUploadingFile(pendingFiles.length > 0);
    
    try {
      if (selectedConversation.type === 'support') {
        const { data: messageData, error: messageError } = await supabase
          .from('support_messages')
          .insert({
            user_id: user.id,
            message: newMessage.trim() || (pendingFiles.length > 0 ? `[${pendingFiles.length} attachment(s)]` : ''),
            sender_type: 'user',
            is_read: false,
          })
          .select()
          .single();

        if (messageError) throw messageError;

        for (const file of pendingFiles) {
          const attachment = await uploadFile(file);
          if (attachment && messageData) {
            await supabase.from('chat_attachments').insert({
              message_id: messageData.id,
              user_id: user.id,
              file_url: attachment.file_url,
              file_type: attachment.file_type,
              file_name: attachment.file_name,
              file_size: attachment.file_size
            });
          }
        }
        
        fetchSupportMessages();
      } else if (selectedConversation.sellerId) {
        const { error: messageError } = await supabase
          .from('seller_chats')
          .insert({
            buyer_id: user.id,
            seller_id: selectedConversation.sellerId,
            message: newMessage.trim(),
            sender_type: 'buyer',
            is_read: false,
          });

        if (messageError) throw messageError;
        fetchSellerMessages(selectedConversation.sellerId);
      }

      playSound('messageSent');
      setNewMessage('');
      setPendingFiles([]);
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
      setUploadingFile(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large. Max 50MB.`);
        return false;
      }
      return true;
    });
    
    setPendingFiles(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    if (!user || selectedConversation?.type !== 'support') return;
    
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' } as any,
        audio: true
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
          ? 'video/webm;codecs=vp9' 
          : 'video/webm'
      });
      
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingTime(0);
        
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `screen-recording-${Date.now()}.webm`, { type: 'video/webm' });
        
        await uploadAndSendRecording(file);
        stream.getTracks().forEach(track => track.stop());
      };
      
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        setIsRecording(false);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success('Screen recording started!');
    } catch (error) {
      console.error('Screen recording error:', error);
      toast.error('Failed to start screen recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info('Processing recording...');
    }
  };

  const uploadAndSendRecording = async (file: File) => {
    if (!user) return;
    
    setUploadingFile(true);
    setSendingMessage(true);
    
    try {
      const attachment = await uploadFile(file);
      
      if (attachment) {
        const { data: messageData, error: messageError } = await supabase
          .from('support_messages')
          .insert({
            user_id: user.id,
            message: '🎥 Screen Recording',
            sender_type: 'user',
            is_read: false,
          })
          .select()
          .single();

        if (messageError) throw messageError;

        await supabase.from('chat_attachments').insert({
          message_id: messageData.id,
          user_id: user.id,
          file_url: attachment.file_url,
          file_type: 'video',
          file_name: file.name,
          file_size: file.size
        });

        playSound('messageSent');
        toast.success('Screen recording sent!');
        fetchSupportMessages();
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending recording:', error);
      toast.error('Failed to send recording');
    } finally {
      setUploadingFile(false);
      setSendingMessage(false);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderAttachment = (att: ChatAttachment) => {
    if (att.file_type === 'image') {
      return (
        <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
          <img 
            src={att.file_url} 
            alt={att.file_name} 
            className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
          />
        </a>
      );
    }
    
    if (att.file_type === 'video') {
      return (
        <div className="relative max-w-[280px] mt-2">
          <video 
            src={att.file_url} 
            controls 
            className="rounded-lg max-h-[200px] w-full"
          />
        </div>
      );
    }
    
    return (
      <a 
        href={att.file_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors mt-2"
      >
        <FileText size={18} />
        <span className="text-sm truncate max-w-[150px]">{att.file_name}</span>
        <Download size={14} />
      </a>
    );
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = selectedConversation?.type === 'support' ? supportMessages : sellerMessages;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const handleConversationSelect = (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowChatOnMobile(true);
    setNewMessage('');
    setPendingFiles([]);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-[24px] shadow-2xl overflow-hidden">
      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
      <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleFileSelect} />
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

      {/* Left Icon Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex w-[80px] bg-black flex-col items-center py-8 gap-6">
        {/* User Avatar */}
        <div className="mb-4">
          <Avatar className="w-10 h-10 border-2 border-white shadow-md">
            <AvatarFallback className="bg-gray-700 text-white">
              {user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Navigation Icons */}
        <div className="flex flex-col gap-3 flex-1">
          <SidebarIcon icon={Home} label="Home" />
          <SidebarIcon icon={MessageCircle} active label="Messages" />
          <SidebarIcon icon={Bell} label="Notifications" />
          <SidebarIcon icon={Settings} label="Settings" />
        </div>
        
        {/* Logout at bottom */}
        <div className="mt-auto">
          <SidebarIcon icon={LogOut} label="Logout" />
        </div>
      </div>

      {/* Conversations List - w-[320px] */}
      <div className={cn(
        "w-full lg:w-[320px] bg-white border-r border-gray-100 flex flex-col",
        showChatOnMobile && "hidden lg:flex"
      )}>
        {/* Search Header */}
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8FAFC] border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-black/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-4 chat-scrollbar">
          {/* Support Section */}
          <section className="mb-6">
            <h3 className="text-sm font-bold text-gray-800 px-2 mb-3">Support</h3>
            <div className="flex flex-col gap-1">
              {filteredConversations.filter(c => c.type === 'support').map(conv => (
                <ChatListItem
                  key={conv.id}
                  icon={<Headphones size={18} className="text-white" />}
                  name={conv.name}
                  lastMessage={conv.lastMessage}
                  time={conv.lastMessageTime ? format(new Date(conv.lastMessageTime), 'h:mm a') : ''}
                  unread={conv.unreadCount}
                  active={selectedConversation?.id === conv.id}
                  onClick={() => handleConversationSelect(conv)}
                />
              ))}
            </div>
          </section>

          {/* Sellers Section */}
          {filteredConversations.filter(c => c.type === 'seller').length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-800 px-2 mb-3">Sellers</h3>
              <div className="flex flex-col gap-1">
                {filteredConversations.filter(c => c.type === 'seller').map(conv => (
                  <ChatListItem
                    key={conv.id}
                    avatar={conv.avatar}
                    icon={!conv.avatar ? <Store size={18} className="text-white" /> : undefined}
                    name={conv.name}
                    lastMessage={conv.lastMessage}
                    time={conv.lastMessageTime ? format(new Date(conv.lastMessageTime), 'h:mm a') : ''}
                    unread={conv.unreadCount}
                    active={selectedConversation?.id === conv.id}
                    onClick={() => handleConversationSelect(conv)}
                  />
                ))}
              </div>
            </section>
          )}

          {filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle size={40} className="text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area - flex-1 bg-[#F8FAFC] */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#F8FAFC]",
        !showChatOnMobile && "hidden lg:flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <header className="px-4 sm:px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Back button for mobile */}
                <button
                  onClick={() => setShowChatOnMobile(false)}
                  className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} className="text-gray-600" />
                </button>
                
                {selectedConversation.type === 'support' ? (
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <Headphones size={18} className="text-white" />
                  </div>
                ) : selectedConversation.avatar ? (
                  <img src={selectedConversation.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <Store size={18} className="text-white" />
                  </div>
                )}
                
                <div>
                  <h2 className="text-sm font-bold text-gray-800 leading-tight">{selectedConversation.name}</h2>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-tight">
                      {selectedConversation.type === 'support' ? 'Support Team' : 'Seller'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {selectedConversation.type === 'seller' && selectedConversation.sellerId && (
                  <button
                    onClick={async () => {
                      const reason = prompt('Please describe the issue you need help with:');
                      if (!reason) return;
                      
                      const { error } = await supabase.from('chat_join_requests').insert({
                        buyer_id: user?.id,
                        seller_id: selectedConversation.sellerId,
                        reason: reason,
                        description: `Requested support for chat with ${selectedConversation.name}`
                      });
                      
                      if (error) {
                        toast.error('Failed to request support');
                      } else {
                        toast.success('Support request sent!');
                      }
                    }}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <AlertTriangle size={14} />
                    <span className="hidden sm:inline">Request Support</span>
                  </button>
                )}
                <Phone size={20} className="text-black cursor-pointer hover:opacity-70 hidden sm:block" />
                <Video size={20} className="text-black cursor-pointer hover:opacity-70 hidden sm:block" />
                <MoreVertical size={20} className="text-gray-400 cursor-pointer hover:text-black" />
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 chat-scrollbar">
              {currentMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle size={48} className="text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm font-medium">No messages yet</p>
                  <p className="text-gray-400 text-xs mt-1">Start the conversation!</p>
                </div>
              ) : (
                selectedConversation.type === 'support' ? (
                  supportMessages.map((msg) => {
                    const isUser = msg.sender_type === 'user';
                    const messageAttachments = attachments.get(msg.id) || [];
                    
                    return (
                      <MessageBubble
                        key={msg.id}
                        text={msg.message}
                        time={msg.created_at ? format(new Date(msg.created_at), 'h:mm a') : ''}
                        sent={isUser}
                        senderLabel={isUser ? 'You' : '🛡️ Uptoza Support'}
                        attachments={messageAttachments.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            {messageAttachments.map(att => (
                              <div key={att.id}>{renderAttachment(att)}</div>
                            ))}
                          </div>
                        ) : undefined}
                      />
                    );
                  })
                ) : (
                  sellerMessages.map((msg) => {
                    const isBuyer = msg.sender_type === 'buyer';
                    
                    return (
                      <MessageBubble
                        key={msg.id}
                        text={msg.message}
                        time={msg.created_at ? format(new Date(msg.created_at), 'h:mm a') : ''}
                        sent={isBuyer}
                        senderLabel={isBuyer ? 'You' : selectedConversation.name}
                      />
                    );
                  })
                )
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Pending Files Preview */}
            {pendingFiles.length > 0 && (
              <div className="px-6 py-3 bg-white border-t border-gray-100">
                <div className="flex gap-2 flex-wrap">
                  {pendingFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      {file.type.startsWith('image/') ? (
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                          <FileText size={24} className="text-gray-400" />
                        </div>
                      )}
                      <button
                        onClick={() => removePendingFile(index)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Screen Recording Indicator */}
            {isRecording && (
              <div className="px-6 py-3 bg-red-50 border-t border-red-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Circle className="w-3 h-3 text-red-500 animate-pulse fill-current" />
                  <span className="text-sm text-red-700 font-medium">Recording... {formatRecordingTime(recordingTime)}</span>
                </div>
                <button
                  onClick={stopRecording}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <StopCircle size={16} />
                  Stop
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 sm:p-6 pt-2">
              <div className="bg-white rounded-2xl p-2 flex items-center gap-2 shadow-sm border border-gray-100">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-black transition-colors"
                  disabled={sendingMessage}
                >
                  <Paperclip size={20} />
                </button>
                
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  disabled={sendingMessage}
                  className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-gray-700 placeholder:text-gray-300 disabled:opacity-50"
                />
                
                <div className="flex items-center gap-1">
                  {/* Image button */}
                  <button 
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-black transition-colors hidden sm:block"
                    disabled={sendingMessage}
                  >
                    <Image size={20} />
                  </button>
                  
                  {/* Screen record button - only for support */}
                  {selectedConversation.type === 'support' && !isRecording && (
                    <button 
                      onClick={startRecording}
                      className="p-2 text-gray-400 hover:text-black transition-colors hidden sm:block"
                      disabled={sendingMessage}
                      title="Record Screen"
                    >
                      <Video size={20} />
                    </button>
                  )}
                  
                  {/* Send button */}
                  <button 
                    onClick={sendMessage}
                    disabled={(!newMessage.trim() && pendingFiles.length === 0) || sendingMessage}
                    className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
                  >
                    {sendingMessage ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <MessageCircle size={40} className="text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-gray-500 text-sm">Choose from your contacts to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSection;
