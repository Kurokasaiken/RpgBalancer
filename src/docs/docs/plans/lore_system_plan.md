# Lore System Plan (WL-LORE-001)

**Status:** `draft`  
**Owner:** Strategy / Coordinator  
**Scope:** Project-wide lore presentation, discovery, and collection layer.

## 1. Context and Goal

Implement a lore presentation system that supports three distinct modes:

1. **Flavor text** (MTG-style) — short, evocative snippets attached to items, characters, spells, and locations.
2. **Environmental storytelling** (Soulslike / Outer Wilds-style) — lore unlocked by interacting with the world, completing quests, visiting places, and inspecting curios.
3. **Entry book / codex** — a persistent collection of discovered lore entries, browsable by category, relation, and unlock state.

The system must be **config-first**, **zero-hardcoded**, integrated with the existing `narrativeConfig` / `NarrativeHooks` infrastructure, and must use `PersistenceService` for player progress.

## 2. Research Summary

- **MTG flavor text**: A single well-phrased sentence that delivers one idea, mood, or mystery. It does not describe the art and avoids proper-noun overload. It is a reward for collecting/inspecting the card.
- **Soulslike / FromSoftware item descriptions**: Lore is delivered as terse, fragmented, sometimes contradictory texts attached to objects. The player becomes the assembler of meaning. Works best when the world is already visually rich.
- **Outer Wilds Ship Log**: A persistent knowledge graph. Entries are unlocked by observation, and the log itself becomes a navigation/hint tool. Key mechanic: "There is more to explore here." Knowledge is the durable reward.
- **Hades Codex**: Entries grow as the player encounters/uses/befriends entities. Provides a completion loop and bestiary-like reference. Unlocks are tied to repeated interaction.
- **Darkest Dungeon curios**: Contextual objects in the environment with optional interaction. Rewards and risks can trigger lore-adjacent discoveries. Good fit for POI/curio integration.

## 3. Existing Project Foundation

- `src/balancing/config/narrative/narrativeConfig.ts` — Zod config schema, hooks, templates, telemetry.
- `src/ui/idleVillage/hooks/useNarrativeHooks.ts` — narrative generation, context substitution, caching.
- `src/ui/idleVillage/components/NarrativePanel.tsx` — narrative UI / telemetry panel.
- `src/ui/idleVillage/components/QuestChronicle.tsx` — quest phase UI with a narrative sidebar ("Diario").
- `src/data/characterIcons.ts` — static `description` field on icons; easy migration point for flavor text.
- `src/data/tooltips.ts` — mechanical descriptions; separate from flavor text.

## 4. Architecture

### 4.1 Data Model (config-first)

```typescript
// src/balancing/config/lore/loreConfig.ts
export type LoreCategory =
  | 'character'
  | 'item'
  | 'location'
  | 'creature'
  | 'faction'
  | 'history'
  | 'curio'
  | 'spell';

export type LoreUnlockState =
  | 'locked'      // not discoverable yet
  | 'hidden'      // discoverable but not yet seen
  | 'discovered'  // unlocked, not read
  | 'read';

export interface LoreEntry {
  id: string;                       // unique, stable
  category: LoreCategory;
  title: string;
  shortName?: string;               // for UI chips
  icon?: string;                    // emoji or icon id
  illustration?: string;            // art asset key
  audio?: string;                   // optional ambience / voice id
  tags: string[];                   // e.g. ['solar-empire', 'wilderness']
  /** One or more fragments that can unlock progressively. */
  fragments: LoreFragment[];
  /** Conditions that can reveal this entry. */
  unlockTriggers: LoreUnlockTrigger[];
  /** Bidirectional relations to other entries. */
  relations: LoreRelation[];
  /** Source config id for provenance. */
  sourceConfigId: string;
  telemetry: {
    track: boolean;
    events: string[];
  };
}

export interface LoreFragment {
  id: string;
  /** Fragment text. May contain template variables. */
  text: string;
  /** Optional context variables (quest, character, location). */
  variables: LoreVariable[];
  /** Optional trigger to unlock the next fragment. */
  nextFragmentTrigger?: LoreUnlockTrigger;
  /** Tone/style used for narrative correlation. */
  tone?: NarrativeTone;
  style?: NarrativeStyle;
}

export interface LoreUnlockTrigger {
  type:
    | 'item_collected'
    | 'item_inspected'
    | 'character_met'
    | 'character_level'
    | 'location_visited'
    | 'curio_interacted'
    | 'quest_completed'
    | 'quest_phase_completed'
    | 'stat_threshold'
    | 'manual';
  targetId?: string;                // id of entity, or category wildcard
  targetCategory?: LoreCategory;
  /** Optional extra condition (count, threshold, stat). */
  condition?: {
    type: 'count' | 'stat' | 'flag';
    key: string;
    operator: 'eq' | 'gte' | 'lte' | 'in';
    value: number | string | string[];
  };
}

export interface LoreRelation {
  targetId: string;
  kind: 'leads_to' | 'contradicts' | 'expands' | 'same_as';
  label?: string;
}

export interface LoreBookState {
  version: string;
  entries: Record<string, LoreUnlockState>;
  fragments: Record<string, LoreUnlockState>; // per-fragment unlock
  discoveredAt: Record<string, number>;
  readAt: Record<string, number>;
  totalDiscovered: number;
  totalRead: number;
}

export interface LoreConfig {
  version: string;
  enabled: boolean;
  categories: Record<LoreCategory, { label: string; icon: string; order: number }>;
  entries: Record<string, LoreEntry>;
  notifications: {
    onDiscover: boolean;
    onFragmentUnlock: boolean;
    toastDurationMs: number;
  };
  telemetry: {
    enabled: boolean;
    events: string[];
  };
}
```

### 4.2 Discovery Flow

```text
Gameplay event (quest complete, item pickup, curio interact, visit)
  │
  ▼
LoreDiscoveryService.evaluate(event)
  │
  ├─ match unlockTriggers against LoreConfig.entries
  ├─ for each newly unlocked entry/fragment
  │     update LoreBookState (async PersistenceService)
  │     emit telemetry: lore_unlocked, lore_fragment_unlocked
  │     optionally dispatch DiscoveryToast
  │     optionally emit NarrativeHook (lore_unlocked)
  │
  ▼
LoreBook UI re-renders from persisted state
```

### 4.3 Integration Points

- **Cards / items / spells / characters**: add an optional `loreRef: string` or `flavorText` field. UI inspect action opens `LoreEntryCard` inline or modal.
- **Quest system**: quest completion and phase completion triggers `quest_completed` / `quest_phase_completed` lore triggers. `QuestChronicle` narrative sidebar can optionally show a `flavorText` field from the active quest phase.
- **Curios / POIs**: `curio_interacted` and `location_visited` triggers unlock related lore.
- **Achievements / stat thresholds**: `stat_threshold` trigger for lore gated by mastery.
- **Narrative hooks**: add `lore_unlocked` hook type to `narrativeConfig.ts` so generated quest text can reference a discovered lore entry.

### 4.4 UI Components

- `LoreBook` — main codex view. Tabs by category, search, unread indicator, progress/completion, relation graph/list.
- `LoreEntryCard` — detail view with title, illustration, fragments, related entries, "mark read" action.
- `LoreCategoryNav` — category filter bar.
- `FlavorText` — inline, italicized snippet component for cards/items; supports reveal-on-hover.
- `DiscoveryToast` — notification when an entry/fragment is unlocked.
- `LoreButton` — badge/button in main HUD to open `LoreBook`.

### 4.5 Persistence Rules

- All player state must be saved via `PersistenceService` (async `saveData` / `loadData`).
- Key: `lore_book_state` or `lore_book_${profileId}`.
- Direct `localStorage` is forbidden.
- Migration path: `LoreBookState` version field + migration function.

## 5. File Layout

```text
src/balancing/config/lore/
  loreConfig.ts          # LoreConfig schema, defaults, validation
  loreEntries.ts         # sample/default entries (or imported JSON)
  loreTypes.ts           # shared types (extracted from loreConfig.ts)

src/engine/game/lore/
  LoreDiscoveryService.ts # trigger evaluation, unlock logic, telemetry

src/store/
  loreStore.ts           # player-facing store (async persistence, selectors)

src/ui/components/lore/  # or src/ui/idleVillage/components/lore/
  LoreBook.tsx
  LoreEntryCard.tsx
  LoreCategoryNav.tsx
  FlavorText.tsx
  DiscoveryToast.tsx
  LoreButton.tsx

src/hooks/
  useLore.ts             # public hook for pages/components
  useLoreDiscovery.ts    # hook wrapper for LoreDiscoveryService

tests/unit/lore/
  LoreDiscoveryService.test.ts
  loreStore.test.ts
  LoreBook.test.tsx

docs/plans/lore_system_plan.md
```

## 6. Implementation Phases

### Phase 1 — Schema and Config

- Create `loreConfig.ts` Zod schema and `LoreConfig` / `LoreEntry` types.
- Add default sample entries (config-first, no hardcoded runtime strings).
- Wire `loreConfig` into `BalancerConfigStore` or `IdleVillageConfigStore` as appropriate.
- Add `lore_unlocked` hook type to `narrativeConfig.ts`.

### Phase 2 — Discovery Engine

- Implement `LoreDiscoveryService` with trigger evaluation.
- Add telemetry events: `lore_unlocked`, `lore_fragment_unlocked`, `lore_read`, `lore_book_opened`.
- Unit tests for trigger matching.

### Phase 3 — Persistence and Store

- Implement `loreStore` using `PersistenceService`.
- Async `loadLoreBook`, `saveLoreBook`, `markEntryRead`.
- Migration stub.

### Phase 4 — Core UI

- `LoreBook`, `LoreEntryCard`, `FlavorText`.
- `DiscoveryToast` integration.
- Style Lab tokens / Gilded Observatory theme.

### Phase 5 — Gameplay Integration

- Attach `loreRef` / `flavorText` to existing items, characters, locations, spells, curios.
- Wire quest completion/phase completion to lore triggers.
- Wire `QuestChronicle` narrative sidebar to optionally display a lore snippet.
- Add `LoreButton` to main HUD.

### Phase 6 — Validation

- `npm run lint` / `npm run build:check` / `npm run test`.
- `kanban:lint`.
- Evidence log: `test-results/wl-lore-001-<date>.log`.

## 7. Next Prompts

1. **WL-LORE-001-A** — Implement `loreConfig.ts` schema and sample entries; integrate with `narrativeConfig.ts` `lore_unlocked` hook type.
2. **WL-LORE-001-B** — Implement `LoreDiscoveryService` with trigger evaluation and telemetry.
3. **WL-LORE-001-C** — Implement `loreStore` with `PersistenceService` and migration stub.
4. **WL-LORE-001-D** — Implement `LoreBook`, `LoreEntryCard`, and `FlavorText` UI components.
5. **WL-LORE-001-E** — Wire quest, item, curio, and location gameplay events to `LoreDiscoveryService`.

## 8. References

- `docs/plans/art_direction_plan.md` — Gilded Observatory / Noble Heroic Realism tone guardrails.
- `src/docs/docs/PROJECT_PHILOSOPHY.md` — config-first, zero hardcoding.
- `src/docs/docs/MASTER_PLAN.md` §Phase 11 — Tactical Missions narrative flavor.
- `src/balancing/config/narrative/narrativeConfig.ts` — narrative hooks and templates.
- `src/ui/idleVillage/components/QuestChronicle.tsx` — existing narrative sidebar.
- `src/data/characterIcons.ts` — existing `description` migration candidate.

## 9. Risk Notes

- Lore text must not violate the art direction kill list (no grim/mud/horror; keep solar triumphant).
- Avoid mixing mechanical `description` text (`src/data/tooltips.ts`) with flavor text; keep separate fields.
- Ensure `loreStore` does not block the main loop with synchronous persistence.
