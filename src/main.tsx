import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { performCacheReset } from "./lib/cache-utils";
import { AppLoader } from "./components/ui/app-loader";

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);

// Render app IMMEDIATELY - no blocking loader
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Cache check runs in background AFTER render - doesn't block anything
performCacheReset().catch(error => {
  console.error('[App] Cache reset failed:', error);
});
