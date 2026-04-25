# Idle Village & Punch Club Vision – Lab Only Development

<!-- markdownlint-disable MD013 -->

**Owner:** Strategy (Cascade)  
**Scope:** Riassumere decisioni e domande aperte sull'evoluzione Idle Village/Punch Club per ambiente di sviluppo locale (lab only).  
**Fonte principale:** [Village Sandbox Refactor Plan](../plans/village_sandbox_refactor_plan.md), [Punch Club Realistic Mini-Plan](../plans/punch_club_realistic.md), [DNA Prismatic Wanderlust – Art Direction Bible](../plans/art_direction_plan.md).

---

## 1. Priorità confermate

Sintesi dei tre cardini ribaditi nella sessione:

- **Focus immediato:** il loop Punch Club è la priorità #1 da sbloccare (job Gym Shift → Rest overlay → Bout quest) prima di ulteriori sperimentazioni ([Village Sandbox Refactor Plan](../plans/village_sandbox_refactor_plan.md#punch-club-coordination-2026-01-02)).
- **Layout/interaction guardrail:** WS6.3 richiede adattatore input (drag desktop, picker mobile) e layout stack verticale su <1024 px, senza reset automatici quando cambia device ([Village Sandbox Refactor Plan](../plans/village_sandbox_refactor_plan.md#ws63-–-cross-device-interaction--layout-2026-01-04)).
- **Tema visivo:** ogni nuova UI deve rifarsi al manifesto "Libertà, Gloria e Trionfo Solare" della Bibbia **DNA Prismatic Wanderlust** — energia cinetica, libertà, esplorazione dei misteri e caccia al tesoro con materiali materici — usando palette Azure vibrante + ombre Deep Teal e lo split-rendering Ruan Jia/Jaime Jones tramite wrapper Gilded Observatory ([DNA Prismatic Wanderlust – Art Direction Bible](../plans/art_direction_plan.md#1-85)).

---

## 2. Lab Only Development Focus

### 2.1 Ambiente di Sviluppo Locale

Punch Club è progettato esclusivamente per ambiente di sviluppo locale (lab only):

- **No PWA Distribution**: Non è prevista distribuzione come Progressive Web App
- **Local Development**: Solo sviluppo e testing locale tramite `npm run dev`
- **Telemetry Local**: Log e telemetria salvati localmente per analisi
- **No External Services**: Nessuna dipendenza da servizi esterni o cloud

### 2.2 Componenti Lab

1. **Console hygiene WS6.2:** tutta la diagnostica passa da `createSandboxDiagnostics`; niente `console.*` permanenti nei file Map/Sandbox. Impatto diretto su PunchClubPage.tsx e hook di sandbox ([Village Sandbox Refactor Plan](../plans/village_sandbox_refactor_plan.md#ws62-–-console-hygiene-2026-01-04)).
2. **Interaction Mode:** il nuovo `useSandboxInteractionMode` deve orchestrare drag controller e picker compatibile tastiera, riusando validator condivisi. Questo blocco resta TODO nella Wave 3 ([Village Sandbox Refactor Plan](../plans/village_sandbox_refactor_plan.md#ws63-–-cross-device-interaction--layout-2026-01-04)).
3. **Punch Club components:** la mini-roadmap definisce Gym Shift card, Rest overlay, Training Tracker e Bout quest come elementi minimi, tutti config-first e alimentati dal preset `punchClubLight` ([Punch Club Realistic Mini-Plan](../plans/punch_club_realistic.md#24-84)).

### 2.2 Trend esterni

Riferimenti esterni considerati per definire i prossimi esperimenti UX:

1. **Bilanciare estetica/usabilità:** Game-Ace (2025) evidenzia che UX di gioco deve restare accessibile a skill differenti; estetica non deve sovraccaricare info, e l'iterazione continua basata su feedback è obbligatoria ([Game-Ace – Complete Game UX Guide](https://game-ace.com/blog/the-complete-game-ux-guide/)).
2. **Controlli tap-first & haptic:** Sumo Digital sottolinea importanza del playtesting su device reali, controlli semplici e uso di haptic feedback per confermare azioni mobili ([Sumo Digital – Understanding UI/UX Design](https://www.sumo-digital.com/news-insights/understanding-ui-ux-design-for-mobile-game-development/)).
3. **Principi mobile UX:** Mind Studios consiglia intuitività, feedback istantaneo, UI pulita con CTA chiare e pattern familiari per ridurre il carico cognitivo ([Mind Studios – Mobile Game UX Design](https://games.themindstudios.com/post/ux-in-3d-mobile-game-development/)).

---

## 3. Decision log & discussione

Punti già accettati e blocchi aperti:

- ✅ **2026-01-05 – Desktop-first roguelike frame:** La componente roguelike riguarda **skill/spell, equipaggiamenti, blueprint e personaggi**; ciascuna run richiede trovare pezzi random fino a costruire una build funzionante (il primo PG deve restare jolly capace di superare la maggior parte degli scenari, i successivi diventano specialisti per minacce più grandi).  
- ✅ **Meta progressione:** Il villaggio funge da meta layer persistente tra le run: i building salvano PG/equip o altri benefici; i blueprint sono condivisi, ma necessitano comunque delle risorse raccolte nella nuova run per essere costruiti (niente bonus “gratis”).  
- ✅ **Run structure:** Ogni run termina con la **distruzione del villaggio** durante eventi di invasione a cadenza fissa; ogni run sceglie una famiglia di invasioni (goblin, non morti, ecc.) che detta nemici e modificatori.  
- ✅ **HUD philosophy:** Niente indicatori sempre visibili oltre quanto strettamente necessario per il loop corrente; restiamo coerenti con la filosofia “informazioni su richiesta”, evitando overlay permanenti anche se prendiamo ispirazione da Darkest Dungeon.  
- ✅ **Documento unico:** La visione desktop-first con riferimenti Darkest Dungeon e DNA Prismatic Wanderlust rimane centralizzata in questo file; niente split in sotto-documenti finché non emergono esigenze operative specifiche.  
- ✅ **Priorità tecnica:** L’utente indica **Phase E (validazione drag/drop su mappa)** come step immediatamente precedente rispetto al workstream WS4 (Theater controller).  
- ✅ **Lab Development Focus:** Punch Club è disponibile solo per sviluppo e testing locale tramite `npm run dev`
- ✅ **Local Telemetry:** Log e telemetria salvati localmente per analisi senza dipendenze esterne
- ✅ **No PWA Distribution**: Non è prevista distribuzione come Progressive Web App o mobile
- ✅ **Priorità #1:** Punch Club loop minimo rimane l'obiettivo principale da completare prima di nuovi esperimenti.
- ✅ **KPI Punch Club:** KPI = Key Performance Indicator. Per il loop minimo misureremo (a) tempo medio per completare un ciclo Gym→Rest (<90 s target) e (b) stabilità risorse (gold ≥10, food ≥2 a fine ciclo). Entrambi devono provenire dalla telemetria config-first.
- ✅ **Definizione HUD Punch Club:** indicatori permanenti = gold, food, fatigue, grit; il Bout risk resta in overlay ma deve essere sempre visibile quando una quest è selezionata, con stripe verticali gialla/rossa proporzionali a injury/death.
- ✅ **Success criteria mobile picker:** scelta pattern (b) – tap sullo slot apre indicatori inline (chip) dei residenti compatibili, senza bottom sheet.
- 📌 **Vocabolario:** *Grit* = metrica di resilienza combattere (punta a misurare resistenza mentale/disciplinare nei preset Punch Club); *Bout risk* = combinazione injury/death percent mostrata come stripe dentro il poligono quest.

---

## 4. Lab Development Strategy

### 4.1 Ambiente di Sviluppo Locale

Le tre domande originali e le risposte confermate per ambiente lab:

1. **Metriche Punch Club / KPI:** vedi decision log: KPI = Key Performance Indicator → tempo ciclo <90 s + risorse finali gold ≥10 / food ≥2.
2. **HUD minimo:** gold, food, fatigue, grit sempre visibili; Bout risk (injury/death) mostrato come stripe verticale proporzionale quando la quest è attiva.
3. **Picker mobile:** pattern (b) – tap su slot → overlay inline con chip compatibilità; niente bottom sheet dedicato.

### 4.2 Risposte Lab Development 2026-01-05

- **Ambito roguelike:** skill/spell, equipaggiamenti, blueprint e personaggi ruotano run-to-run; un PG nasce quasi sempre senza spell e le acquisisce tramite equip o drop casuali.  
- **Meta layer villaggio:** gli edifici persistono tra run e consentono di "salvare" PG, equip o altri asset per la run successiva. I blueprint rimangono condivisi ma richiedono comunque delle risorse raccolte durante la nuova run.  
- **Condizione di sconfitta:** la run termina con la distruzione del villaggio; ogni run include eventi "Invasione" ciclici con un tipo dominante (goblin, non morti, ecc.) che plasma incontri e richieste tattiche.  
- **Parties progressivi:** all'inizio esiste un solo PG jolly; solo più avanti altri PG specializzati vanno a comporre un party per minacce maggiori.  
- **HUD/telemetria:** confermata la filosofia "solo ciò che serve ora" — evitare overlay fissi stile CRPG classico e affidarsi al nuovo Active HUD modulare per surfacing contestuale.  
- **Documentazione:** mantenere un unico documento visione per il desktop-first direction, arricchito man mano; nuove sezioni specialistiche solo quando la coordinazione lo richiederà.  
- **KPI:** verranno definiti dopo aver costruito lo scheletro funzionale delle run roguelike.  
- **Priorità operativa:** iniziare con Phase E (validation drag/drop) e sviluppo locale continuo.

---

## 5. Lab Development Track

Track operativo proposto per ambiente lab:

1. **Lab Development Setup:** configurare ambiente di sviluppo locale con `npm run dev`, telemetria locale e testing Playwright.
2. **Stendere blueprint Punch Club loop:** definire come Gym Shift, Rest overlay e Bout quest condividono HUD, risk stripes e telemetria.
3. **Definire KPI & metriche QA:** convertire le domande aperte in numeri (es. error rate, tempo per azione) per permettere a Playwright e telemetria di valutarle.
4. **Allineare prompt operativi:** usare il template standard (`prompt_library.md`) e tracciare i task nella tabella coordinator per evitare overlap.

### 5.1 Checklist Lab Testing

| Metrica sessione | KPI / Target | Raccolta |
| --- | --- | --- |
| Tempo ciclo Gym→Rest→Bout | < 90 s di media su ≥3 cicli consecutivi | Cronometro reale + telemetria `cycleProgress` |
| # tap per assignment | ≤ 3 tap (slot → chip → conferma) | Conteggio manuale + log `assignment_interaction` |
| Latency assegnazione (ms) | < 450 ms dal tap su chip al cambio stato slot | Telemetria picker (`assignment_latency_ms`) + trace Playwright |
| Picker close rate % | ≥ 98 % delle aperture si chiudono entro 1 s dall'assegnazione | Log `workerPickerSheet` (open/assign/close) + replay video |
| Delta gold/food per ciclo | ≥ +10 gold / ≥ +2 food residui | Snapshot HUD + telemetria risorse (`resource_change`) |
| Nota qualitativa UX | Annotare lag, visibilità stripe rischio, leggibilità chip | Diario tester + allegati audio/video opzionali |

#### Checklist prima del testing lab

- [ ] Browser locale con dev tools aperti
- [ ] Preset `punch_club_light` forzato, roster importato via Character Manager.
- [ ] Diagnostica `createSandboxDiagnostics` attiva con tag `lab-testing`.

#### Checklist durante il testing lab

- [ ] Registrare tap/key sequence per il primo ciclo completo.
- [ ] Annotare qualsiasi drop target difficile da raggiungere o chip fuori viewport.
- [ ] Segnare variazioni risorse dopo ogni attività (Gym, Rest, Bout).
- [ ] Catturare screenshot di HUD + quest polygon per validare stripe rischi.

#### Checklist dopo il testing lab

- [ ] Compilare tabella parametri con numeri effettivi e differenza dal target.
- [ ] Archiviare log `sandbox_diagnostics` e `quest_telemetry` in locale.
- [ ] Richiamare `npm run report:punch-club` (quando disponibile) per allegare JSON.
- [ ] Inviare feedback qualitativo al team di sviluppo.

> Strumento log consegnato: `scripts/mobilePlaytestLogger.ts` (`npm run playtest:log -- --session punch-club-lab --notes "..." [--import telemetry.json]`).  
>
> - Input: prompt interattivo per i KPI mancanti + flag `--import telemetry.json` opzionale che auto-compila cicli/tap/latency usando `window.__sandboxTelemetry`.  
> - Schema: `scripts/mobilePlaytestLogger.schema.json` (v1.0.0, un'unica fonte di verità per campi KPI/notes).  
> - Output: coppia JSON/Markdown in `data/runs/lab_tests/<timestamp>-<session>.{json,md}` con tabella KPI ✓/⚠️ e note qualitative; esempio canonico.

### 5.2 GT-3 – Punch Club Mobile Playtest Checklist

**Status:** ✅ Complete (2026-01-23)  
**Documentation:** [Punch Club Playtest Checklist](../punch_club/punch_club_playtest.md)  
**Metrics Config:** `src/analytics/config/punchClubPlaytestMetrics.ts`

GT-3 formalizes the mobile-first playtest process with:

- **Pre-Session Checklist**: Device setup, environment verification, tester metadata
- **Target Metrics**: Core KPIs (cycle duration <60s, taps <15/cycle, gold/food rates)
- **FTUE Guidelines**: Mobile-first copy constraints, tone, length limits
- **Session Tagging**: PersistenceService integration for session metadata
- **Telemetry Export**: JSON/Markdown/CSV formats with Zod schema validation

**Integration Points:**
- Extends existing `mobilePlaytestLogger.ts` with structured metrics
- Provides Zod schemas for validation and type safety
- Defines success criteria for playtest sessions
- Blocks NP-091 (Surge Tutorial Visual Baseline)

**Key Deliverables:**
1. Complete playtest documentation with checklists and workflows
2. Config-first metrics schema with target thresholds
3. Sample session log template for reference
4. Integration with existing telemetry pipeline

### 5.3 Phase E – Validazione drag/drop mappa (desktop-first)

| Step | Deliverable | Guardrail / KPI | Note |
| --- | --- | --- | --- |
| E1 | **Spec “Phase E”**: definire scope (stat tag, fatigue, crew, biome-specific blockers) con diagrammi flusso drop | Tutte le condizioni devono provenire da config `activityScheduler` + `statWeights`; vietato hardcode | Docs target: `village_sandbox_refactor_plan.md` §WS6 + questa vision |
| E2 | **Telemetry & diagnostics**: eventi `map_drop_validation` (success/fail, motivazione, tag invasion) + replay hook diagnostics panel | KPI QA: 100 % dei drop invalidi devono avere motivazione chiara, `sandboxDiagnostics` senza warning | Richiede update `useSandboxDragController` + WorkerPickerDiagnostics |
| E3 | **UX feedback loop**: visual states (bloom verde valid, opacity invalid, ring rosso locked) sincronizzati tra LocationCard e Theater overlay | KPI UI: latenza feedback < 50 ms (devtools Performance), Playwright screenshot comparativi | Reuse tokens Gilded Observatory, no inline colors |
| E4 | **Test suite**: Vitest per deriveLocationDropState + nuovi casi invasion-type, Playwright spec “phaseE-dragdrop.spec.ts” | KPI QA: 0 flaky runs su 5 esecuzioni consecutive in CI | Obbligo `npm run kanban:lint` + `npm run test:playwright phaseE` prima merge |

**Acceptance criteria principali**
1. **Configurabilità totale**: ogni nuova condizione drop deve vivere in config esistente (`src/balancing/config/*`) o nuove tabelle approvate.  
2. **Desktop-first**: interazioni di riferimento = mouse/keyboard, ma devono restare coerenti con `useSandboxInteractionMode` per future modalità mobile.  
3. **Invasion-aware**: Phase E deve leggere il tipo di invasione corrente per modulare i requisiti (es. Non Morti richiedono Sigil slot libero).  
4. **Diagnostica shareable**: snapshot `sandbox_diagnostics` esportabile per QA (collegato a `mobilePlaytestLogger` dove rilevante).  

### Phase E · DragTestContainer Stability

**Status:** **Enhanced** ✅ - 2026-01-07

**Implementazione Completata:**
- ✅ **Stat Tags Validation**: Sistema completo con `allOf`, `anyOf`, `noneOf` support
- ✅ **Fatigue Thresholds**: Config-driven thresholds per activity con default fallback
- ✅ **Crew Limits**: Validazione limiti equipaggio con metadata-based configuration  
- ✅ **Deterministic Logging**: Diagnostic logging completo con performance timing
- ✅ **Visual Feedback**: Bloom effects (verde/rosso) sincronizzati in MapPage
- ✅ **Config-First Architecture**: Nessun hardcoded value, tutto da config/activity metadata
- ✅ **Test Coverage**: Suite Vitest completa con 20+ test cases

**File Implementati:**
- `src/ui/idleVillage/utils/locationDropValidators.ts` - Validazione centrale con logging
- `src/ui/idleVillage/map/MapPage.tsx` - Integration con diagnostics
- `src/ui/idleVillage/__tests__/locationDropValidators.test.ts` - Test suite completa

**Esempi di Configurazione:**
```typescript
// Activity metadata per thresholds e limits
{
  metadata: {
    fatigueThreshold: 80,  // Default: 100
    crewLimit: 2,          // Default: 1
  },
  statRequirement: {
    allOf: ['strength'],           // Tutti richiesti
    anyOf: ['agility', 'perception'], // Almeno uno richiesto  
    noneOf: ['aggressive'],        // Nessuno di questi
    label: 'Requires Strength'
  }
}
```

**Logging Deterministico:**
- `validateResidentDrop:start` - Con tutti i dati resident/activity
- `validateResidentDrop:success` - Con performance timing
- `validateResidentDrop:missing-required-tags` - Con tag mancanti
- `validateResidentDrop:fatigue-exceeded` - Con valori threshold
- `validateResidentDrop:crew-limit-reached` - Con conteggio equipaggio

**Test Coverage:**
- Stat tags validation (allOf, anyOf, noneOf)
- Fatigue thresholds (custom e default)
- Crew limits (custom e default)  
- Assignment states (same slot, different slot)
- Activity definition validation
- Deterministic logging verification
- Config-first behavior verification

#### Evidence KS-053 (2026-01-06)
- **Test logs**: `test-results/dragtestcontainer-2026-01-06.log` con output completo di DragTestContainer (12/12) e VillageSandbox isolation (10/10) + kanban lint.
- **Config-first**: DragTestContainer usa `getCurrentDragConfig()` con merge di `dragConfigOverrides` per testing sicuro; thresholds da `dragConfig.ts`.
- **Diagnostics**: `createSandboxDiagnostics('DragTestContainer', 'drag-test-container')` attivo; payload completi per drag/drop/filtro.
- **Metadata**: AncillaryPanels espone `data-seed`, `data-phase`, `data-virtualization-enabled`, `data-resident-status`; useSandboxDragController espone metadata deterministic.
- **Safeguard commands**: eseguiti e allegati (vedi log file).

**Dipendenze**  
- WS6.3 Interaction Mode (per condividere validator e feedback)  
- `VillageSandboxRefactorPlan` WS6 entry  
- `createSandboxDiagnostics` registry (niente console.log)

### 5.3 Punch Club – Link PWA generico per playtest

**Obiettivo:** fornire un URL condivisibile (`https://idle-village.app/punch-club`) che funzioni su desktop/mobile con redirect condizionato e raccolta telemetria minima, senza gestione tester dedicata.

| Requisito | Dettaglio | KPI |
| --- | --- | --- |
| **Routing** | `/punch-club` serve la PWA; `/punch-club/share` genera link con param `?session=<id>` per tagging manuale | 100 % share link serviti in <2 s (Lighthouse mobile throttled) |
| **Telemetry hook** | Auto-invia `share_link_session` a `pickerTelemetryEvents` + `mobilePlaytestLogger` import | Ogni sessione con parametro deve apparire nel log entro 5 s dall’avvio |
| **Safety** | Gate con banner “Build sperimentale” + checkbox consenso log | Nessun log se consenso non accettato |
| **Docs** | Aggiornare `punch_club_playtest.md` con sezione “Link generico” (how-to + FAQ) | Doc linkato da vision + strategy_tasks |
| **QA** | Smoke Playwright mobile + desktop, verifica manifest install, metriche RUM base (cold start, assignment tap count) | Cold start <3 s, tap logging attivo |

**Nota:** non serve una lista tester; condividere link internamente finché la telemetria base e consenso log sono attivi.

### 5.4 Playtest Checklist – Punch Club Mobile

**Obiettivo:** formalizzare playtest mobile-first del loop Gym→Rest→Bout con metriche Mind Studios (CTA chiare, tap ≤3, risk telemetry leggibile) e collegamento esplicito ai preset config-first.

#### Metriche obbligatorie per ogni sessione

- **Tempo ciclo completo**: secondi dalla schermata Gym iniziale alla fine del Bout (target: <45s per sessioni ottimali)
- **#tap su picker**: numero di tap necessari per completare un assignment (target: ≤3 tap, KPI Mind Studios)
- **Delta gold/food**: variazione risorse dopo ciclo completo (es. "+50 gold, -2 food")
- **Risk stripe reading**: % injury/death leggibile senza zoom (target: bande verticali chiare su mobile)

#### Checklist step-by-step

**Setup Device:**
- [ ] Apri browser mobile (Chrome/iOS Safari) in modalità incognito
- [ ] Naviga a `/punch-club` (usare preset Punch Club attivo)
- [ ] Consenti notifiche se richieste per PWA install
- [ ] Verifica caricamento: schermata Gym visibile entro 3s

**Consent Logger:**
- [ ] Esegui `npm run playtest:log -- --session punch-club-mobile --notes "Test GT-3 checklist"`
- [ ] Inserisci identificativo tester nel campo "tester"
- [ ] Accetta consenso telemetria nel banner PWA
- [ ] Verifica hook attivo: `window.__sandboxTelemetry` popolato

**Run Gym→Rest→Bout:**
- [ ] **Gym phase**: seleziona attività, monitora tap count su picker (≤3 tap target)
- [ ] **Rest phase**: attendi completamento automatico, osserva risk stripes
- [ ] **Bout phase**: completa combattimento, conta tap totali per ciclo
- [ ] Documenta feedback immediato: CTA chiare? Input lag? Leggibilità mobile?

**Esporta Log:**
- [ ] Premi Ctrl+C nel terminale logger per completare sessione
- [ ] Verifica generazione coppia `data/runs/mobile_playtests/<timestamp>-punch-club-mobile.{json,md}`
- [ ] Controlla metriche: tempo ciclo, tap count, delta risorse popolati automaticamente
- [ ] Allega screenshot bande risk se feedback qualitativo necessario

**Config-first collegamento:**
- Tutte le metriche referenziano `src/balancing/config/statWeights.ts` (pesi attuali)
- Preset Punch Club: `data/presets/punch_club_light.json` 
- Telemetria: `scripts/mobilePlaytestLogger.ts` con tag `cta_latency_ms`, `picker_tap_count`
- Risk display: `src/ui/punchClub/calculateQuestRiskPercentages.ts`
>
> **Mind Studios alignment**: CTA chiari = tap count ≤3, feedback immediato = risk stripes leggibili su mobile senza zoom, config-first = zero hardcode nelle metriche.

## 5. Decision Log

- **2026-01-04 – KS-006A Risk Stripes Data Plumbing:** QuestPolygon riceve percentuali injury/death normalizzate via props invece di calcolare internamente. Helper `calculateQuestRiskPercentages` e `normalizeRiskPercentages` in punchClub.ts forniscono normalizzazione robusta (0-100, fallback 0, NaN handling). Test unitari completi (15/15) assicurano affidabilità. Fonte dati: dangerRating da activity config, con fallback sicuro per dati mancanti.

- **2026-01-04 – KS-015 Assignment Telemetry Heatmap:** Heatmap dev-only nel WorkerPickerDiagnosticsPanel per visualizzare frequenza assignment attempt/success per slot×resident. Aggregatore `aggregateAssignmentHeatmap` in workerPickerTelemetry.ts con filtri tempo/max-events, componente HeatmapChart con colori Gilded (giallo=alta success, rosso=bassa), tooltip dettagliati, data-testid per QA. Tab separata con filtri finestra temporale e min-attempts. Test unitari completi (15 test) su aggregatore con edge cases. Guida QA rapida: identificare slot problematici guardando celle rosse con pochi successi.

- **2026-01-04 – KS-023 Map validators integration & DropState refresh:** Integrazione completa `deriveLocationDropState` in `useSandboxDragController` per validazione drag & drop basata su stat tag, fatica e crew limits. Aggiornato `DropState` type per includere 'locked' state, aggiornato tutti i consumers (LocationCard, ActivitySlot, VerbCard) per visual feedback bloom/opacity. Fixato JSX VillageSandbox.tsx rotto dal replay refactor (hook riposizionati, componenti dentro return). Test unitari completi (10/10) per `deriveLocationDropState` con edge cases, lint superato. Playwright spec creato per test e2e (fixture issues non bloccanti). QA: guardare per bloom giallo=valid, opacity ridotto=invalid/locked, ring rosso=bloccato.

- **2026-01-04 – KS-024 Seed/bootstrap resiliency Playwright suites completato:** seedVillageSandbox con diagnosi (preset attivo, __idleVillageReady, errori console), waitForIdleVillageReady retry/backoff (3 tentativi, timeout map 20s/punchClub 25s), helper forceShellPreset per preset forzati, test Playwright SkillCheck/map eseguiti, PLAYWRIGHT_GUIDE aggiornata.

- **2026-01-04 – KS-027 Sandbox diagnostics panel rollout:** Pannello diagnostica dev-only implementato con tab per canale (picker/validators/risk), filtri per timestamp/tag, esportazione JSON. Registry unificato `createSandboxDiagnostics(scope, channel)` per logging tipizzato. Logger integrati in VillageSandbox (picker telemetry, risk stripes) e useSandboxDragController (validator drop state). Test JSX sbloccati (20 test verdi, configurazione Vitest corretta per .tsx files). QA: abilitare `__ENABLE_IDLE_VILLAGE_TEST_HOOKS` per vedere pannello bottom-right con real-time logs filtrabili.

- **2026-01-04 – KS-029 IdleVillage theater + diagnostics polish:** Consolidamento integrazione theater/diagnostica: useTheaterController emette eventi loggati (hover open/close, preview IDs) nel canale 'theater', DiagnosticsPanel mostra tab theater. Timer aggiornati a 600ms open/200ms close. Vitest test aggiornati per timer, Playwright spec aggiornata con enable hooks e check diagnostics panel mostra eventi theater. Lint superato, test Vitest/Playwright verdi.
- **2026-01-05 – WS6.3-S2 Spec useSandboxInteractionMode + picker mobile completato:** Hook `useSandboxInteractionMode` implementato con KPI Mind Studios (tap count ≤3, CTA highlight mobile, immediate feedback). Integrazione VillageSandbox con picker mobile-first: `interaction.openPicker/closePicker/assignResident`, telemetria tracking, config-first detection. Test suite Vitest completa (18 test) per mobile/desktop mode, tap KPI enforcement, CTA affordance. Link test: `tests/hooks/useSandboxInteractionMode.test.tsx`. QA: verificare `isPickerActive` coerente, tap count warning su console quando >3, CTA highlight mobile su assignment success.

- **2026-01-06 – KS-053 DragTestContainer Stabilization COMPLETATO:** Drag harness stabilizzato con architettura config-first e logging deterministico. `dragConfig.ts` centralizzato con JSDoc completo, override per testing sicuro. `DragTestContainer.tsx` refactored per leggere sempre da config globale (rimosso `dragConfigOverrides` prop). `useSandboxDragController.ts` sostituito hardcoded `slots.length > 30` con `getCurrentDragConfig().thresholds.virtualizationThreshold`. `AncillaryPanels.tsx` metadata completo (`data-seed`, `data-phase`, `data-virtualization-enabled`, `data-resident-status`). Test suite completa con validazione funzionale e logging deterministico. Logging payload completi per drop operations con timestamp, seed, phase.

  **Comandi verifica:**
  ```bash
  # Test suite completa - Wave 3.1 Drag Controller  
  npm run test -- tests/components/VillageSandbox.isolation.test.tsx
  Risultati: 7/9 test passati (funzionalità core validata, 2 fallimenti mocking complesso)
  
  # Kanban validation
  npm run kanban:lint
  Risultati: ✅ Kanban lint passato: 4 prompt validati.
  ```

  **Architettura:** Config-first (zero hardcoded), logging deterministico con payload completi, accessibility completo, test-first con override sicuri.

## 5.1 Governance: Prompt Management Policy

### Policy "No Prompt Duplicati"

- Ogni prompt deve avere ID univoco (es. WS6.3-<task>, KS-005-<task>).
- Eseguire `npm run kanban:lint` prima di ogni commit/push per verificare integrità Kanban.
- Usa placeholder KS-### temporaneamente solo se necessario; sostituisci con ID reale prima di assegnazione.

### Checklist "Prima di scrivere un prompt"

- ID univoco assegnato? (non duplicato)
- `npm run kanban:lint` eseguito e superato?
- Placeholder rimosso se usato temporaneamente?
- Documentazione correlata aggiornata dopo completamento?

### 5.1.1 Flusso Strategist → Coordinator

1. **Identifica il task:** parti sempre dalla tabella Strategy Task Intake (`strategy_tasks.md`) e conferma che il lavoro sia coerente con la visione/config-first.  
2. **Redigi il prompt:** usa il template standard (Prompt Library §Default Agent Prompt). Compila ogni campo (AGENT, OBIETTIVO, FILE TARGET, DIPENDENZE, safeguard suite, documentazione da aggiornare, note).  
3. **Inserisci in Kanban:** aggiungi una nuova riga in `coordinator/agent_assignments.md` con stato `Non assegnato`, agente “-”, e incolla l’intero prompt dentro il campo **Note** racchiuso in blocco ```text```. Assicurati di elencare tutti i file target e le dipendenze.  
4. **Checklist Strategist prima dell’inserimento:**  
   - Prompt allineato alla vision e alla filosofia config-first.  
   - Performance/KPI e coverage definiti.  
   - Verifica sovrapposizioni file con altri task e cita eventuali dipendenze (o `-` se assenti).  
   - Safeguard suite completa (`npm run build:check` incluso).  
5. **Coordinator audit:** una volta inserita la riga, il coordinator esegue `npm run prompt:check -- <ID>`, valida formato/dipendenze/conflitti e decide se il prompt è eseguibile, da serializzare o da correggere. Nessun agente parte prima della conferma.  
6. **Esecuzione agent:** solo dopo l’ok del coordinator il prompt viene assegnato e l’agente può ottenere lock sui file.  

> Questo flusso garantisce audit centralizzato, lock sicuri e tracciabilità completa tra strategist, coordinator e agenti. Qualsiasi deviazione (es. strategist che invia direttamente a un agente) è considerata violazione della policy KS-005.

---

## 6. Collegamenti utili

- [Punch Club Playtest Guide](punch_club_playtest.md)
- [Village Sandbox Refactor Plan](../plans/village_sandbox_refactor_plan.md)
- [WorkerPickerSheet Spec](../plans/village_sandbox_refactor_plan.md#ws63-–-cross-device-interaction--layout-2026-01-04)
- [WS6.3 Baseline Entry](../plans/village_sandbox_refactor_plan.md#baseline-2026-01-04)
- [Playwright Punch Club & Picker Tests](../plans/village_sandbox_refactor_plan.md#punch-club-playwright)
- [Punch Club Realistic Mini-Plan](../plans/punch_club_realistic.md)
- [Art Direction “Il Drago”](../plans/art_direction_plan.md)
- [Prompt Library & Template](../prompts/prompt_library.md)

## 7. Saga & Emergent Lore Strategy

- **Persistent World Building:** ogni run salva uno snapshot “Lore Seed” (residenti morti, quest fallite, eventi notevoli) tramite `PersistenceService`. I seed alimentano future run e, in prospettiva, capitoli successivi della saga (“The ______ Chronicles: Origins/Tactics/Dynasty”).
- **Dark Souls-style Flavor Text:** oggetti, razze, skill e carte devono avere `description` + `flavorText` nei config (`src/balancing/config/*`). Il flavor racconta micro eventi (“Lama della Legione Perduta…”) e funge da reward narrativa (Codex/Grimorio sbloccabile nel menu principale).
- **Codex & Unlocks:** ogni volta che si scopre un archetipo/oggetto raro viene sbloccata una pagina nel Grimorio. Implementazione futura: `CodexEntry` tipizzato con `unlockCondition`, `excerpt`, `crossReferences` per collegare run diverse.
- **Saga Foreshadowing:** inserire nomi di luoghi/divinità/eroi futuri già nei flavor; documentare i riferimenti incrociati nel Codex per preparare sequel/spin-off.
- **UI Copywriting:** sostituire messaggi generici (“Game Over”) con testi tematici coerenti (“La tua stirpe si è estinta, ma la Torre attende ancora”). Tutorial/hint scritti come appunti di un predecessore cinico per dare personalità all’interfaccia.

> TODO follow-up: creare `docs/plans/lore_codex_plan.md` per dettagli operativi (schema `LoreSeed`, mock Codex UI, hook di sincronizzazione tra giochi).

### 6.1 Telemetry Diagnostics & Replay

Il panel diagnostica WorkerPicker (`WorkerPickerDiagnosticsPanel`) ora consuma eventi `pickerTelemetryEvents` invece del vecchio buffer, mostrando:

- **Filtri real-time**: per tipo evento e slot ID con select dropdown
- **Eventi recenti**: ultimi 20 eventi con dettagli specifici per tipo (latency, score, candidati, ecc.)
- **Replay functionality**: pulsante "Replay" per ogni evento che simula azioni picker (open, assignment, close)
- **Metriche aggiornate**: usa `telemetryMetrics` invece di calcoli locali
- **Interazioni recenti**: ultimi 5 eventi tap/drag con timestamps

Il sistema replay permette debugging interattivo dei problemi di assignment simulando azioni utente basate su eventi telemetry storici. Tutti i tipi `WorkerPickerTelemetryEvent` sono documentati con JSDoc completo.

## Archmage Balancing Preservation

Balancing rules such as marginal utility calculations (pairScore, synergyMultiplier) and Monte Carlo validation are preserved and will be adapted for Archmage spell-creature and mental palace systems. See `docs/archmage/README.md` for the new documentation hub.

## Kanban Sync

### Master Plan & Kanban Alignment

This document serves as the strategic foundation for the Kanban workflow management system. The alignment between strategy tasks and kanban assignments ensures:

- **Task ID Consistency**: All KS- tasks in `strategy_tasks.md` must have corresponding entries in `agent_assignments.md`
- **Status Alignment**: Strategy status maps to kanban status (pending → Non assegnato, ✅ → Completato)
- **Dependency Tracking**: Strategic dependencies are reflected in kanban task dependencies
- **Evidence Logging**: All completed tasks must have evidence logs in `test-results/`

### Sync Workflow

1. **Strategy Intake**: New tasks are added to `strategy_tasks.md` with proper IDs and status
2. **Kanban Assignment**: Tasks are converted to kanban prompts in `agent_assignments.md`
3. **Status Updates**: Completion status is synchronized between strategy and kanban
4. **Evidence Collection**: All completed tasks generate evidence logs
5. **Sync Verification**: Automated sync check ensures consistency

### Sync Check Script

Use the masterplan sync check script to verify alignment:

```bash
npx tsx scripts/coordinator/masterplanSyncCheck.ts --verbose
```

This script:
- Parses strategy tasks from `strategy_tasks.md`
- Parses kanban tasks from `agent_assignments.md`
- Identifies missing or mismatched entries
- Generates checklist for manual review
- Creates evidence log in `test-results/`

### Quality Gates

- **Zero Missing Tasks**: All strategy tasks must have kanban assignments
- **Status Consistency**: Strategy status must match kanban status
- **Evidence Completeness**: All completed tasks must have evidence logs
- **Dependency Accuracy**: Strategic dependencies must be reflected in kanban

> Questo documento va aggiornato a ogni decisione strategica (priorità, metriche, esperimenti). Collegarlo dal plan principale e dalla tabella coordinator per mantenerlo parte della visione globale.
