
# Comprehensive Dashboard Updates Plan

## Summary of Requested Changes

Based on your message, you need the following updates across Buyer Dashboard, Seller Dashboard, and Admin Panel:

---

## 1. Buyer Dashboard - Left Panel Enhancements

### Current State
The sidebar (`DashboardSidebar.tsx`) has 9 navigation items: Prompts, Marketplace, My Orders, Wishlist, Analytics, Wallet, Notifications, Support, Profile.

### Changes Needed
Add additional sections like:
- **Dashboard** (Home/Overview page)
- **Reports** (Purchase history reports)

### Files to Modify
- `src/components/dashboard/DashboardSidebar.tsx` - Add new nav items
- `src/components/dashboard/MobileNavigation.tsx` - Add mobile menu items
- `src/pages/Dashboard.tsx` - Add routes for new pages
- Create `src/components/dashboard/BuyerDashboardHome.tsx` - Dashboard overview
- Create `src/components/dashboard/BuyerReports.tsx` - Reports section

---

## 2. Buyer Wallet - Withdraw Function (Same as Seller)

### Current State
`BuyerWallet.tsx` has basic withdraw functionality but differs from the premium seller wallet design.

### Changes Needed
- **Add Accounts Tab** - Let buyers save payment accounts (like sellers)
- **Add OTP Verification** - If 2FA enabled, verify before withdrawal
- **Premium UI** - Match seller wallet's violet/purple gradient theme
- **Saved Accounts System** - Bank/UPI/bKash/Crypto support per country

### Database Changes Needed
Create `buyer_payment_accounts` table (similar to `seller_payment_accounts`)

### Files to Modify/Create
- `src/components/dashboard/BuyerWallet.tsx` - Complete redesign with tabs, accounts, OTP
- Edge functions: `send-buyer-withdrawal-otp`, `verify-buyer-withdrawal-otp`

---

## 3. Admin Panel - Unified Withdrawals Section

### Current State
- Seller withdrawals managed in `SellerWithdrawalsAdmin.tsx` (accessed via resellers menu)
- Buyer withdrawals table exists (`buyer_withdrawals`) but no admin UI

### Changes Needed
- Move **all withdrawals** to Wallet section
- Add **Buyer Withdrawals** tab in `WalletManagement.tsx`
- Add **Seller Withdrawals** tab in `WalletManagement.tsx`
- Show clear indicator of **who is withdrawing** (Buyer vs Seller badge)

### Files to Modify
- `src/components/admin/WalletManagement.tsx` - Add buyer/seller withdrawal tabs
- `src/pages/Admin.tsx` - Remove separate seller-withdrawals route
- `src/components/admin/AdminSidebar.tsx` - Remove seller withdrawals from resellers menu
- Add `buyer_withdrawals` to admin-fetch-data whitelist

---

## 4. Currency Settings - Both Dashboards

### Current State
- Seller Dashboard: Currency selector in `SellerTopBar.tsx` with exchange rate display
- Buyer Dashboard: No currency selector

### Changes Needed
**Buyer Dashboard:**
- Add currency selector (same as seller)
- Country-based default currency detection
- Show rate only in wallet section, not header

**Seller Dashboard:**
- Remove rate display from header
- Show rate only in wallet section

### Files to Modify
- `src/components/dashboard/DashboardTopBar.tsx` - Add currency selector (minimal variant)
- `src/components/dashboard/BuyerWallet.tsx` - Show current exchange rate
- `src/components/seller/SellerTopBar.tsx` - Verify rate not shown (already minimal)
- `src/pages/Dashboard.tsx` - Wrap with CurrencyProvider
- Create/update currency context to support buyer country detection

---

## 5. Seller Dashboard Analytics - Real Data

### Current State
`SellerAnalytics.tsx` uses some simulated/mock data:
- `buyerMessages` - Random value
- `pageViews`, `visitors`, `clicks` - Simulated values
- `avgRating` - Hardcoded 4.2

### Changes Needed
Replace simulated metrics with real database queries:
- **Buyer Messages**: Count from `seller_chats` table
- **Page Views/Visitors**: Track in database or remove if not available
- Performance data shows **best sellers algorithm** based on:
  - Total sales amount
  - Order completion rate
  - Trust score
  - Response time

### Files to Modify
- `src/components/seller/SellerAnalytics.tsx` - Replace mock data with real queries
- `src/components/seller/SellerDashboard.tsx` - Update quick stats
- `src/components/seller/SellerPerformance.tsx` - Already uses real data (good)

---

## 6. Fixed Chat Box Positions

### Current State
`FloatingChatWidget.tsx` positions chat boxes at `bottom-20 lg:bottom-6 right-4`

### Issue
- May overlap with mobile navigation
- Position might shift based on content

### Changes Needed
- Ensure chat boxes have **fixed, consistent positioning**
- Account for mobile bottom nav height (80px)
- Prevent overlap with other floating elements

### Files to Modify
- `src/components/dashboard/FloatingChatWidget.tsx` - Fix z-index and positioning
- Review `FloatingChatBox.tsx` and `FloatingSupportChatBox.tsx` dimensions

---

## Technical Implementation Details

### Database Migration
```sql
-- Create buyer payment accounts table
CREATE TABLE buyer_payment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  payment_method_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  country TEXT,
  account_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE buyer_payment_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage own accounts" ON buyer_payment_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all" ON buyer_payment_accounts
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
```

### Edge Function Whitelist Updates
Add to `admin-fetch-data/index.ts` and `admin-mutate-data/index.ts`:
- `buyer_payment_accounts`
- `buyer_withdrawals` (already exists, ensure whitelisted)

### Currency Context Updates
- Wrap Dashboard.tsx with CurrencyProvider
- Detect buyer country from profile or IP
- Use same exchange rates from `payment_methods` table

---

## Files Summary

### New Files to Create
1. `src/components/dashboard/BuyerDashboardHome.tsx`
2. `src/components/dashboard/BuyerReports.tsx`
3. `supabase/functions/send-buyer-withdrawal-otp/index.ts`
4. `supabase/functions/verify-buyer-withdrawal-otp/index.ts`

### Files to Modify
1. `src/components/dashboard/DashboardSidebar.tsx`
2. `src/components/dashboard/MobileNavigation.tsx`
3. `src/pages/Dashboard.tsx`
4. `src/components/dashboard/BuyerWallet.tsx` (major redesign)
5. `src/components/dashboard/DashboardTopBar.tsx`
6. `src/components/admin/WalletManagement.tsx` (add withdrawal tabs)
7. `src/components/admin/AdminSidebar.tsx`
8. `src/pages/Admin.tsx`
9. `src/components/seller/SellerAnalytics.tsx`
10. `src/components/seller/SellerDashboard.tsx`
11. `src/components/dashboard/FloatingChatWidget.tsx`
12. `supabase/functions/admin-fetch-data/index.ts`
13. `supabase/functions/admin-mutate-data/index.ts`

---

## Priority Order

1. **Currency System** - Add to buyer dashboard, show rates in wallet only
2. **Buyer Wallet Redesign** - Premium UI with accounts and OTP
3. **Admin Wallet Unification** - Combine buyer/seller withdrawals
4. **Buyer Dashboard Navigation** - Add Dashboard Home and Reports
5. **Seller Analytics Real Data** - Replace mock values
6. **Chat Box Positioning** - Fix floating widget positions
