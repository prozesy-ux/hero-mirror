import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSellerContext } from '@/contexts/SellerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { BellRing, X, Wallet } from 'lucide-react';
import theLogo from '@/assets/the-logo.png';

const SellerMobileHeader = () => {
  const { profile, wallet } = useSellerContext();
  const { formatAmountOnly } = useCurrency();
  const { permission, isSubscribed, isLoading: pushLoading, subscribe, isSupported } = usePushNotifications();
  const [pushBannerDismissed, setPushBannerDismissed] = useState(true);

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
      {/* Simplified Mobile Header - Logo + Wallet Balance */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:hidden z-50">
        <Link to="/seller" className="flex items-center">
          <img src={theLogo} alt="Logo" className="h-7 w-auto" />
        </Link>

        {/* Wallet Balance Quick View */}
        <Link 
          to="/seller/wallet"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 active:scale-95 transition-transform"
        >
          <Wallet className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-bold text-emerald-700">
            {formatAmountOnly(Number(wallet?.balance || 0))}
          </span>
        </Link>
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
