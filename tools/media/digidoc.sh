#!/bin/bash
# RIA DigiDoc signing (screen recording, live data) and Print in City (phone shots)
# → full-screen stills below the status bar, as WebP.
# Blurred: the CAN on the signing form, the personal code in the signature
# list (also showing through the dimmed success sheet). Boxes: x:y:w:h, source px.
set -euo pipefail
cd "${1:-$(cd "$(dirname "$0")/../.." && pwd)}"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
still() { # input seek crop scale out boxes
  local in="$1" ss="$2" crop="$3" scale="$4" out="$5" boxes="$6" fc="[0:v]null[base0]" i=0 prev=base0
  for b in $boxes; do IFS=: read -r x y w h <<< "$b"; i=$((i+1))
    fc="$fc;[0:v]crop=$w:$h:$x:$y,boxblur=luma_radius=24:luma_power=3:chroma_radius=10:chroma_power=3[r$i];[$prev][r$i]overlay=$x:${y}[base$i]"; prev=base$i; done
  if [ -n "$ss" ]; then
    ffmpeg -v error -y -ss "$ss" -i "$in" -frames:v 1 -filter_complex "$fc;[$prev]crop=$crop,scale=$scale:-2[v]" -map "[v]" -update 1 "$tmp/x.png"
  else
    ffmpeg -v error -y -i "$in" -filter_complex "$fc;[$prev]crop=$crop,scale=$scale:-2[v]" -map "[v]" -update 1 "$tmp/x.png"
  fi
  cwebp -quiet -q 72 "$tmp/x.png" -o "media/$out.webp"
}
DD="raw/ScreenRecording_11-07-2026 12-02-07_1.MP4"
C=886:1816:0:104
CAN="60:676:210:88"
CODE="428:880:270:72"
still "$DD" 0.5  $C 540 digidoc-1 ""
still "$DD" 5.5  $C 540 digidoc-2 ""
still "$DD" 20.2 $C 540 digidoc-3 "$CAN"
still "$DD" 21.5 $C 540 digidoc-4 ""
still "$DD" 25   $C 540 digidoc-5 ""
still "$DD" 28.5 $C 540 digidoc-6 ""
still "$DD" 30   $C 540 digidoc-7 "$CODE"
still "$DD" 33   $C 540 digidoc-8 "$CODE"
still raw/IMG_1083.PNG "" 1125:2304:0:132 540 printincity-1 ""
still raw/IMG_1084.PNG "" 1125:2304:0:132 540 printincity-2 ""
