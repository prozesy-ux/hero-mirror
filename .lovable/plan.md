
# Category Menu Complete Redesign

## Overview

Update the secondary category menu with relevant digital product category names that match your actual marketplace offerings. This involves updating the existing categories in the database and ensuring the Header displays them properly.

## Current State

The database has these categories:
- Coding, Education, Finance, Marketing, Productivity, SEO, Social Media, Writing, Video, Music, E-commerce, Health, Legal, Real Estate, Travel, Gaming, Customer Service, Business

## Proposed New Categories

Based on your digital products marketplace (streaming accounts, software, AI tools, etc.), here are the updated category names:

| Current Name | New Name |
|-------------|----------|
| Coding | Software |
| Education | Courses |
| Finance | Subscriptions |
| Marketing | Advertising |
| Productivity | Tools |
| SEO | Digital Services |
| Social Media | Social Accounts |
| Writing | Content |
| Video | Streaming |
| Music | Entertainment |
| E-commerce | Marketplaces |
| Health | Lifestyle |
| Legal | Templates |
| Real Estate | Domains & Hosting |
| Travel | VPN & Security |
| Gaming | Gaming Accounts |
| Customer Service | Support Tools |
| Business | Premium Accounts |

## What Will Be Done

### 1. Update Database Categories
Run SQL to rename existing categories to digital product-relevant names.

### 2. Update Header Component
Ensure the secondary nav properly displays:
- **Static filters**: Featured, Hot, New
- **Dynamic categories**: Software, Streaming, Gaming Accounts, AI Tools, etc.

### 3. Set Display Order
Prioritize most popular categories to appear first in the menu.

## Visual Result

```text
Header Secondary Nav:

Featured | Hot | New | Streaming | Software | Gaming | AI Tools | Premium Accounts | Subscriptions | Social Accounts | Entertainment | Tools | Courses | Templates | ...
```

## Technical Details

### Database Update (SQL Migration)

```sql
-- Update category names to match digital product types
UPDATE categories SET name = 'Software', display_order = 1 WHERE name = 'Coding';
UPDATE categories SET name = 'Courses', display_order = 2 WHERE name = 'Education';
UPDATE categories SET name = 'Subscriptions', display_order = 3 WHERE name = 'Finance';
UPDATE categories SET name = 'Advertising', display_order = 4 WHERE name = 'Marketing';
UPDATE categories SET name = 'Tools', display_order = 5 WHERE name = 'Productivity';
UPDATE categories SET name = 'Digital Services', display_order = 6 WHERE name = 'SEO';
UPDATE categories SET name = 'Social Accounts', display_order = 7 WHERE name = 'Social Media';
UPDATE categories SET name = 'Content', display_order = 8 WHERE name = 'Writing';
UPDATE categories SET name = 'Streaming', display_order = 9 WHERE name = 'Video';
UPDATE categories SET name = 'Entertainment', display_order = 10 WHERE name = 'Music';
UPDATE categories SET name = 'Marketplaces', display_order = 11 WHERE name = 'E-commerce';
UPDATE categories SET name = 'Lifestyle', display_order = 12 WHERE name = 'Health';
UPDATE categories SET name = 'Templates', display_order = 13 WHERE name = 'Legal';
UPDATE categories SET name = 'Domains & Hosting', display_order = 14 WHERE name = 'Real Estate';
UPDATE categories SET name = 'VPN & Security', display_order = 15 WHERE name = 'Travel';
UPDATE categories SET name = 'Gaming Accounts', display_order = 16 WHERE name = 'Gaming';
UPDATE categories SET name = 'Support Tools', display_order = 17 WHERE name = 'Customer Service';
UPDATE categories SET name = 'Premium Accounts', display_order = 18 WHERE name = 'Business';
```

### Header.tsx - Enhanced Display

The Header component already fetches categories dynamically. After the database update, it will automatically show the new names. We'll also update the display order to prioritize popular categories.

```tsx
// Current code already handles this:
const { data } = await supabase
  .from("categories")
  .select("id, name")
  .eq("is_active", true)
  .order("display_order")  // Will now order by priority
  .limit(15);
```

## Summary

- **Database**: Rename 18 categories to digital product-relevant names
- **Display Order**: Set priority order so best categories appear first
- **Header**: Will automatically display new names (no code changes needed)
- **Result**: Clean, professional category menu matching your product types
