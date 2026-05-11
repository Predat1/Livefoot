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
  // Strip console.* et debugger en production -> -10/20 KB et moins de bruit
  esbuild: mode === "production" ? {
    drop: ["console", "debugger"],
    legalComments: "none",
  } : undefined,
  build: {
    // Target moderne -> code plus court (ESM natif partout en 2025)
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false, // build plus rapide
    rollupOptions: {
      output: {
        // Split intelligent : chaque grosse lib dans son propre chunk
        // -> meilleur cache navigateur + parallelisation du download
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // React core - charge en premier, reste stable
          if (id.includes("react-dom") || id.match(/[\\/]node_modules[\\/]react[\\/]/) || id.includes("scheduler")) {
            return "react-core";
          }
          // Router
          if (id.includes("react-router")) {
            return "router";
          }
          // Animations - lourd (~100 KB), peut etre charge plus tard
          if (id.includes("framer-motion")) {
            return "motion";
          }
          // Charts - tres lourd (Recharts ~375 KB), uniquement pour Match/PlayerDetail
          if (id.includes("recharts") || id.includes("d3-")) {
            return "charts";
          }
          // Radix UI - tres modulaire mais nombreux composants
          if (id.includes("@radix-ui")) {
            return "radix";
          }
          // Supabase
          if (id.includes("@supabase") || id.includes("@tanstack/react-query")) {
            return "data";
          }
          // i18n
          if (id.includes("i18next") || id.includes("react-i18next")) {
            return "i18n";
          }
          // Icones
          if (id.includes("lucide-react")) {
            return "icons";
          }
          // Sentry - ne doit pas bloquer le premier paint
          if (id.includes("@sentry")) {
            return "sentry";
          }
          // Forms
          if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) {
            return "forms";
          }
          // Date utils
          if (id.includes("date-fns")) {
            return "date";
          }
          // Tout le reste des node_modules
          return "vendor";
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
