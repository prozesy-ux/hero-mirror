import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface AdminContextType {
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  adminLogin: (username: string, password: string) => boolean;
  adminLogout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ADMIN_USERNAME = 'ProZesy';
const ADMIN_PASSWORD = 'ProMeida@18177';
const ADMIN_SESSION_KEY = 'admin_session_token';

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing admin session
    const sessionToken = localStorage.getItem(ADMIN_SESSION_KEY);
    if (sessionToken) {
      setIsAdminAuthenticated(true);
    }
    setIsLoading(false);
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
      adminLogin, 
      adminLogout
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
