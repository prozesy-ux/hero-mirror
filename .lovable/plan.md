

# Update Favicon to Uptoza Logo

## Overview

Update the website favicon from the current inline SVG (purple gradient "U") to your uploaded Uptoza logo (green "U" icon).

## Current State

The favicon is currently set as an inline SVG in `index.html`:
```html
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,..." />
```
This shows a purple/pink gradient "U" on a rounded square background.

## Implementation

### Step 1: Copy Uploaded Image to Public Folder

Copy your uploaded image to the public folder where it can be served as a favicon:
```
user-uploads://image-25.png → public/favicon.png
```

### Step 2: Update index.html

Replace the current inline SVG favicon with a reference to the new PNG file:

**Before:**
```html
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,..." />
```

**After:**
```html
<link rel="icon" type="image/png" href="/favicon.png" />
```

## Files to Modify

| File | Action |
|------|--------|
| `public/favicon.png` | Create (copy from uploaded image) |
| `index.html` | Update favicon link |

## Google Search Update

Regarding instant updates on Google:
- Your website favicon will update immediately after deployment
- Google search results take time to update (days to weeks) as Google needs to re-crawl your site
- To speed this up, you can use **Google Search Console** → URL Inspection → Request Indexing for your homepage

## Technical Details

- PNG format works well for favicons
- The uploaded image will be used directly as the favicon
- Modern browsers support PNG favicons natively

