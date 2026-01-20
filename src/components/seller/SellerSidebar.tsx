import { Link, useLocation } from 'react-router-dom';
import { useSellerSidebarContext } from '@/contexts/SellerSidebarContext';
import { useSellerContext } from '@/contexts/SellerContext';
import { 
  Home, 
  Package, 
  CreditCard, 
  Mail, 
  DollarSign, 
  BarChart2, 
  Wallet, 
  Settings, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  MessageSquare
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const menuItems = [
  { path: '/seller', label: 'Home', icon: Home, exact: true },
  { path: '/seller/products', label: 'Products', icon: Package },
  { path: '/seller/orders', label: 'Sales', icon: DollarSign },
  { path: '/seller/chat', label: 'Inbox', icon: Mail },
  { path: '/seller/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/seller/wallet', label: 'Payouts', icon: Wallet },
  { path: '/seller/settings', label: 'Settings', icon: Settings },
];

const bottomItems = [
  { path: '/seller/feature-requests', label: 'Feature Requests', icon: Lightbulb },
  { path: '/seller/support', label: 'Help', icon: HelpCircle },
];

const SellerSidebar = () => {
  const { isCollapsed, toggleSidebar } = useSellerSidebarContext();
  const { profile } = useSellerContext();
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <TooltipProvider>
      <aside 
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-50 bg-black text-white transition-all duration-300 ${
          isCollapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        {/* Logo/Profile Section */}
        <div className={`flex items-center gap-3 p-4 border-b border-white/10 ${isCollapsed ? 'justify-center' : ''}`}>
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarImage src={profile?.store_logo_url || ''} />
            <AvatarFallback className="bg-[#ff90e8] text-black font-bold">
              {profile?.store_name?.charAt(0).toUpperCase() || 'S'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.store_name || 'My Store'}</p>
              <p className="text-xs text-white/60">Seller</p>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.path, item.exact);
            const ItemIcon = item.icon;
            
            if (isCollapsed) {
              return (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.path}
                      className={`flex items-center justify-center w-full h-10 rounded-lg transition-all ${
                        active 
                          ? 'bg-[#ff90e8] text-black' 
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <ItemIcon size={20} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-black text-white border-white/20">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active 
                    ? 'bg-[#ff90e8] text-black' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <ItemIcon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/10 py-4 px-2 space-y-1">
          {bottomItems.map((item) => {
            const active = isActive(item.path);
            const ItemIcon = item.icon;
            
            if (isCollapsed) {
              return (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.path}
                      className={`flex items-center justify-center w-full h-10 rounded-lg transition-all ${
                        active 
                          ? 'bg-[#ff90e8] text-black' 
                          : 'text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <ItemIcon size={20} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-black text-white border-white/20">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active 
                    ? 'bg-[#ff90e8] text-black' 
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <ItemIcon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <>
                <ChevronLeft size={20} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default SellerSidebar;