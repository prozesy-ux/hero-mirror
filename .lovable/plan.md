
## Remove /help Path Route

Since `help.uptoza.com` subdomain is now working correctly with the subdomain detection logic, the `/help` path route is no longer needed. This keeps the routing clean and directs all help traffic through the dedicated subdomain.

### File to Modify

**`src/App.tsx`**
- Remove the `/help` route at lines 117-121
- Keep all other routes unchanged
- The Help page will still be accessible via:
  - `help.uptoza.com/` (subdomain - main access point)
  - Any internal routes within Help that use relative paths

### What This Accomplishes
- Eliminates duplicate access points (cleaner architecture)
- Forces all help traffic through the dedicated `help.uptoza.com` subdomain
- Reduces potential confusion with multiple routes serving the same content
- Users navigating to `/help` on main domain will get 404 (expected behavior)

### No Changes Needed To
- Header component (doesn't currently link to `/help`)
- Help component code
- Subdomain detection logic (stays as-is)
- Any other routes
