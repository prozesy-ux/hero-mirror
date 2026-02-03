
# Product Type-Based Delivery System - Comprehensive Implementation Plan

## Overview

This plan implements a complete delivery system where buyers receive products differently based on the product type. Currently, the system only supports manual credential delivery by sellers. We will extend this to support:

1. **Instant Downloads** - Digital products, E-books, Templates, Graphics, Audio, Video, Software
2. **Course Viewer** - Courses and Tutorials with lesson management
3. **Membership Access** - Recurring access to member-only content
4. **Service Workflows** - Commission (50/50 split), Calls (scheduling), Custom work
5. **Tips/Coffee** - Simple thank-you, no delivery needed
6. **Bundles** - Access to all bundled products

---

## Database Schema Changes

### 1. New Table: `product_content`
Stores downloadable files and content for products.

```sql
CREATE TABLE product_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES seller_products(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'file', 'link', 'text', 'lesson', 'video_stream'
  title TEXT,
  description TEXT,
  file_url TEXT,                    -- For downloadable files
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT,                   -- 'pdf', 'epub', 'zip', 'mp3', 'mp4', etc.
  stream_url TEXT,                  -- For streaming content
  external_link TEXT,               -- For redirect links
  text_content TEXT,                -- For text-based content
  display_order INT DEFAULT 0,
  is_preview BOOLEAN DEFAULT false, -- Free preview content
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. New Table: `course_lessons`
For course/tutorial products with structured lessons.

```sql
CREATE TABLE course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES seller_products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,                   -- Video lesson
  video_duration INT,               -- Duration in seconds
  content_html TEXT,                -- Rich text content
  attachments JSONB DEFAULT '[]',   -- [{url, name, size}]
  display_order INT DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. New Table: `buyer_content_access`
Tracks what content buyers have access to after purchase.

```sql
CREATE TABLE buyer_content_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  order_id UUID REFERENCES seller_orders(id),
  product_id UUID NOT NULL REFERENCES seller_products(id),
  access_type TEXT NOT NULL,        -- 'download', 'stream', 'course', 'membership', 'service'
  access_granted_at TIMESTAMPTZ DEFAULT now(),
  access_expires_at TIMESTAMPTZ,    -- For memberships/subscriptions
  download_count INT DEFAULT 0,
  max_downloads INT,                -- Optional limit
  last_accessed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',      -- Additional data
  UNIQUE(buyer_id, product_id, order_id)
);
```

### 4. New Table: `course_progress`
Tracks buyer progress through courses.

```sql
CREATE TABLE course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES seller_products(id),
  lesson_id UUID NOT NULL REFERENCES course_lessons(id),
  progress_percent INT DEFAULT 0,   -- 0-100
  completed_at TIMESTAMPTZ,
  last_position INT DEFAULT 0,      -- Video position in seconds
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(buyer_id, lesson_id)
);
```

### 5. New Table: `service_bookings`
For Call and Commission products.

```sql
CREATE TABLE service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES seller_orders(id),
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL REFERENCES seller_profiles(id),
  product_id UUID NOT NULL REFERENCES seller_products(id),
  booking_type TEXT NOT NULL,       -- 'call', 'commission'
  status TEXT DEFAULT 'pending',    -- 'pending', 'scheduled', 'in_progress', 'completed', 'cancelled'
  -- For Calls
  scheduled_date DATE,
  scheduled_time TIME,
  duration_minutes INT,
  meeting_link TEXT,
  timezone TEXT,
  -- For Commissions
  commission_brief TEXT,            -- Customer requirements
  deposit_paid BOOLEAN DEFAULT false,
  final_paid BOOLEAN DEFAULT false,
  deliverables JSONB DEFAULT '[]',  -- [{url, name, delivered_at}]
  -- Common
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 6. Extend `seller_products` Table
Add new columns for delivery configuration:

```sql
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS 
  delivery_type TEXT DEFAULT 'manual';       -- 'instant', 'manual', 'course', 'membership', 'service'

ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS 
  call_duration_minutes INT;                 -- For Call products

ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS 
  availability_slots JSONB DEFAULT '[]';     -- For scheduling: [{day, start, end}]

ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS 
  membership_period TEXT;                    -- 'monthly', 'yearly', 'lifetime'

ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS 
  bundle_product_ids UUID[];                 -- For Bundle products
```

---

## Delivery Logic by Product Type

| Product Type | Delivery Type | Buyer Experience |
|--------------|---------------|------------------|
| `digital_product` | instant | Download files immediately |
| `ebook` | instant | Download PDF/ePub/Mobi |
| `template` | instant | Download template files |
| `graphics` | instant | Download design assets |
| `audio` | instant | Download or stream audio |
| `video` | instant | Download or stream video |
| `software` | instant | Download installer/files |
| `course` | course | Access lesson viewer in dashboard |
| `membership` | membership | Access member content while active |
| `bundle` | bundle | Access all bundled products |
| `service` | manual | Seller delivers work product |
| `commission` | commission | 50% deposit, work, 50% final, delivery |
| `call` | call | Book time slot, receive meeting link |
| `coffee` | tip | Thank you message, no delivery |

---

## Frontend Components

### 1. Seller Product Creation (Enhanced)

**File:** `src/pages/NewProduct.tsx`

Add delivery configuration based on product type:

```text
Step 2 Updates:
- Digital/Ebook/Template/Graphics/Audio/Video/Software:
  └── File Uploader (multiple files)
  └── Toggle: "Allow streaming" (for audio/video)
  └── Max downloads limit (optional)

- Course:
  └── Lesson Builder (add/edit lessons)
  └── Video uploader per lesson
  └── Attachments per lesson
  └── Free preview toggle per lesson

- Membership:
  └── Membership period selector (monthly/yearly/lifetime)
  └── Member content uploader

- Call:
  └── Duration selector (15/30/45/60 min)
  └── Availability slots editor

- Commission:
  └── Requirements form template
  └── Expected delivery time

- Bundle:
  └── Product selector (multi-select from existing products)

- Coffee:
  └── Thank you message editor
```

### 2. Buyer Library/Purchases Page

**File:** `src/components/dashboard/BuyerLibrary.tsx` (NEW)

Main hub for buyers to access all purchased products:

```text
┌─────────────────────────────────────────────────────────────────┐
│ My Library                                                       │
├─────────────────────────────────────────────────────────────────┤
│ [All] [Downloads] [Courses] [Memberships] [Services] [Tips]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐         │
│ │ 📦        │ │ 📚        │ │ 🎓        │ │ 💳        │         │
│ │ Template  │ │ E-book    │ │ Course    │ │ Membership│         │
│ │ Pack      │ │ Guide     │ │ (75%)     │ │ (Active)  │         │
│ │ [Download]│ │ [Download]│ │ [Continue]│ │ [Access]  │         │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘         │
│                                                                  │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐                       │
│ │ 🎨        │ │ 📞        │ │ ☕        │                       │
│ │ Commission│ │ Call      │ │ Coffee    │                       │
│ │ (Working) │ │ (Feb 10)  │ │ (Thanks!) │                       │
│ │ [View]    │ │ [Join]    │ │ [Receipt] │                       │
│ └───────────┘ └───────────┘ └───────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Course Viewer Page

**File:** `src/components/dashboard/CourseViewer.tsx` (NEW)

Dedicated page for viewing purchased courses:

```text
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Library          Course: "Ultimate Design Mastery"    │
├────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────┐ ┌────────────────────────┐ │
│ │                                  │ │ LESSONS                │ │
│ │      📹 Video Player             │ │ ✓ 1. Introduction      │ │
│ │                                  │ │ ► 2. Getting Started   │ │
│ │                                  │ │ ○ 3. Advanced Topics   │ │
│ │                                  │ │ ○ 4. Pro Techniques    │ │
│ │                                  │ │ ○ 5. Final Project     │ │
│ ├──────────────────────────────────┤ │                        │ │
│ │ Lesson 2: Getting Started        │ │ Progress: 25%          │ │
│ │ Learn the fundamentals...        │ │ ████░░░░░░░░░          │ │
│ │                                  │ │                        │ │
│ │ 📎 Attachments:                  │ │ [Download All Files]   │ │
│ │  • starter-files.zip             │ │                        │ │
│ │  • cheatsheet.pdf                │ │                        │ │
│ └──────────────────────────────────┘ └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Service/Booking Components

**File:** `src/components/dashboard/ServiceBooking.tsx` (NEW)

For Call and Commission products:

```text
Commission Flow:
1. Buyer submits requirements (brief)
2. Buyer pays 50% deposit
3. Seller works on commission
4. Seller uploads deliverables
5. Buyer reviews and approves
6. Buyer pays remaining 50%
7. Order completed

Call Flow:
1. Buyer purchases call product
2. Buyer sees available time slots
3. Buyer books a slot
4. Both parties get calendar invite
5. Meeting link generated
6. After call: auto-complete
```

### 5. Download Manager

**File:** `src/components/dashboard/DownloadManager.tsx` (NEW)

Handles file downloads with tracking:

```text
Features:
- List all files for a product
- Download individual files
- Download all as ZIP
- Track download count
- Show file size and type
- Streaming option for audio/video
```

---

## Backend Edge Functions

### 1. `grant-product-access` (NEW)
Triggered after successful purchase. Creates appropriate access records:

```typescript
// Pseudo-code
async function grantProductAccess(orderId, buyerId, productId, productType) {
  switch (productType) {
    case 'digital_product':
    case 'ebook':
    case 'template':
    case 'graphics':
    case 'audio':
    case 'video':
    case 'software':
      // Grant instant download access
      await createBuyerContentAccess(buyerId, productId, 'download');
      await updateOrderStatus(orderId, 'completed');
      break;
      
    case 'course':
      // Grant course access
      await createBuyerContentAccess(buyerId, productId, 'course');
      await updateOrderStatus(orderId, 'completed');
      break;
      
    case 'membership':
      // Grant membership with expiry
      const expiresAt = calculateMembershipExpiry(product.membership_period);
      await createBuyerContentAccess(buyerId, productId, 'membership', expiresAt);
      await updateOrderStatus(orderId, 'completed');
      break;
      
    case 'bundle':
      // Grant access to all bundled products
      for (const bundledProductId of product.bundle_product_ids) {
        await grantProductAccess(orderId, buyerId, bundledProductId);
      }
      break;
      
    case 'call':
      // Create booking record, status pending
      await createServiceBooking(orderId, buyerId, productId, 'call');
      // Order stays pending until call completed
      break;
      
    case 'commission':
      // Create commission booking, 50% deposited
      await createServiceBooking(orderId, buyerId, productId, 'commission', {
        deposit_paid: true
      });
      break;
      
    case 'service':
      // Manual delivery by seller
      // Order stays pending
      break;
      
    case 'coffee':
      // Just a tip, auto-complete
      await updateOrderStatus(orderId, 'completed');
      // Send thank you
      break;
  }
}
```

### 2. `generate-download-link` (NEW)
Generates secure, time-limited download URLs.

### 3. `track-course-progress` (NEW)
Updates lesson progress and video position.

---

## Implementation Phases

### Phase 1: Database & Core Infrastructure
1. Create new database tables via migration
2. Add new columns to `seller_products`
3. Update order creation to call `grant-product-access`
4. Create storage bucket for product files

### Phase 2: Seller Product Creation
1. Enhance `NewProduct.tsx` with delivery type fields
2. Add file uploader for downloadable products
3. Add lesson builder for courses
4. Add availability editor for calls

### Phase 3: Buyer Library
1. Create `BuyerLibrary.tsx` component
2. Implement download manager
3. Implement course viewer
4. Add progress tracking

### Phase 4: Services
1. Implement call scheduling flow
2. Implement commission workflow
3. Add booking management for sellers

### Phase 5: Polish
1. Email notifications for each flow
2. Mobile responsive design
3. Analytics and reporting

---

## File Changes Summary

### New Files:
- `src/components/dashboard/BuyerLibrary.tsx`
- `src/components/dashboard/CourseViewer.tsx`
- `src/components/dashboard/DownloadManager.tsx`
- `src/components/dashboard/ServiceBooking.tsx`
- `src/components/seller/LessonBuilder.tsx`
- `src/components/seller/AvailabilityEditor.tsx`
- `src/components/seller/FileContentUploader.tsx`
- `supabase/functions/grant-product-access/index.ts`
- `supabase/functions/generate-download-link/index.ts`
- `supabase/functions/track-course-progress/index.ts`

### Modified Files:
- `src/pages/NewProduct.tsx` - Add delivery configuration UI
- `src/components/dashboard/BuyerOrders.tsx` - Link to Library for accessing content
- `src/components/seller/SellerOrders.tsx` - Show delivery type, different actions
- `src/pages/Dashboard.tsx` - Add Library route
- Database migrations for new tables

---

## Technical Notes

1. **File Storage**: Use Supabase Storage with a `product-files` bucket (private)
2. **Download Security**: Generate signed URLs with expiry (1 hour)
3. **Streaming**: Use HLS for video, progressive for audio
4. **Course Progress**: Save video position every 10 seconds
5. **Memberships**: Cron job to check and revoke expired access
6. **Bundles**: Recursive access granting for nested bundles
