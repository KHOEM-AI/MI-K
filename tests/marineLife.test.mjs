import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createMantaRay, createShark, createDolphin, createSeaTurtle, createFishSchool } from '../src/components/marineLife.ts';

const builders = [
  ['manta-ray', createMantaRay],
  ['shark', createShark],
  ['dolphin', createDolphin],
  ['turtle', createSeaTurtle],
  ['fish-school', () => createFishSchool(10)],
];

for (const [name, build] of builders) {
  test(`${name}: builds visible geometry without warnings`, () => {
    const warns = [];
    const w = console.warn;
    console.warn = (...a) => warns.push(String(a[0]));
    try {
      const g = build();
      assert.ok(g.isGroup);
      assert.equal(g.name, name);
      let meshes = 0;
      g.traverse((o) => { if (o.isMesh) meshes++; });
      assert.ok(meshes > 0, 'no meshes');
      const box = new THREE.Box3().setFromObject(g);
      assert.ok(!box.isEmpty());
    } finally { console.warn = w; }
    assert.deepEqual(warns, []);
  });
}

test('fish school uses InstancedMesh', () => {
  const g = createFishSchool(20);
  let instanced = 0;
  g.traverse((o) => { if (o.isInstancedMesh) instanced++; });
  assert.equal(instanced, 1);
});
