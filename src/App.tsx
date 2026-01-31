import React, { lazy, Suspense } from 'react';
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

// Eager load critical pages
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import NotFound from "./pages/NotFound";

// Lazy load heavy pages for faster initial bundle
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Seller = lazy(() => import("./pages/Seller"));
const Admin = lazy(() => import("./pages/Admin"));
const Store = lazy(() => import("./pages/Store"));
const ProductFullView = lazy(() => import("./pages/ProductFullView"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Marketplace = lazy(() => import("./pages/Marketplace"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RoutePrefetcher />
            <Routes>
              <Route path="/" element={<Index />} />
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
                  <Suspense fallback={<AppShell variant="dashboard" />}>
                    <Dashboard />
                  </Suspense>
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
