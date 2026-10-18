# PLAN-043 · WS-2 — Three-Zone Stage (implementation handoff)

> **Stato:** implementato — bundle `.mw/runs/20261017-plan043-ws2-three-zone-stage/bundle.json`
> **PASS** (OB-01..OB-05, verifier indipendente 4/4 CONFIRMED + signoff agent-eye
> T-04; conferma visiva del Director su G.6/G.7 ancora benvenuta).
> **Stato design:** ratificato — artifact-r005, sha256 `af2b519357ee09fef8e84ea7a10eeedfa54ad70b9c7266aeefcf0c0247f29cb2`
> **Provenienza:** dibattito multi-AI web 2026-10-17, run mind-weaver
> `20261017-plan043-ws2-three-zone-stage` (r003 converged 4/4) +
> `20261017-plan043-ws2-rulings-reconcile` (Director rulings → r005;
> chatgpt+gemini ACCEPT, claude ha autore i delta — rate-limited sul voto finale,
> grok in dissenso registrato e respinto come incoerente).
> **Master plan:** `plans/PLAN-043-game-quest-surface-pass.md` riga WS-2
> (copre S6 + S2 T1.3/T1.6). **Artifact canonico:** copia identica in
> `mind-weaver/.mw/runs/20261017-plan043-ws2-three-zone-stage/artifact-r005.md`.

## Aperto prima/durante implementazione

- **G.6** — compattezza roster a 236px: serve testimone visivo Director dopo
  l'implementazione (T-04). Non blocca il codice, blocca la chiusura.
- **G.7** — HeroSheet overlay in *entrambi* i regimi (default proposto) vs casa
  in rightWing in regime generic. Se il Director non conferma, il default
  adottato è **overlay-sempre** (zero remount, stato preservato).

## Regole vincolanti per l'agente implementatore

- Leggi `AGENTS.md` + `context/recurring-traps.md` (pre-flight superficie) prima
  di toccare codice. T-04: claim visivi chiusi solo con testimone che vede;
  T-13: sospetta collisioni condivise (sessioni parallele attive sul worktree).
- Config-first: `stageZones` va in `src/balancing/config/idleVillage/gameFrameConfig.ts`
  con schema Zod. Nessun valore hardcoded.
- Provider = React Context (presentation state locale al subtree `/game`); NON
  introdurre nuovo Zustand per lo stage — l'occupancy è UI state di
  presentazione, il dominio resta negli store esistenti.
- JSDoc su ogni funzione/interfaccia nuova; i18n (`common`/`idleVillage`) per
  ogni stringa utente (es. toast "Available after the quest").
- Persistence: solo `PersistenceService` async se serve persistere intent/strip.
- Node da `.nvmrc` (`source ~/.nvm/nvm.sh && nvm use`); MAI finestre in
  foreground (probe/screenshot sempre headless).
- Safeguard obbligatori: `npm run lint -- <scope>`, `npm run test -- <scope>`,
  `npm run build:check`, `npm run closure:lint`.
- **Non toccare:** internals F5 (`resolveQuestShellLayout` /
  `solveQuestClusterGeometry` — firma da WS-4 artifact), le animazioni congelate
  di `SlotV12Renderer`, le regole di gameplay.

## File map (rilevanti)

| File | Ruolo |
|------|-------|
| `src/balancing/config/idleVillage/gameFrameConfig.ts` | aggiungere `stageZones` (Zod) |
| `src/pages/game-frame-pixi.tsx` | montare provider, sostituire corridor math del planner (righe ~320-330, ~1291-1304) |
| `src/ui/idleVillage/components/gameFrame/hudPanelRegistry.ts` | registry pannelli — planner ottiene entry additiva |
| `src/ui/idleVillage/components/gameFrame/` | nuovo `stageZones/` — provider, solver, reducer, strip chrome |

## Task di implementazione (ordine)

| Task | Contenuto | Dipendenze |
|------|-----------|------------|
| T-WS2.1 | `verification.json` + claim pre-codice; misura `min-content` del roster → scelta `floorConfig` (floorA/floorB) committata in config | — |
| T-WS2.2 | Config `stageZones` + schema Zod + test aritmetico invariante budget (BV-09) | T-WS2.1 |
| T-WS2.3 | Solver puro `solveStageLayout` + `layoutSignature` + unit test BV-02 (bit-identico render/clamp, 1000 intent) | T-WS2.2 |
| T-WS2.4 | Reducer + provider `useGameStageZones`: occupancy, `openSeq`, `activeDrag`, `{state,revision}` commit protocol A.5, hysteresis `prevCollapsed` | T-WS2.3 |
| T-WS2.5 | Sospensione: hidden+inert+aria-hidden+focus-redirect+pointercancel, deregistrazione overlay nello stesso commit; fallback WKWebView testato | T-WS2.4 |
| T-WS2.6 | Strip presentation (rail 32px ali / tab 28×160 centro), intent/effective split, drag to/from strip, demotion LRU | T-WS2.5 |
| T-WS2.7 | Migrazione pannelli nel registry; planner `questDetail` diventa entry additiva + `data-hud-panel` + overlay stack; cancella corridor math SOLO dopo che BV-01 vede il planner | T-WS2.5 |
| T-WS2.8 | Regime handoff run↔generic (atomic, DRAG_CANCEL, retire/suspend table §D.2) + HeroSheet overlay §D.3 | T-WS2.5 |
| T-WS2.9 | BV gates BV-01..BV-11 + BV-G1..G8 (Playwright + unit) | tutti |
| T-WS2.10 | Capture visiva DPR 1/2 dei 4 viewport × stati → testimone Director (G.6/G.7) | T-WS2.9 |

## Correzione regressione post-implementazione — R-215 (2026-10-18)

Con stage vuoto, `StageStripsLayer` dipingeva due rail fantasma al centro:
il check `zone.w <= wingRailPx` includeva zone a larghezza zero, che non hanno
un bordo collassato da marcare. Corretto a `zone.w > 0 && zone.w <= wingRailPx`.
Regressione coperta da `tests/unit/idleVillage/stageStripsLayer.test.tsx`
(stage vuoto = zero rail; ala collassata e occupata = rail conservato). Dettagli
e prova runtime: `RICHIESTE.md` R-215 e `.mw/bugs/20261018-stage-rail-lines/`.

---

# Contratto ratificato (artifact-r005, verbatim)

## Invariants (non-negotiable, carried from proposal)

- Zones are logical allocation regions, not permanently visible rectangles. A zone
  may be collapsed, occupied by a transient, or delegated to the quest cluster.
- **Zero positive-area overlap**: for every accepted state at every contractual
  viewport, every visible zone-managed panel has a legal, chrome-safe rectangle;
  no two such rectangles have positive-area intersection. Shared edges allowed.
  No epsilon.
- Stored user intent is never overwritten by derived/clamped geometry.
- The global overlay/Escape stack remains the single authority; WS-2 never builds
  a parallel stack.
- F5 internals frozen: `resolveQuestShellLayout`/`solveQuestClusterGeometry` own
  the cluster's internal columns; WS-2 sees the cluster as ONE occupant.
- Render, drag-clamp, and verification consume the same pure solver answer.

## A. Zone model + regimes

### A.1 Declarative config — `gameFrameConfig.stageZones` (Zod-validated)

```ts
type ZoneId = 'leftWing' | 'centerStage' | 'rightWing';
type StageRegime = 'generic' | 'run';
type PanelRole = 'home' | 'session' | 'persistent-transient' | 'exempt';

interface StageZonesConfig {
  chrome: { topPx: number; bottomPx: number };      // 92 / 100 (existing)
  outer: { edgePx: number; gutterPx: number };      // E=24 (DIRECTOR: unchanged),
                                                   // G=8 → overhead 64
  budgetPx: number;                                  // 1216 (= 1280 − 64)
  zones: {
    leftWing:    { minPx: 236; maxPx: 400 };         // floorConfig-selected, see below
    centerStage: { minPx: 640; maxPx: 1040 };
    rightWing:   { minPx: 340; maxPx: number };      // max = leftover
  };
  /** Deterministic floor selection (WITNESS-03): exactly two legal configs,
   *  chosen ONCE per stable measurement epoch at startup/migration — never a
   *  live solver alternative (no per-render switching, no oscillation). If a
   *  later measurement flips the decision, the new config applies on next
   *  session, not mid-session. */
  floorConfig: 'floorA' | 'floorB';
  floorPresets: {
    floorA: { left: 236; center: 640; right: 340 };  // default
    floorB: { left: 260; center: 616; right: 340 };  // if measured roster
                                                     // min-content > 236
  };
  strip: { wingRailPx: 32; centerTab: { wPx: 160; hPx: 28 }; maxPerZone: 4 };
  authorizedPairs: [ ['roster', 'villageStash'] ];   // leftWing co-occupancy
  hysteresisPx: 24;                                  // collapse band only
  panels: Record<PanelId, {
    zone: ZoneId;
    role: PanelRole;
    priority: number;                                // occupancy tie-break seed
  }>;
}
```

Derived invariant enforced by an arithmetic unit test:

```
2*E + 2*G + zones.leftWing.minPx + zones.centerStage.minPx
  + zones.rightWing.minPx  <=  1280          // 24+24+8+8+236+640+340 = 1280
```

Anyone who raises a margin or a zone floor gets a failing test that prints the
arithmetic. The 1280px budget point is where air trades against wing width —
never silently.

Budget at contracted viewports (single-floor cut, verified by gemini):

| viewport | leftW | center | right | overhead | total |
|----------|-------|--------|-------|----------|-------|
| 1280     | 236   | 640    | 340   | 64       | 1280 exact |
| 1440     | 260   | 776    | 340   | 64       | 1440 |
| 1920     | 260→400 | 1040 (cap) | 340 | 64    | residual → symmetric outer margins |
| 2560     | 400   | 1040   | 340   | 64       | residual → outer margins |

Left-wing floor 236 cut because the left stack is vertical and the roster is the
most elastic content; rightWing never cut (merchant grid least elastic).
`floorConfig` is selected deterministically at implementation time by measuring
roster min-content: `floorA` (236/640/340) if it fits, else `floorB`
(260/616/340). The selection is committed to config — a fixed floor set, never
re-evaluated at runtime; both presets satisfy `… + 64 = 1280` exactly.

### A.2 Regimes

- **generic**: no active quest run. Three zones solved independently.
- **run**: a quest run is active. `QuestStageCluster` claims the WHOLE stage
  envelope as one occupant; its internal companion/skill-check columns are
  F5-owned and invisible to WS-2.

### A.3 Occupancy state machine (per zone)

```
empty → occupied → suspended → occupied
        occupied → empty          (close/retire)
        suspended → empty         (retire while suspended)
```

- `suspended`: mounted, `visibility:hidden` + `inert` (runtime-tested; WKWebView
  fallback = `pointer-events:none` + `aria-hidden` + focus-redirect + tabIndex
  strip), unregistered from the global overlay stack, excluded from hit-testing
  and the 0px² probe.
- Focus is redirected BEFORE hiding any subtree containing the focused element.
- `pointercancel` is dispatched on suspend so a suspended panel never retains
  pointer capture.
- A zone holds an ordered occupancy list; at most ONE entry per zone is visible
  EXPANDED — except `leftWing`, where the authorized pair `{roster,
  villageStash}` may be co-visible expanded (vertical stack, roster on top;
  DIRECTOR R-184 ruling). No other pair is authorized; pairs are unordered,
  never transitive.
- A third panel entering leftWing: by drag it lands as a strip; by `OPEN` it
  suspends per normal rules (unreachable today — roster/stash are the only
  left-homed panels).

### A.3b Strip presentation (DIRECTOR R1: all zone-managed panels draggable +
reducible to strip)

```ts
type PanelPresentation = 'expanded' | 'strip';
interface Occupant {
  panelId: PanelId;
  presentationIntent: PanelPresentation;    // user choice — never overwritten
  presentationEffective: PanelPresentation; // solver-derived
}
```

- `presentationEffective` differs from intent ONLY when the solver forces a
  strip for width/height; a forced strip never writes back to intent, so the
  panel re-expands when space returns.
- A strip is NOT a new region and NOT suspension: occupancy stays `occupied`;
  the body stays mounted but inert + `aria-hidden` + unregistered from the
  overlay stack (Escape ignores it); the strip chrome stays live; focus inside
  the body redirects to the strip's own control on collapse.
- Geometry: wings = 32px vertical rail at the outer edge, stacking with 4px
  gaps, cap 4/zone; center = 28×160px tab at stage top aligned to
  `userCenterX`. A zone whose occupants are all strips shrinks to 32px; freed
  width goes to center (up to cap), remainder is slack — `userCenterX` intent
  untouched.
- Drop hit-testing uses NOMINAL zone bounds, not collapsed bounds (a 32px rail
  would otherwise be nearly undroppable).

### A.4 Regime handoff (run start / run end) — atomic, single reducer commit

`REGIME_CHANGED` reduces in ONE step:

1. If `activeDrag != null` → `DRAG_CANCEL` first: `activeDrag=null`, queue
   `pointercancel` effect, discard uncommitted movement; dragged panel snaps to
   its legal rect from last committed `pointermove` intent.
2. Recompute occupancy for the new regime (see D-C retire/suspend table, §D.2).
3. All suspended occupants unregister from the overlay stack in the same commit.
4. Suspended occupants keep `userIntent` (raw position) untouched.

No intermediate state can show double-occupancy because visibility is DERIVED
(`topOfZoneStack && regimeAllows && !collapsed`) — computed in render, never
effect-set.

### A.5 Commit protocol — atomicity across the rendered-UI boundary (WITNESS-01)

A reducer transition is atomic at the *state* level only. Side effects — overlay
registration, pointer-capture cancellation, focus redirect — land in a
post-commit effect, so without a protocol there is a window where committed
state says "suspended" while the effect has not yet unregistered it. The
contract:

1. **Committed snapshot**: every reducer commit produces
   `{ state, revision }` where `revision` is a monotonically increasing integer
   owned by the reducer.
2. **Render from snapshot**: every panel derives `hidden / inert / aria-hidden /
   pointer-events` from the committed visibility state of that revision — never
   from a separate UI flag.
3. **Revision-guarded effects (WITNESS-02)**: overlay registration/
   unregistration, `pointercancel`, and focus redirect run in an idempotent
   **`useLayoutEffect`** — never `useEffect`. A passive effect runs after paint,
   which would allow one painted frame where focus sits inside a
   `visibility:hidden` panel or Escape still targets a just-suspended overlay.
   Layout effects run after DOM mutation and before paint — the same window
   BV-05/07 sample. Each effect closure captures the committed revision it was
   created under. A `pointermove` arriving between commit and layout effect is
   rejected by the revision check on the stale handler.
4. **Stale-guard**: before any effect-side mutation or callback acts (overlay
   pop, pointer-up handler, drag callback), it validates its captured revision
   against the current committed revision; a stale callback is a no-op.
   Registration for the NEW revision is also keyed so a late-running old effect
   cannot unregister a newer registration.
5. **Witness**: BV-05/BV-07 instrument rendered frames (not reducer only): no
   rendered frame may expose two visible occupants in one zone, and no stale
   overlay entry or pointer callback may act after the transition commits.

## B. The solver

```ts
interface StageIntent {
  /** per-panel committed drop position, raw px, never clamped at rest */
  placements: Record<PanelId, { x: number; y: number } | null>;
  /** F5 cluster drag intent — provider-owned so the envelope is computed in render */
  userCenterX: number | null;
}

interface SolverInputs {
  viewport: { w: number; h: number };
  regime: StageRegime;
  occupancy: Record<ZoneId, readonly PanelId[]>;   // ordered stacks
  collapsed: Record<'leftWing' | 'rightWing', boolean>; // input, not derived inside
  intent: StageIntent;
}

function solveStageLayout(i: SolverInputs): {
  zones: Record<ZoneId, Rect>;          // allocation rects incl. collapsed=0-width
  panels: Record<PanelId, Rect | null>; // null = suspended/not visible
  clusterEnvelope: Rect | null;         // run regime: = solveQuestClusterGeometry(...)
  signature: string;                    // deterministic layout signature
}
```

- **Pure**: same inputs → same outputs. `collapsed` and `openSeq` are inputs
  (stored in the reducer), keeping the solver stateless; hysteresis state lives
  in the reducer as `prevCollapsed`.
- **Allocation**: `leftW = clamp(236, vw − 2E − 2G − center.minPx − right.minPx,
  400)`; `rightW` fixed 340 until leftover exists; `centerW = vw − overhead −
  leftW − rightW`, clamped `[640, 1040]`; surplus beyond center max distributes
  as symmetric outer whitespace, never inflates zones.
- **Yield order**: left wing yields first (236→collapse), then right; center
  never goes below 640 while any wing is visible.
- **Left-wing vertical stack**: when roster and stash are co-expanded they stack
  vertically (roster top). Required: `Hr_min + 8 + Hs_min ≤ stageH` (528px at
  1280×720; plausible mins 240+240=488 fits with 40px slack — verified by
  gemini). If the stack overflows, the solver force-strips the least-recently-
  active of the pair (never writes to intent).
- **Clamped to free space**: a panel's derived rect = its committed intent
  position intersected into its zone's allocation rect (box clamp). The raw
  intent position is stored verbatim; clamping is re-derived every render.
- **Same answer**: render positions, drag-clamp, and the BV probe all call
  `solveStageLayout` on identical inputs — bit-identical rects.
- **Hysteresis**: wing collapses when `vw < threshold`; re-expands when
  `vw ≥ threshold + 24`; between them, `prevCollapsed` holds. A sweep test
  (vw 1250→1330 up and down) asserts a fixed sequence — no flapping.

### B.1 Reducer surface (provider-owned)

```
OPEN(panel)            — openSeq := ++seq; target zone per panel map;
                         if zone occupied → previous top suspends
CLOSE_ACTIVE(panel)
CLOSE_SUSPENDED(panel) — retire path
PIN / UNPIN(panel)
DROP(panel, pointerX, point)   — see §D.1
VIEWPORT_CHANGED(w,h)  — re-derive collapsed via hysteresis vs prevCollapsed
REGIME_CHANGED(regime) — atomic handoff (§A.4)
DRAG_START / DRAG_MOVE / DRAG_CANCEL
STAGE_DRAG(userCenterX) — F5 cluster intent
activeDrag: PanelId | null      — second pointerdown during a drag is ignored
```

`openSeq` is assigned INSIDE the reducer (not by callers) so two opens in one
tick produce one deterministic stack. `layoutSignature` is separate from the
reducer revision — it hashes the resolved panel rect set for diagnostics.

## C. Roster decision — RESOLVED: elastic left wing + vertical stack (DIRECTOR)

All four providers converged on the elastic wing; Director then ruled R-184:
**roster AND stash co-visible expanded, left of the planner.**

```
leftW = clamp(236, vw − 64 − 640 − 340, 400)   // 236 floor after margin ruling
```

- Roster and stash share leftWing as a **vertical stack** (roster top, stash
  bottom) under the authorized-pair exception — NOT side-by-side (impossible at
  236px, useless at 1920 where wing width is nominal).
- If the pair overflows the stage height, the solver force-strips the
  least-recently-active of the two (intent preserved, §A.3b).
- **Compact roster rendering at 236px floor is a visual-ratification item**
  [DIRECTOR G.6 — open, needs visual witness after implementation].

## D. Suspend/restore + drag persistence

### D.1 Cross-zone drag

- While dragging, the panel stays logically owned by its SOURCE zone.
- On drop, pointer-x picks the intended TARGET zone from current resolved zone
  boundaries; the reducer validates against current occupancy + layout revision
  (stale revision → reject).
- Target available + panel permitted → commit zone transfer, reconcile position
  inside target zone.
- Target occupied/pinned/collapsed → clamp back into legal space in source zone.
- **A drop NEVER suspends another occupant.** Suspension only via `OPEN` or
  `REGIME_CHANGED`.
- Single `activeDrag`: second `pointerdown` during a drag is ignored.

**Strip-aware landing (DIRECTOR R1):** a drop into a zone admits the panel
EXPANDED iff all hold: (a) the target's expanded set remains ⊆ an authorized
pair or a single occupant; (b) `panel.minWidth ≤ zoneWidth(vw)`; (c) the height
solver fits it. Otherwise it lands as a STRIP (never rejected — a dragged-in
strip must be openable). Clamp-back to source only when the target has no strip
capacity (cap 4/zone). An EXPAND request on a strip that conflicts with the
zone's expanded set demotes the least-recently-activated conflicting occupant
to strip — no dead ends.

**Expand vs regime flip (grok hole, resolved):** expand committed at revision n
then `REGIME_CHANGED` at n+1 → panel suspends at n+1 with `presentationIntent`
preserved, restores expanded at run end. Expand dispatched after n+1 →
rejected with toast (same as opens). Expand's focus-transfer `useLayoutEffect`
is guarded by revision AND `regime === 'generic'`.

### D.2 Run-start disposition table (consensus: retire vs suspend)

| occupant            | run-start        | run-end                        |
|---------------------|------------------|--------------------------------|
| planner             | retires (planning session ended → run) | per existing page lifecycle |
| BagExternalPicker   | RETIRE — occupancy cleared             | stays closed       |
| heroSheet           | UNAFFECTED — overlay, not a zone occupant (DIRECTOR R3: stays accessible mid-run) | unchanged |
| villageStash        | suspend if displaced                   | restore prior state |
| merchant            | suspend if displaced                   | restore prior state |
| roster / ledger     | suspend (home occupants)               | restore in home zones |
| Forecast            | planner-internal — retires with planner lifecycle, NOT a WS-2 occupant (verified: no registry entry) |

Retirement clears the occupancy entry; component lifetime stays with its owner.
Intent is kept on retire (reopening later restores position).

### D.3 Deferred opens during run + HeroSheet overlay (DIRECTOR R3)

**REJECT + feedback, no queue** for zone-managed panels (stash, merchant):
open requests during `run` are not applied; a one-line localized toast
("Available after the quest") is the backstop and the trigger UI is visibly
muted.

**HeroSheet is the exception** — DIRECTOR ruled it stays accessible mid-run:

- Single-instance **overlay** on the shared overlay stack — zone-EXEMPT but
  overlay-registered (Escape reaches it, probe sees it).
- During `run` it anchors to the leftWing envelope (CompanionLeft = read-only
  party view, same semantic subject), clamped to viewport; may occlude
  CompanionLeft ONLY — never center prose or the Astrolabe.
- **Pure overlay in BOTH regimes** (claude F6 + gemini Option A, unanimous over
  dual-home): anchor rect switches on regime flip — position change, not a
  remount; scroll/tab state preserved. **[DIRECTOR G.7 — confirm: heroSheet
  leaves the right wing entirely and is always an overlay.]**
- Focus/interaction gating: cluster beat-advance handlers bind to the cluster
  root (not window) and are gated while any overlay holds focus; a firing skill
  check never steals focus — engine commit stays synchronous, verdict announced
  via `aria-live`; the ratified dwell guard on the verdict's Continue button
  still applies.

### D.4 What survives

`placements` and `userCenterX` survive suspend, resize, and regime handoff.
Derived rects never write back. `openSeq` order survives suspend. Session-scoped
occupants carry `role: 'session'` metadata so retire-vs-suspend is declarative,
not ad-hoc.

## E. Panel → zone map (declarative)

| panel             | zone        | role                 | notes |
|-------------------|-------------|----------------------|-------|
| roster            | leftWing    | home                 | authorized pair with stash (stack top); draggable + strip |
| villageStash      | leftWing    | persistent-transient | authorized pair, stack bottom; draggable + strip |
| eventsLedger      | rightWing   | home                 | draggable + strip |
| merchant          | rightWing   | persistent-transient | suspends ledger (openSeq top); draggable + strip |
| heroSheet         | OVERLAY     | persistent-transient | zone-exempt, overlay-registered, BOTH regimes (§D.3, pending G.7) |
| planner (questDetail) | centerStage | home             | NEW registry entry — additive migration; gains `data-hud-panel` + overlay-stack registration so Escape/probe see it. Corridor math deleted only after the entry exists. **DIRECTOR R1: draggable like all panels.** |
| quest (run window/cluster) | centerStage→whole-stage | session | run regime owner |
| BagExternalPicker | rightWing   | session              | retires at run start |
| director / tuning | exempt      | exempt               | outside overlap contract; must not affect zone geometry |

## F. Acceptance gates

- **BV-01** 0px² overlap probe across 1280×720, 1280×800, 1920×1080, 2560×1440
  × {generic all-panels-open, run, suspend, resume, resize} — positive-area
  intersection fails.
- **BV-02** drag-clamp determinism: render rect ≡ clamp output bit-identical
  over 1000 random intents; cluster drag-clamp ≡ solveQuestClusterGeometry.
- **BV-03** suspend/restore zero drift: suspend → resize sweep → regime flip →
  restore → committed position ±0px.
- **BV-04** hysteresis sweep 1250→1330 up/down: fixed state sequence, no flap.
- **BV-05** two-regime handoff: regime flip mid-drag produces no overlap frame
  (instrument rendered frames, not reducer only) and no orphaned panel.
- **BV-06** retire policy: Forecast/picker never reappear at run end.
- **BV-07** reducer races: shuffled double-open in one tick → deterministic
  stack; double-drop → exactly one reassignment; second pointerdown during
  activeDrag ignored. Frame sampler across a regime flip *while a drag is
  active*: no sampled frame shows the dragged panel at an uncommitted
  position, and focus never rests inside a hidden subtree on any frame.
- **BV-08** suspended panel: cannot consume keyboard/pointer; focus redirected;
  Escape never routes to a suspended overlay; a11y tree clean (inert or
  verified WKWebView fallback).
- **BV-09** arithmetic invariant test: `2E+2G+236+640+340 ≤ 1280` printed in the
  failure message (E=24, G=8 — margins frozen by Director).
- **BV-10** chrome safety: no panel rect intersects top 92px / bottom 100px
  bands at any contracted viewport.
- **BV-11** runtime: `npm run verify:bundle` + `closure:lint` green;
  StrictMode double-mount must not double-fire suspensions.
- **BV-G1** strip lifecycle: every zone-managed panel drags, collapses to strip,
  expands, and restores without losing identity/zone/intent; D.1 landing rules
  (expanded iff authorized-set ∧ minWidth ∧ height-fit, else strip).
- **BV-G2** left-wing co-occupancy: roster+stash co-visible expanded at
  1280×720/800, 1440, 1920×1080, 2560×1440 — vertical stack, 0px² overlap,
  force-strip on height overflow.
- **BV-G3** heroSheet overlay during run: opens above cluster, occludes
  CompanionLeft only, zero F5 mutation, closes back to unchanged run state.
- **BV-G4** floor arithmetic: `236+640+340+64 = 1280` exact; plus measured
  roster min-content ≤ 236px (else documented center-cut fallback).
- **BV-G5** only the authorized pair co-expands; third-occupant drop → strip;
  third-occupant open → suspend rules.
- **BV-G6** roster compactness at 236px floor — Director visual witness (open).
- **BV-G7** expand-vs-regime-flip race: pre-commit expand suspends+restores;
  post-commit expand rejects with toast; stale focus effects no-op.
- **BV-G8** heroSheet focus/keys while a skill check fires: check never steals
  focus; engine commit synchronous; verdict via aria-live; dwell guard intact.

## G. Director rulings

| # | ruling | status |
|---|--------|--------|
| G.1 | Planner draggable — **RULED: draggable; all panels draggable + strippable** (§A.3b) | answered |
| G.2 | R-184 reconciliation — **RULED: roster+stash co-visible, vertical stack** (§C) | answered |
| G.3 | HeroSheet during run — **RULED: stays accessible → overlay both regimes** (§D.3) | answered |
| G.4 | Merchant rightWing | **confirmed** |
| G.5 | Margin change — **RULED: no change, edge stays 24px** → floors re-derived (§A.1) | answered |
| G.6 | Roster compact at 236px floor | **witness filed** — floorB (260px) committed after min-content measured 460px; agent-eye signoff `director-signoff.json` (capture `stage-1280x720-dpr1.png`: roster legibile, nomi troncati). **Conferma visiva Director ancora aperta.** |
| G.7 | HeroSheet pure-overlay in both regimes vs rightWing-home in generic | **implemented** — `heroSheet` = `overlay: true` nel config stageZones, mai occupante di zona, entrambi i regimi. Conferma Director aperta. |
