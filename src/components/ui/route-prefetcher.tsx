import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Route Prefetcher - Preloads critical route chunks in the background
 * Like Fiverr's navigation: instant page transitions
 */
const RoutePrefetcher = () => {
  const location = useLocation();

  useEffect(() => {
    // Prefetch based on current location
    const prefetchRoutes = async () => {
      // On homepage, prefetch dashboard and seller routes
      if (location.pathname === '/') {
        // Wait for initial render to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Prefetch critical routes in the background
        prefetchDashboard();
        prefetchSeller();
      }

      // On signin page, prefetch dashboard (likely destination after login)
      if (location.pathname === '/signin' || location.pathname === '/signup') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        prefetchDashboard();
      }

      // On dashboard, prefetch seller if user might be a seller
      if (location.pathname.startsWith('/dashboard')) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        prefetchSeller();
      }
    };

    prefetchRoutes();
  }, [location.pathname]);

  return null; // This component doesn't render anything
};

// Lazy import functions for prefetching
const prefetchDashboard = () => {
  try {
    // Prefetch dashboard page and its dependencies
    import('@/pages/Dashboard').catch(() => {});
    import('@/components/dashboard/BuyerDashboardHome').catch(() => {});
    import('@/contexts/SidebarContext').catch(() => {});
  } catch (e) {
    // Silent fail - prefetching is optional optimization
  }
};

const prefetchSeller = () => {
  try {
    // Prefetch seller page and its dependencies  
    import('@/pages/Seller').catch(() => {});
    import('@/components/seller/SellerDashboard').catch(() => {});
    import('@/contexts/SellerContext').catch(() => {});
  } catch (e) {
    // Silent fail - prefetching is optional optimization
  }
};

const prefetchStore = () => {
  try {
    // Prefetch store page
    import('@/pages/Store').catch(() => {});
  } catch (e) {
    // Silent fail
  }
};

export default RoutePrefetcher;
export { prefetchDashboard, prefetchSeller, prefetchStore };
