import { useState, useEffect } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Package, DollarSign, Star, AlertCircle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Notification {
  id: string;
  seller_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const iconMap: Record<string, any> = {
  order: Package,
  payment: DollarSign,
  review: Star,
  alert: AlertCircle,
};

const SellerNotificationCenter = () => {
  const { profile } = useSellerContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('seller_notifications')
        .select('*')
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setNotifications(data as any);
      setLoading(false);
    };
    fetch();
  }, [profile?.id]);

  const markAsRead = async (id: string) => {
    await supabase.from('seller_notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!profile?.id) return;
    await supabase.from('seller_notifications').update({ is_read: true }).eq('seller_id', profile.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All marked as read');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
          <p className="text-sm text-slate-500">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead}>
            <Check className="h-3 w-3 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      <div className="bg-white border rounded-lg divide-y">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bell className="h-10 w-10 mx-auto mb-2 text-slate-200" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => {
            const Icon = iconMap[n.type] || Bell;
            return (
              <div
                key={n.id}
                className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                onClick={() => !n.is_read && markAsRead(n.id)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!n.is_read ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? 'font-medium text-slate-900' : 'text-slate-700'}`}>{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{format(new Date(n.created_at), 'MMM d, h:mm a')}</p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SellerNotificationCenter;
