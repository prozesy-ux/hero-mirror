

## Store Builder Mega Upgrade -- World-Class Features

### Current State (Already Built)
- 35 section types with full settings panels
- Drag-and-drop reorder, duplicate, visibility toggle
- Undo/Redo (50-state history), keyboard shortcuts (Ctrl+Z/S/Delete)
- Per-section advanced styling (padding, margin, border, shadow, gradient, 7 scroll animations, responsive visibility, custom CSS class, section anchors)
- Global styles (colors, fonts, heading font, link colors, button styles, border radius, background patterns, custom CSS injection)
- 10 theme presets, JSON import/export, auto-save, publish workflow
- Desktop/mobile preview toggle
- Section search with category grouping

### What's Missing (From Your List)

The upgrade adds **8 major feature groups** across builder UX, new components, and pro-level tools.

---

### 1. Navigator / Layer Panel (Structure Tree View)

A collapsible tree panel showing all sections like Figma's layer panel. Users can:
- See the full section hierarchy at a glance
- Click to select, drag to reorder
- Toggle visibility inline
- See which section is currently selected (highlighted)

**Implementation**: Add a toggle button in the toolbar that swaps the left panel between "Settings Mode" and "Navigator Mode".

---

### 2. Right-Click Context Menu

Right-clicking any section (in sidebar or preview) shows a context menu with:
- Duplicate
- Delete
- Move Up / Move Down
- Copy Settings
- Paste Settings
- Toggle Visibility

**Implementation**: Custom context menu component using Radix UI ContextMenu (already installed).

---

### 3. Version History (Snapshots)

A "Versions" panel that saves named snapshots of the entire design:
- Manual "Save Version" button with optional name
- Auto-snapshot before publishing
- List of saved versions with timestamps
- One-click restore to any version
- Stored in `store_designs` table as a new `version_history` JSONB column

**Database change**: Add `version_history jsonb default '[]'` column to `store_designs`.

---

### 4. Fullscreen Preview

A button that opens the store preview in a fullscreen overlay (no builder sidebar). Features:
- Full-width rendering
- Desktop/Tablet/Mobile toggle within fullscreen
- Close button to return to builder
- Shows exactly what the public store will look like

---

### 5. Section Templates Library

Pre-built section configurations that sellers can add with one click. Not full themes -- individual sections with polished content:
- "Sales Hero" (dark bg, countdown, bold CTA)
- "Product Showcase 3-col" (featured products with hover effects)
- "Trust Strip" (badges + stats in one row)
- "Video Testimonials" (video + testimonials side by side)
- "Pricing Comparison" (3-tier pricing with popular badge)
- "Newsletter Dark" (email capture with gradient)
- "FAQ Minimal" (clean accordion)
- "Team Grid" (photo cards with socials)
- 12 templates total across categories

**Implementation**: New `SECTION_TEMPLATES` constant array. "Add Section" menu gets a "Templates" tab alongside the current "Elements" tab.

---

### 6. Move Up / Move Down Quick Actions

Add up/down arrow buttons to each section card in the sidebar for quick reordering without drag-and-drop. Especially useful on mobile/tablet.

---

### 7. Copy / Paste Section Settings

- "Copy Settings" stores a section's settings + styles in a ref
- "Paste Settings" applies copied settings to any other section of the same type
- Visual indicator showing "Settings Copied" badge

---

### 8. Dark Mode Builder UI

Toggle between light and dark builder interface (sidebar + toolbar only -- preview stays as designed). Saved to localStorage.

---

### Technical Plan

#### Database Migration
```
ALTER TABLE store_designs ADD COLUMN IF NOT EXISTS version_history jsonb DEFAULT '[]';
```

#### Files Modified

**`src/components/seller/StoreBuilder.tsx`**
- Add Navigator panel mode toggle
- Add right-click context menu (using Radix ContextMenu)
- Add version history panel (save/restore snapshots)
- Add fullscreen preview overlay
- Add move up/down functions
- Add copy/paste settings logic
- Add dark mode toggle for builder UI
- Add section templates tab in "Add Section" menu

**`src/components/seller/store-builder/types.ts`**
- Add `SectionTemplate` interface
- Add `SECTION_TEMPLATES` constant array (12 templates)

**`src/components/seller/store-builder/StoreBuilderSectionRenderer.tsx`**
- No structural changes needed (renderers already complete)

**`src/components/seller/store-builder/StoreBuilderSections.tsx`**
- No structural changes needed (settings panels already complete)

#### No New Files
All changes go into existing files to keep the architecture clean.

---

### Feature Count After Upgrade

| Category | Before | After |
|----------|--------|-------|
| Section types | 35 | 35 (already comprehensive) |
| Builder UX features | 8 | 16 (+8 new) |
| Section templates | 0 | 12 |
| Theme presets | 10 | 10 |
| Per-section style options | 13 | 13 |
| Global style options | 12 | 13 (+dark mode) |
| Version snapshots | 0 | Unlimited |

### What This Does NOT Include (And Why)

These items from your list are either already handled by the existing platform or require fundamentally different architecture:

- **Products/Variants/Inventory/Payments/Shipping/Tax**: Already built into the seller dashboard, not the store builder. The builder renders product data from the existing `seller_products` table.
- **Nested containers / unlimited depth / absolute positioning**: This requires a block-level editor (like Gutenberg or GrapesJS), not a section-based builder. Our section-based approach is intentionally simpler and faster -- similar to how Shopify's Online Store 2.0 works vs Elementor's block editor.
- **Multi-store / Multi-language / A/B testing / Heatmaps / AI layout generator**: These are platform-level features that require their own dedicated systems, not store builder additions.
- **Headless mode / API access / Webhooks**: Already available through the BFF architecture and edge functions.
- **Custom JS per page / Global JS manager**: Security risk in a multi-tenant platform. Custom CSS is supported instead.

