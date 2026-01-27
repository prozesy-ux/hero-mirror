
# Complete Project Architecture Analysis: Server-Side vs Client-Side

## Current Server-Side (BFF) Implementation Status

### FULLY SERVER-SIDE (Using BFF Edge Functions) ✅

| Area | Edge Function | Components Using It | Status |
|------|--------------|---------------------|--------|
| **Seller Dashboard** | `bff-seller-dashboard` | `SellerContext.tsx`, All Seller components | ✅ Complete |
| **Buyer Dashboard Home** | `bff-buyer-dashboard` | `BuyerDashboardHome.tsx` | ✅ Complete |
| **Buyer Orders** | `bff-buyer-dashboard` | `BuyerOrders.tsx` | ✅ Complete |
| **Buyer Wallet** | `bff-buyer-wallet` | `BuyerWallet.tsx` | ✅ Complete |
| **Admin Panel** | `admin-fetch-data`, `admin-mutate-data` | All Admin components | ✅ Complete |
| **Withdrawal OTP Flow** | `send-withdrawal-otp`, `verify-withdrawal-otp` | Seller/Buyer Wallet | ✅ Complete |
| **Buyer Withdrawal OTP** | `send-buyer-withdrawal-otp`, `verify-buyer-withdrawal-otp` | `BuyerWallet.tsx` | ✅ Complete |
| **Authentication** | `validate-session` | `ProtectedRoute.tsx`, `useSessionHeartbeat.ts` | ✅ Complete |
| **Payments** | `create-razorpay-order`, `verify-razorpay-payment` | Payment flows | ✅ Complete |
| **Wallet Top-Up** | `create-topup`, `verify-topup` | Wallet components | ✅ Complete |
| **Push Notifications** | `manage-push`, `send-push`, `broadcast-push` | Various components | ✅ Complete |
| **Email System** | `send-email`, `email-health` | System-wide | ✅ Complete |
| **Data Export** | `export-user-data` | `ProfileSection.tsx` | ✅ Complete |

---

### STILL CLIENT-SIDE (Direct Supabase Calls) ⚠️

These components currently make direct database calls from the browser:

| Component | Location | Data Fetched | Risk Level |
|-----------|----------|--------------|------------|
| **BuyerAnalytics** | `src/components/dashboard/BuyerAnalytics.tsx` | `seller_orders` with products | Medium |
| **BuyerNotifications** | `src/components/dashboard/BuyerNotifications.tsx` | `notifications` | Low |
| **BuyerWishlist** | `src/components/dashboard/BuyerWishlist.tsx` | `buyer_wishlist`, `seller_products` | Medium |
| **BuyerReports** | `src/components/dashboard/BuyerReports.tsx` | `seller_orders` with products | Medium |
| **AIAccountsSection** | `src/components/dashboard/AIAccountsSection.tsx` | `ai_accounts`, `seller_products`, `categories`, `user_wallets`, purchases | High |
| **ChatSection** | `src/components/dashboard/ChatSection.tsx` | `support_messages`, `seller_chats`, `seller_profiles` | Medium |
| **ProfileSection** | `src/components/dashboard/ProfileSection.tsx` | `user_preferences`, `user_sessions` | Low |
| **Store Page** | `src/pages/Store.tsx` | `seller_profiles`, `seller_products`, `categories`, `user_wallets` | Low (public) |
| **SellerDashboard** | `src/components/seller/SellerDashboard.tsx` | `seller_trust_scores`, `seller_chats`, `product_reviews` | Low (extra queries) |

---

## Missing Server-Side Implementations

### Priority 1: HIGH - Components with Wallet/Purchase Logic

**1. AIAccountsSection.tsx (Critical)**
- Makes direct wallet queries for balance checks
- Handles purchases with client-side RPC calls
- Should be migrated to a `bff-marketplace` endpoint

**2. BuyerAnalytics.tsx & BuyerReports.tsx**
- Already have order data from `bff-buyer-dashboard`
- Should use the existing `sellerOrders` from BFF instead of re-fetching

### Priority 2: MEDIUM - Data Consistency Issues

**3. BuyerWishlist.tsx**
- Fetches wishlist and product details separately
- Should add wishlist items to `bff-buyer-dashboard`

**4. ChatSection.tsx**
- Multiple direct queries for conversations
- Could be added to existing BFF or new `bff-buyer-chats` endpoint

### Priority 3: LOW - Already Protected by RLS

**5. BuyerNotifications.tsx** - Read-only, user-scoped by RLS
**6. ProfileSection.tsx** - User preferences, protected by RLS
**7. Store.tsx** - Public data, no auth required

---

## Cache Clearing Issue Analysis

### Current Cache Architecture

```text
main.tsx
    |
    v
[Render App Immediately]
    |
    v (background)
[performCacheReset()] - checks APP_VERSION in cache-utils.ts
    |
    v
[hasVersionChanged()?]
    |
    YES --> Clear: Browser caches, sessionStorage, selective localStorage
    NO  --> Skip cache clearing
```

### Why You Need to Clear Cache Manually

**Root Cause**: The `APP_VERSION` in `cache-utils.ts` (currently `1.0.1`) is only incremented during code deployments by developers. If you're testing on a development machine without bumping the version, the cache system thinks it's the same version and skips clearing.

**Current Preserved Keys** (never cleared):
- `sb-*` (Supabase auth tokens)
- `storeReturn`, `pendingPurchase`, `pendingChat` (user intent)
- `sidebar-collapsed`, `seller-sidebar-collapsed`, `admin-sidebar-collapsed` (UI state)
- `admin_session_token`

### Solutions for Testing Cache Issues

**Option A: Force Version Bump (Recommended)**
Add a script that auto-increments `APP_VERSION` on each build:

```typescript
// cache-utils.ts - Add development mode
export const DEV_MODE = import.meta.env.DEV;
export const APP_VERSION = DEV_MODE 
  ? `dev-${Date.now()}` // Always unique in development
  : '1.0.2';
```

**Option B: Add Manual Cache Clear Button**
Add a button in the UI (Settings or Admin) that calls `forceClearAllCaches()`:

```typescript
// Already exists in cache-utils.ts:
export const forceClearAllCaches = async (): Promise<void> => {
  // Clears everything and reloads
};
```

**Option C: Service Worker Versioning**
Update `public/sw.js` to use versioned cache names that auto-invalidate.

---

## Summary: What Needs Migration

### Immediate Actions (Fix Data Loading Issues)

| Component | Action | Effort |
|-----------|--------|--------|
| `BuyerAnalytics.tsx` | Use `sellerOrders` from `bff-buyer-dashboard` instead of re-fetching | Low |
| `BuyerReports.tsx` | Use `sellerOrders` from `bff-buyer-dashboard` instead of re-fetching | Low |
| `BuyerWishlist.tsx` | Add wishlist items with product details to `bff-buyer-dashboard` | Medium |

### Phase 2 (Improve Reliability)

| Component | Action | Effort |
|-----------|--------|--------|
| `AIAccountsSection.tsx` | Create new `bff-marketplace` endpoint for accounts, products, categories | High |
| `ChatSection.tsx` | Create `bff-buyer-chats` or add to existing BFF | Medium |

### For Testing Cache Issues

| Solution | Action | Effort |
|----------|--------|--------|
| Dev Mode Version | Add `DEV_MODE` check in `cache-utils.ts` | Low |
| Manual Clear Button | Add button in Settings calling `forceClearAllCaches()` | Low |

---

## Architecture Diagram

```text
CURRENT ARCHITECTURE:

+----------------+     BFF Endpoints      +------------------+     Service Role    +-------------+
| Seller Panel   | --------------------> | bff-seller-      | -----------------> | Database    |
| (All Tabs)     |     ✅ COMPLETE       | dashboard        |    (Always works)  |             |
+----------------+                        +------------------+                    +-------------+

+----------------+     BFF Endpoints      +------------------+     Service Role    +-------------+
| Buyer Home     | --------------------> | bff-buyer-       | -----------------> | Database    |
| Orders, Wallet |     ✅ COMPLETE       | dashboard/wallet |    (Always works)  |             |
+----------------+                        +------------------+                    +-------------+

+----------------+     DIRECT CALLS       +-------------+
| Analytics      | --------------------> | Database    |  ⚠️ SHOULD USE BFF DATA
| Reports        |     ❌ CLIENT-SIDE    |             |
| Wishlist       |                       +-------------+
| AIAccounts     |
| Chat           |
+----------------+

+----------------+     admin-fetch-data   +------------------+     Service Role    +-------------+
| Admin Panel    | --------------------> | admin-*          | -----------------> | Database    |
| (All Tabs)     |     ✅ COMPLETE       | edge functions   |    (Always works)  |             |
+----------------+                        +------------------+                    +-------------+
```

---

## Recommended Next Steps

1. **Fix Analytics/Reports**: Make them use BFF data they already receive (lowest effort, highest impact)

2. **Add Dev Cache Busting**: Auto-generate version in development mode

3. **Create Marketplace BFF**: Consolidate AIAccountsSection data loading

4. **Add Cache Clear UI**: Button in Settings for manual cache reset during testing
