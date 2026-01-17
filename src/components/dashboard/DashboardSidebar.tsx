import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, Bot, CreditCard, MessageCircle, 
  Crown, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const DashboardSidebar = () => {
  const location = useLocation();
  const { profile, user } = useAuthContext();
  const { isCollapsed, toggleSidebar } = useSidebarContext();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread message count
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
      .channel('sidebar-unread')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const navItems = [
    { to: '/dashboard/prompts', icon: FileText, label: 'Prompts' },
    { to: '/dashboard/ai-accounts', icon: Bot, label: 'Marketplace' },
    { to: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
    { to: '/dashboard/chat', icon: MessageCircle, label: 'Chat', badge: unreadCount > 0 ? unreadCount : undefined },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const Icon = item.icon;
    const active = isActive(item.to);

    const content = (
      <Link
        to={item.to}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
          active
            ? 'bg-violet-100 text-violet-700 border-l-[3px] border-violet-500 ml-0 pl-2.5'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <Icon size={20} className={active ? 'text-violet-600' : 'text-gray-500 group-hover:text-gray-700'} />
        {!isCollapsed && <span>{item.label}</span>}
        {item.badge && item.badge > 0 && (
          <span className={`absolute ${isCollapsed ? 'top-0 right-0' : 'right-3'} min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full px-1 bg-red-500 text-white animate-pulse`}>
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-gray-900 text-white border-0">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider>
      <aside 
        className={`hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 ${
          isCollapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        {/* Profile Section */}
        <div className={`p-4 border-b border-gray-100 ${isCollapsed ? 'px-3' : ''}`}>
          <Link 
            to="/dashboard/profile" 
            className={`flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors ${isCollapsed ? 'justify-center p-2' : ''}`}
          >
            <div className="relative flex-shrink-0">
              <div className="rounded-full bg-gradient-to-br from-violet-500 to-purple-600 p-0.5 w-10 h-10">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover bg-white"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
                    {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              {profile?.is_pro && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center ring-2 ring-white">
                  <Crown size={8} className="text-black" />
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                  {profile?.full_name || 'User'}
                  {profile?.is_pro && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded text-[9px] font-bold text-black">
                      PRO
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>

        {/* Agency Promo Card */}
        {!isCollapsed && (
          <div className="p-3">
            <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-yellow-300" />
                <span className="text-xs font-bold uppercase tracking-wide">Ads Agency</span>
              </div>
              <p className="text-xs text-white/80 mb-3">Get professional ad campaigns managed by experts</p>
              <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors">
                Learn More
              </button>
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={toggleSidebar}
            className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <>
                <ChevronLeft size={18} />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default DashboardSidebar;
