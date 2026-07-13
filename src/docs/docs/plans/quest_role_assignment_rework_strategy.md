# Strategia: Quest Assignment "a ruoli" — `/poi-quest-detail-roster-integration`

> Documento di analisi e piano per il rework della pagina `PoiDetailQuestRosterIntegrationPage` e dei componenti collegati.  
> Stato redazione: 2026-07-12  
> Ambito: Idle Village — Quest Detail + Roster Integration

---

## 1. Executive summary

Il piano descritto nel prompt dello strategist è **largamente già implementato** nel runtime. La pagina `/poi-quest-detail-roster-integration` contiene già:

- `QuestCard` canonico al posto del medaglione custom.
- Slot a ruolo (`role`, `required`, `requirement`) derivati da `metadata.slotBlueprints` in `defaultConfig.ts`.
- `questPowerRules` in `globalRules` di `defaultConfig.ts`.
- `QuestItemMock` statici (`MOCK_QUEST_ITEMS`) con effetti su death/injury/reward.
- Hook `useQuestAssignmentPreview` per preview live deterministica.
- Componente `QuestAssignmentPreview` per UI delle percentuali.
- Bottone **Embark** con `resolveQuestPower` e modal esito.
- Estensione di `ActivityCapsuleDetailSkinAware` con `startDisabled`.

Quello che manca non è tanto il codice, ma la **documentazione strategica e i trust contracts**: la nuova integrazione non è ancora rappresentata nel `COMPONENT_MASTER_INDEX`, i trusted docs `poi_detail_trusted.md` e `interaction_core_spec.md` non menzionano `role`/`emptyPenalty`/`residentRiskModifiers`, e la UI/UX ha ancora difetti di precisione che vanno consolidati prima del freeze.

---

## 2. Stato attuale vs. piano

| Area del piano | Stato runtime | File |
| --- | --- | --- |
| Estendere `ResidentSlotBlueprint` con `role`, `emptyPenalty`, `residentRiskModifiers` | ✅ Fatto | `src/ui/idleVillage/slots/types.ts` |
| Aggiungere `metadata.slotBlueprints` a `quest_city_rats` e `quest_dangerous_hunt` | ✅ Fatto | `src/balancing/config/idleVillage/defaultConfig.ts` |
| Aggiungere `questPowerRules` a `globalRules` | ✅ Fatto | `src/balancing/config/idleVillage/defaultConfig.ts` |
| Oggetti mock `questItemsMock.ts` | ✅ Fatto | `src/balancing/config/idleVillage/quests/questItemsMock.ts` |
| Hook `useQuestAssignmentPreview` | ✅ Fatto | `src/ui/idleVillage/hooks/useQuestAssignmentPreview.ts` |
| Componente `QuestAssignmentPreview` | ✅ Fatto | `src/ui/idleVillage/components/QuestAssignmentPreview.tsx` |
| Pagina `PoiDetailQuestRosterIntegrationPage` con QuestCard, oggetti, preview, Embark | ✅ Fatto | `src/ui/idleVillage/pages/PoiDetailQuestRosterIntegrationPage.tsx` |
| `ActivityCapsuleDetailSkinAware` `startDisabled` | ✅ Fatto | `src/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware.tsx` |

**Conclusione**: il rework come descritto esiste già. L'attività strategica residua è **rafforzare, documentare e verificare** il lavoro fatto, non riscriverlo.

---

## 3. Gap rispetto alla documentazione

### 3.1 `COMPONENT_MASTER_INDEX.md`

- **Manca una riga** per la runtime integration `/poi-quest-detail-roster-integration` e per i nuovi artefatti (`useQuestAssignmentPreview`, `QuestAssignmentPreview`, `QuestCard` in contesto quest).
- I `slotBlueprints` estesi e `QuestPowerRules` non sono citati come nuovi contratti dati.

### 3.2 `poi_detail_trusted.md`

- Il Data/Props Contract non include `role`, `roleLabel`, `required` in `ActivityDetailSlotData`.
- Non menziona `startDisabled`/`startDisabledOverride` per CTA.
- Non menziona `questPowerRules` come input per la preview/risoluzione.

### 3.3 `interaction_core_spec.md`

- Non descrive i campi `role`, `emptyPenalty`, `residentRiskModifiers` come metadati config-driven.
- Non c'è riferimento al calcolo live deterministico (`useQuestAssignmentPreview`) come pattern da replicare.

### 3.4 `idle_village_plan.md`

- Il Phase 12 "Quest Detail Lens" descrive un overlay retro-styled (`QuestDetailLens`) che è concettualmente diverso dalla pagina `PoiDetailQuestRosterIntegrationPage`.  
- Il piano di prodotto non menziona esplicitamente il nuovo flusso "assignment a ruoli + oggetti + preview".

### 3.5 `QuestPowerEngine.ts`

- Il documento di design (§12.4) è nel file, ma non esiste un `QuestPowerEngine.md` o sezione dedicata nel piano.
- Non è documentato come `emptyPenalty` e `residentRiskModifiers` si integrano nel calcolo.

---

## 4. Rischi tecnici e difetti riscontrati

### 4.1 `ActivityCapsuleDetailSkinAware` — fallback CTA confuso

```tsx
disabled={startDisabled ?? slots.filter(s => s.state === 'idle').length === 0}
```

**Problema**: `state` in `ActivityDetailSlotData` può essere `'empty' | 'ghost' | 'idle' | 'active' | 'done' | 'locked'`.  
Il filtro su `'idle'` non ha un significato chiaro: slot vuoti in attesa sono `'empty'`, non `'idle'`. Questo rende il fallback ereditario della UI non deterministico. Se `startDisabled` non viene passato, il bottone potrebbe comportarsi in modo inatteso.

**Raccomandazione**: rimuovere la fallback heuristic e rendere `startDisabled` sempre richiesto oppure derivarlo esplicitamente da `slots` basandosi su `state === 'empty' && required`.

### 4.2 `QuestCard` — risk stripes non clammate

```tsx
width: `${injuryPercentage}%`
width: `${deathPercentage}%`
```

**Problema**: se `injuryPercentage + deathPercentage > 100`, la barra esce fuori dal contenitore. Non c'è `min(100, ...)` né normalizzazione.

**Raccomandazione**: clampare la somma a 100, oppure mostrare le due fette in proporzione relativa.

### 4.3 `useQuestAssignmentPreview` — modelling dei risk modifiers per slot

Il piano dice: *"i `residentRiskModifiers` sono applicati SOLO al residente in questo slot"*.  
Nel codice attuale:

```ts
const residentRiskDeltas = slots
  .filter((slot) => slot.assignedResidentId && slot.residentRiskModifiers)
  .reduce((acc, slot) => ({
    deathDelta: acc.deathDelta + (slot.residentRiskModifiers?.deathChanceDelta ?? 0),
    injuryDelta: acc.injuryDelta + (slot.residentRiskModifiers?.injuryChanceDelta ?? 0),
  }), ...)
```

I delta vengono **sommati a livello di party** e applicati al `projectedDeathChance`/`projectedInjuryChance` globale. Questo è un'approssimazione accettabile per preview, ma:

- non è fedele al motore `resolvePartyConsequences` che rolla per singolo residente;
- se uno slot con `deathChanceDelta: +10` è vuoto, non viene applicato (giusto), ma se è pieno il delta si riversa su tutta la party invece che solo su quel residente.

**Raccomandazione**: per la preview, calcolare la death/injury attesa per singolo residente e aggregarla, oppure almeno documentare esplicitamente che i `residentRiskModifiers` in preview sono un'approssimazione additiva globale.

### 4.4 `useQuestAssignmentPreview` — assenza di test

- Non esiste `useQuestAssignmentPreview.test.ts`.
- La logica di calcolo è abbastanza complessa (empty penalty, item delta, clamping) da meritare test unitari.

### 4.5 `QuestItemMock` — non limitato

- Gli oggetti mock sono toggle; non c'è un concetto di "consumo" o "uso singolo".
- Questo è coerente con lo scope mock, ma va documentato.

### 4.6 `QuestCard` vs `GenericPoiSkin` nel detail

- `ActivityCapsuleDetailSkinAware` usa `GenericPoiSkin` nel header, non `QuestCard`.  
- `QuestCard` viene usato come medaglione cliccabile nella pagina. La separazione è corretta, ma va documentata: `QuestCard` = POI sulla mappa, `GenericPoiSkin` = mirror nel detail.

---

## 5. Raccomandazioni strategiche

### 5.1 Non rifare il rework

Il codice è già in produzione. L'obiettivo è portarlo a **trusted/frozen** con documentazione e test.

### 5.2 Aggiornare i trusted contracts

1. `poi_detail_trusted.md`:
   - aggiungere `role`, `roleLabel`, `required` in `ActivityDetailSlotData`;
   - documentare `startDisabled`/`startDisabledOverride`;
   - menzionare `questPowerRules` e `useQuestAssignmentPreview` come input per la preview.

2. `interaction_core_spec.md`:
   - estendere la sezione "Config-driven slots" con `role`, `emptyPenalty`, `residentRiskModifiers`;
   - aggiungere un paragrafo sul "Deterministic preview" e sui vincoli di non usare `rollQuestOutcome` in preview.

3. `COMPONENT_MASTER_INDEX.md`:
   - aggiungere riga per la nuova integration page `/poi-quest-detail-roster-integration`;
   - aggiungere riga per `useQuestAssignmentPreview`/`QuestAssignmentPreview`.

4. `idle_village_plan.md`:
   - aggiungere una sezione "Phase 12.5 — Quest Assignment a ruoli" o integrare nel Phase 12.

### 5.3 Aggiungere test

- `tests/unit/idleVillage/useQuestAssignmentPreview.test.ts`:
  - required slot empty → `canEmbark = false`;
  - empty penalty aumenta death/injury e riduce party power;
  - mock item riduce/incrementa percentuali;
  - resident risk modifiers applicati correttamente;
  - clamping 0-100.

- `tests/unit/idleVillage/QuestAssignmentPreview.test.tsx`:
  - rendering percentuali;
  - blocchi con motivi;
  - aggiornamento al cambio props.

### 5.4 Correggere i difetti di precisione

1. `ActivityCapsuleDetailSkinAware`: rimpiazzare la fallback heuristic con `startDisabled` required o derivazione esplicita.
2. `QuestCard`: clampare la somma injury+death a 100%.
3. `useQuestAssignmentPreview`: documentare o migliorare il modelling dei `residentRiskModifiers` per-slot.

### 5.5 Distinguere demo e produzione

- La pagina `PoiDetailQuestRosterIntegrationPage` è in `/test-hub` ma è il runtime più maturo per quest.  
  Valutare se promuovere il pattern a componente/pagina di produzione (`QuestDetailPage` o `QuestAssignmentPage`) o se mantenerla come test hub.

---

## 6. Piano di implementazione step-by-step

### Fase A — Documentazione e contratti (1 giorno)

1. **A1** — Aggiornare `src/docs/docs/idle_village/trusted/poi_detail_trusted.md`
   - Estendere `ActivityDetailSlotData` con `role`, `roleLabel`, `required`.
   - Documentare `startDisabled` prop.
   - Aggiungere nota su `questPowerRules` e deterministic preview.
   - Verificare `npm run build:check`.

2. **A2** — Aggiornare `src/docs/docs/idle_village/interaction_core_spec.md`
   - Estendere "Config-driven slots" con `role`, `emptyPenalty`, `residentRiskModifiers`.
   - Aggiungere sezione "Preview calculation".

3. **A3** — Aggiornare `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md`
   - Aggiungere righe per `/poi-quest-detail-roster-integration` e `useQuestAssignmentPreview`.

4. **A4** — Aggiornare `src/docs/docs/plans/idle_village_plan.md`
   - Aggiungere sezione sul quest assignment a ruoli e oggetti mock.

### Fase B — Test unitari (1 giorno)

1. **B1** — Creare `tests/unit/idleVillage/useQuestAssignmentPreview.test.ts`
   - Testare tutti gli scenari di calcolo.
   - Verificare con `npm run test -- useQuestAssignmentPreview`.

2. **B2** — Creare `tests/unit/idleVillage/QuestAssignmentPreview.test.tsx`
   - Rendering e aggiornamento UI.

3. **B3** — Aggiungere/aggiornare test per `QuestCard` risk stripes
   - `src/ui/idleVillage/map/actionCards/wrappers/__tests__/QuestCard.test.tsx` (o crearlo).

### Fase C — Fix di precisione (1 giorno)

1. **C1** — `ActivityCapsuleDetailSkinAware.tsx`
   - Rimuovere la fallback heuristic `slots.filter(s => s.state === 'idle').length === 0`.
   - Fare in modo che `startDisabled` sia il criterio unico.
   - `npm run build:check`.

2. **C2** — `QuestCard.tsx`
   - Clampare `injuryPercentage` e `deathPercentage` in modo che la somma non superi 100.
   - `npm run build:check`.

3. **C3** — `useQuestAssignmentPreview.ts`
   - Documentare con JSDoc il comportamento dei `residentRiskModifiers`.
   - Opzionale: implementare calcolo per-residente più fedele.
   - `npm run build:check`.

### Fase D — Verifica runtime e freeze (1 giorno)

1. **D1** — Avviare dev server e testare `/poi-quest-detail-roster-integration`:
   - `QuestCard` reale con risk stripes.
   - Assegnazione/rimozione PG e variazione preview.
   - Slot required vuoto → Embark disabilitato.
   - Selezione oggetti mock → variazione preview.
   - Clic Embark → un solo roll, esito visualizzato.

2. **D2** — Eseguire safeguard:
   - `npm run lint -- src/ui/idleVillage`
   - `npm run test -- src/ui/idleVillage/hooks/useQuestAssignmentPreview`
   - `npm run build:check`
   - `npm run kanban:lint`

3. **D3** — Aggiornare Kanban con evidence.

---

## 7. Files coinvolti (riepilogo)

### Documentazione

- `src/docs/docs/idle_village/trusted/poi_detail_trusted.md`
- `src/docs/docs/idle_village/interaction_core_spec.md`
- `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md`
- `src/docs/docs/plans/idle_village_plan.md`

### Sorgente

- `src/ui/idleVillage/hooks/useQuestAssignmentPreview.ts`
- `src/ui/idleVillage/components/QuestAssignmentPreview.tsx`
- `src/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware.tsx`
- `src/ui/idleVillage/map/actionCards/wrappers/QuestCard.tsx`

### Test

- `tests/unit/idleVillage/useQuestAssignmentPreview.test.ts`
- `tests/unit/idleVillage/QuestAssignmentPreview.test.tsx`
- `src/ui/idleVillage/map/actionCards/wrappers/__tests__/QuestCard.test.tsx`

---

## 8. Conclusione

Il rework "Quest Assignment a ruoli" non è da rifare da zero: il runtime è già solido e config-first.  
I prossimi passi strategici sono:

1. **Chiudere il debito documentale** sui trusted contracts.
2. **Aggiungere test** per la preview e per la UI.
3. **Correggere i difetti di precisione** (CTA fallback, risk stripes, modelling per-resident).
4. **Verificare runtime** e marcare come trusted/frozen.

Questo consolida il sistema senza introdurre nuovi store, senza toccare il game loop reale e senza rompere il contratto di `useResidentSlotController`/`QuestPowerEngine`.
