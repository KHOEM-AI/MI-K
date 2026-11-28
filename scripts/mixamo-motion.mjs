// Adds ready-made motion (idle, walk, run, wave, talk) to a Mixamo-rigged human .glb.
// The motion comes from people-motion.mjs (the same clips as the primitive figures) and is converted to the
// model's own bones, so nothing has to be downloaded. No three.js needed.
//
//   node scripts/mixamo-motion.mjs add model.glb out.glb [--clips=idle,walk,run,wave,talk] [--fps=20]
//
// How it works: the model's T-pose arms are first lowered to hang at the sides ("hang pose"). Every clip joint
// rotation is then applied around world axes of that hang pose and converted into each bone's local rotation.
// Feet are kept flat on the floor and the hips are lowered with the legs, so nobody floats or sinks.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseGlb, buildGlb, validateGlb, worldMatrices, readAccessor } from "./glb-rig-tool.mjs";
import { CLIP_NAMES, sampleClip } from "./people-motion.mjs";

/* ---------------- quaternions [x, y, z, w] ---------------- */
const qmul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
const qinv = (q) => [-q[0], -q[1], -q[2], q[3]];
const qnorm = (q) => { const l = Math.hypot(...q) || 1; return q.map((v) => v / l); };
const qaxis = (axis, a) => { const s = Math.sin(a / 2); return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(a / 2)]; };
/** Same order as three.js "XYZ": q = qx * qy * qz. */
const qeuler = (x, y, z) => qmul(qmul(qaxis([1, 0, 0], x), qaxis([0, 1, 0], y)), qaxis([0, 0, 1], z));
const unit = (v) => { const l = Math.hypot(...v) || 1; return v.map((c) => c / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** Smallest rotation that turns direction a into direction b. */
function qarc(a, b) {
  a = unit(a); b = unit(b);
  const d = dot(a, b);
  if (d > 0.999999) return [0, 0, 0, 1];
  if (d < -0.999999) return qaxis([0, 0, 1], Math.PI);
  const c = cross(a, b);
  return qnorm([c[0], c[1], c[2], 1 + d]);
}

/* ---------------- the model's bones ---------------- */
const P = "mixamorig:";
const REQUIRED = ["Hips", "Spine", "Spine1", "Spine2", "Neck", "Head", "LeftArm", "LeftForeArm", "LeftUpLeg", "LeftLeg", "LeftFoot",
  "RightArm", "RightForeArm", "RightUpLeg", "RightLeg", "RightFoot"];

function skeleton(json) {
  const index = {};
  json.nodes.forEach((n, i) => { if (n.name?.startsWith(P)) index[n.name.slice(P.length)] = i; });
  const missing = REQUIRED.filter((n) => index[n] === undefined);
  if (missing.length) throw new Error(`this is not a Mixamo rig, bones missing: ${missing.slice(0, 5).join(", ")}`);
  if (json.nodes.some((n) => n.matrix)) throw new Error("nodes with a matrix are not supported");
  const parent = new Array(json.nodes.length).fill(-1);
  json.nodes.forEach((n, i) => (n.children ?? []).forEach((c) => { parent[c] = i; }));
  return { index, parent };
}

/** Rest-pose world rotation of every node. */
function restRotations(json) {
  const W = new Array(json.nodes.length);
  const walk = (i, pq) => {
    const q = json.nodes[i].rotation ?? [0, 0, 0, 1];
    W[i] = pq ? qmul(pq, q) : q;
    (json.nodes[i].children ?? []).forEach((c) => walk(c, W[i]));
  };
  (json.scenes?.[json.scene ?? 0]?.nodes ?? []).forEach((r) => walk(r, null));
  return W;
}

const subtreeOf = (json, root) => { const s = new Set(), go = (i) => { s.add(i); (json.nodes[i].children ?? []).forEach(go); }; go(root); return s; };

const pos = (M, i) => [M[i][12], M[i][13], M[i][14]];

/** Everything the clips need to know about this particular model. */
export function analyse(json) {
  const { index, parent } = skeleton(json);
  const M = worldMatrices(json), Wrot = restRotations(json);
  const p = (n) => pos(M, index[n]);
  if (!(p("LeftUpLeg")[0] > p("RightUpLeg")[0])) throw new Error("expected the character's left side on +X (facing +Z)");
  const toe = index.LeftToeBase ?? index.LeftToe_End;
  if (toe !== undefined && !(pos(M, toe)[2] > p("LeftFoot")[2])) throw new Error("expected the character to face +Z");

  // hang pose: lower both T-pose arms (and everything below them) to hang at the sides
  const H = Wrot.slice();
  for (const [side, sx] of [["Left", 1], ["Right", -1]]) {
    const arm = index[side + "Arm"], dir = p(side + "ForeArm").map((v, k) => v - p(side + "Arm")[k]);
    const q0 = qarc(dir, [sx * 0.06, -1, 0]);
    for (const i of subtreeOf(json, arm)) H[i] = qmul(q0, Wrot[i]);
  }
  const ground = Math.min(...(json.skins?.[0]?.joints ?? Object.values(index)).map((j) => M[j][13]));
  const len = (a, b) => Math.hypot(...p(a).map((v, k) => v - p(b)[k]));
  const thigh = len("LeftUpLeg", "LeftLeg"), shank = len("LeftLeg", "LeftFoot"), ankle = p("LeftFoot")[1] - ground;
  const hipsParent = parent[index.Hips];
  return { index, parent, M, H, thigh, shank, ankle, hipsParent };
}

/* ---------------- clip -> bone tracks ---------------- */
const inv3 = (m) => {   // inverse of the upper-left 3x3 of a column-major 4x4, returned row by row
  const [a, d, g, b, e, h, c, f, i] = [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]];
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
  return [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, C / det, -(a * h - b * g) / det, (a * e - b * d) / det];
};

function tracksFor(json, info, clip) {
  const { index, parent, M, H, thigh, shank, ankle, hipsParent } = info;
  const keys = clip.times.length;
  const d = (j, k) => clip.joints[j][k];
  const out = [];   // { node, path, values: number[] }
  const rot = (bone, perKey) => {
    const node = index[bone], values = [];
    let prev = null;
    for (let k = 0; k < keys; k++) {
      const [x, y, z] = perKey(k);
      const R = qeuler(x, y, z);
      let q = qnorm(qmul(qmul(qinv(H[parent[node]]), R), H[node]));      // local = inverse(parent hang) * R * own hang
      if (prev && prev[0] * q[0] + prev[1] * q[1] + prev[2] * q[2] + prev[3] * q[3] < 0) q = q.map((v) => -v);
      prev = q;
      values.push(...q);
    }
    out.push({ node, path: "rotation", values });
  };
  const share = (bone, joint, f) => rot(bone, (k) => d(joint, k).map((v) => v * f));
  share("Hips", "Hips", 1);
  for (const s of ["Spine", "Spine1", "Spine2"]) share(s, "Spine", 1 / 3);
  share("Neck", "Head", 0.4); share("Head", "Head", 0.6);
  for (const [S, L] of [["Left", "L"], ["Right", "R"]]) {
    share(`${S}Arm`, `Arm${L}`, 1); share(`${S}ForeArm`, `Elbow${L}`, 1);
    share(`${S}UpLeg`, `Leg${L}`, 1); share(`${S}Leg`, `Knee${L}`, 1);
    rot(`${S}Foot`, (k) => [-(d(`Leg${L}`, k)[0] + d(`Knee${L}`, k)[0]), 0, 0]);   // the foot stays flat
  }
  // hips go down with the legs so the lowest foot always touches the floor
  const depth = (th, ka) => thigh * Math.cos(th) + shank * Math.cos(th + ka) + ankle;
  const rest0 = depth(0, 0), lin = inv3(M[hipsParent]), t0 = json.nodes[index.Hips].translation ?? [0, 0, 0];
  const values = [];
  for (let k = 0; k < keys; k++) {
    const dy = Math.max(depth(d("LegL", k)[0], d("KneeL", k)[0]), depth(d("LegR", k)[0], d("KneeR", k)[0])) - rest0;
    values.push(t0[0] + lin[1] * dy, t0[1] + lin[4] * dy, t0[2] + lin[7] * dy);   // the world "up" vector (0, dy, 0) in the parent's space
  }
  out.push({ node: index.Hips, path: "translation", values });
  return out;
}

/* ---------------- writing the animations into the file ---------------- */
const pad4 = (n) => (4 - (n % 4)) % 4;

/**
 * Adds the clips to { json, bin } and returns the new bin. Throws when a clip name already exists.
 */
export function addClips({ json, bin }, names = CLIP_NAMES, { fps = 20 } = {}) {
  const info = analyse(json);
  json.bufferViews ??= []; json.accessors ??= []; json.animations ??= [];
  const chunks = [], base = Buffer.concat([bin, Buffer.alloc(pad4(bin.length))]);
  let offset = base.length;
  const add = (floats, type, minmax) => {
    const buf = Buffer.from(new Float32Array(floats).buffer);
    chunks.push(buf);
    json.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length });
    offset += buf.length;
    const n = { SCALAR: 1, VEC3: 3, VEC4: 4 }[type];
    const acc = { bufferView: json.bufferViews.length - 1, componentType: 5126, count: floats.length / n, type };
    if (minmax) {
      acc.min = Array(n).fill(Infinity); acc.max = Array(n).fill(-Infinity);
      floats.forEach((v, i) => { acc.min[i % n] = Math.min(acc.min[i % n], v); acc.max[i % n] = Math.max(acc.max[i % n], v); });
    }
    json.accessors.push(acc);
    return json.accessors.length - 1;
  };
  const notes = [];
  for (const name of names) {
    if (json.animations.some((a) => a.name === name)) throw new Error(`the model already has an animation called "${name}"`);
    const clip = sampleClip(name, fps), samplers = [], channels = [];
    const time = add(clip.times, "SCALAR", true);
    for (const t of tracksFor(json, info, clip)) {
      samplers.push({ input: time, output: add(t.values, t.path === "rotation" ? "VEC4" : "VEC3", true), interpolation: "LINEAR" });
      channels.push({ sampler: samplers.length - 1, target: { node: t.node, path: t.path } });
    }
    json.animations.push({ name, samplers, channels });
    notes.push(`added "${name}": ${clip.duration} s, ${channels.length} channels`);
  }
  json.buffers[0].byteLength = offset;
  return { bin: Buffer.concat([base, ...chunks]), notes };
}


/**
 * Where every Mixamo bone is (world metres) at key number `key` of an animation, computed straight from the file's
 * own keyframes. Used by the tests, and handy to check a motion without a 3D viewer.
 */
export function poseAtKey(json, bin, animationName, key) {
  const anim = json.animations?.find((a) => a.name === animationName);
  if (!anim) throw new Error(`no animation called "${animationName}"`);
  const nodes = json.nodes.map((n) => ({ ...n }));
  for (const ch of anim.channels) {
    const { a, data } = readAccessor(json, bin, anim.samplers[ch.sampler].output);
    const per = a.type === "VEC4" ? 4 : 3, f = new Float32Array(data.buffer, data.byteOffset, data.length / 4);
    const k = Math.min(key, a.count - 1);
    nodes[ch.target.node][ch.target.path] = Array.from(f.slice(k * per, k * per + per));
  }
  const M = worldMatrices({ ...json, nodes }), out = {};
  nodes.forEach((n, i) => { if (n.name?.startsWith(P) && M[i]) out[n.name.slice(P.length)] = [M[i][12], M[i][13], M[i][14]]; });
  return out;
}

/* ---------------- command line ---------------- */
function main(argv) {
  const [cmd, input, output, ...rest] = argv;
  if (cmd !== "add" || !input || !output) {
    console.log("usage: node scripts/mixamo-motion.mjs add model.glb out.glb [--clips=idle,walk,run,wave,talk] [--fps=20]");
    return;
  }
  if (resolve(input) === resolve(output)) throw new Error("the output must be a different file");
  const opt = (n) => rest.find((a) => a.startsWith(n + "="))?.split("=")[1];
  const names = opt("--clips") ? opt("--clips").split(",") : CLIP_NAMES;
  const model = parseGlb(readFileSync(input));
  const r = addClips(model, names, { fps: Number(opt("--fps") ?? 20) });
  const problems = validateGlb(model.json, r.bin);
  if (problems.length) throw new Error("the result is not a valid GLB:\n  " + problems.slice(0, 6).join("\n  "));
  mkdirSync(resolve(output, ".."), { recursive: true });
  writeFileSync(output, buildGlb(model.json, r.bin));
  r.notes.forEach((n) => console.log("  " + n));
  console.log(`ok ${output}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); } catch (e) { console.error("error: " + (e instanceof Error ? e.message : e)); process.exit(1); }
}
