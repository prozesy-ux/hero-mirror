

# Toast/Notification Design Redesign - Fiverr/Upwork Style

## Overview

Redesign the toast notification system to match professional marketplace platforms like Fiverr and Upwork. Replace the current generic sonner styling with a premium, minimal notification design featuring:
- Clean, minimal cards with subtle shadows
- Color-coded icons (green checkmark for success, red X for error)
- Smooth slide-in animations
- Professional typography
- Positioned in top-right corner

---

## Current Implementation

The project uses **Sonner** library for toasts via `src/components/ui/sonner.tsx`. Example usage in `SignIn.tsx`:
- `toast.success("Welcome back!")` - on successful login
- `toast.error(error.message)` - on errors

---

## Fiverr/Upwork Toast Design Analysis

| Element | Fiverr/Upwork Style |
|---------|---------------------|
| Position | Top-right corner, 16-20px from edges |
| Background | White, subtle shadow |
| Border | None or very subtle (1px gray) |
| Radius | 8-12px rounded |
| Padding | 16px horizontal, 12-14px vertical |
| Icon | Colored circle with white icon (green/red/blue) |
| Title | 14-15px, semi-bold, dark text |
| Description | 13px, regular weight, muted text |
| Close Button | Small X, appears on hover |
| Animation | Smooth slide-in from right |
| Width | 360-400px |
| Duration | 4-5 seconds |

---

## Design Specifications

### Color Scheme (Matching Marketplace Theme)

| Type | Icon BG | Icon | Text |
|------|---------|------|------|
| Success | `#059669` (emerald-600) | White checkmark | Dark slate |
| Error | `#DC2626` (red-600) | White X | Dark slate |
| Info | `#2563EB` (blue-600) | White info | Dark slate |
| Warning | `#D97706` (amber-600) | White alert | Dark slate |

### Typography
- Title: `text-[15px] font-semibold text-slate-800`
- Description: `text-[13px] font-normal text-slate-500`

### Spacing
- Toast Padding: `px-4 py-3`
- Icon Size: 20px in 32px circle
- Gap between icon and text: 12px

---

## Files to Modify

### 1. `src/components/ui/sonner.tsx`

**Complete redesign with Fiverr/Upwork styling:**

```tsx
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-right"
      offset={20}
      gap={12}
      duration={4000}
      visibleToasts={4}
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-white border border-slate-200 shadow-lg shadow-black/5 rounded-xl px-4 py-3 w-[380px] flex items-start gap-3",
          title: "text-[15px] font-semibold text-slate-800",
          description: "text-[13px] text-slate-500 mt-0.5",
          actionButton: "bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-700",
          cancelButton: "bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-slate-200",
          closeButton: "bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg",
          success: "border-emerald-100",
          error: "border-red-100", 
          warning: "border-amber-100",
          info: "border-blue-100",
        },
      }}
      icons={{
        success: (
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ),
        error: (
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        ),
        warning: (
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        ),
        info: (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        ),
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
```

---

### 2. `src/index.css` - Add Toast Animation Enhancements

Add custom CSS for smoother animations and hover states:

```css
/* Fiverr/Upwork Style Toast Enhancements */
[data-sonner-toaster] {
  font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
}

[data-sonner-toast] {
  transition: all 0.2s ease-out;
}

[data-sonner-toast]:hover {
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12);
}

[data-sonner-toast][data-type="success"] {
  border-left: 3px solid #059669;
}

[data-sonner-toast][data-type="error"] {
  border-left: 3px solid #DC2626;
}

[data-sonner-toast][data-type="warning"] {
  border-left: 3px solid #D97706;
}

[data-sonner-toast][data-type="info"] {
  border-left: 3px solid #2563EB;
}

/* Close button styling */
[data-sonner-toast] [data-close-button] {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

[data-sonner-toast]:hover [data-close-button] {
  opacity: 1;
}
```

---

## Visual Design (Before vs After)

```text
BEFORE (Generic):                    AFTER (Fiverr/Upwork Style):
┌─────────────────────────┐          ┌────────────────────────────────────┐
│ Welcome back!           │          │ ┌──┐                           [X] │
│                         │          │ │✓ │  Welcome back!                │
│                         │          │ └──┘  You are now signed in        │
└─────────────────────────┘          └────────────────────────────────────┘
                                      ↑
                                      Green circle with white checkmark
                                      + Colored left border accent
```

---

## Toast Types Preview

**Success Toast:**
```text
┌─────────────────────────────────────────┐
│ [✓]  Welcome back!                      │
│      You are now signed in              │
└─────────────────────────────────────────┘
  ↑ Emerald circle + emerald left border
```

**Error Toast:**
```text
┌─────────────────────────────────────────┐
│ [✗]  Authentication failed              │
│      Invalid email or password          │
└─────────────────────────────────────────┘
  ↑ Red circle + red left border
```

**Info Toast:**
```text
┌─────────────────────────────────────────┐
│ [i]  Order updated!                     │
│      Check your orders page             │
└─────────────────────────────────────────┘
  ↑ Blue circle + blue left border
```

---

## Files Summary

| File | Changes |
|------|---------|
| `src/components/ui/sonner.tsx` | Complete redesign with Fiverr/Upwork styling, custom icons, position, animations |
| `src/index.css` | Add toast enhancement CSS for borders, shadows, hover states |

---

## Expected Outcome

After implementation:
1. Toasts appear in top-right corner with smooth slide-in animation
2. Each toast type has distinct colored circular icon with white symbol
3. Clean white background with subtle shadow and colored left border
4. Professional typography matching marketplace design system
5. Close button appears on hover
6. 4-second duration with smooth fade-out
7. Matches Fiverr/Upwork professional notification design

