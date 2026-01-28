import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PriceFilterSidebarProps {
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number | undefined, max: number | undefined) => void;
  className?: string;
}

const QUICK_FILTERS = [
  { label: 'Under $5', min: undefined, max: 5 },
  { label: 'Under $10', min: undefined, max: 10 },
  { label: 'Under $20', min: undefined, max: 20 },
  { label: '$20-$50', min: 20, max: 50 },
  { label: 'Over $50', min: 50, max: undefined },
];

export function PriceFilterSidebar({
  minPrice = 0,
  maxPrice = 100,
  onPriceChange,
  className,
}: PriceFilterSidebarProps) {
  const [localMin, setLocalMin] = useState<number>(minPrice);
  const [localMax, setLocalMax] = useState<number>(maxPrice);
  const [activeQuick, setActiveQuick] = useState<number | null>(null);

  // Sync slider with quick filters
  useEffect(() => {
    if (activeQuick !== null) {
      const filter = QUICK_FILTERS[activeQuick];
      setLocalMin(filter.min ?? 0);
      setLocalMax(filter.max ?? 100);
    }
  }, [activeQuick]);

  const handleSliderChange = (values: number[]) => {
    setLocalMin(values[0]);
    setLocalMax(values[1]);
    setActiveQuick(null); // Clear quick filter selection
  };

  const handleApply = () => {
    const min = localMin > 0 ? localMin : undefined;
    const max = localMax < 100 ? localMax : undefined;
    onPriceChange(min, max);
  };

  const handleQuickFilter = (index: number) => {
    if (activeQuick === index) {
      // Deselect
      setActiveQuick(null);
      setLocalMin(0);
      setLocalMax(100);
      onPriceChange(undefined, undefined);
    } else {
      setActiveQuick(index);
      const filter = QUICK_FILTERS[index];
      onPriceChange(filter.min, filter.max);
    }
  };

  const handleClear = () => {
    setLocalMin(0);
    setLocalMax(100);
    setActiveQuick(null);
    onPriceChange(undefined, undefined);
  };

  return (
    <div className={cn("bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden", className)}>
      <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
        <DollarSign className="w-5 h-5 text-green-600" />
        <h3 className="font-bold text-gray-900 text-sm">Price Range</h3>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Slider */}
        <div className="px-1">
          <Slider
            value={[localMin, localMax]}
            min={0}
            max={100}
            step={1}
            onValueChange={handleSliderChange}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>${localMin}</span>
            <span>${localMax === 100 ? '100+' : localMax}</span>
          </div>
        </div>

        {/* Manual Input */}
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={localMin || ''}
            onChange={(e) => {
              setLocalMin(Number(e.target.value) || 0);
              setActiveQuick(null);
            }}
            className="h-8 text-sm"
          />
          <span className="text-gray-400">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={localMax === 100 ? '' : localMax}
            onChange={(e) => {
              setLocalMax(Number(e.target.value) || 100);
              setActiveQuick(null);
            }}
            className="h-8 text-sm"
          />
        </div>

        {/* Quick Filters */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">Quick Select</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_FILTERS.map((filter, index) => (
              <button
                key={filter.label}
                onClick={() => handleQuickFilter(index)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                  activeQuick === index
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="flex-1 text-xs"
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            className="flex-1 text-xs bg-green-600 hover:bg-green-700"
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
