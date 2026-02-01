import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useSellerSidebarContext } from '@/contexts/SellerSidebarContext';
import { useSellerContext } from '@/contexts/SellerContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GUMROAD_ICONS, GumroadIcon } from '@/components/icons/GumroadIcons';

// Gumroad-style navigation labels with custom icons
const navItems = [
  { to: '/seller', iconSrc: GUMROAD_ICONS.home, label: 'Home', exact: true },
  { to: '/seller/products', iconSrc: GUMROAD_ICONS.products, label: 'Products' },
  { to: '/seller/orders', iconSrc: GUMROAD_ICONS.sales, label: 'Sales' },
  { to: '/seller/customers', iconSrc: GUMROAD_ICONS.customers, label: 'Customers' },
  { to: '/seller/flash-sales', iconSrc: GUMROAD_ICONS.flashSales, label: 'Flash Sales' },
  { to: '/seller/analytics', iconSrc: GUMROAD_ICONS.analytics, label: 'Analytics' },
  { to: '/seller/product-analytics', iconSrc: GUMROAD_ICONS.insights, label: 'Insights' },
  { to: '/seller/wallet', iconSrc: GUMROAD_ICONS.payouts, label: 'Payouts' },
  { to: '/seller/marketing', iconSrc: GUMROAD_ICONS.emails, label: 'Emails' },
  { to: '/seller/inventory', iconSrc: GUMROAD_ICONS.inventory, label: 'Inventory' },
  { to: '/seller/reports', iconSrc: GUMROAD_ICONS.reports, label: 'Reports' },
  { to: '/seller/performance', iconSrc: GUMROAD_ICONS.performance, label: 'Performance' },
  { to: '/seller/chat', iconSrc: GUMROAD_ICONS.chat, label: 'Chat' },
];

const bottomNavItems = [
  { to: '/seller/settings', iconSrc: GUMROAD_ICONS.settings, label: 'Settings' },
  { to: '/seller/support', iconSrc: GUMROAD_ICONS.help, label: 'Help' },
];

const SellerSidebar = () => {
  const { isCollapsed, toggleSidebar } = useSellerSidebarContext();
  const { profile } = useSellerContext();
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // CSS filter for pink color on active state
  const activeFilter = 'brightness(0) saturate(100%) invert(75%) sepia(50%) saturate(1000%) hue-rotate(280deg) brightness(1.1)';
  const inactiveFilter = 'brightness(0) invert(1) opacity(0.8)';

  return (
    <TooltipProvider>
      <aside 
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-50 bg-black transition-all duration-300 ${
          isCollapsed ? 'w-[72px]' : 'w-[240px]'
        }`}
      >
        {/* Logo Section - Gumroad style text logo */}
        <div className={`h-14 flex items-center border-b border-white/10 ${isCollapsed ? 'justify-center px-3' : 'px-5'}`}>
          <Link to="/seller" className="flex items-center">
            {isCollapsed ? (
              <span className="text-white text-lg font-bold">U</span>
            ) : (
              <span className="text-white text-xl font-bold tracking-tight">UPTOZA</span>
            )}
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.to, item.exact);

            if (isCollapsed) {
              return (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.to}
                      className={`flex items-center justify-center w-full py-3 transition-colors ${
                        active 
                          ? 'text-[#FF90E8]' 
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      <GumroadIcon 
                        src={item.iconSrc} 
                        size={20} 
                        alt={item.label}
                        className="transition-all"
                        style={{ filter: active ? activeFilter : inactiveFilter }}
                      />
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
                className={`flex items-center gap-3.5 px-5 py-3 text-[15px] font-medium transition-colors ${
                  active 
                    ? 'text-[#FF90E8]' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <GumroadIcon 
                  src={item.iconSrc} 
                  size={20} 
                  alt={item.label}
                  className="transition-all"
                  style={{ filter: active ? activeFilter : inactiveFilter }}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/10 py-3">
          {/* Settings & Help */}
          {bottomNavItems.map((item) => {
            const active = isActive(item.to);

            if (isCollapsed) {
              return (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.to}
                      className={`flex items-center justify-center w-full py-3 transition-colors ${
                        active 
                          ? 'text-[#FF90E8]' 
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      <GumroadIcon 
                        src={item.iconSrc} 
                        size={20} 
                        alt={item.label}
                        className="transition-all"
                        style={{ filter: active ? activeFilter : inactiveFilter }}
                      />
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
                className={`flex items-center gap-3.5 px-5 py-3 text-[15px] font-medium transition-colors ${
                  active 
                    ? 'text-[#FF90E8]' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <GumroadIcon 
                  src={item.iconSrc} 
                  size={20} 
                  alt={item.label}
                  className="transition-all"
                  style={{ filter: active ? activeFilter : inactiveFilter }}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className={`flex items-center gap-3.5 w-full py-3 text-white/50 hover:text-white transition-colors ${
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
          <div className={`mt-2 pt-3 border-t border-white/10 ${isCollapsed ? 'px-3' : 'px-4'}`}>
            <Link 
              to="/seller/settings"
              className={`flex items-center gap-3 py-2 rounded-lg hover:bg-white/5 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Avatar className="h-8 w-8 ring-1 ring-white/20">
                <AvatarImage src={profile?.store_logo_url || ''} />
                <AvatarFallback className="bg-white/10 text-white text-xs font-medium">
                  {profile?.store_name?.charAt(0).toUpperCase() || 'S'}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <p className="text-sm text-white font-medium truncate">
                    {profile?.store_name || 'My Store'}
                  </p>
                  <ChevronDown className="w-4 h-4 text-white/50 flex-shrink-0" />
                </div>
              )}
            </Link>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default SellerSidebar;
