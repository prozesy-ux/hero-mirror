
# Add Analytics Tracker Script and Content Security Policy

## Overview

Add an external analytics tracker script and Content Security Policy (CSP) meta tags to the `index.html` file to enable advanced tracking and enforce security policies for resource loading.

---

## Changes to index.html

### 1. Content Security Policy Meta Tag

Add a single, comprehensive CSP meta tag that covers all required sources. The CSP will be placed early in the `<head>` section after the viewport meta tag.

**Location**: After line 5 (viewport meta)

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'self' https://yenvbateuuoharllzbds.supabase.co https://*.supabase.co https://*.jsdelivr.net https://*.unpkg.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://cdn.gpteng.co data:; img-src 'self' data: https:;">
```

**Note**: Only ONE CSP meta tag should be used. Multiple CSP tags create conflicting policies.

---

### 2. Analytics Tracker Script

Add the analytics tracker script at the end of `<head>` section, after all other scripts but before the closing `</head>` tag.

**Location**: After line 72 (after JSON-LD schema, before `</head>`)

```html
<!-- Analytics Tracker (Advanced) -->
<script>
  (function(w,d,s,l,i){
    w[l]=w[l]||[];
    var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s);
    j.async=true;
    j.src='https://yenvbateuuoharllzbds.supabase.co/functions/v1/tracker-script?id='+i;
    f.parentNode.insertBefore(j,f);
  })(window,document,'script','_analytics','0386ad7b-fd79-4b9a-8fe5-c31fe30e7382');
</script>
```

---

### 3. Preconnect for Analytics Domain

Add a preconnect link for the analytics Supabase domain to improve script loading performance.

**Location**: After line 31 (with other preconnect links)

```html
<link rel="preconnect" href="https://yenvbateuuoharllzbds.supabase.co" crossorigin />
```

---

## Final Structure

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Content Security Policy -->
    <meta http-equiv="Content-Security-Policy" content="...">
    
    <!-- Critical CSS -->
    <style>...</style>
    
    <!-- Favicons -->
    ...
    
    <!-- Preconnect (including new analytics domain) -->
    <link rel="preconnect" href="https://yenvbateuuoharllzbds.supabase.co" crossorigin />
    ...
    
    <!-- SEO Meta Tags -->
    ...
    
    <!-- JSON-LD Schema -->
    <script type="application/ld+json">...</script>
    
    <!-- Analytics Tracker (Advanced) -->
    <script>
      (function(w,d,s,l,i){...})(window,document,'script','_analytics','0386ad7b-fd79-4b9a-8fe5-c31fe30e7382');
    </script>
  </head>
  <body>
    ...
  </body>
</html>
```

---

## Summary

| Change | Location | Purpose |
|--------|----------|---------|
| CSP Meta Tag | After viewport meta | Security policy for resources |
| Preconnect | With other preconnects | Faster analytics script load |
| Analytics Script | End of head section | External tracking integration |

**File to update**: `index.html`
