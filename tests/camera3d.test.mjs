import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { cameraForPreset, CAMERA_PRESETS } from '../src/components/cameraMath.ts';

const names = Object.keys(CAMERA_PRESETS);
const studio = fs.readFileSync(new URL('../src/components/Studio3D.tsx', import.meta.url), 'utf8');

test('there are exactly the three presets the buttons offer', () => {
  assert.deepEqual([...names].sort(), ['front', 'iso', 'top']);
});

test('every preset has finite numbers and is not placed on its target', () => {
  for (const n of names) {
    const v = cameraForPreset(n);
    assert.ok([...v.position, ...v.target].every(Number.isFinite), n);
    assert.ok(Math.hypot(...v.position.map((p, i) => p - v.target[i])) > 1, n + ' is too close to the target');
  }
});

test('front looks along -Z; top looks down but not exactly vertical', () => {
  const f = cameraForPreset('front').position;
  assert.ok(f[0] === 0 && f[1] === 0 && f[2] > 0);
  const t = cameraForPreset('top').position;
  assert.ok(t[1] > 0 && t[0] === 0 && t[2] !== 0 && Math.abs(t[2]) < 0.5);
});

test('iso equals the start view Studio3D creates its camera with', () => {
  assert.deepEqual(cameraForPreset('iso').position, [4, 3, 7]);
  assert.ok(studio.includes('camera.position.set(4, 3, 7)'));
});

test('unknown names fall back to iso, also inherited object keys', () => {
  for (const bad of ['', 'FRONT', 'constructor', '__proto__', undefined, null]) {
    assert.deepEqual(cameraForPreset(bad), CAMERA_PRESETS.iso);
  }
});

test('a real camera aimed from each preset sees its target in the middle, and cannot flip', () => {
  for (const n of names) {
    const v = cameraForPreset(n);
    const cam = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 1000);
    cam.position.set(...v.position);
    cam.lookAt(...v.target);
    cam.updateMatrixWorld(true);
    const p = new THREE.Vector3(...v.target).project(cam);
    assert.ok(Math.abs(p.x) < 1e-6 && Math.abs(p.y) < 1e-6 && p.z < 1, n);
    const dir = new THREE.Vector3(...v.target).sub(new THREE.Vector3(...v.position)).normalize();
    assert.ok(dir.clone().cross(new THREE.Vector3(0, 1, 0)).length() > 1e-4, n + ': view direction is parallel to up');
  }
});

test('Studio3D uses cameraForPreset and no hard-coded top view is left', () => {
  assert.ok(studio.includes('cameraForPreset(preset)'));
  assert.ok(!studio.includes('camera.position.set(0, 10, 0.01)'));
});
