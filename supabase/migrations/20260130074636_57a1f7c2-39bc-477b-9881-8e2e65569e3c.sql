-- Ensure slug column exists
ALTER TABLE public.ai_accounts ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill slugs in a way that is GUARANTEED unique by appending the record id.
-- This avoids any possibility of duplicates (including empty slugs) when creating the unique index.
WITH base AS (
  SELECT
    id,
    CASE
      WHEN COALESCE(TRIM(name), '') = '' THEN 'account'
      ELSE (
        -- slugify name
        TRIM(BOTH '-' FROM REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(LOWER(TRIM(name)), '[^a-z0-9\s-]', '', 'g'),
            '\s+',
            '-',
            'g'
          ),
          '-+',
          '-',
          'g'
        ))
      )
    END AS base_slug
  FROM public.ai_accounts
)
UPDATE public.ai_accounts a
SET slug = LEFT(
  CASE
    WHEN COALESCE(base.base_slug, '') = '' THEN 'account'
    ELSE base.base_slug
  END || '-' || SUBSTRING(a.id::text, 1, 8),
  90
)
FROM base
WHERE a.id = base.id
  AND (a.slug IS NULL OR TRIM(a.slug) = '');

-- Make sure there are no NULL/blank slugs left (safety net)
UPDATE public.ai_accounts
SET slug = 'account-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL OR TRIM(slug) = '';

-- Add constraints
ALTER TABLE public.ai_accounts ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.ai_accounts ALTER COLUMN slug SET DEFAULT '';

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_accounts_slug ON public.ai_accounts(slug);