import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { transformWithEsbuild } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    {
      name: "coursepilot-jsx-in-js",
      enforce: "pre",
      async transform(code, id) {
        if (!/\/src\/.*\.js$/.test(id)) return null;
        const result = await transformWithEsbuild(code, id, {
          loader: "jsx",
          jsx: "automatic",
        });
        return result.code;
      },
    },
    react({ include: /\.[jt]sx?$/ }),
  ],
  esbuild: {
    loader: "tsx",
    include: /\.[jt]sx?$/,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { ".js": "jsx" },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
  },
});
