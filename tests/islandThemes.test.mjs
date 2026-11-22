import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createThemedIsland, createNatureIsland, createAirportIsland, createPortIsland, THEME_MESH_BUDGET } from '../src/components/islandThemes.ts';
const geo = await import('../src/components/studioGeometry.ts');
const themes = [['nature-island', createNatureIsland], ['airport-island', createAirportIsland], ['port-island', createPortIsland]];

function stats(g) {
  let meshes = 0; let instances = 0; const spots = []; const m = new THREE.Matrix4();
  g.traverse((o) => {
    if (!o.isMesh) return; meshes++;
    if (o.isInstancedMesh) {
      instances += o.count;
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); spots.push(new THREE.Vector3().setFromMatrixPosition(m)); }
    }
  });
  return { meshes, instances, spots, box: new THREE.Box3().setFromObject(g) };
}

function quiet(fn) {
  const warns = []; const w = console.warn;
  console.warn = (...a) => warns.push(String(a[0]));
  try { return { value: fn(), warns }; } finally { console.warn = w; }
}

for (const [name, make] of themes) {
  test(`${name}: visible, finite, above the sea, within budget, no warnings`, (t) => {
    const { value: g, warns } = quiet(make);
    const s = stats(g);
    assert.deepEqual(warns, []);
    assert.ok(s.meshes > 0 && s.meshes <= THEME_MESH_BUDGET, 'meshes: ' + s.meshes);
    const b = s.box;
    assert.ok(!b.isEmpty());
    assert.ok([b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z].every(Number.isFinite));
    assert.ok(b.min.y >= -0.01, 'below sea: ' + b.min.y);
    assert.ok(b.max.y < 60, 'too tall: ' + b.max.y);
    const reach = Math.max(...[b.min.x, b.max.x].flatMap((x) => [b.min.z, b.max.z].map((z) => Math.hypot(x, z))));
    assert.ok(reach <= 80, 'reach ' + reach.toFixed(1) + ' > 80');
    for (const p of s.spots) assert.ok(Math.hypot(p.x, p.z) <= 55, 'instance too far');
    t.diagnostic(`${name}: ${s.meshes} meshes, ${s.instances} inst, reach ${reach.toFixed(1)}`);
  });

  test(`${name}: same result every time`, () => {
    const a = stats(make()); const b = stats(make());
    assert.equal(a.instances, b.instances);
    assert.deepEqual(a.box.min.toArray(), b.box.min.toArray());
    assert.deepEqual(a.box.max.toArray(), b.box.max.toArray());
  });

  test(`${name}: disposeMesh frees everything`, () => {
    const g = make(); const items = new Set();
    g.traverse((o) => {
      if (o.geometry) items.add(o.geometry);
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of mats) items.add(m);
    });
    const hit = new Set();
    for (const x of items) x.addEventListener('dispose', () => hit.add(x));
    geo.disposeMesh(g);
    assert.equal(hit.size, items.size);
  });
}

test('createThemedIsland lookup', () => {
  for (const [name] of themes) assert.ok(createThemedIsland(name));
  assert.equal(createThemedIsland('main-island'), null);
});
