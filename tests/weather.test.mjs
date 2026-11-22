import test from 'node:test';
import assert from 'node:assert/strict';
import { WeatherSystem } from '../src/components/weatherSystem.ts';
import { createHelicopter } from '../src/components/helicopter.ts';
import * as THREE from 'three';

test('WeatherSystem initializes rain and clouds', () => {
  const w = new WeatherSystem();
  assert.ok(w.rain);
  assert.ok(w.clouds);
  assert.equal(w.rain.visible, false);
  assert.equal(w.toggleRain(), true);
});

test('createHelicopter builds a valid group', () => {
  const h = createHelicopter();
  assert.ok(h.isGroup);
  assert.equal(h.name, 'helicopter');
  let meshes = 0;
  h.traverse((o) => { if (o.isMesh) meshes++; });
  assert.ok(meshes > 5);
});
