import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { isRealPerson, glbJson } from "../src/vehicles3d/realPerson.mjs";

function glb(json) {
  let body = Buffer.from(JSON.stringify(json), "utf8");
  body = Buffer.concat([body, Buffer.alloc((4 - (body.length % 4)) % 4, 0x20)]);
  const head = Buffer.alloc(20);
  head.writeUInt32LE(0x46546c67, 0);
  head.writeUInt32LE(2, 4);
  head.writeUInt32LE(20 + body.length, 8);
  head.writeUInt32LE(body.length, 12);
  head.writeUInt32LE(0x4e4f534a, 16);
  return new Uint8Array(Buffer.concat([head, body]));
}

test("a rigged model from another tool is a real person", () => {
  assert.equal(isRealPerson(glb({ asset: { generator: "glTF-Transform v4.4.1" }, skins: [{ joints: [0, 1] }] })), true);
});

test("a three.js GLTFExporter file is a placeholder, even with a skeleton", () => {
  assert.equal(isRealPerson(glb({ asset: { generator: "THREE.GLTFExporter r187" }, skins: [{ joints: [0] }] })), false);
});

test("no skeleton means no real person", () => {
  assert.equal(isRealPerson(glb({ asset: { generator: "Blender" } })), false);
  assert.equal(isRealPerson(glb({ asset: {}, skins: [{ joints: [] }] })), false);
});

test("bad bytes never throw", () => {
  for (const bad of [new Uint8Array(0), new Uint8Array(40), new TextEncoder().encode("<html>not a model</html>"), null, undefined]) {
    assert.equal(isRealPerson(bad), false);
  }
  const cut = glb({ skins: [{ joints: [0] }] }).subarray(0, 30);
  assert.equal(isRealPerson(cut), false);
  assert.equal(glbJson(cut), null);
});

test("the bundled fashion model is a real person", () => {
  const buf = fs.readFileSync(new URL("../public/characters/fashion-model.glb", import.meta.url));
  assert.equal(isRealPerson(new Uint8Array(buf)), true);
});
