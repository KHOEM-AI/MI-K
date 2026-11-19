import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Karaoke variants are available in the 3D palette", () => {
  const source = readFileSync(
    new URL("../src/components/studioConstants.ts", import.meta.url),
    "utf8"
  );

  const expected = [
    ["Karaoke Premium", "karaoke_premium"],
    ["Karaoke VIP", "karaoke_vip"],
    ["Karaoke Standard", "karaoke_standard"],
    ["Karaoke Full", "karaoke_full"],
  ];

  for (const [name, shape] of expected) {
    assert.match(
      source,
      new RegExp(
        `\\{\\s*name:\\s*"${name}",\\s*shape:\\s*"${shape}"\\s*\\}`
      ),
      `${shape} should exist in presets`
    );
  }
});
