#!/bin/bash
# SummerSwap phone shots → page (below the status bar) as WebP, plus one
# address-bar strip (the URL is the same on every screen, so it stays put).
set -euo pipefail
cd "${1:-$(cd "$(dirname "$0")/../.." && pwd)}"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
cut() { ffmpeg -v error -y -i "$1" -vf "crop=$2,scale=540:-2" -update 1 "$tmp/x.png"; cwebp -quiet -q 72 "$tmp/x.png" -o "media/$3.webp"; }
cut raw/IMG_1092.PNG 1125:1878:0:132 summerswap-1
cut raw/IMG_1094.PNG 1125:1878:0:132 summerswap-2
cut raw/IMG_1093.PNG 1125:1878:0:132 summerswap-3
cut raw/IMG_1092.PNG 1125:176:0:2010 summerswap-bar
