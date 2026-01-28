
# Remove Floating Loading Text from AppShell

## Problem

The AppShell component displays a floating loading indicator at the bottom-right of the screen with messages like:
- "Loading..."
- "Validating session..."
- "Taking longer than expected..."

As shown in your screenshot, this floating text is distracting and you want it removed.

## Solution

Remove the floating loading indicator from all AppShell variants. Keep only the skeleton loaders which provide sufficient visual feedback.

## File to Modify

| File | Change |
|------|--------|
| `src/components/ui/app-shell.tsx` | Remove floating loading indicator from all variants |

## Changes

### Remove from Dashboard/Seller variant (lines 64-68)
Delete this block:
```typescript
{/* Loading indicator */}
<div className="fixed bottom-4 right-4 flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-lg">
  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
  <span className="text-sm text-muted-foreground">{displayMessage}</span>
</div>
```

### Remove from Store variant (lines 106-110)
Delete the same floating indicator block.

### Simplify Default variant (lines 122-123)
Remove the text from the centered loading state:
```typescript
// Before
<p className="text-sm text-muted-foreground animate-pulse">{displayMessage}</p>

// After: Remove entirely - just show spinner
```

### Clean up unused code
Remove the `progressMessages` object and `displayMessage` variable since they're no longer needed.

## Result

After this change:
- Skeleton loaders will still provide visual structure during loading
- No floating "Loading..." or "Taking longer than expected..." text
- Cleaner, less distracting loading experience
- Default variant will show only a centered spinner without text
