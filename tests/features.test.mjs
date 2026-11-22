import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createNightLights } from '../src/components/nightLights.ts';
import { createGuardDog, createGuardDogs } from '../src/components/guardDogs.ts';
import { GameMode } from '../src/components/gameMode.ts';

test('createNightLights builds a hidden group with lights', () => {
  const nl = createNightLights();
  assert.ok(nl.group);
  assert.equal(nl.group.visible, false);
  let lights = 0;
  nl.group.traverse((o) => { if (o.isLight) lights++; });
  assert.ok(lights > 5);
});

test('toggleNightLights changes visibility', () => {
  const nl = createNightLights();
  nl.setVisible(true);
  assert.equal(nl.group.visible, true);
});

test('createGuardDog builds valid geometry', () => {
  const dog = createGuardDog();
  assert.equal(dog.name, 'guard-dog');
  let meshes = 0;
  dog.traverse((o) => { if (o.isMesh) meshes++; });
  assert.ok(meshes > 5);
});

test('createGuardDogs returns 4 dogs', () => {
  const dogs = createGuardDogs(4);
  assert.equal(dogs.length, 4);
});

test('GameMode spawns prisoners and guards', () => {
  const scene = new THREE.Scene();
  const gm = new GameMode(scene);
  assert.equal(gm.spawnAt('prisoner', new THREE.Vector3(0, 0, 0)), 1);
  assert.equal(gm.spawnAt('guard', new THREE.Vector3(5, 0, 5)), 2);
  assert.equal(gm.getSpawnedCount(), 2);
  gm.clear();
  assert.equal(gm.getSpawnedCount(), 0);
});
