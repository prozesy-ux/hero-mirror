import { useState, forwardRef, createContext, useContext, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, CreditCard, User, LogOut, Menu, X, 
  Crown, Bot, ArrowRight, ChevronLeft, ChevronRight, MessageCircle, ExternalLink
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { playSound } from '@/lib/sounds';

// Context for sidebar collapse state
interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  toggleCollapse: () => {},
});

export const useSidebarContext = () => useContext(SidebarContext);

// Meta Logo SVG Component (Official Infinity Logo)
const MetaLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 36 36" fill="none" className={className}>
    <path 
      d="M7.5 18c0-4.5 2.5-9 6-9 2.5 0 4 1.5 5.5 4l1 1.5 1-1.5c1.5-2.5 3-4 5.5-4 3.5 0 6 4.5 6 9s-2.5 9-6 9c-2.5 0-4-1.5-5.5-4l-1-1.5-1 1.5c-1.5 2.5-3 4-5.5 4-3.5 0-6-4.5-6-9z" 
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// Google Ads Logo SVG Component (Official Triangle Design)
const GoogleAdsLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className}>
    {/* Yellow bar */}
    <rect x="4" y="28" width="16" height="40" rx="8" transform="rotate(-60 4 28)" fill="#FBBC04"/>
    {/* Blue bar */}
    <rect x="28" y="8" width="16" height="40" rx="8" transform="rotate(60 28 8)" fill="#4285F4"/>
    {/* Green circle */}
    <circle cx="12" cy="38" r="6" fill="#34A853"/>
  </svg>
);

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
  badge?: number;
}

const NavItem = forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ to, icon, label, isActive, isCollapsed, onClick, badge }, ref) => {
    const linkContent = (
      <Link
        ref={ref}
        to={to}
        onClick={onClick}
        className={`group flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-300 ${
          isActive 
            ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        } ${isCollapsed ? 'justify-center' : ''}`}
      >
        <span className={`transition-transform duration-300 flex-shrink-0 relative ${isActive ? '' : 'group-hover:scale-110'}`}>
          {icon}
            {badge && isCollapsed && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
        </span>
        {!isCollapsed && (
          <>
            <span className={`transition-all duration-200 ${
              isActive 
                ? 'font-semibold text-base tracking-tight' 
                : 'font-medium text-base tracking-normal'
            }`}>
              {label}
            </span>
            {badge ? (
              <span className={`ml-auto px-2 py-0.5 text-xs rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-600'}`}>
                {badge > 99 ? '99+' : badge}
              </span>
            ) : isActive ? (
              <span className="ml-auto w-2 h-2 rounded-full bg-white" />
            ) : null}
          </>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  }
);

NavItem.displayName = 'NavItem';

interface SidebarContentProps {
  onNavClick?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SidebarContent = forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ onNavClick, isCollapsed = false, onToggleCollapse }, ref) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { profile, signOut, user } = useAuthContext();
    const [unreadCount, setUnreadCount] = useState(0);
    const prevUnreadCountRef = useRef<number>(0);

    // Play sound when unread count increases
    useEffect(() => {
      if (unreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current >= 0) {
        playSound('messageReceived');
      }
      prevUnreadCountRef.current = unreadCount;
    }, [unreadCount]);

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

      // Subscribe to new messages
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
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [user]);

    const navItems = [
      { to: '/dashboard/prompts', icon: <FileText size={22} />, label: 'All Prompts' },
      { to: '/dashboard/ai-accounts', icon: <Bot size={22} />, label: 'Marketplace' },
      { to: '/dashboard/billing', icon: <CreditCard size={22} />, label: 'Billing' },
      { to: '/dashboard/chat', icon: <MessageCircle size={22} />, label: 'Chat', badge: unreadCount > 0 ? unreadCount : undefined },
    ];

    return (
      <TooltipProvider>
        <div ref={ref} className="flex flex-col h-full overflow-y-auto bg-white">
          {/* Header with Logo + Profile Avatar */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-end'} px-4 py-4 border-b border-gray-100 ${isCollapsed ? 'px-2' : ''}`}>
            {/* Profile Avatar - Clickable */}
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to="/dashboard/profile"
                  className="relative group"
                >
                  <div className={`rounded-full bg-gradient-to-br from-violet-500 to-purple-600 p-0.5 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/25 ${isCollapsed ? 'w-10 h-10' : 'w-10 h-10'}`}>
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
                  {/* PRO Crown badge */}
                  {profile?.is_pro && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center ring-1.5 ring-white shadow-md">
                      <Crown size={8} className="text-black" />
                    </div>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side={isCollapsed ? "right" : "bottom"} className="bg-gray-900 text-white border-gray-800">
                View Profile
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 space-y-1.5 ${isCollapsed ? 'px-2' : 'px-4'}`}>
            {navItems.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                isActive={location.pathname === item.to || (item.to === '/dashboard' && location.pathname === '/dashboard/')}
                isCollapsed={isCollapsed}
                onClick={onNavClick}
                badge={item.badge}
              />
            ))}
          </nav>

          {/* Ads Agency Section - Hidden when collapsed */}
          {!isCollapsed && (
            <div className="mx-4 mb-4">
              <div className="p-4 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                {/* Header */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Ads Agency
                </p>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-1">
                  Grow Your Business
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  Professional Meta & Google Ads management services
                </p>
                
                {/* Logo Buttons */}
                <div className="flex gap-2.5 mb-3">
                  <a
                    href="https://business.facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center py-3 bg-white border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group shadow-sm"
                    title="Meta Ads"
                  >
                    <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                      <MetaLogo className="w-4 h-4" />
                    </div>
                  </a>
                  <a
                    href="https://ads.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center py-3 bg-white border border-gray-200 rounded-xl hover:bg-amber-50 hover:border-amber-200 transition-all group shadow-sm"
                    title="Google Ads"
                  >
                    <div className="w-6 h-6 bg-amber-400 rounded flex items-center justify-center">
                      <GoogleAdsLogo className="w-4 h-4" />
                    </div>
                  </a>
                </div>
                
                {/* CTA Button */}
                <a
                  href="https://wa.me/+8801722684872"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl transition-all tracking-normal shadow-lg shadow-violet-500/25"
                >
                  <ExternalLink size={14} />
                  Contact Us
                </a>
              </div>
            </div>
          )}

          {/* Sign Out + Collapse Toggle */}
          <div className={`p-4 border-t border-gray-200 ${isCollapsed ? 'px-2' : ''}`}>
            <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'gap-2'}`}>
              {/* Sign Out Button */}
              {isCollapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={signOut}
                      className="flex items-center justify-center p-3 w-full text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all duration-300"
                    >
                      <LogOut size={22} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800">
                    Sign Out
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={signOut}
                  className="flex items-center gap-3.5 px-4 py-3 flex-1 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all duration-300"
                >
                  <LogOut size={22} />
                  <span className="font-medium text-base">Sign Out</span>
                </button>
              )}
              
              {/* Collapse Toggle Button */}
              {onToggleCollapse && (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onToggleCollapse}
                      className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-300 flex-shrink-0"
                    >
                      {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800">
                    {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }
);

SidebarContent.displayName = 'SidebarContent';

// Mobile Bottom Navigation Component - Premium Redesign
const MobileBottomNav = () => {
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

const DashboardSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapse: handleToggleCollapse }}>
      {/* Desktop Sidebar */}
      <aside 
        className={`
          hidden lg:flex fixed left-0 top-0 h-screen
          bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out z-50
          ${isCollapsed ? 'w-[72px]' : 'w-72'}
        `}
      >
        <SidebarContent isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
      </aside>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </SidebarContext.Provider>
  );
};

export { SidebarContext };
export default DashboardSidebar;
