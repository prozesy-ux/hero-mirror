import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ExternalLink, LayoutDashboard, Package, ShoppingCart, BarChart3, Warehouse, Users, Tag, FileText, Activity, MessageSquare, Wallet, Settings, Lightbulb, HelpCircle } from 'lucide-react';
import { useSellerSidebarContext } from '@/contexts/SellerSidebarContext';
import metaLogo from '@/assets/meta-logo.png';
import googleAdsLogo from '@/assets/google-ads-logo.png';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { to: '/seller', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/seller/products', icon: Package, label: 'Products' },
  { to: '/seller/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/seller/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/seller/inventory', icon: Warehouse, label: 'Inventory' },
  { to: '/seller/customers', icon: Users, label: 'Customers' },
  { to: '/seller/marketing', icon: Tag, label: 'Marketing' },
  { to: '/seller/reports', icon: FileText, label: 'Reports' },
  { to: '/seller/performance', icon: Activity, label: 'Performance' },
  { to: '/seller/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/seller/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/seller/feature-requests', icon: Lightbulb, label: 'Features' },
  { to: '/seller/support', icon: HelpCircle, label: 'Support' },
  { to: '/seller/settings', icon: Settings, label: 'Settings' },
];

const SellerSidebar = () => {
  const { isCollapsed, toggleSidebar } = useSellerSidebarContext();
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <TooltipProvider>
      <aside 
        className={`hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 ${
          isCollapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.to, item.exact);
            const Icon = item.icon;

            if (isCollapsed) {
              return (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.to}
                      className={`flex items-center justify-center w-full p-3 rounded-xl transition-colors ${
                        active 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={20} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-gray-900 text-white border-0">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors ${
                  active 
                    ? 'bg-emerald-100 text-emerald-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Ads Agency Card - Same as User Dashboard */}
        {!isCollapsed ? (
          <div className="p-3">
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              {/* Logos Row */}
              <div className="flex items-center justify-center gap-4 mb-3">
                <div className="w-10 h-10 bg-white rounded-lg border border-gray-100 flex items-center justify-center p-1.5 shadow-sm">
                  <img src={metaLogo} alt="Meta" className="w-full h-full object-contain" />
                </div>
                <div className="w-10 h-10 bg-white rounded-lg border border-gray-100 flex items-center justify-center p-1.5 shadow-sm">
                  <img src={googleAdsLogo} alt="Google Ads" className="w-full h-full object-contain" />
                </div>
              </div>
              
              {/* Content */}
              <div className="text-center">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Ads Agency</h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  Get professional ad campaigns managed by experts
                </p>
                <button className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md">
                  Learn More
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="p-3">
                <div className="w-full aspect-square bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex flex-col gap-1">
                    <img src={metaLogo} alt="Meta" className="w-6 h-6 object-contain mx-auto" />
                    <img src={googleAdsLogo} alt="Google" className="w-6 h-6 object-contain mx-auto" />
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-gray-900 text-white border-0">
              <p>Ads Agency</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={toggleSidebar}
            className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <>
                <ChevronLeft size={18} />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default SellerSidebar;
