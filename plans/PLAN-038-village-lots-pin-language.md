---
title: "PLAN-038 — Villaggio vivo: linguaggio dei pin (categoria/stato/livello) + stato degli edifici dipinto sul dipinto"
status: completed
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
region: z.object({                       // bbox AUTORING — mai renderizzato
  x: z.number().min(0).max(0.9),
  y: z.number().min(0).max(0.9),
  w: z.number().min(0.03).max(0.35),
  h: z.number().min(0.03).max(0.35),
}),
ellipseOverride: z.object({              // fallback Step-0 per regioni rifiutate (≤11)
  cx: z.number(), cy: z.number(), rx: z.number(),
}).optional(),
stakeTicks: z.boolean().optional(),      // 4 tick di palo come subpath dell'anello
anchorNudge: z.object({ x: z.number(), y: z.number() }).optional(), // |y| ≤ 0.04 stage
```
Lint geometrici bloccanti (superRefine + unit test): `region` dentro canvas;
`anchor` dentro `region` o su suo bordo; rect del pin (anchor±20px CSS-equiv)
sovrappone la propria region ≤35% se region <100px wide; distanza anchor ≥44px
on-screen a 1280×800 (dx·1280, dy·543); overlap pairwise delle region ≤15% del
minore; anti-collisione anchor invariata.
Mock levels: `farm→2`, `warehouse→2`, `lumbermill→2`, `palisade→2` (≤ tiers.length,
state `built`); `watchtower` resta buildable, `infirmary`/`barracks` locked.
Chiavi i18n nuove: `gameFrame.village.title`, `builtCount` (`{built} di {total}`),
`hint` (legenda tastiera), `lotState.*` aria-label per overlay.

### T-002 — Linguaggio dei pin
`villageBuildingIcons.tsx` aggiunge tre **frame** SVG (non icone):
`PinFrameRoundel` (production), `PinFrameBanner` (civic), `PinFrameShield` (defense)
— silhouette piene `currentColor`, stessa grammatica engraved dei glifi esistenti.
In `VillageScreenView.tsx` il pin diventa:
- frame per `category` con **aspect differenziati**: roundel=cerchio (production),
  shield=heater alto con top piatto (defense), banner=placca orizzontale con
  estremità a nastro ~40×28 (civic); stroke weight secondario (2px / 3px defense);
  tutto dentro il hit box 40px;
- disco di contrasto fuso nel frame: fill lacquer opaco + alone 3px (no doppio disco);
- **badge tab separato** top-right del pin, min 16×16px CSS su proprio disco scuro,
  numerale ≥11px/600 tabular; livello SOLO per `built`; `+` ottone per buildable,
  glifo lock per locked; fallback arabo se `tiers.length > 4` (lint unit-testato);
- `locked`: `saturate(.35)`+dimming SOLO su frame/fill — badge e glifo restano a
  piena opacità (AA);
- sotto ~1100px di stage: scala visiva pin 0.8, hit target invariato;
- `anchorNudge` come offset % stage (pin sul frontone, non sul baricentro).

### T-003 — `VillageSlotOverlay` (stato dipinto sul dipinto)
Layer tra `<img>` e toolbar pin (`position:absolute inset:0`, `pointer-events:none`,
`aria-hidden` — il pin resta l'unico nodo interattivo):
- **un `<g data-id>` per edificio** (≤11 gruppi, figli liberi); ogni gruppo
  contiene sempre un'ellisse glow nascosta (opacity 0) — anche `built`;
- il bbox `region` non è mai disegnato: il segno a terra è un'**ellisse footprint**
  derivata `cx=x+w/2, cy=y+0.92h, rx=0.5w, ry=0.2·rx` (finzione "anello da
  geometra"), o `ellipseOverride` se presente;
- `buildable` → ellisse **a due layer**: underlay scuro solido 8px sorgente
  (~3.2px schermo, lacquer ~70%) + dash ottone 5px sorgente (~2px, dash ~14px);
  respiro = ±6% opacità sull'underlay (4s ease), non cue di stato;
- `locked` → **vignetta radiale sfumata** (ellisse `cy=y+0.55h`, `r=0.6·max(w,h)`,
  lacquer .35→0, radialGradient condiviso) + anello a terra **dotted** (`1 7`,
  round cap); niente glifo lock a terra (vive solo sul badge del pin);
- `built` → a riposo niente (solo la glow nascosta per l'associazione hover);
- **hover/focus mono-direzionale**: pin `:hover`/`:focus-visible` → glow della
  regione accende via CSS `:has()` puro, 120ms — nessuno stato React, nessun
  tocco all'arbitrato tooltip;
- pop-in sfalsato 60ms/slot via **proprietà `scale` standalone** (mai `transform`
  sull'elemento con `translate(-50%,-50%)` — altrimenti il pin salta);
  keyframes solo `opacity`/`scale`; reduced-motion → tutto statico;
- helper puro `buildingStateOverlayMap(state)` → `{ring, vignette, dash}` —
  unit-testato.

### T-004 — Livelli come decorazioni + disclosure
- `level≥2` → bandierina ottone a `(x+w, y)` della region, **solo se non
  collide col rect del pin** (altrimenti omessa — verificato nello Step-0);
- fumo ≥3 **TAGLIATO** dalla v1 (mock max II; la palizzata non ha camino);
- Plaque insediamento (HudPlaque, top-left stage safe-margin, `data-hud-controls`):
  nome villaggio + `{built}/11 costruiti`; la legenda può sedere nelle bande del
  letterbox quando ≥128px — scelta implementativa, il witness decide;
- Legenda visiva (non solo tastiera): le 3 forme categoria + i 3 badge
  (romano=costruito, `+`=costruibile, lock=bloccato) + hint tasti, i18n EN/IT;
- `aria-label` dei pin guadagna stato+livello (`Taglialegna — costruito, livello II`).

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

- [x] T-001: config `region`/`anchorNudge` + mock levels misti + chiavi i18n nuove
  files: src/balancing/config/idleVillage/villageBuildingsConfig.ts, public/locales/{en,it-IT,pseudo}/idleVillage.json
  depends: —

- [x] T-002: frame pin per categoria + trattamenti stato + badge livello separato + disco contrasto + anchorNudge
  files: src/ui/idleVillage/components/gameFrame/villageBuildingIcons.tsx, src/ui/idleVillage/components/gameFrame/VillageScreenView.tsx
  depends: T-001

- [x] T-003: `VillageSlotOverlay` SVG unico (buildable ponteggio / locked scrim+contorno spezzato / built niente) + pop-in sfalsato
  files: src/ui/idleVillage/components/gameFrame/VillageSlotOverlay.tsx (nuovo), src/ui/idleVillage/components/gameFrame/VillageScreenView.tsx, src/ui/idleVillage/components/gameFrame/index.ts
  depends: T-001

- [x] T-004: props livello (bandierina ≥2, fumo ≥3) + plaque insediamento + legenda tastiera + aria-label con stato
  files: src/ui/idleVillage/components/gameFrame/VillageSlotOverlay.tsx, VillageScreenView.tsx, public/locales/*
  depends: T-002, T-003

- [x] T-004b: **Step-0 spike** — regioni per 2 edifici soli, SVG statico sul
  dipinto, 1 screenshot witness prima di autorare le altre 9; criterio di rigetto:
  ellisse che attraversa il tetto di un vicino o pin che copre il frontone →
  `anchorNudge` o `ellipseOverride`
  depends: T-003

- [x] T-005: unit/guard/E2E headless + witness + manifest/bundle + docs/kanban;
  perf gate statico (no filter/box-shadow in keyframes, `getAnimations()` ≤
  buildable count, `will-change` ≤11); p99 ≤20ms solo misura manuale desktop
  files: tests/unit/idleVillage/villageBuildings.test.tsx (tutti i test PLAN-038 mergiati qui, niente villageSlots.test.tsx), tests/unit/idleVillage/hudGuards.test.ts, tests/e2e/idleVillage/gameVillageView.spec.ts, plans/INDEX.md, RICHIESTE.md, COMPONENT_MASTER_INDEX.md, agent_assignments.md
  depends: T-004

## 5. Decisioni rimandate (non in questo piano)

- **Copy fiction** (flag Director, da dibattito): "buildable" su casa dipinta è
  una lieve contraddizione di finzione — proposta "disponibile a reclamare/
  ripristinare", locked="sigillato". Default v1: termini neutri.

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
- **BV-2 (stato sul dipinto):** `buildable` mostra ellisse a due layer (+tick
  opzionali), `locked` vignetta sfumata+anello dotted, `built` niente a riposo ma
  glow nascosto presente; badge: romano per built, `+` buildable, lock locked;
  mock misti: I, II visibili.
- **BV-3 (disclosure):** plaque nome+count, legenda visiva (3 forme+3 badge+tasti)
  EN/IT; pop-in sfalsato; reduced-motion = tutto statico; hover/focus accende il
  glow della regione (one-directional).
- **BV-4 (regressione contratto r005):** tooltip/pin/grace/Escape/roving tabindex/
  focus-return invariati — suite `gameVillageView.spec.ts` esistente resta verde.
- **BV-5 (safeguards):** unit scope verdi, hudGuards sui file nuovi, build:check
  PASS, kanban:lint PASS, foreground:lint PASS, bundle PASS.

## 7. Esito (chiusura 2026-10-16)

**Implementato** — tutte le correzioni del dibattito r003:

- **T-001 config**: `region`/`ellipseOverride`/`stakeTicks`/`anchorNudge` nel
  schema Zod + lint geometrici bloccanti (region in canvas, anchor ∈ region,
  pin-swallow ≤35% su regioni strette, overlap pairwise ≤15%, distanza pin
  ≥44px screen, `anchorNudge.y` ≤0.04). Livelli mock misti: lumbermill/farm/
  warehouse/palisade a II. `ellipseOverride` attivo su watchtower (boschetto
  senza edificio dipinto → ellisse alla base del treeline). i18n
  `gameFrame.village.{title,builtCount,legend.*}` in en/it-IT/pseudo.
- **T-002 pin**: `VillagePinFrame` (roundel production / banner civic / shield
  defense) come silhouette del pin con riempimento lacquer garantito; badge tab
  separato (romano per built, `+` buildable, lock glyph locked); trattamenti
  stato (solido / dashed brass-hi / saturate(0.35)); `data-pin-frame` +
  `data-pin-state` nel DOM; `scale` standalone <1100px (mai `transform: scale`
  — debate W-11); aria-label = nome+categoria+stato+livello.
- **T-003 overlay**: `VillageSlotOverlay` SVG unico viewBox 3168×1344,
  `pointer-events:none`/`aria-hidden`, `<g data-region>` stabile ×11. Ellissi
  footprint derivate (cy=y+0.92h, ry=0.2·rx) con override per-buildable;
  ring a due layer (underlay 8px + dash ottone 5px) + stakeTicks; locked =
  vignetta radiale sfumata + ring dotted; built = solo ping glow nascosto.
  Glow pin→regione via `:has()` CSS puro (one-directional). Pop-in `scale`
  standalone 60ms stagger + `prefers-reduced-motion` nel media query.
- **T-004b Step-0 gate ESEGUITO E FALLITO, poi corretto**: primo spike ha
  mostrato ellissi che tagliavano i muri a mezza altezza (region troppo corte
  su inn/smithy/infirmary/barracks) e watchtower sospeso sulle chiome →
  region ri-autorate sui crop full-res + `ellipseOverride` watchtower +
  pennant ripiantato alla linea di terra. Rigetto documentato: il gate ha
  fatto il suo lavoro.
- **T-004**: pennant piantato a terra solo su built ≥II (4 pennant); plaque
  «VILLAGE — 6 of 11 built»; legenda visiva (3 frame + 3 badge + tasti);
  smoke tagliato (mock max II).
- **T-005**: 37 unit in villageBuildings + hudGuards (10) verdi; BV-7a/7b/7c
  E2E aggiunti a `gameVillageView.spec.ts`; BV-6 witness EN/IT ×2 viewport;
  regressione PLAN-035 BV-2..BV-4 verde.

**Bug reali trovati in esecuzione**:
- `skinScope.css` forza `button svg { width: var(--skin-hud-control-icon-size) }`
  (14px) su OGNI svg dentro bottoni HUD — il frame e il glifo venivano schiacciati.
  Fix: `width`/`height` inline style su `VillagePinFrame`/`VillageBuildingIcon`.
- Il disc opaco del pin copriva il frame → disc trasparente + halo via token.
- `dispatchEvent('pointerenter')` non attiva `:hover` → il test glow usa
  `locator.hover()` reale.

**Witness**: `test-results/plan-038-village-lots/` (spike 1280/1440 + zoom pin)
e `test-results/plan-035-village-view/village-{en,it}-{1440x900,1280x800}.png`
aggiornati al nuovo linguaggio.
