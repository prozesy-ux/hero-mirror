

## Connect Chat System to Real Data with Full Ticket Functionality

### Overview

Replace the mock data in both buyer `ChatSection.tsx` and seller `SellerChat.tsx` with real database-backed ticket conversations, while keeping the exact same 4-panel ticket UI design. Connect all three roles (Buyer, Seller, Admin) into a unified support ticket system.

### Current State

- **Buyer ChatSection**: Mock ticket UI, no DB connection
- **Seller SellerChat**: Mock ticket UI, no DB connection  
- **BuyerSupportTickets**: Simple chat bubble UI connected to `support_messages` table (separate component at `/dashboard/support`)
- **SellerSupport**: Simple chat bubble UI connected to `seller_support_messages` table (with file attachments)
- **Admin ChatManagement**: Fully functional, reads from `support_messages` + `seller_support_messages`, sends replies, manages chat join requests
- **Existing tables**: `support_messages` (user_id, message, sender_type, is_read), `seller_support_messages` (seller_id, message, sender_type, is_read)

### What Needs to Happen

#### Step 1: Create a `support_tickets` table (new migration)

A proper ticket layer on top of existing messages:

```sql
CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',        -- open, in_progress, resolved, closed
  priority TEXT NOT NULL DEFAULT 'medium',    -- low, medium, high
  ticket_type TEXT DEFAULT 'problem',         -- problem, question, feature_request
  assigned_to TEXT,                           -- admin name or agent
  assigned_team TEXT DEFAULT 'Customer Service',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  is_starred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
```

- RLS: Users see only their own tickets, sellers see only their tickets, admin manages all via edge function
- Auto-generate `ticket_number` like `TC-0001` using a trigger

#### Step 2: Add `ticket_id` column to `support_messages` and `seller_support_messages`

```sql
ALTER TABLE support_messages ADD COLUMN ticket_id uuid REFERENCES support_tickets(id);
ALTER TABLE seller_support_messages ADD COLUMN ticket_id uuid REFERENCES support_tickets(id);
```

This groups messages under tickets while preserving backward compatibility with existing data.

#### Step 3: Rewrite `ChatSection.tsx` (Buyer Dashboard Chat)

Keep the exact same 4-panel ticket design but wire it to real data:

- **Ticket List**: Fetch from `support_tickets` where `user_id = currentUser.id`, show real ticket numbers, subjects, unread counts
- **Chat Area**: Fetch `support_messages` where `ticket_id = activeTicket.id`, display with same bubble styling. Send new messages with `sender_type = 'buyer'`
- **Ticket Details Panel**: Show real ticket metadata (status, priority, assigned agent, tags). Allow buyer to update priority and star
- **New Ticket Button**: Create a new `support_ticket` + first message
- **Realtime**: Subscribe to `support_messages` and `support_tickets` changes for live updates
- **Close/Reopen**: Buyer can close tickets (set status to 'closed')
- **Search**: Filter tickets by subject text

#### Step 4: Rewrite `SellerChat.tsx` (Seller Dashboard Chat)

Same 4-panel design wired to `seller_support_messages` + `support_tickets`:

- **Ticket List**: Fetch from `support_tickets` where `seller_id = currentSeller.id`
- **Chat Area**: Fetch `seller_support_messages` where `ticket_id = activeTicket.id`
- **Send**: Insert into `seller_support_messages` with `sender_type = 'seller'`
- **Ticket Details**: Show/edit priority, status, tags
- **File Attachments**: Keep existing file upload from `SellerSupport.tsx` logic (upload to `chat-attachments` bucket, link via `seller_chat_attachments`)
- **Screen Recording**: Preserve the screen recording feature from `SellerSupport.tsx`
- **Realtime**: Subscribe to changes for live updates

#### Step 5: Update Admin `ChatManagement.tsx`

Add ticket awareness to the existing admin chat system:

- Add a "Tickets" tab alongside existing Users/Sellers/Chat Requests tabs
- Show all tickets across buyers and sellers with filtering by status/priority
- When admin opens a ticket, show the conversation and allow replies
- Admin can update ticket status, priority, assignee, tags, and notes
- Ticket status changes create system events visible in the chat stream
- Keep all existing admin chat functionality (delete messages, delete all chat, screen share monitoring)

#### Step 6: Remove/Redirect duplicate components

- **BuyerSupportTickets** (`/dashboard/support`): Redirect to `/dashboard/chat` or replace content with the new ticket chat
- **SellerSupport**: Replace with the new ticket-based `SellerChat` or redirect seller support route to the chat section

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Migration SQL | Create | New `support_tickets` table + alter existing message tables |
| `src/components/dashboard/ChatSection.tsx` | Rewrite | Replace mock data with real DB queries, keep exact same UI |
| `src/components/seller/SellerChat.tsx` | Rewrite | Replace mock data with real DB queries, keep exact same UI |
| `src/components/admin/ChatManagement.tsx` | Modify | Add Tickets tab, ticket management features |
| `src/components/dashboard/BuyerSupportTickets.tsx` | Modify | Redirect to chat or simplify to use tickets |

### Technical Details

**Ticket Number Generation** (database trigger):
- Auto-increment format: `TC-0001`, `TC-0002`, etc.
- Uses a sequence to ensure uniqueness

**RLS Policies on `support_tickets`**:
- Authenticated users can SELECT/INSERT their own tickets (`user_id = auth.uid()`)
- Sellers can SELECT/INSERT their own tickets (`seller_id` matches via `is_seller()` function)
- UPDATE limited to own tickets (status, priority, is_starred)

**Realtime**:
- Enable realtime on `support_tickets` table
- Both buyer and seller subscribe to their ticket changes + message inserts

**Data Flow**:
```text
Buyer creates ticket --> support_tickets row + first support_message
Buyer sends message  --> support_messages INSERT with ticket_id
Admin replies        --> support_messages INSERT (sender_type='admin') via edge function
Seller creates ticket --> support_tickets row + first seller_support_message  
Admin replies seller --> seller_support_messages INSERT via edge function
```

**Preserved Features**:
- File attachments (images, videos, documents) from SellerSupport
- Screen recording from SellerSupport
- Realtime message updates
- Unread count tracking
- Admin notification creation on reply
- Sound effects on new messages

### What Stays the Same
- All existing database tables (no data loss)
- Admin authentication system
- BFF architecture for other dashboard sections
- All other components untouched
- The 4-panel ticket UI layout and styling

