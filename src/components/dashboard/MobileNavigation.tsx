import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ShoppingBag, Wallet, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const MobileNavigation = () => {
  const location = useLocation();
  const { user } = useAuthContext();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('sender_type', 'admin')
        .eq('is_read', false);
      
      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    const channel = supabase
      .channel('mobile-nav-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_messages',
        filter: `user_id=eq.${user.id}`
      }, fetchUnreadCount)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const navItems = [
    { 
      to: '/dashboard/prompts', 
      label: 'Prompts', 
      icon: Sparkles
    },
    { 
      to: '/dashboard/ai-accounts', 
      label: 'Market', 
      icon: ShoppingBag
    },
    { 
      to: '/dashboard/billing', 
      label: 'Wallet', 
      icon: Wallet
    },
    { 
      to: '/dashboard/chat', 
      label: 'Chat', 
      icon: MessageCircle,
      badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount.toString()) : undefined
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex flex-col items-center justify-center gap-1 min-w-[60px] h-full transition-all duration-200 tap-feedback ${
                isActive ? 'text-violet-600' : 'text-gray-400'
              }`}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-1 bg-violet-600 rounded-full" />
              )}
              
              <div className="relative">
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-all duration-200 ${isActive ? 'scale-110' : ''}`}
                />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              
              <span className={`text-[11px] font-medium transition-all duration-200 ${
                isActive ? 'text-violet-600 font-semibold' : 'text-gray-400'
              }`}>
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
