import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Monitor, MapPin, Clock, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface LoginEntry {
  id: string;
  user_id: string;
  ip_address: string | null;
  device_info: string | null;
  location: string | null;
  user_agent: string | null;
  logged_in_at: string;
}

const SellerSecurityLogs = () => {
  const { user } = useAuthContext();
  const [logins, setLogins] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('login_history')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_in_at', { ascending: false })
        .limit(50);
      if (data) setLogins(data as any);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-[#F3EAE0] min-h-screen p-8 space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="bg-[#F3EAE0] min-h-screen p-8 space-y-6" style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div>
        <h2 className="text-2xl font-bold text-[#1F2937]">Security & Login History</h2>
        <p className="text-sm text-[#6B7280]">Recent login activity for your account</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        {logins.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No login history available</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logins.map((entry, i) => (
              <div key={entry.id} className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Monitor className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#1F2937]">
                      {entry.device_info || 'Unknown Device'}
                    </p>
                    {i === 0 && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Current</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[#6B7280]">
                    {entry.ip_address && <span>{entry.ip_address}</span>}
                    {entry.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {entry.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#6B7280] flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(entry.logged_in_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerSecurityLogs;
