#!/bin/bash
# WasteLocker site shot → one still, cropped at the address bar like the TARA tiles.
set -euo pipefail
cd "${1:-$(cd "$(dirname "$0")/../.." && pwd)}"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
ffmpeg -v error -y -i raw/IMG_1095.PNG -vf "crop=1125:2054:0:132,scale=540:-2" -update 1 "$tmp/x.png"
cwebp -quiet -q 72 "$tmp/x.png" -o media/wastelocker.webp
