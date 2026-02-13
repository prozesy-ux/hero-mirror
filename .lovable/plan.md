

## Seller Analytics: Replace All Mock Data with Real Database Analytics

### Problem
The current Analytics page has several hardcoded/mock values and doesn't leverage the existing analytics tables in the database:

1. **Hardcoded "+9%" badge** on Product Views funnel item -- not computed from real data
2. **Active Users section** shows only "Product Views 100%" -- doesn't use `seller_traffic_analytics` table (which has `page_views`, `unique_visitors`, `source` data per day)
3. **Product views change %** is hardcoded to `0` -- not computed week-over-week
4. **No product_analytics table usage** -- the `product_analytics` table has daily `views`, `clicks`, `purchases`, `revenue` per product but is never queried
5. **Buyer country data exists** (`profiles.country` column) but isn't used for the Active Users country breakdown
6. **Average rating** is fetched but never displayed anywhere
7. **Clicks data** from `product_analytics` is never shown

### Available Database Tables (Currently Unused)

```text
product_analytics:    id, product_id, date, views, clicks, purchases, revenue
seller_traffic_analytics: id, seller_id, date, page_views, unique_visitors, source
profiles:             ... country (buyer country field)
seller_products:      ... view_count (per-product lifetime views)
```

### Changes

**File 1: `supabase/functions/bff-seller-dashboard/index.ts`**
Add 3 new parallel queries to the existing BFF endpoint:

- Fetch `product_analytics` for all seller products (last 90 days) -- provides daily views, clicks, purchases, revenue per product
- Fetch `seller_traffic_analytics` for the seller (last 90 days) -- provides daily page_views, unique_visitors, and traffic source breakdown
- Fetch buyer countries from `profiles.country` using buyer_ids from orders -- provides real country distribution for Active Users

Return these as `productAnalytics`, `trafficAnalytics`, and `buyerCountries` in the BFF response.

**File 2: `src/contexts/SellerContext.tsx`**
- Add `productAnalytics`, `trafficAnalytics`, and `buyerCountries` to the context state and type definitions
- Parse the new BFF response fields and expose them to child components

**File 3: `src/components/seller/SellerAnalytics.tsx`**
Replace all mock/hardcoded data with computed values from the new context data:

- **Product Views badge**: Compute real week-over-week % change from `product_analytics.views` data instead of hardcoded "+9%"
- **Views change %**: Compute from `product_analytics` comparing this week vs last week views
- **Active Users section**: Use `seller_traffic_analytics` for real `unique_visitors` count and `profiles.country` data for the country breakdown bars (e.g., "Bangladesh 45%", "India 30%", "USA 15%", "Others 10%")
- **Traffic Sources**: Optionally add traffic source data (Direct, Social, Organic, Referral) from `seller_traffic_analytics.source` field alongside the order breakdown
- **Average Rating**: Display the fetched `avgRating` value in the dashboard (either as a stat card or in the header)
- **Clicks metric**: Add total clicks from `product_analytics.clicks` to the conversion funnel between Views and Orders

### Data Flow

```text
BFF Edge Function
  |-- product_analytics (daily views/clicks/purchases/revenue per product)
  |-- seller_traffic_analytics (daily page_views/unique_visitors/source)
  |-- profiles.country (buyer countries from order buyer_ids)
  v
SellerContext (new state fields)
  v
SellerAnalytics.tsx
  |-- Real views % change badge (computed from product_analytics)
  |-- Real country breakdown (from profiles.country)
  |-- Real traffic source split (from seller_traffic_analytics.source)
  |-- Real clicks in funnel (from product_analytics.clicks)
  |-- Avg rating display (from product_reviews)
```

### What Stays the Same
- The `EzMartDashboardGrid` component is NOT modified -- only the data passed to it changes
- The header toolbar (date range picker, period selector, Export button) stays
- Revenue chart, Monthly Target gauge, Order Breakdown, Recent Orders table -- all keep the same visual design
- The SellerDashboard (home) page also benefits from the new context data

