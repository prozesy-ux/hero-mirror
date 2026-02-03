
# Phase 2-4: Product Delivery System Integration

## Overview

This plan completes the product type-based delivery system by:
1. **Integrating delivery configuration UI** into the NewProduct.tsx form
2. **Connecting purchase flow** to call the `grant-product-access` edge function
3. **Creating service booking components** for Call, Commission, and Service products
4. **Adding bundle product selector** for bundle products

---

## Current State

| Component | Status |
|-----------|--------|
| Database tables (`product_content`, `course_lessons`, `buyer_content_access`, etc.) | Done |
| `seller_products` extended with delivery columns | Done |
| `grant-product-access` edge function | Done |
| `FileContentUploader.tsx` | Done |
| `LessonBuilder.tsx` | Done |
| `AvailabilityEditor.tsx` | Done |
| `BuyerLibrary.tsx` | Done |
| `CourseViewer.tsx` | Done |
| `DownloadManager.tsx` | Done |
| **NewProduct.tsx integration** | Not Done |
| **Purchase flow integration** | Not Done |
| **Service booking UI** | Not Done |

---

## Phase 2: Integrate Delivery Config into NewProduct.tsx

### Changes to `src/pages/NewProduct.tsx`

Add new state variables and conditional UI sections based on product type:

**New State Variables:**
```tsx
// Delivery content state
const [productFiles, setProductFiles] = useState<FileItem[]>([]);
const [lessons, setLessons] = useState<Lesson[]>([]);
const [availabilitySlots, setAvailabilitySlots] = useState<TimeSlot[]>([]);
const [callDuration, setCallDuration] = useState(30);
const [membershipPeriod, setMembershipPeriod] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
const [bundleProductIds, setBundleProductIds] = useState<string[]>([]);
const [thankYouMessage, setThankYouMessage] = useState('Thank you for your support!');
const [sellerProducts, setSellerProducts] = useState<{ id: string; name: string }[]>([]);
```

**New Sections in Step 2 (after Description):**

```text
Section Flow by Product Type:

INSTANT DOWNLOAD TYPES (digital_product, ebook, template, graphics, audio, video, software):
┌─────────────────────────────────────────────┐
│ PRODUCT FILES                               │
│ ─────────────────────────────────────────── │
│ <FileContentUploader                        │
│   files={productFiles}                      │
│   onChange={setProductFiles}                │
│   sellerId={profile.id}                     │
│   allowLinks={true}                         │
│ />                                          │
│                                             │
│ [ ] Allow streaming (for audio/video)       │
│ Max downloads: [input] (optional)           │
└─────────────────────────────────────────────┘

COURSE TYPE:
┌─────────────────────────────────────────────┐
│ COURSE LESSONS                              │
│ ─────────────────────────────────────────── │
│ <LessonBuilder                              │
│   lessons={lessons}                         │
│   onChange={setLessons}                     │
│   sellerId={profile.id}                     │
│ />                                          │
└─────────────────────────────────────────────┘

MEMBERSHIP TYPE:
┌─────────────────────────────────────────────┐
│ MEMBERSHIP SETTINGS                         │
│ ─────────────────────────────────────────── │
│ Billing Period:                             │
│ [Monthly] [Yearly] [Lifetime]               │
│                                             │
│ <FileContentUploader (for member content)   │
│   files={productFiles}                      │
│   onChange={setProductFiles}                │
│   ...                                       │
│ />                                          │
└─────────────────────────────────────────────┘

CALL TYPE:
┌─────────────────────────────────────────────┐
│ CALL SETTINGS                               │
│ ─────────────────────────────────────────── │
│ <AvailabilityEditor                         │
│   slots={availabilitySlots}                 │
│   onChange={setAvailabilitySlots}           │
│   duration={callDuration}                   │
│   onDurationChange={setCallDuration}        │
│ />                                          │
└─────────────────────────────────────────────┘

BUNDLE TYPE:
┌─────────────────────────────────────────────┐
│ BUNDLE CONTENTS                             │
│ ─────────────────────────────────────────── │
│ Select products to include:                 │
│ ☑ Product A ($10)                          │
│ ☑ Product B ($15)                          │
│ ☐ Product C ($20)                          │
│                                             │
│ Total value: $25 (2 products)               │
└─────────────────────────────────────────────┘

COFFEE (TIP) TYPE:
┌─────────────────────────────────────────────┐
│ THANK YOU MESSAGE                           │
│ ─────────────────────────────────────────── │
│ [textarea for custom thank you message]     │
│                                             │
│ Preview:                                    │
│ "Thank you for your support! ☕"            │
└─────────────────────────────────────────────┘

SERVICE/COMMISSION TYPE:
┌─────────────────────────────────────────────┐
│ SERVICE DETAILS                             │
│ ─────────────────────────────────────────── │
│ Delivery time: [input] days                 │
│ Requirements template: [textarea]           │
│                                             │
│ (For commission):                           │
│ ⚡ 50% deposit required upfront             │
│ ⚡ 50% due upon completion                  │
└─────────────────────────────────────────────┘
```

**Updated handleSubmit function:**

After product creation, save related content:
1. For instant downloads: Save files to `product_content` table
2. For courses: Save lessons to `course_lessons` table
3. Other settings saved directly in `seller_products` row

---

## Phase 3: Connect Purchase Flow to grant-product-access

### Changes to `src/pages/Store.tsx`

After successful `purchase_seller_product` RPC call, invoke the edge function:

```tsx
// In handleBuy function, after successful RPC
if (purchaseResult.success && purchaseResult.order_id) {
  // Grant product access based on product type
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/grant-product-access`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          order_id: purchaseResult.order_id,
          buyer_id: user.id,
          product_id: product.id,
          seller_id: product.seller_id
        })
      }
    );
    
    const accessResult = await response.json();
    
    // Update toast message based on access type
    if (accessResult.auto_completed) {
      toast.success('Purchase complete! Access your content in your Library.');
    } else if (accessResult.requires_scheduling) {
      toast.success('Purchase complete! Book your call in your Library.');
    } else {
      toast.success('Purchase successful! The seller will deliver your order soon.');
    }
  } catch (error) {
    console.error('Grant access error:', error);
    // Purchase still succeeded, just access grant failed
  }
}
```

### Changes to `src/components/dashboard/AIAccountsSection.tsx`

Same integration pattern for AI accounts purchase flow.

---

## Phase 4: Service Booking Components

### New Component: `src/components/dashboard/ServiceBookingView.tsx`

For buyers to view and manage their service bookings (calls, commissions):

```text
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Library                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📞 30-Minute Strategy Call                                  │ │
│ │ with John's Consulting                                       │ │
│ │                                                              │ │
│ │ Status: SCHEDULED                                            │ │
│ │ Date: Feb 10, 2026 at 2:00 PM (EST)                         │ │
│ │                                                              │ │
│ │ [Join Meeting]  [Reschedule]  [Cancel]                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🎨 Custom Logo Design (Commission)                          │ │
│ │ with DesignPro Studio                                        │ │
│ │                                                              │ │
│ │ Status: IN PROGRESS                                          │ │
│ │ Deposit: $50 (Paid ✓)                                       │ │
│ │ Remaining: $50                                               │ │
│ │                                                              │ │
│ │ Your Brief:                                                  │ │
│ │ "I need a modern logo for my tech startup..."               │ │
│ │                                                              │ │
│ │ [View Updates]  [Chat with Seller]                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### New Component: `src/components/dashboard/CallScheduler.tsx`

Modal/page for buyers to book a call slot:

```text
┌─────────────────────────────────────────────────────────────────┐
│ Book Your Call                                           [X]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 📅 Select a Date                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Calendar Picker showing available dates]                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ⏰ Select a Time (EST)                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [9:00 AM] [9:30 AM] [10:00 AM] [10:30 AM]                  │ │
│ │ [11:00 AM] [11:30 AM] [2:00 PM] [2:30 PM]                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│                                          [Book Call - 30 min]   │
└─────────────────────────────────────────────────────────────────┘
```

### New Component: `src/components/dashboard/CommissionBriefForm.tsx`

For buyers to submit their commission requirements:

```text
┌─────────────────────────────────────────────────────────────────┐
│ Submit Your Requirements                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Describe what you need:                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Rich text area for requirements]                           │ │
│ │                                                              │ │
│ │                                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Attach reference files (optional):                              │
│ [+ Add Files]                                                   │
│                                                                  │
│ Payment Summary:                                                 │
│ ─────────────────────────────────────────────────────────────── │
│ Total: $100                                                     │
│ Deposit (50%): $50 ← You pay now                               │
│ Final (50%): $50 ← Pay upon completion                         │
│                                                                  │
│                                    [Submit & Pay $50 Deposit]   │
└─────────────────────────────────────────────────────────────────┘
```

### New Component: `src/components/seller/SellerServiceManagement.tsx`

For sellers to manage their service bookings:

```text
Seller can:
- View pending calls and scheduled times
- Confirm/reschedule calls
- View commission briefs
- Upload deliverables for commissions
- Mark commissions as ready for final payment
- Complete orders after delivery
```

---

## File Changes Summary

### Files to Create:
1. `src/components/dashboard/ServiceBookingView.tsx` - Buyer view of service bookings
2. `src/components/dashboard/CallScheduler.tsx` - Call booking modal
3. `src/components/dashboard/CommissionBriefForm.tsx` - Commission requirements form
4. `src/components/seller/SellerServiceManagement.tsx` - Seller service management
5. `src/components/seller/BundleProductSelector.tsx` - Multi-select for bundles

### Files to Modify:
1. `src/pages/NewProduct.tsx` - Add delivery config UI sections
2. `src/pages/Store.tsx` - Connect to grant-product-access after purchase
3. `src/components/dashboard/AIAccountsSection.tsx` - Connect to grant-product-access
4. `src/pages/Dashboard.tsx` - Add routes for service booking views
5. `src/pages/Seller.tsx` - Add route for service management

---

## Implementation Order

1. **NewProduct.tsx Integration** - Add conditional delivery config sections
2. **BundleProductSelector.tsx** - Create bundle product picker
3. **Purchase Flow Integration** - Connect Store.tsx to grant-product-access
4. **ServiceBookingView.tsx** - Create buyer service booking view
5. **CallScheduler.tsx** - Create call scheduling UI
6. **CommissionBriefForm.tsx** - Create commission brief form
7. **SellerServiceManagement.tsx** - Create seller service management
8. **Route Updates** - Add all new routes

---

## Technical Notes

1. **Delivery Type Mapping**: The `delivery_type` column is auto-set based on `product_type`:
   - `digital_product`, `ebook`, `template`, etc. → `instant`
   - `course` → `course`
   - `membership` → `membership`
   - `call` → `call`
   - `commission` → `commission`
   - `service` → `manual`
   - `coffee` → `tip`

2. **Bundle Recursion**: The `grant-product-access` function already handles recursive bundle access granting.

3. **Call Scheduling**: Uses the `availability_slots` JSONB column to determine available times.

4. **Commission Flow**: 
   - Initial purchase = 50% deposit
   - Seller works
   - Seller uploads deliverables
   - Buyer approves
   - Buyer pays remaining 50%
   - Order completed

5. **File Storage**: All product files go to the private `product-files` bucket.
