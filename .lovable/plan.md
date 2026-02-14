

## Replace Both Chat Sections with Ticket Dashboard Design

Replace the buyer `ChatSection.tsx` and seller `SellerChat.tsx` with the exact ticket-based chat design from the uploaded HTML file. Pure mock data only -- no database connections.

### What Changes

**Both files get the same new layout with 4 panels:**

```text
+------------------+------------------------+------------------+--------+
| Ticket List      | Chat Area              | Ticket Details   | Strip  |
| (320px)          | (flex-1)               | (300px)          | (56px) |
|                  |                        |                  |        |
| Search           | Header: #TC-0001       | Assignee         | Icons  |
| Sort: Newest     | Back / Subject / Star  | Team             |        |
|                  |                        | Type             |        |
| #TC-0004 David   | Messages:              | Status           |        |
| #TC-0001 Emily * | - Emily: text          | Priority: L/M/H  |        |
| #TC-0003 (747)   | - AI reply             | Subject          |        |
| #TC-0004 Brooklyn| - System events        | Tags             |        |
| #TC-0007 (44)    | - Agent reply          | Attributes       |        |
| #TC-0008 Guy     |                        |                  |        |
|                  | Input: textarea +      |                  |        |
|                  | toolbar + send         |                  |        |
+------------------+------------------------+------------------+--------+
```

### Mock Data (from HTML, no DB)

**6 Ticket contacts:**
- David Newman (#TC-0004) - "System Login Failure" - 2 unread
- Emily Johnson (#TC-0001) - "Request for Additional Storage..." - active
- (747) 246-9411 (#TC-0003) - "Unable to access report"
- Brooklyn Simmons (#TC-0004) - "File Upload Error" - 1 unread
- (44) 1342 351 (#TC-0007) - "Unable to access report" - 1 unread
- Guy Hawkins (#TC-0008) - "Unexpected App Crash"

**5 Chat messages (for active ticket):**
- Emily: "Hi, I need more storage and better server capacity."
- AI reply: "Hello! I can assist with that..."
- Emily: "Yes, sure."
- AI reply: "Connecting you now..."
- Agent (Raihan): "Hi, thanks for waiting!..."

**2 System events:**
- "Raihan Fikri has connected to take over ticket"
- "Raihan Fikri Ticket change priority to Medium"

**Ticket details panel:**
- Assignee: Raihan Fikri
- Team: Customer Service
- Type: Problem
- Status: Open
- Priority: Low / Medium (active) / High
- Tags: Question, Problem
- Attributes: ID, Customer, Language, Date

### Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/ChatSection.tsx` | Complete rewrite with new ticket design, mock data only, no Supabase imports |
| `src/components/seller/SellerChat.tsx` | Complete rewrite with same ticket design, mock data only, no Supabase imports |

### What Stays the Same
- All other components untouched
- No database changes
- No new files needed
- Both components export the same default export name
- Font: Inter (from the HTML CSS variables)

### Technical Details
- All CSS uses Tailwind classes + inline styles matching the HTML exactly
- Avatar images use the external URLs from the HTML (banani-avatars storage)
- Icons use lucide-react (already installed) mapped from iconify icons in HTML
- Ticket list clicking changes the active ticket (local state only)
- Send button and textarea are visual only (no backend calls)
- Responsive: ticket list hides on mobile, chat area takes full width
- Details panel scrollable for all ticket metadata
- Right toolbar strip with 4 icon buttons
