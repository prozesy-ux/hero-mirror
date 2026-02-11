

# Redesign Help Center to Match Upwork-Style Design

## What Changes

Completely restyle the `/help` page and its components to match the uploaded `help.html` design exactly. All existing functionality (134 articles, search, filtering, article view, sidebar navigation) stays intact -- only the visual design changes.

## Design Elements from help.html

### 1. Header (white, not black)
- White background with bottom border `border-[#e4ebe4]`
- Uptoza logo on left with `|` divider and "Help Center" text
- Desktop nav links in center (category shortcuts)
- Search icon button + green "Log in" button on right
- Mobile hamburger menu
- Height: `h-16`, max-width: `1600px`

### 2. Hero Section (green gradient -- NEW, does not exist currently)
- Gradient: `from-[#001e00] via-[#0d3b0d] to-[#14A800]`
- "Help Center" subtitle + large heading "Find solutions fast."
- Subtext: "Search hundreds of articles on Uptoza Help"
- Full-width rounded search bar with green search button inside
- Popular tags as pill buttons (`bg-white/15 backdrop-blur-sm border border-white/20`)
- Padding: `py-20 lg:py-28`

### 3. Role Tabs (underline style, not pill style)
- Bottom border with gap-8 between tabs
- Active tab: `border-b-2 border-[#14A800] text-[#001e00]`
- Inactive: `text-[#5e6d55]` with `border-transparent`
- Labels: "Seller" | "Buyer" | "All" (mapped from Freelancer/Agency/Client)

### 4. Category Grid (4 columns, not 3)
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Each card: white bg, `border border-[#d5e0d5]`, `rounded-lg`
- Hover: `border-[#14A800]` + `shadow-lg`
- Icon in green `text-[#14A800]`, 32x32px SVGs
- Title: `text-xl font-semibold text-[#001e00]`, hover turns green
- Description: `text-sm text-[#5e6d55]`

### 5. Footer (dark green -- NEW)
- Background: `bg-[#001e00]`
- 4-column grid: For Sellers, For Buyers, Resources, Company
- Social links row with circular icon buttons
- Copyright + Terms/Privacy links at bottom
- Uptoza branding adapted from Upwork footer

### 6. Article View & Category View
- Keep existing functionality but update colors:
  - Primary accent: `#14A800` (green) instead of black
  - Text: `#001e00` for headings, `#5e6d55` for muted
  - Borders: `#d5e0d5` instead of `black/10`

## Files to Modify

### `src/pages/Help.tsx` -- Major redesign
- Replace black header with white Upwork-style header
- Add green gradient hero section with search bar and popular tags
- Change role tabs from pill-style to underline-style
- Update category grid to 4 columns with Upwork card styling
- Add dark green footer section
- Update all color tokens to match the green theme
- Move search from header into hero section
- Keep all existing logic (useSearchParams, filtering, etc.)

### `src/components/help/HelpCategoryCard.tsx` -- Restyle cards
- Change to Upwork card design: white bg, green border on hover
- Larger icon (32x32) in green color
- Title `text-xl` that turns green on hover
- Description in `text-[#5e6d55]`
- Remove article count badge or make it subtle

### `src/components/help/HelpSearch.tsx` -- Restyle search
- Rounded-full search input (pill shape)
- Green circular search button inside the input on the right
- Larger height `h-14`
- White background with shadow

### `src/components/help/HelpSidebar.tsx` -- Update colors
- Replace black active states with `#14A800` green
- Update hover states to `#f7f7f7`
- Border colors to `#d5e0d5`

### `src/components/help/HelpArticle.tsx` -- Update colors
- Green accent for role badges
- Green back button hover
- Updated border colors to `#d5e0d5`

## Color System (Upwork-style)
- Primary green: `#14A800`
- Primary green hover: `#108a00`
- Dark text: `#001e00`
- Muted text: `#5e6d55`
- Border: `#d5e0d5` / `#e4ebe4`
- Background: white
- Footer bg: `#001e00`
- Hero gradient: `#001e00` to `#14A800`

## What Stays the Same
- All 134 articles data (`help-docs.ts`) -- no changes
- URL routing logic (query params for article, category, search, role)
- Article rendering with feedback and related articles
- Mobile sidebar sheet
- SEO head component

