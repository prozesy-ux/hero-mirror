/**
 * useAuth Hook - Enterprise Grade
 * 
 * Handles authentication state with:
 * - Session persistence tracking
 * - Admin role caching
 * - Data prefetching on sign-in for instant page loads
 * - Token refresh event emission for realtime resubscription
 */

import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { markSessionStart, clearSessionTimestamp } from '@/lib/session-persistence';
import { bffApi } from '@/lib/api-fetch';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = async (userId: string) => {
    try {
      // Check cache first to avoid repeated RPC calls
      const cacheKey = `admin_${userId}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached !== null) {
        return cached === 'true';
      }
      
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: userId, _role: 'admin' });
      
      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      
      // Cache the result for this session
      sessionStorage.setItem(cacheKey, String(data === true));
      return data === true;
    } catch (err) {
      console.error('Error in checkAdminRole:', err);
      return false;
    }
  };

  /**
   * Prefetch dashboard data on sign-in for instant page loads
   * This runs in background - errors are silently ignored
   */
  const prefetchDashboardData = async () => {
    try {
      console.log('[useAuth] Prefetching dashboard data for instant loads...');
      
      // Prefetch in parallel - we don't wait for results
      // React Query will cache these for instant access
      Promise.allSettled([
        bffApi.getBuyerDashboard(),
        bffApi.getSellerDashboard(),
        bffApi.getBuyerWallet()
      ]).then((results) => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`[useAuth] Prefetched ${successful}/3 dashboard endpoints`);
      });
    } catch (err) {
      // Silent fail - prefetch is best-effort
      console.warn('[useAuth] Prefetch error (non-critical):', err);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state changed:', event);
        
        // Mark session start on successful sign in
        if (event === 'SIGNED_IN') {
          markSessionStart();
          console.log('[useAuth] Session marked - 12h window started');
          
          // Prefetch dashboard data for instant page loads
          // Small delay to ensure session is fully established
          setTimeout(prefetchDashboardData, 100);
        }
        
        // Clear session timestamp and admin cache on signout
        if (event === 'SIGNED_OUT') {
          clearSessionTimestamp();
          const userId = session?.user?.id || user?.id;
          if (userId) {
            sessionStorage.removeItem(`admin_${userId}`);
            console.log('[useAuth] Cleared admin cache for:', userId);
          }
        }
        
        // Clear admin cache on token refresh to force re-check
        // Also emit event for realtime channel resubscription
        if (event === 'TOKEN_REFRESHED') {
          const userId = session?.user?.id || user?.id;
          if (userId) {
            sessionStorage.removeItem(`admin_${userId}`);
            console.log('[useAuth] Cleared admin cache for:', userId);
          }
          
          // Emit custom event for components to resubscribe realtime channels
          window.dispatchEvent(new CustomEvent('session-refreshed'));
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check admin role (will re-fetch if cache was cleared)
          const adminStatus = await checkAdminRole(session.user.id);
          setIsAdmin(adminStatus);
          
          // Fetch profile using setTimeout to avoid race condition
          setTimeout(async () => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            setProfile(profileData);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check admin role
        const adminStatus = await checkAdminRole(session.user.id);
        setIsAdmin(adminStatus);
        
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            setProfile(data);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName
        }
      }
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const signOut = async () => {
    clearSessionTimestamp(); // Clear 24h tracking on manual logout
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const signInWithGoogle = async () => {
    // Use Lovable Cloud's managed OAuth for reliability
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin + '/signin'
    });
    return { data: null, error: result.error || null };
  };

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    isAuthenticated: !!session,
    isPro: profile?.is_pro ?? false,
    isAdmin
  };
};
