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
          // Tout le reste (React, Router, Supabase, Radix, etc.) dans vendor
          // pour éviter les dépendances circulaires entre chunks
          return "vendor";
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
}));
