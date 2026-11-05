#!/bin/bash
cd /Users/faustoboni/progetti_personali/RPG; export PATH=$HOME/.nvm/versions/node/v22.23.1/bin:$PATH
D=.mw/specs/hud-real/resources; touch $D/seen.sha
while pgrep -f "hud-real/crest2/run.sh" >/dev/null; do sleep 20; done
for k in left mid right; do for n in 1 2; do
  echo "[$(date +%T)] $k-$n"
  node scripts/gen-mappa2-sprite.mjs --ref $D/design-$k.png --ref $D/material-strip.png --prompt $D/prompt-$k.txt --out $D/gen/$k-$n --timeout 300 --close-tab > $D/gen/$k-$n.log 2>&1; ec=$?; echo "  exit $ec"
  [ $ec -eq 3 ] || [ $ec -eq 5 ] && { echo stop; exit 0; }
  [ $ec -eq 4 ] && { echo "stop (no image)"; exit 0; }
  f=$D/gen/$k-$n-0.png; h=$(shasum -a 256 $f | cut -c1-64); grep -q $h $D/seen.sha && { echo DUP; rm $f; } || echo $h >> $D/seen.sha
  node scripts/hud-real/quota-runner.mjs spend first --component C2 --zone res-$k --variant $n --file $k-$n-0.png >/dev/null 2>&1; sleep 12
done; done; echo done
