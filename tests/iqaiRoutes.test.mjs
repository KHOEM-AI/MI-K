import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedIqaiRoute as ok } from "../src/lib/iqaiRoutes.mjs";

test("allowed IQ-AI routes", () => {
  assert.ok(ok("GET", "/capabilities"));
  assert.ok(ok("GET", "/health"));
  assert.ok(ok("GET", "/videos/effects"));
  assert.ok(ok("GET", "/sounds?limit=100&q=rain"));
  assert.ok(ok("GET", "/sounds/categories"));
  assert.ok(ok("GET", "/sounds/8f14e45f-ceea-467f-a8a3-5b7a1c2d3e4f/content"));
  assert.ok(ok("GET", "/media/abc-123/content"));
  assert.ok(ok("POST", "/media"));
  assert.ok(ok("POST", "/videos/story"));
  assert.ok(ok("POST", "/videos/edit?speed=1.5"));
  assert.ok(ok("DELETE", "/media/abc-123"));
});

test("everything else is refused", () => {
  assert.ok(!ok("GET", "/media"), "listing the media library is not needed");
  assert.ok(!ok("PATCH", "/sounds/abc"));
  assert.ok(!ok("DELETE", "/sounds/abc"));
  assert.ok(!ok("POST", "/sounds/upload"));
  assert.ok(!ok("POST", "/videos/merge"));
  assert.ok(!ok("POST", "/audio/voice"));
  assert.ok(!ok("GET", "/projects"));
  assert.ok(!ok("GET", "/jobs"));
  assert.ok(!ok("POST", "/media/abc/content"));
});

test("path tricks are refused", () => {
  assert.ok(!ok("GET", "/media/../capabilities/content"));
  assert.ok(!ok("GET", "/sounds/%2e%2e/content"));
  assert.ok(!ok("GET", "/sounds/a/b/content"));
  assert.ok(!ok("DELETE", "/media/a/b"));
  assert.ok(!ok("get", "/capabilities"), "method match is exact");
});
