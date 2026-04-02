import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsxInject: "import React from 'react'"
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx", "tests/ui/**/*.test.ts", "tests/ui/**/*.test.tsx"],
    exclude: ["tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"]
    }
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname
    }
  }
});
