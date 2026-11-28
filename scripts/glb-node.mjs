// Small helpers to write .glb files from Node (GLTFExporter is built for browsers).
import { Buffer } from "node:buffer";

/** GLTFExporter needs FileReader; give Node a minimal stand-in once. */
export function ensureFileReader() {
  if (typeof FileReader !== "undefined") return;
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) { blob.arrayBuffer().then((r) => { this.result = r; this.onloadend?.(); }); }
    readAsDataURL(blob) {
      blob.arrayBuffer().then((r) => {
        this.result = `data:${blob.type || "application/octet-stream"};base64,${Buffer.from(r).toString("base64")}`;
        this.onloadend?.();
      });
    }
  };
}

/** Exports an object (with optional { animations: [AnimationClip] }) to a binary GLB. Resolves { glb, warnings }. */
export function toGlb(GLTFExporter, object, options = {}, timeoutMs = 60000) {
  ensureFileReader();
  return new Promise((resolve, reject) => {
    const warn = console.warn, warnings = [];
    console.warn = (...a) => warnings.push(a.join(" "));
    const timer = setTimeout(() => { console.warn = warn; reject(new Error("timeout")); }, timeoutMs);
    const finish = (fn) => (v) => { console.warn = warn; clearTimeout(timer); fn(v); };
    new GLTFExporter().parse(
      object,
      finish((out) => (out instanceof ArrayBuffer ? resolve({ glb: Buffer.from(out), warnings }) : reject(new Error("no binary output")))),
      finish((e) => reject(e instanceof Error ? e : new Error(String(e)))),
      { binary: true, ...options },
    );
  });
}

/** Reads the JSON part of a .glb. Throws a clear error for anything that is not a complete GLB. */
export function readGlbJson(buf) {
  if (buf.length < 20 || buf.toString("latin1", 0, 4) !== "glTF") throw new Error("not a GLB file");
  let off = 12;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32LE(off), type = buf.toString("latin1", off + 4, off + 8);
    if (off + 8 + len > buf.length) throw new Error("GLB is cut short");
    if (type === "JSON") return JSON.parse(buf.toString("utf8", off + 8, off + 8 + len));
    off += 8 + len;
  }
  throw new Error("GLB has no JSON chunk");
}
