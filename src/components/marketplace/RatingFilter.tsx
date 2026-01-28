import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingFilterProps {
  value: number | null;
  onChange: (rating: number | null) => void;
  className?: string;
}

const RATING_OPTIONS = [
  { value: null, label: 'All Ratings', stars: 0 },
  { value: 4, label: '4+ Stars', stars: 4 },
  { value: 3, label: '3+ Stars', stars: 3 },
];

export function RatingFilter({ value, onChange, className }: RatingFilterProps) {
  return (
    <div className={cn("bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden", className)}>
      {/* Header - Clean black/white */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <Star className="w-4 h-4 text-gray-700" />
        <h3 className="font-semibold text-gray-900 text-sm">Rating</h3>
      </div>
      
      <div className="p-3 space-y-1">
        {RATING_OPTIONS.map((option) => (
          <button
            key={option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
              value === option.value
                ? "bg-gray-900 text-white"
                : "hover:bg-gray-50 text-gray-700"
            )}
          >
            {/* Radio indicator */}
            <div
              className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                value === option.value
                  ? "border-white bg-white"
                  : "border-gray-300"
              )}
            >
              {value === option.value && (
                <div className="w-2 h-2 rounded-full bg-gray-900" />
              )}
            </div>
            
            <span className="text-sm font-medium flex-1">{option.label}</span>
            
            {/* Star icons */}
            {option.stars > 0 && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: option.stars }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3.5 h-3.5",
                      value === option.value
                        ? "text-white fill-white"
                        : "text-gray-900 fill-gray-900"
                    )}
                  />
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
