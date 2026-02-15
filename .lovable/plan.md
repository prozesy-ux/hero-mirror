

## Rename "Support" to "Chat" and Fix Buyer Chat Loading

### Problem
1. The sidebar and mobile navigation label the chat section as "Support" -- needs to be "Chat"
2. The buyer ChatSection shows "Total ticket X" instead of loading chats properly
3. The buyer chat should load and display consistently with the seller chat

### Changes

**File: `src/components/dashboard/DashboardSidebar.tsx`**
- Line 43: Change label from `'Support'` to `'Chat'`

**File: `src/components/dashboard/MobileNavigation.tsx`**
- Line 163: Change label from `'Support'` to `'Chat'`

**File: `src/components/dashboard/ChatSection.tsx`**
- Line 412: Change header text from `"Total ticket {tickets.length}"` to `"Chats {tickets.length}"` to match seller's style
- Ensure tickets load and auto-select the first one on mount (already in code at line 178, but verify it fires correctly)
- The loading spinner (line 401) matches the seller pattern -- no change needed there

### Summary Table

| Location | Current | New |
|----------|---------|-----|
| DashboardSidebar bottom nav | `Support` | `Chat` |
| MobileNavigation sidebar | `Support` | `Chat` |
| ChatSection header | `Total ticket {n}` | `Chats {n}` |

3 files modified, minimal changes -- just label/text fixes to align naming and ensure consistency with the seller chat.

