import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSellerContext } from '@/contexts/SellerContext';
import { LayoutDashboard, Package, ShoppingCart, Lightbulb, Share2 } from 'lucide-react';
import ShareStoreModal from './ShareStoreModal';

const SellerMobileNavigation = () => {
  const location = useLocation();
  const { orders, profile } = useSellerContext();
  const [showShareModal, setShowShareModal] = useState(false);
  const [animatingItem, setAnimatingItem] = useState<string | null>(null);
  const prevPathRef = useRef(location.pathname);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  // Trigger animation on route change
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      setAnimatingItem(location.pathname);
      const timer = setTimeout(() => setAnimatingItem(null), 350);
      prevPathRef.current = location.pathname;
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

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
      <nav className="fixed bottom-0 left-0 right-0 mobile-nav-floating bg-white/95 border-t border-slate-100/50 lg:hidden z-50 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1.5">
          {navItems.map((item) => {
            const active = isActive(item.to, item.exact);
            const isAnimating = animatingItem === item.to;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl 
                  transition-all duration-300 ease-out tap-feedback mobile-touch-target
                  ${active 
                    ? 'nav-bg-emerald-active text-white scale-105' 
                    : 'text-slate-400 hover:text-slate-600'
                  }
                  ${isAnimating ? 'nav-item-pop' : ''}
                `}
              >
                {/* Icon container with glow effect */}
                <div className={`relative ${active ? 'nav-glow-emerald' : ''} rounded-xl p-0.5`}>
                  <Icon 
                    className={`h-5 w-5 nav-icon-fill ${active ? 'active' : ''} transition-all duration-200`}
                    strokeWidth={active ? 2.5 : 2}
                    fill={active ? 'currentColor' : 'none'}
                  />
                  
                  {/* Badge */}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 h-[18px] min-w-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center badge-pulse shadow-lg shadow-red-500/30">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                
                {/* Label */}
                <span className={`text-[10px] font-semibold tracking-wide transition-all duration-200 ${active ? 'opacity-100' : 'opacity-70'}`}>
                  {item.label}
                </span>
                
                {/* Active indicator dot */}
                {active && (
                  <span className="absolute -bottom-0.5 w-1 h-1 bg-white rounded-full nav-indicator-animate shadow-sm" />
                )}
              </Link>
            );
          })}
          
          {/* Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-300 ease-out tap-feedback mobile-touch-target text-slate-400 hover:text-slate-600 active:scale-95"
          >
            <div className="rounded-xl p-0.5">
              <Share2 className="h-5 w-5" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-semibold tracking-wide opacity-70">Share</span>
          </button>
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
