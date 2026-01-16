import { useState, useEffect } from 'react';
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

  useEffect(() => {
    let isMounted = true;

    // Helper function with timeout protection
    const checkAdminWithTimeout = async (userId: string): Promise<boolean> => {
      try {
        const result = await Promise.race([
          checkAdminRole(userId),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000))
        ]);
        return result;
      } catch (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            // Check admin role with timeout
            const adminStatus = await checkAdminWithTimeout(session.user.id);
            if (isMounted) setIsAdmin(adminStatus);
            
            // Fetch profile
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (isMounted) setProfile(profileData);
          } catch (error) {
            console.error('Error in auth state change:', error);
            if (isMounted) {
              setIsAdmin(false);
              setProfile(null);
            }
          }
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        
        if (isMounted) setLoading(false);
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            // Check admin role with timeout
            const adminStatus = await checkAdminWithTimeout(session.user.id);
            if (isMounted) setIsAdmin(adminStatus);
            
            // Fetch profile
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (isMounted) setProfile(data);
          } catch (error) {
            console.error('Error fetching user data:', error);
            if (isMounted) {
              setIsAdmin(false);
              setProfile(null);
            }
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
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
