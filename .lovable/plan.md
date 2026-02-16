

## Custom Store Design Builder for Sellers

### Overview
Add a **Store Builder** feature that lets sellers choose between the **Default** store layout or a **Custom Design** they build themselves. The custom builder uses a section-based drag-and-drop system where sellers can add, remove, reorder, and customize pre-built sections to create a unique storefront.

### How It Works

**Default vs Custom Toggle**: In Seller Settings, a new "Store Design" menu item lets sellers pick:
- **Default**: Current store layout (no changes)
- **Custom Builder**: Opens the visual store builder

**Section-Based Builder**: Sellers build their store by stacking customizable sections:

| Section Type | What It Does |
|---|---|
| Hero Banner | Full-width banner with heading, subheading, CTA button |
| Featured Products | Highlighted products grid (seller picks which ones) |
| Product Grid | All products with filters |
| About / Bio | Rich text about the seller with image |
| Testimonials | Customer reviews showcase |
| Video Embed | YouTube/custom video section |
| Image Gallery | Multi-image showcase |
| FAQ | Expandable questions and answers |
| Newsletter / CTA | Email capture or call-to-action |
| Social Links Bar | Social media links with icons |
| Stats Counter | Animated stats (sales, reviews, etc.) |
| Category Showcase | Browse by category cards |
| Trust Badges | Secure checkout, fast delivery badges |
| Divider / Spacer | Visual separator between sections |
| Custom HTML/Text | Free-form rich text block |

**Drag and Drop**: Sellers reorder sections by dragging them up/down in the builder sidebar.

**Per-Section Customization**: Each section has its own settings panel:
- Background color / gradient / image
- Text color and alignment
- Padding (small / medium / large)
- Visibility toggle (show/hide)
- Section-specific settings (e.g., number of columns for product grid, which products to feature)

**Live Preview**: Split-screen view -- builder panel on left, live preview on right (using ResizablePanel which is already installed).

**Theme Presets**: Quick-start templates sellers can pick and then customize:
- Minimal White
- Dark Elegant  
- Bold & Colorful
- Gumroad Classic
- Neon Glow

---

### Technical Plan

#### 1. Database: New `store_designs` Table

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| seller_id | uuid (FK to seller_profiles) | Owner |
| is_active | boolean | Whether custom design is live |
| theme_preset | text | Selected theme name |
| global_styles | jsonb | Font, colors, spacing globals |
| sections | jsonb | Array of section configs (type, order, settings) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

The `sections` JSONB stores an array like:
```json
[
  { "id": "sec_1", "type": "hero", "order": 0, "visible": true, "settings": { "heading": "Welcome", "bgColor": "#000", "bgImage": "...", "ctaText": "Shop Now" } },
  { "id": "sec_2", "type": "featured_products", "order": 1, "visible": true, "settings": { "title": "Best Sellers", "productIds": ["..."], "columns": 3 } },
  { "id": "sec_3", "type": "about", "order": 2, "visible": true, "settings": { "text": "...", "imageUrl": "..." } }
]
```

RLS: Sellers can only read/write their own designs. Public read for `is_active = true` designs (so the store page can load them).

#### 2. New Files

**`src/components/seller/StoreBuilder.tsx`** (Main builder page)
- Split-screen: builder panel (left) + live preview (right)
- Uses ResizablePanelGroup for the split view
- Section list with drag-and-drop reorder (using native HTML5 drag API -- no extra library needed)
- "Add Section" button with section type picker
- Auto-save to database

**`src/components/seller/StoreBuilderSections.tsx`** (Section settings panels)
- Individual settings form for each section type
- Color pickers, text inputs, product selectors, image uploaders
- Visibility toggle per section

**`src/components/seller/StoreBuilderPreview.tsx`** (Live preview renderer)
- Renders the section array into actual UI components
- Same components used by the public store page

**`src/components/seller/StoreBuilderSectionRenderer.tsx`** (Section rendering)
- Maps section type to actual React component
- Hero, ProductGrid, About, FAQ, etc.
- Reused by both the preview and the actual public store page

**`src/components/seller/StoreThemePresets.tsx`** (Theme picker)
- Grid of preset thumbnails
- Clicking one loads a pre-configured sections array

#### 3. Modified Files

**`src/components/seller/SellerSettings.tsx`**
- Add new "Store Design" menu item under the STORE section
- Opens sheet with Default/Custom toggle + "Open Builder" button

**`src/components/seller/SellerSidebar.tsx`**
- Add "Store Builder" nav item (links to `/seller/store-builder`)

**`src/pages/Seller.tsx`**
- Add route for `store-builder` section

**`src/pages/Store.tsx`**
- Check if seller has an active custom design (`store_designs.is_active = true`)
- If yes, render sections from the design config instead of the default layout
- If no, render the current default layout (no change)

**`supabase/functions/bff-store-public/index.ts`**
- Include `store_designs` data in the BFF response when `is_active = true`

#### 4. Drag and Drop Implementation
- Uses native HTML5 Drag and Drop API (no extra dependency)
- Each section in the sidebar is a draggable item
- Drop zones between sections for reordering
- Visual drag handle icon on each section card

#### 5. Section Settings Schema
Each section type has a typed settings interface:

```
HeroSettings: heading, subheading, bgColor, bgImage, ctaText, ctaLink, textAlign
ProductGridSettings: title, columns (2-4), showFilters, sortBy
FeaturedSettings: title, productIds[], columns
AboutSettings: text, imageUrl, imagePosition (left/right)
FAQSettings: items[]{question, answer}
VideoSettings: videoUrl, autoplay, title
GallerySettings: images[], columns
TestimonialsSettings: items[]{name, text, rating, avatar}
CTASettings: heading, subheading, buttonText, buttonLink, bgColor
StatsSettings: items[]{label, value, icon}
```

#### 6. Global Styles
Sellers can set store-wide defaults:
- Primary color
- Secondary color
- Font family (Inter, DM Sans, Raleway -- already installed)
- Background color
- Text color

---

### What Gets Built (Phase 1)
- Database table + RLS
- Store Builder page with drag-and-drop sections
- 10 section types (Hero, Featured Products, Product Grid, About, FAQ, Video, Gallery, Testimonials, CTA, Stats)
- 5 theme presets
- Live preview
- Public store page rendering custom designs
- BFF integration

### User Flow
1. Seller goes to Settings > Store Design
2. Toggles from "Default" to "Custom"
3. Picks a theme preset (or starts blank)
4. Adds/removes/reorders sections in the builder
5. Customizes each section's content and colors
6. Preview updates live on the right panel
7. Clicks "Publish" to make it live
8. Visitors to `/store/slug` see the custom design

