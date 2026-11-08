#!/bin/bash
cd /Users/faustoboni/progetti_personali/RPG
LOG=.mw/specs/hud-real/kit/gen/overnight.log
REG=$HOME/.rpg-shutdown/session-registry.json
SID=overnight-hud-gen
hb() { python3 - "$REG" "$SID" "$1" <<'PY'
import json,sys,datetime
reg,sid,state=sys.argv[1],sys.argv[2],sys.argv[3]
try: d=json.load(open(reg))
except: d={"projects":{}}
now=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
d.setdefault('projects',{}).setdefault('RPG',{'status':'active','sessions':{}})
d['projects']['RPG']['sessions'][sid]={'pid':__import__('os').getppid(),'heartbeatAt':now,'state':state,'blockingReason':'overnight hud mockup generation','owner':'devin','ttlSeconds':300}
json.dump(d,open(reg,'w'))
PY
}
hb RUNNING
( while true; do sleep 240; hb RUNNING; done ) & HBLOOP=$!
echo "[$(date)] waiting for quota reset…" >> "$LOG"
now=$(date +%s)
target=$(date -j -f "%Y-%m-%d %H:%M:%S" "$(date +%Y-%m-%d) 01:55:00" +%s 2>/dev/null || date -d "$(date +%Y-%m-%d) 01:55:00" +%s)
[ "$target" -le "$now" ] && target=$((target + 86400))
sleep $((target - now))
echo "[$(date)] quota reset — starting generations" >> "$LOG"
declare -a jobs=("rail-3v|rail-panel-3v" "check-3v|skillcheck-3v" "mobile-3v|mobile-3v")
for entry in "${jobs[@]}"; do
  out="${entry%%|*}"; pr="${entry##*|}"
  echo "[$(date)] === $out ===" >> "$LOG"
  timeout 600 node scripts/gen-mappa2-sprite.mjs --prompt "/tmp/${pr}.txt" --out ".mw/specs/hud-real/kit/gen/${out}" --ref .mw/specs/hud-real/kit/gen/run-3v-0.png --timeout 560 >> "$LOG" 2>&1
done
kill $HBLOOP 2>/dev/null; hb COMPLETED
echo "[$(date)] done" >> "$LOG"
