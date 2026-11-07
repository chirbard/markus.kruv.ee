// Compare decoded RGB pixels, ignoring PNG compression and metadata.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const [, , before, after] = process.argv;
if (!before || !after)
  throw new Error("Usage: node tools/dev/compare.mjs BEFORE AFTER");
const files = (await readdir(before))
  .filter((name) => name.endsWith(".png"))
  .sort();
assert(files.length > 0, "Reference directory contains no screenshots");
const actual = (await readdir(after))
  .filter((name) => name.endsWith(".png"))
  .sort();
assert.deepEqual(actual, files, "Screenshot sets must match");
function decode(path) {
  const result = spawnSync(
    "ffmpeg",
    ["-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    { maxBuffer: 128 * 1024 * 1024 },
  );
  if (result.error || result.status !== 0)
    throw new Error(
      `Cannot decode ${path}: ${result.error ?? result.stderr.toString()}`,
    );
  return result.stdout;
}
let differences = 0;
let totalPixels = 0;
for (const name of files) {
  const a = decode(join(before, name));
  const b = decode(join(after, name));
  assert.equal(a.length, b.length, `${name}: image sizes differ`);
  let pixels = 0;
  let maximum = 0;
  for (let i = 0; i < a.length; i += 3) {
    let changed = false;
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = Math.abs(a[i + channel] - b[i + channel]);
      maximum = Math.max(maximum, delta);
      if (delta) changed = true;
    }
    if (changed) pixels += 1;
  }
  totalPixels += a.length / 3;
  if (pixels) {
    differences += 1;
    console.error(
      `${name}: ${pixels} changed pixels; maximum channel difference ${maximum}/255`,
    );
  }
}
console.log(
  `${files.length} pairs, ${totalPixels} pixels, ${differences} differing images`,
);
assert.equal(differences, 0, "Screenshots must be pixel-identical");
