-- Drop existing function first to avoid parameter name conflict
DROP FUNCTION IF EXISTS public.generate_product_slug(TEXT, UUID);

-- Recreate slug generation function with correct parameter names
CREATE OR REPLACE FUNCTION public.generate_product_slug(product_name TEXT, p_seller_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  -- Generate base slug from name
  base_slug := LOWER(TRIM(product_name));
  base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  -- Fallback for empty slugs
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'product';
  END IF;
  
  -- Limit length to 80 characters
  base_slug := LEFT(base_slug, 80);
  
  final_slug := base_slug;
  
  -- Check for uniqueness
  LOOP
    IF p_seller_id IS NOT NULL THEN
      SELECT EXISTS(
        SELECT 1 FROM public.seller_products 
        WHERE slug = final_slug AND seller_id = p_seller_id
      ) INTO slug_exists;
    ELSE
      SELECT EXISTS(
        SELECT 1 FROM public.ai_accounts WHERE slug = final_slug
      ) INTO slug_exists;
    END IF;
    
    EXIT WHEN NOT slug_exists;
    
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for ALL rows with missing/empty slugs
UPDATE public.seller_products 
SET slug = public.generate_product_slug(name, seller_id)
WHERE slug IS NULL OR slug = '';

UPDATE public.ai_accounts 
SET slug = public.generate_product_slug(name, NULL)
WHERE slug IS NULL OR slug = '';

-- Drop old indexes if exist (to recreate cleanly)
DROP INDEX IF EXISTS public.idx_seller_products_seller_slug;
DROP INDEX IF EXISTS public.idx_ai_accounts_slug;

-- Create unique indexes (data is now clean)
CREATE UNIQUE INDEX idx_seller_products_seller_slug 
ON public.seller_products(seller_id, slug);

CREATE UNIQUE INDEX idx_ai_accounts_slug 
ON public.ai_accounts(slug);

-- Set NOT NULL constraint and default
ALTER TABLE public.seller_products ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.seller_products ALTER COLUMN slug SET DEFAULT '';
ALTER TABLE public.ai_accounts ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.ai_accounts ALTER COLUMN slug SET DEFAULT '';

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION public.auto_generate_product_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    IF TG_TABLE_NAME = 'seller_products' THEN
      NEW.slug := public.generate_product_slug(NEW.name, NEW.seller_id);
    ELSE
      NEW.slug := public.generate_product_slug(NEW.name, NULL);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_seller_products_auto_slug ON public.seller_products;
CREATE TRIGGER tr_seller_products_auto_slug
BEFORE INSERT ON public.seller_products
FOR EACH ROW EXECUTE FUNCTION public.auto_generate_product_slug();

DROP TRIGGER IF EXISTS tr_ai_accounts_auto_slug ON public.ai_accounts;
CREATE TRIGGER tr_ai_accounts_auto_slug
BEFORE INSERT ON public.ai_accounts
FOR EACH ROW EXECUTE FUNCTION public.auto_generate_product_slug();

-- Add product_type column to seller_products
ALTER TABLE public.seller_products 
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'digital';

-- Add product_type column to ai_accounts
ALTER TABLE public.ai_accounts 
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'digital';

-- Create index for product_type filtering
CREATE INDEX IF NOT EXISTS idx_seller_products_type ON public.seller_products(product_type);
CREATE INDEX IF NOT EXISTS idx_ai_accounts_type ON public.ai_accounts(product_type);