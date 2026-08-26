import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    host: "0.0.0.0",
    port: 5174,
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: () => `assets/[name]-[hash][extname]`,
      },
    },
    cssCodeSplit: false,
  },
});
