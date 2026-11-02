#!/bin/bash
cd "$(dirname "$0")/../.."
source ~/.nvm/nvm.sh >/dev/null 2>&1; nvm use >/dev/null 2>&1
CHAT=https://gemini.google.com/app/8dc5c68940c87647
run() { echo "=== $1 ==="; timeout 300 node scripts/gen-mappa2-sprite.mjs --chat $CHAT --ref "out/village-chain/$2" --prompt "out/village-chain/prompts/$3" --out "out/village-chain/$1" --timeout 240 2>&1 | tail -3; }
run c-wall cottages-0.png x02-c-wall.txt
run s-palisade straw-0.png x03-s-palisade.txt
run s-wall straw-0.png x04-s-wall.txt
echo ALL_DONE
