

# SEO & Marketing Admin Section - Complete Implementation

## Overview

Create a comprehensive SEO & Marketing management section in the Admin Panel with instant URL indexing for Google, Bing, Yandex, and other search engines, plus essential SEO management tools.

## Features Summary

| Feature | Description |
|---------|-------------|
| Google Instant Indexing | Submit URLs directly to Google via Indexing API |
| IndexNow (Bing/Yandex) | Instant indexing for Bing, Yandex, DuckDuckGo, Naver |
| Sitemap Generator | Generate and manage XML sitemaps |
| Robots.txt Editor | Edit robots.txt rules from admin panel |
| Meta Tags Manager | Manage global SEO meta tags |
| URL Indexing History | Track all submitted URLs and their status |
| Bulk URL Submission | Submit multiple URLs at once |

## Architecture

```text
Admin Panel
    |
    +-- SEO & Marketing Section
           |
           +-- [Tab] Instant Indexing
           |      +-- Google Indexing API (requires service account)
           |      +-- IndexNow (Bing, Yandex, etc.)
           |      +-- Bulk URL submission
           |      +-- Submission history table
           |
           +-- [Tab] Sitemap & Robots
           |      +-- Auto-generate sitemap.xml
           |      +-- Robots.txt editor
           |      +-- View/download sitemap
           |
           +-- [Tab] Meta Tags
           |      +-- Global site title/description
           |      +-- Open Graph defaults
           |      +-- Twitter Card defaults
           |
           +-- [Tab] Settings
                  +-- API credentials configuration
                  +-- IndexNow key management
                  +-- Google service account setup
```

## Database Schema

### New Table: `seo_settings`
```sql
CREATE TABLE seo_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  site_title TEXT,
  site_description TEXT,
  og_image_url TEXT,
  twitter_handle TEXT,
  google_indexing_enabled BOOLEAN DEFAULT false,
  indexnow_enabled BOOLEAN DEFAULT false,
  indexnow_key TEXT,
  robots_txt_content TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### New Table: `url_indexing_history`
```sql
CREATE TABLE url_indexing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  search_engine TEXT NOT NULL, -- 'google', 'bing', 'yandex', 'indexnow'
  action_type TEXT NOT NULL, -- 'URL_UPDATED', 'URL_DELETED'
  status TEXT NOT NULL, -- 'pending', 'success', 'failed'
  response_data JSONB,
  submitted_by TEXT, -- admin identifier
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Implementation Details

### 1. IndexNow Integration (Bing, Yandex, DuckDuckGo, Naver)

IndexNow is simpler - just needs an API key file hosted on the site:

**Setup Steps:**
1. Generate a unique API key (UUID format)
2. Create verification file at `/[api-key].txt`
3. Submit URLs via POST to `https://api.indexnow.org/indexnow`

**Edge Function:** `seo-indexnow-submit`
```typescript
// POST body format:
{
  "host": "hero-mirror.lovable.app",
  "key": "your-indexnow-key",
  "keyLocation": "https://hero-mirror.lovable.app/your-key.txt",
  "urlList": [
    "https://hero-mirror.lovable.app/page1",
    "https://hero-mirror.lovable.app/page2"
  ]
}
```

### 2. Google Indexing API Integration

**Requirements:**
- Google Cloud Project with Indexing API enabled
- Service Account with JSON key
- Site verified in Google Search Console
- Service account email added as site owner

**Edge Function:** `seo-google-indexing`
```typescript
// Uses JWT authentication with service account
// Scope: https://www.googleapis.com/auth/indexing
// Endpoint: https://indexing.googleapis.com/v3/urlNotifications:publish

// Request body:
{
  "url": "https://hero-mirror.lovable.app/product/xyz",
  "type": "URL_UPDATED" // or "URL_DELETED"
}
```

### 3. Admin UI Component

**New File:** `src/components/admin/SEOManagement.tsx`

Layout:
- Dark theme matching existing admin style (slate-950)
- Four tabs: Instant Indexing, Sitemap & Robots, Meta Tags, Settings
- Stat cards at top showing indexing stats
- URL input with bulk submission support
- History table with status badges

### 4. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/SEOManagement.tsx` | Create | Main SEO management component |
| `src/pages/Admin.tsx` | Modify | Add SEO route |
| `src/components/admin/AdminSidebar.tsx` | Modify | Add SEO nav item |
| `supabase/functions/seo-google-indexing/index.ts` | Create | Google Indexing API edge function |
| `supabase/functions/seo-indexnow-submit/index.ts` | Create | IndexNow submission edge function |
| `supabase/functions/seo-sitemap-generate/index.ts` | Create | Dynamic sitemap generator |
| `supabase/functions/admin-fetch-data/index.ts` | Modify | Add seo_settings and url_indexing_history to whitelist |
| `supabase/functions/admin-mutate-data/index.ts` | Modify | Add tables to whitelist |

### 5. Required Secrets

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email | Google Indexing API |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Private key (PEM format) | Google Indexing API |
| `INDEXNOW_API_KEY` | Self-generated key for IndexNow | Bing, Yandex, etc. |

## UI Design

### Instant Indexing Tab
```text
┌─────────────────────────────────────────────────────────────────────────┐
│ [Stat: URLs Indexed Today] [Stat: Google] [Stat: IndexNow] [Refresh]   │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Enter URL to index...                                               │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ [ ] Google Indexing    [x] IndexNow (Bing/Yandex)                      │
│                                                                         │
│ [Submit URL]  [Bulk Submit...]                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Recent Submissions                                                      │
│ ┌───────────────────────────────────────────────────────────────────── │
│ │ URL                    │ Engine   │ Status  │ Time                  │ │
│ ├───────────────────────────────────────────────────────────────────── │
│ │ /product/netflix...    │ IndexNow │ Success │ 2 min ago             │ │
│ │ /store/premium...      │ Google   │ Pending │ 5 min ago             │ │
│ └───────────────────────────────────────────────────────────────────── │
└─────────────────────────────────────────────────────────────────────────┘
```

### Settings Tab
```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Google Indexing API                                        [Enabled ○] │
│ ─────────────────────────────────────────────────────────────────────── │
│ Service Account Email                                                   │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ indexing@project.iam.gserviceaccount.com                            │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ Private Key (paste PEM format)                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ -----BEGIN PRIVATE KEY-----...                                      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│ IndexNow (Bing, Yandex, DuckDuckGo)                        [Enabled x] │
│ ─────────────────────────────────────────────────────────────────────── │
│ API Key: a8f2c9e4-1234-5678-9abc-def012345678                          │
│ [Generate New Key]  [View Verification File]                           │
│ Verification URL: /a8f2c9e4-1234-5678-9abc-def012345678.txt            │
└─────────────────────────────────────────────────────────────────────────┘
```

## Search Engines Supported

| Engine | Method | API Endpoint |
|--------|--------|--------------|
| Google | Indexing API | `indexing.googleapis.com/v3/urlNotifications:publish` |
| Bing | IndexNow | `api.indexnow.org/indexnow` |
| Yandex | IndexNow | `yandex.com/indexnow` |
| DuckDuckGo | IndexNow | Via IndexNow protocol |
| Naver | IndexNow | `searchadvisor.naver.com/indexnow` |
| Seznam | IndexNow | Via IndexNow protocol |

## Edge Function Logic

### Google Indexing (JWT Auth)
1. Load service account credentials from secrets
2. Generate JWT token with scope `https://www.googleapis.com/auth/indexing`
3. Exchange JWT for access token
4. POST to Indexing API with URL
5. Log result to `url_indexing_history`

### IndexNow (Simple API Key)
1. Load IndexNow key from settings
2. POST to `api.indexnow.org/indexnow` with URL list
3. Log result to `url_indexing_history`

## Implementation Steps

1. **Database Migration**: Create `seo_settings` and `url_indexing_history` tables
2. **Update Whitelists**: Add new tables to admin-fetch-data and admin-mutate-data
3. **Create Edge Functions**: seo-google-indexing, seo-indexnow-submit
4. **Create UI Component**: SEOManagement.tsx with all tabs
5. **Update Admin Routes**: Add /admin/seo route
6. **Update Admin Sidebar**: Add SEO navigation item
7. **Deploy & Test**: Test with real URLs

