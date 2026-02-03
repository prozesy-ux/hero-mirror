import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Phone,
  Palette,
  Clock,
  Calendar,
  Video,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DeliverableItem {
  url: string;
  name: string;
  delivered_at: string;
}

interface ServiceBooking {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  booking_type: string;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  meeting_link: string | null;
  timezone: string | null;
  commission_brief: string | null;
  deposit_paid: boolean;
  final_paid: boolean;
  deliverables: DeliverableItem[] | null;
  notes: string | null;
  created_at: string;
  // Joined data
  product?: {
    name: string;
    icon_url: string | null;
    price: number;
  };
  seller?: {
    store_name: string;
    store_logo_url: string | null;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: Calendar },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-700', icon: Loader2 },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const ServiceBookingView = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'call' | 'commission'>('all');

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          *,
          product:seller_products(name, icon_url, price),
          seller:seller_profiles(store_name, store_logo_url)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast the data - use unknown intermediate cast
      setBookings((data || []) as unknown as ServiceBooking[]);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => 
    filter === 'all' || b.booking_type === filter
  );

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={cn("gap-1", config.color)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard/library')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-sm text-gray-500">Manage your calls and commissions</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'call', 'commission'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === f
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {f === 'all' ? 'All' : f === 'call' ? 'Calls' : 'Commissions'}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="font-medium text-gray-900 mb-1">No bookings yet</h3>
          <p className="text-sm text-gray-500">
            Your calls and commissions will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(booking => (
            <div
              key={booking.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                  booking.booking_type === 'call' 
                    ? "bg-blue-100 text-blue-600"
                    : "bg-purple-100 text-purple-600"
                )}>
                  {booking.booking_type === 'call' ? (
                    <Phone className="w-6 h-6" />
                  ) : (
                    <Palette className="w-6 h-6" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {booking.product?.name || 'Service'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        with {booking.seller?.store_name || 'Seller'}
                      </p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  {/* Call Details */}
                  {booking.booking_type === 'call' && (
                    <div className="mt-3 space-y-2">
                      {booking.scheduled_date ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>
                            {format(new Date(booking.scheduled_date), 'MMMM d, yyyy')}
                            {booking.scheduled_time && ` at ${booking.scheduled_time}`}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-amber-600">
                          📅 Awaiting scheduling
                        </p>
                      )}
                      {booking.duration_minutes && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{booking.duration_minutes} minutes</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Commission Details */}
                  {booking.booking_type === 'commission' && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <span className={cn(
                          "px-2 py-1 rounded",
                          booking.deposit_paid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        )}>
                          Deposit: {booking.deposit_paid ? 'Paid ✓' : 'Pending'}
                        </span>
                        <span className={cn(
                          "px-2 py-1 rounded",
                          booking.final_paid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        )}>
                          Final: {booking.final_paid ? 'Paid ✓' : 'Pending'}
                        </span>
                      </div>
                      {booking.commission_brief && (
                        <p className="text-sm text-gray-600 line-clamp-2 italic">
                          "{booking.commission_brief}"
                        </p>
                      )}
                      {booking.deliverables && booking.deliverables.length > 0 && (
                        <p className="text-sm text-green-600">
                          📦 {booking.deliverables.length} deliverable(s) ready
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {booking.booking_type === 'call' && booking.meeting_link && booking.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => window.open(booking.meeting_link!, '_blank')}
                        className="gap-1.5"
                      >
                        <Video className="w-4 h-4" />
                        Join Meeting
                      </Button>
                    )}
                    
                    {booking.booking_type === 'call' && booking.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/dashboard/book-call/${booking.id}`)}
                        className="gap-1.5"
                      >
                        <Calendar className="w-4 h-4" />
                        Schedule Call
                      </Button>
                    )}

                    {booking.deliverables && booking.deliverables.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Open first deliverable
                          window.open(booking.deliverables[0].url, '_blank');
                        }}
                        className="gap-1.5"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Deliverables
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate('/dashboard/chat')}
                      className="gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </Button>
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

export default ServiceBookingView;
