import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createTrafficLight } from '../src/components/trafficLights.ts';
import { FireworksSystem } from '../src/components/fireworks.ts';

test('createTrafficLight builds a valid object', () => {
  const tl = createTrafficLight(0, 0);
  assert.ok(tl.group);
  assert.ok(tl.red);
  assert.ok(tl.yellow);
  assert.ok(tl.green);
});

test('traffic light cycles correctly', () => {
  const tl = createTrafficLight(0, 0);
  tl.update(0); // Red
  assert.ok(tl.red.material.emissiveIntensity > 0);
  
  tl.update(8); // Green
  assert.ok(tl.green.material.emissiveIntensity > 0);
});

test('FireworksSystem launches and updates without errors', () => {
  const scene = new THREE.Scene();
  const fw = new FireworksSystem(scene);
  fw.launch();
  fw.update(0.016);
  // Just checking it doesn't throw
  assert.ok(true);
});
