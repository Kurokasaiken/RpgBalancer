#!/bin/bash
# PLAN-110 E-02 probe, take 2: 4 guided + 2 unguided sends (fresh chat each), originals only,
# dedupe by sha256, ledger via quota-runner, stop at the quota banner (exit 4 = no image).
cd /Users/faustoboni/progetti_personali/RPG
export PATH=$HOME/.nvm/versions/node/v22.23.1/bin:$PATH
D=.mw/specs/hud-real/probe2; OUT=$D/gen; mkdir -p $OUT
touch $D/seen.sha
send () { # $1 label  $2 kind  $3 prompt  $4.. refs
  local label=$1 kind=$2 prompt=$3; shift 3
  local refs=(); for r in "$@"; do refs+=(--ref "$r"); done
  echo "[$(date +%H:%M:%S)] $label ($kind)"
  node scripts/gen-mappa2-sprite.mjs "${refs[@]}" --prompt "$prompt" --out $OUT/$label --timeout 300 --close-tab > $OUT/$label.log 2>&1
  local ec=$?
  echo "  exit $ec"
  if [ $ec -eq 3 ] || [ $ec -eq 5 ]; then echo "  attach/prompt failure — nothing sent, not counted, stopping"; return 4; fi
  if [ $ec -eq 4 ]; then echo "  no image (quota or refusal) — counted, stopping"; node scripts/hud-real/quota-runner.mjs spend $kind --component C1 --zone ring --variant $label --file NONE --model gemini-auto >/dev/null 2>&1; node scripts/hud-real/quota-runner.mjs blocked >/dev/null 2>&1; return 4; fi
  for f in $OUT/$label-[0-9].png; do
    [ -f "$f" ] || continue
    h=$(shasum -a 256 "$f" | cut -c1-64)
    if grep -q "$h" $D/seen.sha; then echo "  DUPLICATE $f — removed"; rm "$f"; else echo "$h $f" >> $D/seen.sha; fi
  done
  local files=$(ls $OUT/$label-[0-9].png 2>/dev/null | xargs -n1 basename | tr '\n' ',')
  node scripts/hud-real/quota-runner.mjs spend $kind --component C1 --zone ring --variant $label --file "$files" --model gemini-auto >/dev/null 2>&1
  return 0
}
G="$D/design.png $D/guide.png $D/material-swatch.png"
U="$D/design.png $D/material-swatch.png"
for i in 1 2 3 4; do send g$i probe $D/prompt-guided.txt $G || exit 0; sleep 15; done
for i in 1 2; do send u$i slack $D/prompt-unguided.txt $U || exit 0; sleep 15; done
echo "[$(date +%H:%M:%S)] done"
