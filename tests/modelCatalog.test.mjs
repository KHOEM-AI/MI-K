import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CATEGORIES, CATEGORY_FOLDER, MODELS, modelsByCategory, glbPath,
} from '../src/vehicles3d/modelCatalog.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('catalog has all four categories', () => {
  assert.deepEqual(CATEGORIES, ['animal', 'house', 'tool', 'vehicle']);
});

test('every category has at least one model', () => {
  for (const cat of CATEGORIES) {
    const n = modelsByCategory(cat).length;
    assert.ok(n >= 1, `category "${cat}" has ${n} models (need ≥ 1)`);
  }
});

test('model IDs are unique', () => {
  const ids = MODELS.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length,
    `duplicate IDs: ${ids.filter((x, i) => ids.indexOf(x) !== i)}`);
});

test('every model has required fields', () => {
  for (const m of MODELS) {
    assert.ok(m.id, 'model missing id');
    assert.ok(m.name, `model ${m.id} missing name`);
    assert.ok(m.khmerName, `model ${m.id} missing khmerName`);
    assert.ok(CATEGORIES.includes(m.category), `model ${m.id} bad category ${m.category}`);
  }
});

test('glbPath points into /models/<folder>/<id>.glb', () => {
  for (const m of MODELS) {
    const p = glbPath(m);
    assert.equal(p, `/models/${CATEGORY_FOLDER[m.category]}/${m.id}.glb`);
    assert.match(p, /^\/models\/[a-z]+\/[a-z0-9-]+\.glb$/);
  }
});

test('model IDs are filesystem-safe slugs', () => {
  for (const m of MODELS) {
    assert.match(m.id, /^[a-z0-9-]+$/, `model ID "${m.id}" not safe-slug`);
  }
});

// ── The most important test: every catalog entry has a real .glb file ──
test('every catalog entry has a real .glb file on disk', () => {
  const missing = [];
  for (const m of MODELS) {
    const p = glbPath(m);
    const diskPath = resolve(ROOT, 'public', p.replace(/^\//, ''));
    if (!existsSync(diskPath)) missing.push(`${m.id} → ${diskPath}`);
  }
  assert.deepEqual(missing, [], `missing .glb files:\n  ${missing.join('\n  ')}`);
});

test('catalog has 20+ real models', () => {
  assert.ok(MODELS.length >= 20, `catalog only has ${MODELS.length} models (need ≥ 20)`);
});
