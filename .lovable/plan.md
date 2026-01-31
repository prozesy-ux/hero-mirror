

# Guest Checkout with Auto Account Creation

## Overview

When a guest purchases a product on `/marketplace`, they will:
1. Enter their email in the checkout modal
2. Complete payment via Stripe
3. After payment success, automatically get an account created with their email
4. Be redirected to the dashboard where they can see their purchase

This follows the Gumroad model where the checkout email becomes the user account.

## Current State

| Component | Status | Notes |
|-----------|--------|-------|
| `GuestCheckoutModal` | Exists | Collects email and redirects to payment |
| `create-guest-checkout` edge function | Missing | Referenced in code but doesn't exist |
| `verify-guest-payment` edge function | Missing | Needs to create account and order |
| `seller_orders.guest_email` column | Exists | Can store guest email for orders |
| Success redirect handling | Missing | No page to handle guest payment success |

## User Flow

```text
User Journey:
1. Guest browses /marketplace
   → Clicks "Buy" on a product

2. GuestCheckoutModal opens
   → User enters email: "user@example.com"
   → Clicks "Continue to Payment"

3. Edge Function: create-guest-checkout
   → Creates Stripe Checkout session
   → Stores: productId, email, price, sellerId in session metadata
   → Returns Stripe checkout URL

4. User pays on Stripe Checkout
   → Stripe redirects to: /marketplace?purchase=success&session_id={ID}

5. Marketplace.tsx detects success params
   → Calls verify-guest-payment edge function

6. Edge Function: verify-guest-payment
   → Verifies Stripe session is paid
   → Checks if account exists with email:
      - If YES: Use existing account
      - If NO: Create account with random password
   → Creates seller_order with buyer_id
   → Credits seller pending balance
   → Returns: { success, userId, orderId, isNewUser, tempPassword? }

7. Frontend handles response:
   → If new user: Auto sign in and redirect to dashboard
   → Shows toast: "Account created! Check email for password"
   → Navigates to /dashboard/marketplace?tab=purchases
```

## Implementation Plan

### 1. Create Edge Function: `create-guest-checkout`

Creates a Stripe Checkout session for guest purchase.

**Location:** `supabase/functions/create-guest-checkout/index.ts`

**Logic:**
- Accept: `productId`, `productName`, `price`, `guestEmail`, `productType`, `sellerId`
- Look up seller_id from product if not provided
- Create Stripe Checkout session with:
  - `customer_email`: guest's email
  - `mode: "payment"`
  - `success_url`: `/marketplace?purchase=success&session_id={CHECKOUT_SESSION_ID}`
  - `cancel_url`: `/marketplace?purchase=cancelled`
  - Metadata: all product and guest info for verification

### 2. Create Edge Function: `verify-guest-payment`

Verifies payment and creates user account + order.

**Location:** `supabase/functions/verify-guest-payment/index.ts`

**Logic:**
1. Retrieve Stripe session by `session_id`
2. Verify `payment_status === 'paid'`
3. Extract metadata: email, productId, sellerId, price
4. Check for existing user by email:
   ```typescript
   const { data: existingUser } = await adminClient.auth.admin.getUserByEmail(email);
   ```
5. If no user exists, create one:
   ```typescript
   const tempPassword = crypto.randomUUID().slice(0, 12);
   const { data: newUser } = await adminClient.auth.admin.createUser({
     email,
     password: tempPassword,
     email_confirm: true, // Auto-confirm since they verified via payment
   });
   ```
6. Create `seller_order` record with `buyer_id`
7. Add to seller's pending balance
8. Send welcome email with temp password (if new user)
9. Send order confirmation email
10. Return `{ userId, orderId, isNewUser, accessToken? }`

### 3. Update `Marketplace.tsx` - Handle Payment Success

Add URL parameter detection and verification flow.

**Changes:**
- Detect `?purchase=success&session_id=...` in URL
- Call `verify-guest-payment` edge function
- If new user, sign them in automatically
- Navigate to `/dashboard/marketplace?tab=purchases`
- Show appropriate toast messages

**Code pattern (similar to BillingSection):**
```typescript
useEffect(() => {
  const purchaseStatus = searchParams.get('purchase');
  const sessionId = searchParams.get('session_id');
  
  if (purchaseStatus === 'success' && sessionId) {
    verifyGuestPurchase(sessionId);
  }
}, [searchParams]);

const verifyGuestPurchase = async (sessionId: string) => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-guest-payment`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ... },
      body: JSON.stringify({ session_id: sessionId })
    }
  );
  
  const data = await response.json();
  
  if (data.success) {
    if (data.isNewUser && data.session) {
      // Auto sign in the new user
      await supabase.auth.setSession(data.session);
    }
    toast.success('Purchase complete! Check your email for order details.');
    navigate('/dashboard/marketplace?tab=purchases');
  }
};
```

### 4. Update `supabase/config.toml` - Configure New Functions

Add JWT verification disabled for guest checkout:
```toml
[functions.create-guest-checkout]
verify_jwt = false

[functions.verify-guest-payment]
verify_jwt = false
```

## Database Changes

**None required!** The `seller_orders` table already has:
- `buyer_id` (UUID) - will be the auto-created user ID
- `guest_email` (string) - can store original email for reference
- All necessary columns for order tracking

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/create-guest-checkout/index.ts` | Create Stripe session for guest |
| `supabase/functions/verify-guest-payment/index.ts` | Verify payment, create user, create order |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add function configs |
| `src/pages/Marketplace.tsx` | Add payment success detection and verification |

## Security Considerations

| Risk | Mitigation |
|------|------------|
| Session hijacking | Verify session was just paid, use email from Stripe (not user input) |
| Duplicate orders | Check if session already processed (idempotency) |
| Account takeover | Email used in Stripe Checkout is trusted (Stripe handles validation) |
| Password exposure | Temp password sent only via email, user prompted to change |

## Email Templates Needed

1. **Welcome + Order Confirmation (New User)**
   - Subject: "Welcome! Your order is confirmed"
   - Body: Temp password, order details, next steps

2. **Order Confirmation (Existing User)**
   - Subject: "Order confirmed - {product name}"
   - Body: Order details, login prompt

## Summary

| Step | Component | Action |
|------|-----------|--------|
| 1 | `create-guest-checkout` | Creates Stripe session with product + email metadata |
| 2 | Stripe Checkout | User pays, redirects to `/marketplace?purchase=success` |
| 3 | `Marketplace.tsx` | Detects success, calls verify function |
| 4 | `verify-guest-payment` | Creates user if needed, creates order, returns session |
| 5 | `Marketplace.tsx` | Signs in user, redirects to dashboard |
| 6 | Dashboard | Shows purchase in orders tab |

