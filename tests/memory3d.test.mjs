import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

const geo = await import('../src/components/studioGeometry.ts');

// Count how many geometries/materials of an object get disposed.
function watch(root) {
  const items = new Set();
  root.traverse((o) => {
    if (o.geometry) items.add(o.geometry);
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) items.add(m);
  });
  const hit = new Set();
  for (const x of items) x.addEventListener('dispose', () => hit.add(x));
  return { total: items.size, hit };
}

const factories = [
  ['street light', () => geo.createStreetLightGeometry(THREE, '#ffffff', 0.5, 0.5)],
  ['traffic light', () => geo.createTrafficLightGeometry(THREE, '#ffffff', 0.5, 0.5)],
  ['bridge', () => geo.createBridgeGeometry(THREE, '#ffffff', 0.5, 0.5)],
  ['hospital', () => geo.createHospitalGeometry(THREE, 'hospital_urban_tall', '#ffffff', 0.5, 0.5)],
  ['church', () => geo.createReligiousGeometry(THREE, 'church', '#ffffff', 0.5, 0.5)],
];

for (const [name, make] of factories) {
  test(`disposeMesh frees every geometry and material of: ${name}`, () => {
    const obj = make();
    const w = watch(obj);
    assert.ok(w.total > 0, 'object should own at least one geometry/material');
    geo.disposeMesh(obj);
    assert.equal(w.hit.size, w.total, `${w.total - w.hit.size} of ${w.total} resources were not disposed`);
  });
}

test('disposeMesh handles a shared material, array materials and a second call', () => {
  const shared = new THREE.MeshStandardMaterial();
  const g = new THREE.BoxGeometry();
  const root = new THREE.Group();
  root.add(new THREE.Mesh(g, shared), new THREE.Mesh(g, shared));
  root.add(new THREE.Mesh(g, [new THREE.MeshBasicMaterial(), new THREE.MeshBasicMaterial()]));
  const w = watch(root);
  geo.disposeMesh(root);
  assert.equal(w.hit.size, w.total);
  assert.doesNotThrow(() => geo.disposeMesh(root));
});

test('disposeMesh accepts an empty group', () => {
  assert.doesNotThrow(() => geo.disposeMesh(new THREE.Group()));
});
