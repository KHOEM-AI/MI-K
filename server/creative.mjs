import http from "node:http";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync, createReadStream, existsSync } from "node:fs";
import { join } from "node:path";

const PORT = Number(process.env.CREATIVE_PORT || 8788);
const OUT = process.env.CREATIVE_OUT || "public/creative-out";
mkdirSync(OUT, { recursive: true });

const HF_TOKEN = process.env.HF_TOKEN || "";
const HF_2D = process.env.HF_2D_MODEL || "black-forest-labs/FLUX.1-schnell";
const HF_GLB = process.env.HF_GLB_MODEL || "tencent/Hunyuan3D-2";
const I23D_URL = process.env.I23D_URL || "";

async function gen2d(prompt) {
  if (!HF_TOKEN) throw new Error("HF_TOKEN is required (set HF_TOKEN env)");
  const r = await fetch(`https://api-inference.huggingface.co/models/${HF_2D}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: prompt }),
  });
  if (!r.ok) throw new Error(`2D ${r.status}: ${await r.text()}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const name = `2d-${randomUUID()}.png`;
  writeFileSync(join(OUT, name), buf);
  return `/creative-out/${name}`;
}

async function genGlb(imageBase64, prompt) {
  if (I23D_URL) {
    // Convert data URL → Buffer
    const b64 = String(imageBase64).replace(/^data:[^,]+,/, "");
    const bytes = Buffer.from(b64, "base64");
    if (!bytes.length) throw new Error("Empty image");

    // Build multipart/form-data (image-to-3d expects field "image")
    const boundary = "----khoem" + randomUUID().replace(/-/g, "");
    const head = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="image"; filename="input.png"\r\n` +
      `Content-Type: image/png\r\n\r\n`
    );
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([head, bytes, tail]);

    const r = await fetch(`${I23D_URL.replace(/\/$/, "")}/api/image-to-3d`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(body.length),
      },
      body,
    });
    if (!r.ok) throw new Error(`I23D ${r.status}: ${await r.text()}`);

    const buf = Buffer.from(await r.arrayBuffer());
    const name = `glb-${randomUUID()}.glb`;
    writeFileSync(join(OUT, name), buf);
    return {
      glbUrl: `/creative-out/${name}`,
      provider: r.headers.get("x-provider"),
      testData: r.headers.get("x-test-data") === "true",
      modelSize: r.headers.get("x-model-size"),
    };
  }
  if (!HF_TOKEN) throw new Error("HF_TOKEN is required (or set I23D_URL)");
  const bytes = Buffer.from(String(imageBase64).replace(/^data:[^,]+,/, ""), "base64");
  const r = await fetch(`https://api-inference.huggingface.co/models/${HF_GLB}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "image/png" },
    body: bytes,
  });
  if (!r.ok) throw new Error(`GLB ${r.status}: ${await r.text()}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const name = `glb-${randomUUID()}.glb`;
  writeFileSync(join(OUT, name), buf);
  return { glbUrl: `/creative-out/${name}` };
}

function genWorld(prompt) {
  const p = (prompt || "").toLowerCase();
  const ground = /beach|water|ocean|sea|river|lake/.test(p) ? "water"
    : /desert|sand|dune/.test(p) ? "sand"
    : /snow|ice|arctic/.test(p) ? "snow"
    : /mountain|rocky/.test(p) ? "rock"
    : "grass";
  const sky = /night/.test(p) ? "night" : /sunset|dusk/.test(p) ? "sunset" : "day";
  const n = Math.min(24, 4 + (p.match(/,/g) || []).length * 2 +
    (p.match(/tree|house|rock|car|palm/g) || []).length);
  const kinds = ["tree", "rock", "house", "car", "palm"];
  const objects = Array.from({ length: n }, (_, i) => ({
    id: `obj-${i}`,
    kind: kinds[i % kinds.length],
    x: +(Math.cos(i * 1.7) * (3 + i * 0.4)).toFixed(2),
    y: 0,
    z: +(Math.sin(i * 1.7) * (3 + i * 0.4)).toFixed(2),
    scale: +(0.7 + ((i * 37) % 60) / 100).toFixed(2),
  }));
  return { id: `world-${Date.now()}`, prompt, ground, sky, objects };
}

function readJson(req) {
  return new Promise((resolve) => {
    let s = "";
    req.on("data", (c) => (s += c));
    req.on("end", () => { try { resolve(JSON.parse(s || "{}")); } catch { resolve({}); } });
  });
}
function json(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  const url = new URL(req.url, "http://x");
  try {
    if (req.method === "POST" && url.pathname === "/api/creative/2d") {
      const { prompt } = await readJson(req);
      return json(res, 200, { imageUrl: await gen2d(prompt || "abstract") });
    }
    if (req.method === "POST" && url.pathname === "/api/creative/glb") {
      const { image, prompt } = await readJson(req);
      return json(res, 200, await genGlb(image, prompt));
    }
    if (req.method === "POST" && url.pathname === "/api/creative/world") {
      const { prompt } = await readJson(req);
      return json(res, 200, genWorld(prompt));
    }
    if (req.method === "GET" && url.pathname.startsWith("/creative-out/")) {
      const file = join(OUT, url.pathname.split("/").pop());
      if (!existsSync(file)) { res.writeHead(404); return res.end(); }
      res.writeHead(200, {
        "Content-Type": file.endsWith(".glb") ? "model/gltf-binary" : "image/png",
      });
      return createReadStream(file).pipe(res);
    }
    if (url.pathname === "/health") return json(res, 200, { ok: true, port: PORT });
    json(res, 404, { error: "not found" });
  } catch (e) {
    json(res, 500, { error: String(e?.message || e) });
  }
}).listen(PORT, () => console.log(`creative server → http://localhost:${PORT}`));
