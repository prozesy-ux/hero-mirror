-- Add new columns to ai_accounts table for enhanced marketplace
ALTER TABLE public.ai_accounts 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_trending boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS original_price numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sold_count integer DEFAULT 0;

-- Add new columns to categories table for marketplace categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS color text DEFAULT 'violet',
ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

-- Create index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_ai_accounts_category_id ON public.ai_accounts(category_id);
CREATE INDEX IF NOT EXISTS idx_ai_accounts_is_trending ON public.ai_accounts(is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_ai_accounts_is_featured ON public.ai_accounts(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active) WHERE is_active = true;

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_accounts;