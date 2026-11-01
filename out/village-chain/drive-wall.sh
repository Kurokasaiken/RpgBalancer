#!/bin/bash
cd "$(dirname "$0")/../.."
source ~/.nvm/nvm.sh >/dev/null 2>&1; nvm use >/dev/null 2>&1
CHAT=https://gemini.google.com/app/8dc5c68940c87647
run() {
  echo "=== $1 ==="
  timeout 300 node scripts/gen-mappa2-sprite.mjs --chat $CHAT --ref "out/village-chain/$2" --prompt "out/village-chain/prompts/$3" --out "out/village-chain/$1" --timeout 240 2>&1 | tail -3
}
run w-none-none palisade-0.png w01-wall-none.txt
run w-wood-none w-none-none-0.png w02-w-wood-none.txt
run w-none-wood w-none-none-0.png w03-w-none-wood.txt
run w-wood-wood w-wood-none-0.png w04-w-wood-wood.txt
run w-stone-none w-wood-none-0.png w05-w-stone-none.txt
run w-none-stone w-none-wood-0.png w06-w-none-stone.txt
run w-wood-stone w-wood-wood-0.png w07-w-wood-stone.txt
run w-stone-wood w-wood-wood-0.png w08-w-stone-wood.txt
run w-stone-stone w-wood-wood-0.png w09-w-stone-stone.txt
echo ALL_DONE
