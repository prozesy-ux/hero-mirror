-- =====================================================
-- BULLETPROOF SLUG FIX: Complete rewrite
-- Drops conflicting objects first, then recreates everything cleanly
-- =====================================================

-- Step 0: Drop ALL existing slug-related objects to start clean
DROP TRIGGER IF EXISTS trigger_ai_accounts_slug ON public.ai_accounts;
DROP TRIGGER IF EXISTS trigger_seller_products_slug ON public.seller_products;
DROP TRIGGER IF EXISTS tr_seller_products_auto_slug ON public.seller_products;
DROP TRIGGER IF EXISTS tr_ai_accounts_auto_slug ON public.ai_accounts;

DROP FUNCTION IF EXISTS public.generate_product_slug(text, uuid);
DROP FUNCTION IF EXISTS public.generate_product_slug(text, text);
DROP FUNCTION IF EXISTS public.auto_generate_product_slug();
DROP FUNCTION IF EXISTS public.set_product_slug();

DROP INDEX IF EXISTS idx_ai_accounts_slug;
DROP INDEX IF EXISTS idx_seller_products_seller_slug;
DROP INDEX IF EXISTS idx_ai_accounts_product_type;
DROP INDEX IF EXISTS idx_seller_products_product_type;

-- Step 1: Add slug column to ai_accounts if not exists (NULLABLE, NO DEFAULT)
ALTER TABLE public.ai_accounts ADD COLUMN IF NOT EXISTS slug TEXT;

-- Step 2: Add slug column to seller_products if not exists (NULLABLE, NO DEFAULT)
ALTER TABLE public.seller_products ADD COLUMN IF NOT EXISTS slug TEXT;

-- Step 3: Normalize ALL empty/whitespace slugs to NULL
UPDATE public.ai_accounts
SET slug = NULL
WHERE slug IS NOT NULL 
  AND (slug = '' OR btrim(slug) = '' OR regexp_replace(slug, '\s+', '', 'g') = '');

UPDATE public.seller_products
SET slug = NULL
WHERE slug IS NOT NULL 
  AND (slug = '' OR btrim(slug) = '' OR regexp_replace(slug, '\s+', '', 'g') = '');

-- Step 4: Generate unique slugs for ai_accounts using window function (DETERMINISTIC)
WITH slug_base AS (
  SELECT 
    id,
    CASE 
      WHEN name IS NULL OR btrim(name) = '' THEN 'product'
      ELSE COALESCE(
        NULLIF(
          left(
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
          ),
          ''
        ),
        'product'
      )
    END AS base_slug
  FROM public.ai_accounts
  WHERE slug IS NULL
),
slug_ranked AS (
  SELECT 
    id,
    base_slug,
    ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) AS rn
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

-- Step 5: Generate unique slugs for seller_products (unique per seller_id)
WITH slug_base AS (
  SELECT 
    id,
    seller_id,
    CASE 
      WHEN name IS NULL OR btrim(name) = '' THEN 'product'
      ELSE COALESCE(
        NULLIF(
          left(
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
          ),
          ''
        ),
        'product'
      )
    END AS base_slug
  FROM public.seller_products
  WHERE slug IS NULL
),
slug_ranked AS (
  SELECT 
    id,
    seller_id,
    base_slug,
    ROW_NUMBER() OVER (PARTITION BY seller_id, base_slug ORDER BY id) AS rn
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

-- Step 6: Fallback - ensure no NULL slugs remain
UPDATE public.ai_accounts
SET slug = 'product-' || substring(id::text, 1, 8)
WHERE slug IS NULL OR btrim(slug) = '';

UPDATE public.seller_products
SET slug = 'product-' || substring(id::text, 1, 8)
WHERE slug IS NULL OR btrim(slug) = '';

-- Step 7: Set NOT NULL constraints (NO DEFAULT - triggers will handle new rows)
ALTER TABLE public.ai_accounts ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.seller_products ALTER COLUMN slug SET NOT NULL;

-- Step 8: Create unique indexes (data is now guaranteed clean)
CREATE UNIQUE INDEX idx_ai_accounts_slug ON public.ai_accounts(slug);
CREATE UNIQUE INDEX idx_seller_products_seller_slug ON public.seller_products(seller_id, slug);

-- Step 9: Add product_type columns
ALTER TABLE public.ai_accounts ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'digital';
ALTER TABLE public.seller_products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'digital';

-- Step 10: Create product_type indexes
CREATE INDEX idx_ai_accounts_product_type ON public.ai_accounts(product_type);
CREATE INDEX idx_seller_products_product_type ON public.seller_products(product_type);

-- Step 11: Create slug generation function (TEXT, UUID version for seller_products)
CREATE OR REPLACE FUNCTION public.generate_product_slug(product_name TEXT, p_seller_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  base_slug := LOWER(TRIM(product_name));
  base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'product';
  END IF;
  
  base_slug := LEFT(base_slug, 80);
  final_slug := base_slug;
  
  LOOP
    IF p_seller_id IS NOT NULL THEN
      SELECT EXISTS(SELECT 1 FROM public.seller_products WHERE slug = final_slug AND seller_id = p_seller_id) INTO slug_exists;
    ELSE
      SELECT EXISTS(SELECT 1 FROM public.ai_accounts WHERE slug = final_slug) INTO slug_exists;
    END IF;
    
    EXIT WHEN NOT slug_exists;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Step 12: Create trigger function
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
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    IF TG_TABLE_NAME = 'seller_products' THEN
      NEW.slug := public.generate_product_slug(NEW.name, NEW.seller_id);
    ELSE
      NEW.slug := public.generate_product_slug(NEW.name, NULL::UUID);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 13: Create auto_generate_product_slug for backward compatibility
CREATE OR REPLACE FUNCTION public.auto_generate_product_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    IF TG_TABLE_NAME = 'seller_products' THEN
      NEW.slug := public.generate_product_slug(NEW.name, NEW.seller_id);
    ELSE
      NEW.slug := public.generate_product_slug(NEW.name, NULL::UUID);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Step 14: Create triggers
CREATE TRIGGER trigger_ai_accounts_slug
  BEFORE INSERT OR UPDATE ON public.ai_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_product_slug();

CREATE TRIGGER trigger_seller_products_slug
  BEFORE INSERT OR UPDATE ON public.seller_products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_product_slug();