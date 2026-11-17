import { defineConfig } from "vitest/config";

// base "./" keeps every asset path relative, so the built app works from any
// static host and any sub-path (GitHub Pages project site included).
export default defineConfig({
  base: "./",
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
