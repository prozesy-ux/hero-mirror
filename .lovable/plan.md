
# Marketplace Full View Enhancements

## Overview

Three improvements to the marketplace product full view page:

1. **Header**: Add language selector and currency converter to the public marketplace header (matching dashboard header)
2. **Title + Description**: Merge into a single container (currently separate boxes)
3. **Review Create Option**: Make "Write a Review" button visible to all users (currently hidden for non-authenticated users)

## Current State vs Target State

| Element | Current | Target |
|---------|---------|--------|
| Header | Only search, login, seller buttons | Add currency selector (like dashboard) |
| Title Box | Separate container | Merged with description in one box |
| Description Box | Separate container | Merged with title in one box |
| Write Review | Only visible when logged in | Visible to all (shows login prompt if not authenticated) |

## Visual Layout

```text
BEFORE:
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  [Search Bar]           [Login] [Sell]              │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Title / Seller / Rating Box                                │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Description Box (separate)                                 │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Reviews (Write Review only for logged in users)            │
└────────────────────────────────────────────────────────────┘


AFTER:
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  [Search Bar]    [🇺🇸 USD ▼] [Login] [Sell]         │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Title / Seller / Rating                                    │
│  ─────────────────────────────────────────────────────────  │
│  Description                                                │
│  Description text here...                                   │
│  [Tags]                                                     │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Reviews                                                    │
│  [Write a Review] ← Always visible, prompts login if needed │
└────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. GumroadHeader.tsx - Add Currency Selector

Add CurrencySelector and CurrencyContext to the public marketplace header:

**Changes:**
- Import `CurrencyProvider` and `CurrencySelector` components
- Add currency selector dropdown between search bar and login button
- Use the "minimal" variant to match enterprise styling

**Position:**
```jsx
{/* Right Actions */}
<div className="hidden md:flex items-center gap-2">
  <CurrencySelector variant="minimal" />  {/* NEW */}
  <Link to="/signin" ...>Log in</Link>
  <Link to="/seller" ...>Start selling</Link>
</div>
```

### 2. MarketplaceProductFullView.tsx - Merge Title + Description

Combine the two separate containers into one unified box:

**Current structure (lines 558-638):**
- Title/Seller/Rating Box (lines 561-614)
- Description Box (lines 616-638)

**New structure:**
```jsx
{/* Combined Title + Description Section */}
<div className="bg-white rounded-2xl border border-black/20 p-6">
  {/* Title */}
  <h1 className="text-2xl lg:text-3xl font-bold text-black mb-4">
    {product.name}
  </h1>

  {/* Seller Info */}
  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-black/10">
    {/* Avatar, seller name, verified badge */}
  </div>

  {/* Rating Summary */}
  {product.reviewCount > 0 && (
    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-black/10">
      {/* Stars, rating, count */}
    </div>
  )}

  {/* Description Header */}
  <h3 className="text-lg font-bold text-black pb-2 mb-3">
    Description
  </h3>
  
  {/* Description Text */}
  <p className="text-black/70 whitespace-pre-line leading-relaxed">
    {product.description}
  </p>

  {/* Tags */}
  {product.tags.length > 0 && (
    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-black/10">
      {/* Tag chips */}
    </div>
  )}
</div>
```

### 3. MarketplaceProductFullView.tsx - Always Show Write Review Button

Change the review button to always be visible, with different behavior based on auth status:

**Current (line 703-711):**
```jsx
{isAuthenticated && (
  <Button onClick={() => setShowReviewForm(!showReviewForm)}>
    Write a Review
  </Button>
)}
```

**Updated:**
```jsx
<Button
  onClick={() => {
    if (isAuthenticated) {
      setShowReviewForm(!showReviewForm);
    } else {
      toast.info('Please sign in to write a review');
      // Or navigate to signin
    }
  }}
  className="bg-black hover:bg-black/90 text-white rounded-lg text-sm h-9"
>
  <Edit3 className="w-3.5 h-3.5 mr-1.5" />
  {showReviewForm && isAuthenticated ? 'Cancel' : 'Write a Review'}
</Button>
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/marketplace/GumroadHeader.tsx` | Add CurrencySelector import and component in header |
| `src/components/marketplace/MarketplaceProductFullView.tsx` | Merge title + description boxes, always show Write Review button |

## Technical Notes

- CurrencyContext is already available at app level (used by dashboard)
- CurrencySelector component already exists with "minimal" variant perfect for headers
- The Write Review button will show login prompt via toast when user is not authenticated
- Single container reduces visual noise and follows enterprise patterns (Amazon, Gumroad) miss languege selctor 
