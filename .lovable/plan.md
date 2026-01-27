
Goal
- Fix “Available Withdrawal Methods” so:
  1) Default country preview always shows correctly (Buyer + Seller)
  2) Switching country shows that country’s withdrawal methods (Buyer + Seller)
  3) Preview includes GLOBAL methods (if your admin config uses GLOBAL rows)
  4) Preview image sizing matches Billing → “Available Payment Methods” (h-8 w-auto)

What’s causing the bug (based on the code + your diff)
- The dropdown now lets users choose ANY country (from COUNTRY_CONFIG), but the data loaded into `withdrawalMethods` is not guaranteed to contain methods for those countries.
  - SellerWallet currently fetches only `[sellerCountry, 'GLOBAL']`. So if you select another country, `displayMethods` will be empty.
  - BuyerWallet gets `withdrawalMethods` from `bffApi.getBuyerWallet()` and it appears to be scoped to the user’s country (same outcome: switching to other countries shows nothing).
- The preview filter currently uses:
  - `withdrawalMethods.filter(m => m.country_code === selectedCountry)`
  This excludes GLOBAL methods (which are supposed to apply everywhere), so you can end up seeing only 1 method (or none).

High-confidence fixes
A) Load “all enabled withdrawal methods” for preview (or cache per-country)
- Buyer + Seller wallet should have access to enabled withdrawal methods for any country if we want the dropdown to preview any country.
- Implementation approach (recommended for reliability):
  - Fetch all enabled rows from `withdrawal_method_config` (ordered), store in state.
  - Use the dropdown country purely as a filter over that already-fetched dataset.
  - Keep realtime subscription so any admin changes instantly update wallets.

B) Fix filtering to include GLOBAL
- When previewing country “BD”, display should include:
  - rows where `country_code === 'BD'` OR `country_code === 'GLOBAL'`
- This solves “only one preview method” when most methods are configured as GLOBAL in admin.

C) Make Seller default preview consistent
- Ensure the seller wallet sets preview country from sellerCountry and fetches withdrawal methods after sellerCountry is known.
- With approach (A), default preview will work even if sellerCountry arrives later, because we will:
  - set previewCountry in an effect when sellerCountry is loaded
  - compute display methods using `previewCountry || sellerCountry`
  - and withdrawal methods data is global (not limited to sellerCountry only)

D) Image size
- Confirm preview uses: `className="h-8 w-auto object-contain"`
- Ensure the wrapper layout mirrors BillingSection style (spacing/alignment). If needed:
  - add `mx-auto` to match Billing’s centered behavior, and keep consistent padding.

Files to update
1) src/components/dashboard/BuyerWallet.tsx
Changes:
- Add a dedicated fetch function for withdrawal method config:
  - Query `withdrawal_method_config`
  - Filter `is_enabled = true`
  - Order for consistency
  - Store in `withdrawalMethods` (or new state `allWithdrawalMethods` if we want to keep the BFF-returned methods separate)
- Stop relying on the BFF payload for cross-country preview.
  - Keep BFF for wallet balance/withdrawals.
  - Use DB query for “Available Withdrawal Methods” + Add Account logo merge.
- Update `displayMethods` filter to include GLOBAL:
  - `m.country_code === filterCountry || m.country_code === 'GLOBAL'`
- Ensure realtime subscription triggers the new withdrawal-method fetch (not only `fetchData()`).
  - Currently BuyerWallet’s realtime for withdrawal_method_config calls `fetchData()` which likely won’t refresh other-country methods.
  - We will update it to call the new `fetchWithdrawalMethods()` (and keep `fetchData()` for wallet/withdrawals).

2) src/components/seller/SellerWallet.tsx
Changes:
- Replace current `fetchWithdrawalMethods()` query:
  - From: `.in('country_code', [sellerCountry, 'GLOBAL'])`
  - To: fetch all enabled methods (or implement a cache keyed by country)
- Update `displayMethods` filter to include GLOBAL (same as Buyer).
- Ensure the realtime channel for withdrawal_method_config calls the correct fetch method.
- Keep existing “sync previewCountry with sellerCountry” effect, but make sure withdrawal methods fetch runs regardless of sellerCountry value.

Implementation detail (technical)
- Add shared logic inside each wallet component:
  - `const fetchWithdrawalMethodConfig = useCallback(async () => { ... })`
  - Called:
    - on initial load
    - on realtime config changes
    - optionally after profile country load (seller) though not required if we fetch all
- Update filters:
  - displayMethods uses:
    - filterCountry = previewCountry || userCountry/sellerCountry
    - return methods where country matches OR GLOBAL

Edge cases to handle
- If a user selects a country with no methods and no GLOBAL methods, show “No withdrawal methods available for this region.”
- If method has `custom_logo_url` broken, fallback should show brand-colored letter (already implemented in the preview card).
- If admin disables all methods for a country, preview should show empty state.

How we’ll verify (quick checklist)
- Buyer wallet:
  - On first load, default country preview shows multiple logos (country + GLOBAL).
  - Switching to IN/PK/US shows correct methods immediately (no refresh needed).
- Seller wallet:
  - On first load, default country preview shows same behavior as buyer.
  - Switching countries works.
- Confirm preview logo size matches BillingSection payment method images (h-8 w-auto). If needed, add `mx-auto` to align perfectly.

Notes about “database fault”
- This issue is not a database problem; it’s the frontend filtering + not loading data for the newly selected country. Once we fetch all enabled methods (or fetch on selection change) and include GLOBAL in filtering, the preview will work consistently.

Deliverables
- Updated BuyerWallet and SellerWallet logic so “Available Withdrawal Methods”:
  - always shows default country preview
  - correctly shows other countries after selection
  - uses admin-updated logos
  - includes GLOBAL methods
  - keeps consistent image sizing with deposit/payment section
