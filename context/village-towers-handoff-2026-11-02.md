# Handoff — village upgrade plates su mappa2 (stato 2026-11-02)

Briefing per agente che riprende il lavoro. Il Director riporta: **«ci sono ancora
gli stessi errori»** — play della timeline flickera e le torri hanno ancora difetti.
Leggere tutto prima di toccare codice.

## Obiettivo (parole del Director)

Sulla mappa dipinta `mappa2`, in un punto fisso, il villaggio deve mostrare upgrade
visibili: radura vuota → 3 case → 5 case → torre legno → palizzata → 2ª torre →
case di pietra → mura di pietra → torre di pietra → 2ª torre di pietra.
Serve per il **teaser trailer**: slider + pulsante play che avanza da solo.

## Architettura (deterministico, NON runtime-compositing)

- **Piastre**: immagini complete della zona (510×390), una per stato. Nessun overlay
  di pezzi separati a runtime (quello era il bug "villaggio fantasma" originale).
- **Manifest**: `public/assets/world/mappa2/base/fx/village/village.json` (v2, Zod).
  29 piastre `shipped:true`. Chiave `growth|defence|slot1+slot2`.
  `uiRules.towersRequireDefence: false` (serve per `straw|none|wood+none`).
- **Zona**: `x=1260 y=505 w=510 h=390` (world coords). Centro villaggio ~world (1515,720).
- **Overlay**: `src/ui/idleVillage/pixiSpike/villageZoneOverlay.ts` — due Sprite
  (lower/upper), cross-fade; legge `villageZoneLive` per tick; fallback silenzioso
  `.catch(()=>null)` → `${growth}|none|none+none` se una texture non carica.
- **Lab**: `src/pages/mappa2-lab.tsx` — tab `village`: timeline slider+play
  (`VILLAGE_TIMELINE`, `villageStep`, `villagePlaying`, `villageStepSec` default 1s)
  + lista piatta dei 29 stati (un bottone = una piastra).
- **Compositor offline**: `scripts/compose-village-towers.py` — stampa sprite torri
  canoniche su host `stone-palisade-none-none.webp` / `stone-wall-none-none.webp`
  → produce le 16 piastre torri + re-stamp manuale delle 3 piastre straw.
  Le sprite vengono dai **raw** `out/village-chain/w-*-0.png`
  (mai da piastre `.webp` già composte — si auto-degradano).
- **Builder piastre**: `scripts/build-village-layers.py` (crop → zona, export webp).
- **Raw Gemini**: `out/village-chain/*.png` (meadow/cottages/straw/stone/palisade/wall,
  varianti torri `w-<slot1>-<slot2>-0.png`, `p-*`, `c-*`, `s-*`).

## Stato torri (ultima modifica)

Sprite canoniche estratte dai raw (`extract_filled`, silhouette piena + poligono
manuale per s1-stone). Anchor in **footprint** (media x righe opache in fondo):
- slot1 (ovest, dentro cinta): `(185,272)`
- slot2 (est, dentro cinta): wood `(385,242)`, stone `(405,246)` — diversi di proposito
  per compensare lo skew del footprint della sprite pietra.

Problemi ricorrenti e come si manifestano:
- **Torre dietro il muro** (risolto poi riemerso): estrarre la sprite da una piastra
  dove Gemini la disegna *davanti* al muro (famiglia `w-*`, non `p-*`).
- **Sprite spezzata/stretta**: diff vs host troppo alto o sorgente sbagliata.
- **Sprite con contesto**: `filled` ingloba muro/fiume se ROI larga → stringere ROI
  e/o poligono manuale attorno al corpo torre.
- **Switch di posizione legno↔pietra**: ancore al centro-sprite → usare footprint.
- **Muro "mangiato"**: la sprite copre l'arco del muro → spostare anchor più dentro
  il cortile E/O stringere poligono (ultimo fix: anchor più interne).
- **Torri "dentro le cinte"**: richiesta Director — stanno a filo interno, ovest+est.

## Bug aperti / non risolti

1. **Play timeline flickera ancora** (detto dopo 3 fix):
   - `t` nel tick = **secondi dall'avvio** (non delta): calcolare `dt = t - lastT`.
     Fatto, fade = `dt/0.15`.
   - GPU warm-up: ciclare tutte le texture su `upper` a alpha 0.001 all'avvio. Fatto.
   - `currentKey` tracciava il target invece della texture mostrata → introdotto
     `fadeKey`. Fatto.
   - **Ipotesi ancora da verificare**: il flicker potrebbe NON essere il fade ma
     un re-render/remount React: ogni step fa 3 setState → re-render pagina →
     verificare se `PixiWorldMap` ri-esegue effect pesanti (props instabili).
     Oppure ghosting residuo percepito. Da indagare con capture durante play.
2. **Fallback silenzioso** sul load texture: nessun log/retry → una piastra mancata
   mostra `stone|none` mentre il bottone resta evidenziato. Aggiungere log+retry.
3. **Cache browser**: i webp hanno URL identici tra versioni → hard-reload serve.
   Valutare hash nel nome file.
4. **`villageZoneLive` sync**: `applyVillageKey` fa 3 setState → key ricostruita
   in useEffect — verificare atomicità (teoricamente ok in React 18 batch).

## Metodo di verifica OBBLIGATORIO (T-04)

Non dichiarare fixato guardando i file: serve **witness live** headless su
`http://localhost:5173/mappa2-lab` (dev server: `npm run dev`, porta 5173):
- `window.__worldCamCtl.set({panX, panY, zoom})` per centrare la zona
  (panX = 1515 - 720/zoom, panY = 720 - 450/zoom).
- Script riusabili: `scripts/_tmp-witness-s1.mjs`, `_tmp-listbtns.mjs`,
  `_tmp-timeline-witness.mjs`, `_tmp-play-flicker.mjs`.
- Per il flicker: catturare frame **durante** il play (screenshot rapidi in
  sequenza, es. ogni 200-300ms attorno al cambio), non solo a stati stabili.
- Le sprite debug sono in `fx/village/_tower-s{1,2}-{wood,stone}.png`.

## Vincoli durevoli del Director

- Far-zoom identity: niente alberi/rocce/fiumi inventati; silhouette lontana identica.
- Tetti dorati per le case (identità villaggio, mood `villaggio.png`).
- Torri = stessa sprite canonica in tutte le combo; muro/palizzata identici tra combo.
- Torri dentro la cinta (ultimo ruling), posizioni fisse e allineate tra materiali.
- Safeguard: `npm run lint -- <scope>`, `npm run test -- <scope>`, `npm run build:check`,
  `npm run closure:lint` (timeout noto 30s, anomalia ambientale).

## File chiave riassunto

| Cosa | Path |
|---|---|
| Manifest+piastre | `public/assets/world/mappa2/base/fx/village/` |
| Overlay | `src/ui/idleVillage/pixiSpike/villageZoneOverlay.ts` |
| Lab UI | `src/pages/mappa2-lab.tsx` |
| Compositor torri | `scripts/compose-village-towers.py` |
| Raw generazioni | `out/village-chain/` |
| Piano | `plans/PLAN-106-mappa2-village-stages.md` |
| Review/evidenze | `test-results/village-review-2026-11-01/`, `test-results/village-witness-2026-11-02/` |

## Note operative

- Vite ricarica la pagina quando cambiano file in `public/` → i witness headless
  devono tollerare reload (retry su click, waitForFunction su `__worldCamCtl`).
- Chrome/Gemini runner: `scripts/gen-mappa2-sprite.mjs` + GUIDE in
  `context/research/2026-10-29-mappa2-sprite-pilot/GUIDE.md`.
- Il Director giudica a occhio: lasciare sempre un contact-sheet aggiornato in
  `test-results/village-review-2026-11-01/` (`plates-A.png`, `plates-B.png`).
