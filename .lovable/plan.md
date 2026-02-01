

# Fix Category Display on Home Page

## Issue Identified

There are TWO separate category displays on the home page:

1. **Header Secondary Nav** (lines 108-122 in Header.tsx) - Already fetches categories from database ✓
2. **HeroSection Popular Searches** (lines 13-22 in HeroSection.tsx) - Uses STATIC hardcoded tags ✗

The database categories are showing correctly in the Header secondary nav, but the HeroSection still uses hardcoded static tags that were defined earlier.

## Current State

**Header.tsx** - Dynamic (working):
```text
Featured | Hot | New | Software | Courses | Subscriptions | Advertising | Tools | ...
```

**HeroSection.tsx** - Static (not connected):
```text
Netflix | Amazon Prime | Google Cloud | ChatGPT | Gaming | Streaming | Social Media | AI Tools
```

## What Will Be Done

### Option A: Make HeroSection Also Use Database Categories

Update HeroSection.tsx to fetch popular/active categories from the database:

```tsx
// Add to HeroSection.tsx
const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

useEffect(() => {
  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("display_order")
      .limit(8); // Top 8 categories for hero
    setCategories(data || []);
  };
  fetchCategories();
}, []);
```

Then update the "Popular searches" section to use these categories:

```tsx
<div className="flex flex-wrap justify-center gap-2">
  {categories.map((cat) => (
    <button
      key={cat.id}
      onClick={() => navigate(`/marketplace?category=${cat.id}`)}
      className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/20"
    >
      {cat.name}
    </button>
  ))}
</div>
```

## Files to be Modified

| File | Changes |
|------|---------|
| `src/components/HeroSection.tsx` | Replace static productTags with dynamic categories from database |

## Visual Result

**Before (Static):**
```text
Popular searches: Netflix | Amazon Prime | Google Cloud | ChatGPT | Gaming | ...
```

**After (Dynamic from DB):**
```text
Popular searches: Software | Courses | Subscriptions | Advertising | Tools | Digital Services | Social Accounts | Content
```

## Technical Details

### Updated HeroSection.tsx

```tsx
// Add state for categories
const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

// Fetch categories on mount
useEffect(() => {
  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("display_order")
      .limit(8);
    setCategories(data || []);
  };
  fetchCategories();
}, []);

// In the render - replace productTags.map with:
{categories.map((cat) => (
  <button
    key={cat.id}
    onClick={() => navigate(`/marketplace?category=${cat.id}`)}
    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/20"
  >
    {cat.name}
  </button>
))}
```

## Summary

- **Problem**: HeroSection uses static hardcoded tags, not connected to database
- **Solution**: Fetch categories from database in HeroSection (same as Header does)
- **Result**: Both Header nav and HeroSection popular searches will show the same database categories
 added alal catagories

