# PLAN-018 — Mission Planner (prompt master)

> Task master: `MP-*` in `src/docs/docs/coordinator/strategy_tasks.md` — ogni task ha il suo prompt in `prompts/MP-<NN>.md`.
> Piano: `plans/PLAN-018-mission-planner.md` **v3** — **leggerlo prima di iniziare**: contiene il contratto matematico canonico (T-000.5), i difetti del data model confermati su codice (2026-09-30) e le decisioni aperte D1-D4.
> Desiderata: `.mw/desiderata.md` **v23 FROZEN + rev.2 + rev.3** — riportata sotto, verbatim nei punti.
> Richiesta: `RICHIESTE.md` R-078. Decisioni modello: `context/DECISION_LOG.md` 2026-09-29 (opzione A + rev.3: almost non conta, solo i morti escono, cavalcatura = slot).

## Difetti confermati sul codice (2026-09-30) — leggere prima di implementare

1. **Successo fisso al 5%**: i blueprint usano `statRequirement.allOf: ['lantern']` (tag di ruolo, gate di slot) che `resolvePhaseStatTags` tratta come stat numerica → somma 0 → `unstaffedStatFloor`. Le fasi senza requirement cadono sulla skill generica ≈ `m`. Qualunque party → `successFloor` = 5%.
2. **Scala incoerente**: stat residenti ~10–16 vs difficoltà D100 45–80. Serve `partyStatMult` in config (valore dall'analisi MP-00) + `checkStatTags` separati dal gate.
3. **Rischio indipendente dal party**: `riskProfile` authored-only → "+PG" aumenta sempre le vittime attese. Il WHY "+Companion → −risk" richiede la meccanica `cover` → **decisione D1**.
4. **Wipe non definito**: `resolveQuestOutcomeTier` divide per `resolved.length`; se `S=∅` la quest deve abortire → **decisione D2** (raccomandato `deadly`).

**Non implementare il motore sopra il data model rotto**: la catena è MP-00 → MP-02 → MP-03 → MP-01 → MP-04 → MP-05 → MP-06 → MP-07.

## Concetto

Non una schermata di party selection con un tasto "Calcola". Un **mission planner**: la quest è il problema, il giocatore costruisce la soluzione modificando la spedizione, e **ogni modifica aggiorna immediatamente tutti gli esiti previsti**. Aggiungo un PG → le percentuali cambiano. Cambio un equip → cambiano. Tolgo un consumabile → tornano indietro. Nessun submit, nessuna simulazione esplicita. Il calcolo è **deterministico e rng-free**.

## Requisiti congelati (v23)

1. **Pannello separato** chiamato "Planner", `FloatingPanel` non bloccante (v4), apribile dalla quest prima della partenza.
2. **Tre zone:** `PARTY` (chi parte: add/remove residente negli slot), `LOADOUT` (equip e consumabili per membro), `OUTCOME` (derivato, mai editabile).
3. **Reattività totale** su successo, ferita, morte, durata, reward.
4. **Leggibilità:** ogni metrica mostra il delta (`18% → 11% ↓`); la sezione **WHY** elenca i contributi per sorgente (stat PG, equip, slot, consumabile, penalità slot vuoto).
5. **Successo** = probabilità di superare **almeno il 50% degli skill check di fase**. `partial` non è successo e **`almost` NON conta come fase superata** (rev.3.1) — passano solo `win`/`bigwin`; `isPassingVerdict` cambia di conseguenza (è una modifica alla semantica runtime, non solo al Planner).
6. **Rischio per slot e aggregato**: ferita/morte per ogni membro **e** totale party.
7. **Durata modificabile** da item/equip specifici via `durationDelta`/`durationMult` in config; la **cavalcatura occupa uno slot equip** (`mount`) — velocità = trade-off, non free lunch (rev.3.3).
8. Modello di rischio **A**: per-fase esteso per-residente. `resolvePartyConsequences` non decide più le conseguenze.
9. **Solo un membro morto smette di contribuire alle fasi successive** (rev.3.2, "solo morto"): esce dalla somma party degli skill-check e smette di tirare rischi. **Il ferito resta**: contribuisce normalmente e continua a tirare (può morire dopo). Le fasi **non sono indipendenti**; il motore analitico è una DP esatta sull'insieme dei vivi (vedi contratto T-000.5 nel piano), non una Poisson-binomiale.

## Requisito concettuale vincolante — laboratorio reversibile (Director, 2026-09-29)

> *"Il Planner deve essere progettato come uno spazio di sperimentazione reversibile. Il giocatore deve poter aggiungere, rimuovere e sostituire membri/equip/consumabili in qualsiasi ordine e vedere immediatamente le conseguenze, senza confermare o simulare. Ogni modifica deve essere reversibile e la configurazione ripristinata deve produrre esattamente gli stessi outcome. La UI deve rendere evidente la relazione causa → effetto, non soltanto il risultato numerico."*

Il Planner è una **feature di gameplay**, non una schermata UI secondaria: è il "laboratorio della build" dove il giocatore impara il sistema (PG → equip → skill → consumabile = modi diversi di manipolare il rischio).

### Reversibilità esatta — caso di accettazione

La sequenza `A → A+PG → A+PG+equip → A+PG+equip+consumabile → A+PG+equip → A+PG → A` deve produrre, all'ultimo passo, **esattamente** gli outcome iniziali. Non "quasi gli stessi": identici. È la proprietà che permette di sperimentare senza paura. Test obbligatorio (unit + Playwright in T-007). Corollario: nessuna mutazione di stato latente durante la preview (rng consumato, modificatori applicati due volte, stato persistito) — il calcolo è una funzione pura della configurazione corrente.

### Layout INPUT / OUTPUT — distinzione netta

```
INPUT                              OUTPUT
PARTY                              OUTCOME
 [Hero] [Guard] [Worker] [+]        SUCCESS   81% ↓
LOADOUT                             INJURY    16% ↓
 Hero                               DEATH      3% ↓
   Weapon  [Sword]                  DURATION 4 days
   Armor   [Light]
   Item    [Potion]                BY MEMBER
                                    Hero   Injury  8%  Death 2%
                                    Guard  Injury 14%  Death 4%
                                    Worker Injury 21%  Death 7%
```

- INPUT: il giocatore modifica liberamente. OUTPUT: derivato, mai editabile.
- **BY MEMBER è obbligatorio**: il rischio per singolo membro deve restare leggibile — "mando questo perché assorbe parte del rischio, ma è lui il più esposto". Mai un unico "Death 8%" aggregato che nasconde chi rischia. (Prepara il terreno per gli abitanti non eroici — carne da macello v12.)

### WHY — più importante delle percentuali

Risponde a "perché il risultato è questo?", raggruppato per metrica, in linguaggio di cause:

```
WHY
SUCCESS   + Hero: Dexterity · + Hunter: Dexterity · + Bow · + Hunter's Training
INJURY    − Exhausted Hero · + Empty slot penalty
DEATH     − Heavy Armor · − Guardian · + High-risk phase
```

Quando il giocatore aggiunge un PG deve vedere la **catena**: `+ Companion → + Strength contribution → − injury risk → − death risk`. Quando cambia equip: `Heavy Armor → − death risk, + duration`. Non è un log tecnico: ogni riga è una ragione comprensibile.

### NON mostrare il costo opportunità come numero

Niente "vale 12 gold/day → mandarlo costa 36 gold". Il costo emerge dal gioco (la missione dura 4 giorni e quel membro non lavora). Il Planner non diventa un foglio Excel.

## Cosa esiste — NON ricostruire

| Cosa | File |
|---|---|
| Preview live rng-free (death/injury/reward, `canEmbark`) | `src/ui/idleVillage/hooks/useQuestAssignmentPreview.ts` |
| Pipeline power → distribuzione esiti | `src/engine/game/idleVillage/QuestPowerEngine.ts` |
| Pass-chance di fase e tier esito | `src/engine/game/idleVillage/questMilestones.ts` (`resolveMilestoneWithoutAnimation`, `resolveQuestOutcomeTier`, `buildAstrolabeSkillsForPhase`, `applyConsumableRiskEffects`, `isPassingVerdict`) |
| Slot per-residente (`residentRiskModifiers`, `emptyPenalty`, `role`) | `src/ui/idleVillage/slots/types.ts` |
| Controller slot + roster | `useResidentSlotController`, import roster solo da `src/ui/idleVillage/roster/index.ts` |
| Consumabili mock | `src/balancing/config/idleVillage/quests/questItemsMock.ts` (ERR-026: da sostituire col vero item system, non ora) |
| Equip placeholder | `src/ui/idleVillage/components/EquipSlotRack.tsx`, `src/pages/hero-components-lab.tsx` (v10) |
| Durata | `questTotalDurationMs` in `questTimeScale.ts` |
| Pannello | `FloatingPanel` (v4) |
| Preview UI legacy (NON replicare: stringhe IT hardcoded, Tailwind ad-hoc) | `QuestAssignmentPreview.tsx` |

## Cosa va costruito (task — catena corretta)

- **MP-00** — Contratto matematico canonico `mission_planner_math_spec.md` + **spec del fix data model** (`checkStatTags` vs gate, `partyStatMult`) + **analisi balance comparativa** vecchio/nuovo modello su tutti i blueprint → report in `test-results/` con il `partyStatMult` raccomandato. → `prompts/MP-00.md`
- **MP-02** — Schema item Zod (slot `weapon|armor|mount|trinket`, `durationDelta`/`durationMult`, `coverRiskDelta` se D1) + **fix data model fasi** (`checkStatTags` nello schema blueprint, `partyStatMult` in config, re-author blueprint con stat reali). → `prompts/MP-02.md`
- **MP-03** — `applyLoadoutToResident` pura: stat effettive, stessa funzione in Planner e risoluzione; `statSnapshot` persistito non mutato. → `prompts/MP-03.md`
- **MP-01** — Motore analitico `missionPlannerEngine.ts` sul contratto: DP esatta sui vivi, golden fixture numeriche esatte (boundary, cascata morte — ferito resta, wipe → deadly), palindromo reversibilità a livello engine. → `prompts/MP-01.md`
- **MP-04** — Stato bozza: Context locale; recompute da stato live a ogni render; contratto di lancio tipizzato + validazione + rollback; delta vs output precedente; reset alla chiusura. → `prompts/MP-04.md`
- **MP-05** — UI del Planner: INPUT (PARTY slot rack + risk badge, LOADOUT cablato via MP-03) | OUTPUT (headline barre stacked + delta `aria-live`, BY MEMBER, WHY collassabile). Undo toast + Reset. Skin `skinConfigRegistry`, i18n, telemetry `mission_planner_*`. → `prompts/MP-05.md`
- **MP-06** — Integrazione: pulsante "Planner"; resolver per-residente, morti fuori dalle fasi successive (feriti restano), wipe → abort `deadly`, `isPassingVerdict` = `bigwin|win`, `resolvePartyConsequences` fuori dal flusso (inventario call-site prima). Il resolver **campiona dalla stessa distribuzione** del Planner (seeded, ±1.5pp). → `prompts/MP-06.md`
- **MP-07** — Docs/test/evidence: spec matematica + `mission_planner_spec.md`, `COMPONENT_MASTER_INDEX` (`candidate`), Playwright palindromo con **serializzazione canonica identica**, `QuestAssignmentPreview` `deprecated`, report balance allegato. → `prompts/MP-07.md`

## Guardrail (invarianti)

- **Config-first:** nessun numero in componenti; config modules con Zod in `src/balancing/config/**` e `src/ui/idleVillage/config/**`.
- **i18n:** `useTranslation`, namespaces `common`/`idleVillage`; chiavi in `public/locales/`; nessuna stringa hardcoded.
- **Skin:** preset in `skinConfigRegistry`; vietato creare `.css` standalone.
- **Persistenza:** solo `PersistenceService` (`saveData`/`loadData`/`clearData`); mai `localStorage`/`sessionStorage` diretti.
- **State:** Context per la bozza del planner (UI locale); Zustand solo se lo stato serve fuori dal pannello.
- **Component reuse:** prima di creare un componente, verificare `src/ui/atoms/`, `src/ui/fantasy/atoms/`, `src/ui/idleVillage/skins/primitives/`; vietato duplicare primitive.
- **Telemetry:** `trackTelemetryEvent`, naming `mission_planner_*` (`_open`, `_party_change`, `_loadout_change`, `_launch`).
- **Preview sempre rng-free:** mai `Math.random()`/`rollQuestOutcome`/`resolveQuestPower` nel percorso di anteprima.
- **Rischio di divergenza:** Planner e risoluzione DEVONO usare lo stesso modello e le stesse funzioni pure su input identici. Il Planner mostra la **distribuzione** da cui il resolver campiona — la verifica è statistica (seeded, tolleranza ±1.5pp su 10k tiri), non identità puntuale.
- **JSDoc** su ogni nuova funzione/interfaccia.

## Fuori scope

Superfici della risoluzione v3/v4: cerchio magico, astrolabe (fisica/UI), chronicle, reward panel. **Dentro scope:** il modello delle conseguenze della risoluzione (per-residente, almost, morti che escono — MP-06). Costo opportunità come metrica esplicita. Trial by Fire, authoring quest, item system reale. Pool/offerta quest (R-076/R-077).

## Safeguard

```bash
npm run lint -- src/ui/idleVillage src/engine/game/idleVillage   # ≤120s
npm run test -- idleVillage                                       # ≤300s
npm run build:check                                               # ≤180s
npm run kanban:lint                                               # ≤30s
```

Smoke test: route toccate raggiungibili (200), nessun errore console.
Evidence: `test-results/r078-mission-planner-<data>.log`.

## Documentazione da aggiornare alla chiusura

`plans/PLAN-018-mission-planner.md` (stato task), `COMPONENT_MASTER_INDEX.md`, `interaction_core_spec.md` (§quest preview), `RICHIESTE.md` (R-078), `CURRENT_STATE.md`, Kanban row → `Completato` con evidence.
