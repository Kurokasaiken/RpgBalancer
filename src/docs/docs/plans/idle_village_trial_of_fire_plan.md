# 🛡️ Master Plan: Village Sandbox (Idle Village legacy) – Trial of Fire & Theater View

**Status:** Draft · **Owner:** Village Sandbox pod · **Last Updated:** 2025-12-23  
**Scope:** Engine extensions for survival/hero systems + new Theater/roster UI containers on the canonical `VillageSandbox` (legacy `IdleVillagePage` kept solo per reference).

## 1. Visione del Gameplay

Un sistema di gestione coloniale dove la "carne da macello" (Rookies) automatizza l'economia, mentre il giocatore coltiva manualmente gli "Eroi" attraverso il rischio.

## 2. Architettura dei Dati (Engine & State)

### 2.1 ResidentState (L'Entità)

- `isHero`: Sblocca bordi dorati e priorità.
- `survivalCount`: Quante missioni pericolose ha completato.
- `survivalScore`: Somma ponderata del rischio affrontato (per ranking).
- `currentHp / maxHp`: Gestione ferite. Se HP < 25%, il residente è `isInjured`.

### 2.2 Trial of Fire (Logica di Risoluzione)

Il calcolo non avviene all'inizio, ma alla **risoluzione manuale** (Click to Collect):

- **Formula Bonus:** `BonusStat = StatAttuale * (1 + (SnapshotDeathRisk * GlobalMultiplier))`.
- **Hero Promotion:** Se `SnapshotDeathRisk > 30%` e il tiro di dado ha successo, il residente guadagna `isHero = true`.
- **Ferite:** Se il tiro fallisce ma non è morte totale, `isInjured = true` e HP dimezzati.

### 2.3 Automazione (Auto-Loop)

- Se `isAuto` è attivo su un Job (non Quest): il motore riassegna il residente allo stesso slot appena finisce, a patto che abbia HP > 25% e Fatica < Max.

## 3. Interfaccia Utente (UI Hierarchy)

### 3.1 Roster Sinistro (L'Armeria)

- **Layout:** Elenco verticale di card dettagliate.
- **Dati:** Mostra barre HP (verde) e Fatica (gialla).
- **Interazione:** Durante il drag, la card rimane "ghosted" nella lista, ma il cursore trasporta un **Orb circolare (Token-Faccia)**.

### 3.2 HUD Destro (Monitoraggio & Risoluzione)

- **Status:** Mostra card compatte per ogni `ScheduledActivity` in corso.
- **Risoluzione:** Se l'attività è una Quest e il timer è finito, la card pulsa. Il click triggera il `resolveActivityOutcome`.

### 3.3 Theater View (Il Luogo)

- **Trigger:** Cliccando su un luogo o trascinandoci sopra un residente.
- **Componente:** Card 21:9 con panorama in alto. Sotto, una fila di `VerbCard` (Medaglioni) circolari.
- **Priority Glow:** Il marker sulla mappa chiusa mostra l'halo dell'attività più urgente (scadenza o fine lavoro).

## 4. Roadmap di Implementazione

1. **Fase 0:** Allineamento tipi (ResidentState, ScheduledActivity).
2. **Fase 1:** Refactoring `ResidentRoster` (Sidebar sinistra + Drag Token).
3. **Fase 2:** Integrazione `TheaterView` e rimozione codice inline in `IdleVillageMapPage`.
4. **Fase 3:** Logica `onResolve` nell'HUD destro con calcolo Trial of Fire.

---

## 5. Technical Execution (detailed)

### 5.1 Objectives

1. **Extend the data layer** so that survival streaks, hero flags, and auto activities are first-class fields on `ResidentState`/`ActivityState` and tick deterministically through `tickIdleVillage`.
2. **Model Trial of Fire risk scaling** via `calculateSurvivalBonus(deathRisk: number)` and persist snapshot risk on activities to resolve end-of-run bonuses.
3. **Add config-driven auto-looping** for activities flagged as `isAuto`, rescheduling them when they finish (respecting fatigue and slot capacity).
4. **Introduce RosterSidebar + TheaterView** UI shells that visualize residents, slot contents, and medallion-styled `VerbCard`s with new hero/auto/ready-to-collect badges.
5. **Deliver UX hooks** for Bloom expansion (map slot → TheaterView) and hero promotion (based on survival count or epic Trial of Fire), keeping all thresholds configurable.

---

## 2. Non-Goals

- Redesigning the entire Idle Village HUD or economy loops (food, upkeep already tracked elsewhere).
- Introducing new stat formulas beyond the Trial of Fire multiplier; existing stat weights still live in `src/balancing/config`.
- Shipping new art assets beyond palette-aligned panoramas/icons already in `/public/assets`.

---

## 3. Current State Snapshot

| Area | Status | Gap |
| --- | --- | --- |
| `ResidentState` definition | Tracks fatigue/status only (`@filepath:src/engine/game/idleVillage/TimeEngine.ts#120-186`). | No fields for heroism, injuries, or survival streaks. |
| Scheduled activities | `ActivityState` lacks metadata to tell auto-loop vs manual (`@filepath:src/engine/game/idleVillage/TimeEngine.ts#224-318`). | Cannot store snapshot death risk or auto flags. |
| VerbCard UI | Map clusters already render VerbCards but without hero/auto halos (`@filepath:src/ui/idleVillage/VerbCard.tsx`). | Need new decorations + medallion layout for Theater view. |
| Map interactions | Drag-drop validation exists; no bloom/expansion to reveal slot detail (`@filepath:src/ui/idleVillage/IdleVillageMapPage.tsx#280-553`). | Theatrical container + roster filters missing. |

---

## 4. Data Layer & State Requirements

1. **ResidentState extensions**
   - `survivalCount: number` – increments when the resident completes a risk-bearing quest/job without dying.
   - `isHero: boolean` – set via `promoteResidentToHero(residentId)` helper when thresholds met.
   - `isInjured: boolean` – mirror injury system; gating filters/UI.
2. **ActivityState extensions**
   - `isAuto: boolean` – derives from activity definition metadata or player toggle.
   - `snapshotDeathRisk: number` – capture the death probability at assignment time for Trial of Fire multiplier.
3. **Trial of Fire logic**
   - Pure helper `calculateSurvivalBonus(deathRisk: number): number` reading coefficients from config (default curve stored under `idleVillage/globalRules.trialOfFire`).
   - `resolveTrialOfFire(activity, residentIds)` uses `snapshotDeathRisk` to boost stat gains, logs heroism events when thresholds passed.
4. **Engine tick updates**
   - `tickIdleVillage` checks completed activities; when `isAuto` is true and fatigue < limit, enqueue a fresh `ScheduledActivity` with preserved slot/resident binding.
   - Ensure fatigue check + housing/slot availability use existing helpers (no magic thresholds).

---

## 5. UI Components (React)

1. **RosterSidebar**
   - Compact vertical panel anchored left of map, reusing Resident tokens with drag handles.
   - Filter tabs: `All`, `Available`, `Heroes`, `Injured` – filters operate on `ResidentState` flags.
   - Each resident renders as “Token-Faccia” medallion: portrait, fatigue ring, hero halo if `isHero`.
2. **TheaterView Container**
   - Expands inline above map slots (or as modal on mobile) when a slot is focused.
   - Sections:
     - **Header:** Cinematic panorama image (from config asset id) + map slot label.
     - **Body:** Horizontal scroll of VerbCards (medallion variant) showing queued/completed verbs for that slot, including hero/auto badges and “collection ready” halo when rewards pending.
   - Accepts `mapSlotId` to query relevant activities via selectors.
3. **VerbCard refactor**
   - Add `isAuto`, `hasReadyCollection`, `assignedHeroIds` props to show:
     - Infinity icon for auto state.
     - Golden border for hero-assigned residents.
     - Pulsing halo when `pendingRewards === true`.
   - Keep variants config-driven (tone, icon).

---

## 6. UX & Interaction Rules

1. **Bloom Logic**
   - Dragging a resident over a locked/hidden location triggers `expandSlotIntoTheater(slotId)`:
     - Smooth scale/blur animation (CSS variables).
     - On drop cancel, TheaterView collapses.
2. **Visual Heroism**
   - Helper `updateHeroism(resident, activityResult)` increments `survivalCount`.
   - Promotion rule: `isHero` becomes true if `survivalCount >= config.heroism.minSurvivals` OR `activityResult.trialOfFireTier >= config.heroism.epicTier`.
   - UI reflects hero state in Roster + VerbCards immediately.
3. **Auto-loop Validation**
   - Attempting to auto-reschedule when fatigue too high triggers UI toast and disables infinity toggle until rest.
4. **Collection Feedback**
   - Activities with `pendingRewards` set render a pulsing halo + actionable CTA in TheaterView.

---

## 7. Implementation Phases

### Phase 0 – Schema & Config Prep

1. Update `IdleVillageConfig` types + Zod schemas with:
   - `TrialOfFireConfig` (curve coefficients, epic tier thresholds).
   - `HeroismConfig` (minSurvivals, epicTierId).
   - Activity metadata flag `supportsAuto`.
2. Extend TypeScript types for `ResidentState`/`ActivityState`.
3. Document new config knobs in `idle_village_plan.md`.

### Phase 1 – Engine & Trial of Fire

1. Implement `calculateSurvivalBonus` + hero promotion helpers under `src/engine/game/idleVillage`.
2. Wire `snapshotDeathRisk` capture when scheduling verbs (jobs + quests).
3. Update `tickIdleVillage` to:
   - Determine completion risk tier.
   - Apply survival bonuses to stat gains/inventory.
   - Auto-schedule new activities when `isAuto`.
4. Add unit tests for the helper + tick auto-loop path.

### Phase 2 – RosterSidebar & Filtering

1. Build `RosterSidebar` component, hooking into `useVillageStateStore`.
2. Implement filter logic + drag tokens with hero/injury badges.
3. Add responsive behavior (collapsible on mobile).

### Phase 3 – TheaterView & VerbCard Enhancements

1. Create `TheaterView` container (panorama header + medallion VerbCards).
2. Extend `VerbCard` to accept hero/auto/collection props and render new visuals.
3. Add selectors `useSlotVerbMedallions(slotId)` to hydrate the view.

### Phase 4 – UX Interactions & Polish

1. Implement bloom animation hooks when dragging onto closed slots.
2. Wire hero promotion + survival count updates to UI toasts/log.
3. Add ready-to-collect halo and CTA actions (collect rewards, reassign).
4. Accessibility & testing: keyboard focus states, dnd-kit coverage.

### Phase 5 – Testing & Documentation

1. Vitest:
   - `calculateSurvivalBonus` curve coverage.
   - Auto-loop scheduling/resident fatigue gating.
   - Hero promotion helper.
2. Playwright:
   - Drag resident → bloom expansion.
   - Complete Trial of Fire quest → hero badge toggles.
3. Update docs:
   - `idle_village_plan.md` (new section 12.x).
   - `idle_village_tasks.md` checklist entries.
   - `MASTER_PLAN.md` Phase 12 progress.

---

## 8. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Auto-loop causing runaway scheduling | Enforce fatigue + crew limit checks before rescheduling; log warnings in dev mode. |
| Trial of Fire math divergence | Store coefficients in config and add regression tests using fixture scenarios. |
| Bloom animation hurting performance on low-end devices | Provide CSS prefers-reduced-motion fallback and limit blur radius. |
| Hero filter confusion | Mirror same hero badge in roster + VerbCards + tooltip describing promotion criteria. |

---

## 9. Deliverables & Exit Criteria

- ✅ Updated engine types + helpers (`ResidentState`, `ActivityState`, `calculateSurvivalBonus`, hero promotion).
- ✅ `tickIdleVillage` auto-loop + Trial of Fire multiplier applied to stat gains/rewards.
- ✅ `RosterSidebar` with functional filters and drag tokens.
- ✅ `TheaterView` container with medallion VerbCards showing auto, hero, and ready states.
- ✅ Bloom expansion + hero promotion UX wired, with toasts/log entries.
- ✅ Vitest + Playwright coverage, docs and master plan updated referencing this plan.

---

## 10. Linked Documents

- [idle_village_plan.md](idle_village_plan.md) – Phase 12 master design.
- [idle_village_tasks.md](idle_village_tasks.md) – Execution checklist (updated with Trial of Fire section).
- [MASTER_PLAN.md](../MASTER_PLAN.md) – Portfolio overview.
