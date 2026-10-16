---
name: idle-village-task
description: Use for any task touching the game domain — the /game surface (Game Frame Pixi), World Surface, HUD and floating panels, quest runtime/planner, residents/roster, slots, POI, skin system, frozen kits. "idleVillage" in paths is the historical domain name; the canonical game surface is /game.
---

# Idle Village / Game Surface Task Mandate

Purpose
This mandate defines the requirements for work on the game domain — historically
called "Idle Village". The domain keeps the `idleVillage` name in paths, config
and i18n namespaces, but the **canonical game surface is `/game` (Game Frame
Pixi)**. The legacy Idle Village page is **deprecated** (Director 2026-10-05).

This skill complements `agent-execution-mandate` (verification gate, safeguards,
git/commit protocol). For tasks under `src/ui/idleVillage/**` the nested
`src/ui/idleVillage/AGENTS.md` applies: invoke `agent-execution-mandate` AND
this skill.

## Surface map (read first)

| What | Where / route |
|---|---|
| Canonical game surface | `/game` → `src/pages/game-frame-pixi.tsx` (Game Frame Pixi) |
| World Surface (painted map renderer) | `src/ui/idleVillage/components/WorldSurfaceRenderer.tsx` |
| HUD shell & slots | `src/ui/idleVillage/components/gameFrame/GameFrame.tsx` |
| Quest run window (baptized component) | `components/gameFrame/QuestRunWindow.tsx` + `questS1Lab/useQuestRun.ts`/`questRun.ts` |
| Quest planner | `quests/QuestExpeditionDetail.tsx` + `quests/useQuestExpeditionSession.tsx` |
| Quest S1 lab | `/quest-s1-lab` → `src/ui/idleVillage/pages/QuestS1LabPage.tsx` |
| Reference vertical slice | `/minimal-gameplay` |
| Roster V2 (HUD visual reference) | `src/ui/idleVillage/rosterV2/` |
| UI labs | `/design-system`, `/visual-fidelity-lab`, `/design-vs-fidelity`, TestHub |

## Knowledge anchors (autorità, da CANON.md)

- Mappa delle autorità: `CANON.md` — check it before assuming which doc decides.
- Stato runtime: `CURRENT_STATE.md` (snapshot curato) + `SESSION_HANDOFF.md`
  (journal — vince sullo snapshot se più recente, regola `70-state-docs-sync`).
- Stato dei piani: `plans/INDEX.md`.
- Regole quest vigenti: `QUEST_RULES.md` (canonico) — manutenzione:
  `.windsurf/rules/80-quest-rules-maintenance.md`.
- Architettura: `src/docs/docs/architecture_state.md` (router dominio → fonte).
- Contratti di verifica: `.mw/contracts/INDEX.md` (`CTR-*` per file toccati).
- Guide di dominio obbligatorie per superficie:
  - `/game` HUD / schermate d'azione: `src/docs/docs/design/hud_component_guide.md`
    (Lacquer Atlas) + `src/docs/docs/design/primitive_composition_rules.md`.
  - Quest UI: `src/docs/docs/idle_village/quest_ui_component_guide.md`.
  - POI family: `src/docs/docs/idle_village/poi_family_spec.md` (+ spec figlie).
  - Roster: `src/docs/docs/idle_village/roster_trusted_components.md` — importa
    sempre da `src/ui/idleVillage/roster/index.ts`, mai dai path interni.
- Registro componenti: `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md`
  (status canonici: `draft`/`candidate`/`trusted`/`frozen`/`deprecated`).

## Pre-flight (mandatory, before touching code)

1. **Recurring traps.** Leggi l'indice per superficie di
   `context/recurring-traps.md` e le trappole che il task tocca. Quelle che
   ricorrono in questo dominio:
   - **T-01** layout `/game` / `PixiWorldMap.refit` / margini mare: pinna il
     bordo protetto, mai allargare la decorazione.
   - **T-02** archi SVG progressivi: mai `strokeLinecap="round"` su archi che
     possono avere lunghezza 0.
   - **T-03** `data-hud-controls`: lo scope va sul root del componente e copre
     dropdown/popover/portal che apre.
   - **T-04** claim percettivi ("si vede", animazioni): si chiudono solo con un
     testimone che può vedere — verifica a occhio in browser reale e viewport
     realistico, la metrica è supporto non verdetto.
   - **T-05** "migliora/fix X" su componente con desiderata FROZEN: grep della
     desiderata prima di codare; istinto "rewrite" non avallato → STOP, chiedi.
   - **T-07** derivati visuali (ombre, halo, countdown): lifecycle/progresso dal
     proprietario, mai da una simulazione parallela.
   - **T-09** misure perf: `vite dev` ≠ produzione — misura su
     `npm run build && npx vite preview` prima di ottimizzare.
   - **T-10** `new AudioContext()` è una syscall pesante (~1 s): mai dentro un
     handler di animazione; creare nel warm-up, `resume()` nel gesto utente.
   - **T-11** i18n è `i18next-icu` app-wide: interpolazioni `{var}` singole,
     MAI `{{var}}`; dentro un `plural` ICU il count è `#`.
   - **T-12** `import.meta.env` in top-level di config consumati dai test:
     optional-chain + default al ramo sicuro.
2. **Desiderata FROZEN.** `grep` su `.mw/desiderata.md` per il nome del
   componente/sistema toccato (T-05). Versioni FROZEN rilevanti per questo
   dominio: v3/v4 (POI quest, pannelli flottanti), v8 (Golden UI), v23 (Mission
   Planner), v24/v27 (quest S1→S5, `QuestRunWindow`), v30 (Vista Villaggio).
3. **Director intent.** Se il Director esprime un intento operativo: catturalo
   in `RICHIESTE.md` e piegalo nello spec canonico (regola
   `45-director-intent-to-spec`). Una nuova regola quest va in `QUEST_RULES.md`
   nella stessa sessione, con status `vigente`/`proposta`/`divergenza-nota`
   (regola 80) — mai assorbimento silenzioso di divergenze da FROZEN.
4. **Documentation impact.** Se il task cambia regole/decisioni/stato, dichiara
   i target documentali secondo `85-documentation-impact.md` (NONE/OPTIONAL/
   REQUIRED + routing: `DECISION_LOG`, `OPEN`, `REJECTED`, `GLOSSARY`,
   `architecture_state`, `CURRENT_STATE`+`SESSION_HANDOFF`, `plans/INDEX`).
5. **Foreground windows.** Nessuna finestra in primo piano in automatico:
   verifiche, catture e probe sempre headless o in background; una finestra
   visibile è uno step manuale del Director (regola
   `.windsurf/rules/16-no-foreground-windows.md`).

## Core Responsibilities

### 1. Frozen Kit Usage

MUST use frozen kits from `@/ui/idleVillage/frozen/kits` when available:

- Create new kits via `npm run freeze:kit <KitName>` when needed.
- Public consumers import from `src/ui/idleVillage/frozen/kits/index.ts`
  (one-line barrel) — never from internal component paths.
- Certified kits need `contract`, `certManifestPath`, `docPath`, `hub` in
  `KIT_REGISTRY` (`src/ui/idleVillage/frozen/registry.ts`); draft kits get
  `status: 'draft'` + `docPath`.
- Add `hub` metadata to kit definitions so TestHub stays generated.
- Every kit has a `KitShell`/`withKitShell` provider chain (self-contained).
- `tests/contract/minimal-vs-test.spec.ts` must pass for every certified kit.
- Kit exceptions are tracked in `src/docs/docs/idle_village/EXCEPTIONS.md`
  (se non esiste ancora: crea la voce secondo regola `30-frozen-kits`).
- Kit certificati non si modificano in place: si copia in una versione V2
  (pattern `rosterV2/`) e si certifica dopo (hud_component_guide §1 regola 14).

### 2. Skin System Requirements

All game UI MUST use the default skin system:

- Il CSS ad-hoc per pagina/componente è un pattern LEGACY deprecato. Qualsiasi
  nuovo skin/tema DEVE essere un preset in `skinConfigRegistry`
  (`src/ui/idleVillage/skins/skinConfigRegistry.ts`) + override in
  `skinCssVariables.ts`. Creare un `.css` standalone per un tema è VIOLAZIONE.
- Read skin state via `useSkinPreferences`; default preset
  `DEFAULT_SKIN_PRESET_ID` (oggi `base`; candidata `lacquer_atlas`).
- Colori e misure solo da token `--skin-*` / `--skin-hud-*`
  (`BASE_SKIN_CSS_VARS` in `skinCssVariables.ts`); sfumature derivate via
  `color-mix`, mai letterali. Nuovi token si registrano lì, non nei componenti.
- In Tailwind v4 un token si legge con `p-(--token)`/`gap-(--token)`; per
  colori/testo usa `style` (`text-[var(…)]` è ambiguo e può non applicarsi).
- Theme di riferimento: Gilded Observatory (`src/ui/styleLab/tokens/
  gilded-observatory.css`) per la UI storica; **Lacquer Atlas** per la HUD di
  `/game` (vedi §6).

### 3. i18n Requirements

All user-facing strings MUST pass through i18n:

- `useTranslation` (`react-i18next`); namespaces `common` e `idleVillage`
  (chiavi `/game` sotto `gameFrame.*`).
- `i18next-icu` è registrato app-wide (`src/localization/i18n.ts`):
  interpolazioni `{var}`, MAI `{{var}}`; count di un `plural` = `#` (T-11).
- Chiavi aggiunte in `public/locales/<lng>/<ns>.json` — al minimo `en` e
  `it-IT`; allinea il mirror `src/localization/i18n.types.ts`.
- Lingue supportate: en, it-IT, pseudo, de, ar, ja, zh-CN.
- Chiavi mancanti telemeterate via `translation_missing` — non sopprimerle.
- Tooling: `npm run i18n:validate`, `i18n:types`, `i18n:extract`, `i18n:audit`.
  Guard regression: `tests/i18n/icuInterpolation.test.ts`.

### 4. Persistence Requirements

All save/load MUST use `PersistenceService`:

- Import from `@/shared/persistence/PersistenceService`
  (`saveData`/`loadData`/`clearData` — Tauri FS + web fallback).
- FORBIDDEN: `localStorage`/`sessionStorage` diretti, persistenza sincrona,
  storage middleware ad-hoc.
- Autosave loops ≥ 30 s; recurring timers ≥ 500 ms.

### 5. Config-First Design

All gameplay/UI values MUST come from config modules:

- Gameplay: `src/balancing/config/**` — per `/game` in particolare
  `src/balancing/config/idleVillage/gameFrameConfig.ts` (`identity`, `hud`,
  `questDetail`, `zLayers`, `breakpoints`, `edgeWash`, `debug`, `worldDressing`).
- UI domain: `src/ui/idleVillage/config/**`; skin/style configs per i token.
- New config modules use Zod schemas; export typed accessors, not raw objects.
- No hardcoded gameplay/UI values in components (niente `12px`, `rgba(…)`,
  soglie, timing nel JSX).
- Perf budgets di `/game` in `src/ui/idleVillage/config/gamePerfBudgets.ts`
  (Zod: p95 ≤ 33 ms, 0 long-frame, boot ≤ 4 s).

### 6. HUD Lacquer Atlas (obbligatorio su `/game` e schermate d'azione)

Prima di creare/modificare qualsiasi componente sopra la mappa leggi
`src/docs/docs/design/hud_component_guide.md`. In sintesi non negoziabile:

- **Il Roster V2 è il riferimento visivo di tutta la HUD** — prova del
  confronto a 1440×900 (e 1280×800 Steam Deck): se a colpo d'occhio sembra un
  prodotto diverso, il componente è sbagliato.
- Unica cornice: `HudPlaque` (`shape`: `hang`/`plinth`/`panel`) da
  `@/ui/idleVillage/skins/primitives`. Mai bordi a mano, mai `clip-path` sul
  contenuto. Spessore banda unico: `DEFAULT_HUD_BAND_PX` in `hudBand.ts`.
- Controlli a pillola: scope `data-hud-controls` sul **root** del componente,
  copre anche dropdown/popover/portal (T-03).
- Testo ≥ 12 px ovunque, `tabular-nums` sui numeri; scala tipografica e densità
  del Roster (§4.2–4.4 della guida); maiuscoletto Cinzel solo ≤ 3 parole.
- Componenti fissi (ribbon/nav/coin) non coprono la terra; i fluttuanti sì ma
  devono essere chiudibili/spostabili. Pannelli via `useHudPanels` +
  `hudPanelRegistry` + `HudPanelsMenu` (`defaultVisible:false`, nessuna
  persistenza visibilità); `HudHideToggle` (tasto `h`) nasconde i cluster.
- Monta in uno slot di `GameFrame`, non `position: absolute` sparso.
- Logica pura in file testabili (`tests/unit/idleVillage/`); aggiungi il file a
  `STRICT_FILES` in `hudGuards.test.ts`.
- Nuove schermate di gioco: riferisci un Interaction Pattern di
  `/design-system` (`componentCatalog.ts`) o proponine uno nuovo PRIMA del
  merge (regola `50-interaction-patterns`).

### 7. Component Reuse Rules

Before writing a new UI component, check:

- `src/ui/atoms/` — general UI primitives
- `src/ui/fantasy/atoms/` — fantasy-specific primitives
- `src/ui/idleVillage/skins/primitives/` — skin/HUD primitives (`HudPlaque`,
  `SkinButton`, `SkinBadge`, `SkinCloseButton`, `SkinScope`, `SkinTitle`,
  `hudBand`, `cinemaFx`)

If a primitive covers the use case: reuse or extend via props. NEVER duplicate
primitive markup/styling. If no primitive covers it, a new one is acceptable
but must land in the correct primitive directory, not as an isolated component
in a page. Solo primitive Materic compatibili con la HUD: `WellBronzeBezel`
(costruzione del bordo) e `MatericGrain` — le altre sono bocciate per la HUD
(vedi guida §2).

### 8. State Management

- **Zustand store**: domain/game state shared across pages or distant
  components (resources, roster, active quests, `useMinimalGameplay`,
  `VillageResidentStore`) — survives navigation.
- **React Context**: local presentation/UI state scoped to a subtree (panel
  density, modal open, view-scoped theme).
- Criterio: serve fuori dal sottoalbero che lo consuma → Zustand; descrive solo
  come una porzione locale si comporta/appare → Context.
- Attenzione a T-08: sotto un clock che ticca (`currentTick`) stabilizza le
  reference alla sorgente (throttle/quantize il valore), non patchare i figli.

### 9. Telemetry Requirements

All game interactions MUST emit telemetry:

- `trackTelemetryEvent` from `@/analytics/telemetry/telemetryProvider`.
- Naming: `feature_action` (`resident_assign`, `poi_select`, `slot_drop`,
  `activity_start`, `quest_run_open`, …).
- Payload: `eventType`, `data` (residentId/activityId/poiId dove applicabile),
  `context`, `timestamp`, `metadata`.

### 10. Domain anchors (percorsi verificati)

- Residents: derivati da Character storage via
  `bootstrapResidentsFromCharacters()`; store `src/ui/idleVillage/store/
  VillageResidentStore.ts`. Roster state is derived, not stored — mai mutare
  direttamente il roster, passa da Character storage.
- Roster: importa da `src/ui/idleVillage/roster/index.ts` (V1 certificato
  `rosterKit`, byte-identico — non toccare) e `rosterV2/` (superficie attiva).
- Slot: `slotRackKit`, `slots/useResidentSlotController.ts`,
  `useResidentDropValidation`, `DropFeedbackUI`. Drag & drop solo via
  `@dnd-kit` + helper esistenti — mai handler HTML5 nativi accanto a dnd-kit.
- POI: contratto in `src/docs/docs/idle_village/trusted/poi_standard_trusted.md`,
  spec famiglia `poi_family_spec.md`, marker su mappa `components/gameFrame/
  MapQuestPoi.tsx` (view-model `mapQuestPoiView` = unico punto di coerenza
  stato semantico ↔ progress, T-07).
- Quest runtime: `QuestRunWindow` + `useQuestRun`/`questRun.ts` (grafo,
  frontiera, persistito via PersistenceService); planner
  `QuestExpeditionDetail`/`useQuestExpeditionSession`; simulazione
  `questS1Lab/questSimulation.ts` (analitico + Monte Carlo seeded).
- Perf probe `/game`: `window.__gamePerf` (`utils/gamePerfProbe.ts`) +
  budget `gamePerfBudgets.ts` + `tests/e2e/idleVillage/gamePerf.spec.ts`.
- E2E dnd-kit: hook `window.__idleVillageTestHooks` (build di test) + helper
  `tests/utils/dragResident.ts` — i hook non alterano il contratto runtime.

## Testing Requirements

- **RTL/Vitest**: unit tests deterministici per logica pura e componenti;
  `npm run test -- <scope>` (max 300 s).
- **Contract**: `tests/contract/minimal-vs-test.spec.ts` per kit certificati;
  `hudGuards.test.ts` per file HUD (token `--skin-hud-*` definiti, font ≥12 px).
- **Playwright E2E**: live su dev server, web-first assertions, context
  isolati; E2E `/game` in `tests/e2e/idleVillage/game*.spec.ts`.
- **Visual**: snapshot baseline per HUD/drag-drop (`test:visual`); distinzione
  hard/soft regression.
- **Verifica percettiva (T-04)**: claim su animazioni/effetti/UI si chiudono
  solo a occhio in browser reale, viewport realistico — non con diff o metrica.
  Se non verificato, va detto.
- **Perf (T-09)**: misure su build di produzione (`vite preview`), mai su dev.

## Runtime smoke test (canonical dev server)

Porta canonica `http://localhost:5173/` (regole `10-canonical-dev-port` e
`15-browser-preview-guard`):

1. `source ~/.nvm/nvm.sh && nvm use` (pinned `.nvmrc`), poi `npm run dev`.
2. Pre-flight: `curl -s http://localhost:5173/src/main.tsx` deve rispondere
   200 con content-type javascript — se risponde `text/html` non è Vite
   (trappola preview Devin `127.0.0.1:58678`: blank screen).
3. La route della pagina deve rispondere 200 e renderizzare senza errori
   console (nessun `Cannot read properties of undefined`, nessun error
   boundary).
4. Smoke fallito → task BLOCKED, non Completato. Il Coordinator verifica il
   log dello smoke nell'evidence log.

## Completion Protocol

Before marking a task complete:

- Safeguards pass (con timeout massimi da `00-project-invariants`):
  `npm run lint -- <scope>` (120 s) · `npm run test -- <scope>` (300 s) ·
  `npm run build:check` (180 s) · `npm run closure:lint` (30 s).
- **Verification gate R-189** (meccanico, vedi `agent-execution-mandate` §6):
  manifest `.mw/runs/<task>/verification.json` all'avvio; `npm run
  verify:bundle` alla chiusura; verificatore indipendente per obbligazioni
  non-`state`; la voce RICHIESTE cita `bundle: .mw/runs/<task>/bundle.json`.
- Runtime smoke test eseguito e loggato.
- Trusted/frozen toccati → `*_trusted.md` + riga `COMPONENT_MASTER_INDEX.md`
  aggiornati (regola `40-documentation-governance`); nessuna chiusura doc
  senza verifica runtime.
- Documentation impact rispettato (regola 85); intenti del Director piegati
  nelle spec (regola 45); regole quest in `QUEST_RULES.md` (regola 80);
  milestone → riga in `SESSION_HANDOFF.md` (+ `CURRENT_STATE.md` se lo stato
  cambia, regola 70).
- Evidence log in `test-results/`; voce `RICHIESTE.md` a `fatta` con
  citazione `bundle:` (la kanban board è in pausa — R-208).

## Quality Standards

- JSDoc su ogni nuova funzione/interface/schema; niente `console.log` in
  produzione; niente codice commentato; type safety.
- Animazioni solo `transform`/`opacity` (GPU-friendly); ref per update
  ad alta frequenza; target < 16 ms/frame.
- Prefer upstream fixes over downstream workarounds.
- Follow existing code style; minimal focused edits; upstream del fix, non
  workaround a valle.

## Failure Modes

If unable to complete:

- Document blockers in evidence log; set RICHIESTE status appropriately.
- Flag for human review if needed; provide clear next steps.
- Never mark complete if safeguards fail — un task senza verifica è BLOCKED,
  non Completato.
