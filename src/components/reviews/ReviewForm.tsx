import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import StarRating from './StarRating';

interface ReviewFormProps {
  productId: string;
  orderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ReviewForm = ({ productId, orderId, onSuccess, onCancel }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!content.trim()) {
      toast.error('Please write a review');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to submit a review');
        return;
      }

      const { error } = await supabase.from('product_reviews').insert({
        product_id: productId,
        order_id: orderId,
        buyer_id: user.id,
        rating,
        title: title.trim() || null,
        content: content.trim(),
        is_verified_purchase: true
      });

      if (error) throw error;

      toast.success('Review submitted successfully!');
      setRating(0);
      setTitle('');
      setContent('');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl p-5 border border-slate-200">
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-2 block">Your Rating</Label>
        <StarRating
          rating={rating}
          interactive
          onRatingChange={setRating}
          size="lg"
        />
      </div>

      <div>
        <Label htmlFor="review-title" className="text-sm font-medium text-slate-700 mb-2 block">
          Review Title (Optional)
        </Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          className="border-slate-200 rounded-xl"
          maxLength={100}
        />
      </div>

      <div>
        <Label htmlFor="review-content" className="text-sm font-medium text-slate-700 mb-2 block">
          Your Review
        </Label>
        <Textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          className="border-slate-200 rounded-xl resize-none"
          maxLength={1000}
        />
        <p className="text-xs text-slate-400 mt-1">{content.length}/1000</p>
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-xl border-slate-200"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={submitting || rating === 0}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 rounded-xl"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Submit Review
        </Button>
      </div>
    </form>
  );
};

export default ReviewForm;
