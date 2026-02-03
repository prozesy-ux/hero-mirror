import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { LayoutDashboard, Package, ShoppingCart, Share2, Menu, ExternalLink, Bell, BarChart3, Warehouse, Users, Tag, FileText, Activity, MessageSquare, Wallet, Settings, Lightbulb, HelpCircle, Zap, TrendingUp } from 'lucide-react';
import ShareStoreModal from './ShareStoreModal';
import theLogo from '@/assets/the-logo.png';
import metaLogo from '@/assets/meta-logo.png';
import googleAdsLogo from '@/assets/google-ads-logo.png';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface SellerNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  link: string | null;
}

// Full sidebar nav items - synced with desktop SellerSidebar.tsx (Gumroad style)
const sidebarNavItems = [
  { to: '/seller', icon: LayoutDashboard, label: 'Home', exact: true },
  { to: '/seller/products', icon: Package, label: 'Products' },
  { to: '/seller/orders', icon: ShoppingCart, label: 'Sales' },
  { to: '/seller/customers', icon: Users, label: 'Customers' },
  { to: '/seller/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/seller/wallet', icon: Wallet, label: 'Payouts' },
  // Discount section items
  { to: '/seller/coupons', icon: Tag, label: 'Coupons' },
  { to: '/seller/flash-sales', icon: Zap, label: 'Flash Sales' },
  { to: '/seller/inventory', icon: Warehouse, label: 'Inventory' },
  // After discount
  { to: '/seller/product-analytics', icon: TrendingUp, label: 'Insights' },
  { to: '/seller/reports', icon: FileText, label: 'Reports' },
  { to: '/seller/performance', icon: Activity, label: 'Performance' },
  { to: '/seller/chat', icon: MessageSquare, label: 'Chat' },
];

const bottomSidebarItems = [
  { to: '/seller/settings', icon: Settings, label: 'Settings' },
  { to: '/seller/support', icon: HelpCircle, label: 'Help' },
];

const SellerMobileNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orders, profile } = useSellerContext();
  const [showShareModal, setShowShareModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!profile?.id) return;

      const { data, count } = await supabase
        .from('seller_notifications')
        .select('*', { count: 'exact' })
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) setNotifications(data);
      
      const { count: unread } = await supabase
        .from('seller_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', profile.id)
        .eq('is_read', false);
      
      setUnreadCount(unread || 0);
    };

    fetchNotifications();

    const channel = supabase
      .channel('seller-mobile-nav-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('seller_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  };

  const markAllAsRead = async () => {
    if (!profile?.id) return;
    await supabase
      .from('seller_notifications')
      .update({ is_read: true })
      .eq('seller_id', profile.id)
      .eq('is_read', false);
  };

  // Bottom nav items (limited for mobile) - added Wallet
  const navItems = [
    { to: '/seller', icon: LayoutDashboard, label: 'Home', exact: true },
    { to: '/seller/products', icon: Package, label: 'Products' },
    { to: '/seller/wallet', icon: Wallet, label: 'Wallet' },
    { to: '/seller/orders', icon: ShoppingCart, label: 'Orders', badge: pendingOrders },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/50 lg:hidden z-50">
        <div className="flex items-center justify-around px-1 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {/* Hamburger Menu - Opens Left Panel */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <button className="relative flex flex-col items-center gap-1 px-3 py-1.5 transition-colors duration-200 active:scale-95 active:opacity-80 text-white/60">
                <Menu size={22} strokeWidth={1.8} />
                <span className="text-[10px] font-semibold">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-52 p-0 bg-black flex flex-col border-r border-white/50">
              {/* Logo */}
              <div className="py-6 px-6 border-b border-white/50">
                <Link to="/seller" onClick={() => setSidebarOpen(false)}>
                  <span className="text-white text-2xl font-bold tracking-tight">uptoza</span>
                </Link>
              </div>
              
              {/* Navigation Links */}
              <ScrollArea className="flex-1">
                <nav>
                  {sidebarNavItems.map((item) => {
                    const active = isActive(item.to, item.exact);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-4 w-full px-6 py-4 text-sm font-normal transition-colors border-t border-white/50 ${
                          active 
                            ? 'text-[#FF90E8]' 
                            : 'text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon size={16} strokeWidth={1.5} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
                
                {/* Bottom section in mobile sheet */}
                <div className="border-t border-white/50 mt-4">
                  {bottomSidebarItems.map((item) => {
                    const active = isActive(item.to);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-4 w-full px-6 py-4 text-sm font-normal transition-colors border-t border-white/50 ${
                          active 
                            ? 'text-[#FF90E8]' 
                            : 'text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon size={16} strokeWidth={1.5} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </ScrollArea>
              
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
                  ${active ? 'text-[#FF90E8]' : 'text-white/60'}
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
            <div className="w-14 h-14 bg-[#FF90E8] rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30 active:scale-95 transition-transform">
              <Share2 size={24} className="text-black" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-semibold text-[#FF90E8]">Share</span>
          </button>

          {/* Orders nav item */}
          {navItems.slice(2).map((item) => {
            const active = isActive(item.to, item.exact);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  relative flex flex-col items-center gap-1 px-2 py-1.5
                  transition-colors duration-200
                  active:scale-95 active:opacity-80
                  ${active ? 'text-[#FF90E8]' : 'text-white/60'}
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

          {/* Notification Bell */}
          <DropdownMenu open={showNotifDropdown} onOpenChange={setShowNotifDropdown}>
            <DropdownMenuTrigger asChild>
              <button className="relative flex flex-col items-center gap-1 px-2 py-1.5 text-white/60 active:scale-95">
                <div className="relative">
                  <Bell size={22} strokeWidth={1.8} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold">Alerts</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-80 bg-white border border-slate-200 shadow-xl z-[100] rounded-xl p-0 overflow-hidden mb-2"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                {notifications.some(n => !n.is_read) && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              
              {/* Notifications List */}
              <ScrollArea className="max-h-64">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell size={32} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((notif) => (
                      <DropdownMenuItem 
                        key={notif.id}
                        onClick={() => {
                          markAsRead(notif.id);
                          setShowNotifDropdown(false);
                          if (notif.link) navigate(notif.link);
                        }}
                        className={`flex flex-col items-start p-3 cursor-pointer focus:bg-slate-50 ${
                          !notif.is_read ? 'bg-emerald-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2 w-full">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            !notif.is_read ? 'bg-emerald-500' : 'bg-transparent'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{notif.title}</p>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {format(new Date(notif.created_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              {/* Footer */}
              {notifications.length > 0 && (
                <Link 
                  to="/seller/support"
                  onClick={() => setShowNotifDropdown(false)}
                  className="block text-center py-2.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium border-t border-slate-100 bg-slate-50"
                >
                  View all
                </Link>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Avatar */}
          <Link 
            to="/seller/settings" 
            className={`flex flex-col items-center gap-1 px-2 py-1.5 ${
              isActive('/seller/settings') ? 'text-[#FF90E8]' : 'text-white/60'
            }`}
          >
            <Avatar className="h-6 w-6 ring-1 ring-white/30">
              <AvatarImage src={profile?.store_logo_url || ''} />
              <AvatarFallback className="bg-white/10 text-white text-[10px] font-semibold">
                {profile?.store_name?.charAt(0).toUpperCase() || 'S'}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-semibold">Profile</span>
          </Link>
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
