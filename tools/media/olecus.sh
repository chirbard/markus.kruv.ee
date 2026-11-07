#!/bin/bash
# Olecus (3D map screenshot + reel-feed screen recording) and Rent&Go (Figma
# SVG exports) → full-screen stills as WebP. The SVGs are first rendered to
# PNG by headless Chrome at 390x844 CSS px, 2x, on the app's dark background.
# The exported map has a 2px margin, cropped by the renderer. No personal data.
set -euo pipefail
script_dir=$(cd "$(dirname "$0")" && pwd)
cd "${1:-$(cd "$(dirname "$0")/../.." && pwd)}"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
rendered="$tmp"
for name in welcome "email login" info_3_right; do
  offset=0
  if [ "$name" = info_3_right ]; then offset=-2; fi
  node "$script_dir/../dev/render-svg.mjs" "raw/$name.svg" "$rendered/$name.png" "$offset"
done
still() { # input seek crop out
  if [ -n "$2" ]; then
    ffmpeg -v error -y -ss "$2" -i "$1" -frames:v 1 -vf "crop=$3,scale=540:-2" -update 1 "$tmp/x.png"
  else
    ffmpeg -v error -y -i "$1" -vf "crop=$3,scale=540:-2" -update 1 "$tmp/x.png"
  fi
  cwebp -quiet -q 72 "$tmp/x.png" -o "media/$4.webp"
}
OL="raw/ScreenRecording_11-07-2026 12-56-32_1.MP4"
# The map is its own still tile. The reel is cut in two: content above
# source y 1470 (it changes per screen) and the app nav + browser bar below
# it down to the address bar (one image, it stays put while the next
# listing slides up). Safari's toolbar and the home indicator are cut, as on TARA.
P=886:1366:0:104
still raw/IMG_1090.PNG "" 1125:2054:0:132 olecus-map
still "$OL" 3    $P olecus-1
still "$OL" 11   $P olecus-2
still "$OL" 15.5 $P olecus-3
still "$OL" 3    886:255:0:1470 olecus-chrome
still "$rendered/welcome.png" "" 780:1688:0:0 rentgo-1
still "$rendered/email login.png" "" 780:1688:0:0 rentgo-2
still "$rendered/info_3_right.png" "" 780:1688:0:0 rentgo-3
