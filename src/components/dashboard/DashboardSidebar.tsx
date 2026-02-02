import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  GumroadHomeIcon,
  GumroadProductsIcon,
  GumroadCheckoutIcon,
  GumroadAnalyticsIcon,
  GumroadPayoutsIcon,
  GumroadDiscoverIcon,
  GumroadLibraryIcon,
  GumroadSettingsIcon,
  GumroadHelpIcon,
} from './GumroadIcons';

// Gumroad-style navigation items for buyer dashboard
const navItems = [
  { to: '/dashboard/home', icon: GumroadHomeIcon, label: 'Home' },
  { to: '/dashboard/marketplace', icon: GumroadDiscoverIcon, label: 'Marketplace' },
  { to: '/dashboard/orders', icon: GumroadCheckoutIcon, label: 'My Orders' },
  { to: '/dashboard/wishlist', icon: GumroadLibraryIcon, label: 'Wishlist' },
  { to: '/dashboard/prompts', icon: GumroadProductsIcon, label: 'Prompts' },
  { to: '/dashboard/analytics', icon: GumroadAnalyticsIcon, label: 'Analytics' },
  { to: '/dashboard/wallet', icon: GumroadPayoutsIcon, label: 'Wallet' },
];

const bottomNavItems = [
  { to: '/dashboard/notifications', icon: GumroadSettingsIcon, label: 'Notifications' },
  { to: '/dashboard/chat', icon: GumroadHelpIcon, label: 'Support' },
  { to: '/dashboard/profile', icon: GumroadSettingsIcon, label: 'Settings' },
];

const DashboardSidebar = () => {
  const { isCollapsed, toggleSidebar } = useSidebarContext();
  const { profile, user } = useAuthContext();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <TooltipProvider>
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-50 bg-black text-white overflow-x-hidden overflow-y-auto transition-all duration-300 ${isCollapsed ? 'w-[72px]' : 'w-52'}`}>
        {/* Logo Section - Gumroad style */}
        <header className={`py-6 flex items-center ${isCollapsed ? 'justify-center px-3' : 'px-6'}`}>
          <Link to="/dashboard" className="flex items-center">
            {isCollapsed ? (
              <span className="text-white text-lg font-bold">U</span>
            ) : (
              <span className="text-white text-2xl font-bold tracking-tight">uptoza</span>
            )}
          </Link>
        </header>

        {/* Main Navigation - Gumroad style with border-t */}
        <nav className="flex-1">
          {navItems.map((item, index) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            const isFirst = index === 0;
            const isLast = index === navItems.length - 1;
            
            if (isCollapsed) {
              return (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link 
                      to={item.to} 
                      className={`flex items-center justify-center w-full py-4 transition-colors border-t border-white/50 ${isLast ? 'border-b' : ''} ${
                        active ? 'text-[#FF90E8]' : 'text-white/70 hover:text-[#FF90E8]'
                      }`}
                    >
                      <Icon size={16} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-black text-white border border-white/20">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            
            return (
              <Link 
                key={item.to} 
                to={item.to} 
                className={`flex items-center gap-4 px-6 py-4 text-sm font-normal transition-colors border-t border-white/50 ${isLast ? 'border-b' : ''} ${
                  active ? 'text-[#FF90E8]' : 'text-white/70 hover:text-[#FF90E8]'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Secondary Section - Discover, Library style */}
        <section className="mb-6">
          {bottomNavItems.map((item, index) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            const isLast = index === bottomNavItems.length - 1;
            
            if (isCollapsed) {
              return (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link 
                      to={item.to} 
                      className={`flex items-center justify-center w-full py-4 transition-colors border-t border-white/50 ${isLast ? 'border-b' : ''} ${
                        active ? 'text-[#FF90E8]' : 'text-white/70 hover:text-[#FF90E8]'
                      }`}
                    >
                      <Icon size={16} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-black text-white border border-white/20">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            
            return (
              <Link 
                key={item.to} 
                to={item.to} 
                className={`flex items-center gap-4 px-6 py-4 text-sm font-normal transition-colors border-t border-white/50 ${isLast ? 'border-b' : ''} ${
                  active ? 'text-[#FF90E8]' : 'text-white/70 hover:text-[#FF90E8]'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </section>

        {/* Footer - Collapse Toggle & User Profile */}
        <footer className="mt-auto">
          {/* Collapse Toggle */}
          <button 
            onClick={toggleSidebar} 
            className={`flex items-center gap-4 w-full py-4 text-white/50 hover:text-white transition-colors border-t border-white/50 ${
              isCollapsed ? 'justify-center' : 'px-6'
            }`}
          >
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronLeft size={16} />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>

          {/* User Profile */}
          <div className={`py-4 border-t border-white/50 ${isCollapsed ? 'px-3' : 'px-6'}`}>
            <Link 
              to="/dashboard/profile" 
              className={`flex items-center gap-3 py-2 rounded-lg hover:bg-white/5 transition-colors ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <Avatar className="h-6 w-6 ring-1 ring-white/50">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-white/10 text-white text-xs font-medium">
                  {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <p className="text-sm text-white truncate">
                    {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                  </p>
                  <ChevronDown className="w-4 h-4 text-white/50 flex-shrink-0" />
                </div>
              )}
            </Link>
          </div>
        </footer>
      </aside>
    </TooltipProvider>
  );
};

export default DashboardSidebar;
