// Exports every 3D Studio object (cars, houses, furniture, tools, plants, buildings, ...) as its own .glb file.
// The list of objects is read from src/components/Studio3D.tsx (the same dispatch the Studio's own GLB export uses),
// so nothing is typed in by hand and a new shape added to the Studio is exported too.
//   node scripts/export-all-glb.mjs --list              show what would be exported (nothing is written)
//   node scripts/export-all-glb.mjs                     export to exports/glb/<category>/<shape>.glb
//   node scripts/export-all-glb.mjs <folder> [--only=car] [--force]
// Existing files are never overwritten unless --force is given. Result summary: <folder>/index.json
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname } from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const COMPONENTS = join(ROOT, "src", "components");

// shapes that are built with (THREE, color, metalness, roughness) and have no shape argument, or sit inside a ternary
const NO_SHAPE_EXTRAS = [
  ["bridge", "createBridgeGeometry"], ["trafficlight", "createTrafficLightGeometry"], ["streetlight", "createStreetLightGeometry"],
];

const COND = String.raw`((?:item\.shape\s*===\s*"[^"]+"\s*\|\|\s*)*item\.shape\s*===\s*"[^"]+")`;
const head = String.raw`if\s*\(\s*\(?\s*${COND}\s*\)?\s*\)\s*\{\s*const\s+\w+\s*=\s*(create\w+)\(\s*THREE\s*,\s*`;
const RE_SHAPE = new RegExp(head + String.raw`item\.shape\b`, "g");
const RE_COLOR = new RegExp(head + String.raw`item\.color\b`, "g");

export const categoryOf = (fn) => fn.replace(/^create/, "").replace(/Geometry(\d*)$/, "$1").toLowerCase();
export const safeName = (s) => /^[a-z0-9][a-z0-9_-]{0,63}$/i.test(String(s));

// text of Studio3D.tsx -> [{ fn, shape, withShape }]  (withShape: fn(THREE, shape, color, metalness, roughness) or fn(THREE, color, metalness, roughness))
export function parsePlan(text) {
  const out = [], seen = new Set();
  const add = (fn, shape, withShape) => { const k = fn + ":" + shape; if (!seen.has(k)) { seen.add(k); out.push({ fn, shape, withShape }); } };
  for (const [re, withShape] of [[RE_SHAPE, true], [RE_COLOR, false]]) {
    for (const m of text.matchAll(re)) for (const s of m[1].matchAll(/item\.shape\s*===\s*"([^"]+)"/g)) add(m[2], s[1], withShape);
  }
  for (const [shape, fn] of NO_SHAPE_EXTRAS) if (text.includes(`${fn}(THREE, item.color`)) add(fn, shape, false);
  return out;
}

// function name -> module specifier ("./studioGeometry") from the import lines of Studio3D.tsx
export function parseImports(text) {
  const map = new Map();
  for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*["'](\.\/[^"']+)["']/g))
    for (const part of m[1].split(",")) {
      const name = part.trim().split(/\s+as\s+/)[0].trim();
      if (/^create\w+$/.test(name) && !map.has(name)) map.set(name, m[2]);
    }
  return map;
}

// Runs the export. Everything that touches three.js is injected (load, build, inspect, toGlb, dispose), so this part is testable.
export async function exportAll({ plan, load, build, inspect, toGlb, dispose = () => {}, outDir, only = null, force = false, log = () => {} }) {
  const items = [], failed = [], skipped = [];
  let totalBytes = 0;
  for (const e of plan) {
    const category = categoryOf(e.fn);
    if (only && !category.includes(only) && !e.shape.includes(only)) continue;
    if (!safeName(e.shape)) { skipped.push({ category, shape: e.shape, reason: "unsafe name" }); continue; }
    const rel = `${category}/${e.shape}.glb`, file = join(outDir, rel);
    if (existsSync(file) && !force) { skipped.push({ category, shape: e.shape, reason: "file exists (use --force)" }); continue; }
    let obj = null;
    try {
      const fn = await load(e.fn);
      if (typeof fn !== "function") { skipped.push({ category, shape: e.shape, reason: `${e.fn} not found in its module` }); continue; }
      obj = build(fn, e);
      if (obj && !obj.name) obj.name = e.shape;
      const info = inspect(obj);
      if (info.problem) { skipped.push({ category, shape: e.shape, reason: info.problem }); continue; }
      const { glb, warnings } = await toGlb(obj);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, glb);
      totalBytes += glb.length;
      items.push({ category, shape: e.shape, file: rel, bytes: glb.length, meshes: info.meshes, triangles: info.triangles, warnings: warnings.length });
    } catch (err) {
      failed.push({ category, shape: e.shape, error: err instanceof Error ? err.message : String(err) });
      log(`✘ ${category}/${e.shape}: ${failed.at(-1).error}`);
    } finally {
      try { if (obj) dispose(obj); } catch { /* ignore */ }
    }
  }
  return { items, failed, skipped, totalBytes };
}

async function main() {
  const args = process.argv.slice(2);
  const list = args.includes("--list"), force = args.includes("--force");
  const only = (args.find((a) => a.startsWith("--only=")) ?? "").slice(7) || null;
  const outDir = args.find((a) => !a.startsWith("--")) ?? join(ROOT, "exports", "glb");
  const studio = join(COMPONENTS, "Studio3D.tsx");
  if (!existsSync(studio)) { console.error("cannot find " + studio); process.exit(1); }
  const text = readFileSync(studio, "utf8");
  const plan = parsePlan(text), imports = parseImports(text);
  const byCat = new Map();
  for (const e of plan) byCat.set(categoryOf(e.fn), (byCat.get(categoryOf(e.fn)) ?? 0) + 1);
  console.log(`Found ${plan.length} objects in ${byCat.size} groups (from Studio3D.tsx).`);
  if (list) { for (const [c, n] of [...byCat].sort()) console.log(`  ${c.padEnd(18)} ${n}`); console.log("Nothing written (--list)."); return; }

  const THREE = await import("three");
  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
  if (typeof FileReader === "undefined") {
    globalThis.FileReader = class {
      readAsArrayBuffer(b) { b.arrayBuffer().then((r) => { this.result = r; this.onloadend && this.onloadend(); }); }
      readAsDataURL(b) { b.arrayBuffer().then((r) => { this.result = "data:" + (b.type || "application/octet-stream") + ";base64," + Buffer.from(r).toString("base64"); this.onloadend && this.onloadend(); }); }
    };
  }
  const modules = new Map();
  const load = async (fn) => {
    const spec = imports.get(fn) ?? "./studioGeometry";
    if (!modules.has(spec)) {
      const base = join(COMPONENTS, spec.slice(2).replace(/\.(ts|tsx|mjs|js)$/, ""));
      const file = [".ts", ".mjs", ".js"].map((x) => base + x).find((f) => existsSync(f));
      modules.set(spec, file ? await import(pathToFileURL(file).href) : {});
    }
    return modules.get(spec)[fn];
  };
  const build = (fn, e) => (e.withShape ? fn(THREE, e.shape, "#ffffff", 0.5, 0.5) : fn(THREE, "#ffffff", 0.5, 0.5));
  const inspect = (obj) => {
    let meshes = 0, triangles = 0;
    obj.traverse((o) => {
      if (!o.isMesh) return;
      meshes++;
      const g = o.geometry;
      triangles += Math.round((g.index ? g.index.count : g.attributes?.position?.count ?? 0) / 3);
    });
    if (!meshes) return { meshes, triangles, problem: "no meshes (empty)" };
    const box = new THREE.Box3().setFromObject(obj);
    if (box.isEmpty() || ![box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z].every(Number.isFinite)) return { meshes, triangles, problem: "empty or invalid size" };
    return { meshes, triangles };
  };
  const toGlb = (obj) => new Promise((resolve, reject) => {
    const warnings = [], warn = console.warn;
    console.warn = (...a) => warnings.push(a.join(" "));
    const done = (fn) => (v) => { console.warn = warn; clearTimeout(timer); fn(v); };
    const timer = setTimeout(() => { console.warn = warn; reject(new Error("timeout (needs a browser?)")); }, 30000);
    new GLTFExporter().parse(obj, done((out) => (out instanceof ArrayBuffer ? resolve({ glb: Buffer.from(out), warnings }) : reject(new Error("no binary output")))),
      done((e) => reject(e instanceof Error ? e : new Error(String(e)))), { binary: true });
  });
  const dispose = (obj) => obj.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry?.dispose?.();
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) m?.dispose?.();
  });

  mkdirSync(outDir, { recursive: true });
  console.log(`Exporting to ${outDir}${only ? " (only: " + only + ")" : ""} ...`);
  const t0 = Date.now();
  const r = await exportAll({ plan, load, build, inspect, toGlb, dispose, outDir, only, force, log: console.log });
  const notes = [];
  if (text.includes("isInfraShape(item.shape)")) notes.push("infra shapes (trains, stations, ...) are not included yet");
  writeFileSync(join(outDir, "index.json"), JSON.stringify({ generated: new Date().toISOString(), count: r.items.length, totalBytes: r.totalBytes, items: r.items, failed: r.failed, skipped: r.skipped, notes }, null, 2));
  const cats = new Map();
  for (const i of r.items) cats.set(i.category, (cats.get(i.category) ?? 0) + 1);
  for (const [c, n] of [...cats].sort()) console.log(`  ✔ ${c.padEnd(18)} ${n}`);
  for (const s of r.skipped) console.log(`  - skipped ${s.category}/${s.shape}: ${s.reason}`);
  console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(0)}s: ${r.items.length} exported (${(r.totalBytes / 1048576).toFixed(1)} MB), ${r.failed.length} failed, ${r.skipped.length} skipped.`);
  for (const n of notes) console.log("Note: " + n);
  console.log(`Index: ${join(outDir, "index.json")}`);
  process.exitCode = r.items.length ? 0 : 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error("export failed:", e && e.message ? e.message : e); process.exit(1); });
