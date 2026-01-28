/**
 * Session Recovery Manager - Enterprise Grade
 * 
 * Centralized coordination of session recovery operations.
 * Prevents race conditions and duplicate refresh attempts across the app.
 * 
 * Features:
 * - Deduplicates concurrent recovery calls
 * - Global channel cleanup on recovery
 * - Event notification for components to resubscribe
 */

import { supabase } from '@/integrations/supabase/client';

class SessionRecoveryManager {
  private isRecovering = false;
  private recoveryPromise: Promise<boolean> | null = null;
  private listeners: Set<() => void> = new Set();

  /**
   * Single entry point for session recovery.
   * Deduplicates concurrent calls - all callers get the same promise.
   */
  async recover(): Promise<boolean> {
    // If already recovering, return existing promise
    if (this.isRecovering && this.recoveryPromise) {
      console.log('[SessionRecovery] Recovery already in progress, joining existing attempt');
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

  /**
   * Internal recovery logic
   */
  private async doRecovery(): Promise<boolean> {
    try {
      console.log('[SessionRecovery] Starting recovery...');

      // First, clean up all existing realtime channels
      await this.cleanupChannels();

      // Then refresh the session
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        console.error('[SessionRecovery] Recovery failed:', error?.message);
        return false;
      }

      console.log('[SessionRecovery] Session recovered successfully');

      // Notify all listeners (components will resubscribe to channels)
      this.notifyListeners();

      // Emit global event for components not using the listener pattern
      window.dispatchEvent(new CustomEvent('session-recovered'));

      return true;
    } catch (err) {
      console.error('[SessionRecovery] Unexpected error during recovery:', err);
      return false;
    }
  }

  /**
   * Clean up all realtime channels to prevent stale connections
   */
  private async cleanupChannels(): Promise<void> {
    try {
      const channels = supabase.getChannels();
      if (channels.length > 0) {
        console.log(`[SessionRecovery] Cleaning up ${channels.length} channels`);
        await supabase.removeAllChannels();
      }
    } catch (err) {
      console.warn('[SessionRecovery] Channel cleanup error (non-fatal):', err);
    }
  }

  /**
   * Subscribe to recovery events
   * Returns unsubscribe function
   */
  onRecovery(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Check if recovery is currently in progress
   */
  get isInProgress(): boolean {
    return this.isRecovering;
  }

  /**
   * Notify all listeners that recovery completed
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (err) {
        console.error('[SessionRecovery] Listener error:', err);
      }
    });
  }
}

// Singleton instance
export const sessionRecovery = new SessionRecoveryManager();
