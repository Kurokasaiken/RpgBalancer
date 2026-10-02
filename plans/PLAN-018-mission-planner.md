---
title: 'Mission Planner — spedizione come problema, esiti live (PARTY / LOADOUT / OUTCOME)'
status: completed
completed: 2026-10-02 (MP-00…MP-07 tutti Completati; remap vs quest modello validato demandato a PLAN-019 S2/S3)
created: 2026-09-29
revised: 2026-09-30 (v3.1 — D1–D4 chiuse dal Director: cover sì, checkpoint continua/ritirati tra le fasi, consumabili pool, checkStatTags+partyStatMult)
baptized: 2026-09-29 (T-000 deciso: opzione A)
desiderata: v23 (FROZEN 2026-09-29, rev.2 + rev.3)
request: R-078 (figlia di R-076)
---

# PLAN-018 — Mission Planner

> **Nota 2026-10-01 (desiderata v24, punto 6):** PLAN-018 è precedente implementativo da adattare al macro plan Quest. Non si cancella; quanto sopravvive invariato si decide dopo S1 e si mappa in S2/S3 (riusa / adatta / superato / manca). Status non modificato.

## Ancoraggio (verbatim, desiderata v23 FROZEN + rev.2 + rev.3)

1. Planner come pannello separato (nome "Planner"), `FloatingPanel` non bloccante (v4), apribile dalla quest prima della partenza.
2. Tre zone: `PARTY`, `LOADOUT`, `OUTCOME` (derivato, mai editabile). Separazione visiva netta INPUT/OUTPUT; blocco **BY MEMBER** obbligatorio; **WHY** in linguaggio causa→effetto (rev.2).
3. Reattività totale, calcolo deterministico e rng-free. Laboratorio **reversibile**: configurazione ripristinata → outcome **identici** (rev.2).
4. Delta rispetto alla configurazione precedente + WHY con contributi per sorgente.
5. Successo = P(superare almeno il 50% degli skill check di fase); `partial` non è successo; **`almost` non è una fase superata** (rev.3.1).
6. Rischio per slot **e** aggregato.
7. Durata modificabile via canale dedicato (`durationDelta`/`durationMult`) da config su item/equip specifici; la **cavalcatura occupa uno slot equip** (rev.3.3).
8. Config-first (Zod), i18n, skin via `skinConfigRegistry`, riuso primitive e placeholder v10 dove coprono il caso.
9. **Solo un membro morto smette di contribuire alle fasi successive** (rev.3.2, precisazione "solo morto"): esce dalla somma party e smette di tirare rischi. **Il ferito resta**: contribuisce normalmente e continua a tirare.

**Scope corretto (fix critica):** la *risoluzione della quest* è **dentro scope** per la parte conseguenze/semantica — modello A richiede di estendere il resolver a per-residente, cambiare `isPassingVerdict` e rimuovere i membri morti dalle fasi successive. Fuori scope restano cerchio magico, astrolabe (fisica/UI), chronicle, reward panel (v3/v4) — le superfici, non il modello.

## Fatti dal repo (research phase)

| Cosa | Dove | Stato |
|---|---|---|
| Preview live rng-free (death/injury/reward, `canEmbark`) | `src/ui/idleVillage/hooks/useQuestAssignmentPreview.ts` | esiste, aggrega i delta senza esporli |
| Pipeline power → distribuzione → consequences | `src/engine/game/idleVillage/QuestPowerEngine.ts` | esiste, rischio **uniforme per esito**, non per residente |
| Pass chance di fase (floor/ceiling/par/nearMiss/epicFail) | `resolveMilestoneWithoutAnimation` in `questMilestones.ts:210` | esiste ma **tira dadi**; manca la versione analitica |
| Regola "successo ≥ 50% fasi" | `resolveQuestOutcomeTier` in `questMilestones.ts:289` (`passed * 2 >= resolved`) | già canonica a runtime; **`almost` conta come passata — da cambiare (rev.3.1)** |
| Skills per fase dal party | `buildAstrolabeSkillsForPhase` (`questMilestones.ts:106`) | esiste, puro |
| Consumabili → rischio fase | `applyConsumableRiskEffects` (`questMilestones.ts:178`) | esiste, puro — delta additivi in pp, clamp 0–100 |
| Config check | `questSkillCheckConfig.ts` (`QuestSkillCheckConfig`) | esiste: `parSuccessChance 50`, `floor 5`, `ceiling 95`, `criticalWinFraction 0.2`, `nearMissBand 10`, `epicFailThreshold 96` |
| Difficoltà fase | `resolvePhaseDifficulty` (stesso file) | label → tier → default, delta per tipo, clamp |
| Rischio di fase | `QuestPhase.riskProfile?: QuestPhaseRiskProfile` (`types.ts:327`) | esiste, per fase |
| Slot per-residente | `residentRiskModifiers`, `emptyPenalty` in `slots/types.ts:74-95` | esiste (delta additivi pp) |
| Consumabili mock | `questItemsMock.ts` (`MOCK_QUEST_ITEMS`) | mock TS, ERR-026 — lo schema Zod canonico va in `balancing/config`, non nel file mock |
| Equip placeholder | `EquipSlotRack` + `hero-components-lab.tsx` (v10) | placeholder, **non cablato alle stat — il riuso richiede il cablaggio, non è gratis** |
| Durata | `questTotalDurationMs` in `questTimeScale.ts:76` | solo somma fasi, nessun modificatore |
| Pannello | `FloatingPanel` (v4) | esiste |
| Preview UI legacy | `QuestAssignmentPreview.tsx` | hardcoded IT + Tailwind ad-hoc → deprecare, non replicare |

### Difetti confermati dalla review del 2026-09-30 (bloccano MP-01)

Verificati direttamente sul codice — il Planner costruito sopra questo stato mostrerebbe numeri **falsi**:

1. **Le stat del party non vengono mai lette (successo fisso al 5%).** Le fasi dei blueprint usano `requirements.statRequirement.allOf: ['lantern']` — un **tag di ruolo** che `statMatching.evaluateStatRequirement` usa come *gate* ("il residente ha il tag `lantern` nello statSnapshot/tags"). `resolvePhaseStatTags` lo tratta invece come **stat numerica**: `sumPartyStat(residents,'lantern') = 0` → `unstaffedStatFloor` = 5. Le fasi senza `statRequirement` (es. `crush_brood`, `purge_vents`) producono la skill generica = conteggio hp ≈ `m`. Contro difficoltà `dangerous` = 60 (+delta tipo → 55–70), `successChance = clamp(5 − 60 + 50, 5, 95) = 5%` **sempre**, qualunque sia il party.
2. **Collisione semantica `statRequirement`**: la stessa struttura è gate di slot (`statMatching`: il residente possiede il tag) e stat del check (`questMilestones`: somma il valore). Servono due campi distinti: gate per chi può occupare lo slot/fare la fase, e `checkStatTags` con stat numeriche reali (`strength`, `perception`, `agility`…).
3. **Scala stat ↔ difficoltà incoerente**: le stat reali dei residenti sono ~10–16 (`strength 14`, `perception 13`…), le difficoltà sono D100 (45–80). Anche con tag corretti, un party di 2–3 membri non raggiunge la difficoltà → successo sempre vicino al floor. Serve un moltiplicatore di scala in config (`partyStatMult`, da tarare nell'analisi MP-00) **e/o** difficoltà ri-tarate: i valori attesi di successo vanno definiti nell'analisi balance, non inventati.
4. **Il rischio non dipende dal party**: `riskProfile` è authored + delta (slot/item/consumabili). Con tiri indipendenti per membro, aggiungere un PG **aumenta sempre** le vittime attese — il WHY "+ Companion → − death risk" è impossibile oggi. → decisione D1.
5. **Denominatore diverso + party wipe indefinito**: `resolveQuestOutcomeTier` divide per `resolved.length` (fasi giocate), la DP per `n`. Con i morti che escono da `S`, un party sterminato non ha regola: se `S = ∅` prima dell'ultima fase le fasi restanti non si giocano. → decisione D2.
6. **Dipendenze Kanban invertite**: MP-01 (motore) richiede lo schema item (MP-02) e `applyLoadoutToResident` (MP-03) — la catena corretta è MP-00 → MP-02 → MP-03 → MP-01 → MP-04 → MP-05 → MP-06 → MP-07.
7. **Dispatch MP-00 nel coordinator**: `batch.json` espone `prompt` = testo della nota e `file_targets` vuoto per tutti i task manuali (limite preesistente del coordinator, non specifico di MP-00) — i task MP restano `manual`/`ai-worker` via `agent_assignments.md`, non via batch automatico.

## Decisioni D1–D4 — CHIUSE dal Director (2026-09-30, v23 rev.4)

1. **D1 — cover approvato.** Slot/item/tag stat possono dichiarare `coverRiskDelta` (pp, tipicamente ≤ 0) applicato ai rischi degli **altri** membri: `cover_i = Σ_j≠i coverRiskDelta_j`. Un "guardiano" riduce la morte altrui senza ridurre la propria → il membro che assorbe resta il più esposto (v12) e "+compagno → Morte ↓" diventa possibile, sia aggregata sia per-membro.
2. **D2 — checkpoint continua/ritirati tra le fasi.** Ogni fase termina con un punto decisionale del giocatore: **continuare** o **ritirarsi**. Ritiro → la quest si chiude con il tier calcolato sulle fasi giocate (regola ≥50% invariata); effetti delle fasi risolte restano applicati. **Wipe** (S=∅) → chiusura forzata `deadly`. Il Planner modella la full-run; la spec formalizza anche `P(sopravvivere oltre la fase k)` come derivato (base per un futuro "consigliere di ritiro").
3. **D3 — consumabili pool party** applicati a ogni check (semantica esistente), consumati al lancio.
4. **D4 — `checkStatTags` + `partyStatMult`.** `statRequirement` resta il gate; il check somma le stat numeriche indicate da `checkStatTags` della fase; `partyStatMult` in `questSkillCheckConfig` dal report MP-00. Re-author blueprint con stat reali.

## Contratto matematico (T-000.5 — CANONICO, bloccante per T-001)

Questa sezione è il contratto numerico del modello. Il Planner e il resolver condividono **lo stesso modello e gli stessi input**; il Planner ne calcola la distribuzione in forma chiusa, il resolver ne campiona un esito. Non si dice "il numero mostrato è quello giocato": si dice **"la distribuzione mostrata è quella da cui il resolver campiona"**.

### Notazione
- Membri `i ∈ M` (`m = |M|`, tipicamente ≤ 6), fasi `k = 1..n` in ordine blueprint.
- `S ⊆ M` = insieme dei membri **vivi** all'inizio della fase `k`. I feriti restano in `S`.
- Valori di rischio in **punti percentuali** su scala D100 [0,100]; probabilità in [0,1].

### Probabilità di passaggio di fase — `phasePassChance(S, k)`
1. `skills = buildAstrolabeSkillsForPhase(membri di S con stat effettive da loadout, checkStatTags_k, D_k)` — **stessa funzione pura del runtime**. `checkStatTags` è il nuovo campo di fase (D4): stat numeriche reali; il valore sommato passa per `partyStatMult` di config prima del clamp.
2. Skill più debole: `s_raw = min_tag(skill.stat − difficulty)`; `s = clamp(s_raw + parSuccessChance, successFloor, successCeiling)`.
3. Il verdict passa su D100 intero `roll ∈ [1,100]` con `epicfail` valutato **per primo**:
   `p_pass = min(s, epicFailThreshold − 1) / 100`. Con i default (`s ≤ 95 < 96`) riduce a `s/100`.
4. `bigwin`/`win` coprono `roll ≤ s` (bigwin = `roll ≤ s·criticalWinFraction`); `almost`, `fail`, `epicfail` **non passano** (rev.3.1).

### Rischio per membro per fase — `memberRisk(i, k)`
Composizione **additiva in punti percentuali** (stessa semantica di `applyConsumableRiskEffects`), poi clamp:
- `d_{i,k} = clamp(riskProfile_k.deathChance + slotResidentModifiers_i.deathChanceDelta + equip_i.deathChanceDelta + consumabili.deathChanceDelta + cover_i, 0, 100)`
- `w_{i,k} = idem con injuryChance`.
- `cover_i = Σ_{j≠i} coverRiskDelta_j` (pp, tipicamente ≤ 0) da slot/item/tag degli **altri** membri — D1 approvato.
- Semantica del tiro singolo per membro: `r ∈ [1,100]` uniforme → morto sse `r ≤ d`; ferito sse `d < r ≤ d + w`. **Morte e ferita mutuamente esclusive**; P(danno) = `d + w`. Tiri indipendenti tra membri e tra fasi (assunzione dichiarata).
- Il tiro rischio è indipendente dal tiro verdict (nel codice sono due `rng()` separati).
- **Ferito ≠ rimosso** (rev.3.2): un membro ferito resta in `S`, contribuisce alle skill delle fasi successive e continua a tirare rischi (può morire dopo). Solo la morte rimuove da `S`.

### Aggregazione esatta — DP sui vivi (niente Poisson-binomiale)
Le fasi **non sono indipendenti**: chi muore in fase k esce da `S` per le fasi successive, cambiando le skill (rev.3.2). Il modello corretto è una programmazione dinamica esatta:

- Stato: `(k, S, c)` — fase corrente, insieme dei vivi, numero di fasi già passate.
- Transizione dalla fase `k`: verdict `Bernoulli(p_pass(S,k))` (incrementa `c`) × per ogni `i ∈ S` un tiro rischio indipendente {vive, muore} ai fini dello stato (la ferita non cambia `S`). `S′` = `S` meno i morti.
- Terminali: `P(success) = Σ P(c·2 ≥ fasi giocate)` — il denominatore sono le **fasi effettivamente giocate** (uniforme a `resolveQuestOutcomeTier`, che divide per `resolved.length`). **Party wipe** (`S = ∅`): chiusura forzata → tier `deadly` a prescindere da `c`.
- **Checkpoint ritiro (D2):** la quest ha un punto decisionale dopo ogni fase (continua/ritirati); il ritiro calcola il tier sulle fasi giocate con la stessa regola. Il Planner modella la **full-run**; output derivato `P_surviveThrough(k) = P(S ≠ ∅ alla fine della fase k)` per futura UI di ritiro.
- Costo: `O(n · 3^m)` transizioni (per ogni `S`, 2^|S| transizioni di morte). `m ≤ 12` → ≤ ~500k transizioni/fase con memoization; sopra `m_max` (config, default 12) il Planner rifiuta e logga — gli slot delle quest lo rendono irraggiungibile oggi.
- **Rischi per-membro in forma chiusa** (i tiri rischio non dipendono da `S` né dai verdict):
  `P_dead_i = 1 − Π_k (1 − d_{i,k})`;
  `P_inj_i = Π_k (1 − d_{i,k}) − Π_k (1 − d_{i,k} − w_{i,k})` (ferito almeno una volta ∧ vivo a fine quest).
- Derivati: `E[morti] = Σ_i P_dead_i`; `P(≥1 morto)` e `P(≥1 ferito)` dalla DP (eventi non indipendenti solo tramite `S`, ma la DP li traccia esattamente); opzionale distribuzione dei tier per futura UI.

### Durata — `expeditionDuration`
`dur = max(minDuration, round((Σ_k dur_k + Σ_j durationDelta_j) · Π_j durationMult_j))`.
Ordine canonico: **somma dei delta, poi prodotto dei moltiplicatori, poi arrotondamento, poi floor**. `minDuration` in config. La cavalcatura è un item che occupa lo slot equip `mount` (rev.3.3).

### Reward
`rewardMult = 1 + Σ_j rewardMultiplierDelta_j` (delta additivi sul moltiplicatore, come l'aggregazione esistente in `useQuestAssignmentPreview`). Reward base invariato.

### Output canonico e reversibilità (rev.2)
- L'output del motore è **funzione pura della bozza**: membri ordinati per indice di slot poi `residentId`; contributi ordinati `(metric, source, sourceId)`; fasi in ordine blueprint.
- Serializzazione canonica per il confronto: float arrotondati a **6 decimali** in uscita (display a 1 decimale). Stessa bozza ⇒ output bit-identico; il test di reversibilità confronta l'output serializzato, non il DOM.
- `contributions: Array<{ source: 'resident'|'slot'|'equip'|'consumable'|'penalty', sourceId, metric, delta }>` — `delta` = effetto marginale della sorgente sulla metrica finale (contribuzione = output con sorgente − output senza sorgente, stesso ordine canonico).

### Delta "precedente"
Delta = output della bozza corrente **meno** output dell'ultimo stato di bozza modificato. Primo render: nessun delta. Tornando ad A, i numeri tornano quelli di A e il delta mostra il passo appena fatto.

### Cambi di semantica runtime richiesti (dentro scope)
- `isPassingVerdict` → `bigwin | win` (almost non passa più: `resolveQuestOutcomeTier` cambia).
- Resolver di fase: tiri rischio **per residente**; il **morto** esce da `S` per le fasi successive e non tira più; il ferito resta dentro e continua. Richiede stato per-membro `alive|injured|dead` nel loop di risoluzione (nuovo stato di dominio).
- `resolvePartyConsequences`: inventario call-site, deprecazione, rimozione dal flusso.
- Consumabili della bozza: si applicano a **ogni** check di fase (semantica attuale di `applyConsumableRiskEffects`), consumati al lancio; validazione al lancio, fail esplicito se l'inventario non basta.

## Task

Ogni task richiede lo stato garantito dal precedente.

### T-000 — Decisione modello di rischio — ✅ FATTO
- Opzione **A** scelta dal Director il 2026-09-29 (DECISION_LOG): per-fase, esteso per residente.

### T-000.5 — Contratto matematico + fix data model + analisi balance — ✅ COMPLETATO (MP-00, 2026-09-30, evidence `test-results/mp00-2026-09-30.log`)
- Congelare il contratto come spec: `src/docs/docs/idle_village/mission_planner_math_spec.md` (formule, DP, clamp, ordinamento canonico, casi limite: n=1, n=2 "50% esatto = successo", p=0, p=1, party vuoto, wipe → `deadly`, **checkpoint continua/ritirati** → tier sulle fasi giocate, `P_surviveThrough(k)` come derivato).
- **Spec del fix del data model** (difetto 1-3): separazione `statRequirement` (gate) vs `checkStatTags` (stat numeriche); `partyStatMult` in `questSkillCheckConfig`; elenco dei blueprint da re-author con stat reali.
- **Analisi balance comparativa**: script che calcola successo/mortalità attesi col modello vecchio (`almost` passa, risk roll singolo, consequences a fine quest) vs nuovo (DP, stat reali) su **tutti i blueprint esistenti** → report in `test-results/`. Produce anche il valore raccomandato di `partyStatMult` perché i successi attesi cadano in un range sensato (da definire nel report, es. quest facile ~70-85%, dangerous ~30-50%).
- Tolleranza Monte Carlo fissata: 10k tiri seeded, **tolleranza ±1.5pp** su success/per-member death (errore std ~0.5pp a p=0.5 → ~3σ). È verifica secondaria, mai prova primaria.
- execution_hint: `verified`.

### T-001 — Motore analitico del Planner (puro, rng-free) — ✅ COMPLETATO (MP-01, 2026-09-30)
- `src/engine/game/idleVillage/missionPlannerEngine.ts`: `questOutcomeDistribution(draft)` → draft canonico (membri ordinati slotIndex→residentId, loadout via MP-03, consumabili pool validati con qty, itemEffects equip→quest-level) → `computeMissionPreview`; `buildMissionPhaseSpecs(blueprint)`; `serializeOutcome`; cap `plannerMaxMembers` (config, default 12) con `MissionPlannerEngineError` tipizzato.
- Fix nel math layer trovato dai golden test: `anyInjury` ora conta la massa injury-free dei wipe (un morto non tira ferita).
- Golden fixture: distribuzione esatta 1m/1f, dipendenza morte→fasi successive, ferito resta, wipe→deadly, boundary d+w>100, cover, palindromo `serializeOutcome`, accordo seeded col resolver (10k, ±1.5pp).
- execution_hint: `verified`. Evidence: `test-results/mp01-2026-09-30.log`.

### T-002 — Schema item/loadout + fix data model fasi (config) — ✅ COMPLETATO (MP-02, 2026-09-30)
- Schema Zod `src/balancing/config/idleVillage/quests/questItems.schema.ts` + pool `questItems.ts` (mount `durationMult 0.5`, weapon `statDeltas`, armor `deathChanceDelta<0`/`durationDelta`, trinket `coverRiskDelta`, 2 consumabili pool).
- `checkStatTags` landed in `PhaseRequirementsSchema`; `partyStatMult: 4` in `questSkillCheckConfig`; blueprint re-authored; `questItemsMock.ts` ridotto ad adapter (labelKey + i18n).
- `resolvePhaseStatTags`: `checkStatTags` → `requiredStatTags` → `fallbackCheckStatTags` esplicito; `statRequirement` mai letto come stat; caller pagina aggiornato.
- execution_hint: `verified`. Evidence: `test-results/mp02-2026-09-30.log`.

### T-003 — Equip → stat nel calcolo — ✅ COMPLETATO (MP-03, 2026-09-30)
- `applyLoadoutToResident(resident, loadout, catalog)` pura in `missionPlannerLoadout.ts` → `{ resident (copia con stat effettive), contributions }` per il WHY; `LoadoutError` tipizzato (UNKNOWN_ITEM/SLOT_MISMATCH); ordine canonico = QUEST_EQUIP_SLOTS.
- `statSnapshot` persistito mai mutato (test deep-equal); campi party-level (duration/cover/qty) non applicati qui per contratto.
- execution_hint: `verified`. Evidence: `test-results/mp03-2026-09-30.log`.

### T-004 — Stato del Planner — ✅ COMPLETATO (MP-04, 2026-09-30)
- Bozza di spedizione in **Context locale** al pannello; **recomputa da stato live a ogni render** → se un residente cambia stato a pannello aperto, la bozza si invalida in modo visibile (warning + `canEmbark` false).
- `missionPlannerDraft.ts` (puro): ops immutabili assign/remove/loadout/consumable, `validateDraft` vs live, `toMissionDraft` → engine input (slotIndex canonico, emptySlotPenalty, residentRiskModifiers), `buildLaunchPayload` atomico → `{questId, party[{residentId,slotId,loadout}], consumables}` oppure issues.
- `useMissionPlannerDraft.tsx` (Context locale, non persistito, non Zustand): preview via `questOutcomeDistribution` a ogni cambio; Undo (history stack) + Reset to baseline (montaggio); `prevOutcome` per delta; hook telemetry `MISSION_PLANNER_DRAFT_CHANGE_EVENT` + sink `onDraftChange` — nessuna emissione fino a MP-05.
- Rollback definito: la bozza è immutabile e mai toccata dal lancio → embark fallito = draft intatto.
- execution_hint: `verified`. Evidence: `test-results/mp04-2026-09-30.log`.

### T-005 — UI del Planner — ✅ COMPLETATO (MP-05, 2026-10-01) — **dipende da T-004**
- `FloatingPanel` "Planner", separazione netta INPUT/OUTPUT (rev.2). Pattern dalla ricerca UI (2026-09-30, hat `ui_developer`):
  - **Layout 2 colonne**: INPUT (PARTY 30% + LOADOUT) a sinistra, OUTPUT a destra; stacked sotto ~800px. PARTY = slot con avatar + **risk badge** per membro (pattern XCOM).
  - **OUTCOME headline**: barre stacked Successo/Ferita/Morte (pattern Darkest Dungeon provisioning), Durata come barra/ticks (Frostpunk), Reward.
  - **Delta**: badge `old → new` colorato accanto a ogni valore, `aria-live="polite"`, animazione ≤300ms; **Undo** toast + **Reset to baseline** (la reversibilità merita un controllo esplicito oltre al palindromo manuale).
  - **BY MEMBER**: blocco dedicato sempre visibile con rischio per singolo membro (mai solo aggregato — v23 rev.2).
  - **WHY**: pannello "Insight" collassabile + tooltip hover sui valori — raggruppato per metrica, catene causa→effetto (rev.2); niente dump tecnico aperto di default.
  - **Performance**: ricalcolo memoizzato + debounce ~100ms; il motore puro è O(n·3^m) → nessun worker necessario a m ≤ 12, ma il calcolo resta fuori dal render path critico.
- Stati: vuoto, `canEmbark` false, residente invalidato, troppi membri, touch (tap-to-open invece di hover).
- Skin via primitive + `skinConfigRegistry`, zero CSS standalone; i18n `idleVillage` incluso template WHY.
- Telemetry: open/party_change/loadout_change/launch con payload definito.
- `QuestAssignmentPreview.tsx` → `deprecated` nel `COMPONENT_MASTER_INDEX`.
- execution_hint: `verified`.

### T-006 — Integrazione risoluzione — ✅ COMPLETATO (MP-06, 2026-10-01)
- `src/engine/game/idleVillage/missionResolver.ts` — sampler stocastico duale della DP (`resolveMissionPhase`/`resolveMissionRun`): weakest-tag sui vivi, tiri rischio per-membro sulla mask di inizio fase (cover = D1), morti escono da S, feriti restano, callback checkpoint `shouldContinue`, wipe → `deadly`. `buildSessionMissionInput` costruisce l'input canonico via `toMissionDraft` + `buildMissionInput` (stesso oggetto del Planner).
- `useQuestPoiSession`: `startQuest(payload?)` → memberStates alive|injured|dead persistenti, skill sui vivi con stat effettive (loadout), durata da `missionRunDuration` (cavalcatura applica), consumabili consumati al lancio ed esclusi dalla lista per-check; checkpoint FloatingPanel continua/ritirati che pausa il clock; wipe → finalise immediato `deadly`; consequences derivate dai memberStates.
- `questMilestones`: `isPassingVerdict` = `bigwin|win`; `resolveQuestOutcomeTier` con `wiped` + tier di ritiro sulle fasi giocate.
- `QuestPowerEngine.resolvePartyConsequences` → `@deprecated`; consumatore migrato = `useQuestPoiSession`. NON migrato: `PoiDetailQuestRosterIntegrationPage` (pagina legacy, chiama ancora `resolveQuestPower` — documentato).
- Pagina: bottone "Mission Planner" pre-partenza monta `MissionPlannerLive`; `onLaunch` → `startQuestWithPayload` con ri-validazione dominio via `validateDraft`.
- Accordo seeded resolver vs DP: 10k tiri, ±1.5pp (tier, morte/ferita per membro, anyDeath, pass per fase) — il resolver campiona dalla distribuzione mostrata.
- Safeguards: vitest scope 176/176, tsc pulito sui file toccati, build:check, kanban:lint, smoke route 200. Evidence: `test-results/mp06-2026-10-01.log`.
- Follow-up (2026-10-01): preview di fase ≠ preview di quest — route del Planner con rischio per-membro effettivo + surviveThrough + tier dominante di ritiro per fase; checkpoint con doppia preview (continua → DP sulle fasi restanti coi vivi / ritirati → tier deterministico sulle fasi giocate). Fix convenzione i18n: con `i18next-icu` l'interpolazione è `{var}` — `{{var}}` restava letterale (convertiti i gruppi missionPlanner/questCheckpoint). Evidence: `test-results/mp06-phase-preview-2026-10-01.log`.
- execution_hint: `verified`.

### T-007 — Documentazione, test, evidence (risultato misurabile)
- `mission_planner_math_spec.md` (T-000.5) + `mission_planner_spec.md` (v7) + riga `COMPONENT_MASTER_INDEX` (`candidate` con criterio di promozione dichiarato) + `interaction_core_spec.md`.
- Playwright: palindromo `A → A+PG → A+PG+equip → A+PG+equip+consumabile → … → A` con **serializzazione canonica identica**; +villager su quest tutorial; +cavalcatura → Durata ↓ e slot occupato.
- Balance report vecchio/nuovo modello (T-000.5) allegato.
- Safeguard: `npm run lint -- src/ui/idleVillage src/engine/game/idleVillage` (120s), `npm run test -- idleVillage` (300s), `npm run build:check` (180s), `npm run kanban:lint` (30s). Smoke route = solo prerequisito, non prova funzionale.
- Evidence: `test-results/r078-mission-planner-<data>.log`. Aggiornare R-078, `ROADMAP.md`, `CURRENT_STATE.md`.

## Round critica multi-AI (2026-09-29) — RISOLTA in v2

Cold read (`mw-critique-plan`, transport web): chatgpt ✅ claude ✅ grok ✅ (non pertinente) deepseek ✅; gemini-web ❌. Verdetto MAJOR REVISION — evidence `test-results/plan-018-critique/`.

Bloccanti → risoluzione in v2:
1. Contratto matematico mancante → **T-000.5** con formule, DP esatta, clamp, ordinamento, casi limite.
2. Scope contraddetto → perimetro corretto: conseguenze della risoluzione dentro scope.
3. "numero mostrato = giocato" → riformulato: stessa distribuzione, stesso modello, stessi input.
4. `almost` ambiguo → **Director: non conta** (rev.3.1).
5. Reversibilità float → serializzazione canonica + ordinamento + rounding 6 decimali.
6. Tolleranza Monte Carlo → fissata ±1.5pp, secondaria.
7. Impatto balance → analisi comparativa obbligatoria in T-000.5.
8. Reward/schema/mock → `rewardMult` da delta additivi; schema Zod in `balancing/config`; inventario call-site in T-006.
9. Bozza dominio/UI → Context locale con recompute da stato live + contratto di lancio (T-004).

Risposte Director (rev.3): almost non conta; solo i morti escono dalle fasi successive (i feriti restano); cavalcatura occupa slot equip.

## Non in scope
- Cerchio magico, astrolabe (fisica/UI), chronicle, reward panel (v3/v4).
- Costo opportunità come metrica esplicita (rev.2: emerge dal gioco, il Planner non è Excel).
- Trial by Fire, authoring quest, item system reale (ERR-026) oltre lo schema Zod.
- Pool di quest / offerta quest (R-076, R-077).

## Rischi
- **Divergenza modello Planner ↔ risoluzione**: mitigata dal fatto che entrambi consumano lo stesso contratto T-000.5 e le stesse funzioni pure; la verifica è "stessa distribuzione" (test seeded con tolleranza), non "stesso numero".
- **Balance**: `almost` non passa + rischio per-residente cumulato sulle fasi + morti che indeboliscono le fasi successive → mortalità e fallimenti salgono sensibilmente. L'analisi T-000.5 quantifica prima del merge; possibile ri-tuning dei `riskProfile`.
- **Costo computazionale**: DP `O(n·3^m)` — trascurabile a m ≤ 12, cap config + memoization obbligatoria.
- **Scelta dominante**: senza costo opportunità esplicito, il Planner rischia di rendere "tutto al massimo" la risposta ovvia. Il controbilanciamento è meccanico (slot occupati, membri sottratti ai job), ma va osservato in playtest — nota per R-077.
