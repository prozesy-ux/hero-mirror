-- Fix: Handle empty slugs by using record ID as fallback
-- First, update any ai_accounts that have NULL or empty slugs
UPDATE ai_accounts 
SET slug = 'account-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- Handle any remaining duplicates by appending row number
WITH duplicates AS (
  SELECT id, slug, 
         ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
  FROM ai_accounts
  WHERE slug IS NOT NULL
)
UPDATE ai_accounts a
SET slug = a.slug || '-' || d.rn
FROM duplicates d
WHERE a.id = d.id AND d.rn > 1;

-- Now create the unique index (will succeed)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_accounts_slug ON ai_accounts(slug);