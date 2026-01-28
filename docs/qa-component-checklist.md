# Component-Level QA Verification Checklist

> Maps the 23 client-side stability points to specific components for granular QA verification.
> Last updated: 2026-01-28

---

## Legend
- ✅ Verified
- ⬜ Pending
- ❌ Failed
- 🔄 Needs Retest

---

## 1. Auth & Session Components

| Component | File | Checkpoints Covered | Status | Notes |
|-----------|------|---------------------|--------|-------|
| **AuthContext** | `src/contexts/AuthContext.tsx` | #1, #3, #4 | ⬜ | Core session state, canMutate computation |
| **ProtectedRoute** | `src/components/auth/ProtectedRoute.tsx` | #2 | ⬜ | No forced redirects, soft handling |
| **SessionExpiredBanner** | `src/components/ui/session-expired-banner.tsx` | #3, #14 | ⬜ | Dismissible banner, allows interaction |
| **SignIn Page** | `src/pages/SignIn.tsx` | #1, #2 | ⬜ | Auth flow, error handling |
| **ResetPassword Page** | `src/pages/ResetPassword.tsx` | #1 | ⬜ | Token validation, soft errors |

### Verification Steps for Auth:
1. [ ] Login with valid credentials → Dashboard loads
2. [ ] Login with invalid credentials → Error toast, no redirect
3. [ ] Session expires → Banner appears, page stays interactive
4. [ ] Dismiss banner → Banner closes, can still view cached data
5. [ ] Attempt mutation with expired session → "Please wait" toast

---

## 2. Buyer Dashboard Components

| Component | File | Checkpoints Covered | Status | Notes |
|-----------|------|---------------------|--------|-------|
| **BuyerDashboardHome** | `src/components/dashboard/BuyerDashboardHome.tsx` | #5, #7, #8, #9, #14, #15, #16 | ⬜ | BFF fetch, cache fallback, stats display |
| **BuyerOrders** | `src/components/dashboard/BuyerOrders.tsx` | #7, #8, #9, #15, #16, #17 | ⬜ | Orders list, filtering, cached data |
| **BuyerWallet** | `src/components/dashboard/BuyerWallet.tsx` | #7, #8, #18, #19 | ⬜ | Balance display, withdrawal mutation lock |
| **BuyerWishlist** | `src/components/dashboard/BuyerWishlist.tsx` | #7, #8, #16 | ⬜ | Wishlist items, cache fallback |
| **BuyerNotifications** | `src/components/dashboard/BuyerNotifications.tsx` | #9 | ⬜ | Notification list, soft errors |
| **BuyerAnalytics** | `src/components/dashboard/BuyerAnalytics.tsx` | #16 | ⬜ | Stats rendering |
| **BuyerReports** | `src/components/dashboard/BuyerReports.tsx` | #16 | ⬜ | Reports display |

### Verification Steps for Buyer:
1. [ ] Load dashboard → Stats cards populated
2. [ ] Disconnect network → Cached data shows with amber notice
3. [ ] Reconnect → Fresh data loads, notice disappears
4. [ ] Filter orders → Filters work with cached data
5. [ ] Attempt withdrawal with expired session → Blocked with message

---

## 3. Seller Dashboard Components

| Component | File | Checkpoints Covered | Status | Notes |
|-----------|------|---------------------|--------|-------|
| **SellerContext** | `src/contexts/SellerContext.tsx` | #6, #7, #8, #12 | ⬜ | BFF fetch, cache, realtime resubscribe |
| **SellerDashboard** | `src/components/seller/SellerDashboard.tsx` | #6, #16 | ⬜ | Overview stats |
| **SellerOrders** | `src/components/seller/SellerOrders.tsx` | #7, #8, #17 | ⬜ | Orders list, filtering |
| **SellerProducts** | `src/components/seller/SellerProducts.tsx` | #7, #16, #18 | ⬜ | Products list, mutations |
| **SellerWallet** | `src/components/seller/SellerWallet.tsx` | #7, #8, #18, #19 | ⬜ | Balance, withdrawal lock |
| **SellerAnalytics** | `src/components/seller/SellerAnalytics.tsx` | #16 | ⬜ | Charts and metrics |
| **SellerCustomers** | `src/components/seller/SellerCustomers.tsx` | #7 | ⬜ | Customer list |
| **SellerInventory** | `src/components/seller/SellerInventory.tsx` | #18 | ⬜ | Stock mutations |
| **SellerFlashSales** | `src/components/seller/SellerFlashSales.tsx` | #18 | ⬜ | Flash sale mutations |
| **SellerSettings** | `src/components/seller/SellerSettings.tsx` | #18 | ⬜ | Profile mutations |
| **SellerChat** | `src/components/seller/SellerChat.tsx` | #10, #11 | ⬜ | Realtime messaging |

### Verification Steps for Seller:
1. [ ] Load seller dashboard → Stats populated
2. [ ] New order arrives → Realtime update shows
3. [ ] Disconnect network → Cached data with notice
4. [ ] Update product with expired session → Mutation blocked
5. [ ] Session refresh → Realtime channels resubscribe

---

## 4. Store & Marketplace Components

| Component | File | Checkpoints Covered | Status | Notes |
|-----------|------|---------------------|--------|-------|
| **Store Page** | `src/pages/Store.tsx` | #18, #19 | ⬜ | Purchase mutation lock |
| **ProductDetailModal** | `src/components/store/ProductDetailModal.tsx` | #18 | ⬜ | Add to cart/purchase |
| **StoreProductCard** | `src/components/store/StoreProductCard.tsx` | #16 | ⬜ | Product display |
| **CategoryBrowser** | `src/components/marketplace/CategoryBrowser.tsx` | #17 | ⬜ | Category filtering |
| **SearchFiltersBar** | `src/components/marketplace/SearchFiltersBar.tsx` | #17 | ⬜ | Search/filter state |
| **HotProductsSection** | `src/components/marketplace/HotProductsSection.tsx` | #16 | ⬜ | Products display |
| **NewArrivalsSection** | `src/components/marketplace/NewArrivalsSection.tsx` | #16 | ⬜ | Products display |

### Verification Steps for Store:
1. [ ] Browse products → Products load correctly
2. [ ] Apply filters → Results update
3. [ ] Purchase with valid session → Transaction completes
4. [ ] Purchase with expired session → "Please wait" message

---

## 5. Realtime Components

| Component | File | Checkpoints Covered | Status | Notes |
|-----------|------|---------------------|--------|-------|
| **FloatingChatWidget** | `src/components/dashboard/FloatingChatWidget.tsx` | #10, #11 | ⬜ | Chat realtime |
| **FloatingChatBox** | `src/components/dashboard/FloatingChatBox.tsx` | #10, #11, #12 | ⬜ | Message updates |
| **FloatingSupportChatBox** | `src/components/dashboard/FloatingSupportChatBox.tsx` | #10, #11 | ⬜ | Support chat realtime |
| **SellerChatModal** | `src/components/dashboard/SellerChatModal.tsx` | #10, #11 | ⬜ | Seller messaging |
| **ChatSection** | `src/components/dashboard/ChatSection.tsx` | #10, #11, #12 | ⬜ | Chat list realtime |

### Verification Steps for Realtime:
1. [ ] Open chat → Messages load
2. [ ] Send message → Appears instantly
3. [ ] Receive message → Real-time update
4. [ ] Session refresh → Channel resubscribes without duplicate messages
5. [ ] Close/reopen chat → No duplicate subscriptions

---

## 6. Admin Components

| Component | File | Checkpoints Covered | Status | Notes |
|-----------|------|---------------------|--------|-------|
| **Admin Page** | `src/pages/Admin.tsx` | #1, #22 | ⬜ | Admin session validation |
| **UsersManagement** | `src/components/admin/UsersManagement.tsx` | #18, #22 | ⬜ | User mutations |
| **WalletManagement** | `src/components/admin/WalletManagement.tsx` | #18 | ⬜ | Wallet mutations |
| **PromptsManagement** | `src/components/admin/PromptsManagement.tsx` | #18 | ⬜ | Prompt CRUD |
| **CategoriesManagement** | `src/components/admin/CategoriesManagement.tsx` | #18 | ⬜ | Category CRUD |
| **AIAccountsManagement** | `src/components/admin/AIAccountsManagement.tsx` | #18 | ⬜ | AI account CRUD |
| **SellerWithdrawalsAdmin** | `src/components/admin/SellerWithdrawalsAdmin.tsx` | #18 | ⬜ | Process withdrawals |
| **PurchasesManagement** | `src/components/admin/PurchasesManagement.tsx` | #16 | ⬜ | Purchase history |
| **AdminAuditLogs** | `src/components/admin/AdminAuditLogs.tsx` | #20 | ⬜ | Audit trail |
| **ChatManagement** | `src/components/admin/ChatManagement.tsx` | #10, #11 | ⬜ | Admin chat |

### Verification Steps for Admin:
1. [ ] Login as admin → Dashboard loads
2. [ ] Invalid admin token → 401 returned
3. [ ] Perform mutation → Action logged in audit
4. [ ] Table outside whitelist → Blocked

---

## 7. Shared UI Components

| Component | File | Checkpoints Covered | Status | Notes |
|-----------|------|---------------------|--------|-------|
| **ErrorBoundary** | `src/components/ui/error-boundary.tsx` | #23 | ⬜ | Graceful error recovery |
| **AppLoader** | `src/components/ui/app-loader.tsx` | #13 | ⬜ | Loading states |
| **Toaster/Sonner** | `src/components/ui/sonner.tsx` | #9, #23 | ⬜ | Soft notifications |
| **ConfirmDialog** | `src/components/ui/confirm-dialog.tsx` | #18 | ⬜ | Mutation confirmations |

### Verification Steps for UI:
1. [ ] Error occurs → ErrorBoundary catches, shows recovery UI
2. [ ] Toast fires → Notification appears and auto-dismisses
3. [ ] Confirm dialog → Blocks mutation until confirmed

---

## 8. Core Infrastructure

| File | Checkpoints Covered | Status | Notes |
|------|---------------------|--------|-------|
| **api-fetch.ts** | `src/lib/api-fetch.ts` | #1, #20, #22, #23 | ⬜ | Unauthorized event, no signOut |
| **cache-utils.ts** | `src/lib/cache-utils.ts` | #7, #8 | ⬜ | Version-aware cache clearing |
| **session-persistence.ts** | `src/lib/session-persistence.ts` | #3 | ⬜ | Session state persistence |
| **session-detector.ts** | `src/lib/session-detector.ts` | #1 | ⬜ | Sync session detection |

### Verification Steps for Infrastructure:
1. [ ] 401 response → Event emitted, no forced logout
2. [ ] Cache version mismatch → Old cache cleared
3. [ ] App reload with session → Renders immediately (no flash)

---

## Quick Reference: Checkpoint to Component Map

| # | Checkpoint | Primary Components |
|---|------------|-------------------|
| 1 | Soft banner, no forced logout | api-fetch.ts, AuthContext |
| 2 | No client redirects | ProtectedRoute |
| 3 | sessionExpired flag + UI notice | AuthContext, SessionExpiredBanner |
| 4 | canMutate lock | AuthContext |
| 5 | Buyer BFF fetch | BuyerDashboardHome |
| 6 | Seller BFF fetch | SellerContext, SellerDashboard |
| 7 | Cached data on failure | All dashboard components |
| 8 | Cache expiry <5 min | BuyerDashboardHome, BuyerOrders, SellerContext |
| 9 | Soft network error notifications | All dashboards |
| 10 | Channels unsubscribe first | Chat components, dashboards |
| 11 | Events trigger refresh | Chat components, dashboards |
| 12 | Token refresh → resubscribe | SellerContext, ChatSection |
| 13 | JSX fragments fixed | All components |
| 14 | Session expired banner | SessionExpiredBanner |
| 15 | Cached/offline notice | BuyerDashboardHome, BuyerOrders |
| 16 | Stats render with cache | All stat components |
| 17 | Filters/sorting work | Orders, Products, Marketplace |
| 18 | Writes respect canMutate | Store, Wallet, Admin mutations |
| 19 | "Please wait" message | Store, Wallets |
| 20 | Console logs for unauthorized | api-fetch.ts |
| 21 | No duplicate providers | App.tsx |
| 22 | BFF validates server-side | All BFF endpoints |
| 23 | Soft notifications, no reload | Toaster, ErrorBoundary |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Dev Lead | | | |
| Product Owner | | | |

---

*Generated from Master System Verification Table (46-point checklist)*
