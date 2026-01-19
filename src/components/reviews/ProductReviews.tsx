import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Star, Filter, ChevronDown } from 'lucide-react';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductReviewsProps {
  productId: string;
  showWriteReview?: boolean;
  onWriteReview?: () => void;
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  buyer_name?: string;
  seller_response?: string | null;
  seller_response_at?: string | null;
}

const ProductReviews = ({ productId, showWriteReview = false, onWriteReview }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful'>('recent');

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      await supabase
        .from('product_reviews')
        .update({ helpful_count: (review.helpful_count || 0) + 1 })
        .eq('id', reviewId);
    } catch (error) {
      console.error('Error updating helpful count:', error);
    }
  };

  // Calculate stats
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100
      : 0
  }));

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter(r => filterRating === null || r.rating === filterRating)
    .sort((a, b) => {
      if (sortBy === 'helpful') {
        return (b.helpful_count || 0) - (a.helpful_count || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Average Rating */}
          <div className="text-center md:text-left md:pr-8 md:border-r border-slate-200">
            <p className="text-4xl font-bold text-slate-900">{averageRating.toFixed(1)}</p>
            <StarRating rating={averageRating} size="md" className="justify-center md:justify-start mt-1" />
            <p className="text-sm text-slate-500 mt-1">{reviews.length} reviews</p>
          </div>

          {/* Rating Breakdown */}
          <div className="flex-1 space-y-2">
            {ratingCounts.map(({ rating, count, percentage }) => (
              <button
                key={rating}
                onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                className={`w-full flex items-center gap-3 p-1 rounded-lg transition-colors ${
                  filterRating === rating ? 'bg-emerald-50' : 'hover:bg-slate-50'
                }`}
              >
                <span className="text-sm font-medium text-slate-600 w-6">{rating}</span>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-8">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Write Review Button */}
        {showWriteReview && (
          <Button
            onClick={onWriteReview}
            className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 rounded-xl"
          >
            Write a Review
          </Button>
        )}
      </div>

      {/* Filter & Sort */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {filterRating && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterRating(null)}
                className="rounded-lg text-xs"
              >
                {filterRating} Stars × Clear
              </Button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-lg text-xs">
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                {sortBy === 'recent' ? 'Most Recent' : 'Most Helpful'}
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => setSortBy('recent')} className="rounded-lg">
                Most Recent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('helpful')} className="rounded-lg">
                Most Helpful
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No reviews yet</p>
          <p className="text-sm text-slate-400">Be the first to review this product</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={handleHelpful}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
