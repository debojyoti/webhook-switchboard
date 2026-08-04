import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  root: "client",
  plugins: [react()],
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
      "/webhooks": "http://localhost:3000",
      "/healthz": "http://localhost:3000",
    },
  },
  resolve: {
    alias: {
      "@contract": fileURLToPath(new URL("./contract", import.meta.url)),
    },
  },
});
