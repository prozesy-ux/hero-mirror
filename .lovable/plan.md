

## Apply Billing Section Hover/Select Design to Both Wallets

### What Changes
Copy the Gumroad-style hover effects, transitions, and select states from `BillingSection.tsx` into both `BuyerWallet.tsx` and `SellerWallet.tsx`.

### Design Elements Being Applied

| Element | Current Wallet Style | Billing Style (Target) |
|---------|---------------------|----------------------|
| Tab navigation (active) | `bg-slate-900 text-white` | `bg-[#FF90E8] text-black border border-black` |
| Tab navigation (hover) | `hover:bg-slate-50` | `hover:text-slate-900 hover:bg-slate-50` (same) |
| Withdrawal/transaction rows hover | `hover:shadow-sm` | `hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |
| Payment method cards hover | `hover:bg-slate-50` | `hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |
| Account cards hover | `hover:bg-slate-50` | `hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |
| Quick amount buttons (selected) | `bg-emerald-500 text-white` | `bg-[#FF90E8] text-black border-black` |
| Quick amount buttons (hover) | `hover:border-emerald-400` | `hover:border-black` |
| Withdraw/Add Funds button | `bg-emerald-500 text-white rounded-xl` | `bg-[#FF90E8] text-black border border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |
| Account select in withdraw modal | `border-violet-500 bg-violet-50` | `border-black bg-[#FF90E8]/10` |
| Add Account dashed card | `border-slate-300 hover:bg-slate-50` | `border-dashed border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |

### Files Modified (2 files)

**File 1: `src/components/dashboard/BuyerWallet.tsx`**
- Tab active state: `bg-slate-900 text-white` to `bg-[#FF90E8] text-black border border-black`
- Wallet card withdraw button: `bg-emerald-500 hover:bg-emerald-600 rounded-xl` to `bg-[#FF90E8] text-black border border-black rounded hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
- Withdrawal method cards: `hover:bg-slate-50` to `hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
- Account cards: `hover:bg-slate-50` to `hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
- Withdrawal history rows: `hover:shadow-sm` to `hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
- Add Account dashed card: `border-slate-300 hover:bg-slate-50` to `border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
- Withdraw modal quick amounts: `bg-emerald-500 text-white border-emerald-500` to `bg-[#FF90E8] text-black border-black`; hover: `hover:border-emerald-400` to `hover:border-black`
- Withdraw modal account select: `border-violet-500 bg-violet-50` to `border-black bg-[#FF90E8]/10`; hover: `hover:border-gray-300` to `hover:border-black`
- Withdraw button in modal: `bg-emerald-500 hover:bg-emerald-600 rounded-xl` to `bg-[#FF90E8] text-black border border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded`
- OTP verify button: Same Gumroad style update

**File 2: `src/components/seller/SellerWallet.tsx`**
- Exact same changes as BuyerWallet (same elements exist in both files)
- Tab active state, withdrawal rows, method cards, account cards, add account card, withdraw modal amounts/select/button, OTP modal -- all updated to Gumroad hover style

### What Stays the Same
- All wallet functionality (withdraw, OTP, add account, delete, set primary, filters)
- Status pills and filter system (date picker, status dropdown)
- Data fetching, real-time subscriptions, context usage
- Layout structure (tabs, wallet card, accounts grid)
- The emerald color on the Add Account circle icon remains (it's an icon bg, not a hover/select)

