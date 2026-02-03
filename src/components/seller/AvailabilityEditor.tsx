import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlot {
  day: string;
  start: string;
  end: string;
  enabled: boolean;
}

interface AvailabilityEditorProps {
  slots: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
  duration: number;
  onDurationChange: (duration: number) => void;
}

const DAYS = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

const AvailabilityEditor = ({ 
  slots, 
  onChange, 
  duration, 
  onDurationChange 
}: AvailabilityEditorProps) => {
  const [view, setView] = useState<'simple' | 'advanced'>('simple');

  // Initialize slots if empty
  const initializeSlots = () => {
    if (slots.length === 0) {
      const defaultSlots = DAYS.map(day => ({
        day: day.key,
        start: '09:00',
        end: '17:00',
        enabled: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day.key)
      }));
      onChange(defaultSlots);
      return defaultSlots;
    }
    return slots;
  };

  const currentSlots = slots.length > 0 ? slots : initializeSlots();

  const toggleDay = (dayKey: string) => {
    const updated = currentSlots.map(slot =>
      slot.day === dayKey ? { ...slot, enabled: !slot.enabled } : slot
    );
    onChange(updated);
  };

  const updateSlot = (dayKey: string, field: 'start' | 'end', value: string) => {
    const updated = currentSlots.map(slot =>
      slot.day === dayKey ? { ...slot, [field]: value } : slot
    );
    onChange(updated);
  };

  const applyToAll = (start: string, end: string) => {
    const updated = currentSlots.map(slot => ({
      ...slot,
      start,
      end
    }));
    onChange(updated);
  };

  const enabledDays = currentSlots.filter(s => s.enabled);

  return (
    <div className="space-y-6">
      {/* Call Duration */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-2 block">
          Call Duration
        </label>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => onDurationChange(mins)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                duration === mins
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
              )}
            >
              {mins < 60 ? `${mins} min` : `${mins / 60}h`}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Toggle Days */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-2 block">
          Available Days
        </label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => {
            const slot = currentSlots.find(s => s.day === day.key);
            const isEnabled = slot?.enabled || false;
            
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => toggleDay(day.key)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium border transition-colors min-w-[60px]",
                  isEnabled
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                )}
              >
                {day.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-700">
            Working Hours
          </label>
          <button
            type="button"
            onClick={() => setView(view === 'simple' ? 'advanced' : 'simple')}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {view === 'simple' ? 'Customize per day' : 'Use same hours'}
          </button>
        </div>

        {view === 'simple' ? (
          // Simple view - same hours for all days
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={currentSlots[0]?.start || '09:00'}
                onChange={(e) => applyToAll(e.target.value, currentSlots[0]?.end || '17:00')}
                className="w-32 h-9"
              />
              <span className="text-gray-500">to</span>
              <Input
                type="time"
                value={currentSlots[0]?.end || '17:00'}
                onChange={(e) => applyToAll(currentSlots[0]?.start || '09:00', e.target.value)}
                className="w-32 h-9"
              />
            </div>
            <span className="text-sm text-gray-500 ml-auto">
              All enabled days
            </span>
          </div>
        ) : (
          // Advanced view - per day customization
          <div className="space-y-2">
            {DAYS.map((day) => {
              const slot = currentSlots.find(s => s.day === day.key);
              if (!slot) return null;

              return (
                <div 
                  key={day.key}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                    slot.enabled ? "bg-gray-50" : "bg-gray-50/50 opacity-50"
                  )}
                >
                  <Switch
                    checked={slot.enabled}
                    onCheckedChange={() => toggleDay(day.key)}
                    className="data-[state=checked]:bg-green-500"
                  />
                  <span className="w-24 font-medium text-sm text-gray-700">
                    {day.label}
                  </span>
                  {slot.enabled && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateSlot(day.key, 'start', e.target.value)}
                        className="w-28 h-8 text-sm"
                      />
                      <span className="text-gray-400">-</span>
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateSlot(day.key, 'end', e.target.value)}
                        className="w-28 h-8 text-sm"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>{duration} minute</strong> calls available on{' '}
          <strong>{enabledDays.length} day{enabledDays.length !== 1 ? 's' : ''}</strong>
          {enabledDays.length > 0 && (
            <span className="text-blue-700">
              {' '}({enabledDays.map(s => DAYS.find(d => d.key === s.day)?.short).join(', ')})
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default AvailabilityEditor;
