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
    
    // Safety timeout - ensure loading never gets stuck
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 5000);

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Set loading to false immediately - don't block on profile/admin checks
        setLoading(false);
        
        if (session?.user) {
          // Check admin role in background
          checkAdminRole(session.user.id)
            .then(adminStatus => {
              if (isMounted) setIsAdmin(adminStatus);
            })
            .catch(() => {
              if (isMounted) setIsAdmin(false);
            });
          
          // Fetch profile in background
          supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle()
            .then(({ data: profileData }) => {
              if (isMounted) setProfile(profileData);
            });
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Set loading to false immediately
      setLoading(false);
      
      if (session?.user) {
        // Check admin role in background
        checkAdminRole(session.user.id)
          .then(adminStatus => {
            if (isMounted) setIsAdmin(adminStatus);
          })
          .catch(() => {
            if (isMounted) setIsAdmin(false);
          });
        
        // Fetch profile in background  
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (isMounted) setProfile(data);
          });
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
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
