import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Send, Loader2, Image, Video, Paperclip, 
  X, Download, FileText, StopCircle, Circle, Headphones, Store, ArrowLeft, Search, AlertTriangle,
  Phone, MoreVertical
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { playSound } from '@/lib/sounds';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
            className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-[#e5e5e5] shadow-sm"
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
        className="flex items-center gap-2 px-3 py-2 bg-[#f7f7fd] rounded-lg hover:bg-[#eeeef5] transition-colors border border-[#e5e5e5]"
      >
        <FileText size={18} className="text-[#757575]" />
        <span className="text-sm truncate max-w-[150px] text-[#000929]">{att.file_name}</span>
        <Download size={14} className="text-[#757575]" />
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

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="flex h-[calc(100vh-180px)] lg:h-[calc(100vh-140px)] border border-[#e5e5e5] rounded-xl overflow-hidden bg-white shadow-lg">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Conversations List Panel - Reference Design */}
      <div className={cn(
        "w-full lg:w-80 border-r border-[#e5e5e5] flex flex-col bg-white",
        showChatOnMobile && "hidden lg:flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-[#e5e5e5]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-semibold text-[#000929] tracking-[-0.4px]">Messaging</h1>
              {totalUnread > 0 && (
                <span className="bg-[#ff3e46] text-[#9b171c] text-[12px] px-1.5 py-0.5 rounded">
                  {totalUnread}
                </span>
              )}
            </div>
          </div>
          {/* Search */}
          <div className="relative h-[46px] bg-[#f7f7fd] rounded flex items-center px-4">
            <Search className="w-5 h-5 text-[#92929d]" />
            <input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent ml-3 text-[14px] text-[#000929] placeholder:text-[#92929d] outline-none"
            />
          </div>
        </div>
        
        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv, index) => (
            <div key={conv.id}>
              <button
                onClick={() => handleConversationSelect(conv)}
                className={cn(
                  "w-full p-4 flex items-start gap-3 transition-all text-left",
                  selectedConversation?.id === conv.id 
                    ? "bg-[#f7f7fd] rounded-[10px]" 
                    : "hover:bg-[#f7f7fd]"
                )}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className={cn(
                    "w-[52px] h-[52px] rounded-[30px] flex items-center justify-center flex-shrink-0",
                    conv.type === 'support' 
                      ? "bg-[#000929]" 
                      : "bg-[#2e3b5b]"
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
                  {/* Online indicator for support */}
                  {conv.type === 'support' && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#33b843] border-2 border-white rounded-full" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[14px] text-[#000929] truncate tracking-[-0.28px]">{conv.name}</span>
                    {conv.lastMessageTime && (
                      <span className="text-[12px] text-[#76767c]/80 flex-shrink-0 tracking-[-0.12px]">
                        {format(new Date(conv.lastMessageTime), 'h:mm a')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className={cn(
                      "text-[12px] truncate tracking-[-0.24px]",
                      conv.unreadCount > 0 ? "text-[#000929] font-medium" : "text-[#76767c]/80"
                    )}>
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 && (
                      <div className="w-2 h-2 bg-[#d82027] rounded-full flex-shrink-0" />
                    )}
                  </div>
                </div>
              </button>
              {index < filteredConversations.length - 1 && (
                <div className="mx-auto w-[312px] h-[1px] bg-[#e5e5e5]" />
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
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-white",
        !showChatOnMobile && "hidden lg:flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header - 100px height */}
            <div className="h-[100px] bg-white border-b border-[#e5e5e5] flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                {/* Back button for mobile */}
                <button
                  onClick={() => setShowChatOnMobile(false)}
                  className="lg:hidden p-2 -ml-2 hover:bg-[#f7f7fd] rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-[#000929]" />
                </button>
                
                <div className={cn(
                  "w-11 h-11 rounded-[40px] flex items-center justify-center",
                  selectedConversation.type === 'support' 
                    ? "bg-[#000929]" 
                    : "bg-[#2e3b5b]"
                )}>
                  {selectedConversation.type === 'support' ? (
                    <Headphones className="w-5 h-5 text-white" />
                  ) : (
                    <Store className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-[16px] text-[#000929] tracking-[-0.32px]">{selectedConversation.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#33b843] rounded-full" />
                    <span className="text-[12px] text-[#bababa] tracking-[-0.24px] font-medium">Online</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Request Support Button for Seller Chats */}
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
                <button className="p-2 hover:bg-[#f7f7fd] rounded-lg transition-colors">
                  <Phone size={20} className="text-[#000929]" />
                </button>
                <button className="p-2 hover:bg-[#f7f7fd] rounded-lg transition-colors">
                  <Video size={20} className="text-[#000929]" />
                </button>
                <button className="p-2 hover:bg-[#f7f7fd] rounded-lg transition-colors">
                  <MoreVertical size={20} className="text-[#000929]" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
              {currentMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-20 h-20 rounded-2xl bg-[#f7f7fd] flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-[#bababa]" />
                  </div>
                  <p className="text-lg font-semibold text-[#000929]">No messages yet</p>
                  <p className="text-sm text-[#757575] mt-1">Start the conversation!</p>
                </div>
              ) : (
                <>
                  {/* Today Badge */}
                  <div className="flex justify-center py-1">
                    <span className="bg-white px-3 py-2 rounded text-[14px] font-semibold text-[#2e2a40] tracking-[-0.28px] shadow-sm border border-[#e5e5e5]">
                      Today
                    </span>
                  </div>
                  
                  {selectedConversation.type === 'support' ? (
                    supportMessages.map((msg) => {
                      const isUser = msg.sender_type === 'user';
                      const messageAttachments = attachments.get(msg.id) || [];
                      
                      return (
                        <div key={msg.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                          <div className="flex flex-col gap-2 max-w-[303px]">
                            <div className={cn(
                              "px-3 py-2 shadow-sm",
                              isUser 
                                ? "bg-[#2e3b5b] rounded-[10px_0px_10px_10px]" 
                                : "bg-[#000929] rounded-[0px_10px_10px_10px]"
                            )}>
                              <p className="font-raleway font-medium text-[14px] text-white tracking-[-0.28px] leading-[21px] whitespace-pre-wrap break-words">
                                {msg.message}
                              </p>
                              
                              {messageAttachments.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {messageAttachments.map(att => (
                                    <div key={att.id}>{renderAttachment(att)}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className={cn(
                              "text-[12px] text-[#757575] tracking-[-0.12px]",
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
                      const isSupport = msg.sender_type === 'support';
                      const isSystem = msg.sender_type === 'system';
                      
                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center my-4">
                            <div className="bg-amber-50 rounded-xl px-4 py-2.5 max-w-[85%] border border-amber-200">
                              <p className="text-sm text-amber-700 text-center whitespace-pre-wrap">
                                {msg.message}
                              </p>
                              <p className="text-[10px] text-amber-500 text-center mt-1">
                                {msg.created_at && format(new Date(msg.created_at), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={msg.id} className={cn("flex", isBuyer ? "justify-end" : "justify-start")}>
                          <div className="flex flex-col gap-2 max-w-[303px]">
                            <div className={cn(
                              "px-3 py-2 shadow-sm",
                              isBuyer 
                                ? "bg-[#2e3b5b] rounded-[10px_0px_10px_10px]" 
                                : isSupport
                                  ? "bg-blue-600 rounded-[0px_10px_10px_10px]"
                                  : "bg-[#000929] rounded-[0px_10px_10px_10px]"
                            )}>
                              <p className="font-raleway font-medium text-[14px] text-white tracking-[-0.28px] leading-[21px] whitespace-pre-wrap break-words">
                                {msg.message}
                              </p>
                            </div>
                            <span className={cn(
                              "text-[12px] text-[#757575] tracking-[-0.12px]",
                              isBuyer ? "text-right" : "text-left"
                            )}>
                              Today {msg.created_at && format(new Date(msg.created_at), 'HH:mm')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Pending Files Preview */}
            {pendingFiles.length > 0 && selectedConversation.type === 'support' && (
              <div className="px-4 py-2 border-t border-[#e5e5e5] bg-[#f7f7fd]">
                <div className="flex flex-wrap gap-2">
                  {pendingFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-[#e5e5e5]">
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

            {/* Input Area - 80px height */}
            <div className="h-[80px] bg-white border-t border-[#e5e5e5] flex items-center gap-4 px-4">
              {/* Attachment buttons (only for support) */}
              {selectedConversation.type === 'support' && !isRecording && (
                <div className="flex gap-1">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 text-[#000929] hover:bg-[#f7f7fd] rounded-lg transition-colors"
                    title="Add image"
                  >
                    <Image size={20} />
                  </button>
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="p-2 text-[#000929] hover:bg-[#f7f7fd] rounded-lg transition-colors"
                    title="Add video"
                  >
                    <Video size={20} />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-[#000929] hover:bg-[#f7f7fd] rounded-lg transition-colors"
                    title="Add file"
                  >
                    <Paperclip size={20} />
                  </button>
                  <button
                    onClick={startRecording}
                    className="p-2 text-[#000929] hover:bg-[#f7f7fd] rounded-lg transition-colors"
                    title="Record screen"
                  >
                    <Circle size={20} />
                  </button>
                </div>
              )}
              
              {selectedConversation.type === 'seller' && (
                <button className="p-2 text-[#000929] hover:bg-[#f7f7fd] rounded-lg transition-colors">
                  <Paperclip size={24} />
                </button>
              )}
              
              {/* Message Input */}
              <div className="flex-1 h-[60px] bg-[#f7f7fd] rounded-[20px] flex items-center px-4">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    selectedConversation.type === 'support'
                      ? "Type your message..."
                      : `Message ${selectedConversation.name}...`
                  }
                  disabled={sendingMessage || isRecording}
                  className="flex-1 bg-transparent text-[14px] text-[#000929] placeholder:text-[#92929d] outline-none font-raleway"
                />
              </div>
              
              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={sendingMessage || isRecording || (!newMessage.trim() && pendingFiles.length === 0)}
                className={cn(
                  "w-11 h-11 rounded-[10px] flex items-center justify-center transition-colors disabled:bg-[#bababa]",
                  selectedConversation.type === 'support'
                    ? "bg-[#000929] hover:bg-[#1a1f3d]"
                    : "bg-[#2e3b5b] hover:bg-[#3d4d6d]"
                )}
              >
                {sendingMessage ? (
                  <Loader2 size={20} className="animate-spin text-white" />
                ) : (
                  <Send size={20} className="text-white" />
                )}
              </button>
            </div>
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
      </div>
    </div>
  );
};

export default ChatSection;
