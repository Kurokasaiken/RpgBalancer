#!/bin/bash
cd /Users/faustoboni/progetti_personali/RPG; export PATH=$HOME/.nvm/versions/node/v22.23.1/bin:$PATH
D=.mw/specs/hud-real/rowmod; touch $D/seen.sha
for n in 1 2 3 4; do
  echo "[$(date +%T)] row-$n"
  node scripts/gen-mappa2-sprite.mjs --ref $D/design.png --ref $D/ring-style.png --prompt $D/prompt.txt --out $D/gen/row-$n --timeout 300 --close-tab > $D/gen/row-$n.log 2>&1; ec=$?; echo "  exit $ec"
  [ $ec -eq 3 ] || [ $ec -eq 5 ] && { echo stop; exit 0; }
  [ $ec -eq 4 ] && { echo "stop (no image)"; exit 0; }
  f=$D/gen/row-$n-0.png; h=$(shasum -a 256 $f | cut -c1-64); grep -q $h $D/seen.sha && { echo DUP; rm $f; } || echo $h >> $D/seen.sha
  node scripts/hud-real/quota-runner.mjs spend first --component C1 --zone rowmod --variant $n --file row-$n-0.png >/dev/null 2>&1; sleep 12
done; echo done
