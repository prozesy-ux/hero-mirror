
-- Add missing columns to seller_products for Phase 1
ALTER TABLE public.seller_products 
  ADD COLUMN IF NOT EXISTS original_price numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS seo_title text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS seo_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS refund_policy text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS published_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Add parent_id to categories for sub-categories
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id uuid DEFAULT NULL REFERENCES public.categories(id);
