#!/bin/bash
# G-0 generation probe: waits for the quota reset (18:03 local), then 1 generation with 3 refs + 1 anchored edit.
cd /Users/faustoboni/progetti_personali/RPG
export PATH=$HOME/.nvm/versions/node/v22.23.1/bin:$PATH
OUT=.mw/specs/hud-real/G0/ring/gen
mkdir -p $OUT
TARGET=$(date -j -f "%Y-%m-%d %H:%M:%S" "$(date +%Y-%m-%d) 18:03:00" +%s)
while [ "$(date +%s)" -lt "$TARGET" ]; do sleep 20; done
echo "[$(date +%H:%M:%S)] gen 1 (3 refs)"
node scripts/gen-mappa2-sprite.mjs --ref .mw/specs/hud-real/G0/ring/base-plate.png --ref .mw/specs/hud-real/G0/ring/geometry-guide.png --ref .mw/specs/hud-real/G0/ring/material-ref.png --prompt .mw/specs/hud-real/G0/ring/prompt-1.txt --out $OUT/g1 --timeout 300 > $OUT/g1.log 2>&1
echo "exit $?" >> $OUT/g1.log
CHAT=$(grep -o 'CHAT_URL .*' $OUT/g1.log | tail -1 | awk '{print $2}')
echo "chat: $CHAT"
if [ -n "$CHAT" ] && ls $OUT/g1-0.png >/dev/null 2>&1; then
  sleep 8
  echo "[$(date +%H:%M:%S)] gen 2 (anchored edit in same chat)"
  node scripts/gen-mappa2-sprite.mjs --chat "$CHAT" --prompt .mw/specs/hud-real/G0/ring/prompt-2-edit.txt --out $OUT/g2 --timeout 300 > $OUT/g2.log 2>&1
  echo "exit $?" >> $OUT/g2.log
fi
echo "[$(date +%H:%M:%S)] done"
