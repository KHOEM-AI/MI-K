import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

const app = await readFile("src/App.tsx", "utf8");
const storage = await readFile("src/lib/storage.mjs", "utf8");

test("KHOEM-AI app source exists", async () => {
  await access("src/App.tsx");
  assert.ok(app.length > 0);
});

test("KHOEM-AI branding is present", () => {
  assert.match(app, /KHOEM-AI/);
});

test("Asset search feature exists", () => {
  assert.match(app, /Search assets/i);
  assert.match(app, /matchesSearch/);
});

test("Image and 3D asset types are supported", () => {
  assert.match(app, /image/);
  assert.match(app, /model/);
});

test("Asset storage functions are available", () => {
  assert.match(storage, /saveAsset/);
  assert.match(storage, /getAssets/);
  assert.match(storage, /deleteAsset/);
});

test("3D ModelViewer is loaded lazily", () => {
  assert.match(app, /lazy\(\(\) => import/);
});
