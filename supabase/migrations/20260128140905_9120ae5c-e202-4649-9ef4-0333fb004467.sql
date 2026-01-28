-- Add view_count column to seller_products for tracking popularity
ALTER TABLE public.seller_products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Add view_count column to ai_accounts for tracking popularity
ALTER TABLE public.ai_accounts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create user_product_interactions table for personalization engine
CREATE TABLE IF NOT EXISTS public.user_product_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('ai_account', 'seller_product')),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'click', 'wishlist', 'purchase', 'search')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_product_interactions
ALTER TABLE public.user_product_interactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_product_interactions
CREATE POLICY "Users can view their own interactions" 
ON public.user_product_interactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interactions" 
ON public.user_product_interactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_product_interactions_user_id ON public.user_product_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_product_interactions_product_id ON public.user_product_interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_user_product_interactions_type ON public.user_product_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_seller_products_view_count ON public.seller_products(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_seller_products_sold_count ON public.seller_products(sold_count DESC);
CREATE INDEX IF NOT EXISTS idx_ai_accounts_view_count ON public.ai_accounts(view_count DESC);