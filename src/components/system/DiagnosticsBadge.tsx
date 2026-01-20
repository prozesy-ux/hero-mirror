import React, { useMemo, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useHealthState, healthMonitor } from '@/lib/health-monitor';
import { isCurrentlyRecovering } from '@/lib/backend-recovery';

/**
 * Enhanced diagnostics badge for debugging session issues.
 * Shows auth status, last auth event, session expiry, and storage presence.
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

  const hasStorageKeys = useMemo(() => healthMonitor.hasAuthStorageKeys(), [open]);
  
  const currentRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
  
  const sessionExpiryDisplay = useMemo(() => {
    if (!health.sessionExpiresAt) return '—';
    const expiresAt = new Date(health.sessionExpiresAt);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    
    if (diffMs < 0) return 'EXPIRED';
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m`;
  }, [health.sessionExpiresAt]);
  
  const lastEventTimeDisplay = useMemo(() => {
    if (!health.lastAuthEventTime) return '—';
    const diff = Date.now() - health.lastAuthEventTime;
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }, [health.lastAuthEventTime]);

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
        <div className="mt-2 w-[320px] rounded-xl border border-border bg-background/95 backdrop-blur p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-foreground">Session Diagnostics</div>
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

          <div className="mt-2 space-y-1.5 text-xs">
            {/* Route */}
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Route</span>
              <span className="text-foreground font-mono text-[10px] truncate max-w-[180px]">{currentRoute}</span>
            </div>
            
            {/* Auth Status */}
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Auth</span>
              <span className={`font-medium ${status === 'auth:ok' ? 'text-primary' : status === 'auth:none' ? 'text-destructive' : 'text-muted-foreground'}`}>
                {status}
              </span>
            </div>
            
            {/* User ID */}
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">User</span>
              <span className="text-foreground truncate max-w-[160px] font-mono text-[10px]">{user?.id || '—'}</span>
            </div>
            
            {/* Last Auth Event */}
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Last Event</span>
              <span className="text-foreground">
                {health.lastAuthEvent || '—'} 
                <span className="text-muted-foreground ml-1">({lastEventTimeDisplay})</span>
              </span>
            </div>
            
            {/* Session Expiry */}
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Expires In</span>
              <span className={`font-medium ${sessionExpiryDisplay === 'EXPIRED' ? 'text-destructive' : 'text-foreground'}`}>
                {sessionExpiryDisplay}
              </span>
            </div>
            
            {/* Storage Keys */}
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">sb-* Keys</span>
              <span className={`font-medium ${hasStorageKeys ? 'text-primary' : 'text-destructive'}`}>
                {hasStorageKeys ? 'present' : 'missing'}
              </span>
            </div>
            
            <div className="border-t border-border my-2 pt-2" />
            
            {/* Ping Status */}
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Ping</span>
              <span className={`font-medium ${health.lastPingSuccess ? 'text-primary' : 'text-destructive'}`}>
                {health.lastPingSuccess ? 'ok' : 'fail'}
              </span>
            </div>
            
            {/* Health AuthStatus */}
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Health Auth</span>
              <span className="text-foreground">{health.authStatus}</span>
            </div>
            
            {/* Consecutive Failures */}
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Failures</span>
              <span className={`font-medium ${health.consecutiveFailures > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {health.consecutiveFailures}
              </span>
            </div>
            
            {/* Last Error */}
            {health.lastError && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">LastErr</span>
                <span className="text-destructive truncate max-w-[160px]">{health.lastError}</span>
              </div>
            )}
            
            {/* Recovering */}
            {(health.isRecovering || isCurrentlyRecovering()) && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Status</span>
                <span className="text-accent font-medium animate-pulse">Recovering...</span>
              </div>
            )}
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-muted-foreground">Recent Logs ({healthMonitor.getLogs().length})</summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted p-2 text-[10px] leading-snug text-foreground">
{healthMonitor.getLogs().slice(-15).map((log, i) => {
  const time = new Date(log.timestamp).toLocaleTimeString();
  const dataStr = log.data ? ` ${JSON.stringify(log.data)}` : '';
  return `[${time}] ${log.type.toUpperCase()}: ${log.message}${dataStr}`;
}).join('\n')}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
