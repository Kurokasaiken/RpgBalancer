# Spell Trigger & Conditional System – Implementation Plan

## 1. Obiettivi
- Permettere la definizione di **trigger** e **conditional** per le spell interamente da config JSON, senza logiche hardcoded.
- Allineare il sistema alle "fasi di combattimento" (`prep`, `initiative`, `action`, `resolution`) già presenti nel motore @src/balancing/simulation/types.ts#74-113, così ogni trigger può agganciarsi a un evento del timeline.
- Rendere facile aggiungere nuovi trigger/conditional futuri (catalogo configurabile, nessuna modifica al core per casi comuni).
- Mantenere il paradigma deterministico del Spell Creator: ogni trigger/conditional deve contribuire in modo misurabile a SpellPower → TTK/TTD.

## 2. Contesto & Ricerca
- **Combat Engine** (`resolveCombatRound`) già emette eventi per ogni fase e gestisce status/damage in modo modulare @src/engine/combat/logic.ts#50-510.
- **CombatSimulator** aggrega log per fase (`buildPhaseEvents`, `mapLogToPhase`) @src/balancing/simulation/CombatSimulator.ts#352-394.
- **Quest Engine** fornisce un esempio di branch/condition configurabili tramite `BranchCondition` @src/engine/quest/types.ts#52-105 e determinazione outcome @src/engine/quest/QuestEngine.ts#293-409.
- Attualmente il Spell Creator non ha un catalogo dei trigger/conditional; l’unico status implementato è `stun`.

## 3. Architettura proposta
### 3.1 Config modulari
Creare nuovi file JSON in `src/spells/config/catalogs/` (uno per area per evitare JSON monolitici):
1. `effectTypes.json` – già previsto per gli Effect primari.
2. `triggerCatalog.json` – definisce tutti i trigger disponibili.
3. `conditionCatalog.json` – definisce le condizioni (es. "targetType == humanoid").
4. `statusCatalog.json` – per gli status applicabili (oggi include solo `stun`, ma pronto per altri).

Ogni file include `id`, `label`, `description`, `phaseHook`, `defaultParameters`, `ttkImpact`, `ttdImpact`, `weight`.

### 3.2 Tipi & Schema
- Aggiornare `src/spells/config/types.ts` e `schemas.ts` con:
  - `TriggerDefinition` (riferimento a catalogo + override parametri + fase).
  - `ConditionDefinition` (lista di condizioni OR/AND).
  - `SpellSpecial` aggiornato per supportare `trigger` e `conditional` come oggetti config-first.
  - Type guard per distinguere `trigger` (evento) vs `conditional` (modifica costante).
- Caricamento cataloghi tramite `SpellConfigStore` (nuova sezione `catalogs` oppure moduli standalone importati dai builder UI).

### 3.3 Runtime hook (Combat)
- Creare `SpellTriggerRuntime` in `src/engine/combat/SpellTriggerRuntime.ts` che:
  - Riceve `CombatPhaseEvent` (già disponibili) e valuta i trigger attivi per quella fase.
  - Sottoscrive i log generati dal CombatSimulator (utilizzando `state.log`/`timelineFrames`).
  - Invoca gli effetti del trigger (es. applicare danno addizionale, buff, summon) tramite `StatusEffectManager` o moduli di calcolo.
- Per i conditional statici (es. "+20% vs umano"), creare `ConditionEvaluator` riusando pattern di `BranchCondition` (quest engine) ma senza RNG.
  - Input: `CombatContext` (target, caster, tags). Output: `probability` o `bool` deterministico.

### 3.4 SpellCost & Balancer
- Estendere `SpellCostModule` per leggere `triggerCatalog` e `conditionCatalog` e calcolare:
  - `expectedTriggersPerFight` configurabile (per tipo di combat scenario) → peso.
  - `conditionalFactor` (es. `vsHumanoidProbability`, definita manualmente nel catalogo o per scenario).
- Permettere a `spellBalancingConfig.json` di definire pesi aggiuntivi per `triggerId` e `conditionId`.

### 3.5 UI/UX
- Nuovi moduli nell’editor:
  1. **Trigger Builder**: multi-select dal catalogo, suggerisce fase e parametri (es. `onCrit`, `onLowHP`).
     - Visualizza timeline di combattimento e slot per fase in cui l’effetto verrà valutato.
  2. **Conditional Builder**: definire target tags (umani, demoni, ecc.), operatori (`>`, `<`, `==`), valori. Memorizza in `conditionCatalog` per riuso.
- Ogni builder scrive direttamente nei JSON (tramite moduli config) o esporta patch per `SpellDefinition`.
- UI modulare (componenti <200 righe) con preview dei pesi.

## 4. Implementation Steps
### Step 1 – Cataloghi & Schemi (1.5 gg)
1. Creare directory `src/spells/config/catalogs/` con i JSON.
2. Definire interfacce `TriggerCatalogEntry`, `ConditionCatalogEntry`, `StatusCatalogEntry`.
3. Aggiornare `SpellConfigStore` per caricare i cataloghi (solo read). Nessuna persistenza user-specific.
4. Migrazione: esistenti spell ottengono `special.trigger = null`, `special.conditional = null`.

### Step 2 – Runtime Evaluation (Combat) (2 gg)
1. Implementare `SpellTriggerRuntime` che registra i trigger attivi per team/spell.
2. Agganciare runtime dentro `resolveCombatRound`:
   - Prima del turno: processare trigger `prep`.
   - Durante azione: per `onHit`, `onCrit`, `onKill`.
   - Risoluzione: `onDeath`, `onMiss` già coperto da `dangerous` ma aprire hook.
3. Creare `ConditionEvaluator` modulare (riusare pattern di `BranchCondition` @src/engine/quest/QuestEngine.ts#293-409 per la sintassi). Supportare operatori base e target tags.
4. Aggiornare `SpellCostModule` per chiamare `TriggerProbabilityService` (deriva da scenario config) così i pesi restano deterministici.

### Step 3 – Spell Creator UI (2.5 gg)
1. Componenti:
   - `TriggerSelector.tsx`: griglia di card (catalogo) + param editing.
   - `ConditionalSelector.tsx`: builder per condizioni (targetType, HP threshold, buff states, ecc.).
   - `TimelinePreview.tsx`: mostra le fasi di combattimento a cui la spell è agganciata.
2. Collegare UI a `useSpellConfig` (nuovi campi) e persist.
3. Validare input via schema Zod (non permettere trigger senza fase). Tooltip con descrizioni dal catalogo.

### Step 4 – SpellCost & Balancer integration (1.5 gg)
1. Aggiornare `spellBalancingConfig.json` con sezioni `triggerWeights`, `conditionWeights`.
2. Estendere `calculateSpellBudget` per includere contributi dei trigger/conditional.
3. Aggiornare preview/TKK/TDD per mostrare impatti (es. "+0.6 turni vs humanoid").

### Step 5 – Test & Docs (1 gg)
- Unit test per `SpellTriggerRuntime`, `ConditionEvaluator`, `SpellCostModule` (nuovi pesi).
- RTL test per UI builder (selezione trigger + salvataggio + preview timeline).
- Documentazione:
  - Aggiornare `docs/plans/spell_creation_system_plan.md` con sezione "Trigger & Conditional" (link a questo piano).
  - Appendice in `docs/BALANCING_SYSTEM.md` su come convertire trigger probability → TTK.

## 5. Trigger/Conditional Definition Examples
```json
// triggerCatalog.json
[
  {
    "id": "on_crit",
    "label": "On Critical Hit",
    "phaseHook": "action",
    "defaultParameters": { "extraEffectScaling": 0.5 },
    "expectedTriggersPerFight": 2.5,
    "ttkImpact": -0.3,
    "ttdImpact": 0
  },
  {
    "id": "on_low_hp",
    "phaseHook": "prep",
    "defaultParameters": { "threshold": 0.3 },
    "expectedTriggersPerFight": 1.0,
    "ttkImpact": -0.1,
    "ttdImpact": -0.2
  }
]
```
```json
// conditionCatalog.json
[
  {
    "id": "target_humanoid",
    "description": "+20% damage vs Humanoids",
    "match": { "attribute": "targetType", "operator": "eq", "value": "humanoid" },
    "probability": 0.6
  },
  {
    "id": "target_hp_below_50",
    "description": "Extra effect below 50% HP",
    "match": { "attribute": "targetHpPercent", "operator": "lt", "value": 50 },
    "probability": 0.4
  }
]
```

## 6. Testing Strategy
- **Deterministic seeds** per trigger runtime (riusare LCG pattern già usato dal quest engine) per ripetibilità.
- Golden master di spell con trigger/conditional per confrontare TTK/TTD contro valori noto.
- `SpellTriggerRuntime.test.ts` con mock di `CombatPhaseEvent` per ogni fase.
- `ConditionEvaluator.test.ts` che verifica operatori/logica.

## 7. Domande aperte
1. Catalogo event hooks: elenco definitivo degli eventi del combat engine (es. `onShieldBreak`, `onSummonDeath`) per prevedere i param future?
2. Conditional composite: serve supporto per AND/OR nidificati o basta una lista semplice? (proposta: supporti per array `anyOf`/`allOf`).
3. Editor workflow: preferito editing diretto dei JSON da UI o tramite CLI/preset? (attuale plan: UI per designer + import/export JSON).

## 8. Output & Assegnazione
- Salvare questo piano e linkarlo dal Kanban quando si crea il prompt dedicato (`SC-Phase??-trigger-conditional`).
- Prompt includerà breakdown step sopra e riferimenti ai file.
