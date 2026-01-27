
# Premium Profile Section Redesign (Buyer & Seller Dashboards)

## Design Reference Analysis

Based on the uploaded images, the target UX design features:

1. **Header Section**
   - Green/emerald gradient header with avatar
   - Camera icon overlay on avatar for photo change
   - Online status indicator (green dot)
   - Username prominently displayed
   - Notification bell icon in header
   - Clean, minimal spacing

2. **Menu List Structure**
   - Clean white background
   - Icon + Label + Chevron pattern for each row
   - Subtle bottom border separators
   - Section headers ("Settings") in bold
   - No complex accordions on main view - single-tap navigation

3. **Bottom Sheet Pattern**
   - Profile image options (Take a photo, Choose from library)
   - Set status with Online toggle
   - Clean modal presentation

4. **Preferences Sub-page**
   - Back arrow + centered title header
   - Simple list items: Notifications, Security, Language, Appearance, Currency
   - Each row has right chevron indicating drill-down
   - Online status toggle at bottom

---

## Current vs Target Comparison

| Element | Current Design | Target Design |
|---------|----------------|---------------|
| Layout | Accordion-based sections | List-based menu navigation |
| Header | Card with inline avatar | Full-width colored banner |
| Avatar | Static with hover overlay | Camera icon always visible + online dot |
| Sections | Nested accordions | Flat list with chevrons |
| Navigation | Expand/collapse | Tap to navigate (sub-views) |
| Typography | Multiple sizes | Consistent 16px list items |
| Spacing | Variable | Uniform 16px padding |

---

## Implementation Plan

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/ProfileSection.tsx` | Complete redesign to match reference UX |
| `src/components/seller/SellerSettings.tsx` | Complete redesign to match reference UX |

---

## Part 1: Buyer ProfileSection Redesign

### Structure

```text
+------------------------------------------+
| [Emerald/Violet Gradient Header]         |
|   +-------+  Username                    |
|   |Avatar |  ● Online                🔔 |
|   |  📷   |  Member since Jan 2025       |
|   +-------+                              |
+------------------------------------------+
| PROFILE                                  |
|   📷 Profile Image                    >  |
|   ✏️ Edit Name                        >  |
|   📧 Email Address              Verified |
+------------------------------------------+
| SETTINGS                                 |
|   🔔 Notifications                    >  |
|   🔒 Security                         >  |
|   🔑 Two-Factor Authentication    ON  >  |
|   🌐 Language                         >  |
|   🎨 Appearance                       >  |
|   💰 Currency                         >  |
+------------------------------------------+
| Set status                               |
|   🟢 Online status               [ON]    |
|   You'll remain online...                |
+------------------------------------------+
| DANGER ZONE                              |
|   📥 Export Data                      >  |
|   🗑️ Delete Account                   >  |
+------------------------------------------+
```

### Key Components

1. **ProfileHeader**
   - Gradient background (violet for buyer, emerald for seller)
   - Large avatar with camera icon overlay
   - Online status indicator dot
   - Username + member since date
   - Notification bell icon

2. **MenuListItem**
   - Reusable component for list items
   - Props: icon, label, value (optional), hasChevron, onClick

3. **SectionHeader**
   - Bold section title (PROFILE, SETTINGS, etc.)

4. **StatusToggle**
   - Inline toggle for online status

5. **Sub-views (Sheets/Dialogs)**
   - Profile Image options (Take photo / Choose library)
   - Notifications preferences
   - Security settings with password change
   - Sessions management

---

## Part 2: Seller SellerSettings Redesign

### Structure

```text
+------------------------------------------+
| [Emerald Gradient Header]                |
|   +-------+  Store Name                  |
|   | Logo  |  ✓ Verified  ● Online   🔔  |
|   |  📷   |  Seller since Jan 2025       |
|   +-------+                              |
+------------------------------------------+
| STORE                                    |
|   🏪 Store Information                >  |
|   🎨 Display Settings                 >  |
|   🖼️ Banner & Media                   >  |
|   🔗 Social Media Links               >  |
+------------------------------------------+
| SETTINGS                                 |
|   🔔 Notifications                    >  |
|   🔒 Two-Factor Authentication    ON  >  |
|   📊 Account Details                  >  |
+------------------------------------------+
| Set status                               |
|   🟢 Online status               [ON]    |
|   You'll remain online...                |
+------------------------------------------+
| DANGER ZONE                              |
|   🗑️ Delete Store                     >  |
+------------------------------------------+
```

---

## Technical Details

### Shared Components to Create

1. **ProfileHeader Component**
```typescript
interface ProfileHeaderProps {
  avatarUrl?: string;
  name: string;
  subtitle: string;
  isOnline?: boolean;
  isVerified?: boolean;
  gradient?: 'violet' | 'emerald';
  onAvatarClick?: () => void;
  onNotificationClick?: () => void;
}
```

2. **MenuListItem Component**
```typescript
interface MenuListItemProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  value?: React.ReactNode;
  hasChevron?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'danger';
}
```

3. **SectionDivider Component**
```typescript
interface SectionDividerProps {
  title: string;
}
```

### Sub-views (Sheets)

Using Shadcn Sheet component for drill-down views:

1. **Profile Image Sheet** - Camera/Library options
2. **Edit Name Sheet** - Name input form
3. **Notifications Sheet** - All notification toggles
4. **Security Sheet** - Password change + sessions
5. **Two-Factor Sheet** - 2FA toggle + info

### Data Flow

Both components will continue using their existing data hooks:
- **Buyer**: `useAuthContext()`, direct Supabase queries for preferences/sessions
- **Seller**: `useSellerContext()`, profile data from context

All existing functionality (avatar upload, password change, session management, 2FA toggle, etc.) will be preserved - only the UI presentation changes.

---

## Styling Guidelines (From Reference)

| Property | Value |
|----------|-------|
| Header height | 120px mobile, 140px desktop |
| Avatar size | 72px with 4px white border |
| Font - Label | 16px, font-medium |
| Font - Description | 12px, text-muted-foreground |
| Section header | 12px, uppercase, letter-spacing, text-muted |
| List item padding | 16px horizontal, 14px vertical |
| Divider | 1px border-gray-100 |
| Chevron | ChevronRight 16px text-gray-400 |
| Status dot | 10px bg-emerald-500 with ring |

---

## Mobile Optimization

- Touch targets minimum 44px
- Full-width list items
- Sheet modals for sub-views (not accordions)
- Safe area padding at bottom
- Smooth spring animations on sheet open

---

## Expected Result

| Before | After |
|--------|-------|
| Complex nested accordions | Clean flat menu list |
| Small inline avatar | Large header with gradient |
| Hidden camera icon | Always-visible camera overlay |
| No online status | Green status dot indicator |
| Busy visual hierarchy | Clean, consistent rows |
| Desktop-first layout | Mobile-first app-like UX |

---

## Implementation Sequence

1. Create shared `ProfileHeader` component
2. Create shared `MenuListItem` component
3. Create Sheet-based sub-views for each section
4. Refactor `ProfileSection.tsx` with new layout
5. Refactor `SellerSettings.tsx` with new layout
6. Ensure all existing functionality works with new UI
7. Test on mobile and desktop viewports
