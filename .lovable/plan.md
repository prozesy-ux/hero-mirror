

# Product Creation Page Redesign - Gumroad Style

## Overview

Redesign the product creation wizard (`/seller/products/new`) to match the Gumroad reference design, including wider product type boxes, professional typography, and a cleaner section-based layout.

---

## Key Design Changes

### 1. Typography Updates

| Element | Current | Target |
|---------|---------|--------|
| Page title | `font-black` (900) | `font-semibold` (600) |
| Section labels | Not present | Simple uppercase labels like "Products", "Services" |
| Card titles | `font-bold` centered | `font-medium` left-aligned |
| Descriptions | `text-xs` centered | `text-sm` left-aligned, gray |

### 2. Product Type Card Design

**Current:**
- Centered layout with icon on top
- Black checkmark circle indicator
- 4-column grid
- Black border when selected

**Target (Gumroad style):**
- Left-aligned layout: icon on left, text on right
- Pink/magenta border when selected (no checkmark)
- 5-column grid for Products, 3-column for Services
- Thin 1px gray border by default
- Icon with subtle colored background
- Wider cards with more horizontal space

### 3. Layout Structure

**Step 1 (Type Selection):**
- Two-column: Left intro text (narrower), Right product grid (wider)
- "Products" section header above main product types (5 columns)
- "Services" section header above service types (3 columns)
- Gray page background

### 4. Input Field Updates

**Name input:**
- Full-width with thin border
- No heavy styling

**Price input:**
- Integrated currency dropdown on left (`$ v`)
- Full-width field

---

## Files to Modify

### 1. ProductTypeSelector.tsx
- Change card layout from centered to horizontal (icon left, text right)
- Update grid from 4-col to 5-col for products, 3-col for services
- Change selection indicator from checkmark to pink border
- Add section headers ("Products", "Services")
- Widen cards and reduce vertical padding

### 2. NewProduct.tsx
- Update background to light gray (#f4f4f0)
- Reduce font weights throughout
- Update page title styling
- Adjust column ratios for better content distribution
- Update input field styling for Gumroad-like appearance

### 3. ProductTypeIcons.tsx (Optional)
- Icons are already good, may reduce size slightly

---

## Visual Comparison

**Current Card:**
```
+------------------+
|      [Icon]      |
|   Product Name   |
|   Description    |
|  [Checkmark]     |
+------------------+
```

**Target Card (Gumroad):**
```
+--------------------------------------------+
| [Icon] Product Name                        |
|        Description text goes here          |
+--------------------------------------------+
        ^ pink border when selected
```

---

## Technical Details

### ProductTypeSelector Changes

```tsx
// New structure with section grouping
const productTypes = PRODUCT_TYPES.filter(t => 
  ['digital_product', 'course', 'ebook', 'membership', 'bundle'].includes(t.id)
);
const serviceTypes = PRODUCT_TYPES.filter(t => 
  ['commission', 'call', 'coffee'].includes(t.id)
);

// Card styling
className={cn(
  "flex items-start gap-3 p-4 rounded-md border text-left transition-all",
  isSelected
    ? "border-pink-500 border-2"
    : "border-gray-200 hover:border-gray-300"
)}
```

### Font Updates

```tsx
// Header title
className="font-semibold text-xl"

// Section labels
className="text-sm font-medium text-gray-900 mb-4"

// Card title
className="font-medium text-gray-900"

// Card description
className="text-sm text-gray-500"
```

### Background & Container

```tsx
// Page background
<div className="min-h-screen bg-[#f4f4f0]">

// Form container
<div className="bg-white rounded-lg border border-gray-200">
```

---

## Summary

1. **ProductTypeSelector.tsx** - Rebuild card layout to horizontal style with pink selection border, 5-col and 3-col grids, section headers
2. **NewProduct.tsx** - Update page background, reduce font weights, adjust layout ratios, improve input styling
3. Maintain existing functionality while updating visual presentation to match Gumroad reference

