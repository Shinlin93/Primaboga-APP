import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // supaya path aset benar saat dijalankan dari file:// dalam Electron
  server: {
    port: 5173,
  },
});
