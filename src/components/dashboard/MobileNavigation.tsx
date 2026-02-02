import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingBag, Wallet, CreditCard, MessageSquare, Bell, Menu, ShoppingCart, Heart, BarChart3, ExternalLink, LayoutDashboard, FileText, User } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import theLogo from '@/assets/the-logo.png';
import metaLogo from '@/assets/meta-logo.png';
import googleAdsLogo from '@/assets/google-ads-logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  link: string | null;
}

const MobileNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      fetchNotifications();
      
      // Subscribe to realtime updates for support_messages
      const supportChannel = supabase
        .channel('mobile-nav-support')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `user_id=eq.${user.id}`
        }, () => fetchUnreadCount())
        .subscribe();
      
      // Subscribe to realtime updates for notifications
      const notifChannel = supabase
        .channel('mobile-nav-notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchUnreadCount();
          fetchNotifications();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(supportChannel);
        supabase.removeChannel(notifChannel);
      };
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    
    // Count unread support messages from admin
    const { count: supportCount } = await supabase
      .from('support_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('sender_type', 'admin')
      .eq('is_read', false);
    
    // Count unread notifications
    const { count: notifCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    setUnreadCount((supportCount || 0) + (notifCount || 0));
  };

  const fetchNotifications = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) setNotifications(data);
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    fetchNotifications();
    fetchUnreadCount();
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    fetchNotifications();
    fetchUnreadCount();
  };

  // Bottom nav items (limited for mobile)
  const bottomNavItems = [
    { to: '/dashboard/prompts', icon: Sparkles, label: 'Prompt' },
    { to: '/dashboard/marketplace', icon: ShoppingBag, label: 'Market' },
    { to: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
    { to: '/dashboard/chat', icon: MessageSquare, label: 'Chat' },
  ];

  // Full sidebar nav items - Gumroad style
  const sidebarNavItems = [
    { to: '/dashboard/home', icon: LayoutDashboard, label: 'Home' },
    { to: '/dashboard/marketplace', icon: ShoppingBag, label: 'Marketplace' },
    { to: '/dashboard/orders', icon: ShoppingCart, label: 'My Orders' },
    { to: '/dashboard/wishlist', icon: Heart, label: 'Wishlist' },
    { to: '/dashboard/prompts', icon: Sparkles, label: 'Prompts' },
    { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/dashboard/reports', icon: FileText, label: 'Reports' },
    { to: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
  ];

  const bottomSidebarItems = [
    { to: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
    { to: '/dashboard/chat', icon: MessageSquare, label: 'Support' },
    { to: '/dashboard/profile', icon: User, label: 'Settings' },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      {/* Bottom Navigation Bar with Menu + Notification */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/20 lg:hidden z-50">
        <div className="flex items-center justify-around px-1 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {/* Hamburger Menu - Opens Left Panel */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <button className="relative flex flex-col items-center gap-1 px-3 py-1.5 transition-colors duration-200 active:scale-95 active:opacity-80 text-white/60">
                <Menu size={22} strokeWidth={1.8} />
                <span className="text-[10px] font-semibold">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-black text-white flex flex-col border-r border-white/20">
              {/* Logo - Gumroad style */}
              <div className="p-6">
                <Link to="/dashboard" onClick={() => setSidebarOpen(false)}>
                  <span className="text-white text-2xl font-bold tracking-tight">uptoza</span>
                </Link>
              </div>
              
              {/* Navigation Links - Gumroad style */}
              <ScrollArea className="flex-1">
                <nav>
                  {sidebarNavItems.map((item, index) => {
                    const active = isActive(item.to);
                    const Icon = item.icon;
                    const isLast = index === sidebarNavItems.length - 1;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-4 w-full px-6 py-4 text-sm transition-colors border-t border-white/50 ${isLast ? 'border-b' : ''} ${
                          active 
                            ? 'text-[#FF90E8]' 
                            : 'text-white/70 hover:text-[#FF90E8]'
                        }`}
                      >
                        <Icon size={16} strokeWidth={1.5} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
                
                {/* Bottom section */}
                <div className="mt-8">
                  {bottomSidebarItems.map((item, index) => {
                    const active = isActive(item.to);
                    const Icon = item.icon;
                    const isLast = index === bottomSidebarItems.length - 1;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-4 w-full px-6 py-4 text-sm transition-colors border-t border-white/50 ${isLast ? 'border-b' : ''} ${
                          active 
                            ? 'text-[#FF90E8]' 
                            : 'text-white/70 hover:text-[#FF90E8]'
                        }`}
                      >
                        <Icon size={16} strokeWidth={1.5} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
                
                {/* Become a Seller */}
                <div className="px-6 py-4 border-t border-white/50 mt-8">
                  <button
                    onClick={() => {
                      setSidebarOpen(false);
                      navigate('/seller');
                    }}
                    className="w-full text-center text-sm transition-colors"
                  >
                    <span className="text-white/50">Want to sell?</span>{' '}
                    <span className="font-medium text-[#FF90E8] hover:underline">
                      Become a Seller →
                    </span>
                  </button>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
          
          {/* Nav Items */}
          {bottomNavItems.map((item) => {
            const active = isActive(item.to);
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
                {/* Active indicator bar */}
                {active && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#FF90E8] rounded-full" />
                )}
                
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Notification Bell */}
          <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
            <DropdownMenuTrigger asChild>
              <button className="relative flex flex-col items-center gap-1 px-3 py-1.5 transition-colors duration-200 active:scale-95 active:opacity-80 text-white/60">
                <div className="relative">
                  <Bell size={22} strokeWidth={1.8} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-[#FF90E8] text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold">Alerts</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              side="top"
              sideOffset={12}
              className="w-80 bg-white border border-gray-200 shadow-xl z-[100] rounded-xl p-0 overflow-hidden mb-2"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {notifications.some(n => !n.is_read) && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              
              {/* Notifications List */}
              <ScrollArea className="max-h-64">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notif) => (
                      <DropdownMenuItem 
                        key={notif.id}
                        onClick={() => {
                          markAsRead(notif.id);
                          if (notif.link) window.location.href = notif.link;
                        }}
                        className={`flex flex-col items-start p-3 cursor-pointer focus:bg-gray-50 ${
                          !notif.is_read ? 'bg-violet-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2 w-full">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            !notif.is_read ? 'bg-violet-500' : 'bg-transparent'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{notif.title}</p>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">
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
                  to="/dashboard/notifications"
                  onClick={() => setShowDropdown(false)}
                  className="block text-center py-2.5 text-sm text-violet-600 hover:text-violet-700 font-medium border-t border-gray-100 bg-gray-50"
                >
                  View all notifications
                </Link>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </>
  );
};

export default MobileNavigation;
