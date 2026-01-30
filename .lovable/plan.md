

# Fix Build Error: idx_ai_accounts_slug Duplicate Key

## Problem

The publish is failing because a migration is trying to create a **unique index on a `slug` column** that doesn't exist yet in production. When the column is added, all existing rows get empty values, causing a duplicate key violation:

```
ERROR: could not create unique index "idx_ai_accounts_slug"
Key (slug)=() is duplicated
```

**Current Production State:**
- `ai_accounts` table has 2 existing rows
- NO `slug` column exists
- NO `idx_ai_accounts_slug` index exists

---

## Root Cause

A migration from an earlier version (before the 29 versions you mentioned) introduced:
1. Adding `slug` column to `ai_accounts`
2. Creating unique index `idx_ai_accounts_slug`

But it didn't populate unique slugs for existing rows BEFORE creating the unique index.

---

## Solution: Create a Corrective Migration

I will create a new migration that:
1. First adds the `slug` column (if not exists)
2. Generates unique slugs for ALL existing rows
3. THEN creates the unique index

This ensures no duplicate empty values when the index is created.

---

## New Migration SQL

```sql
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
```

---

## Why This Works

| Step | Before | After |
|------|--------|-------|
| Existing rows | No slug column | slug = "veo-3-45000-credit-de12bf98" |
| New rows | No slug column | slug = "chat-gpt-premium-3781065c" |
| Index creation | Fails on empty duplicates | Succeeds with unique values |

---

## Files to Create/Modify

| File | Action |
|------|--------|
| New migration file | Create migration with the corrective SQL above |

---

## Implementation Steps

1. Create new database migration with the corrective SQL
2. This migration will run BEFORE any previous problematic migration
3. When publish runs again, slugs will already exist and be unique
4. The unique index will create successfully

---

## Expected Outcome

After implementing this fix:
1. Build error will be resolved
2. All existing `ai_accounts` will have unique slugs
3. The `idx_ai_accounts_slug` unique index will be created successfully
4. Your sidebar redesign changes will publish successfully

