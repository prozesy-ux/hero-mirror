import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSellerContext } from '@/contexts/SellerContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, X } from 'lucide-react';
import theLogo from '@/assets/the-logo.png';

const SellerMobileHeader = () => {
  const { profile } = useSellerContext();
  const { permission, isSubscribed, isLoading: pushLoading, subscribe, isSupported } = usePushNotifications();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushBannerDismissed, setPushBannerDismissed] = useState(true);

  useEffect(() => {
    const fetchUnread = async () => {
      if (!profile?.id) return;

      const { count } = await supabase
        .from('seller_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', profile.id)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel('seller-mobile-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_notifications' }, fetchUnread)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

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
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:hidden z-50">
        <Link to="/seller" className="flex items-center">
          <img src={theLogo} alt="Logo" className="h-7 w-auto" />
        </Link>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => navigate('/seller/support')}
          >
            <Bell className="h-5 w-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          <Link to="/seller/settings">
            <Avatar className="h-8 w-8 ring-2 ring-emerald-100">
              <AvatarImage src={profile?.store_logo_url || ''} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">
                {profile?.store_name?.charAt(0).toUpperCase() || 'S'}
              </AvatarFallback>
            </Avatar>
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
