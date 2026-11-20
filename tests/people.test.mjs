import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const exists = (p) => fs.existsSync(new URL("../" + p, import.meta.url));

test("characters live inside the People tab, not behind their own button", () => {
  const app = read("src/App.tsx");
  for (const gone of ["Character3D", "charactersOpen", "Open Characters"]) {
    assert.ok(!app.includes(gone), "App.tsx still has " + gone);
  }
  assert.ok(!exists("src/components/Character3D.tsx"), "old Character3D page is gone");
  assert.ok(!exists("src/components/CharacterGallery.css"), "old gallery css is gone");
  const h = read("src/vehicles3d/HumanViewer.tsx");
  assert.equal((h.match(/\bid: "/g) || []).length, 6, "6 characters");
  assert.equal((h.match(/\bdesc: "/g) || []).length, 6, "every character has a description");
  assert.ok(h.includes("<PersonPortrait"), "cards show the drawn SVG portrait");
  assert.match(h, /KHOEM-AI/, "the KHOEM-AI name stays on the People tab");
});

test("3D tabs use own-made SVG icons: no emoji and no hard-coded blue", () => {
  const emoji = /\p{Extended_Pictographic}/u;
  for (const f of [
    "src/vehicles3d/Vehicles3D.tsx",
    "src/vehicles3d/HumanViewer.tsx",
    "src/vehicles3d/icons.tsx",
  ]) {
    const s = read(f);
    assert.ok(!emoji.test(s), f + " has an emoji");
    assert.ok(!s.includes("#4f7cff"), f + " has hard-coded blue");
  }
  const icons = read("src/vehicles3d/icons.tsx");
  for (const n of ["car", "people", "male", "female", "turn", "motion", "reset", "play", "stop", "check", "warn"]) {
    assert.ok(icons.includes(`name === "${n}"`), "icon " + n);
  }
});
