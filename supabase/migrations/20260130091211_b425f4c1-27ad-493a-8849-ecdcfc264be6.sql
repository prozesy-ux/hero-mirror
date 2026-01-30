-- Step 1: Add slug column if not exists (allows nulls initially)
ALTER TABLE ai_accounts ADD COLUMN IF NOT EXISTS slug TEXT;

-- Step 2: Add product_type column if not exists
ALTER TABLE ai_accounts ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'product';

-- Step 3: Generate unique slugs for ALL existing rows
UPDATE ai_accounts 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- Step 4: Drop existing index if it exists (to recreate properly)
DROP INDEX IF EXISTS idx_ai_accounts_slug;

-- Step 5: Now create the unique index (all rows have unique slugs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_accounts_slug ON ai_accounts(slug);