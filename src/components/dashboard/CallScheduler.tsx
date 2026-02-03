import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Phone,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimeSlot {
  day: string;
  start: string;
  end: string;
  enabled: boolean;
}

interface ServiceBooking {
  id: string;
  product_id: string;
  seller_id: string;
  duration_minutes: number;
  product?: {
    name: string;
    availability_slots: unknown;
  };
  seller?: {
    store_name: string;
  };
}

// Generate time slots from availability
const generateTimeSlots = (
  availability: TimeSlot[],
  selectedDate: Date,
  durationMinutes: number
): string[] => {
  const dayName = format(selectedDate, 'EEEE').toLowerCase();
  const daySlot = availability.find(s => s.day.toLowerCase() === dayName && s.enabled);
  
  if (!daySlot) return [];

  const slots: string[] = [];
  const [startHour, startMin] = daySlot.start.split(':').map(Number);
  const [endHour, endMin] = daySlot.end.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMin = startMin;
  
  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMin + durationMinutes <= endMin)
  ) {
    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    slots.push(timeStr);
    
    currentMin += 30; // 30 min intervals
    if (currentMin >= 60) {
      currentMin -= 60;
      currentHour += 1;
    }
  }
  
  return slots;
};

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};

const CallScheduler = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  
  const [booking, setBooking] = useState<ServiceBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    if (bookingId && user) {
      fetchBooking();
    }
  }, [bookingId, user]);

  const fetchBooking = async () => {
    if (!bookingId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          id, product_id, seller_id, duration_minutes,
          product:seller_products(name, availability_slots),
          seller:seller_profiles(store_name)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      setBooking(data as ServiceBooking);
    } catch (error) {
      console.error('Failed to fetch booking:', error);
      toast.error('Failed to load booking');
      navigate('/dashboard/bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !booking) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('service_bookings')
        .update({
          scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
          scheduled_time: selectedTime,
          timezone,
          status: 'scheduled'
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast.success('Call scheduled successfully!');
      navigate('/dashboard/bookings');
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule call');
    } finally {
      setSubmitting(false);
    }
  };

  const availability = (booking?.product?.availability_slots as TimeSlot[] | null) || [];
  const enabledDays = availability.filter(s => s.enabled).map(s => s.day.toLowerCase());
  
  const isDateAvailable = (date: Date) => {
    const dayName = format(date, 'EEEE').toLowerCase();
    const today = startOfDay(new Date());
    return isAfter(date, today) && enabledDays.includes(dayName);
  };

  const timeSlots = selectedDate
    ? generateTimeSlots(availability, selectedDate, booking?.duration_minutes || 30)
    : [];

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Booking not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard/bookings')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Your Call</h1>
          <p className="text-sm text-gray-500">
            {booking.product?.name} with {booking.seller?.store_name}
          </p>
        </div>
      </div>

      {/* Duration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Phone className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="font-medium text-blue-900">
            {booking.duration_minutes || 30} Minute Call
          </p>
          <p className="text-sm text-blue-700">
            Timezone: {timezone}
          </p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Select a Date</h2>
        </div>
        
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            setSelectedDate(date);
            setSelectedTime(null);
          }}
          disabled={(date) => !isDateAvailable(date)}
          fromDate={addDays(new Date(), 1)}
          toDate={addDays(new Date(), 60)}
          className="rounded-md border mx-auto"
        />
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">
              Select a Time on {format(selectedDate, 'MMMM d, yyyy')}
            </h2>
          </div>

          {timeSlots.length === 0 ? (
            <p className="text-center py-4 text-gray-500">
              No available times for this date
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {timeSlots.map(time => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={cn(
                    "px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    selectedTime === time
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {formatTime(time)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm Button */}
      <Button
        onClick={handleSchedule}
        disabled={!selectedDate || !selectedTime || submitting}
        className="w-full h-12 text-base gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Scheduling...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            Confirm Booking
            {selectedDate && selectedTime && (
              <span className="ml-1 text-white/80">
                - {format(selectedDate, 'MMM d')} at {formatTime(selectedTime)}
              </span>
            )}
          </>
        )}
      </Button>
    </div>
  );
};

export default CallScheduler;
