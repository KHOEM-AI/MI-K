import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('Ocean Environment files exist', () => {
  assert.ok(fs.existsSync('./src/components/oceanEnvironment.ts'), 'oceanEnvironment.ts must exist');
  assert.ok(fs.existsSync('./src/components/WorldBuilder.ts'), 'WorldBuilder.ts must exist');
});

test('World Builder has correct setup functions', () => {
  const content = fs.readFileSync('./src/components/WorldBuilder.ts', 'utf-8');
  assert.match(content, /initOceanWorld/, 'Must have initOceanWorld function');
  assert.match(content, /OrbitControls/, 'Must use OrbitControls');
  assert.match(content, /main-prison/, 'Must have main prison island');
  assert.match(content, /airport-island/, 'Must have airport island');
});

test('Ocean environment creates water and lights', () => {
  const content = fs.readFileSync('./src/components/oceanEnvironment.ts', 'utf-8');
  assert.match(content, /createOcean/, 'Must have createOcean function');
  assert.match(content, /createSkyAndLights/, 'Must have lighting setup');
  assert.match(content, /DirectionalLight/, 'Must have directional light');
});
