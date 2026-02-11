

# Complete Auto-Delivery System Rebuild

## What This Does

Rebuilds the Delivery Inventory page into a powerful, standalone Auto-Delivery Management System. Sellers can manage accounts, license keys, and downloads -- all with product selection, bulk operations, editing, usage guides, and automatic/manual delivery toggling that flows through to orders.

---

## Current Problems

1. **SellerDeliveryInventory** is a read-only viewer -- no ability to add/edit items from this page
2. **DeliveryInventoryManager** only works inside the product editor -- hard to manage at scale
3. **SellerOrders** always shows "Deliver" button for pending orders, even when auto-delivery is active
4. No usage guides or instructions for buyers
5. No inline editing of account credentials or license keys
6. No multi-product selection when adding items
7. No clear auto vs manual delivery toggle visibility

## Architecture

The rebuilt system has **3 connected parts**:

```text
+-------------------------------+
|  Seller Delivery Dashboard    |
|  (SellerDeliveryInventory)    |
|                               |
|  [Accounts] [Licenses] [DL]  |
|  Product selector + Add/Edit  |
|  Bulk import + Usage guide    |
+-------------------------------+
         |
         v
+-------------------------------+
|  Product Editor Integration   |
|  (DeliveryInventoryManager)   |
|                               |
|  Auto/Manual toggle per       |
|  product, linked pool view    |
+-------------------------------+
         |
         v
+-------------------------------+
|  Order Flow                   |
|  (SellerOrders + BuyerLib)    |
|                               |
|  Auto-delivered = no manual   |
|  Manual = show deliver button |
|  Buyer sees credentials/keys  |
+-------------------------------+
```

---

## Changes

### 1. Rebuild SellerDeliveryInventory.tsx (Full Rewrite)

**Current**: Read-only table viewer
**New**: Full management dashboard with 3 tabbed sections

**Tab 1 -- Accounts Section:**
- Product selector dropdown (single or multi-product)
- Add single account: Email, Password, Notes, Usage Guide fields
- Bulk import: Paste `email:password` or `email:password:notes` format
- Table with inline editing (click to edit email/password/notes)
- Eye/EyeOff toggle for passwords
- Copy button per row
- Delete button (only unassigned)
- Status badges: Available (green), Assigned (gray with buyer info)
- Usage guide editor per product: Rich text area for "How to use this account"

**Tab 2 -- License Keys Section:**
- Product selector
- Add single key with optional activation URL and guide
- Bulk import: One key per line
- Table with copy, edit, delete
- Guide field: "How to activate this license"

**Tab 3 -- Downloads Section:**
- Product selector
- File upload or URL input for unique downloads
- Each file = one delivery item
- Status tracking

**Top Overview Cards** (existing, keep):
- Total Items, Available, Assigned, Low Stock

**Filters** (existing, enhanced):
- Search, Type filter, Status filter, Product filter

**Design**: Gumroad black-base typography system (same as SellerProducts)

### 2. Update DeliveryInventoryManager.tsx

- Add a "usage_guide" text field per delivery mode
- Save guide to `product_metadata.delivery_guide` JSONB field
- Show link to full Delivery Dashboard: "Manage all inventory"
- Auto/Manual toggle with clear explanation:
  - Auto ON: "Orders auto-deliver from pool. No manual action needed."
  - Auto OFF: "You manually deliver each order from the Sales page."

### 3. Update SellerOrders.tsx

- Check product's `delivery_type` on each order
- If `delivery_type` is `auto_account`, `auto_license`, or `auto_download`:
  - Hide the "Deliver" button for pending orders
  - Show "Auto-Delivered" badge instead
  - Show delivered item details (from `buyer_delivered_items` join)
- If `delivery_type` is `manual` or `instant_download`:
  - Show "Deliver" button as normal (existing behavior)

### 4. Update BuyerLibrary.tsx

- For delivered items, show the **usage guide** from `product_metadata.delivery_guide`
- Add a "How to Use" expandable section below credentials/keys
- Better card design for delivered items with clear copy buttons

### 5. Database: Add delivery_guide to product_metadata

No schema migration needed -- `product_metadata` is already JSONB. The guide will be stored as:
```json
{ "delivery_guide": "Step 1: Go to site...\nStep 2: Login with..." }
```

### 6. Update grant-product-access Edge Function

- After auto-delivery assignment, include the `delivery_guide` from product metadata in the `buyer_delivered_items.delivered_data` JSONB
- This way buyer always has the guide even if seller changes it later

---

## Technical Details

### Files to Modify

1. **`src/components/seller/SellerDeliveryInventory.tsx`** -- Full rewrite with tabbed sections, add/edit/bulk import, product selector, usage guide editor, inline editing
2. **`src/components/seller/DeliveryInventoryManager.tsx`** -- Add usage guide field, auto/manual toggle clarity, link to dashboard
3. **`src/components/seller/SellerOrders.tsx`** -- Hide deliver button for auto-delivery orders, show auto-delivered badge
4. **`src/components/dashboard/BuyerLibrary.tsx`** -- Show usage guide in delivered items
5. **`supabase/functions/grant-product-access/index.ts`** -- Include delivery_guide in delivered_data

### Key Features per Section

**Account Management:**
- Add: Email + Password + Notes + Guide
- Edit inline: Click any field to edit, save with checkmark
- Bulk: Paste multi-line `email:password` or `email:password:notes`
- View: Masked passwords with reveal, copy all

**License Key Management:**
- Add: Key + Activation URL + Guide
- Edit inline: Click key to edit
- Bulk: Paste one key per line
- Copy individual or all keys

**Download Management:**
- Add: File URL + File Name
- Track assigned/available

**Auto vs Manual Logic:**
- Product `delivery_type` = `auto_account`/`auto_license`/`auto_download` -> auto mode
- Product `delivery_type` = `manual`/`instant_download` -> manual mode
- In SellerOrders: check `order.product.delivery_type` to decide UI

### No New Tables or Migrations
All data fits existing `delivery_pool_items`, `buyer_delivered_items`, and `product_metadata` JSONB.

### Design System
- All text: `text-black`, `text-black/XX` opacity variants
- Borders: `border-black/10`
- Cards: `bg-white border border-black/10 rounded-xl`
- Section headers: `text-[10px] text-black/40 uppercase tracking-widest font-bold`
- Buttons: Black primary, outline secondary
- Tabs: Black active state, `text-black/50` inactive

