
# Fix Admin Panel Withdrawals Section

## Problem Summary

The admin panel has no visible section for managing **buyer and seller withdrawals**:

1. **Buyer withdrawals are completely invisible** - The `buyer_withdrawals` table (with 1 pending $100 withdrawal) is never displayed anywhere
2. **Seller withdrawals are hidden** - They're buried deep in `/admin/resellers` → Withdrawals sub-tab, which is hard to find
3. **No unified view** - There's no single place to see all pending withdrawals from both buyers and sellers

### Current Database State
| Table | Pending | Completed | Total |
|-------|---------|-----------|-------|
| `seller_withdrawals` | 0 | 10 | 10 |
| `buyer_withdrawals` | 1 ($100) | 0 | 1 |

## Solution

Update the `WalletManagement.tsx` component to add tabs for managing **both Buyer and Seller withdrawals** in addition to the existing wallet/transaction tabs.

### Changes Required

**File: `src/components/admin/WalletManagement.tsx`**

1. Add new state for buyer and seller withdrawals
2. Fetch data from `buyer_withdrawals` and `seller_withdrawals` tables
3. Add two new tabs: "Buyer Withdrawals" and "Seller Withdrawals"
4. Display pending counts in tab badges
5. Add approve/reject functionality for both types
6. Show seller/buyer info (email) for each withdrawal

### UI Structure (Updated Tabs)

```text
┌─────────────────────────────────────────────────────────────────┐
│  Wallets  │  Transactions  │  Pending  │  Buyer W/D  │  Seller W/D  │
└─────────────────────────────────────────────────────────────────┘
                              ▲                ▲             ▲
                         (existing)        (NEW)         (NEW)
```

### New Stats Cards
Add two additional stats cards:
- **Pending Buyer Withdrawals**: Count and total amount
- **Pending Seller Withdrawals**: Count and total amount

### Technical Implementation

#### 1. Add State Variables
```typescript
const [buyerWithdrawals, setBuyerWithdrawals] = useState<any[]>([]);
const [sellerWithdrawals, setSellerWithdrawals] = useState<any[]>([]);
```

#### 2. Fetch Withdrawal Data
```typescript
// In useEffect or dedicated fetch function
const { data: buyerWd } = await fetchData('buyer_withdrawals', {
  order: { column: 'created_at', ascending: false }
});
const { data: sellerWd } = await fetchData('seller_withdrawals', {
  order: { column: 'created_at', ascending: false }
});
```

#### 3. Update Tab List
Add two new tabs after "Pending":
- `buyer-withdrawals` - Shows all buyer withdrawal requests
- `seller-withdrawals` - Shows all seller withdrawal requests

#### 4. Add Approve/Reject Functions
```typescript
const processWithdrawal = async (
  type: 'buyer' | 'seller',
  id: string,
  status: 'approved' | 'completed' | 'rejected',
  notes?: string
) => {
  const table = type === 'buyer' ? 'buyer_withdrawals' : 'seller_withdrawals';
  // Update status and processed_at
};
```

#### 5. Add Realtime Subscriptions
```typescript
.on('postgres_changes', { event: '*', schema: 'public', table: 'buyer_withdrawals' }, ...)
.on('postgres_changes', { event: '*', schema: 'public', table: 'seller_withdrawals' }, ...)
```

### Data Access

The edge functions `admin-fetch-data` and `admin-mutate-data` already have `buyer_withdrawals` and `seller_withdrawals` in their whitelists, so no backend changes are needed.

### Expected Result

After implementation:

| Location | What Admin Sees |
|----------|-----------------|
| `/admin/wallets` | Wallets tab shows buyer wallets |
| `/admin/wallets` | Transactions tab shows wallet transactions |
| `/admin/wallets` | Pending tab shows pending top-ups |
| `/admin/wallets` | **Buyer Withdrawals tab** shows all buyer withdrawal requests with approve/reject |
| `/admin/wallets` | **Seller Withdrawals tab** shows all seller withdrawal requests with approve/reject |
| Stats cards | Shows pending counts for both buyer and seller withdrawals |

### Alternative: Add Sidebar Menu Item (Optional Enhancement)

If desired, we could also add a dedicated "Withdrawals" menu item in the admin sidebar that goes directly to the withdrawals tabs:

```typescript
// In AdminSidebar.tsx navItems
{ icon: <Banknote size={22} />, label: 'Withdrawals', to: '/admin/wallets?tab=buyer-withdrawals' }
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/WalletManagement.tsx` | Add buyer/seller withdrawals tabs, fetch data, process functions |

## Summary of Changes

1. **Fetch** both `buyer_withdrawals` and `seller_withdrawals` tables
2. **Display** them in new tabs with proper status badges
3. **Enable** approve/reject actions for pending withdrawals
4. **Show** stats for pending withdrawal counts
5. **Subscribe** to realtime updates for both tables         now buywer withdrwal and seller sithdrwal 1 tab show on walet section and mush show show othdrewal clear those with proper sstemdeisgn

