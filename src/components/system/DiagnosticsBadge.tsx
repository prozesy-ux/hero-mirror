import React, { useMemo, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useHealthState, healthMonitor } from '@/lib/health-monitor';
import { isCurrentlyRecovering } from '@/lib/backend-recovery';

/**
 * Small always-on diagnostics badge (top-right) to quickly debug refresh failures.
 * Kept intentionally compact; can be removed later.
 */
export default function DiagnosticsBadge() {
  const { user, session, loading } = useAuthContext();
  const health = useHealthState();
  const [open, setOpen] = useState(false);

  const status = useMemo(() => {
    if (loading) return 'auth:loading';
    if (!session) return 'auth:none';
    return 'auth:ok';
  }, [loading, session]);

  const dotClass = useMemo(() => {
    if (health.isRecovering || isCurrentlyRecovering()) return 'bg-accent';
    if (!health.lastPingSuccess) return 'bg-destructive';
    if (health.authStatus === 'none') return 'bg-muted-foreground';
    return 'bg-primary';
  }, [health]);

  return (
    <div className="fixed top-3 right-3 z-[110]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-background/80 backdrop-blur px-3 py-1.5 shadow-sm"
        aria-label="Diagnostics"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
        <span className="text-xs text-foreground">Diag</span>
      </button>

      {open && (
        <div className="mt-2 w-[280px] rounded-xl border border-border bg-background/95 backdrop-blur p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-foreground">Diagnostics</div>
            <button
              type="button"
              onClick={() => {
                healthMonitor.clearLogs();
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>

          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between gap-2">
              <span>Auth</span>
              <span className="text-foreground">{status}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>User</span>
              <span className="text-foreground truncate max-w-[160px]">{user?.id || '—'}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Ping</span>
              <span className="text-foreground">{health.lastPingSuccess ? 'ok' : 'fail'}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>AuthStatus</span>
              <span className="text-foreground">{health.authStatus}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Failures</span>
              <span className="text-foreground">{health.consecutiveFailures}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>LastErr</span>
              <span className="text-foreground truncate max-w-[160px]">{health.lastError || '—'}</span>
            </div>
          </div>

          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-muted-foreground">Logs</summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-muted p-2 text-[10px] leading-snug text-foreground">
{JSON.stringify(healthMonitor.getLogs().slice(-10), null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
