#!/bin/bash
# waits for the Gemini window reset (19:01 local), then 3 sends per band piece
cd /Users/faustoboni/progetti_personali/RPG; export PATH=$HOME/.nvm/versions/node/v22.23.1/bin:$PATH
D=.mw/specs/hud-real/band; touch $D/seen.sha
for z in spine:design-column joint:design-column end:design-end; do p=${z%%:*}; d=${z##*:}; for n in 1 2 3; do
  echo "[$(date +%T)] $p-$n"
  node scripts/gen-mappa2-sprite.mjs --ref $D/$d.png --ref $D/material-strip.png --prompt $D/prompt-$p.txt --out $D/gen/$p-$n --timeout 300 --close-tab > $D/gen/$p-$n.log 2>&1; ec=$?; echo "  exit $ec"
  [ $ec -eq 3 ] || [ $ec -eq 5 ] && { echo stop; exit 0; }
  [ $ec -eq 4 ] && { echo "stop (no image)"; exit 0; }
  f=$D/gen/$p-$n-0.png; h=$(shasum -a 256 $f | cut -c1-64); grep -q $h $D/seen.sha && { echo DUP; rm $f; } || echo $h >> $D/seen.sha
  node scripts/hud-real/quota-runner.mjs spend first --component C1 --zone band-$p --variant $n --file $p-$n-0.png >/dev/null 2>&1; sleep 12
done; done; echo done
