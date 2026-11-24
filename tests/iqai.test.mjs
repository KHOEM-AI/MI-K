import test from "node:test";
import assert from "node:assert/strict";
import {
  IqaiError, ASPECTS, MAX_FRAMES, buildStoryBody, clampNumber, createIqai, findCanvas,
  grabCanvasPng, pickRecorderMime, startRecording,
} from "../src/lib/iqai.mjs";

const realFetch = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = realFetch; });
const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

test("clampNumber clamps and falls back", () => {
  assert.equal(clampNumber("5", 1, 10, 3), 5);
  assert.equal(clampNumber("99", 1, 10, 3), 10);
  assert.equal(clampNumber("-1", 1, 10, 3), 1);
  assert.equal(clampNumber("abc", 1, 10, 3), 3);
});

test("buildStoryBody maps frames, size and one sound", () => {
  const b = buildStoryBody({ imageIds: ["a", "b"], secondsPerScene: 2, aspect: "16:9", sfx: "rain" });
  assert.deepEqual(b.scenes, [{ imageId: "a" }, { imageId: "b" }]);
  assert.equal(b.width, 1280);
  assert.equal(b.height, 720);
  assert.equal(b.sfx, "rain");
  assert.equal(b.audioId, undefined);
  assert.equal(b.transition, "fade");
});

test("buildStoryBody: stored audio wins over sfx, never both", () => {
  const b = buildStoryBody({ imageIds: ["a"], sfx: "rain", audioId: "x" });
  assert.equal(b.audioId, "x");
  assert.equal("sfx" in b, false);
});

test("buildStoryBody rejects bad input", () => {
  assert.throws(() => buildStoryBody({ imageIds: [] }), (e) => e instanceof IqaiError && e.code === "bad_params");
  assert.throws(() => buildStoryBody({ imageIds: Array(MAX_FRAMES + 1).fill("a") }), IqaiError);
  assert.throws(() => buildStoryBody({ imageIds: ["a"], aspect: "4:3" }), /aspect/);
  assert.deepEqual(Object.keys(ASPECTS), ["9:16", "16:9", "1:1"]);
  assert.equal(buildStoryBody({ imageIds: ["a"], secondsPerScene: 500 }).secondsPerScene, 60);
});

test("pickRecorderMime takes the first supported type", () => {
  assert.equal(pickRecorderMime((t) => t === "video/webm"), "video/webm");
  assert.equal(pickRecorderMime(() => false), "");
  assert.equal(pickRecorderMime(() => { throw new Error("x"); }), "");
});

test("findCanvas picks the biggest visible canvas", () => {
  const root = { querySelectorAll: () => [{ clientWidth: 10, clientHeight: 10 }, { clientWidth: 300, clientHeight: 200, id: "big" }, { clientWidth: 0, clientHeight: 0 }] };
  assert.equal(findCanvas(root).id, "big");
  assert.equal(findCanvas({ querySelectorAll: () => [] }), null);
  assert.equal(findCanvas(null), null);
});

test("grabCanvasPng reads the canvas inside the animation frame", async () => {
  const order = [];
  const canvas = { toBlob: (cb, type) => { order.push("toBlob:" + type); cb(new Blob(["x"], { type })); } };
  const blob = await grabCanvasPng(canvas, (cb) => { order.push("raf"); cb(); });
  assert.deepEqual(order, ["raf", "toBlob:image/png"]);
  assert.equal(blob.type, "image/png");
  await assert.rejects(() => grabCanvasPng({ toBlob: (cb) => cb(null) }, (cb) => cb()), /no image/);
});

class FakeMR {
  static isTypeSupported(t) { return t === "video/webm"; }
  constructor(stream, opts) { this.stream = stream; this.opts = opts; this.state = "inactive"; this.mimeType = opts.mimeType; FakeMR.last = this; }
  start() { this.state = "recording"; setTimeout(() => this.ondataavailable({ data: new Blob(["abc"]) }), 0); }
  stop() { this.state = "inactive"; this.onstop(); }
}
const fakeCanvas = () => ({ captureStream: () => ({ getTracks: () => [{ stop() { fakeCanvas.stopped = true; } }] }) });

test("startRecording returns a webm blob when stopped", async () => {
  const rec = startRecording(fakeCanvas(), { seconds: 5, MR: FakeMR });
  await new Promise((r) => setTimeout(r, 5));
  rec.stop();
  const blob = await rec.done;
  assert.equal(blob.type, "video/webm");
  assert.equal(blob.size, 3);
  assert.equal(FakeMR.last.opts.mimeType, "video/webm");
  assert.ok(fakeCanvas.stopped, "tracks are stopped");
});

test("startRecording refuses unsupported browsers", () => {
  assert.throws(() => startRecording({}, { MR: FakeMR }), (e) => e.code === "recording_unsupported");
  assert.throws(() => startRecording(fakeCanvas(), { MR: null }), IqaiError);
});

test("uploadMedia sends the file with an encoded filename", async () => {
  let seen;
  globalThis.fetch = async (url, init) => { seen = { url, init }; return json({ ok: true, data: { id: "m1" }, error: null }, 201); };
  const iq = createIqai("/iqai");
  const r = await iq.uploadMedia(new Blob(["x"], { type: "image/png" }), "ក.png");
  assert.equal(seen.url, "/iqai/media");
  assert.equal(seen.init.method, "POST");
  assert.equal(seen.init.headers["Content-Type"], "image/png");
  assert.equal(seen.init.headers["X-Filename"], encodeURIComponent("ក.png"));
  assert.equal(r.id, "m1");
});

test("sounds reads bare JSON and builds the query", async () => {
  let url;
  globalThis.fetch = async (u) => { url = u; return json({ items: [{ id: "s1", name: "rain" }], total: 1 }); };
  const items = await createIqai("/iqai").sounds("rain & wind");
  assert.equal(url, "/iqai/sounds?limit=100&q=rain+%26+wind");
  assert.equal(items[0].id, "s1");
});

test("story posts JSON and returns the mp4 blob + X-Applied", async () => {
  let seen;
  globalThis.fetch = async (url, init) => {
    seen = { url, init };
    return new Response(new Blob(["mp4"], { type: "video/mp4" }), { status: 200, headers: { "X-Applied": JSON.stringify({ scenes: 2 }) } });
  };
  const body = buildStoryBody({ imageIds: ["a", "b"] });
  const r = await createIqai("/iqai").story(body);
  assert.equal(seen.url, "/iqai/videos/story");
  assert.deepEqual(JSON.parse(seen.init.body), body);
  assert.equal(r.blob.size, 3);
  assert.deepEqual(r.applied, { scenes: 2 });
});

test("editVideo passes only the options given", async () => {
  let url;
  globalThis.fetch = async (u) => { url = u; return new Response(new Blob(["x"])); };
  await createIqai("/iqai").editVideo(new Blob(["v"], { type: "video/webm" }), { speed: 1.5, mute: undefined, trimStart: 0 });
  assert.equal(url, "/iqai/videos/edit?speed=1.5&trimStart=0");
});

test("errors carry the IQ-AI code and message (envelope and bare forms)", async () => {
  globalThis.fetch = async () => json({ ok: false, data: null, error: { code: "ffmpeg_missing", message: "ffmpeg is not installed" } }, 503);
  await assert.rejects(() => createIqai().story({}), (e) => e.status === 503 && e.code === "ffmpeg_missing" && /ffmpeg/.test(e.message));
  globalThis.fetch = async () => json({ error: "IQ-AI route not allowed" }, 403);
  await assert.rejects(() => createIqai().deleteMedia("x"), (e) => e.status === 403 && e.code === "IQ-AI route not allowed");
  globalThis.fetch = async () => new Response("<html>", { status: 502 });
  await assert.rejects(() => createIqai().capabilities(), (e) => e.status === 502 && e.code === "http_502");
});

test("health is false when IQ-AI is down", async () => {
  globalThis.fetch = async () => { throw new Error("ECONNREFUSED"); };
  assert.equal(await createIqai().health(), false);
});
