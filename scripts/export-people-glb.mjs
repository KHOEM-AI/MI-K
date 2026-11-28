// Exports animated people as .glb: different skin tones, heights, ages and outfits, each with the clips
// idle, walk, run, wave and talk inside the file, plus one line-up file to compare everybody side by side.
//
//   npx tsx scripts/export-people-glb.mjs --list          show who would be exported (writes nothing)
//   npx tsx scripts/export-people-glb.mjs                 14 people + line-up
//   npx tsx scripts/export-people-glb.mjs --skins         also: a man and a woman in every skin tone
//   npx tsx scripts/export-people-glb.mjs --only=doctor   only ids that contain the text
//   npx tsx scripts/export-people-glb.mjs --out=DIR       output folder (default: exports/people)
//
// Output: <out>/<id>.glb  <out>/lineup.glb  <out>/skins/<id>_<tone>.glb  <out>/index.json  <out>/viewer.html
// To watch them: cd exports/people && python3 -m http.server 8000, then open http://localhost:8000/viewer.html
// The clips are plain glTF node animations: they play in three.js (AnimationMixer), Blender, Babylon, model-viewer.
import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PEOPLE, TONES, TONE_NAMES, K, figureOptions, validatePeople } from "./people-catalog.mjs";
import { CLIPS, CLIP_NAMES } from "./people-motion.mjs";
import { rigFigure, buildClips } from "./people-lib.mjs";
import { toGlb, readGlbJson } from "./glb-node.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => (args.find((a) => a.startsWith(n + "=")) ?? "").slice(n.length + 1) || null;
const OUT = opt("--out") ?? join(ROOT, "exports", "people");
const ONLY = opt("--only");

const problems = validatePeople();
if (problems.length) { console.error("People catalog problems:\n  " + problems.join("\n  ")); process.exit(1); }

const people = PEOPLE.filter((p) => !ONLY || p.id.includes(ONLY));
const skinBase = PEOPLE.filter((p) => ["man", "woman"].includes(p.id));

if (flag("--list")) {
  console.log(`${people.length} people, ${CLIP_NAMES.length} clips each (${CLIP_NAMES.join(", ")}):`);
  for (const p of people) console.log(`  ${p.id.padEnd(12)} ${String(p.heightM.toFixed(2)).padStart(5)} m   skin: ${p.tone}`);
  console.log(`Skin tones: ${TONE_NAMES.join(", ")}`);
  console.log(`Plus lineup.glb${flag("--skins") ? ` and ${skinBase.length * TONE_NAMES.length} skin-tone files` : ""}. Nothing written (--list).`);
  process.exit(0);
}

const THREE = await import("three");
const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
const { createHumanFigure } = await import(pathToFileURL(join(ROOT, "src/components/humanFigure.ts")).href);

function build(person, tone, prefix = "") {
  const figure = createHumanFigure(figureOptions(person, tone));
  figure.name = prefix ? prefix.replace(/_$/, "") : person.id;
  const rig = rigFigure(figure, prefix);
  return { figure, rig };
}

function stats(obj) {
  let meshes = 0, triangles = 0;
  obj.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    const g = o.geometry;
    triangles += Math.round((g.index ? g.index.count : g.attributes?.position?.count ?? 0) / 3);
  });
  const size = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
  return { meshes, triangles, heightM: +(size.y / K).toFixed(2) };
}

/** Writes one file and checks the animations really landed inside it. */
async function save(obj, clips, rel) {
  const { glb, warnings } = await toGlb(GLTFExporter, obj, { animations: clips });
  const json = readGlbJson(glb);
  const got = (json.animations ?? []).map((a) => a.name);
  const channels = (json.animations ?? []).reduce((n, a) => n + a.channels.length, 0);
  const expected = clips.reduce((n, c) => n + c.tracks.length, 0);
  if (got.length !== clips.length || channels !== expected)
    throw new Error(`animations lost on export: ${got.length}/${clips.length} clips, ${channels}/${expected} channels` + (warnings.length ? ` (${warnings[0]})` : ""));
  const file = join(OUT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, glb);
  return { file: rel, bytes: glb.length, clips: got, warnings: warnings.length };
}

const report = { generated: new Date().toISOString(), clips: Object.fromEntries(CLIP_NAMES.map((n) => [n, CLIPS[n].duration])), items: [], skins: [], lineup: null, failed: [] };
const t0 = Date.now();
console.log(`Exporting ${people.length} people to ${OUT} ...`);

const one = async (person, tone, rel, list) => {
  try {
    const { figure, rig } = build(person, tone);
    const r = await save(figure, buildClips(THREE, rig), rel);
    list.push({ id: person.id, tone, skin: "#" + TONES[tone].toString(16).padStart(6, "0"), ...stats(figure), ...r });
  } catch (err) {
    report.failed.push({ id: person.id, error: err instanceof Error ? err.message : String(err) });
    console.log(`  x ${rel}: ${report.failed.at(-1).error}`);
  }
};

for (const p of people) await one(p, p.tone, `${p.id}.glb`, report.items);

if (flag("--skins"))
  for (const p of skinBase) for (const tone of TONE_NAMES) await one(p, tone, `skins/${p.id}_${tone}.glb`, report.skins);

// everybody in one row, each with its own idle clip, to compare heights and skin tones
if (!ONLY) {
  try {
    const row = new THREE.Group();
    row.name = "lineup";
    const clips = [], gap = 1.3;
    PEOPLE.forEach((p, i) => {
      const { figure, rig } = build(p, p.tone, p.id + "_");
      figure.position.x = (i - (PEOPLE.length - 1) / 2) * gap;
      row.add(figure);
      clips.push(...buildClips(THREE, rig, ["idle"], { clipPrefix: p.id + "_" }));
    });
    report.lineup = { ...stats(row), ...(await save(row, clips, "lineup.glb")) };
  } catch (err) {
    report.failed.push({ id: "lineup", error: err instanceof Error ? err.message : String(err) });
    console.log(`  x lineup: ${report.failed.at(-1).error}`);
  }
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "index.json"), JSON.stringify(report, null, 2));
copyFileSync(join(ROOT, "scripts", "people-viewer.html"), join(OUT, "viewer.html"));
for (const i of report.items) console.log(`  ok ${i.id.padEnd(12)} ${i.heightM.toFixed(2)} m  ${i.tone.padEnd(7)} ${i.clips.length} clips  ${(i.bytes / 1024).toFixed(0)} KB`);
if (report.skins.length) console.log(`  ok ${report.skins.length} skin-tone files`);
if (report.lineup) console.log(`  ok lineup.glb  ${(report.lineup.bytes / 1024).toFixed(0)} KB`);
const total = [...report.items, ...report.skins, report.lineup].filter(Boolean).reduce((s, i) => s + i.bytes, 0);
console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(0)}s: ${report.items.length + report.skins.length + (report.lineup ? 1 : 0)} files, ${report.failed.length} failed, ${(total / 1048576).toFixed(1)} MB.`);
console.log(`Report: ${join(OUT, "index.json")}`);
console.log("Watch them:  cd " + OUT + " && python3 -m http.server 8000   then open http://localhost:8000/viewer.html");
process.exitCode = report.failed.length ? 1 : 0;
