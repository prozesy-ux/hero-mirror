import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Send, Loader2, Image, Video, Paperclip, 
  X, Download, FileText, StopCircle, Circle, Mic, Headphones
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { playSound } from '@/lib/sounds';

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  sender_type: string;
  is_read: boolean | null;
  created_at: string | null;
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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ChatSection = () => {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [attachments, setAttachments] = useState<Map<string, ChatAttachment[]>>(new Map());
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
      markMessagesAsRead();

      const channel = supabase
        .channel('support-messages-chat')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newMsg = payload.new as SupportMessage;
            setMessages((prev) => [...prev, newMsg]);
            fetchAttachmentsForMessage(newMsg.id);
            if (newMsg.sender_type === 'admin') {
              playSound('messageReceived');
              markMessagesAsRead();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        // Cleanup recording on unmount
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
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Fetch attachments for all messages
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
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachmentsForMessage = async (messageId: string) => {
    const { data } = await supabase
      .from('chat_attachments')
      .select('*')
      .eq('message_id', messageId);
    
    if (data && data.length > 0) {
      setAttachments(prev => {
        const newMap = new Map(prev);
        newMap.set(messageId, data);
        return newMap;
      });
    }
  };

  const markMessagesAsRead = async () => {
    if (!user) return;

    await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('sender_type', 'admin')
      .eq('is_read', false);
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
    if ((!newMessage.trim() && pendingFiles.length === 0) || !user || sendingMessage) return;

    setSendingMessage(true);
    setUploadingFile(pendingFiles.length > 0);
    
    try {
      // First create the message
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

      // Upload files and create attachment records
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

      playSound('messageSent');
      setNewMessage('');
      setPendingFiles([]);
      toast.success('Message sent!');
      
      // Refresh to get attachments
      if (pendingFiles.length > 0 && messageData) {
        fetchAttachmentsForMessage(messageData.id);
      }
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
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
        // Cleanup timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingTime(0);
        
        // Create video blob and upload
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `screen-recording-${Date.now()}.webm`, { type: 'video/webm' });
        
        // Auto-upload the recording
        await uploadAndSendRecording(file);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Handle when user stops sharing via browser UI
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        setIsRecording(false);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      // Start timer
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
      // Upload the video
      const attachment = await uploadFile(file);
      
      if (attachment) {
        // Create message with the recording
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

        // Create attachment record
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
        
        // Refresh to get attachments
        fetchAttachmentsForMessage(messageData.id);
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
            className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-gray-200 shadow-sm"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
              e.currentTarget.className = 'max-w-[200px] max-h-[200px] rounded-lg object-cover border border-gray-200 bg-gray-100 p-4';
            }}
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
            onError={(e) => {
              console.error('Video failed to load:', att.file_url);
            }}
          />
        </div>
      );
    }
    
    return (
      <a 
        href={att.file_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200"
      >
        <FileText size={18} className="text-gray-600" />
        <span className="text-sm truncate max-w-[150px] text-gray-700">{att.file_name}</span>
        <Download size={14} className="text-gray-500" />
      </a>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] lg:h-[calc(100vh-140px)]">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'image')}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'video')}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'file')}
      />

      {/* Chat Container */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col flex-1">
        {/* Chat Header */}
        <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50 flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
              <Headphones className="text-white w-5 h-5 sm:w-[22px] sm:h-[22px]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-gray-900 font-bold text-base sm:text-lg truncate">Support Team</h3>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0"></span>
                <p className="text-gray-500 text-xs sm:text-sm truncate">We typically reply within a few hours</p>
              </div>
            </div>
          </div>
          
          {/* Recording Status */}
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 border border-red-200 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-red-700">Recording {formatRecordingTime(recordingTime)}</span>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-b from-gray-50 to-white">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-violet-100 flex items-center justify-center mb-3 sm:mb-4">
                <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-violet-500" />
              </div>
              <h3 className="text-gray-900 font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Start a conversation</h3>
              <p className="text-gray-500 text-sm max-w-xs sm:max-w-sm">
                Have a question? Send us a message and we'll get back to you soon.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const msgAttachments = attachments.get(msg.id) || [];
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm ${
                      msg.sender_type === 'user'
                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-br-md'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    
                    {/* Attachments */}
                    {msgAttachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msgAttachments.map((att) => (
                          <div key={att.id}>{renderAttachment(att)}</div>
                        ))}
                      </div>
                    )}
                    
                    <p
                      className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 ${
                        msg.sender_type === 'user' ? 'text-violet-200' : 'text-gray-400'
                      }`}
                    >
                      {format(new Date(msg.created_at || new Date()), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Pending Files Preview */}
        {pendingFiles.length > 0 && (
          <div className="px-3 sm:px-4 py-2 border-t border-gray-100 bg-gray-50">
            <div className="flex flex-wrap gap-2">
              {pendingFiles.map((file, index) => (
                <div 
                  key={index}
                  className="relative flex items-center gap-2 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
                >
                  {file.type.startsWith('image/') ? <Image size={14} className="text-violet-500" /> :
                   file.type.startsWith('video/') ? <Video size={14} className="text-blue-500" /> :
                   <FileText size={14} className="text-gray-500" />}
                  <span className="text-gray-700 truncate max-w-[100px]">{file.name}</span>
                  <button 
                    onClick={() => removePendingFile(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area with Attachment Buttons */}
        <div className="p-3 sm:p-4 border-t border-gray-100 bg-white">
          {/* Attachment Toolbar */}
          <div className="flex items-center gap-1 mb-2">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              title="Upload Image"
            >
              <Image size={18} />
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Upload Video"
            >
              <Video size={18} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Upload File"
            >
              <Paperclip size={18} />
            </button>
            <div className="h-5 w-px bg-gray-200 mx-1" />
            <button
              className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="Voice Message (Coming Soon)"
              disabled
            >
              <Mic size={18} />
            </button>
            <div className="h-5 w-px bg-gray-200 mx-1" />
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
              >
                <StopCircle size={16} />
                <span className="hidden sm:inline">Stop Recording</span>
                <span className="sm:hidden">Stop</span>
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                title="Record Screen"
              >
                <Circle size={16} className="text-red-500" />
                <span className="hidden sm:inline">Record Screen</span>
              </button>
            )}
          </div>
          
          {/* Message Input */}
          <div className="flex gap-2 sm:gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={(!newMessage.trim() && pendingFiles.length === 0) || sendingMessage}
              className="px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-1.5 sm:gap-2"
            >
              {sendingMessage ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSection;