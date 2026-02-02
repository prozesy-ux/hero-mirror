import { CheckCheck } from 'lucide-react';

interface ChatListItemProps {
  avatar?: string;
  name: string;
  lastMessage: string;
  time: string;
  unread?: number;
  isRead?: boolean;
  active?: boolean;
  icon?: React.ReactNode;
  onClick: () => void;
}

const ChatListItem = ({ 
  avatar, 
  name, 
  lastMessage, 
  time, 
  unread, 
  isRead, 
  active,
  icon,
  onClick 
}: ChatListItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors text-left ${
      active ? 'bg-gray-100' : 'hover:bg-gray-50'
    }`}
  >
    <div className="relative">
      {avatar ? (
        <img 
          src={avatar} 
          alt={name} 
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" 
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

export default ChatListItem;
