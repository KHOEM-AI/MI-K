import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createOcean } from '../src/components/oceanEnvironment.ts';

test('createOcean returns a Mesh with a ShaderMaterial and uTime uniform', () => {
  const mesh = createOcean(500);
  assert.ok(mesh.isMesh);
  assert.ok(mesh.material instanceof THREE.ShaderMaterial);
  assert.equal(typeof mesh.material.uniforms.uTime.value, 'number');
  assert.ok(mesh.material.vertexShader.length > 100);
  assert.ok(mesh.material.fragmentShader.length > 100);
});

test('createOcean exposes the material through userData for animation', () => {
  const mesh = createOcean(500);
  assert.ok(mesh.userData.waterMaterial);
  assert.strictEqual(mesh.userData.waterMaterial, mesh.material);
});

test('createOcean is laid flat at y=-3', () => {
  const mesh = createOcean(500);
  assert.ok(Math.abs(mesh.rotation.x + Math.PI / 2) < 1e-6, 'must be rotated -90deg around X');
  assert.equal(mesh.position.y, -3);
  assert.equal(mesh.name, 'ocean-water');
});

test('advancing uTime does not throw (simulates the render loop)', () => {
  const mesh = createOcean(500);
  const mat = mesh.material;
  for (const t of [0, 0.5, 1.7, 100, 999]) {
    mat.uniforms.uTime.value = t;
    assert.equal(mat.uniforms.uTime.value, t);
  }
});

test('the ocean geometry has enough vertices for visible waves', () => {
  const mesh = createOcean(500);
  const posAttr = mesh.geometry.getAttribute('position');
  // oceanEnvironment.ts uses 128 segments each way -> (128+1)^2 = 16641 vertices (kept low for phones)
  assert.ok(posAttr.count >= 16000, 'too few vertices: ' + posAttr.count);
  assert.ok(posAttr.count <= 70000, 'too many vertices: ' + posAttr.count);
});

test('disposeMesh frees the ocean shader material and geometry', async () => {
  const { disposeMesh } = await import('../src/components/studioGeometry.ts');
  const mesh = createOcean(500);
  let geoDisposed = false;
  let matDisposed = false;
  mesh.geometry.addEventListener('dispose', () => { geoDisposed = true; });
  mesh.material.addEventListener('dispose', () => { matDisposed = true; });
  disposeMesh(mesh);
  assert.ok(geoDisposed, 'geometry not disposed');
  assert.ok(matDisposed, 'material not disposed');
});
