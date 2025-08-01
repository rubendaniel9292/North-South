import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "fs";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  //carga de certificados para HTTPS solo en local
  /*
  server: {
    https: {
      key: fs.readFileSync("/home/certificados/localhost-privateKey.key"),
      cert: fs.readFileSync("/home/certificados/localhost.crt"),
    },
    proxy: {
      "/api": {
        target: "https://localhost:4443", // Puerto HTTPS del backend
        changeOrigin: true,
        secure: false,
      },
    },
  }
  */
});
