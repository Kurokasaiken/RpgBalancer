# Minimal Gameplay Implementation Plan – Super Prioritario

**Obiettivo:** Creare una pagina testabile del gameplay loop minimo (1 residente, 3 slot, HUD) e renderla landing page temporanea per validare il loop prima di proseguire con Phase E.

## Primary Reference
- **Master Index**: `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` (single source of truth for all component contracts)
- **Governance Pack**: `idle-village-documentation-governance-pack.md` (procedures and policies)

---

## 0. Reset Task – Minimal Landing Rebase (NP-MIN-RESET)

- **Obiettivo:** "Sbiancare" l'attuale `MinimalGameplayPage` per ripartire dal wireframe usato nella strategia Turbo, eliminando elementi extra e rendendola la landing ufficiale del vertical slice.
- **File Target:** `src/ui/idleVillage/MinimalGameplayPage.tsx`, `src/ui/idleVillage/hooks/useMinimalGameplay.ts`, `src/App.tsx` (routing), `src/ui/idleVillage/config/dropFeedbackConfig.ts` (solo cleanup riferimenti inutilizzati).
- **Operazioni:**
  1. **Rimuovere UI/accessori non core** (telemetry sperimentali, componenti diagnostici, layout complessi) lasciando solo HUD minimale e pulsanti debug.
  2. **Impostare `MINIMAL_WIREFRAME=true` come default** finché i prompt NP-MIN-STRAT-001→006 non completano le fasi successive.
  3. **Confermare routing:** `/minimal-gameplay` diventa landing temporanea; root → redirect se `process.env.MINIMAL_MODE === 'true'`.
  4. **Persistere solo lo stato minimo:** usare `PersistenceService` con chiave `minimal-gameplay-state` e cancellare chiavi legacy.
  5. **Aggiornare documentazione/kanban:** registrare il completamento in `agent_assignments.md` e linkare evidence `test-results/np-min-reset-<data>.log`.
- **SAFE Block:** `npm run minimal:phase-guard` → `npm run lint -- src/ui/idleVillage` → `npm run test -- tests/unit/idleVillage/MinimalGameplayPage.test.tsx` (smoke) → `npm run build:check` → `npm run kanban:lint`.
- **Output Atteso:** pagina ridotta al wireframe (solo `<div>/<button>`), nessuna animazione o componenti avanzati attivi, route funzionante.

---

> **Strategia di riferimento:** tutte le fasi operative rimandano al documento `docs/strategies/MINIMAL_GAMEPLAY_STRATEGY.md`, che agisce come source of truth per ordine di esecuzione, SAFE suite e vincoli (Logic First → UI Second → E2E Last).

## 1. Deliverable Target

- **Pagina:** `src/ui/idleVillage/MinimalGameplayPage.tsx`
- **Route:** `/minimal-gameplay` (landing temporanea)
- **Config:** `src/balancing/config/idleVillage/minimalConfig.ts`
- **Stato:** Persistenza tramite `PersistenceService`

### Config-first policy (obbligatoria per NP-MIN)
- **Valori di dominio:** provengono esclusivamente da `IdleVillageConfig` e trasformazioni (`transformIdleVillageToMinimalConfig`, `useIdleVillageConfig`). È vietato introdurre `DEFAULT_*` locali salvo fallback di boot documentati.
- **Componenti/UI:** riusare componenti Idle Village (`WorkerCard`, `VillageRosterSection`, ecc.) e Style Lab (`useMinimalStyleLabTokens`). Nuove superfici devono vivere sotto `src/ui/idleVillage/components/**` e leggere i token ufficiali.
- **Hook/validator:** utilizzare `useMinimalActivitySlotsWithState`, `useResidentDropValidation`, `useDropFeedback`, `PersistenceService`, `trackTelemetryEvent` anziché copie locali. Questi hook devono rispettare i contratti definiti nei trusted docs corrispondenti (vedi [POI Standard Contract](../idle_village/trusted/poi_standard_trusted.md) per drag/drop patterns generali).
- **Task gating:** ogni prompt NP-MIN deve dichiarare quale file config riusa e quali componenti/hook monta. L’assenza di questa nota blocca l’approvazione.

---

## 2. Scope Minimo (Super Prioritario)

### 2.1 Entità
- **1 Residente:** nome + HP + fatigue (drag-and-drop enabled)
- **3 Slot:** Job (Gold Mine), Quest (Forest Hunt), Shop (Market)
- **Risorse:** gold, food
- **Loop:** auto-advance ogni 1 secondo

### 2.2 Funzionalità
- Drag resident → slot (validazione 1:1)
- Job: +5 gold ogni 5 secondi
- Quest: +3 gold +1 xp ogni 8 secondi, +5% fatigue
- Shop: scambia gold ↔ food (1:1)
- HUD: Gold | Food | Fatigue%
- Log eventi: ultime 3 righe

---

## 3. Implementazione (Turbo Workflow)

### Phase 1 – Logic Core (NP-MIN-STRAT-001)
- **Scope:** `src/balancing/config/idleVillage/minimalConfig.ts` + `src/engines/minimalGameRules.ts` (o modulo equivalente) con logica puramente funzionale.
- **Operazioni:** definire attività, reward, costi, `globalRules`, `startingResources`; implementare funzioni pure (`calculateTick`, `applyReward`, `consumeFood`) senza dipendenze React.
- **Testing:** `npm run minimal:logic` (Vitest) deve raggiungere 100% di coverage per le regole; ogni modifica futura alla matematica passa da qui.

### Phase 2 – State & Wireframe (NP-MIN-STRAT-002)
- **Scope:** `src/store/useMinimalGameplay.ts` (slice Zustand dedicato) + `src/ui/idleVillage/MinimalGameplayPage.tsx` ridotta a `<div>/<button>`.
- **Operazioni:** collegare lo store alla logica di Phase 1, creare un pulsante "Tick" che chiama le azioni del loop, abilitare `PersistenceService` solo per il minimo necessario (chiave `minimal-gameplay-state`).
- **SAFE:** `npm run minimal:e2e` (Playwright smoke che clicca i 4 controlli reali) + `npm run build:check` + `npm run kanban:lint`.

### Phase 3 – UI Integration (NP-MIN-STRAT-003)
- **Scope:** sostituire il wireframe con componenti reali (`WorkerCard`, `ActivitySlot`, `LocationDeck`).
- **Operazioni:** integrare `@dnd-kit/core` con sensori mouse/touch (delay), usare `useDropFeedback` e `useResidentDropValidation` in modalità O(1), rispettare i guardrail React.memo. **Importante**: l'implementazione drag/drop deve seguire i pattern definiti nel [POI Standard Contract](../idle_village/trusted/poi_standard_trusted.md) per le convenzioni generali.
- **SAFE:** `npm run minimal:dnd-check` + (se `MINIMAL_WIREFRAME=false`) `npm run minimal:ui-regression`.

### Phase 4 – Visual Feedback (NP-MIN-STRAT-004)
- **Scope:** animazioni, bloom/shake, copy e telemetry drag/drop.
- **Operazioni:** mappare stati `valid/invalid/warning/blocked` dal `dropFeedbackConfig`, collegare audio/haptic, garantire telemetria `minimal_drag_feedback` e log dati (config-first). I feedback visivi devono rispettare le convenzioni definite nel [POI Standard Contract](../idle_village/trusted/poi_standard_trusted.md).
- **SAFE:** identica alla fase 3 con focus su styling/telemetry.

### Phase 5 – Final Polish (NP-MIN-STRAT-005)
- **Scope:** HUD completo, log eventi definitivi, modal Game Over, playtesting manuale.
- **Operazioni:** applicare design tokens Style Lab, integrare `GameplayHeader/Footer`, `EventLogPanel`, `GameOverModal`, raccogliere sessioni Playwright manuali via `npm run minimal:playtest-log`, ritoccare `minimalConfig` solo tramite file di config.
- **Nota:** nessun test e2e ancora; tuning e telemetria HUD sono gli unici cambi ammessi.

### Phase 6 – E2E Safeguard (NP-MIN-STRAT-006)
- **Prerequisito:** `.phase-freeze.json` deve indicare UI congelata da ≥48h (`MINIMAL_UI_FROZEN=true`).
- **Scope:** `tests/e2e/idleVillage/minimalGameplay.spec.ts` con scenario happy path + screenshot baseline.
- **Operazioni:** Playwright esegue Drag → Wait → Reward, verifica HUD/log, salva artefatti visivi; documentare log in `test-results/np-min-strat-006-<data>.log`.

### Routing & Feature Flags
- `/minimal-gameplay` resta la landing temporanea (redirect automatico se `process.env.MINIMAL_MODE === 'true'`).
- `MINIMAL_WIREFRAME` e `MINIMAL_UI_FROZEN` governano rispettivamente la view semplificata e l'attivazione degli E2E; devono essere documentati nei README/ENV.

---

## 4. Dipendenze Riutilizzabili

- ✅ `useActivityScheduler` (esistente) - vedi [Time Engine Contract](../idle_village/trusted/time_engine_trusted.md)
- ✅ `useDropFeedback` (esistente) - vedi [POI Standard Contract](../idle_village/trusted/poi_standard_trusted.md)
- ✅ `tickIdleVillage` (esistente) - vedi [Time Engine Contract](../idle_village/trusted/time_engine_trusted.md)
- ✅ `WorkerCard` / `ActivitySlot` (esistenti) - vedi [POI Standard Contract](../idle_village/trusted/poi_standard_trusted.md)
- ✅ `PersistenceService` (esistente)
- ✅ Tipi `IdleVillageConfig`, `VillageState`, `VillageResources` (esistenti)

> **Nota**: Tutti i componenti elencati sopra devono seguire i contratti definiti nei trusted docs linkati. Fare riferimento al [Master Index](../idle_village/COMPONENT_MASTER_INDEX.md) per lo stato corrente dei contratti.

---

## 5. Test e Validazione

### Unit Test
- Test drag-and-drop validazione 1:1
- Test avanzamento tempo e reward
- Test persistenza (save/load)

### Playtest Manuale
- Loop completo: assign → wait → collect → repeat
- Verifica HUD aggiornato in tempo reale
- Verifica log eventi

---

## 6. Testing & Telemetry

### Unit Tests
**File:** `tests/unit/idleVillage/MinimalGameplayPage.test.tsx`
- ✅ Default visual state rendering (initial)
- ✅ Query param hydration (`mgState`)
- ✅ UI state transitions via controls
- ✅ Debug API programmatic control
- ✅ URL synchronization on state changes

**Coverage:** 100% visual state behavior, URL sync, debug API

### Integration Tests
**File:** `tests/integration/idleVillage/minimalGameplayFlow.test.tsx`
- ✅ Complete gameplay loop: assign → quest → market → game over
- ✅ State transitions and UI updates
- ✅ Resource management and constraints
- ✅ Persistence save/load functionality
- ✅ Error handling and reset functionality

**Coverage:** Full user journey, state management, error scenarios

### E2E Tests
**File:** `tests/e2e/idleVillage/minimalGameplay.spec.ts`
- ✅ Page load and initial state
- ✅ All visual state transitions via controls
- ✅ URL parameter hydration and sync
- ✅ Cross-browser compatibility (Chrome, Firefox, WebKit)
- ✅ Mobile responsiveness
- ✅ Debug API integration
- ✅ Visual screenshots for each state

**Coverage:** Browser automation, visual regression, responsive design

### Visual Tests
**File:** `tests/visual/idleVillage/minimal-gameplay.spec.ts`
- ✅ Visual regression for all states (desktop/tablet/mobile)
- ✅ State transition sequences
- ✅ Component-level screenshots
- ✅ Error state handling
- ✅ Performance visual validation

**Baseline Runner:** `scripts/visual/minimalGameplayBaselineRunner.ts`
- ✅ CLI tool for generating visual baselines
- ✅ Multi-viewport screenshot generation
- ✅ Report generation (JSON + Markdown)
- ✅ Docker integration (`npm run visual:minimal-gameplay`)

### Docker Scripts
**Added to package.json:**
```json
{
  "visual:minimal-gameplay": "tsx scripts/visual/minimalGameplayBaselineRunner.ts",
  "visual:build-docker": "docker build -t visual-tests -f Dockerfile.visual-tests .",
  "test:visual:docker": "docker run --rm -v ${PWD}:/app visual-tests"
}
```

### Test Execution
```bash
# Unit tests
npm run test:unit -- tests/unit/idleVillage/MinimalGameplayPage.test.tsx

# Integration tests
npm run test:unit -- tests/integration/idleVillage/minimalGameplayFlow.test.tsx

# E2E tests
npm run test:e2e -- tests/e2e/idleVillage/minimalGameplay.spec.ts

# Visual tests
npm run test:visual -- tests/visual/idleVillage/minimal-gameplay.spec.ts

# Docker visual baselines
npm run visual:minimal-gameplay
npm run visual:build-docker && npm run test:visual:docker
```

### Telemetry Integration
**Events Emitted:**
- `minimal_gameplay_loaded` - Page initialization
- `minimal_gameplay_state_changed` - Visual state transitions
- `minimal_gameplay_debug_used` - Debug API calls
- `minimal_gameplay_error` - Error states

**Payload Structure:**
```typescript
{
  eventType: 'minimal_gameplay_state_changed',
  data: {
    from: 'initial',
    to: 'jobActive',
    source: 'ui_control' | 'debug_api' | 'url_param',
    timestamp: Date.now(),
  }
}
```

### Safeguard Suite
**Commands:**
```bash
npm run lint -- src/App.tsx tests
npm run test:unit -- tests/unit/idleVillage/MinimalGameplayPage.test.tsx
npm run test:unit -- tests/integration/idleVillage/minimalGameplayFlow.test.tsx
npm run test:e2e -- tests/e2e/idleVillage/minimalGameplay.spec.ts
npm run test:visual
npm run build:check
npm run kanban:lint
```

**Evidence:** `test-results/np-min-010e-routing-tests-<date>.log`

---

## 6. Workflow con Trusted Docs

### Utilizzo dei Contratti Trusted
Per ogni fase di implementazione, i contratti trusted sono la **single source of truth**:

1. **Prima di implementare**: Consultare il [Master Index](../idle_village/COMPONENT_MASTER_INDEX.md) per identificare i trusted docs rilevanti
2. **Durante l'implementazione**: Seguire strettamente i contratti definiti nei trusted docs
3. **Test e validazione**: Verificare che l'implementazione rispetti i contratti trusted
4. **Documentazione**: Aggiornare evidence log con riferimento ai trusted docs utilizzati

### Contratti Rilevanti per Minimal Gameplay
- **[Time Engine Contract](../idle_village/trusted/time_engine_trusted.md)**: Gestione del tick temporale e day/night cycle
- **[POI Standard Contract](../idle_village/trusted/poi_standard_trusted.md)**: Componenti POI base e drag/drop
- **[POI Detail Contract](../idle_village/trusted/poi_detail_trusted.md)**: Componenti detail e activity capsule
- **[Day/Night Contract](../idle_village/trusted/daynight_trusted.md)**: Sistema day/night e visual indicator

### Governance e Procedure
- **Policy ufficiale**: `idle-village-documentation-governance-pack.md` - Sezioni 1 e 4
- **Procedura di freeze**: Seguire la procedura operativa dal governance pack
- **Evidence requirements**: Tutte le modifiche devono avere evidence log con riferimento ai trusted docs
- **Change policy**: Se un componente è `trusted` o `frozen`, le modifiche richiedono update del trusted doc

### Anti-Patterns da Evitare
- Non bypassare i contratti trusted con implementazioni locali
- Non duplicare logica definita nei trusted docs
- Non introdurre componenti che violano i contratti POI family
- Non modificare comportamenti definiti nei trusted docs senza aggiornare i docs

---

## 7. Tempistiche Stimate

- **Step 1 (Config):** 30 min
- **Step 2 (Pagina):** 2 ore
- **Step 3 (HUD/Log):** 1 ora
- **Step 4 (Persistenza):** 30 min
- **Step 5 (Routing):** 15 min
- **Testing & Telemetry:** 3 ore
- **Test:** 1 ora

**Totale:** ~7.5 ore

- **Step 1 (Config):** 30 min
- **Step 2 (Pagina):** 2 ore
- **Step 3 (HUD/Log):** 1 ora
- **Step 4 (Persistenza):** 30 min
- **Step 5 (Routing):** 15 min
- **Test:** 1 ora

**Totale:** ~4.5 ore

---

## 7. Success Criteria

1. ✅ Pagina caricabile su `/minimal-gameplay`
2. ✅ Residente draggabile su slot
3. ✅ Loop avanza ogni secondo
4. ✅ HUD mostra risorse in tempo reale
5. ✅ Log eventi mostra ultime 3 azioni
6. ✅ Stato salvato e ricaricabile
7. ✅ Nessun errore in console

---

## 8. Next Steps (Post-MVP)

- Aggiungere più residenti
- Introdurre fatica e injury
- Espandere slot e quest complesse
- Integrare con Phase E drag validation

---

## 9. Note Tecniche

- **Stile:** Gilded Observatory (sfondo scuro, bordi ambra)
- **Mobile-first:** layout compatto, tap-friendly
- **Performance:** nessun rendering pesante, solo state update
- **Telemetry:** eventi `minimal_gameplay_*` (opzionale)

---

## 10. Checklist Pre-Commit

- [ ] Config minima creata e tipata
- [ ] Pagina renderizza senza errori
- [ ] Drag-and-drop funziona
- [ ] Loop avanza e reward applicate
- [ ] HUD aggiornato
- [ ] Log eventi visibile
- [ ] Persistenza salva/ricarica
- [ ] Route attiva e testabile
- [ ] Test unitari passanti
- [ ] Playtest manuale OK

---

**Priorità:** Massima. Bloccare altre attività fino a completare questa MVP per validare il loop.
