-- Set all commission rates to 0 and make default 0
UPDATE public.seller_profiles SET commission_rate = 0 WHERE commission_rate != 0 OR commission_rate IS NULL;
ALTER TABLE public.seller_profiles ALTER COLUMN commission_rate SET DEFAULT 0;

-- Add category_ids array column for multi-category support
ALTER TABLE public.seller_products ADD COLUMN IF NOT EXISTS category_ids uuid[] DEFAULT '{}';

-- Migrate existing category_id to category_ids array
UPDATE public.seller_products 
SET category_ids = ARRAY[category_id] 
WHERE category_id IS NOT NULL AND (category_ids IS NULL OR category_ids = '{}');

-- Add video_url columns for store banner
ALTER TABLE public.seller_profiles ADD COLUMN IF NOT EXISTS store_video_url text;
ALTER TABLE public.seller_profiles ADD COLUMN IF NOT EXISTS banner_type text DEFAULT 'image';

-- Create product_reviews table for customer review system
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.seller_orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  content text,
  is_verified_purchase boolean DEFAULT true,
  helpful_count integer DEFAULT 0,
  seller_response text,
  seller_responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on product_reviews
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_reviews
CREATE POLICY "Anyone can view product reviews" 
  ON public.product_reviews FOR SELECT 
  USING (true);

CREATE POLICY "Buyers can create reviews for their orders" 
  ON public.product_reviews FOR INSERT 
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update their own reviews" 
  ON public.product_reviews FOR UPDATE 
  USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can delete their own reviews" 
  ON public.product_reviews FOR DELETE 
  USING (auth.uid() = buyer_id);

-- Enable realtime for product_reviews
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_reviews;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_buyer_id ON public.product_reviews(buyer_id);

-- Add trigger for updated_at
CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();