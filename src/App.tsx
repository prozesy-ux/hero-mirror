import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { healthMonitor } from "@/lib/health-monitor";
import RecoveryBanner from "@/components/system/RecoveryBanner";
import DiagnosticsBadge from "@/components/system/DiagnosticsBadge";
import { recoverBackend } from "@/lib/backend-recovery";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Seller from "./pages/Seller";
import Admin from "./pages/Admin";
import Store from "./pages/Store";
import ProductFullView from "./pages/ProductFullView";
import NotFound from "./pages/NotFound";

const App = () => {
  // Start health monitor + perform page-load recovery for protected areas
  useEffect(() => {
    healthMonitor.start();

    const path = window.location.pathname;
    if (path.startsWith('/dashboard') || path.startsWith('/seller')) {
      // Fire-and-forget: ensures refreshSession hydration is attempted on hard reload.
      recoverBackend('page_load');
    }

    return () => healthMonitor.stop();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <RecoveryBanner />
            <DiagnosticsBadge />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignIn />} />
                <Route path="/store/:storeSlug" element={<Store />} />
                <Route path="/store/:storeSlug/product/:productId" element={<ProductFullView />} />
                <Route
                  path="/dashboard/*"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/seller/*" element={<Seller />} />
                <Route path="/admin/*" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

