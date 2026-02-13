import { useState, useEffect } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, User, Video, MapPin, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ServiceBooking {
  id: string;
  buyer_id: string;
  scheduled_at: string;
  service_type: string;
  status: string;
  meeting_link: string | null;
  notes: string | null;
  created_at: string;
  buyer?: { email: string; full_name: string };
}

const SellerServiceBookings = () => {
  const { profile } = useSellerContext();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');

  useEffect(() => {
    if (!profile) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from('service_bookings')
        .select('*, buyer:profiles(email, full_name)')
        .eq('seller_id', profile.id)
        .order('scheduled_at', { ascending: false });
      if (!error && data) setBookings(data as any);
      setLoading(false);
    };
    fetch();
  }, [profile]);

  const updateStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase.from('service_bookings').update({ status: newStatus }).eq('id', bookingId);
    if (error) { toast.error('Failed to update booking'); }
    else { toast.success('Booking updated'); setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)); }
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

  if (loading) return (
    <div className="bg-[#FCFCFC] min-h-screen p-8 space-y-4">
      {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
    </div>
  );

  const filtered = getFilteredBookings();

  return (
    <div className="bg-[#FCFCFC] min-h-screen p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Service Bookings</h2>
          <p className="text-sm text-[#6B7280]">Manage your service appointments</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'upcoming', 'completed', 'cancelled'] as const).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className={filter === f ? 'bg-[#FF7F00] hover:bg-[#e67200] text-white rounded-xl' : 'bg-white border-gray-200 rounded-xl'}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No bookings found</p>
          </div>
        ) : filtered.map(booking => (
          <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-[#1F2937]">{booking.buyer?.full_name || 'Customer'}</h3>
                  {booking.status === 'completed' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                  {booking.status === 'cancelled' && <AlertCircle className="h-4 w-4 text-gray-400" />}
                </div>
                <p className="text-sm text-[#6B7280] mt-1">{booking.buyer?.email}</p>
                <div className="flex gap-3 mt-2 text-xs text-[#6B7280]">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(booking.scheduled_at), 'MMM d, yyyy')}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(booking.scheduled_at), 'h:mm a')}</span>
                  <span className="flex items-center gap-1 capitalize">
                    {booking.service_type === 'call' && <Video className="h-3 w-3" />}
                    {booking.service_type === 'meeting' && <MapPin className="h-3 w-3" />}
                    {booking.service_type}
                  </span>
                </div>
                {booking.meeting_link && (
                  <a href={booking.meeting_link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#FF7F00] hover:underline mt-1 inline-block">
                    Join Meeting →
                  </a>
                )}
                {booking.notes && <p className="text-xs text-[#6B7280] mt-2 italic">{booking.notes}</p>}
              </div>
              {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateStatus(booking.id, 'completed')} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-xl">
                    Complete
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(booking.id, 'cancelled')} className="text-[#6B7280] rounded-xl border-gray-200">
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SellerServiceBookings;
