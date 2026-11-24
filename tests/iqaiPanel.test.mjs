import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const app = read("../src/App.tsx");
const panel = read("../src/components/IqaiPanel.tsx");
const vite = read("../vite.config.mjs");

test("IqaiPanel is lazy-loaded and shown only while a 3D page is open", () => {
  assert.match(app, /const IqaiPanel = lazy\(\(\) => import\("\.\/components\/IqaiPanel"\)\)/);
  assert.match(app, /\{openModule && \([\s\S]*?<IqaiPanel \/>/);
});

test("the panel talks to IQ-AI only through the lib client, never with a token", () => {
  assert.match(panel, /from "\.\.\/lib\/iqai\.mjs"/);
  assert.doesNotMatch(panel, /IQAI_TOKEN|Authorization|Bearer|localhost:8799|127\.0\.0\.1/);
});

test("temporary frames and sound are deleted from IQ-AI after rendering", () => {
  assert.match(panel, /finally \{[\s\S]*deleteMedia/);
});

test("vite proxy: /iqai is allowlisted and the token stays server-side", () => {
  assert.match(vite, /"\/iqai": \{/);
  assert.match(vite, /isAllowedIqaiRoute\(req\.method, path\)/);
  assert.match(vite, /Authorization: `Bearer \$\{iqaiToken\}`/);
  assert.match(vite, /\.iqai-token/);
  assert.match(vite, /proxy: ki \}|proxy \},/);
});

test("dev server defaults to 127.0.0.1 (MIK_HOST opts in to LAN)", () => {
  assert.match(vite, /process\.env\.MIK_HOST \?\? "127\.0\.0\.1"/);
  assert.doesNotMatch(vite, /host: "0\.0\.0\.0"/);
});
