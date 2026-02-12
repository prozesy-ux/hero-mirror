import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, User, Video, MapPin, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ServiceBooking {
  id: string;
  seller_id: string;
  scheduled_at: string;
  service_type: string;
  status: string;
  meeting_link: string | null;
  notes: string | null;
  price: number | null;
  created_at: string;
  seller?: { store_name: string; email: string };
}

const BuyerServiceBookings = () => {
  const { user } = useAuthContext();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('service_bookings')
        .select('*, seller:seller_profiles(store_name, email)')
        .eq('buyer_id', user.id)
        .order('scheduled_at', { ascending: false });
      
      if (data) setBookings(data as any);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Cancel this booking?')) return;
    const { error } = await supabase
      .from('service_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);
    
    if (error) {
      toast.error('Failed to cancel booking');
    } else {
      toast.success('Booking cancelled');
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
    }
  };

  const getFilteredBookings = () => {
    const now = new Date();
    return bookings.filter(b => {
      const bookingDate = new Date(b.scheduled_at);
      if (filter === 'upcoming') return bookingDate > now && b.status !== 'cancelled';
      if (filter === 'completed') return b.status === 'completed';
      if (filter === 'cancelled') return b.status === 'cancelled';
      return true;
    });
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>;

  const filtered = getFilteredBookings();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Service Bookings ({filtered.length})</h2>
        <div className="flex gap-2">
          {(['all', 'upcoming', 'completed', 'cancelled'] as const).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className={filter === f ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-lg divide-y">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Calendar className="h-10 w-10 mx-auto mb-2 text-slate-200" />
            <p>No bookings yet</p>
          </div>
        ) : filtered.map(booking => {
          const isUpcoming = new Date(booking.scheduled_at) > new Date() && booking.status !== 'cancelled';
          
          return (
            <div key={booking.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900">{booking.seller?.store_name || 'Seller'}</h3>
                    {booking.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    )}
                    {booking.status === 'cancelled' && (
                      <XCircle className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{booking.seller?.email}</p>
                  <div className="flex gap-3 mt-2 text-xs text-slate-600 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(booking.scheduled_at), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(booking.scheduled_at), 'h:mm a')}
                    </span>
                    <span className="flex items-center gap-1 capitalize">
                      {booking.service_type === 'call' && <Video className="h-3 w-3" />}
                      {booking.service_type === 'meeting' && <MapPin className="h-3 w-3" />}
                      {booking.service_type}
                    </span>
                    {booking.price && <span className="font-semibold text-slate-900">${booking.price}</span>}
                  </div>
                  {booking.meeting_link && (
                    <a href={booking.meeting_link} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline mt-2 inline-block">
                      Join Meeting →
                    </a>
                  )}
                  {booking.notes && <p className="text-xs text-slate-500 mt-2 italic">{booking.notes}</p>}
                </div>
                {isUpcoming && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelBooking(booking.id)}
                    className="text-slate-500"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BuyerServiceBookings;
