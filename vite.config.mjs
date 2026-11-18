import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

// KI token stays on the server side: the proxy adds it, the browser never sees it.
const kiToken = (() => {
  try {
    const t = readFileSync(process.env.KI_ENV_FILE ?? `${process.env.HOME}/KI/.env`, "utf8");
    return /^KI_API_TOKEN=(.+)$/m.exec(t)?.[1].trim() ?? "";
  } catch { return ""; }
})();

// Only these KI routes are reachable through the dev/preview server.
const ALLOWED = new Set([
  "GET /api/healthz",
  "GET /api/registry",
  "GET /api/registry/device-types",
  "GET /api/scans",
  "POST /api/scans",
  "GET /api/colors",
  "POST /api/colors",
]);

const ki = {
  "/ki": {
    target: "http://127.0.0.1:5001",
    changeOrigin: true,
    headers: kiToken ? { "x-ki-token": kiToken } : {},
    rewrite: (p) => p.replace(/^\/ki/, ""),
    bypass(req, res) {
      const path = (req.url ?? "").replace(/^\/ki/, "").split("?")[0].replace(/\/+$/, "");
      if (!ALLOWED.has(`${req.method} ${path}`)) {
        res.statusCode = 403;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "KI route not allowed" }));
        return false;
      }
    },
  },
};

export default defineConfig({
  plugins: [react()],
  server: { host: "0.0.0.0", proxy: ki },
  preview: { host: "0.0.0.0", proxy: ki },
});
