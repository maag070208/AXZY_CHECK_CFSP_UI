/// <reference types="vitest" />
import federation from "@originjs/vite-plugin-federation";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    federation({
      name: "host",
      filename: "remoteEntry.js",
      exposes: {},
      remotes: {
        remoteClients: "http://localhost:5003/assets/remoteEntry.js",
      },
      shared: ["react", "react-dom"],
    }),
  ],
  build: {
    modulePreload: false,
    target: "esnext",
    minify: false,
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      // Capas FSD (destino)
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@entities": path.resolve(__dirname, "./src/entities"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@widgets": path.resolve(__dirname, "./src/widgets"),
      "@pages": path.resolve(__dirname, "./src/pages"),

      // Legado (se retira al terminar la migración)
      "@app": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "./src/core"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@types": path.resolve(__dirname, "./src/core/types"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    server: {
      deps: {
        inline: ["@axzydev/axzy_ui_system"],
      },
    },
  },
});
