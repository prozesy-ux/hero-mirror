import { useState, useEffect } from 'react';
import { X, Megaphone, AlertTriangle, Info, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  target_audience: string;
}

interface AnnouncementBannerProps {
  audience: 'buyer' | 'seller';
}

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  success: <Bell className="h-4 w-4" />,
  promo: <Megaphone className="h-4 w-4" />,
};

const typeStyles: Record<string, string> = {
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  promo: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
};

export function AnnouncementBanner({ audience }: AnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('platform_announcements')
        .select('id, title, message, type, target_audience')
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
        .in('target_audience', ['all', audience === 'buyer' ? 'buyers' : 'sellers'])
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAnnouncements(data);
      }
    };

    // Load dismissed announcements from localStorage
    const stored = localStorage.getItem('dismissed_announcements');
    if (stored) {
      setDismissedIds(JSON.parse(stored));
    }

    fetchAnnouncements();
  }, [audience]);

  const dismissAnnouncement = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem('dismissed_announcements', JSON.stringify(updated));
  };

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id));

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visibleAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className={`relative flex items-start gap-3 p-3 rounded-lg border ${typeStyles[announcement.type] || typeStyles.info}`}
        >
          <div className="shrink-0 mt-0.5">
            {typeIcons[announcement.type] || typeIcons.info}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{announcement.title}</p>
            <p className="text-xs opacity-80 mt-0.5">{announcement.message}</p>
          </div>
          <button
            onClick={() => dismissAnnouncement(announcement.id)}
            className="shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
