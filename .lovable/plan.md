

## Replace Buyer Chat Ticket System with Seller Chat Design

### What Changes
Remove the ticket-based system (`support_tickets`/`support_messages`) from the Buyer Dashboard chat and replace it with the same chatbox design as Seller Chat, but showing the buyer's conversations from the `seller_chats` table.

### How It Works

Currently:
- Buyer Chat uses `support_tickets` + `support_messages` tables (ticket system)
- Seller Chat uses `seller_chats` table grouped by `buyer_id`

After change:
- Buyer Chat will use `seller_chats` table grouped by `seller_id` (same ecosystem, buyer perspective)
- Same design, same layout, same details panel as Seller Chat
- Buyer sees their conversations with sellers (not support tickets)

### Changes to `src/components/dashboard/ChatSection.tsx`

**Complete rewrite** to mirror `SellerChat.tsx` but from buyer perspective:

1. **Data source**: Query `seller_chats` where `buyer_id = current user`, group by `seller_id` (instead of `buyer_id` like seller does)
2. **Profiles**: Fetch seller profiles via `seller_profiles` joined with `profiles` to show seller names
3. **Send messages**: Insert into `seller_chats` with `sender_type: 'buyer'` (instead of `'seller'`)
4. **Message ownership**: `isMe` = `sender_type === 'buyer'` (instead of `'seller'`)
5. **Metadata**: Use `localStorage` key `buyer-chat-meta` (separate from seller's `seller-chat-meta`)
6. **Details panel**: Same localStorage-based metadata (star, priority, tags, status, assignee, team, notes) -- identical layout to seller
7. **Ticket list**: Shows seller names, MessageCircle icon, status dots, subject from meta
8. **Chat header**: Seller name, star toggle, snooze, search, details toggle -- identical to seller
9. **All features preserved**: Emoji picker, voice recording, file upload, pinned messages, pinned chats, chat search, themes, settings, snooze, context menu

### What Gets Removed
- All `support_tickets` queries and creation
- All `support_messages` queries
- The "New" ticket creation button and flow
- `creatingTicket`, `newSubject` states

### What Gets Added
- Query `seller_chats` grouped by `seller_id`
- Fetch seller profiles for names
- `sender_type: 'buyer'` for sent messages

### Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/ChatSection.tsx` | Full rewrite mirroring SellerChat but with buyer perspective data queries |

### No Database Changes
Uses existing `seller_chats` table -- just querying from the buyer's side instead of seller's side.

