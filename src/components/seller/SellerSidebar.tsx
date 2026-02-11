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

// Navigation items BEFORE Products dropdown
const navItemsBefore = [
  { to: '/seller', icon: GumroadHomeIcon, label: 'Home', exact: true },
];

// Navigation items AFTER Products dropdown
const navItemsAfter = [
  { to: '/seller/orders', icon: GumroadSalesIcon, label: 'Sales' },
  { to: '/seller/customers', icon: GumroadCustomersIcon, label: 'Customers' },
  { to: '/seller/analytics', icon: GumroadAnalyticsIcon, label: 'Analytics' },
  { to: '/seller/wallet', icon: GumroadPayoutsIcon, label: 'Payouts' },
];

// Products sub-menu items
const productSubItems = [
  { to: '/seller/products', icon: GumroadProductsIcon, label: 'All Products' },
  { to: '/seller/delivery-inventory', icon: GumroadInventoryIcon, label: 'Delivery Pool' },
  { to: '/seller/discount', icon: GumroadDiscountIcon, label: 'Discount' },
  { to: '/seller/coupons', icon: GumroadCouponsIcon, label: 'Coupons' },
  { to: '/seller/flash-sales', icon: GumroadFlashSaleIcon, label: 'Flash Sales' },
  { to: '/seller/inventory', icon: GumroadInventoryIcon, label: 'Inventory' },
];

const navItemsAfterDiscount = [
  { to: '/seller/product-analytics', icon: GumroadInsightsIcon, label: 'Insights' },
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
  const [productsOpen, setProductsOpen] = useState(false);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isProductsActive = productSubItems.some(item => isActive(item.to)) || isActive('/seller/products');

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
          {/* Home */}
          {navItemsBefore.map(renderNavItem)}

          {/* Products Section with Sub-menu (right after Home) */}
          {isCollapsed ? (
            // Collapsed: Show icons for product sub-items
            <>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    to="/seller/products"
                    className={`flex items-center justify-center w-full py-4 transition-colors border-t border-white/50 ${
                      isProductsActive 
                        ? 'text-[#FF90E8]' 
                        : 'text-white hover:bg-white/5'
                    }`}
                  >
                    <GumroadProductsIcon size={16} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-white text-black border-0">
                  <p>Products</p>
                </TooltipContent>
              </Tooltip>
              {productSubItems.map((item) => {
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
            // Expanded: Show collapsible Products section
            <Collapsible open={productsOpen} onOpenChange={setProductsOpen}>
              <div className={`flex items-center justify-between w-full px-6 py-4 text-sm font-normal transition-colors border-t border-white/50 ${
                isProductsActive ? 'text-[#FF90E8]' : 'text-white hover:bg-white/5'
              }`}>
                <Link to="/seller/products" className="flex items-center gap-4 flex-1">
                  <GumroadProductsIcon size={16} />
                  <span>Products</span>
                </Link>
                <CollapsibleTrigger asChild>
                  <button className="p-1 hover:bg-white/10 rounded transition-colors">
                    <GumroadChevronDownIcon size={16} className={`transition-transform duration-200 ${productsOpen ? 'rotate-180' : ''}`} />
                  </button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                {productSubItems.map((item) => {
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

          {/* Sales, Customers, Analytics, Payouts */}
          {navItemsAfter.map(renderNavItem)}

          {/* Insights, Reports, Performance, Chat */}
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
