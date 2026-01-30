-- Fix slug migration: Add column, populate with unique values, then add constraints
-- This runs as a single atomic operation

-- Step 1: Add slug columns if they don't exist (nullable first)
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE ai_accounts ADD COLUMN IF NOT EXISTS slug TEXT;

-- Step 2: Add product_type columns
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'digital';
ALTER TABLE ai_accounts ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'digital';

-- Step 3: Generate unique slugs for seller_products with empty/null slugs
UPDATE seller_products sp
SET slug = public.generate_product_slug(sp.name, sp.seller_id)
WHERE sp.slug IS NULL OR sp.slug = '';

-- Step 4: Generate unique slugs for ai_accounts with empty/null slugs
-- Using a subquery with row_number to ensure uniqueness
WITH numbered_accounts AS (
  SELECT id, name, 
         ROW_NUMBER() OVER (ORDER BY created_at, id) as rn
  FROM ai_accounts 
  WHERE slug IS NULL OR slug = ''
)
UPDATE ai_accounts a
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(na.name), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || na.rn
FROM numbered_accounts na
WHERE a.id = na.id;

-- Step 5: Handle any remaining empty slugs with fallback
UPDATE ai_accounts 
SET slug = 'product-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL OR slug = '';

UPDATE seller_products 
SET slug = 'product-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- Step 6: Now set NOT NULL constraints
ALTER TABLE seller_products ALTER COLUMN slug SET NOT NULL;
ALTER TABLE ai_accounts ALTER COLUMN slug SET NOT NULL;

-- Step 7: Drop old indexes if they exist (to avoid conflicts)
DROP INDEX IF EXISTS idx_seller_products_seller_slug;
DROP INDEX IF EXISTS idx_ai_accounts_slug;
DROP INDEX IF EXISTS idx_seller_products_product_type;
DROP INDEX IF EXISTS idx_ai_accounts_product_type;

-- Step 8: Create unique indexes (data is now clean)
CREATE UNIQUE INDEX idx_seller_products_seller_slug ON seller_products(seller_id, slug);
CREATE UNIQUE INDEX idx_ai_accounts_slug ON ai_accounts(slug);

-- Step 9: Create product type indexes for filtering
CREATE INDEX idx_seller_products_product_type ON seller_products(product_type);
CREATE INDEX idx_ai_accounts_product_type ON ai_accounts(product_type);