import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSellerSidebarContext } from '@/contexts/SellerSidebarContext';
import { useSellerContext } from '@/contexts/SellerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { CurrencySelector } from '@/components/ui/currency-selector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Share2,
  Lightbulb,
  BellRing,
  X
} from 'lucide-react';
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

const SellerTopBar = () => {
  const { isCollapsed } = useSellerSidebarContext();
  const { profile, wallet } = useSellerContext();
  const { formatAmountOnly } = useCurrency();
  const { permission, isSubscribed, isLoading: pushLoading, subscribe, isSupported } = usePushNotifications();
  const navigate = useNavigate();
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [pushBannerDismissed, setPushBannerDismissed] = useState(true);

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

  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
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
      className={`fixed top-0 right-0 h-14 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] z-40 transition-all duration-300 hidden lg:flex items-center justify-between px-6 ${
        isCollapsed ? 'left-[72px]' : 'left-[240px]'
      }`}
    >
      {/* Left Section - Search Only (Logo moved to sidebar) */}
      <div className="flex items-center">
        <div className={`relative transition-all duration-200 ${searchFocused ? 'w-96' : 'w-80'}`}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search products, orders..."
            className="h-10 pl-11 pr-4 bg-slate-50/80 border-0 rounded-2xl text-[14px] placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Right Section - Currency, Share, Wallet, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Currency Selector */}
        <CurrencySelector variant="minimal" />

        {/* Share Store Button */}
        <Button
          variant="ghost"
          onClick={() => setShowShareModal(true)}
          className="gap-2 h-10 px-4 rounded-xl text-violet-600 hover:bg-violet-50 hover:text-violet-700 font-medium"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden xl:inline">Share Store</span>
        </Button>

        {/* Wallet Balance - Premium Gradient Style */}
        <Link 
          to="/seller/wallet"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/80 hover:border-emerald-200 transition-colors"
        >
          <Wallet className="h-4 w-4 text-emerald-600" />
          <span className="text-[15px] font-bold text-emerald-700">
            {formatAmountOnly(Number(wallet?.balance || 0))}
          </span>
        </Link>

        {/* Notifications - Clean Icon Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">
              <Bell className="h-[18px] w-[18px] text-slate-500" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-xl shadow-lg border-slate-100">
            <DropdownMenuLabel className="flex items-center justify-between py-3">
              <span className="text-slate-900 font-semibold">Notifications</span>
              {unreadNotifications > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Mark all read
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100" />
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem 
                  key={notification.id}
                  className={`flex flex-col items-start gap-1 p-3 cursor-pointer rounded-lg mx-1 ${
                    !notification.is_read ? 'bg-emerald-50/50' : ''
                  }`}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.link) navigate(notification.link);
                  }}
                >
                  <span className="font-medium text-sm text-slate-800">{notification.title}</span>
                  <span className="text-xs text-slate-500 line-clamp-2">{notification.message}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown - Cleaner Avatar Style */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors">
              <Avatar className="h-8 w-8 ring-2 ring-slate-100">
                <AvatarImage src={profile?.store_logo_url || ''} />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold text-sm">
                  {profile?.store_name?.charAt(0).toUpperCase() || 'S'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden xl:flex flex-col items-start">
                <span className="text-[14px] font-medium text-slate-800 max-w-[120px] truncate">
                  {profile?.store_name || 'My Store'}
                </span>
                <span className="text-[12px] text-slate-500">Seller</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-slate-100">
            <DropdownMenuLabel className="py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.store_logo_url || ''} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700">
                    {profile?.store_name?.charAt(0).toUpperCase() || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-slate-900">{profile?.store_name}</p>
                  <p className="text-xs text-slate-500">Seller Account</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem asChild>
              <Link to="/seller/wallet" className="flex items-center gap-2.5 cursor-pointer py-2.5 rounded-lg mx-1">
                <Wallet className="h-4 w-4 text-slate-500" />
                <span>Wallet</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/seller/settings" className="flex items-center gap-2.5 cursor-pointer py-2.5 rounded-lg mx-1">
                <Settings className="h-4 w-4 text-slate-500" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/seller/feature-requests" className="flex items-center gap-2.5 cursor-pointer py-2.5 rounded-lg mx-1">
                <Lightbulb className="h-4 w-4 text-slate-500" />
                <span>Feature Requests</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="text-red-600 focus:text-red-600 cursor-pointer py-2.5 rounded-lg mx-1"
            >
              <LogOut className="h-4 w-4 mr-2.5" />
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
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-2xl p-5 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <BellRing className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">Never Miss an Order!</h3>
                <p className="text-sm text-white/80 mt-1">
                  Get instant alerts for new orders, messages & payments.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <Button
                    size="sm"
                    onClick={handleEnablePush}
                    disabled={pushLoading}
                    className="bg-white text-emerald-700 hover:bg-white/90 font-semibold"
                  >
                    {pushLoading ? 'Enabling...' : 'Enable'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={dismissPushBanner}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    Later
                  </Button>
                </div>
              </div>
              <button
                onClick={dismissPushBanner}
                className="text-white/60 hover:text-white transition-colors"
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
