-- Add category_type column to distinguish between prompts and products categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS category_type text DEFAULT 'product';

-- Add comment explaining the column
COMMENT ON COLUMN public.categories.category_type IS 'Type of category: product (for marketplace) or prompt (for prompts section)';