#!/bin/bash
cd /Users/faustoboni/progetti_personali/RPG; export PATH=$HOME/.nvm/versions/node/v22.23.1/bin:$PATH
D=.mw/specs/hud-real/emblem/aaa; CHAT=https://gemini.google.com/app/c56228aaf330873e
s () { echo "[$(date +%T)] $1"; node scripts/gen-mappa2-sprite.mjs "${@:3}" --out $D/gen/$1 --timeout 300 > $D/gen/$1.log 2>&1; ec=$?; echo "  exit $ec"
  [ $ec -eq 0 ] && node scripts/hud-real/quota-runner.mjs spend $2 --component C1 --zone emblem --variant $1 --file $1-0.png >/dev/null 2>&1; return $ec; }
s e1 repair --chat $CHAT --prompt $D/edit.txt || exit 0; sleep 10
s e2 repair --chat $CHAT --prompt $D/edit.txt || exit 0; sleep 10
s f1 slack --ref $D/u2.png --prompt $D/fresh.txt --close-tab || exit 0; sleep 10
s f2 slack --ref $D/u2.png --prompt $D/fresh.txt --close-tab
echo done
