import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSellerContext } from '@/contexts/SellerContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Phone,
  Palette,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  Upload,
  MessageCircle,
  X,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Deliverable {
  url: string;
  name: string;
  delivered_at: string;
}

interface ServiceBooking {
  id: string;
  order_id: string;
  buyer_id: string;
  booking_type: string;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  meeting_link: string | null;
  commission_brief: string | null;
  deposit_paid: boolean;
  final_paid: boolean;
  deliverables: Deliverable[] | null;
  notes: string | null;
  created_at: string;
  product?: {
    name: string;
    price: number;
  };
  buyer?: {
    email: string;
    full_name: string;
  };
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

const SellerServiceManagement = () => {
  const { profile } = useSellerContext();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'call' | 'commission'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal state
  const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(null);
  const [modalAction, setModalAction] = useState<'meeting_link' | 'deliverable' | 'complete' | null>(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [deliverableName, setDeliverableName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchBookings();
    }
  }, [profile?.id]);

  const fetchBookings = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          *,
          product:seller_products(name, price)
        `)
        .eq('seller_id', profile.id)
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

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('service_bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;
      
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status } : b
      ));
      toast.success('Status updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const addMeetingLink = async () => {
    if (!selectedBooking || !meetingLink.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('service_bookings')
        .update({ 
          meeting_link: meetingLink.trim(),
          status: 'scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;
      
      setBookings(prev => prev.map(b => 
        b.id === selectedBooking.id 
          ? { ...b, meeting_link: meetingLink.trim(), status: 'scheduled' } 
          : b
      ));
      toast.success('Meeting link added');
      setModalAction(null);
      setMeetingLink('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add meeting link');
    } finally {
      setSubmitting(false);
    }
  };

  const addDeliverable = async () => {
    if (!selectedBooking || !deliverableUrl.trim()) return;

    setSubmitting(true);
    try {
      const newDeliverable = {
        url: deliverableUrl.trim(),
        name: deliverableName.trim() || 'Deliverable',
        delivered_at: new Date().toISOString()
      };
      
      const existingDeliverables = (selectedBooking.deliverables || []) as Deliverable[];
      const updatedDeliverables = [...existingDeliverables, newDeliverable];

      const { error } = await supabase
        .from('service_bookings')
        .update({ 
          deliverables: JSON.parse(JSON.stringify(updatedDeliverables)),
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;
      
      setBookings(prev => prev.map(b => 
        b.id === selectedBooking.id 
          ? { ...b, deliverables: updatedDeliverables, status: 'in_progress' } 
          : b
      ));
      toast.success('Deliverable added');
      setModalAction(null);
      setDeliverableUrl('');
      setDeliverableName('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add deliverable');
    } finally {
      setSubmitting(false);
    }
  };

  const markComplete = async () => {
    if (!selectedBooking) return;

    setSubmitting(true);
    try {
      // Update booking status
      const { error: bookingError } = await supabase
        .from('service_bookings')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBooking.id);

      if (bookingError) throw bookingError;

      // Update order status
      const { error: orderError } = await supabase
        .from('seller_orders')
        .update({ status: 'completed' })
        .eq('id', selectedBooking.order_id);

      if (orderError) throw orderError;
      
      setBookings(prev => prev.map(b => 
        b.id === selectedBooking.id 
          ? { ...b, status: 'completed' } 
          : b
      ));
      toast.success('Service marked as complete');
      setModalAction(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete service');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (filter !== 'all' && b.booking_type !== filter) return false;
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Service Management</h1>
        <p className="text-sm text-gray-500">Manage your calls, commissions, and service orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['all', 'call', 'commission'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                filter === f ? "bg-white shadow-sm" : "text-gray-600"
              )}
            >
              {f === 'all' ? 'All' : f === 'call' ? 'Calls' : 'Commissions'}
            </button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm border-0"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="font-medium text-gray-900 mb-1">No bookings found</h3>
          <p className="text-sm text-gray-500">
            Service bookings will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map(booking => (
            <div
              key={booking.id}
              className="bg-white border border-gray-200 rounded-xl p-4"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  booking.booking_type === 'call' 
                    ? "bg-blue-100 text-blue-600"
                    : "bg-purple-100 text-purple-600"
                )}>
                  {booking.booking_type === 'call' ? (
                    <Phone className="w-5 h-5" />
                  ) : (
                    <Palette className="w-5 h-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {booking.product?.name || 'Service'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {booking.buyer?.full_name || booking.buyer?.email || 'Customer'}
                      </p>
                    </div>
                    <Badge className={statusConfig[booking.status]?.color}>
                      {statusConfig[booking.status]?.label}
                    </Badge>
                  </div>

                  {/* Info Row */}
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                    {booking.scheduled_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(booking.scheduled_date), 'MMM d, yyyy')}
                        {booking.scheduled_time && ` at ${booking.scheduled_time}`}
                      </span>
                    )}
                    {booking.duration_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {booking.duration_minutes} min
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      ${booking.product?.price || 0}
                    </span>
                  </div>

                  {/* Commission Brief Preview */}
                  {booking.commission_brief && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 bg-gray-50 p-2 rounded">
                      "{booking.commission_brief}"
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {booking.booking_type === 'call' && !booking.meeting_link && booking.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setModalAction('meeting_link');
                        }}
                      >
                        Add Meeting Link
                      </Button>
                    )}

                    {booking.booking_type === 'commission' && booking.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setModalAction('deliverable');
                        }}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Add Deliverable
                      </Button>
                    )}

                    {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setModalAction('complete');
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Complete
                      </Button>
                    )}

                    {booking.meeting_link && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(booking.meeting_link!, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Meeting Link
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Meeting Link Modal */}
      <Dialog open={modalAction === 'meeting_link'} onOpenChange={() => setModalAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Meeting Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Meeting URL (Zoom, Google Meet, etc.)
              </label>
              <Input
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setModalAction(null)}>
                Cancel
              </Button>
              <Button onClick={addMeetingLink} disabled={submitting || !meetingLink.trim()}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Deliverable Modal */}
      <Dialog open={modalAction === 'deliverable'} onOpenChange={() => setModalAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Deliverable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                File URL
              </label>
              <Input
                value={deliverableUrl}
                onChange={(e) => setDeliverableUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Name (optional)
              </label>
              <Input
                value={deliverableName}
                onChange={(e) => setDeliverableName(e.target.value)}
                placeholder="e.g., Final Design"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setModalAction(null)}>
                Cancel
              </Button>
              <Button onClick={addDeliverable} disabled={submitting || !deliverableUrl.trim()}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Deliverable
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark Complete Modal */}
      <Dialog open={modalAction === 'complete'} onOpenChange={() => setModalAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Service Complete</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-gray-600 mb-4">
              Are you sure you want to mark this service as complete? This will also complete the associated order.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setModalAction(null)}>
                Cancel
              </Button>
              <Button onClick={markComplete} disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Mark Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerServiceManagement;
