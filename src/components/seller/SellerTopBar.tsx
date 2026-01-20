import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSellerSidebarContext } from '@/contexts/SellerSidebarContext';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
  LogOut, 
  Settings, 
  ChevronDown,
  Share2,
  ExternalLink
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
  const { profile, wallet, orders } = useSellerContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

  // Get page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/seller') return 'Home';
    if (path.includes('/products')) return 'Products';
    if (path.includes('/orders')) return 'Sales';
    if (path.includes('/chat')) return 'Inbox';
    if (path.includes('/analytics')) return 'Analytics';
    if (path.includes('/wallet')) return 'Payouts';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/feature-requests')) return 'Feature Requests';
    if (path.includes('/support')) return 'Help';
    return 'Dashboard';
  };

  const storeSlug = (profile as any)?.store_slug;
  const storeUrl = storeSlug ? `${window.location.origin}/store/${storeSlug}` : null;

  return (
    <header 
      className={`fixed top-0 right-0 h-14 bg-white border-b border-black/10 z-40 transition-all duration-300 hidden lg:flex items-center justify-between px-6 ${
        isCollapsed ? 'left-[72px]' : 'left-60'
      }`}
    >
      {/* Left Section - Page Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-black">{getPageTitle()}</h1>
        {pendingOrders > 0 && location.pathname === '/seller' && (
          <Badge className="bg-[#ff90e8] text-black font-semibold">
            {pendingOrders} pending
          </Badge>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* View Store Link */}
        {storeUrl && (
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-black/70 hover:text-black transition-colors"
          >
            <ExternalLink size={16} />
            <span>View store</span>
          </a>
        )}

        {/* Share Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowShareModal(true)}
          className="gap-2 border-black text-black hover:bg-black hover:text-white transition-colors"
        >
          <Share2 size={16} />
          <span>Share</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 hover:bg-black/5 rounded-lg transition-colors">
              <Bell size={20} className="text-black/70" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#ff90e8]" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 border-black/10">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadNotifications > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-[#ff90e8] hover:underline"
                >
                  Mark all read
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-black/50">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem 
                  key={notification.id}
                  className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                    !notification.is_read ? 'bg-[#ff90e8]/10' : ''
                  }`}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.link) navigate(notification.link);
                  }}
                >
                  <span className="font-medium text-sm">{notification.title}</span>
                  <span className="text-xs text-black/50 line-clamp-2">{notification.message}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1.5 hover:bg-black/5 rounded-lg transition-colors">
              <Avatar className="h-8 w-8 border border-black/10">
                <AvatarImage src={profile?.store_logo_url || ''} />
                <AvatarFallback className="bg-[#ff90e8] text-black font-semibold text-sm">
                  {profile?.store_name?.charAt(0).toUpperCase() || 'S'}
                </AvatarFallback>
              </Avatar>
              <ChevronDown size={16} className="text-black/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-black/10">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.store_logo_url || ''} />
                  <AvatarFallback className="bg-[#ff90e8] text-black">
                    {profile?.store_name?.charAt(0).toUpperCase() || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile?.store_name}</p>
                  <p className="text-xs text-black/50">${Number(wallet?.balance || 0).toFixed(2)} balance</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/seller/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings size={16} />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="text-red-600 focus:text-red-600 cursor-pointer"
            >
              <LogOut size={16} className="mr-2" />
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