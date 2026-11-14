# PLAN-117 F2 — Sub-plan: Ventaglio-carte del Luogo

**Stato:** `draft` — proposto per battesimo (open gate OG-1..OG-3 risolti dal Director 2026-11-13; attende solo battesimo).
**Parent:** PLAN-117 rev. 5 (baptized 2026-11-12), Appendice A (emendamento F2).
**Data:** 2026-11-13.
**Origine (Director, verbatim):** «niente testo, x il resto uguale al mockup» —
ruling sul fork composizione: **ventaglio di carte-smalto sovrapposte** come
`.mw/specs/poi-radial/refs/mockup-hub-fan-village.jpg` (sha256
`2bec1c46dde3fdf6`), senza etichette testo sulle carte.

## Baseline visiva (visual-fork: risolto)

- **Baseline:** `.mw/specs/poi-radial/refs/mockup-hub-fan-village.jpg`
  (sha256 `2bec1c46dde3fdf6`, 1946×544, Gemini).
- **Emendamento alla baseline (ruling Director):** nessuna etichetta testo
  sotto le icone — il mockup mostra TAGLIALEGNA/MINA/…; le nostre carte
  portano solo icona dipinta + grammatica attività.
- Marker plan visual-fork: **risolto via ruling** — il mockup È la
  rappresentazione scelta; niente fork ulteriore sulla composizione.
  Restano fork possibili solo su varianti non coperte dal mockup
  (v. OG-1/OG-3).

## Cosa il mockup prescrive (e le deviazioni ruling)

| Elemento | Mockup | Decisione |
|---|---|---|
| Composizione | Ventaglio di carte trapezoidali sovrapposte, ruotate singolarmente, aperte sopra il centro | **preso** |
| Carta | Smalto dipinto famiglia (smeraldo/blu/…), bordo oro inciso spesso, gemme ai vertici | **preso** |
| Centro | Diorama villaggio 3/4 su piedistallo oro, dominante | **preso** — `village-icon-v2` non regge, serve arte dedicata |
| Etichette testo | TAGLIALEGNA, MINA, … | **escluse** (ruling) |
| Slot vuoto | Piastra scura con triangolino | **preso** (sostituisce vetro traslucido del ruling precedente) |
| Sfondo mappa | Visibile dietro il ventaglio | preso — il fan fluttua sulla mappa, nessun disco oscurante |
| Progress | non mostrato nel mockup | **open** OG-1 |

## Ruling precedenti che questa variante **sostituisce**

- «Disco unico inclinato, 8 spicchi × 45°, medaglione navy+oro, NON inset
  villaggio» (ruling 2026-11-12) → sostituito: ventaglio-carte + diorama.
- «Socket vuoti = vetro traslucido» → sostituito: piastra scura + triangolino.

## Ruling precedenti che **restano vigenti**

- Riempimento **orario da NE** (NE,E,SE,S,SW,W,NW,N) — il fan si apre da
  NE e prosegue CW; nel mockup le carte a destra = prime posizioni.
- Hover dwell 350 ms → scheda ancorata non modale, swap istantaneo fra
  carte; click carta → planner sezione dedicata + chiusura; click-fuori/
  Esc → chiusura; **nessun modale** (GX-0042); pan mappa mai bloccato
  (root non intercetta input; hit solo sulle carte).
- Famiglia → colore smalto carta (job=smeraldo, quest=blu, event=viola
  provvisorio non battezzato); urgente = virata percettiva.
- >N attività = affordance hub → planner (design-error). N = capienza fan
  (da calibrare, default 7±1 carte leggibili — mockup ne mostra ~7).

## Open gates — RISOLTI (ruling Director 2026-11-13)

- **OG-1 — Grammatica progress sulla carta → RISOLTO (a).** Smalto che si
  "scrive" scuro orario da ore 12 della carta (grammatica Director già
  definita: collect = pieno scuro, ripetibile = torna chiaro, urgente =
  virata percettiva). Niente manetta né gemma-progress.
- **OG-2 — Layout con poche attività → RISOLTO: arco fisso.** Le carte si
  distribuiscono sull'arco definito in config; poche attività = carte più
  distanziate sullo stesso arco, mai carte singole giganti né arco che si
  restringe.
- **OG-3 — Diorama perno → RISOLTO: arte dedicata + animazione.** Generare
  via scene-author un diorama villaggio coerente col mockup. **Il pose
  finale dell'animazione richiesta in precedenza (piedistallo che sale,
  oggetto frontale → 3/4) È la posizione del mockup**: il frame finale
  della sequenza = diorama in 3/4 seduto sul piedistallo come nel mockup.
  L'asset va quindi generato come sequenza (flipbook turntable front→3/4)
  o come pose finale + frame intermedi: la posa di riposo coincide con
  l'ultimo step. `village-icon-v2` resta fallback dev.

## Task

- **F2-T0 — Diorama animato** (OG-3 risolto): batch scene-author — pose
  finale = diorama 3/4 su piedistallo come il mockup + frame intermedi
  della sequenza frontale→3/4 (flipbook turntable); fork su 2-3 output →
  ruling Director, baseline congelata.
- **F2-T1 — Geometria fan** (`placeFanGeometry.ts` nuovo o refactor di
  `placeRadialGeometry.ts`): pose carta (centro, rotazione, z-order,
  overlap) da `PLACES_CONFIG.fan` + nuovo schema `fanLayout` (arco,
  apertura, scala, stagger) — config-first, nessuna costante in componente.
- **F2-T2 — Kit carte** (scene-author → `dev-public` candidato): piastra
  smalto per famiglia (job/quest/event) + piastra empty + triangolino +
  piedistallo/diorama perno; `process-kit.py` esteso per crop/maschere;
  gate `check-scene-art.py` dove applicabile.
- **F2-T3 — Componente `PlaceFanCards`** (nuovo, non mutare `PlaceRadial`
  finché il fork non regge il confronto — il disco resta nel lab come
  fallback): carte HTML/SVG posizionate da geometria, hit per-carta,
  dwell scheda persistente, click→planner, Esc/click-fuori, roving
  tabindex, z-order corretto in overlap, root non-intercetta pan.
- **F2-T4 — Wiring lab** in `/lab/poi-luogo`: toggle componente
  (fan|radial), stesso modello `PlaceFanActivity`/`MapQuestPoiView`.
- **F2-T5 — Testimone e contratto** (v. OB) + aggiornamento
  `NOTES.md`/`RICHIESTE.md`/PLAN-117 Appendice A → rev. 6.

## Contratto di chiusura (obbligazioni)

| OB | tipo | Criterio |
|---|---|---|
| OB-F1 | state, blocking | Test interazione: mount fan, hover carta → scheda dopo 350 ms ancorata non modale, swap fra carte senza smontare, click→callback planner + chiusura, Esc e click-fuori chiudono, roving tabindex; nessun elemento modale (test negativo GX-0042) |
| OB-F2 | state, blocking | Pan mappa: pointerdown su root fan fuori carta → `pointerdown` raggiunge il layer mappa (hit-test solo carte) |
| OB-F3 | visual, blocking | Same-viewport baseline vs implementazione: testimone side-by-side `mockup-hub-fan-village.jpg` vs render a 1440×900 e 1280×800, regione/proprietà/condizione/tolleranza pre-registrate; `human-eye` Director sul composito |
| OB-F4 | state, blocking | Ordinamento: prima carta a NE, prosecuzione CW; overflow >capienza → affordance hub→planner (test su `placeOrdering` riusato) |
| OB-F5 | regression | `mapPlace.test.tsx` + nuovi test `placeFanCards.test.tsx` verdi; `npm run lint -- <scope>`; `npm run build:check` |
| OB-F6 | config | Tutte le costanti layout/capienza/stato in `PLACES_CONFIG` (+Zod); i18n solo aria-label/title (niente label visibili — ruling); nessun valore hardcoded nel componente |

## Trappole applicabili (pre-flight)

- **T-04**: nessun claim visivo senza testimone che lo vede — il confronto
  mockup-vs-live è l'obbligazione OB-F3, non un optional.
- **T-13**: `PlaceRadial` è condiviso — il rework avviene su componente
  nuovo; `PlaceRadial` resta montato nel lab fino al ruling finale.
- Material-defects `.mw/bugs/2026-11-13-poi-radial-material/`: asset
  generati con fondo scacchiera → process-kit deterministico, mai
  flood-fill.
- `hub.webp` full-face: lezione appresa — ogni asset va ispezionato in
  alpha prima del montaggio.
