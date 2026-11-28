import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { parseGlb, validateGlb } from "../scripts/glb-rig-tool.mjs";
import { buildMockCar } from "../server/mock-glb.mjs";
import { bounds, sizeOf, fitGlb } from "../server/glb-fit.mjs";
import { createHandler, mockProvider, trellisProvider, sniffImage, isAllowedModelUrl, MAX_IMAGE_BYTES } from "../server/image-to-3d.mjs";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1]);

const listen = (handler) => new Promise((resolve) => {
  const server = http.createServer(handler);
  server.listen(0, "127.0.0.1", () => resolve({ server, url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) }));
});
const upload = (url, bytes, { type = "image/png", name = "x.png", field = "image", headers = {} } = {}) => {
  const form = new FormData();
  form.append(field, new Blob([bytes], { type }), name);
  return fetch(url + "/api/image-to-3d", { method: "POST", body: form, headers });
};

test("the real type of a picture comes from its bytes, not its name", () => {
  assert.equal(sniffImage(PNG), "image/png");
  assert.equal(sniffImage(JPG), "image/jpeg");
  assert.equal(sniffImage(Buffer.from("RIFF\0\0\0\0WEBPVP8 ")), "image/webp");
  assert.equal(sniffImage(Buffer.from("MZ this is a program, not a picture")), null);
  assert.equal(sniffImage(Buffer.alloc(0)), null);
});

test("the mock car is a valid GLB, on the ground, and labelled as test data", () => {
  const { json, bin } = parseGlb(buildMockCar());
  assert.deepEqual(validateGlb(json, bin), []);
  assert.equal(json.asset.extras.testData, true);
  assert.match(json.nodes[0].name, /TEST_PLACEHOLDER/);
  const b = bounds(json);
  assert.ok(Math.abs(b.min[1]) < 1e-6, "wheels touch y = 0");
});

test("fitGlb scales the longest side, stands the model on the floor and centres it", () => {
  const { json, bin } = parseGlb(buildMockCar());
  const size = fitGlb(json, { longest: 4 });
  assert.ok(Math.abs(Math.max(...size) - 4) < 1e-6);
  const b = bounds(json);
  assert.ok(Math.abs(b.min[1]) < 1e-6);
  assert.ok(Math.abs(b.min[0] + b.max[0]) < 1e-6 && Math.abs(b.min[2] + b.max[2]) < 1e-6, "centred");
  assert.ok(Math.abs(Math.max(...sizeOf(b)) - 4) < 1e-6);
  assert.deepEqual(validateGlb(json, bin), []);
  assert.equal(fitGlb({ nodes: [{}], scenes: [{ nodes: [0] }] }), null, "nothing to fit");
});

test("POST a picture: a valid GLB comes back, marked as test data", async () => {
  const s = await listen(createHandler({ provider: mockProvider(), longest: 4.8 }));
  try {
    const r = await upload(s.url, PNG);
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("content-type"), "model/gltf-binary");
    assert.equal(r.headers.get("x-test-data"), "true");
    assert.equal(r.headers.get("x-provider"), "mock");
    const { json, bin } = parseGlb(Buffer.from(await r.arrayBuffer()));
    assert.deepEqual(validateGlb(json, bin), []);
    assert.ok(Math.abs(Math.max(...sizeOf(bounds(json))) - 4.8) < 1e-3);
    assert.match(r.headers.get("x-model-size"), /^\d+\.\d\dx\d+\.\d\dx4\.80$/);
  } finally { await s.close(); }
});

test("bad requests get a clear JSON error and never a model", async () => {
  const s = await listen(createHandler({ provider: mockProvider() }));
  try {
    const cases = [
      ["wrong method", fetch(s.url + "/api/image-to-3d"), 405],
      ["wrong path", fetch(s.url + "/secret", { method: "POST" }), 404],
      ["not multipart", fetch(s.url + "/api/image-to-3d", { method: "POST", body: "hello" }), 415],
      ["not a picture (named .png)", upload(s.url, Buffer.from("MZ not a picture"), { name: "evil.png" }), 415],
      ["empty picture", upload(s.url, Buffer.alloc(0)), 400],
      ["wrong field", upload(s.url, PNG, { field: "file" }), 400],
      ["too big", upload(s.url, Buffer.concat([PNG, Buffer.alloc(MAX_IMAGE_BYTES)])), 413],
      ["foreign web page", upload(s.url, PNG, { headers: { Origin: "https://evil.example" } }), 403],
    ];
    for (const [label, req, status] of cases) {
      const r = await req;
      assert.equal(r.status, status, label);
      assert.match(r.headers.get("content-type"), /json/, label);
      assert.ok((await r.json()).error, label);
    }
  } finally { await s.close(); }
});

test("only pages on this computer get CORS permission", async () => {
  const s = await listen(createHandler({ provider: mockProvider() }));
  try {
    const ok = await upload(s.url, PNG, { headers: { Origin: "http://localhost:5173" } });
    assert.equal(ok.headers.get("access-control-allow-origin"), "http://localhost:5173");
    const pre = await fetch(s.url + "/api/image-to-3d", { method: "OPTIONS", headers: { Origin: "http://127.0.0.1:5173" } });
    assert.equal(pre.status, 204);
    const none = await upload(s.url, PNG);
    assert.equal(none.headers.get("access-control-allow-origin"), null);
  } finally { await s.close(); }
});

test("a provider that returns rubbish is a 502, and one that hangs is a 504", async () => {
  const broken = { name: "broken", testData: false, run: async () => Buffer.from("not a glb at all") };
  const slow = { name: "slow", testData: false, run: () => new Promise(() => {}) };
  const a = await listen(createHandler({ provider: broken })), b = await listen(createHandler({ provider: slow, timeoutMs: 50 }));
  try {
    assert.equal((await upload(a.url, PNG)).status, 502);
    assert.equal((await upload(b.url, PNG)).status, 504);
    assert.equal((await upload(b.url, PNG)).status, 504, "the server is free again after a timeout");
  } finally { await a.close(); await b.close(); }
});

test("only one model at a time", async () => {
  let release;
  const gate = new Promise((r) => { release = r; });
  const provider = { name: "gated", testData: true, run: async () => { await gate; return buildMockCar(); } };
  const s = await listen(createHandler({ provider }));
  try {
    const first = upload(s.url, PNG);
    await new Promise((r) => setTimeout(r, 100));
    assert.equal((await upload(s.url, PNG)).status, 429);
    release();
    assert.equal((await first).status, 200);
  } finally { await s.close(); }
});

test("an error message never contains the secret token", async () => {
  const clientFactory = async () => { throw new Error("401 for token hf_SECRET123"); };
  const s = await listen(createHandler({ provider: trellisProvider({ clientFactory, token: "hf_SECRET123" }), secrets: ["hf_SECRET123"] }));
  try {
    const r = await upload(s.url, PNG), text = await r.text();
    assert.equal(r.status, 503);
    assert.ok(text.includes("***") && !text.includes("hf_SECRET123"), text);
  } finally { await s.close(); }
});

test("model links are accepted only from Hugging Face (or a host you allow)", () => {
  assert.ok(isAllowedModelUrl("https://owner-space.hf.space/file=/tmp/a.glb"));
  assert.ok(isAllowedModelUrl("https://huggingface.co/spaces/a/b/file.glb"));
  assert.ok(!isAllowedModelUrl("http://owner.hf.space/a.glb"), "https only");
  assert.ok(!isAllowedModelUrl("https://evil.example/a.glb"));
  assert.ok(!isAllowedModelUrl("https://hf.space.evil.example/a.glb"));
  assert.ok(!isAllowedModelUrl("file:///etc/passwd"));
  assert.ok(isAllowedModelUrl("http://127.0.0.1:9999/a.glb", ["127.0.0.1:9999"]));
});

test("TRELLIS provider calls the Space in the right order and returns the downloaded model", async () => {
  const model = buildMockCar();
  const files = await listen((req, res) => { res.writeHead(200, { "Content-Type": "model/gltf-binary" }); res.end(model); });
  const calls = [];
  const clientFactory = async (space, token) => ({
    handleFile: (b) => ({ handled: b instanceof Blob }),
    client: {
      async predict(endpoint, args) {
        calls.push({ endpoint, args, space, token });
        if (endpoint === "/preprocess_image") return { data: [{ url: "pre.png" }] };
        if (endpoint === "/extract_glb") return { data: [null, { path: "/tmp/model.glb", url: `${files.url}/model.glb` }] };
        return { data: [] };
      },
    },
  });
  const provider = trellisProvider({ space: "owner/space", token: "t", clientFactory, extraHosts: [new URL(files.url).host] });
  const s = await listen(createHandler({ provider }));
  try {
    const r = await upload(s.url, PNG);
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("x-test-data"), "false");
    assert.deepEqual(calls.map((c) => c.endpoint), ["/start_session", "/preprocess_image", "/image_to_3d", "/extract_glb"]);
    assert.ok(calls.every((c) => c.space === "owner/space" && c.token === "t"));
    assert.deepEqual(calls[2].args.image, { url: "pre.png" }, "the preprocessed picture goes to image_to_3d");
    assert.equal(calls[1].args.image.handled, true);
    assert.equal(parseGlb(Buffer.from(await r.arrayBuffer())).json.asset.extras.testData, true);   // (it is our mock bytes, relayed)
  } finally { await s.close(); await files.close(); }
});

test("TRELLIS provider: a sleeping Space, a failing step, and a link to a strange host are clear errors", async () => {
  const run = async (clientFactory, extra = {}) => {
    const s = await listen(createHandler({ provider: trellisProvider({ clientFactory, ...extra }) }));
    try { const r = await upload(s.url, PNG); return { status: r.status, error: (await r.json()).error }; } finally { await s.close(); }
  };
  const asleep = await run(async () => { throw new Error("Space is sleeping"); });
  assert.equal(asleep.status, 503); assert.match(asleep.error, /sleeping or broken/);
  const failing = await run(async () => ({ handleFile: () => ({}), client: { predict: async (e) => { if (e === "/image_to_3d") throw new Error("GPU queue full"); return { data: [] }; } } }));
  assert.equal(failing.status, 502); assert.match(failing.error, /image_to_3d failed: GPU queue full/);
  const strange = await run(async () => ({ handleFile: () => ({}), client: { predict: async (e) => (e === "/extract_glb" ? { data: [null, { url: "https://evil.example/a.glb", path: "a.glb" }] } : { data: [] }) } }));
  assert.equal(strange.status, 502); assert.match(strange.error, /unexpected host/);
  const none = await run(async () => ({ handleFile: () => ({}), client: { predict: async () => ({ data: [] }) } }));
  assert.equal(none.status, 502); assert.match(none.error, /did not return a model/);
});

test("TRELLIS without @gradio/client installed says what to install", async () => {
  const s = await listen(createHandler({ provider: trellisProvider({ space: "owner/space" }) }));
  try {
    const r = await upload(s.url, PNG);
    if (r.status === 501) assert.match((await r.json()).error, /npm install @gradio\/client/);
    else assert.ok([502, 503].includes(r.status), "the package is installed here, so the Space itself failed");
  } finally { await s.close(); }
});
