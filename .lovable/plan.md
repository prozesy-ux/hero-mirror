

## Fully Functional Chat System - Both Buyer and Seller Dashboards

This is a large implementation covering file attachments, emoji picker, voice notes, search/filter, sort, snooze, pinning (messages + chats), chat settings with theme customization, and notes -- all wired to the database with real-time sync.

---

### Phase 1: Database Schema Updates (New Tables + Columns)

**New tables to create:**

| Table | Columns | Purpose |
|-------|---------|---------|
| `pinned_messages` | id, user_id, ticket_id (nullable), chat_id (nullable), message_id, pinned_at | Track up to 10 pinned messages per conversation |
| `pinned_chats` | id, user_id, ticket_id (nullable), buyer_id (nullable), seller_id (nullable), pinned_at | Track pinned/bookmarked chats |
| `chat_settings` | id, user_id, theme (text, default 'default'), bg_image_url (text nullable), bg_color (text nullable), bubble_style (text default 'rounded'), font_size (text default 'medium'), notification_sound (boolean default true), created_at, updated_at | Per-user chat appearance settings |
| `snoozed_tickets` | id, user_id, ticket_id (nullable), buyer_id (nullable), snooze_until (timestamptz), created_at | Track snoozed conversations |

**New columns on existing tables:**

| Table | New Column | Purpose |
|-------|-----------|---------|
| `support_messages` | `attachment_url` (text nullable) | File attachment URL |
| `support_messages` | `attachment_name` (text nullable) | Original file name |
| `support_messages` | `attachment_type` (text nullable) | MIME type |
| `support_messages` | `is_pinned` (boolean default false) | Quick pin flag |
| `support_messages` | `is_voice_note` (boolean default false) | Voice message flag |
| `seller_chats` | `attachment_url` (text nullable) | File attachment URL |
| `seller_chats` | `attachment_name` (text nullable) | Original file name |
| `seller_chats` | `attachment_type` (text nullable) | MIME type |
| `seller_chats` | `is_pinned` (boolean default false) | Quick pin flag |
| `seller_chats` | `is_voice_note` (boolean default false) | Voice message flag |
| `support_tickets` | `is_snoozed` (boolean default false) | Snooze flag |
| `support_tickets` | `snooze_until` (timestamptz nullable) | When snooze expires |

RLS policies will be added for all new tables so users can only access their own data.

---

### Phase 2: Feature Implementation (Both ChatSection.tsx and SellerChat.tsx)

Each feature below will be implemented identically in both files, adapted for buyer vs seller context.

#### 2A. File Attachments (Paperclip button)
- Click Paperclip opens file picker (images, PDFs, docs, zip -- max 10MB)
- Upload to existing `chat-attachments` storage bucket
- Save URL in message `attachment_url` column
- Display inline: images show thumbnail preview, other files show download card with icon + name + size
- File preview modal on click for images

#### 2B. Emoji Picker (Smile button)
- Click Smile icon toggles an emoji grid popover
- Categories: Smileys, People, Animals, Food, Travel, Objects, Symbols
- Search within emoji picker
- Click emoji inserts at cursor position in textarea
- Recent emojis section (stored in localStorage)

#### 2C. Voice Notes (Mic button)
- Click Mic starts recording (uses browser MediaRecorder API)
- Shows recording indicator with timer and stop/cancel buttons
- On stop: uploads audio blob to `chat-attachments` bucket as `.webm`
- Message saved with `is_voice_note: true`
- Playback: inline audio player with play/pause and duration

#### 2D. Search Within Chat Messages
- New search icon in chat header
- Click toggles a search bar overlay at top of chat area
- Real-time filter: highlights matching messages and scrolls to them
- Navigate between results with up/down arrows
- Close search restores normal view

#### 2E. Sort (Newest / Oldest)
- Dropdown in ticket list header (already has "Newest" text)
- Toggle between "Newest first" and "Oldest first"
- Re-sorts the ticket/conversation list by `updated_at` or `lastMessageTime`

#### 2F. Snooze Function
- Click Snooze button in chat header opens a dropdown
- Options: 1 hour, 4 hours, Tomorrow 9am, Next week, Custom date/time
- Saves `snooze_until` on the ticket and sets `is_snoozed: true`
- Snoozed tickets move to bottom of list with a clock icon
- Auto-unsnooze when time expires (checked on load)

#### 2G. Pin Messages (up to 10 per conversation)
- Right-click or long-press a message shows "Pin message" option
- Pinned messages saved to `pinned_messages` table
- Pinned messages indicator bar at top of chat showing count
- Click the bar expands to show all pinned messages
- Unpin option on pinned messages
- Max 10 pins enforced client-side with toast warning

#### 2H. Pin Chats / Conversations
- Pin icon on each ticket in the list (or right-click menu)
- Pinned chats saved to `pinned_chats` table
- Pinned chats always appear at top of the list with a pin icon
- Toggle pin on/off

#### 2I. Notes Function
- Already has notes display in details panel
- Make it editable: click to edit, auto-save to database
- Textarea that saves on blur or Enter
- Updates `notes` column on `support_tickets`

#### 2J. Chat Settings and Theme Customization
- Settings gear icon in the right toolbar strip
- Opens a settings panel/modal with:
  - **Theme presets**: Default (white), Dark, WhatsApp Green, Blue Ocean, Sunset, custom
  - **Custom background image**: Upload from device (stored in `chat-attachments` bucket) or paste URL
  - **Bubble style**: Rounded, Sharp, Minimal
  - **Font size**: Small, Medium, Large
  - **Notification sound**: Toggle on/off
- Settings saved to `chat_settings` table per user
- Applied dynamically to chat area background and message bubbles

**Theme presets available:**

| Theme | Chat BG | User Bubble | Other Bubble |
|-------|---------|-------------|-------------|
| Default | #ffffff | #eff6ff | #f1f5f9 |
| Dark | #1e293b | #1e40af | #334155 |
| WhatsApp | #e5ddd5 (with pattern) | #dcf8c6 | #ffffff |
| Blue Ocean | #0c4a6e | #0284c7 | #164e63 |
| Sunset | #fdf2f8 | #fce7f3 | #fff1f2 |

---

### Phase 3: Close Right Side Panel Toggle

- Add a toggle button to collapse/expand the details panel and toolbar strip
- When closed: chat area takes full width
- State persisted in localStorage
- Mobile: panels already hidden, no change needed

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/ChatSection.tsx` | Complete enhancement with all features above |
| `src/components/seller/SellerChat.tsx` | Same enhancements adapted for seller context |
| Database migration | New tables + columns + RLS policies |

### Files NOT Changed
- No new component files -- everything stays self-contained in the two chat files
- No changes to any other pages or components
- Storage bucket `chat-attachments` already exists

### Technical Approach
- Emoji data: built-in static array (no external library needed)
- Voice recording: native MediaRecorder API
- File upload: Supabase Storage `chat-attachments` bucket
- All state changes use real-time subscriptions already in place
- Theme settings loaded on mount, applied via inline styles
- Pin counts enforced with `.select('*', { count: 'exact' })` before insert

