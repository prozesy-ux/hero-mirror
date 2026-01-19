import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
  const initRef = useRef(false); // Prevent double initialization
  const mountedRef = useRef(true);

  const checkAdminRole = useCallback(async (userId: string) => {
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
  }, []);

  const loadUserData = useCallback(async (userId: string) => {
    if (!mountedRef.current) return;
    
    try {
      // Parallel fetch for better performance
      const [adminResult, profileResult] = await Promise.allSettled([
        checkAdminRole(userId),
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()
      ]);

      if (!mountedRef.current) return;

      if (adminResult.status === 'fulfilled') {
        setIsAdmin(adminResult.value);
      }
      
      if (profileResult.status === 'fulfilled' && profileResult.value.data) {
        setProfile(profileResult.value.data);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }, [checkAdminRole]);

  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (initRef.current) return;
    initRef.current = true;
    mountedRef.current = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mountedRef.current) return;
        
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          await loadUserData(session.user.id);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;
        
        console.log('[Auth] State changed:', event);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    initializeAuth();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

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
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Return to the current Sign In URL so post-auth redirect logic can run
        redirectTo: window.location.href
      }
    });
    return { data, error };
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
