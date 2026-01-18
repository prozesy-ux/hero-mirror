import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import theLogo from '@/assets/the-logo.png';

const SellerMobileHeader = () => {
  const { profile } = useSellerContext();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

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

  return (
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
  );
};

export default SellerMobileHeader;
