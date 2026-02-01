

# Fix Hover Card Centering - Complete Solution

## Problem Identified

The previous fix didn't work because:
1. `side="bottom"` and `align="center"` props still exist in both HoverCard components
2. CSS classes lack `!important` modifiers to override Radix's inline styles
3. Radix applies inline `transform` styles that override our CSS transform

## Root Cause

Radix UI's HoverCard calculates position based on trigger element and applies **inline styles** like:
```html
<div style="transform: translate3d(450px, 320px, 0px);">
```

Our CSS classes (`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`) get overridden by these inline styles.

## Solution

### 1. Update hover-card.tsx

Add `!important` modifiers AND reset inline transform with a style override:

```typescript
const HoverCardContent = React.forwardRef<...>(
  ({ className, align = "center", sideOffset = 4, side, ...props }, ref) => {
    const isFixedCenter = className?.includes('fixed-center');
    
    return (
      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          ref={ref}
          align={isFixedCenter ? undefined : align}
          side={isFixedCenter ? undefined : side}
          sideOffset={isFixedCenter ? 0 : sideOffset}
          style={isFixedCenter ? {
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          } : undefined}
          className={cn(
            "z-50 w-64 rounded-md border bg-popover p-4 ...",
            className,
          )}
          {...props}
        />
      </HoverCardPrimitive.Portal>
    );
  }
);
```

**Why inline styles?** Radix's inline styles have high specificity. Using our own inline styles ensures they take precedence.

### 2. Update ProductHoverCard.tsx

Remove `side` and `align` props entirely:

```typescript
// Line 325-330: BEFORE
<HoverCardContent 
  side="bottom" 
  align="center"
  sideOffset={16}
  className="w-[700px] p-0 ... fixed-center"
>

// AFTER
<HoverCardContent 
  className="w-[700px] p-0 ... fixed-center"
>
```

### 3. Update StoreProductHoverCard.tsx

Same changes - remove positioning props:

```typescript
// Line 325-330: BEFORE
<HoverCardContent 
  side="bottom" 
  align="center"
  sideOffset={16}
  className="w-[700px] p-0 ... fixed-center"
>

// AFTER
<HoverCardContent 
  className="w-[700px] p-0 ... fixed-center"
>
```

## Visual Result

```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ┌─────────────────┐                      │
│                    │                 │                      │
│                    │   Hover Card    │                      │
│                    │  ALWAYS CENTER  │                      │
│                    │                 │                      │
│                    └─────────────────┘                      │
│                                                             │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐            │
│  │Card│  │Card│  │Card│  │Card│  │Card│  │Card│            │
│  └────┘  └────┘  └────┘  └────┘  └────┘  └────┘            │
│                                                             │
│  No matter which card you hover, preview appears centered   │
└─────────────────────────────────────────────────────────────┘
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ui/hover-card.tsx` | Add inline style override for fixed-center mode |
| `src/components/marketplace/ProductHoverCard.tsx` | Remove `side`, `align`, `sideOffset` props |
| `src/components/store/StoreProductHoverCard.tsx` | Remove `side`, `align`, `sideOffset` props |

## Technical Details

### Why Previous Fix Failed:
- Radix applies `style="transform: translate3d(x, y, 0)"` inline
- CSS classes (even with `!important`) can't override inline `style` attribute
- Solution requires applying our own inline `style` to win specificity battle

### Key Changes:
1. Detect `fixed-center` class in component
2. When detected: apply inline positioning styles + disable Radix positioning
3. Remove positioning props from consumers to prevent any conflict

## Summary

- Use inline `style` prop to override Radix's calculated positioning
- Remove `side`, `align`, `sideOffset` from HoverCardContent when using fixed-center
- Hover card will always appear at exact screen center regardless of trigger position

