import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminContextType {
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;
  adminUserId: string | null;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing admin session
    checkAdminSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await verifyAdminRole(session.user.id);
      } else {
        setIsAdminAuthenticated(false);
        setAdminUserId(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await verifyAdminRole(session.user.id);
      } else {
        setIsAdminAuthenticated(false);
        setAdminUserId(null);
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
      setIsAdminAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAdminRole = async (userId: string) => {
    try {
      // Check if user has admin role in user_roles table
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();

      if (error || !data) {
        setIsAdminAuthenticated(false);
        setAdminUserId(null);
        return false;
      }

      setIsAdminAuthenticated(true);
      setAdminUserId(userId);
      return true;
    } catch (error) {
      console.error('Error verifying admin role:', error);
      setIsAdminAuthenticated(false);
      setAdminUserId(null);
      return false;
    }
  };

  const adminLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Authentication failed' };
      }

      // Verify admin role
      const isAdmin = await verifyAdminRole(data.user.id);
      
      if (!isAdmin) {
        // Sign out if not admin
        await supabase.auth.signOut();
        return { success: false, error: 'Access denied. Admin privileges required.' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Admin login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const adminLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAdminAuthenticated(false);
      setAdminUserId(null);
    } catch (error) {
      console.error('Admin logout error:', error);
    }
  };

  return (
    <AdminContext.Provider value={{ 
      isAdminAuthenticated, 
      isLoading,
      adminLogin, 
      adminLogout,
      adminUserId
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
