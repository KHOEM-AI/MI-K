import test from "node:test";
import assert from "node:assert/strict";
import { analyzeGlb, verdict, IDS } from "../scripts/check-characters.mjs";

// Builds a tiny valid GLB around a glTF JSON object (the binary chunk only needs to exist).
function glb(json, bin = Buffer.alloc(16)) {
  let j = Buffer.from(JSON.stringify(json));
  while (j.length % 4) j = Buffer.concat([j, Buffer.from(" ")]);
  const h = Buffer.alloc(12); h.write("glTF", 0); h.writeUInt32LE(2, 4); h.writeUInt32LE(12 + 8 + j.length + 8 + bin.length, 8);
  const c1 = Buffer.alloc(8); c1.writeUInt32LE(j.length, 0); c1.write("JSON", 4);
  const c2 = Buffer.alloc(8); c2.writeUInt32LE(bin.length, 0); c2.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([h, c1, j, c2, bin]);
}
const names = (n) => Array.from({ length: n }, (_, i) => ({ name: i === 0 ? "Hips" : i === 1 ? "Head" : i === 2 ? "LeftHandIndex1" : i === 3 ? "LeftLeg" : "Bone" + i }));
const model = (o = {}) => ({
  asset: { version: "2.0", generator: o.generator ?? "Blender" },
  accessors: [{ componentType: 5126, count: 30000, type: "VEC3" }, { componentType: 5125, count: 90000, type: "SCALAR" }, { componentType: 5126, count: 2, type: "SCALAR", max: [2.5], min: [0] }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
  materials: [o.textured === false ? { name: "flat" } : { name: "skin", pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }],
  nodes: names(o.bones ?? 25),
  skins: o.bones === 0 ? [] : [{ joints: Array.from({ length: o.bones ?? 25 }, (_, i) => i) }],
  animations: o.clips === 0 ? [] : [{ name: "Idle", samplers: [{ input: 2, output: 2 }], channels: [] }],
});

test("a full rigged model passes every check", () => {
  const r = analyzeGlb(glb(model()));
  assert.equal(r.ok, true);
  assert.equal(r.triangles, 30000);
  assert.equal(r.joints.length, 25);
  assert.deepEqual(r.clips, [{ name: "Idle", seconds: 2.5 }]);
  assert.equal(verdict(r), "ok");
});

test("no skeleton is a failure; few bones, flat colours and no clips are warnings", () => {
  assert.equal(verdict(analyzeGlb(glb(model({ bones: 0 })))), "fail");
  const r = analyzeGlb(glb(model({ bones: 6, textured: false, clips: 0 })));
  assert.equal(verdict(r), "warn");
  const text = r.checks.map((c) => c.text).join("|");
  assert.match(text, /only 6 bones/);
  assert.match(text, /no textures/);
  assert.match(text, /no animation clips/);
});

test("a file made by three.js GLTFExporter is flagged as the app's placeholder", () => {
  const r = analyzeGlb(glb(model({ generator: "THREE.GLTFExporter" })));
  assert.equal(verdict(r), "fail");
  assert.ok(r.checks.some((c) => /placeholder mannequin/.test(c.text)));
});

test("missing head, finger and leg bones are reported", () => {
  const j = model({ bones: 25 });
  j.nodes = j.nodes.map((n, i) => ({ name: "Bone" + i }));
  const t = analyzeGlb(glb(j)).checks.map((c) => c.text).join("|");
  assert.match(t, /no head bone/);
  assert.match(t, /no finger bones/);
  assert.match(t, /no leg or foot bones/);
});

test("bad input never throws: html, empty, cut short, broken JSON", () => {
  assert.equal(analyzeGlb(Buffer.from("<html>not a model</html>")).ok, false);
  assert.equal(analyzeGlb(Buffer.alloc(0)).ok, false);
  const good = glb(model());
  assert.match(analyzeGlb(good.subarray(0, good.length - 10)).error, /cut short/);
  const broken = Buffer.from(good); broken.write("{{{{", 20);
  assert.match(analyzeGlb(broken).error, /cannot read/);
});

test("the ids are the ones the People tab and README use", () => {
  assert.deepEqual(IDS, ["businessman", "fashion-model", "doctor", "businesswoman", "student", "nurse"]);
});
