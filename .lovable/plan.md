

# Route help.uptoza.com to Show the Help Page

## Problem

The subdomain `help.uptoza.com` is connected to the project, but when users visit it, the app loads the `/` route which shows the **Index (landing) page** instead of the Help Center. This is because React Router only looks at the URL path (`/`), not the hostname/subdomain.

## Solution

Add subdomain detection logic in `App.tsx` that checks if the current hostname starts with `help.` and, if so, renders the Help page at the `/` route instead of the Index page.

## File to Modify

### `src/App.tsx`
- Add a constant that detects the `help.` subdomain: `const isHelpSubdomain = window.location.hostname.startsWith('help.')`
- Change the `/` route to conditionally render `<Help />` when on the help subdomain, and `<Index />` otherwise
- This way, `help.uptoza.com/` shows the Help Center, while `uptoza.com/` still shows the landing page
- All other routes (`/help`, `/marketplace`, etc.) continue to work normally on both domains

## Technical Details

```text
// Detection logic added at top of App component:
const isHelpSubdomain = window.location.hostname.startsWith('help.');

// Route change:
<Route path="/" element={
  isHelpSubdomain ? (
    <Suspense fallback={<AppShell />}>
      <Help />
    </Suspense>
  ) : (
    <Index />
  )
} />
```

## What Stays the Same
- The `/help` route still works on the main domain (uptoza.com/help)
- All other routes remain unchanged
- No backend or DNS changes needed -- the subdomain is already connected

