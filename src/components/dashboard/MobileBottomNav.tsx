import { Link, useLocation } from 'react-router-dom';
import { FileText, Bot, CreditCard, MessageCircle, User } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const mobileNavItems = [
  { icon: FileText, label: 'Prompts', path: '/dashboard/prompts' },
  { icon: Bot, label: 'AI Shop', path: '/dashboard/ai-accounts' },
  { icon: CreditCard, label: 'Billing', path: '/dashboard/billing' },
  { icon: MessageCircle, label: 'Chat', path: '/dashboard/chat' },
  { icon: User, label: 'Profile', path: '/dashboard/profile' },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuthContext();

  // Fetch unread messages count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-messages-mobile', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('sender_type', 'admin')
        .eq('is_read', false);
      
      if (error) return 0;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-100 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {mobileNavItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          const showBadge = item.path === '/dashboard/chat' && unreadCount > 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                relative flex flex-col items-center justify-center py-2 px-3 rounded-xl
                transition-all duration-200 min-w-[60px]
                ${active 
                  ? 'text-violet-600' 
                  : 'text-gray-400 hover:text-gray-600'
                }
              `}
            >
              <div className={`
                relative p-1.5 rounded-lg transition-all duration-200
                ${active ? 'bg-violet-100' : ''}
              `}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                
                {/* Unread Badge */}
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              
              <span className={`
                text-[10px] mt-1 font-medium
                ${active ? 'text-violet-600' : 'text-gray-500'}
              `}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
