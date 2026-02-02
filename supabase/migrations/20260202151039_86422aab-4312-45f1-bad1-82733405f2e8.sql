-- =============================================
-- QUICK WINS: PWYW, Pre-orders, Follows, Upsells
-- =============================================

-- 1. Add PWYW columns to seller_products
ALTER TABLE public.seller_products 
ADD COLUMN IF NOT EXISTS is_pwyw BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_price NUMERIC DEFAULT 0;

-- 2. Add Pre-order columns to seller_products
ALTER TABLE public.seller_products 
ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS release_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS preorder_message TEXT;

-- 3. Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, seller_id)
);

-- Enable RLS on follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Follows policies
CREATE POLICY "Users can view their own follows"
ON public.follows FOR SELECT
USING (auth.uid() = follower_id);

CREATE POLICY "Anyone can view follow counts"
ON public.follows FOR SELECT
USING (true);

CREATE POLICY "Users can follow sellers"
ON public.follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.follows FOR DELETE
USING (auth.uid() = follower_id);

-- 4. Create product_upsells table
CREATE TABLE IF NOT EXISTS public.product_upsells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  upsell_product_id UUID NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  discount_percent NUMERIC DEFAULT 0,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, upsell_product_id)
);

-- Enable RLS on product_upsells
ALTER TABLE public.product_upsells ENABLE ROW LEVEL SECURITY;

-- Upsells policies
CREATE POLICY "Anyone can view upsells"
ON public.product_upsells FOR SELECT
USING (true);

CREATE POLICY "Sellers can manage their upsells"
ON public.product_upsells FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.seller_products sp
    JOIN public.seller_profiles prof ON sp.seller_id = prof.id
    WHERE sp.id = product_upsells.product_id
    AND prof.user_id = auth.uid()
  )
);

-- 5. Add follower_count to seller_profiles for quick access
ALTER TABLE public.seller_profiles
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;

-- 6. Create function to update follower count
CREATE OR REPLACE FUNCTION public.update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.seller_profiles 
    SET follower_count = follower_count + 1 
    WHERE id = NEW.seller_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.seller_profiles 
    SET follower_count = GREATEST(0, follower_count - 1) 
    WHERE id = OLD.seller_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Create trigger for follower count
DROP TRIGGER IF EXISTS trigger_update_follower_count ON public.follows;
CREATE TRIGGER trigger_update_follower_count
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.update_follower_count();

-- 8. Create index for performance
CREATE INDEX IF NOT EXISTS idx_follows_seller_id ON public.follows(seller_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_product_upsells_product_id ON public.product_upsells(product_id);