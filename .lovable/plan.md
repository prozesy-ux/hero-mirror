

# Fix Hover Preview Buttons and Navigation in Marketplace

## Problem Summary

Currently in the `ProductHoverCard` hover preview:
1. The Buy button shows "Top Up & Buy" when user has insufficient balance - should always show "BUY NOW"
2. There's no "Full View" button to see the complete product page
3. When clicking Buy, it redirects to the store page (`/store/{slug}`) instead of staying in marketplace context
4. Navigation should use the marketplace full view URL `/marketplace/:productSlug`

## Solution

### Changes to ProductHoverCard.tsx

**1. Change Buy Button Text**
- Remove the conditional "Top Up & Buy" text
- Always display "BUY NOW"
- Keep the ShoppingCart icon

**2. Add "Full View" Button**
- Add a new button below Buy and Chat buttons
- Design: Outlined style with Eye icon, text "Full View"
- On click: Navigate to `/marketplace/{slugified-product-name}`

**3. Update onBuy Handler (in Marketplace.tsx)**
- Currently: Redirects to store page
- Change: Open guest checkout modal for guests, or handle purchase within marketplace

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/marketplace/ProductHoverCard.tsx` | Change button text to "BUY NOW", add "Full View" button with navigation to `/marketplace/{slug}` |
| `src/pages/Marketplace.tsx` | Update `handleHoverBuy` to handle purchase directly instead of redirecting to store |

### Visual Design for Buttons

```text
+----------------------------------+
|  [$] BUY NOW         (Black bg)  |  <- Primary action
+----------------------------------+
|  [Eye] Full View     (Outlined)  |  <- Navigate to full view
+----------------------------------+
|  [Chat] Chat         (Outlined)  |  <- Chat with seller
+----------------------------------+
```

### Button Behavior Matrix

| Button | Logged In User | Guest User |
|--------|---------------|------------|
| BUY NOW | Open guest checkout / handle purchase | Open GuestPaymentModal |
| Full View | Navigate to `/marketplace/{slug}` | Navigate to `/marketplace/{slug}` |
| Chat | Open chat with seller | Redirect to sign in |

### Technical Implementation

**ProductHoverCard.tsx - Button Changes:**
```typescript
// Line 278 - Change "Top Up & Buy" to "BUY NOW"
{isAuthenticated && !hasEnoughBalance ? 'BUY NOW' : 'BUY NOW'}
// Simplify to just:
'BUY NOW'

// Add Full View button after Chat button (around line 290)
<Button
  onClick={(e) => { 
    e.stopPropagation(); 
    navigate(`/marketplace/${slugify(product.name)}`);
  }}
  variant="outline"
  className="w-full h-10 rounded-lg border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors mb-3 text-sm"
>
  <Eye className="w-4 h-4 mr-2" />
  Full View
</Button>
```

**Marketplace.tsx - Update handleHoverBuy:**
```typescript
// Change from redirecting to store to opening guest checkout
const handleHoverBuy = useCallback((product: Product) => {
  if (user) {
    // For logged in users, navigate to marketplace full view to complete purchase
    const slug = slugify(product.name);
    navigate(`/marketplace/${slug}`);
  } else {
    // For guests, open the guest payment modal
    setGuestCheckoutProduct(product);
  }
}, [user, navigate]);
```

### Expected Result

1. Hovering any product card shows preview with:
   - "BUY NOW" button (always, no "Top Up" text)
   - "Full View" button → navigates to `/marketplace/{product-slug}`
   - "Chat" button → opens chat or prompts sign in

2. Clicking Buy button:
   - Guest → Opens guest checkout modal
   - Logged in → Navigates to marketplace full view

3. Clicking Full View button:
   - Both → Navigates to `/marketplace/{product-slug}` with full product details

