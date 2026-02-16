import React, { Suspense, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/ui/error-boundary";
import RoutePrefetcher from "@/components/ui/route-prefetcher";
import AppShell from "@/components/ui/app-shell";
import GoogleSignInPopup from "@/components/GoogleSignInPopup";
import { lazyWithRetry } from "@/lib/lazy-with-retry";

// Eager load critical pages
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import NotFound from "./pages/NotFound";

// Lazy load heavy pages with auto-retry for chunk failures
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const Seller = lazyWithRetry(() => import("./pages/Seller"));
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const Store = lazyWithRetry(() => import("./pages/Store"));
const ProductFullView = lazyWithRetry(() => import("./pages/ProductFullView"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const Marketplace = lazyWithRetry(() => import("./pages/Marketplace"));
const NewProduct = lazyWithRetry(() => import("./pages/NewProduct"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazyWithRetry(() => import("./pages/TermsOfService"));
const Help = lazyWithRetry(() => import("./pages/Help"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});

const isHelpSubdomain = window.location.hostname.startsWith('help.');

const App = () => {
  // Global handler for unhandled promise rejections (e.g. prefetch failures, async errors)
  // Prevents them from crashing the app — logs silently instead
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const msg = event?.reason?.message || String(event?.reason || '');
      const isChunkError = msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Loading chunk') ||
        msg.includes('Importing a module script failed');
      if (isChunkError) {
        event.preventDefault();
        console.warn('[App] Suppressed chunk load rejection:', msg);
      }
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <RoutePrefetcher />
              <GoogleSignInPopup />
              <Routes>
                <Route path="/" element={
                  isHelpSubdomain ? (
                    <Suspense fallback={<AppShell />}>
                      <Help />
                    </Suspense>
                  ) : (
                    <Index />
                  )
                } />
                <Route path="/marketplace" element={
                  <Suspense fallback={<AppShell />}>
                    <Marketplace />
                  </Suspense>
                } />
                <Route path="/marketplace/:productSlug" element={
                  <Suspense fallback={<AppShell />}>
                    <Marketplace />
                  </Suspense>
                } />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignIn />} />
                <Route path="/reset-password" element={
                  <Suspense fallback={<AppShell />}>
                    <ResetPassword />
                  </Suspense>
                } />
                <Route path="/store/:storeSlug" element={
                  <Suspense fallback={<AppShell variant="store" />}>
                    <Store />
                  </Suspense>
                } />
                <Route path="/store/:storeSlug/product/:productId" element={
                  <Suspense fallback={<AppShell variant="store" />}>
                    <ProductFullView />
                  </Suspense>
                } />
                <Route path="/dashboard/*" element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <Suspense fallback={<AppShell variant="dashboard" />}>
                        <Dashboard />
                      </Suspense>
                    </ErrorBoundary>
                  </ProtectedRoute>
                } />
                <Route path="/seller/*" element={
                  <Suspense fallback={<AppShell variant="seller" />}>
                    <Seller />
                  </Suspense>
                } />
                <Route path="/admin/*" element={
                  <Suspense fallback={<AppShell variant="dashboard" />}>
                    <Admin />
                  </Suspense>
                } />
                <Route path="/privacy" element={
                  <Suspense fallback={<AppShell />}>
                    <PrivacyPolicy />
                  </Suspense>
                } />
                <Route path="/terms" element={
                  <Suspense fallback={<AppShell />}>
                    <TermsOfService />
                  </Suspense>
                } />
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
