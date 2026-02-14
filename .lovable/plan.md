

## Show Real User Name Instead of Ticket Number

### Problem
In the **Buyer ChatSection**, the ticket list and chat header display ticket numbers like `#TC-0002` where the user's real name should appear. The ticket number should still exist but the primary display should be the user's name.

### Changes

**File: `src/components/dashboard/ChatSection.tsx`**

1. **Fetch the user's profile name** when loading tickets -- query the `profiles` table using `user.id` to get `full_name`
2. **Store the user's name** in component state (e.g. `userName`)
3. **Ticket list (line 266)**: Replace `{ticket.ticket_number}` with the user's real name as the primary label, and show ticket number as secondary text below it
4. **Chat header (line 305)**: Replace `{activeTicket.ticket_number}` with the user's real name, keep ticket number as secondary info after the dot separator

**No changes needed for Seller SellerChat** -- it already displays `buyerName` correctly.

### Technical Details

| Location | Currently Shows | Will Show |
|----------|----------------|-----------|
| Ticket list item title | `#TC-0002` | User's full name (e.g. "John Doe") |
| Ticket list secondary line | Status badge | Ticket number + status badge |
| Chat header bold text | `#TC-0002` | User's full name |
| Chat header after dot | Subject | Ticket number + subject |

The profile is fetched once on mount using the existing `user.id` from `useAuthContext()`. Falls back to the user's email or "You" if no profile name is set.

