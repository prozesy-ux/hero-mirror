

# Fix Database Migration to Enable Product Type System

## Current Situation

**Your Product Type selector is already built** in the code - it just cannot deploy to your live site because a database migration is failing.

---

## The Problem

The migration that adds SEO-friendly URLs to products is failing with this error:

```
could not create unique index "idx_ai_accounts_slug"
Key (slug)=() is duplicated
```

The slug generation function doesn't handle the case where multiple rows would get the same slug (like empty names becoming empty slugs).

---

## The Solution

Create a new migration that fixes the slug generation issue by:

1. First generating slugs for all products
2. Then finding any remaining duplicates/empty slugs and giving them unique ID-based fallbacks
3. Only then creating the unique index

---

## Migration Fix

```sql
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
```

---

## What This Fixes

Once the migration succeeds:

| Feature | Status After Fix |
|---------|-----------------|
| Product Type selector in Add Product dialog | Visible |
| eBook, Road Selfie, Course card designs | Working |
| Type-specific metadata fields | Functional |
| SEO-friendly product URLs | Active |
| Store type filters | Available |

---

## Files to Modify

| File | Action |
|------|--------|
| New Migration | Fix empty/duplicate slugs before creating unique index |

---

## Expected Result

After this fix deploys:
- Seller dashboard will show the Product Type selector when adding products
- Store pages will display specialized cards for each product type
- All recent updates will become visible

