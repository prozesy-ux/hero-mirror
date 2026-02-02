

# Buyer Dashboard Sidebar - White Base Design (Mirror Seller Sidebar)

## Overview

Apply the exact same design from SellerSidebar to DashboardSidebar (Buyer), but with a **white base** instead of black. Same borders, underlines, fonts, icon wrappers, spacing, and structure.

---

## Current vs Target Comparison

| Element | Seller (Target Pattern) | Buyer (Current) | Fix Required |
|---------|------------------------|-----------------|--------------|
| **Background** | `bg-black` | `bg-black` | Change to `bg-white` |
| **Width collapsed** | `w-[72px]` | `w-[72px]` | OK |
| **Width expanded** | `w-64` | `w-[240px]` | Change to `w-64` |
| **Logo section padding** | `py-6 px-6` with `border-b border-gray-800` | `h-14 px-5` with `border-b border-white/10` | Change to `py-6 px-6` with `border-b border-gray-200` |
| **Logo font** | `text-2xl font-bold tracking-tight` (lowercase "uptoza") | `text-4xl font-sans font-extrabold` (uppercase "UPTOZA") | Match seller: `text-2xl font-bold tracking-tight`, lowercase |
| **Nav item padding** | `px-4 py-3` | `px-5 py-3` | Change to `px-4 py-3` |
| **Nav item border** | `border-b border-gray-800` | No border | Add `border-b border-gray-200` |
| **Nav item font** | `text-sm font-medium` | `text-[15px] font-medium` | Change to `text-sm font-medium` |
| **Icon wrapper** | `<span className="w-5 h-5 flex items-center justify-center">` | Direct `<Icon>` | Add icon wrapper span |
| **Active color** | `text-[#FF90E8]` | `text-[#FF90E8]` | OK (keep pink) |
| **Inactive color** | `text-white hover:bg-gray-800` | `text-white/80 hover:text-white` | Change to `text-gray-700 hover:bg-gray-100` |
| **Bottom border** | `border-t border-gray-800` | `border-t border-white/10` | Change to `border-t border-gray-200` |
| **User profile border** | `border-t border-gray-800` | `border-t border-white/10` | Change to `border-t border-gray-200` |
| **Collapsed icon size** | `size={18}` | `size={20}` | Change to `size={18}` |
| **Expanded icon size** | `size={18}` | `size={20}` | Change to `size={18}` |
| **Tooltip style** | `bg-white text-black` | `bg-white text-black` | OK |
| **Nav wrapper padding** | `py-4` | `py-4` | OK |

---

## White Base Color Mappings

| Seller (Black Base) | Buyer (White Base) |
|--------------------|--------------------|
| `bg-black` | `bg-white` |
| `border-gray-800` | `border-gray-200` |
| `text-white` | `text-gray-900` |
| `text-white/80` | `text-gray-700` |
| `text-white/60` | `text-gray-500` |
| `text-white/50` | `text-gray-400` |
| `hover:bg-gray-800` | `hover:bg-gray-100` |
| `hover:bg-white/5` | `hover:bg-gray-50` |
| `ring-white/20` | `ring-gray-200` |
| `bg-white/10` | `bg-gray-100` |
| `text-[#FF90E8]` (active) | `text-[#FF90E8]` (keep pink for consistency) |

---

## Code Changes Required

### File: `src/components/dashboard/DashboardSidebar.tsx`

**1. Sidebar Container (Line 71):**
```tsx
// FROM:
<aside className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-50 bg-black transition-all duration-300 ${isCollapsed ? 'w-[72px]' : 'w-[240px]'}`}>

// TO:
<aside className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-[72px]' : 'w-64'}`}>
```

**2. Logo Section (Lines 73-81):**
```tsx
// FROM:
<div className={`h-14 flex items-center border-b border-white/10 ${isCollapsed ? 'justify-center px-3' : 'px-5'}`}>
  <span className="text-white tracking-tight text-4xl font-sans font-extrabold">UPTOZA</span>

// TO:
<div className={`py-6 flex items-center border-b border-gray-200 ${isCollapsed ? 'justify-center px-3' : 'px-6'}`}>
  <span className="text-gray-900 text-2xl font-bold tracking-tight">uptoza</span>
```

**3. Nav Items Collapsed (Lines 92-98):**
```tsx
// FROM:
<Link className={`flex items-center justify-center w-full py-3 transition-colors ${
  active ? 'text-[#FF90E8]' : 'text-white/80 hover:text-white'
}`}>
  <Icon size={20} strokeWidth={2} />

// TO:
<Link className={`flex items-center justify-center w-full py-3 transition-colors border-b border-gray-200 ${
  active ? 'text-[#FF90E8]' : 'text-gray-700 hover:bg-gray-100'
}`}>
  <Icon size={18} strokeWidth={2} />
```

**4. Nav Items Expanded (Lines 108-118):**
```tsx
// FROM:
<Link className={`flex items-center gap-3.5 px-5 py-3 text-[15px] font-medium transition-colors ${
  active ? 'text-[#FF90E8]' : 'text-white/80 hover:text-white'
}`}>
  <Icon size={20} strokeWidth={2} />
  <span>{item.label}</span>

// TO:
<Link className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-gray-200 ${
  active ? 'text-[#FF90E8]' : 'text-gray-700 hover:bg-gray-100'
}`}>
  <span className="w-5 h-5 flex items-center justify-center">
    <Icon size={18} strokeWidth={2} />
  </span>
  <span>{item.label}</span>
```

**5. Bottom Section Border (Line 123):**
```tsx
// FROM:
<div className="border-t border-white/10 py-3">

// TO:
<div className="border-t border-gray-200 py-3">
```

**6. Bottom Nav Items (Lines 134-157):**
Apply same changes as main nav items (border-b, icon wrapper, colors).

**7. Collapse Toggle (Lines 162-176):**
```tsx
// FROM:
<button className={`... text-white/50 hover:text-white ...`}>

// TO:
<button className={`... text-gray-400 hover:text-gray-700 ...`}>
```

**8. User Profile Section (Lines 179-201):**
```tsx
// FROM:
<div className={`mt-2 pt-3 border-t border-white/10 ...`}>
  <Link className={`... hover:bg-white/5 ...`}>
    <Avatar className="... ring-1 ring-white/20">
      <AvatarFallback className="bg-white/10 text-white ...">
    <p className="text-sm text-white font-medium ...">
    <ChevronDown className="... text-white/50 ...">

// TO:
<div className={`mt-2 pt-3 border-t border-gray-200 ...`}>
  <Link className={`... hover:bg-gray-50 ...`}>
    <Avatar className="... ring-1 ring-gray-200">
      <AvatarFallback className="bg-gray-100 text-gray-700 ...">
    <p className="text-sm text-gray-900 font-medium ...">
    <ChevronDown className="... text-gray-400 ...">
```

---

## Summary

| Element | Change |
|---------|--------|
| Background | `bg-black` -> `bg-white border-r border-gray-200` |
| Width | `w-[240px]` -> `w-64` |
| Logo | Uppercase 4xl -> lowercase 2xl, `text-gray-900`, `tracking-tight` |
| Logo section | `h-14` -> `py-6`, add `border-b border-gray-200` |
| All borders | `border-white/10` or `border-gray-800` -> `border-gray-200` |
| Nav padding | `px-5` -> `px-4`, add `border-b border-gray-200` |
| Nav font | `text-[15px]` -> `text-sm` |
| Icon wrapper | Add `<span className="w-5 h-5 flex items-center justify-center">` |
| Icon size | `size={20}` -> `size={18}` |
| Text colors | `text-white/80` -> `text-gray-700` |
| Hover states | `hover:text-white` -> `hover:bg-gray-100` |
| Active color | Keep `text-[#FF90E8]` (pink) |

This creates a perfect **white-base mirror** of the Seller sidebar design.

