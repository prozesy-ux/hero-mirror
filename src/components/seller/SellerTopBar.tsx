import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSellerSidebarContext } from '@/contexts/SellerSidebarContext';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Bell, 
  Wallet, 
  LogOut, 
  Settings, 
  ChevronDown,
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  BarChart3,
  Share2,
  Lightbulb
} from 'lucide-react';
import theLogo from '@/assets/the-logo.png';
import ShareStoreModal from './ShareStoreModal';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

const navItems = [
  { path: '/seller', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/seller/products', label: 'Products', icon: Package },
  { path: '/seller/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/seller/chat', label: 'Messages', icon: MessageSquare },
  { path: '/seller/analytics', label: 'Analytics', icon: BarChart3 },
];

const SellerTopBar = () => {
  const { isCollapsed } = useSellerSidebarContext();
  const { profile, wallet, orders } = useSellerContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadChats, setUnreadChats] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  // Fetch seller notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!profile?.id) return;

      const { data } = await supabase
        .from('seller_notifications')
        .select('*')
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) setNotifications(data);
    };

    fetchNotifications();

    const channel = supabase
      .channel('seller-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_notifications' }, fetchNotifications)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  // Fetch unread chat count
  useEffect(() => {
    const fetchUnreadChats = async () => {
      if (!profile?.id) return;

      const { count } = await supabase
        .from('seller_chats')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', profile.id)
        .eq('sender_type', 'buyer')
        .eq('is_read', false);

      setUnreadChats(count || 0);
    };

    fetchUnreadChats();

    const channel = supabase
      .channel('seller-chats-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_chats' }, fetchUnreadChats)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('seller_notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!profile?.id) return;
    await supabase.from('seller_notifications').update({ is_read: true }).eq('seller_id', profile.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <header 
      className={`fixed top-0 right-0 h-16 bg-white border-b border-slate-100 z-40 transition-all duration-300 hidden lg:flex items-center justify-between px-6 ${
        isCollapsed ? 'left-[72px]' : 'left-60'
      }`}
    >
      {/* Left Section - Logo & Search */}
      <div className="flex items-center gap-6">
        <Link to="/seller" className="flex items-center gap-2">
          <img src={theLogo} alt="Logo" className="h-8 w-auto" />
        </Link>

        <div className={`relative transition-all duration-200 ${searchFocused ? 'w-80' : 'w-64'}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search products, orders..."
            className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.label === 'Orders' && pendingOrders > 0 && (
                  <Badge className="h-5 min-w-[20px] px-1.5 bg-red-500 text-white text-xs">
                    {pendingOrders}
                  </Badge>
                )}
                {item.label === 'Messages' && unreadChats > 0 && (
                  <Badge className="h-5 min-w-[20px] px-1.5 bg-red-500 text-white text-xs">
                    {unreadChats}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right Section - Share, Wallet, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* Share Store Button */}
        <Button
          variant="outline"
          onClick={() => setShowShareModal(true)}
          className="gap-2 rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden xl:inline">Share Store</span>
        </Button>

        {/* Wallet Balance */}
        <Link 
          to="/seller/wallet"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
        >
          <Wallet className="h-4 w-4 text-emerald-600" />
          <span className="font-semibold text-emerald-700">
            ${Number(wallet?.balance || 0).toFixed(2)}
          </span>
        </Link>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-slate-600" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadNotifications > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-emerald-600 hover:text-emerald-700"
                >
                  Mark all read
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem 
                  key={notification.id}
                  className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                    !notification.is_read ? 'bg-emerald-50/50' : ''
                  }`}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.link) navigate(notification.link);
                  }}
                >
                  <span className="font-medium text-sm">{notification.title}</span>
                  <span className="text-xs text-slate-500 line-clamp-2">{notification.message}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.store_logo_url || ''} />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                  {profile?.store_name?.charAt(0).toUpperCase() || 'S'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden xl:flex flex-col items-start">
                <span className="text-sm font-medium text-slate-900 max-w-[120px] truncate">
                  {profile?.store_name || 'My Store'}
                </span>
                <span className="text-xs text-slate-500">Seller</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.store_logo_url || ''} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700">
                    {profile?.store_name?.charAt(0).toUpperCase() || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile?.store_name}</p>
                  <p className="text-xs text-slate-500">Seller Account</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/seller/wallet" className="flex items-center gap-2 cursor-pointer">
                <Wallet className="h-4 w-4" />
                <span>Wallet</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/seller/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/seller/feature-requests" className="flex items-center gap-2 cursor-pointer">
                <Lightbulb className="h-4 w-4" />
                <span>Feature Requests</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="text-red-600 focus:text-red-600 cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Share Store Modal */}
      <ShareStoreModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        storeSlug={(profile as any)?.store_slug || null}
        storeName={profile?.store_name || 'My Store'}
      />
    </header>
  );
};

export default SellerTopBar;