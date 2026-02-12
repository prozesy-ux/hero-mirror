import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSellerSidebarContext } from '@/contexts/SellerSidebarContext';
import { useSellerContext } from '@/contexts/SellerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { CurrencySelector } from '@/components/ui/currency-selector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Bell, 
  Wallet, 
  LogOut, 
  Settings, 
  ChevronDown,
  Share2,
  Lightbulb,
  BellRing,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ShareStoreModal from './ShareStoreModal';
import { DashboardSearchBar } from '../dashboard/DashboardSearchBar';
interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

const SellerTopBar = () => {
  const { isCollapsed } = useSellerSidebarContext();
  const { profile, wallet, orders } = useSellerContext();
  const { formatAmountOnly } = useCurrency();
  const { permission, isSubscribed, isLoading: pushLoading, subscribe, isSupported } = usePushNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadChats, setUnreadChats] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [pushBannerDismissed, setPushBannerDismissed] = useState(true);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  // Check if push banner was dismissed for sellers
  useEffect(() => {
    const dismissed = localStorage.getItem('push_banner_dismissed_seller');
    if (!dismissed) {
      setPushBannerDismissed(false);
    } else {
      const dismissedTime = parseInt(dismissed);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      setPushBannerDismissed(Date.now() - dismissedTime < sevenDays);
    }
  }, []);

  const dismissPushBanner = () => {
    localStorage.setItem('push_banner_dismissed_seller', Date.now().toString());
    setPushBannerDismissed(true);
  };

  const handleEnablePush = async () => {
    await subscribe();
    setPushBannerDismissed(true);
  };

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
      className={`fixed top-0 right-0 h-16 bg-[#F3EAE0] border-b border-black/10 z-40 transition-all duration-300 hidden lg:flex items-center justify-between px-6 ${
        isCollapsed ? 'left-[72px]' : 'left-52'
      }`}
    >
      {/* Left Section - Search */}
      <div className="flex items-center gap-6">
        {/* Search Bar - Premium Style with Suggestions */}
        <DashboardSearchBar 
          placeholder="Search products, orders..." 
          className="flex-1 max-w-3xl" 
        />

      </div>

      {/* Right Section - Share, Wallet, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* Currency Selector */}
        <CurrencySelector variant="minimal" />

        {/* Share Store Button - Gumroad Style */}
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded border border-black text-black text-sm font-medium transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden xl:inline">Share Store</span>
        </button>

        {/* Wallet Balance - Gumroad Style */}
        <Link 
          to="/seller/wallet"
          className="flex items-center gap-2 px-3 py-2 rounded bg-[#FF90E8] border border-black transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <Wallet className="h-4 w-4 text-black" />
          <span className="font-bold text-black text-sm">
            {formatAmountOnly(Number(wallet?.balance || 0))}
          </span>
        </Link>

        {/* Notifications - Gumroad Style */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2.5 rounded border border-transparent text-slate-600 transition-all hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 border border-black rounded">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadNotifications > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-[#FF90E8] hover:text-black font-medium"
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
                    !notification.is_read ? 'bg-[#FFF5FB]' : ''
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

        {/* Profile Dropdown - Gumroad Style */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 transition-colors">
              <Avatar className="h-8 w-8 border-2 border-black">
                <AvatarImage src={profile?.store_logo_url || ''} />
                <AvatarFallback className="bg-[#FF90E8]/20 text-black font-semibold">
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
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border border-black rounded">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-black">
                  <AvatarImage src={profile?.store_logo_url || ''} />
                  <AvatarFallback className="bg-[#FF90E8]/20 text-black">
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

      {/* Push Notification Permission Banner */}
      {isSupported && permission === 'default' && !pushBannerDismissed && !isSubscribed && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#FF90E8] border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 text-black">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-black/10 flex items-center justify-center shrink-0">
                <BellRing className="w-6 h-6 text-black" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">Never Miss an Order!</h3>
                <p className="text-sm text-black/70 mt-1">
                  Get instant alerts for new orders, messages & payments.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <Button
                    size="sm"
                    onClick={handleEnablePush}
                    disabled={pushLoading}
                    className="bg-black text-white hover:bg-black/80 font-semibold border-0"
                  >
                    {pushLoading ? 'Enabling...' : 'Enable'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={dismissPushBanner}
                    className="text-black/70 hover:text-black hover:bg-black/10"
                  >
                    Later
                  </Button>
                </div>
              </div>
              <button
                onClick={dismissPushBanner}
                className="text-black/60 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default SellerTopBar;