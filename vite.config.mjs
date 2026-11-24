import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { isAllowedIqaiRoute } from "./src/lib/iqaiRoutes.mjs";

// KI token stays on the server side: the proxy adds it, the browser never sees it.
const kiToken = (() => {
  try {
    const t = readFileSync(process.env.KI_ENV_FILE ?? `${process.env.HOME}/KI/.env`, "utf8");
    return /^KI_API_TOKEN=(.+)$/m.exec(t)?.[1].trim() ?? "";
  } catch { return ""; }
})();

// IQ-AI token, same idea: read on the dev server, never sent to the browser.
// Order: env IQAI_TOKEN, then ~/IQ-AI/.env, then ~/.iqai-token (the file docs/TERMUX.md of IQ-AI creates).
const iqaiToken = (() => {
  if (process.env.IQAI_TOKEN) return process.env.IQAI_TOKEN;
  const clean = (v) => v.trim().replace(/^['"]|['"]$/g, "");
  try {
    const t = readFileSync(`${process.env.HOME}/IQ-AI/.env`, "utf8");
    const m = /^\s*(?:export\s+)?IQAI_TOKEN\s*=\s*(.*)$/m.exec(t);
    if (m && clean(m[1])) return clean(m[1]);
  } catch { /* fall through */ }
  try { return clean(readFileSync(`${process.env.HOME}/.iqai-token`, "utf8")); } catch { return ""; }
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

// IQ-AI media service (:8799). Only the routes in src/lib/iqaiRoutes.mjs are reachable.
const iq = {
  "/iqai": {
    target: "http://127.0.0.1:8799",
    changeOrigin: true,
    headers: iqaiToken ? { Authorization: `Bearer ${iqaiToken}` } : {},
    rewrite: (p) => p.replace(/^\/iqai/, "/api/v1"),
    bypass(req, res) {
      const path = (req.url ?? "").replace(/^\/iqai/, "");
      if (!isAllowedIqaiRoute(req.method, path)) {
        res.statusCode = 403;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "IQ-AI route not allowed" }));
        return false;
      }
    },
  },
};

const proxy = { ...ki, ...iq };

export default defineConfig({
  plugins: [react()],
  // 127.0.0.1 by default (the /ki proxy adds the KI token). Opt in to LAN: MIK_HOST=0.0.0.0
  server: { host: process.env.MIK_HOST ?? "127.0.0.1", proxy },
  preview: { host: process.env.MIK_HOST ?? "127.0.0.1", proxy },
});
