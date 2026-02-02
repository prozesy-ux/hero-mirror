

# Exact Gumroad Reference Code Implementation

## Line-by-Line Comparison

I've analyzed your reference code file against the current implementation. Here are ALL the exact differences:

---

## 1. SIDEBAR - Reference Code vs Current

### Reference SidebarItem (Line 34-38):
```tsx
<div className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-800 ${active ? 'text-[#ff90e8]' : 'text-white hover:bg-gray-800'}`}>
  <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
  <span className="text-sm font-medium">{label}</span>
</div>
```

### Current SellerSidebar (Line 88-100):
```tsx
<Link className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
  active ? 'text-[#FF90E8]' : 'text-white/70 hover:text-white'
}`}>
  <Icon size={18} strokeWidth={2} />
  <span>{item.label}</span>
</Link>
```

| Element | Reference Code | Current Code | Fix |
|---------|---------------|--------------|-----|
| Padding | `px-4 py-3` | `px-6 py-3` | Change to `px-4` |
| Border | `border-b border-gray-800` | No border | **Add border-b border-gray-800** |
| Inactive hover | `hover:bg-gray-800` | `hover:text-white` | Change to `hover:bg-gray-800` |
| Inactive color | `text-white` | `text-white/70` | Change to `text-white` |
| Icon wrapper | `<span className="w-5 h-5">` | Direct `<Icon size={18}>` | Add span wrapper |

### Reference Logo Section (Line 74-76):
```tsx
<div className="p-6 border-b border-gray-800">
  <h1 className="text-white text-2xl font-bold tracking-tight">gumroad</h1>
</div>
```

### Current Logo Section (Line 112):
```tsx
<div className={`py-6 flex items-center ${isCollapsed ? 'justify-center px-3' : 'px-6'}`}>
```

| Element | Reference Code | Current Code | Fix |
|---------|---------------|--------------|-----|
| Padding | `p-6` | `py-6 px-6` | Keep px-6 (same) |
| Border | `border-b border-gray-800` | No border | **Add border-b border-gray-800** |
| Logo tracking | `tracking-tight` | No tracking | Add `tracking-tight` |

### Reference Bottom Section (Line 95-98):
```tsx
<div className="mt-auto border-t border-gray-800">
  <SidebarItem icon={<Settings />} label="Settings" />
  <SidebarItem icon={<HelpCircle />} label="Help" />
</div>
```

### Current Bottom Section (Line 195):
```tsx
<div className="border-t border-white/10 py-3">
```

| Element | Reference Code | Current Code | Fix |
|---------|---------------|--------------|-----|
| Border color | `border-gray-800` | `border-white/10` | Change to `border-gray-800` |

---

## 2. PRODUCT CARDS - Reference Code vs Current

### Reference ProductTypeCard (Line 50-63):
```tsx
<div className={`
  p-4 border-2 rounded-md transition-all cursor-pointer flex flex-col gap-4 h-full
  ${selected ? 'border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white' : 'border-gray-300 hover:border-black bg-white'}
  ${disabled ? 'opacity-40 grayscale cursor-not-allowed border-gray-200' : ''}
`}>
  <div className={`w-10 h-10 rounded-md flex items-center justify-center border-2 border-black ${colorClass} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
    {icon}
  </div>
  <div>
    <h3 className="font-bold text-sm mb-1">{title}</h3>
    <p className="text-xs text-gray-600 leading-tight">{description}</p>
  </div>
</div>
```

### Current ProductTypeSelector Card (Line 66-92):
```tsx
<button className={cn(
  "flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all bg-white",
  isSelected ? "border-black" : "border-gray-200 hover:border-gray-300"
)}>
  <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: type.bgColor }}>
    <Icon className="w-5 h-5" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="font-medium text-gray-900 text-sm leading-tight">{type.name}</p>
    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{type.description}</p>
  </div>
</button>
```

| Element | Reference Code | Current Code | Fix |
|---------|---------------|--------------|-----|
| **Layout** | `flex flex-col gap-4` | `flex items-start gap-3` | **Change to flex-col** |
| **Padding** | `p-4` | `p-3` | Change to `p-4` |
| **Border radius** | `rounded-md` | `rounded-lg` | Change to `rounded-md` |
| **Selected shadow** | `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` | No shadow | **Add neobrutalism shadow** |
| **Unselected border** | `border-gray-300` | `border-gray-200` | Change to `border-gray-300` |
| **Icon container size** | `w-10 h-10` | `w-12 h-12` | Change to `w-10 h-10` |
| **Icon border** | `border-2 border-black` | No border | **Add border-2 border-black** |
| **Icon shadow** | `shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]` | No shadow | **Add neobrutalism shadow** |
| **Icon border radius** | `rounded-md` | `rounded-lg` | Change to `rounded-md` |
| **Title font** | `font-bold` | `font-medium` | Change to `font-bold` |
| **Title margin** | `mb-1` | `mt-1` on description | Change structure |
| **Description color** | `text-gray-600` | `text-gray-500` | Change to `text-gray-600` |

---

## Files to Modify

### File 1: `src/components/seller/SellerSidebar.tsx`

**Changes:**
1. Add `border-b border-gray-800` to each nav item
2. Change padding from `px-6` to `px-4`
3. Change inactive color from `text-white/70` to `text-white`
4. Change hover from `hover:text-white` to `hover:bg-gray-800`
5. Add `border-b border-gray-800` to logo section
6. Add `tracking-tight` to logo text
7. Change bottom border from `border-white/10` to `border-gray-800`

### File 2: `src/components/seller/ProductTypeSelector.tsx`

**Changes:**
1. Change card layout from horizontal `flex items-start gap-3` to vertical `flex flex-col gap-4`
2. Change padding from `p-3` to `p-4`
3. Change border radius from `rounded-lg` to `rounded-md`
4. Add neobrutalism shadow on selected: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
5. Change unselected border from `border-gray-200` to `border-gray-300`
6. Change icon container from `w-12 h-12 rounded-lg` to `w-10 h-10 rounded-md`
7. Add icon container border: `border-2 border-black`
8. Add icon container shadow: `shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`
9. Change title from `font-medium` to `font-bold`
10. Add `mb-1` to title, remove `mt-1` from description
11. Change description color from `text-gray-500` to `text-gray-600`

---

## Summary

| File | Key Changes |
|------|-------------|
| `SellerSidebar.tsx` | Nav items: `px-4`, `border-b border-gray-800`, `text-white`, `hover:bg-gray-800`. Logo: add `border-b border-gray-800`, `tracking-tight`. Bottom: `border-gray-800` |
| `ProductTypeSelector.tsx` | Cards: `flex-col gap-4`, `p-4`, `rounded-md`, neobrutalism shadows, `border-gray-300`, icon `w-10 h-10 rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`, `font-bold` title, `text-gray-600` description |

Total: 2 files to modify with exact reference code styling

