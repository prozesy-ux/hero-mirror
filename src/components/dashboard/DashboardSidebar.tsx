import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, Store, ShoppingCart, Heart, Sparkles, BarChart2, CreditCard, Bell, MessageSquare, Settings, ChevronDown, FileText } from 'lucide-react';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Gumroad-style navigation labels for buyer
const navItems = [{
  to: '/dashboard/home',
  icon: Home,
  label: 'Home'
}, {
  to: '/dashboard/marketplace',
  icon: Store,
  label: 'Marketplace'
}, {
  to: '/dashboard/orders',
  icon: ShoppingCart,
  label: 'My Orders'
}, {
  to: '/dashboard/wishlist',
  icon: Heart,
  label: 'Wishlist'
}, {
  to: '/dashboard/prompts',
  icon: Sparkles,
  label: 'Prompts'
}, {
  to: '/dashboard/analytics',
  icon: BarChart2,
  label: 'Analytics'
}, {
  to: '/dashboard/reports',
  icon: FileText,
  label: 'Reports'
}, {
  to: '/dashboard/wallet',
  icon: CreditCard,
  label: 'Wallet'
}];

const bottomNavItems = [{
  to: '/dashboard/notifications',
  icon: Bell,
  label: 'Notifications'
}, {
  to: '/dashboard/chat',
  icon: MessageSquare,
  label: 'Support'
}, {
  to: '/dashboard/profile',
  icon: Settings,
  label: 'Settings'
}];

const DashboardSidebar = () => {
  const {
    isCollapsed,
    toggleSidebar
  } = useSidebarContext();
  const {
    profile,
    user
  } = useAuthContext();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <TooltipProvider>
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-[72px]' : 'w-64'}`}>
        {/* Logo Section - Gumroad style */}
        <div className={`py-6 flex items-center border-b border-gray-200 ${isCollapsed ? 'justify-center px-3' : 'px-6'}`}>
          <Link to="/dashboard" className="flex items-center">
            {isCollapsed ? (
              <span className="text-gray-900 text-lg font-bold">U</span>
            ) : (
              <span className="text-gray-900 text-2xl font-bold tracking-tight">uptoza</span>
            )}
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(item => {
            const active = isActive(item.to);
            const Icon = item.icon;
            if (isCollapsed) {
              return (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link 
                      to={item.to} 
                      className={`flex items-center justify-center w-full py-3 transition-colors border-b border-gray-200 ${
                        active ? 'text-[#FF90E8]' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={18} strokeWidth={2} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-white text-black border-0">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            return (
              <Link 
                key={item.to} 
                to={item.to} 
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-gray-200 ${
                  active ? 'text-[#FF90E8]' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 py-3">
          {/* Notifications, Support, Settings */}
          {bottomNavItems.map(item => {
            const active = isActive(item.to);
            const Icon = item.icon;
            if (isCollapsed) {
              return (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link 
                      to={item.to} 
                      className={`flex items-center justify-center w-full py-3 transition-colors border-b border-gray-200 ${
                        active ? 'text-[#FF90E8]' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={18} strokeWidth={2} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-white text-black border-0">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            return (
              <Link 
                key={item.to} 
                to={item.to} 
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-gray-200 ${
                  active ? 'text-[#FF90E8]' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Collapse Toggle */}
          <button 
            onClick={toggleSidebar} 
            className={`flex items-center gap-3 w-full py-3 text-gray-400 hover:text-gray-700 transition-colors ${
              isCollapsed ? 'justify-center' : 'px-4'
            }`}
          >
            {isCollapsed ? (
              <ChevronRight size={18} strokeWidth={2} />
            ) : (
              <>
                <span className="w-5 h-5 flex items-center justify-center">
                  <ChevronLeft size={18} strokeWidth={2} />
                </span>
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>

          {/* User Profile */}
          <div className={`mt-2 pt-3 border-t border-gray-200 ${isCollapsed ? 'px-3' : 'px-4'}`}>
            <Link 
              to="/dashboard/profile" 
              className={`flex items-center gap-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <Avatar className="h-8 w-8 ring-1 ring-gray-200">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-gray-100 text-gray-700 text-xs font-medium">
                  {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <p className="text-sm text-gray-900 font-medium truncate">
                    {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                  </p>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
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
