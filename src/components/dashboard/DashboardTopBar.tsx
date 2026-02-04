import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Crown, LogOut, User, ChevronDown, Wallet, Check, ExternalLink, MessageCircle } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { playSound } from '@/lib/sounds';
import { format } from 'date-fns';
import { CurrencySelector } from '@/components/ui/currency-selector';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { GumroadProductsIcon } from './GumroadIcons';
import { DashboardSearchBar } from './DashboardSearchBar';

interface DashboardTopBarProps {
  sidebarCollapsed?: boolean;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const DashboardTopBar = ({
  sidebarCollapsed = false
}: DashboardTopBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    profile,
    signOut,
    user
  } = useAuthContext();
  const {
    formatAmountOnly
  } = useCurrency();
  const [unreadCount, setUnreadCount] = useState(0);
  const [wallet, setWallet] = useState<{
    balance: number;
  } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const prevUnreadCountRef = useRef<number>(0);

  // Play sound when unread count increases
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current >= 0) {
      playSound('messageReceived');
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  // Fetch unread message count
  useEffect(() => {
    if (!user) return;
    const fetchUnreadCount = async () => {
      const {
        count
      } = await supabase.from('support_messages').select('*', {
        count: 'exact',
        head: true
      }).eq('user_id', user.id).eq('sender_type', 'admin').eq('is_read', false);
      setUnreadCount(count || 0);
    };
    fetchUnreadCount();
    const channel = supabase.channel('topbar-unread').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'support_messages',
      filter: `user_id=eq.${user.id}`
    }, () => {
      fetchUnreadCount();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch wallet balance
  useEffect(() => {
    if (!user) return;
    const fetchWallet = async () => {
      const {
        data,
        error
      } = await supabase.from('user_wallets').select('balance').eq('user_id', user.id).single();
      if (error && error.code === 'PGRST116') {
        const {
          data: newWallet
        } = await supabase.from('user_wallets').insert({
          user_id: user.id,
          balance: 0
        }).select('balance').single();
        setWallet(newWallet);
      } else if (data) {
        setWallet(data);
      }
    };
    fetchWallet();
    const walletChannel = supabase.channel('topbar-wallet').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_wallets',
      filter: `user_id=eq.${user.id}`
    }, () => fetchWallet()).subscribe();
    return () => {
      supabase.removeChannel(walletChannel);
    };
  }, [user]);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const {
        data,
        error
      } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      }).limit(20);
      if (!error && data) {
        setNotifications(data);
      }
    };
    fetchNotifications();
    const notifChannel = supabase.channel('topbar-notifications').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`
    }, () => fetchNotifications()).subscribe();
    return () => {
      supabase.removeChannel(notifChannel);
    };
  }, [user]);

  const unreadNotifications = notifications.filter(n => !n.is_read).length;
  const totalUnread = unreadCount + unreadNotifications;

  const markNotificationAsRead = async (notificationId: string) => {
    await supabase.from('notifications').update({
      is_read: true
    }).eq('id', notificationId);
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({
      is_read: true
    }).eq('user_id', user.id).eq('is_read', false);
  };

  const handleNotificationClick = (notification: Notification) => {
    markNotificationAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
    setNotificationsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle size={14} className="text-[#FF90E8]" />;
      case 'purchase':
        return <GumroadProductsIcon size={14} className="text-green-500" />;
      case 'topup':
        return <Wallet size={14} className="text-blue-500" />;
      default:
        return <Bell size={14} className="text-gray-500" />;
    }
  };

  return (
    <header className={`hidden lg:flex fixed top-0 right-0 z-50 h-16 bg-[#FBF8F3] border-b border-black/10 transition-all duration-300 ${sidebarCollapsed ? 'left-[72px]' : 'left-52'}`}>
      <div className="flex items-center justify-between w-full px-6">
        {/* Left Section - Logo, Search & Navigation */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard/prompts" className="flex items-center gap-3 flex-shrink-0">
            
          </Link>

          {/* Search Bar - Premium Style with Suggestions */}
          <DashboardSearchBar 
            placeholder="Search products, prompts..." 
            className="flex-1 max-w-3xl" 
          />

        </div>

        {/* Spacer to push right section to the end */}
        <div className="flex-1" />

        {/* Right Section - Currency, Become Seller, Wallet, Notifications, Profile */}
        <div className="flex items-center gap-3 ml-6">
          {/* Currency Selector */}
          <CurrencySelector variant="minimal" />

          {/* Become a Seller CTA - Gumroad Style */}
          <Link 
            to="/seller" 
            className="px-4 py-2 bg-[#FF90E8] border border-black text-black rounded font-semibold text-sm transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Become a Seller
          </Link>

          {/* Wallet Balance - Gumroad Style */}
          <button 
            onClick={() => navigate('/dashboard/billing')} 
            className="flex items-center gap-2 bg-[#FF90E8] border border-black px-3 py-2 rounded transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <Wallet size={16} className="text-black" />
            <span className="text-black font-bold text-sm">
              {formatAmountOnly(wallet?.balance || 0)}
            </span>
          </button>

          {/* Notification Bell with Dropdown - Gumroad Style */}
          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2.5 rounded border border-transparent text-slate-600 transition-all hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Bell size={20} />
                {totalUnread > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 max-h-[400px] overflow-hidden border border-black rounded">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="font-semibold text-slate-900">Notifications</h3>
                {unreadNotifications > 0 && (
                  <button onClick={markAllNotificationsAsRead} className="text-xs text-[#FF90E8] hover:text-black font-medium flex items-center gap-1">
                    <Check size={12} />
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-[320px] overflow-y-auto">
                {/* Unread Messages Section */}
                {unreadCount > 0 && (
                  <button 
                    onClick={() => {
                      navigate('/dashboard/chat');
                      setNotificationsOpen(false);
                    }} 
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b bg-[#FFF5FB]"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#FF90E8]/20 flex items-center justify-center flex-shrink-0">
                      <MessageCircle size={14} className="text-[#FF90E8]" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-slate-900">Message from Support Team</p>
                      <p className="text-xs text-slate-500">You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''}</p>
                      <p className="text-[10px] text-[#FF90E8] mt-0.5 font-medium">Tap to view conversation</p>
                    </div>
                    <ExternalLink size={14} className="text-slate-400 mt-1" />
                  </button>
                )}

                {/* Notifications List */}
                {notifications.length > 0 ? notifications.map(notification => (
                  <button 
                    key={notification.id} 
                    onClick={() => handleNotificationClick(notification)} 
                    className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b ${!notification.is_read ? 'bg-[#FFF5FB]' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!notification.is_read ? 'bg-[#FF90E8]/20' : 'bg-slate-100'}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className={`text-sm truncate ${!notification.is_read ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{notification.message}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    {!notification.is_read && <span className="w-2 h-2 bg-[#FF90E8] rounded-full flex-shrink-0 mt-2" />}
                  </button>
                )) : unreadCount === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Bell size={20} className="text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">No notifications yet</p>
                  </div>
                ) : null}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown - Gumroad Style */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-slate-100 transition-colors">
                <div className="relative">
                  <div className="rounded-full border-2 border-black w-9 h-9 overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#FF90E8] flex items-center justify-center text-black font-bold text-sm">
                        {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  {profile?.is_pro && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#FF90E8] border border-black rounded-full flex items-center justify-center">
                      <Crown size={8} className="text-black" />
                    </div>
                  )}
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 border border-black rounded">
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-full border-2 border-black w-10 h-10 overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#FF90E8] flex items-center justify-center text-black font-bold text-sm">
                        {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate flex items-center gap-2">
                      {profile?.full_name || 'User'}
                      {profile?.is_pro && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#FF90E8] border border-black rounded text-[10px] font-bold text-black">
                          <Crown size={10} />
                          PRO
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile" className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                  <User size={16} className="text-slate-500" />
                  <span>Profile Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/billing" className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                  <Wallet size={16} className="text-slate-500" />
                  <span>Wallet & Billing</span>
                  <span className="ml-auto text-xs font-bold text-black">
                    ${wallet?.balance?.toFixed(2) || '0.00'}
                  </span>
                </Link>
              </DropdownMenuItem>
              {!profile?.is_pro && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/billing" className="flex items-center gap-3 px-3 py-2.5 cursor-pointer bg-[#FFF5FB] hover:bg-[#FF90E8]/20 rounded">
                      <Crown size={16} className="text-[#FF90E8]" />
                      <span className="font-medium">Upgrade to PRO</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-3 px-3 py-2.5 text-red-600 cursor-pointer">
                <LogOut size={16} />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardTopBar;