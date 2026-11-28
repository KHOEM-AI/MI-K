// A labelled TEST car (boxes) for trying the image -> 3D pipeline without any AI.
// It is NOT generated from the photo. The file says so in its node name and in asset.extras.
import { buildGlb } from "../scripts/glb-rig-tool.mjs";

const pad4 = (b) => Buffer.concat([b, Buffer.alloc((4 - (b.length % 4)) % 4)]);

function addBox(part, [cx, cy, cz], [sx, sy, sz]) {
  const h = [sx / 2, sy / 2, sz / 2];
  const faces = [   // normal, then the 4 corners (counter-clockwise seen from outside)
    [[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]],
    [[-1, 0, 0], [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]]],
    [[0, 1, 0], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]]],
    [[0, -1, 0], [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]]],
    [[0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]],
    [[0, 0, -1], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]]],
  ];
  for (const [n, corners] of faces) {
    const base = part.pos.length / 3;
    for (const c of corners) { part.pos.push(cx + c[0] * h[0], cy + c[1] * h[1], cz + c[2] * h[2]); part.nor.push(...n); }
    part.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
}

/** A sedan-like block model, 4.8 m long (z), 1.85 m wide (x), 1.45 m high (y), standing on y = 0. */
export function buildMockCar({ color = [0.1, 0.25, 0.7] } = {}) {
  const body = { pos: [], nor: [], idx: [] }, glass = { pos: [], nor: [], idx: [] }, wheels = { pos: [], nor: [], idx: [] };
  addBox(body, [0, 0.55, 0], [1.85, 0.6, 4.8]);
  addBox(body, [0, 0.98, -0.1], [1.7, 0.3, 4.0]);
  addBox(glass, [0, 1.22, -0.2], [1.62, 0.5, 2.5]);
  addBox(body, [0, 1.45 - 0.02, -0.2], [1.5, 0.04, 2.3]);
  for (const x of [-0.92, 0.92]) for (const z of [-1.55, 1.55]) addBox(wheels, [x, 0.35, z], [0.28, 0.7, 0.7]);

  const chunks = [], views = [], accessors = [], prims = [];
  const push = (data, target) => {
    const buf = pad4(Buffer.from(data.buffer));
    const offset = chunks.reduce((n, c) => n + c.length, 0);
    chunks.push(buf);
    views.push({ buffer: 0, byteOffset: offset, byteLength: data.byteLength, target });
    return views.length - 1;
  };
  [[body, 0], [glass, 1], [wheels, 2]].forEach(([p, material]) => {
    const pos = new Float32Array(p.pos), nor = new Float32Array(p.nor), idx = new Uint16Array(p.idx);
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < pos.length; i++) { min[i % 3] = Math.min(min[i % 3], pos[i]); max[i % 3] = Math.max(max[i % 3], pos[i]); }
    accessors.push({ bufferView: push(pos, 34962), componentType: 5126, count: pos.length / 3, type: "VEC3", min, max });
    accessors.push({ bufferView: push(nor, 34962), componentType: 5126, count: nor.length / 3, type: "VEC3" });
    accessors.push({ bufferView: push(idx, 34963), componentType: 5123, count: idx.length, type: "SCALAR" });
    const a = accessors.length - 3;
    prims.push({ attributes: { POSITION: a, NORMAL: a + 1 }, indices: a + 2, material });
  });
  const bin = Buffer.concat(chunks);
  const json = {
    asset: { version: "2.0", generator: "MI-K mock (TEST DATA, not AI)", extras: { testData: true, note: "Placeholder car. Not generated from your photo." } },
    scene: 0, scenes: [{ nodes: [0] }],
    nodes: [{ name: "TEST_PLACEHOLDER_NOT_AI", mesh: 0 }],
    meshes: [{ name: "test_car", primitives: prims }],
    materials: [
      { name: "body", pbrMetallicRoughness: { baseColorFactor: [...color, 1], metallicFactor: 0.6, roughnessFactor: 0.35 } },
      { name: "glass", pbrMetallicRoughness: { baseColorFactor: [0.05, 0.07, 0.1, 1], metallicFactor: 0.2, roughnessFactor: 0.1 } },
      { name: "wheel", pbrMetallicRoughness: { baseColorFactor: [0.03, 0.03, 0.03, 1], metallicFactor: 0, roughnessFactor: 0.9 } },
    ],
    bufferViews: views, accessors, buffers: [{ byteLength: bin.length }],
  };
  return buildGlb(json, bin);
}
