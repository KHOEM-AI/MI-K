import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { parseGlb, buildGlb, validateGlb, inspect, editModel, mergeAnimations, skeletonHeight, parseHex } from "../scripts/glb-rig-tool.mjs";

const FILE = new URL("../public/characters/fashion-model.glb", import.meta.url);
const have = existsSync(FILE);
const load = () => parseGlb(readFileSync(FILE));
const opts = { skip: have ? false : "public/characters/fashion-model.glb is not in this project" };

test("parse and build a GLB gives the same content back", opts, () => {
  const { json, bin } = load();
  const again = parseGlb(buildGlb(json, bin));
  assert.deepEqual(again.json, json);
  assert.ok(again.bin.length >= bin.length);
  assert.deepEqual(validateGlb(again.json, again.bin), []);
});

test("not a GLB, cut short, wrong version are refused", () => {
  assert.throws(() => parseGlb(Buffer.from("hello world, not glb at all")), /not a GLB/);
  const good = Buffer.concat([Buffer.from("glTF"), Buffer.from([2, 0, 0, 0]), Buffer.alloc(4), Buffer.from([100, 0, 0, 0]), Buffer.from("JSON")]);
  assert.throws(() => parseGlb(good), /cut short/);
  const v1 = Buffer.alloc(24); v1.write("glTF"); v1.writeUInt32LE(1, 4);
  assert.throws(() => parseGlb(v1), /2\.0/);
});

test("inspect reports the real model: bones, fingers, height, clips, no face blendshapes", opts, () => {
  const { json, bin } = load();
  const text = inspect(json, bin).join("\n");
  assert.match(text, /bones: 65/);
  assert.match(text, /40 finger bones/);
  assert.match(text, /face blendshapes: none/);
  assert.match(text, /SambaDance/);
  const h = skeletonHeight(json);
  assert.ok(h > 1.3 && h < 2.0, `height ${h}`);
});

test("edit --height sets the skeleton to exactly that height, other sizes too", opts, () => {
  for (const target of [1.1, 1.58, 1.9]) {
    const { json, bin } = load();
    editModel(json, { height: target });
    assert.ok(Math.abs(skeletonHeight(json) - target) < 0.005, `${target} got ${skeletonHeight(json)}`);
    assert.deepEqual(validateGlb(json, bin), []);
  }
  assert.throws(() => editModel(load().json, { height: 9 }), /between/);
  assert.throws(() => editModel(load().json, { height: 0.1 }), /between/);
});

test("edit --tint darkens only (factor never above 1) and rejects bad colours", opts, () => {
  const { json } = load();
  editModel(json, { tint: "#a8704c" });
  const f = json.materials[0].pbrMetallicRoughness.baseColorFactor;
  assert.ok(f.slice(0, 3).every((v) => v > 0 && v <= 1) && f[3] === 1);
  assert.deepEqual(parseHex("#ffffff").map((v) => +v.toFixed(3)), [1, 1, 1]);
  assert.throws(() => parseHex("brown"), /colour must look like/);
});

test("edit can remove animations by name", opts, () => {
  const { json } = load();
  editModel(json, { drop: ["TPose"] });
  assert.deepEqual(json.animations.map((a) => a.name), ["SambaDance"]);
  editModel(json, { drop: ["SambaDance"] });
  assert.equal(json.animations, undefined);
});

test("merge copies animations by bone name and the result is a valid file", opts, () => {
  const base = load(), src = load();
  const before = base.json.animations.length;
  const r = mergeAnimations(base, src, [{ name: "dance2", srcIndex: 0 }, { name: "pose2", srcIndex: 1 }]);
  base.bin = r.bin;
  assert.equal(base.json.animations.length, before + 2);
  assert.deepEqual(validateGlb(base.json, base.bin), []);
  const added = base.json.animations.at(-2);
  assert.equal(added.channels.length, src.json.animations[0].channels.length);
  const reread = parseGlb(buildGlb(base.json, base.bin));
  assert.deepEqual(validateGlb(reread.json, reread.bin), []);
});

test("merge --in-place keeps the hips from travelling sideways but lets them move up and down", opts, () => {
  const base = load(), src = load();
  const r = mergeAnimations(base, src, [{ name: "stay", srcIndex: 0 }], { inPlace: ["stay"] });
  const hips = base.json.nodes.findIndex((n) => n.name === "mixamorig:Hips");
  const anim = base.json.animations.at(-1);
  const ch = anim.channels.find((c) => c.target.node === hips && c.target.path === "translation");
  const out = base.json.accessors[anim.samplers[ch.sampler].output];
  const v = base.json.bufferViews[out.bufferView];
  const f = new Float32Array(r.bin.buffer.slice(r.bin.byteOffset + v.byteOffset, r.bin.byteOffset + v.byteOffset + v.byteLength));
  const rest = base.json.nodes[hips].translation, up = rest.map(Math.abs).indexOf(Math.max(...rest.map(Math.abs)));
  const span = (axis) => { let lo = Infinity, hi = -Infinity; for (let i = axis; i < f.length; i += 3) { lo = Math.min(lo, f[i]); hi = Math.max(hi, f[i]); } return hi - lo; };
  for (const axis of [0, 1, 2]) if (axis !== up) assert.ok(span(axis) < 1e-4, `axis ${axis} moves by ${span(axis)}`);
  assert.ok(span(up) > 1, "the hips still bob up and down");
});

test("merge refuses a duplicate name and a different rig", opts, () => {
  const base = load(), src = load();
  assert.throws(() => mergeAnimations(base, src, [{ name: "SambaDance", srcIndex: 0 }]), /already has/);
  const other = load();
  other.json.nodes.forEach((n) => { if (n.name) n.name = "other:" + n.name; });
  assert.throws(() => mergeAnimations(load(), other, [{ name: "x", srcIndex: 0 }]), /none of its bones/);
});

test("a source skeleton of another size has its translations rescaled", opts, () => {
  const base = load(), src = load();
  src.json.nodes.forEach((n) => { if (/Spine$/.test(n.name ?? "")) n.translation = n.translation.map((v) => v * 100); });
  const r = mergeAnimations(base, src, [{ name: "big", srcIndex: 0 }]);
  assert.ok(r.notes.some((n) => /rescaled/.test(n)), r.notes.join("; "));
});

test("validateGlb catches a broken file", opts, () => {
  const { json, bin } = load();
  json.accessors[0].count += 1_000_000;
  assert.ok(validateGlb(json, bin).some((p) => /larger than its bufferView/.test(p)));
  const j2 = load().json;
  j2.animations[0].channels[0].target.node = 9999;
  assert.ok(validateGlb(j2, load().bin).some((p) => /no such node/.test(p)));
});
