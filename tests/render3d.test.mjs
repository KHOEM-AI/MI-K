import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';

// Headless smoke test: builds every dispatched preset with real three.js (no WebGL, no browser).
// It proves each shape produces visible, finite geometry. It does NOT judge how it looks.
const geo = await import('../src/components/studioGeometry.ts');
const lines = fs.readFileSync(new URL('../src/components/Studio3D.tsx', import.meta.url), 'utf8').split('\n');

// function -> shapes, read from the first (palette) dispatch chain in Studio3D.tsx
const plan = new Map();
lines.forEach((line, i) => {
  if (!line.includes('item.shape === "') || !line.trim().endsWith('{')) return;
  const shapes = [...line.matchAll(/item\.shape === "([^"]+)"/g)].map((m) => m[1]);
  for (let j = i + 1; j <= i + 2; j++) {
    const m = /(create\w+Geometry)\(THREE, item\.shape/.exec(lines[j] || '');
    if (m) { if (!plan.has(m[1])) plan.set(m[1], shapes); break; }
  }
});

function problems(obj) {
  let meshes = 0;
  obj.traverse((o) => { if (o.isMesh) meshes++; });
  if (!meshes) return 'no meshes (empty group)';
  const box = new THREE.Box3().setFromObject(obj);
  if (box.isEmpty()) return 'empty bounding box';
  const v = [box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z];
  if (!v.every(Number.isFinite)) return 'NaN/Infinity in bounding box';
  const s = box.getSize(new THREE.Vector3());
  if (Math.max(s.x, s.y, s.z) > 500) return 'size is huge: ' + s.toArray().map((n) => n.toFixed(0)).join('x');
  return null;
}

test('the dispatch parser found the palette functions (guard against an empty test)', () => {
  assert.ok(plan.size >= 20, 'found only ' + plan.size + ' functions');
});

for (const [fn, shapes] of plan) {
  test(`${fn}: every shape builds visible geometry (${shapes.length})`, () => {
    assert.equal(typeof geo[fn], 'function', fn + ' is not exported');
    const bad = [];
    for (const shape of shapes) {
      try {
        const g = geo[fn](THREE, shape, undefined, undefined, undefined);
        const p = problems(g);
        if (p) bad.push(shape + ': ' + p);
      } catch (e) {
        bad.push(shape + ': threw ' + (e && e.message));
      }
    }
    assert.deepEqual(bad, []);
  });
}
