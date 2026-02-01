

# Database Indexes Optimization Plan

## Overview

Add targeted database indexes to optimize slow query patterns for `seller_orders`, `wallet_transactions`, and product search tables. Based on analysis of current query patterns and index usage statistics, this migration will address high sequential scan rates and add missing covering indexes.

## Current State Analysis

### Index Usage Statistics

| Table | Sequential Scans | Index Scans | Ratio |
|-------|-----------------|-------------|-------|
| `seller_orders` | 4,200 | 926 | 🔴 82% seq scans |
| `wallet_transactions` | 2,692 | 953 | 🔴 74% seq scans |
| `recently_viewed` | 320 | 0 | 🔴 100% seq scans |
| `ai_accounts` | 20,263 | 8,499 | 🔴 70% seq scans |
| `seller_profiles` | 28,701 | 38,586 | 🟡 43% seq scans |
| `seller_products` | 7,515 | 18,050 | 🟢 29% seq scans |

### Key Query Patterns Identified

**seller_orders:**
- `WHERE buyer_id = ? ORDER BY created_at DESC` (buyer dashboard)
- `WHERE seller_id = ? ORDER BY created_at DESC` (seller dashboard)
- `WHERE status = 'completed' AND created_at >= ?` (hot products)
- `WHERE product_id = ?` (product analytics, aggregations)

**wallet_transactions:**
- `WHERE user_id = ? ORDER BY created_at DESC` (wallet history) ✅ Index exists
- `WHERE status = ? AND type = ?` (admin filtering)
- `WHERE transaction_id = ?` (payment verification)

**recently_viewed:**
- `WHERE user_id = ? ORDER BY viewed_at DESC` (search suggestions) ❌ No index!

**Product Search:**
- `WHERE is_available = true AND name ILIKE '%query%'` (ai_accounts)
- `WHERE is_available = true AND is_approved = true AND name ILIKE '%query%'` (seller_products)
- `WHERE store_name ILIKE '%query%' AND is_verified = true AND is_active = true` (seller_profiles)

## Indexes to Create

### 1. seller_orders - High Priority

```sql
-- Optimize buyer dashboard queries (buyer_id + created_at ordering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seller_orders_buyer_created 
ON seller_orders (buyer_id, created_at DESC);

-- Optimize seller dashboard queries (seller_id + created_at ordering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seller_orders_seller_created 
ON seller_orders (seller_id, created_at DESC);

-- Optimize hot products aggregation (status + created_at for date range + product_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seller_orders_completed_recent 
ON seller_orders (created_at DESC, product_id) 
WHERE status = 'completed';

-- Optimize product analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seller_orders_product_id 
ON seller_orders (product_id);
```

### 2. wallet_transactions - Medium Priority

```sql
-- Optimize admin filtering by status and type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_transactions_status_type 
ON wallet_transactions (status, type);

-- Optimize pending transaction lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_transactions_pending 
ON wallet_transactions (user_id, created_at DESC) 
WHERE status = 'pending';
```

### 3. recently_viewed - High Priority (Currently 100% seq scans!)

```sql
-- Critical: Optimize user's recently viewed products lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recently_viewed_user_viewed 
ON recently_viewed (user_id, viewed_at DESC);

-- Optimize product lookups for recently viewed
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recently_viewed_product 
ON recently_viewed (product_id, product_type);
```

### 4. Product Search Optimization

```sql
-- Optimize seller profile search (currently 43% seq scans)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seller_profiles_store_name_trgm 
ON seller_profiles USING gin (store_name gin_trgm_ops);

-- Optimize verified/active seller filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seller_profiles_verified_active 
ON seller_profiles (is_verified, is_active) 
WHERE is_verified = true AND is_active = true;
```

### 5. Additional Optimizations

```sql
-- popular_searches ordering optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_popular_searches_count_desc 
ON popular_searches (search_count DESC);
```

## Expected Performance Improvements

| Query Pattern | Before | After |
|--------------|--------|-------|
| Buyer order history | ~50-100ms (seq scan) | ~5-15ms (index scan) |
| Seller order list | ~50-100ms (seq scan) | ~5-15ms (index scan) |
| Hot products aggregation | ~200-400ms | ~30-50ms |
| Recently viewed lookup | ~100ms (seq scan) | ~10ms (index scan) |
| Store name search | ~150ms (seq scan) | ~20ms (index scan) |
| Wallet transaction history | Already indexed | Already indexed |

## Migration Strategy

All indexes will be created using `CONCURRENTLY` to avoid locking production tables during creation. This means:

- No table locks during index creation
- Queries continue to work normally
- Index creation takes longer but is production-safe
- Each index is wrapped in `IF NOT EXISTS` for idempotency

## Technical Details

### Files to Modify

| File | Action |
|------|--------|
| Database Migration | **CREATE** - Add performance indexes |

### SQL Migration Script

```sql
-- =====================================================
-- Performance Indexes for High-Traffic Tables
-- =====================================================

-- Enable pg_trgm extension if not already enabled (for fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===================
-- seller_orders
-- ===================

-- Buyer dashboard: ORDER BY created_at DESC with buyer_id filter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seller_orders_buyer_created 
ON seller_orders (buyer_id, created_at DESC);

-- Seller dashboard: ORDER BY created_at DESC with seller_id filter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seller_orders_seller_created 
ON seller_orders (seller_id, created_at DESC);

-- Hot products: completed orders in date range grouped by product
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seller_orders_completed_recent 
ON seller_orders (created_at DESC, product_id) 
WHERE status = 'completed';

-- Product analytics aggregations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seller_orders_product_id 
ON seller_orders (product_id);

-- ===================
-- wallet_transactions
-- ===================

-- Admin dashboard filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_transactions_status_type 
ON wallet_transactions (status, type);

-- Pending transactions lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_transactions_pending 
ON wallet_transactions (user_id, created_at DESC) 
WHERE status = 'pending';

-- ===================
-- recently_viewed (Critical - 100% seq scans currently!)
-- ===================

-- User's recently viewed products
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recently_viewed_user_viewed 
ON recently_viewed (user_id, viewed_at DESC);

-- Product lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recently_viewed_product 
ON recently_viewed (product_id, product_type);

-- ===================
-- seller_profiles (Search optimization)
-- ===================

-- Fuzzy search on store name
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seller_profiles_store_name_trgm 
ON seller_profiles USING gin (store_name gin_trgm_ops);

-- Verified & active sellers (partial index)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seller_profiles_verified_active 
ON seller_profiles (id) 
WHERE is_verified = true AND is_active = true;

-- ===================
-- popular_searches
-- ===================

-- Trending searches ordered by count
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_popular_searches_count_desc 
ON popular_searches (search_count DESC);
```

## Summary

- **11 new indexes** targeting the slowest query patterns
- **CONCURRENTLY** creation for zero-downtime deployment
- **Partial indexes** to reduce storage footprint where applicable
- **GIN trigram indexes** for fuzzy text search optimization
- **Expected 5-10x improvement** on frequently-executed dashboard queries
- **Reduces database load** by shifting from sequential to index scans

