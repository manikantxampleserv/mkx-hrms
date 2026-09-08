import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { resolve } from "path";
import { defineConfig } from "vite";

const path = (alias: string) => resolve(import.meta.dirname, `./src${alias}`);

export default defineConfig({
  plugins: [codeInspectorPlugin({ bundler: "vite", hotKeys: ["altKey"] }), react(), tailwindcss()],
  resolve: {
    alias: {
      routes: path("/routes"),
      components: path("/components"),
      context: path("/contexts"),
      contexts: path("/contexts"),
      hooks: path("/hooks"),
      layout: path("/components/layout"),
      mock: path("/mocks"),
      pages: path("/pages"),
      services: path("/services"),
      shared: path("/components/shared"),
      utils: path("/libraries/utils"),
      libraries: path("/libraries"),
      src: path(""),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
