#!/bin/bash
# Phone shots → page (blurred, below the status bar) + address bar strip, as WebP.
# Desktop shot → blurred, cropped to the window. Boxes are x:y:w:h in source pixels.
set -euo pipefail
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
cut() {
  local in="$1" out="$2" boxes="$3" crop="$4" scale="$5" fc="[0:v]null[base0]" i=0 prev=base0
  for b in $boxes; do IFS=: read -r x y w h <<< "$b"; i=$((i+1))
    fc="$fc;[0:v]crop=$w:$h:$x:$y,boxblur=luma_radius=20:luma_power=3:chroma_radius=10:chroma_power=3[r$i];[$prev][r$i]overlay=$x:${y}[base$i]"; prev=base$i; done
  ffmpeg -v error -y -i "$in" -filter_complex "$fc;[$prev]crop=$crop,scale=$scale:-2[v]" -map "[v]" -update 1 "$tmp/x.png"
  cwebp -quiet -q 72 "$tmp/x.png" -o "$out"
}
phone() { # in name boxes
  cut "$1" "media/$2.webp" "$3" 1125:1878:0:132 540
  cut "$1" "media/$2-bar.webp" "" 1125:176:0:2010 540
}
cd "${1:-$(cd "$(dirname "$0")/../.." && pwd)}"
phone raw/IMG_1075.PNG eesti-ee ""
phone raw/IMG_1076.PNG eesti-ee-tara ""
phone raw/IMG_1077.PNG politsei ""
phone raw/IMG_1078.PNG politsei-govsso "40:1376:470:68 40:1520:340:72"
phone raw/IMG_1079.PNG terviseportaal ""
phone raw/IMG_1080.PNG terviseportaal-govsso "40:1481:470:68 40:1624:330:70"
phone raw/IMG_1081.PNG transpordiamet ""
phone raw/IMG_1082.PNG transpordiamet-govsso "40:1543:470:68 40:1688:340:70"
cut "raw/Screenshot 2026-11-06 at 19.49.28.png" media/govsso-sessions-wide.webp "580:820:790:245" 2966:1850:140:100 1200
