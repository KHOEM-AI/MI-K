// Backend for the "2D image -> 3D -> GLB" button (src/vehicles3d/ImageTo3D.tsx).
//
//   node server/image-to-3d.mjs                      mock provider: a labelled TEST model, no AI
//   I23D_PROVIDER=trellis node server/image-to-3d.mjs    real AI via a TRELLIS Hugging Face Space (npm i @gradio/client)
//
// POST /api/image-to-3d   multipart/form-data, field "image" (PNG, JPEG or WebP, up to 10 MB)
//   200  the .glb (model/gltf-binary) with the headers X-Provider, X-Test-Data and X-Model-Size
//   4xx/5xx  JSON { "error": "..." }
//
// Environment: PORT (8787), HOST (127.0.0.1), I23D_PROVIDER (mock | trellis), HF_SPACE (JeffreyXiang/TRELLIS),
//   HF_TOKEN (optional, stays on the server), I23D_LONGEST_M (scale the longest side, e.g. 4.8 for a car),
//   I23D_SAVE_DIR (default exports/image-to-3d, "off" to disable), I23D_TIMEOUT_S (420).
import http from "node:http";
import { Readable } from "node:stream";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseGlb, buildGlb, validateGlb } from "../scripts/glb-rig-tool.mjs";
import { buildMockCar } from "./mock-glb.mjs";
import { fitGlb } from "./glb-fit.mjs";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/* ---------------- small helpers ---------------- */
/** The real type of the picture, from its first bytes (the file name and the browser's type are not trusted). */
export function sniffImage(buf) {
  if (buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47) return "image/png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 12 && buf.toString("latin1", 0, 4) === "RIFF" && buf.toString("latin1", 8, 12) === "WEBP") return "image/webp";
  return null;
}

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

/** Hosts a provider may download the finished model from (a Space hands back a link). */
export const isAllowedModelUrl = (url, extraHosts = []) => {
  try {
    const u = new URL(url);
    return (u.protocol === "https:" && /(^|\.)(hf\.space|huggingface\.co)$/.test(u.hostname)) || extraHosts.includes(u.host);
  } catch { return false; }
};

/* ---------------- providers: { name, testData, run(image, { signal }) -> Buffer (a .glb) } ---------------- */
export const mockProvider = () => ({
  name: "mock",
  testData: true,
  async run() { return buildMockCar(); },
});

/**
 * Real AI: the TRELLIS Space (https://huggingface.co/spaces/JeffreyXiang/TRELLIS). The free Space queues, sleeps and
 * sometimes breaks: when it fails you get a clear error, never a fake model.
 * `clientFactory(space, token)` -> { client, handleFile } is injectable for tests; the default uses @gradio/client.
 */
export function trellisProvider({ space = "JeffreyXiang/TRELLIS", token, clientFactory, fetchImpl = fetch, extraHosts = [] } = {}) {
  const connect = clientFactory ?? (async (id, hf_token) => {
    let lib;
    try { lib = await import("@gradio/client"); }
    catch { throw new HttpError(501, "The TRELLIS provider needs the package @gradio/client. Run: npm install @gradio/client"); }
    return { client: await lib.Client.connect(id, hf_token ? { hf_token } : {}), handleFile: lib.handle_file };
  });
  return {
    name: "trellis",
    testData: false,
    async run(image, { signal } = {}) {
      let session;
      try { session = await connect(space, token); }
      catch (e) {
        if (e instanceof HttpError) throw e;
        throw new HttpError(503, `Cannot reach the Space "${space}" (it may be sleeping or broken). ${e instanceof Error ? e.message : e}`);
      }
      const { client, handleFile } = session;
      const call = async (endpoint, args) => {
        if (signal?.aborted) throw new HttpError(504, "Timed out");
        try { return (await client.predict(endpoint, args)).data; }
        catch (e) { throw new HttpError(502, `${space} ${endpoint} failed: ${e instanceof Error ? e.message : JSON.stringify(e)}`); }
      };
      const blob = new Blob([image.bytes], { type: image.mime });
      await call("/start_session", {});
      const pre = await call("/preprocess_image", { image: handleFile(blob) });
      await call("/image_to_3d", {
        image: pre?.[0] ?? handleFile(blob), multiimages: [], seed: 0,
        ss_guidance_strength: 7.5, ss_sampling_steps: 12, slat_guidance_strength: 3, slat_sampling_steps: 12, multiimage_algo: "stochastic",
      });
      const out = await call("/extract_glb", { mesh_simplify: 0.95, texture_size: 1024 });
      const file = out?.find((d) => d && typeof d === "object" && /\.glb(\?|$)/i.test(d.path ?? d.url ?? "")) ?? out?.[1];
      const url = file?.url ?? (file?.path && session.client.config?.root ? `${session.client.config.root}/file=${file.path}` : null);
      if (!url) throw new HttpError(502, `${space} did not return a model file`);
      if (!isAllowedModelUrl(url, extraHosts)) throw new HttpError(502, "The Space returned a model link from an unexpected host");
      const res = await fetchImpl(url, { signal });
      if (!res.ok) throw new HttpError(502, `Cannot download the model (${res.status})`);
      return Buffer.from(await res.arrayBuffer());
    },
  };
}

/* ---------------- request handling ---------------- */
async function* limited(stream, max) {
  let n = 0;
  for await (const chunk of stream) {
    n += chunk.length;
    if (n > max) throw new HttpError(413, `The upload is larger than ${Math.round(max / 1048576)} MB`);
    yield chunk;
  }
}

async function readImage(req) {
  const type = req.headers["content-type"] ?? "";
  if (!type.startsWith("multipart/form-data")) throw new HttpError(415, "Send the picture as multipart/form-data in the field \"image\"");
  const body = Readable.toWeb(Readable.from(limited(req, MAX_IMAGE_BYTES + 64 * 1024)));
  let form;
  try { form = await new Request("http://local/", { method: "POST", headers: { "content-type": type }, body, duplex: "half" }).formData(); }
  catch (e) { throw e instanceof HttpError ? e : (e?.cause instanceof HttpError ? e.cause : new HttpError(400, "The upload could not be read")); }
  const file = form.get("image");
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") throw new HttpError(400, "No picture found in the field \"image\"");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!bytes.length) throw new HttpError(400, "The picture is empty");
  if (bytes.length > MAX_IMAGE_BYTES) throw new HttpError(413, `The picture is larger than ${MAX_IMAGE_BYTES / 1048576} MB`);
  const mime = sniffImage(bytes);
  if (!mime) throw new HttpError(415, "Only PNG, JPEG and WebP pictures are accepted");
  return { bytes, mime };
}

/**
 * Returns a (req, res) handler. One model is made at a time, so a free Space is not flooded.
 * options: provider, longest (metres, scale the longest side), saveDir (null = do not save), timeoutMs, secrets (hidden in errors).
 */
export function createHandler({ provider, longest, saveDir = null, timeoutMs = 420000, secrets = [] }) {
  let busy = false;
  const hide = (text) => secrets.filter(Boolean).reduce((t, s) => t.split(s).join("***"), String(text));

  return async (req, res) => {
    const origin = req.headers.origin;
    const cors = origin && LOCAL_ORIGIN.test(origin)
      ? { "Access-Control-Allow-Origin": origin, "Access-Control-Expose-Headers": "X-Provider, X-Test-Data, X-Model-Size", Vary: "Origin" } : {};
    const send = (status, body, headers = {}) => { res.writeHead(status, { ...cors, ...headers }); res.end(body); };
    const fail = (status, message) => send(status, JSON.stringify({ error: hide(message) }), { "Content-Type": "application/json; charset=utf-8" });

    try {
      const path = new URL(req.url ?? "/", "http://local").pathname;
      if (path === "/health") return send(200, JSON.stringify({ ok: true, provider: provider.name, testData: provider.testData }), { "Content-Type": "application/json" });
      if (path !== "/api/image-to-3d" && path !== "/") throw new HttpError(404, "Not found");
      if (req.method === "OPTIONS") return send(204, "", { "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
      if (req.method !== "POST") throw new HttpError(405, "Use POST");
      if (origin && !LOCAL_ORIGIN.test(origin)) throw new HttpError(403, "Only pages on this computer may use this server");
      if (busy) throw new HttpError(429, "Another model is being generated. Try again when it finishes.");

      const image = await readImage(req);
      busy = true;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let glb;
      try {
        glb = await Promise.race([
          provider.run(image, { signal: controller.signal }),
          new Promise((_, reject) => controller.signal.addEventListener("abort", () => reject(new HttpError(504, "The AI took too long and was stopped")))),
        ]);
      } finally { clearTimeout(timer); busy = false; }

      let model;
      try { model = parseGlb(glb); } catch { throw new HttpError(502, "The provider did not return a valid .glb file"); }
      const problems = validateGlb(model.json, model.bin);
      if (problems.length) throw new HttpError(502, "The provider returned a broken .glb: " + problems[0]);
      const size = fitGlb(model.json, { longest });
      const out = size ? buildGlb(model.json, model.bin) : glb;

      if (saveDir) {
        mkdirSync(saveDir, { recursive: true });
        writeFileSync(join(saveDir, `${new Date().toISOString().replace(/[:.]/g, "-")}-${provider.name}.glb`), out);
      }
      send(200, out, {
        "Content-Type": "model/gltf-binary", "Content-Length": out.length, "Cache-Control": "no-store",
        "X-Provider": provider.name, "X-Test-Data": String(provider.testData), ...(size ? { "X-Model-Size": size.map((v) => v.toFixed(2)).join("x") } : {}),
      });
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      fail(status, e instanceof HttpError ? e.message : "Unexpected server error");
      if (!(e instanceof HttpError)) console.error(hide(e instanceof Error ? e.stack : e));
    }
  };
}

/* ---------------- start from the command line ---------------- */
function main() {
  const env = process.env, name = env.I23D_PROVIDER ?? "mock";
  const provider = name === "trellis" ? trellisProvider({ space: env.HF_SPACE || undefined, token: env.HF_TOKEN }) : mockProvider();
  if (!["mock", "trellis"].includes(name)) throw new Error(`I23D_PROVIDER must be mock or trellis, not "${name}"`);
  const save = env.I23D_SAVE_DIR ?? "exports/image-to-3d";
  const handler = createHandler({
    provider, longest: env.I23D_LONGEST_M ? Number(env.I23D_LONGEST_M) : undefined,
    saveDir: save === "off" ? null : resolve(save), timeoutMs: Number(env.I23D_TIMEOUT_S ?? 420) * 1000, secrets: [env.HF_TOKEN],
  });
  const port = Number(env.PORT ?? 8787), host = env.HOST ?? "127.0.0.1";
  http.createServer(handler).listen(port, host, () => {
    console.log(`image-to-3d on http://${host}:${port}/api/image-to-3d   provider: ${provider.name}`);
    if (provider.testData) console.log("NOTE: the mock provider returns a TEST placeholder car, not a model of your picture.");
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (e) { console.error("error: " + (e instanceof Error ? e.message : e)); process.exit(1); }
}
