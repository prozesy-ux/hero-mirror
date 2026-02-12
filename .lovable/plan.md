

## Fix Monthly Target Gauge Layout (Both Dashboards)

### Problem
The Monthly Target gauge section has layout/overlay issues in both Buyer and Seller dashboards:
1. The SVG `viewBox="0 0 100 55"` clips the top of the arc stroke (stroke extends to y=5 but needs breathing room)
2. The percentage text at `position: absolute; bottom: 0px` sits awkwardly -- it can overlap with the arc on certain percentages
3. The container height (110px) doesn't match the SVG height (100px), causing misalignment between the gauge and the percentage text
4. The motivational text and Target/Revenue summary box are too close together

### Fix (Single File: `EzMartDashboardGrid.tsx`)

**Gauge SVG Adjustments:**
- Change `viewBox` from `"0 0 100 55"` to `"0 0 100 58"` to give the arc stroke room at the top
- Increase container height from `110px` to `120px` for proper vertical spacing
- Reposition percentage text to `bottom: 5px` so it sits cleanly inside the arc opening without overlapping the arc stroke

**Layout Spacing Fixes:**
- Add `marginBottom: '8px'` to the gauge container to separate it from the motivational text below
- Reduce `marginTop` on the Target/Revenue summary box from `16px` to `auto` so it pushes to the bottom of the card naturally
- Set `flex: 1` behavior so the card grows evenly with its grid neighbors

### Technical Detail

```
Before: viewBox="0 0 100 55", container 110px, text bottom:0px
After:  viewBox="0 0 100 58", container 120px, text bottom:5px
```

These changes apply to the shared `Dashboard_MonthlyTarget` component in `EzMartDashboardGrid.tsx`, so both Buyer and Seller dashboards are fixed automatically.

