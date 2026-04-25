# Future Kanban Prompts Backlog
<!-- markdownlint-disable MD022 MD031 -->

Questa raccolta contiene prompt già pronti, strutturati secondo il template WS6. Sono tutti marcati come “Non assegnato” e possono essere importati nel Kanban principale senza ulteriori modifiche. Ogni prompt mantiene i principi config-first, richiede JSDoc per le nuove API e impone l’uso della PersistenceService per la persistenza asincrona.

---

## NP-001 – STS Intent Visualizer Overlay
```text
AGENT
Aurora-STS – Intent Insights

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Visualizzare in tempo reale gli intent nemici previsti dal simulatore STS con overlay configurabile e telemetria dedicata.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/sts/components/IntentVisualizer.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/tools/sts/hooks/useSTSIntentData.ts — creare scaffolding prima di iniziare.
- [esistente] src/balancing/config/sts/intentWeights.ts
- [esistente] tests/unit/sts/IntentVisualizer.test.tsx
- [esistente] docs/plans/sts_simulator_ui_redesign_plan.md (§ overlay)

DIPENDENZE
- KS-081-sts-sim
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Lock prompt + `npm run build:check` baseline.
2. Aggiungere config `intentWeights.ts` con schema Zod condiviso.
3. Creare hook `useSTSIntentData` con polling simulatore + PersistenceService per preferenze overlay.
4. Costruire componente `IntentVisualizer` con controlli densità, palette e tooltip accessibili.
5. Aggiornare doc + test RTL/ Vitest (mock simulatore) e registrare telemetria `sts_intent_visualized`.

OPERAZIONI VIETATE
- Nessun valore magico per percentuali; usare config.
- Vietato accedere direttamente a localStorage/sessionStorage.
- Non duplicare logiche del simulatore (riusare API esistenti).

ASSUNZIONI
- La pipeline STS espone già intents normalizzati.
- Le palette colori vivono in Style Laboratory config.
- Tutti i nuovi helper ricevono JSDoc completo.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts src/balancing/config/sts`
- `npm run test:unit -- tests/unit/sts/IntentVisualizer.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; fermarsi e ping coordinatore se i dati intents non sono disponibili via simulatore o se mancano KPI cold start.

KANBAN COMPLETION
1. Aggiornare riga Kanban a “Completato” con data odierna.
2. Allegare `Evidence: test-results/np-001-sts-intent-visualizer-<data>.log` in note (contiene lint/test/build).
3. Includere output `npm run kanban:lint` nel log e nel report finale.

NOTE
- Documentare nelle note Kanban eventuali filtri extra rifiutati dal coordinatore.
- Screenshot ASCII dell’overlay richiesto nel log.

EVIDENCE LOG
- test-results/np-001-sts-intent-visualizer-<data>.log
```

## NP-002 – STS Combo Efficiency Heatmap
```text
AGENT
Helix-STS – Combo Metrics

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare heatmap interattiva per misurare l’efficienza delle combo (card pair/triple) basata su simulazioni Monte Carlo e configurabile da preset JSON.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/sts/components/ComboHeatmap.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/tools/sts/hooks/useComboHeatmapData.ts — creare scaffolding prima di iniziare.
- [esistente] src/balancing/config/sts/comboWeights.ts
- [nuovo] data/presets/sts/combo_heatmap_template.json — creare scaffolding prima di iniziare.
- [esistente] tests/unit/sts/ComboHeatmap.test.tsx
- [esistente] docs/analytics/sts_combo_heatmap.md

DIPENDENZE
- KS-081-sts-telemetry-dashboard
- scripts/balancer/scenarioRunner.ts

OPERAZIONI DA ESEGUIRE
1. Definire schema preset combo con Zod + doc.
2. Implementare hook per aggregare output scenarioRunner e cache useMemo.
3. Costruire componente heatmap (canvas/SVG) con filtri per archetype e threshold.
4. Aggiungere telemetria `sts_combo_heatmap_viewed/exported`.
5. Scrivere test unit + aggiornare doc analytics con flusso KPI.

OPERAZIONI VIETATE
- Vietato hardcodare colori/threshold (devono stare nel config).
- Non usare setInterval senza cleanup.
- Niente export CSV senza passare da helper condivisi.

ASSUNZIONI
- I file di input sono in `data/presets/sts`.
- Il motore Monte Carlo restituisce synergyMultiplier già normalizzato.
- PersistenceService disponibile per ricordare l’ultimo preset caricato.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts src/balancing/config/sts scripts/balancer`
- `npm run test:unit -- tests/unit/sts/ComboHeatmap.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check dopo step 3 se la performance canvas >16 ms.

KANBAN COMPLETION
1. Stato Kanban “Completato” + data.
2. Allegare log `test-results/np-002-sts-combo-heatmap-<data>.log`.
3. Linkare doc analytics aggiornato nelle note.

NOTE
- Fornire esempi di palette in doc; evitare screenshot binari.
- Annotare eventuali limitazioni GPU.

EVIDENCE LOG
- test-results/np-002-sts-combo-heatmap-<data>.log
```

## NP-003 – STS Combat Telemetry Replay CLI
```text
AGENT
Vector-CLI – Telemetry Replay

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire comando CLI per riprodurre timeline di combattimenti STS (JSON -> ASCII timeline) con filtri card, mana e agency gap.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/sts/combatReplay.ts — creare scaffolding prima di iniziare.
- [esistente] scripts/__tests__/combatReplay.test.ts
- [esistente] src/analytics/stsTelemetry.ts (helper parsing)
- [esistente] docs/cli/sts_combat_replay.md
- [nuovo] test-results/templates/combat-replay-report.md — creare scaffolding prima di iniziare.

DIPENDENZE
- KS-081-sts-telemetry-dashboard
- mobilePlaytestLogger export format

OPERAZIONI DA ESEGUIRE
1. Disegnare schema input (Zod) riusando definizioni esistenti in analytics.
2. Implementare CLI con Commander: filtri (--fight, --card, --export).
3. Generare timeline ASCII + possibilità export JSON prettificato.
4. Integrare PersistenceService per memorizzare ultimo path.
5. Scrivere test unit CLI (Vitest) + doc quickstart e sample log.

OPERAZIONI VIETATE
- Non leggere file senza try/catch + messaggi chiari.
- Vietato bloccare event loop con I/O sincrono.
- Nessun output HTML (solo text/JSON/markdown).

ASSUNZIONI
- Node 20.19.6 disponibile (nvm).
- Telemetria contiene `combatId`, `turn`, `event`.
- Gli utenti usano repository root come cwd.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts src/analytics`
- `npm run test:unit -- scripts/__tests__/combatReplay.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; fermarsi se formato telemetria diverge dal dashboard e aprire ticket doc.

KANBAN COMPLETION
1. Stato Kanban → “Completato”.
2. Allegare `test-results/np-003-sts-combat-replay-<data>.log` con tutti gli output.
3. Includere esempio timeline nel log.

NOTE
- Prevedere flag `--evidence-log` per scrivere direttamente nel file output.
- Documentare compatibilità Windows/macOS.

EVIDENCE LOG
- test-results/np-003-sts-combat-replay-<data>.log
```

## NP-004 – STS Deck Consistency Monitor
```text
AGENT
Lumen-Balancer – Deck QA

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Monitorare coerenza deck/preset STS confrontando punti allocati vs pesi config, con alert su squilibri >5%.

PROMPT READINESS
FILE TARGET
- [nuovo] src/balancing/tools/sts/DeckConsistencyMonitor.ts — creare scaffolding prima di iniziare.
- [esistente] src/balancing/config/sts/deckRules.ts
- [esistente] scripts/sts/deckConsistencyReport.ts
- [esistente] tests/unit/sts/DeckConsistencyMonitor.test.ts
- [esistente] docs/balancing/sts_deck_consistency.md

DIPENDENZE
- BalancerConfigStore
- data/presets/sts/*

OPERAZIONI DA ESEGUIRE
1. Definire regole deck in config + schema.
2. Implementare servizio monitor che calcola deviazioni e suggerisce fix.
3. Integrare CLI report con export markdown + JSON per CI.
4. Agganciare telemetria `sts_deck_consistency_alert`.
5. Scrivere test su deviazioni e su CLI + aggiornare doc.

OPERAZIONI VIETATE
- No numeri magici per soglie; usare config.
- Non scrivere file fuori `test-results/`.
- Vietato manipolare preset originali (solo copia in memoria).

ASSUNZIONI
- I preset sono versionati.
- PersistenceService usata per ricordare ultimo preset analizzato (CLI interactive mode).

REGRESSION SAFEGUARDS
- `npm run lint -- src/balancing src/balancing/tools scripts/sts`
- `npm run test:unit -- tests/unit/sts/DeckConsistencyMonitor.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se deviazioni >15% persistono (richiede allineamento designer).

KANBAN COMPLETION
1. Aggiornare Kanban con stato/completamento e link doc.
2. Allegare log `test-results/np-004-sts-deck-consistency-<data>.log`.
3. Riportare nel log la lista dei preset analizzati.

NOTE
- Prevedere output JSON consumabile da pipeline CI.
- Annotare nei commenti eventuali preset esclusi e motivazione.

EVIDENCE LOG
- test-results/np-004-sts-deck-consistency-<data>.log
```

## NP-005 – STS Damage Curve Regression Guard
```text
AGENT
Sentinel-Metrics – Regression Guard

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare suite di regression test sulle damage curves STS per garantire linearità e rispetto dei target-turn per ogni archetype.

PROMPT READINESS
FILE TARGET
- [nuovo] src/balancing/sts/damageCurveGuard.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/sts/DamageCurveGuard.test.ts
- [esistente] scripts/sts/damageCurveSnapshot.ts
- [esistente] docs/balancing/sts_damage_curve_guard.md

DIPENDENZE
- scripts/balancer/scenarioRunner.ts
- BalancerConfigStore targetTurns

OPERAZIONI DA ESEGUIRE
1. Definire API guard (input: scenario config, output: verdict + diff).
2. Creare snapshot JSON (per build/CI) con command script.
3. Integrare test Vitest che confrontano output vs snapshot e falliscono >2% delta.
4. Aggiornare doc con istruzioni per rinnovo snapshot e KPI.
5. Aggiungere telemetria `sts_damage_guard_failed`.

OPERAZIONI VIETATE
- Non memorizzare snapshot fuori /data o /test-results.
- Nessun accesso sincrono al filesystem nelle funzioni pure.
- Vietato bypassare scenarioRunner per velocizzare (usare pipeline ufficiale).

ASSUNZIONI
- targetTurns già presenti.
- Snapshot versioning via git.

REGRESSION SAFEGUARDS
- `npm run lint -- src/balancing scripts/sts`
- `npm run test:unit -- tests/unit/sts/DamageCurveGuard.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; fermarsi se snapshot supera 5 MB o se build ci mette >5 min.

KANBAN COMPLETION
1. Stato Kanban aggiornato + reference commit snapshot.
2. Evidence `test-results/np-005-sts-damage-guard-<data>.log`.
3. Reportare nel log i delta principali.

NOTE
- Mantenere snapshot deterministic (seed fisso).
- Documentare come aggiornare i target-turn in caso di fail.

EVIDENCE LOG
- test-results/np-005-sts-damage-guard-<data>.log
```

## NP-006 – STS Buff Library Config Merge
```text
AGENT
Nova-Config – Buff Librarian

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Unificare libreria buff STS (UI + engine) usando config condiviso e tool di migrazione JSON.

PROMPT READINESS
FILE TARGET
- [esistente] src/balancing/config/sts/buffLibrary.ts (nuovo, Zod schema)
- [esistente] src/ui/tools/sts/hooks/useBuffLibrary.ts
- [esistente] src/engine/sts/buffs/BuffCalculator.ts
- [esistente] scripts/sts/migrateBuffLibrary.ts
- [esistente] tests/unit/sts/BuffLibrary.test.ts
- [esistente] docs/plans/sts_buff_library_unification.md

DIPENDENZE
- KS-081-sts-combat-config
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire schema buff (ticks {value, weight}) e doc string.
2. Adeguare hook UI per leggere/scrivere tramite PersistenceService + schema.
3. Allineare motore BuffCalculator con config, rimuovendo hardcode locali.
4. Creare script migrazione preset legacy -> nuovo schema.
5. Testare UI/motore + doc guida migrazione.

OPERAZIONI VIETATE
- Niente fallback silenziosi: validare e loggare errori.
- Vietato mantenere doppie fonti di verità.
- Non introdurre JSON con commenti (usare doc separata).

ASSUNZIONI
- Tutti i buff saranno versionati (semver).
- UI già dispone di controlli per editing buff.

REGRESSION SAFEGUARDS
- `npm run lint -- src/balancing src/ui/tools/sts scripts/sts`
- `npm run test:unit -- tests/unit/sts/BuffLibrary.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync col coordinatore prima di modificare engine contract.

KANBAN COMPLETION
1. Aggiornare Kanban con stato e link doc migrazione.
2. Evidence `test-results/np-006-sts-buff-library-<data>.log`.
3. Allegare sample diff JSON nel log.

NOTE
- Prevedere tool `--dry-run` nello script.
- Annotare in doc i campi obbligatori e default.

EVIDENCE LOG
- test-results/np-006-sts-buff-library-<data>.log
```

## NP-007 – STS Scenario Exporter for Tactics CLI
```text
AGENT
Atlas-CLI – Scenario Export

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Esportare scenari STS (config-first) verso tool tattici esterni tramite CLI che genera pacchetti JSON + CSV documentati.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/sts/scenarioExport.ts — creare scaffolding prima di iniziare.
- [nuovo] src/balancing/monteCarlo/ScenarioSerializer.ts — creare scaffolding prima di iniziare.
- [esistente] docs/cli/sts_scenario_exporter.md
- [esistente] tests/unit/sts/ScenarioSerializer.test.ts
- [esistente] data/exports/sts/sample_scenarios/

DIPENDENZE
- CF-Phase10-scenario-runner
- BalancerConfigStore

OPERAZIONI DA ESEGUIRE
1. Creare serializer con mappatura tick {value, weight} → payload CLI.
2. Implementare CLI con filtri per enemy archetype e budget.
3. Salvare bundle (JSON+CSV) in `data/exports/sts`.
4. Documentare import nei tool esterni + esempi.
5. Test unit su serializer + CLI snapshot output.

OPERAZIONI VIETATE
- Vietato accedere a config tramite require dinamici (usare import TS).
- Non esportare dati sensibili (solo configurazioni consentite).
- Nessun comando che scrive fuori data/exports.

ASSUNZIONI
- Gli utenti hanno Node 20 e permessi su data/.
- I tool esterni accettano JSON con camelCase.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/sts src/balancing/monteCarlo`
- `npm run test:unit -- tests/unit/sts/ScenarioSerializer.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; avvisare se il formato richiesto dai tool esterni cambia.

KANBAN COMPLETION
1. Stato Kanban aggiornato + link doc CLI.
2. Evidence `test-results/np-007-sts-scenario-export-<data>.log`.
3. Allegare elenco file esportati nel log.

NOTE
- Prevedere flag `--kpi` per stampare stats rapido.
- Documentare compressione opzionale (.zip) se approvata.

EVIDENCE LOG
- test-results/np-007-sts-scenario-export-<data>.log
```

## NP-008 – STS Mana Surge Alerting
```text
AGENT
Pulse-Telemetry – Mana Watch

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Introdurre sistema di alert per mana surge (>threshold config) durante simulazioni STS, con UI badge e log nel dashboard.

PROMPT READINESS
FILE TARGET
- [esistente] src/balancing/config/sts/manaSurgeConfig.ts
- [nuovo] src/ui/tools/sts/hooks/useManaSurgeAlert.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/sts/components/ManaSurgeBanner.tsx
- [esistente] src/analytics/stsTelemetry.ts (nuovi eventi)
- [esistente] tests/unit/sts/ManaSurgeAlert.test.tsx

DIPENDENZE
- KS-081-sts-telemetry-dashboard
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config thresholds + palette in file dedicato.
2. Creare hook che monitora output simulatore e genera alert persistenti (PersistenceService).
3. Costruire banner UI con ack/ snooze e telemetria `sts_mana_surge_ack`.
4. Integrare note nel dashboard + doc KPI.
5. Testare con scenari high mana e verifying telemetria.

OPERAZIONI VIETATE
- Vietato hardcodare threshold.
- Non bloccare simulatore con setState sincroni dentro loop.
- Nessuna notifica senza opzione dismiss.

ASSUNZIONI
- Telemetria già centralizzata in stsTelemetry.
- Gli utenti vogliono ack che sopravvive reload (PersistenceService).

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts src/balancing/config/sts src/analytics`
- `npm run test:unit -- tests/unit/sts/ManaSurgeAlert.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check-in se il coordinatore vuole thresholds multipli per modalità.

KANBAN COMPLETION
1. Stato Kanban + data.
2. Evidence `test-results/np-008-sts-mana-surge-<data>.log`.
3. Inserire screenshot ASCII del banner nel log.

NOTE
- Documentare fallback nel caso il simulatore non invii eventi.
- Annotare nelle note eventuali limiti di performance.

EVIDENCE LOG
- test-results/np-008-sts-mana-surge-<data>.log
```

## NP-009 – STS Simulator Accessibility Sweep
```text
AGENT
Aeon-A11y – Simulator UI

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Eseguire remediation accessibilità per le pagine STS simulator (focus management, ARIA labeling, contrast ratios) con checklist WCAG 2.1 AA.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/tools/sts/STSControlBar.tsx
- [esistente] src/ui/tools/sts/SimulatorLayout.tsx
- [esistente] src/ui/tools/sts/components/* (audit)
- [esistente] tests/unit/sts/Accessibility.test.tsx
- [esistente] docs/a11y/sts_simulator_accessibility.md

DIPENDENZE
- Style Laboratory palette
- Accessibility lint rules

OPERAZIONI DA ESEGUIRE
1. Audit componenti con axe + definire backlog.
2. Implementare fix (ARIA, focus trap, skip links).
3. Aggiornare theme tokens in config per contrasto.
4. Scrivere test RTL con `jest-axe`.
5. Documentare checklist e open issues.

OPERAZIONI VIETATE
- Non introdurre override CSS inline non tipizzati.
- Vietato forzare outline: none senza sostituzione.
- Nessuna dipendenza esterna non revisionata.

ASSUNZIONI
- Lint a11y già attivo.
- I componenti usano CSS Modules/Tailwind esistenti.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts --max-warnings=0`
- `npm run test:unit -- tests/unit/sts/Accessibility.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se si trova blocco legato a constraint design.

KANBAN COMPLETION
1. Stato Kanban completato + link doc checklist.
2. Allegare log `test-results/np-009-sts-accessibility-<data>.log`.
3. Riportare nel log i principali contrasti migliorati.

NOTE
- Inserire tabella con bug risolti/pending.
- Validare su keyboard-only e screen reader.

EVIDENCE LOG
- test-results/np-009-sts-accessibility-<data>.log
```

## NP-010 – STS Combatant Preset Linter
```text
AGENT
Codex-Lint – Preset QA

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare linter per preset Combatant STS che verifica campi obbligatori, range valori e riferimenti a buff/AI esistenti.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/sts/combatantPresetLint.ts — creare scaffolding prima di iniziare.
- [esistente] src/balancing/config/sts/combatantsConfig.ts (estensioni regole)
- [esistente] src/ui/tools/sts/hooks/useSTSCombatantsConfig.ts (integrazione lint result)
- [esistente] tests/unit/sts/CombatantPresetLint.test.ts
- [esistente] docs/tools/sts_combatant_preset_lint.md

DIPENDENZE
- KS-081-sts-combat-config
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire regole lint in config (severity, message).
2. Costruire CLI che esegue lint su file/preset e produce JSON/markdown.
3. Integrare hook UI per mostrare warnings e salvare stato via PersistenceService.
4. Aggiungere telemetria `sts_preset_lint_failed`.
5. Scrivere test per regole principali + doc how-to-run.

OPERAZIONI VIETATE
- Non fallire silenziosamente; sempre exit code >0 su errori.
- Vietato modificare preset in-place (solo report).
- Nessun accesso a file fuori dataset designato.

ASSUNZIONI
- I preset vivono in `data/presets/sts`.
- Designer usano CLI pre-commit.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/sts src/ui/tools/sts src/balancing/config/sts`
- `npm run test:unit -- tests/unit/sts/CombatantPresetLint.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; avvisare se servono nuove categorie severity.

KANBAN COMPLETION
1. Stato Kanban aggiornato + link doc.
2. Evidence `test-results/np-010-sts-preset-lint-<data>.log`.
3. Log deve includere esempio output CLI.

NOTE
- Prevedere flag `--fix` disabilitato per default (solo warn).
- Documentare come aggiungere nuove regole.

EVIDENCE LOG
- test-results/np-010-sts-preset-lint-<data>.log
```

## NP-011 – Idle Village Crew Fatigue Dashboard
```text
AGENT
Helios-Idle – Fatigue Ops

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Realizzare dashboard fatigue per Crew Scheduler Phase E con grafici config-first e telemetria aggregata per turno.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/components/CrewFatigueDashboard.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useCrewFatigueData.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/fatigueDashboardConfig.ts
- [esistente] tests/unit/idleVillage/CrewFatigueDashboard.test.tsx
- [esistente] docs/plans/idle_village_plan.md (§ fatigue dashboard)

DIPENDENZE
- IV-PhaseE-drop-feedback
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config (palette, soglie, smoothing) + schema Zod.
2. Implementare hook che aggrega telemetria crew scheduler e salva preferenze (PersistenceService).
3. Costruire dashboard con grafici mini (sparklines, stacked bars).
4. Integrare telemetry `idle_fatigue_dashboard_viewed/exported`.
5. Scrivere test RTL + doc con KPI.

OPERAZIONI VIETATE
- Non leggere dati direttamente da store non tipizzati.
- Vietato hardcodare soglie; usare config file.
- Nessuna mutazione degli state scheduler fuori hook dedicati.

ASSUNZIONI
- Telemetria fatigue già disponibile tramite scheduler store.
- Dashboard deve essere responsive (desktop/tablet).

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/CrewFatigueDashboard.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; ping se mancano KPI lato design.

KANBAN COMPLETION
1. Stato Kanban aggiornato + screenshot ASCII nel log.
2. Evidence `test-results/np-011-idle-fatigue-dashboard-<data>.log`.
3. Log deve includere output telemetry sample.

NOTE
- Aggiungere toggle per smoothing.
- Documentare eventuali costi performance >16ms.

EVIDENCE LOG
- test-results/np-011-idle-fatigue-dashboard-<data>.log
```

## NP-012 – Idle Village Quest Decision Feed Telemetry
```text
AGENT
Voyager-Idle – Quest Feed

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Strutturare telemetria e config per QuestDecisionFeed, consentendo audit decisioni, filtri e export JSON verso analytics.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/components/QuestDecisionFeed.tsx
- [nuovo] src/ui/idleVillage/hooks/useQuestDecisionFeed.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/questDecisionFeedConfig.ts
- [nuovo] src/analytics/idleVillageQuestFeed.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/QuestDecisionFeed.test.tsx
- [esistente] docs/analytics/idle_village_quest_feed.md

DIPENDENZE
- IV-QuestRisk-stripes
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Creare config (filters, thresholds, batching) + schema.
2. Implementare hook che aggrega eventi quest e salva filtri (PersistenceService).
3. Aggiornare componente feed con grouping, tags, export button.
4. Introdurre telemetry `quest_feed_event`, `quest_feed_export`.
5. Scrivere test per filtri, telemetry e export.

OPERAZIONI VIETATE
- Non accedere direttamente a store globale senza hook typed.
- Niente filtri hardcoded; usare config.
- Vietato esportare dati senza sanitizzazione (rimuovere PII).

ASSUNZIONI
- Eventi quest disponibili in store analytics.
- Export JSON salvato in `test-results/` se richiesto.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage src/analytics`
- `npm run test:unit -- tests/unit/idleVillage/QuestDecisionFeed.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; coordinarsi se i filtri richiesti superano 10 combinazioni.

KANBAN COMPLETION
1. Aggiornare Kanban + note con link doc analytics.
2. Evidence `test-results/np-012-idle-quest-feed-<data>.log`.
3. Includere esempio export nel log.

NOTE
- Prevedere badge risk level (usa config riskDisplay).
- Documentare fallback se feed è vuoto.

EVIDENCE LOG
- test-results/np-012-idle-quest-feed-<data>.log
```

## NP-013 – Idle Village Crew Scheduler Determinism Guard
```text
AGENT
Chronos-Idle – Scheduler Guard

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Garantire determinismo del Crew Scheduler introducendo seed configurabile, snapshot diff viewer e regression tests.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/controllers/CrewSchedulerController.ts
- [esistente] src/ui/idleVillage/hooks/useCrewScheduler.ts
- [esistente] src/balancing/config/idleVillage/crewScheduler.ts
- [esistente] tests/unit/idleVillage/CrewSchedulerDeterminism.test.ts
- [esistente] scripts/idleVillage/crewSchedulerSnapshot.ts
- [esistente] docs/plans/ws3-theater-controller-crew-scheduler.md (§ determinism)

DIPENDENZE
- IV-WS3-useMapContext-fix
- Storage Testing Framework

OPERAZIONI DA ESEGUIRE
1. Aggiungere campo `seedStrategy` al config scheduler + JSDoc.
2. Implementare snapshot generator con PersistenceService per ultimi seed.
3. Aggiornare controller per usare seed dal config + fallback.
4. Scrivere test determinismo (same seed → same outcome).
5. Documentare flusso e CLI snapshot in doc WS3.

OPERAZIONI VIETATE
- Vietato usare Math.random direttamente nel controller.
- Non salvare snapshot fuori `test-results/`.
- Nessuna modifica manuale allo state scheduler in test (usare helper).

ASSUNZIONI
- Crew scheduler già esposto tramite hook typed.
- Node 20 disponibile per CLI snapshot.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage src/balancing/config/idleVillage scripts/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/CrewSchedulerDeterminism.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se emergono divergenze >1% rispetto ai log base.

KANBAN COMPLETION
1. Stato Kanban aggiornato + link sezione doc.
2. Evidence `test-results/np-013-crew-scheduler-determinism-<data>.log`.
3. Allegare diff snapshot nel log.

NOTE
- Annotare nel log eventuali scheduler plugin esclusi.
- Documentare come rigenerare baseline.

EVIDENCE LOG
- test-results/np-013-crew-scheduler-determinism-<data>.log
```

## NP-014 – Idle Village Resident Drag Stress Test Suite
```text
AGENT
Impulse-Idle – Drag QA

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire suite stress test che simula drag & drop massivo (1000+ operazioni) per validare drop feedback e scheduler Phase E.

PROMPT READINESS
FILE TARGET
- [esistente] tests/stress/idleVillage/ResidentDragStress.test.ts
- [nuovo] src/tests/utils/idleVillageDragHarness.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/dragStressConfig.ts
- [esistente] docs/tests/idle_village_drag_stress.md

DIPENDENZE
- IV-PhaseE-drop-feedback
- DragTestContainer utilities

OPERAZIONI DA ESEGUIRE
1. Definire config stress (batch size, cooldown) + Zod schema.
2. Implementare harness riusabile per generare drag sequence.
3. Scrivere stress test con Vitest + jsdom, includendo misure TTI.
4. Loggare telemetria `idle_drag_stress_event`.
5. Documentare come lanciare test e leggere KPI.

OPERAZIONI VIETATE
- Vietato disabilitare animazioni globali senza ripristino.
- Non usare timers reali >5s (mock/fake timers).
- Nessun direct DOM query senza data-testid.

ASSUNZIONI
- DragTestContainer già disponibile.
- Stress config salvato in JSON nel repo.

REGRESSION SAFEGUARDS
- `npm run lint -- tests src/ui/idleVillage`
- `npm run test:unit -- tests/stress/idleVillage/ResidentDragStress.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; fermarsi se CPU usage supera 80% costantemente durante stress test.

KANBAN COMPLETION
1. Aggiornare Kanban + allegare screenshot ASCII KPI.
2. Evidence `test-results/np-014-idle-drag-stress-<data>.log`.
3. Riportare medie TTI nel log.

NOTE
- Prevedere flag `--report` per esportare CSV con tempi.
- Documentare eventuali blocchi su jsdom limitazioni.

EVIDENCE LOG
- test-results/np-014-idle-drag-stress-<data>.log
```

## NP-015 – Idle Village Risk Stripe Calibration Tool
```text
AGENT
Prism-Idle – Risk Calibration

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare tool interattivo per calibrare risk stripes (injury/death) con curve configurabili e esport JSON per quest planner.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/tools/RiskStripeCalibrator.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useRiskCalibration.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/riskCalibrationConfig.ts
- [esistente] tests/unit/idleVillage/RiskStripeCalibrator.test.tsx
- [esistente] docs/plans/idle_village_plan.md (§ risk calibration)

DIPENDENZE
- IV-QuestRisk-stripes
- Style Laboratory

OPERAZIONI DA ESEGUIRE
1. Definire config per curve smoothing, palette e KPI target.
2. Implementare hook con PersistenceService per preset e undo stack.
3. Costruire tool UI con slider, chart e export JSON.
4. Integrare telemetria `quest_risk_calibration_saved`.
5. Testare UI/hook + documentare guida calibrations.

OPERAZIONI VIETATE
- Nessun valore magico per soglie risk.
- Vietato salvare preset fuori PersistenceService.
- Non usare canvas senza fallback per screenshot ASCII.

ASSUNZIONI
- Designer forniranno preset iniziali.
- Export JSON deve essere compatibile con riskDisplayConfig.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/RiskStripeCalibrator.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se nuovi KPI differiscono da plan.

KANBAN COMPLETION
1. Aggiornare Kanban + allegare link doc calibrations.
2. Evidence `test-results/np-015-risk-calibrator-<data>.log`.
3. Log deve includere export JSON di esempio.

NOTE
- Inserire funzione “Compare to baseline”.
- Documentare performance >16 ms se presenti.

EVIDENCE LOG
- test-results/np-015-risk-calibrator-<data>.log
```

## NP-016 – Idle Village Activity Slot Telemetry Mapper
```text
AGENT
Signal-Idle – Slot Telemetry

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Mappare tutti gli eventi activity slot (drag, assign, fatigue, failure) in un’unica pipeline telemetry con schema documentato.

PROMPT READINESS
FILE TARGET
- [nuovo] src/analytics/idleVillageActivitySlots.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/components/ActivitySlot.tsx
- [nuovo] src/ui/idleVillage/hooks/useActivitySlotTelemetry.ts — creare scaffolding prima di iniziare.
- [esistente] docs/analytics/idle_village_activity_slots.md
- [esistente] tests/unit/idleVillage/ActivitySlotTelemetry.test.tsx

DIPENDENZE
- Idle Village drop feedback system
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire schema event in nuovo modulo analytics con Zod.
2. Aggiornare componenti per emettere eventi tramite hook centralizzato.
3. Integrare PersistenceService per togglare verbose logging.
4. Documentare pipeline + mapping event → KPI.
5. Testare emissione e throttling.

OPERAZIONI VIETATE
- Non duplicare logiche di residentSlotValidators.
- Vietato usare console.log come telemetria.
- Nessun accesso diretto a window in hook (support Tauri).

ASSUNZIONI
- Telemetry bus esiste (analytics core).
- ActivitySlot ha già props per hooking events.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage src/analytics`
- `npm run test:unit -- tests/unit/idleVillage/ActivitySlotTelemetry.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; solo se mancano KPI ufficiali contattare coordinator.

KANBAN COMPLETION
1. Stato Kanban + note con schema linkato.
2. Evidence `test-results/np-016-activity-slot-telemetry-<data>.log`.
3. Log deve includere sample event JSON.

NOTE
- Prevedere export aggregator script in follow-up.
- Documentare eventuali eventi ignorati e motivo.

EVIDENCE LOG
- test-results/np-016-activity-slot-telemetry-<data>.log
```

## NP-017 – Idle Village Crew Scheduler HUD Integration
```text
AGENT
Orbit-Idle – HUD Sync

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Integrare Crew Scheduler Phase E con Active HUD fornendo indicatori stati crew, alerts e controlli rapidi config-first.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/components/ActiveHUD.tsx
- [nuovo] src/ui/idleVillage/components/CrewSchedulerHUDCard.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useCrewHUDState.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/hudCrewConfig.ts
- [esistente] tests/unit/idleVillage/CrewSchedulerHUDCard.test.tsx
- [esistente] docs/plans/idle_village_active_hud.md

DIPENDENZE
- IV-Phase12-active-hud
- Crew scheduler controllers

OPERAZIONI DA ESEGUIRE
1. Definire config (badges, thresholds, colors) + schema.
2. Creare hook aggregator per stato crew e alerts.
3. Costruire componente HUD card con controlli (pause/priority).
4. Aggiornare ActiveHUD layout e telemetria `hud_crew_card_interaction`.
5. Testare component e hook + doc sezione HUD.

OPERAZIONI VIETATE
- Non manipolare direttamente store HUD (usare hook).
- Vietato hardcodare colori (usa config).
- Nessun polling senza cleanup.

ASSUNZIONI
- ActiveHUD supporta nuovi card component.
- PersistenceService disponibile per preferenze.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/CrewSchedulerHUDCard.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se layout HUD supera 4 colonne.

KANBAN COMPLETION
1. Stato Kanban + screenshot ASCII card nel log.
2. Evidence `test-results/np-017-crew-hud-<data>.log`.
3. Note con link doc HUD aggiornato.

NOTE
- Documentare fallback per schermi piccoli.
- Annotare KPI refresh rate.

EVIDENCE LOG
- test-results/np-017-crew-hud-<data>.log
```

## NP-018 – Idle Village Crew Scheduler CLI Export
```text
AGENT
Forge-Idle – Scheduler Export

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare CLI per esportare stati Crew Scheduler in JSON/CSV, includendo timeline assegnazioni e motivi di rifiuto.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/crewSchedulerExport.ts — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/controllers/CrewSchedulerExporter.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/CrewSchedulerExporter.test.ts
- [esistente] docs/cli/idle_village_scheduler_export.md
- [esistente] data/exports/idleVillage/crew_scheduler/*.json

DIPENDENZE
- Crew scheduler determinism guard
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Creare exporter service che legge scheduler state (tick-based snapshot).
2. Implementare CLI con filtri (slot, resident, timeframe) e opzioni output.
3. Integrare schema validation sugli export + doc.
4. Aggiungere telemetria `crew_scheduler_export`.
5. Test unit CLI + doc guida.

OPERAZIONI VIETATE
- Nessun accesso a store senza tipi.
- Vietato salvare export fuori data/exports.
- Non usare JSON.stringify senza spacing configurabile.

ASSUNZIONI
- Scheduler state serializzabile.
- Node CLI lanciata da root repo.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage src/ui/idleVillage/controllers`
- `npm run test:unit -- tests/unit/idleVillage/CrewSchedulerExporter.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; stop se export supera 10 MB per run.

KANBAN COMPLETION
1. Stato Kanban aggiornato + link doc CLI.
2. Evidence `test-results/np-018-crew-export-<data>.log`.
3. Log deve includere lista file esportati.

NOTE
- Documentare come pianificare export via cron.
- Prevedere compressione opzionale (flag).

EVIDENCE LOG
- test-results/np-018-crew-export-<data>.log
```

## NP-019 – Idle Village Resident Fatigue Predictor
```text
AGENT
Spectrum-Idle – Fatigue Predictor

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare predictor config-first che stima fatigue futura dei residenti basato su telemetria e parametri scheduler, con UI sparkline e CLI export.

PROMPT READINESS
FILE TARGET
- [nuovo] src/balancing/idleVillage/FatiguePredictor.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/components/FatiguePredictorPanel.tsx
- [nuovo] src/ui/idleVillage/hooks/useFatiguePredictor.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/FatiguePredictor.test.ts
- [esistente] docs/analytics/idle_village_fatigue_predictor.md

DIPENDENZE
- Crew fatigue dashboard
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire modello predictor (weights da config) + doc.
2. Implementare servizio balancer e hook UI.
3. Costruire panel con sparkline per top 5 resident a rischio.
4. Aggiungere CLI `scripts/idleVillage/fatiguePredictorReport.ts`.
5. Testare modello con dataset sample + doc KPI.

OPERAZIONI VIETATE
- Nessun training inline con randomness non deterministica.
- Vietato salvare modelli fuori config.
- Non usare setInterval <500ms per polling.

ASSUNZIONI
- Telemetria storica disponibile (PersistenceService).
- KPI di rischio forniti dal design team.

REGRESSION SAFEGUARDS
- `npm run lint -- src/balancing src/ui/idleVillage scripts/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/FatiguePredictor.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se KPI target cambiano.

KANBAN COMPLETION
1. Stato Kanban + link doc analytics.
2. Evidence `test-results/np-019-fatigue-predictor-<data>.log`.
3. Log con estratto CLI top risk.

NOTE
- Documentare accuracy stimata.
- Prevedere fallback se telemetria mancante.

EVIDENCE LOG
- test-results/np-019-fatigue-predictor-<data>.log
```

## NP-020 – Idle Village Resident Assignment Undo UX
```text
AGENT
Echo-Idle – Undo Flow

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Migliorare UX undo/redo delle assegnazioni residenti introducendo timeline visuale, keyboard shortcuts e persistence config-first.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/components/ResidentUndoPanel.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useResidentUndo.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/residentUndoConfig.ts
- [esistente] tests/unit/idleVillage/ResidentUndoPanel.test.tsx
- [esistente] docs/plans/idle_village_plan.md (§ undo UX)

DIPENDENZE
- CF-Phase10-history-undo-hardening (pattern)
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config per timeline length, shortcuts, badges.
2. Implementare hook basato su PersistenceService per stack undo/redo.
3. Creare panel UI con timeline, diff summary e actions.
4. Aggiungere telemetry `resident_undo_performed`.
5. Testare panel/hook + doc.

OPERAZIONI VIETATE
- Non manipolare scheduler state direttamente (usare API).
- Vietato hardcodare combo key.
- Nessun setState durante render.

ASSUNZIONI
- Crew scheduler esposto per revert operations.
- UI supporta modali/side panels.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/ResidentUndoPanel.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se design richiede timeline multi-slot.

KANBAN COMPLETION
1. Stato Kanban + screenshot ASCII timeline.
2. Evidence `test-results/np-020-resident-undo-<data>.log`.
3. Log deve includere mapping shortcuts.

NOTE
- Prevedere tooltip per step timeline.
- Documentare storage retention policy.

EVIDENCE LOG
- test-results/np-020-resident-undo-<data>.log
```

## NP-021 – Idle Village Quest Reward Balancer
```text
AGENT
Oracle-Idle – Reward Tuning

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Bilanciare le ricompense quest con algoritmo weight-based, generando tabelle KPI e export JSON per Phase E.

PROMPT READINESS
FILE TARGET
- [nuovo] src/balancing/idleVillage/QuestRewardBalancer.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/components/QuestRewardTable.tsx
- [nuovo] src/ui/idleVillage/hooks/useQuestRewardBalancer.ts — creare scaffolding prima di iniziare.
- [esistente] data/presets/idleVillage/quest_rewards.json
- [esistente] tests/unit/idleVillage/QuestRewardBalancer.test.ts
- [esistente] docs/balancing/idle_village_rewards.md

DIPENDENZE
- Quest telemetry (quest_feed events)
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire schema reward config + KPI target (gold/xp/favor).
2. Implementare servizio balancer che calcola deviation vs target-turn.
3. Aggiornare UI con tabella comparativa e export JSON.
4. Aggiungere telemetria `quest_reward_balancer_run`.
5. Testare servizio + doc guidelines per designer.

OPERAZIONI VIETATE
- Nessun valore magico per reward; usare config.
- Vietato modificare preset senza migrazione documentata.
- Non usare state globali non tipizzati.

ASSUNZIONI
- KPI target forniti dal plan.
- Export salvato in test-results su richiesta.

REGRESSION SAFEGUARDS
- `npm run lint -- src/balancing src/ui/idleVillage data`
- `npm run test:unit -- tests/unit/idleVillage/QuestRewardBalancer.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se deviazioni >10% persistono dopo tuning.

KANBAN COMPLETION
1. Stato Kanban + link doc rewards.
2. Evidence `test-results/np-021-quest-reward-balancer-<data>.log`.
3. Log con snippet tabella KPI.

NOTE
- Documentare come aggiungere nuove reward category.
- Annotare delta maggiore nel log.

EVIDENCE LOG
- test-results/np-021-quest-reward-balancer-<data>.log
```

## NP-022 – Idle Village Quest Decision Heatmap
```text
AGENT
Atlas-Idle – Quest Heatmap

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare heatmap spaziale delle decisioni quest su mappa Idle Village per evidenziare congestioni e zone a bassa attività.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/components/QuestDecisionHeatmap.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useQuestDecisionHeatmap.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/questHeatmapConfig.ts
- [esistente] tests/unit/idleVillage/QuestDecisionHeatmap.test.tsx
- [esistente] docs/analytics/idle_village_quest_heatmap.md

DIPENDENZE
- Quest Decision Feed telemetry
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config (tile weights, palette, smoothing).
2. Implementare hook che aggrega decisioni per tile e caching memo.
3. Costruire componente heatmap (canvas/SVG) con legend e tooltip.
4. Aggiungere telemetria `quest_heatmap_viewed`.
5. Testare hook/UI + doc con esempi.

OPERAZIONI VIETATE
- Nessun valore magico per soglie.
- Vietato usare query DOM dirette senza ref controllati.
- Non bloccare main thread con loops >10ms (usare worker se necessario).

ASSUNZIONI
- Coordinate tile già definite nel map config.
- PersistenceService usato per ricordare ultimi filtri.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/QuestDecisionHeatmap.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; fermarsi se fps <45 in profiling.

KANBAN COMPLETION
1. Stato Kanban aggiornato + screenshot ASCII heatmap.
2. Evidence `test-results/np-022-quest-heatmap-<data>.log`.
3. Log con palette e KPI.

NOTE
- Documentare fallback per dispositivi low-end.
- Annotare possibili estensioni (filter per archetype).

EVIDENCE LOG
- test-results/np-022-quest-heatmap-<data>.log
```

## NP-023 – Idle Village Crew Scheduler Conflict Resolver
```text
AGENT
Resolve-Idle – Conflict AI

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare modulo che rileva e risolve conflitti scheduler (crew limit, fatigue, quest priority) proponendo fix config-driven.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/controllers/CrewConflictResolver.ts — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useCrewConflictResolver.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/components/CrewConflictPanel.tsx
- [esistente] tests/unit/idleVillage/CrewConflictResolver.test.ts
- [esistente] docs/plans/idle_village_phaseE_conflicts.md

DIPENDENZE
- Crew Scheduler determinism guard
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire categorie conflitti in config (crew_limit, fatigue, quest_priority).
2. Implementare resolver con suggerimenti (swap, delay, rest).
3. Creare panel UI con CTA apply/dismiss + telemetria `crew_conflict_action`.
4. Collegare hook che monitora scheduler state in tempo reale.
5. Testare logica e UI + doc flusso.

OPERAZIONI VIETATE
- Non applicare fix automatici senza conferma utente.
- Vietato modificare scheduler state fuori API.
- Nessun alert senza config corrispondente.

ASSUNZIONI
- Scheduler espone eventi conflict-ready.
- PersistenceService salva conflitti risolti.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/CrewConflictResolver.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se nuove categorie conflitto richieste.

KANBAN COMPLETION
1. Stato Kanban + link doc conflict plan.
2. Evidence `test-results/np-023-crew-conflict-<data>.log`.
3. Log con elenco conflitti campione.

NOTE
- Documentare fallback se scheduler offline.
- Prevedere CSV export per audit (flag).

EVIDENCE LOG
- test-results/np-023-crew-conflict-<data>.log
```

## NP-024 – Idle Village Map Performance Profiler
```text
AGENT
Vector-Idle – Map Perf

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare profiler integrato per IdleVillageMapPage che misura frame time, drop feedback cost, e highlight di componenti lenti.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/hooks/useMapPerformanceProfiler.ts — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/components/MapPerformanceHUD.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/mapPerformanceConfig.ts
- [esistente] tests/unit/idleVillage/MapPerformanceProfiler.test.tsx
- [esistente] docs/perf/idle_village_map_profiler.md

DIPENDENZE
- Active HUD
- drop feedback hook

OPERAZIONI DA ESEGUIRE
1. Definire KPI (frame budget, drop overlay cost) in config.
2. Implementare hook con PerformanceObserver e PersistenceService.
3. Costruire HUD con metriche live e export CSV.
4. Aggiungere telemetria `map_perf_profiler_session`.
5. Testare hook/HUD con mocking performance API + doc.

OPERAZIONI VIETATE
- Nessun accesso non controllato a window perf (support Tauri).
- Vietato lasciare profiler attivo in production build senza toggle.
- Non usare setInterval <250ms senza cleanup.

ASSUNZIONI
- Telemetria aggregator già disponibile.
- HUD può essere togglato da config/persistenza.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/MapPerformanceProfiler.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; fermarsi se profiler riduce FPS <50 di default.

KANBAN COMPLETION
1. Stato Kanban + screenshot ASCII HUD.
2. Evidence `test-results/np-024-map-profiler-<data>.log`.
3. Log con sample metrics.

NOTE
- Documentare come disattivare profiler via config.
- Annotare eventuali limitazioni su Safari.

EVIDENCE LOG
- test-results/np-024-map-profiler-<data>.log
```

## NP-025 – Idle Village Telemetry Evidence Aggregator
```text
AGENT
Trace-Idle – Evidence Bot

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Automatizzare raccolta evidenze per prompt Idle Village, aggregando output lint/test/build/kanban in log standard.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/evidenceAggregator.ts — creare scaffolding prima di iniziare.
- [nuovo] src/shared/utils/evidenceFormatter.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/scripts/EvidenceAggregator.test.ts
- [esistente] docs/infra/evidence_aggregator.md
- [esistente] test-results/templates/evidence-report-template.md

DIPENDENZE
- Node 20 + PersistenceService per preferenze
- Coordinator mandate (kanban completion)

OPERAZIONI DA ESEGUIRE
1. Definire schema evidence log (JSON + markdown) in config.
2. Implementare script che esegue comandi (lint/test/build/kanban) e salva output.
3. Creare formatter condiviso per includere metadata (prompt ID, timestamp).
4. Aggiungere CLI flags `--prompt`, `--append`, `--template`.
5. Testare script con Vitest + doc usage.

OPERAZIONI VIETATE
- Vietato eseguire comandi distruttivi.
- Non salvare log fuori test-results/.
- Nessuna dipendenza globale non presente in package.json.

ASSUNZIONI
- `source ~/.nvm/nvm.sh && nvm use 20.19.6` disponibile.
- Safeguard suite standard (lint/test/build/kanban).

REGRESSION SAFEGUARDS
- `npm run lint -- scripts src/shared/utils`
- `npm run test:unit -- tests/unit/scripts/EvidenceAggregator.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; check se servono comandi extra (Playwright/E2E).

KANBAN COMPLETION
1. Stato Kanban aggiornato + link doc.
2. Evidence `test-results/np-025-evidence-aggregator-<data>.log`.
3. Log deve includere run sample.

NOTE
- Prevedere integrazione futura con `npm run prompt:check`.
- Documentare exit codes.

EVIDENCE LOG
- test-results/np-025-evidence-aggregator-<data>.log
```

## NP-026 – Idle Village PersistenceService Audit
```text
AGENT
Vault-Idle – Persistence QA

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Audit completo delle chiamate PersistenceService in Idle Village, assicurando uso asincrono, error handling e fallback mobile-ready.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/**/* (audit)
- [esistente] src/shared/persistence/PersistenceService.ts
- [esistente] tests/unit/idleVillage/PersistenceUsage.test.ts
- [esistente] docs/infra/persistence_audit_idle_village.md

DIPENDENZE
- PersistenceService guidelines
- Storage Testing Framework

OPERAZIONI DA ESEGUIRE
1. Mappare tutte le chiamate PersistenceService nei moduli IdleVillage.
2. Creare checklist compliance (async/await, error handling, fallback).
3. Aggiornare i moduli non conformi con wrapper typed + logging.
4. Aggiungere test che verificano catch obbligatorio e fallback.
5. Documentare audit con tabella “module → status”.

OPERAZIONI VIETATE
- Nessuna chiamata diretta a localStorage/sessionStorage.
- Vietato introdurre sync wrappers.
- Non rimuovere error handling esistente.

ASSUNZIONI
- PersistenceService supporta namespaces.
- Accesso a Storage Testing Framework per QA.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage src/shared/persistence`
- `npm run test:unit -- tests/unit/idleVillage/PersistenceUsage.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se emergono moduli legacy non compatibili.

KANBAN COMPLETION
1. Stato Kanban + link doc audit.
2. Evidence `test-results/np-026-persistence-audit-<data>.log`.
3. Log con tabella moduli/risultato.

NOTE
- Allegare follow-up tasks per moduli bloccati.
- Documentare raccomandazioni per error telemetry.

EVIDENCE LOG
- test-results/np-026-persistence-audit-<data>.log
```

## NP-027 – Idle Village Crew Scheduler API Doc Sync
```text
AGENT
Scribe-Idle – API Docs

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Sincronizzare documentazione API Crew Scheduler con implementazione Phase E, generando reference markdown e esempi uso CLI.

PROMPT READINESS
FILE TARGET
- [nuovo] docs/api/crew_scheduler_reference.md — creare scaffolding prima di iniziare.
- [esistente] docs/plans/ws3-theater-controller-crew-scheduler.md (aggiornamento)
- [esistente] src/docs/docs/coordinator/strategy_tasks.md (nuova riga KPI)
- [nuovo] scripts/docs/generateCrewSchedulerAPI.ts — creare scaffolding prima di iniziare.

DIPENDENZE
- Crew scheduler determinism guard
- Strategy tasks guidelines

OPERAZIONI DA ESEGUIRE
1. Creare script che legge tipi TS e genera doc Markdown (JSDoc → table).
2. Aggiornare plan con sezione API + KPI.
3. Inserire riga in strategy_tasks con Task ID e KPI.
4. Documentare esempi CLI (export, snapshot).
5. Verificare lint doc e aggiungere evidence.

OPERAZIONI VIETATE
- Non duplicare definizioni (USARE tipi reali).
- Vietato lasciare doc outdated (controllo timestamp).
- Nessuna modifica al codice scheduler oltre doc script.

ASSUNZIONI
- TS compiler API disponibile.
- Doc generata finisce sotto docs/api.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/docs`
- `npm run build:check`
- `npm run kanban:lint`
- (Script doc) `npm run test -- scripts/docs/generateCrewSchedulerAPI.ts` se previsto

AUTONOMIA & CHECK-IN
- Autonomia Alta; check se coordinator richiede formato diverso.

KANBAN COMPLETION
1. Stato Kanban + link doc + strategy entry.
2. Evidence `test-results/np-027-crew-api-doc-<data>.log`.
3. Log con snippet doc generata.

NOTE
- Documentare comando per rigenerare doc.
- Evidenziare KPI in strategy table.

EVIDENCE LOG
- test-results/np-027-crew-api-doc-<data>.log
```

## NP-028 – Idle Village Quest Risk Telemetry Export CLI
```text
AGENT
Pulse-Idle – Risk Exporter

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare CLI che esporta telemetria quest risk (injury/death) in CSV/JSON per analisi esterne, con filtri config-first.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/questRiskExport.ts — creare scaffolding prima di iniziare.
- [nuovo] src/analytics/idleVillageQuestRisk.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/QuestRiskExport.test.ts
- [esistente] docs/cli/idle_village_quest_risk_export.md
- [esistente] data/exports/idleVillage/quest_risk/*.csv

DIPENDENZE
- IV-QuestRisk-stripes
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire schema evento risk e filtri (questId, risk level, date range).
2. Implementare CLI con output CSV/JSON e support evidence log.
3. Integrare telemetria `quest_risk_export_run`.
4. Documentare guida e KPI (es. esport success rate).
5. Scrivere test CLI/hook + sample export.

OPERAZIONI VIETATE
- Nessuna query sincrona su file grandi (usare stream).
- Vietato esportare dati sensibili (solo KPI).
- Non scrivere fuori data/exports/.

ASSUNZIONI
- Telemetry logs disponibili localmente.
- Node 20 supporta stream promesse.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage src/analytics`
- `npm run test:unit -- tests/unit/idleVillage/QuestRiskExport.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; sync se serve formato supplementare (Parquet, ecc.).

KANBAN COMPLETION
1. Stato Kanban + link doc CLI.
2. Evidence `test-results/np-028-quest-risk-export-<data>.log`.
3. Log con lista file esportati.

NOTE
- Prevedere opzione `--append` vs `--overwrite`.
- Documentare tempi medi export.

EVIDENCE LOG
- test-results/np-028-quest-risk-export-<data>.log
```

## NP-029 – Idle Village Quest Narrative Hooks Refactor
```text
AGENT
Story-Idle – Narrative Hooks

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Refactor hook narrativi quest separando config e logica UI, garantendo JSDoc e PersistenceService per preferenze narrative.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/hooks/useQuestNarrative.ts (refactor)
- [nuovo] src/ui/idleVillage/config/questNarrativeConfig.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/components/QuestNarrativePanel.tsx
- [esistente] tests/unit/idleVillage/QuestNarrativeHook.test.ts
- [esistente] docs/story/idle_village_narrative.md

DIPENDENZE
- Quest Decision Feed
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Estrarre config narrative (text templates, mood tags, risk highlights).
2. Refactor hook per usare config + PersistenceService per preferenze.
3. Aggiornare panel UI con grouping e telemetria `quest_narrative_rendered`.
4. Scrivere test su template interpolation e persistence.
5. Update doc storytelling guidelines.

OPERAZIONI VIETATE
- Vietato hardcodare stringhe narrative direttamente nel componente.
- Nessun accesso ai file docs durante runtime.
- Non modificare decision feed logic.

ASSUNZIONI
- Strings multilingua non richieste in questa fase.
- Panel supporta markdown limitato.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/QuestNarrativeHook.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se design richiede tag extra.

KANBAN COMPLETION
1. Stato Kanban + link doc narrative.
2. Evidence `test-results/np-029-quest-narrative-<data>.log`.
3. Log con sample narrative entry.

NOTE
- Documentare fallback se config mancante.
- Annotare come aggiungere nuove mood tag.

EVIDENCE LOG
- test-results/np-029-quest-narrative-<data>.log
```

## NP-030 – Idle Village Quest Timeline Renderer

```text
AGENT
Chronicle-Idle – Quest Timeline

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare renderer timeline quest (gantt-like) con eventi assignment, completion e risk spikes, integrando telemetria e export.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/components/QuestTimeline.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useQuestTimeline.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/questTimelineConfig.ts
- [esistente] tests/unit/idleVillage/QuestTimeline.test.tsx
- [esistente] docs/analytics/idle_village_quest_timeline.md

DIPENDENZE
- Quest feed + risk telemetry
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config timeline (time window, color tokens, risk markers).
2. Implementare hook che aggrega eventi e supporta zoom/pan.
3. Costruire componente timeline con clusters, tooltips e freeze lines.
4. Telemetria `quest_timeline_viewed/exported`.
5. Testare hook/UI + doc con KPI.

OPERAZIONI VIETATE
- Nessuna manipolazione diretta di DOM senza refs.
- Vietato usare setTimeout senza cleanup per animazioni.
- Non hardcodare dimensioni; usare config responsive.

ASSUNZIONI
- Data quest contiene timestamp ISO.
- Export JSON possibile per analytics.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/QuestTimeline.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; fermarsi se performance <30fps durante pan.

KANBAN COMPLETION
1. Stato Kanban + screenshot ASCII timeline.
2. Evidence `test-results/np-030-quest-timeline-<data>.log`.
3. Log con snippet export JSON.

NOTE
- Prevedere overlay per risk spikes (usa risk config).
- Documentare gesture keyboard/mouse.

EVIDENCE LOG
- test-results/np-030-quest-timeline-<data>.log
```

## NP-031 – Idle Village Map Layer Configuration DSL

```text
AGENT
Atlas-Idle – Layer Architect

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Introdurre DSL config-first per definire layer mappa (terrain, quest, risk) con validazioni automatiche e preview CLI.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/config/mapLayerConfig.ts (nuovo, Zod)
- [nuovo] src/ui/idleVillage/hooks/useMapLayerConfig.ts — creare scaffolding prima di iniziare.
- [esistente] scripts/idleVillage/mapLayerPreview.ts
- [esistente] tests/unit/idleVillage/MapLayerConfig.test.ts
- [esistente] docs/maps/idle_village_layer_dsl.md

DIPENDENZE
- Idle Village map heatmap
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire DSL (tick {value, weight}) per layer + schema.
2. Implementare hook che carica layer da config + PersistenceService.
3. Costruire CLI preview (ASCII) per QA.
4. Aggiornare map components per leggere layer file.
5. Scrivere test su validazioni + doc guida DSL.

OPERAZIONI VIETATE
- Vietato hardcodare layer order.
- No eval dinamici in DSL parser.
- Nessuna scrittura su file fuori data/.

ASSUNZIONI
- Layer file versionato in git.
- Designer usa JSON/YAML definito nel doc.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage scripts/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/MapLayerConfig.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se DSL necessita feature extra (conditions).

KANBAN COMPLETION
1. Stato Kanban + link doc DSL.
2. Evidence `test-results/np-031-map-layer-dsl-<data>.log`.
3. Log con sample CLI preview.

NOTE
- Documentare backward compatibility.
- Annotare step per aggiungere nuovi layer type.

EVIDENCE LOG
- test-results/np-031-map-layer-dsl-<data>.log
```

## NP-032 – Idle Village Weather Impact Simulation

```text
AGENT
Nimbus-Idle – Weather Ops

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Simulare impatto meteo sulle attività (success rate, fatigue) con config centralizzato, UI overlay e telemetry.

PROMPT READINESS
FILE TARGET
- [nuovo] src/balancing/idleVillage/WeatherImpactSimulator.ts — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useWeatherImpact.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/components/WeatherImpactOverlay.tsx
- [esistente] src/ui/idleVillage/config/weatherImpactConfig.ts
- [esistente] tests/unit/idleVillage/WeatherImpactSimulator.test.ts
- [esistente] docs/plans/idle_village_plan.md (§ weather)

DIPENDENZE
- Map layer config
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config (weather states, multipliers, durations) + schema.
2. Implementare simulatore che produce adjustments su activities.
3. Creare hook/overlay con toggle e telemetry `weather_impact_applied`.
4. Integrare persistence per preferenze meteo.
5. Testare logic/UI + documentare KPI.

OPERAZIONI VIETATE
- Non usare randomness non seedata.
- Vietato alterare scheduler state fuori API.
- Nessun valore magico per thresholds; tutto in config.

ASSUNZIONI
- Telemetry bus per weather events disponibile.
- Designer fornisce baseline tabelle.

REGRESSION SAFEGUARDS
- `npm run lint -- src/balancing src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/WeatherImpactSimulator.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se design richiede UI alternative (cards).

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-032-weather-impact-<data>.log`.
2. Note con screenshot ASCII overlay.
3. Documentare settaggi default.

NOTE
- Prevedere CLI per rigenerare dataset (follow-up).
- Annotare performance se overlay >16 ms.

EVIDENCE LOG
- test-results/np-032-weather-impact-<data>.log
```

## NP-033 – Idle Village Quest Narrative Telemetry Correlator

```text
AGENT
Lyric-Idle – Story Metrics

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Correlare narrazioni quest con outcome KPI creando dashboard e export CSV per comparare scelte narrative e success rates.

PROMPT READINESS
FILE TARGET
- [nuovo] src/analytics/idleVillageQuestNarrative.ts — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/components/QuestNarrativeTelemetryPanel.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useQuestNarrativeTelemetry.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/QuestNarrativeTelemetry.test.tsx
- [esistente] docs/analytics/idle_village_story_metrics.md

DIPENDENZE
- Quest narrative refactor
- Quest reward balancer

OPERAZIONI DA ESEGUIRE
1. Mappare eventi narrative -> outcome (risk, reward) con schema Zod.
2. Implementare hook aggregator con PersistenceService per filtri.
3. Costruire panel con charts (bars/sparklines) e export CSV.
4. Telemetria `quest_story_panel_viewed/exported`.
5. Test unit (aggregation) + doc storie KPI.

OPERAZIONI VIETATE
- Vietato loggare stringhe narrative raw senza sanitizzazione.
- Nessun join manuale su store non typed.
- Non bloccare UI con heavy calculations (usare workers/memo).

ASSUNZIONI
- Story events includono questId e branch.
- Analytics pipeline già supporta CSV exports.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage src/analytics`
- `npm run test:unit -- tests/unit/idleVillage/QuestNarrativeTelemetry.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; confermare KPI finali con coordinator.

KANBAN COMPLETION
1. Stato Kanban + evidence log.
2. Allegare `test-results/np-033-quest-story-metrics-<data>.log`.
3. Log con esempio CSV snippet.

NOTE
- Documentare retention policy per narrative data.
- Annotare follow-up per anomaly detection.

EVIDENCE LOG
- test-results/np-033-quest-story-metrics-<data>.log
```

## NP-034 – Idle Village Resident Personality Config

```text
AGENT
Persona-Idle – Personality Matrix

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Formalizzare config personality residenti (traits, preferences, fatigue modifiers) e integrarla con scheduler + UI badges.

PROMPT READINESS
FILE TARGET
- [nuovo] src/balancing/idleVillage/residentPersonalityConfig.ts — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useResidentPersonality.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/components/ResidentPersonalityBadge.tsx
- [esistente] tests/unit/idleVillage/ResidentPersonality.test.tsx
- [esistente] docs/balancing/idle_village_personality.md

DIPENDENZE
- Crew scheduler
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire schema traits, weights e compatibility rules.
2. Integrare scheduler per usare modifiers da config.
3. Creare badge UI + tooltip e telemetria `resident_personality_viewed`.
4. PersistenceService per determinare preferenze display.
5. Test logica/ UI + doc.

OPERAZIONI VIETATE
- Non hardcodare trait multipliers.
- Vietato mutare resident data senza API.
- Nessun fallback silenzioso: log error se config mancante.

ASSUNZIONI
- Data resident già include trait IDs.
- UI supporta emoji/symbol in badges.

REGRESSION SAFEGUARDS
- `npm run lint -- src/balancing src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/ResidentPersonality.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; design deve approvare palette badge.

KANBAN COMPLETION
1. Stato Kanban aggiornato + screenshot ASCII badge.
2. Evidence `test-results/np-034-resident-personality-<data>.log`.
3. Note con link doc.

NOTE
- Documentare come aggiungere nuovi tratti.
- Annotare eventuali mismatch config/stats.

EVIDENCE LOG
- test-results/np-034-resident-personality-<data>.log
```

## NP-035 – Idle Village Mobile Responsiveness Hardening

```text
AGENT
Orbit-Idle – Mobile Ops

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Rendere Idle Village UI pienamente responsive (tablet/mobile) con layout tokens, breakpoints config-first, e suite Playwright mobile.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/styles/responsiveTokens.ts
- [esistente] src/ui/idleVillage/components/** (audit)
- [esistente] tests/e2e/idleVillage/MobileResponsiveness.spec.ts
- [esistente] docs/ui/idle_village_responsive.md

DIPENDENZE
- Style Laboratory tokens
- PersistenceService (remember layout choices)

OPERAZIONI DA ESEGUIRE
1. Definire responsive tokens + breakpoints in config file.
2. Audit componenti principali e applicare layout condizionale.
3. Aggiungere toggle layout (compact/expanded) con PersistenceService.
4. Scrivere Playwright spec (Chrome + Safari mobile) con KPI <3s.
5. Documentare guidelines responsive.

OPERAZIONI VIETATE
- Vietato usare media query inline non tipizzate.
- Nessun hardcoded pixel value fuori config.
- Non disabilitare features per mobile senza doc.

ASSUNZIONI
- Theme tokens supportano viewport queries.
- Playwright devices già configurati.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:e2e -- tests/e2e/idleVillage/MobileResponsiveness.spec.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se design richiede layout extra.

KANBAN COMPLETION
1. Stato Kanban + link doc responsive.
2. Evidence `test-results/np-035-mobile-responsive-<data>.log`.
3. Log include output Playwright.

NOTE
- Documentare fallback per browsers legacy.
- Annotare eventuali componenti esclusi.

EVIDENCE LOG
- test-results/np-035-mobile-responsive-<data>.log
```

## NP-036 – Idle Village Audio Cue Configurator

```text
AGENT
Chime-Idle – Audio Signals

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Configurare audio cues per eventi chiave (drop success/fail, quest risk) tramite config centralizzato e mixer hook.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/config/audioCueConfig.ts
- [nuovo] src/ui/idleVillage/hooks/useAudioCues.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/utils/audioCuePlayer.ts
- [esistente] tests/unit/idleVillage/AudioCueConfig.test.ts
- [esistente] docs/audio/idle_village_audio_cues.md

DIPENDENZE
- Quest risk stripes
- Drop feedback telemetry

OPERAZIONI DA ESEGUIRE
1. Definire config (events, files, cooldown) + schema.
2. Implementare hook + player con PersistenceService (mute preferences).
3. Collegare eventi UI (drop, HUD, quest) all’audio via config map.
4. Telemetria `audio_cue_played`.
5. Test config + fallback (no audio) e doc.

OPERAZIONI VIETATE
- Vietato caricare file audio inline (usare assets config).
- Nessun autoplay senza user interaction.
- Non salvare preferenze fuori PersistenceService.

ASSUNZIONI
- Assets già disponibili in public/assets/audio.
- Browser support WebAudio API.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/AudioCueConfig.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se servono nuovi asset.

KANBAN COMPLETION
1. Stato Kanban + evidence log.
2. Allegare `test-results/np-036-audio-cues-<data>.log`.
3. Note con mappa event→audio.

NOTE
- Documentare fallback silent mode.
- Annotare dimensione totale assets.

EVIDENCE LOG
- test-results/np-036-audio-cues-<data>.log
```

## NP-037 – Idle Village Worker Attrition Simulator

```text
AGENT
Flux-Idle – Attrition Simulator

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Simulare attrition dei worker in base a fatigue/performance introducendo config scenario, CLI e report.

PROMPT READINESS
FILE TARGET
- [nuovo] src/balancing/idleVillage/WorkerAttritionSimulator.ts — creare scaffolding prima di iniziare.
- [esistente] scripts/idleVillage/attritionReport.ts
- [esistente] tests/unit/idleVillage/WorkerAttritionSimulator.test.ts
- [esistente] docs/analytics/idle_village_attrition.md
- [esistente] data/runs/idleVillage/attrition/*.json

DIPENDENZE
- Crew scheduler
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire schema scenario (duration, fatigue thresholds, morale).
2. Implementare simulatore + CLI export JSON/CSV.
3. Salvare risultati in data/runs + telemetria `attrition_sim_completed`.
4. Documentare interpretazione KPI.
5. Testare scenario base + doc.

OPERAZIONI VIETATE
- Nessuna scrittura fuori data/runs.
- Vietato usare RNG non seedato.
- Non bloccare CLI senza spinner/logging.

ASSUNZIONI
- Designer forniscono baseline thresholds.
- Node 20 per CLI.

REGRESSION SAFEGUARDS
- `npm run lint -- src/balancing scripts/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/WorkerAttritionSimulator.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; ping se scenario >10k iterations rallenta >5s.

KANBAN COMPLETION
1. Stato Kanban + link doc.
2. Evidence `test-results/np-037-attrition-sim-<data>.log`.
3. Log con sample output.

NOTE
- Prevedere flag `--preset`.
- Documentare come aggiornare dataset.

EVIDENCE LOG
- test-results/np-037-attrition-sim-<data>.log
```

## NP-038 – Idle Village Crew Scheduler Time Travel Tool

```text
AGENT
Chrono-Idle – Time Travel

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare tool per navigare timeline scheduler (rewind/fast-forward) con snapshot config-first e PersistenceService caching.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/tools/CrewTimeTravelTool.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useCrewTimeTravel.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/timeTravelConfig.ts
- [esistente] tests/unit/idleVillage/CrewTimeTravelTool.test.tsx
- [esistente] docs/plans/idle_village_plan.md (§ time travel)

DIPENDENZE
- Crew scheduler history store
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config (max snapshots, diff strategy, playback speed).
2. Implementare hook per caricare snapshot (PersistenceService).
3. Creare UI tool con timeline slider e preview panel.
4. Telemetria `crew_time_travel_action`.
5. Test hooking + doc.

OPERAZIONI VIETATE
- Non salvare snapshot senza compressione config.
- Vietato manipolare scheduler live fuori API.
- Nessun setInterval senza cleanup.

ASSUNZIONI
- History store già persistito.
- UI supporta modali/sidebars.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/CrewTimeTravelTool.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se storage footprint >5 MB.

KANBAN COMPLETION
1. Stato Kanban + screenshot ASCII timeline.
2. Evidence `test-results/np-038-crew-time-travel-<data>.log`.
3. Log con instructions playback.

NOTE
- Documentare TTL snapshot.
- Annotare eventuali performance issues.

EVIDENCE LOG
- test-results/np-038-crew-time-travel-<data>.log
```

## NP-039 – Idle Village Scheduler Telemetry Alerting

```text
AGENT
Sentinel-Idle – Telemetry Alerts

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare sistema alert config-first per KPI scheduler (fatigue spikes, failure rate) con notifications e CLI summary.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/config/schedulerAlertConfig.ts
- [nuovo] src/ui/idleVillage/hooks/useSchedulerAlerts.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/components/SchedulerAlertCenter.tsx
- [esistente] tests/unit/idleVillage/SchedulerAlerts.test.tsx
- [esistente] scripts/idleVillage/schedulerAlertSummary.ts

DIPENDENZE
- Scheduler telemetry mapper
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire alert rules + severity in config.
2. Implementare hook che valuta KPI e invia notifiche (UI + CLI).
3. Telemetria `scheduler_alert_triggered`.
4. CLI summary per `test-results/`.
5. Test rules/hook + doc.

OPERAZIONI VIETATE
- Nessun alert senza config entry.
- Vietato mutare scheduler state.
- Non spammare notifications (cooldown in config).

ASSUNZIONI
- Telemetry data stream accessibile.
- PersistenceService per mute alerts.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage scripts/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/SchedulerAlerts.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se KPI threshold contesi.

KANBAN COMPLETION
1. Stato Kanban + evidence log.
2. `test-results/np-039-scheduler-alerts-<data>.log`.
3. Note con screenshot ASCII alert center.

NOTE
- Documentare ack workflow.
- Annotare future integration (Slack/email) come follow-up.

EVIDENCE LOG
- test-results/np-039-scheduler-alerts-<data>.log
```

## NP-040 – Idle Village Scenario Task Planner Documentation

```text
AGENT
Scribe-Idle – Scenario Docs

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Produrre documentazione dettagliata per scenario planner Idle Village (Phase E) con KPI, file target e guida QA, includendo strategy_tasks entry.

PROMPT READINESS
FILE TARGET
- [nuovo] docs/plans/idle_village_scenario_planner.md — creare scaffolding prima di iniziare.
- [esistente] src/docs/docs/coordinator/strategy_tasks.md (nuova riga)
- [esistente] docs/analytics/idle_village_plan_appendix.md

DIPENDENZE
- Coordinator mandate (strategy tasks)
- Phase E plan

OPERAZIONI DA ESEGUIRE
1. Raccogliere input esistenti (plans, telemetry) e creare doc full.
2. Mappare KPI (fatigue, risk) e file target.
3. Aggiornare strategy_tasks con Task ID/KPI.
4. Inserire link e referenze incrociate nel plan principale.
5. Validare doc con markdownlint + provide evidence log.

OPERAZIONI VIETATE
- Non introdurre nuove feature (solo doc).
- Vietato omettere sezione KPI.
- Nessun riferimento a ambienti non esistenti.

ASSUNZIONI
- Plan Phase E aggiornato.
- strategy_tasks file accessibile.

REGRESSION SAFEGUARDS
- `npm run lint -- docs --max-warnings=0`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; ping se strategie mancanti.

KANBAN COMPLETION
1. Stato Kanban + link doc + strategy entry.
2. Evidence `test-results/np-040-scenario-docs-<data>.log`.
3. Log includerà markdownlint output.

NOTE
- Documentare processi per aggiornare doc.
- Annotare follow-up tasks.

EVIDENCE LOG
- test-results/np-040-scenario-docs-<data>.log
```

## NP-041 – Idle Village Risk Simulation CLI Refactor

```text
AGENT
Vector-Idle – Risk CLI

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Refactor della CLI risk simulation per supportare preset multipli, streaming output e evidence log automatici.

PROMPT READINESS
FILE TARGET
- [esistente] scripts/idleVillage/riskSimulation.ts
- [nuovo] src/balancing/idleVillage/riskSimulationConfig.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/RiskSimulationCLI.test.ts
- [esistente] docs/cli/idle_village_risk_simulation.md

DIPENDENZE
- Quest risk stripes
- Scenario runner config

OPERAZIONI DA ESEGUIRE
1. Estrarre config CLI (preset, iterations, smoothing) in file dedicato.
2. Aggiornare script per supportare streaming progress + `--preset`.
3. Scrivere test CLI (Vitest) con fixture YAML/JSON.
4. Documentare usage e KPI in doc.
5. Integrare logging automatico in `test-results/`.

OPERAZIONI VIETATE
- Nessun I/O sincrono bloccante.
- Vietato salvare log fuori test-results/.
- Non introdurre dependencies globali non presenti.

ASSUNZIONI
- Node 20 attivo.
- Dataset risk disponibile.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage src/balancing/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/RiskSimulationCLI.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; segnalare se preset >10 costano troppo.

KANBAN COMPLETION
1. Stato Kanban aggiornato.
2. Evidence `test-results/np-041-risk-cli-<data>.log`.
3. Log include snippet streaming.

NOTE
- Documentare flag `--append-log`.
- Annotare limitazioni dataset.

EVIDENCE LOG
- test-results/np-041-risk-cli-<data>.log
```

## NP-042 – Idle Village Drag Accessibility Audit

```text
AGENT
Helios-Idle – Drag A11y

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Audit accessibilità drag/drop Idle Village (keyboard path, ARIA) con fix e test `jest-axe`.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/components/MapLocationSlot.tsx
- [esistente] src/ui/idleVillage/components/WorkerCard.tsx
- [nuovo] src/ui/idleVillage/hooks/useDragAccessibility.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/DragAccessibility.test.tsx
- [esistente] docs/a11y/idle_village_drag.md

DIPENDENZE
- Drag feedback system
- Accessibility guidelines

OPERAZIONI DA ESEGUIRE
1. Mappare focus order + shortcuts.
2. Implementare hook per ARIA attributes e keyboard triggers.
3. Aggiornare componenti per usare hook e tokens config.
4. Scrivere test `jest-axe` e doc checklist.
5. Registrare telemetria `drag_a11y_toggle`.

OPERAZIONI VIETATE
- Nessun removal di gesture pointer.
- Vietato disattivare focus outline.
- Non introdurre hack CSS inline.

ASSUNZIONI
- Accessibility lint attivo.
- Style tokens supportano high contrast.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/DragAccessibility.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se serve supporto screen reader specifico.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-042-drag-a11y-<data>.log`.
2. Note con difetti principali e fix.
3. Allegare output jest-axe.

NOTE
- Documentare fallback per dispositivi solo touch.
- Annotare open issues (se restano).

EVIDENCE LOG
- test-results/np-042-drag-a11y-<data>.log
```

## NP-043 – Idle Village Scheduler Stress Telemetry Dashboard

```text
AGENT
Pulse-Idle – Scheduler Stress

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Dashboard per visualizzare stress scheduler (queue length, retries, latency) con grafici e export PNG.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/components/SchedulerStressDashboard.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useSchedulerStressData.ts — creare scaffolding prima di iniziare.
- [esistente] src/analytics/idleVillageSchedulerStress.ts
- [esistente] tests/unit/idleVillage/SchedulerStressDashboard.test.tsx
- [esistente] docs/analytics/idle_village_scheduler_stress.md

DIPENDENZE
- Scheduler telemetry
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire dataset KPI (queue, retries) e schema.
2. Implementare hook con caching e smoothing.
3. Costruire dashboard (charts + export PNG).
4. Telemetria `scheduler_stress_dashboard_viewed/exported`.
5. Test data transforms + doc.

OPERAZIONI VIETATE
- No inline thresholds; usare config.
- Vietato export fuori test-results per PNG.
- Non bloccare UI (usare requestIdleCallback se serve).

ASSUNZIONI
- Chart lib già disponibile.
- PNG export via html-to-image (già installato).

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage src/analytics`
- `npm run test:unit -- tests/unit/idleVillage/SchedulerStressDashboard.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se KPI nuovi.

KANBAN COMPLETION
1. Stato Kanban + screenshot ASCII.
2. Evidence `test-results/np-043-scheduler-stress-<data>.log`.
3. Log include export path.

NOTE
- Documentare refresh rate e costi performance.
- Annotare future expansion (alerts).

EVIDENCE LOG
- test-results/np-043-scheduler-stress-<data>.log
```

## NP-044 – Idle Village Localization Infrastructure Bootstrap

```text
AGENT
Lingua-Idle – L10n Core

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Preparare infrastruttura di localizzazione (i18n) per Idle Village con config JSON, hooks e CLI extractor.

PROMPT READINESS
FILE TARGET
- [nuovo] src/i18n/idleVillage/i18nConfig.ts — creare scaffolding prima di iniziare.
- [esistente] src/i18n/idleVillage/hooks/useIdleI18n.ts
- [esistente] scripts/idleVillage/i18nExtractor.ts
- [esistente] tests/unit/idleVillage/I18nConfig.test.ts
- [esistente] docs/i18n/idle_village_localization.md

DIPENDENZE
- PersistenceService (remember language)
- Config-first guidelines

OPERAZIONI DA ESEGUIRE
1. Definire config (namespaces, languages) + schema.
2. Implementare hook per lookup + fallbacks.
3. Creare CLI extractor (tsx → JSON) con ignore list.
4. Aggiornare componenti critici (HUD, quests) per usare hook.
5. Scrivere test e doc quickstart.

OPERAZIONI VIETATE
- No stringhe inline dopo refactor.
- Vietato manipolare DOM per traduzioni.
- Nessun fallback a localStorage.

ASSUNZIONI
- Base language IT.
- JSON translation files in `src/i18n/idleVillage/locales`.

REGRESSION SAFEGUARDS
- `npm run lint -- src/i18n src/ui/idleVillage scripts/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/I18nConfig.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se nuove lingue richiedono alph customization.

KANBAN COMPLETION
1. Stato Kanban + link doc L10n.
2. Evidence `test-results/np-044-idle-i18n-<data>.log`.
3. Log include output extractor.

NOTE
- Documentare fallback per chiavi mancanti.
- Annotare come aggiungere nuove lingue.

EVIDENCE LOG
- test-results/np-044-idle-i18n-<data>.log
```

## NP-045 – Idle Village Telemetry Consent Banner

```text
AGENT
Guardian-Idle – Consent Flow

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare banner consenso telemetria per Idle Village (desktop/mobile) con config KPIs, PersistenceService e evidence log.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/components/TelemetryConsentBanner.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useTelemetryConsent.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/telemetryConsentConfig.ts
- [esistente] tests/unit/idleVillage/TelemetryConsent.test.tsx
- [esistente] docs/privacy/idle_village_consent.md

DIPENDENZE
- Consent guidelines (Punch Club)
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config (copy, TTL, KPI target).
2. Implementare hook + component con states (pending/accepted/declined).
3. Integrare telemetria `telemetry_consent_prompt`/`accepted`.
4. Scrivere test + doc.
5. Aggiornare App entrypoint per mostrare banner.

OPERAZIONI VIETATE
- Nessuna autop accettazione.
- Vietato salvare stato fuori PersistenceService.
- Non bloccare UI principale dopo accettazione.

ASSUNZIONI
- UI supporta layering banner.
- Evidence log richiesto.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/TelemetryConsent.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se copy legale cambia.

KANBAN COMPLETION
1. Stato Kanban + link doc privacy.
2. Evidence `test-results/np-045-telemetry-consent-<data>.log`.
3. Log include KPI acceptance.

NOTE
- Documentare fallback se PersistenceService fallisce.
- Annotare capturing screenshot ASCII.

EVIDENCE LOG
- test-results/np-045-telemetry-consent-<data>.log
```

## NP-046 – STS Archetype Synergy Storyboard

```text
AGENT
Glyph-STS – Synergy Storyboard

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire storyboard interattivo per visualizzare sinergie archetype (pacing, mana, outcome) con config-first layout.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/sts/components/ArchetypeSynergyStoryboard.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/tools/sts/hooks/useArchetypeSynergy.ts — creare scaffolding prima di iniziare.
- [esistente] src/balancing/config/sts/archetypeSynergyConfig.ts
- [esistente] tests/unit/sts/ArchetypeSynergyStoryboard.test.tsx
- [esistente] docs/analytics/sts_archetype_synergy.md

DIPENDENZE
- Scenario runner
- Telemetry dashboard

OPERAZIONI DA ESEGUIRE
1. Definire config (metrics, thresholds, colors).
2. Implementare hook che aggrega dati synergy (pairScore, expectedScore).
3. Creare storyboard UI (panels + timeline).
4. Telemetria `sts_synergy_storyboard_viewed`.
5. Test + doc guida.

OPERAZIONI VIETATE
- No inline thresholds.
- Vietato duplicare logica synergy calculator.
- Nessuna query non tipizzata.

ASSUNZIONI
- Data synergy disponibile da scenario runner.
- UI supporta scroll/pan.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts src/balancing/config/sts`
- `npm run test:unit -- tests/unit/sts/ArchetypeSynergyStoryboard.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se designer richiede layout alternativo.

KANBAN COMPLETION
1. Stato Kanban + screenshot ASCII.
2. Evidence `test-results/np-046-sts-synergy-storyboard-<data>.log`.
3. Log include sample metrics.

NOTE
- Documentare come esportare storyboard (PNG).
- Annotare performance >16 ms.

EVIDENCE LOG
- test-results/np-046-sts-synergy-storyboard-<data>.log
```

## NP-047 – STS Simulator CLI Automation Suite

```text
AGENT
Forge-STS – CLI Ops

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Automatizzare suite CLI (scenarioRunner, combatReplay, damageGuard) con orchestratore e templates evidence log.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/sts/cliAutomation.ts — creare scaffolding prima di iniziare.
- [esistente] scripts/sts/config/cliAutomationConfig.ts
- [esistente] tests/unit/sts/CLIAutomation.test.ts
- [esistente] docs/cli/sts_cli_automation.md
- [esistente] test-results/templates/sts_cli_automation.md

DIPENDENZE
- Scenario runner CLI
- Combat replay CLI

OPERAZIONI DA ESEGUIRE
1. Definire config (commands, env, thresholds).
2. Implementare orchestratore con task queue + telemetry.
3. Scrivere test per orchestrazione e error handling.
4. Documentare usage + evidence log workflow.
5. Opzionale: integrare con `npm run prompt:check`.

OPERAZIONI VIETATE
- Nessuna esecuzione parallela senza config permesso.
- Vietato modificare CLI originali.
- Non salvare log fuori test-results/.

ASSUNZIONI
- Node 20.
- CLI esistenti hanno script entry.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/sts`
- `npm run test:unit -- tests/unit/sts/CLIAutomation.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; ping se servono comandi extra.

KANBAN COMPLETION
1. Stato Kanban + link doc.
2. Evidence `test-results/np-047-sts-cli-automation-<data>.log`.
3. Log include sample run summary.

NOTE
- Documentare scheduler strategy (serial vs parallel).
- Annotare fallback se un comando fallisce.

EVIDENCE LOG
- test-results/np-047-sts-cli-automation-<data>.log
```

## NP-048 – STS PersistenceService Telemetry Bridge

```text
AGENT
Vault-STS – Persistence Bridge

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare bridge tra PersistenceService e telemetry STS per monitorare salvataggi preset, con alert su errori e CLI diagnostica.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/sts/hooks/usePersistenceTelemetry.ts — creare scaffolding prima di iniziare.
- [esistente] src/analytics/stsPersistenceTelemetry.ts
- [esistente] scripts/sts/persistenceTelemetryReport.ts
- [esistente] tests/unit/sts/PersistenceTelemetry.test.ts
- [esistente] docs/infra/sts_persistence_monitoring.md

DIPENDENZE
- PersistenceService guidelines
- STS config tools

OPERAZIONI DA ESEGUIRE
1. Definire schema eventi (save success/error) con metadata.
2. Implementare hook/analytics che inviano telemetry su operazioni PersistenceService.
3. Creare CLI report per analizzare log.
4. Testare emissione eventi + doc.
5. Aggiornare config per thresholds alert.

OPERAZIONI VIETATE
- Non loggare dati sensibili (solo metadata).
- Vietato bloccare salvataggi.
- Nessun fallback a localStorage.

ASSUNZIONI
- PersistenceService già async.
- Telemetry core accetta nuovi eventi.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts src/analytics scripts/sts`
- `npm run test:unit -- tests/unit/sts/PersistenceTelemetry.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se serve alerting esterno.

KANBAN COMPLETION
1. Stato Kanban + evidence log.
2. `test-results/np-048-sts-persistence-telemetry-<data>.log`.
3. Log include CLI sample.

NOTE
- Documentare fallback se telemetry offline.
- Annotare eventuali errori noti.

EVIDENCE LOG
- test-results/np-048-sts-persistence-telemetry-<data>.log
```

## NP-049 – STS Visual Regression Screenshot Pipeline

```text
AGENT
Aurora-STS – Visual QA

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Configurare pipeline screenshot/regressione STS UI (Componenti + Dashboard) con Playwright visual diff e storage config.

PROMPT READINESS
FILE TARGET
- [esistente] tests/visual/sts/visualRegression.spec.ts
- [esistente] tests/visual/sts/config/visualConfig.ts
- [esistente] scripts/sts/visualBaselineManager.ts
- [esistente] docs/tests/sts_visual_regression.md
- [esistente] test-results/sts_visual_regression/*.md

DIPENDENZE
- Playwright setup
- Style Laboratory tokens

OPERAZIONI DA ESEGUIRE
1. Definire config baseline (resolution, theme).
2. Implementare spec con step (load, wait, snapshot).
3. Creare manager CLI per baselines (approve/reset).
4. Documentare workflow + evidence log.
5. Aggiornare CI instructions se serve.

OPERAZIONI VIETATE
- Nessuna modifica agli asset di produzione.
- Vietato salvare baseline fuori tests/visual.
- Non ignorare diff >1% senza commento log.

ASSUNZIONI
- Playwright installato.
- Storage per baseline esiste.

REGRESSION SAFEGUARDS
- `npm run lint -- tests/visual scripts/sts`
- `npm run test:visual -- tests/visual/sts/visualRegression.spec.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se servono view extra.

KANBAN COMPLETION
1. Stato Kanban a completato.
2. Evidence `test-results/np-049-sts-visual-qa-<data>.log`.
3. Log con diff summary.

NOTE
- Documentare naming screenshot.
- Annotare storage retention.

EVIDENCE LOG
- test-results/np-049-sts-visual-qa-<data>.log
```

## NP-050 – STS Simulator Offline Mode Validator

```text
AGENT
Nomad-STS – Offline QA

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Verificare modalità offline STS (service worker, cached presets) con test e doc troubleshooting.

PROMPT READINESS
FILE TARGET
- [esistente] src/service-worker.ts (tests scaffolding)
- [nuovo] src/ui/tools/sts/hooks/useOfflineStatus.ts — creare scaffolding prima di iniziare.
- [esistente] tests/e2e/sts/OfflineMode.spec.ts
- [esistente] docs/infra/sts_offline_mode.md
- [esistente] scripts/sts/offlineDiagnostics.ts

DIPENDENZE
- Service worker config
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Creare hook offline status + UI indicator.
2. Implementare e2e test (Playwright) con network offline.
3. CLI diag per verificare cache entries.
4. Documentare troubleshooting e KPI (cold start <3s).
5. Evidence log con run.

OPERAZIONI VIETATE
- Non disabilitare SW per debug.
- Vietato usare localStorage fallback.
- Nessuna modifica alle route PWA non documentata.

ASSUNZIONI
- SW già registrato.
- Playwright supporta offline toggle.

REGRESSION SAFEGUARDS
- `npm run lint`
- `npm run test:e2e -- tests/e2e/sts/OfflineMode.spec.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se SW limitations emergono.

KANBAN COMPLETION
1. Stato Kanban + evidence log.
2. `test-results/np-050-sts-offline-<data>.log`.
3. Log include diag output.

NOTE
- Documentare step per rigenerare cache.
- Annotare fallback per assets assenti.

EVIDENCE LOG
- test-results/np-050-sts-offline-<data>.log
```

## NP-051 – Idle Village Crew Scheduler WASM Profiling

```text
AGENT
Forge-Idle – WASM Profiling

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Profilare scheduler WASM (sezione archmage) con strumento devtools e generare report diff config-first.

PROMPT READINESS
FILE TARGET
- [esistente] scripts/idleVillage/wasmProfiler.ts
- [nuovo] src/balancing/idleVillage/wasm/ProfilerHooks.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/WasmProfiler.test.ts
- [esistente] docs/perf/idle_village_wasm_profiler.md

DIPENDENZE
- Archmage WASM modules
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Integrare profiler hooks attorno funzioni WASM chiave.
2. Creare CLI che esegue scenari e salva flame data JSON.
3. Documentare interpretazione e KPI target.
4. Testare hooking (mock) e generazione log.
5. Evidence log con attach perf output.

OPERAZIONI VIETATE
- Nessuna modifica alle funzioni WASM senza review.
- Vietato loggare dati sensibili.
- Non salvare output fuori test-results/.

ASSUNZIONI
- WASM build script disponibile.
- Node supporta perf hooks.

REGRESSION SAFEGUARDS
- `npm run lint -- src/balancing scripts/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/WasmProfiler.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; ping se hooking degrade performance >5%.

KANBAN COMPLETION
1. Stato Kanban + doc link.
2. Evidence `test-results/np-051-wasm-profiler-<data>.log`.
3. Log include KPI summary.

NOTE
- Documentare come interpretare flame graphs.
- Annotare follow-up ottimizzazioni.

EVIDENCE LOG
- test-results/np-051-wasm-profiler-<data>.log
```

## NP-052 – Idle Village Scheduler Plugin Marketplace Spec

```text
AGENT
Architect-Idle – Plugin Spec

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Redigere specifica marketplace plugin scheduler (Phase F) con API, KPI e template Kanban/strategy entries.

PROMPT READINESS
FILE TARGET
- [nuovo] docs/plans/idle_village_scheduler_plugin_marketplace.md — creare scaffolding prima di iniziare.
- [esistente] docs/api/crew_scheduler_reference.md (add section)
- [esistente] src/docs/docs/coordinator/strategy_tasks.md (nuova riga)

DIPENDENZE
- Coordinator mandate
- Crew scheduler API doc

OPERAZIONI DA ESEGUIRE
1. Raccolta requisiti (plugins, safety).
2. Scrivere spec con API, KPI, evidence expectations.
3. Aggiornare strategy_tasks con entry dedicata.
4. Collegare doc all’API reference.
5. Evidence log doc lint.

OPERAZIONI VIETATE
- Non introdurre codice.
- Vietato lasciare KPI TBD.
- Nessuna reference a features non approvate.

ASSUNZIONI
- Phase F timeline definita.
- Documenti versionati.

REGRESSION SAFEGUARDS
- `npm run lint -- docs --max-warnings=0`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; ping se mancano KPI dal coordinator.

KANBAN COMPLETION
1. Stato Kanban + link spec + strategy entry.
2. Evidence `test-results/np-052-plugin-spec-<data>.log`.
3. Log con markdownlint output.

NOTE
- Documentare workflow approvazione plugin.
- Annotare track per evidence.

EVIDENCE LOG
- test-results/np-052-plugin-spec-<data>.log
```

## NP-053 – Idle Village Scheduler Replay Exporter

```text
AGENT
Replay-Idle – Scheduler Replay

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Esportare replay scheduler (tick-by-tick) in JSON/CSV per analisi, con UI playbar e CLI.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/tools/SchedulerReplayPlayer.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useSchedulerReplay.ts — creare scaffolding prima di iniziare.
- [esistente] scripts/idleVillage/schedulerReplayExport.ts
- [esistente] tests/unit/idleVillage/SchedulerReplay.test.ts
- [esistente] docs/analytics/idle_village_scheduler_replay.md

DIPENDENZE
- History store
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire formato replay (JSON) e schema.
2. Implementare hook + player UI con play/pause/scrub.
3. Creare CLI export + evidence logging.
4. Test logica e UI.
5. Documentare flusso.

OPERAZIONI VIETATE
- Nessuna scrittura fuori test-results/.
- Vietato manipolare state scheduler in player (read-only).
- Non usare setInterval senza cleanup.

ASSUNZIONI
- History snapshots esistono.
- Users necessitano export per QA.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage scripts/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/SchedulerReplay.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se export >5 MB.

KANBAN COMPLETION
1. Stato Kanban + evidence log.
2. `test-results/np-053-scheduler-replay-<data>.log`.
3. Log include export sample.

NOTE
- Documentare hotkeys player.
- Annotare eventuale support mobile.

EVIDENCE LOG
- test-results/np-053-scheduler-replay-<data>.log
```

## NP-054 – Idle Village Resident Sentiment Monitor

```text
AGENT
Pulse-Idle – Sentiment Monitor

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Monitorare sentiment residenti (soddisfazione, fatigue, quest outcome) con dashboard e alert config-first.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/components/ResidentSentimentMonitor.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useResidentSentiment.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/sentimentConfig.ts
- [esistente] tests/unit/idleVillage/ResidentSentimentMonitor.test.tsx
- [esistente] docs/analytics/idle_village_sentiment.md

DIPENDENZE
- Telemetry feed
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config (buckets, thresholds).
2. Implementare hook per aggregare sentiment data.
3. Dashboard con charts + alerts (config-driven).
4. Telemetria `sentiment_dashboard_viewed`.
5. Test + doc.

OPERAZIONI VIETATE
- No inline thresholds.
- Vietato loggare PII.
- Non bloccare UI con heavy queries.

ASSUNZIONI
- Telemetry events includono sentiment metrics.
- Persistence per filtri.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/ResidentSentimentMonitor.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se design chiede layout extra.

KANBAN COMPLETION
1. Stato Kanban.
2. Evidence `test-results/np-054-resident-sentiment-<data>.log`.
3. Log include KPI summary.

NOTE
- Documentare alert thresholds.
- Annotare future integration (notifications).

EVIDENCE LOG
- test-results/np-054-resident-sentiment-<data>.log
```

## NP-055 – Idle Village Scheduler Education Overlay

```text
AGENT
Tutor-Idle – Scheduler Guide

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Overlay educativo per spiegare scheduler Phase E (step-by-step) con config-driven slides e telemetry.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/components/SchedulerEducationOverlay.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/educationOverlayConfig.ts
- [nuovo] src/ui/idleVillage/hooks/useEducationOverlay.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/SchedulerEducationOverlay.test.tsx
- [esistente] docs/training/idle_village_scheduler_education.md

DIPENDENZE
- Active HUD
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config slides (title, copy, KPI).
2. Implementare hook per progress + persistence.
3. Overlay UI con navigation, highlight step.
4. Telemetry `education_overlay_progress`.
5. Test e doc.

OPERAZIONI VIETATE
- Nessuna slide hardcoded nel componente.
- Non bloccare UI se overlay chiuso.
- Vietato salvare progress fuori PersistenceService.

ASSUNZIONI
- Users necessitano onboarding.
- Multi-language support via i18n config.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/SchedulerEducationOverlay.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se design fornisce artwork.

KANBAN COMPLETION
1. Stato Kanban.
2. Evidence `test-results/np-055-education-overlay-<data>.log`.
3. Log include slide summary.

NOTE
- Documentare skip/back behavior.
- Annotare interplay con HUD.

EVIDENCE LOG
- test-results/np-055-education-overlay-<data>.log
```

## NP-056 – Idle Village Telemetry Schema Registry

```text
AGENT
Registry-Idle – Telemetry Schemas

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Centralizzare schemi telemetry Idle Village con registry JSON e validatore automatico.

PROMPT READINESS
FILE TARGET
- [nuovo] src/analytics/idleVillageTelemetryRegistry.ts — creare scaffolding prima di iniziare.
- [esistente] scripts/idleVillage/telemetrySchemaValidator.ts
- [esistente] tests/unit/idleVillage/TelemetryRegistry.test.ts
- [esistente] docs/analytics/idle_village_telemetry_registry.md

DIPENDENZE
- Existing telemetry events
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire registry (eventName → schema) con Zod.
2. Implementare validator CLI per log file.
3. Aggiornare moduli analytics per leggere registry.
4. Test + doc.
5. Evidence log con sample validation.

OPERAZIONI VIETATE
- Nessun schema inline nei componenti.
- Vietato bypassare validator in CI.
- Non salvare log fuori test-results/.

ASSUNZIONI
- Telemetry events documentati.
- CLI ha accesso a log storage.

REGRESSION SAFEGUARDS
- `npm run lint -- src/analytics scripts/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/TelemetryRegistry.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; ping se eventi legacy mancano.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-056-telemetry-registry-<data>.log`.
2. Note con conteggio eventi registrati.
3. Allegare output validator.

NOTE
- Documentare come aggiungere eventi.
- Annotare fallback per eventi sconosciuti.

EVIDENCE LOG
- test-results/np-056-telemetry-registry-<data>.log
```

## NP-057 – Idle Village Scheduler Feature Flag Framework

```text
AGENT
Switch-Idle – Feature Flags

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Introdurre framework feature flag per scheduler/ HUD Idle Village con config JSON, hooks e CLI toggler.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/config/featureFlags.ts
- [nuovo] src/ui/idleVillage/hooks/useFeatureFlag.ts — creare scaffolding prima di iniziare.
- [esistente] scripts/idleVillage/featureFlagToggle.ts
- [esistente] tests/unit/idleVillage/FeatureFlag.test.ts
- [esistente] docs/infra/idle_village_feature_flags.md

DIPENDENZE
- PersistenceService
- Coordinator mandate (no magic toggles)

OPERAZIONI DA ESEGUIRE
1. Definire schema flag (id, default, rollout).
2. Implementare hook per gating componenti.
3. CLI per attivare/disattivare flag con evidence log.
4. Test + doc.
5. Telemetry `feature_flag_toggled`.

OPERAZIONI VIETATE
- Nessun flag hardcoded fuori config.
- Vietato salvare stato in localStorage.
- Non lasciare flag attivi senza doc.

ASSUNZIONI
- Flags limitate (<20).
- PersistenceService per override.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage scripts/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/FeatureFlag.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se flags impact KPI.

KANBAN COMPLETION
1. Stato Kanban + doc link.
2. Evidence `test-results/np-057-feature-flags-<data>.log`.
3. Log include toggles summary.

NOTE
- Documentare naming convention.
- Annotare TTL per flags.

EVIDENCE LOG
- test-results/np-057-feature-flags-<data>.log
```

## NP-058 – Idle Village Multi-Tenant Save System Spec

```text
AGENT
Vault-Idle – Multi-Save

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Specificare sistema multi-tenant per salvataggi Idle Village (profili multipli) con doc, config e strategy entry.

PROMPT READINESS
FILE TARGET
- [nuovo] docs/plans/idle_village_multi_tenant_save.md — creare scaffolding prima di iniziare.
- [esistente] src/docs/docs/coordinator/strategy_tasks.md (riga)
- [esistente] docs/infra/persistence_audit_idle_village.md (appendix)

DIPENDENZE
- PersistenceService audit
- Storage Testing Framework

OPERAZIONI DA ESEGUIRE
1. Documentare requisiti (profili, quota, encryption).
2. Aggiornare strategy tasks con KPI.
3. Collegare doc a persistence audit.
4. Fornire template evidence per futuri prompt.
5. Validare doc lint.

OPERAZIONI VIETATE
- Non introdurre codice.
- Vietato lasciare KPI incompleti.
- Nessuna spec senza link a config esistenti.

ASSUNZIONI
- Multi-tenant pianificato Phase F.
- Doc versioning attivo.

REGRESSION SAFEGUARDS
- `npm run lint -- docs --max-warnings=0`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; ping se coordinator richiede template extra.

KANBAN COMPLETION
1. Stato Kanban + link doc + strategy entry.
2. Evidence `test-results/np-058-multi-save-spec-<data>.log`.
3. Log include markdownlint output.

NOTE
- Documentare security considerations.
- Annotare follow-up step.

EVIDENCE LOG
- test-results/np-058-multi-save-spec-<data>.log
```

## NP-059 – Idle Village Scheduler QA Checklist Automation

```text
AGENT
Sentinel-Idle – QA Checklist

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Automatizzare checklist QA scheduler (lint/test/build/metrics) con script e report markdown.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/schedulerQAChecklist.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/SchedulerQAChecklist.test.ts
- [esistente] docs/qa/idle_village_scheduler_checklist.md
- [esistente] test-results/templates/scheduler-qa-template.md

DIPENDENZE
- Evidence aggregator
- Coordinator mandate

OPERAZIONI DA ESEGUIRE
1. Definire checklist config (steps, commands, success criteria).
2. Implementare script che esegue steps e genera report.
3. Test (mock exec) + doc.
4. Includere opzione `--prompt-id`.
5. Log evidence.

OPERAZIONI VIETATE
- Nessun comando distruttivo.
- Vietato ignorare errori.
- Non salvare report fuori test-results/.

ASSUNZIONI
- Node 20.
- Commands esistono.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/SchedulerQAChecklist.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; sync se steps cambiano.

KANBAN COMPLETION
1. Stato Kanban + log.
2. `test-results/np-059-scheduler-qa-<data>.log`.
3. Report allegato.

NOTE
- Documentare come aggiungere nuovi steps.
- Annotare exit codes.

EVIDENCE LOG
- test-results/np-059-scheduler-qa-<data>.log
```

## NP-060 – Idle Village Scheduler KPI Data Lake Export

```text
AGENT
Atlas-Idle – Data Lake Export

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Preparare export KPI scheduler verso data lake (Parquet/JSON) con CLI, schema e evidence log.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/kpiDataLakeExport.ts — creare scaffolding prima di iniziare.
- [esistente] src/analytics/idleVillageKPIExporter.ts
- [esistente] tests/unit/idleVillage/KPIDataLakeExport.test.ts
- [esistente] docs/data/idle_village_kpi_export.md
- [esistente] data/exports/idleVillage/kpi_datalake/*

DIPENDENZE
- Telemetry registry
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire schema KPI (crew utilization, fatigue, alerts).
2. Implementare exporter (JSON + Parquet via arrow) con config.
3. Integrare CLI flags (date range, filters).
4. Test + doc.
5. Evidence log con sample export.

OPERAZIONI VIETATE
- Nessun export senza schema valido.
- Vietato scrivere fuori data/exports.
- Non includere PII.

ASSUNZIONI
- Node 20 supporta arrow libs (già installate).
- Data lake pipeline accetta file generati.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage src/analytics`
- `npm run test:unit -- tests/unit/idleVillage/KPIDataLakeExport.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se Parquet schema cambia.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-060-kpi-datalake-<data>.log`.
2. Note con path export.
3. Allegare sample JSON snippet.

NOTE
- Documentare compressione (gzip).
- Annotare tempi medi export.

EVIDENCE LOG
- test-results/np-060-kpi-datalake-<data>.log
```

## NP-061 – STS RNG Drift Monitor
```text
AGENT
Sentinel-RNG – STS Drift

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Monitorare derive RNG del simulatore STS confrontando bucket seed-based e generando alert config-first.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/sts/hooks/useSTSRNGMonitor.ts — creare scaffolding prima di iniziare.
- [esistente] scripts/stsTelemetry/rngDriftReport.ts
- [esistente] tests/unit/sts/STSRNGMonitor.test.ts
- [esistente] docs/archmage/STS_RNG_Drift.md

DIPENDENZE
- KS-081-sts-sim
- KS-081-sts-telemetry-dashboard

OPERAZIONI DA ESEGUIRE
1. Definire schema bucket RNG (seed → distribuzioni) con PersistenceService.
2. Implementare hook che confronta run correnti con baseline e pubblica metriche.
3. Creare CLI `rngDriftReport.ts` per generare CSV/Markdown con deviazioni.
4. Scrivere test unit (simulando seed controllati) e allineare doc.
5. Safeguard suite: lint ui/tools+scripts, test, build:check, kanban:lint.

OPERAZIONI VIETATE
- Non introdurre randomness non seedata nei test.
- Vietato inviare telemetry senza guard window.

ASSUNZIONI
- Seed replay già disponibile via CLI scenario library.
- Telemetry bus supporta eventi rng_drift.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts scripts/stsTelemetry`
- `npm run test -- tests/unit/sts/STSRNGMonitor.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se deviazioni >5% rispetto baseline storica.

KANBAN COMPLETION
1. Stato Kanban aggiornato + log `test-results/np-061-rng-drift-<data>.log`.
2. Allegare estratto report (CSV/Markdown) nel log.
3. Documentare nuova sezione in STS_RNG_Drift.md.

NOTE
- Integrare alert optional (es. Slack webhook) in un secondo momento.
- Conservare baseline in `data/runs/sts/rng_baseline.json`.

EVIDENCE LOG
- test-results/np-061-rng-drift-<data>.log
```

## NP-062 – STS Preset Archive Normalizer
```text
AGENT
Archivist-STS – Preset Archive

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Normalizzare preset STS legacy convertendoli nel nuovo schema JSON con CLI e validatore.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/stsTelemetry/presetNormalize.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/sts/hooks/useSTSPresetArchive.ts
- [esistente] tests/unit/sts/STSPresetArchive.test.ts
- [esistente] docs/archmage/STS_Preset_Workflow.md

DIPENDENZE
- KS-081-sts-macro-library

OPERAZIONI DA ESEGUIRE
1. Creare CLI che legge preset legacy, applica mapping e salva versione aggiornata.
2. Integrare hook UI per elencare preset archiviati e triggerare conversione.
3. Aggiungere validatore Zod condiviso e test (preset valid/invalid).
4. Aggiornare documentazione workflow con esempi prima/dopo.
5. Safeguard: lint scripts/ui/tools, test, build:check, kanban:lint.

OPERAZIONI VIETATE
- Non sovrascrivere preset originali senza backup.
- Vietato ignorare campi sconosciuti: loggarli.

ASSUNZIONI
- Preset archiviati vivono in `data/presets/sts/legacy/*.json`.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/stsTelemetry src/ui/tools/sts/hooks`
- `npm run test -- tests/unit/sts/STSPresetArchive.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; check se emergono preset corrotti.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-062-preset-normalizer-<data>.log`.
2. Allegare elenco preset convertiti e file backup.
3. Aggiornare doc workflow.

NOTE
- Prevedere flag `--dry-run` nella CLI.
- Documentare come aggiungere nuovi mapper.

EVIDENCE LOG
- test-results/np-062-preset-normalizer-<data>.log
```

## NP-063 – STS Combat Replay Heatmap CLI
```text
AGENT
Helios-Replay – STS Heatmap

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Generare heatmap CLI delle traiettorie combat log per analisi offline e QA.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/stsTelemetry/heatmapReplay.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/sts/telemetry/useSTSReplayHeatmap.ts
- [esistente] tests/unit/sts/STSReplayHeatmap.test.ts
- [esistente] docs/archmage/STS_CombatReplay.md

DIPENDENZE
- KS-081-sts-telemetry-dashboard
- NP-061 (RNG Drift Monitor) opzionale

OPERAZIONI DA ESEGUIRE
1. Definire schema heatmap (turno vs intent) e output JSON/PNG.
2. Implementare CLI che legge log e produce heatmap + stats.
3. Creare hook UI per visualizzazione rapida (ASCII/Canvas).
4. Scrivere test su dataset sample e aggiornare doc.
5. Safeguard: lint scripts/ui, test, build, kanban.

OPERAZIONI VIETATE
- Non salvare immagini fuori `test-results/`.
- Vietato caricare file senza sanitizzazione percorsi.

ASSUNZIONI
- Telemetry log disponibili in `data/runs/sts/*.json`.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/stsTelemetry src/ui/tools/sts/telemetry`
- `npm run test -- tests/unit/sts/STSReplayHeatmap.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; ping se heatmap >5MB di default.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-063-replay-heatmap-<data>.log`.
2. Allegare snapshot ASCII/PNG nel log.
3. Doc aggiornata con guida rapida.

NOTE
- Prevedere flag `--aggregate` per unire più log.
- Documentare performance (ms/log).

EVIDENCE LOG
- test-results/np-063-replay-heatmap-<data>.log
```

## NP-064 – STS Run Comparison Dashboard
```text
AGENT
Mirage-STS – Run Comparator

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire dashboard STS che confronta due run (mana curve, agency gap, outcome) con diff esportabile.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/sts/components/STSRunComparison.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/sts/hooks/useSTSRunComparison.ts
- [esistente] tests/unit/sts/STSRunComparison.test.tsx
- [esistente] docs/archmage/STS_Telemetry_Dashboard.md (§ Run Comparison)

DIPENDENZE
- KS-081-sts-telemetry-dashboard

OPERAZIONI DA ESEGUIRE
1. Definire hook che carica due run e calcola KPI diff.
2. Implementare componente UI (tabs + chart) con export JSON/Markdown.
3. Integrare telemetry `sts_run_comparison_viewed/exported`.
4. Scrivere test RTL + hook e aggiornare doc.
5. Safeguard suite completa.

OPERAZIONI VIETATE
- Non duplicare logica aggregazione (riusare selectors esistenti).
- Vietato salvare run temporanei senza PersistenceService.

ASSUNZIONI
- Run logs disponibili localmente (persistenza KS-081).

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts`
- `npm run test -- tests/unit/sts/STSRunComparison.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se servono nuovi KPI.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-064-run-comparison-<data>.log`.
2. Allegare export diff di esempio.
3. Doc aggiornata.

NOTE
- Supportare quick select “ultima run vs baseline”.
- Prevedere dark/high-contrast.

EVIDENCE LOG
- test-results/np-064-run-comparison-<data>.log
```

## NP-065 – STS Retro Theme QA Matrix
```text
AGENT
Aurora-Theme – STS QA

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare matrice QA per tema retro STS (contrasto, font, spacing) con test automatici e doc.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/sts/theme/STSThemeMatrix.tsx — creare scaffolding prima di iniziare.
- [esistente] tests/unit/sts/STSThemeMatrix.test.tsx
- [nuovo] scripts/stsTelemetry/themeAudit.ts — creare scaffolding prima di iniziare.
- [esistente] docs/archmage/STS_Theme_QA.md

DIPENDENZE
- KS-081-sts-terminal-theme

OPERAZIONI DA ESEGUIRE
1. Costruire matrice componenti (buttons, tables, cards) con snapshot.
2. Creare script `themeAudit` che verifica contrasto/spacing e salva log.
3. Scrivere test (visual regressions + accessibility) e doc QA.
4. Integrare telemetry `sts_theme_audit`.
5. Safeguard completa.

OPERAZIONI VIETATE
- Non hardcodare colori fuori STSTheme.
- Vietato ignorare errori contrasto nel report.

ASSUNZIONI
- Theme tokens centralizzati già pronti.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts scripts/stsTelemetry`
- `npm run test -- tests/unit/sts/STSThemeMatrix.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; fermarsi se snapshot >5MB.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-065-theme-qa-<data>.log`.
2. Allegare tabella risultati audit.
3. Doc aggiornata.

NOTE
- Prevedere flag `--update-snapshots`.
- Documentare come aggiungere nuovi componenti.

EVIDENCE LOG
- test-results/np-065-theme-qa-<data>.log
```

## NP-066 – STS Mobile Gesture Diagnostics
```text
AGENT
Vector-Mobile – STS Gestures

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Integrare diagnostica gesture mobile (swipe, pinch) con overlay debug e log telemetria.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/sts/mobile/STSgestureDiagnostics.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/sts/hooks/useSTSMobileDiagnostics.ts
- [esistente] tests/unit/sts/STSMobileDiagnostics.test.tsx
- [esistente] docs/archmage/STS_Mobile_Guide.md (§ Diagnostics)

DIPENDENZE
- NP-065 (Retro Theme QA) opzionale
- KS-081-sts-mobile-shortcuts

OPERAZIONI DA ESEGUIRE
1. Creare overlay debug che mostra eventi gesture + latenza.
2. Implementare hook per log structured + PersistenceService.
3. Scrivere test (simulando pointer events) e doc troubleshooting.
4. Integrare telemetry `sts_mobile_gesture_debug`.
5. Safeguard suite.

OPERAZIONI VIETATE
- Non accedere direttamente al DOM senza refs.
- Vietato lasciare overlay attivo in production build (toggle config).

ASSUNZIONI
- useSTSMobileShortcuts già stabile.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts/mobile`
- `npm run test -- tests/unit/sts/STSMobileDiagnostics.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync con QA mobile se nuovi device richiesti.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-066-mobile-diagnostics-<data>.log`.
2. Allegare screenshot overlay.
3. Doc aggiornata.

NOTE
- Prevedere esport CSV delle gesture capturate.
- Documentare fallback desktop.

EVIDENCE LOG
- test-results/np-066-mobile-diagnostics-<data>.log
```

## NP-067 – STS CLI Macro Stress Harness
```text
AGENT
Forge-Macro – Stress Harness

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire harness CLI che esegue macro STS in batch, misura errori/latency e produce report QA.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/stsTelemetry/macroStress.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/sts/hooks/useSTSMacroStress.ts
- [esistente] tests/unit/sts/STSMacroStress.test.ts
- [esistente] docs/archmage/STS_Macro_Workbench.md

DIPENDENZE
- KS-081-sts-macro-library

OPERAZIONI DA ESEGUIRE
1. Implementare CLI con parametri (macro set, iterazioni, seed).
2. Creare hook UI per lanciare stress test e mostrare risultati.
3. Scrivere test (mock CLI output) e aggiornare doc.
4. Integrare telemetry `sts_macro_stress_run`.
5. Safeguard suite completa.

OPERAZIONI VIETATE
- Non eseguire macro in parallelo senza config.
- Vietato salvare log fuori `test-results/`.

ASSUNZIONI
- Macro library già esporta metadata (tag, precondizioni).

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/stsTelemetry src/ui/tools/sts/hooks`
- `npm run test -- tests/unit/sts/STSMacroStress.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; fermarsi se harness supera 2 min run.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-067-macro-stress-<data>.log`.
2. Allegare tabella errori/latency.
3. Doc aggiornata.

NOTE
- Prevedere flag `--report markdown`.
- Documentare limitazioni su macro interattive.

EVIDENCE LOG
- test-results/np-067-macro-stress-<data>.log
```

## NP-068 – STS Notebook Telemetry Bridge
```text
AGENT
Orion-Notebook – Telemetry Bridge

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Integrare esport STS con notebook Jupyter (docs/archmage/STS_Notebook_Troubleshooting.md) tramite bridge config-first.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/stsTelemetry/notebookBridge.ts — creare scaffolding prima di iniziare.
- [esistente] src/analytics/stsNotebookBridge.ts
- [esistente] tests/unit/analytics/STSNotebookBridge.test.ts
- [esistente] docs/archmage/STS_Notebook_Troubleshooting.md (aggiornato)

DIPENDENZE
- KS-081-sts-telemetry-dashboard

OPERAZIONI DA ESEGUIRE
1. Definire bridge (Node) che converte log in formato notebook-friendly.
2. Implementare helper analytics per consumo dataset e metadata run.
3. Scrivere test su dataset sample + aggiornare doc troubleshooting.
4. Integrare CLI flag `--notebook-export` nei workflow esistenti.
5. Safeguard: lint analytics/scripts, test, build, kanban.

OPERAZIONI VIETATE
- Non includere dati sensibili (PII) negli export.
- Vietato modificare notebook esistenti senza backup.

ASSUNZIONI
- Notebook guida già versionato in docs/archmage.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/stsTelemetry src/analytics`
- `npm run test -- tests/unit/analytics/STSNotebookBridge.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; ping se serve supporto Python.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-068-notebook-bridge-<data>.log`.
2. Allegare snippet dataset.
3. Doc aggiornata.

NOTE
- Documentare comando per aprire notebook sample.
- Prevedere opzione compressione output.

EVIDENCE LOG
- test-results/np-068-notebook-bridge-<data>.log
```

## NP-069 – STS Accessibility Narration Layer
```text
AGENT
Lyric-Access – Narration

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Aggiungere layer di narrazione audio/screen-reader per STS simulator (annunci intent, outcome) con config-first script.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/sts/accessibility/STS NarrationLayer.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/sts/hooks/useSTSNarration.ts
- [esistente] tests/unit/sts/STS NarrationLayer.test.tsx
- [esistente] docs/archmage/STS_Accessibility.md (§ Narration)

DIPENDENZE
- KS-081-sts-accessibility

OPERAZIONI DA ESEGUIRE
1. Definire config annunci (intent start/completion, warning).
2. Implementare layer UI + hook (ARIA-live, Web Speech optional).
3. Scrivere test (mock speech) e aggiornare doc.
4. Integrare telemetry `sts_narration_event`.
5. Safeguard suite.

OPERAZIONI VIETATE
- Non usare speech API senza controlli feature flag.
- Vietato interrompere screen-reader focus.

ASSUNZIONI
- Retro terminal supporta aria-live region.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts`
- `npm run test -- tests/unit/sts/STS NarrationLayer.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync con QA accessibilità per localizzazione annunci.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-069-narration-layer-<data>.log`.
2. Allegare script annunci d’esempio.
3. Doc aggiornata.

NOTE
- Prevedere toggle in settings.
- Documentare fallback se Web Speech non disponibile.

EVIDENCE LOG
- test-results/np-069-narration-layer-<data>.log
```

## NP-070 – STS Analyzer Plugin Sandbox
```text
AGENT
Atlas-Analyzer – Plugin Sandbox

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare sandbox plugin per analyzer STS (metriche custom) con API documentata e test.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/sts/analyzer/STSPluginSandbox.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/sts/hooks/useSTSPluginHost.ts
- [nuovo] scripts/stsTelemetry/pluginScaffold.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/sts/STSPluginHost.test.ts

DIPENDENZE
- KS-081-sts-telemetry-dashboard
- NP-068 (Notebook Bridge) opzionale

OPERAZIONI DA ESEGUIRE
1. Implementare plugin host (register, lifecycle, telemetry) con type safety.
2. Creare UI sandbox per caricare/abilitare plugin (es. metriche custom).
3. Scrivere CLI scaffold per generare plugin boilerplate.
4. Test plugin host e aggiornare doc API.
5. Safeguard suite.

OPERAZIONI VIETATE
- Vietato permettere plugin non tipizzati/any.
- Non eseguire plugin senza sandbox (iframe/worklet) se interagiscono con DOM.

ASSUNZIONI
- Plugin hanno accesso solo a dati telemetria e API documentate.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts scripts/stsTelemetry`
- `npm run test -- tests/unit/sts/STSPluginHost.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se serve supporto sandbox Worker.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-070-plugin-sandbox-<data>.log`.
2. Allegare plugin demo.
3. Doc aggiornata (API + scaffolding).

NOTE
- Prevedere flag `--inspect` per plugin CLI.
- Documentare policy sicurezza plugin.

EVIDENCE LOG
- test-results/np-070-plugin-sandbox-<data>.log
```

## NP-071 – Idle Village Quest Blueprint Planner
```text
AGENT
Aurora-Blueprint – Quest Planner

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare planner quest blueprint Phase 12 con editor config-first, validazioni e export snapshot.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/tools/QuestBlueprintPlanner.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/hooks/useQuestBlueprints.ts
- [esistente] tests/unit/idleVillage/QuestBlueprintPlanner.test.tsx
- [esistente] docs/plans/idle_village_plan.md (§ Quest Blueprint)

DIPENDENZE
- IV-QuestTelemetry-heatmap

OPERAZIONI DA ESEGUIRE
1. Definire schema blueprint (fasi, requisiti, reward) con Zod.
2. Implementare tool UI (drag/sections) e PersistenceService.
3. Aggiungere export JSON/Markdown per design team.
4. Test + doc aggiornata.
5. Safeguard: lint idleVillage, test, build, kanban.

OPERAZIONI VIETATE
- Non hardcodare reward/stats nel componente.
- Vietato salvare blueprint fuori PersistenceService.

ASSUNZIONI
- Telemetry heatmap già attiva per validare blueprint.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/QuestBlueprintPlanner.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync con design per template iniziali.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-071-quest-blueprint-<data>.log`.
2. Allegare blueprint esempio.
3. Doc aggiornata.

NOTE
- Prevedere undo/redo (riuso stack Phase 12).
- Documentare integrazione con quest chronicle.

EVIDENCE LOG
- test-results/np-071-quest-blueprint-<data>.log
```

## NP-072 – Idle Village Worker Sentiment Telemetry
```text
AGENT
Spectrum-Sentiment – Idle Village

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Aggiungere pipeline telemetry sentiment residenti (soddisfazione, morale) con dashboard QA.

PROMPT READINESS
FILE TARGET
- [nuovo] src/analytics/idleVillageSentiment.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/hooks/useResidentSentimentTelemetry.ts
- [esistente] tests/unit/idleVillage/ResidentSentimentTelemetry.test.ts
- [esistente] docs/analytics/idle_village_sentiment.md (aggiornato)

DIPENDENZE
- NP-019 (Resident Fatigue Predictor) opzionale

OPERAZIONI DA ESEGUIRE
1. Definire schema eventi sentiment con PersistenceService.
2. Implementare hook + analytics aggregator e export JSON/CSV.
3. Creare dashboard QA (tabella + sparkline) e test hooking.
4. Aggiornare doc con KPI e usage.
5. Safeguard suite su analytics/ui/tests.

OPERAZIONI VIETATE
- Non duplicare logiche fatigue: importa da predictor.
- Vietato inviare telemetry senza throttle.

ASSUNZIONI
- ActivitySlot fornisce base morale/fatica.

REGRESSION SAFEGUARDS
- `npm run lint -- src/analytics src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/ResidentSentimentTelemetry.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se servono nuovi KPI.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-072-sentiment-telemetry-<data>.log`.
2. Allegare snapshot dashboard.
3. Doc aggiornata.

NOTE
- Prevedere exporter CLI per analisti.
- Documentare retention policy.

EVIDENCE LOG
- test-results/np-072-sentiment-telemetry-<data>.log
```

## NP-073 – Idle Village Map Snapshot CLI
```text
AGENT
Vector-CLI – Map Snapshot

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare CLI che salva snapshot configurazione mappa (layout, tags, slot state) per QA/regressioni.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/mapSnapshot.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/hooks/useMapSnapshot.ts
- [esistente] tests/unit/idleVillage/MapSnapshot.test.ts
- [esistente] docs/plans/idle_village_map_only_plan.md (§ Snapshots)

DIPENDENZE
- IV-WS3-useMapContext-fix

OPERAZIONI DA ESEGUIRE
1. Definire formato snapshot (JSON) con versioning e compressione opzionale.
2. Implementare CLI (export/import) + hook UI per trigger manuale.
3. Test (roundtrip) e doc sezione snapshot.
4. Integrare telemetry `map_snapshot_saved`.
5. Safeguard suite.

OPERAZIONI VIETATE
- Non sovrascrivere snapshot senza conferma.
- Vietato salvare file fuori `data/runs/idleVillage/mapSnapshots/`.

ASSUNZIONI
- Map store espone API serializzabili.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage src/ui/idleVillage/hooks`
- `npm run test -- tests/unit/idleVillage/MapSnapshot.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; ping se snapshot >1MB.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-073-map-snapshot-<data>.log`.
2. Allegare snapshot sample.
3. Doc aggiornata.

NOTE
- Aggiungere flag `--diff` contro baseline.
- Documentare uso in QA pipeline.

EVIDENCE LOG
- test-results/np-073-map-snapshot-<data>.log
```

## NP-074 – Idle Village Fatigue Regression Guard
```text
AGENT
Sentinel-Fatigue – Regression Guard

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire guard regression per fatica (CLI + test) che confronta dataset baseline vs run correnti.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/fatigueRegression.ts — creare scaffolding prima di iniziare.
- [esistente] src/analytics/idleVillageFatigueGuard.ts
- [esistente] tests/unit/idleVillage/FatigueRegression.test.ts
- [esistente] docs/plans/idle_village_tick_fatigue_plan.md (aggiornato)

DIPENDENZE
- NP-019 (Fatigue Predictor)

OPERAZIONI DA ESEGUIRE
1. Definire metriche (fatigue delta, failure rate) e baseline JSON.
2. Implementare CLI confronto + alert config-first.
3. Scrivere test (dataset sample) e aggiornare doc.
4. Integrare telemetry `fatigue_regression_guard`.
5. Safeguard suite completa.

OPERAZIONI VIETATE
- Non modificare baseline senza log.
- Vietato ignorare deviazioni >threshold.

ASSUNZIONI
- Data log disponibili in `data/runs/idleVillage/fatigue/*.json`.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage src/analytics`
- `npm run test -- tests/unit/idleVillage/FatigueRegression.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se KPI cambiano.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-074-fatigue-guard-<data>.log`.
2. Allegare diff sample.
3. Doc aggiornata.

NOTE
- Prevedere flag `--update-baseline`.
- Documentare alert severity.

EVIDENCE LOG
- test-results/np-074-fatigue-guard-<data>.log
```

## NP-075 – Idle Village Food Economy Balancer
```text
AGENT
Harvest-Balancer – Food Economy

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Bilanciare economia cibo (produzione/consumo) con simulazioni config-first e UI advisor.

PROMPT READINESS
FILE TARGET
- [nuovo] src/balancing/idleVillage/FoodEconomySimulator.ts — creare scaffolding prima di iniziare.
- [esistente] scripts/idleVillage/foodEconomyCLI.ts
- [esistente] tests/unit/idleVillage/FoodEconomySimulator.test.ts
- [esistente] docs/plans/idle_village_plan.md (§ Food Economy)

DIPENDENZE
- Idle Village tick fatigue plan

OPERAZIONI DA ESEGUIRE
1. Implementare simulatore (config weights, randomness seed) e CLI.
2. Creare hook/UI advisor che mostra KPI e suggerimenti.
3. Test simulatore + doc con esempi.
4. Integrare telemetry `food_economy_sim_run`.
5. Safeguard: lint balancing/scripts/ui, test, build, kanban.

OPERAZIONI VIETATE
- Non usare valori hardcoded per consumi.
- Vietato salvare scenari fuori PersistenceService.

ASSUNZIONI
- Dataset produzione/consumo già disponibile (Phase 12 plan).

REGRESSION SAFEGUARDS
- `npm run lint -- src/balancing scripts/idleVillage src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/FoodEconomySimulator.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se KPI cibo cambiano.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-075-food-economy-<data>.log`.
2. Allegare grafico KPI.
3. Doc aggiornata.

NOTE
- Prevedere export CSV per analisti.
- Documentare assunzioni meteo/crew.

EVIDENCE LOG
- test-results/np-075-food-economy-<data>.log
```

## NP-076 – Idle Village Theater Automation Hooks
```text
AGENT
Helios-Theater – Automation Hooks

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Estrarre hook automation Theater View (auto-assign, highlight) con config-first toggles.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/hooks/useTheaterAutomation.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/components/TheaterView.tsx (aggiornamento)
- [esistente] tests/unit/idleVillage/TheaterAutomation.test.tsx
- [esistente] docs/plans/idle_village_trial_of_fire_plan.md (§ Automation)

DIPENDENZE
- IV-Phase12-theater-sync

OPERAZIONI DA ESEGUIRE
1. Implementare hook (selectors/mutators) per automation sicura.
2. Aggiornare TheaterView per usare toggles config e telemetria.
3. Scrivere test (mock slot/resident) e doc plan.
4. Integrare telemetry `theater_auto_action`.
5. Safeguard suite.

OPERAZIONI VIETATE
- Non bypassare scheduler API.
- Vietato eseguire auto-assign senza config attivo.

ASSUNZIONI
- Drop validation Phase E già completata.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/TheaterAutomation.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync con design per UX automation.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-076-theater-automation-<data>.log`.
2. Allegare screenshot toggle.
3. Doc aggiornata.

NOTE
- Documentare fallback manuale.
- Prevedere kill-switch globale.

EVIDENCE LOG
- test-results/np-076-theater-automation-<data>.log
```

## NP-077 – Idle Village Drag AI Suggestion Harness
```text
AGENT
Nova-AI – Drag Suggestions

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire harness AI suggerimenti drag (DropAISuggestionEngine) con dataset generati e UI debug.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/ai/dropSuggestionHarness.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/components/DropAISuggestionUI.tsx (aggiornato)
- [esistente] tests/unit/idleVillage/dropAISuggestions.test.tsx
- [esistente] docs/plans/idle_village_drag_drop_e2e_plan.md (§ AI Suggestions)

DIPENDENZE
- DropAISuggestionEngine (esistente)

OPERAZIONI DA ESEGUIRE
1. Creare harness che genera dataset (slot/resident) e valuta suggerimenti.
2. Aggiornare UI debug con indicatori confidenza e log telemetria.
3. Scrivere test per engine/harness e doc plan.
4. Integrare telemetry `drag_ai_suggestion_used`.
5. Safeguard suite.

OPERAZIONI VIETATE
- Non esporre dataset sensibili fuori test-results/.
- Vietato bypassare drop validation.

ASSUNZIONI
- Engine AI già modulare e configurabile.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/dropAISuggestions.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se servono modelli ML esterni.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-077-drag-ai-<data>.log`.
2. Allegare report accuracy.
3. Doc aggiornata.

NOTE
- Prevedere toggle AI suggestion per QA.
- Documentare dataset synthetic.

EVIDENCE LOG
- test-results/np-077-drag-ai-<data>.log
```

## NP-078 – Idle Village Maintenance KPI Exporter
```text
AGENT
Spectrum-Maint – KPI Export

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Esportare KPI manutenzione (food, injury, repairs) in CSV/JSON per auditing Phase 12.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/maintenanceExport.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/hooks/useMaintenanceExport.ts
- [esistente] tests/unit/idleVillage/MaintenanceExport.test.ts
- [esistente] docs/plans/idle_village_plan.md (§ Maintenance)

DIPENDENZE
- IV-Phase12-maintenance-optimizer

OPERAZIONI DA ESEGUIRE
1. Definire schema KPI e CLI export con filtri.
2. Implementare hook UI per lanciare export e mostrare progress.
3. Test CLI/hook e aggiornare doc.
4. Integrare telemetry `maintenance_export_run`.
5. Safeguard suite.

OPERAZIONI VIETATE
- Non includere PII nei log.
- Vietato scrivere fuori `data/exports/idleVillage/maintenance/`.

ASSUNZIONI
- Maintenance optimizer già fornisce KPI base.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/MaintenanceExport.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; ping se file >5MB.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-078-maintenance-export-<data>.log`.
2. Allegare sample CSV.
3. Doc aggiornata.

NOTE
- Prevedere flag `--append`.
- Documentare scheduling (cron) eventuale.

EVIDENCE LOG
- test-results/np-078-maintenance-export-<data>.log
```

## NP-079 – Idle Village Quest Alert Scheduler
```text
AGENT
Signal-Quest – Alert Scheduler

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare scheduler alert quest (deadlines, risk spikes) con Active HUD e notifiche config-first.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/hooks/useQuestAlertScheduler.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/components/QuestAlertPanel.tsx
- [esistente] tests/unit/idleVillage/QuestAlertScheduler.test.tsx
- [esistente] docs/plans/idle_village_plan.md (§ Quest Alerts)

DIPENDENZE
- NP-071 (Quest Blueprint Planner) opzionale
- NP-016 (Activity Slot Telemetry Mapper)

OPERAZIONI DA ESEGUIRE
1. Creare scheduler (priority queue) che monitora quest deadlines/risk.
2. Implementare panel HUD + telemetry `quest_alert_triggered`.
3. Test hook/UI e documentare flusso.
4. Integrare PersistenceService per preferenze alert.
5. Safeguard suite.

OPERAZIONI VIETATE
- Non emettere alert duplicati senza cooldown.
- Vietato manipolare quest state fuori API.

ASSUNZIONI
- Quest telemetry fornisce timestamp e risk level.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/QuestAlertScheduler.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync con design per copy alert.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-079-quest-alerts-<data>.log`.
2. Allegare screenshot panel.
3. Doc aggiornata.

NOTE
- Prevedere opzione snooze.
- Documentare interplay con Active HUD notifications.

EVIDENCE LOG
- test-results/np-079-quest-alerts-<data>.log
```

## NP-080 – Idle Village Crew Shift Simulator
```text
AGENT
Chronos-Crew – Shift Simulator

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Simulare turni crew (shift) con vincoli fatigue/risk per ottimizzare assegnazioni Phase 12.

PROMPT READINESS
FILE TARGET
- [nuovo] src/balancing/idleVillage/CrewShiftSimulator.ts — creare scaffolding prima di iniziare.
- [esistente] scripts/idleVillage/crewShiftCLI.ts
- [esistente] tests/unit/idleVillage/CrewShiftSimulator.test.ts
- [esistente] docs/plans/idle_village_plan.md (§ Crew Shift)

DIPENDENZE
- IV-WS3-scheduler-upgrade
- NP-017 (Crew Scheduler HUD Integration) opzionale

OPERAZIONI DA ESEGUIRE
1. Implementare simulatore (ticks, shift templates) con config-first weights.
2. Creare CLI per lanciare scenari e salvare risultati.
3. Scrivere test (scenari sample) e aggiornare doc con guida.
4. Integrare telemetry `crew_shift_sim_run`.
5. Safeguard suite.

OPERAZIONI VIETATE
- Non modificare scheduler reale durante simulazioni.
- Vietato salvare output fuori `data/runs/idleVillage/crewShifts/`.

ASSUNZIONI
- Crew scheduler Phase E già deterministic.

REGRESSION SAFEGUARDS
- `npm run lint -- src/balancing scripts/idleVillage`
- `npm run test -- tests/unit/idleVillage/CrewShiftSimulator.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se servono nuove metriche KPI.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-080-crew-shift-<data>.log`.
2. Allegare tabella KPI shift.
3. Doc aggiornata.

NOTE
- Prevedere flag `--optimize` per best shift suggestion.
- Documentare differenza tra simulazione e stato live.

EVIDENCE LOG
- test-results/np-080-crew-shift-<data>.log
```

## NP-081 – STS Preset Diff Visualizer
```text
AGENT
Nova-Diff – STS Presets

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire tool diff (CLI + UI) per confrontare preset STS (mazzi, buffs, intents) evidenziando cambi config-first.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/sts/presetDiff.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/sts/hooks/usePresetDiff.ts
- [esistente] src/ui/tools/sts/components/STSPresetDiffPanel.tsx
- [esistente] tests/unit/sts/STSPresetDiffPanel.test.tsx

DIPENDENZE
- KS-081-sts-combat-config
- NP-062 (Preset Archive Normalizer)

OPERAZIONI DA ESEGUIRE
1. Implementare CLI `presetDiff` con output JSON/Markdown e filtri (armor, intent).
2. Creare hook UI per caricare preset A/B, calcolare diff con grouping.
3. Costruire pannello React con retro styling, search, export.
4. Scrivere test (hook + RTL) e agg. docs STS_Preset_Workflow.
5. Safeguard: lint scripts/ui/tools, test, build:check, kanban:lint.

OPERAZIONI VIETATE
- Non accedere a file fuori `data/presets/sts/`.
- Vietato mostrare diff se preset invalidi (Mostra errore).

ASSUNZIONI
- Preset già validati tramite NP-062.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/sts src/ui/tools/sts`
- `npm run test -- tests/unit/sts/STSPresetDiffPanel.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se servono nuove categorie diff.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-081-preset-diff-<data>.log`.
2. Allegare esempio diff (Markdown).
3. Doc aggiornata.

NOTE
- Prevedere opzione highlight percentuale impatto.
- Documentare fallback CLI-only.

EVIDENCE LOG
- test-results/np-081-preset-diff-<data>.log
```

## NP-082 – STS Scenario Seed Inspector
```text
AGENT
Atlas-Seed – Scenario Inspector

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare inspector (UI + test + CLI) che visualizza seed scenario STS, RNG timeline e riproduzione rapida.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/tools/sts/ScenarioSeedInspector.tsx
- [esistente] src/ui/tools/sts/hooks/useScenarioSeedInspector.ts
- [esistente] tests/unit/sts/ScenarioSeedInspector.test.tsx
- [esistente] tests/e2e/sts/scenario-seed-inspector.spec.ts
- [nuovo] scripts/sts/scenarioSeedCLI.ts — creare scaffolding prima di iniziare.

DIPENDENZE
- NP-061 (RNG Drift Monitor)

OPERAZIONI DA ESEGUIRE
1. Implementare hook che carica seed + metadati run, calcola checksum.
2. Costruire UI con timeline eventi, controlli replay, export JSON.
3. Aggiungere CLI per interrogare seed e lanciare run deterministica.
4. Scrivere test unit + e2e + doc (STS_RNG_Drift appendice).
5. Safeguard suite.

OPERAZIONI VIETATE
- Non permettere modifica seed in place senza conferma.
- Vietato loggare seed senza anonimizzazione (hash).

ASSUNZIONI
- Seed metadata già persistiti in `data/runs/sts/seeds/`.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts scripts/sts`
- `npm run test -- tests/unit/sts/ScenarioSeedInspector.test.tsx`
- `npm run test -- tests/e2e/sts/scenario-seed-inspector.spec.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se timeline supera 500 eventi.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-082-scenario-seed-<data>.log`.
2. Allegare screenshot inspector.
3. Doc aggiornata.

NOTE
- Integrare telemetry `sts_seed_inspected`.
- Documentare scorciatoie tastiera.

EVIDENCE LOG
- test-results/np-082-scenario-seed-<data>.log
```

## NP-083 – STS Telemetry Trend Anomaly Detector
```text
AGENT
Sentinel-Telemetry – STS Trends

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare servizio (Node + hook) che rileva anomalie KPI (mana curve, agency gap) e invia alert.

PROMPT READINESS
FILE TARGET
- [nuovo] src/analytics/stsTelemetryAnomaly.ts — creare scaffolding prima di iniziare.
- [esistente] scripts/stsTelemetry/anomalyDetector.ts
- [esistente] src/ui/tools/sts/hooks/useSTSAnomalyFeed.ts
- [esistente] tests/unit/analytics/STSTelemetryAnomaly.test.ts

DIPENDENZE
- KS-081-sts-telemetry-dashboard
- NP-064 (Run Comparison) opzionale

OPERAZIONI DA ESEGUIRE
1. Definire soglie (config-first) e pipeline smoothing per KPI.
2. Implementare script scheduled che legge logs e genera alert.
3. Creare hook/feed UI per mostrare anomalie e ack.
4. Test analytics/hook e doc (STS_Telemetry_Dashboard).
5. Safeguard suite.

OPERAZIONI VIETATE
- Non inviare alert senza deduplicazione (cooldown).
- Vietato usare valori hardcoded fuori config.

ASSUNZIONI
- Telemetry storage accessibile via PersistenceService.

REGRESSION SAFEGUARDS
- `npm run lint -- src/analytics scripts/stsTelemetry src/ui/tools/sts`
- `npm run test -- tests/unit/analytics/STSTelemetryAnomaly.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se servono nuovi KPI.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-083-sts-anomaly-<data>.log`.
2. Allegare report anomaly sample.
3. Doc aggiornata.

NOTE
- Prevedere export CSV/JSON per investigazioni.
- Documentare canale alert (UI + CLI).

EVIDENCE LOG
- test-results/np-083-sts-anomaly-<data>.log
```

## NP-084 – STS Command Terminal Recovery Mode
```text
AGENT
Guardian-Terminal – Recovery

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Aggiungere modalità recovery per Command Terminal (hotkey map, macro fails) con autosave e log viewer.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/sts/terminal/STSRecoveryPanel.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/sts/hooks/useSTSRecoveryMode.ts
- [esistente] tests/unit/sts/STSRecoveryMode.test.tsx
- [esistente] scripts/stsTelemetry/recoveryReport.ts

DIPENDENZE
- KS-081-sts-hotkeys
- NP-067 (Macro Stress Harness)

OPERAZIONI DA ESEGUIRE
1. Implementare hook che monitora errori terminal e salva snapshot config.
2. Creare pannello UI per ripristino macro/hotkey + export log JSON.
3. CLI `recoveryReport` per generare bundle support.
4. Test hooking + panel e doc (STS_Runbook).
5. Safeguard suite.

OPERAZIONI VIETATE
- Non raccogliere log senza consenso config.
- Vietato ripristinare snapshot non verificati.

ASSUNZIONI
- PersistenceService supporta snapshot history.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts scripts/stsTelemetry`
- `npm run test -- tests/unit/sts/STSRecoveryMode.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se log include dati sensibili.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-084-terminal-recovery-<data>.log`.
2. Allegare sample recovery bundle.
3. Doc aggiornata.

NOTE
- Prevedere toggle “auto-recover on crash”.
- Documentare come condividere bundle con QA.

EVIDENCE LOG
- test-results/np-084-terminal-recovery-<data>.log
```

## NP-085 – STS Live Notebook Sync
```text
AGENT
Aurora-Notebook – Live Sync

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Sincronizzare Telemetry Dashboard con notebook Jupyter live (websocket) per analisi real-time.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/stsTelemetry/notebookSyncServer.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/sts/hooks/useNotebookSync.ts
- [esistente] src/analytics/stsNotebookBridge.ts (estensione)
- [esistente] tests/unit/analytics/STSNotebookSync.test.ts

DIPENDENZE
- NP-068 (Notebook Telemetry Bridge)

OPERAZIONI DA ESEGUIRE
1. Implementare server Node (ws) che streamma run data garantendo auth locale.
2. Estendere bridge per pubblicare update incremental.
3. Creare hook UI per attivare sync, mostrare stato e fallback offline.
4. Test (mock ws) e doc troubleshooting.
5. Safeguard suite.

OPERAZIONI VIETATE
- Non esporre socket senza auth token locale.
- Vietato scrivere file temporanei fuori `tmp/notebook_sync`.

ASSUNZIONI
- Notebook client fornito da team analytics.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/stsTelemetry src/analytics src/ui/tools/sts`
- `npm run test -- tests/unit/analytics/STSNotebookSync.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se richiesti protocolli diversi da ws.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-085-notebook-sync-<data>.log`.
2. Allegare screenshot notebook live.
3. Doc aggiornata.

NOTE
- Documentare comandi start/stop server.
- Prevedere fallback polling.

EVIDENCE LOG
- test-results/np-085-notebook-sync-<data>.log
```

## NP-086 – Idle Village Drop AI Tutor Mode
```text
AGENT
Mentor-AI – Drop Tutor

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Integrare modalità tutor che spiega suggerimenti AI (DropAISuggestionEngine) con reasoning e KPI.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/components/DropAITutorPanel.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/hooks/useDropAITutor.ts
- [esistente] tests/unit/idleVillage/DropAITutorPanel.test.tsx
- [esistente] docs/plans/idle_village_drag_drop_e2e_plan.md (§ Tutor Mode)

DIPENDENZE
- NP-077 (Drag AI Suggestion Harness)

OPERAZIONI DA ESEGUIRE
1. Implementare hook che arricchisce suggerimenti con motivazioni (stat match, fatigue).
2. Creare pannello UI con step-by-step reasoning e telemetria `drop_ai_tutor_used`.
3. Test hooking + UI e aggiornare doc plan.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non mostrare suggerimenti se validazione fallisce.
- Vietato salvare reasoning fuori PersistenceService.

ASSUNZIONI
- Dataset accuracy già disponibile.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/DropAITutorPanel.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se servono nuove metriche.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-086-drop-ai-tutor-<data>.log`.
2. Allegare screenshot panel.
3. Doc aggiornata.

NOTE
- Prevedere toggle training vs live.
- Documentare come interpretare KPI.

EVIDENCE LOG
- test-results/np-086-drop-ai-tutor-<data>.log
```

## NP-087 – Idle Village Quest Outcome Postmortem Analyzer
```text
AGENT
Helios-Quest – Postmortem

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare analyzer che ricostruisce outcome quest (success/fail) con timeline, risk stripes e suggerimenti di tuning.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/tools/QuestPostmortemAnalyzer.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/hooks/useQuestPostmortem.ts
- [esistente] tests/unit/idleVillage/QuestPostmortemAnalyzer.test.tsx
- [esistente] docs/plans/idle_village_plan.md (§ Quest Postmortem)

DIPENDENZE
- IV-QuestTelemetry-heatmap
- NP-079 (Quest Alert Scheduler) opzionale

OPERAZIONI DA ESEGUIRE
1. Implementare hook che aggrega telemetry quest (risk, decision path).
2. Costruire tool UI con timeline, risk stripes, KPI diff.
3. Aggiungere export Markdown per design review.
4. Test hooking + UI e doc.
5. Safeguard suite.

OPERAZIONI VIETATE
- Non manipolare log originali (solo copia read-only).
- Vietato mostrare PII.

ASSUNZIONI
- Telemetry log disponibili per tutte le quest completate.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/QuestPostmortemAnalyzer.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se servono nuovi KPI.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-087-quest-postmortem-<data>.log`.
2. Allegare report sample.
3. Doc aggiornata.

NOTE
- Prevedere filtri per archetype/resident.
- Documentare come aggiungere nuovi indicatori.

EVIDENCE LOG
- test-results/np-087-quest-postmortem-<data>.log
```

## NP-088 – Idle Village Multi-Village Scheduler Monitor
```text
AGENT
Atlas-MultiVillage – Scheduler Monitor

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Monitorare scheduler su più villaggi (dev/test/prod) con dashboard comparativa e CLI.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/multiVillageMonitor.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/hooks/useMultiVillageMonitor.ts
- [esistente] src/ui/idleVillage/components/MultiVillageMonitorPanel.tsx
- [esistente] tests/unit/idleVillage/MultiVillageMonitor.test.tsx

DIPENDENZE
- IV-WS3-scheduler-upgrade
- NP-080 (Crew Shift Simulator) opzionale

OPERAZIONI DA ESEGUIRE
1. Implementare CLI che raccoglie KPI scheduler da istanze multiple via PersistenceService.
2. Creare hook + pannello UI per confrontare queue, fatigue, errors.
3. Aggiungere export CSV/Markdown e telemetry `multi_village_monitor_viewed`.
4. Test hooking + CLI e doc (idle_village_plan).
5. Safeguard suite.

OPERAZIONI VIETATE
- Non accedere a istanze non autorizzate.
- Vietato modificare config remoto.

ASSUNZIONI
- Endpoint debug per ogni villaggio disponibile.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/MultiVillageMonitor.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se scoperti villaggi aggiuntivi.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-088-multi-village-<data>.log`.
2. Allegare screenshot dashboard.
3. Doc aggiornata.

NOTE
- Supportare highlight differenze > soglia.
- Documentare setup CLI.

EVIDENCE LOG
- test-results/np-088-multi-village-<data>.log
```

## NP-089 – Idle Village Resident Relationship Graph
```text
AGENT
Lyra-Graph – Resident Relations

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Visualizzare grafo relazioni residenti (crew history, synergy tags) con UI e export JSON.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/tools/ResidentRelationshipGraph.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/hooks/useResidentRelationshipGraph.ts
- [esistente] tests/unit/idleVillage/ResidentRelationshipGraph.test.tsx
- [esistente] docs/plans/idle_village_plan.md (§ Relationship Graph)

DIPENDENZE
- NP-087 (Quest Postmortem) opzionale

OPERAZIONI DA ESEGUIRE
1. Aggregare dati crew assignments, quest, fatigue per creare grafo (nodes/resident, edges synergy).
2. Implementare UI (force layout configurabile) con filters e tooltips.
3. Export JSON/PNG e telemetry `resident_graph_viewed`.
4. Test data builder + UI e doc.
5. Safeguard suite.

OPERAZIONI VIETATE
- Non mostrare dati se resident non caricati (fallback).
- Vietato usare libs non approvate senza revisione.

ASSUNZIONI
- Dati scheduler disponibili via hooks.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/ResidentRelationshipGraph.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; ping se layout >60fps drop.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-089-resident-graph-<data>.log`.
2. Allegare snapshot grafo.
3. Doc aggiornata.

NOTE
- Prevedere toggles per tipologie relazione.
- Documentare come aggiungere metriche custom.

EVIDENCE LOG
- test-results/np-089-resident-graph-<data>.log
```

## NP-090 – Idle Village Maintenance Task Forecaster
```text
AGENT
Sentinel-Maint – Forecaster

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Predire tasks manutenzione (cibo, injury, repairs) basandosi su KPI storici con UI forecast.

PROMPT READINESS
FILE TARGET
- [nuovo] src/analytics/idleVillageMaintenanceForecast.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/hooks/useMaintenanceForecast.ts
- [esistente] tests/unit/idleVillage/MaintenanceForecast.test.ts
- [esistente] docs/plans/idle_village_plan.md (§ Maintenance Forecast)

DIPENDENZE
- NP-078 (Maintenance KPI Exporter)

OPERAZIONI DA ESEGUIRE
1. Implementare modello forecast (ARIMA-like lightweight) config-first.
2. Creare hook/UI che mostra forecast (charts) e export CSV.
3. Test analytics/hook e doc KPI usage.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non usare libs pesanti senza approvazione.
- Vietato informare di forecast senza confidence interval.

ASSUNZIONI
- KPI export disponibili quotidianamente.

REGRESSION SAFEGUARDS
- `npm run lint -- src/analytics src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/MaintenanceForecast.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se KPI cambiano.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-090-maintenance-forecast-<data>.log`.
2. Allegare grafico forecast.
3. Doc aggiornata.

NOTE
- Prevedere alert se forecast supera soglie.
- Documentare parametri modello.

EVIDENCE LOG
- test-results/np-090-maintenance-forecast-<data>.log
```

## NP-091 – Idle Village Food Chain Alert CLI
```text
AGENT
Vector-Food – Alert CLI

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare CLI che monitora catena cibo (produzione, consumo, scorte) e lancia alert + report.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/foodChainAlert.ts — creare scaffolding prima di iniziare.
- [esistente] src/analytics/idleVillageFoodChain.ts
- [esistente] tests/unit/idleVillage/FoodChainAlert.test.ts
- [esistente] docs/plans/idle_village_plan.md (§ Food Chain)

DIPENDENZE
- NP-075 (Food Economy Balancer)

OPERAZIONI DA ESEGUIRE
1. Definire regole alert (threshold config) e pipeline CLI.
2. Integrare analytics helper per statistiche e telemetry `food_chain_alert`.
3. Test dataset sample + doc usage.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non inviare alert ripetitivi senza cooldown.
- Vietato usare file non versionati come input.

ASSUNZIONI
- KPI cibo disponibili via simulator.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage src/analytics`
- `npm run test -- tests/unit/idleVillage/FoodChainAlert.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; informare se alert >10/min.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-091-food-chain-<data>.log`.
2. Allegare output report sample.
3. Doc aggiornata.

NOTE
- Prevedere opzione `--watch`.
- Documentare hooking con scheduler monitor.

EVIDENCE LOG
- test-results/np-091-food-chain-<data>.log
```

## NP-092 – Idle Village Terrain Modifier Config Tool
```text
AGENT
Orion-Terrain – Config Tool

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare tool config-first per modificare terreno mappa (bonus/malus slot) con preview e export.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/tools/TerrainModifierTool.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/hooks/useTerrainModifiers.ts
- [esistente] tests/unit/idleVillage/TerrainModifierTool.test.tsx
- [esistente] docs/plans/idle_village_map_only_plan.md (§ Terrain)

DIPENDENZE
- Phase 12 map mini-card system

OPERAZIONI DA ESEGUIRE
1. Definire schema modifiers (JSON) e persistence via PersistenceService.
2. Implementare UI editor (grid) con preview e telemetry `terrain_modifier_saved`.
3. Test hook + UI e doc.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non applicare modifiers direttamente su map state live (usa preview).
- Vietato salvare file fuori PersistenceService.

ASSUNZIONI
- Map grid metadata disponibile.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/TerrainModifierTool.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se servono nuove categorie.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-092-terrain-tool-<data>.log`.
2. Allegare screenshot editor.
3. Doc aggiornata.

NOTE
- Prevedere import/export JSON.
- Documentare layering (stack modifiers).

EVIDENCE LOG
- test-results/np-092-terrain-tool-<data>.log
```

## NP-093 – Idle Village Alt Visual Pinball Monitor
```text
AGENT
Nova-Visuals – Pinball Monitor

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Assicurare che Alt Visuals auto-launch (pillars/ball) funzionino con telemetria e watchdog anti-stuck.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/altVisuals/hooks/usePinballMonitor.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/altVisuals/components/PinballMonitorPanel.tsx
- [esistente] tests/unit/altVisuals/PinballMonitor.test.tsx
- [esistente] docs/altVisuals/AltVisualGuidelines.md (aggiornato)

DIPENDENZE
- Alt Visuals v6 config

OPERAZIONI DA ESEGUIRE
1. Implementare hook che verifica stato pillar/ball, rilancia animazione se bloccata.
2. Creare pannello debug + telemetry `alt_visual_pinball_watchdog`.
3. Test hooking + UI e doc guidelines.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non rimuovere auto-launch (must remain).
- Vietato hardcodare stats/animation values.

ASSUMZIONI
- Pinball config proviene da config centralizzato.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/altVisuals`
- `npm run test -- tests/unit/altVisuals/PinballMonitor.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se nuove skin richieste.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-093-pinball-monitor-<data>.log`.
2. Allegare screenshot panel.
3. Doc aggiornata.

NOTE
- Prevedere CLI diag opzionale.
- Documentare fallback se animation API non disponibile.

EVIDENCE LOG
- test-results/np-093-pinball-monitor-<data>.log
```

## NP-094 – Config Balancer Formula Safety Dashboard
```text
AGENT
Sentinel-Formula – Safety Dashboard

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire dashboard UI per monitorare FormulaEngine linting (cicli, range) con filtri e export.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/balancing/components/FormulaSafetyDashboard.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/balancing/hooks/useFormulaSafety.ts
- [esistente] tests/unit/balancing/FormulaSafetyDashboard.test.tsx
- [esistente] docs/plans/config_driven_balancer_plan.md (§ Formula Safety)

DIPENDENZE
- CF-Phase10-card-safety
- NP-095 (Stress Batch Runner) opzionale

OPERAZIONI DA ESEGUIRE
1. Implementare hook che legge risultati lint/cycle detection da store.
2. Creare dashboard con filters (severity, card) e export JSON.
3. Test hook + UI e doc plan.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non bypassare FormulaEngine per i check.
- Vietato mostrare formule senza mask se flagged come sensitive.

ASSUNZIONI
- FormulaEngine già produce telemetry lint events.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/balancing`
- `npm run test -- tests/unit/balancing/FormulaSafetyDashboard.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se servono nuovi severity levels.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-094-formula-safety-<data>.log`.
2. Allegare screenshot dashboard.
3. Doc aggiornata.

NOTE
- Prevedere deep link da card editor.
- Documentare retention lint history.

EVIDENCE LOG
- test-results/np-094-formula-safety-<data>.log
```

## NP-095 – Config Balancer Stress Batch Runner
```text
AGENT
Forge-Stress – Balancer Runner

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Automatizzare run batch del Balancer Stress Testing (Phase 10.5) con CLI, queue e report.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/balancer/stressBatchRunner.ts — creare scaffolding prima di iniziare.
- [esistente] src/balancing/stressTesting/StressBatchRunner.ts
- [esistente] tests/unit/balancing/StressBatchRunner.test.ts
- [esistente] docs/plans/config_driven_balancer_tasks.md (§ Stress Batch)

DIPENDENZE
- ST-Phase10_5-archetype-generator
- NP-094 opzionale

OPERAZIONI DA ESEGUIRE
1. Creare runner config-first (scenario list, RNG seed) con PersistenceService.
2. Implementare CLI per lanciare batch + generare report CSV/Markdown.
3. Test unit (mock scenarios) e doc tasks.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non lanciare batch senza baseline comparativa.
- Vietato scrivere output fuori `data/runs/balancer/stress/`.

ASSUNZIONI
- Simulator e archetype generator già esportano API.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/balancer src/balancing/stressTesting`
- `npm run test -- tests/unit/balancing/StressBatchRunner.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se runtime >15min.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-095-stress-batch-<data>.log`.
2. Allegare report sample.
3. Doc aggiornata.

NOTE
- Prevedere flag `--resume`.
- Documentare come aggiungere nuovi scenari.

EVIDENCE LOG
- test-results/np-095-stress-batch-<data>.log
```

## NP-096 – Config Balancer Card Preset Migrator
```text
AGENT
Archivist-Balancer – Preset Migrator

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Migrare preset card legacy (pre Phase 10) allo schema corrente con CLI e validatore.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/balancer/cardPresetMigrate.ts — creare scaffolding prima di iniziare.
- [esistente] src/balancing/config/presetMigration.ts
- [esistente] tests/unit/balancing/CardPresetMigration.test.ts
- [esistente] docs/plans/config_driven_balancer_plan.md (§ Preset Migration)

DIPENDENZE
- CF-Phase10-history-undo-hardening
- NP-095 opzionale

OPERAZIONI DA ESEGUIRE
1. Definire mapping versionato (v1→v2) e backup auto.
2. Implementare CLI (dry-run, diff) e helper TS per UI integration.
3. Test migration scenarios e doc.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non sovrascrivere preset senza backup in `data/presets/balancer/backups/`.
- Vietato introdurre `any`.

ASSUNZIONI
- Preset legacy disponibili in `data/presets/balancer/legacy/`.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/balancer src/balancing/config`
- `npm run test -- tests/unit/balancing/CardPresetMigration.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se schema cambia.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-096-card-preset-migrate-<data>.log`.
2. Allegare diff sample.
3. Doc aggiornata.

NOTE
- Prevedere export summary (CSV).
- Documentare versionamento script.

EVIDENCE LOG
- test-results/np-096-card-preset-migrate-<data>.log
```

## NP-097 – Config Balancer Storage Telemetry Monitor
```text
AGENT
Sentinel-Storage – Balancer Telemetry

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Monitorare PersistenceService per balancer (save/load latency, errori) con dashboard e CLI.

PROMPT READINESS
FILE TARGET
- [nuovo] src/analytics/balancerStorageTelemetry.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/balancing/hooks/useStorageTelemetry.ts
- [esistente] tests/unit/balancing/StorageTelemetry.test.ts
- [esistente] docs/plans/config_driven_balancer_plan.md (§ Storage Telemetry)

DIPENDENZE
- Storage Testing Framework
- CF-Phase10-history-undo-hardening

OPERAZIONI DA ESEGUIRE
1. Strumentare PersistenceService per emettere eventi config-first.
2. Creare hook/dashboard per visualizzare metriche e alert.
3. Test analytics/hook e doc.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non loggare dati sensibili.
- Vietato bypassare async PersistenceService.

ASSUNZIONI
- Storage Testing Framework disponibile per baseline.

REGRESSION SAFEGUARDS
- `npm run lint -- src/analytics src/ui/balancing`
- `npm run test -- tests/unit/balancing/StorageTelemetry.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se errori >1% persistenti.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-097-storage-telemetry-<data>.log`.
2. Allegare screenshot dashboard.
3. Doc aggiornata.

NOTE
- Prevedere export CSV per incident review.
- Documentare thresholds.

EVIDENCE LOG
- test-results/np-097-storage-telemetry-<data>.log
```

## NP-098 – Coordinator Prompt Dependency Planner
```text
AGENT
Orion-Coord – Dependency Planner

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Realizzare planner che costruisce grafo dipendenze prompt (Kanban) e verifica parallelizzabilità.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/coordinator/promptDependencyPlanner.ts — creare scaffolding prima di iniziare.
- [esistente] src/docs/docs/coordinator/prompt_dependency_plan.md
- [esistente] tests/unit/coordinator/PromptDependencyPlanner.test.ts

DIPENDENZE
- coordinator mandate 2026-01-07

OPERAZIONI DA ESEGUIRE
1. Parsare `agent_assignments*.md` e costruire grafo dipendenze (JSON).
2. Calcolare gruppi parallelizzabili e generare report Markdown.
3. Test parser/grafo e documentare workflow.
4. Safeguard suite (lint scripts/tests, build, kanban).

OPERAZIONI VIETATE
- Non modificare file Kanban esistenti automaticamente.
- Vietato ignorare prompt con stato “In corso”.

ASSUNZIONI
- Files Kanban seguono tabella standard.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/coordinator`
- `npm run test -- tests/unit/coordinator/PromptDependencyPlanner.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se tabelle cambiano formato.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-098-dependency-planner-<data>.log`.
2. Allegare grafo PNG/ASCII.
3. Doc aggiornata.

NOTE
- Prevedere export JSON per altri tool.
- Documentare come leggere gruppi.

EVIDENCE LOG
- test-results/np-098-dependency-planner-<data>.log
```

## NP-099 – Coordinator Evidence Log Harvester
```text
AGENT
Sentinel-Evidence – Log Harvester

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Automatizzare raccolta evidence log (lint/test/build) e verifica naming per ogni prompt.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/coordinator/evidenceHarvester.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/coordinator/EvidenceHarvester.test.ts
- [esistente] docs/coordinator/agent_execution_guidelines.md (aggiornato)

DIPENDENZE
- coordinator mandate 2026-01-07

OPERAZIONI DA ESEGUIRE
1. Implementare script che scansiona `test-results/` e valida pattern `<prompt>-<date>.log`.
2. Generare report Markdown con pass/fail e suggerimenti.
3. Test script (fixtures) e aggiornare guidelines.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non eliminare log esistenti.
- Vietato segnare completato se mancano log obbligatori.

ASSUNZIONI
- Prompt ID sempre nel nome file log.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/coordinator`
- `npm run test -- tests/unit/coordinator/EvidenceHarvester.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; ping se si notano deviazioni massive.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-099-evidence-harvester-<data>.log`.
2. Allegare estratto report.
3. Doc aggiornata.

NOTE
- Prevedere integrazione futura con prompt dependency planner.
- Documentare config (path, ignore).

EVIDENCE LOG
- test-results/np-099-evidence-harvester-<data>.log
```

## NP-100 – Global Safeguard Monitor Dashboard
```text
AGENT
Atlas-Safeguard – Monitor

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire dashboard aggregato che mostra stato safeguard suite (lint/test/build/kanban) per tutti i prompt.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/coordinator/safeguardMonitor.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/coordinator/SafeguardMonitorDashboard.tsx
- [esistente] tests/unit/coordinator/SafeguardMonitorDashboard.test.tsx
- [esistente] docs/coordinator/safeguard_monitoring.md

DIPENDENZE
- NP-099 (Evidence Log Harvester)
- NP-098 (Dependency Planner) opzionale

OPERAZIONI DA ESEGUIRE
1. Implementare script che aggrega log dallo harvester e produce JSON status.
2. Creare dashboard UI (filters, progress, alerts) con telemetria `safeguard_monitor_viewed`.
3. Test script + UI e documentare processo.
4. Safeguard suite completa.

OPERAZIONI VIETATE
- Non segnare verde senza log validi.
- Vietato scrivere su file Kanban.

ASSUNZIONI
- Evidence logs seguono naming rule (NP-099).

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/coordinator src/ui/tools/coordinator`
- `npm run test -- tests/unit/coordinator/SafeguardMonitorDashboard.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se performance UI <60fps.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-100-safeguard-monitor-<data>.log`.
2. Allegare screenshot dashboard.
3. Doc aggiornata.

NOTE
- Prevedere export CSV per retrospettive.
- Documentare severity thresholds.

EVIDENCE LOG
- test-results/np-100-safeguard-monitor-<data>.log
```

## NP-101 – STS Intent Timeline Storyboard
```text
AGENT
Helios-Intent – Storyboard

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Visualizzare timeline intent STS con storyboard (cards + annotations) per QA/regia simulator.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/sts/components/STSIntentStoryboard.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/sts/hooks/useIntentStoryboard.ts
- [esistente] tests/unit/sts/STSIntentStoryboard.test.tsx
- [esistente] docs/archmage/STS_Telemetry_Dashboard.md (§ Intent Storyboard)

DIPENDENZE
- KS-081-sts-telemetry-dashboard
- NP-063 (Combat Replay Heatmap) opzionale

OPERAZIONI DA ESEGUIRE
1. Implementare hook che aggrega intent timeline con metadata (energy, target).
2. Creare componente storyboard con controlli zoom, filters, export Markdown.
3. Integrare telemetry `sts_intent_storyboard_viewed`.
4. Scrivere test RTL/hook e aggiornare doc.
5. Safeguard suite completa.

OPERAZIONI VIETATE
- Non duplicare dataset (usa selectors esistenti).
- Vietato mostrare log raw senza sanitize.

ASSUNZIONI
- Telemetry run conserva intent order deterministico.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts`
- `npm run test -- tests/unit/sts/STSIntentStoryboard.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se serve supporto video export.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-101-intent-storyboard-<data>.log`.
2. Allegare screenshot storyboard.
3. Doc aggiornata.

NOTE
- Prevedere export JSON “shots”.
- Documentare interplay con replay heatmap.

EVIDENCE LOG
- test-results/np-101-intent-storyboard-<data>.log
```

## NP-102 – STS Macro Library Search Engine
```text
AGENT
Nova-Macro – Search

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare motore ricerca macro STS (filtro per tag, outcome) con CLI + UI e ranking configurabile.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/sts/components/STSMacroSearch.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/sts/hooks/useSTSMacroSearch.ts
- [esistente] scripts/stsTelemetry/macroSearchCLI.ts
- [esistente] tests/unit/sts/STSMacroSearch.test.tsx

DIPENDENZE
- KS-081-sts-macro-library
- NP-067 (Macro Stress Harness) opzionale

OPERAZIONI DA ESEGUIRE
1. Implementare hook/CLI che indicizza macro (tags, cooldown, success rate).
2. Creare UI search con scoring config-first e export JSON.
3. Telemetry `sts_macro_search_performed`.
4. Test hooking + CLI e doc (STS_Macro_Workbench).
5. Safeguard suite.

OPERAZIONI VIETATE
- Non usare search senza indexing config.
- Vietato salvare query history senza consent.

ASSUNZIONI
- Macro metadata JSON già disponibili.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts scripts/stsTelemetry`
- `npm run test -- tests/unit/sts/STSMacroSearch.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se serve fuzzy search avanzata.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-102-macro-search-<data>.log`.
2. Allegare screenshot/cache index stats.
3. Doc aggiornata.

NOTE
- Prevedere CLI flag `--export-csv`.
- Documentare ranking formula.

EVIDENCE LOG
- test-results/np-102-macro-search-<data>.log
```

## NP-103 – STS Retro Audio Automation Suite
```text
AGENT
Lyric-Audio – Automation

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Automatizzare playback cue audio retro (intent start, warnings) con config-first timeline editor.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/sts/audio/STS_AudioAutomation.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/sts/hooks/useSTSAudioAutomation.ts
- [esistente] tests/unit/sts/STSAudioAutomation.test.tsx
- [esistente] docs/archmage/STS_Accessibility.md (§ Audio Automation)

DIPENDENZE
- KS-081-sts-terminal-theme
- NP-069 (Narration Layer) opzionale

OPERAZIONI DA ESEGUIRE
1. Definire schema cue (eventType, sample, volume) e persistence.
2. Creare editor UI (timeline) + preview e telemetry `sts_audio_cue_triggered`.
3. Test hooking + UI e doc.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non riprodurre audio senza rispetto preferenze accessibility.
- Vietato caricare asset fuori `public/assets/audio/sts/`.

ASSUNZIONI
- Audio samples già forniti.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts`
- `npm run test -- tests/unit/sts/STSAudioAutomation.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se servono nuovi formati audio.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-103-audio-automation-<data>.log`.
2. Allegare screenshot timeline.
3. Doc aggiornata.

NOTE
- Prevedere import/export preset.
- Documentare fallback silent mode.

EVIDENCE LOG
- test-results/np-103-audio-automation-<data>.log
```

## NP-104 – STS Gesture Recorder QA Pack
```text
AGENT
Vector-MobileQA – Gesture Pack

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Registrare e riprodurre gesture mobile STS per QA (touch paths) con CLI export e overlay.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/sts/mobile/gestureRecorder.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/sts/hooks/useGestureRecorder.ts
- [esistente] scripts/stsTelemetry/gesturePackCLI.ts
- [esistente] tests/unit/sts/STSGestureRecorder.test.tsx

DIPENDENZE
- NP-066 (Mobile Gesture Diagnostics)

OPERAZIONI DA ESEGUIRE
1. Implementare hook che registra gesture (pointer events) e salva JSON.
2. Creare overlay per playback step-by-step.
3. CLI per import/export packs e telemetry `sts_gesture_pack`.
4. Test hooking + CLI e doc mobile guide.
5. Safeguard suite.

OPERAZIONI VIETATE
- Non registrare gesture senza toggle QA.
- Vietato caricare pack non firmati.

ASSUNZIONI
- QA devices support pointer events instrumentation.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts/mobile scripts/stsTelemetry`
- `npm run test -- tests/unit/sts/STSGestureRecorder.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se pack >1MB.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-104-gesture-pack-<data>.log`.
2. Allegare snippet JSON pack.
3. Doc aggiornata.

NOTE
- Prevedere conversione pack → video GIF.
- Documentare security considerations.

EVIDENCE LOG
- test-results/np-104-gesture-pack-<data>.log
```

## NP-105 – STS Performance Budget Auto-Tuner
```text
AGENT
Sentinel-Perf – STS Budget

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Auto-tunare budget performance STS (ms/turno, memory) regolando config (log detail, refresh) con CLI.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/stsTelemetry/perfAutoTuner.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/sts/hooks/useSTSPefBudget.ts
- [esistente] tests/unit/sts/STSPefBudget.test.ts
- [esistente] docs/archmage/STS_Performance_Guide.md (§ Auto-Tuner)

DIPENDENZE
- NP-081 (Preset Diff) opzionale
- NP-083 (Telemetry Anomaly) opzionale

OPERAZIONI DA ESEGUIRE
1. Creare tuner che analizza KPI e propone config adjustments.
2. Hook/UI che mostra raccomandazioni e applica toggles.
3. CLI per batch tuning + telemetry `sts_perf_tuner_run`.
4. Test hooking + CLI e doc.
5. Safeguard suite.

OPERAZIONI VIETATE
- Non modificare config persistente senza conferma.
- Vietato ridurre log detail sotto soglia minima.

ASSUNZIONI
- KPI storici disponibili.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/stsTelemetry src/ui/tools/sts`
- `npm run test -- tests/unit/sts/STSPefBudget.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se tuning impatta telemetria essenziale.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-105-sts-perf-tuner-<data>.log`.
2. Allegare raccomandazioni sample.
3. Doc aggiornata.

NOTE
- Prevedere undo settings.
- Documentare limitazioni su mobile devices.

EVIDENCE LOG
- test-results/np-105-sts-perf-tuner-<data>.log
```

## NP-106 – Idle Village Drop Suggestion Telemetry Auditor
```text
AGENT
Sentinel-Drop – Telemetry Audit

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Auditare eventi telemetry drop suggestion (AI) confrontando usage vs accuracy e generando alert.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/dropTelemetryAudit.ts — creare scaffolding prima di iniziare.
- [esistente] src/analytics/idleVillageDropTelemetry.ts
- [esistente] tests/unit/idleVillage/DropTelemetryAudit.test.ts
- [esistente] docs/plans/idle_village_drag_drop_e2e_plan.md (§ Telemetry Audit)

DIPENDENZE
- NP-077 (Drag AI Harness)
- NP-086 (AI Tutor) opzionale

OPERAZIONI DA ESEGUIRE
1. Implementare auditor che aggrega metrics (accept rate, error reasons).
2. CLI per report + thresholds e telemetry `drop_ai_audit`.
3. Test analytics/CLI e doc.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non usare dataset QA senza anonimizzazione.
- Vietato ignorare errori > soglia configurata.

ASSUNZIONI
- Telemetry events già versionati.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage src/analytics`
- `npm run test -- tests/unit/idleVillage/DropTelemetryAudit.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se eventi mancanti.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-106-drop-telemetry-<data>.log`.
2. Allegare report sample.
3. Doc aggiornata.

NOTE
- Prevedere export CSV/Markdown.
- Documentare remediation flow.

EVIDENCE LOG
- test-results/np-106-drop-telemetry-<data>.log
```

## NP-107 – Idle Village Resident Fatigue Coaching UX
```text
AGENT
Aurora-Coach – Fatigue UX

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Progettare UX di coaching residenti (consigli fatigue) con pannello interattivo e telemetria.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/components/FatigueCoachPanel.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/hooks/useFatigueCoach.ts
- [esistente] tests/unit/idleVillage/FatigueCoachPanel.test.tsx
- [esistente] docs/plans/idle_village_tick_fatigue_plan.md (§ Coaching)

DIPENDENZE
- NP-074 (Fatigue Regression Guard)
- NP-019 (Fatigue Predictor)

OPERAZIONI DA ESEGUIRE
1. Implementare hook che genera consigli (rest, reassignment) basati su predictor.
2. Pannello UI con prioritized actions e telemetry `fatigue_coach_action`.
3. Test hooking + UI e doc.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non suggerire azioni che violano crew limits.
- Vietato salvare preferenze fuori PersistenceService.

ASSUNZIONI
- Predictor fornisce confidence score.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/FatigueCoachPanel.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync con design per messaging.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-107-fatigue-coach-<data>.log`.
2. Allegare screenshot panel.
3. Doc aggiornata.

NOTE
- Prevedere toggle “auto-apply suggestions”.
- Documentare KPI (success rate).

EVIDENCE LOG
- test-results/np-107-fatigue-coach-<data>.log
```

## NP-108 – Idle Village Quest Heatmap CLI Export
```text
AGENT
Vector-Quest – Heatmap CLI

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare CLI che esporta quest decision heatmap (Phase 12) in SVG/CSV + doc per analisti.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/questHeatmapExport.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/hooks/useQuestHeatmapExport.ts
- [esistente] tests/unit/idleVillage/QuestHeatmapExport.test.ts
- [esistente] docs/plans/idle_village_plan.md (§ Quest Heatmap Export)

DIPENDENZE
- IV-QuestTelemetry-heatmap

OPERAZIONI DA ESEGUIRE
1. Definire schema export (grid, risk, count) e CLI flags.
2. Hook per UI preview + telemetry `quest_heatmap_export`.
3. Test CLI/hook e doc.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non esportare dati privi di normalization.
- Vietato salvare file fuori `data/exports/idleVillage/questHeatmap/`.

ASSUNZIONI
- Heatmap data già in store.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/QuestHeatmapExport.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; ping se file >10MB.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-108-quest-heatmap-export-<data>.log`.
2. Allegare sample SVG/CSV.
3. Doc aggiornata.

NOTE
- Prevedere flag `--diff <baseline>`.
- Documentare usage per board review.

EVIDENCE LOG
- test-results/np-108-quest-heatmap-export-<data>.log
```

## NP-109 – Idle Village Theater Auto-Camera Planner
```text
AGENT
Helios-Camera – Theater Planner

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Progettare auto-camera per Theater View (panning, zoom) basata su ActivitySlot signals.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/hooks/useTheaterAutoCamera.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/components/TheaterView.tsx (integrazione)
- [esistente] tests/unit/idleVillage/TheaterAutoCamera.test.tsx
- [esistente] docs/plans/ws3-theater-controller-crew-scheduler.md (§ Auto-Camera)

DIPENDENZE
- WS4 useTheaterController
- NP-076 (Theater Automation Hooks)

OPERAZIONI DA ESEGUIRE
1. Implementare hook con keyframes config-first e support hover timers.
2. Integrare in TheaterView con toggles e telemetry `theater_auto_camera`.
3. Test hooking + UI e doc.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non bypassare useTheaterController.
- Vietato hardcodare coordinate map.

ASSUNZIONI
- Map layout metadata disponibile.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/TheaterAutoCamera.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se animazioni impattano perf.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-109-theater-auto-camera-<data>.log`.
2. Allegare clip GIF.
3. Doc aggiornata.

NOTE
- Prevedere manual override.
- Documentare easing curves.

EVIDENCE LOG
- test-results/np-109-theater-auto-camera-<data>.log
```

## NP-110 – Idle Village Crew Scheduler Timeline Diff
```text
AGENT
Vector-Scheduler – Timeline Diff

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Confrontare timeline scheduler (prima/dopo run) con diff viewer e CLI per regression review.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/schedulerTimelineDiff.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/hooks/useSchedulerTimelineDiff.ts
- [esistente] tests/unit/idleVillage/SchedulerTimelineDiff.test.ts
- [esistente] docs/plans/ws3-theater-controller-crew-scheduler.md (§ Timeline Diff)

DIPENDENZE
- IV-WS3-scheduler-upgrade
- NP-073 (Map Snapshot) opzionale

OPERAZIONI DA ESEGUIRE
1. Exportare timeline snapshots (JSON) e calcolare diff (crew, slot, latency).
2. Hook/UI per visual diff (stacked timeline) + telemetry `scheduler_diff_viewed`.
3. CLI per batch diff e doc.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non modificare timeline live.
- Vietato usare dataset senza version tag.

ASSUNZIONI
- Scheduler API espone transitions.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/SchedulerTimelineDiff.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se timeline >500 entries.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-110-scheduler-diff-<data>.log`.
2. Allegare diff screenshot.
3. Doc aggiornata.

NOTE
- Prevedere diff severity score.
- Documentare CLI usage.

EVIDENCE LOG
- test-results/np-110-scheduler-diff-<data>.log
```

## NP-111 – Config Balancer UI Dark Mode Tokens
```text
AGENT
Aurora-Balancer – Dark Tokens

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Definire tokens dark mode Balancer UI con theme switcher e documentazione config-first.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/balancing/theme/balancerTheme.ts (estensione)
- [esistente] src/ui/balancing/hooks/useBalancerTheme.ts
- [esistente] tests/unit/balancing/BalancerTheme.test.tsx
- [esistente] docs/plans/config_driven_balancer_plan.md (§ Theme Tokens)

DIPENDENZE
- Art Direction “Il Drago”

OPERAZIONI DA ESEGUIRE
1. Definire palette dark (Realismo Eroico Classico) e tokens tipografici.
2. Implementare hook/theme switcher con PersistenceService.
3. Test theme + component snapshot (ConfigToolbar) e doc.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non hardcodare colori nei componenti.
- Vietato deviare dalle linee guida “Il Drago”.

ASSUNZIONI
- Art direction document disponibile.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/balancing`
- `npm run test -- tests/unit/balancing/BalancerTheme.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync con art director se servono nuovi accenti.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-111-balancer-dark-<data>.log`.
2. Allegare screenshot light/dark.
3. Doc aggiornata.

NOTE
- Prevedere token generator CLI se utile.
- Documentare fallback per legacy UI.

EVIDENCE LOG
- test-results/np-111-balancer-dark-<data>.log
```

## NP-112 – Config Balancer Formula Playground Sandbox
```text
AGENT
Nova-Formula – Playground

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare sandbox isolata per test formule (Cycle detection, range) con safe evaluator e share link.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/balancing/tools/FormulaPlayground.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/balancing/hooks/useFormulaPlayground.ts
- [esistente] tests/unit/balancing/FormulaPlayground.test.tsx
- [esistente] docs/plans/config_driven_balancer_plan.md (§ Formula Playground)

DIPENDENZE
- CF-Phase10-card-safety
- NP-094 (Formula Safety Dashboard)

OPERAZIONI DA ESEGUIRE
1. Implementare evaluator isolato (web worker) con cycle detection e metrics.
2. UI sandbox con scenario presets e share link PersistenceService.
3. Test evaluator + UI e doc.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non valutare codice arbitrario (solo formula DSL).
- Vietato bypassare safety guard.

ASSUMZIONI
- FormulaEngine esporta API pure.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/balancing`
- `npm run test -- tests/unit/balancing/FormulaPlayground.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se worker introduce overhead >50ms.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-112-formula-playground-<data>.log`.
2. Allegare snapshot sandbox.
3. Doc aggiornata.

NOTE
- Prevedere import/export formula set.
- Documentare telemetria `formula_playground_run`.

EVIDENCE LOG
- test-results/np-112-formula-playground-<data>.log
```

## NP-113 – Config Balancer Storage Failure Chaos Tests
```text
AGENT
Sentinel-Chaos – Storage Failures

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Eseguire chaos tests su PersistenceService (timeout, partial write) per balancer con harness.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/balancer/storageChaosTests.ts — creare scaffolding prima di iniziare.
- [esistente] src/shared/testing/storage/StorageChaosHarness.ts
- [esistente] tests/unit/balancing/StorageChaosHarness.test.ts
- [esistente] docs/plans/config_driven_balancer_plan.md (§ Storage Chaos)

DIPENDENZE
- Storage Testing Framework

OPERAZIONI DA ESEGUIRE
1. Estendere framework per fault injection (delay, reject).
2. Implementare CLI per lanciare scenari e salvare report.
3. Test harness + doc, integrare telemetry `storage_chaos_run`.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non eseguire chaos su prod store.
- Vietato ignorare error summary nel log.

ASSUNZIONI
- PersistenceService supporta mocking.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/balancer src/shared/testing`
- `npm run test -- tests/unit/balancing/StorageChaosHarness.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se nuovi fault types richiesti.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-113-storage-chaos-<data>.log`.
2. Allegare report sample.
3. Doc aggiornata.

NOTE
- Prevedere flag `--scenario <name>`.
- Documentare remediation steps.

EVIDENCE LOG
- test-results/np-113-storage-chaos-<data>.log
```

## NP-114 – Config Balancer Undo History Visual Diff
```text
AGENT
Aurora-History – Visual Diff

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Visualizzare diff tra snapshot undo (Phase 10 history) con UI timeline e CLI export.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/balancing/components/HistoryDiffViewer.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/balancing/hooks/useHistoryDiff.ts
- [esistente] scripts/balancer/historyDiffCLI.ts
- [esistente] tests/unit/balancing/HistoryDiffViewer.test.tsx

DIPENDENZE
- CF-Phase10-history-undo-hardening

OPERAZIONI DA ESEGUIRE
1. Implementare hook che compara snapshot (stats, cards) generando diff metadata.
2. UI timeline con highlight per changed stats, export JSON/Markdown.
3. CLI per batch diff e doc plan.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non leggere snapshot senza checksum validation.
- Vietato mostrare diff incompleti (mancanza data) senza warning.

ASSUNZIONI
- Snapshot store limit 10 entries.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/balancing scripts/balancer`
- `npm run test -- tests/unit/balancing/HistoryDiffViewer.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se snapshot size >1MB.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-114-history-diff-<data>.log`.
2. Allegare diff screenshot.
3. Doc aggiornata.

NOTE
- Prevedere “apply diff” (preview) per future phases.
- Documentare telemetry `history_diff_viewed`.

EVIDENCE LOG
- test-results/np-114-history-diff-<data>.log
```

## NP-115 – Coordinator Prompt Risk Matrix
```text
AGENT
Atlas-Coord – Risk Matrix

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire matrice rischio prompt (complessità vs dipendenze vs safeguarding) con report e UI.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/coordinator/promptRiskMatrix.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/coordinator/PromptRiskMatrix.tsx
- [esistente] tests/unit/coordinator/PromptRiskMatrix.test.tsx
- [esistente] docs/coordinator/prompt_risk_matrix.md

DIPENDENZE
- NP-098 (Dependency Planner)
- NP-100 (Safeguard Monitor) opzionale

OPERAZIONI DA ESEGUIRE
1. Calcolare score per prompt da dependency graph + evidence status.
2. Generare report Markdown/CSV e UI matrix con filters.
3. Telemetry `prompt_risk_matrix_viewed`.
4. Test script + UI e doc.
5. Safeguard suite.

OPERAZIONI VIETATE
- Non modificare stati Kanban automaticamente.
- Vietato assegnare punteggi senza citerne regole.

ASSUNZIONI
- Input JSON da planner/monitor disponibili.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/coordinator src/ui/tools/coordinator`
- `npm run test -- tests/unit/coordinator/PromptRiskMatrix.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se scoring model cambia.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-115-prompt-risk-<data>.log`.
2. Allegare matrix screenshot.
3. Doc aggiornata.

NOTE
- Prevedere export CSV per review settimanale.
- Documentare parametri scoring.

EVIDENCE LOG
- test-results/np-115-prompt-risk-<data>.log
```

## NP-116 – Coordinator Prompt Assignment CLI
```text
AGENT
Vector-Coord – Assignment CLI

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare CLI che precompila blocchi prompt (AGENT, obiettivo, file target) e aggiorna Kanban skeleton.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/coordinator/promptAssignmentCLI.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/coordinator/PromptAssignmentCLI.test.ts
- [esistente] docs/coordinator/agent_execution_guidelines.md (aggiornato)

DIPENDENZE
- NP-115 (Risk Matrix) opzionale

OPERAZIONI DA ESEGUIRE
1. Implementare CLI che legge template (JSON) e genera entry Markdown.
2. Validare unique IDs e dipendenze, generare file snippet.
3. Test CLI (fixtures) e doc.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non scrivere direttamente su Kanban finale senza review.
- Vietato generare ID duplicati.

ASSUNZIONI
- Template NP-* già definiti.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/coordinator`
- `npm run test -- tests/unit/coordinator/PromptAssignmentCLI.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se format tabelle cambia.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-116-assignment-cli-<data>.log`.
2. Allegare snippet generato.
3. Doc aggiornata.

NOTE
- Prevedere flag `--dry-run`.
- Documentare gestione numbering.

EVIDENCE LOG
- test-results/np-116-assignment-cli-<data>.log
```

## NP-117 – Global Evidence Archive Uploader
```text
AGENT
Sentinel-Archive – Evidence Upload

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Caricare evidence log compressi su storage centralizzato (local -> data/archives) con checksum.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/coordinator/evidenceArchiveUploader.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/coordinator/EvidenceArchiveUploader.test.ts
- [esistente] docs/coordinator/safeguard_monitoring.md (§ Archive Workflow)

DIPENDENZE
- NP-099 (Evidence Harvester)

OPERAZIONI DA ESEGUIRE
1. Implementare uploader che comprime log (gzip) e salva manifest JSON.
2. Validare checksum, aggiornare manifest e telemetry `evidence_archive_upload`.
3. Test script e doc.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non eliminare log locali dopo upload senza backup.
- Vietato caricare file senza checksum.

ASSUNZIONI
- storage path `data/archives/evidence/`.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/coordinator`
- `npm run test -- tests/unit/coordinator/EvidenceArchiveUploader.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; sync se storage quota limitata.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-117-evidence-archive-<data>.log`.
2. Allegare manifest snippet.
3. Doc aggiornata.

NOTE
- Prevedere flag `--verify-only`.
- Documentare retention policy.

EVIDENCE LOG
- test-results/np-117-evidence-archive-<data>.log
```

## NP-118 – STS Scenario Regression Kanban Sync
```text
AGENT
Atlas-Regress – Scenario Sync

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Sincronizzare regressione scenario STS (seed/outcome) con Kanban entries auto-popolate.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/stsTelemetry/scenarioKanbanSync.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/sts/ScenarioKanbanSync.test.ts
- [esistente] docs/archmage/STS_NumericSimulator_Spec.md (§ Regression Kanban)

DIPENDENZE
- NP-082 (Scenario Seed Inspector)
- NP-098 (Dependency Planner)

OPERAZIONI DA ESEGUIRE
1. Script che legge scenario failures, genera snippet Markdown per Kanban.
2. Validare duplicati e log telemetry `sts_scenario_sync`.
3. Test script e doc.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non modificare Kanban finale automaticamente (solo snippet).
- Vietato ignorare scenario severity.

ASSUNZIONI
- Scenario logs in `data/runs/sts/regressions/`.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/stsTelemetry`
- `npm run test -- tests/unit/sts/ScenarioKanbanSync.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se format Kanban cambia.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-118-scenario-sync-<data>.log`.
2. Allegare snippet generato.
3. Doc aggiornata.

NOTE
- Prevedere severity threshold filter.
- Documentare template Markdown.

EVIDENCE LOG
- test-results/np-118-scenario-sync-<data>.log
```

## NP-119 – Idle Village HUD Performance Telemetry CLI
```text
AGENT
Sentinel-HUD – Performance CLI

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Misurare performance Active HUD (Phase 12) con CLI (FPS, render cost) e report.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/hudPerfCLI.ts — creare scaffolding prima di iniziare.
- [esistente] src/analytics/idleVillageHUDPerf.ts
- [esistente] tests/unit/idleVillage/HUDPerfAnalytics.test.ts
- [esistente] docs/plans/idle_village_plan.md (§ HUD Performance)

DIPENDENZE
- IV-Phase12-active-hud-state-sync

OPERAZIONI DA ESEGUIRE
1. Implementare profiler (PerformanceObserver) con scenario playback.
2. CLI per lanciare run e generare report JSON/Markdown.
3. Telemetry `hud_perf_run`, test analytics/CLI e doc.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non misurare con devtools aperto (documenta check).
- Vietato salvare screenshot automatici fuori test-results/.

ASSUNZIONI
- HUD mini-card layout stabile.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage src/analytics`
- `npm run test -- tests/unit/idleVillage/HUDPerfAnalytics.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se run >3min.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-119-hud-perf-<data>.log`.
2. Allegare report sample.
3. Doc aggiornata.

NOTE
- Prevedere comparazione baseline vs nuovo commit.
- Documentare hardware requisiti.

EVIDENCE LOG
- test-results/np-119-hud-perf-<data>.log
```

## NP-120 – Global Prompt Evidence Dashboard (Read-Only)
```text
AGENT
Nova-Observer – Evidence Dashboard

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire dashboard read-only che mostra stato evidence per tutti i prompt (filters per area).

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/coordinator/PromptEvidenceDashboard.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/tools/coordinator/hooks/usePromptEvidenceData.ts
- [esistente] tests/unit/coordinator/PromptEvidenceDashboard.test.tsx
- [esistente] docs/coordinator/safeguard_monitoring.md (§ Evidence Dashboard)

DIPENDENZE
- NP-117 (Evidence Archive Uploader)
- NP-100 (Safeguard Monitor)

OPERAZIONI DA ESEGUIRE
1. Hook che legge manifest archive + monitor JSON e normalizza dati.
2. Dashboard UI con filters (domain, status) e export CSV.
3. Telemetry `prompt_evidence_dashboard_viewed`, test UI/hook e doc.
4. Safeguard suite.

OPERAZIONI VIETATE
- Non editare evidence state (read-only).
- Vietato mostrare log path sensibili.

ASSUNZIONI
- Manifest JSON costante (NP-117).

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/coordinator`
- `npm run test -- tests/unit/coordinator/PromptEvidenceDashboard.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se UI supera budget 60fps.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-120-evidence-dashboard-<data>.log`.
2. Allegare screenshot dashboard.
3. Doc aggiornata.

NOTE
- Prevedere link rapido a prompt note.
- Documentare data refresh policy.

EVIDENCE LOG
- test-results/np-120-evidence-dashboard-<data>.log
```

## NP-121 – Idle Village Phase E Drop Validator Harness
```text
AGENT
Sentinel-Drop – Validation Harness

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire harness automatizzato per convalidare regole drop Phase E (stat tag, crew cap, fatigue threshold) su IdleVillageMapPage con export JSON per CI.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/tests/DropValidatorHarness.ts — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useDropValidationMatrix.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/dropValidationRules.ts
- [esistente] tests/unit/idleVillage/DropValidatorHarness.test.ts
- [esistente] docs/plans/idle_village_phase_e_plan.md (§ Drop Validation)

DIPENDENZE
- Idle Village Phase E map plan
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config rules (fatigue minima, stat tags obbligatori, crew limits) con schema Zod.
2. Implementare hook che esegue simulazioni drop su dataset fittizi e salva preferenze (PersistenceService).
3. Costruire harness (TS) che genera report JSON/Markdown per CI e CLI `npm run idleVillage:drop-validate`.
4. Integrare telemetria `idle_drop_validator_fail`.
5. Aggiornare doc plan con guida esecuzione + esempi report.

OPERAZIONI VIETATE
- Vietato usare localStorage direttamente.
- Non alterare IdleVillageMapPage runtime (solo hook/harness).
- Nessun numero magico nelle soglie: tutto in config.

ASSUNZIONI
- Dataset sample disponibile in `data/presets/idleVillage/drops`.
- Harness eseguito in Node 20 (nvm).

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/DropValidatorHarness.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se nuove regole Phase E non sono documentate.

KANBAN COMPLETION
1. Stato Kanban → “Completato” + data.
2. Evidence `test-results/np-121-drop-validator-harness-<data>.log`.
3. Allegare esempio report JSON nel log.

NOTE
- Prevedere flag CLI `--scenario <nome>` per filtri rapidi.
- Documentare mapping error code → remediation.

EVIDENCE LOG
- test-results/np-121-drop-validator-harness-<data>.log
```

## NP-122 – Idle Village Stat Tag Config Expansion
```text
AGENT
Aurora-Tags – Config Core

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Ampliare il sistema di stat tag Idle Village introducendo editor config-first, validazione e telemetria per monitorare uso dei nuovi tag Phase E.

PROMPT READINESS
FILE TARGET
- [esistente] src/balancing/config/idleVillage/statTagsConfig.ts
- [nuovo] src/ui/idleVillage/hooks/useStatTagsConfig.ts — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/components/StatTagManager.tsx — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/StatTagManager.test.tsx
- [esistente] docs/plans/idle_village_plan.md (§ Stat Tags Phase E)

DIPENDENZE
- Idle Village Phase E plan
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Estendere config stat tag con categorie, colori, dipendenze e range (schema Zod).
2. Implementare hook + componente manager per creare/ordinare tag, salvataggio via PersistenceService.
3. Aggiungere telemetria `idle_stat_tag_created/updated`.
4. Aggiornare drop validator per leggere nuovi tag e validare compatibilità (solo wiring).
5. Documentare flusso e fornire preset JSON di esempio.

OPERAZIONI VIETATE
- Vietato salvare tag hardcoded nei componenti.
- Non usare setState durante render.
- Nessuna mutazione diretta del config store.

ASSUNZIONI
- UI Idle Village supporta modale manager.
- Designer forniscono palette Style Laboratory.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage src/balancing/config/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/StatTagManager.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se servono nuove categorie oltre quelle documentate.

KANBAN COMPLETION
1. Aggiornare Kanban + note con link doc/preset.
2. Evidence `test-results/np-122-stat-tags-config-<data>.log`.
3. Includere screenshot ASCII del manager nel log.

NOTE
- Prevedere filtri per tag “deprecated”.
- Documentare mapping colori → significato.

EVIDENCE LOG
- test-results/np-122-stat-tags-config-<data>.log
```

## NP-123 – Idle Village Fatigue & Tag Matrix Visualizer
```text
AGENT
Helios-Matrix – Fatigue Insights

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Realizzare visualizzatore matrice (resident vs stat tag) con heatmap fatigue/crew pressure per supportare decisioni Phase E.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/components/FatigueTagMatrix.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useFatigueMatrixData.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/fatigueMatrixConfig.ts
- [esistente] tests/unit/idleVillage/FatigueTagMatrix.test.tsx
- [esistente] docs/plans/idle_village_plan.md (§ Fatigue Matrix)

DIPENDENZE
- NP-122 Stat Tag Config
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config (palette, thresholds, smoothing) con schema.
2. Implementare hook che aggrega telemetria fatigue + tag, salvage preferenze (sort, grouping).
3. Costruire heatmap con tooltip accessibili e filtri crew.
4. Telemetria `idle_fatigue_matrix_viewed/exported`.
5. Doc + test component/hook con dataset fittizio.

OPERAZIONI VIETATE
- Nessun canvas senza fallback.
- Vietato hardcodare thresholds.
- Non accedere a store globale senza hook tipizzati.

ASSUNZIONI
- Telemetria fatigue disponibile da dashboard Phase E.
- Designers richiedono export CSV.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/FatigueTagMatrix.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; ping se la heatmap supera budget 16 ms nei profiler.

KANBAN COMPLETION
1. Stato Kanban + screenshot ASCII heatmap.
2. Evidence `test-results/np-123-fatigue-tag-matrix-<data>.log`.
3. Allegare sample CSV nel log.

NOTE
- Prevedere toggle “normalize per slot”.
- Documentare limitazioni (max 200 resident per run).

EVIDENCE LOG
- test-results/np-123-fatigue-tag-matrix-<data>.log
```

## NP-124 – Idle Village AI Tutor Phase E Onboarding
```text
AGENT
Tutor-AI – Onboarding

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Estendere AI Tutor Mode con un percorso onboarding dedicato a Phase E (drag validation hints, fatigue alerts) seguendo config-first.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/ai/aiTutorMode.ts
- [nuovo] src/ui/idleVillage/ai/components/AITutorOnboardingPanel.tsx — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/aiTutorOnboardingConfig.ts
- [esistente] tests/unit/idleVillage/AITutorOnboardingPanel.test.tsx
- [esistente] docs/plans/idle_village_ai_tutor.md (§ Phase E onboarding)

DIPENDENZE
- NP-086 AI Tutor
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config step onboarding (messaggi, gating, KPI) con schema.
2. Implementare panel UI e hooking con aiTutorMode, salvando progress via PersistenceService.
3. Agganciare avvisi drop validator + fatigue matrix per suggerimenti contestuali.
4. Telemetria `ai_tutor_onboarding_step`.
5. Test component/hook + doc.

OPERAZIONI VIETATE
- Vietato hardcodare testi dentro componenti.
- Non usare setInterval senza cleanup.
- Nessuna mutazione diretta di state AI Tutor.

ASSUNZIONI
- AI Tutor possiede already hooking per hints.
- Voiceover/UX guidelines disponibili.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/AITutorOnboardingPanel.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se onboarding richiede asset audio/video extra.

KANBAN COMPLETION
1. Aggiornare Kanban + link doc onboarding.
2. Evidence `test-results/np-124-ai-tutor-onboarding-<data>.log`.
3. Log deve includere screenshot ASCII del percorso.

NOTE
- Prevedere fallback “skip onboarding”.
- Documentare KPI di successo (drag validi, fatigue ridotta).

EVIDENCE LOG
- test-results/np-124-ai-tutor-onboarding-<data>.log
```

## NP-125 – Idle Village Activity Slot Telemetry Aggregator CLI
```text
AGENT
Signal-Slots – Telemetry CLI

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare CLI che raccoglie eventi ActivitySlot (drag, assign, failure) aggregandoli per resident/slot e producendo report config-first.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/activitySlotTelemetryCLI.ts — creare scaffolding prima di iniziare.
- [esistente] src/analytics/idleVillageActivitySlots.ts (estensione)
- [esistente] tests/unit/idleVillage/ActivitySlotTelemetryCLI.test.ts
- [esistente] docs/analytics/idle_village_activity_slots.md (§ CLI aggregazione)

DIPENDENZE
- NP-016 Activity Slot Telemetry Mapper
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config aggregator (bucket minutes, filters) e schema CLI.
2. Implementare CLI con flag `--resident`, `--slot`, `--export`.
3. Aggiungere telemetria `activity_slot_cli_run`.
4. Test CLI + doc con esempi reali.
5. Salvataggio preferenze CLI in PersistenceService (via rc file).

OPERAZIONI VIETATE
- Nessun I/O sincrono nella pipeline aggregator.
- Vietato esportare CSV fuori `data/exports/idleVillage`.
- Non usare require dinamici per config.

ASSUNZIONI
- Logs in `data/runs/idleVillage/activitySlots/`.
- Node 20 installato tramite nvm.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage src/analytics`
- `npm run test:unit -- tests/unit/idleVillage/ActivitySlotTelemetryCLI.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; ping se dataset supera 200 MB (considerare chunking).

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-125-activity-slot-cli-<data>.log`.
2. Allegare sample export.
3. Documentare flag principali nel log.

NOTE
- Prevedere modalità `--dry-run`.
- Documentare mapping telemetria → colonne report.

EVIDENCE LOG
- test-results/np-125-activity-slot-cli-<data>.log
```

## NP-126 – Idle Village Crew Limit Config Editor
```text
AGENT
Vector-Crew – Limit Editor

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare editor UI/CLI per i limiti crew per ruolo/slot Phase E, con validazione e sincronizzazione con drop validator.

PROMPT READINESS
FILE TARGET
- [esistente] src/balancing/config/idleVillage/crewLimitConfig.ts
- [nuovo] src/ui/idleVillage/components/CrewLimitEditor.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useCrewLimitConfig.ts — creare scaffolding prima di iniziare.
- [nuovo] scripts/idleVillage/crewLimitExport.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/CrewLimitEditor.test.tsx
- [esistente] docs/plans/idle_village_phase_e_plan.md (§ Crew Limits)

DIPENDENZE
- Idle Village Phase E plan
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config limit (per ruolo, per zona, per turno) con schema e default.
2. Implementare hook+editor UI con validazioni e telemetria `crew_limit_updated`.
3. Costruire CLI export per salvare snapshot JSON/Markdown.
4. Aggiornare drop validator harness per leggere i limiti aggiornati.
5. Test component/CLI + doc.

OPERAZIONI VIETATE
- Vietato superare 10 snapshot senza cleanup (usare PersistenceService quotas).
- Non scrivere file fuori data/exports.
- Nessun valore magico per default; usare config.

ASSUNZIONI
- Designer forniscono ranges max/min.
- CLI eseguita da root repo.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage scripts/idleVillage src/balancing/config/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/CrewLimitEditor.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se nuovi ruoli vengono introdotti.

KANBAN COMPLETION
1. Aggiornare Kanban + allegare link doc.
2. Evidence `test-results/np-126-crew-limit-editor-<data>.log`.
3. Log con tabella limiti principali.

NOTE
- Prevedere undo (usa PersistenceService).
- Documentare come importare file JSON esterno.

EVIDENCE LOG
- test-results/np-126-crew-limit-editor-<data>.log
```

## NP-127 – Idle Village Drop Feedback Accessibility Hardening
```text
AGENT
Aeon-A11y – Drop UX

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Eseguire hardening accessibilità per Drop Feedback (annunci ARIA, focus ring, contrasto) in IdleVillageMapPage Phase E.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/components/DropFeedback.tsx
- [esistente] src/ui/idleVillage/components/DropPreviewCard.tsx
- [esistente] src/ui/idleVillage/hooks/useDropFeedback.ts
- [esistente] tests/unit/idleVillage/DropFeedbackA11y.test.tsx
- [esistente] docs/a11y/idle_village_drop_feedback.md

DIPENDENZE
- Style Laboratory palette
- Accessibility lint rules

OPERAZIONI DA ESEGUIRE
1. Audit componenti drop feedback con axe + definire backlog fix.
2. Introdurre annunci ARIA live region + keyboard equivalenti.
3. Aggiornare config palette per garantire contrasto minimo.
4. Scrivere test RTL con jest-axe + doc.
5. Telemetria `drop_feedback_a11y_alert`.

OPERAZIONI VIETATE
- Nessun `outline: none` senza sostituto conforme.
- Vietato usare `role` impropri (rispettare semantics).
- Non duplicare logiche drop validator.

ASSUNZIONI
- Accessibility lint attivo in pipeline.
- IdleVillageMapPage supporta portali ARIA.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage --max-warnings=0`
- `npm run test:unit -- tests/unit/idleVillage/DropFeedbackA11y.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se servono nuove guidelines.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-127-drop-feedback-a11y-<data>.log`.
2. Allegare risultati axe nel log.
3. Documentare fix principali.

NOTE
- Prevedere fallback test-only (disable animations).
- Documentare check manuali (screen reader).

EVIDENCE LOG
- test-results/np-127-drop-feedback-a11y-<data>.log
```

## NP-128 – Idle Village Map Pathfinding Sanity Tests
```text
AGENT
Chronos-Path – Sanity Tests

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Introdurre suite di sanity test per pathfinding IdleVillageMap (crew vs location) con dataset Phase E e CLI snapshot.

PROMPT READINESS
FILE TARGET
- [nuovo] src/balancing/idleVillage/pathfinding/PathSanitySuite.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/PathSanitySuite.test.ts
- [esistente] scripts/idleVillage/pathSanitySnapshot.ts
- [esistente] docs/idle_village/pathfinding_sanity.md

DIPENDENZE
- IV-WS3 map controller
- Storage Testing Framework (per snapshot)

OPERAZIONI DA ESEGUIRE
1. Definire dataset config-first (JSON) con map nodes e constraint.
2. Implementare suite che verifica monotonia costi, rispetto stat tag, crew limits.
3. Creare CLI snapshot builder (JSON) + doc.
4. Telemetria `path_sanity_run`.
5. Test suite + CLI.

OPERAZIONI VIETATE
- Nessun accesso a map data senza version tag.
- Vietato usare random senza seed fisso.
- Non scrivere snapshot fuori data/exports.

ASSUNZIONI
- Map metadata disponibile in `data/presets/idleVillage/map`.
- Node 20 per CLI.

REGRESSION SAFEGUARDS
- `npm run lint -- src/balancing/idleVillage scripts/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/PathSanitySuite.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; ping se snapshot >5 MB.

KANBAN COMPLETION
1. Aggiornare Kanban + allegare link doc.
2. Evidence `test-results/np-128-path-sanity-<data>.log`.
3. Log deve includere tabella fail principali.

NOTE
- Prevedere flag CLI `--diff`.
- Documentare come rigenerare dataset.

EVIDENCE LOG
- test-results/np-128-path-sanity-<data>.log
```

## NP-129 – Idle Village Drag Suggestion Heuristics Doc & Config
```text
AGENT
Nova-Heuristics – Drag Suggestions

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Documentare e configurare heuristics drag suggestion Phase E (score weights, cooldown) con config-first file e doc aggiornata.

PROMPT READINESS
FILE TARGET
- [nuovo] src/balancing/config/idleVillage/dragSuggestionHeuristics.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/hooks/useDragSuggestions.ts
- [esistente] tests/unit/idleVillage/DragSuggestionHeuristics.test.ts
- [esistente] docs/plans/idle_village_phase_e_plan.md (§ Drag Suggestions)

DIPENDENZE
- NP-077 Drag AI Suggestion Harness
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Estrarre heuristics attuali in config (ticks {value, weight}) + schema.
2. Aggiornare hook per usare config + PersistenceService per overrides locali.
3. Scrivere test per scoring/ordering + doc con formula e esempi.
4. Telemetria `drag_suggestion_score`.
5. Aggiornare drop validator per supportare nuovi parametri (solo wiring).

OPERAZIONI VIETATE
- Vietato mantenere heuristics duplicate.
- Non salvare overrides fuori PersistenceService.
- Nessun numero magico nel hook.

ASSUNZIONI
- Score formula già nota dal team AI Tutor.
- Designer forniscono KPI target.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage src/balancing/config/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/DragSuggestionHeuristics.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se formula necessita cambi strutturali.

KANBAN COMPLETION
1. Stato Kanban + doc link.
2. Evidence `test-results/np-129-drag-heuristics-<data>.log`.
3. Log con tabella weights.

NOTE
- Prevedere CLI `--preview` (future work).
- Documentare fallback se config mancante.

EVIDENCE LOG
- test-results/np-129-drag-heuristics-<data>.log
```

## NP-130 – Idle Village Crew Role Swap Simulator
```text
AGENT
Vector-CrewSim – Role Swap

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Simulare swap ruoli crew per valutare impatto su fatigue e drop success Phase E, con UI what-if e CLI export.

PROMPT READINESS
FILE TARGET
- [nuovo] src/balancing/idleVillage/CrewRoleSwapSimulator.ts — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/components/CrewRoleSwapPanel.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useCrewRoleSwap.ts — creare scaffolding prima di iniziare.
- [nuovo] scripts/idleVillage/crewRoleSwapCLI.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/CrewRoleSwapSimulator.test.ts
- [esistente] docs/plans/idle_village_plan.md (§ Role Swap Simulator)

DIPENDENZE
- Crew Scheduler controller
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Implementare simulatore (pure function + config weights) con seeds deterministici.
2. Costruire hook + UI panel per scenario what-if, salvataggio preferenze.
3. Creare CLI per batch run e export JSON/Markdown.
4. Telemetria `crew_role_swap_run`.
5. Test simulator/UI/CLI + doc.

OPERAZIONI VIETATE
- Vietato modificare scheduler live state (solo copie).
- Nessun random senza seed.
- Non salvare file fuori data/exports.

ASSUNZIONI
- Crew data accessibile via controller API.
- Designers definiscono KPI (fatigue delta, success rate).

REGRESSION SAFEGUARDS
- `npm run lint -- src/balancing/idleVillage src/ui/idleVillage scripts/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/CrewRoleSwapSimulator.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se runtime >60 s per 100 scenari.

KANBAN COMPLETION
1. Aggiornare Kanban + allegare screenshot ASCII panel.
2. Evidence `test-results/np-130-crew-role-swap-<data>.log`.
3. Log con tabella scenari principali.

NOTE
- Prevedere export CSV per analytics.
- Documentare come importare preset scenario.

EVIDENCE LOG
- test-results/np-130-crew-role-swap-<data>.log
```

## NP-131 – STS Preset Diff Visualizer
```text
AGENT
Aurora-STS – Preset Diff

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare visualizzatore diff per preset STS (config → UI) con timeline modifiche, telemetria e CLI snippet per report.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/tools/sts/components/STSPresetDiffVisualizer.tsx
- [nuovo] src/ui/tools/sts/hooks/useSTSPresetDiff.ts — creare scaffolding prima di iniziare.
- [nuovo] scripts/sts/presetDiffCLI.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/sts/STSPresetDiffVisualizer.test.tsx
- [esistente] docs/tools/sts_preset_diff_visualizer.md

DIPENDENZE
- KS-081-sts-combat-config
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire modello diff (ticks, weights, metadata) e schema.
2. Implementare hook + componente UI con highlight e timeline.
3. Aggiungere CLI per generare snippet Markdown diff.
4. Telemetria `sts_preset_diff_viewed/exported`.
5. Test UI/CLI + doc.

OPERAZIONI VIETATE
- Nessun accesso a preset fuori BalancerConfigStore.
- Vietato mostrare dati sensibili (solo config).
- Non usare JSON patch senza validazione.

ASSUNZIONI
- Preset repository versionato.
- Designer richiedono evidence diff.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts scripts/sts`
- `npm run test:unit -- tests/unit/sts/STSPresetDiffVisualizer.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se dataset >1 MB.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-131-sts-preset-diff-<data>.log`.
2. Allegare diff snippet.
3. Doc aggiornata.

NOTE
- Prevedere filtro per card type.
- Documentare come salvare diff per audit.

EVIDENCE LOG
- test-results/np-131-sts-preset-diff-<data>.log
```

## NP-132 – STS Quick Preset CLI Runner
```text
AGENT
Vector-STS – Preset Runner

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare CLI rapida per lanciare simulazioni STS su preset selezionati (JSON) con output riassuntivo e integrazione scenarioRunner.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/sts/quickPresetRunner.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/sts/QuickPresetRunner.test.ts
- [nuovo] data/presets/sts/quick/*.json — creare scaffolding prima di iniziare.
- [esistente] docs/cli/sts_quick_preset_runner.md

DIPENDENZE
- scripts/balancer/scenarioRunner.ts
- BalancerConfigStore

OPERAZIONI DA ESEGUIRE
1. Definire formato preset quick-run (seed, enemy set, KPI) con schema.
2. Costruire CLI con flags `--preset`, `--iterations`, `--export`.
3. Telemetria `sts_quick_run`.
4. Test CLI + doc + sample preset.
5. Salvataggio preferenze in PersistenceService (rc file).

OPERAZIONI VIETATE
- Nessun run senza validare preset schema.
- Vietato scrivere output fuori test-results.
- Non bypassare scenarioRunner per risultati.

ASSUNZIONI
- Preset quick-run <1 MB.
- Node 20 attivo via nvm.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/sts src/balancing`
- `npm run test:unit -- tests/unit/sts/QuickPresetRunner.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; ping se run >3 min.

KANBAN COMPLETION
1. Aggiornare Kanban + link doc CLI.
2. Evidence `test-results/np-132-quick-preset-runner-<data>.log`.
3. Log con tabella KPI principali.

NOTE
- Prevedere `--diff <baseline>` (future).
- Documentare come aggiungere nuovi preset.

EVIDENCE LOG
- test-results/np-132-quick-preset-runner-<data>.log
```

## NP-133 – STS Mana Surge Multi-Threshold Config
```text
AGENT
Pulse-Telemetry – Surge Config

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Espandere sistema Mana Surge con supporto multi-threshold (per archetype/modo) e UI config-first.

PROMPT READINESS
FILE TARGET
- [esistente] src/balancing/config/sts/manaSurgeConfig.ts (estensione)
- [esistente] src/ui/tools/sts/hooks/useManaSurgeAlert.ts
- [nuovo] src/ui/tools/sts/components/ManaSurgeConfigPanel.tsx — creare scaffolding prima di iniziare.
- [esistente] tests/unit/sts/ManaSurgeConfigPanel.test.tsx
- [esistente] docs/plans/sts_simulator_ui_redesign_plan.md (§ Mana Surge)

DIPENDENZE
- NP-008 Mana Surge Alerting
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Estendere config per threshold per archetype/modo + schema.
2. Implementare panel UI per editing e salvataggio preferenze.
3. Aggiornare hook alert per usare multi-threshold + telemetria `mana_surge_profile_selected`.
4. Test hook/UI + doc.
5. Registrare nuovi eventi in telemetry spec.

OPERAZIONI VIETATE
- Vietato usare local state senza PersistenceService.
- Nessun valore magico per threshold default.
- Non duplicare logica alert.

ASSUNZIONI
- Telemetry dashboard già disponibile.
- Designer forniscono profili default.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts src/balancing/config/sts`
- `npm run test:unit -- tests/unit/sts/ManaSurgeConfigPanel.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se KPI cambiano.

KANBAN COMPLETION
1. Aggiornare Kanban + note con link doc.
2. Evidence `test-results/np-133-mana-surge-config-<data>.log`.
3. Log con tabella profili.

NOTE
- Prevedere import/export JSON profili.
- Documentare fallback se dati telemetria mancanti.

EVIDENCE LOG
- test-results/np-133-mana-surge-config-<data>.log
```

## NP-134 – STS Telemetry Evidence Consolidator
```text
AGENT
Sentinel-STS – Evidence Consolidator

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare tool che consolida evidence STS (lint/test/build logs) in un unico manifest con checksum e link rapidi.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/stsTelemetry/evidenceConsolidator.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/sts/TelemetryEvidenceConsolidator.test.ts
- [esistente] docs/analytics/sts_telemetry_pipeline.md (§ Evidence)
- [nuovo] data/archives/sts_evidence_manifest.json — creare scaffolding prima di iniziare.

DIPENDENZE
- NP-117 Evidence Archive Uploader
- KS-081 STS telemetry dashboard

OPERAZIONI DA ESEGUIRE
1. Implementare consolidator che legge log in test-results/np-1xx-sts-*.
2. Generare manifest JSON con metadata (prompt, timestamp, checksum).
3. Telemetria `sts_evidence_manifest_generated`.
4. Test script + doc + sample manifest.
5. Integrare con CLI existing (option `--publish`).

OPERAZIONI VIETATE
- Vietato modificare log originali.
- Nessun upload remoto (solo locale).
- Non salvare manifest senza checksum.

ASSUNZIONI
- Node 20.
- Logs seguono naming standard.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/stsTelemetry`
- `npm run test:unit -- tests/unit/sts/TelemetryEvidenceConsolidator.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; ping se manifest supera 10 MB.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-134-sts-evidence-consolidator-<data>.log`.
2. Allegare snippet manifest.
3. Doc aggiornata.

NOTE
- Prevedere flag `--verify`.
- Documentare come aggiungere nuovi percorsi log.

EVIDENCE LOG
- test-results/np-134-sts-evidence-consolidator-<data>.log
```

## NP-135 – Punch Club PWA Cold Start Profiler
```text
AGENT
Cascade-PC – Cold Start

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Profilare cold start della PWA Punch Club (PC-M2E) acquisendo metriche (<3 s target) e automatizzando evidenze.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/punchClub/hooks/usePWAPerfProfiler.ts — creare scaffolding prima di iniziare.
- [nuovo] src/ui/punchClub/components/PWAPerfPanel.tsx — creare scaffolding prima di iniziare.
- [nuovo] scripts/punchClub/pwaColdStartProfiler.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/punchClub/PWAPerfProfiler.test.ts
- [esistente] docs/strategy/punch_club_playtest.md (§ Cold Start)

DIPENDENZE
- PC-M2E plan
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Implementare hook che misura TTFB, FCP, ready event e salva preferenze (PersistenceService).
2. Costruire panel UI + telemetry `pwa_cold_start_profiled`.
3. Creare script CLI che lancia profili su device list (config JSON).
4. Test hook/UI/CLI + doc + evidence workflow.
5. Integrare con evidence log automatico `test-results/pc-m2e-pwa-profiler-<data>.log`.

OPERAZIONI VIETATE
- Vietato usare API non supportate da browser target.
- Non raccogliere dati personali.
- Nessun hardcode device list (usare config).

ASSUNZIONI
- Service worker già aggiornato.
- Perf monitor stack disponibile.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/punchClub scripts/punchClub`
- `npm run test:unit -- tests/unit/punchClub/PWAPerfProfiler.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se device list supera 10 entries.

KANBAN COMPLETION
1. Aggiornare Kanban + link doc.
2. Evidence `test-results/np-135-pwa-cold-start-<data>.log`.
3. Log con tabella metriche.

NOTE
- Prevedere export CSV.
- Documentare differenze mobile/desktop.

EVIDENCE LOG
- test-results/np-135-pwa-cold-start-<data>.log
```

## NP-136 – Config Balancer Formula Safety Reporter
```text
AGENT
Nova-Formula – Safety Reporter

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire reporter che raccoglie risultati FormulaEngine (cycle/range lint) e genera dashboard + CLI per Phase 10 safety review.

PROMPT READINESS
FILE TARGET
- [nuovo] src/balancing/config/FormulaSafetyReporter.ts — creare scaffolding prima di iniziare.
- [nuovo] src/ui/balancing/components/FormulaSafetyPanel.tsx — creare scaffolding prima di iniziare.
- [nuovo] scripts/balancer/formulaSafetyReport.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/balancing/FormulaSafetyReporter.test.ts
- [esistente] docs/plans/config_driven_balancer_plan.md (§ Formula Safety Reporter)

DIPENDENZE
- CF-Phase10-card-safety
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Implementare reporter service che legge esiti safety + severity scoring.
2. Costruire panel UI con filters + telemetria `formula_safety_viewed`.
3. Creare CLI per generare Markdown/JSON con top issues.
4. Test service/UI/CLI + doc.
5. Integrare storage testing per snapshot.

OPERAZIONI VIETATE
- Nessun numero magico per severity (config).
- Vietato mutare config mentre si legge.
- Non salvare report fuori test-results.

ASSUNZIONI
- FormulaEngine expose API lint results.
- Designer definiscono thresholds severity.

REGRESSION SAFEGUARDS
- `npm run lint -- src/balancing src/ui/balancing scripts/balancer`
- `npm run test:unit -- tests/unit/balancing/FormulaSafetyReporter.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se severity model cambia.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-136-formula-safety-reporter-<data>.log`.
2. Allegare screenshot panel.
3. Doc aggiornata.

NOTE
- Prevedere export CSV per audit.
- Documentare come integrare con Risk Matrix.

EVIDENCE LOG
- test-results/np-136-formula-safety-reporter-<data>.log
```

## NP-137 – Config Balancer Card Weight Heatmap
```text
AGENT
Helix-Balancer – Weight Heatmap

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Visualizzare pesi carte/stats Balancer (Phase 10) con heatmap interattiva e export per marginal utility pipeline.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/balancing/components/CardWeightHeatmap.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/balancing/hooks/useCardWeightMatrix.ts — creare scaffolding prima di iniziare.
- [nuovo] src/balancing/config/heatmapConfig.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/balancing/CardWeightHeatmap.test.tsx
- [esistente] docs/plans/config_driven_balancer_plan.md (§ Weight Heatmap)

DIPENDENZE
- BalancerConfigStore
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config heatmap (palette, buckets, smoothing).
2. Implementare hook + componente heatmap con filters (card type, stat).
3. Telemetria `balancer_weight_heatmap_viewed`.
4. Test UI/hook + doc.
5. Export CSV/JSON per Phase 10.5 pipeline.

OPERAZIONI VIETATE
- Nessuna palette hardcoded nei componenti.
- Vietato usare canvas senza fallback.
- Non leggere config senza tipizzazione.

ASSUNZIONI
- Stat weights disponibili in store.
- UI supporta scroll orizzontale.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/balancing src/balancing`
- `npm run test:unit -- tests/unit/balancing/CardWeightHeatmap.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se palette deve seguire tema specifico.

KANBAN COMPLETION
1. Aggiornare Kanban + allegare screenshot ASCII.
2. Evidence `test-results/np-137-card-weight-heatmap-<data>.log`.
3. Log con tabella top weights.

NOTE
- Prevedere tooltip con formula.
- Documentare performance target.

EVIDENCE LOG
- test-results/np-137-card-weight-heatmap-<data>.log
```

## NP-138 – Coordinator Safeguard Regression Monitor
```text
AGENT
Sentinel-Coord – Safeguard Monitor

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire monitor che esegue periodicamente lint/test/build/kanban suite e segnala regressioni con report centralizzato.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/coordinator/safeguardRegressionMonitor.ts — creare scaffolding prima di iniziare.
- [nuovo] src/ui/tools/coordinator/SafeguardMonitorPanel.tsx — creare scaffolding prima di iniziare.
- [esistente] tests/unit/coordinator/SafeguardRegressionMonitor.test.ts
- [esistente] docs/coordinator/safeguard_monitoring.md (§ Regression Monitor)

DIPENDENZE
- SAFEGUARD_SYSTEM_GUIDE.md
- Node/Shell runtime doctor

OPERAZIONI DA ESEGUIRE
1. Implementare script che lancia suite (lint/test/build:check/kanban:lint) e salva output standard in JSON manifest.
2. Costruire panel UI read-only con stato ultimo run, timers, evidenze.
3. Telemetria `safeguard_monitor_run`.
4. Test script/UI + doc.
5. Prevedere hooking con Evidence Archive (NP-117).

OPERAZIONI VIETATE
- Vietato auto-commit modifiche.
- Non lanciare comandi distruttivi.
- Nessuna modifica Kanban automatica.

ASSUNZIONI
- Node 20 disponibile.
- Safeguard suite già configurata.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/coordinator src/ui/tools/coordinator`
- `npm run test:unit -- tests/unit/coordinator/SafeguardRegressionMonitor.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se scheduler richiesto.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-138-safeguard-monitor-<data>.log`.
2. Allegare manifest snippet.
3. Doc aggiornata.

NOTE
- Prevedere CLI `--once` e `--watch`.
- Documentare severity policy.

EVIDENCE LOG
- test-results/np-138-safeguard-monitor-<data>.log
```

## NP-139 – Coordinator Node Runtime Doctor
```text
AGENT
Vector-Coord – Runtime Doctor

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Automatizzare audit runtime Node/NPM (nvm, PATH) per prevenire errori “node not found”, con guida fix e integrazione safegards.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/coordinator/runtimeDoctor.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/coordinator/RuntimeDoctor.test.ts
- [nuovo] docs/coordinator/runtime_recovery.md — creare scaffolding prima di iniziare.
- [esistente] .envrc (verifica)

DIPENDENZE
- .nvmrc (Node 20.19.6)
- SAFEGUARD_SYSTEM_GUIDE.md

OPERAZIONI DA ESEGUIRE
1. Implementare tool che verifica PATH, nvm, node/npm availability e suggerisce fix (config JSON).
2. Integrare con direnv/.envrc generando warning strutturati.
3. Telemetria `runtime_doctor_run`.
4. Test script + doc + esempi output.
5. Collegare ai log evidence (test-results/coord-node-runtime-restore-<data>.log).

OPERAZIONI VIETATE
- Vietato modificare dotfile senza backup diff.
- Non installare pacchetti globali.
- Nessun comando distruttivo.

ASSUNZIONI
- Utente usa zsh.
- Direnv disponibile (se no, documentare).

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/coordinator`
- `npm run test:unit -- tests/unit/coordinator/RuntimeDoctor.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se shell ≠ zsh.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-139-runtime-doctor-<data>.log`.
2. Allegare diff dotfile nel log.
3. Doc aggiornata.

NOTE
- Prevedere flag `--fix` (interattivo).
- Documentare step manuali fallback.

EVIDENCE LOG
- test-results/np-139-runtime-doctor-<data>.log
```

## NP-140 – Idle Village Sandbox Scenario Bundle Generator
```text
AGENT
Helios-Sandbox – Scenario Bundler

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Generare bundle sandbox Idle Village (WorkerCard, ActivitySlot, LocationCard) a partire da preset JSON per test rapidi Phase E.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/sandboxBundleGenerator.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/sandbox/VillageSandbox.tsx (integrazione)
- [nuovo] src/ui/idleVillage/hooks/useSandboxBundles.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/SandboxBundleGenerator.test.ts
- [esistente] docs/sandbox/idle_village_sandbox.md

DIPENDENZE
- VillageSandbox component refactor
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire formato bundle (resident, location, slots) con schema.
2. Implementare generator CLI che crea file JSON + note Markdown.
3. Aggiornare sandbox per importare bundle e salvare preferenze.
4. Telemetria `sandbox_bundle_loaded`.
5. Test CLI/UI + doc.

OPERAZIONI VIETATE
- Non modificare componenti legacy gameplay (solo sandbox).
- Vietato salvare bundle fuori data/presets.
- Nessun valore magico per cooldown.

ASSUNZIONI
- Sandbox usa WorkerCard/ActivitySlot/LocationCard modulari.
- Designer forniscono preset iniziali.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/SandboxBundleGenerator.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se bundle >1 MB.

KANBAN COMPLETION
1. Aggiornare Kanban + log `test-results/np-140-sandbox-bundle-<data>.log`.
2. Allegare sample bundle.
3. Doc aggiornata.

NOTE
- Prevedere CLI `--validate` per bundle esistenti.
- Documentare come aggiungere assets.

EVIDENCE LOG
- test-results/np-140-sandbox-bundle-<data>.log
```

## NP-143 – Idle Village Map Asset Consistency CLI
```text
AGENT
Vector-Idle – Map Asset QA

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare CLI che verifica consistenza tra metadata mappa Phase E (JSON) e componenti UI (WorkerCard/LocationCard) segnalando asset mancanti.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/mapAssetConsistency.ts — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/config/mapAssetRegistry.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/MapAssetConsistency.test.ts
- [esistente] docs/idle_village/map_asset_consistency.md

DIPENDENZE
- VillageSandbox component refactor
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire registry config-first con mapping asset → component.
2. Implementare CLI che confronta metadata e component exports, generando report Markdown.
3. Telemetria `map_asset_consistency_run`.
4. Test CLI + doc e salvare log in test-results.
5. Integrare con direnv/nvm instructions (Node 20).

OPERAZIONI VIETATE
- Non modificare componenti legacy.
- Vietato ignorare warning senza log.
- Nessun path hardcoded fuori repo.

ASSUNZIONI
- Metadata disponibili in `data/presets/idleVillage/map`.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage src/ui/idleVillage/config`
- `npm run test:unit -- tests/unit/idleVillage/MapAssetConsistency.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; sync se asset pipeline cambia formato.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-143-map-asset-consistency-<data>.log`.
2. Allegare estratto report.
3. Doc aggiornata.

NOTE
- Prevedere flag `--auto-open-report`.
- Documentare severity scoring.

EVIDENCE LOG
## NP-145 – Idle Village Crew Rotation Knowledge Base
```text
AGENT
Atlas-Crew – Knowledge Base

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Generare wiki/config per le rotazioni crew Phase E con CLI che produce Markdown da config e UI viewer read-only.

PROMPT READINESS
FILE TARGET
- [nuovo] src/balancing/config/idleVillage/crewRotationConfig.ts — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/components/CrewRotationViewer.tsx — creare scaffolding prima di iniziare.
- [nuovo] scripts/idleVillage/crewRotationDoc.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/CrewRotationViewer.test.tsx
- [esistente] docs/idle_village/crew_rotation_guide.md

DIPENDENZE
- Crew scheduler controller
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config rotazioni (slot, prereq, KPI) con schema Zod.
2. Implementare viewer UI con filtri e salvataggio preferenze.
3. Creare CLI che esporta doc Markdown/CSV dai config.
4. Telemetria `crew_rotation_viewed`.
5. Test UI/CLI + doc.

OPERAZIONI VIETATE
- Non hardcodare rotazioni in componenti.
- Vietato sovrascrivere config senza backup.
- Nessun accesso scheduler live.

ASSUNZIONI
- Designer forniscono rotazioni base.

REGRESSION SAFEGUARDS
- `npm run lint -- src/balancing/config/idleVillage src/ui/idleVillage scripts/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/CrewRotationViewer.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se doc richiede screenshot extra.

KANBAN COMPLETION
1. Stato Kanban + allegare link doc generato.
2. Evidence `test-results/np-145-crew-rotation-<data>.log`.
3. Log con snippet Markdown.

NOTE
- Prevedere versioning delle rotazioni.
- Documentare come aggiornare config.

EVIDENCE LOG
- test-results/np-145-crew-rotation-<data>.log
```

## NP-146 – Idle Village Phase E Scenario Exporter
```text
AGENT
Vector-Idle – Scenario Export

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare exporter CLI che genera scenari Phase E (resident, slot, tag) per test automatici e sandbox, con schema validato.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/phaseEScenarioExport.ts — creare scaffolding prima di iniziare.
- [nuovo] src/balancing/idleVillage/PhaseEScenarioSerializer.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/PhaseEScenarioSerializer.test.ts
- [esistente] data/exports/idleVillage/phaseE_scenarios/
- [esistente] docs/idle_village/phase_e_scenario_export.md

DIPENDENZE
- Map/segnali Phase E
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire serializer tick-based con schema Zod.
2. Implementare CLI con filtri (crew, tag, fatigue) e export JSON/Markdown.
3. Telemetria `phase_e_scenario_exported`.
4. Test serializer/CLI + doc.
5. Includere hooking con sandbox bundler.

OPERAZIONI VIETATE
- Non scrivere export fuori data/exports.
- Vietato includere dati PII.
- Nessun JSON senza schema version.

ASSUNZIONI
- Node 20 via nvm.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage src/balancing/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/PhaseEScenarioSerializer.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; sync se export >10 MB.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-146-phase-e-scenario-export-<data>.log`.
2. Allegare lista file generati.
3. Doc aggiornata.

NOTE
- Prevedere flag `--diff` con baseline.
- Documentare pipeline QA.

EVIDENCE LOG
- test-results/np-146-phase-e-scenario-export-<data>.log
```

## NP-148 – Idle Village Phase E Telemetry Spec Update
```text
AGENT
Atlas-Telemetry – Spec Update

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Aggiornare la specifica telemetria Idle Village Phase E (doc + schema) incorporando nuovi eventi drop/fatigue/crew e generando validatori.

PROMPT READINESS
FILE TARGET
- [nuovo] src/analytics/idleVillageTelemetrySchema.ts — creare scaffolding prima di iniziare.
- [nuovo] scripts/idleVillage/telemetrySpecGenerator.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/idleVillage/TelemetrySpecGenerator.test.ts
- [esistente] docs/analytics/idle_village_telemetry_spec.md
- [esistente] test-results/templates/idleVillageTelemetrySpecReport.md

DIPENDENZE
- NP-100 Safeguard Monitor
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire schema Zod per tutti i nuovi eventi Phase E.
2. Implementare generator CLI che crea spec Markdown/CSV dai JSON.
3. Telemetria `idle_telemetry_spec_generated`.
4. Test schema/generator + doc.
5. Integrare con evidence uploader.

OPERAZIONI VIETATE
- Non lasciare eventi senza doc.
- Vietato generare spec senza version tag.
- Nessun accesso diretto a localStorage.

ASSUNZIONI
- Input JSON in `data/telemetry/idleVillage/phaseE`.

REGRESSION SAFEGUARDS
- `npm run lint -- src/analytics scripts/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/TelemetrySpecGenerator.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se nuovi eventi emergono.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-148-telemetry-spec-<data>.log`.
2. Allegare snippet spec.
3. Doc aggiornata.

NOTE
- Prevedere CLI `--diff` per versioni.
- Documentare mapping event → KPIs.

EVIDENCE LOG
- test-results/np-148-telemetry-spec-<data>.log
```

## NP-149 – Idle Village Drag Error Recovery UX
```text
AGENT
Nova-Recovery – Drag UX

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Migliorare UX di recupero errori drag (drop falliti) con overlay interattivo, suggerimenti e logging Phase E.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/components/DragErrorOverlay.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useDragErrorRecovery.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/dragErrorConfig.ts
- [esistente] tests/unit/idleVillage/DragErrorOverlay.test.tsx
- [esistente] docs/plans/idle_village_phase_e_plan.md (§ Drag Error Recovery)

DIPENDENZE
- Drop validator harness
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire config error type → remediation.
2. Implementare hook/overlay con suggerimenti contestuali e telemetria `drag_error_overlay_used`.
3. Salvare preferenze (auto open) via PersistenceService.
4. Test UI/hook + doc.
5. Integrare con AI Tutor onboarding.

OPERAZIONI VIETATE
- Nessun overlay sempre attivo (solo on error).
- Vietato hardcodare testi.
- Non introdurre flussi blocking non approvati.

ASSUNZIONI
- Errori drop già loggati.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/DragErrorOverlay.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se overlay deve seguire design particolare.

KANBAN COMPLETION
1. Stato Kanban + screenshot overlay.
2. Evidence `test-results/np-149-drag-error-recovery-<data>.log`.
3. Log con tabella errori principali.

NOTE
- Documentare tempi medi di recupero.
- Prevedere API future per automation.

EVIDENCE LOG
- test-results/np-149-drag-error-recovery-<data>.log
```

## NP-150 – Idle Village Crew Limit Regression Tests
```text
AGENT
Sentinel-Limits – Regression Tests

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Introdurre suite di regression test per Crew Limit Config (Phase E) assicurando che modifiche future non violino constraint doccati.

PROMPT READINESS
FILE TARGET
- [esistente] tests/unit/idleVillage/CrewLimitRegression.test.ts
- [nuovo] src/balancing/idleVillage/crewLimitScenarios.json — creare scaffolding prima di iniziare.
- [nuovo] scripts/idleVillage/crewLimitRegressionReport.ts — creare scaffolding prima di iniziare.
- [esistente] docs/idle_village/crew_limit_regression.md

DIPENDENZE
- Crew limit editor
- Storage Testing Framework

OPERAZIONI DA ESEGUIRE
1. Definire dataset scenario + expected outcome.
2. Scrivere test Vitest che iterano gli scenari e generano report JSON.
3. CLI per generare log markdown e telemetria `crew_limit_regression_run`.
4. Documentare flusso aggiornamento.
5. Collegare con drop validator per cross-check.

OPERAZIONI VIETATE
- Nessun scenario senza descrizione.
- Vietato modificare config reale in test (usare copie).
- Non scrivere file fuori test-results.

ASSUNZIONI
- Node 20.

REGRESSION SAFEGUARDS
- `npm run lint -- tests/unit/idleVillage scripts/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/CrewLimitRegression.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; ping se dataset supera 200 casi.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-150-crew-limit-regression-<data>.log`.
2. Allegare tabella risultati.
3. Doc aggiornata.

NOTE
- Prevedere severity scoring.
- Documentare come aggiungere nuovi scenari.

EVIDENCE LOG
- test-results/np-150-crew-limit-regression-<data>.log
```

## NP-151 – STS Scenario Failure Insights Dashboard
```text
AGENT
Helix-STS – Failure Insights

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire dashboard che mostra gli scenari STS falliti (regressioni) con filtri per seed, archetype e KPI, integrato con scenario logs.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/sts/components/ScenarioFailureDashboard.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/tools/sts/hooks/useScenarioFailureData.ts — creare scaffolding prima di iniziare.
- [nuovo] scripts/sts/scenarioFailureAggregator.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/sts/ScenarioFailureDashboard.test.tsx
- [esistente] docs/tools/sts_scenario_failure_dashboard.md

DIPENDENZE
- NP-118 Scenario Kanban Sync
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Aggregare failure logs in JSON normalizzati (script).
2. Hook UI che legge manifest, salva filtri e telemetria `sts_scenario_failure_viewed`.
3. Dashboard con card KPI, timeline, export CSV.
4. Test aggregator/UI + doc.
5. Collegare link rapido ai prompt Kanban.

OPERAZIONI VIETATE
- Nessuna modifica automatica Kanban.
- Vietato mostrare dati sensibili.
- Non usare fetch non tipizzati.

ASSUNZIONI
- Logs in `data/runs/sts/regressions`.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts scripts/sts`
- `npm run test:unit -- tests/unit/sts/ScenarioFailureDashboard.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se dataset >10 MB.

KANBAN COMPLETION
1. Stato Kanban + screenshot dashboard.
2. Evidence `test-results/np-151-sts-failure-dashboard-<data>.log`.
3. Log con tabella failure.

NOTE
- Prevedere quick filter “High severity”.
- Documentare come aggiornare manifest.

EVIDENCE LOG
- test-results/np-151-sts-failure-dashboard-<data>.log
```

## NP-152 – STS Monte Carlo Batch Scheduler
```text
AGENT
Vector-STS – Batch Scheduler

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare scheduler per run Monte Carlo STS che accoda preset/seed e produce report JSON/Markdown con progress tracking.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/sts/monteCarloBatchScheduler.ts — creare scaffolding prima di iniziare.
- [nuovo] src/balancing/monteCarlo/BatchSchedulerConfig.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/sts/MonteCarloBatchScheduler.test.ts
- [esistente] docs/analytics/sts_monteCarlo_batch.md

DIPENDENZE
- scenarioRunner
- PersistenceService (per checkpoint)

OPERAZIONI DA ESEGUIRE
1. Definire config run queue + schema.
2. Implementare scheduler CLI con resumable checkpoints (PersistenceService).
3. Telemetria `sts_batch_scheduler_run`.
4. Test scheduler CLI + doc.
5. Integrare con evidence consolidator.

OPERAZIONI VIETATE
- Non eseguire run senza validare config.
- Vietato cancellare output parziali.
- Nessuna esecuzione parallela senza controllo.

ASSUNZIONI
- Node 20.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/sts src/balancing/monteCarlo`
- `npm run test:unit -- tests/unit/sts/MonteCarloBatchScheduler.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; sync se run >2 h.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-152-sts-batch-scheduler-<data>.log`.
2. Allegare snippet queue.
3. Doc aggiornata.

NOTE
- Prevedere `--resume`.
- Documentare storage location.

EVIDENCE LOG
- test-results/np-152-sts-batch-scheduler-<data>.log
```

## NP-153 – STS Combo Telemetry Correlator
```text
AGENT
Aurora-STS – Combo Correlator

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Correlare telemetria combo (card pair/triple) con outcome (turns to win, mana spike) generando dataset e UI pivot per bilanciamento.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/sts/components/ComboTelemetryCorrelator.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/tools/sts/hooks/useComboCorrelation.ts — creare scaffolding prima di iniziare.
- [nuovo] scripts/sts/comboCorrelationGenerator.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/sts/ComboTelemetryCorrelator.test.tsx
- [esistente] docs/analytics/sts_combo_correlation.md

DIPENDENZE
- Combo heatmap config
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Creare generator script che produce dataset correlato.
2. Hook UI per filtri/run ID e telemetria `sts_combo_correlation_viewed`.
3. Costruire pivot table UI con export CSV.
4. Test script/UI + doc.
5. Collegare a risk matrix (future).

OPERAZIONI VIETATE
- Nessun accesso a telemetria non tipizzata.
- Vietato mostrare dati incompleti senza warning.
- Non hardcodare soglie.

ASSUNZIONI
- Telemetry logs disponibili.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/sts scripts/sts`
- `npm run test:unit -- tests/unit/sts/ComboTelemetryCorrelator.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se dataset >5 MB.

KANBAN COMPLETION
1. Stato Kanban + screenshot pivot.
2. Evidence `test-results/np-153-combo-correlation-<data>.log`.
3. Log con principali correlazioni.

NOTE
- Prevedere `--delta` vs baseline.
- Documentare KPI.

EVIDENCE LOG
- test-results/np-153-combo-correlation-<data>.log
```

## NP-154 – STS Preset Integrity Linter
```text
AGENT
Sentinel-Preset – Integrity Lint

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Sviluppare linter che verifica preset STS (ticks, weights, dependencies) assicurando integrità e versioning corretto.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/sts/presetIntegrityLint.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/sts/PresetIntegrityLint.test.ts
- [nuovo] src/balancing/config/sts/presetIntegrityRules.ts — creare scaffolding prima di iniziare.
- [esistente] docs/tools/sts_preset_integrity.md

DIPENDENZE
- BalancerConfigStore
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire regole lint con severities config-first.
2. Implementare CLI lint con output JSON/Markdown.
3. Telemetria `sts_preset_lint_run`.
4. Test lint rules + doc.
5. Collegare con diff visualizer.

OPERAZIONI VIETATE
- Non auto-fixare preset.
- Vietato fallire silenziosamente.
- Nessun accesso a config via require dinamico.

ASSUNZIONI
- Preset in data/presets/sts.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/sts src/balancing/config/sts`
- `npm run test:unit -- tests/unit/sts/PresetIntegrityLint.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; sync se nuove regole richieste.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-154-preset-integrity-<data>.log`.
2. Allegare estratto lint.
3. Doc aggiornata.

NOTE
- Prevedere flag `--max-warnings`.
- Documentare come aggiungere nuove regole.

EVIDENCE LOG
- test-results/np-154-preset-integrity-<data>.log
```

## NP-155 – Punch Club PWA Install Funnel Dashboard
```text
AGENT
Cascade-PC – Install Funnel

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire dashboard che visualizza il funnel installazione PWA (prompt shown/success/dismissed) con breakdown device e export KPI.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/punchClub/components/PWAInstallFunnel.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/punchClub/hooks/usePWAInstallFunnel.ts — creare scaffolding prima di iniziare.
- [nuovo] src/analytics/punchClubPWAInstall.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/punchClub/PWAInstallFunnel.test.tsx
- [esistente] docs/strategy/punch_club_playtest.md (§ Install Funnel)

DIPENDENZE
- PC-M2E plan
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Definire schema eventi install tracker.
2. Implementare hook/UI con filtri device/time e telemetria `pwa_install_funnel_viewed`.
3. Export CSV/JSON + doc KPI.
4. Test hook/UI + doc.
5. Integrare con evidence log.

OPERAZIONI VIETATE
- Vietato usare dati utente personali.
- Nessun valore magico per KPI target (leggere da config).
- Non duplicare logica install tracker.

ASSUNZIONI
- usePWAInstallTracker già disponibile.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/punchClub src/analytics`
- `npm run test:unit -- tests/unit/punchClub/PWAInstallFunnel.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se KPI cambiano.

KANBAN COMPLETION
1. Stato Kanban + screenshot funnel.
2. Evidence `test-results/np-155-pwa-install-funnel-<data>.log`.
3. Log con tabella KPI.

NOTE
- Documentare come integrare con Telemetry Export.
- Prevedere dark mode support.

EVIDENCE LOG
- test-results/np-155-pwa-install-funnel-<data>.log
```

## NP-156 – Punch Club Telemetry Export Validator CLI
```text
AGENT
Sentinel-PC – Telemetry Validator

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare CLI che valida gli export telemetria Punch Club contro Zod schema (PC-M2E) generando log e KPI pass/fail.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/punchClub/telemetryExportValidator.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/punchClub/TelemetryExportValidator.test.ts
- [esistente] src/analytics/telemetryExportValidator.ts (estensione)
- [esistente] docs/strategy/punch_club_playtest.md (§ Telemetry Validation CLI)

DIPENDENZE
- PC-M2E plan
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Estendere validator core con CLI interface.
2. Implementare report Markdown/JSON + telemetria `pc_telemetry_validation_run`.
3. Test CLI + doc + sample logs.
4. Integrare con build evidence pipeline.
5. Ensure Node 20 instructions (nvm).

OPERAZIONI VIETATE
- Non modificare export files.
- Vietato ignorare error summary.
- Nessun I/O sincrono bloccante.

ASSUNZIONI
- Export JSON in `data/exports/punchClub/telemetry`.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/punchClub src/analytics`
- `npm run test:unit -- tests/unit/punchClub/TelemetryExportValidator.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; sync se schema cambia.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-156-pc-telemetry-validator-<data>.log`.
2. Allegare estratto report.
3. Doc aggiornata.

NOTE
- Prevedere flag `--auto-fail-on-warning`.
- Documentare come aggiungere nuovi eventi.

EVIDENCE LOG
- test-results/np-156-pc-telemetry-validator-<data>.log
```

## NP-157 – Coordinator Prompt Dependency Graph Visualizer
```text
AGENT
Atlas-Coord – Dependency Graph

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Realizzare visualizzatore interattivo del grafo dipendenze prompt (NP/KS/COORD) con generazione grafici config-first.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/coordinator/promptDependencyGraph.ts — creare scaffolding prima di iniziare.
- [nuovo] src/ui/tools/coordinator/PromptDependencyGraph.tsx — creare scaffolding prima di iniziare.
- [esistente] tests/unit/coordinator/PromptDependencyGraph.test.tsx
- [esistente] docs/coordinator/prompt_dependency_graph.md

DIPENDENZE
- NP-098 Dependency Planner
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Aggregare dati Kanban in JSON graph (script).
2. Hook/UI per visualizzare e filtrare nodi, salvare layout.
3. Telemetria `prompt_dependency_graph_viewed`.
4. Test script/UI + doc.
5. Export PNG/JSON per review.

OPERAZIONI VIETATE
- Nessuna modifica automatica Kanban.
- Vietato generare ID duplicati.
- Non usare librerie grafi non approvate.

ASSUNZIONI
- Kanban file in src/docs/docs/coordinator.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/coordinator src/ui/tools/coordinator`
- `npm run test:unit -- tests/unit/coordinator/PromptDependencyGraph.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se grafico deve seguire branding.

KANBAN COMPLETION
1. Stato Kanban + screenshot graph.
2. Evidence `test-results/np-157-prompt-graph-<data>.log`.
3. Log con summary dipendenze critiche.

NOTE
- Prevedere search prompt ID.
- Documentare come aggiornare dataset.

EVIDENCE LOG
- test-results/np-157-prompt-graph-<data>.log
```

## NP-158 – Coordinator Safeguard Evidence Diff CLI
```text
AGENT
Sentinel-Coord – Evidence Diff

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire CLI che confronta due evidence log (lint/test/build/kanban) e genera diff Markdown per review rapida.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/coordinator/evidenceDiffCLI.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/coordinator/EvidenceDiffCLI.test.ts
- [esistente] docs/coordinator/evidence_diff_workflow.md
- [esistente] test-results/templates/evidenceDiffTemplate.md

DIPENDENZE
- Evidence archive uploader
- Node runtime doctor

OPERAZIONI DA ESEGUIRE
1. Implementare parser log (JSON/Markdown) con schema Zod.
2. Costruire CLI `npm run coord:evidence-diff` con output Markdown.
3. Telemetria `evidence_diff_run`.
4. Test CLI + doc.
5. Integrare con Risk Matrix references.

OPERAZIONI VIETATE
- Non modificare log originali.
- Vietato omettere errori nel diff.
- Nessuna scrittura fuori test-results.

ASSUMZIONI
- Log salvati in test-results/*.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/coordinator`
- `npm run test:unit -- tests/unit/coordinator/EvidenceDiffCLI.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; sync se nuovi formati log.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-158-evidence-diff-<data>.log`.
2. Allegare diff snippet.
3. Doc aggiornata.

NOTE
- Prevedere flag `--summary-only`.
- Documentare severity color coding.

EVIDENCE LOG
- test-results/np-158-evidence-diff-<data>.log
```

## NP-159 – Coordinator Prompt Backlog Threshold Monitor
```text
AGENT
Nova-Coord – Threshold Monitor

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Automatizzare monitor soglia prompt “Non assegnato” (≥30) con script che conta, genera alert e suggerisce batch da importare.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/coordinator/backlogThresholdMonitor.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/coordinator/BacklogThresholdMonitor.test.ts
- [esistente] docs/coordinator/backlog_thresholds.md
- [esistente] test-results/coord_backlog_threshold_<data>.log

DIPENDENZE
- agent_assignments.md
- Staging backlog file

OPERAZIONI DA ESEGUIRE
1. Implementare script che legge Kanban e calcola count per stato.
2. Generare alert (stdout + log) quando <30, con lista prompt suggeriti.
3. Telemetria `coord_backlog_threshold_breach`.
4. Test script + doc.
5. Integrare con Prompt Assignment CLI.

OPERAZIONI VIETATE
- Nessuna modifica automatica Kanban.
- Vietato calcolare su file non versionati.
- Non usare regex fragili (utilizzare parser tabelle).

ASSUNZIONI
- Node 20.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/coordinator`
- `npm run test:unit -- tests/unit/coordinator/BacklogThresholdMonitor.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; sync se soglia cambia.

KANBAN COMPLETION
1. Stato Kanban + log `test-results/np-159-backlog-threshold-<data>.log`.
2. Allegare output alert.
3. Doc aggiornata.

NOTE
- Prevedere flag `--auto-open-batch`.
- Documentare schedule consigliato.

EVIDENCE LOG
- test-results/np-159-backlog-threshold-<data>.log
```

## NP-160 – Coordinator Prompt Evidence Heatmap
```text
AGENT
Aurora-Coord – Evidence Heatmap

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare heatmap che mostra copertura evidence (lint/test/build/kanban) per prompt attivi, evidenziando pass/fail e gap.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/tools/coordinator/PromptEvidenceHeatmap.tsx — creare scaffolding prima di iniziare.
- [nuovo] src/ui/tools/coordinator/hooks/useEvidenceHeatmapData.ts — creare scaffolding prima di iniziare.
- [nuovo] scripts/coordinator/evidenceHeatmapDataBuilder.ts — creare scaffolding prima di iniziare.
- [esistente] tests/unit/coordinator/PromptEvidenceHeatmap.test.tsx
- [esistente] docs/coordinator/safeguard_monitoring.md (§ Evidence Heatmap)

DIPENDENZE
- Evidence dashboard & archive
- PersistenceService

OPERAZIONI DA ESEGUIRE
1. Costruire builder script che aggrega manifest evidence in dataset heatmap.
2. Implementare hook UI con filtri e salvataggio layout.
3. Telemetria `prompt_evidence_heatmap_viewed`.
4. Test script/UI + doc.
5. Includere export PNG/CSV.

OPERAZIONI VIETATE
- Non mostrare log path sensibili.
- Vietato modificare evidence.
- Nessun valore magico per colori (usare config).

ASSUNZIONI
- Manifest NP-117 disponibile.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/tools/coordinator scripts/coordinator`
- `npm run test:unit -- tests/unit/coordinator/PromptEvidenceHeatmap.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; sync se UI deve rispettare tema specifico.

KANBAN COMPLETION
1. Stato Kanban + screenshot heatmap.
2. Evidence `test-results/np-160-evidence-heatmap-<data>.log`.
3. Log con tabella coverage.

NOTE
- Prevedere link rapido ai log.
- Documentare refresh policy.

EVIDENCE LOG
- test-results/np-160-evidence-heatmap-<data>.log
```

## NP-161 – Multi-App Dev Boot Guard & Auto-Recovery
```text
AGENT
Sentinel-Boot – Multi-App Guard

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Automatizzare il controllo delle pagine critiche (Idle Village Tools/VillageSandbox, STS CLI Simulator, Punch Club PWA, IdleVillage Map) assicurando che non mostrino errori runtime (“Something went wrong”, “An error occurred in Village Sandbox”, ecc.). L’agente deve aprire ogni pagina, rilevare l’errore, applicare fix (UI/config/runtime), riavviare `npm run dev`, riosservare; se ancora fallisce ripete finché tutte le pagine non avviano correttamente oppure termina con log dettagliato.

PROMPT READINESS
FILE TARGET
- [esistente] scripts/devtools/multiAppBootGuard.ts (nuovo orchestratore CLI)
- [esistente] tests/smoke/multiAppBootGuard.spec.ts (Playwright/automation)
- [esistente] src/ui/idleVillage/tools/VillageSandbox.tsx (diagnostica/fix)
- [esistente] src/ui/tools/sts/CLISimulatorPanel.tsx (diagnostica/fix)
- [esistente] src/ui/punchClub/AppShell.tsx o componenti PWA principali (diagnostica/fix)
- [esistente] src/ui/idleVillage/MapPage.tsx (diagnostica/fix)
- [esistente] docs/devops/multi_app_boot_guard.md (nuova guida)

DIPENDENZE
- PersistenceService (per salvare preferenze/risultati guard)
- Playwright smoke suite
- Node 20.19.6 (nvm)

OPERAZIONI DA ESEGUIRE
1. **Setup Guard CLI**
   - Implementare `scripts/devtools/multiAppBootGuard.ts`:
     - Legge lista pagine/config da `config/devBootGuardConfig.ts` (nuovo, schema Zod).
     - Avvia/termina processi dev server (Vite/Tauri) in modo controllato.
     - Chiama Playwright runner headless per ciascuna pagina/CLI.
     - Registra log JSON/Markdown in `test-results/multi-app-boot-guard-<data>.log`.
2. **Smoke Test Automation**
   - Aggiungere `tests/smoke/multiAppBootGuard.spec.ts` usando Playwright:
     - Naviga verso `/idle-village/tools`, `/idle-village/sandbox`, `/sts/cli`, `/punch-club`, `/idle-village/map`.
     - Intercetta overlay error (“Something went wrong”, “An error occurred in Village Sandbox.” ecc.).
     - Cattura console/error logs e screenshot (solo su failure, salvati in `test-results/boot-guard-artifacts/`).
     - In caso di esito positivo, logga “OK”.
3. **Diagnostics & Fix Loop**
   - Estendere le pagine target con diagnostica leggera (component-level error boundary + telemetry `multi_app_boot_error`).
   - In caso di errore:
     - `multiAppBootGuard` deve leggere stack trace, mappare file responsabile e applicare fix (UI/config/hook) seguendo filosofia config-first (nessun valore hardcoded).
     - Dopo ogni fix, riavvia automaticamente `npm run dev`.
   - Documentare nel log ogni tentativo e risultato.
4. **Telemetry & Persistence**
   - Aggiungere eventi `boot_guard_run`, `boot_guard_failure`, `boot_guard_recovery` in analytics (config-first).
   - Salvare preferenze guard (ultimo stato per pagina, retries) via PersistenceService.
5. **Documentation & Safeguards**
   - Scrivere `docs/devops/multi_app_boot_guard.md` con:
     - Setup nvm (Node 20.19.6), `source ~/.nvm/nvm.sh && nvm use`.
     - Istruzioni per eseguire la guard (`npm run devops:boot-guard`).
     - Checklist di fix comuni (VillageSandbox overlay, STS CLI import, Punch Club PWA install prompt, Map data fetch).
   - Aggiornare README/kanban note con nuovo strumento.

OPERAZIONI VIETATE
- Vietato disattivare error boundaries o sopprimere errori loggando “OK” senza fix reale.
- Non manipolare config (pesi/stats) al di fuori dei moduli `src/balancing/config/*`.
- Nessuna dipendenza sync di localStorage/sessionStorage: solo PersistenceService async.
- Non lanciare processi multipli di Vite senza prima terminare quelli esistenti (Log PIDs).

ASSUNZIONI
- Dev server Vite già configurato (npm run dev).
- Playwright disponibile (config repo).
- Gli errori “Something went wrong / An error occurred in Village Sandbox” derivano da regressioni note (date-fns, import mancanti, ecc.) documentate in log.

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/devtools src/ui/idleVillage src/ui/tools/sts src/ui/punchClub`
- `npm run test -- tests/smoke/multiAppBootGuard.spec.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; interrompere e ping coordinatore solo se un errore persiste oltre 3 cicli di fix/riavvio o se richiede nuove dipendenze esterne.

KANBAN COMPLETION
1. Aggiornare Kanban “Completato” + allegare `test-results/np-161-multi-app-boot-guard-<data>.log`.
2. Includere tabella tentativi/fix per ogni pagina.
3. Allegare screenshot finale delle pagine avviate correttamente (per Idle Village Tools/Sandbox, STS CLI, Punch Club, Map).

NOTE
- Prevedere flag CLI `--page <name>` e `--max-retries`.
- Documentare mapping codice errore → modulo (VillageSandbox, STS CLI, Punch Club, Map).
- Futuro: integrare con CI nightly per evitare regressioni.

EVIDENCE LOG
- test-results/np-161-multi-app-boot-guard-<data>.log
```

---

### Persistent Sentinel (fuori Kanban) – Auto-Commit Guardian
```text
⚠️ Questa voce NON deve essere aggiunta/chiusa nel Kanban. È un guardiano continuo che si attiva ogni volta che lo script auto-commit (run ogni 2h, push ogni 4h) fallisce per lint/test/build.

AGENT
Chronos-Commit – Auto-Commit Guardian

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

TRIGGER
- Hookato dallo script `auto_commit_push.sh` quando `git commit` o `git push` restituiscono exit code ≠ 0 (lint/test/build errors, kanban lint, ecc.).

OBIETTIVO
Rilevare il motivo del fallimento automatico, correggere gli errori seguendo filosofia config-first (niente fix “muto”), rilanciare safeguard suite completa e rieseguire `git commit` + `git push`. Se il secondo tentativo fallisce ancora, allegare log dettagliato e lasciare lo stato invariato per intervento umano.

FILE TARGET (variabili per run)
- scripts/autoCommit/commitFailureMonitor.ts (entrypoint)
- scripts/autoCommit/commitFailurePlaybook.md (doc)
- Moduli segnalati dai log (lint/test/build) – da fixare secondo stack.
- test-results/auto-commit-guardian/<timestamp>.log (output run)

OPERAZIONI
1. **Snapshot & Context**
   - Leggere `auto_commit_push.sh` output (stdout/stderr) e salvare in log.
   - Eseguire `git status --short` + `npm run kanban:lint` per capire stato.
2. **Diagnosi**
   - Se fallisce lint:
     - `npm run lint -- <scope>` secondo file toccati.
     - Analizzare errori, proporre fix (config-first, no comment-out).
   - Se falliscono test/build:
     - `npm run test -- <target>` / `npm run build:check`.
     - Riprodurre localmente, applicare fix.
   - Documentare ogni passo nel log JSON/Markdown.
3. **Fix + Safeguard Loop**
   - Applicare patch rispettando principi: niente hardcode, usare PersistenceService, etc.
   - Rieseguire safeguard suite completa (lint, test, build, kanban).
4. **Retry Commit/PUSH**
   - Se safegards ✅:
     - `git commit --amend` (se commit auto esistente) o `git commit -am "auto: <summary>"`.
     - `git push` se commit riuscito e finestra push (ogni 4h) aperta.
   - Registrare esito (success/fail) con timestamp/branch.
5. **Escalation**
   - Se secondo tentativo fallisce (stesso errore o nuovo):
     - Allegare `test-results/auto-commit-guardian-<data>.log`.
     - Creare TODO nel log con “Richiede intervento umano”.
     - Non forzare commit/push.

OPERAZIONI VIETATE
- Mai cancellare/change `auto_commit_push.sh`.
- Non forzare `git push --force` senza approvazione.
- Vietato disattivare lint/test/build per far passare commit.
- No modifiche a Kanban automatiche.

ASSUNZIONI
- Node 20.19.6 attivo (`source ~/.nvm/nvm.sh && nvm use`).
- Script auto-commit già installato (cron/systemd).
- Agent ha accesso agli stessi strumenti lint/test degli sviluppatori.

LOG & TELEMETRIA
- Salvare ogni run in `test-results/auto-commit-guardian/<YYYY-MM-DDTHH-mm-ss>.log`.
- Eventi analytics: `auto_commit_guardian_triggered`, `auto_commit_guardian_fixed`, `auto_commit_guardian_failed`.

NOTE
- L’agente opera ciclicamente, non ha stato “Completo”.
- Aggiornare `scripts/autoCommit/commitFailurePlaybook.md` con pattern fix ricorrenti.
- Includere snippet diff principali nel log per retrospettiva.
```
