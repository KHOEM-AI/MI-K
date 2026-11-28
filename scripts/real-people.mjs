// Builds the real-model people: the rigged human at several heights, each with idle, walk, run, wave and talk.
//
//   node scripts/real-people.mjs [model.glb] [outdir]
//   default: public/characters/fashion-model.glb -> exports/people/real   (the viewer lists them)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import { parseGlb, buildGlb, validateGlb, editModel, skeletonHeight } from "./glb-rig-tool.mjs";
import { addClips } from "./mixamo-motion.mjs";

export const SIZES = [["small_adult", 1.45], ["woman", 1.58], ["man", 1.70], ["tall", 1.82], ["very_tall", 1.92]];

export function buildPeople(input, outdir) {
  const name = basename(input, ".glb"), made = [];
  mkdirSync(outdir, { recursive: true });
  for (const [id, height] of SIZES) {
    const model = parseGlb(readFileSync(input));
    editModel(model.json, { height });
    const r = addClips(model);
    const problems = validateGlb(model.json, r.bin);
    if (problems.length) throw new Error(`${id}: invalid result\n  ${problems.slice(0, 5).join("\n  ")}`);
    const file = `${name}_${id}.glb`, glb = buildGlb(model.json, r.bin);
    writeFileSync(join(outdir, file), glb);
    made.push(file);
    console.log(`ok ${file}  ${skeletonHeight(model.json).toFixed(2)} m  ${model.json.animations.length} clips  ${(glb.length / 1048576).toFixed(2)} MB`);
  }
  writeFileSync(join(outdir, "list.json"), JSON.stringify({ files: made }, null, 2));   // the viewer reads this
  return made;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  try { buildPeople(process.argv[2] ?? "public/characters/fashion-model.glb", process.argv[3] ?? "exports/people/real"); }
  catch (e) { console.error("error: " + (e instanceof Error ? e.message : e)); process.exit(1); }
}
