#!/bin/bash
# Smaller copies of the committed screens for srcset: desktop shows a phone
# tile at 139-215 CSS px, so 320 and 440 cover 1x and 2x screens; phones keep
# the 540 originals (the full-screen overlay at 3x needs them). Run after any
# other media script has replaced a source. Address-bar strips (a few KB) and
# juurai.webp (shown at ~480 px) have no copies.
set -euo pipefail
cd "${1:-$(cd "$(dirname "$0")/../.." && pwd)}"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
shrink() { # name width
  magick "media/$1.webp" -resize "$2x" "$tmp/x.png"
  cwebp -quiet -q 72 "$tmp/x.png" -o "media/$1-$2.webp"
}
for name in digidoc-1 digidoc-2 digidoc-3 digidoc-4 digidoc-5 digidoc-6 digidoc-7 digidoc-8 \
  eesti-ee eesti-ee-tara politsei politsei-govsso terviseportaal terviseportaal-govsso \
  transpordiamet transpordiamet-govsso tara-demo-1 tara-demo-2 tara-demo-3 tara-demo-4 tara-demo-5 \
  olecus-1 olecus-2 olecus-3 olecus-chrome olecus-map summerswap-1 summerswap-2 summerswap-3 \
  wastelocker printincity-1 printincity-2 rentgo-1 rentgo-2 rentgo-3; do
  shrink "$name" 320
  shrink "$name" 440
done
shrink govsso-sessions-wide 600
