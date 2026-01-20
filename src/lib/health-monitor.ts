/**
 * Backend Health Monitor - Tracks connection status and enables diagnostics
 * Enhanced with auth event logging for debugging session issues
 */
import React from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HealthState {
  lastPingTime: number | null;
  lastPingSuccess: boolean;
  consecutiveFailures: number;
  lastError: string | null;
  lastErrorCode: number | null;
  isRecovering: boolean;
  authStatus: 'unknown' | 'valid' | 'expired' | 'none';
  lastAuthEvent: string | null;
  lastAuthEventTime: number | null;
  sessionExpiresAt: number | null;
}

interface HealthLog {
  timestamp: number;
  type: 'ping' | 'auth' | 'error' | 'recovery';
  message: string;
  data?: Record<string, unknown>;
}

const MAX_LOGS = 100;
const PING_INTERVAL = 30000; // 30 seconds
const STORAGE_KEY = 'lovable_health_logs';

class HealthMonitor {
  private state: HealthState = {
    lastPingTime: null,
    lastPingSuccess: false,
    consecutiveFailures: 0,
    lastError: null,
    lastErrorCode: null,
    isRecovering: false,
    authStatus: 'unknown',
    lastAuthEvent: null,
    lastAuthEventTime: null,
    sessionExpiresAt: null,
  };

  private logs: HealthLog[] = [];
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(state: HealthState) => void> = new Set();

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch {
      this.logs = [];
    }
  }

  private saveLogs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(-MAX_LOGS)));
    } catch {
      // Storage full or unavailable
    }
  }

  /**
   * Public log method - can be called from anywhere to log events
   */
  log(type: HealthLog['type'], message: string, data?: Record<string, unknown>) {
    const entry: HealthLog = {
      timestamp: Date.now(),
      type,
      message,
      data
    };
    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(-MAX_LOGS);
    }
    this.saveLogs();
    
    // Console output with grouping
    const prefix = `[Health:${type.toUpperCase()}]`;
    if (type === 'error') {
      console.warn(prefix, message, data || '');
    } else {
      console.log(prefix, message, data || '');
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  /**
   * Record an auth event - called by useAuth on every onAuthStateChange
   */
  recordAuthEvent(event: string, session: { user?: { id: string }; expires_at?: number } | null) {
    this.state.lastAuthEvent = event;
    this.state.lastAuthEventTime = Date.now();
    this.state.sessionExpiresAt = session?.expires_at ? session.expires_at * 1000 : null;
    
    if (session) {
      this.state.authStatus = 'valid';
    } else if (event === 'SIGNED_OUT') {
      this.state.authStatus = 'none';
    } else if (event === 'TOKEN_REFRESHED' && !session) {
      this.state.authStatus = 'expired';
    }
    
    this.log('auth', `Auth event: ${event}`, {
      hasSession: !!session,
      userId: session?.user?.id,
      expiresAt: session?.expires_at,
    });
    
    this.notifyListeners();
  }

  async ping(): Promise<boolean> {
    try {
      // Quick auth check first
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        this.state.authStatus = 'expired';
        this.log('auth', 'Session check failed', { error: authError.message });
      } else if (!session) {
        this.state.authStatus = 'none';
      } else {
        this.state.authStatus = 'valid';
        this.state.sessionExpiresAt = session.expires_at ? session.expires_at * 1000 : null;
      }

      // Only do DB ping if we have a session
      if (session) {
        const { error: dbError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .limit(1)
          .maybeSingle();

        if (dbError) {
          throw dbError;
        }
      }

      // Success
      this.state.lastPingTime = Date.now();
      this.state.lastPingSuccess = true;
      this.state.consecutiveFailures = 0;
      this.state.lastError = null;
      this.state.lastErrorCode = null;
      this.log('ping', 'Backend ping successful', { authStatus: this.state.authStatus });
      this.notifyListeners();
      return true;

    } catch (error: unknown) {
      this.state.lastPingTime = Date.now();
      this.state.lastPingSuccess = false;
      this.state.consecutiveFailures++;
      
      const err = error as { message?: string; code?: string; status?: number };
      this.state.lastError = err.message || 'Unknown error';
      this.state.lastErrorCode = err.status || null;
      
      this.log('error', 'Backend ping failed', {
        error: this.state.lastError,
        code: this.state.lastErrorCode,
        failures: this.state.consecutiveFailures
      });
      
      this.notifyListeners();
      return false;
    }
  }

  start() {
    if (this.pingInterval) return;
    
    this.log('ping', 'Health monitor started');
    
    // Initial ping
    this.ping();
    
    // Regular pings
    this.pingInterval = setInterval(() => {
      this.ping();
    }, PING_INTERVAL);
  }

  stop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      this.log('ping', 'Health monitor stopped');
    }
  }

  setRecovering(isRecovering: boolean) {
    this.state.isRecovering = isRecovering;
    this.log('recovery', isRecovering ? 'Recovery started' : 'Recovery ended');
    this.notifyListeners();
  }

  getState(): HealthState {
    return { ...this.state };
  }

  getLogs(): HealthLog[] {
    return [...this.logs];
  }

  subscribe(listener: (state: HealthState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  clearLogs() {
    this.logs = [];
    this.saveLogs();
  }
  
  /**
   * Check if auth storage keys exist (for diagnostics)
   */
  hasAuthStorageKeys(): boolean {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-')) {
        return true;
      }
    }
    return false;
  }
}

// Singleton instance
export const healthMonitor = new HealthMonitor();

// React hook for subscribing to health state
export function useHealthState() {
  const [state, setState] = React.useState(healthMonitor.getState());
  
  React.useEffect(() => {
    return healthMonitor.subscribe(setState);
  }, []);
  
  return state;
}
