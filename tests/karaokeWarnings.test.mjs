import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
const geo = await import('../src/components/studioGeometry.ts');

test('karaoke builds with no three.js warnings (every dance tile has a colour)', () => {
  const warnings = [];
  const w = console.warn;
  console.warn = (...a) => warnings.push(String(a[0]));
  try { geo.createKaraokeGeometry(THREE, 'karaoke_standard', '#ff3366'); } finally { console.warn = w; }
  assert.deepEqual(warnings, []);
});
