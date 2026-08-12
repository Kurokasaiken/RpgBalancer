---
title: World Surface V3 — Domain Model Decision
status: Draft
source: multi-AI iterative deliberation (Mind Weaver `explorer`)
desiderata: .mw/desiderata.md v2
created: 2026-08-13
---

# World Surface V3 — Central Contract Decision

Output of the `explorer` multi-AI deliberation. It resolves the open conflicts that blocked Sub-plan A and defines the concrete domain model, composition lifecycle, referential matrix and the split of the root-config work into A.1, A.2, A.3.

## 1. Closed decisions

### Biomes: closed vocabulary + enabled authored catalog

`BiomeId` is a static union:

```ts
type BiomeId =
  | 'forest' | 'desert' | 'mountain' | 'ocean' | 'swamp'
  | 'tundra' | 'volcano' | 'plains' | 'coast' | 'ruins';
```

`biomes[]` remains the authored catalog: it enables a non-empty subset and supplies data for each enabled biome. Therefore a reference is both compile-time constrained and validated against enabled entries.

Arbitrary biome IDs and mod/UGC extensibility are out of scope for V3; they would require a new vocabulary/version decision.

### EventSeverity: eligibility profile, not event instance

`EventSeverity` is a reusable attention-director profile: rank, duration range, and eligible biome/wonder sets. It does **not** contain phase scripts, audio, visual payloads, or de-escalation logic. Those would define a separate event domain and are not required by this central contract.

The root field is `eventSeverities`, never `events`.

### Runtime boundary

- Runtime consumers receive the normalized config for ordered iteration.
- They receive `WorldSurfaceV3Registry` for ID resolution.
- The registry is built from config; it is not a second source of domain data.

### Composition determinism

The original requirements “order-independent” and “preserve authored order” conflict if fragment input order affects concatenation.

Resolution:

1. every fragment has a unique `source`;
2. composition orders fragments by `source` ascending;
3. it preserves entity order **inside each fragment**;
4. normalization does not sort or rewrite anything.

Thus the same set of fragments produces the same root regardless of caller order, while authored local order survives.

---

## 2. Shared primitives and root contracts

```ts
type EntityId = string; // /^[a-z][a-z0-9-]{0,63}$/
type LabelKey = string; // validated by the separate i18n audit
type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';

type WorldPoint = Readonly<{ x: number; y: number }>; // world_pixels, top_left
type WorldRect = Readonly<{
  x: number;
  y: number;
  width: number;  // > 0
  height: number; // > 0
}>; // world_pixels, top_left
```

```ts
interface WorldSurfaceV3Config {
  readonly version: 'v3';
  readonly layerBudget: LayerBudget;
  readonly worldAttentionDirector: WorldAttentionDirector;
  readonly attentionZones: readonly AttentionZone[];
  readonly reactions: readonly Reaction[]; // min 1
  readonly eventSeverities: readonly EventSeverity[];
  readonly wonders: readonly Wonder[];
  readonly biomes: readonly Biome[]; // min 1
  readonly breath: Breath;
  readonly parallax: Parallax;
  readonly seasonModifiers: Readonly<Record<SeasonId, SeasonModifier>>;
  readonly underwaterV3: UnderwaterV3;
}
```

```ts
interface WorldSurfaceV3Fragment {
  readonly source: EntityId;
  readonly layerBudget?: LayerBudget;
  readonly worldAttentionDirector?: WorldAttentionDirector;
  readonly attentionZones?: readonly AttentionZone[];
  readonly reactions?: readonly Reaction[];
  readonly eventSeverities?: readonly EventSeverity[];
  readonly wonders?: readonly Wonder[];
  readonly biomes?: readonly Biome[];
  readonly breath?: Breath;
  readonly parallax?: Parallax;
  readonly seasonModifiers?: Partial<Record<SeasonId, SeasonModifier>>;
  readonly underwaterV3?: UnderwaterV3;
}
```

A fragment must contribute at least one root section. `version` is compiler-owned: composition always emits `'v3'`; no preset can override it.

---

## 3. Entity model

```ts
interface LayerBudget {
  readonly maxPixiObjects: number;       // positive integer; schema default 150
  readonly textureVramBudgetMb: number;  // positive integer; schema default 128
  readonly enforcement: 'warn' | 'reject';
}
```

The two numeric defaults must be marked as profiling placeholders. `warn` is the initial authored policy.

```ts
interface Reaction {
  readonly id: EntityId;
  readonly labelKey: LabelKey;
  readonly kind: 'highlight' | 'pulse' | 'particle' | 'camera-nudge';
  readonly durationMs: number; // positive integer
  readonly cooldownMs: number; // non-negative integer
  readonly heavyEffect?: Readonly<{
    readonly particleCount: number; // positive integer
    readonly lifetimeMs: number;    // positive integer
  }>;
}
```

```ts
interface Wonder {
  readonly id: EntityId;
  readonly labelKey: LabelKey;
  readonly biomeId: BiomeId;
  readonly position: WorldPoint;
  readonly reactionId?: EntityId;
  readonly importance: number; // integer 1..100
}
```

```ts
interface Biome {
  readonly id: BiomeId;
  readonly labelKey: LabelKey;
  readonly surfaceKey: string;
  readonly defaultSeasonId: SeasonId;
}
```

```ts
interface EventSeverity {
  readonly id: EntityId;
  readonly labelKey: LabelKey;
  readonly rank: number; // integer 1..5
  readonly phaseDurationMs: readonly [number, number]; // positive integers, min <= max
  readonly eligibleBiomeIds: readonly BiomeId[];
  readonly eligibleWonderIds: readonly EntityId[];
}
```

An empty eligibility list means unrestricted for that dimension. Duration selection is `min <= duration < max`.

```ts
interface AttentionZone {
  readonly id: EntityId;
  readonly labelKey: LabelKey;
  readonly bounds: WorldRect;
  readonly biomeId?: BiomeId;
  readonly reactionId: EntityId;
  readonly weight: number; // positive finite
  readonly cooldownMs: number; // non-negative integer
  readonly activation: 'always' | 'any' | 'all';
  readonly triggers: readonly AttentionZoneTrigger[];
}

type AttentionZoneTrigger =
  | Readonly<{ kind: 'event-severity'; eventSeverityId: EntityId }>
  | Readonly<{ kind: 'wonder-visible'; wonderId: EntityId }>
  | Readonly<{ kind: 'season'; seasonId: SeasonId }>;
```

`always` requires zero triggers; `any` and `all` require at least one.

```ts
interface Breath {
  readonly enabled: boolean;
  readonly cycleDurationMs: number; // positive integer
  readonly amplitudePx: number;     // finite >= 0
}

interface Parallax {
  readonly layers: readonly Readonly<{
    readonly id: EntityId;
    readonly factor: number; // finite >= 0
    readonly zIndex: number; // integer
  }>[];
}

interface SeasonModifier {
  readonly ambientAlpha: number;      // 0..1
  readonly breathMultiplier: number;  // finite >= 0
  readonly tintHex?: `#${string}`;    // schema: #RRGGBB
}

interface UnderwaterV3 {
  readonly enabled: boolean;
  readonly biomeId?: BiomeId;
  readonly waterlineY?: number;       // world_pixels
  readonly depthPx?: number;          // positive finite
  readonly causticOpacity?: number;   // 0..1
}

interface WorldAttentionDirector {
  readonly enabled: boolean;
  readonly selectionIntervalMs: number; // positive integer
  readonly maxConcurrentZones: number;  // positive integer
  readonly defaultEventSeverityId?: EntityId;
}
```

Parallax layer IDs and `zIndex` values are unique. Array order is render order; `zIndex` is a guard, never a sorting instruction. When underwater is enabled, all its optional fields become required.

---

## 4. Composition and lifecycle

```text
author fragment
→ strict fragment parse
→ composeWorldSurfaceV3(fragments)
→ complete-root parse
→ referential validation
→ semantic validation / optional demo profile
→ normalize + deep freeze
→ createWorldSurfaceV3Registry
→ runtime consumer
```

### `composeWorldSurfaceV3`

- rejects duplicate fragment `source`;
- canonicalizes fragment traversal by `source`;
- singleton section: exactly one contributor;
- entity collections: concatenate then reject duplicate IDs;
- `seasonModifiers`: merge only disjoint season keys;
- absent collections materialize as `[]`;
- absent singleton contributor is an error;
- no deep merge, override, array replacement, or last-write-wins;
- errors include both sources and the section/key/ID in conflict.

The output is passed to the complete root schema.

### Validation ownership

| Phase | Validates |
|---|---|
| Fragment schema, strict | unknown keys, types, ID syntax, local entity shape, ranges, geometry, local duplicate IDs |
| Composition | ownership, duplicate IDs across fragments, repeated season keys, missing singleton |
| Root structural schema, strict | every root field, cardinality, all four seasons |
| Referential validator | every cross-entity ID against its target collection |
| Semantic validator | zone activation rule; underwater enabled rule; unique parallax z-indices |
| Demo profile | root guarantees plus `attentionZones.length >= 1` |

Unresolved cross-fragment IDs are allowed only during fragment validation; they are rejected after composition.

### Normalization and registry

Normalization runs only after successful full validation. It materializes schema defaults, preserves composition output ordering and values, then recursively deep-freezes the graph. It does not repair, invent, sort, or fallback domain data.

```ts
interface WorldSurfaceV3Registry {
  readonly config: WorldSurfaceV3Config;
  readonly reactionsById: ReadonlyMap<EntityId, Reaction>;
  readonly zonesById: ReadonlyMap<EntityId, AttentionZone>;
  readonly eventSeveritiesById: ReadonlyMap<EntityId, EventSeverity>;
  readonly wondersById: ReadonlyMap<EntityId, Wonder>;
  readonly biomesById: ReadonlyMap<BiomeId, Biome>;

  getReaction(id: EntityId): Reaction | undefined;
  hasReaction(id: EntityId): boolean;
  getZone(id: EntityId): AttentionZone | undefined;
  hasZone(id: EntityId): boolean;
  getEventSeverity(id: EntityId): EventSeverity | undefined;
  hasEventSeverity(id: EntityId): boolean;
  getWonder(id: EntityId): Wonder | undefined;
  hasWonder(id: EntityId): boolean;
  getBiome(id: BiomeId): Biome | undefined;
  hasBiome(id: BiomeId): boolean;
}
```

`createWorldSurfaceV3Registry(config)` accepts only normalized config. It builds private mutable maps, exposes only `ReadonlyMap` facades, and never parses, merges, defaults, or validates.

Deep-freeze cost is paid once at startup, not in selection/render loops. Profiling is the evidence gate for any future hot-reload or large-config requirement.

---

## 5. Referential validation matrix

| Source field | Target | Cardinality | Error policy |
|---|---|---:|---|
| `AttentionZone.reactionId` | `reactions[].id` | exactly 1 | issue at source field |
| `AttentionZone.biomeId` | enabled `biomes[].id` | 0..1 | error if present and missing |
| `triggers[].eventSeverityId` | `eventSeverities[].id` | exactly 1 | issue at trigger field |
| `triggers[].wonderId` | `wonders[].id` | exactly 1 | issue at trigger field |
| `triggers[].seasonId` | static `SeasonId` | exactly 1 | structural schema error |
| `Wonder.biomeId` | enabled `biomes[].id` | exactly 1 | issue at source field |
| `Wonder.reactionId` | `reactions[].id` | 0..1 | error if present and missing |
| `EventSeverity.eligibleBiomeIds[]` | enabled `biomes[].id` | 0..N | issue per missing ID |
| `EventSeverity.eligibleWonderIds[]` | `wonders[].id` | 0..N | issue per missing ID |
| `Biome.defaultSeasonId` | static `SeasonId` | exactly 1 | structural schema error |
| `UnderwaterV3.biomeId` | enabled `biomes[].id` | required iff enabled | semantic/referential error |
| `WorldAttentionDirector.defaultEventSeverityId` | `eventSeverities[].id` | 0..1 | error if present and missing |
| `seasonModifiers` keys | static seasons | exactly 4 | root structural error |
| IDs in each entity collection | same collection | unique | issues on both occurrences |
| `Parallax.layers[].id`, `.zIndex` | `parallax.layers` | unique | issues on both occurrences |

No cross-collection uniqueness is required.

---

## 6. Sub-plan A split

### A.1 — Consumer audit and contract freeze

**Purpose:** establish actual runtime constraints before migration.

#### Acceptance (A.1)

- `CONSUMER_AUDIT.md` enumerates direct/type-only imports, hooks, Pixi/DOM layers, pages, stores, tests, barrel exports, dynamic imports, and data attributes.
- Each consumer records fields, import path, coordinate conversion, and one disposition: adapt, compatibility adapter, or remove.
- Each consumer explicitly confirms or rejects `world_pixels/top_left`.
- Public API is frozen as `createWorldSurfaceV3Registry(config)`.
- No consumer migration begins before this audit exists.

### A.2 — Fragments, composition, validation, normalization

**Purpose:** make invalid authored data impossible to reach runtime.

#### Acceptance (A.2)

- Strict Zod schemas and inferred types exist for every entity, fragment, and complete root.
- Existing presets export only named `WorldSurfaceV3Fragment` values.
- Tests cover every matrix row positively and negatively, unknown keys, invalid IDs, geometry, duplicate singleton ownership, duplicate entity IDs, duplicate seasons, and missing singletons.
- Valid complete fixture passes; demo profile rejects empty zones while base root accepts them.
- Enabled underwater without all required values fails.
- Normalization occurs only after a successful complete validation and deep-freezes the result.
- Focused tests, `npm run lint`, and `npm run build:check` pass.

### A.3 — Registry and consumer migration proof

**Purpose:** close the complete authored-to-runtime path.

#### Acceptance (A.3)

- Registry exposes immutable lookup facades and typed `getX`/`hasX`; unknown IDs return `undefined`.
- Public API makes map/config mutation impossible or fails.
- No runtime consumer imports presets directly or owns a duplicate domain schema.
- Integration test proves: fragments → compose → validate → normalize → registry → representative consumer.
- Representative Pixi/DOM test proves the documented coordinate adapter path.
- Full safeguards pass, including `npm run kanban:lint`.

## Explicitly rejected critique branches

- Configurable arbitrary biome IDs: conflicts with the required closed V3 vocabulary.
- Full gameplay-event payload inside `EventSeverity`: conflicts with its closed role as severity/eligibility profile.
- Generic deep merge or override semantics: makes ownership and diagnostics ambiguous.
- Automatic migration, hot reload, UGC, and schema-version migration: no evidence or requirement in this V3 scope. Unknown `version` values fail structurally; a future version needs an explicit migration boundary.
