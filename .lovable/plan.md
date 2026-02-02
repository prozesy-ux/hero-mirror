

# New Product Page - Enhanced Design

## Overview

Redesign the product creation wizard with three key improvements:
1. **Step 1 (Type)**: Increase width and make product cards match the services section row-based layout
2. **Step 2 (Details)**: Gumroad-style form with pink focused borders on inputs and a black-base rich text editor toolbar
3. Overall width increase for the entire section

---

## Current vs Target Analysis

### Reference Image Analysis
The reference shows:
- **Name Input**: White input with a thick pink/magenta border when focused (`border-2` style)
- **Description**: Rich text editor with a black toolbar (`bg-black`) containing formatting buttons (Bold, Italic, Underline, Strikethrough, Quote, Link, Image, Video, Audio, Insert dropdown)
- **Labels**: Simple black text labels above inputs ("Name", "Description")
- **Background**: Cream/off-white background (#f4f4f0)

---

## File 1: `src/components/seller/ProductTypeSelector.tsx`

### Changes Required

**1. Products Grid - Match Services Row Layout:**
```text
Current: xl:grid-cols-5 (5 columns, small cards)
Target: xl:grid-cols-4 (4 columns, wider cards like services)
```

**2. Increase Card Width:**
- Change products grid from `xl:grid-cols-5` to `xl:grid-cols-4`
- This makes product cards wider, matching the services section row-based feel

---

## File 2: `src/pages/NewProduct.tsx`

### Changes Required

**1. Increase Main Content Width:**
```text
Current: max-w-6xl
Target: max-w-7xl
```

**2. Step 1 Layout - Adjust Grid Ratio:**
```text
Current: lg:grid-cols-5 (2:3 split)
Target: lg:grid-cols-3 (1:2 split) - gives more space to the type selector
```

**3. Step 2 (Details) - Gumroad Form Styling:**

**Input Fields - Pink Focus Border:**
```tsx
// Current:
className="rounded-md border border-gray-300 h-11 text-base focus:border-pink-500 focus:ring-pink-500"

// Target:
className="rounded-lg border-2 border-gray-200 h-12 text-base focus:border-pink-500 focus:ring-0 focus:ring-offset-0 focus:outline-none transition-colors"
```

**Labels - Clean Black Text:**
```tsx
// Current:
<Label className="text-sm font-medium text-gray-700 mb-2 block">Name</Label>

// Target:
<Label className="text-base font-medium text-gray-900 mb-2 block">Name</Label>
```

**4. Rich Text Editor with Black Toolbar:**

Replace the simple `<Textarea>` with a styled editor container:
```tsx
<div>
  <Label className="text-base font-medium text-gray-900 mb-2 block">Description</Label>
  
  {/* Black toolbar */}
  <div className="border-2 border-gray-200 rounded-lg overflow-hidden focus-within:border-pink-500 transition-colors">
    <div className="bg-black px-3 py-2 flex items-center gap-1 flex-wrap">
      {/* Format dropdown */}
      <button className="px-3 py-1.5 text-white text-sm rounded hover:bg-white/10 flex items-center gap-1">
        Text <ChevronDown className="w-3 h-3" />
      </button>
      <div className="w-px h-5 bg-gray-700 mx-1" />
      {/* Formatting buttons */}
      <button className="p-2 text-white rounded hover:bg-white/10"><Bold /></button>
      <button className="p-2 text-white rounded hover:bg-white/10"><Italic /></button>
      <button className="p-2 text-white rounded hover:bg-white/10"><Underline /></button>
      <button className="p-2 text-white rounded hover:bg-white/10"><Strikethrough /></button>
      <button className="p-2 text-white rounded hover:bg-white/10"><Quote /></button>
      <div className="w-px h-5 bg-gray-700 mx-1" />
      <button className="p-2 text-white rounded hover:bg-white/10"><Link /></button>
      <button className="p-2 text-white rounded hover:bg-white/10"><Image /></button>
      <button className="p-2 text-white rounded hover:bg-white/10"><Video /></button>
      <button className="p-2 text-white rounded hover:bg-white/10"><Music /></button>
      <div className="w-px h-5 bg-gray-700 mx-1" />
      <button className="px-3 py-1.5 text-white text-sm rounded hover:bg-white/10 flex items-center gap-1">
        Insert <ChevronDown className="w-3 h-3" />
      </button>
      {/* Undo/Redo on right */}
      <div className="ml-auto flex items-center gap-1">
        <button className="p-2 text-white/60 rounded hover:bg-white/10"><Undo /></button>
        <button className="p-2 text-white/60 rounded hover:bg-white/10"><Redo /></button>
      </div>
    </div>
    {/* Text area */}
    <Textarea
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      placeholder="Describe your product..."
      rows={6}
      className="border-0 rounded-none text-base resize-none focus:ring-0 focus:outline-none"
    />
  </div>
</div>
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `ProductTypeSelector.tsx` | Products grid: `xl:grid-cols-5` → `xl:grid-cols-4` for wider cards |
| `NewProduct.tsx` | Container width: `max-w-6xl` → `max-w-7xl` |
| `NewProduct.tsx` | Step 1 grid: `lg:grid-cols-5` → `lg:grid-cols-3` (1:2 ratio) |
| `NewProduct.tsx` | Step 2 grid: `lg:grid-cols-5` → `lg:grid-cols-3` (1:2 ratio) |
| `NewProduct.tsx` | Input styling: Add `border-2`, larger height `h-12`, `rounded-lg` |
| `NewProduct.tsx` | Labels: `text-gray-700` → `text-gray-900`, `text-sm` → `text-base` |
| `NewProduct.tsx` | Description: Replace Textarea with rich text editor container (black toolbar) |

---

## Visual Comparison

### Step 1 - Before vs After
- **Before**: 5-column product grid (small cards)
- **After**: 4-column product grid (wider cards matching services)

### Step 2 - Before vs After
- **Before**: Simple gray border inputs, plain textarea
- **After**: Pink focus borders (`border-2`), black toolbar rich text editor

### Input Focus State
```text
Before: border-gray-300 → focus:border-pink-500 (subtle)
After: border-2 border-gray-200 → focus:border-pink-500 (prominent like reference)
```

This creates the exact Gumroad-style form aesthetic shown in the reference image with thick pink focus borders and the distinctive black rich text editor toolbar.

