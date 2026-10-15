---
title: "PLAN-038 — Villaggio vivo: linguaggio dei pin (categoria/stato/livello) + stato degli edifici dipinto sul dipinto"
status: draft
owner: Mind Weaver
created: 2026-10-15
source_request: R-202 (valutazione proposta Claude «slot e sprite»; deriva della critica AAA R-194)
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md
  - RICHIESTE.md (esito R-202)
  - src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md
---

# PLAN-038 — Villaggio vivo: pin come etichetta di stato + stato dipinto sul dipinto

Origine: critica AAA alla Vista Villaggio PLAN-035 (chat 2026-10-15) + contro-proposta
Claude «Villaggio con slot e sprite + nuovo linguaggio dei pin». Questo piano prende
l'architettura concettuale di quella proposta e la corregge dove collide col dipinto
reale (vedi §2, punto nodale).

## 1. Goal & Scope

**Goal:**
1. Il pin smette di *essere* l'edificio: diventa un'**etichetta di stato** piantata
   sull'edificio — forma = categoria (roundel/banner/shield), badge = livello romano,
   trattamento = stato (built/buildable/locked). Leggibile a 2 metri senza icone.
2. Lo **stato si legge sul dipinto**, non solo nel tooltip: ogni edificio dichiara una
   `region` normalizzata (bbox %) sul canvas 3168×1344; `VillageSlotOverlay` dipinge
   lo stato sopra la regione — ponteggio/anello tratteggiato per `buildable`, scrim
   desaturata + contorno spezzato per `locked`, niente per `built` (il dipinto *è*
   l'edificio).
3. Mock data con scala di livelli reale (oggi tutti i `built` sono I): farm II,
   warehouse II, lumbermill II, palisade II → il badge racconta la scala I→III.
4. Disclosure a riposo + affordance: plaque insediamento (nome + `costruiti/totali`),
   legenda tastiera, pop-in sfalsato all'ingresso, respiro lieve sui lotti buildable.

**Non-Goals:** economia reale (tutto resta mock), sprite edificio esterni,
piazzamento libero su griglia, drag&drop, varianti img2img per regione (decisione
rimandata, vedi §5), modifiche a tooltip/Escape/mappa inerte (contratto r005 intatto).

## 2. Vincoli, Trappole e Contratti

- **Punto nodale vs proposta Claude:** `villaggio.png` *contiene già* gli 11 edifici
  dipinti — gli anchor PLAN-035 siedono sulle case (config li descrive: «grand
  timbered longhouse», «stake fence foreground»). La pipeline «sfondo pulito + 11
  sprite WebP» richiederebbe inpainting di ~11 edifici e sprite AI con stessa luce/
  prospettiva/pennellata del dipinto — il rischio incoerenza che la proposta stessa
  segnala, ×11. Questa variante tiene il dipinto come edificio e aggiunge overlay
  di stato ritagliati su `region`: stesso risultato semantico (stato visibile sul
  mondo, pillar DESIGN_PILLARS §1.3), costo asset ≈ 0, coerenza garantita.
- **T-01:** `safeFit.insets` intoccati; overlay e pin vivono dentro lo stage 21:9.
- **T-03:** `SkinScope data-hud-controls` già avvolge la vista; gli overlay usano
  solo token `--skin-*` (STRICT_FILES hudGuards copre i file nuovi).
- **T-04:** verifica a occhio headless-witness: screenshot en/it a 1440×900 e
  1280×800 in `test-results/plan-038-village-lots/` (R-198: nessuna finestra
  in primo piano — tutto headless).
- **T-11:** chiavi nuove ICU `{var}` singola graffa (en + it-IT + pseudo).
- **CTR-game-001/REG-001 / CTR-game-002/004 / CTR-game-003:** invariati da PLAN-035.
- **R-198:** tutte le verifiche E2E/witness girano headless.

## 3. Spec tecnica

### T-001 — Config: `region` + mock levels che raccontano
`villageBuildingsConfig.ts` aggiunge per edificio:
```ts
region: z.object({                       // bbox normalizzato sull'edificio dipinto
  x: z.number().min(0).max(0.9),         // left edge
  y: z.number().min(0).max(0.9),         // top edge
  w: z.number().min(0.03).max(0.35),
  h: z.number().min(0.03).max(0.35),
}),
anchorNudge: z.object({ x: z.number(), y: z.number() }).optional(), // px-offset rel. su stage %
```
Validazioni nuove: `region` dentro il canvas; `anchor` dentro `region` o su suo bordo
(il pin si pianta sull'edificio, non su prato); anti-collisione anchor invariata.
Mock levels: `farm→2`, `warehouse→2`, `lumbermill→2`, `palisade→2` (≤ tiers.length,
state `built`); `watchtower` resta buildable, `infirmary`/`barracks` locked.
Chiavi i18n nuove: `gameFrame.village.title`, `builtCount` (`{built} di {total}`),
`hint` (legenda tastiera), `lotState.*` aria-label per overlay.

### T-002 — Linguaggio dei pin
`villageBuildingIcons.tsx` aggiunge tre **frame** SVG (non icone):
`PinFrameRoundel` (production), `PinFrameBanner` (civic), `PinFrameShield` (defense)
— silhouette piene `currentColor`, stessa grammatica engraved dei glifi esistenti.
In `VillageScreenView.tsx` il pin diventa:
- frame per `category` (forma = canale categoria, indipendente dal colore);
- badge livello separato sotto il glifo (tab brass con romano, non "I" accanto);
- trattamento per stato: `built` pieno; `buildable` anello tratteggiato + respiro
  lieve (`animation` 2.4s, `prefers-reduced-motion` → statico); `locked`
  `filter: saturate(.35) opacity(.6)` + glifo lock già esistente;
- disco di contrasto garantito: `box-shadow: 0 0 0 6px color-mix(lacquer-deep 55%)`
  + drop-shadow, leggibile su cielo e su pino;
- `anchorNudge` applicato come offset in % stage (pin sul frontone, non sul baricentro).

### T-003 — `VillageSlotOverlay` (stato dipinto sul dipinto)
Layer tra `<img>` e toolbar pin (`position:absolute inset:0`, `pointer-events:none`,
`aria-hidden` — il pin resta l'unico nodo interattivo):
- per edificio, un nodo ritagliato a `region` (SVG `rect`/`path` in % viewBox
  3168×1344, un solo `<svg>` per layer — niente 11 svg separati);
- `buildable` → anello tratteggiato ottone sul perimetro lotto + impalcatura
  stilizzata (2-3 linee diagonali, stroke `--skin-hud-brass`, opacity .5) che legge
  "cantiere" senza nuovi raster;
- `locked` → `rect` con fill `lacquer-deep` opacity .45 + contorno spezzato (tratti
  lunghi/corti alternati) + saturate(.4) via `backdrop-filter` fallback scrim;
- `built` → nessun overlay (il dipinto basta).
- Pop-in sfalsato 60ms per slot in ordine `BUILDING_IDS` (mount transition,
  `prefers-reduced-motion` → istantaneo).
- Helper puro `buildingStateOverlayMap(state)` → `{ring, fill, dash}` — unit-testato.

### T-004 — Livelli come decorazioni + disclosure
- Props di livello compositi su `region` (stesso layer SVG): `level≥2` → bandierina
  brass sul bordo alto della region; `level≥3` → piccolo pennacchio "fumo" CSS
  (gradiente animato lento) sulla region — soddisfazione a costo zero asset.
- Plaque insediamento (HudPlaque, top-left stage, `data-hud-controls`):
  nome villaggio + `{built}/11 costruiti` — progressive disclosure a riposo.
- Legenda tastiera serif 11px in basso a sinistra dello stage: i18n `hint`.
- `aria-label` dei pin guadagna lo stato (`Taglialegna — costruito, livello II`).

### T-005 — Test, guards, evidence, docs
- Unit (`villageBuildings.test.tsx` + nuovo `villageSlots.test.tsx`):
  region schema (bounds, anchor-in-region), `buildingStateOverlayMap`, pin frame
  per categoria, badge livello separato, mixed levels renderizzati, pop-in
  rispetta reduced-motion, i18n parity nuove chiavi.
- `hudGuards` STRICT_FILES += `VillageSlotOverlay.tsx` + eventuali nuovi.
- E2E `gameVillageView.spec.ts` esteso (headless, R-198): frame shape per
  categoria via `data-pin-frame`, stato via `data-pin-state`, overlay presente
  per buildable/locked e assente per built, plaque con count, legenda presente.
- Witness: 4 screenshot headless en/it × 1440×900/1280×800 →
  `test-results/plan-038-village-lots/` + ispezione visuale (T-04).
- Manifest `.mw/runs/plan-038-village-lots/verification.json` + `verify:bundle`;
  docs: INDEX, RICHIESTE R-202, COMPONENT_MASTER_INDEX (riga Village Screen View),
  kanban row.

## 4. Tasks

- [ ] T-001: config `region`/`anchorNudge` + mock levels misti + chiavi i18n nuove
  files: src/balancing/config/idleVillage/villageBuildingsConfig.ts, public/locales/{en,it-IT,pseudo}/idleVillage.json
  depends: —

- [ ] T-002: frame pin per categoria + trattamenti stato + badge livello separato + disco contrasto + anchorNudge
  files: src/ui/idleVillage/components/gameFrame/villageBuildingIcons.tsx, src/ui/idleVillage/components/gameFrame/VillageScreenView.tsx
  depends: T-001

- [ ] T-003: `VillageSlotOverlay` SVG unico (buildable ponteggio / locked scrim+contorno spezzato / built niente) + pop-in sfalsato
  files: src/ui/idleVillage/components/gameFrame/VillageSlotOverlay.tsx (nuovo), src/ui/idleVillage/components/gameFrame/VillageScreenView.tsx, src/ui/idleVillage/components/gameFrame/index.ts
  depends: T-001

- [ ] T-004: props livello (bandierina ≥2, fumo ≥3) + plaque insediamento + legenda tastiera + aria-label con stato
  files: src/ui/idleVillage/components/gameFrame/VillageSlotOverlay.tsx, VillageScreenView.tsx, public/locales/*
  depends: T-002, T-003

- [ ] T-005: unit/guard/E2E headless + witness + manifest/bundle + docs/kanban
  files: tests/unit/idleVillage/villageSlots.test.tsx, tests/unit/idleVillage/villageBuildings.test.tsx, tests/unit/idleVillage/hudGuards.test.ts, tests/e2e/idleVillage/gameVillageView.spec.ts, plans/INDEX.md, RICHIESTE.md, COMPONENT_MASTER_INDEX.md, agent_assignments.md
  depends: T-004

## 5. Decisioni rimandate (non in questo piano)

- **Varianti img2img per regione** (lotto vuoto / edificio diverso per stato): il
  giorno che l'economia reale attacca gli stati, generare patch img2img solo della
  `region` (stesso generatore/grade del dipinto) → `villaggio-{id}-lot.webp`
  compositato. ~3-6 patch, non 11 sprite: coerenza preservata, costo frazionario.
- **Nodo villaggio sulla mappa a scaglioni** (accampamento→borgo→villaggio, idea
  Fase 6 di Claude): piccolo, rimandato a quando esiste un livello insediamento reale.
- **Sprite per edificio** come nel piano originale: valido solo se un giorno il
  villaggio diventa editabile/placement libero; oggi il dipinto è migliore.

## 6. Behavioral Verification

- **BV-1 (pin language):** a 1440×900 e 1280×800, forma del pin distingue
  categoria e trattamento distingue stato senza leggere il glifo (witness +
  `data-pin-frame`/`data-pin-state` nel DOM).
- **BV-2 (stato sul dipinto):** `buildable` mostra anello+ponteggio, `locked`
  scrim+contorno spezzato, `built` nessun overlay; badge livello = romano separato;
  mock misti: I, II visibili, — per non-costruiti.
- **BV-3 (disclosure):** plaque nome+count e legenda tastiera presenti; pop-in
  sfalsato una tantum; reduced-motion = tutto statico.
- **BV-4 (regressione contratto r005):** tooltip/pin/grace/Escape/roving tabindex/
  focus-return invariati — suite `gameVillageView.spec.ts` esistente resta verde.
- **BV-5 (safeguards):** unit scope verdi, hudGuards sui file nuovi, build:check
  PASS, kanban:lint PASS, foreground:lint PASS, bundle PASS.
