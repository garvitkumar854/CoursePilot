import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  // ✅ Pre-bundle heavy deps — faster cold starts in dev
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "motion/react",
      "swr",
      "axios",
      "@hello-pangea/dnd",
      "lucide-react",
    ],
  },

  build: {
    target: "esnext",
    minify: "esbuild",
    cssCodeSplit: true,

    // ✅ Warn if any chunk exceeds 400kb
    chunkSizeWarningLimit: 400,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {

            // React core — smallest, most shared chunk
            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("/scheduler/")
            ) {
              return "vendor-react";
            }

            // Router
            if (id.includes("react-router-dom") || id.includes("react-router/")) {
              return "vendor-router";
            }

            // Animations — heavy, isolate for caching
            if (id.includes("/motion/")) {
              return "vendor-motion";
            }

            // Icons — tree-shaken but still sizeable
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }

            // Drag and drop
            if (id.includes("@hello-pangea")) {
              return "vendor-dnd";
            }

            // Data fetching
            if (id.includes("/swr/") || id.includes("/axios/")) {
              return "vendor-data";
            }

            // Everything else from node_modules
            return "vendor-libs";
          }
        },
      },
    },
  },
});