import { Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';

interface ChatHeaderProps {
  name: string;
  avatar?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  isOnline?: boolean;
  onBack?: () => void;
  showBackOnMobile?: boolean;
  actions?: React.ReactNode;
}

const ChatHeader = ({
  name,
  avatar,
  icon,
  subtitle,
  isOnline,
  onBack,
  showBackOnMobile = true,
  actions
}: ChatHeaderProps) => (
  <header className="px-4 sm:px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
    <div className="flex items-center gap-3">
      {showBackOnMobile && onBack && (
        <button
          onClick={onBack}
          className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
      )}
      
      {avatar ? (
        <img 
          src={avatar}
          alt={name}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : icon ? (
        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
          {icon}
        </div>
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      
      <div>
        <h2 className="text-sm font-bold text-gray-800 leading-tight">{name}</h2>
        <div className="flex items-center gap-1.5">
          {isOnline !== undefined && (
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
          )}
          {subtitle && (
            <span className="text-[10px] text-gray-400 uppercase tracking-tight">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
    
    <div className="flex items-center gap-4">
      {actions || (
        <>
          <Phone size={20} className="text-black cursor-pointer hover:opacity-70 hidden sm:block" />
          <Video size={20} className="text-black cursor-pointer hover:opacity-70 hidden sm:block" />
          <MoreVertical size={20} className="text-gray-400 cursor-pointer hover:text-black" />
        </>
      )}
    </div>
  </header>
);

export default ChatHeader;
