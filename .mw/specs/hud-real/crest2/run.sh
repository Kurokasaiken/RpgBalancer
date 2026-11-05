#!/bin/bash
cd /Users/faustoboni/progetti_personali/RPG; export PATH=$HOME/.nvm/versions/node/v22.23.1/bin:$PATH
D=.mw/specs/hud-real/crest2; touch $D/seen.sha
for k in phoenix chalice eye arcana crown dragon; do
  echo "[$(date +%T)] $k"
  node scripts/gen-mappa2-sprite.mjs --ref $D/material-strip.png --prompt $D/prompt-$k.txt --out $D/gen/$k --timeout 300 --close-tab > $D/gen/$k.log 2>&1; ec=$?; echo "  exit $ec"
  [ $ec -eq 3 ] || [ $ec -eq 5 ] && { echo stop; exit 0; }
  [ $ec -eq 4 ] && { echo "stop (no image)"; exit 0; }
  f=$D/gen/$k-0.png; h=$(shasum -a 256 $f | cut -c1-64); grep -q $h $D/seen.sha && { echo DUP; rm $f; } || echo $h >> $D/seen.sha
  node scripts/hud-real/quota-runner.mjs spend first --component C1 --zone crest2-$k --variant 1 --file $k-0.png >/dev/null 2>&1; sleep 12
done; echo done
