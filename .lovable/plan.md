

## Unified Dashboard Design for All Seller Sections

### Goal
Apply the EzMart dashboard card style (from Seller Dashboard Home) consistently across all seller sections except Wallet. This creates a cohesive, polished look with the cream background, rounded cards, orange accents, and search/filter bars.

### Current State
Right now the seller sections use 3 different design systems:
- **Dashboard Home**: Cream background (#F3EAE0), orange accents, rounded-2xl white cards, modern stat cards with icons
- **Products & Delivery Pool**: White background, black/10 borders, uppercase tracking labels
- **Everything else** (Analytics, Orders, Reports, Customers, Performance, Reviews, Refunds, Notifications, Security, Services, Flash Sales, Inventory, Marketing, Chat, Settings, Support, Feature Requests): Basic white cards with slate text, no consistent wrapper/background

### Design System to Apply

Every section will be wrapped in the same shell and follow these rules:

**Container**: `bg-[#F3EAE0]` with `min-h-screen` and `p-8` (32px padding)

**Page Header**: Title (text-2xl font-bold text-[#1F2937]) + subtitle (text-[#6B7280])

**Stat Cards**: White bg, rounded-2xl, p-6, with colored icon circles (40x40 bg-orange-100/emerald-100/blue-100), value in text-3xl font-bold, label in text-sm text-[#6B7280], change badge in green/red

**Content Cards**: White bg, rounded-2xl, p-6, subtle shadow-sm. Headers with text-lg font-semibold and "..." menu or action buttons

**Tables**: Inside white rounded-2xl cards, with search bar (rounded-xl input with Search icon) and filter dropdowns (orange "All Categories" style button)

**Status Badges**: Rounded-full px-3 py-1, colored backgrounds (emerald for success, amber for pending, blue for shipped, red for cancelled)

**Buttons**: Primary = bg-[#FF7F00] text-white rounded-xl. Secondary = bg-white border rounded-xl

**Empty States**: Centered icon (48px, text-[#D1D5DB]) + message text

### Files to Modify (15 files, skipping Wallet and Chat)

1. **SellerAnalytics.tsx** (596 lines) - Wrap in cream bg, convert stat cards to EzMart rounded-2xl style with icon circles, update chart containers to white rounded-2xl cards
2. **SellerOrders.tsx** (723 lines) - Cream bg wrapper, stat cards with icon circles, order list in white rounded-2xl card with search bar, status badges to pill style
3. **SellerProducts.tsx** (1173 lines) - Cream bg wrapper, stat row to EzMart cards, product grid inside white rounded-2xl card, search/filter bar styling
4. **SellerReports.tsx** (414 lines) - Cream bg, report type cards to rounded-2xl with colored icon circles, report output in white rounded-2xl card
5. **SellerCustomers.tsx** (273 lines) - Cream bg, stat cards to rounded-2xl, top customer card to rounded-2xl, customer table in white card with search
6. **SellerPerformance.tsx** (308 lines) - Cream bg, health score banner to rounded-2xl, metric cards to EzMart style, chart card to rounded-2xl
7. **SellerDeliveryInventory.tsx** (540 lines) - Cream bg instead of white, cards from border-black/10 to rounded-2xl shadow-sm, tabs from black pill to orange active style
8. **SellerReviewsManagement.tsx** (187 lines) - Cream bg, overview cards to rounded-2xl, reviews list card to rounded-2xl with search bar
9. **SellerRefundManagement.tsx** (122 lines) - Cream bg, stat cards to rounded-2xl with icon circles, refund list in rounded-2xl card
10. **SellerNotificationCenter.tsx** (117 lines) - Cream bg, notification list in rounded-2xl card, unread indicator styling
11. **SellerSecurityLogs.tsx** (97 lines) - Cream bg, login list in rounded-2xl card
12. **SellerServiceBookings.tsx** (161 lines) - Cream bg, filter buttons to orange active, bookings list in rounded-2xl card
13. **SellerProductAnalytics.tsx** (273 lines) - Cream bg, stat cards to rounded-2xl, chart in rounded-2xl card
14. **SellerInventory.tsx** (328 lines) - Cream bg, stat cards to rounded-2xl with icon circles, table in white rounded-2xl card with search
15. **SellerFlashSales.tsx** (350 lines) - Cream bg, flash sale cards to rounded-2xl, create dialog styling
16. **SellerMarketing.tsx** (425 lines) - Cream bg, discount table in rounded-2xl card, create dialog
17. **SellerSettings.tsx** (1018 lines) - Cream bg, settings panels to rounded-2xl cards
18. **SellerSupport.tsx** (626 lines) - Cream bg wrapper around chat area
19. **SellerFeatureRequests.tsx** (319 lines) - Cream bg, request cards to rounded-2xl, form in rounded-2xl card

### Design Token Reference (consistent across all sections)

```text
Background:        #F3EAE0 (cream)
Card:              bg-white rounded-2xl shadow-sm p-6
Stat Card:         bg-white rounded-2xl p-6 + 40px icon circle
Primary Accent:    #FF7F00 (orange)
Title:             text-2xl font-bold text-[#1F2937]
Subtitle:          text-sm text-[#6B7280]
Stat Value:        text-3xl font-bold text-[#1F2937]
Search Input:      bg-white border border-gray-200 rounded-xl px-4 py-2
Button Primary:    bg-[#FF7F00] text-white rounded-xl
Button Secondary:  bg-white border border-gray-200 rounded-xl
Badge Success:     bg-emerald-100 text-emerald-700 rounded-full
Badge Warning:     bg-amber-100 text-amber-700 rounded-full
Badge Error:       bg-red-100 text-red-700 rounded-full
Badge Info:        bg-blue-100 text-blue-700 rounded-full
Empty State:       Icon 48px text-gray-300 + text-sm text-gray-400
```

### Implementation Order
This is a large visual overhaul across 19 files. Due to the scale, it will be implemented in batches:
- **Batch 1**: Core pages (Analytics, Orders, Reports, Customers) -- most visited
- **Batch 2**: Product-related (Products, Inventory, Delivery Pool, Flash Sales, Marketing)
- **Batch 3**: Insights (Performance, Reviews, Refunds, Product Analytics)
- **Batch 4**: Utility (Notifications, Security, Services, Settings, Support, Feature Requests)

