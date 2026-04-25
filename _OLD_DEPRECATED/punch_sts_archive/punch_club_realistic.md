# Punch Club Realistic Mini-Plan

> Scope: formalizzare il preset `punchClubLight` come base realistica per il rework Punch Club (Wave 3), definendo parametri configurati e componenti UI collegati a test Playwright.

## 1. Parametri di riferimento

| Categoria | Valore | Fonte |
| --- | --- | --- |
| **Residenti seed** | Lucia "Lantern" Bassi (`punch_gym`), Anselmo "Anchor" Riva (`punch_gym`, `punch_ring`), WS11 Vanguard (`edge`), WS11 Archivist (`scholar`) | @src/balancing/config/idleVillage/presets/punchClubLight.ts#11-68 |
| **Risorse iniziali** | 18 gold (Fight Purse), 6 food (Protein Rations) | @src/balancing/config/idleVillage/presets/punchClubLight.ts#70-208 |
| **Consumo cibo** | 1 food per residente al giorno | @src/balancing/config/idleVillage/presets/punchClubLight.ts#188-204 |
| **Giorno/notte** | 10 TU totali (6 giorno / 4 notte) – fatigue recovery 45 per rest giornaliero | @src/balancing/config/idleVillage/presets/punchClubLight.ts#188-197 |
| **Gym Shift (job_punch_training)** | Durata 4 TU, costo 1 food, reward 6 gold, fatigue gain 18-22, slot `punch_club_gym` | @src/balancing/config/idleVillage/presets/punchClubLight.ts#97-126 |
| **Underground Bout (quest_punch_match)** | Durata 6 TU, costo 3 gold, reward 10 gold + 2 grit, injury display 8% | @src/balancing/config/idleVillage/presets/punchClubLight.ts#127-155 |
| **Map slots** | Gym (`punch_club_gym`), Ring (`punch_club_ring`) con coordinate e unlock di default | @src/balancing/config/idleVillage/presets/punchClubLight.ts#159-182 |

### Timeline Giornaliera (proposta)

1. **Mattina (TU 0-4)** – Gym Shift auto-repeat: consuma 1 food, +6 gold, fatigue +18.
2. **Pomeriggio (TU 4-6)** – Training Tracker (metriche/boost) o micro rest per contenere fatigue.
3. **Sera (TU 6-8)** – Rest overlay: recupero 45 fatigue, prepara residenti al giorno successivo.
4. **Ogni 2 giorni (Quest cadence)** – Unlock Underground Bout (costo 3 gold) con residenti `punch_ring`, reward 10 gold + 2 grit.

## 2. Componenti da costruire

| Component | Obiettivo | API/Dati Config | Dipendenze | TODO |
| --- | --- | --- | --- | --- |
| **Gym Shift Card & HUD** | Visualizzare job `job_punch_training`, costi/reward e stato auto-repeat. | `config.activities.job_punch_training`, `useSandboxClock`, `useSandboxDragController` | ActivityActionCard base, ActionDetailHarness | [ ] Owner: Punch Club UI – implementare card + HUD snapshot |
| **Rest Overlay** | Mostrare recupero nightly (45 fatigue) e gating notturno. | `globalRules.fatigueRecoveryPerDay`, `useSandboxClock` | TheaterOverlay, Scheduler hooks | [ ] Owner: Sandbox Reset squad – integrazione overlay |
| **Training Tracker** | Metriche cumulative (fatigue, gold, grit) e suggerimenti crew. | `getSchedulerTelemetry`, `useSandboxDemoPanel` | New hook `usePunchMetrics` | [ ] Owner: Telemetry – definire schema + grafici |
| **Bout Card** | Quest `quest_punch_match` con risk stripes 8% e gating ogni 2 giorni. | `config.activities.quest_punch_match`, `globalRules.questSpawnEveryNDays` | LocationDetail, QuestChronicle bridge | [ ] Owner: Quest Guild – card + quest readiness logic |

## 3. Checklist operativa

1. 🟠 **Config sync** – Validare che `punchClubLight` resti l’unica fonte di verità (nessun valore duplicato in componenti/test).
2. 🟠 **UI wiring** – Assicurarsi che Gym Shift/Rest/Bout leggano da hooks (`useVillageSandbox`, `useSandboxClock`, `useTheaterController`).
3. 🟠 **Testing** – Preparare spec Playwright:
   - `tests/punch-club-loop.spec.ts` (work shift → rest → resource snapshot)
   - Nuova spec `tests/punch-club-bout.spec.ts` (quest availability + risk stripes)
   - Screenshot HUD + overlay come evidence.
4. 🟠 **Docs** – Aggiornare `village_sandbox_refactor_plan.md` e questa pagina ad ogni milestone completata.

## 4. Evidence richiesta

- **Playwright commands:**
  1. `tests/punch-club-bout.spec.ts` (Desktop/Mobile con trace): Verifica risk stripes proporzionali (`data-risk-yellow="8"`, `data-risk-red="0"`), readiness HUD (costo 3 gold prima, progress dopo accettazione), e log telemetry.
  2. Comando esecuzione: `DEBUG=useSandboxDragController npx playwright test tests/punch-club-bout.spec.ts --project "Desktop Chrome" --project "Mobile Chrome" --trace on`
- **Log scheduler telemetry:** Salvato in `test-results/punch-club-telemetry.log` con delta gold/food/grit calcolati dagli eventi `resource_change`.
- **Magic-card Parity Evidence (2026-01-03):**
  - **Config reference:** Punch Club Light preset (`@src/balancing/config/idleVillage/presets/punchClubLight.ts#70-208`) + seeded residents via `window.__idleVillageTestHooks.seedResidents`.
  - **Capture command:** `DEBUG=useSandboxDragController npx playwright test tests/magic-card-capture.spec.ts --project "Desktop Chrome" --trace on`.
  - **Assets:** idle/valid/invalid screenshots (`docs/ui_regressions/magic-card-{idle,valid,invalid}.png`) + JSON fragments documented in `docs/specs/idle_village_action_cards.md#magic-card-parity-evidence`.
  - **Evidence linkage:** Ensures ActivityCardDetail / LocationDetail / ActionDetailHarness maintain Magic-card look & feel for Punch Club jobs without touching legacy components. Refer back to Village Sandbox plan §Magic-card Parity Evidence for broader context.

> Se emergono nuovi buff/penalità (es. training bonus), aggiungere sezione “Parametri da confermare” con TODO collegato al design.

## Punch Club Minimal Draft Plan (2026-01-03)

Analisi derivata da `data/presets/punch_club_light.json` (seed residenti), `src/balancing/config/idleVillage/defaultConfig.ts` (risorse/schedule globali) e dal presente documento storico. Tutti i valori restano config-first; gli aggiustamenti avvengono via simulazioni Monte Carlo (≥10k run) per mantenere l'economia stabile senza hardcoding e per riallineare gli obiettivi con il refactor descritto nel [Village Sandbox Plan](./village_sandbox_refactor_plan.md).

### Parametri e metriche empiriche

| Pilastro | Config Source | Baseline empirico | Guardrail Monte Carlo | Note operative |
| --- | --- | --- | --- | --- |
| **Upkeep alimentare** | `globalRules.foodConsumptionPerResidentPerDay = 1` @defaultConfig | 4 unità/giorno con i 4 residenti seed | Tolleranza ±5%: se starvation >5% in 100 giorni → incrementare seed food | Convalida con telemetria `resource_change` nel Punch Club loop |
| **Recupero energia** | `fatigueRecoveryPerDay = 50`, `fatigueYellow/Red = 33/66` @defaultConfig | Δ fatica netto −20 per giorno (Gym + Rest) | Mantenere <10% giorni con fatigue >80 | Night overlay deve leggere i threshold dal config |
| **Gym Shift (job_punch_training)** | Timeline interna Punch Club: 4 TU, +6 gold, +18 fatigue | ROI lordo +6 gold, +18 fatigue | Target uptime 70% (auto-repeat), deviazione ±2 gold accettata | Validare drop state usando `ActivityActionCard` harness |
| **Bout sotterraneo (quest_punch_match)** | Timeline interna Punch Club: 6 TU, costo 3 gold, reward 10 gold, +2 grit | ROI netto +7 gold, +2 grit ogni 2 giorni | Mantieni injury <10%, death <2% via `deriveTheaterRiskStripes` | Cadence fissata da `questSpawnEveryNDays = 1` ma gating interno Punch Club = 2 giorni |
| **Progressi stat** | Residenti `punch_gym` con `statTags` edge/discipline @preset JSON | +2 grit a bout, +1 disciplina/settimana training | Bilancia edge/grit entro ±15% vs baseline 4 settimane | Metriche raccolte tramite `useSandboxDemoPanel` (nuova sezione Punch Metrics) |
| **Economia** | `startingResources`: 0 gold / 2 food @defaultConfig | Gold medio 18 dopo 3 giorni, food 0 senza mercato | Target: gold >10 e food ≥2 su 90% run | Simulazione usa `job_visit_market` per rifornimenti quando food <2 |

### Timeline minimale proposta

1. **Mattina (TU 0‑4)** – Gym Shift auto-repeat (costo 1 food) finché fatigue <66.
2. **Pomeriggio (TU 4‑6)** – Tracker/telemetria o micro-rest per mantenere fatigue vicina a 50.
3. **Sera (TU 6‑10)** – Rest overlay + acquisto food se scorta ≤2 unità.
4. **Ogni 2 giorni** – Bout sotterraneo se requisito `punch_ring` soddisfatto e gold ≥3.

### Roadmap minimale (agganciata al Village Sandbox Plan)

1. **Punch Metrics Hook** – Estendere `useSandboxDemoPanel` con schema MC (export JSON) e reference nel plan Wave 3 (`VillageSandbox` sezione Punch Club).  
2. **HUD & Risk** – Applicare le stripe `data-injury-percent`/`data-death-percent` a quest Punch Club e validare con Playwright `punch-club-bout.spec.ts`.  
3. **Economy Sim Pack** – Integrare stress test in `src/balancing/stressTesting/punchClubMonteCarlo.ts` con parametri del table sopra.  
4. **Docs & Evidence** – Aggiornare questo file + plan Village Sandbox a ogni milestone; archiviare log in `test-results/punch-club-telemetry.log`.

### Link documentali

- Piano rework principale: [Village Sandbox Refactor](./village_sandbox_refactor_plan.md#punch-club-coordination-2026-01-02)
- Punch Club Playwright suite: vedere `tests/punch-club-loop.spec.ts` e `tests/punch-club-bout.spec.ts` (allegare log ai checkpoint).
