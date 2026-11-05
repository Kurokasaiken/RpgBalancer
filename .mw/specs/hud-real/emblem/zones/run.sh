#!/bin/bash
cd /Users/faustoboni/progetti_personali/RPG; export PATH=$HOME/.nvm/versions/node/v22.23.1/bin:$PATH
D=.mw/specs/hud-real/emblem/zones; mkdir -p $D/gen; touch $D/seen.sha
for z in dial wing finial pendant; do for n in 1 2; do
  echo "[$(date +%T)] $z-$n"
  node scripts/gen-mappa2-sprite.mjs --ref $D/$z-in.png --prompt $D/$z-prompt.txt --out $D/gen/$z-$n --timeout 300 --close-tab > $D/gen/$z-$n.log 2>&1; ec=$?; echo "  exit $ec"
  if [ $ec -eq 3 ] || [ $ec -eq 5 ]; then echo stop; exit 0; fi
  if [ $ec -eq 4 ]; then node scripts/hud-real/quota-runner.mjs spend first --component C1 --zone emblem-$z --variant $n --file NONE >/dev/null 2>&1; echo "stop (no image)"; exit 0; fi
  f=$D/gen/$z-$n-0.png; h=$(shasum -a 256 $f | cut -c1-64); if grep -q $h $D/seen.sha; then echo "  DUP"; rm $f; else echo "$h" >> $D/seen.sha; fi
  node scripts/hud-real/quota-runner.mjs spend first --component C1 --zone emblem-$z --variant $n --file $z-$n-0.png >/dev/null 2>&1
  sleep 12
done; done; echo done
