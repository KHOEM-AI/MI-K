// Puts a generated static model on the ground (y = 0), centres it, and optionally scales it to a real size.
import { worldMatrices } from "../scripts/glb-rig-tool.mjs";

/** Bounding box of every mesh in the scene: { min: [x,y,z], max: [x,y,z] } or null when there is no geometry. */
export function bounds(json) {
  const M = worldMatrices(json), min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  json.nodes.forEach((n, i) => {
    if (n.mesh === undefined || !M[i]) return;
    for (const prim of json.meshes[n.mesh].primitives) {
      const acc = json.accessors[prim.attributes.POSITION];
      if (!acc?.min || !acc?.max) continue;
      for (let c = 0; c < 8; c++) {
        const p = [c & 1 ? acc.max[0] : acc.min[0], c & 2 ? acc.max[1] : acc.min[1], c & 4 ? acc.max[2] : acc.min[2]];
        for (let k = 0; k < 3; k++) {
          const v = M[i][k] * p[0] + M[i][4 + k] * p[1] + M[i][8 + k] * p[2] + M[i][12 + k];
          min[k] = Math.min(min[k], v); max[k] = Math.max(max[k], v);
        }
      }
    }
  });
  return Number.isFinite(min[0]) ? { min, max } : null;
}

export const sizeOf = (b) => b.max.map((v, k) => v - b.min[k]);

/**
 * Wraps the scene in one new node that scales (when `longest` is given, in metres) and moves the model so it stands on
 * y = 0 and is centred on x and z. Returns the new size, or null when the file has no geometry.
 */
export function fitGlb(json, { longest } = {}) {
  const b = bounds(json);
  if (!b) return null;
  const size = sizeOf(b), s = longest > 0 ? longest / Math.max(...size) : 1;
  const cx = (b.min[0] + b.max[0]) / 2, cz = (b.min[2] + b.max[2]) / 2;
  const scene = json.scenes[json.scene ?? 0];
  json.nodes.push({ name: "Fit", children: [...scene.nodes], scale: [s, s, s], translation: [-cx * s, -b.min[1] * s, -cz * s] });
  scene.nodes = [json.nodes.length - 1];
  return size.map((v) => v * s);
}
