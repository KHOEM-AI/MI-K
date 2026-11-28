// Works directly on rigged human .glb files (Mixamo style bones). No three.js needed.
//
//   node scripts/glb-rig-tool.mjs inspect model.glb [--bones]
//       size, bones, height in metres, animations, face blendshapes (needed for lip sync), materials
//   node scripts/glb-rig-tool.mjs edit model.glb out.glb [--height 1.65] [--tint "#c99672"] [--drop-animations=TPose,SambaDance]
//       a new file with another height and/or a darker colour tint (the tint multiplies the WHOLE texture, clothes included)
//   node scripts/glb-rig-tool.mjs merge base.glb out.glb idle=Idle.glb walk=Walking.glb [--in-place=walk,run] [--drop-existing]
//       copies the animation(s) of the other .glb files into the base model, matched by bone name
//   node scripts/glb-rig-tool.mjs variants base.glb outdir
//       the base model at five heights (small adult to tall adult)
//
// The input file is never changed. Every file written is checked before the tool says "ok".
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/* ---------------- reading and writing .glb ---------------- */
export function parseGlb(buf) {
  if (buf.length < 20 || buf.toString("latin1", 0, 4) !== "glTF") throw new Error("not a GLB file");
  if (buf.readUInt32LE(4) !== 2) throw new Error("only glTF 2.0 is supported");
  let json = null, bin = null, off = 12;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32LE(off), type = buf.toString("latin1", off + 4, off + 8);
    if (off + 8 + len > buf.length) throw new Error("GLB is cut short");
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "JSON") json = JSON.parse(data.toString("utf8"));
    else if (type === "BIN\0" && !bin) bin = Buffer.from(data);
    off += 8 + len;
  }
  if (!json) throw new Error("GLB has no JSON chunk");
  return { json, bin: bin ?? Buffer.alloc(0) };
}

const pad4 = (n) => (4 - (n % 4)) % 4;

export function buildGlb(json, bin) {
  const j = Buffer.from(JSON.stringify(json), "utf8");
  const jp = Buffer.concat([j, Buffer.alloc(pad4(j.length), 0x20)]);
  const bp = Buffer.concat([bin, Buffer.alloc(pad4(bin.length))]);
  const total = 12 + 8 + jp.length + (bp.length ? 8 + bp.length : 0);
  const head = Buffer.alloc(20);
  head.write("glTF", 0, "latin1"); head.writeUInt32LE(2, 4); head.writeUInt32LE(total, 8);
  head.writeUInt32LE(jp.length, 12); head.write("JSON", 16, "latin1");
  const parts = [head, jp];
  if (bp.length) { const h = Buffer.alloc(8); h.writeUInt32LE(bp.length, 0); h.write("BIN\0", 4, "latin1"); parts.push(h, bp); }
  return Buffer.concat(parts);
}

/* ---------------- structure check (returns a list of problems, empty = fine) ---------------- */
const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
const BYTES = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };

export function validateGlb(json, bin) {
  const p = [];
  const total = json.buffers?.[0]?.byteLength ?? 0;
  if (json.buffers?.[0] && !json.buffers[0].uri && bin.length < total) p.push(`binary chunk is ${bin.length} bytes, buffer says ${total}`);
  (json.bufferViews ?? []).forEach((v, i) => { if ((v.byteOffset ?? 0) + v.byteLength > total) p.push(`bufferView ${i} runs past the buffer`); });
  (json.accessors ?? []).forEach((a, i) => {
    if (a.bufferView === undefined) return;
    const v = json.bufferViews?.[a.bufferView];
    if (!v) return p.push(`accessor ${i}: missing bufferView`);
    const elem = COMPONENTS[a.type] * BYTES[a.componentType];
    const stride = v.byteStride ?? elem;
    const need = (a.byteOffset ?? 0) + (a.count - 1) * stride + elem;
    if (a.count > 0 && need > v.byteLength) p.push(`accessor ${i} is larger than its bufferView`);
  });
  const nodes = json.nodes?.length ?? 0;
  (json.animations ?? []).forEach((an, i) => {
    an.channels.forEach((c, k) => {
      if (!(c.target.node >= 0 && c.target.node < nodes)) p.push(`animation ${i} channel ${k}: no such node`);
      const s = an.samplers[c.sampler];
      if (!s) return p.push(`animation ${i} channel ${k}: no such sampler`);
      const inp = json.accessors[s.input], out = json.accessors[s.output];
      if (!inp || !out) return p.push(`animation ${i} channel ${k}: no such accessor`);
      const per = { rotation: 4, translation: 3, scale: 3 }[c.target.path];
      if (per && out.count !== inp.count) p.push(`animation ${i} (${an.name}) channel ${k}: ${inp.count} times but ${out.count} values`);
    });
  });
  (json.skins ?? []).forEach((s, i) => s.joints.forEach((n) => { if (!(n >= 0 && n < nodes)) p.push(`skin ${i}: bad joint ${n}`); }));
  return p;
}

/* ---------------- tiny matrix maths (column-major 4x4) ---------------- */
const mul = (a, b) => {
  const o = new Float64Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
};
function trs(n) {
  if (n.matrix) return Float64Array.from(n.matrix);
  const [x, y, z, w] = n.rotation ?? [0, 0, 0, 1], [sx, sy, sz] = n.scale ?? [1, 1, 1], [tx, ty, tz] = n.translation ?? [0, 0, 0];
  const m = new Float64Array(16);
  m[0] = (1 - 2 * (y * y + z * z)) * sx; m[1] = 2 * (x * y + z * w) * sx; m[2] = 2 * (x * z - y * w) * sx;
  m[4] = 2 * (x * y - z * w) * sy; m[5] = (1 - 2 * (x * x + z * z)) * sy; m[6] = 2 * (y * z + x * w) * sy;
  m[8] = 2 * (x * z + y * w) * sz; m[9] = 2 * (y * z - x * w) * sz; m[10] = (1 - 2 * (x * x + y * y)) * sz;
  m[12] = tx; m[13] = ty; m[14] = tz; m[15] = 1;
  return m;
}

/** World matrix of every node, in the rest pose. */
export function worldMatrices(json) {
  const out = new Array(json.nodes.length).fill(null);
  const walk = (i, parent) => {
    const m = parent ? mul(parent, trs(json.nodes[i])) : trs(json.nodes[i]);
    out[i] = m;
    for (const c of json.nodes[i].children ?? []) walk(c, m);
  };
  for (const r of json.scenes?.[json.scene ?? 0]?.nodes ?? []) walk(r, null);
  return out;
}

/** Height in metres: highest minus lowest bone of the first skin, in the rest pose. null when there is no skeleton. */
export function skeletonHeight(json) {
  const joints = json.skins?.[0]?.joints;
  if (!joints?.length) return null;
  const world = worldMatrices(json), ys = joints.map((j) => world[j]?.[13]).filter(Number.isFinite);
  return ys.length ? Math.max(...ys) - Math.min(...ys) : null;
}

/* ---------------- accessors ---------------- */
export function readAccessor(json, bin, index) {
  const a = json.accessors[index];
  if (a.sparse) throw new Error("sparse accessors are not supported");
  const v = json.bufferViews[a.bufferView];
  const elem = COMPONENTS[a.type] * BYTES[a.componentType], stride = v.byteStride ?? elem;
  const start = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
  const data = Buffer.alloc(elem * a.count);
  for (let i = 0; i < a.count; i++) bin.copy(data, i * elem, start + i * stride, start + i * stride + elem);
  return { a, data };
}

function animationDuration(json, anim) {
  let d = 0;
  for (const s of anim.samplers) { const m = json.accessors[s.input].max?.[0]; if (m > d) d = m; }
  return d;
}

/* ---------------- inspect ---------------- */
export function inspect(json, bin, { bones = false } = {}) {
  const lines = [];
  const names = (json.nodes ?? []).map((n) => n.name ?? "");
  const joints = json.skins?.[0]?.joints ?? [];
  const h = skeletonHeight(json);
  lines.push(`file: ${((bin.length) / 1048576).toFixed(2)} MB binary, generator ${json.asset?.generator ?? "?"}`);
  lines.push(`meshes ${json.meshes?.length ?? 0}, materials ${json.materials?.length ?? 0}, textures ${json.textures?.length ?? 0}, skins ${json.skins?.length ?? 0}`);
  lines.push(`bones: ${joints.length}` + (h != null ? `, height in rest pose: ${h.toFixed(2)} m` : ""));
  const fingers = joints.filter((j) => /Hand(Thumb|Index|Middle|Ring|Pinky)\d/.test(names[j])).length;
  lines.push(`fingers: ${fingers ? fingers + " finger bones" : "none"}`);
  let morphs = 0; const morphNames = new Set();
  for (const m of json.meshes ?? []) for (const pr of m.primitives) {
    morphs += pr.targets?.length ?? 0;
    for (const n of pr.extras?.targetNames ?? m.extras?.targetNames ?? []) morphNames.add(n);
  }
  lines.push(`face blendshapes: ${morphs ? `${morphs} (${[...morphNames].slice(0, 6).join(", ")}${morphNames.size > 6 ? ", ..." : ""})` : "none, so no lip sync / expressions"}`);
  const anims = json.animations ?? [];
  lines.push(`animations: ${anims.length}`);
  for (const a of anims) lines.push(`  - ${a.name ?? "(no name)"}: ${animationDuration(json, a).toFixed(2)} s, ${a.channels.length} channels`);
  const first = (json.materials ?? [])[0];
  if (first) lines.push(`material "${first.name}" colour factor ${JSON.stringify(first.pbrMetallicRoughness?.baseColorFactor ?? [1, 1, 1, 1])}`);
  if (bones) {
    const set = new Set(joints), depth = (i, d = 0) => {
      if (set.has(i)) lines.push(`${"  ".repeat(d)}${names[i]}`);
      for (const c of json.nodes[i].children ?? []) depth(c, set.has(i) ? d + 1 : d);
    };
    for (const r of json.scenes?.[json.scene ?? 0]?.nodes ?? []) depth(r);
  }
  return lines;
}

/* ---------------- edit ---------------- */
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export function parseHex(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) throw new Error(`colour must look like #c99672, got "${hex}"`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => srgbToLinear(v / 255));
}

function dropAnimations(json, names) {
  if (!json.animations) return 0;
  const before = json.animations.length;
  json.animations = json.animations.filter((a) => !names.includes(a.name));
  if (!json.animations.length) delete json.animations;
  return before - (json.animations?.length ?? 0);
}

export function editModel(json, { height, tint, drop } = {}) {
  const notes = [];
  if (height !== undefined) {
    const now = skeletonHeight(json);
    if (!now) throw new Error("no skeleton: cannot set a height");
    if (!(height >= 0.5 && height <= 2.5)) throw new Error("height must be between 0.5 and 2.5 metres");
    const k = height / now;
    for (const r of json.scenes[json.scene ?? 0].nodes) {
      const s = json.nodes[r].scale ?? [1, 1, 1];
      json.nodes[r].scale = s.map((v) => v * k);
    }
    notes.push(`height ${now.toFixed(2)} m -> ${height.toFixed(2)} m (x${k.toFixed(3)})`);
  }
  if (tint) {
    const f = parseHex(tint);
    if (!json.materials?.length) throw new Error("no material to tint");
    for (const m of json.materials) {
      m.pbrMetallicRoughness ??= {};
      m.pbrMetallicRoughness.baseColorFactor = [...f, 1].map((v, i) => (i < 3 ? Math.min(1, v) : 1));
    }
    notes.push(`colour factor ${tint} (multiplies the whole texture; it can only darken)`);
  }
  if (drop?.length) notes.push(`removed ${dropAnimations(json, drop)} animation(s)`);
  return notes;
}

/* ---------------- merge animations ---------------- */
function nodeIndexByName(json) {
  const map = new Map();
  json.nodes.forEach((n, i) => n.name && !map.has(n.name) && map.set(n.name, i));
  return map;
}

/** Length of the Spine bone: tells how big the source skeleton is compared with the base one (cm vs m). */
const spineLength = (json) => {
  const i = json.nodes.findIndex((n) => /Spine$/.test(n.name ?? ""));
  return i < 0 ? null : Math.hypot(...(json.nodes[i].translation ?? [0, 0, 0])) || null;
};

/**
 * Copies animations from `src` into `base` (both { json, bin }). Returns { bin, notes }.
 * `clips` = [{ name, srcIndex }]. Channels are matched by bone name. Translations are rescaled when the
 * source skeleton has another unit size. `inPlace` clip names keep the hips from travelling.
 */
export function mergeAnimations(base, src, clips, { inPlace = [] } = {}) {
  const notes = [], names = nodeIndexByName(base.json);
  const ratio = (() => { const a = spineLength(base.json), b = spineLength(src.json); return a && b ? a / b : 1; })();
  if (Math.abs(ratio - 1) > 0.01) notes.push(`source skeleton is x${(1 / ratio).toFixed(2)} the size: translations rescaled by ${ratio.toFixed(4)}`);
  const hips = base.json.nodes.find((n) => /Hips$/.test(n.name ?? ""));
  const rest = hips?.translation ?? [0, 0, 0];
  const up = rest.map(Math.abs).indexOf(Math.max(...rest.map(Math.abs)));   // the vertical axis of the hips' parent space
  const chunks = [], json = base.json;
  let offset = base.bin.length + pad4(base.bin.length);
  const baseBin = Buffer.concat([base.bin, Buffer.alloc(pad4(base.bin.length))]);
  json.bufferViews ??= []; json.accessors ??= []; json.animations ??= [];

  const addData = (data, a, edit) => {
    let buf = data;
    if (edit) edit(buf);
    chunks.push(buf, Buffer.alloc(pad4(buf.length)));
    json.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length });
    offset += buf.length + pad4(buf.length);
    const acc = { bufferView: json.bufferViews.length - 1, componentType: a.componentType, count: a.count, type: a.type };
    if (a.normalized) acc.normalized = true;
    json.accessors.push(acc);
    return { index: json.accessors.length - 1, acc };
  };
  const minMax = (acc, data) => {
    if (acc.componentType !== 5126) return;
    const f = new Float32Array(data.buffer, data.byteOffset, data.length / 4), n = COMPONENTS[acc.type];
    acc.min = Array(n).fill(Infinity); acc.max = Array(n).fill(-Infinity);
    for (let i = 0; i < f.length; i++) { acc.min[i % n] = Math.min(acc.min[i % n], f[i]); acc.max[i % n] = Math.max(acc.max[i % n], f[i]); }
  };

  for (const { name, srcIndex } of clips) {
    const anim = src.json.animations?.[srcIndex];
    if (!anim) throw new Error(`no animation #${srcIndex} in the source file`);
    if (json.animations.some((a) => a.name === name)) throw new Error(`the model already has an animation called "${name}" (use --drop-existing or another name)`);
    const samplers = [], samplerMap = new Map(), channels = [];
    let skipped = 0;
    const cache = new Map();
    const copy = (idx, edit, key) => {
      const k = key + ":" + idx;
      if (cache.has(k)) return cache.get(k);
      const { a, data } = readAccessor(src.json, src.bin, idx);
      const { index, acc } = addData(data, a, edit);
      minMax(acc, data);
      cache.set(k, index);
      return index;
    };
    for (const ch of anim.channels) {
      const boneName = src.json.nodes[ch.target.node]?.name;
      const dst = names.get(boneName);
      if (dst === undefined) { skipped++; continue; }
      const s = anim.samplers[ch.sampler], isHips = /Hips$/.test(boneName ?? "");
      const sk = `${ch.sampler}:${ch.target.path}:${isHips}`;
      if (!samplerMap.has(sk)) {
        let edit = null;
        if (ch.target.path === "translation") {
          const freeze = inPlace.includes(name) && isHips;
          edit = (buf) => {
            const f = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
            for (let i = 0; i < f.length; i++) f[i] *= ratio;
            if (freeze) for (let i = 3; i < f.length; i += 3) for (let c = 0; c < 3; c++) if (c !== up) f[i + c] = f[c];
          };
        }
        const input = copy(s.input, null, "t");
        const output = copy(s.output, edit, `v${ch.target.path}${isHips}${inPlace.includes(name)}${name}`);
        samplers.push({ input, output, interpolation: s.interpolation ?? "LINEAR" });
        samplerMap.set(sk, samplers.length - 1);
      }
      channels.push({ sampler: samplerMap.get(sk), target: { node: dst, path: ch.target.path } });
    }
    if (!channels.length) throw new Error(`"${name}": none of its bones exist in the model (different rig?)`);
    json.animations.push({ name, samplers, channels });
    notes.push(`added "${name}": ${animationDuration(json, json.animations.at(-1)).toFixed(2)} s, ${channels.length} channels` + (skipped ? `, ${skipped} channels skipped (bone not in model)` : "") + (inPlace.includes(name) ? ", in place" : ""));
  }
  json.buffers[0].byteLength = offset;
  return { bin: Buffer.concat([baseBin, ...chunks]), notes };
}

/* ---------------- command line ---------------- */
const arg = (args, name) => { const i = args.findIndex((a) => a === name || a.startsWith(name + "=")); if (i < 0) return undefined; return args[i].includes("=") ? args[i].split("=").slice(1).join("=") : args[i + 1]; };
const list = (v) => (v ? String(v).split(",").map((s) => s.trim()).filter(Boolean) : []);

function load(file) {
  if (!existsSync(file)) throw new Error(`file not found: ${file}`);
  return parseGlb(readFileSync(file));
}

function save(file, json, bin) {
  const problems = validateGlb(json, bin);
  if (problems.length) throw new Error("the result is not a valid GLB:\n  " + problems.slice(0, 8).join("\n  "));
  mkdirSync(resolve(file, ".."), { recursive: true });
  const out = buildGlb(json, bin);
  writeFileSync(file, out);
  console.log(`ok ${file} (${(out.length / 1048576).toFixed(2)} MB)`);
}

function main(argv) {
  const [cmd, ...rest] = argv;
  const files = rest.filter((a, i) => !a.startsWith("--") && !(i > 0 && /^--(height|tint|in-place|drop-animations)$/.test(rest[i - 1])));
  switch (cmd) {
    case "inspect": {
      if (!files[0]) throw new Error("usage: inspect model.glb [--bones]");
      const { json, bin } = load(files[0]);
      console.log(inspect(json, bin, { bones: rest.includes("--bones") }).join("\n"));
      const p = validateGlb(json, bin);
      console.log(p.length ? `PROBLEMS:\n  ${p.join("\n  ")}` : "structure: ok");
      return;
    }
    case "edit": {
      const [input, output] = files;
      if (!input || !output) throw new Error("usage: edit model.glb out.glb [--height M] [--tint #hex] [--drop-animations=A,B]");
      if (resolve(input) === resolve(output)) throw new Error("the output must be a different file");
      const { json, bin } = load(input);
      const h = arg(rest, "--height");
      for (const n of editModel(json, { height: h === undefined ? undefined : Number(h), tint: arg(rest, "--tint"), drop: list(arg(rest, "--drop-animations")) })) console.log("  " + n);
      return save(output, json, bin);
    }
    case "merge": {
      const [input, output, ...specs] = files;
      const pairs = specs.filter((s) => s.includes("="));
      if (!input || !output || !pairs.length) throw new Error("usage: merge base.glb out.glb name=file.glb [name=file.glb ...] [--in-place=name,...] [--drop-existing]");
      if (resolve(input) === resolve(output)) throw new Error("the output must be a different file");
      const base = load(input);
      if (rest.includes("--drop-existing")) dropAnimations(base.json, (base.json.animations ?? []).map((a) => a.name));
      let result = { bin: base.bin, notes: [] };
      const inPlace = list(arg(rest, "--in-place"));
      for (const spec of pairs) {
        const [name, ...f] = spec.split("="), file = f.join("=");
        const src = load(file);
        const r = mergeAnimations({ json: base.json, bin: result.bin }, src, (src.json.animations ?? []).map((a, i) => ({ name: (src.json.animations.length > 1 ? `${name}_${a.name ?? i}` : name), srcIndex: i })), { inPlace });
        result = { bin: r.bin, notes: [...result.notes, ...r.notes] };
      }
      for (const n of result.notes) console.log("  " + n);
      return save(output, base.json, result.bin);
    }
    case "variants": {
      const [input, outdir] = files;
      if (!input || !outdir) throw new Error("usage: variants base.glb outdir");
      const sizes = [["small_adult", 1.45], ["woman", 1.58], ["man", 1.70], ["tall", 1.82], ["very_tall", 1.92]];
      const made = [];
      for (const [id, h] of sizes) {
        const { json, bin } = load(input);
        editModel(json, { height: h });
        const name = `${basename(input, ".glb")}_${id}.glb`;
        save(join(outdir, name), json, bin);
        made.push(name);
      }
      writeFileSync(join(outdir, "list.json"), JSON.stringify({ files: made }, null, 2));   // the viewer reads this
      return;
    }
    default:
      console.log("commands: inspect | edit | merge | variants   (see the top of scripts/glb-rig-tool.mjs)");
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); } catch (e) { console.error("error: " + (e instanceof Error ? e.message : e)); process.exit(1); }
}
