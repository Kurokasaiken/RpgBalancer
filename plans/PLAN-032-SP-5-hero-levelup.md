---
title: 'PLAN-032 SP-5 — Level-up eroe (presentazione mock)'
status: completed
created: 2026-10-14
parent: PLAN-032
debate: mw-web-debate `20261012-plan-032-sp5-hero-levelup` — artifact r009
  converged 2/2 eligible (deepseek, gemini ACCEPT; claude limit_exceeded,
  chatgpt provider_dead)
artifact_sha256: 3d8d1cca68d8f42db167ca25be39e15f81c0b1503b4986777b90b8fd74706845
depends_on: none
dispatch: 2026-10-14 — T-011 PLAN-034; executor manual (Devin session)
---

# SP-5 — Hero level-up (presentazione mock) — artifact r009

Round-2 residuals absorbed: acceptance semantics enumerated, `dispatched`
type unified, "on-screen" predicate owned, prod policy aligned to the teaser
rationale, eventId generation fixed, floater merge-clause added.

## Goal
For the Steam teaser, hero level-up is VISIBLE: "Lv N" badge on the pgCard,
SlottedMedal ring (resting lit state + ignition pulse), `level_up` cue,
"Livello N" floater. All data is mock config; the real system is
PROGRESSION.md (draft) and stays missing.

## Design

### Config — `src/balancing/config/idleVillage/heroLevelConfig.ts` (Zod)
- `levels: Record<residentId, number>` — residentId ONLY, `int >= 1`.
- `fx: { ringMs: number, floaterMs: number }`. Intent: the `level_up` cue is
  the beat's spine, `ringMs <= cueDuration`, `floaterMs` may extend past —
  stated so config drift is reviewable, not a hard invariant.
- `staging: { targets: residentId[] }` — Director "Level up" applies to these.
- **NO `xpToNext`** — deleted: no consumer; an unconsumed progression-shaped
  field is a future-wiring leak. PROGRESSION.md owns real XP when it lands.
- Two-layer validation with explicitly different TIMING:
  - **Zod at module load**: shape + constraints only (types, `int >= 1`).
    Dev: throws. Prod: a defined salvage algorithm — never bricks a build
    at import time:
    1. `HeroLevelConfigSchema.safeParse(raw)` → success:
       `{ config, configInvalid: false }`.
    2. Failure → deterministic FIELD-LEVEL salvage (each field
       independent; every rule total — every malformed input has exactly
       one defined outcome):
       - `levels`: must be a plain object. Entries whose value is not an
         `int >= 1` are dropped per-key (no coercion — `"3"` is dropped,
         not converted). `levels` itself not a plain object →
         unsalvageable → `config = null`.
       - `staging`: REQUIRED parent section. ABSENT or `null` →
         `configInvalid` (a missing required section is malformed authoring,
         not intentional emptiness). Present but not an object →
         `{ targets: [] }` + `configInvalid`.
         Intentional emptiness is expressible ONLY as the explicit
         `staging: { targets: [] }` — which parses VALID (no marker) and
         rejects at command time as the zero-eligible no-op. The three
         cases are thereby distinguishable: absent section → invalid
         config reject; explicit empty → no-op reject; populated → proceed.
       - `staging.targets`: must be an array. Non-string or empty-string
         entries dropped per-index. Not an array → `[]` (counts as
         invalid, marker set).
       - `fx.ringMs`, `fx.floaterMs`: each independently — a present
         `number > 0` kept; present-but-invalid → schema default +
         `configInvalid`; ABSENT field → schema default, NOT invalid
         (absence is not malformedness). `fx` not an object → both
         defaults + `configInvalid`.
       - Unknown keys at any level → stripped, `configInvalid` set
         (strict, not passthrough).
    3. `config` = the salvaged object, or `null` when `levels` is
       unsalvageable.
    4. The parse RESULT is a wrapper `{ config, configInvalid }` —
       `configInvalid: true` whenever ANY entry was dropped/coerced OR
       `config === null`. The marker lives OUTSIDE the config object, so
       no consumer can strip it and a filtered config can never
       masquerade as a legitimately valid one (an emptied
       `staging.targets` is distinguishable from a configured-empty list).
    5. Every drop logs `console.error` with the rejected entries.
    `configInvalid` OR `config === null` → the staging command is REJECTED
    identically to the invalid-target case — deterministically, BEFORE
    any dispatch/audio/telemetry.
  - **Roster cross-check at COMMAND time only** (uniform dev/prod): every
    `staging.targets` id must exist in the canonical roster AND pass
    `isHero`. Any invalid target → the command is REJECTED (see outcomes).
    A blocked button is the correct teaser behavior — uniform in both
    builds. (Optional non-fatal `console.warn` at dev load for authoring
    ergonomics; never a throw, so HMR can't white-screen.)

### Command — enumerated outcomes
`runHeroLevelUpStaging(): { accepted: boolean, configuredTargets: residentId[], dispatchedTargets: residentId[] }`
— `configuredTargets` is ALWAYS the original `staging.targets` snapshot
(including targets excluded from dispatch); `dispatchedTargets` is the
subset actually dispatched. The command result and the telemetry payload
expose the same two fields with the same contents.

- **REJECT** — invalid config or any invalid (non-hero/stale) target:
  `accepted: false`, `dispatchedTargets: []`, no telemetry, no audio, no FX.
- **REJECT** (no-op) — valid config but ZERO eligible targets (no valid
  target has a mounted hero card): same as above. No telemetry/audio for an
  invisible level-up.
- **ACCEPT** — ≥1 eligible target: dispatch one typed presentation event
  per eligible target, emit telemetry ONCE, play the cue ONCE.

**Eligibility** = roster-valid `isHero` AND **card mounted** in the rosterV2
decorative layer. "On-screen" means mounted — NOT viewport-visible
(viewport culling is a rendering concern above this seam). The mounted-card
registry is owned by the rosterV2 card layer and read by the command — the
single named owner of the predicate.

### Event contract
`{ type: 'hero_levelup_mock', residentId, level, eventId }` —
`eventId = <commandSeq>:<targetIndex>`, a monotonic id generated by the
command handler (per-session counter). Newer eventId wins for every
supersede rule. The payload implies no XP gain, persistence, or mutation.

### View-model / future seam
- `useHeroLevelView(residentId)` → `{ level: number | null }`: `null` unless
  `isHero(resident)` AND `levels[residentId]` exists — gate FIRST, no leak.
- `useHeroLevelUp()` — a typed contract STUB only: it is the name future
  settlement wiring will call to dispatch the SAME presentation event. It
  owns no progression semantics today, is not a partial progression API,
  and is never claimed as implemented settlement integration. The mock
  event type stays explicitly staging-specific; PROGRESSION.md decides the
  real event when it exists.
- Effect lifecycle (ignition, floater) is owned by presentation components
  / the floater pool — never by the config view-model.

### Presentation (rosterV2 decorative layer — pgcardKit untouched)
- **Badge slot**: always mounted in the decorative layer; CONTENTS render
  only when `useHeroLevelView().level !== null` (T-02b: non-hero card →
  slot present, zero `[data-hero-level]` elements, no "Lv" text).
- Badge anchor: top-right of the card's portrait bounds, as a sibling of
  any status-strip/selection-frame elements that own their own slots —
  the badge does not share their coordinates (no unfalsifiable "won't
  collide" claim; the anchor rule is the contract). Stacking: above the
  portrait, below HUD overlays — via the layer's existing stacking
  convention (skin z-tokens where they exist).
- **Ring — 3 states**: `level null` → arc element NOT mounted (T-02
  structural); `level ≥ 1` idle → resting lit ring; level-up event →
  transient IGNITION overlay for `ringMs`, then resting. Retrigger restarts
  the ignition: the overlay mounts keyed by `eventId`
  (`<IgnitionOverlay key={eventId}>`), so a new event remounts and the
  keyframes restart — no manual timer races, no competing timers.
- Cue: `level_up` via existing audio API — ONCE per accepted command.
- Floater: typed TEXT variant of DamageFloater (same module/pool/lifecycle)
  — text payload + `eventId` identity + `floaterMs` cleanup; `aria-hidden`,
  `pointer-events-none`, rendered by the floater layer above card bounds
  (no clipping). **No merge, no accumulation, no damage arithmetic** —
  same-target floaters supersede by eventId, never sum/stack. Damage
  behavior untouched.
- **N targets → 1 telemetry, 1 audio cue, N visual flares.**

### Telemetry
- ONE `feature_action hero_levelup_mock` per ACCEPTED command, emitted at
  the command handler — single named emission point. Rejected commands emit
  nothing.
- Payload: `{ configuredTargets: residentId[], dispatchedTargets:
  residentId[] }` — same field names and same contents as the command
  result (config intent vs actual dispatch, both auditable).

### i18n (en + it — single `idleVillage` namespace; `gameFrame.heroLevel.*`
are paths inside it, same convention as `gameFrame.questWindow.*`)
- `heroLevel.badge` — `"Lv {{n}}"` / `"Lv {{n}}"` (i18next `{{n}}`).
- `heroLevel.floater` — `"Level {{n}}"` / `"Livello {{n}}"`.
- `heroLevel.a11y` — `"Level {{n}} hero"` / `"Eroe livello {{n}}"`.
All three keys in BOTH locales — asserted, not assumed.

## Scope
Hero only (`isHero` render gate + roster-validated targets). Mock explicit:
no level system, no settlement wiring, no ResidentState changes; MissingHub
`levelUp` marker stays `missing`.

## Verification
- **View-model**: hero+level → value; non-hero in `levels` → null; hero
  without level → null.
- **T-02**: level null → no arc mounted; `level ≥ 1` idle → resting ring;
  ignition → overlay then resting.
- **T-02b**: non-hero card → slot mounted, zero hero-level elements.
- **Command outcomes**: all three rows (invalid→reject, zero-eligible→
  reject, ≥1→accept) — telemetry/audio ONLY on accept.
- **Validation**: Zod dev-throw vs prod-filter branches; roster check
  drives `accepted` at command time in both builds.
- **Integration**: accepted multi-target command → eligibility filtering,
  ONE telemetry (exact `{configuredTargets, dispatchedTargets}` payload),
  ONE audio, per-target flares, zero persistence/mutation. Rejected path
  emits nothing. Rapid double-trigger → two distinct monotonic eventIds,
  one live ignition (keyed remount), no orphaned timers; floater supersedes
  (no merge).
- **i18n**: all three keys interpolate (no literal `{{n}}`), en+it; badge
  a11y name carries the level.
- **Layout (headed, T-04)**: badge anchored per rule (no coordinate
  sharing), floater unclipped, ignition readable — by eye, both locales.
- STRICT_FILES guard; evidence log.

## Explicitly out of scope
Real progression (PROGRESSION.md), XP fields/persistence, ResidentState
fields, non-hero levels, player-facing level-up UI, settlement wiring, stat
growth, audio registry changes, `xpToNext` (deleted — no consumer).

## Chiusura (2026-10-14)

Completato — bundle PASS `.mw/runs/plan032-sp5-2026-10-14/bundle.json` (4/4),
evidence `test-results/PLAN-032-SP5-2026-10-14.log`, smoke headed
`test-results/plan-032-sp5-smoke-2026-10-14/`.

**Divergenza implementativa (i18n):** la spec indicava `{{n}}` (mustache).
Il progetto monta `i18next-icu` globalmente: `{{n}}` renderizza letterale a
runtime (verificato nello smoke headed). Le chiavi usano `{n}` ICU — intento
della spec (interpolazione) preservato. Attenzione: le chiavi `{{var}}`
preesistenti in `idleVillage.json` sono probabilmente rotte allo stesso modo —
trap candidata per un task di audit dedicato.

**Nota env gate:** `import.meta.env` è undefined fuori da Vite (tsx, alcuni
setup vitest): il gate dev/prod in `heroLevelConfig.ts` usa
`import.meta.env?.PROD === true` con default strict-throw — mai accesso
diretto.
