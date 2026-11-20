import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("3D panel buttons use the same button classes as the rest of the app (no hard-coded colours)", () => {
  const app = read("src/App.tsx");
  const start = app.indexOf('<section className="studio-panel">');
  assert.ok(start >= 0, "studio-panel section exists");
  const panel = app.slice(start, app.indexOf("</section>", start));
  assert.equal(panel.split('"filter active" : "filter"').length - 1, 2, "both buttons toggle filter / filter active");
  for (const bad of ["style={{", "#4f7cff", "rgba(255,255,255"]) assert.ok(!panel.includes(bad), "panel has " + bad);
});

test("Vehicles and People tabs follow the app theme", () => {
  const v = read("src/vehicles3d/Vehicles3D.tsx");
  for (const bad of ['"#fff"', "#4f7cff", "rgba(255,255,255"]) assert.ok(!v.includes(bad), "Vehicles3D has " + bad);
  assert.ok(v.includes('className="filters"'));
});

test("Vehicle viewer buttons and boxes use the app colour system", () => {
  const v = read("src/vehicles3d/VehicleViewer.tsx");
  for (const bad of ["#4f7cff", "rgba(255,255,255"]) assert.ok(!v.includes(bad), "VehicleViewer has " + bad);
  assert.ok(v.includes("var(--ka-accent)"));
});
