
# Marketplace Full View - URL-Based Routing & Design Improvements

## Overview

Based on your feedback, I'll make these changes:
1. **Remove "Back to Marketplace" button** from the full view page
2. **Implement proper URL routing** so products open at `/marketplace/{product-slug}` instead of staying at `/marketplace` with state
3. **Ensure proper background and border design** across all sections with consistent styling

## Current State Analysis

### Current URL Behavior
| Action | Current URL | Expected URL |
|--------|-------------|--------------|
| Open marketplace | `/marketplace` | `/marketplace` |
| Click on product | `/marketplace` (uses React state) | `/marketplace/netflix-premium` |
| Go back | State clears, shows grid | Browser back works |

### Current Issues
| Issue | Problem |
|-------|---------|
| No URL change on product view | Products don't have shareable/bookmarkable URLs |
| "Back to Marketplace" button | Redundant - browser back should work |
| State-based navigation | Loses product view on refresh |
| Inconsistent with buyer dashboard | Dashboard uses `/dashboard/ai-accounts/product/:productId` |

## Technical Implementation

### 1. Add New Route in App.tsx

Add a route for marketplace product view:
```tsx
<Route path="/marketplace/:productSlug" element={
  <Suspense fallback={<AppShell />}>
    <Marketplace />
  </Suspense>
} />
```

### 2. Update Marketplace.tsx to Handle Product Routing

**Changes:**
- Use `useParams` to get `productSlug` from URL
- Replace state-based `fullViewProduct` with URL-based routing
- Navigate to `/marketplace/{product-slug}` when user clicks "View Full"
- Use browser navigation (no "Back to Marketplace" button needed)

```tsx
// Add to imports
import { useNavigate, useParams } from 'react-router-dom';

// Get product slug from URL
const { productSlug } = useParams<{ productSlug: string }>();

// When clicking "View Full" in quick view modal
const handleViewFull = useCallback(() => {
  if (!quickViewProduct) return;
  
  // Generate slug from product name
  const slug = slugify(quickViewProduct.name);
  navigate(`/marketplace/${slug}`);
  setQuickViewProduct(null);
}, [quickViewProduct, navigate]);

// If productSlug exists in URL, show full view
if (productSlug) {
  // Find product by slug and show MarketplaceProductFullView
  return (
    <MarketplaceProductFullView
      productId={matchedProduct.id}
      productType={matchedProduct.type}
      onBack={() => navigate('/marketplace')}
      onBuy={handleFullViewBuy}
      onChat={handleFullViewChat}
      isAuthenticated={!!user}
    />
  );
}
```

### 3. Update MarketplaceProductFullView.tsx

**Remove "Back to Marketplace" button:**
```tsx
// DELETE these lines (391-398):
<button
  onClick={onBack}
  className="flex items-center gap-1.5 text-sm text-black/50 hover:text-black mb-4 transition-colors"
>
  <ArrowLeft className="w-3.5 h-3.5" />
  Back to Marketplace
</button>
```

**Update "Product not found" state:**
```tsx
// Remove the back button here too - user can use browser back
<div className="min-h-screen bg-[#F4F4F0] flex flex-col items-center justify-center gap-4">
  <p className="text-black/50">Product not found</p>
  {/* No back button needed */}
</div>
```

### 4. Ensure Consistent Border/Background Design

Current sections already have proper styling, but verify consistency:

| Section | Expected Styling |
|---------|-----------------|
| Page background | `bg-[#F4F4F0]` (cream) |
| Header | `bg-white` with `border-b border-black/5` |
| Category pills | `bg-white` with `border-b border-black/5` |
| Image carousel | `bg-white rounded-2xl border border-black/20` |
| Title/Price box | `bg-white rounded-2xl border border-black/20 p-6` |
| Description box | `bg-white rounded-2xl border border-black/20 p-6` |
| Reviews box | `bg-white rounded-2xl border border-black/20 p-6` |
| Purchase box (right) | `bg-white rounded-2xl border border-black/20 p-6` |

### 5. URL Generation Using Slug

The product URL will use the clean slug format:
- `/marketplace/netflix-premium`
- `/marketplace/chatgpt-plus-account`
- `/marketplace/midjourney-subscription`

**Slug generation** (using existing `url-utils.ts`):
```tsx
import { slugify } from '@/lib/url-utils';

// Generate URL-friendly slug from product name
const productUrl = `/marketplace/${slugify(product.name)}`;
```

**Lookup by slug:**
```tsx
// When URL has productSlug, find the product
const findProductBySlug = async (slug: string) => {
  // Try seller_products first
  const { data: sellerProduct } = await supabase
    .from('seller_products')
    .select('id, name, slug')
    .or(`slug.eq.${slug},name.ilike.%${slug.replace(/-/g, '%')}%`)
    .single();
  
  if (sellerProduct) return { id: sellerProduct.id, type: 'seller' as const };
  
  // Try ai_accounts
  const { data: aiAccount } = await supabase
    .from('ai_accounts')
    .select('id, name, slug')
    .or(`slug.eq.${slug},name.ilike.%${slug.replace(/-/g, '%')}%`)
    .single();
    
  if (aiAccount) return { id: aiAccount.id, type: 'ai' as const };
  
  return null;
};
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/marketplace/:productSlug` route |
| `src/pages/Marketplace.tsx` | Use URL params for product view, update navigation |
| `src/components/marketplace/MarketplaceProductFullView.tsx` | Remove "Back to Marketplace" button |

## Visual Reference - Updated URL Flow

```text
User Journey:
1. User visits: /marketplace
   → Shows product grid

2. User clicks product card
   → Quick view modal opens

3. User clicks "View Full" in modal
   → Navigate to: /marketplace/netflix-premium
   → Shows MarketplaceProductFullView component
   → URL is shareable/bookmarkable

4. User clicks browser back OR uses header navigation
   → Returns to: /marketplace
   → Shows product grid

5. User shares URL: /marketplace/netflix-premium
   → Direct link opens product full view
```

## Summary

1. **Add URL routing** - Products open at `/marketplace/{slug}` instead of using state
2. **Remove "Back to Marketplace"** - Browser back button handles navigation
3. **Shareable URLs** - Each product has a unique, SEO-friendly URL
4. **Consistent design** - All sections use `border border-black/20 rounded-2xl` styling
5. **Similar to buyer dashboard** - Matches `/dashboard/ai-accounts/product/:productId` pattern
