#!/usr/bin/env node
// KHOEM-AI make-animals.mjs  (no dependencies, plain Node)
// Builds smooth GLB models for: tiger, dog, snake, bird, cow.
// It never touches elephant or fish.
//
// Usage (from ~/MI-K-VISION-3D):
//   node scripts/make-animals.mjs                 -> writes public/models/animals/{tiger,dog,snake,bird,cow}.glb
//   node scripts/make-animals.mjs --out some/dir  -> writes into another folder
//   node scripts/make-animals.mjs tiger dog       -> only those animals
//   node scripts/make-animals.mjs cow             -> only the cow
// An existing file is saved once into ~/animals-backup/<name>.glb before it is replaced
// (outside the git folder, so git status stays clean).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ---------- small vector helpers ----------
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// lower = lighter files (fewer triangles); 0.7 keeps the models smooth but light for the village scene
const QUALITY = 0.7;
const toLinear = (c) => c.map((v) => Math.pow(v, 2.2));

// rotation (Z, then X, then Y), returns the three local axes
const rotVec = (v, ax, ay, az) => {
  let [x, y, z] = v;
  [x, y] = [x * Math.cos(az) - y * Math.sin(az), x * Math.sin(az) + y * Math.cos(az)];
  [y, z] = [y * Math.cos(ax) - z * Math.sin(ax), y * Math.sin(ax) + z * Math.cos(ax)];
  [x, z] = [x * Math.cos(ay) + z * Math.sin(ay), -x * Math.sin(ay) + z * Math.cos(ay)];
  return [x, y, z];
};
const eul = (ax = 0, ay = 0, az = 0) => [rotVec([1, 0, 0], ax, ay, az), rotVec([0, 1, 0], ax, ay, az), rotVec([0, 0, 1], ax, ay, az)];

// ---------- mesh accumulator ----------
class Model {
  constructor() { this.g = { body: { P: [], N: [], C: [], I: [] }, eye: { P: [], N: [], C: [], I: [] } }; }
  emit(group, verts, idx) {
    const g = this.g[group], base = g.P.length / 3;
    for (const v of verts) { g.P.push(...v.p); g.N.push(...norm(v.n)); g.C.push(...toLinear(v.c)); }
    for (const i of idx) g.I.push(base + i);
  }
}

// ellipsoid. axes = [ex, ey, ez] must be right-handed (ex x ey = ez).
function ellipsoid(m, { c, r, axes = eul(), col, seg = 28, rings = 18, group = "body" }) {
  seg = Math.max(10, Math.round(seg * QUALITY)); rings = Math.max(7, Math.round(rings * QUALITY));
  const [ex, ey, ez] = axes, verts = [], idx = [];
  for (let i = 0; i <= rings; i++) {
    const ph = (i / rings) * Math.PI;
    for (let j = 0; j < seg; j++) {
      const th = (j / seg) * Math.PI * 2;
      const lx = r[0] * Math.sin(ph) * Math.cos(th), ly = r[1] * Math.cos(ph), lz = r[2] * Math.sin(ph) * Math.sin(th);
      const p = add(c, add(mul(ex, lx), add(mul(ey, ly), mul(ez, lz))));
      const n = add(mul(ex, lx / (r[0] * r[0])), add(mul(ey, ly / (r[1] * r[1])), mul(ez, lz / (r[2] * r[2]))));
      const nn = norm(n);
      verts.push({ p, n: nn, c: typeof col === "function" ? col({ p, n: nn }) : col });
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const j2 = (j + 1) % seg;
    const a = i * seg + j, b = i * seg + j2, cc = (i + 1) * seg + j, d = (i + 1) * seg + j2;
    idx.push(a, b, cc, b, d, cc);
  }
  m.emit(group, verts, idx);
}

// ---------- splines ----------
function cr(p0, p1, p2, p3, f) {
  const f2 = f * f, f3 = f2 * f;
  return 0.5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f2 + (-p0 + 3 * p1 - 3 * p2 + p3) * f3);
}
function crd(p0, p1, p2, p3, f) {
  return 0.5 * ((-p0 + p2) + 2 * (2 * p0 - 5 * p1 + 4 * p2 - p3) * f + 3 * (-p0 + 3 * p1 - 3 * p2 + p3) * f * f);
}
function evalSpline(vals, t, deriv = false) {
  const n = vals.length - 1, k = Math.min(n - 1, Math.floor(t)), f = t - k;
  const g = (i) => vals[Math.max(0, Math.min(n, i))];
  const fn = deriv ? crd : cr;
  return fn(g(k - 1), g(k), g(k + 1), g(k + 2), f);
}
const evalVec = (pts, t, d) => [0, 1, 2].map((a) => evalSpline(pts.map((p) => p[a]), t, d));

// generalized tube: path control points, radii [rx (width), ry (height)] per control point
// up: optional fixed "up" axis for the tube frame (stops a thin vertical leg from twisting where the path bends)
function sweep(m, { path, rad, col, steps = 36, seg = 24, capStart = true, capEnd = true, capScale = 1, group = "body", up = null }) {
  steps = Math.max(8, Math.round(steps * QUALITY)); seg = Math.max(8, Math.round(seg * QUALITY));
  const nCtl = path.length - 1, rings = [];
  const frame = (T) => {
    let U = up || [0, 1, 0];
    if (!up && Math.abs(dot(U, T)) > 0.97) U = [0, 0, 1];
    const S = norm(cross(U, T)), N = cross(T, S);
    return { S, N };
  };
  const sample = (t) => {
    const P = evalVec(path, t), T = norm(evalVec(path, t, true));
    const rx = evalSpline(rad.map((r) => r[0]), t), ry = evalSpline(rad.map((r) => r[1]), t);
    return { P, T, rx: Math.max(rx, 0.002), ry: Math.max(ry, 0.002), s: t / nCtl, ...frame(T) };
  };
  const body = [];
  for (let i = 0; i <= steps; i++) body.push(sample((i / steps) * nCtl));
  // taper (change of mean radius per unit length), used to tilt normals
  const taper = body.map((b, i) => {
    const a = body[Math.max(0, i - 1)], c = body[Math.min(steps, i + 1)];
    const dl = len(sub(c.P, a.P)) || 1;
    return ((c.rx + c.ry) - (a.rx + a.ry)) / 2 / dl;
  });
  const CAP = 7;
  if (capStart) {
    const b = body[0], cl = ((b.rx + b.ry) / 2) * capScale;
    for (let u = CAP; u >= 1; u--) {
      const a = (u / CAP) * (Math.PI / 2);
      rings.push({ ...b, P: sub(b.P, mul(b.T, cl * Math.sin(a))), k: Math.cos(a), ax: -Math.sin(a), cap: true });
    }
  }
  body.forEach((b, i) => rings.push({ ...b, k: 1, ax: -taper[i], cap: false }));
  if (capEnd) {
    const b = body[steps], cl = ((b.rx + b.ry) / 2) * capScale;
    for (let u = 1; u <= CAP; u++) {
      const a = (u / CAP) * (Math.PI / 2);
      rings.push({ ...b, P: add(b.P, mul(b.T, cl * Math.sin(a))), k: Math.cos(a), ax: Math.sin(a), cap: true });
    }
  }
  const verts = [], idx = [];
  for (const R of rings) {
    for (let j = 0; j < seg; j++) {
      const th = (j / seg) * Math.PI * 2, ct = Math.cos(th), st = Math.sin(th);
      const k = Math.max(R.k, 0.0005);
      const p = add(R.P, add(mul(R.S, R.rx * ct * k), mul(R.N, R.ry * st * k)));
      const dir = norm(add(mul(R.S, ct / R.rx), mul(R.N, st / R.ry)));
      const n = R.cap ? norm(add(mul(dir, Math.sqrt(Math.max(0, 1 - R.ax * R.ax))), mul(R.T, R.ax))) : norm(add(dir, mul(R.T, R.ax)));
      verts.push({ p, n, c: typeof col === "function" ? col({ p, n, s: R.s, th, sinTh: st, ring: R }) : col });
    }
  }
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < seg; j++) {
    const j2 = (j + 1) % seg;
    const a = i * seg + j, b = i * seg + j2, cc = (i + 1) * seg + j, d = (i + 1) * seg + j2;
    idx.push(a, b, cc, b, d, cc);
  }
  m.emit(group, verts, idx);
}

const eyeBall = (m, c, r, col, axes) => ellipsoid(m, { c, r, col, axes, seg: 20, rings: 12, group: "eye" });

// =====================================================================
// TIGER
// =====================================================================
function makeTiger() {
  const m = new Model();
  const ORANGE = [0.93, 0.5, 0.12], CREAM = [0.98, 0.91, 0.76], DARK = [0.07, 0.045, 0.03];
  const body = ({ p, n }) => {
    const belly = smooth(0.1, -0.5, n[1]);
    const base = mix(ORANGE, CREAM, belly);
    const u = p[2] * 13 + 0.9 * Math.sin(p[1] * 7 + p[0] * 2.2);
    const st = Math.abs(Math.sin(u));
    const mask = 1 - smooth(0.2, 0.34, st);
    return mix(base, DARK, mask * (1 - belly) * 0.95);
  };
  const legCol = ({ p, n }) => {
    const belly = smooth(0.2, -0.5, n[1]) * 0.4;
    const base = mix(ORANGE, CREAM, belly + smooth(0.16, 0.05, p[1]) * 0.6);
    const st = Math.abs(Math.sin(p[1] * 18 + p[0] * 3));
    const mask = (1 - smooth(0.22, 0.36, st)) * smooth(0.1, 0.25, p[1]);
    return mix(base, DARK, mask * 0.9);
  };
  const tailCol = ({ s }) => {
    const st = Math.abs(Math.sin(s * 36));
    const mask = 1 - smooth(0.3, 0.5, st);
    const c = mix(ORANGE, DARK, mask);
    return mix(c, DARK, smooth(0.9, 0.96, s));
  };
  // torso + neck + head
  sweep(m, { path: [[0, 0.64, -0.62], [0, 0.66, -0.3], [0, 0.68, 0.1], [0, 0.68, 0.42]], rad: [[0.17, 0.19], [0.21, 0.23], [0.22, 0.25], [0.2, 0.24]], col: body, steps: 44 });
  sweep(m, { path: [[0, 0.7, 0.32], [0, 0.78, 0.5], [0, 0.83, 0.62]], rad: [[0.19, 0.22], [0.16, 0.17], [0.15, 0.15]], col: body, capEnd: false, steps: 12 });
  ellipsoid(m, { c: [0, 0.84, 0.68], r: [0.195, 0.172, 0.19], col: body });
  ellipsoid(m, { c: [0, 0.785, 0.835], r: [0.11, 0.082, 0.09], col: CREAM });
  ellipsoid(m, { c: [0, 0.812, 0.918], r: [0.04, 0.028, 0.022], col: [0.4, 0.13, 0.13], seg: 16, rings: 10 });
  for (const sx of [-1, 1]) {
    ellipsoid(m, { c: [sx * 0.115, 0.775, 0.78], r: [0.065, 0.058, 0.074], col: CREAM });
    // ears
    ellipsoid(m, { c: [sx * 0.125, 0.99, 0.64], r: [0.062, 0.066, 0.03], axes: eul(-0.25, sx * 0.25, sx * -0.35), col: ({ n }) => (n[2] > 0.8 ? [0.95, 0.72, 0.65] : mix(DARK, ORANGE, smooth(-0.1, 0.5, n[2]))), seg: 20, rings: 12 });
    // eyes
    eyeBall(m, [sx * 0.092, 0.885, 0.825], [0.034, 0.032, 0.022], [0.9, 0.8, 0.15]);
    eyeBall(m, [sx * 0.092, 0.885, 0.842], [0.012, 0.023, 0.012], [0.02, 0.02, 0.02]);
    // brow stripe
    ellipsoid(m, { c: [sx * 0.095, 0.93, 0.815], r: [0.05, 0.011, 0.022], axes: eul(0, 0, sx * 0.25), col: DARK, seg: 12, rings: 8 });
    // front leg
    sweep(m, { path: [[sx * 0.16, 0.62, 0.36], [sx * 0.155, 0.33, 0.38], [sx * 0.15, 0.07, 0.4]], rad: [[0.095, 0.1], [0.066, 0.07], [0.06, 0.06]], col: legCol, steps: 18, capEnd: true, capScale: 0.6 });
    ellipsoid(m, { c: [sx * 0.15, 0.045, 0.43], r: [0.066, 0.046, 0.097], col: ({ p }) => mix(CREAM, ORANGE, 0.35) });
    // hind leg
    sweep(m, { path: [[sx * 0.18, 0.7, -0.45], [sx * 0.2, 0.45, -0.38], [sx * 0.17, 0.22, -0.5], [sx * 0.16, 0.07, -0.45]], rad: [[0.15, 0.17], [0.11, 0.115], [0.062, 0.068], [0.058, 0.058]], col: legCol, steps: 24, capEnd: true, capScale: 0.6 });
    ellipsoid(m, { c: [sx * 0.16, 0.045, -0.42], r: [0.066, 0.046, 0.097], col: mix(CREAM, ORANGE, 0.35) });
  }
  sweep(m, { path: [[0, 0.66, -0.7], [0, 0.55, -0.95], [0, 0.5, -1.2], [0, 0.72, -1.38], [0, 0.95, -1.38]], rad: [[0.06, 0.06], [0.052, 0.052], [0.046, 0.046], [0.04, 0.04], [0.036, 0.036]], col: tailCol, steps: 40 });
  return m;
}

// =====================================================================
// DOG
// =====================================================================
function makeDog() {
  const m = new Model();
  const TAN = [0.78, 0.5, 0.22], LIGHT = [0.95, 0.84, 0.66], BROWN = [0.42, 0.24, 0.1], BLACK = [0.04, 0.03, 0.03];
  const furCol = ({ p, n }) => {
    const under = smooth(0.15, -0.55, n[1]);
    const back = smooth(0.2, 0.9, n[1]);
    let c = mix(TAN, mix(TAN, BROWN, 0.45), back * 0.7);
    const chest = smooth(0.15, 0.6, p[2]) * smooth(0.35, -0.2, n[1] - 0.2);
    c = mix(c, LIGHT, Math.max(under, chest * 0.7));
    return c;
  };
  const legCol = ({ p }) => mix(mix(TAN, BROWN, 0.2), LIGHT, smooth(0.18, 0.05, p[1]));
  sweep(m, { path: [[0, 0.55, -0.4], [0, 0.57, -0.1], [0, 0.57, 0.2], [0, 0.58, 0.38]], rad: [[0.14, 0.16], [0.17, 0.19], [0.18, 0.2], [0.17, 0.2]], col: furCol, steps: 40 });
  sweep(m, { path: [[0, 0.62, 0.3], [0, 0.74, 0.42], [0, 0.8, 0.5]], rad: [[0.14, 0.16], [0.1, 0.12], [0.095, 0.1]], col: furCol, capEnd: false, steps: 12 });
  ellipsoid(m, { c: [0, 0.85, 0.55], r: [0.13, 0.122, 0.14], col: furCol });
  ellipsoid(m, { c: [0, 0.785, 0.7], r: [0.062, 0.056, 0.092], col: mix(TAN, LIGHT, 0.45) });
  ellipsoid(m, { c: [0, 0.745, 0.69], r: [0.05, 0.03, 0.075], col: LIGHT });
  ellipsoid(m, { c: [0, 0.8, 0.79], r: [0.042, 0.032, 0.028], col: BLACK, seg: 18, rings: 12 });
  for (const sx of [-1, 1]) {
    // floppy ears
    ellipsoid(m, { c: [sx * 0.128, 0.82, 0.5], r: [0.028, 0.105, 0.068], axes: eul(0.1, 0, sx * 0.3), col: ({ n }) => mix(BROWN, TAN, smooth(-0.2, 0.8, n[1]) * 0.25), seg: 20, rings: 14 });
    // eyes
    eyeBall(m, [sx * 0.068, 0.87, 0.665], [0.027, 0.03, 0.021], BLACK);
    eyeBall(m, [sx * 0.062, 0.88, 0.682], [0.008, 0.008, 0.006], [1, 1, 1]);
    ellipsoid(m, { c: [sx * 0.072, 0.912, 0.655], r: [0.03, 0.01, 0.02], axes: eul(0, 0, sx * -0.25), col: mix(TAN, BROWN, 0.5), seg: 12, rings: 8 });
    // legs
    sweep(m, { path: [[sx * 0.115, 0.52, 0.28], [sx * 0.11, 0.28, 0.3], [sx * 0.105, 0.06, 0.3]], rad: [[0.07, 0.08], [0.052, 0.056], [0.046, 0.046]], col: legCol, steps: 16, capScale: 0.6 });
    ellipsoid(m, { c: [sx * 0.105, 0.035, 0.325], r: [0.05, 0.036, 0.075], col: LIGHT });
    sweep(m, { path: [[sx * 0.125, 0.56, -0.3], [sx * 0.15, 0.38, -0.26], [sx * 0.12, 0.2, -0.34], [sx * 0.11, 0.06, -0.3]], rad: [[0.1, 0.12], [0.07, 0.08], [0.046, 0.05], [0.042, 0.042]], col: legCol, steps: 22, capScale: 0.6 });
    ellipsoid(m, { c: [sx * 0.11, 0.035, -0.275], r: [0.05, 0.036, 0.075], col: LIGHT });
  }
  sweep(m, { path: [[0, 0.6, -0.42], [0, 0.72, -0.55], [0, 0.9, -0.58], [0, 1.0, -0.5]], rad: [[0.046, 0.046], [0.042, 0.042], [0.036, 0.036], [0.03, 0.03]], col: ({ s }) => mix(TAN, LIGHT, smooth(0.6, 1, s)), steps: 24 });
  return m;
}

// =====================================================================
// SNAKE
// =====================================================================
function makeSnake() {
  const m = new Model();
  const BASE = [0.3, 0.62, 0.18], DARKG = [0.08, 0.27, 0.1], BELLY = [0.92, 0.86, 0.5], PALE = [0.7, 0.86, 0.38];
  const radius = (t) => {
    const grow = smooth(0, 0.45, t), neck = smooth(0.78, 0.96, t);
    return 0.012 + 0.095 * grow - 0.022 * neck;
  };
  const N = 18, path = [], rad = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const fade = 1 - smooth(0.72, 0.98, t);
    const x = 0.5 * Math.sin(t * Math.PI * 2.6 + 0.4) * fade * smooth(0, 0.12, t + 0.05);
    const z = -1.1 + 1.9 * t;
    const r = radius(t);
    const lift = 0.3 * smooth(0.84, 1, t);
    path.push([x, r + lift, z - 0.05 * lift]);
    rad.push([r, r]);
  }
  const snakeCol = ({ s, sinTh }) => {
    const belly = smooth(-0.15, -0.6, sinTh);
    const top = smooth(0.4, 0.8, sinTh);
    const band = smooth(0.15, 0.5, Math.sin(s * 74));
    let c = mix(BASE, DARKG, top * band);
    const side = smooth(0.75, 0.92, Math.sin(s * 74 + Math.PI)) * (1 - top) * (1 - belly);
    c = mix(c, PALE, side * 0.8);
    return mix(c, BELLY, belly);
  };
  sweep(m, { path, rad, col: snakeCol, steps: 160, seg: 22, capStart: true, capEnd: true, capScale: 1.6 });
  // head, oriented along the final tangent
  const T = norm(evalVec(path, N, true)), P = path[N];
  let S = norm(cross([0, 1, 0], T)), Nn = cross(T, S);
  const axes = [S, Nn, T];
  ellipsoid(m, { c: add(P, mul(T, 0.03)), r: [0.092, 0.058, 0.14], axes, col: ({ n }) => mix(BASE, BELLY, smooth(-0.1, -0.7, dot(n, Nn))) , seg: 28, rings: 18 });
  for (const sx of [-1, 1]) {
    const ec = add(add(P, mul(T, 0.07)), add(mul(S, sx * 0.07), mul(Nn, 0.028)));
    eyeBall(m, ec, [0.022, 0.024, 0.024], [0.95, 0.8, 0.1], axes);
    eyeBall(m, add(ec, mul(S, sx * 0.014)), [0.007, 0.023, 0.008], [0.02, 0.02, 0.02], axes);
    // nostril dots
    ellipsoid(m, { c: add(add(P, mul(T, 0.165)), add(mul(S, sx * 0.025), mul(Nn, 0.02))), r: [0.007, 0.007, 0.007], col: DARKG, seg: 8, rings: 6 });
  }
  // forked tongue
  const tb = add(add(P, mul(T, 0.165)), mul(Nn, -0.015));
  const tm = add(tb, mul(T, 0.09));
  sweep(m, { path: [tb, tm], rad: [[0.007, 0.004], [0.006, 0.003]], col: [0.85, 0.1, 0.12], steps: 4, seg: 8, capStart: false, capEnd: false });
  for (const sx of [-1, 1]) {
    const tip = add(add(tm, mul(T, 0.06)), mul(S, sx * 0.026));
    sweep(m, { path: [tm, tip], rad: [[0.005, 0.003], [0.002, 0.002]], col: [0.85, 0.1, 0.12], steps: 4, seg: 8, capEnd: true, capScale: 0.4 });
  }
  return m;
}

// =====================================================================
// BIRD
// =====================================================================
function makeBird() {
  const m = new Model();
  const BLUE = [0.14, 0.4, 0.86], DBLUE = [0.08, 0.22, 0.6], LBLUE = [0.55, 0.78, 0.98], ORANGE = [0.97, 0.52, 0.18], CREAM = [0.99, 0.9, 0.7], BEAK = [0.98, 0.72, 0.1], LEG = [0.8, 0.5, 0.22];
  const bodyCol = ({ n }) => {
    const under = smooth(0.3, -0.25, n[1]);
    return mix(BLUE, mix(ORANGE, CREAM, smooth(-0.3, -0.9, n[1])), under);
  };
  const tilt = -0.4;
  ellipsoid(m, { c: [0, 0.42, 0], r: [0.19, 0.2, 0.29], axes: eul(tilt), col: bodyCol, seg: 32, rings: 20 });
  ellipsoid(m, { c: [0, 0.7, 0.2], r: [0.137, 0.13, 0.14], col: ({ n }) => mix(BLUE, ORANGE, smooth(0.15, -0.45, n[1])), seg: 28, rings: 18 });
  // beak
  sweep(m, { path: [[0, 0.685, 0.3], [0, 0.668, 0.45]], rad: [[0.055, 0.045], [0.012, 0.012]], col: BEAK, steps: 8, seg: 16, capEnd: true, capScale: 0.5 });
  for (const sx of [-1, 1]) {
    eyeBall(m, [sx * 0.09, 0.732, 0.312], [0.026, 0.028, 0.022], [0.02, 0.02, 0.02]);
    eyeBall(m, [sx * 0.083, 0.744, 0.328], [0.008, 0.008, 0.006], [1, 1, 1]);
    // wing
    ellipsoid(m, { c: [sx * 0.178, 0.5, -0.07], r: [0.03, 0.085, 0.27], axes: eul(tilt, 0, sx * -0.1), col: ({ p, n }) => {
      const bar = smooth(0.55, 0.85, Math.sin(p[2] * 34));
      return mix(DBLUE, LBLUE, bar * 0.8 + smooth(0.4, 0.9, Math.abs(n[0])) * 0.1);
    }, seg: 28, rings: 18 });
    // leg
    sweep(m, { path: [[sx * 0.07, 0.28, 0.0], [sx * 0.07, 0.14, 0.01], [sx * 0.07, 0.02, 0.02]], rad: [[0.02, 0.02], [0.014, 0.014], [0.013, 0.013]], col: LEG, steps: 8, seg: 10, capEnd: false });
    for (const [dx, dz, rz, ang] of [[0, 0.065, 0.05, 0], [-0.025, 0.05, 0.045, -0.35], [0.025, 0.05, 0.045, 0.35], [0, -0.03, 0.03, 0]]) {
      ellipsoid(m, { c: [sx * 0.07 + dx * sx, 0.012, 0.02 + dz], r: [0.011, 0.01, rz], axes: eul(0, ang * (dz < 0 ? 0 : 1), 0), col: LEG, seg: 12, rings: 8 });
    }
  }
  // tail feathers (point backwards and down)
  for (const [ay, col] of [[Math.PI, DBLUE], [Math.PI + 0.2, BLUE], [Math.PI - 0.2, BLUE]]) {
    ellipsoid(m, { c: [Math.sin(ay - Math.PI) * -0.05, 0.31, -0.4], r: [0.056, 0.016, 0.23], axes: eul(0.38, ay, 0), col: ({ p }) => mix(col, LBLUE, smooth(-0.55, -0.62, p[2]) * 0.5), seg: 20, rings: 14 });
  }
  // little crest
  ellipsoid(m, { c: [0, 0.82, 0.16], r: [0.02, 0.05, 0.045], axes: eul(-0.5), col: DBLUE, seg: 12, rings: 8 });
  return m;
}

// =====================================================================
// COW  (Khmer zebu: cream-tan coat, shoulder hump, dewlap, long drooping ears, short horns, lean legs)
// =====================================================================
function makeCow() {
  const m = new Model();
  const BASE = [0.7, 0.58, 0.45], LIGHT = [0.84, 0.76, 0.64], DARK = [0.5, 0.4, 0.31];
  const PINK = [0.62, 0.4, 0.36], HORN = [0.62, 0.55, 0.42], HOOF = [0.09, 0.07, 0.06], NOSE = [0.2, 0.12, 0.11];
  const P = (x, y, z) => [x, y, z];
  // soft mottling so the coat is not flat
  const mott = (p) => 0.5 + 0.5 * Math.sin(p[2] * 5.1 + Math.sin(p[1] * 4.3) * 1.4 + p[0] * 3);
  // lighter belly and inner legs, darker neck / hump / shoulder
  const bodyCol = ({ p, n }) => {
    let c = mix(BASE, LIGHT, smooth(-0.1, -0.85, n[1]) * 0.9);
    c = mix(c, DARK, smooth(0.45, 0.95, p[2]) * 0.55 * smooth(0.2, 0.8, n[1] + 0.4));
    return mix(c, DARK, mott(p) * 0.12);
  };
  const legCol = ({ p }) => mix(mix(BASE, LIGHT, 0.25), DARK, smooth(0.35, 0.05, p[1]) * 0.5);
  const headCol = ({ p, n }) => {
    const muzzle = smooth(1.28, 1.36, p[2]);
    return mix(mix(BASE, DARK, 0.08 + 0.12 * smooth(0.1, 0.9, n[1])), NOSE, muzzle * 0.7);
  };
  const earCol = ({ n }) => mix(mix(BASE, DARK, 0.3), PINK, smooth(0.3, 0.9, Math.abs(n[1])) * 0.6);
  // torso (rump -> chest), neck, shoulder hump and dewlap
  sweep(m, { path: [P(0, 1.0, -0.66), P(0, 0.98, -0.25), P(0, 0.96, 0.2), P(0, 1.0, 0.55), P(0, 1.1, 0.85), P(0, 1.06, 1.1)], rad: [[0.21, 0.26], [0.27, 0.33], [0.28, 0.34], [0.26, 0.33], [0.19, 0.25], [0.14, 0.18]], col: bodyCol, steps: 96, seg: 40 });
  for (const sx of [-1, 1]) ellipsoid(m, { c: P(sx * 0.17, 1.0, 0.42), r: [0.1, 0.2, 0.2], col: bodyCol, seg: 24, rings: 16 }); // shoulder muscle
  ellipsoid(m, { c: P(0, 1.28, 0.36), r: [0.13, 0.19, 0.28], col: bodyCol, seg: 36, rings: 24 });
  ellipsoid(m, { c: P(0, 0.84, 0.72), r: [0.05, 0.12, 0.22], col: bodyCol, seg: 28, rings: 18 });
  // head: long narrow skull + muzzle + nostrils + eyes + ears + horns (nose points forward and down)
  const hc = P(0, 1.02, 1.28), ax = eul(0.55, 0, 0), [ex, ey, ez] = ax;
  const at = (a, b, c) => add(hc, add(mul(ex, a), add(mul(ey, b), mul(ez, c))));
  ellipsoid(m, { c: hc, r: [0.13, 0.15, 0.3], axes: ax, col: headCol, seg: 34, rings: 22 });
  ellipsoid(m, { c: at(0, -0.02, 0.27), r: [0.1, 0.085, 0.13], axes: ax, col: headCol, seg: 26, rings: 16 });
  ellipsoid(m, { c: at(0, -0.04, 0.345), r: [0.088, 0.068, 0.07], axes: ax, col: NOSE, seg: 24, rings: 14 });
  for (const sx of [-1, 1]) {
    ellipsoid(m, { c: at(sx * 0.04, -0.03, 0.4), r: [0.018, 0.015, 0.013], axes: ax, col: [0.02, 0.015, 0.015], seg: 12, rings: 8 });
    eyeBall(m, at(sx * 0.105, 0.05, 0.08), [0.03, 0.032, 0.028], [0.03, 0.02, 0.02], ax);
    eyeBall(m, at(sx * 0.116, 0.06, 0.095), [0.008, 0.008, 0.006], [1, 1, 1], ax);
    // ears: broad, held out sideways and drooping a little
    ellipsoid(m, { c: at(sx * 0.21, 0.07, -0.08), r: [0.13, 0.02, 0.065], axes: eul(0.1, 0, -sx * 0.35), col: earCol, seg: 22, rings: 12 });
    // horns: short, grey-tan, curve out then up, dark tip
    sweep(m, { path: [P(sx * 0.09, 1.2, 1.22), P(sx * 0.17, 1.23, 1.2), P(sx * 0.23, 1.31, 1.17), P(sx * 0.22, 1.4, 1.17)], rad: [[0.034, 0.034], [0.026, 0.026], [0.017, 0.017], [0.005, 0.005]], col: ({ s }) => mix(HORN, DARK, smooth(0.7, 1, s)), steps: 16, seg: 12, up: [0, 0, 1], capScale: 0.5 });
    // front leg and hoof (top starts inside the body)
    sweep(m, { path: [P(sx * 0.15, 0.95, 0.42), P(sx * 0.16, 0.5, 0.44), P(sx * 0.16, 0.12, 0.44)], rad: [[0.11, 0.085], [0.062, 0.055], [0.046, 0.044]], col: legCol, steps: 24, seg: 22, up: [1, 0, 0], capScale: 0.5 });
    ellipsoid(m, { c: P(sx * 0.16, 0.045, 0.465), r: [0.048, 0.046, 0.065], col: HOOF, seg: 16, rings: 10 });
    ellipsoid(m, { c: P(sx * 0.12, 0.96, -0.46), r: [0.11, 0.2, 0.2], col: bodyCol, seg: 26, rings: 16 }); // thigh, blends the leg into the flank
    // hind leg: hock bends backwards, then straight down
    sweep(m, { path: [P(sx * 0.15, 0.95, -0.47), P(sx * 0.17, 0.62, -0.46), P(sx * 0.18, 0.4, -0.6), P(sx * 0.18, 0.1, -0.58)], rad: [[0.15, 0.08], [0.1, 0.075], [0.065, 0.055], [0.046, 0.044]], col: legCol, steps: 32, seg: 22, up: [1, 0, 0], capScale: 0.5 });
    ellipsoid(m, { c: P(sx * 0.18, 0.045, -0.56), r: [0.048, 0.046, 0.065], col: HOOF, seg: 16, rings: 10 });
  }
  // long thin tail with a dark tuft near the hocks
  sweep(m, { path: [P(0, 1.2, -0.68), P(0, 1.02, -0.8), P(0, 0.72, -0.84), P(0, 0.4, -0.82)], rad: [[0.03, 0.03], [0.025, 0.025], [0.02, 0.02], [0.016, 0.016]], col: ({ s }) => mix(BASE, DARK, smooth(0.3, 0.8, s)), steps: 24, seg: 12 });
  ellipsoid(m, { c: P(0, 0.32, -0.82), r: [0.045, 0.1, 0.045], col: DARK, seg: 14, rings: 10 });
  return m;
}

// ---------- GLB writer ----------
function writeGlb(model, name) {
  const bufs = [], views = [], accs = [], prims = [], mats = [];
  const matDefs = { body: { name: "fur", pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.82 } }, eye: { name: "eye", pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.15 } } };
  let off = 0;
  const pushBuf = (arrBuf, target) => {
    const pad = (4 - (arrBuf.length % 4)) % 4;
    const padded = Buffer.concat([arrBuf, Buffer.alloc(pad)]);
    views.push({ buffer: 0, byteOffset: off, byteLength: arrBuf.length, target });
    bufs.push(padded); off += padded.length;
    return views.length - 1;
  };
  for (const key of ["body", "eye"]) {
    const g = model.g[key];
    if (!g.I.length) continue;
    const nv = g.P.length / 3, attrs = {};
    const mk = (arr, type, ct, extra = {}) => {
      const buf = Buffer.from(new Float32Array(arr).buffer);
      const bv = pushBuf(buf, 34962);
      accs.push({ bufferView: bv, componentType: ct, count: nv, type, ...extra });
      return accs.length - 1;
    };
    let mn = [1e9, 1e9, 1e9], mxv = [-1e9, -1e9, -1e9];
    for (let i = 0; i < g.P.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], g.P[i + a]); mxv[a] = Math.max(mxv[a], g.P[i + a]); }
    attrs.POSITION = mk(g.P, "VEC3", 5126, { min: mn, max: mxv });
    attrs.NORMAL = mk(g.N, "VEC3", 5126);
    attrs.COLOR_0 = mk(g.C, "VEC3", 5126);
    const big = nv > 65535;
    const ib = Buffer.from((big ? new Uint32Array(g.I) : new Uint16Array(g.I)).buffer);
    const ibv = pushBuf(ib, 34963);
    accs.push({ bufferView: ibv, componentType: big ? 5125 : 5123, count: g.I.length, type: "SCALAR" });
    mats.push(matDefs[key]);
    prims.push({ attributes: attrs, indices: accs.length - 1, material: mats.length - 1, mode: 4 });
  }
  const bin = Buffer.concat(bufs);
  const json = {
    asset: { version: "2.0", generator: "KHOEM-AI make-animals.mjs" },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name }],
    meshes: [{ name, primitives: prims }], materials: mats,
    accessors: accs, bufferViews: views, buffers: [{ byteLength: bin.length }],
  };
  let js = Buffer.from(JSON.stringify(json));
  js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
  const total = 12 + 8 + js.length + 8 + bin.length;
  const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(total, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(js.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([head, jh, js, bh, bin]);
}

// ---------- main ----------
const MAKERS = { tiger: makeTiger, dog: makeDog, snake: makeSnake, bird: makeBird, cow: makeCow };
const args = process.argv.slice(2);
let out = "public/models/animals";
const oi = args.indexOf("--out");
if (oi >= 0) { out = args[oi + 1]; args.splice(oi, 2); }
const wanted = args.length ? args : Object.keys(MAKERS);
for (const id of wanted) if (!MAKERS[id]) { console.error(`unknown animal "${id}" (allowed: ${Object.keys(MAKERS).join(", ")})`); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
for (const id of wanted) {
  const file = path.join(out, `${id}.glb`);
  const bdir = path.join(os.homedir(), "animals-backup");
  if (fs.existsSync(file) && !fs.existsSync(path.join(bdir, `${id}.glb`))) {
    fs.mkdirSync(bdir, { recursive: true });
    fs.copyFileSync(file, path.join(bdir, `${id}.glb`));
  }
  const glb = writeGlb(MAKERS[id](), id);
  fs.writeFileSync(file, glb);
  console.log(`  ✔ ${file}  ${(glb.length / 1024).toFixed(0)} KB`);
}
