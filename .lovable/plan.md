
Goal
- Fix the publish failure: `ERROR: 23505 could not create unique index "idx_ai_accounts_slug" … Key (slug)=() is duplicated` while keeping existing Live products.
- Do it in a way that works reliably on a “fresh” Live database (where slug columns don’t exist yet) and does not rely on later “fix” migrations that never get a chance to run.

What’s actually failing (confirmed)
- The first slug migration that runs is:
  - `supabase/migrations/20260130061249_d2b3378b-5dea-4f83-9f16-1e6d3d7efc52.sql`
- That migration:
  1) Adds `slug` columns
  2) Populates slugs with `UPDATE ... SET slug = generate_product_slug(...)`
  3) Creates `idx_ai_accounts_slug` unique index
  4) Sets `DEFAULT ''` and `NOT NULL`
- The failure message indicates duplicates for the empty string `''`, meaning multiple rows end up with an empty slug at index-creation time, OR the migration makes it easy to produce empty slugs later (via `DEFAULT ''`).

Key bugs / high-risk patterns inside 20260130061249
1) Non-deterministic per-row uniqueness inside one UPDATE statement:
   - `UPDATE ai_accounts SET slug = generate_product_slug(name, NULL) WHERE slug IS NULL;`
   - In a single UPDATE statement, each row’s uniqueness check can be evaluated against a snapshot that doesn’t include other rows’ freshly-updated slugs, so duplicates can slip through in practice.
2) A logic bug in the function for seller_products:
   - `WHERE sp.slug = final_slug AND sp.seller_id = generate_product_slug.seller_id`
   - That should compare to the function argument, not `generate_product_slug.seller_id`.
3) Setting `slug DEFAULT ''` (empty string) is dangerous:
   - Makes empty strings common (and duplicates inevitable), and directly matches the error signature `Key (slug)=()`.

Constraints / reality about “going back in history”
- If you “Restore History” to a point before these migrations existed, it can work, but it may also remove unrelated changes you want to keep.
- The most reliable fix (without losing other work) is to directly fix the migration files that are causing the failure. This is safe because migrations are the source of truth for what gets applied on publish.

Plan A (recommended): Rework the existing migrations so publish succeeds
This plan keeps your product data and avoids needing support intervention.

Step 1 — Restore the auto-generated types file via History (user approved this)
Why:
- `src/integrations/supabase/types.ts` should never be manually edited. If it was edited, it can cause frontend build/type failures and confusion.
Action:
- Use History restore to revert ONLY the edit that modified `src/integrations/supabase/types.ts` (restore to the point right before that file was changed).
- After restoring, re-check that your UI still compiles in Preview.

Step 2 — Fix the FIRST failing migration (20260130061249) so it is deterministic and never creates empty slugs
Edits to `supabase/migrations/20260130061249_d2b3378b-5dea-4f83-9f16-1e6d3d7efc52.sql`:

2.1 Remove the risky uniqueness-by-loop approach for backfilling existing rows
- Keep a slug-normalization helper (optional), but do not rely on “check table then increment” inside the same UPDATE for bulk backfill.
- Replace the two backfill updates with a deterministic CTE strategy:
  - For ai_accounts (global uniqueness):
    - Compute `base_slug` from `name` (fall back to `product`)
    - Apply `row_number() over (partition by base_slug order by id)` to suffix `-2`, `-3`, ...
    - Write slug in one deterministic pass
  - For seller_products (uniqueness per seller_id):
    - Partition by `(seller_id, base_slug)` so each seller’s product names remain unique within the seller

2.2 Normalize empty/whitespace slugs before index creation
- Add defensive updates before creating the indexes:
  - `UPDATE ... SET slug = NULL WHERE slug IS NULL OR btrim(slug) = '' ...`
  - This prevents accidental empty-string collisions.

2.3 Add a non-null fallback for any rows still missing slug
- Final fallback:
  - `product-` + first 8 chars of UUID
- This guarantees there are no NULL/empty slugs before constraints/indexes.

2.4 Do NOT set `DEFAULT ''` for slug
- Remove:
  - `ALTER TABLE ... ALTER COLUMN slug SET DEFAULT '';`
- Keep `NOT NULL` after backfill, but no empty-string default.

2.5 Fix the seller_id comparison bug if you keep the function for per-row inserts
- If we keep a slug-generation function for inserts/updates, correct the seller clause to:
  - `WHERE sp.slug = final_slug AND sp.seller_id = seller_id`
  - or rename function param to `p_seller_id` and use that explicitly.

2.6 Adjust triggers to be safe
- Create a trigger function that only generates slug when NEW.slug is NULL/blank.
- Trigger should run on BOTH INSERT and UPDATE (optional, but recommended for safety).
- Ensure it uses the corrected function or a simplified slug generation approach.

Step 3 — Make later slug migrations non-conflicting (so they don’t re-break publish)
Right now, many later migrations also drop/create the same indexes and set defaults again, including:
- `20260130075808...`
- `20260130081643...`
- `20260130081840...`
- `20260130082450...`
- `20260130083543...`

We need to ensure only one “source of truth” remains, otherwise later migrations can reintroduce the same problem.

3.1 Choose ONE canonical slug migration approach
- After we fix 20260130061249 properly, the later slug migrations should become safe no-ops or be removed from the chain.
- Practical approach:
  - Convert the later slug migrations into “guarded” migrations:
    - If the `slug` columns and `idx_ai_accounts_slug` already exist, skip all work.
    - If they don’t exist, do minimal “ensure objects exist” without touching defaults and without recreating indexes unnecessarily.

3.2 Specifically remove re-introducing `DEFAULT ''`
- In `20260130082450...` and any others, remove:
  - `ALTER COLUMN slug SET DEFAULT ''`
- If they must remain, change them to:
  - Only set NOT NULL if needed and do not set default.

3.3 Prevent duplicate index recreation
- Change later migrations so they do NOT drop/recreate `idx_ai_accounts_slug` if it already exists.
- This avoids hitting errors again and keeps migrations idempotent.

3.4 Decide what to do with 20260130083543 (the “complete rewrite”)
- If 20260130061249 becomes correct and self-contained, 20260130083543 becomes redundant and risky because it drops/recreates many objects.
- We will either:
  - Turn 20260130083543 into a no-op guarded migration, or
  - Limit it to ONLY add missing `product_type` indexes (if needed) and do nothing slug-related.

Step 4 — Validate by simulating the migration order mentally (and with a quick scan)
- Ensure 20260130061249:
  - Backfills deterministic slugs
  - Creates unique indexes only after slugs are guaranteed non-empty and unique
  - Does not set `DEFAULT ''`
- Ensure subsequent migrations:
  - Don’t recreate the slug indexes or defaults
  - Don’t reintroduce empty strings

Step 5 — Publish again
Expected result:
- The publish workflow applies migrations successfully (no more 23505).
- Live ends with:
  - `ai_accounts.slug` NOT NULL, non-empty, globally unique
  - `seller_products.slug` NOT NULL, non-empty, unique per seller_id
  - No empty-string defaults that can re-trigger this in the future

Why this will work (plain English)
- The “row_number suffix” method guarantees uniqueness even when many products have the exact same name.
- Removing `DEFAULT ''` prevents creating lots of empty slugs in the future.
- Making later migrations no-ops prevents them from undoing the fix.

What I need from you (very small)
- Confirm you want Plan A (edit migrations in-place) rather than restoring far back in History and losing unrelated work.
  - Since you already approved “History restore is okay,” we’ll still only use History specifically to revert the generated types file edit—not to roll back your whole project.

Technical appendix (what the deterministic backfill looks like)
- ai_accounts (global uniqueness):
  - base_slug = slugified(name) or 'product'
  - rn = row_number partition by base_slug
  - slug = base_slug if rn=1 else base_slug||'-'||rn
- seller_products (per seller uniqueness):
  - same, but partition by (seller_id, base_slug)

Risks & mitigations
- Risk: Later migrations undo the fix (recreate defaults/indexes).
  - Mitigation: Guard or remove the conflicting parts so they can’t override.
- Risk: Some names slugify to empty (symbols-only).
  - Mitigation: base_slug fallback to 'product' + UUID-based fallback.

Definition of “Done”
- Publish completes successfully without the 23505 error.
- Live site loads and product pages still work (existing products preserved).
- New inserts/updates automatically get valid slugs (no empty strings).
