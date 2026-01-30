-- Step 1: Add slug column if it doesn't exist
ALTER TABLE ai_accounts ADD COLUMN IF NOT EXISTS slug TEXT;

-- Step 2: Generate slugs for all accounts using their names
UPDATE ai_accounts 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(COALESCE(name, '')), '[^a-z0-9\s-]', '', 'gi'), '\s+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Step 3: Fix empty slugs with ID-based fallback
UPDATE ai_accounts 
SET slug = 'account-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- Step 4: Handle duplicates by appending unique suffix
WITH ranked AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at, id) as rn
  FROM ai_accounts
)
UPDATE ai_accounts a
SET slug = a.slug || '-' || r.rn
FROM ranked r
WHERE a.id = r.id AND r.rn > 1;

-- Step 5: Ensure no empty slugs remain (final safety net)
UPDATE ai_accounts 
SET slug = 'account-' || SUBSTRING(id::text, 1, 8) || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER
WHERE slug IS NULL OR slug = '';

-- Step 6: Make slug NOT NULL and create unique index
ALTER TABLE ai_accounts ALTER COLUMN slug SET NOT NULL;
ALTER TABLE ai_accounts ALTER COLUMN slug SET DEFAULT '';

-- Step 7: Create the unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_accounts_slug ON ai_accounts(slug);