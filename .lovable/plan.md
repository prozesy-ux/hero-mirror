

# Comprehensive Payment Model Design for Guest Checkout

## Executive Summary

After deep research into your codebase, I'll design a complete payment flow for `/marketplace` that:
1. Shows ALL available payment methods to guest users (Stripe, Razorpay, bKash, etc.)
2. Collects email during checkout
3. After successful payment, auto-creates account and redirects to dashboard
4. Works seamlessly whether user has existing account or not

## Current State Analysis

### What Exists Now

| Component | Status | Gap |
|-----------|--------|-----|
| `GuestCheckoutModal` | Exists | Only collects email, then Stripe-only |
| `create-guest-checkout` | Exists | Only creates Stripe session |
| `verify-guest-payment` | Exists | Only verifies Stripe, creates account |
| `payment_methods` table | 6 methods | Not shown to guests |

### Available Payment Methods (from database)

| Code | Name | Type | Currency |
|------|------|------|----------|
| `stripe` | Stripe | Automatic | USD |
| `razorpay` | Razorpay | Automatic | INR |
| `bkash` | bKash | Manual | BDT |
| `nagad` | Nagad | Manual | BDT |
| `jazzcash` | JazzCash | Manual | PKR |
| `binance` | Binance (Crypto) | Manual | USD |

### Current Flow Issues

```text
Current Guest Flow (Limited):
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. Guest clicks "Buy" on /marketplace                                   │
│ 2. GuestCheckoutModal opens → Enter email only                          │
│ 3. Redirects to Stripe Checkout (only payment option)                   │
│ 4. After payment → verify-guest-payment → account created               │
│ 5. Auto-login → Redirect to /dashboard/marketplace?tab=purchases        │
└─────────────────────────────────────────────────────────────────────────┘

Problem: Guests can ONLY use Stripe. No bKash, Razorpay, UPI, etc.
```

### Logged-in User Flow (Complete)

```text
Logged-in User Flow (Full Options):
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. User browses /dashboard/marketplace OR /store/{slug}                 │
│ 2. Clicks "Buy" → Checks wallet balance                                 │
│ 3. If insufficient: Redirects to /dashboard/billing                     │
│ 4. Billing shows ALL payment methods (Stripe, Razorpay, bKash, etc.)    │
│ 5. User tops up wallet → Uses balance to buy                            │
│ 6. Purchase uses atomic RPC `purchase_seller_product`                   │
└─────────────────────────────────────────────────────────────────────────┘

Problem: Requires account AND wallet top-up before purchase.
```

## Proposed New Flow

### Guest Checkout with Full Payment Options

```text
New Guest Flow (Full Payment Options):
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. Guest browses /marketplace                                           │
│ 2. Clicks "Buy" on product                                              │
│ 3. NEW: GuestPaymentModal opens                                         │
│    ├── Shows product summary (name, price, image)                       │
│    ├── Email input field                                                │
│    └── Payment method tabs (like BillingSection):                       │
│        ├── Stripe (Automatic - Card)                                    │
│        ├── Razorpay (Automatic - UPI/Cards) ← NEW for guests           │
│        ├── bKash (Manual - QR/Send Money) ← NEW for guests             │
│        ├── Nagad (Manual) ← NEW for guests                             │
│        ├── JazzCash (Manual) ← NEW for guests                          │
│        └── Binance (Manual - Crypto) ← NEW for guests                  │
│                                                                         │
│ 4. User selects payment method + enters email                           │
│                                                                         │
│ 5a. AUTOMATIC (Stripe/Razorpay):                                        │
│     → Create checkout session with email                                │
│     → Redirect to payment gateway                                       │
│     → On success: verify → create account → create order → auto-login   │
│                                                                         │
│ 5b. MANUAL (bKash/Nagad/etc.):                                          │
│     → Show payment instructions + QR code                               │
│     → User enters transaction ID                                        │
│     → Create pending order + pending account                            │
│     → Admin approves → account activated → email with password          │
│     → User can login after admin approval                               │
│                                                                         │
│ 6. Auto-redirect to /dashboard/marketplace?tab=purchases                │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/marketplace/GuestPaymentModal.tsx` | New modal with full payment options |
| `supabase/functions/create-guest-razorpay/index.ts` | Razorpay order for guests |
| `supabase/functions/verify-guest-razorpay/index.ts` | Verify Razorpay + create account |
| `supabase/functions/create-guest-manual-order/index.ts` | Create pending order for manual payments |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Marketplace.tsx` | Replace `GuestCheckoutModal` with `GuestPaymentModal` |
| `src/components/marketplace/GuestCheckoutModal.tsx` | REPLACE with new multi-payment modal |
| `supabase/config.toml` | Add new edge function configs |

## Detailed Implementation

### 1. GuestPaymentModal Component

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 🛒 Complete Your Purchase                                           │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌───────────┐                                                           │
│ │  [Image]  │  Netflix Premium                                         │
│ │           │  by Premium Store                                        │
│ └───────────┘  $9.99                                                   │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 📧 Email (for delivery)                                              │ │
│ │ ┌─────────────────────────────────────────────────────────────────┐ │ │
│ │ │ you@example.com                                                 │ │ │
│ │ └─────────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Select Payment Method                                                │ │
│ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │ │
│ │ │ Stripe  │ │Razorpay │ │  bKash  │ │  Nagad  │ │ Binance │          │ │
│ │ │  ✓      │ │         │ │         │ │         │ │         │          │ │
│ │ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                  [ Pay $9.99 with Stripe ]                          │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ Already have an account? Sign in                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Edge Function: create-guest-razorpay

Creates Razorpay order for guest checkout:

**Input:**
```json
{
  "productId": "uuid",
  "productName": "Netflix Premium",
  "price": 9.99,
  "guestEmail": "user@example.com",
  "productType": "seller"
}
```

**Output:**
```json
{
  "order_id": "order_xyz",
  "key_id": "rzp_live_xxx",
  "amount": 90800,
  "currency": "INR",
  "guestToken": "encrypted_session_data"
}
```

### 3. Edge Function: verify-guest-razorpay

Verifies Razorpay payment and creates account:

**Input:**
```json
{
  "razorpay_order_id": "order_xyz",
  "razorpay_payment_id": "pay_abc",
  "razorpay_signature": "sig_123",
  "guestToken": "encrypted_session_data"
}
```

**Logic:**
1. Verify signature using secret
2. Decrypt guestToken to get email, productId, etc.
3. Check/create user account
4. Create seller_order
5. Generate auth session
6. Return session for auto-login

### 4. Edge Function: create-guest-manual-order

For manual payments (bKash, Nagad, etc.):

**Input:**
```json
{
  "productId": "uuid",
  "productName": "Netflix Premium",
  "price": 9.99,
  "guestEmail": "user@example.com",
  "productType": "seller",
  "paymentMethod": "bkash",
  "transactionId": "TXN123456"
}
```

**Logic:**
1. Create user with `email_confirmed: false`
2. Create `seller_order` with status `pending_payment`
3. Create `wallet_transaction` with status `pending`
4. Return order ID for tracking
5. Admin approves → triggers account activation email

### 5. Database Changes

Add new status for guest orders:

```sql
-- Add guest_payment_status to seller_orders
ALTER TABLE public.seller_orders 
ADD COLUMN IF NOT EXISTS payment_gateway TEXT,
ADD COLUMN IF NOT EXISTS gateway_transaction_id TEXT;

-- Create guest_pending_orders table for manual payments
CREATE TABLE IF NOT EXISTS public.guest_pending_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  product_id UUID NOT NULL,
  product_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  user_id UUID, -- Set when account is created
  order_id UUID -- Set when order is created
);

-- Index for admin lookups
CREATE INDEX idx_guest_pending_orders_status ON guest_pending_orders(status);
```

## User Experience Flows

### Flow A: Automatic Payment (Stripe/Razorpay)

```text
Time: 0s    Guest clicks "Buy"
Time: 1s    GuestPaymentModal opens
Time: 5s    Guest enters email + selects Stripe
Time: 6s    Click "Pay $9.99"
Time: 7s    Redirected to Stripe Checkout
Time: 30s   Completes payment
Time: 31s   Redirected to /marketplace?purchase=success
Time: 32s   verify-guest-payment runs
            → Creates account (temp password)
            → Creates order
            → Returns auth session
Time: 33s   Frontend: supabase.auth.setSession()
Time: 34s   Redirect to /dashboard/marketplace?tab=purchases
Time: 35s   User sees their purchase ✓
            Email received with password
```

### Flow B: Manual Payment (bKash/Nagad)

```text
Time: 0s    Guest clicks "Buy"
Time: 1s    GuestPaymentModal opens
Time: 5s    Guest enters email + selects bKash
Time: 6s    Modal shows bKash QR code + account number
Time: 30s   Guest sends money via bKash app
Time: 60s   Guest enters transaction ID in modal
Time: 61s   create-guest-manual-order runs
            → Creates pending record
            → Shows confirmation to user
Time: 62s   Toast: "Order submitted! You'll receive email once approved"
            Email: "Order pending approval"

--- Admin Action (minutes to hours later) ---

Admin sees pending order in admin panel
Admin verifies bKash payment
Admin clicks "Approve"
            → Creates user account
            → Creates seller_order
            → Sends password email

User receives email with password
User logs in to see purchase
```

## Security Considerations

| Risk | Mitigation |
|------|------------|
| Email spoofing | For auto-payments: email comes from Stripe/Razorpay (trusted) |
| Duplicate orders | Unique index on `stripe_session_id` and `gateway_transaction_id` |
| Manual payment fraud | Admin verification required before account creation |
| Token tampering | Encrypt guest session data with server-side secret |
| Rate limiting | Max 5 guest checkout attempts per email per hour |

## Admin Panel Updates

Add new section for guest order approvals:

```text
Admin Panel → Orders → Guest Pending

┌─────────────────────────────────────────────────────────────────────────┐
│ Pending Guest Orders                                          Filter ▼ │
├─────────────────────────────────────────────────────────────────────────┤
│ Email            │ Product      │ Amount │ Method │ TXN ID   │ Action  │
├──────────────────┼──────────────┼────────┼────────┼──────────┼─────────┤
│ user@gmail.com   │ Netflix Pre  │ ৳1209  │ bKash  │ TXN12345 │ [✓] [✗] │
│ test@example.com │ ChatGPT Pro  │ ৳605   │ Nagad  │ NAG98765 │ [✓] [✗] │
└─────────────────────────────────────────────────────────────────────────┘
```

## Summary

| Feature | Before | After |
|---------|--------|-------|
| Guest payment methods | Stripe only | All 6 methods |
| Email collection | Yes | Yes |
| Auto account creation | Stripe only | All automatic methods |
| Manual payment support | No | Yes (with admin approval) |
| Razorpay for guests | No | Yes |
| bKash/Nagad for guests | No | Yes |
| Dashboard redirect | Yes | Yes |
| Password email | Yes | Yes |

## Implementation Order

1. Create `GuestPaymentModal` component with multi-payment UI
2. Create `create-guest-razorpay` edge function
3. Create `verify-guest-razorpay` edge function
4. Create `create-guest-manual-order` edge function
5. Add database migration for new columns/table
6. Update `Marketplace.tsx` to use new modal
7. Add admin panel section for guest order approval
8. Test all payment flows end-to-end

