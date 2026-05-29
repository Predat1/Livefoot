import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Strip console.log/debug/info et debugger en production, mais garde console.error/warn pour debug
  esbuild: mode === "production" ? {
    pure: ["console.log", "console.debug", "console.info"],
    drop: ["debugger"],
    legalComments: "none",
  } : undefined,
  build: {
    // Target moderne -> code plus court (ESM natif partout en 2025)
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: true,
    reportCompressedSize: false, // build plus rapide
    rollupOptions: {
      output: {
        // Chunking simple sans dépendances circulaires.
        // Toutes les libs node_modules dans "vendor" pour éviter les TDZ errors.
        // Vite + tree-shaking optimisent le reste.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // Charts isolés (lourds, uniquement chargés sur Match/PlayerDetail)
          if (id.includes("recharts") || id.includes("d3-")) {
            return "charts";
          }
          // Icons isolés (peuvent être tree-shakés mais lourds)
          if (id.includes("lucide-react")) {
            return "icons";
          }
          // Sentry isolé (chargé après le first paint)
          if (id.includes("@sentry")) {
            return "sentry";
          }
          if (id.includes("@supabase")) {
            return "supabase";
          }
          if (id.includes("@tanstack/react-query")) {
            return "query";
          }
          if (id.includes("framer-motion") || id.includes("motion-dom")) {
            return "motion";
          }
          if (id.includes("react-helmet-async") || id.includes("i18next") || id.includes("react-i18next")) {
            return "app-runtime";
          }
          if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("vaul")) {
            return "ui";
          }
          if (id.includes("date-fns")) {
            return "date";
          }
          // Tout le reste dans vendor pour les petites dependances partagees.
          return "vendor";
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
}));
