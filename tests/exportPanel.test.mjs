import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("export panel follows the app theme (no hard-coded white tints)", () => {
  const s = read("src/vehicles3d/ExportPanel.tsx");
  assert.ok(!s.includes("rgba(255,255,255"));
  assert.ok(s.includes("var(--ka-accent)"));
});

test("people viewer offers export and stops auto-turn while recording", () => {
  const s = read("src/vehicles3d/HumanViewer.tsx");
  assert.ok(s.includes("<ExportPanel"));
  assert.ok(s.includes("getExportContext"));
  assert.ok(s.includes("onRecordStart"));
});
