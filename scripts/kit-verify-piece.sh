#!/usr/bin/env bash
# kit-verify-piece — PLAN-109 T-2 runner: verify + compare sheet for one piece.
# Usage: scripts/kit-verify-piece.sh <ID> [v1,v2,...]   (labels = dirs under gen/<ID>/)
set -euo pipefail
cd "$(dirname "$0")/.."
ID="$1"; LABELS="${2:-v1,v2,v3,v4}"
KIT=".mw/specs/hud-zanara/kit"

# kind | real-h | box   (PLAN-109 real preview heights, updated scope)
case "$ID" in
  K2)   KIND=plaque;    RH=44;  BOX=340x140 ;;
  K3)   KIND=vtile;     RH=62;  BOX=120x240 ;;
  K4)   KIND=sheet;     RH=24;  BOX=340x220 ;;
  K5)   KIND=ring-full; RH=64;  BOX=200x200 ;;
  K6)   KIND=plaque;    RH=60;  BOX=140x240 ;;
  K7)   KIND=plaque;    RH=78;  BOX=340x200 ;;
  K8)   KIND=plaque;    RH=88;  BOX=340x160 ;;
  K9)   KIND=plaque;    RH=30;  BOX=200x120 ;;
  K10)  KIND=plaque;    RH=300; BOX=200x260 ;;
  K11)  KIND=tile;      RH=48;  BOX=200x200 ;;
  K12)  KIND=tile;      RH=48;  BOX=200x200 ;;
  K13)  KIND=ring-full; RH=110; BOX=200x240 ;;
  K14a) KIND=ring-full; RH=64;  BOX=200x200 ;;
  K14b) KIND=plaque;    RH=50;  BOX=100x240 ;;
  K15)  KIND=sheet;     RH=24;  BOX=340x220 ;;
  K16a) KIND=plaque;    RH=96;  BOX=160x200 ;;
  K16b) KIND=plaque;    RH=96;  BOX=160x200 ;;
  K17)  KIND=plaque;    RH=150; BOX=160x260 ;;
  *) echo "unknown piece $ID" >&2; exit 2 ;;
esac

IMGS=()
IFS=',' read -ra LS <<< "$LABELS"
for L in "${LS[@]}"; do
  f="$KIT/gen/$ID/$L/img-0.png"
  [ -f "$f" ] && IMGS+=("$f") || echo "WARN missing $f" >&2
done
[ ${#IMGS[@]} -eq 0 ] && { echo "no images for $ID"; exit 3; }
node scripts/kit-piece-verify.mjs --kind "$KIND" --real-h "$RH" --box "$BOX" \
  --sheet "$KIT/gen/$ID/$ID-compare.png" --alpha-dir "$KIT/gen/$ID" \
  --labels "$LABELS" "${IMGS[@]}"
