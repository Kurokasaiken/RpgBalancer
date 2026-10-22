# RPG Project Decision Log

**Version:** 1.0 (2026-05-20)  
**Purpose:** Record major architecture & strategy decisions with rationale. Audit trail for "why did we do X?"

---

## Decision 001: Incremental Testing Strategy (6 Phases)

**Date:** 2026-05-20  
**Context:** Vertical slice has existing code (roster, drag, slots) but bugs exist (pickup alignment, ghost clicks). Need strategy to avoid regressions while fixing.

**Decision:** Build 6 minimal pages, each adding one entità/interaction:
1. PgToken alone
2. Roster + PgToken (ordering)
3. SlotRack alone
4. Drag: Roster → SlotRack
5. Activity + Timer
6. StatusHUD (full gameplay)

**Rationale:**
- Each phase is isolated, testable, deployable to `/minimal-{phase}`
- Tests are live Playwright (slow, real), not mocked
- If Phase 4 (drag) breaks, can rollback to Phase 3 and investigate
- Docs are bidirectional: spec → test + test finds gaps → spec

**Alternative rejected:** "Fix everything in place" — risk of invisible regressions

**Implications:**
- ~4 weeks timeline (2-3 days per phase + buffer)
- ~10-15 Playwright tests per phase (exhaustive coverage)
- All behavior must be documented before test written
- Semantic state tracked in `.semantics.json` files

**Status:** ✅ Approved & ongoing

---

## Decision 002: Freezing Semantics as Constraint (Non-Negotiable)

**Date:** 2026-05-20  
**Context:** Multiple bugs (ghost click, spring-return timing, pickup alignment) stem from unclear "what is frozen when". Need single definition.

**Decision:** Define **freezing state machine** for every entity:
- PgToken during drag: frozen (no click, no assign)
- PgToken after failed drag: frozen 900ms (G5 guard)
- PgToken in activity: frozen until timer completes
- Roster: frozen during drag (no reorder while dragging)
- SlotRack: never frozen (stateless)

Documented in `RPG_PROJECT_CONTEXT.md` §3.1 (canonical source).

**Rationale:**
- Makes guard layer conditions explicit (why block this interaction?)
- Tests can verify "frozen state" + "guard blocks attempt"
- If behavior needs to change, it's a documented constraint change, not accidental mutation

**Alternative rejected:** "Guards are implicit in code" — leads to unmaintainability + missed cases

**Implications:**
- Every test must assert frozen state (not just state change)
- Code comments must link to this doc
- If you change freeze behavior, you must update this file + all tests + semantics.json

**Status:** ✅ Approved & enforced

---

## Decision 003: Test are Live Playwright (Not Mocked)

**Date:** 2026-05-20  
**Context:** Existing test suite mixes unit (vitest, mocked) and E2E (playwright, real). For minimal slice, need certainty that bugs are fixed.

**Decision:** All minimal slice Playwright tests run against **live `/dev` server**:
- No mocking of `assignResident()`, no mock timers (except where needed for determinism)
- Visual assertions (drag overlay position, spring-return animation, token position)
- State assertions (token in/out of roster, slot occupied/empty)
- Timing assertions (timer ± 50ms, animation < 500ms)

**Rationale:**
- Mocked tests pass, reality fails (Playwright has caught this before)
- Live tests are slow (~5-10s per test) but catch real bugs (pickup alignment, race conditions)
- Visual regression snapshots catch unintended CSS changes

**Alternative rejected:** "Use vitest with mocks for speed" — speed != confidence

**Implications:**
- Test suite runs slower (~30 min for all 6 phases)
- Must have stable `/dev` server during test
- Tests may be flaky if server is slow (acceptable, will retry)
- Cannot test in CI until Playwright config supports headless mode

**Status:** ✅ Approved & ongoing

---

## Decision 004: Bidirectional Binding (Docs → Tests → Docs)

**Date:** 2026-05-20  
**Context:** Existing docs are outdated, tests are incomplete. Need a way to keep them in sync.

**Decision:** 
1. Write behavior spec in `.md` (narrative, examples, edge cases, known issues)
2. Test file reads spec, implements test cases extracted from spec
3. If test finds new behavior (not in spec), add to spec first, then implement test
4. Semantics `.json` is machine-readable version of spec (for tooling, future)

**Rationale:**
- Docs are primary source of truth
- Tests drive spec updates (not the reverse)
- Machine-readable JSON allows future tooling (auto-test generation, mutation testing)

**Alternative rejected:** "Tests + docs separate, sync manually" — leads to drift

**Implications:**
- Every test must cite line numbers from corresponding `.md`
- Spec file changes must be coordinated with test changes
- `.semantics.json` is derived from `.md`, not source of truth

**Status:** ✅ Approved & enforced

---

## Decision 005: Personal Project Context Governance

**Date:** 2026-05-20  
**Context:** This is a personal hobby project, very different from work projects. Need clear boundary.

**Decision:**
- Separate governance file: `context/RPG_PROJECT_CONTEXT.md`
- Separate decision log: `context/DECISION_LOG.md` (this file)
- Separate test docs: `src/docs/docs/minimal_slice/` (not shared with work projects)
- Separate page routes: `/minimal-*` namespace

**Rationale:**
- Work projects have different standards (enterprise, compliance, processes)
- RPG project is experimental, personal, no-approval-needed
- Clear separation prevents governance bleed

**Implications:**
- All RPG-specific decisions logged here, not in work logs
- Code in `src/ui/idleVillage/` is RPG-specific, not reused in work projects
- Build/deploy separate from work CI/CD

**Status:** ✅ Approved & ongoing

---

## Decision 006: Deterministic RNG + Fixed Seed for Testing

**Date:** 2026-05-20  
**Context:** Outcome calculations (skill checks, loot drops) use randomness. Tests must be deterministic.

**Decision:** All RNG in gameplay uses **seeded PRNG**, not `Math.random()`:
- Outcome calculation: seed = `Date.now() + residentId` (or similar)
- Activity timer: fixed duration, no variance
- Playwright tests use same seed mechanism (or mocked time) for reproducibility

**Rationale:**
- Flaky tests (random failures) are bad for confidence
- Deterministic tests allow regression detection + debugging
- Seeded RNG still provides gameplay variety (different players, different seeds)

**Alternative rejected:** "Disable RNG for tests" — unrealistic, doesn't find real bugs

**Implications:**
- RNG implementation must be configurable (prod seed vs test seed)
- All outcome tests must assert exact result (not "random outcome occurred")
- If you change RNG algorithm, you must update test seeds

**Status:** ✅ Approved & ongoing

---

## Decision 007: Roster State is Derived, Not Stored

**Date:** 2026-05-20  
**Context:** Roster contains PgTokens. Should roster state be independent or derived from Character/Resident storage?

**Decision:** **Roster state is derived:**
- Canonical source: Character Storage (primary)
- Derived via: `bootstrapResidentsFromCharacters()` → ResidentState[]
- Roster renders ResidentState[], no additional state
- If Character updates, Resident updates automatically

**Rationale:**
- Single source of truth (no sync bugs)
- Simplifies state management (less mutation)
- Easier to debug (trace state back to source)

**Alternative rejected:** "Roster maintains independent state" — sync nightmare

**Implications:**
- Never mutate Roster state directly; go through Character storage
- Tests verify "Character updated → Roster reflects update"
- Performance: Roster recomputes if Character changes (acceptable, Resident list is small)

**Status:** ✅ Approved & enforced

---

## Decision 008: POI Quest Config-First Cleanup

**Date:** 2026-08-15  
**Context:** The POI Quest page, QuestChronicle card, MilestoneCheckModal, and quest detail kits were reading hardcoded defaults or importing `DEFAULT_IDLE_VILLAGE_CONFIG` instead of the active `IdleVillageConfig`. This made the `/idle-village-config` editor ineffective for quest timing, skill checks, rewards, and visuals.

**Decision:**
1. `IdleVillageConfig` owns `questTimeScale` and `questSkillCheckConfig` canonically.
2. `PoiDetailQuestRosterTimeClockIntegrationPage` reads `activities`, `questBlueprints`, `globalRules.questPowerRules`, `questTimeScale`, and `questSkillCheckConfig` from `useIdleVillageConfig().config`.
3. Engine functions (`questTotalDurationMs`, `buildAstrolabeSkillsForPhase`, `resolveMilestoneWithoutAnimation`, `resolveQuestPower`) receive their tuning explicitly from the page, with safe module defaults preserved for tests and other callers.
4. `QuestChronicle` derives phase palette and risk from `questChronicleSkinConfig` and `phase.riskProfile`; no hardcoded color/risk tables.
5. `questDetailKit` resolves resource labels/icons from the active `IdleVillageConfig.resources`, not `DEFAULT_IDLE_VILLAGE_CONFIG.resources`.

**Rationale:**
- Config-first invariant requires that gameplay/UI values come from editable config, not module-level defaults.
- Passing config explicitly to pure engine functions keeps the engines testable and decoupled from the store.
- The existing `questChronicleSkinConfig` already contained the needed tokens; using it closes the visual hardcoding gap without duplicating values.

**Implications:**
- Any future change to quest timing or skill-check tuning is now reachable through the `/idle-village-config` editor.
- `MilestoneCheckModal` `criticalFailChance` is calculated from `questSkillCheckConfig.backgroundResolution.epicFailThreshold`, so the astrolabe and the milestone resolver agree.
- `MOCK_QUEST_ITEMS` remains a mock until `IdleVillageConfig` gains a Quest Items tab (ERR-026 now tracked as "da pianificare").

**Status:** ✅ Closed — R-022 marked `fatta` in `RICHIESTE.md`; TP1–TP5 verified by `build:check`, `kanban:lint`, `npm run test -- idleVillage`, and Playwright `poiQuestDetailRosterTimeClock.spec.ts` (17 passed, 1 skipped).

---

## Regressions Found & Fixed

**Regression 001: Drag Pickup Alignment**

| Aspect | Details |
|--------|---------|
| **Date Found** | 2026-05-20 (pre-planning) |
| **Symptom** | Cursor not centered on token when drag starts |
| **Root Cause** | CustomDragOverlay offset or transform-origin not matching token visual center |
| **Status** | 🟡 Investigating (Macro-Fase A.3 of VERTICAL_SLICE_ROADMAP) |
| **Phase to Fix** | Phase 4 (Drag integration) |
| **Blocker?** | YES — blocks all drag interactions until fixed |

**Regression 002: Ghost Click After Failed Drop**

| Aspect | Details |
|--------|---------|
| **Date Found** | 2026-05-20 (pre-planning, guard layers exist) |
| **Symptom** | Token drops outside slot, but synthetic click triggers auto-assign anyway |
| **Root Cause** | Guard layers G1-G6 partially effective; edge case in timing |
| **Status** | 🟡 Guard layers added, needs regression test verification |
| **Phase to Verify** | Phase 4 (Drag integration) |
| **Blocker?** | YES — guard system must be robust |

**Regression 003: Spring-Return Animation Timing**

| Aspect | Details |
|--------|---------|
| **Date Found** | 2026-05-20 (pre-planning) |
| **Symptom** | Token doesn't return to origin after failed drop, or returns too slowly (> 500ms) |
| **Root Cause** | Spring physics timing or animation frame sync issue |
| **Status** | 🟡 Needs measurement in Phase 4 test |
| **Phase to Verify** | Phase 4 (Drag integration) |
| **Blocker?** | YES — UX feedback (visual feedback critical) |

---

## Open Questions (To Be Decided)

### Q1: Should Roster support infinite scroll or pagination?

**Context:** If game has 100+ characters, roster list becomes unwieldy.

**Options:**
- A: Virtual scrolling (render only visible PgToken)
- B: Pagination (10 per page, buttons)
- C: Keep unbounded (accept performance hit)

**Timeline:** Defer to Phase 2, revisit after prototype.

### Q2: Should dropped-outside token animate back, or snap instantly?

**Context:** Spring-return animation is pretty but adds 300-500ms latency feedback.

**Options:**
- A: Animate (current, < 500ms)
- B: Snap instantly (faster feedback)
- C: User preference toggle

**Timeline:** Decide in Phase 4. Test both, ask Fausto.

### Q3: How many test scenarios are "exhaustive"?

**Context:** Phase 4 might need 15+ test cases (drag on slot, drag outside, drag multiple, rapid drag, etc). How many is enough?

**Options:**
- A: Cover all documented behaviors in `.md` (current decision, exhaustive)
- B: Top 5-10 scenarios (faster, less coverage)
- C: Guided by code coverage (75%+ lines covered)

**Timeline:** Stick with A (exhaustive), measure after Phase 1.

---

## Decision 0xx: Test hooks programmatici per E2E dnd-kit in Idle Village

**Date:** 2026-08-15  
**Context:** Le regression ERR-028 e ERR-030 richiedono di verificare drag/drop e drag overlay in Playwright, ma CDP drag non attiva in modo deterministico il `PointerSensor` di `@dnd-kit`.

**Decision:** Esporre in `__idleVillageTestHooks` hook specifici (`setDraggingResidentId`, `assignResident`, `openPoiDetail`) e usarli dai test helper (`dragResident.ts`) in combinazione con CDP per il movimento visivo del puntatore.

**Rationale:**
- dnd-kit è solido in produzione, ma non test-friendly a livello E2E.
- I test hook non alterano il contratto runtime: sono accessibili solo in build di test.
- Permette di verificare in modo stabile lo stato applicativo e il rendering dell'overlay / medaglia.

**Implications:**
- I test non simulano piú unicamente l'evento drag, ma una sequenza ibrida: mouse via CDP + stato via hook.
- Eventuali refactory dnd-kit futuri devono mantenere i nomi dei test hook o aggiornare i test.
- La medaglia dello slot continua a essere renderizzata solo per lo slot 0 (o equivalente). Se questo constraint cambia, va aggiornata la doc del componente.

**Status:** 🔄 Proposto, in attesa di esecuzione piano PLAN-004

---

## Decision 010: Protocol-First Approach (Read Desiderata Before Coding)

**Date:** 2026-08-17  
**Context:** Session on "improve Destiny Astrolabe V1" resulted in 3000 LOC V5 rewrite that violated desiderata FROZEN v3/v4 (which required V1 canonical). Root cause: skipped reading desiderata.md and AGENTS.md before starting.

**Decision:** Establish protocol rule: **ALWAYS read desiderata.md FROZEN before writing a single line of code**. If task says "improve X" and you think "needs rewrite", STOP and ask: "Is rewrite approved, or is desiderata requesting patch?"

Formalize in AGENTS.md §F3.1:
- Scope tension with desiderata must be stated before proceeding, citing the line
- Unilateral decisions to deviate from desiderata are forbidden
- Pattern logged in `.mw/pattern-big-rewrite-without-authority.md`

**Rationale:**
- desiderata.md is the ground truth for scope; project decisions are recorded in DECISION_LOG and DESIGN_PILLARS
- Skipping the protocol read led to: wrong scope, wrong component version, wasted 8 hours, late discovery of i18n error
- AGENTS.md §F3 already forbids silent scope deviation; it was simply not read

**Alternative rejected:** "Assume large component improvements need rewrite" — This violated explicit desiderata that said V1 must stay canonical.

**Implications:**
- Every task begins with 10-min read of: AGENTS.md, desiderata.md, context/INDEX.md
- Any detected scope tension requires asking Director before coding
- Verification must be incremental (max 200 LOC before browser test)
- Pattern is high-replicability; reachable future agents must read this decision

**Status:** ✅ Approved & mandatory going forward

---

## Decision 011: World Surface Sea Motion — Sparse Painted DOM Marks (PLAN-013)

**Date:** 2026-09-08  
**Context:** `R-066` asked for a measured, plan-first approach to make the painted sea read as slightly alive. Open-sea crops are nearly flat luminance fields; displacement, colour breathing and scrolling detail either produce no visible motion or fail the painterly/atlas style at normal map zoom.

**Decision:** Adopt `plans/PLAN-013-sea-marks.md`:
- Keep the baked `Mare.webp` layer completely static — no transform, scale, rotate, or parallax.
- Add `WorldSurfaceSeaMarks.tsx`, a DOM overlay of 20–40 transparent hand-painted sea marks, placed deterministically from `sea_mask.webp` / `points.json`.
- Animate only `opacity` and `transform: translate3d()` via CSS `@keyframes` or SMIL, with 2–3 variants per mark and a 1–4 world-px drift.
- Coast-first, open-water marks optional and conditional: remove them if they do not read at zoom ~0.33.
- All values config-first via Zod and `skinConfigRegistry`; `prefers-reduced-motion` disables everything; Tauri profiling mandatory before rollout.

**Rationale:**
- The structural limit is the source image: open sea has almost no high-frequency detail to move, so any full-canvas geometric or shader displacement is invisible or noisy.
- Independent painted overlays preserve the atlas look, cost very little, and animate with the same CSS/SMIL approach already used for cloud shadows and waves.
- A DOM overlay avoids a WebGL context and gives a clean `prefers-reduced-motion` kill switch.

**Alternative rejected:**
- Full-canvas displacement/ripple on `Mare.webp` — invisible on open sea, risks seams.
- Soft-light / colour-breathing over the whole sea — imperceptible at tasteful intensities; visible at stronger intensities breaks the painting.
- Tiled scrolling water detail — tiling becomes obvious at real zoom.
- WebGL/Pixi shader for the sea — unnecessary for the first path; separate from the v21 terraferma displacement workstream.

**Implications:**
- `SeaEffectLabPage` must show at least two side-by-side `WorldSurfaceRenderer` panels for comparative review.
- T6 evidence log must record frame-time, DPR, visible mark count, and compositor layer count on a modest WebView target.
- i18n keys for any new UI labels; no ad-hoc CSS files.

**Status:** ✅ Approved by ChatGPT, Claude, DeepSeek. Gemini and Grok could not respond due to tooling/rate limits. Plan is active in `ROADMAP.md`.

---

## Future Decisions (Roadmap)

- **Macro-Fase B onwards:** Will need decisions on MarketActionCard design, outcome modal layout, level-up animation, etc. Log decisions here as they arise.
- **Steam integration:** Build strategy, certificates, storefront design. TBD.
- **Localization:** EN primary, IT stub. Decision on translation tooling later.

---

**Last updated:** 2026-08-15  
**Frequency:** Update after each major decision (expected ~1x week during development)  
**Owner:** Fausto Boni

---

## 2026-08-28 — Il prop `gameplay` di DayNightTimeEngineStrip è sicuro, e non è un'ottimizzazione

**Da:** la documentazione del kit (`clockKit.md`) e la JSDoc del componente
raccomandavano di passare `gameplay` alle pagine che già chiamano l'hook, «per
evitare una doppia sottoscrizione».

**A:** passare il prop era **l'unico modo di rompere il componente**. La
risoluzione era `gameplayProp ?? useMinimalGameplayWithIdleVillageConfig()`, che
salta l'hook quando il prop è presente: una chiamata condizionale a un hook. Ogni
pagina che seguiva l'esempio documentato crashava con *"change in the order of
Hooks"* appena il prop compariva o spariva tra due render, hot reload incluso.
Ora l'hook è chiamato incondizionalmente e il prop viene solo preferito dopo. Le
due forme sono equivalenti; passare il prop è una comodità, non un risparmio.

**Motivo:** seguito l'esempio della JSDoc su `/poi-marker-lab` e ottenuto il
crash, con `TypeError: Cannot read properties of undefined` a valle. Fix
verificato esercitando il prop path: strip renderizzato, nessun errore di ordine
degli hook.

**Fonte:** `.mw/runs/2026-08-28-poi-materic-v4/pattern-candidate.md`

---

## 2026-08-28 — Gli archi progressivi non usano mai `strokeLinecap="round"`

**Da:** invariante applicata caso per caso, tre volte, su componenti diversi
(`DayNightPoiSkin`, `GenericPoiSkin`, `MagicCircleHalo`,
`HaloProgressComponent` il 2026-08-15).

**A:** è una regola generale e va scritta come tale. Un arco la cui lunghezza
nasce da zero dipinge il proprio cap come un disco della larghezza dello stroke
nel punto iniziale: con cap tondo resta un punto a ore 12 prima che il timer
abbia scritto nulla, tanto più grosso quanto più spesso è il tratto. Il fronte
morbido va ottenuto con un elemento dedicato, non col cap.

**Motivo:** il pattern era già in `observation.jsonl` da due sessioni e **non ha
impedito la regressione**: `PoiMatericV4` l'ha reintrodotto da zero su cinque
archi, incluso il binario d'ombra spesso 4,5 unità. Registrare l'osservazione non
è bastato; serve l'invariante in un posto che si legge prima di scrivere.

**Fonte:** `.mw/runs/2026-08-28-poi-materic-v4/pattern-candidate.md`

---

## 2026-08-31 — World Surface: revoca dei vincoli no-shader/no-parallasse per il water lab

**Da:** `DESIGN_PILLARS.md` §1 e `world_surface_reactive_artifact_plan.md` vietavano shader custom e parallasse su World Surface.

**A:** il Director revoca esplicitamente i due vincoli in autonomia di sperimentazione:
- shader custom (GLSL/Pixi filter) ammessi nel water lab e per effetti profilati, con fallback DOM;
- micro-parallasse ammessa per overlay separabili (nuvole, ombre, luce, token), mai per i layer full-canvas baked 4240×2828.

**Motivo:** i precedenti tentativi sull'acqua (DisplacementFilter, WaterField) sono falliti perché il mare dipinto non ha dettaglio ad alta frequenza. Senza poter provare shader e overlay parallasse in un lab controllato, ogni nuovo tentativo sarebbe cieco. Il Director ha deciso di abbassare la barriera tecnica per permettere confronti misurabili.

**Implicazioni:**
- `WorldSurfaceCloudShadows` è sempre attivo (`breath` on).
- `/sea-effect-lab` ospita tentativi affiancati con fallback e profilazione.
- Ogni shader/parallasse nuova richiede evidence log di frame-time e DPR.

**Fonte:** sessione esecutiva R-059; `.mw/desiderata.md` v19.

---

## 2026-09-29 — Mission Planner: il modello di rischio canonico è quello per-fase, esteso per residente

**Da:** PLAN-018 T-000 — coesistevano due modelli di rischio: risk roll singolo per fase durante la quest (`resolveMilestoneWithoutAnimation`, `riskProfile`) e `resolvePartyConsequences` (chance uniforme per esito, per residente) a fine quest (`QuestPowerEngine`).

**A:** opzione **A** approvata dal Director. Il modello **per-fase** diventa canonico ed è esteso **per residente**: ogni fase produce chance di ferita/morte per ogni membro della spedizione (rischio base della fase + `residentRiskModifiers` dello slot occupato + contributi del loadout). `resolvePartyConsequences` smette di essere la fonte delle conseguenze; la risoluzione userà lo stesso modello per-fase che il Planner mostra in anteprima.

**Motivo:** il Planner deve mostrare il rischio che accadrà davvero — se mostra un modello e la risoluzione ne usa un altro, i numeri mentono. La scelta è coerente con desiderata v3 ("ogni fase può produrre ferite/morte") e v12 (morte spostabile fra membri, che richiede chance per-slot).

**Implicazioni:**
- `computeMemberRisk` nel planner engine aggrega il rischio sulle fasi per singolo residente; l'aggregato party (P almeno un morto/ferito) deriva da quello.
- Le fasi oggi producono un solo `wounded`/`dead` per fase — il resolver va esteso a risultati per-residente accumulati per fase.
- PLAN-018 T-001/T-006 aggiornati di conseguenza.

**Fonte:** scelta "A" del Director in sessione 2026-09-29; `plans/PLAN-018-mission-planner.md`.

---

## 2026-09-29 — Mission Planner: almost non conta, solo i morti escono, la cavalcatura occupa uno slot

**Da:** critica multi-AI su PLAN-018 (chatgpt/claude/deepseek, run
`.mw/runs/2026-09-29-plan-018-critique/`): il piano congelava l'architettura ma
non la matematica, e tre punti semantici erano irrisolti.

**A:** tre decisioni del Director (desiderata v23 rev.3):

1. **`almost` NON conta come fase superata.** `isPassingVerdict` passa a
   `bigwin | win` soltanto; la banda near-miss resta narrativa. È una modifica
   alla semantica runtime di `resolveQuestOutcomeTier`, non solo al Planner.
2. **Solo il morto smette di contribuire alle fasi successive** (precisazione
   Director "solo morto"). Il ferito resta: contribuisce normalmente e continua
   a tirare rischi (può morire dopo). Le fasi cessano comunque di essere
   indipendenti: la probabilità di passare la fase k dipende da chi è
   sopravvissuto alle fasi 1..k−1. Il motore analitico del Planner deve quindi
   essere una **programmazione dinamica esatta sull'insieme dei vivi**
   (2^m insiemi × n fasi), non una Poisson-binomiale su probabilità fisse.
   Il rischio per-membro resta in forma chiusa perché i tiri rischio non
   dipendono dagli esiti delle fasi.
3. **La cavalcatura occupa uno slot equip.** Velocità = trade-off meccanico,
   non free lunch.

**Motivo:** (1) v23 dice "partial non è successo" e il near-miss non è un
superamento; (2) senza esclusione dei caduti il modello sarebbe matematicamente
più semplice ma narrativamente falso e meno drammatico — la cascata di perdita
è esattamente il tipo di conseguenza che il Planner deve far sentire; (3) il
Director vuole che la velocità competa con la sopravvivenza dentro il loadout.

**Implicazioni:**
- Impatto balance: quasi-passate (~10pp a fase) smettono di contare → le quest
  diventano più difficili. PLAN-018 richiede un'analisi comparativa del tasso
  di successo/mortalità vecchio vs nuovo sui blueprint esistenti prima del
  merge del nuovo resolver.
- Il resolver runtime deve tracciare lo stato per-membro lungo le fasi
  (funzionale / ferito / morto) — stato nuovo nel loop di risoluzione.
- Il test Monte Carlo diventa verifica secondaria con tolleranza fissata; il
  contratto primario è il modello analitico deterministico.

**Fonte:** risposte del Director in sessione 2026-09-29; `plans/PLAN-018-mission-planner.md` v2.

---

## 2026-09-30 — Mission Planner: cover, checkpoint ritiro, consumabili pool, checkStatTags

**Da:** PLAN-018 v3 "Decisioni aperte" D1–D4 dopo la review avversariale.

**A:** risposte del Director (desiderata v23 rev.4):

1. **D1 sì — meccanica cover.** Slot/item/tag stat possono dichiarare
   `coverRiskDelta` (pp negativi) che riducono il rischio degli **altri**
   membri. Il membro che assorbe resta il più esposto (coerente con v12).
2. **D2 — checkpoint continua/ritirati tra le fasi.** Il giocatore sceglie a
   ogni fine fase se proseguire o ritirarsi. Ritiro → tier sulle fasi giocate
   (regola ≥50% invariata), effetti delle fasi risolte già applicati. Wipe
   (S=∅) → chiusura forzata `deadly`. È una feature del loop di risoluzione:
   entra in PLAN-018 MP-06 e nella spec matematica (MP-00).
3. **D3 sì — consumabili pool party**, applicati a ogni check, consumati al
   lancio.
4. **D4 sì — `checkStatTags` separati dal gate + `partyStatMult`** in
   `questSkillCheckConfig`, valore dal balance report MP-00.

**Implicazioni:**
- Il planner modella la full-run; il checkpoint è una feature di risoluzione.
  La spec formalizza anche "P(sopravvivere alla fase k)" come output derivato —
  base per un futuro "consigliere di ritiro".
- MP-06 cresce: oltre al resolver per-residente serve il punto decisionale
  continue/retreat nella superficie quest (chronicle/card).
- D1+D4 cambiano lo schema item e le fasi: MP-02 è bloccato da MP-00.

**Fonte:** risposte del Director in sessione 2026-09-30; `plans/PLAN-018-mission-planner.md` v3.

---

## 2026-10-01 — Quest: informazione, morte come risorsa, requisiti obbligatori/secondari

**Da:** tensioni sollevate dall'explorer confrontando la discussione "esploratore / informazione /
narrativa emergente" con `DESIGN_PILLARS.md` e desiderata v23.

**A:** risposte del Director:

1. **Informazione delle quest.** La stat primaria (o le stat primarie) di una quest è sempre
   rivelata. L'esplorazione/esploratore dà **informazioni secondarie**: stat secondarie delle fasi
   (ogni fase può avere A principale + B, o A + B e C secondarie, come mostra il componente skill
   check), pericoli (es. veleno), sorveglianza, presenze non identificate. Nessun conflitto con il
   Planner v23: il Planner calcola su ciò che è noto.
2. **Opacità (Pillar 2 "D&D classico, leggibile").** Nessun conflitto secondo il Director.
3. **Morte di un PG = spesa di una risorsa PG.** Scambiare risorse con altre risorse è un must del
   genere strategico. Superata la riga di Pillar 2 "la slice non punisce con perdite definitive".
4. **Requisiti.** Esistono ingredienti e slot **obbligatori** e **secondari**; la preparazione
   secondaria è facoltativa. Precisa (non contraddice) Pillar 3 "Senza ingredienti, niente quest".

**Implicazioni:** `DESIGN_PILLARS.md` Pillar 2 e Pillar 3 aggiornati (approvazione Director
2026-10-01, "devi mettere quelle specificazioni").

**Fonte:** sessione 2026-10-01.

---

## 2026-10-01 — Competenze di quest derivate dalle stat del balancer

**Da:** stat di quest mock (`strength`/`agility`/`endurance`/`intelligence`/`perception` in
`idleVillage/defaultConfig.ts`).

**A:** le stat reali sono quelle del balancer (`balancer-default-config.json`). Le competenze usate
dagli skill check delle quest (Percezione, Forza, Costituzione, …) sono **derivate** dalle stat del
balancer — es. Percezione ← `txc`, Forza ← `damage`, Costituzione ← `hp`. **Il balancer non si
tocca.** Mappatura completa da definire; secondaria per S1 (che può usare mock).

**Fonte:** Director, sessione 2026-10-01; desiderata v24 rev.1 punti 12–13.

---

## 2026-10-01 — PLAN-019: MP-07 procede ora; sconfitta = nessuna reward di quest

**Da:** decisioni aperte D-1 e D-8 del macro plan Quest (`plans/PLAN-019-quest-macro-plan.md` v3).

**A:**
1. **D-1:** *"D1 lo facciamo ora"* — MP-07 di PLAN-018 (docs/test/evidence del Planner) procede ora,
   non si congela in attesa della mappatura S2/S3.
2. **D-8:** *"Sconfitta nn significa che hai reward, è ancora valide"* — la soglia ≥50% dei check
   affrontati resta valida; sotto soglia la quest è una sconfitta e non dà reward di quest. Sostituisce
   il "reward proporzionale ai successi" di MASTER_PLAN Phase 11. Il bottino raccolto durante la
   quest resta (regola della fuga, v24 rev.1 p.11).
   **Superata 2026-10-02:** rev.2 lega la reward a una prova-obiettivo e al leader vivo; la soglia
   ≥50% non decide più la vittoria (resta statistica descrittiva).

**Fonte:** Director, sessione 2026-10-01.

---

## 2026-10-02 — Modello obiettivo/reward, compound, leader, bodyguard, rischi per slot

**Da:** esplorazione sul significato della % di riuscita e delle conseguenze, durante la
preparazione del plan figlio PLAN-019-S1. Drift registrato in
`.mw/runs/20261002-plan-019-s1-deliberation/desiderata-drift.md`; avallo del Director con
*"approvo"*.

**A (desiderata v24 rev.2):**

1. **Reward di quest ≠ conteggio check.** Una **prova-obiettivo precisa** assegna la reward;
   bottino di fase e reward di quest sono categorie distinte: l'acquisito si tiene, le fasi vinte
   possono dare extra, fuga = fallimento con bottino conservato.
2. **Riuscita dalla partenza = compound.** La % vista per decidere se partire comprende rischi e
   percorsi prima dell'obiettivo; non è la sola probabilità della prova finale. Consumabili e
   scelte future la rendono una stima su ipotesi, non un valore assoluto.
3. **Leader.** Slot speciale di spedizione; se il leader muore la reward di quest è persa, anche
   a obiettivo già superato. Il board wipe resta possibile come esito estremo.
4. **Rischi per slot.** Ferita/morte tirate per slot con % diverse; il verdetto del check di
   gruppo modifica le chance **prima** dei tiri personali (`win` −5pp a entrambe, `fail`/`almost`
   neutri; critici: `bigwin` downgrade morte→ferita, `epicfail` upgrade ferita→morte).
5. **Bodyguard.** Slot opzionale che intercetta **solo** ferita/morte da skill check (non eventi,
   spell, combattimenti, effetti diretti): sacrificio leggibile a favore degli slot protetti.
6. **HP separati** da ferita/morte (D-7). Stop iterazioni S1 = parere del Director (D-4).
7. **Aperte (D-9):** conseguenze dei fallimenti sulla prosecuzione, wipe, bodyguard su danni
   multipli/ferito, quantità critici e cumulo con −5pp, death save candidato non approvato.

**Implicazioni:** `missionResolver`/`memberPhaseRisk` attuali (rischi per membro indipendenti dal
verdetto, cover additiva) **non** implementano questo modello; il piano S1 lo tratta come ipotesi
da validare nel lab, il runtime si adegua in S2.

**Fonte:** Director, sessione 2026-10-02; desiderata v24 rev.2.

---

## 2026-10-02 — PLAN-019-S1: criterio «divertente, non funzionante» + matrice quest-design

**Da:** battesimo PLAN-019-S1 e chiusura delle decisioni aperte D-9 via Q&A con il Director.

**A:**

1. **Criterio S1:** *«nn ci interessa che funzioni, deve essere divertente»* — le meccaniche
   rev.2 stanno nel lab come strumenti di tensione nella forma più economica, valutate al Gate
   sul momento drammatico prodotto, non sulla correttezza.
2. **Matrice chiusa** (`.mw/runs/20261002-s1-quest-design/quest-design.md` — copia tracciata:
   `context/QUEST_S1_DESIGN.md`; integrazione
   serale): leader = slot fisso
   della quest; ferita = +rischio nei check successivi; wipe = tutti i PG morti; fonte
   non-check = incidente in viaggio; bodyguard intercetta **tutti** i danni da check finché vivo;
   `bigwin` = −5pp cumulati + downgrade; «continua ad esplorare» → fuggire non perde niente
   (rischiano solo le vite); 4 preset incluso uno con bodyguard; nessuna keyword per il
   modificatore in S1; **wipe = si perde tutto**; **death save dentro: 5%** su esito morte →
   sopravvive ferito (mock, si calibra al Gate); parametri numerici = mock iniziali ragionevoli
   fissati dall'AI nella matrice, da ritoccare nel playtest.
3. **Meta-apprendimento (deriva multi-AI):** le critiche web tendevano a sgonfiare S1 verso il
   prior «lean MVP», la deliberazione interna a gonfiarlo (timer, panel mandatory, Evidence UI,
   status FROZEN inventato). Regola registrata: convergenza dei modelli ≠ aderenza all'intento
   del Director; il criterio decisionale resta il divertimento percepito, non il consenso AI.

**Fonte:** Director, sessione 2026-10-02; `plans/PLAN-019-S1-quest-interessante.md` battezzato.
---

## 2026-10-03 — Noise parcheggiato (stealth-specific) + epicfail dentro la banda

**Da:** review del Director sul redesign della quest dopo l'audit di losabilità.

**A:**

1. **Noise meter: parcheggiato.** Il meter di pressione accumulata non entra nel prototipo
   base/generico di quest — è un'idea valida solo per tipologie dominio-specifiche (es. stealth).
   Non va reintrodotto nel prototipo generale senza decisione esplicita.
   (*«il noise nn deve esserci nel prototipo base/generico, è una idea interessante x
   applicazioni future»*). Nota: il codice lab stampa ancora `RUMORE ◉○○` inerte — da
   rimuovere o spegnere quando si tocca lo scenario.
2. **Epicfail opera dentro la banda di rischio dichiarata.** L'epicfail può peggiorare l'esito
   fino al massimo previsto per quel check (ferita dove era dichiarata ferita, morte solo dove
   M%>0 era visibile al commit) — mai oltre la banda. La scelta definisce il range di esiti
   possibili; il dado modula dentro. (*«Epic fail su check nn uccide sempre»* formalizzato).
   Da formalizzare come check-contract spec in S2.
3. **Criterio di diagnosi congelato:** «una quest infallibile, dove non c'è mai suspense, non
   ci sono preoccupazioni né punti di gioia, è inutile. Le scelte non sono scelte se non posso
   mai fallire.» → la losabilità e l'attribuibilità del fallimento sono il requisito, non una
   percentuale target.

**Implicazioni:** vincola ogni proposta di redesign della quest (inclusa v6 in
`.mw/runs/20261003-quest-v6-science/`); documentate come principi operativi in
`context/QUEST_GAMEPLAY_SCIENCE.md` (risk-band → check-contract; noise → sezione stealth
dominio-specifica).

**Fonte:** Director, sessione 2026-10-03.

---

## 2026-10-08 — La guida HUD (Lacquer Atlas) vale anche per le schermate d'azione a pagina intera

**Q:** `hud_component_guide.md` nasce per i pannelli **sopra la mappa** di `/game`.
Vale anche per schermate d'azione a pagina intera senza mappa (es. il lab quest)?

**A:** Sì — con traduzione di una regola: su `/game` l'eroe è la mappa, sulle schermate
d'azione l'eroe è **il dipinto di scena** (D1 Director: «Dipinto» come sfondo
dell'intera stage band). Il telaio resta `HudPlaque` (`hang`/`plinth`), i token
`--skin-hud-*`, i controlli `data-hud-controls`, testo ≥12px. Le liste sono righe
di superfici trusted (roster compact), non sotto-scatole. Formalizzato in
`hud_component_guide.md` §6b (PLAN-024) e la guida è ora indicizzata
(context/INDEX, KNOWLEDGE_INVENTORY, CLASSIFICATION, checklist mandate).

**Fonte:** decisioni Director D1–D3 durante R-104 (sessione 2026-10-08).

---

## 2026-10-09 — Motore quest canonico, assegnazione da POI e derivazione delle competenze (S2, R-107)

**Contesto:** avvio di PLAN-019-S2 («un paio di POI funzionanti con POI detail
veri su /game»). Gate delle decisioni risposto dal Director in sessione.

**Decisioni:**

1. **Motore canonico = grafo di nodi** (`questRun.ts`). Chiude PLAN-019 **D-2**
   senza spike ex-novo: la prova è già in produzione — 3 quest authored, la
   frontiera v27 implementata lì, PLAN-025 ci costruisce il teatro sopra, il
   Monte Carlo lo misura. `QuestBlueprint` (Zod, fasi lineari) si riduce a
   *busta offerta* del POI (metadati per detail/planner); gli scenari authored
   migrano a schema Zod config-first.
2. **Divergenza registrata** (approvata dal Director): PLAN-019 diceva «il
   codice S1 non viene promosso: si trasferiscono le regole, non
   l'implementazione». Il motore è diventato canonico **per costruzione**;
   resta valido il principio che le *regole* validate governano — i contenuti
   e i parametri si promuovono a config, non si ricopia la pagina lab.
3. **Assegnazione:** si riusa la session POI esistente (detail + slot roster
   già montati su `/game`); il Mission Planner completo resta lavoro di S3
   (v24). Il vecchio path milestone è bypassato per le quest a motore nuovo e
   resta vivo solo sulla superficie deprecata. Una spedizione attiva alla
   volta nel primo slice.
4. **Derivazione competenze (chiude PLAN-019 D-3 in forma pipeline):** le stat
   dei membri di spedizione si **derivano dallo StatBlock combat reale** del
   residente, non dal mockup lab: `str←damage`, `con←hp`, `perc←%tohit`
   (`hitChance`; flat `txc` candidato), `agi←evasion` (dodge) — mappatura
   corretta dal Director in sessione («%tohit = percezione, dodge = agilità»).
   `int` e `cha` sono **mockate ma nella
   stessa pipeline config-driven** — la regola di derivazione vive in config
   Zod (`questMemberStats`), così la decisione finale del Director cambia solo
   la config. I check `cha` usano il canale `int` («rimappa su int»).

**Fonte:** Director, risposte al gate T-001 di PLAN-019-S2 (2026-10-09); R-107.

---

## 2026-10-09 — Componente quest in corso battezzato: `QuestRunWindow` (R-107, D-F)

**Contesto:** durante l'esecuzione di R-107 (PLAN-019-S2) il Director ha chiarito
che il componente corretto per la «quest in progress» su `/game` è quello che si
apre dalla Regia — `QuestRunWindow`
(`src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx`), mosso da
`useQuestRun` sul motore a grafo `questRun.ts`.

**Decisione:**

- **`QuestRunWindow` è il componente battezzato** per la quest in corso su
  `/game`: pannello HUD fluttuante (HudPlaque, trascinabile, riducibile a
  icona), teatro cinema, scelte, barra tempo sul clock di gioco, tile delle
  fasi. Si apre dalla Regia («Start goblin quest») e dal menu Pannelli
  (tasto Q, pannello `quest`).
- `QuestTheatre` (PLAN-021) **converge dentro** `QuestRunWindow`, non il
  contrario — coerente con R-106 iterazione 3 («un solo componente»,
  direzione B: architettura teatro + contenuti/pezzi del lab).
- Il POI (`MapQuestPoi` + `useQuestPoiSession`) emette l'intento di lancio;
  `useQuestRun` resta l'unico owner del run (PLAN-019-S2 I-4); la
  presentazione è `QuestRunWindow`.

**Fonte:** Director in sessione 2026-10-09 («dentro la pagina /game c'è il
componente quest in progress che si apre dal director, quello è il componente
corretto. Aggiorna la documentazione x puntare a quello come "componente
battezzato"»); registrato come D-F in `plans/PLAN-019-S2-quest-vera.md`.

---

## 2026-10-09 — S2: world-scaling, semantica halo e gating temporale dei nodi (D-I, D-J, D-K)

**Contesto:** chiusura dei punti aperti di PLAN-019-S2 dopo la critica multi-AI
(r1) e la spec verbatim del Director sul POI detail.

**Decisioni:**

1. **D-I — Modificatori esterni = world-scaling reale.** Pericolo e reward
   dell'offerta si bilanciano su segnali di progressione del mondo:
   `collectWorldProgressSignals()` (giorni dal TimeEngine — reale; potenza
   media eroi da `statSnapshot` — metrica da definire, mock-hook tracciato;
   potenza media equip da `equipmentStorage` — hook reale) → config
   `worldScaling` (pesi + bande Zod) → `{dangerScale, rewardScale}` nel bag
   `modifiers` di `resolveQuestOffer`. Formula v0 sostituibile come unità; i
   valori risolti si congelano nel run alla creazione.
2. **D-J — Halo = puro elapsed/durata.** L'halo del POI indica «quanto tempo
   ci vuole a fare la quest»: riempimento = tempo trascorso /
   `estimatedDuration` da config. **Non si ferma ai bivi** — il badge
   «decisione in attesa» è un segnale separato (D-H-4), non parte del
   riempimento.
3. **D-K — Nodi gated da schedule assoluto + caricamento finestra.** Ogni
   nodo ha la sua porzione della durata (`1 tick = 1 s`): è risolvibile dal
   giocatore quando la porzione è maturata, e la maturazione **non dipende
   dalla risoluzione dei nodi precedenti** — i nodi scaduti si risolvono in
   sequenza senza attesa (ritorno a metà durata → batch delle fasi scadute).
   `QuestRunWindow` segue lo stesso modello: tile in fondo = fasi superate +
   preview della successiva; durante l'attesa si mostra la frase di
   flavour/transit.

   **Raffinamento Director 2026-10-09 (post-critica r2 figli):** la forma
   «finestra assoluta sulla durata totale» è incoerente su grafo con rami →
   semantica ratificata `readyAt(nodo) = arrivo sul nodo lungo il percorso
   effettivo + nodeDuration` (durata per nodo da config), identica
   all'esempio originale su percorso lineare; **durata viva**: un nodo extra
   raggiunto aggiunge la sua durata al totale *in quel momento* — halo e
   tile fasi si adattano a run in corso. Spike bloccante S2.4/T-0: layer
   sopra `matureReady` o deroga I-3.
4. **Feriti in spedizione — DECISO (2026-10-09):** i residenti feriti sono
   **ammessi**, senza warning; la penalità vive nei dati (HP di partenza
   ridotto + modificatori stat da InjuryEngine nell'adapter
   `residentToQuestMember`) → il forecast ne tiene conto automaticamente.
5. **`perc ← txc`** (flat, indipendente da evasion) — chiude la
   sotto-decisione di D-C; l'anticorrelazione perc/agi con `hitChance` era
   un difetto reale («l'esploratore agile è cieco»).
6. **Wipe** = ∀ slot assegnato `morto` (leader morto con sopravvissuti ≠
   wipe); **obiettivo sì + fuga + leader vivo → reward sì** — confermati
   contro la matrice.

**Fonte:** Director in sessione 2026-10-09 (R-107, risposte al gate post-critica);
registrate in `plans/PLAN-019-S2-quest-vera.md` (D-I/D-J/D-K) e rifluese in
`PLAN-019-S2.4` (post-invio + T-4).

---

## 2026-10-09 — R-108: risposte del Director alle 5 domande del brief «Emotional Mechanics»

**Contesto:** sintesi comparativa delle 4 AI raccolte (manca DeepSeek 2/5) +
audit repo in `context/ingestions/2026-10-09-emotional-mechanics-quest/SYNTHESIS.md`.
Le AI convergevano sul «duello a pattern» come prima primitiva — presupposto
che le risposte del Director ribaltano.

**Decisioni (Director, 2026-10-09):**

1. **Controllo durante la quest = poche decisioni cruciali** (3-4 scelte
   grandi per run). Escluso il modello «decisione a ogni turno».
2. **Skill del giocatore = gestire probabilità e rischio.** Esclusa la
   lettura dei pattern avversari come skill primaria → il modello
   avversario a pattern non è centrale.
3. **Rischio = sorprese forti ma eque.** Eventi inattesi ammessi, purché
   retrospettivamente logici → l'info a costo (check nascosto) è il
   meccanismo di *fairness*, non di discovery.
4. **Morte PG = R-105 confermata** (feeling DD/XCOM, nessun cambio).
5. **Emozioni prioritarie = attaccamento/sacrificio + avidità/rimpianto.**
6. **Preview = numeri precisi** (la tensione P39 «info perfetta uccide
   suspense» è accettata consapevolmente).
7. **Allarme = stati nominati reggono** (quieto/allertato/sveglio; nessun
   track graduato — conferma la rimozione del meter del 2026-10-03).

**Conseguenza sulla classifica delle primitive (SYNTHESIS §6.1):**
Tier 1 = push-your-luck approfondito (F6 esiste), esposizione/targeting
come scelta del giocatore, sorprese eque via info a costo. Tier 3
(deprioritizzato) = duello a pattern, timer-risorsa.

**Fonte:** risposte Director in sessione 2026-10-09 (R-108);
registrate in `RICHIESTE.md` R-108 e `SYNTHESIS.md` §6.

---

## 2026-10-10 — R-109: F6 push-your-luck — baseline sperimentale BE@6% + gate sweep

**Contesto:** Round 3 di validazione Monte Carlo su `f6-pushluck-experiment.ts`
(N=2000 seed accoppiati, party default+weak). Il bust accoppiato al verdetto
(fail+epicfail ≈53%/turno) collassa la dispersione oro tra policy a ~0.5g →
«fermati» quasi dominante; il bust solo su epicfail (5%/turno) è decorativo.
La trappola indipendente a ramp (P = exploreTurn × r) mantiene la tentazione.

**Decisioni (Director, 2026-10-10):**

1. **BE@6%/turno = baseline sperimentale** — trappola F6 indipendente dal
   check, bust perde solo la pila F6 accumulata; *non* bilanciamento finale.
2. **Gate prima dell'implementazione**: sweep ramp 4–8% × party diversi —
   stop/continue deve restare non-dominante su tutti i party.
3. Implementazione autorizzata solo a gate superato: modifiche authored del
   report §6 — nessun nuovo kind di nodo, nessun framework generale.
4. **Vincolo di fairness del bust**: cause e conseguenze comprensibili e
   leggibili, non necessariamente prevedibile nel momento esatto —
   «doloroso senza sembrare arbitrario».

**Fonte:** Director in sessione 2026-10-10 (R-109);
evidenza in `context/ingestions/2026-10-09-emotional-mechanics-quest/07-round3-f6-validation.md`.

---

## 2026-10-10 — R-107/S2.5: tre decisioni di chiusura del settlement

**Contesto:** chiusura PLAN-019-S2.5. Tre punti aperti al Director sulla
tabella delle transizioni terminali e sui gate residui di S2.2.

**Decisioni (Director, 2026-10-10, verbatim «1) si, è missione fallita 2) va
bene così, ci pensiamo poi 3) le quest nn risolte si applicano normalmente»):**

1. **Fuga = missione fallita, sempre.** La cella «obiettivo sì + fuga +
   leader vivo → reward sì» decade: il motore ha già ragione — `flee()`
   chiama `dropObjective` prima di `endRun`, quindi un run fuggito termina
   con `objectiveDone=false` e nessuna reward. La conferma informale
   «fuga+obiettivo → reward» era in tensione con §5 («fuga/ritirata =
   fallimento della quest, ma il bottino raccolto resta»): prevale §5,
   nessun emendamento necessario.
2. **Scale/calibrazione S2.2 (T-1b, T-4b) rinviati**: i valori PROPOSED
   restano; la verifica sulle distribuzioni e la classificazione degli
   scostamenti Δsuccess sono decisioni differite — «va bene così».
3. **Conseguenze delle quest non risolte**: si applicano **normalmente**
   — la regola §8 non è più parziale: offerta scaduta/non presa/missione
   non risolta produce conseguenze come una risolta (trigger e forma da
   specificare nel piano che le implementa — non S2.5).

**Fonte:** Director in sessione 2026-10-10.

---

## 2026-10-10 — R-115 ratificato: PLAN-026 attivo con deroga a v24

**Contesto:** il piano di generazione quest (v2, dopo cold read r1) aveva
preso MAJOR REVISION ×4 nel cold read r2 (claude/chatgpt/grok/deepseek).
Il rilievo strutturale: v24 FROZEN dice «S5 si definisce dopo S4, a
partire dalla definizione empirica di buona quest». I critici proponevano
declassamento a proposta esplorativa (spike lab-only senza toccare il
motore) o ratifica rinviata a S4.

**Decisione (Director, 2026-10-10):** ratifica ora + implementazione del
delta motore v2. La deroga a v24 è **registrata, non silenziosa**:

- PLAN-026 (`plans/PLAN-026-quest-generation.md`) è `active`, figlio di
  PLAN-019 stadio S5, in parallelo a S3/S4.
- I campi fun-judgment (soglie, pesi, impactMetric, 75%) restano
  `experimental` e si rivalidano al gate S4 contro la «definizione di
  buona quest» — la deroga anticipa il macchinario, non la verità sul
  divertimento.
- P6 (integrazione nel flusso canonico) resta subordinato ai gate
  PLAN-019; P7 (archi narrativi) gated su OPEN-016 + ratifica.
- Decisioni incorporate: verdictTable dichiarativa sui nodi nuovi +
  switch legacy intatto (P0-a), `vars` numerici nel run state, `traits`
  su `ResidentState`, arm twist misto (runstart/inrun), testo traducibile,
  regola 75% posticipata.

**Fonte:** Director in sessione 2026-10-10 (risposta alle domande estese).

---

## 2026-10-10 — R-107: gameplay clock canonico su `/game`

**Contesto:** chiusura S2.5 — `/game` non idratava il clock gameplay
(`currentTick` ripartiva da 0 al reload mentre i run persistiti tengono
timbri assoluti `launchedAtTick`/`readyAt`) e nessun loop avanzava il
tempo in produzione (solo hook E2E).

**Decisioni (Director, 2026-10-10: «Nn vogliamo progressione offline.
b»):**

- **Nessuna progressione offline**: il tempo trascorso a gioco chiuso
  non è mai accreditato. `snapshot.currentTime` ripristina il tick al
  momento del save — non si riconcilia col wall-clock.
- **Opzione B**: `/game` chiama `initializeMinimalGameplayStore()` al
  mount (idrata clock+residenti+risorse+giorno) e monta
  `useCentralizedTiming` (1 tick/s, il loop canonico delle pagine
  minimal). Auto-resume al mount: la pagina non ha controllo pausa.
- Conseguenza aperta: l'economia dello store in fallback è demo-tuned
  (`dayLengthInTimeUnits=5`, `food=8`) — con il loop reale il villaggio
  consuma tutto in ~15s. Ricalibrazione rinviata (famiglia «calibrazioni
  in un secondo tempo»).

**Fonte:** Director in sessione 2026-10-10.

---

## 2026-10-09 — PLAN-025 T-012 + budget: chiusura della convergenza teatro

**Contesto:** ultimi due punti aperti di PLAN-025 dopo T-011 — il destino
della superficie parallela `QuestTheatre`/`/game-frame-theatre` e il budget
no-skip violato (≈1750 ms/comando vs soglia 675 ms).

**Decisioni (Director, 2026-10-09):**

1. **T-012 = rimozione totale.** Non «strumento Regia»: via pagina, route,
   tab Theatre su `/primitives`, componente `QuestTheatre`, fake runtime,
   fixture, read-model `theatreContract`/`questRunAdapter`, config
   `questTheatreConfig`, campo `adapter` di `useQuestRun`, chiavi i18n
   `questTheatre.*`. Un solo componente monta la quest in corso:
   `QuestRunWindow` (battezzato D-F). Restano canonici `beatSequencer`,
   `cinemaFx`, `questTheatreFx`, `CombatStrip` perché consumati dalla
   finestra.
2. **Budget rinegoziato.** Il budget T-003 (+50% della baseline istantanea
   per passo) era tarato pre-frontiera su beat-paragrafo: il cinema authored
   (letterbox/typewriter/floater con durate da config) non ci rientra per
   costruzione. Vincolo vincolante = percorso **skip** ≤ +10% baseline
   (misurato ≈191 ms/comando ✓); il no-skip è durata authored dei beat,
   accettata a ≈1750 ms/comando. `questWindow.beats` resta la leva se il
   ritmo risulta lento nel gate umano.

**Residuo aperto:** gate umano A — leggibilità della morte su seed E1
(playtest Director, unico acceptance non automatizzabile).

**Fonte:** Director in sessione 2026-10-09 («Rimozione totale»,
«Rinegozia budget»).

---

## 2026-10-09 — PLAN-019-S3 battezzato: tre decisioni di struttura

**Contesto:** draft S3 sottoposto a cold read (r1 groq, MAJOR assorbita) e
presentato al Director con tre domande aperte. Risposta: «approvo» — tutte
ratificate.

**Decisioni ratificate:**

1. **D-S3-1:** `QuestExpeditionDetail` **è** il Planner di v23 — evolve, non
   si duplica. Il «pannello separato» di v23 era separazione *dalla vista di
   run*, già soddisfatta dal FloatingPanel aperto dal POI.
2. **D-S3-3 con `revealAtPlanning` in scope:** l'esploratore rivela indizi
   secondari già a planning (soglia su stat derivata, config-first).
3. **Draft persistente:** party/loadout del Planner sopravvivono alla
   chiusura — draft chiavato su POI+giorno via `PersistenceService`. Chiude
   l'`unresolved` di v23 rev.2.

**Fonte:** Director in sessione 2026-10-09, «approvo».

## 2026-10-10 — R-118-S3 T-4 ridiretto: preview aggregata, naming goblin, scouting fuori dagli slot

**Contesto:** dopo il finding T-1 («goblin: zero check certi») il Director ha
ridefinito il contratto della preview Planner e chiesto un copy/naming pass
sulla quest «Sterminio dei goblin».

**Decisioni (Director, sessione corrente):**

1. **Il pannello pre-lancio è aggregato e orientativo:** % successo / ferita /
   morte del party (già live da T-2 via forecast MC). Non si rivela la strada
   vera né chance puntuali per check — il risultato dipende da scelte,
   consumabili e push-your-luck in-run. Il modello `certainChecks` resta come
   seam (gate (c)) ma il pannello non è per-check.
2. **Lo scouting esce dagli slot party:** `revealAtPlanning` rimosso dallo
   slot «Esploratore» goblin. Il campo resta nello schema come seam authored;
   la sorgente intel sarà un sistema di scouting esterno (edificio/residente
   esploratore — non esiste ancora su /game). TODO in schema + sessione.
   Emenda la parte «soglia su slot» di D-S3-3, non il meccanismo.
3. **Copy/naming goblin:** «Un nascondiglio»→«Tesoro nascosto», titoli scena
   «Assalto» (accampamento) e «Incalzare» (fuga goblin); beats `Tesoro`/
   `Assalto`; il trade-off «lasciare il tesoro» è ora esplicito nel copy
   («un suono e il campo si sveglia»).
4. **Marker `hidden`:** i nodi fuori percorso (il tesoro) portano `hidden:
   true`; la UI mostra glyph eye-off + tooltip «Evento nascosto» sulla caption
   del theatre e sui titoli dei beat. Le fasi hanno già un set icone
   (`PHASE_ICONS` per beat) — riempito il gap icona fase «Assalto» (Axe).
5. **Mercante:** resta fiction di apertura («i carri dei mercanti non passano
   più dal guado»), non una scena NPC — nessuna aggiunta richiesta.

**Fonte:** Director in sessione 2026-10-10.

## 2026-10-10 — R-118-S3 gate Director: le misure T-5 sono volute

**Contesto:** lo sweep T-5 ha prodotto tre evidenze presentate al gate (d):
reward quasi-zero senza completamento violento (sanguinario 99.3% vs cauto
5.5%), wound=100% su qualunque percorso (almeno un ferito a run), muro
push-your-luck deterministico (razzia infinita = wipe certo).

**Decisione (Director):** «La missione si chiama sterminio: ovviamente senza
violenza totale nn la soddisfi. Si, sn tutte cose sensate e volute.»

- Reward dietro inseguimento+ultima mischia = intenzionale (il nome è il
  contratto).
- Ferita garantita come pedaggio = intenzionale.
- Il muro «razzia per sempre → morte» = intenzionale.

**Conseguenza:** PLAN-019-S3 chiuso (status completed, gate a/b/d passati,
c ridiretto a preview aggregata). Nessuna calibrazione da fare — i numeri
sono authored.

**Fonte:** Director in sessione 2026-10-10.

## 2026-10-10 — R-117 pagina Steam: gate deviation ratificata, 3 meccaniche dichiarate, lingue, GTM storico

**Contesto:** audit documentale pre-rewrite del copy Steam (il primo draft
conteneva eventi inventati — carovane, lupi come sistema, memoria-mondo).
Audit claim-per-claim contro CANON/QUEST_RULES/desiderata/CURRENT_STATE.
Il MASTER_PLAN prevedeva la pagina Steam Coming Soon **dopo** la
stabilizzazione del ciclo run→meta→nuova run; il Director vuole la pagina
prima. Sono state sottoposte al Director 4 decisioni.

**Decisioni (Director, verbatim confermato in sessione):**

1. **Gate deviation ratificata:** la pagina Steam Coming Soon si pubblica
   **prima** della stabilità del ciclo run→meta→run prevista dal
   MASTER_PLAN. Trattamento: Coming Soon con claim conservativi — solo
   `true-now` nel copy principale, intenti futuri solo in sezione
   dichiarata ("What we're building").
2. **Tre meccaniche di prodotto dichiarate come intento** (non
   implementate oggi — status `intento-Director`, NON `vigente`):
   - **Selezione tra offerte di quest:** il giocatore sceglie quale quest
     soddisfare tra più offerte con reward e costi/rischi diversi e noti
     ("quella che puoi permetterti") — contrapposto al reward-pick post-
     combattimento stile StS. Oggi esistono 2 POI-offerta su `/game`
     (goblin, rovine); il pool come meccanica a scelta è intento.
   - **Eroi non-template:** skill e caratteristiche degli eroi si trovano
     generando; il giocatore costruisce combinazioni da ciò che trova.
   - **Morte → ricomincio con bonus:** meta-progressione tra run è core
     del prodotto e sarà nella demo. Etichetta pubblica decisa:
     **roguelite** (non roguelike). Visione di riferimento: GAME_VISION
     «Lose to Progress».
3. **Lingue:** pagina store EN/IT subito. Lingue gioco al lancio demo:
   **EN/IT/DE/FR** (FR incerta — «forse nn francese, vediamo»).
   **ES/DE/ZH-CN** solo dopo trazione misurata — da comunicare come
   localization roadmap, non come promessa.
4. **`go_to_market_steam_first.md` → storico:** il piano GTM H1-2026
   (calendario Feb–Giu, owner a pod) è trattato come documento storico;
   nessuna fretta, i KPI restano riferimento non vincolante.

**Fonte:** Director in sessione 2026-10-10; audit in
`marketing/steam/claim-ledger.md` (riscritto su queste decisioni).

## 2026-10-10 — PLAN-019-S4 battezzato: epilogo ricco, POI one-shot di default, seam ratificati

**Contesto:** chiusura PLAN-019-S3 (planner completo) → apertura S4
«Integrazione» (v24 FROZEN). Il Director ha ratificato le sei decisioni
aperte del draft.

**Decisioni (Director, verbatim confermato in sessione):**

1. **Schermata di epilogo obbligatoria e ricca** — *«ci vuole una schermata
   di epilogo della quest che dice: morti feriti, cose spese/distrutte,
   reward vari, exp, titoli, malattie, informazioni, lore, ecc.»* — le
   categorie sono estensibili config-first; quelle senza sistema oggi
   (titoli, malattie, lore, informazioni) sono **seam authored** dichiarate
   dallo scenario e mostrate solo se presenti.
2. **Conseguenze nei log** — *«va bene nei log»*: il canale «il villaggio
   sa cosa è successo» è l'eventLog/ledger esistente (T-1), non una
   superficie nuova.
3. **Niente scouting ora** — *«adesso niente scouting»*: `revealAtPlanning`
   resta seam documentato; nessun edificio/residente esploratore in S4.
4. **Gate B** — *«quando siamo convinti lo farò»*: il playtest esterno è
   attività del Director, scatta a sua convocazione. Chiude macro-plan D-5.
5. **`coverRiskDelta` cablato** — il canale copertura entra nel motore; la
   corazza torna eleggibile senza allentare `isExpeditionItem`.
6. **Destino lab differito** — le superfici lab (`QuestS1LabPage`,
   `MissionPlannerLive`, `useQuestPoiSession`, `QuestPowerEngine`) restano;
   la decisione di archivio è rinviata oltre S4.
7. **Trial by Fire invariato** — *«lasciamo il trial così come è»*: morte/
   ferita persistenti di S2.5 bastano per S4.
8. **POI one-shot di default** — *«alcuni POI avranno attività ripetibili,
   non tutte; di default le quest una volta sparite non riappaiono»* —
   repeatability è authored per-POI; l'offerta consumata non riappare.

**Fonte:** battesimo PLAN-019-S4 in sessione 2026-10-10.

## 2026-10-11 — R-148: il coverage floor va reso irrilevante, non più forte

**Da:** dopo `.mw/bugs/2026-10-10-game-island-under-hud/` la regola T-01 era
«quando coverage-floor e content-fit collidono, pinna il bordo protetto»;
i margini mare erano considerati solo misura accessoria (700/400px).

**A:** il floor vinceva ai viewport normali (1920×800, 1600×760, <1280) — il
pin del fit non bastava perché il floor sostituiva il fit in `refit`. Il fix
è strutturale e a due facce: (a) margini 700/400→3600/1800 con mare aperto
economico (nebbia piatta oltre ~1700px) rendono `floorZoom < fitZoom` su
tutta la matrice target; (b) `SEA_QUAD_PAD=1600` separa l'estensione
renderizzata dai bound di pan — il bordo quad non raggiunge mai lo schermo,
eliminando lo sliver di `stageColor` scambiato per cucitura del mare.
Corollari: `minZoom` da manifest vincola solo lo zoom utente, mai il fit;
gli scatter decorativi nei margini hanno raggio proprio; `recenter` resetta
`userMoved`.

**Motivo:** 2ª ricorrenza del conflitto floor↔fit (bug R-148, 3ª segnalazione
della famiglia mappa↔HUD su `/game`): il meccanismo va reso non-critico per
progetto, non gestito caso per caso.

**Fonte:** `.mw/bugs/2026-10-11-game-map-fit-seams/.work/pattern-candidate.md`;
misura: `scripts/probe-game-map-fit.cjs` → `test-results/probe-game-map-fit/`.

## 2026-10-11 — Errata: il gioco NON è un idle game; documentazione corretta

**Contesto:** diversi documenti descrivevano ancora RPG Balancer come
«idle game» / «idle/management RPG» / «feel idle puro», inclusi i prompt
della ricerca R-154. Il Director ha corretto: *«il gioco nn è +
considerato idle da un bel po', è sbagliata la documentazione:
correggila»*. L'autorità era già `marketing/steam/claim-ledger.md`:
niente progressione offline, posizionamento «second monitor».

**Correzione:** il gioco è un **village/incremental management RPG a
tempo continuo**: il tempo scorre solo a gioco aperto, le offerte non si
accumulano in assenza, le decisioni sono rade e pesanti. «Idle Village»
sopravvive solo come **codename storico** della vecchia superficie
deprecata e come nome del dominio tecnico `idleVillage`/`idle_village`
(file, i18n namespace, skill, spec) — non come genere del gioco.

**Documenti aggiornati:** `DESIGN_PILLARS.md` (R3.4/R3.5 rationale),
`context/RPG_PROJECT_CONTEXT.md` (Primary Domain + scope),
`context/VERTICAL_SLICE_REFERENCE.md`, `context/COMPETITIVE_LANDSCAPE.md`
(§3 lezione, §7 white space, §10 Q1), `context/QUEST_GAMEPLAY_SCIENCE.md`
(§gaps), `context/QUEST_OPPORTUNITY_LAYER.md` (§7 nota sul modello
temporale), run `.mw/runs/20261011-opportunity-layer-research/` (README,
report-t1/t6, errata sui 7 prompt).

**Lasciati intenzionalmente:** `idle-village-context*.md` (già marcati
HISTORICAL), `DECISION_LOG`/`RICHIESTE`/`INDEX` (record storici e nomi di
file), `src/docs/docs/MASTER_PLAN.md` (dati di mercato sul genere idle —
fonte della decisione «niente offline», non una nostra claim),
`FILENAMES_METADATA.json` (metadati generati), riferimenti a idle games
altrui in analisi competitive.

**Conseguenza sulla ricerca R-154:** la questione «accumulo offerte
offline» decade per premessa errata — a gioco chiuso il tempo non avanza.
Resta valida la regola *decision rate < event rate* durante il gioco.

**Fonte:** Director in sessione 2026-10-11; R-161.

## 2026-10-12 — Ratifica parziale opportunity layer (OPEN-019/020/021)

**Contesto:** dopo la ricerca R-154 e le 7 risposte del Director
(2026-10-11), sessione di ratifica sui punti residui delle tre OPEN del
layer opportunità. Documento: `context/QUEST_OPPORTUNITY_LAYER.md`.

**Ratificato (Director, verbatim da scelte in sessione):**

1. **Modello dati grafo = ibrido** (OPEN-019): qualities piatte
   (`access:`/`intel:`/`contact:`/`clock:`) + offer generator per lo
   stato ambientale, più pochi **nodi authored** per le milestone/
   obiettivi strategici visibili. Le quest sono offerte transitorie,
   non nodi del grafo.
2. **Tipi di arco = set aperto config-first** (OPEN-019): enum
   estendibile in config; v0 suggerito sblocco/informazione/
   preparazione + clocks come nodi di stato.
3. **Niente valuta "intel"** (OPEN-021): la qualità dell'informazione
   dipende solo dalla qualità del party/esploratore. Conseguenza: la
   mitigazione «numeri esatti come acquisto intel» per OPEN-018 non è
   disponibile — resta da verificare al playtest PLAN-028.
4. **Capacità parallela = solo leader-capacity** (OPEN-021/010): un
   party in missione richiede un leader; la crescita avviene reclutando/
   addestrando leader. Gli edifici supportano ma non concedono
   spedizioni — respinto il modello a 3 layer della ricerca.

**Resta proposal per scelta del Director:** tassonomia requisiti a 4
tipi (OPEN-020) — si valida col prototipo meta-layer prima della
ratifica. Restano aperti in OPEN-019: persistenza archi tra run,
traversal del generatore, definizione clocks; in OPEN-021: forma
economica del costo di preparazione/scouting.

**Già ratificato 2026-10-11 (prime 7 risposte):** visibilità parziale
grafo, transizione mid-run tra famiglie, 4 stati gate su offer card +
scout-quality da party, flashback-prep alto tier, doppio timer
acceptance/completion, conversion rewards posticipate al playtest,
correzione premessa idle (R-161).

**Prossimo passo concordato:** prototipo meta-layer Gate 1 — harness
deterministico + graph linter (metodologia R-154 T7), senza combattimento.

**Fonte:** Director in sessione 2026-10-12.

## 2026-10-13 — R-178: pagina Steam — capsule dalla key art, durata Goblin 11 nodi, moodboard fuori dallo store

**Decisioni (Director, in sessione):**

1. **La capsule è la key art** (eroe che guarda la valle), non più la mappa con il logo sopra. Formati ricavati dalle immagini già esistenti; il logo stampato resta nelle capsule (consentito: nome del gioco), le immagini vanno dichiarate come AI nel questionario.
2. **Copy: poco accento sui «villager»**; «village standing» eliminato. L'About descrive eroi costruiti con ciò che si trova e l'insediamento «tra una spedizione e l'altra». La roadmap (compagnia d'élite, boss/fasi, campagna che ricorda, demo, EA, lingue) resta nel copy, in una sezione dedicata, come direzione e non come feature.
3. **Una riga «progetto di una sola persona, nato dalla passione»** nell'About: sì, in una frase sola.
4. **Durata Goblin = 11 nodi / 110 tick** (era 25 / 250, calibrata per errore sul loop di saccheggio che la simulazione prendeva come linea di default). `expectedPathNodes` e `estimatedDurationTicks` in `questPois.ts`.
5. **Trailer:** lo carica il Director quando è pronto; non blocca la preparazione della pagina (il waiver scritto richiesto dal gate §7 va registrato).
6. **Moodboard fuori dalla pagina store** (screenshot = gameplay reale; ogni immagine dell'About deve mostrare una meccanica): va nel post pinnato della Community Hub, con didascalia «concept/mood, non gioco».

**Correzione di codice collegata:** il forecast del planner dava wipe 100% con qualunque party su Goblin. Causa: `defaultStrategy` prendeva la prima opzione ai bivi, e a `gob-esplora-extra` la prima è `gob-fruga` (saccheggio senza fine). Ora una strategia di riferimento per quest (`REFERENCE_STRATEGY`) ha la precedenza; Rovine invariata (la sua opzione sicura è già la prima).

**Fonte:** Director in sessione 2026-10-12/13. Dettagli e checklist: `marketing/steam/PUBLISH-CHECKLIST.md`.

**Aggiunte (stesso giorno, Director):**

7. **Lingue dichiarate in Steamworks: solo EN + IT.** Chiude l'ambiguità di D4 (il tedesco compariva sia tra le lingue della demo sia tra quelle «dopo trazione»); ES/DE/ZH restano solo roadmap nell'About.
8. **Requisiti minimi di sistema pubblicati subito**, come stime prudenti da validare sul build prima della demo (`marketing/steam/upload/copy/*/system-requirements.txt`). Piattaforma: Windows.


## 2026-10-13 — R-180: «POI types» include il POI quest reale; finestre offerta slice effettivamente aperte

**Richiesta Director:** su /game, «POI types» nella Regia deve mostrare anche il
marker dorato delle quest, che al click apre la schermata di preparazione.

**Decisioni applicate:**

1. **`questRevealed = questShown || poiDemo`** — la rassegna «POI types»
   include i marker quest REALI (offerta vera, click → planner, send live).
   R-143 resta rispettato: nessun esemplare finto; «Show quest» resta il
   gate solo-quest.
2. **`SLICE_OFFER_WINDOW_DAYS = 10_000`** per `availableUntilDay` di
   goblin/rovine — con il clock compresso (5 tick/giorno) la finestra di 60
   giorni durava ~5 minuti reali e le offerte morivano `expired` (marker
   invisibile) su qualunque save oltre la prima sessione. Il config dichiara
   già le finestre «generose, availability pressure non è la meccanica in
   slice»; il path di scadenza resta testato su `questAvailability`.

**Fonte:** Director in sessione 2026-10-13. Evidence:
`test-results/r180-poi-types-quest-marker-2026-10-13.log`.


## 2026-10-14 — Evento Invasione su /game: il registro resta aperto, il distacco si vede, la card diventa la riga

**Da:** (`GAME_INVASION_SEQUENCE.md` 2026-10-12) lo sticker compare al primo fotogramma dello strappo e la teca nasconde il suo goblin; il registro si apre per 1 s (`LEDGER_PEEK_MS`) e si richiude; la card svanisce in dissolvenza; BV-5 asseriva la richiusura.
**A:** lo strappo della teca si vede (0,9 s) e lo sticker lo sostituisce alla fine, nella posa misurata; lo sticker vola sul marker (misurato) e gli cede il posto; il registro si apre **senza ri-inquadrare la mappa** e **resta aperto**; la card si ripiega sulla riga (FLIP con schiacciamento, `MORPH_MS` 1,1 s) e la riga appare. BV-5 ora asserisce «resta aperto».
**Motivo:** video del Director 2026-10-14, 5 difetti (`.mw/bugs/20261014-game-invasion-event-choreography/bug.md`). Direzione card→riga: scelta A fra A/B/C esplorate (il Director ha detto «procedi»). Punto 1 («goblin sulla mappa all'apertura») ancora aperto.
**Correzione al piano di prevenzione:** la bozza proponeva una nuova trappola «success claim oltre l'evidenza»; esiste già T-04. Il gap reale è il trigger del pre-flight (vive solo in `mw-executor`), non l'assenza della regola.
**Fonte:** `.mw/runs/20261014-094734-invasion-verification/pattern-candidate.md`

## 2026-10-14 — Invasione su /game: la pagina si apre senza goblin (niente ripristino da `invasion_v1`)

**Da:** PLAN-033 T-004: `startDay` salvato sotto `invasion_v1`, dopo il ricaricamento il goblin tornava sulla mappa con posizione derivata dal giorno.
**A:** nessun ripristino; `invasion_v1` si cancella all'apertura; l'invasione esiste solo da quando viene avviata. BV-4 ora asserisce «reload = mappa pulita».
**Motivo:** Director: «all'apertura della pagina vedo lo sticker goblin». L'orologio non si ripristina (R-119), quindi la posizione ripristinata non corrispondeva a nulla; l'unico trigger è il pannello Director (solo dev), quindi il goblin all'apertura era sempre stato di test residuo.
**Riaprire se:** l'invasione diventa un evento di gioco reale con salvataggio dell'orologio — allora serve persistere insieme `startDay` e il clock.
**Fonte:** `.mw/bugs/20261014-game-invasion-event-choreography/bug.md`


## 2026-10-14 — Chiusura task meccanicamente bloccata dal gate di verifica (R-189)

**Da:** D-20260911-002 / SKILL-VERIFICATION: BV procedurale, controllo a campione del Director, nessun gate automatico.
**A:** in RPG la chiusura è vincolata tecnicamente: `kanban:lint` blocca nuove righe `Completato` e transizioni `fatta`/`completata` in RICHIESTE.md senza `bundle:` PASS (o `waived-director:`/`nessuna-verifica-tecnica:` espliciti). Contratto a due livelli: `CTR-*` permanenti + manifest `.mw/runs/<task>/verification.json` all'avvio (regola nel mandato executor §6). Verificatore indipendente senza diff per obbligazioni non-`state`. Fail-loud: niente CI/hook (scelta Director).
**Motivo:** incidente 2026-10-14 — chiusura dichiarata senza prove verificabili; regole preventive e BV non hanno impedito il falso positivo (`.mw/bugs/20261014-verification-false-pass/`). Decisioni Director verbatim in RICHIESTE.md R-189.
**Provato:** self-test 14/14 (10 bypass bloccati), unit 16/16, blocco live su kanban reale, dogfood visivo R-185 (12/12 E2E + 34 frame + env attestation + verificatore CONFIRMED×2 → bundle PASS).
**Limite noto:** fail-loud non è fail-safe — chi non lancia `kanban:lint` può committare chiusure fuori dal percorso; gli hash legano l'integrità degli artefatti, non la provenienza del processo.
**Fonte:** `.mw/runs/r189-closure/bundle.json`, `.mw/runs/r185-closure/bundle.json`, `test-results/r189-verification-gate-2026-10-14.log`.

## 2026-10-16 — Sessioni parallele: lo stato condiviso rompe le prove, non il codice (T-13)

**Da:** un failure di safeguard/probe veniva trattato come "qualcosa da fixare" nel proprio scope.
**A:** su worktree condiviso il primo sospetto è la collisione: `ls -la` su run dir e righe kanban (mtime + autore) prima di qualsiasi fix; riprovare prima di intervenire; probe riprovabili con resume su stato persistito; niente commit scoped su worktree condiviso.
**Motivo:** 5+ incidenti documentati in una settimana (verifier.json estraneo in R-196, kanban rosso su bundle a metà di PLAN-035/R-198/R-202, `safeguards.log` FORGED, dev server killato e HMR reload mid-probe in R-199, `build:check` timeout sotto carico) — e il ritorno del multi-agente (R-204) rende la coesistenza sistemica.
**Fonte:** `.mw/runs/learn-r199-20261016-092815/pattern-candidate.md` §A, `PROPOSALS.md` P-002, `context/recurring-traps.md` T-13.

## 2026-10-16 — R-200: auto-reveal delle offerte quest + goblin `repeatable` (PLAN-037)

**Da:** R-124/R-180 — nessun POI quest in mappa al boot; reveal solo via «Mostra quest» (toggle globale `questShown`/`poiDemo`); entrambe le offerte one-shot (D-S4-6).
**A:** (D-1) `poi-goblin` è `repeatable` — mai consumato, ignora record `consumedPoiIds` stale, torna `available` a chiusura report e dopo reload; `poi-rovine` resta one-shot. (D-2) «Mai scomparire» = reveal additivo + goblin mai consumato; la finestra authored `SLICE_OFFER_WINDOW_DAYS` (10.000 gg) resta invariata. (D-3) «Mostra quest» diventa trigger one-way «reveal ora» (salta lo stagger, non nasconde); «Reset» ri-arma lo stagger. (D-4) stagger **wall-clock** (`setTimeout` post-veil, non game-tick), valori in `gameFrameConfig.questReveal` (Zod; default `initialDelayMs` 1000, `staggerMs` 5000). (D-5) lo stagger parte a `veilGone` (entrate visibili, T-04); un run attivo/persistito monta il suo POI subito senza aspettare lo slot.
**Motivo:** richiesta Director 2026-10-15 verbatim («una ogni 5 secondi e nn scomparire mai», «flagga la quest dei goblin come ripetibile… dopo il reward puoi rifarla»). Il canale `repeatable` era già ratificato in D-S4-6 (PLAN-019-S4) — R-200 è il primo uso authored.
**Fonte:** `plans/PLAN-037-quest-poi-auto-reveal-goblin-repeatable.md`, `.mw/runs/plan037-quest-reveal-2026-10-15/bundle.json` (PASS 7/7), `test-results/r200-quest-reveal-2026-10-16.log`.

## 2026-10-16 — Kanban e pipeline di dispatch in pausa: workflow single-agent a contratto (R-208)

**Da:** sistema ibrido con kanban board (`agent_assignments.md`) come ledger, coordinator/ai-worker/harness per il dispatch, `kanban:lint` come safeguard.
**A:** board e dispatch **in pausa** (conservati, non cancellati). Ciclo operativo: plan con contratto → implementazione con l'agente locale → `verify:bundle` → chiusura `fatta` in `RICHIESTE.md`. `kanban:lint` sostituito da `closure:lint` (solo gate di chiusura R-189 su RICHIESTE + diff board; niente validazione tabella). Trigger automatici dei workflow `coordinator.yml` (cron ogni 5 min) e `ai-worker.yml` (workflow_run) rimossi → solo `workflow_dispatch`: eliminati i commit-rumore `Coordinator: auto-migrate`/`AI worker:` (~49% dei commit dei 10gg precedenti).
**Motivo:** verbatim Director: *"meti questa roba in pausa [...] si crea un plan con un contratto, si implementa con l'agente locale in devin desktop, si controlla il contratto [...] e basta"*. Evidenza audit: board usata solo come ledger post-hoc (`Completato | Devin`), coordinator locale fermo dal 2026-10-09, harness già invocato con `--no-kanban`. Il gate di chiusura sopravvive perché è ciò che blocca i falsi "done" (T-04, R-189).
**Riaprire se:** PLAN-039 benchmark dimostra che il dispatch esterno conviene — allora si reimplementa una coda (JSON/tool-managed, non tabella markdown su git: T-13).
**Fonte:** `RICHIESTE.md` R-208, `.mw/desiderata.md` v31, `rules/00-project-invariants.md` §Workflow operativo.

## 2026-10-17 — PLAN-043 F5 (famiglia quest): decisioni Director A1/B1/C1 + piano cinematografico da dibattito multi-AI (CONVERGED)

**Da:** redesign proposto in `test-results/plan-043/f5/redesign-quest-spec.md` dopo critica AAA; il Director ha scelto i 3 nodi architetturali e chiesto un dibattito multi-AI web mirato alla resa «film interattivo» (verbatim R-207).
**A:** (1) **A1 — QuestStageCluster reattivo:** un solo solver puro (`solveQuestClusterGeometry`) possiede la geometria delle 3 colonne (CompanionLeft / QuestRunWindow / SkillCheckColumn); il drag salva solo `userCenterX/Y`, gli shift laterali sono derivati (zero drift); a `vw < 1440px` lo Skill Check a destra collassa temporaneamente il cassetto sinistro (restore alla chiusura). (2) **B1 — Bag a doppia affordance:** pillola `Bag 2/3` in header + Micro-Belt inline sopra le scelte (stati engine `winner/armed/shadowed/inert/passive`, delta `%` live). (3) **C1 — footer collassabile:** `TimeBar` che si riempie verso `frontier.readyAt` sopra una traccia di `EngravedIcon` delle sole fasi visitate (v27: il futuro non si mostra); il footer può sparire e riapparire. (4) Confermati **D2 C** (finestra che respira, curva corretta a `clamp(760px, 50vw, 1040px)` — la `52vw/1020` del mockup non produceva le misure dichiarate) e **D3** (astrolabio nudo, verdetto in Carta dell'Esito sotto il piatto, mai sopra; `#card` interno soppresso; `QuestOutcomeToast` ritirato dal flusso normale).
**Artifact:** `artifact-r002.md` converged 4/4 provider (sha `064ed0ec…c204f0`, run `20261017-plan043-f5-quest-cinematic`) → **emendato e battezzato dal Director 2026-10-17** (verbatim «niente Continua da nessuna parte, battezzo») come **`artifact-r003.md`** (sha `df5d49d3…77b9b`, copia `test-results/plan-043/f5/`). Emendamenti: nessun pulsante `Continua`/`Continue` sulla superficie quest (Carta dell'Esito informativa, avanzamento solo click/tasto R-199; conferma abbandono = solo `[Abbandona]` + cancel implicito Escape/click-outside); `dismissArmDelayMs` 180→350ms; `BV-11..BV-14` (expanded→check @1280, guardia dismiss, audio sospeso/muto + ordine screen-reader, budget breath-filter WebKit); curva `clamp(760px,50vw,1040px)` ratificata. Definisce: FSM cinematico con `beatKey` monotonico (l'engine committa `ResolvedCheck` prima del beat `check` — `skipToResult()` non fabbrica esiti), skip ladder R-199 con guardia dismiss, tag `stageDirection` (`reveal/impact/breath/push/bars/j-cut/expanded` — interno, nessun portal), WebAudio su singleton `AudioContext` (T-10), Astrolabio `settledIdle` + `ResizeObserver`, `TimeBar` a 0 re-render.
**Motivo:** decisioni Director verbatim 2026-10-17 («1) approvo 2) B1 3) C1, cn la riga sopra che si riempie […] magari un modo x fare sparire il footer e farlo riapparire»; «niente Continua da nessuna parte, battezzo») + richiesta verbatim «plan multi ai web […] cinematografica, cn movimenti, effetti, shake, suoni».
**Riaprire se:** la verifica misurata smentisce un parametro (p.es. `dismissArmDelayMs` o `breathUsesFilter` — vedi BV-12/BV-14) o il Director cambia curva di larghezza. **Battezzato: implementazione T5.1–T5.5 delegata ad agente esterno.**
**Fonte:** `RICHIESTE.md` R-207, `plans/PLAN-043-S9-famiglia-quest-redesign.md`, `test-results/plan-043/f5/artifact-r003.md`, `mind-weaver/.mw/runs/20261017-plan043-f5-quest-cinematic/report.md`.

## 2026-10-17 — PLAN-043 WS-3 (Quest Planner / Preview): dibattito multi-AI web CONVERGED su «Dispatch Table»

**Da:** `plans/PLAN-043-S8-preview-quest.md` + `PLAN-043-S2` T1.4 — `QuestExpeditionDetail` da ridisegnare dentro il 3-Zone Stage (v23: PARTY/LOADOUT/OUTCOME; forecast live, delta `±pp`, BY MEMBER adiacente, WHY causa→effetto).
**A:** **`artifact-r004.md`** (sha `71016cfcb4a9cea8570123689e77095054823b968ca4b945ceb391253b75674f`, copia `test-results/plan-043/ws3/`, run `20261017-plan043-ws3-quest-planner`) accettato 4/4 dopo 4 obiezioni WITNESS-WS3-01..04 (misread grok respinto con quote del testo; conflitto transform-vs-layout sull'hero collapse risolto con swap discreto in un frame; aritmetica altezze resa enforceable con max-height per componente, assert geometrico deterministico `≤540px @1280×720` e fallback finale documentato). Layout **«Dispatch Table»**: Planner in CENTER STAGE — hero letterbox ~150px con sigilli incisi read-only Danger/Reward/durata e fallback `coverArt→sceneArt→cresta` → rack ordine di marcia TESTA→CODA con strip esposizione statica `0/0/20/80` (leader = `party[0]` = TESTA; n=1 porta entrambi i tag) → loadout row → **Selection Tray** ~88px on-demand (residenti|item, rimpiazza il popover esterno: il Forecast nel RIGHT WING resta pinnato e i delta live v23 non si nascondono mai durante l'edit) → footer `Send expedition` + `Back to map`. Zero `Continua`/`Continue`/`TICKS`/`Simulate` nel DOM. Task `TS-0..TS-7`, matrice bloccante `AC-01..AC-23` (overlap, budget altezze, CTA containment, exact reversibility forecast, exposure).
**Motivo:** processo per-workstream ratificato dal Director («un piano alla volta in modalità multi ai web»); WS-3 è il secondo atto della superficie quest dopo WS-0/WS-1.
**Battezzo Director (2026-10-17, verbatim «Dispatch table / drag / N day / dispatch fai tu»)** → **`artifact-r005.md`** (sha `f2d46399…7df`, copia `test-results/plan-043/ws3/`): D-a Dispatch Table; D-b **unit-drag** sotto il solver condiviso (anchor-only `userCenterX/Y`, shift derivati — riconcilia il ruling WS-2 «tutti i pannelli trascinabili», stessa grammatica della finestra RUN di WS-4); D-c durata in giorni interi `1 day`/`N days` via `formatExpeditionSpan` (ICU plurals, round-half-up, min 1 — interpretazione dell'orchestratore del ruling stringato); D-d campo `dispatch?` opzionale in `questScenario.schema.ts` adottato (decisione delegata). Emendamenti rispetto a r004: AC-01/AC-04 estesi al drag, TS-0/TS-1 (solver-anchor invece di docked), tabella durata rimpiazzata dal vocabolario a giorni interi.
**Riaprire se:** il Director intende un rounding diverso da round-half-up sulla durata, o la misura runtime smentisce i budget geometrici/perf.
**Fonte:** `test-results/plan-043/ws3/artifact-r005.md`, `mind-weaver/.mw/runs/20261017-plan043-ws3-quest-planner/report.md`, `plans/PLAN-043-S8-preview-quest.md` §Dibattito.

## 2026-10-17 — PLAN-043 WS-5 (pass sistematico HUD + chiusura): dibattito converged + battezzo Director

**Da:** `plans/PLAN-043-S11`/`S12` + leftovers S2 (BagStrip D4, lucide) — l'ultimo workstream: pass sistematico su tutti i componenti `/game` rimasti + chiusura a contratto del piano.
**A:** **`artifact-r002.md`** (sha `bb461507…9808`, copia `test-results/plan-043/ws5/`, run `20261017-plan043-ws5-hud-pass-closure` converged seq 43): schema SCHEDA per-componente (facts vs F0-evidenza vs proposta, `configMigrationNote` obbligatorio se hardcoded, stato ortogonale `status`/`implementation`/`verification`/`director_approval`/`deferred` — mai enum lineare), 6 batch S11 + trasversale, gate nonblocking-audit, `STRICT_FILES = A∪B∪C∪Dq` via TS Compiler API con test anti-drift, F0 re-audit sulla matrice baseline + supplementare 1366×768, manifest di chiusura `test-results/plan-043/manifest.json` + `closure:lint` (necessario non sufficiente: **D9 — keep/redo/merge/remove per-componente — resta del Director per batch**). Ruling già applicati: G.1 dev-tool possono trattenere lucide; G.2 audit = tutti i componenti scoperti meccanicamente; G.3 +1366×768.
**Motivo:** processo per-workstream ratificato; elettorato 3/4 — claude rimosso `provider_dead` (rate-limit Free per tutta la run, 0 turni; screenshot T-020-A-001); Director verbatim «battezzo, procedi» (seq 41).
**Sequenziamento vincolante:** audit-only ora (inventario, card bozze, guardie, icone, baseline supplementare) — **implementazione componenti gated sul landing di WS-2**; WS-2 vince sui conflitti.
**Riaprire se:** claude post-reset solleva un'obiezione reale (disposizione post-hoc), o il Director cambia il criterio D9.
**Fonte:** `test-results/plan-043/ws5/artifact-r002.md` + `IMPLEMENTATION-BRIEF.md`, `mind-weaver/.mw/runs/20261017-plan043-ws5-hud-pass-closure/` (events.jsonl).

## 2026-10-17 — DeepSeek sempre nell'electorate dei dibattiti multi-AI web

**Da:** i dibattiti PLAN-043 hanno usato `chatgpt,claude,gemini,grok` — DeepSeek escluso di fatto dopo un `last_error` di sessione del 15 ott (`Locator.fill` timeout sul composer), mai formalmente deciso.
**A:** **DeepSeek fa sempre parte dell'electorate** in qualsiasi tool/run multi-AI web. Default obbligatorio scritto nella skill `mw-web-debate`: `chatgpt,claude,gemini,grok,deepseek`; esclusione solo tramite `electorate_change{action:remove,reason:provider_dead}` registrato nel journal — mai a priori. Probe 2026-10-17 su `chat.deepseek.com`: sessione autenticata, composer presente → **usable**; se rifallisce, ri-autenticare via `tools/auto-login-deepseek.py`/`web-login-export.py`.
**Motivo:** verbatim Director 2026-10-17 («deve essere aggiunto nell'elettorato e in qualsiasi tool multi ai web»); la diversità dell'electorato è il punto del processo — un quinto voter riduce il rischio di consenso artificiale a 3-4 provider.
**Riaprire se:** la sessione deepseek torna instabile in modo permanente (allora `provider_dead` documentato, non omissione silenziosa).
**Fonte:** `.agents/skills/mw-web-debate/SKILL.md` (Fase 0), probe `mw-web-turn inspect` 2026-10-17.

## 2026-10-17 — Dispatch fan-out nel dibattito multi-AI web (mw-web-turn)

**Da:** ogni `send` era bloccante end-to-end — posta → attesa della risposta completa → capture → provider successivo. Wall-time del round = somma dei provider.
**A:** **fan-out obbligatorio** (verbatim Director: «deve fare la domanda in tutte le ai una ad una senza aspettare, e poi controllare le risposte una ad una»). `send --post-only` sottomette e ritorna `POSTED` subito (binding `conversation_url` + `response_count_before` nel journal); nuovo verbo `collect` riattacca il tab, attende `in_flight`, estrae e giornalizza sullo stesso `turn_id`/`attempt_id` con `via:"collect"`. Skill `mw-web-debate` aggiornata: post loop → collect loop come default; divieto di postare il turno successivo su un provider con POSTED pendente.
**Verifica live:** run `test-fanout-20261017` (deepseek): POSTED in 28.8s → collect SUCCESS "PONG", journal `send_attempt`+`collect`, binding corretto.
**Riaprire se:** emergono race di capture su tab condivisi non coperte dalle guardie esistenti (CONVERSATION_MISMATCH/CONCURRENT_SESSION invariate).
**Fonte:** `mind-weaver/scripts/mw-web-turn.py`, `mind-weaver/browser-runtime/core/runstate.py`, R-173 (mind-weaver `RICHIESTE.md`).

## 2026-10-17 — PLAN-043 WS-0+WS-1: abort di drag-intent usa `reset()`, non `cancel()` — e perché

**Da:** `useExtractionSequence.cancel()` è deliberatamente no-op a `progress>=1` (una hold completata = estrazione legittima, contratto lab). Sotto input-lag il `pointermove` di attivazione drag arriva dopo il completamento → il cancel no-oppava → `onExtracted` svuotava il sedile a metà gesto → `planSlotSwap` rifiutava lo swap (flake sistematico, non jitter).
**A:** i path **drag-intent** (`onMove` oltre soglia px, effect su `tokenDrag.isDragging`) chiamano `extraction.reset()` incondizionato; `cancel()` resta sui path di release (mouseup/touchend) dove la semantica "hold completa = azione" è il contratto corretto.
**Motivo:** evidenza E2E — drop annunciato sul target corretto ma sedile sorgente vuoto nello snapshot; la guardia di commit lavorava su stato già corrotto dal gesto stesso. Pattern completo: `.mw/runs/20261017-learn-ws0ws1-slot-drag-evidence/pattern-candidate.md` (cancel-vs-reset, event-ordered evidence, gesture-retry).
**Nota su `commitSwap`:** la guardia fase al landing si applica al **solo sedile target** — il decay del cancel sulla sorgente tiene `isExtracting` fino a ~300ms post-drop e mangerebbe lo swap che il drag-end gate aveva già validato.
**Fonte:** `src/ui/idleVillage/components/ResidentSlotRack.tsx`, `useQuestExpeditionSession.tsx`, evidenza `test-results/plan-043/ws0ws1/` (bundle: tutte le obbligazioni automatizzate PASS).

## 2026-10-18 — Drag overlay e geometria volo: lezione stacking context + cell-vs-component

**Da:** due bug "ottici" del planner trattati come problemi di valore (z-index troppo basso, offset da correggere).
**A:** entrambi erano problemi di **contesto/selettore**, non di valore: (1) lo z-index del DragOverlay non usciva dallo stacking context dell'antenato fixed z=12 → fix = portal a `document.body`, non un valore più alto; (2) il target di volo puntava la cella rack `[data-slot-id]` (caption+footer) invece del wrapper `slot-button-*` → helper condiviso `getSlotComponentElement` per drop/click-assign/return/swap.
**Motivo:** witness headless: ghost invisibile sopra Forecast malgrado z=10000 (probe: antenato z=12 = soffitto); volo atterrava ~10px sotto il castone (cella 64×84 vs slot 64×64). Dopo i fix: overlay su body, minimumError centro-centro = 0px.
**Terzo pattern (tooling):** dev server Vite ha servito transform cache stale due volte (route App.tsx assente, gameFrameConfig post mid-edit altrui) → diagnosi sempre sul modulo servito (`curl`), `touch` come fix.
**Fonte:** `.mw/runs/20261018-quest-planner-drag-feedback/pattern-candidate.md` → traps T-16, T-17 in `context/recurring-traps.md`.

## 2026-10-18 — Trust anchor: il lock nel repo è diagnostico, il ledger fuori-repo è l'ancora

**Da:** PLAN-051 T-002/T-003 originale prevedeva `trusted.lock.json` committato come meccanismo anti-drift su gate-file/bundler/config — "se l'hash cambia, il gate lo vede".
**A:** un lock scrivibile dall'agente è falsificabile (file protetto + lock riscritti nello stesso commit → drift zero). Il lock resta diagnostico; l'ancora è il ledger append-only fuori-repo (`~/.rpg-approvals/ledger.jsonl`) scritto solo da `npm run approve`. Semantica **strict-once-established**: dal primo record `trust-set`, `checkTrustedLock` confronta l'aggregato dei contenuti protetti col ledger, non il lock col worktree. Prima del primo approve: fail-open documentato (nota, non silenzio).
**Motivo:** obiezione claude nel dibattito R-220 (artifact-r003→r004) — corretta e incorporata; bound onesto residuo: stesso account può scrivere il ledger (circumvention deliberata), il confine vero arriva con firma GPG/SSH su chiave Director.
**Fonte:** `mind-weaver/.mw/runs/20261018-verify-roi/artifact-r004.md` + `.mw/runs/learn-plan051-20261018-1715/pattern-candidate.md` (pattern A).

## 2026-10-18 — Preview Devin Desktop: scheda interna ≠ finestra foreground; proxy sulla ROOT

**Da:** semantica regola 16 applicata larga — la preview di un fork visivo andava "aperta manualmente dal Director" perché ogni apertura automatica era considerata finestra foreground; e si assumeva che `browser_preview` accettasse un URL con path.
**A:** (1) la scheda Preview dentro Devin Desktop è la superficie prevista dal Director — auto-open via `browser_preview` consentito e voluto (ruling Director 2026-10-18); regola 16 copre solo finestre/app esterne. (2) `browser_preview` va registrato sulla ROOT del dev server: il proxy path-scoped inoltra solo il documento registrato e serve `index.html` per gli asset sub-path → pagina bianca. Per aprire una route si usa un redirect-stub (`/` → 302 route).
**Motivo:** bug reale in dry-run PLAN-047 — preview bianca confermata headless attraverso il proxy (`#root` vuoto); Director ha corretto la semantica chiedendo l'apertura automatica.
**Fonte:** `.mw/bugs/20261018-devin-preview-white/` + `.mw/runs/learn-plan047-preview-20261018/pattern-candidate.md` → trappola T-19 in `context/recurring-traps.md`.

## 2026-10-18 — Quest goblin v3: guado revocato, detail non-spoiler, epicfail cablato

**Da:** manoscritto v3 (R-219, Director 2026-10-18) — le 11 correzioni hanno richiesto tre ruling che il documento non poteva risolvere da solo.
**A:** (1) **Guado/strada dei mercanti revocati** dalla fiction della quest (spec, `QUEST_RULES.md` §7b, `contract-v1.json`, `domainVocabs.ts`): il Director ha detto «nn ho mai parlato del guado, nn c deve essere» — la nota 2026-10-08 che lo citava è corretta in loco. `GUADO_VOCAB` → `BOSCO_GOBLIN_VOCAB` (id `bosco-goblin`) con `guado/strada/carro/mercante/masso` in `vietati` → il gate li blocca meccanicamente. (2) **`option.detail` resta obbligatorio ma non-spoiler**: stat + gesto, mai scopo né esito («Perception. You crouch among the roots.»); convenzione scritta in spec (regola 8 + tabella campi), `CRITIC_CONVENTIONS` e nuova classe critic `outcome-spoiler`. (3) **Epicfail di `gob-tracce-per` cabla il danno** (−10 HP, lama nascosta) invece di ammorbidire il flavor. (4) **F2 = choice a opzione unica** («Recover the loot» → next diretto): nessun `kind:'reward'` né campo `action` nello schema.
**Motivo:** verbatim Director; l'analisi «le tue critiche sono previste dalla pipeline?» ha mostrato che guado/masso erano `lockedFact` del contratto stale — revocarli nel contratto e nei `vietati` impedisce alla pipeline di rigenerarli.
**Riaprire se:** il Director decide diversamente su arte F1/F2 stale (carro/solchi di ruota — regen pendente) o sulla forma del nodo reward (se mai servirà `kind:'reward'` per nodi senza alcuna opzione).
**Fonte:** `quest_sterminio_goblin_spec.md` v3 + «Delta rimasti», `.mw/specs/quest-goblin-narration/contract-v1.json`, `.mw/runs/20261018-learn-goblin-v3/pattern-candidate.md`.

## 2026-10-19 — PLAN-053 rollback policy: solo feature flag

**Da:** decisione-due del piano §3 — in caso di ritiro della feature journey, cosa succede ai run salvati in volo (stato `returning`)?
**A:** **solo `questJourneyEnabled`**: spento → nessun nuovo lancio journey, i run in volo completano sul codice shippato per una release. Lo shim hydrate-time (`returning → ended, settle now` su `engineSchemaVersion < N_journey`) è **scartato** dal contratto di T-003 — rete di emergenza da rivalutare solo se serve davvero.
**Motivo:** ruling Director 2026-10-19 (opzione «solo interruttore»): il party a metà strada finisce il viaggio, non il teletrasporto a casa.
**Fonte:** `plans/PLAN-053-quest-journey-legs.md` §3.

## 2026-10-19 — PLAN-053 XP su wipe-in-ritorno: nessun XP

**Da:** decisione-due del piano §3 — DQ-3-α copre il loot (encumbered perso su wipe) ma non l'XP del caso «successo al POI → wipe durante il ritorno».
**A:** **no XP**. Coerente con DQ-1 (residenti bloccati fino all'arrivo): la quest non è finita finché il party non torna al villaggio. Il default provvisorio pinnato dal test T-003 diventa definitivo — nessun update al test nel PR del ruling.
**Motivo:** ruling Director 2026-10-19.
**Fonte:** `plans/PLAN-053-quest-journey-legs.md` §3; alternativa scartata: XP pieno/parziale (il verdetto al POI resta nel report come doppio-verdetto, ma non premia).

## 2026-10-19 — OPEN-016 ratificata: macro-piano E-16 come direzione

**Da:** OPEN-016 `open` dal 2026-10-07 — il macro-piano narrativo del mondo proposto dall'AI (E-16: Foundation → simulazione → storia → legacy cross-run) attendeva ratifica; gate di T7 (archi narrativi) in PLAN-026.
**A:** **ratifica piena E-16** — il macro-piano diventa autorità di direzione. Registrata la tensione nota (ingestion §11): la sequenza operativa vs v24/PLAN-019 (E-16 propone la simulazione mondo prima della quest vera) si fissa nel piano operativo di T7, non qui — la ratifica è di direzione, non di ordinamento. I numeri della bozza (2–4 ore, 8–10 PG, ~10 pattern) restano non-target.
**Motivo:** ruling Director 2026-10-19 su presentazione delle opzioni (ridotta / piena / aperta).
**Fonte:** `context/OPEN.md` OPEN-016, `context/ingestions/2026-10-07-registro-narrativo-del-mondo.md` E-16/E-18, `plans/PLAN-026-quest-generation.md` P7.

## 2026-10-19 — R-119 risolta: invasione ripristinata al reload (opzione A)

**Da:** residuo BV-4 di PLAN-033 — il record affermava «il clock di /game non si reidrata al reload», premessa su cui la wipe-on-open di `invasion_v1` era stata decisa il 2026-10-14.
**A:** **opzione A — ripristino.** Indagine root-cause: la premessa era stale, `initializeMinimalGameplayStore` reidrata `currentDay`/`currentTick` al save-time. Implementato: `invasion_v1` letto solo dopo hydration (marker alla posizione salvata, niente scatto), rimossa la wipe-on-open, `invasionLoadedRef` copre il write-effect finché il read non chiude; teatro mai replicato (reload a metà sequenza → post-conferma). Spec `gameInvasionMarch.spec.ts` 4/4.
**Motivo:** ruling Director 2026-10-19 («a») su presentazione opzioni A ripristino / B wipe-come-design / C restore-completo.
**Fonte:** `context/GAME_INVASION_SEQUENCE.md`, `.mw/runs/PLAN-033/bv/record.md`, `src/pages/game-frame-pixi.tsx`.

## 2026-10-20 — Convenzione review page per ruling Director (R-236) + preview-churn

**Da:** il materiale per i gate Director era sparso in `.md` + directory di screenshot; il Director testava su dev server che HMR ricaricava sotto le scritture di sessioni parallele.
**A:** (1) gate **decisionali** → review page statica con immagini nella sidebar (`.mw/review/<round>/index.html`, generatore `build-review.mts`, server dedicato); gate **visuali/esperienziali** → accumulati e differiti al giro dedicato. (2) Serving: mai `http.server` sulla repo root (serve la `index.html` di vite → pagina bianca) — sempre directory dedicata + symlink per gli asset esterni. (3) «La pagina si aggiorna di continuo» su worktree condiviso = HMR che lavora, non un bug — verificare `find -newermt` prima di diagnosticare; per test del Director usare snapshot congelato (build + preview su porta dedicata). Sibling di P-005 (superficie nel browser ≠ ciò che credi: churn live vs bundle stantio) — seconda istanza → promuovere a trappola se ricorre.
**Motivo:** verbatim Director «chiudi tutto quello che aspetta una mia decisione visiva» + «le cose come G05 voglio che siano aperte in un bel file, cn immagini, ecc nella barra laterale, nn un .md»; debug pagina bianca preview.
**Fonte:** `RICHIESTE.md` R-236, `plans/PLAN-068-director-review-round.md` §convenzione, `.mw/runs/learn-20261020-2115/pattern-candidate.md`.

## 2026-10-21 — La famiglia «la superficie di verifica non è quella dell'utente» si estende al runtime (P-007)

**Da:** la famiglia P-005 copriva superfici *sbagliate* per stato (bundle stantio) o movimento (HMR churn): la verifica mentiva perché guardava un'istanza diversa dal codice atteso.
**A:** il divario può essere di **ambiente**: il `vite preview` minificato e il dev server differiscono per costo runtime (`jsxDEV`, scheduling) di un fattore 2-3× — una metrica di latenza verde su preview non garantisce nulla su ciò che il Director percepisce in dev. Regola proposta (P-007): misura percettiva sul runtime del sintomo; marker di test = elemento che l'utente vede. Corollario tecnico nuovo: il commit React può essere bypassato per il primo paint (warm-mount + DOM flip + handoff `useLayoutEffect`).
**Motivo:** R-238 — suite E2E verde (376-431 ms) mentre il Director misurava 510-732 ms in dev; il fix del residuo è stato il flip istantaneo (181-214 ms), non una ricalibratura del test.
**Fonte:** `.mw/runs/learn-20261021-1404/pattern-candidate.md`, `.mw/bugs/20261021-game-first-interaction/bug.md`, `PROPOSALS.md` P-007.

## 2026-10-22 — Convenzione striscia: lo stato espanso possiede la geometria (R-251 bis)

**Da:** la striscia minimizzata compensava la posizione dei controlli per avvicinarsi a quella dell'header espanso — soluzione rifiutata dal Director («La tua soluzione nn andava bene»).
**A:** l'invariante geometrica vive nello **stato espanso**: la title row usa gli stessi content-inset della striscia (placca `panel` 10px + riga `paddingInline '12px 8px'` = content box 22/18 della `hang` `10px 18px`). Il collapse cambia il glifo del toggle, mai la geometria — misurato dx=0/dy=0 su chest/toggle/close. Caveat di misura: `-2px` sotto il cursore = `--skin-btn-hover-lift`, non disallineamento. Convenzione cross-pannello in `hud_component_guide` §«Pannello ridotto a striscia», trappola **T-23**.
**Motivo:** ruling Director 2026-10-21 verbatim.
**Fonte:** `RICHIESTE.md` R-251, `.mw/runs/learn-20261022-stash-strip/pattern-candidate.md`, `context/recurring-traps.md` T-23.
