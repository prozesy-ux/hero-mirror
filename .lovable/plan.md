
# Apply Reference Chat Box Design to All Chat Components

## Overview

Apply the premium messaging app design (from the provided HTML/CSS reference) consistently across all buyer and seller chat components in the application. The design features a professional chat layout with:
- **Dark navy message bubbles** for received messages
- **Navy-blue (rentsell-primary-color)** bubbles for sent messages
- **Clean white header** with user avatar and online status
- **Light input area** with rounded input field
- **Professional color scheme** matching the reference design

---

## Reference Design Analysis (Line by Line)

### Color Variables
```css
--dark: rgba(0, 9, 41, 1)              /* Received message bubble */
--rentsell-primary-color: rgba(46, 59, 91, 1)  /* Sent message bubble */
--input-fill: rgba(247, 247, 253, 1)   /* Input background */
--primary-0: rgba(255, 255, 255, 1)    /* White text/background */
--secondary-400: rgba(117, 117, 117, 1) /* Timestamp color */
--success-600: rgba(51, 184, 67, 1)    /* Online status dot */
```

### Chat Header (100px height)
- White background with bottom border
- 44x44px rounded avatar
- User name (16px, font-weight 600)
- Online status with green dot (8x8px) + "Online" text
- Action buttons (call, video, more) on right side

### Messages Container
- Scrollable area with padding 8px 24px
- "Today" badge centered
- Received messages: Dark background (#000929), rounded 0px 10px 10px 10px
- Sent messages: Navy background (#2e3b5b), rounded 10px 0px 10px 10px
- Message text: 14px Raleway, white color
- Timestamps: 12px, gray color

### Chat Footer (80px height)
- White background with top border
- Action buttons (attach, emoji, mic)
- Input field: Light fill background, rounded 20px, height 60px
- Send button: Navy background, rounded 10px, white send icon

---

## Components to Update

### 1. SellerChatModal.tsx (Buyer to Seller - Modal)
**Current:** Pink/Gumroad style with rounded bubbles
**New:** Reference design with dark/navy bubbles

### 2. FloatingChatBox.tsx (Buyer to Seller - Floating)
**Current:** Emerald/green theme
**New:** Reference design matching SellerChatModal

### 3. FloatingSupportChatBox.tsx (Buyer to Support - Floating)
**Current:** Violet/purple theme
**New:** Reference design with support branding

### 4. SellerChat.tsx (Seller Dashboard - Full Page)
**Current:** Emerald/green theme with modern styling
**New:** Reference design with split-panel layout

### 5. ChatSection.tsx (Buyer Dashboard - Full Page)
**Current:** Mixed styling
**New:** Reference design unified

---

## Unified Design Specifications

### Header Component
```tsx
<div className="h-[100px] bg-white border-b border-[#e5e5e5] flex items-center justify-between px-6">
  <div className="flex items-center gap-3">
    <img className="w-11 h-11 rounded-full object-cover" src={avatar} />
    <div className="flex flex-col gap-2">
      <span className="text-[16px] font-semibold text-[#000929] tracking-[-0.32px]">{name}</span>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-[#33b843] rounded-full" />
        <span className="text-[12px] text-[#bababa] tracking-[-0.24px]">Online</span>
      </div>
    </div>
  </div>
  {/* Action buttons */}
</div>
```

### Message Bubbles

**Received (from other party):**
```tsx
<div className="bg-[#000929] rounded-[0px_10px_10px_10px] px-3 py-2 shadow-sm max-w-[272px]">
  <p className="font-raleway font-medium text-[14px] text-white tracking-[-0.28px] leading-[21px]">
    {message}
  </p>
  <span className="text-[12px] text-[#757575] tracking-[-0.12px]">{time}</span>
</div>
```

**Sent (by current user):**
```tsx
<div className="bg-[#2e3b5b] rounded-[10px_0px_10px_10px] px-3 py-2 shadow-sm max-w-[303px]">
  <p className="font-raleway font-medium text-[14px] text-white tracking-[-0.28px] leading-[21px]">
    {message}
  </p>
  <span className="text-[12px] text-[#757575] tracking-[-0.12px] text-right block">{time}</span>
</div>
```

### Footer/Input Area
```tsx
<div className="h-[80px] bg-white border-t border-[#e5e5e5] flex items-center gap-6 px-4">
  {/* Attach button */}
  <div className="flex-1 h-[60px] bg-[#f7f7fd] rounded-[20px] flex items-center px-4">
    <input 
      className="flex-1 bg-transparent text-[14px] text-[#92929d] placeholder:text-[#92929d] outline-none"
      placeholder="Type your message..."
    />
  </div>
  <button className="w-11 h-11 bg-[#2e3b5b] rounded-[10px] flex items-center justify-center">
    <Send className="w-6 h-6 text-white" />
  </button>
</div>
```

### "Today" Badge
```tsx
<div className="flex justify-center py-1">
  <span className="bg-white px-3 py-2 rounded text-[14px] font-semibold text-[#2e2a40] tracking-[-0.28px] shadow-sm">
    Today
  </span>
</div>
```

---

## Files to Update

| File | Purpose | Changes |
|------|---------|---------|
| `src/components/dashboard/SellerChatModal.tsx` | Buyer→Seller modal | Full redesign with reference colors/layout |
| `src/components/dashboard/FloatingChatBox.tsx` | Buyer→Seller floating | Match modal design in floating format |
| `src/components/dashboard/FloatingSupportChatBox.tsx` | Buyer→Support floating | Same design, support branding |
| `src/components/seller/SellerChat.tsx` | Seller dashboard chat | Apply reference design to message area |
| `src/components/dashboard/ChatSection.tsx` | Buyer dashboard chat | Unify with reference design |

---

## Tailwind Config Addition

Add Raleway font if not present:
```js
fontFamily: {
  'raleway': ['Raleway', 'sans-serif'],
}
```

---

## Key Visual Changes Summary

| Element | Current | New (Reference) |
|---------|---------|-----------------|
| Sent bubble color | Emerald/Pink | Navy #2e3b5b |
| Received bubble color | White/Light | Dark #000929 |
| Bubble radius (sent) | Rounded all | 10px 0px 10px 10px |
| Bubble radius (received) | Rounded all | 0px 10px 10px 10px |
| Header height | ~64px | 100px |
| Footer height | ~64px | 80px |
| Input field | Small rounded | 60px height, 20px radius |
| Send button | Small pill | 44px square, 10px radius |
| Background | Gray-50/Light | White with #f7f7fd input |
| Online indicator | None/Text only | Green dot + "Online" text |

---

## Implementation Order

1. Update `SellerChatModal.tsx` first (buyer modal - most visible)
2. Update `FloatingChatBox.tsx` to match
3. Update `FloatingSupportChatBox.tsx` with same layout
4. Update `SellerChat.tsx` for seller dashboard
5. Update `ChatSection.tsx` for buyer dashboard

All functionality (send, receive, realtime, typing) remains unchanged - only UI/CSS is updated.
