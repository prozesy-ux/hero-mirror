import { useState, useEffect, useRef } from 'react';
import { 
  Send, Loader2, Image, Video, Paperclip, 
  X, Download, FileText, StopCircle, Circle, Headphones, Store, ArrowLeft, Search, AlertTriangle,
  Phone, MoreVertical, MessageCircle, Film, ChevronDown
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
  
  // Screen Recording State (only for support chat)
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
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'support_messages',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchConversations();
            if (selectedConversation?.type === 'support') {
              fetchSupportMessages();
            }
          }
        )
        .subscribe();
      
      const sellerChannel = supabase
        .channel('seller-chats-multichat')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'seller_chats',
            filter: `buyer_id=eq.${user.id}`,
          },
          () => {
            fetchConversations();
            if (selectedConversation?.type === 'seller') {
              fetchSellerMessages(selectedConversation.sellerId!);
            }
          }
        )
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
        <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="block">
          <img 
            src={att.file_url} 
            alt={att.file_name} 
            className="w-[112px] h-[120px] rounded-[12px] object-cover"
          />
        </a>
      );
    }
    
    if (att.file_type === 'video') {
      return (
        <div className="relative max-w-[280px]">
          <video 
            src={att.file_url} 
            controls 
            className="rounded-[12px] max-h-[200px] w-full"
          />
        </div>
      );
    }
    
    return (
      <a 
        href={att.file_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 bg-[#f7f7fd] rounded-[12px] hover:bg-[#eeeef5] transition-colors"
      >
        <FileText size={18} className="text-[#757575]" />
        <span className="text-[14px] truncate max-w-[150px] text-[#000929] font-medium tracking-[-0.28px]">{att.file_name}</span>
        <Download size={14} className="text-[#757575]" />
      </a>
    );
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = selectedConversation?.type === 'support' ? supportMessages : sellerMessages;
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#bababa]" />
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
    <div className="flex h-[882px] lg:h-[calc(100vh-140px)] overflow-hidden bg-[#f7f7fd]">
      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
      <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleFileSelect} />
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

      {/* ========== CONTACTS SIDEBAR - Exact HTML Reference ========== */}
      <aside className={cn(
        "w-full lg:w-[400px] bg-white flex-shrink-0 flex flex-col",
        showChatOnMobile && "hidden lg:flex"
      )}>
        {/* Contacts Header */}
        <div className="p-[24px_20px] flex flex-col gap-3">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 px-1">
              <h1 className="text-[24px] font-semibold tracking-[-0.72px] text-[#000929]">Messaging</h1>
              {totalUnread > 0 && (
                <span className="bg-[#ff3e46] text-[#9b171c] text-[12px] font-normal px-[3px] py-1 rounded-[2px]">
                  {totalUnread}
                </span>
              )}
            </div>
            <button className="flex items-center gap-1 px-1 py-1 border border-[#f7f7fd] bg-white rounded text-[14px] font-medium text-[#000929] font-raleway">
              <span>Agents</span>
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative h-[46px] bg-[#f7f7fd] flex items-center px-4 rounded">
            <Search className="w-5 h-5 text-[#92929d]" />
            <input
              type="text"
              placeholder="Search in dashboard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none bg-transparent ml-3 text-[14px] text-[#92929d] outline-none font-poppins"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv, index) => (
            <div key={conv.id}>
              <button
                onClick={() => handleConversationSelect(conv)}
                className={cn(
                  "w-full flex items-center gap-3 p-[10px_20px] text-left transition-colors",
                  selectedConversation?.id === conv.id 
                    ? "bg-[#f7f7fd] rounded-[10px]" 
                    : "bg-transparent hover:bg-[#f7f7fd]"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-[52px] h-[52px] rounded-[30px] flex items-center justify-center flex-shrink-0",
                  conv.type === 'support' ? "bg-[#000929]" : "bg-[#2e3b5b]"
                )}>
                  {conv.type === 'support' ? (
                    <Headphones className="w-6 h-6 text-white" />
                  ) : conv.avatar ? (
                    <Avatar className="w-[52px] h-[52px]">
                      <AvatarImage src={conv.avatar} alt={conv.name} className="object-cover" />
                      <AvatarFallback className="bg-[#2e3b5b] text-white">
                        <Store className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Store className="w-6 h-6 text-white" />
                  )}
                </div>

                {/* Contact Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  {/* Name & Time Row */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-inter font-medium text-[14px] tracking-[-0.28px] text-[#000929] whitespace-nowrap">
                      {conv.name}
                    </span>
                    <span className="text-[12px] tracking-[-0.12px] text-[#76767c]/80 whitespace-nowrap">
                      {conv.lastMessageTime ? format(new Date(conv.lastMessageTime), 'h:mm a') : ''}
                    </span>
                  </div>
                  
                  {/* Message & Indicator Row */}
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "text-[12px] tracking-[-0.24px] overflow-hidden text-ellipsis whitespace-nowrap",
                      conv.unreadCount > 0 ? "text-[#000929] font-medium" : "text-[#76767c]/80"
                    )}>
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 ? (
                      <div className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 bg-[#d82027] rounded-full" />
                      </div>
                    ) : (
                      <div className="w-[18px] h-[18px] flex-shrink-0" />
                    )}
                  </div>
                </div>
              </button>
              
              {/* Separator */}
              {index < filteredConversations.length - 1 && (
                <div className="w-[312px] h-[1px] bg-[#e5e5e5] mx-auto" />
              )}
            </div>
          ))}
          
          {filteredConversations.length === 0 && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#f7f7fd] flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-[#bababa]" />
              </div>
              <p className="font-medium text-[#000929]">No conversations found</p>
              <p className="text-sm mt-1 text-[#757575]">Start a new conversation</p>
            </div>
          )}
        </div>
      </aside>

      {/* ========== CHAT AREA - Exact HTML Reference ========== */}
      <main className={cn(
        "flex-1 h-[882px] lg:h-full relative flex flex-col",
        !showChatOnMobile && "hidden lg:flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header - 100px */}
            <header className="h-[100px] bg-white border-b border-[#e5e5e5] flex items-center justify-between px-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                {/* Mobile back button */}
                <button
                  onClick={() => setShowChatOnMobile(false)}
                  className="lg:hidden p-2 -ml-2 hover:bg-[#f7f7fd] rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-[#000929]" />
                </button>
                
                {/* Avatar */}
                <div className={cn(
                  "w-[44px] h-[44px] rounded-[40px] flex items-center justify-center",
                  selectedConversation.type === 'support' ? "bg-[#000929]" : "bg-[#2e3b5b]"
                )}>
                  {selectedConversation.type === 'support' ? (
                    <Headphones className="w-5 h-5 text-white" />
                  ) : (
                    <Store className="w-5 h-5 text-white" />
                  )}
                </div>
                
                {/* User Details */}
                <div className="flex flex-col gap-2">
                  <h2 className="text-[16px] font-semibold tracking-[-0.32px] text-[#000929]">
                    {selectedConversation.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="w-[18px] h-[18px] flex items-center justify-center">
                      <div className="w-2 h-2 bg-[#33b843] rounded-full" />
                    </div>
                    <span className="text-[12px] tracking-[-0.24px] text-[#bababa] font-medium">Online</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons - gap 24px */}
              <div className="flex items-center gap-6">
                {/* Request Support for seller chats */}
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
                        toast.success('Support request sent! Our team will review and join if needed.');
                      }
                    }}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Request Support
                  </button>
                )}
                <button className="p-0 bg-transparent border-none cursor-pointer">
                  <Film className="w-6 h-6 text-[#000929]" />
                </button>
                <button className="p-0 bg-transparent border-none cursor-pointer">
                  <Phone className="w-6 h-6 text-[#000929]" />
                </button>
                <button className="p-0 bg-transparent border-none cursor-pointer">
                  <MoreVertical className="w-6 h-6 text-[#000929]" />
                </button>
              </div>
            </header>

            {/* Today Badge */}
            <div className="flex justify-center pt-1 bg-white">
              <span className="bg-white text-[#2e2a40] shadow-[0px_1px_3px_rgba(237,98,20,0.1)] py-2 px-3 rounded text-[14px] font-semibold tracking-[-0.28px]">
                Today
              </span>
            </div>

            {/* Messages Container - 700px height in reference */}
            <div className="flex-1 overflow-y-auto p-[8px_24px] bg-white">
              {currentMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-20 h-20 rounded-2xl bg-[#f7f7fd] flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-[#bababa]" />
                  </div>
                  <p className="text-lg font-semibold text-[#000929]">No messages yet</p>
                  <p className="text-sm text-[#757575] mt-1">Start the conversation!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {selectedConversation.type === 'support' ? (
                    supportMessages.map((msg) => {
                      const isUser = msg.sender_type === 'user';
                      const messageAttachments = attachments.get(msg.id) || [];
                      
                      return (
                        <div key={msg.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                          <div className={cn("flex flex-col gap-[10px]", isUser ? "w-[303px] items-end" : "w-[272px]")}>
                            {/* Attachments */}
                            {messageAttachments.length > 0 && (
                              <div className="flex gap-3">
                                {messageAttachments.map(att => (
                                  <div key={att.id}>{renderAttachment(att)}</div>
                                ))}
                              </div>
                            )}
                            
                            {/* Message Bubble */}
                            <div className={cn(
                              "p-[8px_12px] shadow-[0px_1px_3px_rgba(237,98,20,0.1)]",
                              isUser 
                                ? "bg-[#2e3b5b] rounded-[10px_0px_10px_10px] w-full" 
                                : "bg-[#000929] rounded-[0px_10px_10px_10px]"
                            )}>
                              <p className="font-raleway font-medium text-[14px] tracking-[-0.28px] leading-[21px] text-white whitespace-pre-wrap break-words">
                                {msg.message}
                              </p>
                            </div>
                            
                            {/* Time */}
                            <span className={cn(
                              "text-[12px] tracking-[-0.12px] text-[#757575]",
                              isUser ? "text-right" : "text-left"
                            )}>
                              Today {msg.created_at && format(new Date(msg.created_at), 'HH:mm')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    sellerMessages.map((msg) => {
                      const isBuyer = msg.sender_type === 'buyer';
                      const isSystem = msg.sender_type === 'system';
                      
                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center my-4">
                            <div className="bg-amber-50 rounded-xl px-4 py-2.5 max-w-[85%] border border-amber-200">
                              <p className="text-sm text-amber-700 text-center whitespace-pre-wrap">
                                {msg.message}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={msg.id} className={cn("flex", isBuyer ? "justify-end" : "justify-start")}>
                          <div className={cn("flex flex-col gap-[10px]", isBuyer ? "w-[303px] items-end" : "w-[272px]")}>
                            <div className={cn(
                              "p-[8px_12px] shadow-[0px_1px_3px_rgba(237,98,20,0.1)]",
                              isBuyer 
                                ? "bg-[#2e3b5b] rounded-[10px_0px_10px_10px] w-full" 
                                : "bg-[#000929] rounded-[0px_10px_10px_10px]"
                            )}>
                              <p className="font-raleway font-medium text-[14px] tracking-[-0.28px] leading-[21px] text-white whitespace-pre-wrap break-words">
                                {msg.message}
                              </p>
                            </div>
                            <span className={cn(
                              "text-[12px] tracking-[-0.12px] text-[#757575]",
                              isBuyer ? "text-right" : "text-left"
                            )}>
                              Today {msg.created_at && format(new Date(msg.created_at), 'HH:mm')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Pending Files Preview */}
            {pendingFiles.length > 0 && (
              <div className="px-4 py-2 bg-[#f7f7fd] border-t border-[#e5e5e5]">
                <div className="flex gap-2 flex-wrap">
                  {pendingFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#e5e5e5]">
                      {file.type.startsWith('image/') ? (
                        <Image size={14} className="text-[#2e3b5b]" />
                      ) : file.type.startsWith('video/') ? (
                        <Video size={14} className="text-[#2e3b5b]" />
                      ) : (
                        <Paperclip size={14} className="text-[#2e3b5b]" />
                      )}
                      <span className="text-xs truncate max-w-[100px] text-[#000929]">{file.name}</span>
                      <button onClick={() => removePendingFile(index)} className="text-[#757575] hover:text-red-500">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center gap-3">
                <div className="flex items-center gap-2 text-red-600">
                  <Circle className="w-3 h-3 fill-current animate-pulse" />
                  <span className="text-sm font-medium">Recording: {formatRecordingTime(recordingTime)}</span>
                </div>
                <button
                  onClick={stopRecording}
                  className="ml-auto px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <StopCircle size={16} />
                  Stop Recording
                </button>
              </div>
            )}

            {/* Chat Footer - 80px height, gap 24px, padding 0 15px */}
            <footer className="h-[80px] bg-white border-t border-[#e5e5e5] flex items-center gap-6 px-[15px] flex-shrink-0">
              {/* Attachment buttons (only for support) */}
              {selectedConversation.type === 'support' && !isRecording && (
                <>
                  <button onClick={() => fileInputRef.current?.click()} className="p-0 bg-transparent border-none cursor-pointer">
                    <MoreVertical className="w-6 h-6 text-[#000929]" />
                  </button>
                </>
              )}
              
              {selectedConversation.type === 'seller' && (
                <button className="p-0 bg-transparent border-none cursor-pointer">
                  <MoreVertical className="w-6 h-6 text-[#000929]" />
                </button>
              )}
              
              {/* Message Input Wrapper - 60px height, 20px radius */}
              <div className="flex-1 h-[60px] bg-[#f7f7fd] rounded-[20px] flex items-center px-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message"
                  disabled={sendingMessage || isRecording}
                  className="flex-1 border-none bg-transparent text-[14px] text-[#92929d] outline-none font-poppins"
                />
              </div>

              {/* Attachment button */}
              <button onClick={() => fileInputRef.current?.click()} className="p-0 bg-transparent border-none cursor-pointer">
                <Paperclip className="w-6 h-6 text-[#000929]" />
              </button>
              
              {/* Send Button - 10px radius, primary color */}
              <button
                onClick={sendMessage}
                disabled={sendingMessage || isRecording || (!newMessage.trim() && pendingFiles.length === 0)}
                className="bg-[#2e3b5b] border-none p-[10px] rounded-[10px] cursor-pointer flex items-center justify-center disabled:bg-[#bababa]"
              >
                {sendingMessage ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <Send className="w-6 h-6 text-white" />
                )}
              </button>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#f7f7fd]">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                <MessageCircle className="w-10 h-10 text-[#2e3b5b]" />
              </div>
              <p className="text-lg font-semibold text-[#000929]">Select a conversation</p>
              <p className="text-sm text-[#757575]">Choose a chat from the list to start messaging</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatSection;
