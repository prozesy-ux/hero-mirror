import { useState } from 'react';
import { Filter, DollarSign, Star, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface FilterState {
  priceMin?: number;
  priceMax?: number;
  minRating: number | null;
  verifiedOnly: boolean;
}

interface SearchFiltersBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

const PRICE_PRESETS = [
  { label: 'Under $5', min: undefined, max: 5 },
  { label: 'Under $10', min: undefined, max: 10 },
  { label: 'Under $20', min: undefined, max: 20 },
  { label: '$20-$50', min: 20, max: 50 },
  { label: 'Over $50', min: 50, max: undefined },
];

export function SearchFiltersBar({ filters, onFiltersChange, className }: SearchFiltersBarProps) {
  const [priceOpen, setPriceOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [localPrice, setLocalPrice] = useState<[number, number]>([
    filters.priceMin || 0,
    filters.priceMax || 100,
  ]);

  const hasActiveFilters = 
    filters.priceMin !== undefined || 
    filters.priceMax !== undefined || 
    filters.minRating !== null || 
    filters.verifiedOnly;

  const activeFilterCount = [
    filters.priceMin !== undefined || filters.priceMax !== undefined,
    filters.minRating !== null,
    filters.verifiedOnly,
  ].filter(Boolean).length;

  const handlePriceApply = () => {
    onFiltersChange({
      ...filters,
      priceMin: localPrice[0] > 0 ? localPrice[0] : undefined,
      priceMax: localPrice[1] < 100 ? localPrice[1] : undefined,
    });
    setPriceOpen(false);
  };

  const handlePricePreset = (preset: typeof PRICE_PRESETS[0]) => {
    onFiltersChange({
      ...filters,
      priceMin: preset.min,
      priceMax: preset.max,
    });
    setPriceOpen(false);
  };

  const handleRatingSelect = (rating: number | null) => {
    onFiltersChange({ ...filters, minRating: rating });
    setRatingOpen(false);
  };

  const toggleVerified = () => {
    onFiltersChange({ ...filters, verifiedOnly: !filters.verifiedOnly });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      priceMin: undefined,
      priceMax: undefined,
      minRating: null,
      verifiedOnly: false,
    });
    setLocalPrice([0, 100]);
  };

  const getPriceLabel = () => {
    if (filters.priceMin !== undefined && filters.priceMax !== undefined) {
      return `$${filters.priceMin}-$${filters.priceMax}`;
    }
    if (filters.priceMax !== undefined) {
      return `Under $${filters.priceMax}`;
    }
    if (filters.priceMin !== undefined) {
      return `Over $${filters.priceMin}`;
    }
    return 'Price';
  };

  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      {/* Filter Label */}
      <span className="text-sm text-gray-500 font-medium">Filter by:</span>

      {/* Price Filter */}
      <Popover open={priceOpen} onOpenChange={setPriceOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-1.5 text-sm border-gray-300 hover:border-gray-900 hover:bg-gray-50",
              (filters.priceMin !== undefined || filters.priceMax !== undefined) &&
                "bg-gray-900 text-white border-gray-900 hover:bg-gray-800 hover:border-gray-800"
            )}
          >
            <DollarSign className="h-4 w-4" />
            {getPriceLabel()}
            {(filters.priceMin !== undefined || filters.priceMax !== undefined) && (
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4 bg-white border border-gray-200 shadow-xl" align="start">
          <div className="space-y-4">
            <div className="font-semibold text-sm text-gray-900">Price Range</div>
            
            <div className="px-1">
              <Slider
                value={localPrice}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => setLocalPrice(v as [number, number])}
                className="[&_[role=slider]]:bg-gray-900 [&_[role=slider]]:border-gray-900"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>${localPrice[0]}</span>
                <span>${localPrice[1] === 100 ? '100+' : localPrice[1]}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRICE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePricePreset(preset)}
                  className="px-2.5 py-1 text-xs rounded-full border border-gray-300 text-gray-700 hover:border-gray-900 hover:bg-gray-50 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <Button size="sm" onClick={handlePriceApply} className="w-full bg-gray-900 hover:bg-gray-800 text-white">
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Rating Filter */}
      <Popover open={ratingOpen} onOpenChange={setRatingOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-1.5 text-sm border-gray-300 hover:border-gray-900 hover:bg-gray-50",
              filters.minRating !== null && "bg-gray-900 text-white border-gray-900 hover:bg-gray-800 hover:border-gray-800"
            )}
          >
            <Star className={cn("h-4 w-4", filters.minRating && "fill-current")} />
            {filters.minRating ? `${filters.minRating}+ Stars` : 'Rating'}
            {filters.minRating !== null && (
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2 bg-white border border-gray-200 shadow-xl" align="start">
          <div className="space-y-1">
            <button
              onClick={() => handleRatingSelect(null)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors",
                filters.minRating === null ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
              )}
            >
              All Ratings
            </button>
            {[4, 3].map((rating) => (
              <button
                key={rating}
                onClick={() => handleRatingSelect(rating)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors",
                  filters.minRating === rating ? "bg-gray-900 text-white" : "hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className={cn(
                      "h-3.5 w-3.5",
                      filters.minRating === rating ? "fill-white text-white" : "fill-gray-900 text-gray-900"
                    )} />
                  ))}
                </div>
                <span>{rating}+ Stars</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Verified Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleVerified}
        className={cn(
          "h-9 gap-1.5 text-sm border-gray-300 hover:border-gray-900 hover:bg-gray-50",
          filters.verifiedOnly && "bg-gray-900 text-white border-gray-900 hover:bg-gray-800 hover:border-gray-800"
        )}
      >
        <CheckCircle className="h-4 w-4" />
        Verified
      </Button>

      {/* Clear All */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-9 gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <X className="h-4 w-4" />
          Clear All
        </Button>
      )}
    </div>
  );
}
