
# Auto-Delivery System: Accounts, Licenses, Downloads Pool

## Overview
Build a complete auto-delivery infrastructure that automatically delivers unique content to each buyer upon purchase. This covers 5 delivery modes that sellers can configure per product:

1. **Account Pool** -- Seller uploads multiple account credentials (email/password pairs); each buyer gets one unique account automatically
2. **License Keys** -- Seller uploads a pool of license keys/serial numbers; one key assigned per buyer
3. **Single Download** -- Current behavior (all buyers get the same file set)
4. **Multi-Download Pool** -- Seller uploads multiple unique download items; each buyer gets the next available one
5. **Manual Delivery** -- Seller delivers manually (existing behavior for services/commissions)

---

## Database Changes

### New Table: `delivery_pool_items`
Stores the pool of deliverable items (accounts, license keys, unique downloads) that get assigned one-per-buyer.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| product_id | uuid | FK to seller_products |
| seller_id | uuid | FK to seller_profiles |
| item_type | text | 'account', 'license_key', 'download' |
| label | text | Display label (e.g., "Netflix Premium", "Pro License") |
| credentials | jsonb | For accounts: `{email, password, notes}`. For licenses: `{key, activation_url}`. For downloads: `{file_url, file_name, file_size}` |
| is_assigned | boolean | false = available, true = claimed |
| assigned_to | uuid | Buyer user_id (null until assigned) |
| assigned_order_id | uuid | Order that claimed this item |
| assigned_at | timestamptz | When it was assigned |
| created_at | timestamptz | Default now() |
| display_order | integer | Sort order |

### New Table: `buyer_delivered_items`
Records what was delivered to each buyer (the buyer-facing view of their delivered content).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| buyer_id | uuid | FK to user |
| order_id | uuid | FK to seller_orders |
| product_id | uuid | FK to seller_products |
| delivery_type | text | 'account', 'license_key', 'download', 'files' |
| delivered_data | jsonb | The actual credentials/key/link delivered |
| delivered_at | timestamptz | Default now() |
| is_revealed | boolean | Whether buyer has viewed it (for security masking) |

### Update `seller_products` column usage
- Use existing `delivery_type` column with new values: `'auto_account'`, `'auto_license'`, `'auto_download'`, `'instant_download'`, `'manual'`
- Use existing `product_metadata` JSONB to store delivery config: `{ max_per_buyer, reveal_after_hours, delivery_instructions }`

### RLS Policies
- `delivery_pool_items`: Sellers can CRUD their own items. Service role only for assignment.
- `buyer_delivered_items`: Buyers can SELECT their own rows. Service role inserts on purchase.

---

## Seller-Side: Delivery Inventory Manager

### Integration into Product Editor (NewProduct.tsx + SellerProducts.tsx edit Sheet)

When seller selects a product type that supports auto-delivery (digital_product, software, template, ebook, etc.), show a **Delivery Mode Selector**:

```
[Auto Accounts] [License Keys] [File Downloads] [Manual]
```

Based on selection, show the appropriate inventory panel:

**Account Pool Panel:**
- Table with columns: Label | Email | Password | Notes | Status (Available/Assigned)
- "Add Account" button -- opens a row to type email/password/notes
- "Bulk Import" button -- paste CSV or multi-line text (email:password format)
- Stock counter auto-syncs: available accounts = product stock
- Warning banner when pool is running low (< 5 remaining)

**License Keys Panel:**
- List view of keys with status badges
- "Add Key" -- single input field
- "Bulk Import" -- paste multiple keys (one per line)
- Optional: Activation URL field per key
- Stock auto-sync with available keys count

**Multi-Download Pool Panel:**
- Uses existing FileContentUploader but marks each file as "unique" (one per buyer)
- Toggle: "Each buyer gets a unique file" vs "All buyers get all files"
- Shows assigned/available counts per file

### Standalone Seller Inventory Page
A new section in the Seller Sidebar: **"Delivery Inventory"** -- shows:
- Overview cards: Total items, Available, Assigned, Low Stock warnings
- Filterable table of all delivery_pool_items across all products
- Quick-add items to any product
- Bulk import wizard
- Assignment history log

---

## Edge Function Update: `grant-product-access`

Enhance the existing function to handle auto-delivery:

```
For product types with auto_account/auto_license/auto_download delivery_type:
  1. Find next unassigned item from delivery_pool_items (ORDER BY display_order, created_at)
  2. Lock the row (SELECT FOR UPDATE) to prevent race conditions
  3. Mark as assigned (is_assigned=true, assigned_to, assigned_order_id, assigned_at)
  4. Insert into buyer_delivered_items with the credentials/key/link
  5. Update product stock (decrement by 1)
  6. If pool is empty after assignment, mark product as unavailable
  7. Send notification to buyer with delivery confirmation
  8. Send notification to seller if stock is low (< 5 remaining)
```

For existing `instant_download` type (unchanged): all buyers get the same product_content files.

---

## Buyer-Side: Delivered Content View

### BuyerLibrary.tsx Enhancement
When a buyer views their library, for auto-delivered items:
- **Account type**: Show masked credentials (e.g., `n***@gmail.com` / `****`) with a "Reveal" button
- **License key type**: Show masked key with "Copy" button
- **Download type**: Show download button for their unique file
- Each item shows: Product name, delivery date, "Delivered" badge

### buyer_delivered_items query
Join with `buyer_content_access` or query directly from `buyer_delivered_items` to show in the library.

---

## Technical Details

### Files to Create
1. **Migration SQL** -- Create `delivery_pool_items` and `buyer_delivered_items` tables with RLS
2. **`src/components/seller/DeliveryInventoryManager.tsx`** -- The inventory panel component (accounts/licenses/downloads CRUD)
3. **`src/components/seller/BulkImportModal.tsx`** -- CSV/text paste import for bulk adding items
4. **`src/components/seller/SellerDeliveryInventory.tsx`** -- Standalone inventory page for sidebar

### Files to Modify
1. **`supabase/functions/grant-product-access/index.ts`** -- Add auto-assignment logic with row locking
2. **`src/pages/NewProduct.tsx`** -- Add Delivery Mode Selector and embed DeliveryInventoryManager
3. **`src/components/seller/SellerProducts.tsx`** -- Add delivery inventory to edit Sheet
4. **`src/components/seller/SellerSidebar.tsx`** -- Add "Delivery Inventory" nav item
5. **`src/components/dashboard/BuyerLibrary.tsx`** -- Add delivered items display with reveal/copy
6. **`src/pages/Seller.tsx`** -- Add route for delivery inventory page

### Race Condition Prevention
The edge function uses `SELECT ... FOR UPDATE` to lock the next available item, preventing two simultaneous purchases from getting the same account/key. This is critical for unique delivery.

### Stock Auto-Sync
When seller adds/removes items from the pool, the product's `stock` column is automatically updated to match the count of unassigned items. This keeps the storefront accurate.
