#!/bin/bash
# TARA demo flow: still frames from the screen recording → page + address bar WebP.
# The dashboard frame blurs the ID code and the id_token (x:y:w:h in source pixels).
set -euo pipefail
cd "${1:-$(cd "$(dirname "$0")/../.." && pwd)}"
IN="raw/ScreenRecording_11-06-2026 19-30-57_1.MP4"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
n=0
for spec in "1.5|" "2.6|" "3.5|" "10.0|" "12.5|98:752:345:60 232:988:600:115"; do
  n=$((n+1)); t=${spec%%|*}; boxes=${spec#*|}
  fc="[0:v]null[base0]"; i=0; prev=base0
  for b in $boxes; do IFS=: read -r x y w h <<< "$b"; i=$((i+1))
    fc="$fc;[0:v]crop=$w:$h:$x:$y,boxblur=luma_radius=24:luma_power=3:chroma_radius=10:chroma_power=3[r$i];[$prev][r$i]overlay=$x:${y}[base$i]"; prev=base$i; done
  ffmpeg -v error -y -ss "$t" -i "$IN" -frames:v 1 -filter_complex "$fc;[$prev]split[p][q];[p]crop=886:1481:0:104,scale=540:-2[page];[q]crop=886:135:0:1585,scale=540:-2[bar]" -map "[page]" -update 1 "$tmp/page.png" -map "[bar]" -frames:v 1 -update 1 "$tmp/bar.png"
  cwebp -quiet -q 72 "$tmp/page.png" -o "media/tara-demo-$n.webp"
  cwebp -quiet -q 72 "$tmp/bar.png" -o "media/tara-demo-$n-bar.webp"
done
