import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SellerSidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setIsCollapsed: (value: boolean) => void;
}

const SellerSidebarContext = createContext<SellerSidebarContextType | undefined>(undefined);

export const SellerSidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem('seller-sidebar-collapsed');
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('seller-sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => setIsCollapsed(prev => !prev);

  return (
    <SellerSidebarContext.Provider value={{ isCollapsed, toggleSidebar, setIsCollapsed }}>
      {children}
    </SellerSidebarContext.Provider>
  );
};

export const useSellerSidebarContext = () => {
  const context = useContext(SellerSidebarContext);
  if (!context) {
    throw new Error('useSellerSidebarContext must be used within a SellerSidebarProvider');
  }
  return context;
};
