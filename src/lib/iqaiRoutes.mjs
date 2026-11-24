// Which IQ-AI routes the MI-K dev/preview server may forward (vite.config.mjs "/iqai" proxy).
// Same idea as the KI allowlist: the proxy adds the IQ-AI token, so only the routes MI-K really
// needs are reachable. `path` is relative to /api/v1 (the "/iqai" prefix already removed).
const RULES = [
  ["GET", /^\/(health|capabilities)$/],
  ["GET", /^\/videos\/effects$/],
  ["GET", /^\/sounds(\/categories)?$/],
  ["GET", /^\/sounds\/[\w-]+(\/content)?$/],
  ["GET", /^\/media\/[\w-]+\/content$/],
  ["POST", /^\/media$/],
  ["POST", /^\/videos\/(story|edit)$/],
  ["DELETE", /^\/media\/[\w-]+$/],
];

export function isAllowedIqaiRoute(method, path) {
  const clean = String(path).split("?")[0].replace(/\/+$/, "");
  return RULES.some(([m, re]) => m === method && re.test(clean));
}
