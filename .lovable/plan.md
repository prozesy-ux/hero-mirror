

# Fix Article Navigation Bug + Restore Hero Design + Polish Article View

## Issues Identified

### 1. CRITICAL: Article navigation still broken
**Root cause found**: The `HelpSearch` `useEffect` depends on `[localValue, onChange]`. When user clicks an article, `activeCategorySlug` changes (from a value to null), which causes `setSearch` (the `onChange` prop) to get a new function reference. This triggers the useEffect again (since `onChange` changed), and `isFirstRender` is already false, so it calls `onChange("")` which runs `setSearch("")` which wipes `?article=` from URL params.

**Fix**: Use a `useRef` for the onChange callback instead of including it in the useEffect dependency array. This prevents re-firing when the callback reference changes.

### 2. Hero section needs green gradient with background image (not light gray)
The `help.html` reference clearly uses:
- `bg-gradient-to-br from-[#001e00] via-[#0d3b0d] to-[#14A800]` (dark green gradient)
- Background image overlay at 20% opacity: `https://support.upwork.com/hc/theming_assets/01K1BK8D2665NP4ZR79NVGSEG8`
- ALL text is **white**: `text-white`, `text-white/90`, `text-white/80`
- Popular tags: `bg-white/15 backdrop-blur-sm border border-white/20 text-white`

Currently it uses `bg-[#f2f7f2]` (light gray) with dark text -- this is wrong.

### 3. Sidebar article text should be black/dark
Left panel article titles in the sidebar should use `text-[#001e00]` (black) for better readability, not the current `text-[#5e6d55]` (gray).

### 4. Category grid should be 4 columns (matching help.html)
The reference `help.html` uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`. Currently using only 2 columns.

### 5. Article view design polish
- Article content area needs clean white background with proper spacing
- Back button and breadcrumb should be more prominent
- Prose content styling should match the clean Upwork article reading experience

---

## Files to Modify

### `src/components/help/HelpSearch.tsx`
- Store `onChange` in a `useRef` so it doesn't trigger the useEffect when its reference changes
- Remove `onChange` from the useEffect dependency array
- Keep `isFirstRender` guard as additional protection

### `src/pages/Help.tsx`
- **Hero section**: Restore green gradient (`bg-gradient-to-br from-[#001e00] via-[#0d3b0d] to-[#14A800]`)
- Add background image overlay div at 20% opacity using the Upwork support background image URL
- Change all hero text to white: `text-white`, `text-white/90`, `text-white/80`
- Popular tags: `bg-white/15 backdrop-blur-sm border border-white/20 text-white`
- Category grid: Change from `md:grid-cols-2` to `md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Fix `setSearch` to also preserve `activeArticleSlug` param when clearing search

### `src/components/help/HelpSidebar.tsx`
- Change article text from `text-[#5e6d55]` to `text-[#001e00]` for non-active articles
- Keep hover state as `hover:text-[#14A800]`

### `src/components/help/HelpArticle.tsx`
- Ensure clean white article reading experience
- Back button more prominent with green hover
- Add proper spacing and typography for article content

---

## Technical Details

### Search Bug Fix (HelpSearch.tsx)
```text
Current broken flow:
1. User clicks article -> setArticle('slug') -> setSearchParams({article: 'slug'})
2. activeCategorySlug changes -> setSearch gets new reference
3. useEffect fires because onChange (setSearch) changed
4. Calls onChange('') -> setSearch('') -> setSearchParams({}) -> wipes article param
5. Article disappears, page goes back to home

Fix using useRef for onChange:
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      onChangeRef.current(localValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue]);  // onChange removed from deps
```

### Hero Design Restoration
```text
Current (wrong):
  bg-[#f2f7f2] with dark text

Correct (matching help.html):
  bg-gradient-to-br from-[#001e00] via-[#0d3b0d] to-[#14A800]
  + absolute overlay div with background-image at opacity-20
  + all text in white/white-90/white-80
  + popular tags: bg-white/15 backdrop-blur-sm border-white/20
```

