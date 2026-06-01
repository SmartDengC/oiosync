import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
      "/generated-audio": "http://localhost:3001",
      "/mock-downloads": "http://localhost:3001"
    }
  },
  test: {
    environment: "jsdom"
  }
});
