import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Check, Trash2, Filter, ShoppingBag, MessageSquare, Wallet, AlertCircle, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const BuyerNotifications = () => {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Real-time subscription
      const channel = supabase
        .channel('buyer-notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchNotifications();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (data) setNotifications(data);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user?.id)
      .eq('is_read', false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag className="w-5 h-5 text-blue-600" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-violet-600" />;
      case 'wallet': return <Wallet className="w-5 h-5 text-emerald-600" />;
      case 'promo': return <Gift className="w-5 h-5 text-orange-600" />;
      default: return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-100';
      case 'message': return 'bg-violet-100';
      case 'wallet': return 'bg-emerald-100';
      case 'promo': return 'bg-orange-100';
      default: return 'bg-slate-100';
    }
  };

  const filteredNotifications = notifications.filter(n => 
    typeFilter === 'all' || n.type === typeFilter
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 rounded-2xl" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Notifications</h1>
          <p className="text-sm text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] rounded-xl border-slate-200">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="order">Orders</SelectItem>
              <SelectItem value="message">Messages</SelectItem>
              <SelectItem value="wallet">Wallet</SelectItem>
              <SelectItem value="promo">Promotions</SelectItem>
            </SelectContent>
          </Select>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="rounded-xl"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
          <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No notifications</h3>
          <p className="text-slate-500">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div 
              key={notification.id}
              onClick={() => !notification.is_read && markAsRead(notification.id)}
              className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors ${
                notification.is_read 
                  ? 'border-slate-100 hover:bg-slate-50' 
                  : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBg(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={`font-semibold ${notification.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                        {notification.title}
                      </h3>
                      <p className={`text-sm mt-1 ${notification.is_read ? 'text-slate-500' : 'text-slate-600'}`}>
                        {notification.message}
                      </p>
                    </div>
                    
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400">
                      {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {notification.type}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuyerNotifications;
