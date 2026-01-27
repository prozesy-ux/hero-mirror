

# Complete Email System Analysis & Automation Implementation Plan

## Current State Summary

### What's Already Working (OTP Emails Only)

| Edge Function | Email Type | Status |
|--------------|------------|--------|
| `send-withdrawal-otp` | Seller withdrawal verification OTP | ✅ Working |
| `send-buyer-withdrawal-otp` | Buyer withdrawal verification OTP | ✅ Working |
| `send-email` | Generic email sender (via Resend) | ✅ Working |
| `email-health` | Health check for Resend API | ✅ Working |

### What's NOT Working (Missing Automatic Triggers)

**Critical Finding: The email templates exist, the send-email function works, but NOBODY IS CALLING IT for transactional events!**

The helper functions in `src/lib/email-sender.ts` are defined but **never imported or used** anywhere:
- `sendOrderConfirmationEmail()` - DEFINED but NOT CALLED
- `sendSellerOrderNotification()` - DEFINED but NOT CALLED
- `sendWalletTopupEmail()` - DEFINED but NOT CALLED

---

## Complete Email Trigger Map

### Current Implementation Status

| Event | Template ID | Buyer Email | Seller Email | Current Status |
|-------|-------------|-------------|--------------|----------------|
| **ORDER FLOW** |
| Order placed by buyer | `order_placed` | Should receive | - | ❌ NOT IMPLEMENTED |
| New order received | `seller_new_order` | - | Should receive | ❌ NOT IMPLEMENTED |
| Order delivered | `order_delivered` | Should receive | - | ❌ NOT IMPLEMENTED |
| Order approved | `order_approved` | - | Should receive | ❌ NOT IMPLEMENTED |
| **WALLET FLOW** |
| Wallet top-up success | `wallet_topup` | Should receive | - | ❌ NOT IMPLEMENTED |
| Low balance alert | `low_balance_alert` | Should receive | - | ❌ NOT IMPLEMENTED |
| Refund processed | `refund_processed` | Should receive | - | ❌ NOT IMPLEMENTED |
| **WITHDRAWAL FLOW** |
| Withdrawal OTP | Custom inline HTML | ✅ Working | ✅ Working | ✅ WORKING |
| Withdrawal approved | `withdrawal_success` | Should receive | Should receive | ❌ NOT IMPLEMENTED (template missing) |
| Withdrawal rejected | - | Should receive | Should receive | ❌ NOT IMPLEMENTED |
| **SECURITY FLOW** |
| Password reset | `password_reset` | Should be Supabase auth | - | Supabase handles |
| Email confirmation | `email_confirmation` | Should be Supabase auth | - | Supabase handles |
| New login detected | `new_login_detected` | Should receive | - | ❌ NOT IMPLEMENTED |
| **MARKETING FLOW** |
| Welcome email | `welcome_email` | Should receive on signup | - | ❌ NOT IMPLEMENTED |
| Pro upgrade | `pro_upgrade` | Should receive | - | ❌ NOT IMPLEMENTED |

---

## Where to Add Automatic Email Triggers

### Location 1: Purchase Flow (AIAccountsSection.tsx)

**Current code (lines 612-631):**
```typescript
// 5. Create notification for buyer
await supabase.from('notifications').insert({...});

// 6. Create notification for seller
await supabase.from('seller_notifications').insert({...});
```

**Missing:** Email sending after notifications!

**Should add:**
```typescript
// 7. Send order confirmation email to buyer
await sendOrderConfirmationEmail(user.email, {
  orderId: orderId,
  productName: product.name,
  amount: product.price.toString(),
  sellerName: product.seller_profiles?.store_name || 'Seller'
});

// 8. Send new order notification to seller
const sellerEmail = await getSellerEmail(product.seller_id);
await sendSellerOrderNotification(sellerEmail, {...});
```

### Location 2: Order Delivery (SellerOrders.tsx)

**Current code (lines 167-174):**
```typescript
await supabase.from('notifications').insert({
  user_id: order.buyer_id,
  type: 'delivery',
  ...
});
```

**Missing:** Email to buyer when order is delivered!

**Should add:**
```typescript
// Send delivery email to buyer
await sendEmail({
  templateId: 'order_delivered',
  to: buyerEmail,
  variables: { order_id: orderId, product_name: productName }
});
```

### Location 3: Order Approval (AIAccountsSection.tsx - handleApproveDelivery)

**Current code (lines 776-795):**
```typescript
await supabase.from('notifications').insert({...});
await supabase.from('seller_notifications').insert({...});
```

**Missing:** Email to seller when order is approved!

**Should add:**
```typescript
// Send payment released email to seller
await sendEmail({
  templateId: 'order_approved',
  to: sellerEmail,
  variables: { order_id, product_name, amount: sellerEarning }
});
```

### Location 4: Wallet Top-up (verify-topup Edge Function)

**Current code (lines 97-108):**
```typescript
await supabaseClient.from('wallet_transactions').insert({...});
```

**Missing:** Email confirmation after successful top-up!

**Should add server-side email call in Edge Function:**
```typescript
// Send wallet top-up email via internal call
await sendWalletTopupEmailFromEdge(userEmail, amount, newBalance, session_id);
```

### Location 5: Withdrawal Processing (UnifiedResellersManagement.tsx)

**Current code (lines 378-396):**
```typescript
const handleProcessWithdrawal = async (status: 'completed' | 'rejected') => {
  const result = await mutateData('seller_withdrawals', 'update', {...});
  if (result.success) {
    toast.success(`Withdrawal ${status}`);
  }
};
```

**Missing:** Email to seller/buyer when withdrawal is processed!

### Location 6: User Signup (AuthContext.tsx or handle_new_user trigger)

**Missing:** Welcome email on new user registration!

---

## Implementation Strategy

### Option A: Frontend-Triggered Emails (Simpler)

Add email calls directly after successful database operations in React components.

**Pros:**
- Quick to implement
- Uses existing `sendEmail()` helper
- No new edge functions needed

**Cons:**
- If user closes browser before email sends, email is lost
- Can be bypassed (less reliable)
- Adds latency to user actions

### Option B: Server-Side Triggered Emails (Recommended)

Move email sending to Edge Functions or database triggers.

**Pros:**
- Guaranteed delivery
- Cannot be bypassed
- Atomic with database operations
- Better for transactional emails

**Cons:**
- Requires modifying edge functions
- More complex implementation

### Recommended Hybrid Approach

1. **Edge Functions** for critical emails:
   - Wallet top-up confirmation (in `verify-topup`)
   - Withdrawal processed (new edge function or in admin-mutate-data)
   
2. **Frontend** for order flow emails:
   - Order placed (in purchase functions)
   - Order delivered (in SellerOrders)
   - Order approved (in handleApproveDelivery)

3. **Database Trigger** for signup:
   - Welcome email (new trigger on profiles insert)

---

## Files to Modify

### Part 1: Add Order Flow Emails (Frontend)

| File | Changes |
|------|---------|
| `src/components/dashboard/AIAccountsSection.tsx` | Import `sendOrderConfirmationEmail`, `sendSellerOrderNotification` and call after purchase + call `order_approved` email after approval |
| `src/components/seller/SellerOrders.tsx` | Import `sendEmail` and call `order_delivered` template after delivery |

### Part 2: Add Wallet Emails (Edge Functions)

| File | Changes |
|------|---------|
| `supabase/functions/verify-topup/index.ts` | Add email sending after wallet credit |
| `supabase/functions/verify-razorpay-payment/index.ts` | Add email sending after wallet credit |

### Part 3: Add Withdrawal Emails (Edge Functions)

| File | Changes |
|------|---------|
| `supabase/functions/verify-withdrawal-otp/index.ts` | Add "withdrawal submitted" email |
| `supabase/functions/verify-buyer-withdrawal-otp/index.ts` | Add "withdrawal submitted" email |
| Create new: `supabase/functions/process-withdrawal/index.ts` | Handle admin approval/rejection with email |

### Part 4: Add Missing Templates

| Template | Purpose |
|----------|---------|
| `withdrawal_submitted` | Confirmation when withdrawal request is created |
| `withdrawal_approved` | When admin approves withdrawal |
| `withdrawal_rejected` | When admin rejects withdrawal |

### Part 5: Add Welcome Email

| Method | Implementation |
|--------|---------------|
| Option 1: Database Trigger | Create trigger on `profiles` insert that calls Edge Function |
| Option 2: Auth Hook | Use Supabase Auth hook for new user signup |

---

## Technical Details

### Helper Functions Already Available

```typescript
// src/lib/email-sender.ts

// Generic sender
sendEmail({ templateId, to, variables, userId })

// Pre-built helpers
sendOrderConfirmationEmail(buyerEmail, { orderId, productName, amount, sellerName })
sendSellerOrderNotification(sellerEmail, { orderId, productName, amount, buyerName })
sendWalletTopupEmail(userEmail, { amount, newBalance, transactionId })
```

### Server-Side Email Sending Pattern

For Edge Functions, make HTTP call to `send-email` function:

```typescript
// Inside any Edge Function
const sendEmailFromEdge = async (templateId, to, subject, html) => {
  await fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`
    },
    body: JSON.stringify({ template_id, to, subject, html })
  });
};
```

---

## Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | Order placed → Buyer email | Low | High |
| 2 | Order placed → Seller email | Low | High |
| 3 | Order delivered → Buyer email | Low | High |
| 4 | Order approved → Seller email | Low | High |
| 5 | Wallet top-up → Email | Medium | Medium |
| 6 | Withdrawal processed → Email | Medium | Medium |
| 7 | Welcome email on signup | Medium | Medium |
| 8 | New login detection email | High | Low |

---

## Summary

**Root Cause:** The email infrastructure is complete (templates + send function + Resend API), but the transactional triggers are missing. The system only sends OTP emails because those are explicitly coded in the withdrawal edge functions.

**Solution:** Add `sendEmail()` calls at each transaction point:
1. After purchase in `AIAccountsSection.tsx`
2. After delivery in `SellerOrders.tsx`
3. After approval in `handleApproveDelivery`
4. After top-up in `verify-topup` edge function
5. After withdrawal processing in admin panel

