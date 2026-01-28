

# Fix Store Page Products Not Loading

## Problem Identified

The store page loads but shows **no products** because the `bff-store-public` edge function is querying a **non-existent column** (`original_price`) from the `seller_products` table. This causes the Supabase query to fail silently and return an empty array.

### Evidence
- Database query confirmed 4 products exist for Prozesy store
- Edge function logs show: `Returning 0 products for Prozesy`
- Table schema doesn't include `original_price` column
- The edge function SELECT statement includes `original_price` on line 67

---

## Root Cause

```text
Edge Function Query:
.select('id, name, description, price, icon_url, category_id, is_available, 
        is_approved, tags, stock, sold_count, chat_allowed, seller_id, 
        view_count, original_price, images')  <-- original_price DOESN'T EXIST!

Available Columns:
id, seller_id, name, description, price, icon_url, category_id, stock, 
is_available, is_approved, sold_count, tags, created_at, updated_at, 
chat_allowed, requires_email, category_ids, images, view_count
```

---

## Solution

### 1. Fix Edge Function Query (Primary Fix)

**File:** `supabase/functions/bff-store-public/index.ts`

Remove `original_price` from the SELECT statement since it doesn't exist in the database.

**Before (line 67):**
```typescript
.select('id, name, description, price, icon_url, category_id, is_available, is_approved, tags, stock, sold_count, chat_allowed, seller_id, view_count, original_price, images')
```

**After:**
```typescript
.select('id, name, description, price, icon_url, category_id, is_available, is_approved, tags, stock, sold_count, chat_allowed, seller_id, view_count, images')
```

### 2. Add Error Logging for Products Query

Add proper error handling to catch similar issues in the future.

**Add after products query (around line 84):**
```typescript
if (productsResult.error) {
  console.error('[BFF-StorePublic] Products query error:', productsResult.error);
}
```

### 3. Update Frontend SellerProduct Interface

**File:** `src/pages/Store.tsx`

The `SellerProduct` interface already has `original_price` as optional, so no changes needed there. The frontend will work fine without it.

---

## Technical Details

| Change | File | Impact |
|--------|------|--------|
| Remove `original_price` from SELECT | `bff-store-public/index.ts` | Fixes empty products array |
| Add error logging | `bff-store-public/index.ts` | Improves debugging |
| Deploy edge function | Automatic | Makes fix live |

---

## Files to Modify

1. `supabase/functions/bff-store-public/index.ts`
   - Remove `original_price` from products SELECT statement
   - Add error logging for products query

---

## Expected Outcome

After this fix:
- Store pages will correctly load and display all approved products
- Edge function logs will show actual product counts
- If any query errors occur in the future, they will be logged properly

