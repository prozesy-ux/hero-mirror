
# Enterprise Session Handling Optimization - Zero Issues at Scale

## Current Architecture Assessment

Your application already has a solid session handling foundation:

| Component | Status | Purpose |
|-----------|--------|---------|
| `AuthContext.tsx` | Implemented | UI state machine with `sessionVerified`, `canMutate`, `sessionExpired` |
| `useSessionHeartbeat.ts` | Implemented | 5-minute background checks, proactive token refresh |
| `api-fetch.ts` | Implemented | 401 retry with automatic refresh, 15s timeout |
| `validate-session` edge function | Implemented | Server-side JWT validation with 12h grace period |
| `session-detector.ts` | Implemented | Synchronous local session check for instant rendering |
| `session-persistence.ts` | Implemented | 12-hour login window tracking |
| `SessionExpiredBanner` | Implemented | Soft, non-blocking expiry notification |
| Realtime resubscription | Implemented | `session-refreshed` event for channel reconnection |
| LocalStorage cache fallback | Implemented | Offline resilience in dashboards |

---

## Identified Gaps for Scale

After thorough analysis, here are the missing pieces:

### Gap 1: No Tab Visibility Recovery
When users switch tabs (to other apps) for extended periods, the session can silently expire without refresh triggers.

### Gap 2: No Network State Handling
No detection of offline/online transitions - reconnections don't trigger session revalidation.

### Gap 3: No Exponential Backoff on Failures
Heartbeat uses fixed 5-minute intervals even during failures, which can overwhelm the server during outages.

### Gap 4: Missing Global Channel Cleanup
When token refreshes, individual components handle their own channels but there's no global cleanup preventing stale connections.

### Gap 5: No Request Queue During Refresh
Concurrent API calls during token refresh can cause race conditions where some calls use stale tokens.

### Gap 6: No Session Timeout Warning
Users get no advance warning before session expiry - just a sudden banner.

---

## Implementation Plan

### Phase 1: Tab Visibility Recovery

Add visibility change detection to trigger session revalidation when user returns to tab.

**File: `src/hooks/useSessionHeartbeat.ts`**

```typescript
// Add visibility change listener
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && isAuthenticated) {
      console.log('[Heartbeat] Tab visible - checking session');
      heartbeat();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [isAuthenticated, heartbeat]);
```

### Phase 2: Network State Detection

Detect online/offline transitions and trigger recovery when network returns.

**File: `src/hooks/useSessionHeartbeat.ts`**

```typescript
// Add online/offline detection
useEffect(() => {
  const handleOnline = () => {
    console.log('[Heartbeat] Network online - revalidating session');
    heartbeat();
  };
  
  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}, [heartbeat]);
```

### Phase 3: Exponential Backoff

Implement smart retry logic that backs off during failures to prevent server overload.

**File: `src/hooks/useSessionHeartbeat.ts`**

```typescript
const [failureCount, setFailureCount] = useState(0);
const MAX_BACKOFF = 5 * 60 * 1000; // 5 minutes max

// Calculate interval with exponential backoff
const getNextInterval = () => {
  if (failureCount === 0) return HEARTBEAT_INTERVAL;
  return Math.min(HEARTBEAT_INTERVAL * Math.pow(2, failureCount), MAX_BACKOFF);
};
```

### Phase 4: Global Session Recovery Manager

Create a centralized session recovery service that coordinates all recovery operations.

**New File: `src/lib/session-recovery.ts`**

```typescript
/**
 * Session Recovery Manager
 * 
 * Centralized coordination of session recovery operations.
 * Prevents race conditions and duplicate refresh attempts.
 */

class SessionRecoveryManager {
  private isRecovering = false;
  private recoveryPromise: Promise<boolean> | null = null;
  private listeners: Set<() => void> = new Set();

  // Single recovery entry point - deduplicates concurrent calls
  async recover(): Promise<boolean>;
  
  // Subscribe to recovery events
  onRecovery(callback: () => void): () => void;
  
  // Emit recovery complete event
  private notifyListeners(): void;
}

export const sessionRecovery = new SessionRecoveryManager();
```

### Phase 5: Request Queue During Refresh

Implement a request queue that holds API calls during token refresh.

**File: `src/lib/api-fetch.ts`**

```typescript
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeToRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshComplete = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

// In apiFetch: queue requests during refresh instead of concurrent refreshes
```

### Phase 6: Session Timeout Warning

Add a warning 5 minutes before session expires.

**New File: `src/components/ui/session-warning-banner.tsx`**

- Yellow warning banner showing "Session expires in X minutes"
- Automatic refresh button
- Dismissable with auto-dismiss when refreshed

**Update: `src/hooks/useSessionHeartbeat.ts`**

- Add `sessionWarning` state
- Set warning when token expires in < 5 minutes
- Clear warning after successful refresh

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/session-recovery.ts` | CREATE | Centralized recovery manager |
| `src/hooks/useSessionHeartbeat.ts` | MODIFY | Add visibility, network, backoff |
| `src/lib/api-fetch.ts` | MODIFY | Add request queue during refresh |
| `src/components/ui/session-warning-banner.tsx` | CREATE | 5-minute expiry warning |
| `src/contexts/AuthContext.tsx` | MODIFY | Add `sessionWarning` state |
| `src/pages/Dashboard.tsx` | MODIFY | Add SessionWarningBanner |
| `src/pages/Seller.tsx` | MODIFY | Add SessionWarningBanner |

---

## Technical Implementation Details

### 1. Session Recovery Manager (session-recovery.ts)

```typescript
import { supabase } from '@/integrations/supabase/client';

class SessionRecoveryManager {
  private isRecovering = false;
  private recoveryPromise: Promise<boolean> | null = null;
  private listeners: Set<() => void> = new Set();

  async recover(): Promise<boolean> {
    // Deduplicate concurrent recovery attempts
    if (this.isRecovering && this.recoveryPromise) {
      return this.recoveryPromise;
    }

    this.isRecovering = true;
    this.recoveryPromise = this.doRecovery();
    
    try {
      return await this.recoveryPromise;
    } finally {
      this.isRecovering = false;
      this.recoveryPromise = null;
    }
  }

  private async doRecovery(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.error('[SessionRecovery] Failed:', error?.message);
        return false;
      }

      console.log('[SessionRecovery] Success');
      this.notifyListeners();
      return true;
    } catch (err) {
      console.error('[SessionRecovery] Unexpected error:', err);
      return false;
    }
  }

  onRecovery(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb());
  }
}

export const sessionRecovery = new SessionRecoveryManager();
```

### 2. Enhanced Heartbeat with Visibility/Network

```typescript
// Add to useSessionHeartbeat.ts

// Visibility change handler
useEffect(() => {
  if (!isAuthenticated) return;

  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      console.log('[Heartbeat] Tab became visible - checking session');
      await heartbeat();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [isAuthenticated]);

// Network recovery handler  
useEffect(() => {
  if (!isAuthenticated) return;

  const handleOnline = async () => {
    console.log('[Heartbeat] Network reconnected - revalidating');
    await heartbeat();
  };

  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}, [isAuthenticated]);
```

### 3. Session Warning Banner

```typescript
// session-warning-banner.tsx
const SessionWarningBanner = ({ minutesRemaining, onRefresh }: Props) => {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 rounded-xl border-yellow-500/30 bg-yellow-50 px-4 py-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <span>Session expires in {minutesRemaining} minutes</span>
        <Button size="sm" onClick={onRefresh}>
          Refresh Now
        </Button>
      </div>
    </div>
  );
};
```

---

## Expected Outcomes

After implementation:

1. **Tab Switch Recovery**: Session validates automatically when users return to the tab
2. **Network Recovery**: Session revalidates when internet reconnects
3. **Graceful Degradation**: Exponential backoff prevents server overload during issues
4. **No Race Conditions**: Centralized recovery prevents duplicate refresh attempts
5. **Advance Warning**: Users see 5-minute warning before session expires
6. **Zero Forced Logouts**: 12-hour grace window + proactive refresh = no unexpected logouts
7. **Offline Resilience**: Cached data shows while network is down

---

## Monitoring Recommendations (Post-Implementation)

To track session health at scale, consider adding:

1. **Console logging patterns** already in place - no changes needed
2. **Optional**: Add analytics events for session refresh success/failure rates
3. **Optional**: Track average session duration and refresh frequency

