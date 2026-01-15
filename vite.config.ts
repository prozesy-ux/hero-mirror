import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Remove source maps in production (hides original code structure)
    sourcemap: false,
    // Use terser for advanced minification
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log statements in production
        drop_console: true,
        // Remove debugger statements
        drop_debugger: true,
        // Remove unused code
        dead_code: true,
      },
      mangle: {
        // Mangle property names starting with underscore (private properties)
        properties: {
          regex: /^_/
        }
      },
      format: {
        // Remove all comments
        comments: false
      }
    }
  }
}));
