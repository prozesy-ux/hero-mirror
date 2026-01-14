import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AdminContextType {
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  adminUser: User | null;
  hasAdminRole: boolean;
  adminLogin: (username: string, password: string) => boolean;
  adminLogout: () => void;
  checkAdminRole: () => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ADMIN_USERNAME = 'ProZesy';
const ADMIN_PASSWORD = 'ProMeida@18177';
const ADMIN_SESSION_KEY = 'admin_session_token';

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [hasAdminRole, setHasAdminRole] = useState(false);

  const checkAdminRole = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasAdminRole(false);
        setAdminUser(null);
        return false;
      }

      setAdminUser(user);

      // Check if user has admin role in user_roles table
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin role:', error);
        setHasAdminRole(false);
        return false;
      }

      const isAdmin = !!roleData;
      setHasAdminRole(isAdmin);
      return isAdmin;
    } catch (error) {
      console.error('Error checking admin role:', error);
      setHasAdminRole(false);
      return false;
    }
  };

  useEffect(() => {
    const initializeAdmin = async () => {
      setIsLoading(true);
      
      // Check for existing admin session (username/password)
      const sessionToken = localStorage.getItem(ADMIN_SESSION_KEY);
      if (sessionToken) {
        setIsAdminAuthenticated(true);
      }

      // Check for Supabase auth and admin role
      await checkAdminRole();
      
      setIsLoading(false);
    };

    initializeAdmin();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setAdminUser(session.user);
        await checkAdminRole();
      } else {
        setAdminUser(null);
        setHasAdminRole(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const adminLogin = (username: string, password: string): boolean => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = btoa(`${Date.now()}-admin-session`);
      localStorage.setItem(ADMIN_SESSION_KEY, token);
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdminAuthenticated(false);
  };

  return (
    <AdminContext.Provider value={{ 
      isAdminAuthenticated, 
      isLoading,
      adminUser,
      hasAdminRole,
      adminLogin, 
      adminLogout,
      checkAdminRole
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
