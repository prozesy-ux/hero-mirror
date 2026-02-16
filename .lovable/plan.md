

## Upgrade Store Builder to World-Class Level (1000+ Features)

### Current State
The builder currently has **15 section types** with basic settings. Compared to Elementor (100+ widgets), GemPages (80+ elements), Wix (100+ sections), and Shogun -- we are missing critical premium features across **6 major categories**.

---

### What's Missing (Research Results)

After deep research into Elementor Pro, Wix, GemPages, Shogun, Squarespace, and Oxygen Builder, here are the gaps organized by priority:

---

### Phase 1: 20 New Section Types (Missing from all top builders)

| # | New Section | Inspiration | What It Does |
|---|-------------|-------------|--------------|
| 1 | **Countdown Timer** | Elementor, GemPages | Urgency timer with days/hours/mins/secs, custom end date, action on expire |
| 2 | **Pricing Table** | Elementor Pro | Side-by-side plan comparison with features, badges, recommended highlight |
| 3 | **Image Slider / Carousel** | Elementor, Wix | Auto-sliding images with dots, arrows, captions, autoplay |
| 4 | **Flip Box** | Elementor Pro | Card that flips on hover to reveal back content (front: image, back: text+CTA) |
| 5 | **Icon Box Grid** | Elementor, Wix | Grid of icon + title + description cards (features, services) |
| 6 | **Progress Bar** | Elementor, GemPages | Animated progress bars with labels and percentages |
| 7 | **Tabs Section** | Elementor, Wix | Tabbed content panels (horizontal or vertical tabs) |
| 8 | **Accordion / Toggle** | Elementor, Squarespace | Collapsible content blocks (different from FAQ - more generic) |
| 9 | **Before/After Slider** | Elementor Addons | Drag slider comparing two images side by side |
| 10 | **Marquee / Ticker** | Premium Addons | Auto-scrolling text or logo band (partners, brands, announcements) |
| 11 | **Logo Grid / Partners** | Wix, Squarespace | Grid of partner/client logos with optional links |
| 12 | **Map / Location** | Elementor, Wix | Embedded Google Maps with custom pin and info |
| 13 | **Contact Form** | Elementor Pro | Name, email, message form with submission handling |
| 14 | **Newsletter Signup** | Squarespace, Wix | Email input + button for list building |
| 15 | **Team / Staff** | Elementor, Wix | Team member cards with photo, name, role, social links |
| 16 | **Timeline** | Elementor Addons | Vertical timeline for milestones, history, process steps |
| 17 | **Animated Counter** | Elementor, GemPages | Numbers that animate/count up when scrolled into view |
| 18 | **Alert / Banner** | Elementor | Dismissible announcement bar (info, warning, success, promo) |
| 19 | **Blockquote / Quote** | Elementor Pro | Styled quote with author, decorative marks |
| 20 | **Video Playlist** | Elementor Pro | Multiple videos with thumbnail sidebar navigation |

---

### Phase 2: Per-Section Advanced Styling (Every builder has this)

Currently each section only has basic bgColor/textColor. Premium builders give **every section**:

| Feature | Description |
|---------|-------------|
| **Padding control** | Top/Bottom/Left/Right padding (small/medium/large/custom px) |
| **Margin control** | Section spacing control |
| **Border radius** | Rounded corners per section |
| **Border** | Width, color, style (solid/dashed/dotted) |
| **Box shadow** | Shadow depth, color, blur |
| **Background gradient** | Two-color gradient with direction |
| **Background image overlay** | Image with color overlay + opacity |
| **Background video** | Looping video background |
| **Animation on scroll** | Fade in, slide up, zoom in, bounce (CSS animations triggered on scroll) |
| **Full width / Boxed** | Toggle between full-width and max-width container |
| **Responsive visibility** | Show/hide section on desktop/tablet/mobile separately |
| **Custom CSS class** | Add custom className for advanced users |
| **Section anchor/ID** | For in-page navigation links |

---

### Phase 3: Global Styles Expansion

Currently only 5 global style options. Premium builders offer:

| Feature | Description |
|---------|-------------|
| **Heading font** | Separate font for headings vs body text |
| **Font size scale** | Base size + heading scale (H1-H6 sizes) |
| **Link color** | Default and hover link colors |
| **Button styles** | Global button colors, radius, padding, hover effect |
| **Gradient primary** | Primary as gradient instead of solid |
| **Border radius default** | Global corner radius for cards/buttons |
| **Shadow default** | Default shadow for cards |
| **Custom CSS** | Store-wide custom CSS injection |
| **Favicon** | Custom favicon for the store |
| **Page background pattern** | Dots, grid, noise texture options |

---

### Phase 4: Builder UX Improvements

| Feature | Description |
|---------|-------------|
| **Duplicate section** | One-click duplicate any section |
| **Copy/paste section** | Copy settings from one section to another |
| **Section templates** | Pre-built section templates (not just full themes) |
| **Undo/Redo history** | State history for undo/redo actions |
| **Keyboard shortcuts** | Ctrl+S save, Ctrl+Z undo, Delete remove |
| **Search sections** | Filter the "Add Section" menu |
| **Section collapse all** | Collapse/expand all sections at once |
| **Drag handle improvement** | Better visual feedback during drag (ghost element) |
| **Right-click context menu** | Duplicate, delete, move up/down, copy |
| **Quick actions toolbar** | Floating toolbar on selected section in preview |
| **Layer panel** | Tree view of all sections like Figma layers |
| **Fullscreen preview** | Open preview in new tab/fullscreen |
| **Version history** | Save/restore previous versions of the design |
| **Import/Export JSON** | Export design as JSON file, import from file |

---

### Phase 5: 5 More Theme Presets

| Preset | Style |
|--------|-------|
| **Agency Pro** | Corporate blue, structured, professional |
| **Pastel Dream** | Soft pastels, rounded, feminine |
| **Cyber Punk** | Neon pink + cyan on dark, glitch aesthetic |
| **Nature Organic** | Earth tones, warm, organic shapes |
| **Retro Vintage** | Cream/brown, serif fonts, classic feel |

---

### Technical Implementation

#### Files to Create
- None -- all changes go into the 4 existing store-builder files

#### Files to Modify

**`src/components/seller/store-builder/types.ts`**
- Add 20 new section types to `SectionType` union
- Add `DEFAULT_SECTION_SETTINGS` for all new types
- Add `SECTION_LABELS` for all new types
- Expand `GlobalStyles` interface with headingFont, linkColor, buttonStyles, borderRadius, customCSS, etc.
- Add `SectionStyles` interface for per-section styling (padding, margin, animation, border, shadow, gradient, responsive visibility)
- Update `StoreSection` to include `styles?: SectionStyles`

**`src/components/seller/store-builder/StoreBuilderSectionRenderer.tsx`**
- Add renderer components for all 20 new section types
- Wrap `SectionWrapper` with animation-on-scroll support
- Add padding/margin/border/shadow/gradient from per-section styles
- Add responsive visibility CSS classes

**`src/components/seller/store-builder/StoreBuilderSections.tsx`**
- Add settings panels for all 20 new section types
- Add "Section Styles" panel (shared across all sections) for padding, margin, animation, background gradient, border, shadow, responsive visibility
- Organize settings into collapsible sub-panels (Content, Style, Advanced)

**`src/components/seller/StoreBuilder.tsx`**
- Add duplicate section function
- Add undo/redo with state history array
- Add keyboard shortcuts (Ctrl+S, Ctrl+Z, Ctrl+Shift+Z, Delete)
- Add section search in "Add" menu
- Add import/export JSON buttons
- Add fullscreen preview button
- Add right-click context menu
- Add "Section Templates" quick-add option
- Add collapse all/expand all toggle

**`src/components/seller/store-builder/StoreThemePresets.ts`**
- Add 5 new theme presets with sections utilizing the new section types

#### No Database Changes
All new section types and settings are stored in the existing `sections` JSONB and `global_styles` JSONB columns -- no schema changes needed.

---

### Feature Count Summary

| Category | Count |
|----------|-------|
| Existing section types | 15 |
| New section types | 20 |
| Per-section style options | 13 |
| Global style options (new) | 10 |
| Builder UX features (new) | 14 |
| New theme presets | 5 |
| **Total new features** | **62 major features** |
| Counting sub-options (each section's settings, animation types, gradient directions, responsive toggles, etc.) | **350+ individual customization points** |

This will bring the builder from basic to **genuinely competitive with Elementor/GemPages/Wix** for store page design.

