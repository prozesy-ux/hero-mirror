import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSellerContext } from '@/contexts/SellerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { BellRing, X, Wallet, Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

const SellerMobileHeader = () => {
  const { profile, wallet } = useSellerContext();
  const { formatAmountOnly } = useCurrency();
  const { permission, isSubscribed, isLoading: pushLoading, subscribe, isSupported } = usePushNotifications();
  const navigate = useNavigate();
  const [pushBannerDismissed, setPushBannerDismissed] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Check if push banner was dismissed for mobile
  useEffect(() => {
    const dismissed = localStorage.getItem('push_banner_dismissed_seller_mobile');
    if (!dismissed) {
      setPushBannerDismissed(false);
    } else {
      const dismissedTime = parseInt(dismissed);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      setPushBannerDismissed(Date.now() - dismissedTime < sevenDays);
    }
  }, []);

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
      .channel('seller-notifications-mobile')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_notifications' }, fetchNotifications)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase.from('seller_notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!profile?.id) return;
    await supabase.from('seller_notifications').update({ is_read: true }).eq('seller_id', profile.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const dismissPushBanner = () => {
    localStorage.setItem('push_banner_dismissed_seller_mobile', Date.now().toString());
    setPushBannerDismissed(true);
  };

  const handleEnablePush = async () => {
    await subscribe();
    setPushBannerDismissed(true);
  };

  return (
    <>
      {/* Premium Mobile Header - Clean White with Shadow */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center justify-between px-4 lg:hidden z-50">
        {/* Text Logo */}
        <Link to="/seller" className="flex items-center">
          <span className="text-lg font-bold text-slate-900 tracking-tight">UPTOZA</span>
        </Link>

        {/* Right Side Actions - Wallet + Notifications */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center active:scale-95 transition-transform">
                <Bell className="h-4 w-4 text-slate-600" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-xl shadow-lg border-slate-100">
              <DropdownMenuLabel className="flex items-center justify-between py-2.5">
                <span className="text-slate-900 font-semibold text-sm">Notifications</span>
                {unreadNotifications > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id}
                    className={`flex flex-col items-start gap-0.5 p-2.5 cursor-pointer rounded-lg mx-1 ${
                      !notification.is_read ? 'bg-emerald-50/50' : ''
                    }`}
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.link) navigate(notification.link);
                    }}
                  >
                    <span className="font-medium text-[13px] text-slate-800">{notification.title}</span>
                    <span className="text-[11px] text-slate-500 line-clamp-2">{notification.message}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Wallet Balance Quick View */}
          <Link 
            to="/seller/wallet"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 active:scale-95 transition-transform"
          >
            <Wallet className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700">
              {formatAmountOnly(Number(wallet?.balance || 0))}
            </span>
          </Link>
        </div>
      </header>

      {/* Mobile Push Notification Banner */}
      {isSupported && permission === 'default' && !pushBannerDismissed && !isSubscribed && (
        <div className="fixed bottom-20 left-4 right-4 z-50 lg:hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Enable Push Notifications</p>
                <p className="text-xs text-white/80 truncate">Never miss new orders</p>
              </div>
              <Button
                size="sm"
                onClick={handleEnablePush}
                disabled={pushLoading}
                className="bg-white text-emerald-700 hover:bg-white/90 font-semibold shrink-0"
              >
                {pushLoading ? '...' : 'Enable'}
              </Button>
              <button
                onClick={dismissPushBanner}
                className="text-white/60 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SellerMobileHeader;
