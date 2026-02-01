
# Home Page Search & Category Enhancement

## Overview

Upgrade the home page with a functional search bar that navigates directly to matching products, and update the category menu to reflect your actual product categories.

## What Will Be Done

### 1. Hero Section Search Bar - Direct Product Navigation

Transform the static search bar into a smart search that:
- Checks if the search query matches a product name
- If exact/close match found → Navigate directly to `/marketplace/{product-slug}`
- If no direct match → Navigate to `/marketplace?search={query}` for keyword search

```text
User types: "Netflix"
  ↓
System finds: "Netflix Cheap Monthly Account" (slug: netflix-cheap-monthly-account)
  ↓
Direct redirect to: /marketplace/netflix-cheap-monthly-account
```

**Technical Approach:**
- Add state management for search input
- Create a lightweight product search function using existing `bff-marketplace-search` edge function
- Add search suggestions dropdown (similar to marketplace)
- On search submit: Check for direct product match → navigate accordingly

### 2. Secondary Category Menu - Real Categories

Replace the hardcoded AI model tags with actual database categories:

**Current (Hardcoded):**
```text
Featured | Hot | New | Top | Video | SeedEdit | Nano Banana | FLUX | Sora | Veo | ChatGPT Image | Midjourney...
```

**Proposed (Database-Driven):**
```text
Featured | Hot | New | Coding | Education | Finance | Marketing | Productivity | SEO | Social Media | Writing | Video | Music | E-commerce | Gaming...
```

### 3. Hero Model Tags - Update to Match Products

Update the "Search by model" tags to reflect actual product types in your marketplace:

**Current:**
```text
ChatGPT Image | Midjourney | SeedEdit | Seedream 4 | Nano Banana | Veo | FLUX | Sora
```

**Proposed (based on your products):**
```text
Netflix | Amazon Prime | Google Cloud | ChatGPT | Gaming | Social Media | Streaming | AI Tools
```

## Files to be Modified

| File | Changes |
|------|---------|
| `src/components/HeroSection.tsx` | Add search functionality, update model tags, add search suggestions |
| `src/components/Header.tsx` | Fetch categories from database, dynamic category menu |
| `src/pages/Index.tsx` | Import useNavigate for search navigation |

## Technical Implementation

### HeroSection.tsx Changes

```tsx
// Add imports
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Add state
const [searchQuery, setSearchQuery] = useState('');
const [suggestions, setSuggestions] = useState([]);
const [isSearching, setIsSearching] = useState(false);
const navigate = useNavigate();

// Search handler
const handleSearch = async () => {
  if (!searchQuery.trim()) return;
  
  // Check for direct product match
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bff-marketplace-search?q=${encodeURIComponent(searchQuery)}`,
    { headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY }}
  );
  const data = await response.json();
  
  // If we have a product match with similar name, go directly to it
  const exactMatch = data.products.find(p => 
    p.text.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (exactMatch) {
    // Navigate to product page
    const slug = exactMatch.text.toLowerCase().replace(/\s+/g, '-');
    navigate(`/marketplace/${slug}`);
  } else {
    // Navigate to marketplace with search query
    navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
  }
};
```

### Header.tsx - Dynamic Categories

```tsx
// Fetch categories on mount
const [categories, setCategories] = useState([]);

useEffect(() => {
  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .order('display_order')
      .limit(20);
    setCategories(data || []);
  };
  fetchCategories();
}, []);

// Static items + dynamic categories
const menuItems = [
  { name: 'Featured', href: '/marketplace?filter=featured' },
  { name: 'Hot', href: '/marketplace?filter=hot' },
  { name: 'New', href: '/marketplace?filter=new' },
  ...categories.map(c => ({ name: c.name, href: `/marketplace?category=${c.id}` }))
];
```

### Updated Model Tags for Hero

Based on your actual products, update the tags to:

```tsx
const productTags = [
  { name: 'Netflix', query: 'netflix' },
  { name: 'Amazon Prime', query: 'amazon' },
  { name: 'Google Cloud', query: 'google cloud' },
  { name: 'ChatGPT', query: 'chatgpt' },
  { name: 'Gaming', query: 'gaming' },
  { name: 'Streaming', query: 'streaming' },
  { name: 'Social Media', query: 'social media' },
  { name: 'AI Tools', query: 'ai' },
];
```

## Search Flow Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                    USER TYPES IN SEARCH                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Query: "Netflix"                                │
│              Call bff-marketplace-search API                 │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌───────────────────────┐   ┌───────────────────────────────┐
│   PRODUCT FOUND       │   │   NO EXACT MATCH              │
│   "Netflix Cheap..."  │   │                               │
└───────────────────────┘   └───────────────────────────────┘
         │                              │
         ▼                              ▼
┌───────────────────────┐   ┌───────────────────────────────┐
│  Navigate to:         │   │  Navigate to:                 │
│  /marketplace/        │   │  /marketplace?search=netflix  │
│  netflix-cheap-...    │   │                               │
└───────────────────────┘   └───────────────────────────────┘
```

## Summary

- **Search Bar**: Becomes functional with direct product navigation
- **Category Menu**: Shows real categories from database (Coding, Education, Finance, etc.)
- **Model Tags**: Updated to match your actual products (Netflix, Amazon, etc.)
- **Smart Navigation**: Exact product match → direct product page, no match → search results
