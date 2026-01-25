import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, Bell, FileText, Bot, CreditCard, MessageCircle, 
  Crown, LogOut, User, ChevronDown, Wallet, X, Check, ExternalLink, Sparkles
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSearchContext } from '@/contexts/SearchContext';
import { supabase } from '@/integrations/supabase/client';
import { playSound } from '@/lib/sounds';
import theLogo from '@/assets/the-logo.png';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const DashboardTopBar = ({ sidebarCollapsed = false }: DashboardTopBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuthContext();
  const { searchQuery, setSearchQuery } = useSearchContext();
  const [unreadCount, setUnreadCount] = useState(0);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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
      const { count } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('sender_type', 'admin')
        .eq('is_read', false);
      
      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    const channel = supabase
      .channel('topbar-unread')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch wallet balance
  useEffect(() => {
    if (!user) return;

    const fetchWallet = async () => {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newWallet } = await supabase
          .from('user_wallets')
          .insert({ user_id: user.id, balance: 0 })
          .select('balance')
          .single();
        setWallet(newWallet);
      } else if (data) {
        setWallet(data);
      }
    };

    fetchWallet();

    const walletChannel = supabase
      .channel('topbar-wallet')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_wallets',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchWallet()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
    };
  }, [user]);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data);
      }
    };

    fetchNotifications();

    const notifChannel = supabase
      .channel('topbar-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
    };
  }, [user]);

  const unreadNotifications = notifications.filter(n => !n.is_read).length;
  const totalUnread = unreadCount + unreadNotifications;

  const markNotificationAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
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
        return <MessageCircle size={14} className="text-violet-500" />;
      case 'purchase':
        return <Bot size={14} className="text-green-500" />;
      case 'topup':
        return <Wallet size={14} className="text-blue-500" />;
      default:
        return <Bell size={14} className="text-gray-500" />;
    }
  };

  return (
    <header className={`hidden lg:flex fixed top-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm transition-all duration-300 ${
      sidebarCollapsed ? 'left-[72px]' : 'left-60'
    }`}>
      <div className="flex items-center justify-between w-full px-6">
        {/* Left Section - Logo, Search & Navigation */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard/prompts" className="flex items-center gap-3 flex-shrink-0">
            <img src={theLogo} alt="Logo" className="h-8 w-auto" />
          </Link>

          {/* Search Bar */}
          <div className={`relative w-64 transition-all duration-300 ${isSearchFocused ? 'w-80' : ''}`}>
            <div className={`relative flex items-center bg-gray-100 rounded-full transition-all duration-300 ${isSearchFocused ? 'ring-2 ring-violet-500 bg-white shadow-lg' : 'hover:bg-gray-200'}`}>
              <Search size={16} className="absolute left-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full bg-transparent py-2 pl-9 pr-8 text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X size={12} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1">
            <Link
              to="/dashboard/prompts"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/dashboard/prompts'
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <FileText size={16} />
              Prompts
            </Link>
            <Link
              to="/dashboard/ai-accounts"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/dashboard/ai-accounts'
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Bot size={16} />
              Marketplace
            </Link>
            <Link
              to="/dashboard/billing"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/dashboard/billing'
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <CreditCard size={16} />
              Billing
            </Link>
            <Link
              to="/dashboard/chat"
              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/dashboard/chat'
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <MessageCircle size={16} />
              Chat
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Spacer to push right section to the end */}
        <div className="flex-1" />

        {/* Right Section - Become Seller, Wallet, Notifications, Profile */}
        <div className="flex items-center gap-3 ml-6">
          {/* Become a Seller CTA - Premium Design */}
          <Link
            to="/seller"
            className="group relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300" />
            <Sparkles size={16} className="relative z-10" />
            <span className="relative z-10">Become a Seller</span>
          </Link>

          {/* Wallet Balance */}
          <button
            onClick={() => navigate('/dashboard/billing')}
            className="flex items-center gap-2 bg-violet-100 hover:bg-violet-200 border border-violet-200 px-3 py-2 rounded-xl transition-colors"
          >
            <Wallet size={16} className="text-violet-600" />
            <span className="text-violet-700 font-bold text-sm">
              ${wallet?.balance?.toFixed(2) || '0.00'}
            </span>
          </button>

          {/* Notification Bell with Dropdown */}
          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2.5 rounded-xl text-gray-500 hover:text-violet-600 hover:bg-violet-50 transition-all duration-200">
                <Bell size={20} />
                {totalUnread > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 max-h-[400px] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadNotifications > 0 && (
                  <button 
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
                  >
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
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-violet-50 transition-colors border-b border-gray-50 bg-violet-50/50"
                  >
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <MessageCircle size={14} className="text-violet-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">Message from Support Team</p>
                      <p className="text-xs text-gray-500">You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''}</p>
                      <p className="text-[10px] text-violet-500 mt-0.5 font-medium">Tap to view conversation</p>
                    </div>
                    <ExternalLink size={14} className="text-gray-400 mt-1" />
                  </button>
                )}

                {/* Notifications List */}
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                        !notification.is_read ? 'bg-violet-50/50' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        !notification.is_read ? 'bg-violet-100' : 'bg-gray-100'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className={`text-sm truncate ${!notification.is_read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{notification.message}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </button>
                  ))
                ) : unreadCount === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Bell size={20} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No notifications yet</p>
                  </div>
                ) : null}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-gray-100 transition-colors">
                <div className="relative">
                  <div className="rounded-full bg-gradient-to-br from-violet-500 to-purple-600 p-0.5 w-9 h-9">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full object-cover bg-white"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
                        {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  {profile?.is_pro && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center ring-2 ring-white">
                      <Crown size={8} className="text-black" />
                    </div>
                  )}
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gradient-to-br from-violet-500 to-purple-600 p-0.5 w-10 h-10">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full object-cover bg-white"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
                        {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-2">
                      {profile?.full_name || 'User'}
                      {profile?.is_pro && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded text-[10px] font-bold text-black">
                          <Crown size={10} />
                          PRO
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile" className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                  <User size={16} className="text-gray-500" />
                  <span>Profile Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/billing" className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                  <Wallet size={16} className="text-gray-500" />
                  <span>Wallet & Billing</span>
                  <span className="ml-auto text-xs font-semibold text-violet-600">
                    ${wallet?.balance?.toFixed(2) || '0.00'}
                  </span>
                </Link>
              </DropdownMenuItem>
              {!profile?.is_pro && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link 
                      to="/dashboard/billing" 
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100"
                    >
                      <Crown size={16} className="text-amber-600" />
                      <span className="font-semibold text-amber-700">Upgrade to Pro</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={signOut}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
              >
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
