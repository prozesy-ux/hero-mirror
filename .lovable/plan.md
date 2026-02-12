

## Unify All Dashboard Sections to Same Clean Design Style (Skip Billing)

### Overview
Multiple dashboard sections across Buyer and Seller dashboards still use inconsistent styling -- neobrutalism hover shadows (`hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`), pink accent colors (`#FF90E8`), thick black borders (`border-black`), and varied card shapes (`rounded-2xl border-slate-100`). This plan standardizes everything to the clean EzMart dashboard style: `bg-white border rounded`, no neobrutalism, consistent padding and typography.

### Target Design Standard
- **Stat cards**: `bg-white border rounded p-8` (no hover shadow effects)
- **Chart/content containers**: `bg-white border rounded p-6` (no hover shadow effects)
- **Tables**: `bg-white border rounded overflow-hidden` (no hover shadow)
- **Buttons (primary action)**: `bg-emerald-500 hover:bg-emerald-600 rounded-xl` (replace pink `#FF90E8`)
- **Active tabs/pills**: `bg-slate-900 text-white` (replace `bg-[#FF90E8] text-black border border-black`)
- **Filter inputs**: `border-slate-200 rounded-xl` (replace `border-black`)
- **Order/item cards**: `bg-white border rounded p-4` with `hover:shadow-sm` (replace neobrutalism shadow)
- **Buttons in modals**: Clean slate/emerald styles instead of pink with black borders
- **Font**: Inter family, text-4xl font-semibold for stat values, text-base for labels

### Files to Update (10 files, skip Billing)

---

**1. `src/components/dashboard/BuyerOrders.tsx`** (774 lines)
- Line 432: Input `border-black` to `border-slate-200`
- Line 439: Date button `border-black hover:shadow-[2px_2px...]` to `border-slate-200 rounded-xl`
- Line 452: Active preset `bg-[#FF90E8] text-black border border-black` to `bg-slate-900 text-white`
- Line 467: Custom preset same pink-to-slate fix
- Line 489: Sort select `border-black` to `border-slate-200 rounded-xl`
- Line 524: Status tab active `bg-[#FF90E8] text-black border border-black` to `bg-slate-900 text-white`
- Line 554: Order card `hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` to `hover:shadow-sm`

---

**2. `src/components/dashboard/BuyerWallet.tsx`** (1717 lines)
- Line 778: Active tab `bg-[#FF90E8] text-black border border-black` to `bg-slate-900 text-white`
- Line 811: Withdraw button `bg-[#FF90E8] border border-black hover:shadow-[4px_4px...]` to `bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl`
- Line 963: Add account dashed border `border-2 border-dashed border-black` to `border-2 border-dashed border-slate-300`
- Line 965: Plus icon circle `bg-[#FF90E8]` to `bg-emerald-100`
- Line 1121: Withdrawal card `hover:shadow-[4px_4px...]` to `hover:shadow-sm`
- Line 1175-1178: Amount preset buttons pink-to-emerald active state
- Line 1255: Withdraw submit button pink-to-emerald
- Line 1273: OTP modal icon `bg-[#FF90E8] border border-black` to `bg-emerald-100`
- Line 1301: Verify OTP button pink-to-emerald
- Line 1358: Add account icon `bg-[#FF90E8] border border-black` to `bg-emerald-100`
- Line 1373: Step number circle `bg-[#FF90E8]` to `bg-emerald-500 text-white`
- Line 1384: Country card `hover:border-black hover:shadow-[2px_2px...]` to `hover:border-emerald-400 hover:shadow-sm`
- Line 1682: Add account submit button pink-to-emerald

---

**3. `src/components/dashboard/ProfileSection.tsx`** (1095 lines)
- Line 669: Sheet border `border-black` to `border-slate-200`
- Line 677: Upload button `border border-black hover:shadow-[4px_4px...]` to `border-slate-200 hover:shadow-sm`
- Line 692: Back button `border border-black hover:shadow-[2px_2px...]` to `border-slate-200 hover:shadow-sm`
- Line 705: Input `border-black focus:ring-[#FF90E8]` to `border-slate-200 focus:ring-emerald-500/50`
- Line 711: Save name button `bg-[#FF90E8] text-black border border-black hover:shadow-[4px_4px...]` to `bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl`
- Line 907: Change password button same pink-to-emerald fix
- Line 959-960: Session card `hover:shadow-[4px_4px...] border-black` to `hover:shadow-sm border-slate-200`
- Line 975: "Current" badge `bg-[#FF90E8] text-black border border-black` to `bg-emerald-100 text-emerald-700`
- Lines 1014, 1046, 1058, 1071: Various containers `border border-black` to `border border-slate-200`

---

**4. `src/components/seller/SellerPerformance.tsx`** (308 lines)
- Lines 186, 196, 204, 212: 4 stat cards -- remove `hover:shadow-[4px_4px...]`
- Lines 223, 253: Chart containers -- remove `hover:shadow-[4px_4px...]`
- Line 282: Stats summary container -- remove `hover:shadow-[4px_4px...]`

---

**5. `src/components/seller/SellerMarketing.tsx`** (425 lines)
- Lines 321, 328, 335: 3 stat cards -- remove `hover:shadow-[4px_4px...]`
- Line 344: Table container -- remove `hover:shadow-[4px_4px...]`

---

**6. `src/components/seller/SellerSupport.tsx`** (626 lines)
- Line 457: Chat card -- remove `hover:shadow-[4px_4px...]`

---

**7. `src/components/seller/SellerFeatureRequests.tsx`**
- Line 153: Submit form card `border-2 border-black shadow-neobrutalism` to `border rounded`
- Line 231: Requests list card `border-2 border-black shadow-neobrutalism` to `border rounded`

---

**8. `src/components/seller/SellerWallet.tsx`** (1564 lines)
- Same pattern as BuyerWallet: replace all `#FF90E8` with emerald, remove `border-black`, remove neobrutalism hover shadows

---

**9. `src/components/profile/MenuListItem.tsx`**
- Line 36: Remove `hover:shadow-[4px_4px...]`

---

**10. `src/components/dashboard/BuyerWishlist.tsx`** (203 lines)
- Line 113: Empty state `rounded-2xl border border-slate-100` to `border rounded`
- Line 128: Wishlist card `rounded-2xl border border-slate-100 shadow-sm hover:shadow-md` to `border rounded hover:shadow-sm`

---

### Skipped Files (No Changes Needed)
- `BillingSection.tsx` -- explicitly skipped per user request
- `SellerOrders.tsx` -- already uses clean `border rounded` card style  
- `SellerCustomers.tsx` -- already clean style
- `SellerReports.tsx` -- already clean style
- `BuyerReports.tsx` -- already clean style
- `BuyerNotifications.tsx` -- already clean style
- `BuyerAnalytics.tsx` -- recently unified
- `SellerAnalytics.tsx` -- recently unified
- `SellerFlashSales.tsx` -- already uses clean `border rounded` cards

### Summary
- **10 files** updated
- All neobrutalism hover shadows removed
- All pink `#FF90E8` accent colors replaced with emerald green
- All `border-black` replaced with `border-slate-200`
- All `rounded-2xl border-slate-100` normalized to `border rounded`
- Consistent card/container styling across every dashboard section

