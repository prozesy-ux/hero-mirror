import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSellerContext } from '@/contexts/SellerContext';
import { LayoutDashboard, Package, ShoppingCart, Lightbulb, Share2, Menu, ExternalLink } from 'lucide-react';
import ShareStoreModal from './ShareStoreModal';
import theLogo from '@/assets/the-logo.png';
import metaLogo from '@/assets/meta-logo.png';
import googleAdsLogo from '@/assets/google-ads-logo.png';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const SellerMobileNavigation = () => {
  const location = useLocation();
  const { orders, profile } = useSellerContext();
  const [showShareModal, setShowShareModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const navItems = [
    { to: '/seller', icon: LayoutDashboard, label: 'Home', exact: true },
    { to: '/seller/products', icon: Package, label: 'Products' },
    { to: '/seller/orders', icon: ShoppingCart, label: 'Orders', badge: pendingOrders },
    { to: '/seller/feature-requests', icon: Lightbulb, label: 'Requests' },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 lg:hidden z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-1 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {/* Hamburger Menu - Opens Left Panel */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <button className="relative flex flex-col items-center gap-1 px-3 py-1.5 transition-colors duration-200 active:scale-95 active:opacity-80 text-slate-400">
                <Menu size={22} strokeWidth={1.8} />
                <span className="text-[10px] font-semibold">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-white">
              {/* Logo */}
              <div className="p-4 border-b border-slate-100">
                <Link to="/seller" onClick={() => setSidebarOpen(false)}>
                  <img src={theLogo} alt="Uptoza" className="h-8 w-auto" />
                </Link>
              </div>
              
              {/* Spacer */}
              <div className="flex-1" />
              
              {/* Ads Agency Card */}
              <div className="p-3 mt-auto">
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  {/* Logos Row */}
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <div className="w-10 h-10 bg-white rounded-lg border border-slate-100 flex items-center justify-center p-1.5 shadow-sm">
                      <img src={metaLogo} alt="Meta" className="w-full h-full object-contain" />
                    </div>
                    <div className="w-10 h-10 bg-white rounded-lg border border-slate-100 flex items-center justify-center p-1.5 shadow-sm">
                      <img src={googleAdsLogo} alt="Google Ads" className="w-full h-full object-contain" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Ads Agency</h3>
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                      Get professional ad campaigns managed by experts
                    </p>
                    <button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md">
                      Learn More
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* First two nav items */}
          {navItems.slice(0, 2).map((item) => {
            const active = isActive(item.to, item.exact);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  relative flex flex-col items-center gap-1 px-3 py-1.5
                  transition-colors duration-200
                  active:scale-95 active:opacity-80
                  ${active ? 'text-emerald-600' : 'text-slate-400'}
                `}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}

          {/* Center Share Button - Elevated */}
          <button
            onClick={() => setShowShareModal(true)}
            className="relative flex flex-col items-center gap-1 -mt-5"
          >
            <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform">
              <Share2 size={24} className="text-white" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600">Share</span>
          </button>

          {/* Last two nav items */}
          {navItems.slice(2).map((item) => {
            const active = isActive(item.to, item.exact);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  relative flex flex-col items-center gap-1 px-3 py-1.5
                  transition-colors duration-200
                  active:scale-95 active:opacity-80
                  ${active ? 'text-emerald-600' : 'text-slate-400'}
                `}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <ShareStoreModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        storeSlug={(profile as any)?.store_slug || ''}
        storeName={profile?.store_name || ''}
      />
    </>
  );
};

export default SellerMobileNavigation;
