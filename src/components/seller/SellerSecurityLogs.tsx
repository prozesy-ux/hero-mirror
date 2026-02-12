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
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Security & Login History</h2>
        <p className="text-sm text-slate-500">Recent login activity for your account</p>
      </div>

      <div className="bg-white border rounded-lg">
        {logins.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Shield className="h-10 w-10 mx-auto mb-2 text-slate-200" />
            <p>No login history available</p>
          </div>
        ) : (
          <div className="divide-y">
            {logins.map((entry, i) => (
              <div key={entry.id} className="p-4 flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Monitor className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-800">
                      {entry.device_info || 'Unknown Device'}
                    </p>
                    {i === 0 && <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">Current</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    {entry.ip_address && <span>{entry.ip_address}</span>}
                    {entry.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {entry.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
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
