import React from 'react';

interface ChatSidebarIconProps {
  icon: React.ElementType;
  active?: boolean;
  onClick?: () => void;
  label?: string;
}

const ChatSidebarIcon = ({ icon: Icon, active, onClick, label }: ChatSidebarIconProps) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-xl cursor-pointer transition-all ${
      active 
        ? 'bg-white/20 text-white' 
        : 'text-white/60 hover:bg-white/10 hover:text-white'
    }`}
    title={label}
  >
    <Icon size={24} />
  </button>
);

export default ChatSidebarIcon;
