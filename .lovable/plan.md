

# Product Creation Wizard - Step Consolidation & Redesign

## Overview

Merge Step 2 (Details) and Step 3 (Customize) into a single comprehensive "Details" step. Reorganize the form with **Images first**, followed by Name, Price, Description, Tags, Categories, and Settings. Apply a clean **black/white base design** for all labels and form elements.

---

## Current vs Target Structure

### Current (3 Steps)
```text
Step 1: Type Selection
Step 2: Name, Price, Stock, Description, Categories
Step 3: Images, Tags, Settings (switches)
```

### Target (2 Steps)
```text
Step 1: Type Selection (unchanged)
Step 2: ALL Details (consolidated)
         ├── Images (FIRST - at top)
         ├── Name
         ├── Price & Stock
         ├── Description (rich text editor)
         ├── Tags
         ├── Categories
         └── Settings (switches)
```

---

## Visual Design - Black/White Base

### Labels
```text
Current: text-base font-medium text-gray-900
Target: text-sm font-bold text-black uppercase tracking-wide
```

### Input Fields
```text
Current: border-2 border-gray-200 focus:border-pink-500
Target: border-2 border-black/10 focus:border-black bg-white
```

### Section Dividers
```text
Add clear visual separation between form sections using:
- Subtle borders (border-t border-black/10)
- Consistent spacing (py-6)
```

---

## Technical Changes

### File: `src/pages/NewProduct.tsx`

**1. Update STEPS constant (Line 23-27):**
```tsx
// FROM:
const STEPS = [
  { id: 1, title: 'Type', description: 'What are you selling?' },
  { id: 2, title: 'Details', description: 'Name, price, and description' },
  { id: 3, title: 'Customize', description: 'Images and settings' },
];

// TO:
const STEPS = [
  { id: 1, title: 'Type', description: 'What are you selling?' },
  { id: 2, title: 'Details', description: 'Everything about your product' },
];
```

**2. Update canProceed function (Line 85-96):**
```tsx
// Remove case 3, adjust case 2 validation
const canProceed = () => {
  switch (currentStep) {
    case 1:
      return !!productType;
    case 2:
      return name.trim().length > 0 && parseFloat(price) >= 0;
    default:
      return false;
  }
};
```

**3. Consolidate Step 2 Content (Lines 299-450 + 453-597):**

New Step 2 structure with images first:
```tsx
{currentStep === 2 && (
  <div className="p-6 lg:p-8">
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Left: Preview Card */}
      <div className="lg:col-span-1">
        {/* Summary card with live preview */}
      </div>
      
      {/* Right: Form */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* SECTION 1: Images (FIRST) */}
        <div>
          <Label className="text-sm font-bold text-black uppercase tracking-wide mb-3 block">
            Product Images
          </Label>
          <MultiImageUploader images={images} onChange={setImages} maxImages={5} />
        </div>
        
        <div className="border-t border-black/10" />
        
        {/* SECTION 2: Basic Info */}
        <div className="space-y-5">
          <div>
            <Label className="text-sm font-bold text-black uppercase tracking-wide mb-2 block">
              Name
            </Label>
            <Input className="border-2 border-black/10 focus:border-black h-12 rounded-lg" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-bold text-black uppercase tracking-wide mb-2 block">
                Price
              </Label>
              <Input className="border-2 border-black/10 focus:border-black h-12 rounded-lg pl-8" />
            </div>
            <div>
              <Label className="text-sm font-bold text-black uppercase tracking-wide mb-2 block">
                Stock
              </Label>
              <Input className="border-2 border-black/10 focus:border-black h-12 rounded-lg" />
            </div>
          </div>
        </div>
        
        <div className="border-t border-black/10" />
        
        {/* SECTION 3: Description */}
        <div>
          <Label className="text-sm font-bold text-black uppercase tracking-wide mb-2 block">
            Description
          </Label>
          {/* Rich text editor with black toolbar */}
        </div>
        
        <div className="border-t border-black/10" />
        
        {/* SECTION 4: Tags */}
        <div>
          <Label className="text-sm font-bold text-black uppercase tracking-wide mb-2 block">
            Tags
          </Label>
          {/* Tags input and popular tags */}
        </div>
        
        <div className="border-t border-black/10" />
        
        {/* SECTION 5: Categories */}
        <div>
          <Label className="text-sm font-bold text-black uppercase tracking-wide mb-2 block">
            Categories
          </Label>
          {/* Category buttons */}
        </div>
        
        <div className="border-t border-black/10" />
        
        {/* SECTION 6: Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-bold text-black uppercase tracking-wide mb-2 block">
            Settings
          </Label>
          {/* Toggle switches with black/white styling */}
        </div>
        
      </div>
    </div>
  </div>
)}
```

**4. Remove Step 3 entirely (Lines 453-597):**
Delete the entire `{currentStep === 3 && (...)}` block.

**5. Update input/label styling throughout:**

| Element | Current | Target |
|---------|---------|--------|
| Labels | `text-base font-medium text-gray-900` | `text-sm font-bold text-black uppercase tracking-wide` |
| Inputs | `border-gray-200 focus:border-pink-500` | `border-black/10 focus:border-black` |
| Switches | `data-[state=checked]:bg-pink-500` | `data-[state=checked]:bg-black` |
| Category buttons active | `bg-pink-500 text-white` | `bg-black text-white` |
| Tag badges | `bg-pink-500` | `bg-black` |
| Popular tag hover | `hover:bg-pink-500` | `hover:bg-black` |

---

## Form Field Order (Final)

```text
1. Product Images (MultiImageUploader)
   ─────────────────────────────────
2. Name (Input)
3. Price (Input with $ prefix) | Stock (Input)
   ─────────────────────────────────
4. Description (Rich text editor with black toolbar)
   ─────────────────────────────────
5. Tags (Input + popular tag buttons)
   ─────────────────────────────────
6. Categories (Toggle buttons)
   ─────────────────────────────────
7. Settings
   • Available for purchase (Switch)
   • Allow chat (Switch)
   • Require email (Switch)
```

---

## Summary of Changes

| Change | Description |
|--------|-------------|
| Steps reduced | 3 steps → 2 steps |
| Images position | Moved to top of Step 2 (first field) |
| Form layout | All fields in single step with clear section dividers |
| Color scheme | Pink accents → Black/white base |
| Labels | Uppercase, bold, black text |
| Inputs | Black border on focus instead of pink |
| Section dividers | `border-t border-black/10` between sections |

---

## Visual Preview

**Before (3 steps, pink accents):**
```text
Step 2: Name → Price → Description → Categories
Step 3: Images → Tags → Settings
```

**After (2 steps, black/white base):**
```text
Step 2: 
  ┌─ PRODUCT IMAGES ──────────────────────┐
  │  [Image grid with upload]             │
  └───────────────────────────────────────┘
  ─────────────────────────────────────────
  ┌─ NAME ────────────────────────────────┐
  │  [Input field]                        │
  └───────────────────────────────────────┘
  ┌─ PRICE ──────────┬─ STOCK ────────────┐
  │  [$ Input]       │  [Input]           │
  └──────────────────┴────────────────────┘
  ─────────────────────────────────────────
  ┌─ DESCRIPTION ─────────────────────────┐
  │  [Black toolbar]                      │
  │  [Rich text area]                     │
  └───────────────────────────────────────┘
  ─────────────────────────────────────────
  ... Tags, Categories, Settings
```

This creates a cleaner, more efficient workflow with everything visible in one scrollable step, using a consistent black/white design language.

