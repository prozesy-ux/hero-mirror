import { format } from 'date-fns';
import { CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  text: string;
  time: string | Date;
  sent: boolean;
  isRead?: boolean;
  senderLabel?: string;
  attachments?: React.ReactNode;
}

const MessageBubble = ({ 
  text, 
  time, 
  sent, 
  isRead,
  senderLabel,
  attachments 
}: MessageBubbleProps) => {
  const formattedTime = typeof time === 'string' 
    ? format(new Date(time), 'HH:mm')
    : format(time, 'HH:mm');

  return (
    <div className={`flex flex-col mb-4 ${sent ? 'items-end' : 'items-start'}`}>
      {senderLabel && (
        <p className={`text-[10px] text-gray-400 mb-1 px-2 ${sent ? 'text-right' : 'text-left'}`}>
          {senderLabel}
        </p>
      )}
      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
        sent 
          ? 'bg-black text-white rounded-tr-sm' 
          : 'bg-[#F3F4F6] text-gray-800 rounded-tl-sm'
      }`}>
        <p className="whitespace-pre-wrap break-words">{text}</p>
        {attachments && (
          <div className="mt-2">{attachments}</div>
        )}
      </div>
      <div className="flex items-center gap-1 mt-1 px-1">
        <span className="text-[10px] text-gray-400">{formattedTime}</span>
        {sent && isRead && (
          <CheckCheck size={12} className="text-blue-500" />
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
