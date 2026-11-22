import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as THREE from 'three';

const geo = await import('../src/components/studioGeometry.ts');

const here = path.dirname(fileURLToPath(import.meta.url));
const tmp = fs.mkdtempSync(path.join(here, '.islands-'));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));
const copy = path.join(tmp, 'islandDetails.ts');
fs.copyFileSync(path.join(here, '..', 'src', 'components', 'islandDetails.tsx'), copy);
const mod = await import(pathToFileURL(copy).href);

function build(fn) {
  const warns = [];
  const w = console.warn;
  console.warn = (...a) => warns.push(String(a[0]));
  try { return { g: fn(), warns }; } finally { console.warn = w; }
}

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

const names = ['createAirportDetails', 'createPortDetails', 'createNatureDetails'];

for (const name of names) {
  test(`${name}: builds visible geometry, no three.js warnings, fully disposable`, (t) => {
    assert.equal(typeof mod[name], 'function', name + ' is not exported');
    const { g, warns } = build(() => mod[name]());
    assert.equal(problems(g), null);
    assert.deepEqual(warns, []);
    const box = new THREE.Box3().setFromObject(g);
    t.diagnostic(name + ' bbox min=' + box.min.toArray().map((n) => n.toFixed(1)) + ' max=' + box.max.toArray().map((n) => n.toFixed(1)));
    const w = watch(g);
    geo.disposeMesh(g);
    assert.equal(w.hit.size, w.total, (w.total - w.hit.size) + ' of ' + w.total + ' resources were not disposed');
  });
}
