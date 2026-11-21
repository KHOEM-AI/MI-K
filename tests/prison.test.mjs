import { test } from 'node:test';
import assert from 'node:assert';

test('Prison Island geometry files exist', async () => {
  const fs = await import('node:fs');
  assert.ok(fs.existsSync('./src/components/PrisonIsland3D.tsx'), 'PrisonIsland3D.tsx must exist');
  assert.ok(fs.existsSync('./src/components/prisonGeometry.tsx'), 'prisonGeometry.tsx must exist');
  assert.ok(fs.existsSync('./src/components/prisonTypes.ts'), 'prisonTypes.ts must exist');
});

test('Prison Island block has correct geometry functions', async () => {
  const fs = await import('node:fs');
  const content = fs.readFileSync('./src/components/prisonGeometry.tsx', 'utf-8');
  
  assert.match(content, /createIslandGeometry/, 'Must have island geometry');
  assert.match(content, /createPrisonWall/, 'Must have wall geometry');
  assert.match(content, /createPrisonFacilities/, 'Must have facility geometry');
  assert.match(content, /createTransportPlane/, 'Must have plane transport');
  assert.match(content, /createTransportShip/, 'Must have ship transport');
});

test('No bridges are allowed to the prison island', async () => {
  const fs = await import('node:fs');
  const content = fs.readFileSync('./src/components/prisonGeometry.tsx', 'utf-8');
  assert.doesNotMatch(content, /Bridge/i, 'Prison island should NOT have bridges');
});
