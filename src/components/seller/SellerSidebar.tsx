import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSellerSidebarContext } from '@/contexts/SellerSidebarContext';
import { useSellerContext } from '@/contexts/SellerContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  GumroadHomeIcon,
  GumroadProductsIcon,
  GumroadSalesIcon,
  GumroadAnalyticsIcon,
  GumroadPayoutsIcon,
  GumroadSettingsIcon,
  GumroadHelpIcon,
  GumroadCustomersIcon,
  GumroadInsightsIcon,
  GumroadDiscountIcon,
  GumroadCouponsIcon,
  GumroadFlashSaleIcon,
  GumroadInventoryIcon,
  GumroadReportsIcon,
  GumroadPerformanceIcon,
  GumroadChatIcon,
  GumroadCollapseIcon,
  GumroadExpandIcon,
  GumroadChevronDownIcon,
} from './SellerGumroadIcons';

// Gumroad-style navigation labels with custom SVG icons
const navItems = [
  { to: '/seller', icon: GumroadHomeIcon, label: 'Home', exact: true },
  { to: '/seller/products', icon: GumroadProductsIcon, label: 'Products' },
  { to: '/seller/orders', icon: GumroadSalesIcon, label: 'Sales' },
  { to: '/seller/customers', icon: GumroadCustomersIcon, label: 'Customers' },
  { to: '/seller/analytics', icon: GumroadAnalyticsIcon, label: 'Analytics' },
  { to: '/seller/product-analytics', icon: GumroadInsightsIcon, label: 'Insights' },
  { to: '/seller/wallet', icon: GumroadPayoutsIcon, label: 'Payouts' },
];

// Discount sub-menu items
const discountItems = [
  { to: '/seller/coupons', icon: GumroadCouponsIcon, label: 'Coupons' },
  { to: '/seller/flash-sales', icon: GumroadFlashSaleIcon, label: 'Flash Sales' },
];

const navItemsAfterDiscount = [
  { to: '/seller/inventory', icon: GumroadInventoryIcon, label: 'Inventory' },
  { to: '/seller/reports', icon: GumroadReportsIcon, label: 'Reports' },
  { to: '/seller/performance', icon: GumroadPerformanceIcon, label: 'Performance' },
  { to: '/seller/chat', icon: GumroadChatIcon, label: 'Chat' },
];

const bottomNavItems = [
  { to: '/seller/settings', icon: GumroadSettingsIcon, label: 'Settings' },
  { to: '/seller/support', icon: GumroadHelpIcon, label: 'Help' },
];

const SellerSidebar = () => {
  const { isCollapsed, toggleSidebar } = useSellerSidebarContext();
  const { profile } = useSellerContext();
  const location = useLocation();
  const [discountOpen, setDiscountOpen] = useState(true);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isDiscountActive = discountItems.some(item => isActive(item.to));

  const renderNavItem = (item: { to: string; icon: any; label: string; exact?: boolean }) => {
    const active = isActive(item.to, item.exact);
    const Icon = item.icon;

    if (isCollapsed) {
      return (
        <Tooltip key={item.to} delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              to={item.to}
              className={`flex items-center justify-center w-full py-4 transition-colors border-t border-white/50 ${
                active 
                  ? 'text-[#FF90E8]' 
                  : 'text-white hover:bg-white/5'
              }`}
            >
              <Icon size={16} />
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
        className={`flex items-center gap-4 px-6 py-4 text-sm font-normal transition-colors border-t border-white/50 ${
          active 
            ? 'text-[#FF90E8]' 
            : 'text-white hover:bg-white/5'
        }`}
      >
        <Icon size={16} />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <TooltipProvider>
      <aside 
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-50 bg-black transition-all duration-300 ${
          isCollapsed ? 'w-[72px]' : 'w-52'
        }`}
      >
        {/* Logo Section - Gumroad style text logo */}
        <div className={`py-6 flex items-center border-b border-white/50 ${isCollapsed ? 'justify-center px-3' : 'px-6'}`}>
          <Link to="/seller" className="flex items-center">
            {isCollapsed ? (
              <span className="text-white text-lg font-bold tracking-tight">u</span>
            ) : (
              <span className="text-white text-2xl font-bold tracking-tight">uptoza</span>
            )}
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto">
          {/* First section of nav items */}
          {navItems.map(renderNavItem)}

          {/* Discount Section with Sub-menu */}
          {isCollapsed ? (
            // Collapsed: Show icons for discount sub-items
            <>
              {discountItems.map((item) => {
                const active = isActive(item.to);
                const Icon = item.icon;
                return (
                  <Tooltip key={item.to} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.to}
                        className={`flex items-center justify-center w-full py-4 transition-colors border-t border-white/50 ${
                          active 
                            ? 'text-[#FF90E8]' 
                            : 'text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon size={16} />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-white text-black border-0">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </>
          ) : (
            // Expanded: Show collapsible Discount section
            <Collapsible open={discountOpen} onOpenChange={setDiscountOpen}>
              <CollapsibleTrigger className={`flex items-center justify-between w-full px-6 py-4 text-sm font-normal transition-colors border-t border-white/50 ${
                isDiscountActive ? 'text-[#FF90E8]' : 'text-white hover:bg-white/5'
              }`}>
                <div className="flex items-center gap-4">
                  <GumroadDiscountIcon size={16} />
                  <span>Discount</span>
                </div>
                <GumroadChevronDownIcon size={16} className={`transition-transform duration-200 ${discountOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                {discountItems.map((item) => {
                  const active = isActive(item.to);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-4 pl-12 pr-6 py-4 text-sm font-normal transition-colors border-t border-white/50 ${
                        active 
                          ? 'text-[#FF90E8]' 
                          : 'text-white/60 hover:bg-white/5'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Rest of nav items */}
          {navItemsAfterDiscount.map(renderNavItem)}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/50">
          {/* Settings & Help */}
          {bottomNavItems.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;

            if (isCollapsed) {
              return (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.to}
                      className={`flex items-center justify-center w-full py-4 transition-colors border-t border-white/50 ${
                        active 
                          ? 'text-[#FF90E8]' 
                          : 'text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon size={16} />
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
                className={`flex items-center gap-4 px-6 py-4 text-sm font-normal transition-colors border-t border-white/50 ${
                  active 
                    ? 'text-[#FF90E8]' 
                    : 'text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className={`flex items-center gap-4 w-full py-4 text-white/50 hover:text-white transition-colors border-t border-white/50 ${
              isCollapsed ? 'justify-center' : 'px-6'
            }`}
          >
            {isCollapsed ? (
              <GumroadExpandIcon size={16} />
            ) : (
              <>
                <GumroadCollapseIcon size={16} />
                <span className="text-sm font-normal">Collapse</span>
              </>
            )}
          </button>

          {/* User Profile */}
          <div className={`py-4 border-t border-white/50 ${isCollapsed ? 'px-3' : 'px-6'}`}>
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
                  <GumroadChevronDownIcon size={14} className="text-white/50 flex-shrink-0" />
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
