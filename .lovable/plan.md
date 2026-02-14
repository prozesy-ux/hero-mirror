

## Make Seller Chat Pixel-Perfect Match to Buyer ChatSection

All changes are in a single file: `src/components/seller/SellerChat.tsx`. No database changes needed.

### Changes Summary

**1. Sort button styling (line ~398-400)**
- Add `px-2 py-1 rounded-md hover:bg-[#f1f5f9]` classes
- Change `fontSize: '13px'` to `'12px'`
- Change `ChevronDown size={14}` to `size={12}`

**2. Empty state text - no conversations (line ~409)**
- Change `"No conversations yet"` to `"No tickets yet"`

**3. Ticket avatar - replace avatar/initials with MessageCircle icon (line ~414)**
- Replace the buyer avatar/initials rendering with:
```tsx
<div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold" style={{ fontSize: '10px', background: '#f1f5f9', color: '#64748b' }}><MessageCircle size={16} /></div>
```

**4. Ticket third line - show subject instead of lastMessage (line ~424)**
- Change `{ticket.lastMessage}` to `{getMetaForBuyer(ticket.id).subject}`

**5. Empty chat state text (line ~436)**
- Change `"Select a conversation"` to `"Select a ticket or create a new one"`

**6. No messages text (line ~500)**
- Change `"No messages yet"` to `"No messages yet. Start the conversation!"`

**7. Non-seller message avatar - use Sparkles icon instead of buyer avatar (line ~509-511)**
- Replace the buyer avatar/initials for non-seller messages with purple Sparkles icon:
```tsx
: <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white" style={{ background: '#8b5cf6' }}><Sparkles size={16} /></div>
```

**8. Non-seller message label - add "Support Agent" style label (line ~513)**
- Replace the simple name display for non-seller messages with the buyer's pattern:
```tsx
{!isMe && <div className="flex items-center gap-[6px] font-medium" style={{ fontSize: '12px', color: '#7c3aed' }}><Sparkles size={12} /> {activeTicket.buyerName}</div>}
{isMe && <div className="font-semibold" style={{ fontSize: '13px' }}>You</div>}
```
This replaces the single line that currently shows `{isMe ? 'You' : activeTicket.buyerName}` without any icon styling.

### What Stays Different (By Design)
- Seller shows `buyerName` in ticket list (contextually correct)
- Seller keeps the "Add tag" input in details panel (better UX)
- No "New" ticket button (sellers receive chats, don't create tickets)
- Data source remains `seller_chats` table grouped by `buyer_id`

### Result
After these 8 line-level edits, the Seller Chat will be visually identical to the Buyer ChatSection -- same avatar icons, same labels, same text, same styling -- with only the data source being different.

