
## Complete Diagnosis & Fix Plan

### Problem Summary

Your production site (uptoza.com) shows "Something went wrong" because **publishing keeps failing**. The publish process cannot apply database migrations to your Live environment due to a bug in migration `20260130061249`.

### Root Cause

The first slug migration (`20260130061249`) generates duplicate slugs when multiple products share the same name (e.g., "Netflix Cheap Monthly Account"). The migration uses a loop-based uniqueness check that doesn't work correctly within a single `UPDATE` statement - each row sees the same database snapshot, so multiple rows get the same slug.

When Postgres tries to create the unique index `idx_ai_accounts_slug`, it finds duplicates and fails with:
```
ERROR: 23505 could not create unique index
Key (slug)=() is duplicated
```

### Current Database State

| Environment | ai_accounts.slug | seller_products.slug |
|-------------|------------------|---------------------|
| Test        | ✅ Exists (unique) | ❌ Does NOT exist   |
| Production  | ✅ Exists (unique) | ❌ Does NOT exist   |

Your Test environment was manually fixed, but production is stuck waiting for migrations to complete.

### Why Later Fix Migrations Don't Help

Migration `20260130083543` contains the correct deterministic fix using `ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id)`, but migrations run in timestamp order. Since `20260130061249` fails first, the fix never executes.

---

## The Fix

### Step 1: Rewrite Migration `20260130061249` In-Place

Replace the broken loop-based slug generation with deterministic window functions:

**Changes to make:**
1. Remove the `generate_product_slug` function call from bulk UPDATE statements
2. Use CTE with `ROW_NUMBER()` to guarantee unique suffixes in one pass:
```text
┌─────────────────────────────────────────────────────────┐
│ WITH slug_base AS (                                     │
│   SELECT id, base_slug FROM ai_accounts                 │
│ ),                                                      │
│ slug_ranked AS (                                        │
│   SELECT id, base_slug,                                 │
│     ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) AS rn │
│   FROM slug_base                                        │
│ )                                                       │
│ UPDATE ai_accounts a                                    │
│ SET slug = CASE WHEN rn=1 THEN base_slug                │
│                 ELSE base_slug || '-' || rn END         │
│ FROM slug_ranked r WHERE a.id = r.id;                   │
└─────────────────────────────────────────────────────────┘
```
3. Remove `ALTER COLUMN slug SET DEFAULT ''` (this creates empty-string duplicates)
4. Keep the trigger function for future inserts

### Step 2: Neutralize Later Conflicting Migrations

Migrations `20260130075808`, `20260130081643`, `20260130081840`, `20260130082450` may try to:
- Re-create indexes that already exist (causing errors)
- Re-set `DEFAULT ''` (reintroducing the bug)

**Changes to make:**
- Wrap all object creation in `IF NOT EXISTS` guards
- Remove any `SET DEFAULT ''` statements
- Ensure they become safe no-ops if objects already exist

### Step 3: Simplify Migration `20260130083543`

Since the first migration will now be correct:
- Keep only the `product_type` column additions
- Remove all slug-related logic (already handled)
- Add guards for all index creation

### Step 4: Bump Cache Version

Update `src/lib/cache-utils.ts`:
```typescript
export const APP_VERSION = '1.0.5';
```

This forces all users to clear their cached assets after publish succeeds.

---

## Technical Details

### What Each Fixed Migration Will Do

| Migration | Purpose | Action |
|-----------|---------|--------|
| `20260130061249` | Add slugs | Deterministic backfill with `ROW_NUMBER()`, create unique indexes |
| `20260130075808-082450` | Legacy attempts | Safe no-ops (check if exists first) |
| `20260130083543` | Product type | Add product_type column and index only |

### Why This Will Work

1. **Deterministic uniqueness**: `ROW_NUMBER()` assigns `base-slug`, `base-slug-2`, `base-slug-3` within a single statement - no race conditions
2. **No empty defaults**: Removing `DEFAULT ''` prevents future duplicates
3. **Idempotent later migrations**: Guards prevent "object already exists" errors
4. **Cache invalidation**: Version bump clears stale assets

---

## Verification Steps After Fix

1. Publish will succeed (migrations apply to Live)
2. Run verification query on Live:
```sql
SELECT slug, COUNT(*) FROM ai_accounts GROUP BY slug HAVING COUNT(*) > 1;
-- Should return 0 rows
```
3. Test account creation flow end-to-end
4. Confirm uptoza.com loads without "Something went wrong"

---

## Files to Modify

1. `supabase/migrations/20260130061249_d2b3378b-5dea-4f83-9f16-1e6d3d7efc52.sql` - Complete rewrite
2. `supabase/migrations/20260130075808_e0d9e4a5-b230-4e1b-b4e0-b537ffe0c285.sql` - Add guards
3. `supabase/migrations/20260130081643_ed8786d8-192d-4991-8a67-cea7c4d5bba5.sql` - Add guards
4. `supabase/migrations/20260130081840_1ed46374-1312-4818-a11e-074f7cb28f58.sql` - Add guards
5. `supabase/migrations/20260130082450_2647891f-4137-4dd1-849a-5abb85947118.sql` - Add guards
6. `supabase/migrations/20260130083543_301f760c-7436-40a7-9df9-740b8f9900f8.sql` - Simplify to product_type only
7. `src/lib/cache-utils.ts` - Bump version to 1.0.5

---

## Timeline

| Step | Duration |
|------|----------|
| Edit migrations | ~5 minutes |
| Publish | ~2 minutes |
| Verify | ~2 minutes |

**Total: ~10 minutes to full resolution**. Must flow url is product name like ChatGPT /chatgpt account
