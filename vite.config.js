import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "./docs/dev",
    //emptyOutDir: true,

    sourcemap: true,
    /*
    lib: {
      formats: ["iife"],
      entry: "./src/vimWebApp.ts",
      name: "vim",
    },
    */
    rollupOptions: {
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
      },
    },
    // Minify set to true will break the IIFE output
    minify: false,
  },
});
