import test from "node:test";
import assert from "node:assert/strict";
import { File } from "node:buffer";

import {
  createBackupJSON,
  restoreBackupJSON,
} from "../src/lib/backup.mjs";

globalThis.File = File;

function makeAsset(name, type, kind, content) {
  const file = new File([content], name, {
    type,
    lastModified: 1700000000000,
  });

  return {
    id: `test-${name}`,
    file,
    kind,
  };
}

async function bytes(file) {
  return Array.from(new Uint8Array(await file.arrayBuffer()));
}

test("Export and import preserves image name, MIME and binary", async () => {
  const original = makeAsset(
    "photo.png",
    "image/png",
    "image",
    new Uint8Array([0, 1, 2, 127, 128, 255])
  );

  const json = await createBackupJSON([original]);
  const restored = await restoreBackupJSON(json);

  assert.equal(restored.length, 1);
  assert.equal(restored[0].file.name, "photo.png");
  assert.equal(restored[0].file.type, "image/png");
  assert.equal(restored[0].kind, "image");
  assert.deepEqual(await bytes(restored[0].file), await bytes(original.file));
});

test("Export and import preserves GLB model binary", async () => {
  const original = makeAsset(
    "scene.glb",
    "model/gltf-binary",
    "model",
    new Uint8Array([103, 108, 84, 70, 2, 0, 0, 0, 255, 128, 0])
  );

  const json = await createBackupJSON([original]);
  const restored = await restoreBackupJSON(json);

  assert.equal(restored[0].file.name, "scene.glb");
  assert.equal(restored[0].file.type, "model/gltf-binary");
  assert.equal(restored[0].kind, "model");
  assert.deepEqual(await bytes(restored[0].file), await bytes(original.file));
});

test("Export and import preserves multiple assets", async () => {
  const assets = [
    makeAsset("one.jpg", "image/jpeg", "image", [1, 2, 3]),
    makeAsset("two.webp", "image/webp", "image", [4, 5, 6]),
    makeAsset("three.glb", "model/gltf-binary", "model", [7, 8, 9]),
  ];

  const restored = await restoreBackupJSON(
    await createBackupJSON(assets)
  );

  assert.equal(restored.length, 3);

  for (let i = 0; i < assets.length; i++) {
    assert.equal(restored[i].file.name, assets[i].file.name);
    assert.equal(restored[i].file.type, assets[i].file.type);
    assert.equal(restored[i].kind, assets[i].kind);
    assert.deepEqual(
      await bytes(restored[i].file),
      await bytes(assets[i].file)
    );
  }
});

test("Export rejects an empty asset list", async () => {
  await assert.rejects(
    createBackupJSON([]),
    /No assets to export/
  );
});

test("Import rejects invalid JSON and unsupported format", async () => {
  await assert.rejects(
    restoreBackupJSON("{broken"),
    /Backup JSON is not valid/
  );

  await assert.rejects(
    restoreBackupJSON(JSON.stringify({
      format: "OTHER",
      version: 1,
      assets: [],
    })),
    /Unsupported KHOEM-AI backup format/
  );
});

test("Import rejects mismatched MIME and asset kind", async () => {
  const invalid = {
    format: "KHOEM-AI-ASSETS",
    version: 1,
    assets: [{
      name: "photo.png",
      type: "application/pdf",
      lastModified: 1700000000000,
      kind: "image",
      data: "AQID",
    }],
  };

  await assert.rejects(
    restoreBackupJSON(JSON.stringify(invalid)),
    /invalid asset metadata/
  );
});

test("Import rejects corrupted binary data", async () => {
  const invalid = {
    format: "KHOEM-AI-ASSETS",
    version: 1,
    assets: [{
      name: "photo.png",
      type: "image/png",
      lastModified: 1700000000000,
      kind: "image",
      data: "NOT_BASE64!",
    }],
  };

  await assert.rejects(
    restoreBackupJSON(JSON.stringify(invalid)),
    /Invalid asset binary data/
  );
});
