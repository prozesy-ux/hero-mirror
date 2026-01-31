

# Add Floating Chat to Marketplace Page

## Problem

Currently, when a user clicks the "Chat with Seller" button on the `/marketplace` page:
- If logged in: Redirects to `/store/{storeSlug}?chat={productId}`
- If not logged in: Redirects to `/signin`

This is inconsistent with the Store page (`/store`) which opens a floating chat widget directly without navigation.

## Solution

Add `FloatingChatProvider` and `FloatingChatWidget` to the Marketplace page, and modify the chat handlers to use `openChat()` directly instead of redirecting.

## Current vs Target Behavior

| Action | Current Behavior | Target Behavior |
|--------|-----------------|-----------------|
| Click Chat (logged in) | Redirects to store page | Opens floating chat on marketplace |
| Click Chat (not logged in) | Redirects to sign-in | Redirects to sign-in, then restores chat on marketplace |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Marketplace.tsx` | Add FloatingChatProvider + FloatingChatWidget, update chat handlers |

## Implementation

### Step 1: Add Imports

```tsx
import { FloatingChatProvider, useFloatingChat } from '@/contexts/FloatingChatContext';
import FloatingChatWidget from '@/components/dashboard/FloatingChatWidget';
```

### Step 2: Split into Inner Component

Similar to how `Store.tsx` has `StoreContent` + `Store` wrapper, we need to:
1. Rename current `Marketplace` to `MarketplaceContent`
2. Create new `Marketplace` component that wraps with `FloatingChatProvider`
3. Use `useFloatingChat` hook inside `MarketplaceContent`

```tsx
// Inner component that uses FloatingChat context
const MarketplaceContent = () => {
  const { openChat } = useFloatingChat();
  // ... existing state and logic
};

// Main Marketplace component with providers
const Marketplace = () => {
  return (
    <CurrencyProvider>
      <FloatingChatProvider>
        <MarketplaceContent />
      </FloatingChatProvider>
    </CurrencyProvider>
  );
};
```

### Step 3: Update Chat Handler

**Current `handleChat` (redirects to store):**
```tsx
const handleChat = useCallback(() => {
  if (!quickViewProduct) return;

  if (user) {
    if (quickViewProduct.storeSlug) {
      navigate(`/store/${quickViewProduct.storeSlug}?chat=${quickViewProduct.id}`);
    }
  } else {
    toast.info('Please sign in to chat with sellers');
    navigate('/signin');
  }
  setQuickViewProduct(null);
}, [quickViewProduct, user, navigate]);
```

**New `handleChat` (opens floating chat):**
```tsx
const handleChat = useCallback(() => {
  if (!quickViewProduct) return;

  if (user) {
    // Need to fetch seller info for the chat
    openChatWithProduct(quickViewProduct);
  } else {
    // Save pending chat info for after sign-in
    localStorage.setItem('pendingChat', JSON.stringify({
      productId: quickViewProduct.id,
      productName: quickViewProduct.name,
      storeSlug: quickViewProduct.storeSlug,
      returnUrl: '/marketplace'
    }));
    toast.info('Please sign in to chat with sellers');
    navigate('/signin');
  }
  setQuickViewProduct(null);
}, [quickViewProduct, user, navigate, openChat]);
```

### Step 4: Add Helper to Fetch Seller Info and Open Chat

Since products in marketplace only have `storeSlug`, we need to fetch seller details:

```tsx
const openChatWithProduct = async (product: Product) => {
  if (!product.storeSlug) {
    toast.error('Chat not available for this product');
    return;
  }

  try {
    // Fetch seller profile by store slug
    const { data: seller } = await supabase
      .from('seller_profiles')
      .select('id, store_name')
      .eq('store_slug', product.storeSlug)
      .single();

    if (seller) {
      openChat({
        sellerId: seller.id,
        sellerName: seller.store_name,
        productId: product.id,
        productName: product.name,
        type: 'seller'
      });
    }
  } catch (error) {
    console.error('Error opening chat:', error);
    toast.error('Could not open chat');
  }
};
```

### Step 5: Update Full View Chat Handler

Same pattern for `handleFullViewChat`:

```tsx
const handleFullViewChat = useCallback(async () => {
  if (!urlProduct) return;

  const product = allProducts.find(p => p.id === urlProduct.id);
  
  if (user) {
    if (product?.storeSlug) {
      // Fetch seller and open chat
      const { data: seller } = await supabase
        .from('seller_profiles')
        .select('id, store_name')
        .eq('store_slug', product.storeSlug)
        .single();

      if (seller) {
        openChat({
          sellerId: seller.id,
          sellerName: seller.store_name,
          productId: product.id,
          productName: product.name,
          type: 'seller'
        });
      }
    }
  } else {
    localStorage.setItem('pendingChat', JSON.stringify({
      productId: product?.id,
      productName: product?.name,
      storeSlug: product?.storeSlug,
      returnUrl: window.location.pathname
    }));
    toast.info('Please sign in to chat with sellers');
    navigate('/signin');
  }
}, [urlProduct, allProducts, user, navigate, openChat]);
```

### Step 6: Handle Return from Sign-In

Add effect to handle `pendingChat` restoration after user signs in:

```tsx
useEffect(() => {
  if (!user) return;

  const pendingChat = localStorage.getItem('pendingChat');
  if (!pendingChat) return;

  try {
    const data = JSON.parse(pendingChat);
    
    // Only process if return URL matches marketplace
    if (!data.returnUrl?.includes('/marketplace')) return;
    
    localStorage.removeItem('pendingChat');
    
    // Find the product and open chat
    const product = allProducts.find(p => p.id === data.productId);
    if (product?.storeSlug) {
      openChatWithProduct(product);
      toast.success('Chat is now open!');
    }
  } catch (e) {
    console.error('Failed to restore pending chat:', e);
    localStorage.removeItem('pendingChat');
  }
}, [user, allProducts]);
```

### Step 7: Add FloatingChatWidget to Return JSX

In the main return, add the widget before closing the CurrencyProvider:

```tsx
return (
  <CurrencyProvider>
    <FloatingChatProvider>
      <div className="min-h-screen bg-white">
        {/* ... existing content ... */}
      </div>
      
      {/* Floating Chat Widget */}
      <FloatingChatWidget />
    </FloatingChatProvider>
  </CurrencyProvider>
);
```

## Summary

| Change | Description |
|--------|-------------|
| Wrap with FloatingChatProvider | Enable floating chat context |
| Add FloatingChatWidget | Render floating chat UI |
| Update handleChat | Open chat directly instead of redirect |
| Update handleFullViewChat | Same pattern for full view |
| Add pendingChat restoration | Handle return from sign-in |
| Fetch seller info | Get seller ID/name from store slug |

