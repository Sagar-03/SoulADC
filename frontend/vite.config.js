import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  // Strip all console.log / console.* and debugger statements from production builds
  esbuild: {
    drop: ["console", "debugger"],
  },
});