import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, Package, ShoppingCart, BarChart2, Warehouse, Users, FileText, Activity, MessageSquare, CreditCard, Settings, HelpCircle, Zap, TrendingUp, ChevronDown, Percent, Tag } from 'lucide-react';
import { useSellerSidebarContext } from '@/contexts/SellerSidebarContext';
import { useSellerContext } from '@/contexts/SellerContext';
import uptozaLogo from '@/assets/uptoza-logo.png';
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

// Gumroad-style navigation labels
const navItems = [
  { to: '/seller', icon: Home, label: 'Home', exact: true },
  { to: '/seller/products', icon: Package, label: 'Products' },
  { to: '/seller/orders', icon: ShoppingCart, label: 'Sales' },
  { to: '/seller/customers', icon: Users, label: 'Customers' },
  { to: '/seller/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/seller/product-analytics', icon: TrendingUp, label: 'Insights' },
  { to: '/seller/wallet', icon: CreditCard, label: 'Payouts' },
];

// Discount sub-menu items
const discountItems = [
  { to: '/seller/coupons', icon: Tag, label: 'Coupons' },
  { to: '/seller/flash-sales', icon: Zap, label: 'Flash Sales' },
];

const navItemsAfterDiscount = [
  { to: '/seller/inventory', icon: Warehouse, label: 'Inventory' },
  { to: '/seller/reports', icon: FileText, label: 'Reports' },
  { to: '/seller/performance', icon: Activity, label: 'Performance' },
  { to: '/seller/chat', icon: MessageSquare, label: 'Chat' },
];

const bottomNavItems = [
  { to: '/seller/settings', icon: Settings, label: 'Settings' },
  { to: '/seller/support', icon: HelpCircle, label: 'Help' },
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
              className={`flex items-center justify-center w-full py-3 transition-colors ${
                active 
                  ? 'text-[#FF90E8]' 
                  : 'text-white/70 hover:text-white'
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
        className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
          active 
            ? 'text-[#FF90E8]' 
            : 'text-white/70 hover:text-white'
        }`}
      >
        <Icon size={18} strokeWidth={2} />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <TooltipProvider>
      <aside 
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-50 bg-black transition-all duration-300 ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Logo Section - Gumroad style text logo */}
        <div className={`py-6 flex items-center ${isCollapsed ? 'justify-center px-3' : 'px-6'}`}>
          <Link to="/seller" className="flex items-center">
            {isCollapsed ? (
              <span className="text-white text-lg font-bold">u</span>
            ) : (
              <span className="text-white text-2xl font-bold">uptoza</span>
            )}
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
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
                        className={`flex items-center justify-center w-full py-3 transition-colors ${
                          active 
                            ? 'text-[#FF90E8]' 
                            : 'text-white/70 hover:text-white'
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
              })}
            </>
          ) : (
            // Expanded: Show collapsible Discount section
            <Collapsible open={discountOpen} onOpenChange={setDiscountOpen}>
              <CollapsibleTrigger className={`flex items-center justify-between w-full px-6 py-2 text-sm font-medium transition-colors ${
                isDiscountActive ? 'text-[#FF90E8]' : 'text-white/70 hover:text-white'
              }`}>
                <div className="flex items-center gap-3">
                  <Percent size={18} strokeWidth={2} />
                  <span>Discount</span>
                </div>
                <ChevronDown size={16} className={`transition-transform duration-200 ${discountOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                {discountItems.map((item) => {
                  const active = isActive(item.to);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 pl-12 pr-6 py-3 text-sm font-medium transition-colors ${
                        active 
                          ? 'text-[#FF90E8]' 
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <Icon size={18} strokeWidth={2} />
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
        <div className="border-t border-white/10 py-3">
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
                      className={`flex items-center justify-center w-full py-3 transition-colors ${
                        active 
                          ? 'text-[#FF90E8]' 
                          : 'text-white/70 hover:text-white'
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
                className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  active 
                    ? 'text-[#FF90E8]' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className={`flex items-center gap-3 w-full py-2 text-white/50 hover:text-white transition-colors ${
              isCollapsed ? 'justify-center' : 'px-6'
            }`}
          >
            {isCollapsed ? (
              <ChevronRight size={18} strokeWidth={2} />
            ) : (
              <>
                <ChevronLeft size={18} strokeWidth={2} />
                <span className="text-sm font-medium">Collapse</span>
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
