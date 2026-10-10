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
