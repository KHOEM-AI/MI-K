// Checks the character models in public/characters against public/characters/README.md:
// a real rigged human (skeleton, head, hands and fingers, legs and feet, textures, animation clips), not a placeholder mannequin.
//   npm run characters           (or: node scripts/check-characters.mjs [folder])
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

export const IDS = ["businessman", "fashion-model", "doctor", "businesswoman", "student", "nurse"]; // same ids as PEOPLE in HumanViewer.tsx

// Reads a .glb (bytes) and judges it. Never throws: a bad file gives { ok: false, error }.
export function analyzeGlb(buf) {
  try {
    if (buf.length < 20 || buf.toString("latin1", 0, 4) !== "glTF") return { ok: false, error: "not a GLB file (a .glb starts with the bytes glTF)" };
    let off = 12, j = null;
    while (off + 8 <= buf.length) {
      const len = buf.readUInt32LE(off), type = buf.toString("latin1", off + 4, off + 8);
      if (off + 8 + len > buf.length) return { ok: false, error: "file is cut short (download incomplete?)" };
      if (type === "JSON") j = JSON.parse(buf.toString("utf8", off + 8, off + 8 + len));
      off += 8 + len;
    }
    if (!j) return { ok: false, error: "no JSON chunk" };
    const acc = j.accessors ?? [], nodes = j.nodes ?? [];
    const joints = [...new Set((j.skins ?? []).flatMap((s) => s.joints ?? []))].map((n) => nodes[n]?.name ?? "#" + n);
    let triangles = 0;
    for (const m of j.meshes ?? []) for (const p of m.primitives ?? []) {
      if ((p.mode ?? 4) !== 4) continue;
      triangles += (p.indices !== undefined ? acc[p.indices]?.count : acc[p.attributes?.POSITION]?.count) / 3 || 0;
    }
    const mats = j.materials ?? [];
    const textured = mats.filter((m) => m.pbrMetallicRoughness?.baseColorTexture || m.pbrMetallicRoughness?.metallicRoughnessTexture || m.normalTexture).length;
    const clips = (j.animations ?? []).map((a, i) => ({
      name: a.name ?? "clip_" + (i + 1),
      seconds: Math.max(0, ...(a.samplers ?? []).map((s) => acc[s.input]?.max?.[0] ?? 0)),
    }));
    const generator = String(j.asset?.generator ?? "");
    const has = (re) => joints.some((n) => re.test(n));
    const checks = [];
    const add = (level, text) => checks.push({ level, text });
    if (/gltfexporter/i.test(generator)) add("fail", "made by three.js GLTFExporter: probably this app's own placeholder mannequin");
    if (!joints.length) add("fail", "no skeleton (README requires one)");
    else if (joints.length < 20) add("warn", `only ${joints.length} bones (a full human rig has 20+)`);
    else add("ok", `skeleton: ${joints.length} bones`);
    if (joints.length) {
      if (!has(/head/i)) add("warn", "no head bone");
      if (!has(/finger|thumb|index|middle|ring|pinky/i)) add("warn", "no finger bones");
      if (!has(/leg|foot|toe|thigh|shin|calf/i)) add("warn", "no leg or foot bones");
    }
    if (!textured) add("warn", "no textures (flat colours only; README asks for PBR textures)");
    else add("ok", `${textured} material(s) with textures`);
    if (!clips.length) add("warn", "no animation clips");
    else add("ok", `${clips.length} clip(s)`);
    if (triangles < 8000) add("warn", `low detail: ${Math.round(triangles)} triangles (may look like a placeholder)`);
    else add("ok", `${Math.round(triangles)} triangles`);
    return { ok: true, generator, triangles: Math.round(triangles), joints, clips, checks, materials: mats.length, textured, images: (j.images ?? []).length };
  } catch (e) {
    return { ok: false, error: "cannot read the model: " + (e instanceof Error ? e.message : String(e)) };
  }
}

export const verdict = (r) => (!r.ok || r.checks.some((c) => c.level === "fail") ? "fail" : r.checks.some((c) => c.level === "warn") ? "warn" : "ok");

function main() {
  const dir = process.argv[2] ?? fileURLToPath(new URL("../public/characters/", import.meta.url));
  const mark = { ok: "✔", warn: "!", fail: "✘" };
  const have = existsSync(dir) ? readdirSync(dir).filter((f) => /\.glb$/i.test(f)) : [];
  let missing = 0, bad = 0;
  console.log("Characters in " + dir + "\n");
  for (const id of IDS) {
    const f = `${id}.glb`;
    if (!have.includes(f)) { missing++; console.log(`✘ ${id.padEnd(14)} MISSING (the People tab shows the built-in test mannequin)`); continue; }
    const r = analyzeGlb(readFileSync(`${dir}/${f}`));
    if (!r.ok) { bad++; console.log(`✘ ${id.padEnd(14)} ${r.error}`); continue; }
    const v = verdict(r);
    if (v === "fail") bad++;
    console.log(`${mark[v]} ${id.padEnd(14)} ${r.triangles} triangles, ${r.joints.length} bones, ${r.clips.length} clips`);
    console.log(`    made by: ${r.generator || "(not stated)"}`);
    if (r.joints.length) console.log(`    bones: ${r.joints.slice(0, 6).join(", ")}${r.joints.length > 6 ? ", ..." : ""}`);
    if (r.clips.length) console.log(`    clips: ${r.clips.map((c) => `${c.name} (${c.seconds.toFixed(1)}s)`).join(", ")}`);
    for (const c of r.checks) if (c.level !== "ok") console.log(`    ${mark[c.level]} ${c.text}`);
  }
  const extra = have.filter((f) => !IDS.includes(f.replace(/\.glb$/i, "")));
  if (extra.length) console.log("\nNot used by the People tab (name does not match a character): " + extra.join(", "));
  console.log(`\n${IDS.length - missing - bad} of ${IDS.length} characters are ready; ${missing} missing, ${bad} with problems.`);
  process.exitCode = missing || bad ? 1 : 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
