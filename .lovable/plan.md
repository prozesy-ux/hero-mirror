

# Fix Help Center -- Navigation Bug, Design Polish, and Layout Corrections

## Issues Found

### 1. CRITICAL BUG: Article navigation broken
The `HelpSearch` component's `useEffect` fires on mount with empty `localValue`, calling `onChange('')` which triggers `setSearch('')` in Help.tsx, which calls `setSearchParams({})` -- wiping ALL query params including `?article=` and `?category=`. This breaks all navigation.

**Root cause**: In `HelpSearch.tsx` lines 17-22, the debounced `useEffect` runs on mount and calls `onChange(localValue)` with an empty string, clearing the URL params.

**Fix**: Only call `onChange` when `localValue` actually changes from the previous value, not on initial mount.

### 2. Category grid should be 2 columns (not 4)
The reference `help.html` design shows category cards in a **2-column grid** (visible in page_1.jpg and page_2.jpg screenshots), not the current 4-column grid. Cards are large with generous padding.

### 3. Hero section has no background image
The reference design shows a plain light gray/white hero background -- NOT the green gradient currently used. The hero text "Find solutions fast." is in light gray color, not white. The background is clean white/light, not dark green gradient.

### 4. Header logo too small
The Uptoza logo in the header (`h-7`) is too small. Should be `h-8` for better visibility and match the reference sizing.

### 5. Article view needs proper Upwork-style colors
The article view (`HelpArticle.tsx`) still uses generic `text-muted-foreground` and `border-black/10` instead of the green color system (`#14A800`, `#001e00`, `#5e6d55`, `#d5e0d5`).

### 6. Back button in article view needs to work properly
The `onBack` handler navigates to the category, but should also work to go back to `/help` home.

## Files to Modify

### `src/components/help/HelpSearch.tsx`
- Fix the mount-time useEffect that wipes search params
- Add a ref to track if the component has mounted to prevent the initial empty onChange call
- Keep the debounced search behavior for actual user input

### `src/pages/Help.tsx`
- Change hero section from green gradient to light/white background matching reference (light gray `bg-[#f2f7f2]`)
- Hero text "Find solutions fast." in light muted color (large, not bold white)
- Change category grid from 4 columns to 2 columns: `grid-cols-1 md:grid-cols-2`
- Make category cards larger with more padding to match reference
- Fix `setSearch` callback to not wipe article/category params when called with empty string on mount
- Increase header logo size from `h-7` to `h-8`

### `src/components/help/HelpArticle.tsx`
- Update all color references to use the Upwork green system:
  - `text-muted-foreground` to `text-[#5e6d55]`
  - `border-black/10` to `border-[#d5e0d5]`
  - Back button hover: green accent
  - Related articles hover: green text
- Ensure "Back" button always navigates correctly

### `src/components/help/HelpCategoryCard.tsx`
- Make cards larger with more padding (`p-8` instead of `p-6`)
- Icon size increase to match reference (larger green outline icons)
- More spacing between icon and text

## Technical Details

### Search Bug Fix (HelpSearch.tsx)
```text
Current problematic code:
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);  // Fires on mount with '' -> wipes all params
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, onChange]);

Fix: Add mount guard using useRef:
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, onChange]);
```

### Hero Design Change
Change from dark green gradient to the reference light background:
- Background: `bg-[#f2f7f2]` (very light green-gray)
- "Help Center" subtitle: `text-[#5e6d55]`
- "Find solutions fast." heading: `text-[#001e00]` with lighter weight, large size
- Subtext: `text-[#5e6d55]`
- Search bar: white with shadow (already correct)
- Popular tags: `bg-[#e4ebe4]` with `text-[#001e00]`

### Category Grid
- Change to 2-column grid: `grid-cols-1 md:grid-cols-2 gap-6`
- Each card: larger padding, left green border accent on hover
- Match the reference vertical stacking layout

