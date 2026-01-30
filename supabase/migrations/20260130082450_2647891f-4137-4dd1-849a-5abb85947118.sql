-- =====================================================
-- BULLETPROOF SLUG MIGRATION
-- Self-sufficient: creates function inline, generates unique slugs deterministically
-- =====================================================

-- Step 1: Create the generate_product_slug function if it doesn't exist
CREATE OR REPLACE FUNCTION public.generate_product_slug(product_name TEXT, existing_slug TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
BEGIN
  -- If existing slug is valid, return it
  IF existing_slug IS NOT NULL AND btrim(existing_slug) != '' THEN
    RETURN existing_slug;
  END IF;
  
  -- Generate base slug from name
  IF product_name IS NULL OR btrim(product_name) = '' THEN
    base_slug := 'product';
  ELSE
    base_slug := lower(btrim(product_name));
    base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
    base_slug := left(base_slug, 80);
    IF base_slug = '' THEN
      base_slug := 'product';
    END IF;
  END IF;
  
  RETURN base_slug;
END;
$$;

-- Step 2: Add slug column to ai_accounts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_accounts' AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.ai_accounts ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Step 3: Add slug column to seller_products if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'seller_products' AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.seller_products ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Step 4: Add product_type column to ai_accounts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_accounts' AND column_name = 'product_type'
  ) THEN
    ALTER TABLE public.ai_accounts ADD COLUMN product_type TEXT DEFAULT 'digital';
  END IF;
END $$;

-- Step 5: Add product_type column to seller_products if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'seller_products' AND column_name = 'product_type'
  ) THEN
    ALTER TABLE public.seller_products ADD COLUMN product_type TEXT DEFAULT 'digital';
  END IF;
END $$;

-- Step 6: Normalize ALL empty/whitespace slugs to NULL in ai_accounts
UPDATE public.ai_accounts
SET slug = NULL
WHERE slug IS NULL 
   OR slug = '' 
   OR btrim(slug) = '' 
   OR regexp_replace(slug, '\s+', '', 'g') = '';

-- Step 7: Normalize ALL empty/whitespace slugs to NULL in seller_products
UPDATE public.seller_products
SET slug = NULL
WHERE slug IS NULL 
   OR slug = '' 
   OR btrim(slug) = '' 
   OR regexp_replace(slug, '\s+', '', 'g') = '';

-- Step 8: Generate unique slugs for ai_accounts using window function
-- This guarantees uniqueness by appending -2, -3, etc. for duplicates
WITH slug_base AS (
  SELECT 
    id,
    CASE 
      WHEN name IS NULL OR btrim(name) = '' THEN 'product'
      ELSE left(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                lower(btrim(name)),
                '[^a-z0-9\s-]', '', 'g'
              ),
              '\s+', '-', 'g'
            ),
            '-+', '-', 'g'
          ),
          '^-|-$', '', 'g'
        ),
        80
      )
    END AS base_slug
  FROM public.ai_accounts
  WHERE slug IS NULL
),
slug_ranked AS (
  SELECT 
    id,
    CASE 
      WHEN base_slug = '' THEN 'product'
      ELSE base_slug
    END AS base_slug,
    ROW_NUMBER() OVER (PARTITION BY CASE WHEN base_slug = '' THEN 'product' ELSE base_slug END ORDER BY id) AS rn
  FROM slug_base
),
final_slugs AS (
  SELECT 
    id,
    CASE 
      WHEN rn = 1 THEN base_slug
      ELSE base_slug || '-' || rn
    END AS new_slug
  FROM slug_ranked
)
UPDATE public.ai_accounts a
SET slug = f.new_slug
FROM final_slugs f
WHERE a.id = f.id;

-- Step 9: Generate unique slugs for seller_products (unique per seller_id)
WITH slug_base AS (
  SELECT 
    id,
    seller_id,
    CASE 
      WHEN name IS NULL OR btrim(name) = '' THEN 'product'
      ELSE left(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                lower(btrim(name)),
                '[^a-z0-9\s-]', '', 'g'
              ),
              '\s+', '-', 'g'
            ),
            '-+', '-', 'g'
          ),
          '^-|-$', '', 'g'
        ),
        80
      )
    END AS base_slug
  FROM public.seller_products
  WHERE slug IS NULL
),
slug_ranked AS (
  SELECT 
    id,
    seller_id,
    CASE 
      WHEN base_slug = '' THEN 'product'
      ELSE base_slug
    END AS base_slug,
    ROW_NUMBER() OVER (PARTITION BY seller_id, CASE WHEN base_slug = '' THEN 'product' ELSE base_slug END ORDER BY id) AS rn
  FROM slug_base
),
final_slugs AS (
  SELECT 
    id,
    CASE 
      WHEN rn = 1 THEN base_slug
      ELSE base_slug || '-' || rn
    END AS new_slug
  FROM slug_ranked
)
UPDATE public.seller_products sp
SET slug = f.new_slug
FROM final_slugs f
WHERE sp.id = f.id;

-- Step 10: Fallback - ensure no NULL slugs remain (use ID-based slug)
UPDATE public.ai_accounts
SET slug = 'product-' || substring(id::text, 1, 8)
WHERE slug IS NULL OR btrim(slug) = '';

UPDATE public.seller_products
SET slug = 'product-' || substring(id::text, 1, 8)
WHERE slug IS NULL OR btrim(slug) = '';

-- Step 11: Set NOT NULL constraints
ALTER TABLE public.ai_accounts ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.ai_accounts ALTER COLUMN slug SET DEFAULT '';

ALTER TABLE public.seller_products ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.seller_products ALTER COLUMN slug SET DEFAULT '';

-- Step 12: Create unique indexes (drop if exists first to be idempotent)
DROP INDEX IF EXISTS idx_ai_accounts_slug;
CREATE UNIQUE INDEX idx_ai_accounts_slug ON public.ai_accounts(slug);

DROP INDEX IF EXISTS idx_seller_products_seller_slug;
CREATE UNIQUE INDEX idx_seller_products_seller_slug ON public.seller_products(seller_id, slug);

-- Step 13: Create indexes for product_type
DROP INDEX IF EXISTS idx_ai_accounts_product_type;
CREATE INDEX idx_ai_accounts_product_type ON public.ai_accounts(product_type);

DROP INDEX IF EXISTS idx_seller_products_product_type;
CREATE INDEX idx_seller_products_product_type ON public.seller_products(product_type);

-- Step 14: Create trigger function for auto-generating slugs on insert/update
CREATE OR REPLACE FUNCTION public.set_product_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Only generate if slug is empty/null
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    base_slug := public.generate_product_slug(NEW.name, NULL);
    final_slug := base_slug;
    
    -- For ai_accounts: check global uniqueness
    IF TG_TABLE_NAME = 'ai_accounts' THEN
      WHILE EXISTS (SELECT 1 FROM public.ai_accounts WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
      END LOOP;
    -- For seller_products: check per-seller uniqueness
    ELSIF TG_TABLE_NAME = 'seller_products' THEN
      WHILE EXISTS (SELECT 1 FROM public.seller_products WHERE slug = final_slug AND seller_id = NEW.seller_id AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
      END LOOP;
    END IF;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 15: Create triggers
DROP TRIGGER IF EXISTS trigger_ai_accounts_slug ON public.ai_accounts;
CREATE TRIGGER trigger_ai_accounts_slug
  BEFORE INSERT OR UPDATE ON public.ai_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_product_slug();

DROP TRIGGER IF EXISTS trigger_seller_products_slug ON public.seller_products;
CREATE TRIGGER trigger_seller_products_slug
  BEFORE INSERT OR UPDATE ON public.seller_products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_product_slug();