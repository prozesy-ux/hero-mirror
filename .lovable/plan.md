

## Fix Buyer Chat Not Showing

### Root Cause
The database has **zero tickets** for this user, and the current UI handles this poorly:
1. On mobile, the ticket list sidebar is completely hidden (`hidden lg:flex`), so users cannot see the "New" button to create their first chat
2. On desktop, an empty state says "No tickets yet" in the sidebar but the main area just says "Select a ticket or create a new one" -- no clear way to start chatting
3. The experience does not match the seller chat which shows conversations immediately

### Changes

**File: `src/components/dashboard/ChatSection.tsx`**

1. **Add a mobile ticket list view**: When no ticket is active (or on first load), show the ticket list on mobile instead of hiding it. Use a conditional: if on mobile and `activeTicketId` is null, show the ticket list full-width; once a ticket is selected, show the chat area full-width with a back button (already exists at line 469).

2. **Better empty state with prominent "Start Chat" button**: Replace the minimal "No tickets yet" and "Select a ticket" placeholders with a centered empty state that includes a visible "Start a new conversation" button that auto-creates a ticket.

3. **Mobile-first layout fix**:
   - Change the sidebar from `hidden lg:flex` to conditionally visible: show on mobile when no active ticket, hide on mobile when viewing a chat
   - The main chat area: hide on mobile when no active ticket, show on mobile when a ticket is selected

### Technical Details

| Current Behavior | Fixed Behavior |
|-------------------|----------------|
| Sidebar: `hidden lg:flex` (never visible on mobile) | Sidebar: visible on mobile when no ticket selected, hidden when chatting |
| Main area always visible with "Select a ticket" message | Main area hidden on mobile when no ticket selected |
| Empty state: small "No tickets yet" text | Empty state: large icon + "Start your first conversation" button |
| No way to create ticket on mobile | "New Chat" button visible on mobile in ticket list |

The back button (ChevronLeft at line 469) already sets `activeTicketId(null)` which will return to the ticket list on mobile -- this flow already works, we just need to show the list.

### Files Modified
- `src/components/dashboard/ChatSection.tsx` (layout conditionals + empty state)
