The site has no build step. Edit the component stylesheets linked by
`index.html`; `css/sequences.css` is generated. All commands below run from
the repository root.

```sh
brew install biome ruff shellcheck
python3 tools/seq-css.py
./tools/check.sh
node tools/dev/pointer-check.mjs
node tools/dev/scroll-check.mjs
```

Python 3.14 and a recent Node with built-in WebSocket support are required.
`package.json` declares classic-script semantics so Biome preserves the
browser script's `"use strict"`; there are no npm dependencies or install step.
The dev checks use the installed macOS Google Chrome, isolated temporary
profiles, dynamic debugging ports, assertions and graceful browser shutdown.
Both checks optionally accept a page URL or HTML path as their first argument.
The scroll check preserves the existing rule: the active row stays active
while visible; otherwise the highest visible row becomes active.

Capture and compare a saved reference against the working tree:

```sh
node tools/dev/capture.mjs /path/to/reference/index.html /tmp/reference
node tools/dev/capture.mjs index.html /tmp/current
node tools/dev/capture.mjs /path/to/reference/index.html /tmp/reference layout
node tools/dev/capture.mjs index.html /tmp/current layout
node tools/dev/compare.mjs /tmp/reference /tmp/current
```

The reference directory needs its original styles, script, SVGs and `media/`.
Captures eagerly decode images, stop Chrome's animation clock, and pause/seek
CSS animations at 0, 3000 and 7000ms. Each project starts from a fresh page.
Desktop is 1280x1900; phone is 500x900 and opens projects through row clicks.
The optional `layout` pass captures the full page. Comparison decodes PNGs
with ffmpeg and fails on any pixel difference.

Media scripts live in `tools/media/`. Each defaults to this repository and
accepts an optional repository root as its first argument. They require
ffmpeg and cwebp; `olecus.sh` also uses Node and Google Chrome to render the
Figma SVGs at 390x844 CSS pixels, 2x scale, on #1D1D1D. The map SVG is offset
-2px in both directions to remove its export margin. Temporary files are
cleaned on exit. Scripts replace only their own named outputs; they never
clear the media directory. Keep committed media as the reference: verify
regenerated files in a temporary output directory before replacing them.

`smaller.sh` (ImageMagick and cwebp) writes the `-320`/`-440` copies of the
screens (`-600` for the wide GovSSO shot) that `srcset` offers desktop; run it
after any other media script. Images use `sizes="auto, …"`: Chrome sizes
them from layout, Safari takes the fallback. Phones keep the full files.

`node tools/dev/og-image.mjs` renders `og.png`, the 1200x630 link preview,
from the hero. Re-run it when the hero changes.

CSS responsibilities (and cascade): base, hero, sections, work, tiles,
flow, generated sequences, phone overlay. The flow and overlay components
have separate files to keep every hand-written stylesheet under 300 lines.
The original comments and phone/active-project precedence are preserved.
