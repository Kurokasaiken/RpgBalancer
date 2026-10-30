# Guida — generare asset per mappa2 con Gemini (pipeline collaudata)

Distillato dai casi riusciti e falliti del 2026-10-29/30. La regola madre:

> **Gemini campiona stile, palette e luce dai pixel che gli dai. Se dipinge
> DENTRO la mappa, l'armonia è gratis. Se dipinge un oggetto isolato su
> magenta destinato alla mappa, regredisce a "asset da gioco" — nitido,
> saturo, cartoon.**

## Quando usare cosa

| Caso | Metodo | Esempio riuscito |
|---|---|---|
| Elemento che deve stare NEL dipinto (villaggio, strutture, zone) | **Region patch**: crop regione → "ridipingi identico, aggiungi X dipinto nel paesaggio" | v3 villaggio, palizzata, stage0 |
| Creature/oggetti isolati, eventi | **Sprite su magenta**: mappa INTERA allegata + "dipinto nello stile della mappa, su #FF00FF" | sirena v5, kraken, nave, specie A1 |
| Varianti della stessa scena | **Edit ancorati** sull'immagine precedente: "tutto identico, cambia solo Y" | stage villaggio, parti nave |
| Più dettaglio per zoom/riuso | **Tavola hi-res**: crop zona + "stessa vista, più dettaglio" | a9-zoneplate (1417×752) |
| Rimuovere contenuto | **Edit sottrattivo**: "identico, elimina X, al suo posto lo stesso prato" | vbase villaggio vuoto |

## Regole che fanno la differenza

1. **Ref sempre la mappa INTERA** (`refs/mappa2-full.png`) quando serve contesto visivo — i crop parziali hanno prodotto rigetti diretti.
2. **Per region patch: mandare il crop esatto della zona** da ridipingere — Gemini tiene il resto e dipinge il nuovo elemento dentro.
3. **Specificare la scala in PIXEL**, non "più piccolo" — "ogni casa ~25px alta, quanto un albero dipinto" funziona; "riduci del 40%" no.
4. **Niente terreno sotto gli sprite** — dirlo esplicitamente ("no ground, no grass, no base") altrimenti dipinge la sua pezza di prato.
5. **Magenta solo per oggetti isolati** — mai per cose che devono fondersi col terreno (prato, sentieri, nebbia: non chiavabili).
6. **Effetti ambientali → procedurali a runtime** (nebbia, spruzzi, ombre, scie): nello sprite resta solo la parte opaca.
7. **Ref allegati ≤ ~400KB** — upload da 7MB falliscono in silenzio.
8. **Un oggetto per generazione** — multi-creatura e strip >7 pose falliscono o ridipinge schede; dividere e assemblare a mano.
9. **Stessa chat per continuità** — le edit ancorate dentro una chat mantengono registro stilistico.
10. **Composito finale**: hi-res → downscale + tone-match (media canali verso il prato di destinazione) + feather ai bordi + ombra di contatto — è così che la v6 si è integrata.

## Anti-pattern (tutti verificati falliti)

- Sprite su magenta piazzati sulla mappa → "adesivo" (cluster v2)
- Ridimensionare pezze di terreno dipinto → "toppino" visibile
- Edit ancorati per rimpicciolire → non scende sotto ~10%/volta
- Diff-keying tra due ridipinture (originale vs edit) → non allineate, matte sporca
- Chiedere "armonioso" senza dare la mappa → ignora il vincolo

## Prerequisiti runtime

- Canary avviato con profilo shared: `open -g -n -a "Google Chrome Canary" --args --remote-debugging-port=9222 --user-data-dir=<mind-weaver>/.mw/providers/profiles/shared`
- Runner: `node scripts/gen-mappa2-sprite.mjs --chat <url> --ref <img> --prompt <file.txt> --out out/<nome> --timeout 240`
- Esce `CHAT_URL`, output in `out/`; review page su `http://127.0.0.1:8611/context/research/2026-10-29-mappa2-sprite-pilot/` (server: `python3 -m http.server 8611 --bind 127.0.0.1` dalla root del repo)
