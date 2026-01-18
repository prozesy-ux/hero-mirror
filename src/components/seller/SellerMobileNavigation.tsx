import { Link, useLocation } from 'react-router-dom';
import { useSellerContext } from '@/contexts/SellerContext';
import { LayoutDashboard, Package, ShoppingCart, MessageSquare } from 'lucide-react';

const SellerMobileNavigation = () => {
  const location = useLocation();
  const { orders } = useSellerContext();

  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const navItems = [
    { to: '/seller', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/seller/products', icon: Package, label: 'Products' },
    { to: '/seller/orders', icon: ShoppingCart, label: 'Orders', badge: pendingOrders },
    { to: '/seller/chat', icon: MessageSquare, label: 'Messages' },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around lg:hidden z-50">
      {navItems.map((item) => {
        const active = isActive(item.to, item.exact);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors relative ${
              active ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            <item.icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-slate-500'}`} />
            <span className="text-xs font-medium">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="absolute -top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default SellerMobileNavigation;
