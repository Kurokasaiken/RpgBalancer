---
title: 'PLAN-042 — `/game` Villaggio: Registro dell’Insediamento — cassetto HUD sul dipinto + catalogo edifici oltre il dipinto'
status: completato
created: 2026-10-16
baptized: 2026-10-16 (Director «approvo»; artifact r005 sha 4dac8cdb, mw-web-debate converged 4/4)
request: R-206
desiderata: nessuna nuova — estensione di superficie della desiderata v30 (villaggio dipinto abitato)
related: PLAN-035 (VillageScreenView, tooltip contract), PLAN-038 (pin = etichetta di stato, VillageSlotOverlay, `region`), PLAN-037 (POI auto-reveal)
debate: mw-web-debate run `20261016-1054-plan042-village-registry` (mind-weaver), artifact-r005 sha 4dac8cdb5be33233e0c76cebeea94fbcb631036b2c0f5eb3b4b4987d496100a6 — CONVERGED 2026-10-16, ACCEPT 4/4 eleggibili (chatgpt, claude, gemini, deepseek), grok removed provider_dead ×4 stabilization failures (ultimo contributo CLEAN su r002); 41 obiezioni disposizionate (38 amended, 3 rebutted)
---

# PLAN-042 — Registro dell’Insediamento

**Richiesta (Director, 2026-10-16, verbatim):** *"Farlo 'separatamente', tipo
'questo è il villaggio', le cose fighe extra le trovi in un menù a parte, ecc?
O meglio fare direttamente solo tutto menù e magari quello è 'lo sfondo'?"* →
risposta concordata in sessione: nessuna delle due — il dipinto resta la vista,
il menu vero è un **cassetto «Registro»** che scivola sopra lo stage.

**Documentation Impact:** REQUIRED — `CURRENT_STATE.md` (riga Vista Villaggio),
`COMPONENT_MASTER_INDEX.md` (riga Village Screen View), `RICHIESTE.md` (R-206),
`plans/INDEX.md` (questa riga), evidence `test-results/plan-042-village-registry/`.

## Perché

1. `villaggio.png` dipinge 11 edifici fissi; a regime il villaggio ne avrà
   20+ (torre di magia, gilda, santuario, cimitero…). Un dipinto in
   prospettiva **non è un contenitore scalabile**.
2. Sprite scontornati "appiccicati" sul dipinto = collage AI che tradisce
   luce/prospettiva/pennellata — bocciato già nel dibattito PLAN-038.
3. Ma il dipinto è la carta che vende: resta la vista emozionale; la gestione
   operativa va in un layer HUD che scala.

Pattern di riferimento: Darkest Dungeon Hamlet (dipinto = hub emozionale,
pannelli di gestione fluttuanti sopra), Against the Storm (griglia astratta
leggibile). Linguaggio condiviso: la riga del registro usa **gli stessi
glifi** del pin (frame categoria + badge stato) — il registro insegna a
leggere il dipinto, il dipinto premia le azioni del registro.

## Stato attuale (FACT)

- `VillageScreenView` renderizza `villaggio.png` + `VillageSlotOverlay`
  (SVG inerte, `g[data-region]` per i 11 dipinti) + toolbar pin roving +
  tooltip pinnabile + plaque insediamento + legenda. Tutto PLAN-038, verificato.
- `villageBuildingsConfig.ts`: schema Zod con `region`/`anchor` **obbligatori**
  (lint: anchor dentro regione, overlap ≤15%, distanza minima), `category` ∈
  {production, civic, defense}, `initialState`, `initialLevel`, `tiers`.
- Oggi un edificio = un pin dipinto. Non esiste modo di avere edifici
  "di catalogo" senza posizione sul dipinto.
- Arbitro Escape (game-frame-pixi.tsx): tooltip → uscita villaggio.
- `MockUpgradeControl` resta l'azione display-only.
- Scala a regime: ~30–40 edifici totali, istanze uniche con livello (no
  multi-istanza), superficie desktop-only hover-driven.

## Decisioni (post-dibattito, artifact r005)

- **D-1**: `slotKind: 'painted' | 'registry'` come **union discriminata**
  Zod — painted REQUIRE `region`/`anchor`; registry FORBIDS geometry
  (`.strict()` + superRefine incrociato: painted senza region → throw;
  registry con region → throw). Tutto il codice highlight/tooltip lavora
  su `hasFootprint` derivato (v1: `slotKind==='painted'`), che è il punto
  di innesto per una futura presenza via `overlayArt`.
- **D-2**: cassetto `HudPlaque` slide-over dal **bordo destro**, ~360–420px,
  `overflowY:auto`, max-height ≤85vh, `translateX` chiuso→aperto (token skin,
  `prefers-reduced-motion` → istantaneo). Chiuso di default. Il tooltip
  geometry-clamp registra il rect del drawer come ostacolo.
- **D-3 — surface model unificato**: la detail card è un **view-state del
  drawer** (push/pop route), non un layer floating. Escape è **focus-scoped**:
  la superficie che possiede l'interazione corrente consuma Escape — una
  transizione per keypress. Ordine ambient (fallback): card aperta → back alla
  lista; drawer aperto → chiude (focus al chip); tooltip pin → dismiss (focus
  al pin); nulla → esci dal villaggio.
- **D-4 — focus model**: list view **non modale** (Tab scorre tra drawer e
  stage); card view **intrappa** il focus nel drawer. La lista resta MONTATA
  (hidden+`aria-hidden`) mentre la card è aperta; Back ripristina il focus
  alla riga di origine by-id. Tooltip dei pin funzionano anche a drawer aperto.
- **D-5 — righe icon-first, NON icon-only**: frame categoria + badge stato +
  **nome sempre visibile** + glifo di stato trailing. Righe painted con glifo
  "on map"; registry-only con trattamento muted "not on map". Sezioni per
  categoria con header sticky collapsible + count `built/total`; le sezioni
  con elementi buildable partono espanse. Riga di filter chip in testa
  (All/Built/Buildable/Locked). Ordine = config order. Niente search né
  virtualizzazione in v1 (16 righe).
- **D-6 — `activeBuildingId` esplicito** (React state in VillageScreenView,
  presentation state locale — non store): `hovered` = pointer su riga o pin;
  `selected` = edificio con card o tooltip pinnato aperto. Precedenza
  `selected > hovered > idle`. `:has()` resta solo come ottimizzazione
  pin-hover→footprint. Hover riga painted → glow footprint **oppure** pin
  ping se il footprint è occluso (vedi D-7). Hover riga registry-only →
  glow ottone interno alla riga: **mai** un'ellisse fantasma sul dipinto.
- **D-7 — occlusione = report, non gate**: il lint calcola
  `occludedAt: {1280,1440,1920}` per ogni edificio painted (quali footprint
  cadono sotto il rect del drawer). Il pin-ping è il fallback solo per gli
  edifici flaggati. **Hard gate solo sugli anchor dei pin**: ogni anchor
  painted deve restare fuori dal rect del drawer a tutti e tre i viewport
  (gli anchor si riposizionano via `anchorNudge`; i footprint seguono il
  dipinto e non si possono spostare). Nessun cambio di opacity del drawer.
- **D-8 — categoria `arcane` + frame `spire`**: 5 nuovi edifici —
  `mageTower` (**buildable**: dimostra uno stato reale, evita il read
  "arcane = tutto rotto"), `adventurersGuild`, `sanctuary`, `alchemist`,
  `cemetery` (locked + `unlockHint`). Il frame spire è insegnato solo nella
  mini-legenda della sezione arcane del drawer; la legenda sullo stage tiene
  i 3 frame dipinti.
- **D-9 — detail card drill-in**: click su QUALUNQUE riga → card sostituisce
  la lista (Back + focus return alla riga). Layout: header art 21:9
  incorniciato a altezza fissa (`aspect-ratio`, `object-fit:cover`,
  `loading=lazy`, fallback = icona categoria) + nome + stato + ladder
  effetti per tier + costo marcato "Preview" (esplicitamente non funzionale)
  + `unlockHint`. I pin dipinti sullo stage mantengono il tooltip floating.
- **D-10 — seam `overlayArt` inerte**: campo Zod
  `overlayArt?: { patchSrc: string; region: Region }` (`.strict()`);
  lint v1: nessun edificio lo popola + test statico che il type surface
  consumato dal renderer non lo include. Seam documentata, zero rendering.
- **D-11 — discoverability**: chip «≡ Registro» DENTRO la plaque insediamento
  con hint `<kbd>r</kbd>` + badge conteggio (buildable+locked — il chip
  pubblicizza il proprio contenuto). Pulse una tantum per sessione al primo
  ingresso villaggio (nessuna persistenza). Hotkey guarded: solo con stage
  focused, no modificatori, no input attivo.
- **D-12 — naming locked**: nome reale + badge lock (il registro È la
  roadmap; `unlockHint` porta il mistero). Campo opzionale `spoiler?: boolean`
  riservato per futuri contenuti spoiler-sensitive.

## Task

### T-001 — Config: `slotKind` discriminated union, `arcane`, 5 speciali, i18n

`villageBuildingsConfig.ts`:
- `slotKind` enum + union discriminata: painted REQUIRE region/anchor
  (lint esistente invariato); registry FORBIDS region/anchor/ellipseOverride/
  stakeTicks/anchorNudge (`.strict()` + superRefine).
- `hasFootprint` derivato exportato (v1: `slotKind==='painted'`).
- `BUILDING_CATEGORIES += 'arcane'`; `PIN_FRAME` guadagna `arcane: 'spire'`.
- 5 nuovi edifici registry-only: `mageTower` (`initialState:'buildable'`),
  `adventurersGuild`/`sanctuary`/`alchemist`/`cemetery` (`locked` +
  `unlockHint`); tiers completi, effetti mock coerenti col tono.
- `overlayArt` campo `.strict()` opzionale + `spoiler?: boolean` riservato.
- Report occlusione: `occludedAt` calcolato per painted vs drawer rect
  (constante `VILLAGE_DRAWER_WIDTH_PX` nel config, ~400 default) ai 3
  viewport; **hard gate**: anchor painted fuori dal drawer rect ai 3 widths.
- i18n: `category.arcane`, `buildings.<id>.*` ×5 ×3 locale,
  `registry.*` (title, filters, onMap/notOnMap, back, close, open, preview
  label, unlockHint label).
- Test unit: union discriminata (3 casi), catalogo = 16, `occludedAt`
  deterministico, anchor-gate, `overlayArt` assente dai dati.

files: `villageBuildingsConfig.ts`, `public/locales/{en,it-IT,pseudo}/idleVillage.json`, `src/localization/i18n.types.ts`, `tests/unit/idleVillage/villageBuildings.test.tsx`

### T-002 — `VillageRegistry` drawer + chip

Nuovo `src/ui/idleVillage/components/gameFrame/VillageRegistry.tsx`:
- Cassetto HudPlaque bordo destro ~360–420px, `translateX(100%)→0`,
  overflowY auto, ≤85vh, `role="complementary"`, aria i18n.
- Header: titolo + filter chip row (All/Built/Buildable/Locked).
- Sezioni collapsible sticky per categoria con count `built/total`;
  sezioni con buildable partono espanse; mini-legenda `spire` solo nell'header
  della sezione arcane.
- Righe: frame categoria + badge + nome visibile + trailing state glyph;
  `data-slot-kind`, `data-state`, `data-building-id`; glifo "on map" per
  painted; muted per registry-only.
- Chip «≡ Registro» dentro la plaque insediamento + `<kbd>r</kbd>` + badge
  conteggio + pulse una tantum (sessionStorage-free: ref/state sessione).
- Drill-in: view-state `list | detail` interno; lista sempre montata
  (hidden+aria-hidden) quando la card è aperta.
- Export dal barrel `index.ts`.

files: `VillageRegistry.tsx` (nuovo), `VillageScreenView.tsx`, `index.ts`, `villageBuildingIcons.tsx` (frame `spire`), legenda stage invariata

### T-003 — `activeBuildingId`, highlight bidirezionale, detail card, Escape

- `VillageScreenView` tiene `activeBuildingId: { id, via: 'hover'|'selected' }`
  con precedenza `selected > hovered > idle` (D-6).
- Hover/focus pin dipinto → riga registro `data-highlighted` +
  scrollIntoView se drawer aperto. Hover riga painted → footprint glow
  (`data-force-glow` sullo stage, CSS puro) **o** pin ping se
  `occludedAt[viewport]` flagga l'edificio. Hover riga registry-only →
  glow interno riga.
- Click riga (qualsiasi) → drill-in detail card (D-9). Pin click → tooltip
  esistente, invariato.
- Escape focus-scoped (D-3): handler per superficie + ordine ambient di
  fallback; aggiornare il commento contratto in `game-frame-pixi.tsx`.
- Focus return: card Back → riga origine by-id; drawer close → chip;
  tooltip Escape → pin origine.

files: `VillageScreenView.tsx`, `VillageRegistry.tsx`, `game-frame-pixi.tsx`

### T-004 — Test, witness, docs

- Unit (`villageBuildings.test.tsx`): union slotKind, catalogo 16,
  `occludedAt`/anchor-gate, overlayArt inerte, drawer render/sezioni/filter,
  highlight bidirezionale, Escape focus-scoped, focus-return by-id.
- Guard (`hudGuards.test.ts`): `VillageRegistry` in STRICT_FILES.
- E2E (`gameVillageView.spec.ts`, headless): BV-8a chip/`r` apre+chiude,
  16 righe, sezioni; BV-8b Escape focus-scoped (tooltip sotto drawer non
  chiude il drawer); BV-8c hover riga painted → glow/ping; BV-8d drill-in
  registry-only → card con ladder + "Preview"; viewport-matrix 1280/1440/1920;
  witness en/it × 1440×900.
- Docs: INDEX, R-206, CURRENT_STATE, COMPONENT_MASTER_INDEX, kanban row,
  manifest `.mw/runs/plan-042-village-registry/` + `verify:bundle`.

## Invarianti / trappole

- Nessuna persistenza, nessuna economia reale: costruzione/upgrade restano
  mock display-only; il costo in card è marcato "Preview".
- T-04: ogni claim visivo chiuso da witness screenshot headless, mai solo
  dal diff.
- Regola 16: zero finestre in primo piano — witness headless.
- `overlayArt` è seam dichiarata, non feature: nessun rendering in v1.
- Il dipinto non si tocca: nessuna modifica a `villaggio.png`, nessuna
  nuova region dipinta oltre le 11 esistenti.
- `skinScope.css` forza `button svg` a 14px: width/height inline su ogni
  SVG dentro bottoni HUD (trappola PLAN-038, ancora valida).
- `transform: scale` clobba `translate(-50%,-50%)`: usare la proprietà
  `scale` standalone per pop-in/ping (trappola PLAN-038).
- Mai ellissi/marker "fantasma" sul dipinto per edifici registry-only.

## Open questions (default adottati dal dibattito — correggibili a battesimo)

- Posizione cassetto: **bordo destro** (cover-crop safe area). Left/bottom
  respinti.
- Discoverability: chip+badge+pulse (adottato); rail sempre visibile respinto.
- Naming locked: nome reale + lock (adottato); `spoiler` field riservato.

## Stime

T-001 0.75g · T-002 0.75g · T-003 0.75g · T-004 0.5g — **~2.75g** totale,
stessa scala di PLAN-038.

## Provenienza dibattito (audit)

Run `.mw/runs/20261016-1054-plan042-village-registry/` (mind-weaver).
Artifact finale `artifact-r005.md`, sha256
`4dac8cdb5be33233e0c76cebeea94fbcb631036b2c0f5eb3b4b4987d496100a6`.
Report automatico: `report.md` nella run dir.

Emendamenti chiave imposti dal dibattito (r001 → r005):
- `:has()` degradato a ottimizzazione locale; highlight su stato esplicito
  `activeBuildingId` con semantica hovered/selected (chatgpt FATAL r1).
- Detail card = view-state del drawer, non layer floating; lista sempre
  montata (deepseek+claude+gemini).
- Escape focus-scoped, non puramente per-layer (chatgpt r4).
- Occlusione: report `occludedAt` + gate su anchor, non su footprint
  (claude acc-r004); nessun dimming del drawer (3 provider r2).
- Focus trap solo in card view; list view non modale (claude r2).
- `overlayArt` `.strict()` inerte + test type-surface (claude/deepseek).
- `mageTower` buildable, non locked (deepseek r1).
- Rebutted: riclassificazione arcane (grok), rename `presence` (deepseek),
  dimming drawer (approvato in r002, ritirato in r005 dopo convergenza 3v1).

## Chiusura (2026-10-16)

Implementato T-001..T-004. Bundle `.mw/runs/plan-042-village-registry/bundle.json`
→ **PASS 4/4** (OB-1 unit 50/50, OB-2 E2E 20/20 headless, OB-3 safeguards,
OB-4 witness). Evidence: `test-results/PLAN-042-2026-10-16.log`,
witness `test-results/plan-042-village-registry/` (drawer+card en/it ×
1280/1440/1920).

### Lezioni apprese / trappole
- `ellipseOverride` nel config è normalizzato 0-1: `footprintOf` (ora nel
  config) converte a px canvas — prima il mark watchtower era sub-pixel
  (bug latente PLAN-038).
- Escape focus-scoped: il primo Escape consuma la superficie topmost
  (card→drawer→tooltip→map); un test che assume «Escape chiude tutto»
  fallisce — è il contratto corretto.
- Le frecce del toolbar roving (container `role="toolbar"` con `onKeyDown`)
  rubano il focus alle righe del drawer: `e.stopPropagation()` sulle righe.
- `requestAnimationFrame` nel focus-return della card: i test devono
  `await` il frame prima di asserire `toHaveFocus`.
- eslint ignora i file `gameFrame/`/`config/` dal config repo (exit 2 su
  glob) — il gate reale è `build:check`; i manifest pipeano lint a `tail`.
- Tipi `dom-temporal`/`pixel-temporal` nel manifest attivano il
  verificatore indipendente + env attestation; per questo scope `state`
  basta (precedente PLAN-038).
