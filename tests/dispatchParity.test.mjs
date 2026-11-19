import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../src/components/Studio3D.tsx', import.meta.url), 'utf8');
const counts = {};
for (const m of src.matchAll(/\b(create[A-Za-z0-9]+Geometry)\(THREE, item\.shape/g)) counts[m[1]] = (counts[m[1]] || 0) + 1;

test('civic and karaoke geometry are dispatched in all 3 places', () => {
  for (const fn of ['createHospitalGeometry', 'createBankGeometry', 'createCivicGeometry', 'createCommercialGeometry', 'createReligiousGeometry', 'createKaraokeGeometry']) {
    assert.equal(counts[fn], 3, fn);
  }
});

test('no geometry function is dispatched in only some of the places', () => {
  for (const [fn, n] of Object.entries(counts)) if (n > 1) assert.equal(n, 3, fn + ' appears ' + n + ' times');
});
