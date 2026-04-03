import { defineConfig } from "vite";
//import react from "@vitejs/plugin-react-swc";
import react from '@vitejs/plugin-react'
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // ✅ Rutas de certificados
  const certPath = "/home/rubendaniel/certificados/localhost.crt";
  const keyPath = "/home/rubendaniel/certificados/localhost-privateKey.key";

  // ✅ Verificar si estamos en entorno de desarrollo local
  const isLocalDev =
    mode === "development" && // ✅ Solo en npm run dev
    fs.existsSync(certPath) && // ✅ Solo si hay certificados locales
    fs.existsSync(keyPath);

  // ✅ En producción esto será siempre false porque:
  // mode = "production" (no "development")

  console.log(`🚀 Vite Mode: ${mode}`);
  console.log(`🔒 HTTPS Local: ${isLocalDev ? "✅ Enabled" : "❌ Disabled"}`);

  return {
    plugins: [react()],

    // ✅ Configuración condicional automática
    ...(isLocalDev && {
      server: {
        https: {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        },
        proxy: {
          "/api": {
            //target: "https://localhost",
            target: "https://192.168.61.110",
            changeOrigin: true,
            secure: false,
          },
        },
      },
    }),
  };
});
