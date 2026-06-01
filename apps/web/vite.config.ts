import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const apiPort = Number(process.env.API_PORT ?? 3001);
const apiOrigin = `http://127.0.0.1:${apiPort}`;
const proxyErrorBody = JSON.stringify({
  message: `Mock API is unavailable at ${apiOrigin}. Start 'pnpm dev:api' or set VITE_API_BASE_URL to a reachable backend.`
});

function attachProxyErrorHandler(proxy: {
  on(event: "error", handler: (error: Error, req: { url?: string }, res: { headersSent?: boolean; writeHead(statusCode: number, headers: Record<string, string>): void; end(body: string): void }) => void): void;
}) {
  proxy.on("error", (_error, req, res) => {
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
    }

    res.end(proxyErrorBody);
    console.error(
      `[vite proxy] Failed to reach ${apiOrigin} for ${req.url ?? "unknown request"}. Start 'pnpm dev:api' or set VITE_API_BASE_URL.`
    );
  });
}

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": {
        target: apiOrigin,
        configure: attachProxyErrorHandler
      },
      "/generated-audio": {
        target: apiOrigin,
        configure: attachProxyErrorHandler
      },
      "/mock-downloads": {
        target: apiOrigin,
        configure: attachProxyErrorHandler
      }
    }
  },
  test: {
    environment: "jsdom"
  }
});
