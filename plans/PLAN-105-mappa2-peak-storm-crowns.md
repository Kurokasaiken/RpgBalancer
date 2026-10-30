---
title: PLAN-105 — `mappa2` corone temporalesche sulle cime nevose (mountainStorm rework)
status: in corso — baseline visual-fork congelata; implementazione
owner: agente locale
created: 2026-10-30
source_request: R-300 (RICHIESTE.md) — ruling Director verbatim nella fork card
parent: PLAN-098 (regional weather) — stessa superficie `orographic`
visual-fork: baseline `.mw/runs/20261030-peak-clouds-fork/visual-fork-peak-clouds.md` → `preview/b-corona.png` sha256 `543481d3e772397c` (selected: B + A1 corona-per-montagna + A2 tutte le cime grigie)
documentation_impact: REQUIRED
doc_targets: [plans/INDEX.md, RICHIESTE.md, test-results/r300-peak-crowns/]
---

# PLAN-105 — Corone temporalesche sulle cime nevose

## Problema (ruling Director 2026-10-30)

I blob `mappa2_cloud_*` tinti ardesia su 7 celle `NORTH_PEAKS`: statici, neri,
con imperfezioni (pennellate interne → graffi), non sulle cime, proporzioni
irreali, colore non minaccioso.

## Direzione congelata (B'')

Per **ogni cima innevata grigia** (15 rilevate via score neve su
`base_flat.webp`, filtrate a occhio — la lista diventa data autoriale nel
sorgente come lo era `NORTH_PEAKS`): **anello di nube** attorno alla vetta —
cluster di puff `mist_blob` con gradiente tinta corona-chiara→ventre-ardesia,
foro centrale con punta emergente, ombra morbida della corona a valle (SE,
T-07: creata nella stessa factory della corona), filo di pioggia lato sud,
fulmine dalla base della corona. Materia = puff, NON sprite cumulo.

## Task

- **T-001** — `mountainStorm.ts`: `NORTH_PEAKS`→`SNOW_PEAKS` (15 celle); bank
  cumulo→`crownPuffs(cell, seed)` layout puro esportato (annulus rr 0.5–1.0,
  tint per quota, alpha, size); cella = corona + ventre sud + shadow sprite +
  virga + snow streaks esistenti ridimensionati alla corona + fulmine da base
  corona; `createMountainStorm` perde `cloudTex`, puff = `blobTex`; breathing
  per-puff su fasi seedate (non drift, non flicker); determinismo FNV-1a.
- **T-002** — `regionalWeatherOverlay.ts`: mount aggiornato (niente più
  `mappa2_cloud_03/06` per lo storm; `caps.orographic`→frazione puff vivi).
- **T-003** — test permanente `tests/unit/idleVillage/mappa2PeakCrowns.test.ts`
  (R-247): annulus (tutti i puff in [inner,outer]), gradiente (luminanza top
  > bottom), 15 celle su canvas e ids unici, determinismo, ombra stessa cella
  (T-07), sprite cap `MAX_STORM_SPRITES` (~400) riportato da
  `__regionalWeatherDebug.counts`.
- **T-004** — witness headless `/mappa2-lab` massiccio nord →
  `test-results/r300-peak-crowns/`; side-by-side vs baseline `b-corona.png`;
  stessa viewport della card (~520px pannello). Checks pre-registrati: (a)
  banda anulus attorno a ogni picco > luminanza della sola pittura (corona
  presente); (b) pixel alla punta restano neve (foro).

## Contratto di chiusura

| id | type | command | criterio |
|----|------|---------|----------|
| OB-1 | state | `npm run test -- tests/unit/idleVillage/mappa2PeakCrowns` | verde |
| OB-2 | state | `npm run lint -- src/ui/idleVillage/pixiSpike tests/unit/idleVillage/mappa2PeakCrowns.test.ts` | 0 errori |
| OB-3 | state | `npm run build:check` | verde |
| OB-4 | state | `npm run closure:lint` | verde |
| OB-5 | artifact | screenshot headless + side-by-side in `test-results/r300-peak-crowns/` | file presenti, checks (a)(b) PASS/FAIL dichiarati |
| OB-6 | human-eye | Director vede `/mappa2-lab` o il side-by-side | ruling |

Trappole ereditate: T-04 (claim con testimone), T-07 (ombra nella factory),
T-13 (collisioni sessioni parallele), T-17 (cache vite), T-22 (misura sul
runtime del sintomo).
