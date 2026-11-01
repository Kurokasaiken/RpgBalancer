# Handoff — Villaggio mappa2 (asset + pipeline + stato)

Contesto completo per chi riprende il lavoro sul villaggio di `mappa2`.
Repo: `/Users/faustoboni/progetti_personali/RPG`. Tutto sotto
`context/research/2026-10-29-mappa2-sprite-pilot/` (chiamata `PILOT` sotto).

## 1. Due piste distinte — NON confonderle

**Pista A — Villaggio SULLA MAPPA (`/mappa2-lab`)**: il villaggio è un piccolo
cluster dipinto nel prato della mappa fantasy. Vista aerea obliqua (~45°).
Obiettivo: stage evolutivi + difese componibili.

**Pista B — Villaggio HUD `/game` → tab VILLAGE**: schermata villaggio a
tutta area (vista frontale/eye-level). Obiettivo: "centro città" — piazzole
libere dove il Director assegna un tipo edificio a ognuna (modello B).

Sono immagini, prospettive e pipeline **diverse** — gli asset non si scambiano.

## 2. File canonici e riferimenti

- Ref villaggio CORRETTO (moodboard): `src/assets/mood/rude-beauty/villaggio.png` (3168×1344). Il `.webp` in `public/assets/world/wanderlust/` è lo sprite SBAGLIATO (causa del primo fallimento).
- Mappa intera: `PILOT/refs/mappa2-full.png` (2752×1536); copia leggera `refs/mappa2-full-1600.jpg`.
- Regione "cradle" vuota (senza villaggio): `PILOT/refs/a9-cradle-region.png` — è la regione 900×620 della mappa a offset (750,380).
- Ref compressi per Gemini (upload >400KB fallisce): `refs/*.jpg`.
- Guida pipeline completa: `PILOT/GUIDE.md` — regole operative per Gemini.

## 3. La regola che decide TUTTO

> Gemini campiona stile/palette/luce dai pixel che gli dai.
> - **Dipinto DENTRO la mappa** (region patch, edit ancorato) → armonia gratis.
> - **Oggetto su magenta piazzato sulla mappa** → regredire a "asset pack" nitido/satiro ("ultra-realistico", strade luminose).
> - Magenta OK solo per oggetti isolati/eventi, MAI per cose che fondono col terreno.

Anti-pattern verificati falliti: sprite magenta sulla mappa; pezze di terreno ridimensionate; edit ancorati per rimpicciolire (≤10%/volta); diff-keying tra due ridipinture (non allineate).

## 4. Pista A — asset MAPPA (stato attuale)

### Pack (quello che il runtime carica)
`public/assets/world/mappa2/base/fx/village/`:
- `village.json` — manifest: `zone:{x,y,w,h}` (rect sulla mappa 2752×1536), `stages[]`, `parts{id→file,scale}`, `elements{id→file}` (zone-sized RGBA patches).
- `stage0.webp` — 3 casette + ceppi (region dipinta, ritagliata alla zona).
- `stage1.webp` — 7 casette sotto gli alberi (la "v9", la migliore).
- `stage2.webp` `stage3.webp` `stage4.webp` — palizzata incollata / mura pietra incollate / case pietra → **SUPERATI/RIMOSSI** (difese incollate sono state rifiutate; case pietra "brutte"). Le copie sul disco possono restare come fonte ma `village.json` non le usa più.
- `parts/el-*.png` — **gli elementi VERI** (zone-sized, allineati):
  `el-palizzata.png` (anello pali), `el-muro.png` (anello pietra),
  `el-torre-legno-1/2.png`, `el-torre-pietra-1/2.png`.
- `parts/pal-*.png`, `wall-*.png`, `tower-*.png` — pezzi da foglio parti (segmenti) — **non più usati negli elements** (approccio segmenti = pezzi sparsi, scartato). `ring-pal.png`/`ring-wall.png` (anelli sprite interi su magenta) — anche loro superati dall'approccio patch.

### Sorgenti integrali (da NON toccare, sono le master)
`PILOT/out/`:
- `a9-v9-0.png` — regione 900×620 con villaggio piccolo (scala giusta). **Master stage1.**
- `a9-s0-0.png` — 3 case + ceppi. **Master stage0.**
- `a9-pal2-0.png` — v9 + palizzata + 2 torri legno. **Master per el-palizzata + torri legno.**
- `a9-stone-0.png` — v9 + mura pietra + 2 torri pietra. **Master per el-muro + torri pietra.**
- `a9-v7-0.png` — villaggio a scala media (troppo grande, superato da v9).
- `vbase-0.png` — piastra vuota /game (vedi pista B).
- `bldg-cottage-0/-spr`, `bldg-inn`, `bldg-smithy`, `bldg-tower` — sprite edifici /game.

### Come sono stati fatti (il metodo che FUNZIONA)
1. Crop regione cradle 900×620 (offset 750,380) → Gemini "ridipingi identico + aggiungi villaggio" → `v3` (troppo grande).
2. Edit ancorato sulla regione "case ~25px, sotto gli alberi" → `v9` (scala giusta).
3. Edit ancorato su v9: "+3 case + ceppi / +palizzata+torri / +mura+torri pietra" → `s0`, `pal2`, `stone` — **tutto in una chat per continuità**.
4. **Elementi**: ESTRAZIONE con maschere geometriche dalla versione dipinta (non sprite!): annulus attorno all'anello, rettangoli feather sulle torri → `parts/el-*.png` = patch zone-aligned (allineate per costruzione alla regione).

### Come li usa il runtime
- `src/ui/idleVillage/pixiSpike/villageZoneOverlay.ts` — mount self-contained in `PixiWorldMap.tsx` (solo mappa2). Legge `village.json`, mette gli stage in cross-fade su `zone`, gli `elements` come sprite zone-sized, i `parts` piazzabili manualmente.
- `villageZoneLive` (mutabile): `visible`, `stage` (0..N continuo = cross-fade), `parts[]`, `elements[]` (id attivi), `armed`, `hoverX/Y`, `partsVisible`.
- `src/pages/mappa2-lab.tsx` tab `village`: slider stage (0→1), toggle elementi con **upgrade mutualmente esclusivi** (`palizzata`↔`muro`, `torre-legno-i`↔`torre-pietra-i`).

### Coordinate chiave (mappa 2752×1536)
- Regione cradle (master 900×620): offset `(750,380)`.
- Zona villaggio: SUPERATO — la fonte unica è `public/assets/world/mappa2/base/fx/village/village.json` (PLAN-106).
- Cluster case: ~`(1410,715)` centro.

## 5. Pista B — /game VILLAGE (town-center)

- **Piastra base**: `public/assets/village/base-plate.png` = **originale villaggio.png pixel-identico** fuori dai footprint + riempimenti pittorici (composita da `vbase-exact-0.png` + clean pass). NON usare la vecchia `vbase-0.png` (layout diverso).
- **Piazzole**: `src/ui/idleVillage/config/villageDirectorConfig.ts` → `VILLAGE_PLOTS` = gli 11 `anchor` originali del config `villageBuildingsConfig.ts` (coordinate autoralate su villaggio.png). Non i `region` (quelli sono cluster, troppo grandi).
- **Sprite veri**: `public/assets/village/{cottage,inn,smithy,watchtower}.png` — da Gemini "edificio singolo su magenta", ref `refs/vbase.jpg`. Manca la batteria (market, farm, warehouse, infirmary, lumbermill, quarry, barracks, mageTower, palisade).
- **Componente**: `src/ui/idleVillage/components/gameFrame/VillageDirectorView.tsx` — base plate + ellissi cliccabili + `DirectorPanel` per assegnare tipo. Montato al posto di `VillageScreenView` in `src/pages/game-frame-pixi.tsx` (swap reversibile).

## 6. Pipeline Gemini (prerequisiti)

- Canary visibile con profilo shared (NO headless — il Director interagisce):
  `open -g -n -a "Google Chrome Canary" --args --remote-debugging-port=9222 --user-data-dir=<mind-weaver>/.mw/providers/profiles/shared`
- Runner: `node scripts/gen-mappa2-sprite.mjs --chat <url> --ref <img> --prompt <file.txt> --out out/<nome> --timeout 240`
- Chat edifici corrente: `https://gemini.google.com/app/e156e30964e44bb7` (la vecchia `0b99710d00e37e5e` aveva sessione temporanea → attach rotti).
- Prompt pronti in `PILOT/prompt-*.txt`. Ref sempre JPG ≤~400KB.
- Flakiness nota: attach falliti → `busy:true`/`ATTACH_FAIL`; fixare aspettando o cambiando chat. Non dipende dal prompt.

## 7. Review page

`context/research/2026-10-29-mappa2-sprite-pilot/index.html` — gallery degli asset (sezioni A9 villaggio, creature, ecc.). Server:
`python3 -m http.server 8611 --bind 127.0.0.1` dalla root →
`http://127.0.0.1:8611/context/research/2026-10-29-mappa2-sprite-pilot/`

## 8. Da fare / note aperte

- Elementi su mappa: verificati a schermo (anello chiuso, torri ancorate). L'approccio patch > sprite per cose legate al terreno.
- Batteria edifici /game: 3 sprite fatti, 8 da fare (prompt pronti).
- Piazzamento manuale parti su mappa: implementato ma il click-mappa non scatta dove manca una "region" — usato bottone PIAZZA (hover) come workaround.
- Le case pietra su mappa (stage4) scartate; la batteria "case pietra" su /game è in coda.
