
## Verify & Apply Font Styling from HTML Design to Dashboard

### Current Analysis

**What the HTML Code Uses (new-4.html):**
- **Font Family**: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Background**: `#f1f5f9` (already applied)
- **Typography Details**:
  - `.export-wrapper` and `.app-container`: 44-50px Inter font
  - `.stat-header`: 12px, uppercase, `var(--text-secondary)`
  - `.stat-value`: 24px, font-weight 600
  - `.card-title`: 15px, font-weight 600
  - `.time-filter`: 11px font size
  - `.substat-label`: 12px, `var(--text-secondary)`
  - All elements use Inter font globally

**Current Dashboard Status:**
- ✅ Background color `#f1f5f9` is applied to all 24 dashboard files
- ✅ Font "Inter" explicitly set in `src/pages/Dashboard.tsx` line 91
- ✅ Font "Inter" explicitly set in all 24 dashboard components via inline style
- ⚠️ **ISSUE**: Global `src/index.css` still imports DM Sans (lines 1-4) which may create font fallback conflicts
- ⚠️ **ISSUE**: Some dashboard components may not have consistent font weight scaling (12px, 15px, 24px specifications from HTML not fully verified)

### The Plan

**Step 1: Verify Font Inheritance Chain**
- Check if Inter font is properly inherited in ALL nested dashboard elements
- Verify no competing fonts from global CSS (DM Sans in index.css)
- Ensure font weights (400, 500, 600, 700, 800) are applied correctly

**Step 2: Apply Precise Typography Specs**
Review the HTML design's type hierarchy and apply to dashboard sections:
- **Stat cards**: 12px uppercase labels, 24px bold values, 40x40px icon boxes
- **Card titles**: 15px, 600 weight
- **Secondary text**: 12px with `#64748b` color
- **Time filters**: 11px, active state with `#3b82f6` background

**Step 3: Scope**
- ✅ **Only Dashboard sections** (buyer + seller dashboards)
- ✅ **Skip sidebar** (as per previous constraint)
- ✅ **Skip global CSS** (don't modify index.css broadly—may affect other pages)

**Step 4: Key Files to Audit**
1. `src/pages/Dashboard.tsx` - Verify wrapper has Inter + font weights
2. `src/pages/Seller.tsx` - Same verification
3. Dashboard sub-components: stat cards, cards, typography elements
4. Verify that no `DM Sans` is being applied via class names or Tailwind

**What Won't Change:**
- Background color `#f1f5f9` stays
- Sidebar styling untouched
- Data logic & backend
- Border colors, spacing, layout

### Deliverable
A complete audit showing:
1. **Font hierarchy matches HTML**: All text sizes, weights, and family names align
2. **No conflicting fonts**: Inter is the sole font for dashboard
3. **Consistent colors**: Text primary (`#0f172a`), secondary (`#64748b`), and accents
4. **All 24 dashboard files verified** for font consistency

