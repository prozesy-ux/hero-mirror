import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ShoppingBag, Wallet, MessageSquare, Bell } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import theLogo from '@/assets/the-logo.png';

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
    { to: '/dashboard/prompts', icon: Sparkles, label: 'Prompts' },
    { to: '/dashboard/ai-accounts', icon: ShoppingBag, label: 'Market' },
    { to: '/dashboard/billing', icon: Wallet, label: 'Wallet' },
    { to: '/dashboard/chat', icon: MessageSquare, label: 'Chat', badge: unreadCount },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {/* Left side: Logo + Notification */}
        <div className="flex items-center gap-2 pl-2 pr-3 min-w-[80px]">
          <Link to="/dashboard/prompts" className="tap-feedback">
            <img 
              src={theLogo} 
              alt="Logo" 
              className="h-7 w-auto"
            />
          </Link>
          <Link 
            to="/dashboard/chat"
            className="relative p-2 rounded-xl text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all tap-feedback"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>

        {/* Nav Items - Center */}
        <div className="flex-1 flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            const Icon = item.icon;
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  relative flex flex-col items-center gap-0.5 px-3 py-1.5
                  transition-all duration-200 tap-feedback
                  ${isActive ? 'text-violet-600' : 'text-gray-400'}
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-violet-600 rounded-full" />
                )}

                {/* Icon */}
                <div className="relative">
                  <Icon 
                    size={22} 
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={isActive ? 'fill-violet-100' : ''}
                  />
                  
                  {/* Badge for Chat */}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
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
      </div>
    </nav>
  );
};

export default MobileNavigation;
