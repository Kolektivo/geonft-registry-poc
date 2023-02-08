import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true,
    }),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  define: {
    "process.env": {},
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 8080,
  },
});
