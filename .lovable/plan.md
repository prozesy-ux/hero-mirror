

## Fix Monthly Target Gauge Rendering

### Problem
The gauge arc has visible orange "blobs" at both endpoints that stick out awkwardly from the grey track. This is caused by:
- `strokeLinecap="round"` on a very thick stroke (width 10) adds large rounded extensions at both ends of the orange arc
- The background grey track does NOT use round caps, so the orange endpoints visually protrude
- The stroke width is too thick relative to the SVG viewBox, amplifying the cap overshoot

### Fix (File: `src/components/dashboard/EzMartDashboardGrid.tsx`)

**1. Remove round linecaps from the progress arc**
- Change `strokeLinecap="round"` to `strokeLinecap="butt"` on the orange progress path so it aligns flush with the grey background track

**2. Reduce stroke width for a cleaner look**
- Reduce `strokeWidth` from `"10"` to `"8"` on both the background and progress arcs -- this gives the gauge a sleeker appearance and prevents the thick stroke from overflowing the viewBox

**3. Adjust the arc radius and center for better proportions**
- Update the background path from `M 10 50 A 40 40 0 0 1 90 50` to `M 12 50 A 38 38 0 0 1 88 50` to give slightly more breathing room at the edges
- Update radius from 40 to 38, and adjust cx/startX accordingly in the JS calculation so the progress arc matches

**4. Widen the viewBox slightly**
- Change viewBox to `"0 0 100 60"` to ensure nothing clips at the top with the adjusted geometry

These changes apply to the shared component so both Buyer and Seller dashboards are fixed.

