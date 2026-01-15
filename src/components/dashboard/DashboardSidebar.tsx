import { useState, forwardRef, createContext, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, CreditCard, User, LogOut, Menu, X, 
  Crown, Bot, ArrowRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
}

const NavItem = forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ to, icon, label, isActive, isCollapsed, onClick }, ref) => {
    const linkContent = (
      <Link
        ref={ref}
        to={to}
        onClick={onClick}
        className={`group flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-300 ${
          isActive 
            ? 'bg-white text-black' 
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        } ${isCollapsed ? 'justify-center' : ''}`}
      >
        <span className={`transition-transform duration-300 flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110'}`}>
          {icon}
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
            {isActive && (
              <span className="ml-auto w-2 h-2 rounded-full bg-black" />
            )}
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
          <TooltipContent side="right" className="bg-[#1a1a24] text-white border-white/10">
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
    const { profile, signOut } = useAuthContext();

    const navItems = [
      { to: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
      { to: '/dashboard/prompts', icon: <FileText size={22} />, label: 'All Prompts' },
      { to: '/dashboard/ai-accounts', icon: <Bot size={22} />, label: 'AI Accounts' },
      { to: '/dashboard/billing', icon: <CreditCard size={22} />, label: 'Billing' },
      { to: '/dashboard/profile', icon: <User size={22} />, label: 'Profile' },
    ];

    return (
      <TooltipProvider>
        <div ref={ref} className="flex flex-col h-full overflow-y-auto premium-scrollbar">
          {/* User Card */}
          <div className={`mx-3 mb-4 mt-4 bg-white/5 rounded-xl border border-white/10 ${isCollapsed ? 'p-2' : 'p-4'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3.5'}`}>
              <div className="relative flex-shrink-0">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    className={`rounded-full object-cover ring-2 ring-white/20 ${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'}`}
                  />
                ) : (
                  <div className={`rounded-full bg-white flex items-center justify-center text-black font-bold ring-2 ring-white/20 ${isCollapsed ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base'}`}>
                    {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                  </div>
                )}
                {profile?.is_pro && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                    <Crown size={10} className="text-black" />
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-lg tracking-tight truncate">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-gray-500 text-sm tracking-normal truncate">
                    {profile?.email}
                  </p>
                </div>
              )}
            </div>
            {profile?.is_pro && !isCollapsed && (
              <div className="mt-3 px-3 py-2 bg-amber-400/10 rounded-lg border border-amber-400/20">
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-2 uppercase tracking-wide">
                  <Crown size={12} />
                  PRO Member
                </span>
              </div>
            )}
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
              />
            ))}
          </nav>

          {/* Ads Agency Section - Hidden when collapsed */}
          {!isCollapsed && (
            <div className="mx-4 mb-4">
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03]">
                {/* Header */}
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                  Ads Agency
                </p>
                <h3 className="text-lg font-bold text-white tracking-tight mb-1">
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
                    className="flex-1 flex items-center justify-center py-3 bg-transparent border border-white/10 rounded-xl hover:bg-[#0668E1]/10 hover:border-[#0668E1]/30 transition-all group"
                    title="Meta Ads"
                  >
                    <MetaLogo className="w-6 h-6 text-white group-hover:text-[#0668E1] transition-colors" />
                  </a>
                  <a
                    href="https://ads.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center py-3 bg-transparent border border-white/10 rounded-xl hover:bg-white/5 hover:border-white/20 transition-all group"
                    title="Google Ads"
                  >
                    <GoogleAdsLogo className="w-6 h-6" />
                  </a>
                </div>
                
                {/* CTA Button */}
                <a
                  href="mailto:contact@agency.com"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white hover:bg-gray-100 text-black text-sm font-semibold rounded-xl transition-all tracking-normal"
                >
                  Contact Agency
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          )}

          {/* Sign Out + Collapse Toggle */}
          <div className={`p-4 border-t border-white/5 ${isCollapsed ? 'px-2' : ''}`}>
            <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'gap-2'}`}>
              {/* Sign Out Button */}
              {isCollapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={signOut}
                      className="flex items-center justify-center p-3 w-full text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-300"
                    >
                      <LogOut size={22} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#1a1a24] text-white border-white/10">
                    Sign Out
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={signOut}
                  className="flex items-center gap-3.5 px-4 py-3 flex-1 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-300"
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
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-300 flex-shrink-0"
                    >
                      {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#1a1a24] text-white border-white/10">
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

const DashboardSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });
  const location = useLocation();

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapse }}>
      {/* Mobile Header - Fixed Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-white/10 px-2 py-2 safe-area-bottom">
        <div className="flex items-center justify-around">
          {[
            { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
            { to: '/dashboard/prompts', icon: <FileText size={20} />, label: 'Prompts' },
            { to: '/dashboard/ai-accounts', icon: <Bot size={20} />, label: 'Accounts' },
            { to: '/dashboard/billing', icon: <CreditCard size={20} />, label: 'Billing' },
            { to: '/dashboard/profile', icon: <User size={20} />, label: 'Profile' },
          ].map((item) => {
            const isActive = location.pathname === item.to || (item.to === '/dashboard' && location.pathname === '/dashboard/');
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isActive 
                    ? 'text-white bg-white/10' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div 
        className={`hidden lg:block fixed left-0 top-0 h-screen bg-[#0a0a0a] border-r border-white/5 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[72px]' : 'w-72'
        }`}
      >
        <SidebarContent isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />
      </div>
    </SidebarContext.Provider>
  );
};

export { SidebarContext };
export default DashboardSidebar;
