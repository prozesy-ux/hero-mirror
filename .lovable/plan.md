

## Align Seller Chat to Match Buyer Dashboard Chat Design

### Problem
The Seller Chat (`SellerChat.tsx`) has a simpler layout compared to the Buyer Chat (`ChatSection.tsx`). The user wants the Seller Chat to have the exact same design, features, and details panel as the Buyer Dashboard chat.

### What's Different Today

| Feature | Buyer Chat | Seller Chat |
|---------|-----------|-------------|
| Star toggle in header | Yes | No |
| Ticket creation (New button) | Yes | No (receives chats) |
| Details panel: Assignee | Yes | No |
| Details panel: Team | Yes | No |
| Details panel: Ticket type | Yes | No |
| Details panel: Set status with flag | Yes | Simple "Active" only |
| Details panel: Set priority (Low/Med/High) | Yes | No |
| Details panel: Subject | Yes | No |
| Details panel: Tags with remove | Yes | No |
| Details panel: Full Attributes block | Yes | Partial |
| Ticket list: Status dot + status text | Yes | No |
| Ticket list: Avatar icon style | MessageCircle icon | Avatar/initials (already good) |

### Changes to `src/components/seller/SellerChat.tsx`

1. **Add star toggle to chat header** -- Add a Star icon next to the buyer name that toggles a local `starredChats` state (stored in localStorage since seller_chats has no `is_starred` column)

2. **Add status/priority/metadata to ChatTicket interface** -- Extend the virtual ticket object with `status`, `priority`, `ticket_type`, `assigned_to`, `assigned_team`, `subject`, `tags`, `is_starred` fields (defaults since seller chats don't have a ticket table)

3. **Rebuild the Details Panel to match Buyer layout exactly**:
   - Assignee section (default: "Unassigned")
   - Team section (default: "Customer Service")
   - Ticket type section (default: "Inquiry")
   - Set status with Flag icon
   - Set priority with Low/Medium/High color buttons (stored in localStorage per buyer)
   - Subject section (shows product name or "General inquiry")
   - Tags section with removable tag chips
   - Full Attributes block (Ticket number, Status, Customer, Email, Date)
   - Editable Notes (already exists, keep as-is)

4. **Update ticket list items** -- Add status dot + status text below the buyer name (matching buyer's ticket list style)

5. **Match header layout** -- Same gap, star icon, dot separator pattern as buyer chat header

### Database Changes
None required -- all new seller-side metadata (stars, priorities, tags) will be stored in localStorage since the seller_chats table doesn't have these columns and adding them would be overkill for display-only metadata.

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/seller/SellerChat.tsx` | Rebuild details panel, add star/priority/tags, match buyer design |

No other files need changes.

