import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("every 3D page opens from one button group with the same button classes (no hard-coded colours)", () => {
  const app = read("src/App.tsx");
  const start = app.indexOf('<div className="module-buttons"');
  assert.ok(start >= 0, "module-buttons group exists");
  const group = app.slice(start, app.indexOf("</div>", start));
  assert.equal(group.split('"filter active" : "filter"').length - 1, 1, "one button template toggles filter / filter active");
  for (const bad of ["style={{", "#4f7cff", "rgba(255,255,255"]) assert.ok(!group.includes(bad), "group has " + bad);
  for (const id of ["studio", "vehicles", "karaoke", "hospital", "school", "village", "ocean"]) {
    assert.ok(app.includes('id: "' + id + '"'), "module " + id + " is registered");
    assert.ok(app.includes('isOpen("' + id + '")'), "module " + id + " has a viewer");
  }
  assert.ok(!/upload-button"\s+onClick=\{\(\) => set\w+Open/.test(app), "no loose per-page open buttons");
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
