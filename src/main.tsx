import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { performCacheReset } from "./lib/cache-utils";
import { AppLoader } from "./components/ui/app-loader";

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);

// Show initial loader
root.render(
  <React.StrictMode>
    <AppLoader message="Initializing..." />
  </React.StrictMode>
);

// Initialize app with cache check
const initializeApp = async () => {
  try {
    // Perform cache reset if version changed
    await performCacheReset();
  } catch (error) {
    console.error('[App] Cache reset failed:', error);
  }
  
  // Render the main app
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

initializeApp();
