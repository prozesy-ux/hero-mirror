import { Paperclip, Smile, Camera, Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  sending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  showAttachments?: boolean;
  onAttachmentClick?: () => void;
  onImageClick?: () => void;
  extraActions?: React.ReactNode;
}

const ChatInput = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  sending = false,
  disabled = false,
  placeholder = "Type your message here...",
  showAttachments = true,
  onAttachmentClick,
  onImageClick,
  extraActions
}: ChatInputProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
    onKeyPress?.(e);
  };

  return (
    <div className="p-4 sm:p-6 pt-2 bg-[#F8FAFC]">
      <div className="bg-white rounded-2xl p-2 flex items-center gap-2 shadow-sm border border-gray-100">
        {showAttachments && (
          <button 
            onClick={onAttachmentClick}
            className="p-2 text-gray-400 hover:text-black transition-colors"
            disabled={disabled}
          >
            <Paperclip size={20} />
          </button>
        )}
        
        <input 
          type="text" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || sending}
          className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-gray-700 placeholder:text-gray-300 disabled:opacity-50"
        />
        
        <div className="flex items-center gap-1">
          {extraActions}
          
          <button 
            className="p-2 text-gray-400 hover:text-black transition-colors hidden sm:block"
            disabled={disabled}
          >
            <Smile size={20} />
          </button>
          
          {onImageClick && (
            <button 
              onClick={onImageClick}
              className="p-2 text-gray-400 hover:text-black transition-colors hidden sm:block"
              disabled={disabled}
            >
              <Camera size={20} />
            </button>
          )}
          
          <button 
            onClick={onSend}
            disabled={!value.trim() || sending || disabled}
            className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {sending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
