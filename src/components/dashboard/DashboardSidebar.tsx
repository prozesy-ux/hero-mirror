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
  { to: '/dashboard/billing', icon: GumroadPayoutsIcon, label: 'Billing' },
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
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-50 bg-white border-r border-[#E5E5E5] overflow-x-hidden overflow-y-auto transition-all duration-300 ${isCollapsed ? 'w-[72px]' : 'w-[240px]'}`}>
        {/* Logo Section */}
        <header className={`py-6 flex items-center ${isCollapsed ? 'justify-center px-3' : 'px-6'}`}>
          <Link to="/dashboard" className="flex items-center">
            {isCollapsed ? (
              <span className="text-[#333] text-lg font-bold">U</span>
            ) : (
              <span className="text-[#333] text-2xl font-bold tracking-tight">uptoza</span>
            )}
          </Link>
        </header>

        {/* Main Navigation */}
        <nav className="flex-1 py-2 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            
            if (isCollapsed) {
              return (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link 
                      to={item.to} 
                      className={`flex items-center justify-center w-full py-3.5 transition-all duration-200 ${
                        active ? 'bg-[#FF8A00] text-white shadow-ezmart-sidebar' : 'text-[#666] hover:bg-[#F5F5F5]'
                      }`}
                    >
                      <Icon size={18} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-white text-[#333] border border-[#E5E5E5]">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            
            return (
              <Link 
                key={item.to} 
                to={item.to} 
                className={`flex items-center gap-3 mx-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  active ? 'bg-[#FF8A00] text-white shadow-ezmart-sidebar' : 'text-[#666] hover:bg-[#F5F5F5] hover:translate-x-1'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Secondary Section */}
        <section className="mb-6 space-y-0.5">
          {bottomNavItems.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            
            if (isCollapsed) {
              return (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link 
                      to={item.to} 
                      className={`flex items-center justify-center w-full py-3.5 transition-all duration-200 ${
                        active ? 'bg-[#FF8A00] text-white shadow-ezmart-sidebar' : 'text-[#666] hover:bg-[#F5F5F5]'
                      }`}
                    >
                      <Icon size={18} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-white text-[#333] border border-[#E5E5E5]">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            
            return (
              <Link 
                key={item.to} 
                to={item.to} 
                className={`flex items-center gap-3 mx-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  active ? 'bg-[#FF8A00] text-white shadow-ezmart-sidebar' : 'text-[#666] hover:bg-[#F5F5F5] hover:translate-x-1'
                }`}
              >
                <Icon size={18} />
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
            className={`flex items-center gap-3 w-full py-3 text-[#999] hover:text-[#666] transition-all duration-200 border-t border-[#F0F0F0] ${
              isCollapsed ? 'justify-center' : 'px-6'
            }`}
          >
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronLeft size={16} />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>

          {/* User Profile */}
          <div className={`py-4 border-t border-[#F0F0F0] ${isCollapsed ? 'px-3' : 'px-4'}`}>
            <Link 
              to="/dashboard/profile" 
              className={`flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#F5F5F5] transition-all duration-200 ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <Avatar className="h-7 w-7 ring-1 ring-[#E5E5E5]">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-[#FF8A00]/10 text-[#FF8A00] text-xs font-medium">
                  {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <p className="text-sm text-[#333] font-medium truncate">
                    {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                  </p>
                  <ChevronDown className="w-4 h-4 text-[#999] flex-shrink-0" />
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
