const BASE = "/ki/api";

async function call(path, body) {
  const r = await fetch(BASE + path, {
    ...(body === undefined ? {} : {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) {
    let msg = "";
    try { msg = (await r.json()).error ?? ""; } catch {}
    throw new Error(`KI ${r.status}${msg ? ": " + msg : ""}`);
  }
  return r.json();
}

export const ki = {
  health: () => call("/healthz"),
  registry: () => call("/registry"),
  file: (name) => call(`/registry/${name}`),
  deviceTypes: () => call("/registry/device-types"),
  getScans: () => call("/scans"),
  saveScan: (scan) => call("/scans", scan),
  getColors: () => call("/colors"),
  savePalette: (p) => call("/colors", p),
};
