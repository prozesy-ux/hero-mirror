
## What’s happening (step-by-step, plain English)

1) Publishing tries to apply the **new database migrations** to your Live backend.
2) It fails while trying to create this index:
   - `CREATE UNIQUE INDEX idx_ai_accounts_slug ON public.ai_accounts(slug);`
3) Postgres says:
   - `Key (slug)=() is duplicated.`
   That specific `()` means the duplicated value is the **empty string** `''` (not NULL).

So the publish isn’t failing because of the frontend build. It’s failing because the migration is trying to enforce “every slug must be unique” while multiple rows end up with `slug = ''`.

## What I found in your repo (root cause inside the migrations)

You currently have multiple “slug” migrations in the same day:

- `20260130061249_d2b3378b-...sql`  (first slug migration)
- `20260130081643_...sql`
- `20260130081840_...sql`
- `20260130082450_...sql`

Publishing applies migrations **in timestamp order**. Since none of the `202601300...` migrations are applied yet (in Test or Live), the **first one that will run is** `20260130061249...`.

That first migration has a critical pattern that can lead to this failure:
- It generates slugs for existing rows using a function that checks the table for collisions (`SELECT EXISTS(...)`) inside a loop.
- Inside a single `UPDATE ... SET slug = generate_product_slug(...)`, **each row evaluates against the same snapshot** (other rows updated in the same statement aren’t visible), which can still produce duplicates.
- Then it sets `DEFAULT ''` and `NOT NULL` for slug later, which is dangerous because it makes it easy for empty strings to exist.

Even if later “bulletproof” migrations exist, they never run, because publishing stops at the first failure.

## Verified environment state (important)
- In both Test and Live right now, `ai_accounts.slug` does **not** exist yet.
- That means we must treat Live as “fresh” for these slug migrations: the first slug migration must be correct on its own.

## The fix (100% reliable approach)

### Strategy: Fix the FIRST slug migration so it cannot produce duplicates (and avoid empty-string defaults)

We will change the earliest slug migration that gets applied (`20260130061249...`) to:

1) Add `slug` columns as **nullable** (no default).
2) Normalize any “empty-ish” slug values to NULL (defensive).
3) Generate slugs **deterministically in SQL** using a window function so uniqueness is guaranteed in one pass:
   - Compute a base slug from `name`
   - Use `row_number()` to suffix duplicates: `base`, `base-2`, `base-3`, …
   - Do this for:
     - `ai_accounts` (global uniqueness)
     - `seller_products` (uniqueness per `seller_id`)
4) Ensure there are **no NULL and no empty string slugs** with a final fallback:
   - `product-` + first 8 chars of the UUID
5) Only then:
   - Set `slug` to `NOT NULL`
   - Add a `CHECK (slug <> '')` (optional but strongly recommended)
   - Create the `UNIQUE` indexes

Critically:
- We will **not** set `DEFAULT ''` for slug. That default is the main reason empty-string duplicates become “easy” to create in the future.

### Strategy: Make the later duplicate migrations safe/no-op
Because you have 3 later slug migrations, once the first one is fixed:
- the later ones could still conflict (dropping/creating same indexes, re-creating functions with different signatures, etc.)

So we will also do one of these approaches (I’ll pick the safest once I see the exact overlaps):
- Option A (recommended): Turn later slug migrations into **idempotent no-ops** (they check if things already exist and then do nothing)
- Option B: Reduce later ones to only what’s missing (e.g., product_type indexes), and remove any duplicate index creation logic.

## Additional necessary cleanup (prevents future publish failures)

### Stop editing generated backend types
Your project history shows edits to:
- `src/integrations/supabase/types.ts`

That file is generated and should not be hand-edited. Keeping manual edits there can cause build/publish instability later.

Plan:
- Revert `src/integrations/supabase/types.ts` back to the generated version by removing manual modifications and relying on the backend’s actual schema typings.

## Exact work I will do next (implementation steps)

### Step 1 — Confirm which migration is actually failing first
- Verify the first unapplied migration after `20260129101751` is `20260130061249...` (it is).
- Confirm no other migration earlier than `20260130061249...` touches `idx_ai_accounts_slug`.

### Step 2 — Rewrite `20260130061249...` to be deterministic and safe
Changes include:
- Remove the “loop + SELECT EXISTS uniqueness check” approach for backfilling.
- Replace with a single SQL CTE-based backfill using `row_number()` that guarantees unique slugs even when many names are identical.
- Remove `ALTER COLUMN slug SET DEFAULT ''` entirely.
- Ensure the unique index is created only after all rows have non-empty unique slugs.

### Step 3 — Make later slug migrations non-conflicting
- Review `20260130081643`, `20260130081840`, `20260130082450`
- Reduce them to:
  - Only add missing columns/indexes if necessary
  - Or skip entirely if slug + indexes already exist
- Ensure no later migration attempts to recreate `idx_ai_accounts_slug` in a way that can fail.

### Step 4 — Revert `src/integrations/supabase/types.ts`
- Remove manual edits so it matches generated schema typings.

### Step 5 — Re-publish
After these changes, publish should succeed because:
- `ai_accounts.slug` will be generated deterministically (no duplicates)
- empty strings will be prevented (no defaults to empty string, plus optional check constraint)
- unique index will be created only when the data is guaranteed clean

## Edge cases we will cover explicitly
- `name` is NULL/empty/only symbols -> base slug becomes `product`
- many rows same name -> `product`, `product-2`, `product-3`, …
- unexpected whitespace characters -> treated as empty and regenerated
- rerun safety -> uses IF EXISTS / IF NOT EXISTS patterns where needed

## Success criteria (“done”)
- Publish completes successfully.
- Live backend ends up with:
  - `ai_accounts.slug` present, non-empty, globally unique
  - `seller_products.slug` present, non-empty, unique per seller
  - product_type columns/indexes applied (if part of the migrations)
- No more “23505 duplicated empty slug” failures on publish.
