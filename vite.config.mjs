import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  root: ".",
  plugins: [react()],
  test: {
    coverage:{
      provider: 'istanbul',
      reporter: ['text-summary', 'html', 'json'],
      all: true,
      thresholds: {
        statements: 53,
        branches: 51,
        functions: 48,
        lines: 53,
      },
      exclude: [
        'node_modules/',
        '__mocks__/',
        '.next/',
        'coverage/',
        'vitest.setup.ts',
      ],
    },
    environment: "jsdom",
    testTimeout: 10000,
    include: ["./tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      "node_modules",
      ".next",
      "dist",
      "coverage",
      "**/__mocks__/**",
      "**/*.d.ts",
      "scripts",
      "public",
      "build",
    ],
    setupFiles: ["./vitest.setup.ts"],
  },
});
