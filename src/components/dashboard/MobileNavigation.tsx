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
    { to: '/dashboard/ai-accounts', icon: Bot, label: 'Market' },
    { to: '/dashboard/billing', icon: CreditCard, label: 'Wallet' },
    { to: '/dashboard/chat', icon: MessageCircle, label: 'Chat', badge: unreadCount },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`
                relative flex flex-col items-center gap-1 px-5 py-1.5
                transition-colors duration-200
                active:scale-95 active:opacity-80
                ${isActive ? 'text-violet-600' : 'text-gray-400'}
              `}
            >
              {/* Icon */}
              <div className="relative">
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              
              {/* Label */}
              <span className="text-[10px] font-semibold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;
