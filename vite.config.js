import { defineConfig } from "vite";

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      formats: ["iife", "es"],
      entry: "./src/component.tsx",
      name: "component",
    },
    // Minify set to true will break the IIFE output
    minify: false,
  },
});
