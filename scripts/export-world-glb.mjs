// Exports the whole MI-K world to .glb files: houses, school, roads, animals, vehicles, people, tools.
//
//   npx tsx scripts/export-world-glb.mjs --list           show what would be exported (writes nothing)
//   npx tsx scripts/export-world-glb.mjs                  one .glb per object + one combined world .glb
//   npx tsx scripts/export-world-glb.mjs --only=animals   only categories / names that contain "animals"
//   npx tsx scripts/export-world-glb.mjs --no-world       skip the combined world file
//   npx tsx scripts/export-world-glb.mjs --out=DIR        output folder (default: exports/world)
//
// Output:  <out>/<category>/<name>.glb   <out>/world/mi-k-village.glb   <out>/index.json
// "tsx" runs the project's .ts files directly (npm i -D tsx). Nothing in src/ is changed.
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CATALOG, validateCatalog } from "./world-catalog.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(ROOT, "src");

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => (args.find((a) => a.startsWith(name + "=")) ?? "").slice(name.length + 1) || null;
const OUT = opt("--out") ?? join(ROOT, "exports", "world");
const ONLY = opt("--only");

const problems = validateCatalog();
if (problems.length) { console.error("Catalog problems:\n  " + problems.join("\n  ")); process.exit(1); }

const selected = CATALOG.filter(([cat, name]) => !ONLY || cat.includes(ONLY) || name.includes(ONLY));

if (flag("--list")) {
  const byCat = new Map();
  for (const [cat] of selected) byCat.set(cat, (byCat.get(cat) ?? 0) + 1);
  console.log(`${selected.length} objects in ${byCat.size} groups:`);
  for (const [cat, n] of [...byCat].sort()) console.log(`  ${cat.padEnd(12)} ${n}`);
  console.log(flag("--no-world") ? "Nothing written (--list)." : "Plus 1 combined world file. Nothing written (--list).");
  process.exit(0);
}

const THREE = await import("three");
const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");

// GLTFExporter needs FileReader (a browser API); give Node a small stand-in.
if (typeof FileReader === "undefined") {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) { blob.arrayBuffer().then((r) => { this.result = r; this.onloadend?.(); }); }
    readAsDataURL(blob) {
      blob.arrayBuffer().then((r) => {
        this.result = `data:${blob.type || "application/octet-stream"};base64,${Buffer.from(r).toString("base64")}`;
        this.onloadend?.();
      });
    }
  };
}

const modules = new Map();
async function factory(file, fn) {
  if (!modules.has(file)) modules.set(file, await import(pathToFileURL(join(SRC, file)).href));
  const f = modules.get(file)[fn];
  if (typeof f !== "function") throw new Error(`${fn} not found in ${file}`);
  return f;
}

/** Some factories return { group, ... } (vehicles, instanced houses); others return the object itself. */
const unwrap = (r) => (r && r.isObject3D ? r : r?.group ?? r?.mesh ?? r);

/** GLB has no instancing in this exporter: turn every InstancedMesh into plain meshes (materials shared by colour). */
function bakeInstanced(root) {
  const list = [];
  root.traverse((o) => { if (o.isInstancedMesh) list.push(o); });
  for (const im of list) {
    const baked = new THREE.Group();
    baked.name = im.name || "instanced";
    const matrix = new THREE.Matrix4(), color = new THREE.Color(), cache = new Map();
    for (let i = 0; i < im.count; i++) {
      im.getMatrixAt(i, matrix);
      let material = im.material;
      if (im.instanceColor) {
        im.getColorAt(i, color);
        const key = color.getHexString();
        if (!cache.has(key)) { const m = im.material.clone(); m.color.copy(color); cache.set(key, m); }
        material = cache.get(key);
      }
      const mesh = new THREE.Mesh(im.geometry, material);
      mesh.applyMatrix4(matrix);
      baked.add(mesh);
    }
    baked.applyMatrix4(im.matrix);
    const parent = im.parent;
    im.removeFromParent();
    parent?.add(baked);
  }
  return root;
}

function inspect(obj) {
  let meshes = 0, triangles = 0;
  obj.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    const g = o.geometry;
    triangles += Math.round((g.index ? g.index.count : g.attributes?.position?.count ?? 0) / 3);
  });
  const box = new THREE.Box3().setFromObject(obj);
  const finite = [box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z].every(Number.isFinite);
  if (!meshes) return { meshes, triangles, problem: "no meshes (empty)" };
  if (box.isEmpty() || !finite) return { meshes, triangles, problem: "empty or invalid size" };
  return { meshes, triangles };
}

function toGlb(obj) {
  return new Promise((resolve, reject) => {
    const warn = console.warn, warnings = [];
    console.warn = (...a) => warnings.push(a.join(" "));
    const timer = setTimeout(() => { console.warn = warn; reject(new Error("timeout")); }, 60000);
    const finish = (fn) => (v) => { console.warn = warn; clearTimeout(timer); fn(v); };
    new GLTFExporter().parse(
      obj,
      finish((out) => (out instanceof ArrayBuffer ? resolve({ glb: Buffer.from(out), warnings }) : reject(new Error("no binary output")))),
      finish((e) => reject(e instanceof Error ? e : new Error(String(e)))),
      { binary: true },
    );
  });
}

const dispose = (obj) => obj.traverse((o) => {
  if (!o.isMesh) return;
  o.geometry?.dispose?.();
  for (const m of Array.isArray(o.material) ? o.material : [o.material]) m?.dispose?.();
});

async function save(obj, rel) {
  const info = inspect(obj);
  if (info.problem) return { skipped: info.problem };
  const { glb, warnings } = await toGlb(obj);
  const file = join(OUT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, glb);
  return { file: rel, bytes: glb.length, meshes: info.meshes, triangles: info.triangles, warnings: warnings.length };
}

/* ---------------- 1. every object as its own file ---------------- */
const report = { generated: new Date().toISOString(), items: [], failed: [], skipped: [], world: null };
const t0 = Date.now();
console.log(`Exporting ${selected.length} objects to ${OUT} ...`);

for (const [category, name, file, fn, fnArgs] of selected) {
  let obj = null;
  try {
    const make = await factory(file, fn);
    obj = bakeInstanced(unwrap(make(...fnArgs)));
    obj.name = name;
    const r = await save(obj, `${category}/${name}.glb`);
    if (r.skipped) report.skipped.push({ category, name, reason: r.skipped });
    else report.items.push({ category, name, ...r });
  } catch (err) {
    report.failed.push({ category, name, error: err instanceof Error ? err.message : String(err) });
    console.log(`  x ${category}/${name}: ${report.failed.at(-1).error}`);
  } finally {
    if (obj) dispose(obj);
  }
}

/* ---------------- 2. the whole village in one file ---------------- */
if (!flag("--no-world") && !ONLY) {
  try {
    const place = (obj, x, y, z, name, rotY = 0) => { obj.position.set(x, y, z); obj.rotation.y = rotY; obj.name = name; world.add(obj); return obj; };
    const call = async (file, fn, ...a) => unwrap((await factory(file, fn))(...a));
    const G = "components/villageGeometry.ts", N = "components/natureElements.ts", A = "components/villageAnimals.ts";
    const world = new THREE.Group();
    world.name = "mi-k-village";

    world.add(await call(G, "createVillageGround"));
    world.add(await call(G, "createVillageRoads"));
    world.add(await call("components/villageCivic.ts", "createVillageSchool"));
    world.add(await call("components/villageCivic.ts", "createVillageClinic"));
    world.add(await call(G, "createVillageHousesInstanced", 300, 42, 34));
    world.add(await call(G, "createStreetLamps"));
    place(await call(G, "createMeatVegFactory"), 0, 0, -110, "factory");

    const stalls = [["#e74c3c", -70, 60], ["#f39c12", 70, 60], ["#27ae60", -70, -60], ["#3498db", 70, -60]];
    for (const [c, x, z] of stalls) place(await call(G, "createMarketStall", c), x, 0, z, "market-stall");
    const shops = [["createPhoneShop", -40], ["createClothingShop", -15], ["createMotorbikeShop", 15], ["createBikeShop", 45]];
    for (const [fn, x] of shops) place(await call(G, fn), x, 0, 70, fn.replace("create", "").toLowerCase());
    for (const [x, z] of [[-140, 120], [140, 120], [-140, -120], [140, -120]]) place(await call(G, "createRiceField", 30), x, 0, z, "rice-field");
    for (const [x, z] of [[-100, -100], [-70, -100], [70, -100], [100, -100]]) place(await call(G, "createVegetableGarden", 15), x, 0, z, "vegetable-garden");
    for (const [x, z] of [[-80, 40], [80, 40], [-80, -40], [80, -40]]) place(await call(N, "createFishPond", 10), x, 0, z, "fish-pond");
    place(await call(N, "createLake", 40), -180, 0, -100, "lake");
    for (const [h, r, c, x, z] of [[60, 50, "#4a5568", -250, -250], [70, 55, "#5d6d7e", 250, -250], [50, 40, "#4a5568", -280, 200], [55, 45, "#5d6d7e", 280, 200]])
      place(await call(N, "createMountain", h, r, c), x, h / 2, z, "mountain");
    world.add(await call(N, "createForest", 60, -200, 150, 100, 111));
    world.add(await call(N, "createForest", 60, 200, 150, 100, 222));
    world.add(await call(N, "createForest", 40, 0, -200, 120, 333));

    // animals (same pens as the app): cows west, pigs east, a few ducks and chickens in between
    const cowColors = ["#f5f5dc", "#d4b896", "#c9a577", "#f0e6d2", "#e8d5b7"];
    for (let i = 0; i < cowColors.length; i++) place(await call(A, "createCow", cowColors[i]), -140 + i * 8, 0, 130, "cow");
    const pigColors = ["#f5b7b1", "#e8b4b8", "#f0c4c4", "#e6a8a8", "#f5c0b8", "#d4a5a5"];
    for (let i = 0; i < pigColors.length; i++) place(await call(A, "createPig", pigColors[i]), 130 + i * 5, 0, 130, "pig");
    for (let i = 0; i < 4; i++) place(await call(A, "createDuck"), -20 + i * 4, 0, 90, "duck");
    for (let i = 0; i < 6; i++) place(await call(N, "createChicken"), 30 + i * 3, 0, 95, "chicken");

    // vehicles parked on the main road, villagers on the plaza
    place(await call(G, "createCar", "#c0392b"), -30, 0, 3, "car");
    place(await call(G, "createMotorbike"), -20, 0, -3, "motorbike");
    place(await call(G, "createBicycle"), -12, 0, 3, "bicycle");
    const roles = ["farmer", "market", "shopkeeper", "elder", "student", "teacher", "medic"];
    for (let i = 0; i < roles.length; i++)
      place(await call("components/villageLife.ts", "createVillager", "#3498db", roles[i]), -9 + i * 3, 0, 8, "villager-" + roles[i]);

    bakeInstanced(world);
    report.world = await save(world, "world/mi-k-village.glb");
    dispose(world);
    if (report.world.skipped) { report.skipped.push({ category: "world", name: "mi-k-village", reason: report.world.skipped }); report.world = null; }
  } catch (err) {
    report.failed.push({ category: "world", name: "mi-k-village", error: err instanceof Error ? err.message : String(err) });
    console.log(`  x world: ${report.failed.at(-1).error}`);
  }
}

/* ---------------- 3. report ---------------- */
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "index.json"), JSON.stringify(report, null, 2));
const bytes = report.items.reduce((s, i) => s + i.bytes, 0) + (report.world?.bytes ?? 0);
const cats = new Map();
for (const i of report.items) cats.set(i.category, (cats.get(i.category) ?? 0) + 1);
for (const [c, n] of [...cats].sort()) console.log(`  ok ${c.padEnd(12)} ${n}`);
for (const s of report.skipped) console.log(`  - skipped ${s.category}/${s.name}: ${s.reason}`);
if (report.world) console.log(`  ok world/mi-k-village.glb  ${(report.world.bytes / 1048576).toFixed(1)} MB, ${report.world.meshes} meshes`);
console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(0)}s: ${report.items.length} files, ${report.failed.length} failed, ${report.skipped.length} skipped, ${(bytes / 1048576).toFixed(1)} MB.`);
console.log(`Report: ${join(OUT, "index.json")}`);
process.exitCode = report.items.length && !report.failed.length ? 0 : 1;
