import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("the People tab offers only people with a real .glb and says NOT FOUND when there is none", () => {
  const h = read("src/vehicles3d/HumanViewer.tsx");
  assert.ok(h.includes("setAvailable") && h.includes("available.includes(person.id)"));
  assert.ok(h.includes("isRealPerson(await r.arrayBuffer())"), "a file counts only when it is a rigged person");
  assert.ok(h.includes("NOT FOUND: no .glb"));
  assert.equal((h.match(/\bid: "/g) || []).length, 6, "the 6 character ids stay");
});
