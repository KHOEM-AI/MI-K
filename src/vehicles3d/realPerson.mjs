// Tells a real rigged person from a placeholder mannequin, using the same rules as scripts/check-characters.mjs:
// a real person has a skeleton and was not made by three.js GLTFExporter (this app's own placeholder figures).
// Pure (no three.js), so it can be tested without WebGL. Never throws: bad bytes give false.
import { isGlb } from './modelTools.mjs';

const JSON_CHUNK = 0x4e4f534a; // "JSON", little endian

export function glbJson(bytes) {
  const u8 = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  if (!isGlb(u8)) return null;
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let off = 12;
  while (off + 8 <= u8.length) {
    const len = dv.getUint32(off, true);
    if (off + 8 + len > u8.length) return null;
    if (dv.getUint32(off + 4, true) === JSON_CHUNK) {
      try { return JSON.parse(new TextDecoder().decode(u8.subarray(off + 8, off + 8 + len))); } catch { return null; }
    }
    off += 8 + len;
  }
  return null;
}

export function isRealPerson(bytes) {
  const j = glbJson(bytes);
  if (!j) return false;
  if (/gltfexporter/i.test(String((j.asset && j.asset.generator) || ''))) return false;
  return Array.isArray(j.skins) && j.skins.some((s) => s && Array.isArray(s.joints) && s.joints.length > 0);
}
