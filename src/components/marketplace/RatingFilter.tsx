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
    <div className={cn("bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden", className)}>
      <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-amber-50">
        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
        <h3 className="font-bold text-gray-900 text-sm">Rating Filter</h3>
      </div>
      
      <div className="p-3 space-y-1">
        {RATING_OPTIONS.map((option) => (
          <button
            key={option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
              value === option.value
                ? "bg-yellow-100 text-yellow-800"
                : "hover:bg-gray-50 text-gray-700"
            )}
          >
            <div
              className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                value === option.value
                  ? "border-yellow-500 bg-yellow-500"
                  : "border-gray-300"
              )}
            >
              {value === option.value && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>
            
            <span className="text-sm font-medium flex-1">{option.label}</span>
            
            {option.stars > 0 && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: option.stars }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400"
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
