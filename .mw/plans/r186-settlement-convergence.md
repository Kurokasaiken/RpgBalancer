---
title: Convergenza conseguenze residente — kernel puro condiviso tra questSettlement e VillageState/goblin-lab
status: candidate (artifact-r003, post-Round-2 multi-AI convergence)
created: 2026-10-14
desiderata: FROZEN R-176/R-179 (lab verso gameplay reale); R-139 (ferite guariscono solo a riposo); v12 (rischio per-slot); PLAN-019-S2.5 (settlement idempotente)
request: R-186 (RICHIESTE.md)
debate_run: 20261014-0930-r186-settlement-plan
---

# Plan R-186 (Revision r003 — Multi-AI Debate Final)

## 1. Obiezioni del dibattito e risoluzioni (WITNESS-01..05)

- **WITNESS-01 (Unanime 4/4: Claude, ChatGPT, Grok, Gemini — AMENDED)**:
  `applyPlanToVillageState(state, plan: SettlementPlan)` è una falsa simmetria (metà di `SettlementEffectKind` sono no-op su `VillageState`; il lab non usa `QuestRunState`). Sostituito con un **kernel per-residente puro** (`src/engine/game/idleVillage/residentConsequences.ts`), lasciando `SettlementPlan` e `deriveSettlementPlan` in `questSettlement.ts`.
- **WITNESS-02 (Claude, Grok, Gemini — AMENDED)**:
  `wound` porta `durationTicks?: number` opzionale (validato intero finito `>= 1` via `resolveWoundTicks(requested, defaults.woundTicks)`), e `SettlementEffect` guadagna `durationTicks?: number` opzionale retrocompatibile.
- **WITNESS-03 (Claude, ChatGPT, Grok, accettato da Gemini — AMENDED)**:
  `VillageState` non viene allargato con `appliedQuestEffectIds?: string[]`. Il modulo condiviso esporta `settlementEffectKey(runId, effectKey)` per single-sourcare `${runId}:${effectKey}`; il ledger resta nello store per `/game` e caller-owned dove serve.
- **WITNESS-04 (ChatGPT, Claude, Gemini — AMENDED)**:
  Precedenza di stato `Dead > Injured > Away/Available` e pulizia esplicita dei campi ferita su morte:
  - Su `MinimalResident`, `resident-dead` imposta `isDead: true, isInjured: false, isWorking: false, injuredUntilTick: undefined`. Nota (dalla review di Claude in T-012): l'azzeramento di `injuredUntilTick: undefined` su morte è un **delta comportamentale intenzionale e dichiarato** che allinea il codice al commento di contratto in `gameplayTypes.ts:20` (*"Overrides every other status; the wound fields are cleared"*); nessun reader in `tick()` legge `injuredUntilTick` quando `isDead` è true, e i vecchi save restano compatibili.
  - Su `ResidentState`, `death` imposta `status: 'dead', currentHp: 0, isInjured: false, injuryRecoveryTime: undefined`.
- **WITNESS-05 (ChatGPT T-015 & Claude T-012 — AMENDED)**:
  **Mid-activity wound hazard & R-139 (`«le ferite si rigenerano a riposo, non mentre sei assegnato»`)**:
  Se un residente in un'attività multi-giorno (`status === 'pending' | 'running'`, con `endTime > tickEnd`) viene ferito a metà attività (`status = 'injured', isInjured = true, injuryRecoveryTime = T`), lo sweep di recovery in `TimeEngine.ts:578` non deve mai renderlo `status: 'available'` mentre l'attività è ancora attiva (`endTime > tickEnd`), altrimenti il residente diventerebbe prematuramente schedulabile su una seconda attività prima di `endTime` e violerebbe R-139!
  **Regola canonica in `TimeEngine.ts` + `residentConsequences.ts`**:
  1. Finché un residente appartiene a un'attività `pending` o `running` che non termina entro `tickEnd` (`activity.endTime > tickEnd`), il residente **non è a riposo** (equivalente a `isOnExpedition || isWorking` nello store): lo sweep di recovery in `TimeEngine.ts` **non lo guarisce mentre è in attività attiva** (proprio come `tick()` in `minimalGameRules.ts` non guarisce quando `isWorking || isOnExpedition`).
  2. Quando l'attività termina (`activity.endTime <= tickEnd`), il completamento transita `away -> available/exhausted` solo per i membri `status === 'away'` (R-184); un membro `injured` o `dead` resta `injured` (ora finalmente a riposo al villaggio, quindi guarirà allo sweep quando `targetTime >= injuryRecoveryTime`) o `dead`.
  3. Finché è `injured` o `dead`, `canScheduleActivity` (`r.status === 'available'`) impedisce qualsiasi ri-schedulazione.

## 2. Contratto e Firme (`src/engine/game/idleVillage/residentConsequences.ts`)

Modulo engine-side puro (zero import da `src/ui/**` o `src/store/**`; importa solo `ResidentState`, `VillageState` da `./TimeEngine`):

```ts
export interface ResidentHealthSlice {
  dead: boolean;
  injured: boolean;
  /** Absolute target tick when the wound heals; null when not injured or dead. */
  injuredUntil: number | null;
  xp: number;
}

export type ResidentConsequence =
  | { kind: 'wound'; durationTicks?: number }
  | { kind: 'death' }
  | { kind: 'xp'; amount: number };

export interface ConsequenceDefaults {
  woundTicks: number;
}

/** Canonical idempotency key format: `${runId}:${effectKey}`. */
export function settlementEffectKey(runId: string, effectKey: string): string;

/** Validates requested duration (finite integer >= 1) or returns fallback (>= 1). */
export function resolveWoundTicks(requested: number | undefined, fallback: number): number;

/** Pure per-resident state machine shared by both aggregates. */
export function reduceResidentHealth(
  health: ResidentHealthSlice,
  consequence: ResidentConsequence,
  nowTick: number,
  defaults: ConsequenceDefaults,
): ResidentHealthSlice;

/** Adapter for TimeEngine ResidentState (preserves status/isInjured/currentHp invariants). */
export function applyConsequenceToResidentState(
  resident: ResidentState,
  consequence: ResidentConsequence,
  nowTick: number,
  defaults: ConsequenceDefaults,
): ResidentState;

/** Batch applicator for VillageState (deterministic array order, zero RNG, skips missing IDs). */
export function applyConsequencesToVillage(
  state: VillageState,
  entries: ReadonlyArray<{ residentId: string; consequence: ResidentConsequence }>,
  nowTick: number,
  defaults: ConsequenceDefaults,
): VillageState;

export function normalizeMinimalResident(r: {
  isDead?: boolean;
  isInjured: boolean;
  injuredUntilTick?: number;
  xp?: number;
}): ResidentHealthSlice;

export function normalizeResidentState(r: ResidentState): ResidentHealthSlice;
```

## 3. Task Breakdown

### T-0 — Characterization & Micro-Rule Tests su `questSettlement`
In `tests/unit/idleVillage/quests/questSettlement.test.ts`:
- Verificare che `tick()` non abbia reader di `injuredUntilTick` su residenti `isDead: true`.
- Aggiungere test espliciti per: (a) doppia ferita con timer preesistente più lungo e più corto (`max(existing, tick + duration)`), (b) ferita su residente già morto (no-op), (c) morte su residente già ferito (dichiara e verifica il delta intenzionale `isInjured: false, injuredUntilTick: undefined`), (d) XP delta guardato (`amount <= 0` o su morto).

### T-1 — Modulo `residentConsequences.ts` + Guardia R-139 in `TimeEngine.ts` + Parity Suite
- Creare `src/engine/game/idleVillage/residentConsequences.ts`.
- In `src/engine/game/idleVillage/TimeEngine.ts` (sweep recovery): non guarire un residente `injured` nel tick corrente se è membro di un'attività `pending`/`running` con `endTime > tickEnd` (parità con R-139 `isWorking || isOnExpedition`).
- Creare `tests/unit/idleVillage/residentConsequences.test.ts`:
  1. Parity test su sequenze `(wound, wound-shorter, wound-longer, xp, death, wound-after-death, xp-after-death)` partendo da `{healthy, injured-short, injured-long, dead}`: verifica `normalizeMinimalResident(min) deepEqual normalizeResidentState(vil)` **e** raw equivalence sui morti (`injuredUntilTick === undefined`, `injuryRecoveryTime === undefined`, `isInjured === false`, `currentHp === 0`).
  2. Test code-verified di **mid-activity wound & death su attività multi-giorno** (`duration = 5`, ferita di `1` giorno a tick `1`): verifica che a tick `2..4` (mentre l'attività è ancora running) il residente **non** diventi `available` e `canScheduleActivity` rifiuti nuove assegnazioni; a tick `5` l'attività completa senza sovrascrivere `injured`; allo sweep successivo a riposo il residente guarisce e torna `available`.

### T-2 — Refactor `questSettlement.ts` sul kernel condiviso
- `SettlementEffect` guadagna `durationTicks?: number` opzionale.
- `applyPlanToState` usa `reduceResidentHealth` e `settlementEffectKey`.
- Tutte le suite `questSettlement.test.ts`, `residentXpAndSwap.test.ts`, `residentXpPersistence.test.ts` verdi.

### T-3 — Adozione in `tools/goblin-lab/lab.ts`
- `applyHarm`, `applySiegeOutcome` e le morti civili da breccia delegano la mutazione di `ResidentState` a `applyConsequenceToResidentState` con `durationTicks: days` (tier S2 `1/3/7`), mantenendo il guard che le vittime civili da breccia sono scelte solo da `aliveVillagers`.
- **44/44 test** del lab + nuovo test `V9` (parità kernel e mid-activity wound non-schedulabile) + seed replay byte-identico.

### T-4 — Documentazione & Safeguards
- Aggiornare `tools/goblin-lab/FIDELITY.md` e `RICHIESTE.md`.
- Eseguire `npm run lint -- <scope>`, vitest scope, `npx tsx tools/goblin-lab/lab.ts --test`, `npm run build:check`, `npm run kanban:lint`.
- Evidence log `test-results/r186-settlement-convergence-2026-10-14.log`.
