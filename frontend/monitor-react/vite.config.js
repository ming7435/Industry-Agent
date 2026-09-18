import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  base: "/",
  build: {
    outDir: resolve(__dirname, "../monitor"),
    emptyOutDir: true,
    assetsDir: "assets",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three", "three/examples/jsm/controls/OrbitControls.js"],
          react: ["react", "react-dom/client"],
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8001",
    },
  },
});
