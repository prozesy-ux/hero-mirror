
Goal
- Make Buyer dashboard visuals and behavior match Seller dashboard (especially Wallet).
- Make it 100% impossible for a Buyer or Seller to submit a second withdrawal while any earlier withdrawal is still “in progress” (pending/processing/etc.), even if they click fast, refresh, use multiple tabs, or the UI check fails.

What I found (root causes)
1) Buyer Wallet UI is not the same as Seller Wallet UI
- BuyerWallet uses emerald/teal gradients and “bg-card / border-border” styling.
- SellerWallet uses the violet/purple gradient theme and different button/tab styles.
- Labels differ (e.g., Buyer “History” tab vs Seller “Withdrawals”), and some sections exist in Seller but not in Buyer (e.g., “Available Withdrawal Methods” block).

2) “Second withdrawal while pending” can still happen because current protection is mostly UI-based and not fully consistent server-side
- UI now blocks pending statuses with isBlockingWithdrawalStatus and disables the button.
- But the OTP verification backend functions still do a strict status check `.eq("status","pending")` which:
  - is case-sensitive and whitespace-sensitive
  - uses `.single()` (can behave badly if unexpected multiple rows exist)
  - does not cover other “in progress” statuses (processing, queued, etc.)
- Most importantly: there is no database-level lock/constraint that guarantees “only 1 in-progress withdrawal per user/seller”.

Solution strategy (to reach 100% accuracy)
We will add a hard backend rule at the database layer, then update the backend functions and UI to handle and display the rule cleanly.

Phase A — Database-level guarantee (the “100% accurate” part)
A1) Add a UNIQUE PARTIAL INDEX for Buyer withdrawals
- Enforce: Only one “blocking/in-progress” withdrawal row per user_id at any time.
- Use a normalized predicate: `lower(trim(status)) IN (...)`

A2) Add a UNIQUE PARTIAL INDEX for Seller withdrawals
- Enforce the same rule for `seller_id`.

A3) Decide the blocking statuses list once, and use it everywhere
- Suggested canonical list:
  - pending, processing, queued, in_review, awaiting, requested, approved
- Rationale:
  - “approved” can still be “in-progress” in many flows; if your admin uses “approved” as a final state, we can exclude it. But safest is to treat it as blocking.

Deliverable (migration)
- Create a migration that adds both indexes:
  - buyer_withdrawals_one_in_progress_per_user
  - seller_withdrawals_one_in_progress_per_seller

Phase B — Backend functions: enforce + return clean error
B1) Update OTP verification functions to use safer “in-progress” detection
Files:
- supabase/functions/verify-buyer-withdrawal-otp/index.ts
- supabase/functions/verify-withdrawal-otp/index.ts

Changes:
- Replace the `.eq("status","pending").single()` check with:
  - a query that checks for any status in the blocking set, without `.single()`
  - or skip pre-check and rely on the unique index, catching a unique violation on insert.
- Add explicit handling of Postgres unique-violation error (SQLSTATE 23505):
  - Return HTTP 409 (or 400) with message: “You already have a pending withdrawal. Please wait.”

B2) Update “send OTP” functions to prevent sending OTP when a withdrawal is already in progress
Files:
- supabase/functions/send-buyer-withdrawal-otp/index.ts
- supabase/functions/send-withdrawal-otp/index.ts

Changes:
- Before generating OTP, check for an existing in-progress withdrawal (using the same normalized status logic).
- If found: return success:false + friendly message (don’t send OTP, don’t insert OTP row).

Why this matters
- This avoids users generating multiple OTPs and then successfully verifying the “newer” one while they already have a pending withdrawal.

Phase C — UI: make Buyer Wallet pixel-perfect same as Seller Wallet
C1) Make BuyerWallet match SellerWallet design and labels exactly
File:
- src/components/dashboard/BuyerWallet.tsx

Changes:
- Switch Buyer wallet theme from emerald/teal to violet/purple to match Seller.
- Align tab header style:
  - use white background, gray-900 active tab styling (as SellerWallet does)
- Align labels:
  - Tab labels and section labels should match SellerWallet exactly (e.g., “Withdrawals” not “History” if that’s what Seller uses).
- Match the wallet card:
  - same gradient icon container
  - same “Wallet Balance” label text
  - same button gradient and disabled styling
- Add “Available Withdrawal Methods” block like SellerWallet (Buyer already fetches paymentMethods from BFF; use it to render same grid).
- Ensure dialogs match:
  - withdraw dialog header icon gradient
  - quick amount buttons layout (Seller uses 5-column grid)

C2) Make the “Withdraw” action impossible to open when blocked
- Keep existing defensive click-check (already present), but ensure all entry points (button, any CTA, modal open) respect hasPendingWithdrawal.
- If blocked:
  - show toast
  - keep button disabled + show “Pending...”

Phase D — Buyer Dashboard metrics/filters parity with Seller
D1) Align BuyerDashboardHome layout with SellerDashboard’s header/filters pattern (light gray bg, date filter row, export button row)
File:
- src/components/dashboard/BuyerDashboardHome.tsx

Changes:
- Add date range filter + period dropdown similar to SellerDashboard/SellerAnalytics
- Make stat cards match style (rounded-2xl, same typographic scale, same icons style)
- Use real values from buyer orders + wallet:
  - Today’s Orders
  - Today’s Spend
  - Total Balance
  - Wishlist count
- Keep section titles removed except Notifications (per your earlier instruction)

Note: BuyerAnalytics already has date range + export; we’ll align spacing and card styles to match SellerAnalytics more closely.

Phase E — Verification checklist (to confirm “100% accurate”)
E1) Manual tests in preview
Buyer:
- Create a withdrawal → status pending
- Refresh page → Withdraw button must stay disabled (“Pending…”)
- Try from another tab/device session → second withdrawal must fail (server denies)
- If using OTP:
  - Attempt to request OTP again while pending → must be blocked
  - Attempt to verify OTP while pending exists → must be blocked

Seller:
- Same test flow for seller withdrawals, both OTP and non-OTP paths.

E2) Confirm database constraint behavior
- Attempt to insert a second pending withdrawal row directly (through app flow) → must return unique constraint violation → app shows friendly error.

Files impacted summary
Database
- New migration: add 2 partial unique indexes for buyer_withdrawals and seller_withdrawals.

Backend functions
- verify-withdrawal-otp (seller)
- verify-buyer-withdrawal-otp (buyer)
- send-withdrawal-otp (seller)
- send-buyer-withdrawal-otp (buyer)

Frontend
- BuyerWallet.tsx (full visual parity with SellerWallet + same labels + same blocks)
- BuyerDashboardHome.tsx (metrics + filters + styling parity focus)
- (Optional polish) BuyerAnalytics.tsx spacing and card consistency, if needed.

Important implementation notes
- Avoid `.single()` for “pending check” queries. Use `.maybeSingle()` or a normal `.select('id').limit(1)` pattern to avoid false failures.
- Treat status comparisons as normalized (trim + lowercase) in backend logic.
- The database unique partial index is the final authority; UI checks remain for UX only.
