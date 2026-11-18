const BASE = "/ki/api";

async function call(path, body) {
  const r = await fetch(BASE + path, body === undefined ? {} : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`KI ${r.status}`);
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
