

## Fix Buyer Chat to Load Actual Conversations (Like Seller Chat)

### The Problem
The buyer chat section (`ChatSection.tsx`) only queries `support_tickets` -- which has **0 tickets**. Meanwhile, the actual buyer-seller conversations live in the `seller_chats` table (99 messages exist). The seller side loads these conversations correctly, but the buyer side never queries them -- so the buyer sees nothing.

### The Fix
Rewrite the buyer `ChatSection.tsx` data-fetching to mirror the seller chat approach:
- Query `seller_chats` where `buyer_id = user.id` instead of `support_tickets`
- Group messages by `seller_id` to create conversation threads (same pattern as seller groups by `buyer_id`)
- Look up seller names from `seller_profiles` and `profiles` tables
- Show seller name, last message, unread count in the conversation list
- Keep all existing features (emoji, voice, file attachments, pinning, themes, search, snooze)

### What Changes

**File: `src/components/dashboard/ChatSection.tsx`**

1. **Replace ticket-based data model with conversation-based model** (matching seller pattern):
   - Change `Ticket` interface to `ChatTicket` with `sellerName`, `sellerAvatar`, `lastMessage`, `lastMessageTime` fields (mirror of seller's `ChatTicket` which has `buyerName`)
   - Conversation ID = `seller_id` (just like seller uses `buyer_id` as conversation ID)

2. **Replace ticket fetch logic** (lines 160-183):
   - Query `seller_chats` where `buyer_id = user.id` grouped by `seller_id`
   - Fetch seller profiles for display names
   - Count unread messages where `sender_type = 'seller'` and `is_read = false`
   - Auto-select first conversation on load

3. **Replace message fetch logic** (lines 186-202):
   - Query `seller_chats` where `buyer_id = user.id` AND `seller_id = activeTicketId`
   - Mark seller messages as read
   - Real-time subscription on `seller_chats` filtered by buyer_id

4. **Replace send message logic** (lines 209-225):
   - Insert into `seller_chats` with `buyer_id = user.id`, `seller_id = activeTicketId`, `sender_type = 'buyer'`

5. **Update conversation list UI** (lines 443-463):
   - Show seller name instead of user's own name
   - Show last message preview and time
   - Remove ticket_number display (no tickets involved)

6. **Remove "Create Ticket" flow**:
   - Remove the "New" button and subject input (conversations are created organically when buyer messages a seller, not manually)
   - Keep the empty state but change text to "No conversations yet -- browse the marketplace to start chatting with sellers"

7. **Update pinned chats/messages to use `seller_id`** context instead of `ticket_id`

### Technical Summary

| Aspect | Current (Broken) | Fixed |
|--------|------------------|-------|
| Data source | `support_tickets` + `support_messages` | `seller_chats` table |
| Conversation key | `ticket.id` | `seller_id` (grouped) |
| Contact name shown | User's own name | Seller's name from profiles |
| Message query | `support_messages` by `ticket_id` | `seller_chats` by `buyer_id + seller_id` |
| Send message | Insert to `support_messages` | Insert to `seller_chats` with `sender_type: 'buyer'` |
| Create chat | Manual "New Ticket" button | Organic (from marketplace interaction) |
| Real-time | `support_messages` channel | `seller_chats` channel |

### Files Modified
- `src/components/dashboard/ChatSection.tsx` -- complete data layer rewrite, UI stays the same design
