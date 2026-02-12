

## Fix: Floating Label Overlapping Placeholder in Digital Wallet Input Fields

### Problem
In the "Add Payment Account" modal, the digital wallet number input (e.g., Nagad Number) shows both the floating label text AND the placeholder text ("01XXXXXXXXX") at the same time, causing them to overlap. This happens because the input uses `placeholder={selectedDigitalWallet.placeholder}` instead of `placeholder=" "` which the floating label CSS pattern requires.

### Root Cause
The floating label pattern uses CSS `peer-placeholder-shown` to detect if the input is empty. When a real placeholder like "01XXXXXXXXX" is set, the browser treats the field as "placeholder shown" even though text is visible, so the label drops down into the input area and overlaps with the placeholder.

### Fix (2 files)
Change the digital wallet input in both **BuyerWallet.tsx** and **SellerWallet.tsx** to use `placeholder=" "` (like all other inputs in the form), so the floating label works correctly. The placeholder hint ("01XXXXXXXXX") will be removed since the floating label already tells the user what to enter.

**Files to change:**
1. `src/components/dashboard/BuyerWallet.tsx` (line 1620): Change `placeholder={selectedDigitalWallet.placeholder}` to `placeholder=" "`
2. `src/components/seller/SellerWallet.tsx` (line 1389): Change `placeholder={selectedDigitalWallet.placeholder}` to `placeholder=" "`

This is a one-line fix in each file -- no other changes needed.

