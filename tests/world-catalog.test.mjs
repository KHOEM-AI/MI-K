import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CATALOG, validateCatalog } from "../scripts/world-catalog.mjs";

test("catalog is well formed (safe names, no duplicates)", () => {
  assert.deepEqual(validateCatalog(), []);
});

test("catalog catches bad entries", () => {
  const bad = [["a", "Bad Name", "components/x.ts", "createX", []], ["a", "ok", "../evil.ts", "run", {}]];
  assert.ok(validateCatalog(bad).length >= 3);
});

test("every catalog function exists in its source file", async () => {
  const missing = [];
  for (const [cat, name, file, fn] of CATALOG) {
    const text = await readFile(new URL(`../src/${file}`, import.meta.url), "utf8");
    if (!new RegExp(`export\\s+function\\s+${fn}\\b`).test(text)) missing.push(`${cat}/${name}: ${fn} in ${file}`);
  }
  assert.deepEqual(missing, []);
});

test("catalog covers houses, school, roads, animals, vehicles and tools", () => {
  const cats = new Set(CATALOG.map((e) => e[0]));
  for (const c of ["houses", "school", "roads", "animals", "vehicles", "tools"]) assert.ok(cats.has(c), c);
});
