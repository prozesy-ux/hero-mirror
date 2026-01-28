# PromptHero Marketplace - Complete Project Architecture

## Quick Reference: All Server Connections

| Connection Point | File | How to Suspend |
|-----------------|------|----------------|
| Supabase Client | `src/integrations/supabase/client.ts` | Cannot edit (auto-generated) |
| Auth System | `src/hooks/useAuth.ts` | Disable `onAuthStateChange` listener |
| Session Heartbeat | `src/hooks/useSessionHeartbeat.ts` | Remove from Dashboard/Seller pages |
| BFF API Calls | `src/lib/api-fetch.ts` | Set `API_TIMEOUT = 0` to skip |
| Realtime Subscriptions | `src/contexts/SellerContext.tsx` | Remove channel subscriptions |
| Edge Functions | `supabase/functions/*` | Delete function or set `verify_jwt = true` |

---

## 🔐 AUTHENTICATION SYSTEM

### Files Involved
```
src/hooks/useAuth.ts           → Core auth hook
src/contexts/AuthContext.tsx   → Auth context provider
src/components/auth/ProtectedRoute.tsx → Route protection
src/lib/session-persistence.ts → 12-hour window tracking
src/hooks/useSessionHeartbeat.ts → Background token refresh
```

### How It Works
```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User Login (Email/Google)                                   │
│     ↓                                                           │
│  2. Supabase Auth stores JWT in localStorage                    │
│     ↓                                                           │
│  3. markSessionStart() stores timestamp (12h window)            │
│     ↓                                                           │
│  4. useSessionHeartbeat() runs every 5 minutes                  │
│     - Checks token expiry                                       │
│     - Refreshes if < 10 min left                                │
│     - Falls back to 12h window if refresh fails                 │
│     ↓                                                           │
│  5. ProtectedRoute validates before showing pages               │
│     - 5s timeout for auth loading                               │
│     - Calls validate-session edge function                      │
│     - Redirects to /signin if truly expired                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Server Connections
| Location | Connection | Purpose |
|----------|------------|---------|
| `useAuth.ts:33` | `supabase.rpc('has_role')` | Check admin role |
| `useAuth.ts:52` | `supabase.auth.onAuthStateChange` | Listen to auth events |
| `useAuth.ts:109` | `supabase.auth.getSession()` | Get existing session |
| `ProtectedRoute.tsx:24` | `fetch(validate-session)` | Server-side JWT validation |
| `useSessionHeartbeat.ts:44` | `supabase.auth.getSession()` | Check session health |
| `useSessionHeartbeat.ts:51` | `supabase.auth.refreshSession()` | Refresh expired tokens |

### To Suspend Authentication
```typescript
// In src/hooks/useAuth.ts - Line 50-106
// Comment out the entire useEffect block to disable auth monitoring

// In src/components/auth/ProtectedRoute.tsx
// Replace component with: return <>{children}</>
```

---

## 📊 BUYER DASHBOARD

### Files Involved
```
src/pages/Dashboard.tsx                    → Main dashboard page
src/components/dashboard/BuyerDashboardHome.tsx → Home section
src/components/dashboard/BuyerOrders.tsx   → Orders section
src/components/dashboard/BuyerWallet.tsx   → Wallet section
src/components/dashboard/BuyerWishlist.tsx → Wishlist section
src/components/dashboard/BuyerAnalytics.tsx → Analytics section
src/components/dashboard/AIAccountsSection.tsx → AI accounts
src/components/dashboard/ProfileSection.tsx → Profile settings
```

### Routes (12 sections)
```
/dashboard/home         → BuyerDashboardHome
/dashboard/prompts      → PromptsGrid
/dashboard/ai-accounts  → AIAccountsSection
/dashboard/billing      → BillingSection
/dashboard/wallet       → BuyerWallet
/dashboard/orders       → BuyerOrders
/dashboard/wishlist     → BuyerWishlist
/dashboard/analytics    → BuyerAnalytics
/dashboard/reports      → BuyerReports
/dashboard/notifications → BuyerNotifications
/dashboard/profile      → ProfileSection
/dashboard/chat         → ChatSection
```

### Server Connections
| Component | Connection | Purpose |
|-----------|------------|---------|
| Dashboard.tsx:93 | `useSessionHeartbeat()` | Background session monitoring |
| BuyerDashboardHome | `bffApi.getBuyerDashboard()` | Fetch all buyer data |
| BuyerWallet | `bffApi.getBuyerWallet()` | Fetch wallet + withdrawals |
| BuyerOrders | Realtime subscription | Listen to order updates |

### BFF Edge Function: `bff-buyer-dashboard`
```typescript
// Returns:
{
  profile: {...},
  wallet: { balance: number },
  purchases: [...],
  sellerOrders: [...],
  favorites: string[],
  wishlistCount: number,
  orderStats: {...}
}
```

### To Suspend Buyer Dashboard
```typescript
// In src/pages/Dashboard.tsx - Line 93
// Remove: useSessionHeartbeat();

// In BuyerDashboardHome - disable BFF call:
// Replace bffApi.getBuyerDashboard() with mock data
```

---

## 🏪 SELLER DASHBOARD

### Files Involved
```
src/pages/Seller.tsx                      → Main seller page
src/contexts/SellerContext.tsx            → Seller data context
src/components/seller/SellerDashboard.tsx → Dashboard home
src/components/seller/SellerProducts.tsx  → Products management
src/components/seller/SellerOrders.tsx    → Orders management
src/components/seller/SellerWallet.tsx    → Wallet + withdrawals
src/components/seller/SellerAnalytics.tsx → Analytics
src/components/seller/SellerChat.tsx      → Customer chat
src/components/seller/SellerSettings.tsx  → Store settings
```

### Routes (16 sections)
```
/seller/              → SellerDashboard
/seller/products      → SellerProducts
/seller/orders        → SellerOrders
/seller/analytics     → SellerAnalytics
/seller/inventory     → SellerInventory
/seller/customers     → SellerCustomers
/seller/marketing     → SellerMarketing
/seller/reports       → SellerReports
/seller/performance   → SellerPerformance
/seller/flash-sales   → SellerFlashSales
/seller/product-analytics → SellerProductAnalytics
/seller/chat          → SellerChat
/seller/wallet        → SellerWallet
/seller/feature-requests → SellerFeatureRequests
/seller/support       → SellerSupport
/seller/settings      → SellerSettings
```

### Server Connections in SellerContext.tsx
| Line | Connection | Purpose |
|------|------------|---------|
| 140 | `bffApi.getSellerDashboard()` | Fetch all seller data |
| 211-222 | `supabase.channel('seller-orders')` | Realtime order updates |
| 224-235 | `supabase.channel('seller-wallet')` | Realtime wallet updates |
| 237-248 | `supabase.channel('seller-products')` | Realtime product updates |
| 250-261 | `supabase.channel('seller-withdrawals')` | Realtime withdrawal updates |

### BFF Edge Function: `bff-seller-dashboard`
```typescript
// Returns:
{
  profile: {...},
  wallet: { balance, pending_balance },
  products: [...],
  orders: [...],
  withdrawals: [...],
  withdrawalMethods: [...],
  sellerLevels: [...],
  sellerCountry: string
}
```

### To Suspend Seller Dashboard
```typescript
// In src/pages/Seller.tsx - Line 612
// Remove: useSessionHeartbeat();

// In src/contexts/SellerContext.tsx
// Line 140: Replace bffApi.getSellerDashboard() with mock data
// Lines 207-269: Comment out all realtime subscriptions
```

---

## 🛒 MARKETPLACE

### Files Involved
```
src/components/marketplace/CategoryBrowser.tsx    → Category browsing
src/components/marketplace/HotProductsSection.tsx → Hot products
src/components/marketplace/NewArrivalsSection.tsx → New arrivals
src/components/marketplace/SearchFiltersBar.tsx  → Search filters
src/components/marketplace/SearchSuggestions.tsx → Search autocomplete
src/hooks/useMarketplaceData.ts                  → Marketplace data hook
src/hooks/useSearchSuggestions.ts               → Search suggestions
```

### Server Connections
| Component | Connection | Purpose |
|-----------|------------|---------|
| SearchSuggestions | `bff-marketplace-search` | Real-time search suggestions |
| CategoryBrowser | Direct Supabase query | Fetch categories |
| HotProductsSection | Direct Supabase query | Fetch trending products |

### BFF Edge Functions
```
bff-marketplace-home   → Homepage data (products, categories, sellers)
bff-marketplace-search → Search with suggestions
```

---

## 👨‍💼 ADMIN PANEL

### Files Involved
```
src/pages/Admin.tsx                        → Admin page
src/contexts/AdminDataContext.tsx          → Admin data provider
src/hooks/useAdminData.ts                  → Admin data fetching
src/hooks/useAdminMutate.ts               → Admin mutations
src/components/admin/AdminSidebar.tsx      → Admin navigation
src/components/admin/UsersManagement.tsx   → User management
src/components/admin/PromptsManagement.tsx → Prompts management
... (21 sections total)
```

### Admin Sections (21 total)
```
Dashboard, Users, Sellers, Products, Categories, AI Accounts,
Account Orders, Purchases, Coupons, Wallet, Chat, Resellers,
Payment Settings, Push Notifications, Announcements, Analytics,
Reports, Audit Logs, Email Templates, Feature Requests, Settings
```

### Server Connections
| Hook | Edge Function | Purpose |
|------|--------------|---------|
| useAdminData | `admin-fetch-data` | Fetch admin data |
| useAdminMutate | `admin-mutate-data` | Admin mutations (bypasses RLS) |
| Admin login | `admin-login` | Admin authentication |
| Admin session | `admin-validate-session` | Validate admin session |

### Admin Security
- Uses separate session system (NOT Supabase Auth)
- All mutations go through `admin-mutate-data` to bypass RLS
- Rate limiting: 5 failed attempts = 15 min block

---

## 📧 EMAIL SYSTEM

### Edge Functions
```
send-email                → Send transactional emails via Resend
email-health              → Check email configuration
send-user-otp             → Send OTP for profile changes
send-withdrawal-otp       → Send OTP for seller withdrawals
send-buyer-withdrawal-otp → Send OTP for buyer withdrawals
```

### Required Secret
```
RESEND_API_KEY → Resend API key for sending emails
EMAIL_FROM_ADDRESS → From address for emails
```

### To Suspend Email
```typescript
// In supabase/functions/send-email/index.ts
// Return early with: return successResponse({ sent: false, reason: 'suspended' });
```

---

## 🔔 PUSH NOTIFICATIONS

### Edge Functions
```
manage-push    → Register/unregister push subscriptions
send-push      → Send push notification to user
broadcast-push → Send push to all users
```

### Database Tables
```
push_config       → VAPID keys for web push
push_subscriptions → User device subscriptions
push_logs         → Notification delivery logs
```

### To Suspend Push Notifications
```typescript
// In supabase/functions/send-push/index.ts
// Return early with: return successResponse({ sent: false, reason: 'suspended' });
```

---

## 💰 PAYMENT SYSTEM

### Edge Functions
```
create-razorpay-order  → Create Razorpay payment order
verify-razorpay-payment → Verify Razorpay payment
create-topup           → Create wallet top-up
verify-topup           → Verify wallet top-up
```

### Required Secrets
```
RAZORPAY_KEY_ID     → Razorpay API key ID
RAZORPAY_KEY_SECRET → Razorpay API secret
```

### Database Functions (Atomic Operations)
```sql
purchase_ai_account()     → Buy AI account with wallet
purchase_seller_product() → Buy seller product with wallet
purchase_pro_plan()       → Upgrade to Pro with wallet
approve_seller_delivery() → Complete order, release funds
```

---

## 📡 REALTIME SUBSCRIPTIONS

### Active Channels
| Channel | Table | Used In |
|---------|-------|---------|
| `seller-orders` | seller_orders | SellerContext |
| `seller-wallet` | seller_wallets | SellerContext |
| `seller-products` | seller_products | SellerContext |
| `seller-withdrawals` | seller_withdrawals | SellerContext |
| `buyer-orders` | seller_orders | BuyerOrders |

### To Suspend Realtime
```typescript
// In src/contexts/SellerContext.tsx - Lines 207-269
// Comment out all supabase.channel(...) blocks

// OR globally in supabase/config.toml:
// [realtime]
// enabled = false
```

---

## 🔄 ALL EDGE FUNCTIONS

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `admin-fetch-data` | Admin data fetching | Admin session |
| `admin-login` | Admin login | No |
| `admin-mutate-data` | Admin mutations | Admin session |
| `admin-validate-session` | Validate admin session | Admin token |
| `bff-buyer-dashboard` | Buyer dashboard data | JWT |
| `bff-buyer-wallet` | Buyer wallet data | JWT |
| `bff-marketplace-home` | Marketplace homepage | No |
| `bff-marketplace-search` | Search with suggestions | No |
| `bff-seller-dashboard` | Seller dashboard data | JWT |
| `broadcast-push` | Send push to all | Admin |
| `create-razorpay-order` | Create payment | JWT |
| `create-topup` | Create wallet topup | JWT |
| `email-health` | Check email config | No |
| `export-user-data` | Export user data (GDPR) | JWT |
| `image-search` | Search by image | No |
| `manage-push` | Push subscription CRUD | JWT |
| `send-buyer-withdrawal-otp` | Buyer withdrawal OTP | JWT |
| `send-email` | Send email | Service role |
| `send-push` | Send push notification | Service role |
| `send-user-otp` | Profile change OTP | JWT |
| `send-withdrawal-otp` | Seller withdrawal OTP | JWT |
| `validate-session` | Validate JWT | JWT |
| `verify-buyer-withdrawal-otp` | Verify buyer OTP | JWT |
| `verify-razorpay-payment` | Verify payment | JWT |
| `verify-topup` | Verify topup | JWT |
| `verify-user-otp` | Verify profile OTP | JWT |
| `verify-withdrawal-otp` | Verify seller OTP | JWT |

---

## 🚨 KNOWN ISSUES & FIXES NEEDED

### Issue 1: Random Logouts
**Cause:** Client-side session checks fail on network issues
**Location:** `src/components/auth/ProtectedRoute.tsx`
**Fix:** Use optimistic rendering - show page immediately if localStorage has session

### Issue 2: Data Loads Late/Fails
**Cause:** Sequential API calls, aggressive timeouts
**Location:** `src/lib/api-fetch.ts`, component `useEffect` hooks
**Fix:** Pre-fetch data on login, increase timeouts, add retry logic

### Issue 3: Seller Page Shows Login Form
**Cause:** `if (!isAuthenticated)` check runs before auth state loads
**Location:** `src/pages/Seller.tsx:663`
**Fix:** Add `!authLoading` condition to prevent premature redirect

### Issue 4: 12-Hour Window Not Working
**Cause:** Client-side timestamp can be cleared by browser
**Location:** `src/lib/session-persistence.ts`
**Fix:** Store timestamp server-side in user metadata

---

## 🔧 HOW TO SUSPEND FEATURES

### Suspend All Server Connections
```typescript
// Create src/lib/offline-mode.ts
export const OFFLINE_MODE = true;

// In api-fetch.ts, check before any call:
if (OFFLINE_MODE) {
  return { data: MOCK_DATA, error: null, status: 200, isUnauthorized: false };
}
```

### Suspend Specific Edge Function
```typescript
// In supabase/functions/[function-name]/index.ts
// Add at the top of serve():
return new Response(
  JSON.stringify({ suspended: true, message: 'Feature temporarily disabled' }),
  { status: 503, headers: corsHeaders }
);
```

### Suspend Database Writes
```sql
-- Create read-only policy on table
ALTER TABLE public.table_name SET (allow_modifications = false);
```

### Suspend Realtime
```typescript
// In any component with subscriptions:
const REALTIME_ENABLED = false;

useEffect(() => {
  if (!REALTIME_ENABLED) return;
  // ... subscription code
}, []);
```

---

## 📈 SCALING RECOMMENDATIONS

### For 1M+ Users
1. **Database Indexes** - Add indexes to frequently queried columns
2. **Edge Caching** - Add Cache-Control headers to BFF responses
3. **Connection Pooling** - Enable pgBouncer in Supabase
4. **CDN** - Use Cloudflare for static assets
5. **Rate Limiting** - Add rate limits to all edge functions

### Current Performance Optimizations
- BFF pattern reduces client-side queries
- React Query caching (5 min staleTime)
- Lazy loading for heavy pages
- Skeleton loaders for perceived performance
- Realtime for instant updates

---

*Last Updated: January 2026*
*Project: PromptHero Marketplace*
