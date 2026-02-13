import { useState, useEffect, useRef } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Send, 
  Loader2, 
  Headphones,
  MessageSquare,
  Image,
  Video,
  Paperclip,
  X,
  FileText,
  Download,
  Circle,
  StopCircle
} from 'lucide-react';

interface SellerSupportMessage {
  id: string;
  seller_id: string;
  message: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
}

interface SellerChatAttachment {
  id: string;
  message_id: string | null;
  seller_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const SellerSupport = () => {
  const { profile } = useSellerContext();
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<SellerSupportMessage[]>([]);
  const [attachments, setAttachments] = useState<Map<string, SellerChatAttachment[]>>(new Map());
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchMessages();
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [profile?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchMessages = async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('seller_support_messages')
        .select('*')
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Fetch attachments for all messages
      if (data && data.length > 0) {
        const messageIds = data.map(m => m.id);
        const { data: attachmentData } = await supabase
          .from('seller_chat_attachments')
          .select('*')
          .in('message_id', messageIds);
        
        if (attachmentData) {
          const attachmentMap = new Map<string, SellerChatAttachment[]>();
          attachmentData.forEach(att => {
            const existing = attachmentMap.get(att.message_id || '') || [];
            attachmentMap.set(att.message_id || '', [...existing, att]);
          });
          setAttachments(attachmentMap);
        }
      }

      // Mark admin messages as read
      await supabase
        .from('seller_support_messages')
        .update({ is_read: true })
        .eq('seller_id', profile.id)
        .eq('sender_type', 'admin');
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!profile?.id) return () => {};

    const channel = supabase
      .channel('seller-support')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'seller_support_messages',
        filter: `seller_id=eq.${profile.id}`
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const uploadFile = async (file: File): Promise<SellerChatAttachment | null> => {
    if (!profile?.id) return null;
    
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File ${file.name} is too large. Max size is 50MB.`);
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `seller/${profile.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
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
      seller_id: profile.id,
      file_url: publicUrl,
      file_type: fileType,
      file_name: file.name,
      file_size: file.size,
      created_at: new Date().toISOString()
    };
  };

  const sendMessage = async () => {
    if (!profile?.id || (!newMessage.trim() && pendingFiles.length === 0)) return;

    setSending(true);
    setUploadingFile(pendingFiles.length > 0);

    try {
      const { data: messageData, error } = await supabase
        .from('seller_support_messages')
        .insert({
          seller_id: profile.id,
          message: newMessage.trim() || (pendingFiles.length > 0 ? `[${pendingFiles.length} attachment(s)]` : ''),
          sender_type: 'seller'
        })
        .select()
        .single();

      if (error) throw error;

      // Upload files and create attachment records
      for (const file of pendingFiles) {
        const attachment = await uploadFile(file);
        if (attachment && messageData) {
          await supabase.from('seller_chat_attachments').insert({
            message_id: messageData.id,
            seller_id: profile.id,
            file_url: attachment.file_url,
            file_type: attachment.file_type,
            file_name: attachment.file_name,
            file_size: attachment.file_size
          });
        }
      }

      setNewMessage('');
      setPendingFiles([]);
      fetchMessages();
    } catch (error: any) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
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

  // Screen Recording Functions
  const startRecording = async () => {
    if (!user) return;
    
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
    if (!profile?.id) return;
    
    setUploadingFile(true);
    setSending(true);
    
    try {
      const attachment = await uploadFile(file);
      
      if (attachment) {
        const { data: messageData, error: messageError } = await supabase
          .from('seller_support_messages')
          .insert({
            seller_id: profile.id,
            message: '🎥 Screen Recording',
            sender_type: 'seller',
            is_read: false,
          })
          .select()
          .single();

        if (messageError) throw messageError;

        await supabase.from('seller_chat_attachments').insert({
          message_id: messageData.id,
          seller_id: profile.id,
          file_url: attachment.file_url,
          file_type: 'video',
          file_name: file.name,
          file_size: file.size
        });

        toast.success('Screen recording sent!');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending recording:', error);
      toast.error('Failed to send recording');
    } finally {
      setUploadingFile(false);
      setSending(false);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderAttachment = (att: SellerChatAttachment) => {
    if (att.file_type === 'image') {
      return (
        <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="block">
          <img 
            src={att.file_url} 
            alt={att.file_name} 
            className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-slate-200"
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
        className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
      >
        <FileText size={18} className="text-slate-500" />
        <span className="text-sm truncate max-w-[150px]">{att.file_name}</span>
        <Download size={14} className="text-slate-400" />
      </a>
    );
  };

  if (loading) {
    return (
      <div className="bg-[#F3EAE0] min-h-screen p-8 space-y-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-[calc(100vh-200px)] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-[#F3EAE0] min-h-screen p-8 space-y-6">
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

       {/* Chat Card */}
       <div className="bg-white rounded-2xl shadow-sm overflow-hidden h-[calc(100vh-140px)] flex flex-col">
        {/* Chat Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Headphones className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Uptoza Support</p>
            <p className="text-xs text-slate-500">We typically reply within a few hours</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <MessageSquare className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">No messages yet</h3>
              <p className="text-slate-500 text-sm text-center max-w-sm">
                Have a question or need help? Send us a message and we'll get back to you.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isUser = msg.sender_type === 'user';
                const messageAttachments = attachments.get(msg.id) || [];
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isUser
                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                      
                      {messageAttachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {messageAttachments.map(att => (
                            <div key={att.id}>{renderAttachment(att)}</div>
                          ))}
                        </div>
                      )}
                      
                      <p className={`text-[10px] mt-1 ${
                        isUser ? 'text-violet-100' : 'text-slate-400'
                      }`}>
                        {format(new Date(msg.created_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Pending Files Preview */}
        {pendingFiles.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
            <div className="flex flex-wrap gap-2">
              {pendingFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                  {file.type.startsWith('image/') ? (
                    <Image size={14} className="text-violet-500" />
                  ) : file.type.startsWith('video/') ? (
                    <Video size={14} className="text-violet-500" />
                  ) : (
                    <Paperclip size={14} className="text-violet-500" />
                  )}
                  <span className="text-xs truncate max-w-[100px]">{file.name}</span>
                  <button onClick={() => removePendingFile(index)} className="text-slate-400 hover:text-red-500">
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

        {/* Input */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-end gap-2">
            {/* Attachment buttons */}
            {!isRecording && (
              <div className="flex gap-1">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-violet-500 hover:bg-violet-50 rounded-lg transition-colors"
                  title="Add image"
                >
                  <Image size={20} />
                </button>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-violet-500 hover:bg-violet-50 rounded-lg transition-colors"
                  title="Add video"
                >
                  <Video size={20} />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-violet-500 hover:bg-violet-50 rounded-lg transition-colors"
                  title="Add file"
                >
                  <Paperclip size={20} />
                </button>
                <button
                  onClick={startRecording}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Record screen"
                >
                  <Circle size={20} />
                </button>
              </div>
            )}

            <div className="flex-1">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sending || isRecording}
                className="border-slate-200 bg-white"
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={sending || isRecording || (!newMessage.trim() && pendingFiles.length === 0)}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 px-4"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerSupport;