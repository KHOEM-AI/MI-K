import test from 'node:test';
import assert from 'node:assert/strict';
import { safeSlug, filenameFor, pickMimeType } from '../src/vehicles3d/modelExporter.ts';

test('safeSlug makes a filesystem-safe slug', () => {
  assert.equal(safeSlug('My Model 01'), 'my-model-01');
  assert.equal(safeSlug('Hello_World!'), 'hello-world');
  assert.equal(safeSlug('---'), 'model');
  assert.equal(safeSlug(''), 'model');
  assert.equal(safeSlug('សុភ័ក្រ'), 'model');
});

test('filenameFor picks the right extension per MIME', () => {
  assert.match(filenameFor('hero',  'model/gltf-binary'), /^hero-.*\.glb$/);
  assert.match(filenameFor('shot',  'image/png'),         /^shot-.*\.png$/);
  assert.match(filenameFor('shot',  'image/jpeg'),        /^shot-.*\.jpg$/);
  assert.match(filenameFor('clip',  'video/webm'),        /^clip-.*\.webm$/);
  assert.match(filenameFor('clip',  'video/mp4'),         /^clip-.*\.mp4$/);
});

test('filenameFor falls back to .bin for unknown MIME', () => {
  assert.match(filenameFor('blob', 'application/x-unknown'), /^blob-.*\.bin$/);
});

test('filenameFor handles Khmer labels', () => {
  assert.match(filenameFor('សុភ័ក្រ', 'model/gltf-binary'), /^model-.*\.glb$/);
});

test('pickMimeType returns a non-empty string', () => {
  const m = pickMimeType();
  assert.equal(typeof m, 'string');
  assert.ok(m.length > 0);
});
