import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Bot, CreditCard, MessageCircle } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const MobileNavigation = () => {
  const location = useLocation();
  const { user } = useAuthContext();
  const [unreadCount, setUnreadCount] = useState(0);
  const [animatingItem, setAnimatingItem] = useState<string | null>(null);
  const prevPathRef = useRef(location.pathname);

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

  // Trigger animation on route change
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      setAnimatingItem(location.pathname);
      const timer = setTimeout(() => setAnimatingItem(null), 350);
      prevPathRef.current = location.pathname;
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const navItems = [
    { to: '/dashboard/prompts', icon: FileText, label: 'Prompts' },
    { to: '/dashboard/ai-accounts', icon: Bot, label: 'Market' },
    { to: '/dashboard/billing', icon: CreditCard, label: 'Wallet' },
    { to: '/dashboard/chat', icon: MessageCircle, label: 'Chat', badge: unreadCount },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 mobile-nav-floating bg-white/95 border-t border-gray-100/50 z-50 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          const Icon = item.icon;
          const isAnimating = animatingItem === item.to;
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`
                relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl 
                transition-all duration-300 ease-out tap-feedback mobile-touch-target
                ${isActive 
                  ? 'nav-bg-violet-active text-white scale-105' 
                  : 'text-gray-400 hover:text-gray-600'
                }
                ${isAnimating ? 'nav-item-pop' : ''}
              `}
            >
              {/* Icon container with glow effect */}
              <div className={`relative ${isActive ? 'nav-glow-violet' : ''} rounded-xl p-1`}>
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={`nav-icon-fill ${isActive ? 'active' : ''} transition-all duration-200`}
                  fill={isActive ? 'currentColor' : 'none'}
                />
                
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 badge-pulse shadow-lg shadow-red-500/30">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              
              {/* Label */}
              <span className={`text-[10px] font-semibold tracking-wide transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
              
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute -bottom-0.5 w-1 h-1 bg-white rounded-full nav-indicator-animate shadow-sm" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;
