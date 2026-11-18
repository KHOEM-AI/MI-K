import test from "node:test";
import assert from "node:assert/strict";
import { ki } from "../src/lib/ki.mjs";

const realFetch = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = realFetch; });

test("ki.saveScan POSTs JSON to /ki/api/scans", async () => {
  let seen;
  globalThis.fetch = async (url, init) => {
    seen = { url, init };
    return new Response(JSON.stringify({ ok: true, count: 1 }), { status: 200 });
  };
  const r = await ki.saveScan({ id: "s1", counts: { car: 1 } });
  assert.equal(seen.url, "/ki/api/scans");
  assert.equal(seen.init.method, "POST");
  assert.deepEqual(JSON.parse(seen.init.body), { id: "s1", counts: { car: 1 } });
  assert.equal(r.count, 1);
});

test("ki.getColors uses GET", async () => {
  let seen;
  globalThis.fetch = async (url, init) => {
    seen = { url, init };
    return new Response(JSON.stringify({ palettes: [] }), { status: 200 });
  };
  await ki.getColors();
  assert.equal(seen.url, "/ki/api/colors");
  assert.equal(seen.init.method, undefined);
});

test("errors include the server message", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "bad scan" }), { status: 400 });
  await assert.rejects(() => ki.saveScan({}), /KI 400: bad scan/);
});
