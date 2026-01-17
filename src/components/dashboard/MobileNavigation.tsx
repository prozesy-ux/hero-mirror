import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Bot, CreditCard, MessageCircle } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const MobileNavigation = () => {
  const location = useLocation();
  const { user } = useAuthContext();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count for mobile nav
  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      const { count } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('sender_type', 'admin')
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel('mobile-nav-unread')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_messages',
        filter: `user_id=eq.${user.id}`,
      }, fetchUnread)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const navItems = [
    { to: '/dashboard/prompts', icon: FileText, label: 'Prompts' },
    { to: '/dashboard/ai-accounts', icon: Bot, label: 'Marketplace' },
    { to: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
    { to: '/dashboard/chat', icon: MessageCircle, label: 'Chat', badge: unreadCount },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`
                relative flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200
                ${isActive 
                  ? 'text-violet-600 bg-violet-100 scale-105 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600 active:scale-95'
                }
              `}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;
