
# Fix Seller Dashboard Reports & Product Analytics

## Problem Summary

The Seller Dashboard has two analytics components that need real data:

1. **SellerReports** - Already uses real data from `orders` and `products` via `useSellerContext()`. Working correctly.

2. **SellerProductAnalytics** - Fetches from `product_analytics` table which is **completely empty** (0 rows). The database functions `increment_seller_product_view` exist but are never called.

## Root Cause

The analytics pipeline is broken because:
- Product views are not being tracked when users view products
- Product clicks are not being tracked
- Purchase events are not syncing to `product_analytics` table
- The RPC functions `increment_seller_product_view` exist but are never invoked

## Solution

### Part 1: Track Product Views

When a user views a product (in store page modal or full view), call the database function to increment views.

**Files to update:**
- `src/pages/ProductFullView.tsx` - Call `increment_seller_product_view` when product loads
- `src/pages/Store.tsx` - Call when product modal opens
- `src/components/store/ProductDetailModal.tsx` - Track modal view

### Part 2: Track Clicks from Marketplace

When users click on products from marketplace sections (Hot Products, New Arrivals, Top Rated), track the click.

**Files to update:**
- `src/components/marketplace/HotProductsSection.tsx`
- `src/components/marketplace/NewArrivalsSection.tsx`
- `src/components/marketplace/TopRatedSection.tsx`

### Part 3: Sync Purchase Data to Analytics

Create a database trigger or update the purchase RPC to also insert/update `product_analytics` when an order is created.

**Option A (Recommended):** Database trigger on `seller_orders` INSERT
**Option B:** Update the `purchase_seller_product` RPC function

### Part 4: Backfill Historical Data

Create a one-time SQL migration to populate `product_analytics` from existing `seller_orders` data.

## Technical Implementation

### 1. View Tracking Hook/Utility

Create a utility function to track product views:

```typescript
// src/lib/analytics-tracker.ts
import { supabase } from '@/integrations/supabase/client';

export const trackProductView = async (productId: string) => {
  try {
    await supabase.rpc('increment_seller_product_view', { p_product_id: productId });
  } catch (error) {
    console.error('[Analytics] Failed to track view:', error);
  }
};

export const trackProductClick = async (productId: string) => {
  try {
    await supabase.rpc('increment_product_click', { p_product_id: productId });
  } catch (error) {
    console.error('[Analytics] Failed to track click:', error);
  }
};
```

### 2. ProductFullView.tsx Changes

Add view tracking when product data is fetched:

```typescript
// After product data is loaded successfully
useEffect(() => {
  if (product?.id) {
    trackProductView(product.id);
  }
}, [product?.id]);
```

### 3. Store.tsx - Product Modal View Tracking

Track when product detail modal is opened:

```typescript
const handleProductClick = (product: SellerProduct) => {
  setSelectedProduct(product);
  trackProductView(product.id);
};
```

### 4. Database Trigger for Purchase Analytics

Create a trigger to automatically update `product_analytics` when orders are created:

```sql
CREATE OR REPLACE FUNCTION sync_order_to_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO product_analytics (product_id, date, views, clicks, purchases, revenue)
  VALUES (NEW.product_id, CURRENT_DATE, 0, 0, 1, NEW.amount)
  ON CONFLICT (product_id, date) 
  DO UPDATE SET 
    purchases = product_analytics.purchases + 1,
    revenue = product_analytics.revenue + NEW.amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_order_analytics
AFTER INSERT ON seller_orders
FOR EACH ROW
EXECUTE FUNCTION sync_order_to_analytics();
```

### 5. Backfill Historical Orders

One-time migration to populate analytics from existing orders:

```sql
INSERT INTO product_analytics (product_id, date, views, clicks, purchases, revenue)
SELECT 
  product_id,
  DATE(created_at) as date,
  0 as views,
  0 as clicks,
  COUNT(*) as purchases,
  SUM(amount) as revenue
FROM seller_orders
WHERE status IN ('completed', 'delivered')
GROUP BY product_id, DATE(created_at)
ON CONFLICT (product_id, date) 
DO UPDATE SET 
  purchases = EXCLUDED.purchases,
  revenue = EXCLUDED.revenue;
```

### 6. Create Click Tracking RPC (if not exists)

```sql
CREATE OR REPLACE FUNCTION increment_product_click(p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO product_analytics (product_id, date, views, clicks, purchases, revenue)
  VALUES (p_product_id, CURRENT_DATE, 0, 1, 0, 0)
  ON CONFLICT (product_id, date) 
  DO UPDATE SET clicks = product_analytics.clicks + 1;
END;
$$ LANGUAGE plpgsql;
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/analytics-tracker.ts` | **NEW** - Create analytics tracking utilities |
| `src/pages/ProductFullView.tsx` | Add view tracking on product load |
| `src/pages/Store.tsx` | Track views when modal opens |
| `src/components/marketplace/HotProductsSection.tsx` | Track clicks on product cards |
| `src/components/marketplace/NewArrivalsSection.tsx` | Track clicks on product cards |
| `src/components/marketplace/TopRatedSection.tsx` | Track clicks on product cards |
| Database migration | Add trigger + backfill + click RPC |

## Expected Result

After implementation:
- **Views** will increment when users view product details (modal or full page)
- **Clicks** will increment when users click on products from marketplace sections
- **Purchases** will auto-sync from `seller_orders` via database trigger
- **Revenue** will be calculated from order amounts
- **Historical data** will be backfilled from existing orders
- **SellerProductAnalytics** component will show real metrics

## Analytics Data Flow

```text
User clicks product card (marketplace)
    └──> trackProductClick(productId) ──> product_analytics.clicks++

User opens product modal/page
    └──> trackProductView(productId) ──> product_analytics.views++

User completes purchase
    └──> seller_orders INSERT
         └──> Database trigger ──> product_analytics.purchases++, revenue++
```
