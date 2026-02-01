import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Store, ShoppingCart, Heart, Sparkles,
  BarChart3, FileText, Wallet, Bell, MessageSquare, Settings,
  ChevronLeft, ChevronRight, ChevronDown 
} from 'lucide-react';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Gumroad-style navigation with Lucide icons for buyer
const navItems = [
  { to: '/dashboard/home', icon: Home, label: 'Home' },
  { to: '/dashboard/marketplace', icon: Store, label: 'Marketplace' },
  { to: '/dashboard/orders', icon: ShoppingCart, label: 'My Orders' },
  { to: '/dashboard/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/dashboard/prompts', icon: Sparkles, label: 'Prompts' },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/dashboard/reports', icon: FileText, label: 'Reports' },
  { to: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
];

const bottomNavItems = [
  { to: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
  { to: '/dashboard/chat', icon: MessageSquare, label: 'Support' },
  { to: '/dashboard/profile', icon: Settings, label: 'Settings' },
];

const DashboardSidebar = () => {
  const { isCollapsed, toggleSidebar } = useSidebarContext();
  const { profile, user } = useAuthContext();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <TooltipProvider>
      <aside 
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ${
          isCollapsed ? 'w-[72px]' : 'w-[240px]'
        }`}
      >
        {/* Logo Section - Gumroad style text logo */}
        <div className={`h-14 flex items-center border-b border-slate-100 ${isCollapsed ? 'justify-center px-3' : 'px-5'}`}>
          <Link to="/dashboard" className="flex items-center">
            {isCollapsed ? (
              <span className="text-slate-900 text-lg font-bold">U</span>
            ) : (
              <span className="text-slate-900 text-xl font-bold tracking-tight">UPTOZA</span>
            )}
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;

            if (isCollapsed) {
              return (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.to}
                      className={`flex items-center justify-center w-full py-3 transition-colors ${
                        active 
                          ? 'text-violet-600' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon size={20} strokeWidth={1.5} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-900 text-white border-0">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3.5 px-5 py-3 text-[15px] font-medium transition-colors ${
                  active 
                    ? 'text-violet-600' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={20} strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-slate-100 py-3">
          {/* Notifications, Support, Settings */}
          {bottomNavItems.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;

            if (isCollapsed) {
              return (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.to}
                      className={`flex items-center justify-center w-full py-3 transition-colors ${
                        active 
                          ? 'text-violet-600' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon size={20} strokeWidth={1.5} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-900 text-white border-0">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3.5 px-5 py-3 text-[15px] font-medium transition-colors ${
                  active 
                    ? 'text-violet-600' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={20} strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className={`flex items-center gap-3.5 w-full py-3 text-slate-400 hover:text-slate-600 transition-colors ${
              isCollapsed ? 'justify-center' : 'px-5'
            }`}
          >
            {isCollapsed ? (
              <ChevronRight size={20} strokeWidth={2} />
            ) : (
              <>
                <ChevronLeft size={20} strokeWidth={2} />
                <span className="text-[15px] font-medium">Collapse</span>
              </>
            )}
          </button>

          {/* User Profile */}
          <div className={`mt-2 pt-3 border-t border-slate-100 ${isCollapsed ? 'px-3' : 'px-4'}`}>
            <Link 
              to="/dashboard/profile"
              className={`flex items-center gap-3 py-2 rounded-lg hover:bg-slate-50 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Avatar className="h-8 w-8 ring-1 ring-slate-200">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-violet-100 text-violet-700 text-xs font-medium">
                  {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <p className="text-sm text-slate-900 font-medium truncate">
                    {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                  </p>
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </div>
              )}
            </Link>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default DashboardSidebar;
