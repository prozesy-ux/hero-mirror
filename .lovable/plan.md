

# 12-Hour Persistent Login Update

## Summary

Update the existing session persistence from 24 hours to **12 hours** minimum. Users will:
- Stay logged in even after closing tabs/browsers
- Access /dashboard or /seller directly without re-login (within 12h)
- Only logout when: manual logout, clear cookies/storage, or 12+ hours expired

## Changes Required

### 1. Session Persistence Utility
**File:** `src/lib/session-persistence.ts`

| Line | Change |
|------|--------|
| 5 | Update comment: "24 hours" → "12 hours" |
| 9 | `SESSION_DURATION = 12 * 60 * 60 * 1000` (12 hours) |
| 16 | Log message: "24h" → "12h" |
| 20 | Comment: "24-hour" → "12-hour" |
| 30 | Log message: "24h" → "12h" |
| 37 | Comment: "24-hour" → "12-hour" |
| 60 | Log message: "24h" → "12h" |

### 2. Session Heartbeat Hook
**File:** `src/hooks/useSessionHeartbeat.ts`

| Line | Change |
|------|--------|
| 5 | Comment: "24 hours" → "12 hours" |
| 10 | Comment: "24-hour" → "12-hour" |
| 54 | Comment: "24-hour" → "12-hour" |
| 56 | Log: "24h" → "12h" |
| 60 | Comment: "24h+" → "12h+" |
| 61 | Log: "24h" → "12h" |
| 88 | Comment: "24h" → "12h" |
| 90 | Log: "24h" → "12h" |

### 3. Auth Hook
**File:** `src/hooks/useAuth.ts`

| Line | Change |
|------|--------|
| 59 | Log message: "24h" → "12h" |

### 4. Protected Route
**File:** `src/components/auth/ProtectedRoute.tsx`

| Line | Change |
|------|--------|
| 90 | Comment: "24-hour" → "12-hour" |
| 92 | Log: "24h" → "12h" |
| 101 | Log: "24h" → "12h" |

## How It Works

```text
User Login
    │
    ▼
┌─────────────────────────────┐
│ markSessionStart()          │ ← Store timestamp in localStorage
│ 12-hour persistence begins  │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ User closes tab/browser     │
│ Comes back later            │
│ Visits /dashboard or /seller│
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ Check localStorage session  │
│ If within 12h → AUTO LOGIN  │
│ If 12h+ expired → REDIRECT  │
└─────────────────────────────┘
```

## Expected Behavior

| Scenario | Result |
|----------|--------|
| User closes tab, returns in 1 hour | ✅ Auto logged in |
| User closes browser, returns in 6 hours | ✅ Auto logged in |
| User directly visits /dashboard after 10 hours | ✅ Auto logged in |
| User returns after 12+ hours | ❌ Redirect to login |
| User clicks "Log Out" | ❌ Logged out immediately |
| User clears cookies/localStorage | ❌ Logged out |

## Technical Note

Supabase already stores the session in localStorage with `persistSession: true`. The 12-hour window is a **grace period** - if token refresh fails for any reason (network issue, server error), the user stays logged in as long as they're within 12 hours of their last login.

