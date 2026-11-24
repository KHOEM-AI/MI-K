import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parsePlan, parseImports, exportAll, categoryOf, safeName } from "../scripts/export-all-glb.mjs";

const CHAIN = `
  if ((item.shape === "car" || item.shape === "sportcar")) {
    const carGroup = createCarGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
    return;
  }
  if (item.shape === "table" || item.shape === "house") {
    const furnitureGroup = createFurnitureGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
    return; }                                  if (item.shape === "cactus" || item.shape === "vine") {   const plant2Group = createPlantGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
    return; }
  if (item.shape === "khoem") {
    const khoemGroup = createKhoemGeometry(THREE, item.color, item.metalness, item.roughness);
  }
  if (item.shape === "bridge" || item.shape === "trafficlight") {
    const g = item.shape === "bridge" ? createBridgeGeometry(THREE, item.color, item.metalness, item.roughness) : null;
  }
  if (isInfraShape(item.shape)) { const aircraftGroup = createInfraGeometry(THREE, item.shape, item.color, item.metalness, item.roughness); }
  if (item.shape === "text") { const { FontLoader } = await import("three/examples/jsm/loaders/FontLoader.js"); }
  if (item.shape === "car" || item.shape === "sportcar") {
    const again = createCarGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
  }
`;

test("parsePlan finds shapes in clean, double-paren and squashed layouts, colour-only builders, and ignores the rest", () => {
  const plan = parsePlan(CHAIN);
  const key = (e) => `${e.fn}:${e.shape}:${e.withShape}`;
  assert.deepEqual(plan.map(key).sort(), [
    "createBridgeGeometry:bridge:false",
    "createCarGeometry:car:true", "createCarGeometry:sportcar:true",
    "createFurnitureGeometry:house:true", "createFurnitureGeometry:table:true",
    "createKhoemGeometry:khoem:false",
    "createPlantGeometry2:cactus:true", "createPlantGeometry2:vine:true",
  ]); // no duplicates, no "text", no isInfraShape, no ternary function that is absent
});

test("parseImports maps function names to modules, also over several lines, and skips type imports", () => {
  const m = parseImports(`import type { Foo } from "./types";\nimport {\n  createCarGeometry,\n  createInfraGeometry as infra,\n} from "./studioGeometry";\nimport { createStairs, helper } from "./studioInfra";`);
  assert.equal(m.get("createCarGeometry"), "./studioGeometry");
  assert.equal(m.get("createInfraGeometry"), "./studioGeometry");
  assert.equal(m.get("createStairs"), "./studioInfra");
  assert.equal(m.has("helper"), false);
  assert.equal(m.has("Foo"), false);
});

test("names: category from the builder, file names stay safe", () => {
  assert.equal(categoryOf("createCarGeometry"), "car");
  assert.equal(categoryOf("createPlantGeometry2"), "plant2");
  assert.equal(categoryOf("createPersonalTransportGeometry"), "personaltransport");
  assert.ok(safeName("sportcar") && safeName("hospital_urban_tall") && safeName("grass-short"));
  assert.ok(!safeName("../etc") && !safeName("a/b") && !safeName("") && !safeName(".hidden") && !safeName("x".repeat(65)));
});

// fakes: no three.js needed
const fake = (name, meshes = 1) => ({ name, meshes, traverse(cb) { for (let i = 0; i < this.meshes; i++) cb({ isMesh: true }); } });
const deps = (over = {}) => ({
  load: async (fn) => (fn === "createMissingGeometry" ? undefined : (_t, shape) => fake("", shape === "empty" ? 0 : 2)),
  build: (fn, e) => fn(null, e.shape),
  inspect: (o) => (o.meshes ? { meshes: o.meshes, triangles: 10 * o.meshes } : { meshes: 0, triangles: 0, problem: "no meshes (empty)" }),
  toGlb: async (o) => {
    if (o.name === "boom") throw new Error("exporter exploded");
    return { glb: Buffer.from("glTF" + o.name), warnings: o.name === "warn" ? ["w"] : [] };
  },
  ...over,
});
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "glb-"));
const E = (fn, shape) => ({ fn, shape, withShape: true });

test("exportAll writes one file per object, keeps going after a failure, and reports skipped ones", async () => {
  const out = tmp();
  const plan = [E("createCarGeometry", "car"), E("createCarGeometry", "boom"), E("createFooGeometry", "empty"), E("createMissingGeometry", "x"), E("createFooGeometry", "../bad"), E("createFooGeometry", "warn")];
  const r = await exportAll({ plan, outDir: out, ...deps() });
  assert.deepEqual(r.items.map((i) => i.file).sort(), ["car/car.glb", "foo/warn.glb"]);
  assert.equal(fs.readFileSync(path.join(out, "car", "car.glb"), "utf8"), "glTFcar");
  assert.equal(r.items.find((i) => i.shape === "warn").warnings, 1);
  assert.deepEqual(r.failed.map((f) => f.shape), ["boom"]);
  assert.match(r.failed[0].error, /exploded/);
  assert.deepEqual(r.skipped.map((s) => s.reason).sort(), ["unsafe name", "no meshes (empty)", "createMissingGeometry not found in its module"].sort());
  assert.equal(r.totalBytes, 7 + 8);
  fs.rmSync(out, { recursive: true, force: true });
});

test("exportAll never overwrites an existing file unless forced; --only filters", async () => {
  const out = tmp();
  const plan = [E("createCarGeometry", "car"), E("createFurnitureGeometry", "house")];
  fs.mkdirSync(path.join(out, "car"));
  fs.writeFileSync(path.join(out, "car", "car.glb"), "MINE");
  let r = await exportAll({ plan, outDir: out, ...deps() });
  assert.equal(fs.readFileSync(path.join(out, "car", "car.glb"), "utf8"), "MINE");
  assert.deepEqual(r.skipped.map((s) => s.shape), ["car"]);
  assert.deepEqual(r.items.map((i) => i.shape), ["house"]);
  r = await exportAll({ plan, outDir: out, force: true, ...deps() });
  assert.equal(fs.readFileSync(path.join(out, "car", "car.glb"), "utf8"), "glTFcar");
  r = await exportAll({ plan, outDir: tmp(), only: "hous", ...deps() });
  assert.deepEqual(r.items.map((i) => i.shape), ["house"]);
  fs.rmSync(out, { recursive: true, force: true });
});

test("the real Studio3D.tsx is parsed: house, cars, tools and the single-shape builders are found", () => {
  const file = new URL("../src/components/Studio3D.tsx", import.meta.url);
  if (!fs.existsSync(file)) return; // not this repo
  const plan = parsePlan(fs.readFileSync(file, "utf8"));
  const shapes = new Set(plan.map((e) => e.shape));
  assert.ok(plan.length >= 100, "found only " + plan.length + " objects: the layout of Studio3D.tsx changed?");
  for (const s of ["house", "sportcar", "khoem"]) assert.ok(shapes.has(s), s + " missing");
  assert.ok(plan.every((e) => safeName(e.shape)), "an object name is not file-safe");
});
