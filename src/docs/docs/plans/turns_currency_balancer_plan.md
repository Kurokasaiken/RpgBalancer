# Turns Currency Balancer Implementation Plan

Last updated: 2026-01-11  
Owner: Strategist / Cascade  
Status: Proposal – pending coordinator scheduling

---

## 1. Vision & Scope

### Objective

Estendere il Balancer per diventare un sistema auto-bilanciato basato sulla “valuta turni”: ogni stat, arma, equip o spell deve dichiarare il proprio impatto in **TTK/TTD** e **HP equivalenti**, così che il ritmo di gioco (es. 8 turni per un 1v1 pari livello) sia definito a priori e propagato a tutti i moduli.

### Success Criteria

- Config singola per target turni (1v1, boss, gruppo, sciame) e loro budget di HP_eq.
- Moduli logici completi (hit, crit, mitigation, sustain, resource, risk, AoE, ecc.) con formule documentate e importate dal combat engine.
- Spell/armi/equip leggono esclusivamente questi moduli: zero logiche duplicate nelle UI.
- Monte Carlo / WeightCalibration aggiornati con i nuovi pesi empirici.
- Prototipo rapido (CLI/UI) per validare il “feel” degli 8 turni prima delle simulazioni lunghe.

### Out of Scope (fase attuale)

- Nuovi tipi di danno elementale / status esotici (verranno modellati dopo che i moduli base saranno stabili).
- Generazione di scenari multi-target: verrà pianificata in un follow-up dopo aver validato il baseline 1v1.

---

## 2. Scenario Targets

| Scenario | Target turni medi | Note |
| --- | --- | --- |
| 1v1 pari livello | 8 turni | baseline, usato per calibrare tutto il resto |
| Boss | 10-12 turni | più attrito, richiesto sustain/risorse superiori |
| Gruppo (small party) | 9-10 turni | ritmo cooperativo, TTK distribuito |
| Sciame | 6-8 turni complessivi | riduzione turni per kill singola, ma più target |

Questi valori devono vivere in config (`balancer-default-config.json` + `defaultConfig.ts`) così ogni modulo può leggere `targetTurns[scenarioId]`.

---

## 3. Moduli Richiesti

| Modulo | Stat principali | Output richiesti (HP_eq / turni) | File previsti |
| --- | --- | --- | --- |
| Core Damage | hp, damage | `htk`, `edptBase` | `modules/core.ts`, config core card |
| Hit & Accuracy | txc, evasion, baseHitChance | `hitChance`, `attacksPerKo` | `modules/hitchance.ts` |
| Crit & Fail | critChance, critMult, critTxCBonus, failChance/failMult | `expectedDamagePerHit` | `modules/critical.ts` (esteso) |
| Mitigation & Pen | DR (ex Ward), armor, resistance, armorPen, penPercent | `effectiveDamageDealt`, `effectiveDamageTaken` | `modules/mitigation.ts` |
| Sustain | lifesteal, regen, shieldRegen | `hpRecoveredPerTurn`, `netTTD` | `modules/sustain.ts` (attivare) |
| Early/Late Impact | edpt, windowConfig | `burstValue`, `attritionValue` | nuovo `modules/impact.ts` |
| Resource & Tempo | manaCost, manaPool, regen, cooldown, priority | `usableTurns`, `resourcePenalty`, `tempoBonus` | nuovo `modules/resource.ts` |
| Risk / Drawback | selfDamage%, miscastChance, extraDamageTaken | `riskAdjustedEDPT` | nuovo `modules/risk.ts` |
| Defensive Specials | antiCrit, antiCC, damageReflection, ccResistance | `damagePrevented`, `ttdModifiers` | nuovo `modules/defenseSpecials.ts` |
| AoE / DOT / Multi-hit | aoeTargets, eco, duration, tickDamage | `distributionMultiplier`, `dotEdpt` | nuovo `modules/aoeDot.ts` |

Ogni modulo deve avere:

- Config con range, peso, flag (`isDerived`, `isLocked`, `baseStat`).
- Funzioni tipizzate + **JSDoc** (regola obbligatoria).
- Test unitari (Vitest) e riferimenti nei documenti (`docs/BALANCING_SYSTEM.md`).

---

## 4. Fasi di Implementazione

### Fase 1 – Audit & Scenario Config

- [ ] Mappare le stat esistenti in `defaultConfig.ts` + JSON mirror.
- [ ] Aggiungere `targetTurns` e `scenarioBudget` alla config + UI (preset loader).
- [ ] Aggiornare `docs/BALANCING_SYSTEM.md` con la tabella scenari.

### Fase 2 – Moduli Core Refresh

- [ ] Rifinire `modules/hitchance`, `modules/critical`, `modules/mitigation` per allineare output (TTK/TTD ready).
- [ ] Attivare `modules/sustain` (attualmente pending) e aggiungere test.
- [ ] Creare `modules/impact`, `resource`, `risk`, `defenseSpecials`, `aoeDot` con funzioni pure.
- [ ] Aggiornare `statWeights.ts` + `STAT_BALANCING_ANALYSIS.md` con nuovi pesi “placeholder” in attesa delle simulazioni.

### Fase 3 – Config & UI Integration

- [ ] Esporre i nuovi moduli nello schema Zod (`schemas.ts`) e nello store (`useBalancerConfig`).
- [ ] Aggiornare `spellBalancingConfig.json`, equip e weapon preset per leggere i nuovi campi (zero logica nella UI).
- [ ] Assicurare persistenza async via `PersistenceService.ts` (niente accesso diretto a localStorage).

### Fase 4 – Validation & Tooling

- [ ] Eseguire Monte Carlo + WeightCalibration per ogni nuova stat (aggiornare test + log evidenza).
- [ ] Aggiungere un prototipo “scenario runner” (anche CLI) che mostra TTK/TTD per i target scenario con i dati aggiornati.
- [ ] Aggiornare documentazione (`docs/BALANCING_SYSTEM.md`, `docs/plans/config_driven_balancer_plan.md`, nuovo allegato per moduli) con formule e referenze.

### Fase 5 – QA & Launch Checklist

- Lint mirato (`src/balancing`, `src/ui/balancing`, nuovi moduli).
- Test unitari + Monte Carlo regression.
- build:check + kanban:lint (per policy KS-005).
- Annotare evidenza nel nuovo log (`test-results/turns-currency-plan-YYYY-MM-DD.log`).

---

## 5. Testing & Safeguards

### Suite obbligatorie

1. **Unit test per modulo**  
   - Ogni file in `src/balancing/modules/*` deve esportare JSDoc e avere `*.test.ts` dedicato con fixture basate su `defaultConfig.ts`.  
   - Verificare output (EDPT, contributi TTK/TTD, HP_eq) usando seed deterministici.

2. **Scenario Runner (CLI + test)**  
   - Tool dedicato che carica i preset scenario (1v1, boss, gruppo, sciame) e stampa TTK/TTD/AvgTurns confrontandoli con i target.  
   - Test Vitest che invoca il runner in modalità deterministica e fallisce se la deviazione supera ±5%.

3. **Regression Monte Carlo**  
   - Estendere `WeightCalibration` con un file `TurnsCurrencyRegression.test.ts` che confronta i risultati con il log precedente (delta HP_eq <5%).  
   - Ogni esecuzione salva output in `test-results/turns-currency-plan-<data>.log` da allegare al kanban.

4. **Preset/Spell harness**  
   - Test parametrico per `spellBalancingConfig.json` e preset equip che verifica il piping attraverso tutti i moduli e assicura TTK coerente con lo scenario selezionato.

5. **Persistence & Storage**  
   - Riutilizzare `StorageTestFramework` per validare `BalancerConfigStore`/PersistenceService dopo l’aggiunta dei nuovi campi (targetTurns, moduli).  
   - Nessun accesso diretto a localStorage; i test devono simulare failure/retry.

### Pipeline safeguard raccomandata

1. `npm run lint -- src/balancing src/ui/balancing` (JSDoc obbligatori).  
2. `npm run test -- src/balancing/modules/__tests__/*.test.ts`.  
3. `npm run test -- tests/scenarios/turnsCurrencyRunner.test.ts`.  
4. `npm run test -- src/balancing/__tests__/WeightCalibration.test.ts`.  
5. `npm run test -- src/balancing/__tests__/TurnsCurrencyRegression.test.ts`.  
6. `npm run test -- src/shared/testing/StorageTestFramework.test.ts` (se toccata la persistence).  
7. `npm run build:check`.  
8. `npm run kanban:lint`.  
9. Esecuzione manuale Scenario Runner con log allegato al kanban (`test-results/turns-currency-plan-*.log`).

---

## 6. Deliverable & Dipendenze

- **File chiave da toccare**:  
  `src/balancing/config/defaultConfig.ts`, `.../balancer-default-config.json`, `statWeights.ts`, `modules/*`, `spellBalancingConfig.json`, `docs/BALANCING_SYSTEM.md`, `docs/plans/config_driven_balancer_plan.md`, nuovo prototype tool.
- **Dipendenze**: Phase 10 (Config-Driven Balancer) deve restare stabile; usare PersistenceService async; mantenere Gilded Observatory theme nelle UI.
- **Testing**: Monte Carlo + WeightCalibration + Storage Testing Framework per la nuova config persistence; CLI prototype per validare turni target.

---

## 7. Coordinator Handoff

- Inserire prompt “Turns Currency Balancer Implementation” nella Kanban (`agent_assignments.md`) come **Non assegnato**, includendo:
  - Riferimento a questo plan (`docs/plans/turns_currency_balancer_plan.md`).
  - Lista fasi + file target + safeguard richiesti.
  - Nota che l’iniziativa è prioritaria “prossimo futuro” post Phase 10 completion.
- Coordinator dovrà eseguire `npm run prompt:check -- turns-currency-plan` e pianificare la presa in carico secondo il workflow KS-005.

---

Con questo documento lo strategist ha definito i requisiti e la sequenza di lavoro; il prossimo passo è coordinare l’inserimento formale in Kanban e programmare le fasi operative. *** End Patch
