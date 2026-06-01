import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const apiPort = Number(process.env.API_PORT ?? 3001);
const apiOrigin = `http://localhost:${apiPort}`;

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": apiOrigin,
      "/generated-audio": apiOrigin,
      "/mock-downloads": apiOrigin
    }
  },
  test: {
    environment: "jsdom"
  }
});
