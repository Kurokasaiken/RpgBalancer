#!/bin/bash
cd "$(dirname "$0")/../.."
source ~/.nvm/nvm.sh >/dev/null 2>&1; nvm use >/dev/null 2>&1
CHAT=https://gemini.google.com/app/8dc5c68940c87647
run() { # name ref prompt
  echo "=== $1 ==="
  timeout 300 node scripts/gen-mappa2-sprite.mjs --chat $CHAT --ref "out/village-chain/$2" --prompt "out/village-chain/prompts/$3" --out "out/village-chain/$1" --timeout 240 2>&1 | tail -3
}
run p-wood-none palisade-0.png p06-p-wood-none.txt
run p-none-wood palisade-0.png p07-p-none-wood.txt
run p-wood-wood p-wood-none-0.png p08-p-wood-wood.txt
run p-stone-none p-wood-none-0.png p09-p-stone-none.txt
run p-none-stone p-none-wood-0.png p10-p-none-stone.txt
run p-wood-stone p-wood-wood-0.png p11-p-wood-stone.txt
run p-stone-wood p-wood-wood-0.png p12-p-stone-wood.txt
run p-stone-stone p-wood-wood-0.png p13-p-stone-stone.txt
echo ALL_DONE
