

# Replace PromptHero Branding with Uptoza Logo

## Overview

The user has provided a new Uptoza logo (green "Upto" + blue "za" gradient text) to replace the current PromptHero branding throughout the application. This involves:

1. Adding the new Uptoza logo image to assets
2. Replacing all PromptHero icon imports with the new Uptoza logo
3. Updating text references from "PromptHero" to "Uptoza"

---

## Files to Modify

### 1. Add New Logo Asset
- **Copy** `user-uploads://IMG_7951.png` → `src/assets/uptoza-logo.png`

### 2. Sign In Page (`src/pages/SignIn.tsx`)
- Replace `promptheroIcon` import with `uptozaLogo`
- Update 4 image references from PromptHero icon to Uptoza logo
- Change 3 text occurrences:
  - "Welcome to PromptHero" → "Welcome to Uptoza"
  - Alt text "PromptHero" → "Uptoza"

### 3. Seller Page (`src/pages/Seller.tsx`)
- Replace `promptheroIcon` import with `uptozaLogo`
- Update image references
- Change text:
  - "Start selling on PromptHero" → "Start selling on Uptoza"
  - Alt text updates

### 4. Admin Page (`src/pages/Admin.tsx`)
- Replace `promptheroIcon` import with `uptozaLogo`
- Update admin login logo image

### 5. Products Hero (`src/components/ProductsHero.tsx`)
- Change "by PromptHero" → "by Uptoza"

### 6. CSS Comments (`src/index.css`)
- Update comment "PromptHero Design System" → "Uptoza Design System"

---

## Summary of Changes

| Location | Current | After |
|----------|---------|-------|
| SignIn page logo | prompthero-icon.png | uptoza-logo.png |
| SignIn welcome text | "Welcome to PromptHero" | "Welcome to Uptoza" |
| Seller page logo | prompthero-icon.png | uptoza-logo.png |
| Seller tagline | "Start selling on PromptHero" | "Start selling on Uptoza" |
| Admin login logo | prompthero-icon.png | uptoza-logo.png |
| Products hero credit | "by PromptHero" | "by Uptoza" |

---

## Technical Details

**Logo styling considerations:**
- The new Uptoza logo is a text-based logo (not a square icon)
- It should display with a white background container with rounded corners to match the current aesthetic
- The logo may need larger width dimensions since it's horizontal text rather than a square icon

**Files involved:**
1. `src/assets/uptoza-logo.png` (new file)
2. `src/pages/SignIn.tsx` (edit)
3. `src/pages/Seller.tsx` (edit)
4. `src/pages/Admin.tsx` (edit)
5. `src/components/ProductsHero.tsx` (edit)
6. `src/index.css` (edit - comment only)

