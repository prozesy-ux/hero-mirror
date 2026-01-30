-- Fix slug/product_type migration for Live: ensure slugs are generated uniquely and never empty

-- 1) Add columns (nullable slug first)
ALTER TABLE public.seller_products ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.ai_accounts ADD COLUMN IF NOT EXISTS slug text;

ALTER TABLE public.seller_products ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'digital';
ALTER TABLE public.ai_accounts ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'digital';

-- 2) Normalize whitespace-only slugs to NULL so they get regenerated
UPDATE public.seller_products
SET slug = NULL
WHERE slug IS NOT NULL AND btrim(slug) = '';

UPDATE public.ai_accounts
SET slug = NULL
WHERE slug IS NOT NULL AND btrim(slug) = '';

-- 3) Generate UNIQUE slugs for every row missing a slug
UPDATE public.seller_products sp
SET slug = public.generate_product_slug(sp.name, sp.seller_id)
WHERE sp.slug IS NULL;

UPDATE public.ai_accounts a
SET slug = public.generate_product_slug(a.name, NULL)
WHERE a.slug IS NULL;

-- 4) If anything is still NULL (extremely defensive), set a deterministic fallback
UPDATE public.ai_accounts
SET slug = 'product-' || substring(id::text, 1, 8)
WHERE slug IS NULL;

UPDATE public.seller_products
SET slug = 'product-' || substring(id::text, 1, 8)
WHERE slug IS NULL;

-- 5) Recreate indexes safely
DROP INDEX IF EXISTS public.idx_seller_products_seller_slug;
DROP INDEX IF EXISTS public.idx_ai_accounts_slug;
DROP INDEX IF EXISTS public.idx_seller_products_product_type;
DROP INDEX IF EXISTS public.idx_ai_accounts_product_type;

-- 6) Enforce constraints only after data is clean
ALTER TABLE public.seller_products ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.ai_accounts ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX idx_seller_products_seller_slug ON public.seller_products(seller_id, slug);
CREATE UNIQUE INDEX idx_ai_accounts_slug ON public.ai_accounts(slug);

CREATE INDEX idx_seller_products_product_type ON public.seller_products(product_type);
CREATE INDEX idx_ai_accounts_product_type ON public.ai_accounts(product_type);
