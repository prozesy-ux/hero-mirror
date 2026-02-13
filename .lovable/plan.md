

## Apply Buyer Wallet Design to Seller Wallet

### Problem
The Seller Wallet (`SellerWallet.tsx`) still uses old neobrutalism/pink design elements (black border shadows, `#FF90E8` accents) while the Buyer Wallet (`BuyerWallet.tsx`) has been updated to a clean, modern design with emerald accents, subtle hover effects, and advanced filters. These need to be unified.

### Changes (1 file: `src/components/seller/SellerWallet.tsx`)

#### 1. OTP Modal -- Replace pink neobrutalism with clean emerald
- **Current**: `bg-[#FF90E8] border border-black` shield icon container, black text
- **New**: `bg-emerald-100` container with `text-emerald-600` icon (matching BuyerWallet)

#### 2. Add Account Modal -- Step badges
- **Current**: Steps 2/3/4 use `bg-[#FF90E8] text-black`
- **New**: All step badges use `bg-emerald-500 text-white` (matching BuyerWallet)

#### 3. Add Account Modal -- Hover styles on buttons
- **Current**: Account type, bank, wallet, and "Other Bank" buttons use neobrutalism hover: `hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`
- **New**: Clean hover: `hover:border-emerald-400 hover:shadow-sm` (matching BuyerWallet)

#### 4. "Other Bank" button
- **Current**: `border-dashed border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFF5FB]`
- **New**: `border-dashed border-slate-300 hover:shadow-sm hover:bg-slate-50` (matching BuyerWallet)

#### 5. Withdrawals Tab -- Add filters and status pills (from BuyerWallet)
- **Current**: Basic list with no filtering capability
- **New**: Add the same filter system as BuyerWallet:
  - Status filter pills (All, Pending, Approved, Completed, Rejected) with colored active states
  - Date filter popover (All Time, Today, This Week, This Month, Custom range)
  - Status dropdown filter
  - Clear filters button
  - Better empty state with icon and contextual message
  - Add new state variables: `withdrawalStatusFilter`, `withdrawalDatePreset`, `customDateRange`, `showDatePicker`
  - Add `filteredWithdrawals` computed from filters
  - Import additional components: `Popover`, `Calendar`, `Filter` icon

#### 6. Withdrawal method cards hover
- **Current**: `hover:shadow-sm` (already clean but inconsistent)
- **New**: `hover:bg-slate-50` (matching BuyerWallet exactly)

### What Stays the Same
- All wallet functionality (withdraw, OTP, add account, delete account, set primary)
- Data fetching, real-time subscriptions, context usage
- The overall layout structure (tabs, wallet card, accounts grid)
- Emerald withdraw button and dialog styling (already matching)

