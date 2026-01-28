import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { performCacheReset } from "./lib/cache-utils";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);

// Render app IMMEDIATELY - no blocking loader
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Background tasks after render - doesn't block anything
if (typeof window !== 'undefined') {
  // Cache check runs in background
  performCacheReset().catch(error => {
    console.error('[App] Cache reset failed:', error);
  });

  // Warm up critical edge functions after 2s (non-blocking)
  setTimeout(() => {
    if (SUPABASE_URL) {
      // Warm marketplace BFF
      fetch(`${SUPABASE_URL}/functions/v1/bff-marketplace-home`, { 
        method: 'HEAD',
        mode: 'cors',
      }).catch(() => {});
      
      // Warm store BFF
      fetch(`${SUPABASE_URL}/functions/v1/bff-store-public`, { 
        method: 'HEAD',
        mode: 'cors',
      }).catch(() => {});
    }
  }, 2000);

  // Register service worker for return visit caching
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[SW] Registered:', registration.scope);
        })
        .catch((error) => {
          console.log('[SW] Registration failed:', error);
        });
    });
  }
}
