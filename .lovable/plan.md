

# Update Uptoza Enterprise-Level Branding

## Overview

Update all site meta tags and SEO content to reflect Uptoza's enterprise-level positioning as a global digital commerce platform, similar to Amazon, Google, and Stripe's professional branding style.

## New Branding Content

| Element | New Value |
|---------|-----------|
| Site Title | `Uptoza \| The Digital Commerce Platform` |
| Description | `Uptoza powers global digital commerce. A unified platform for digital products, premium services, and AI-driven solutions. Trusted by creators and businesses worldwide.` |
| OG Title | `Uptoza \| The Digital Commerce Platform` |
| OG Description | `Uptoza powers global digital commerce. A unified platform for digital products, premium services, and AI-driven solutions.` |

## Implementation

### Changes to `index.html`

**Current (casual marketplace tone):**
```html
<title>Uptoza - AI Marketplace</title>
<meta name="description" content="Uptoza AI Marketplace - Search millions of AI prompts..." />
<meta property="og:title" content="Uptoza - AI Marketplace" />
<meta property="og:description" content="Search millions of AI prompts..." />
```

**Updated (enterprise authority tone):**
```html
<title>Uptoza | The Digital Commerce Platform</title>
<meta name="description" content="Uptoza powers global digital commerce. A unified platform for digital products, premium services, and AI-driven solutions. Trusted by creators and businesses worldwide." />
<meta property="og:title" content="Uptoza | The Digital Commerce Platform" />
<meta property="og:description" content="Uptoza powers global digital commerce. A unified platform for digital products, premium services, and AI-driven solutions." />
```

## Files to Modify

| File | Changes |
|------|---------|
| `index.html` | Update title, description, og:title, and og:description meta tags |

## After Implementation

Once approved, you should also update the SEO Settings in your Admin Panel (`/admin/seo` → Meta Tags tab) with the same values to ensure consistency across:
- Database-driven SEO settings
- Static HTML fallback tags

