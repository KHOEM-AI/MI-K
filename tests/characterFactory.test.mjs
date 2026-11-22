import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createRealisticCharacter, createCharacterLineup, CHARACTER_TYPES } from '../src/components/characterFactory.ts';

test('createRealisticCharacter builds every type without warnings', () => {
  const warns = [];
  const w = console.warn;
  console.warn = (...a) => warns.push(String(a[0]));
  try {
    for (const type of CHARACTER_TYPES) {
      const char = createRealisticCharacter(type);
      assert.ok(char.isGroup, type + ' must be a group');
      let meshes = 0;
      char.traverse((o) => { if (o.isMesh) meshes++; });
      assert.ok(meshes > 5, type + ' has too few meshes: ' + meshes);
      
      const box = new THREE.Box3().setFromObject(char);
      assert.ok(!box.isEmpty(), type + ' has empty bbox');
      assert.ok(box.max.y > 1.5, type + ' is too short');
    }
  } finally { console.warn = w; }
  assert.deepEqual(warns, []);
});

test('createCharacterLineup places 20 characters', () => {
  const lineup = createCharacterLineup();
  assert.equal(lineup.children.length, 20);
  
  const box = new THREE.Box3().setFromObject(lineup);
  assert.ok(!box.isEmpty());
  assert.ok(box.max.x - box.min.x > 30, 'lineup is too narrow');
});

test('every character is fully disposable', async () => {
  const { disposeMesh } = await import('../src/components/studioGeometry.ts');
  const char = createRealisticCharacter('korean_soldier');
  const items = new Set();
  char.traverse((o) => {
    if (o.geometry) items.add(o.geometry);
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) items.add(m);
  });
  const hit = new Set();
  for (const x of items) x.addEventListener('dispose', () => hit.add(x));
  disposeMesh(char);
  assert.equal(hit.size, items.size);
});
