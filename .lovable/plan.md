
# Fix Available Withdrawal Methods - Complete Solution

## Root Cause Identified

The code currently has a **state overwrite bug**:
1. `fetchWithdrawalMethods()` correctly fetches ALL enabled methods from database
2. `fetchData()` (BFF call) then **overwrites** `withdrawalMethods` state with only the user's country + GLOBAL methods
3. Since both run in parallel on mount, the BFF response arrives and replaces the full dataset

This explains why:
- Default country preview sometimes works (if BFF finishes first)
- Switching to other countries shows nothing (those methods were overwritten)
- The fix attempts haven't worked because the state keeps getting replaced

## Solution: Separate State for Preview Methods

Create two distinct states:
- `userWithdrawalMethods` - From BFF, for Add Account flows (user's country only)
- `allWithdrawalMethods` - From direct DB query, for preview section (all countries)

---

## File Changes

### 1. BuyerWallet.tsx

**Add new state (around line 145):**
```typescript
const [allWithdrawalMethods, setAllWithdrawalMethods] = useState<WithdrawalMethod[]>([]);
```

**Update fetchData() (line 290):**
```typescript
// Keep user-specific methods separate - don't overwrite allWithdrawalMethods
// setWithdrawalMethods(methodsData || []); -- REMOVE THIS LINE
// Use methodsData for Add Account if needed, but allWithdrawalMethods for preview
```

**Update displayMethods (lines 196-203):**
```typescript
const displayMethods = useMemo(() => {
  const filterCountry = previewCountry || userCountry;
  if (!filterCountry) return [];
  // Use allWithdrawalMethods for preview (not user-scoped)
  return allWithdrawalMethods.filter(m => 
    m.country_code === filterCountry || m.country_code === 'GLOBAL'
  );
}, [allWithdrawalMethods, previewCountry, userCountry]);
```

**Update fetchWithdrawalMethods (lines 215-222):**
```typescript
const fetchWithdrawalMethods = useCallback(async () => {
  const { data } = await supabase
    .from('withdrawal_method_config')
    .select('*')
    .eq('is_enabled', true)
    .order('country_code, account_type, method_name');
  if (data) {
    setAllWithdrawalMethods(data as WithdrawalMethod[]);
    setWithdrawalMethods(data as WithdrawalMethod[]); // Keep for Add Account merging
  }
}, []);
```

**Remove BFF overwrite in fetchData (line 290):**
```typescript
// REMOVE: setWithdrawalMethods(methodsData || []);
// The fetchWithdrawalMethods call will populate both states
```

---

### 2. SellerWallet.tsx

Apply identical changes:
- Add `allWithdrawalMethods` state
- Update `displayMethods` to use `allWithdrawalMethods`
- Update `fetchWithdrawalMethods` to set both states
- Keep existing code for Add Account which uses `withdrawalMethods`

---

## Why This Fixes All Issues

| Issue | Solution |
|-------|----------|
| Default country not showing | `allWithdrawalMethods` won't be overwritten by BFF |
| Switching country shows nothing | All countries' methods are in `allWithdrawalMethods` |
| GLOBAL methods missing | Filter includes `country_code === 'GLOBAL'` already working |
| Image sizing | Already set to `h-8 w-auto` - no change needed |
| Seller wallet same issues | Same fixes applied |

---

## Data Flow After Fix

```text
On Mount:
  fetchData()        → wallet balance, withdrawals, userCountry
  fetchWithdrawalMethods() → allWithdrawalMethods (all countries)

Preview Section:
  displayMethods = allWithdrawalMethods.filter(country OR GLOBAL)

Add Account Section:
  getAvailableBanks/Wallets → uses withdrawalMethods for logo merging
```

---

## Expected Behavior

1. **Buyer Dashboard Wallet**: Default country (BD) shows 6 methods immediately
2. **Switch to India**: Shows 5 IN methods + any GLOBAL methods
3. **Switch to US**: Shows 8 US methods + any GLOBAL methods
4. **Seller Dashboard Wallet**: Same behavior based on seller's country
5. **Image sizing**: Already correct at `h-8 w-auto`
