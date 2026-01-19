import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import StarRating from './StarRating';

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

interface ReviewCardProps {
  review: Review;
  onHelpful?: (reviewId: string) => void;
}

const ReviewCard = ({ review, onHelpful }: ReviewCardProps) => {
  const [showResponse, setShowResponse] = useState(false);
  const [helpfulClicked, setHelpfulClicked] = useState(false);

  const handleHelpfulClick = () => {
    if (!helpfulClicked && onHelpful) {
      setHelpfulClicked(true);
      onHelpful(review.id);
    }
  };

  const buyerInitials = review.buyer_name
    ? review.buyer_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="w-10 h-10 border border-slate-100">
          <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 font-semibold text-sm">
            {buyerInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-sm">
              {review.buyer_name || 'Verified Buyer'}
            </span>
            {review.is_verified_purchase && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0 gap-0.5">
                <CheckCircle className="w-2.5 h-2.5" />
                Verified
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      {review.title && (
        <h4 className="font-semibold text-slate-900 text-sm mb-1">{review.title}</h4>
      )}
      <p className="text-sm text-slate-600 leading-relaxed">{review.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleHelpfulClick}
          disabled={helpfulClicked}
          className={`text-xs h-8 px-3 ${helpfulClicked ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 mr-1.5 ${helpfulClicked ? 'fill-emerald-600' : ''}`} />
          Helpful ({review.helpful_count + (helpfulClicked ? 1 : 0)})
        </Button>

        {review.seller_response && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowResponse(!showResponse)}
            className="text-xs h-8 px-3 text-slate-500 hover:text-slate-700"
          >
            Seller Response
            {showResponse ? (
              <ChevronUp className="w-3.5 h-3.5 ml-1" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            )}
          </Button>
        )}
      </div>

      {/* Seller Response */}
      {review.seller_response && showResponse && (
        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-xs text-slate-500 mb-1 font-medium">Seller Response</p>
          <p className="text-sm text-slate-700">{review.seller_response}</p>
          {review.seller_response_at && (
            <p className="text-xs text-slate-400 mt-1">
              {formatDistanceToNow(new Date(review.seller_response_at), { addSuffix: true })}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
