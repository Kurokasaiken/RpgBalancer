# Goblin Lab — Confini di fedeltà (CANON / OBSERVED-ADAPTER / PROPOSTA / STUB)

Regola: ogni numero del lab deve essere leggibile insieme al livello di
fedeltà della meccanica che l'ha prodotto. Un limite del simulatore non è
un difetto del gioco; un risultato da adapter non è una proprietà del
canonico.

| Meccanica | Livello | Dove | Nota |
|---|---|---|---|
| Board offerte, gate a 4 stati, leader capacity, timer, scadenze | CANON | `src/engine/metaLayer` | sessione reale |
| harmProfile wound/death condizionati al fail, outcome graduati | CANON | metaLayer `resolve` | death/wound = dati authored |
| Disponibilità/esclusività residenti (away/injured/dead) | CANON | `src/engine/time` (TimeEngine) | recovery via sweep reale |
| Durata ferite per tier (light 1gg / moderate 3gg / severe 7gg) | CANON-dato | `globalRules.injuryTiers` | valori copiati in `cfg.injuryTiers` |
| **Mappa outcome→tier ferita** (epicFail→severe, fail→moderate, almost→light) | OBSERVED-ADAPTER | `cfg.woundTierByOutcome` | metaLayer non emette severità: regola lab |
| Reward offerte → risorse villaggio | OBSERVED-ADAPTER | `cfg.rewards` | conversion rewards posticipate in PLAN-030 |
| Dimensione party per offerta | OBSERVED-ADAPTER | `cfg.partySize` | |
| Vittoria campagna = Re sconfitto | OBSERVED-ADAPTER | `cfg.rewards['king-assault']` + milestone | |
| **Consumo cibo per-residente** (tutti i vivi, eroe/feriti inclusi) | CANON | TimeEngine `foodConsumptionPerResidentPerDay` | R-179: `rate = eatPer×10` → media `eatPer`/giorno-lab sul ciclo 5+5 |
| **Produzione = job assegnati** (`scheduleActivity` + `resolveJob`) | CANON-meccanica | TimeEngine + JobResolver, stesso path di `useActivityScheduler` | R-179. Dati (rate/res) = OBSERVED-ADAPTER |
| **Work↔difesa↔quest: stesso pool `available`** | CANON | disponibilità TimeEngine | lavoratore 'away' non difende né questa |
| Fame (end-rule a `cibo≤0`) | PROPOSTA | `advanceDay` | il canonico logga starvation ma non termina la campagna |
| **Invasione = missione per-membro** (fasi, check weakest-tag `for`, rischio wound/death, morti che escono dalle fasi, tier `classifyTier`) | CANON-meccanica | `resolveMissionRun` (MP-06) | Inc E: stesso modello delle spedizioni quest |
| Difensori = eroe se `available` + `trainedPresent` | CANON | disponibilità TimeEngine | away/injured/lavoro non difendono |
| Threat→difficulty, fortificazioni→sconto diff, gap→emptySlotPenalty, tier→tier ferita, breccia→vittime civili/edifici | PROPOSTA-dati | `cfg.siege` | la risoluzione invasione nel gioco reale non esiste ancora |
| Civili away = non vittimizzabili | OBSERVED-ADAPTER | `invade()` | away = fisicamente fuori dal villaggio |
| Bonus edifici flat (`gives`) | PROPOSTA-dati | `cfg.buildings` | nel gioco reale gli edifici sbloccano job, non producono passivi |
| Costi edifici/azioni/training | PROPOSTA-dati | `cfg` | parametri, non meccanica |
| Eroe mortale = fine run | PROPOSTA | regola lab | nel gioco ci saranno altri leader? |
| Migranti/mercenari come offerte `people` | PROPOSTA-contenuto | `labContent.ts` | contenuto authored del lab |
| RNG stream splitting lab-side | lab-infra | `childSeed` | non tocca il metaLayer (reseed-by-call interno intatto) |
| **S3 — resolver-variante B/C** | OBSERVED-ADAPTER | `resolvers.ts` + intercetto `quest-resolved` | il canonico risolve internamente invariato; la variante ri-risolve sullo stream `resolve`, annulla le writes canoniche (delta negato) e applica le proprie. Divergenze contate in `resolverDivergences` |

## S3 — Esperimento resolver A/B/C (evidence per D4)

Tre modelli confrontati a matched-seed; **nessuno modifica il canonico**.
Scopo: evidence pack per la decisione D4 del Director, non promozione
automatica.

| Modello | failChance | Outcome table | Fedeltà |
|---|---|---|---|
| **A — canonico** | `mid(riskBand)` + gate discreto (−0.1 / 0 / +0.15) | invariata | CANON (baseline) |
| **B — continuo** | `hi − (hi−lo)·min(power/ref,1)` sulla raw band + penalità gate sopra | invariata | OBSERVED-ADAPTER |
| **C — ibrido** | identica ad A (discreta) | `epicFailBelow·(1−n)`, `almostBelow·(1−n/2)`, zona big-win ×(1+n/2), con `n=min(power/ref,1)` | OBSERVED-ADAPTER |

`ref` = soglia over-qualified del tier (`tuning.overQualifiedPower.t*`),
`power` = `partyPower(party)` canonico (Σstats + powerPerCapability×caps).

**Cosa B e C testano**: sotto A, il power entra solo attraverso la soglia
discreta → dead zone misurata in S0 (26 punti senza effetto) e training
inosservato nella matrice (0 sessioni di allenamento stat dall'optimizer).
B rende ogni punto di stat rilevante; C lascia il rischio discreto ma
premia la preparazione nella *qualità* dell'esito.

## R-179 — Economia per-persona (Inc F)

Audit → incremento verticale scelto: **produzione via lavoro reale +
consumo cibo engine-side**, perché collega disponibilità → assegnazione →
tempo → consumo → reward → decisioni successive (il ciclo chiesto).

- `prodPer` (produzione passiva per-capita) **rimosso**: ora solo i villager
  assegnati a `cfg.jobs` producono, via `scheduleActivity` (status 'away',
  esclusività reale) + `resolveJob` a completamento — la stessa
  orchestrazione di `useActivityScheduler.resolveCompletedActivities`.
- Consumo: rimosso `eatPer×pop` manuale; `globalRules.
  foodConsumptionPerResidentPerDay = eatPer×10` riproduce in media
  `eatPer`/giorno-lab (giorno-lab = 1 tick, ciclo canonico 5+5 → solo i
  tick diurni consumano rate/5). Eroe e feriti mangiano (canonico).
- Bridge `S.res ↔ vil.resources` (`food ↔ cibo`) in `advanceDay`:
  OBSERVED-ADAPTER di bookkeeping, la meccanica resta engine-side.
- Persona: `work.{foodCover,woodKeep,ironKeep}` = dati di policy
  (quanti lavoratori assegnare), non meccanica. Preferenza non-trained,
  sort per fatigue crescente → rotazione naturale.
- Metrica nuova: `personDays.jobs` (giorni-persona lavorati).
- Gap canonici emersi e documentati (non fixati, fuori scope):
  1. `continuousJob` + `dailyRewardProfile.amountPerDay` è letto da
     `applyContinuousJobTick` via `evaluateResourceAmount` che cerca
     `amountFormula` → streaming tick produce 0. Il percorso reale del
     gioco è `resolveJob` a completamento (che leggiamo anche noi).
  2. ~~`exhausted` terminale~~ → **risolto in R-190**: nello sweep
     notturno `exhausted→available` quando `fatigue < maxFatigueBeforeExhausted`
     (lo status è la proiezione canonica di fatigue ≥ cap). Test R-190 in
     `TimeEngine.unit.test.ts`.
  3. `scheduleActivity` genera id con `Date.now()+Math.random()` — gli id
     attività non sono riproducibili, ma non entrano in nessun draw né nel
     report → replay deterministico intatto (test A5/B7, S3-E3 verdi).

## Inc E — Assedio come missione canonica (R-182)

`invade()` v0.2 (scalare threat vs difesa flat, vittime random tra tutti i
villager) → `resolveMissionRun` MP-06. La risoluzione invasione nel gioco
reale non esiste ancora: la meccanica riusata è quella canonica delle
spedizioni (stessa sorgente del DP del Mission Planner), i dati bridge sono
adattatori dichiarati in `cfg.siege`.

- **Membri** = eroe (solo se `available` — se è in missione o ferito non
  comanda la difesa) + `trainedPresent` (milizia addestrata E disponibile).
- **Check di fase** = weakest-tag su `for` del gruppo difensori
  (eroe: `S.st.FOR` reale → allenare l'eroe aiuta la difesa; villager
  addestrato: `siege.trnFor` adapter) × `partyStatMult` canonico 4.
- **Difficoltà** = `diffBase + threat·diffScale − fortificazioni·pp`
  (threat = curva v0.2 invariata, PROPOSTA-dati).
- **Rischio per-membro** = `baseInj`/`baseDeath` per fase + `gap` (threat
  − difesa v0.2 stimata) mappato su `emptySlotPenalty` canonico.
- **Tier → esito**: perfect/success = respinta; partial/fail/deadly =
  breccia → vittime tra i civili **presenti** (status ≠ away, non
  difensori) + distruzione edifici proporzionale al gap; wipe = deadly.
- **Persistenza**: morti e ferite su `ResidentState` reali (sweep
  recovery TimeEngine); `eroe caduto in difesa` chiude la run (CANON-tag
  via `endFidelity` — harm da resolver canonico).
- **Conseguenza gameplay osservata**: `holdForSiege` (persona) — non
  commettere quest non-Re che risolverebbero oltre `nI`, perché il party
  sarebbe `away` durante l'assedio. Prima della policy fix: 8 brecce/10
  seed; dopo: 2. È la prima decisione calendario del lab.
- **Semplificazione dichiarata**: nessun retreat — il villaggio combatte
  fino all'ultima fase (D2 non si applica a un assedio subìto).

**Caveat di metodo**: il ri-roll variante avviene dopo che il canonico ha
consumato i suoi draw — i confronti A/B/C sono matched-seed sulle
condizioni iniziali e sullo scenario, non draw-by-draw. I draw della
variante arrivano dallo stream `resolve` (isolato dagli altri
sottosistemi). Il gate della variante è ri-valutato *dopo* le writes
canoniche — per i contenuti lab nessuna offerta ha provides che
soddisfano i propri requisiti, quindi il gate coincide.


## R-184 — Ciclo di vita dei residenti (audit + invarianti)

Audit sul codice del percorso arrivo→reclutamento→assegnazione→ferita→
recupero/morte→propagazione. Decisione: **fix circoscritto delle
transizioni + adapter rafforzato**, non unificazione `ResidentState`/
`MinimalResident` (il lab non consuma `questSettlement`; i due aggregati
servono contesti diversi — unificare sarebbe migrazione senza problema).

**Bug canonici trovati e corretti (src/):**
- `TimeEngine` completamento: `status → available/exhausted` era
  incondizionato → un membro morto/ferito in missione **resuscitava** al
  rientro. Ora solo `status==='away'` transita (l'harm sopravvive al volo).
- `TimeEngine` sweep recovery: non resettava `isInjured` → doppia verità
  divergente (`status='available'` + `isInjured=true` per sempre).
- `metaLayer` eventi `quest-resolved`/`quest-deadline-fail`: aggiunto
  `instanceId` (contratto additivo) — match delle conseguenze non
  ambiguo tra quest omonime.

**Bug lab corretti:**
- `quest-deadline-fail` lasciava la `liveQuest` zombie → l'harm di una
  risoluzione omonima successiva finiva su membri estranei.
- Fallback `members=[hero]`: una risoluzione senza match feriva
  silenziosamente l'eroe → ora `[]` + log esplicito.
- Id migranti `m-${day}-${i}`: due arrivi lo stesso giorno collidevano e
  sovrascrivevano un residente → contatore monotono `migrantSeq`.
- `partyOf` univa trait di residenti `away` → capability fantasma sui
  gate; ora solo `status==='available'` (disponibilità reale).
- `resolvedInstances`: un `quest-resolved` non applica mai due volte
  reward+harm (dedup per istanza).

**Invarianti testate (V1–V8 + 3 test TimeEngine canonici):**
identità migranti univoca; morte terminale (non assegnabile, non
resuscita); ferita canonica (non assegnabile, recovery + `isInjured`
pulito); esclusività away; no zombie/double-apply; capability solo da
presenti; coerenza pop/roster/metriche.

**Residuo noto (non in scope):** i 3 test `resolveActivityOutcome` di
`TimeEngine.unit.test.ts` fallivano già prima (pre-esistenti);
`MinimalResident`
resta l'aggregato del settlement reale — convergenza avvenuta in R-186
via **kernel condiviso** (non via unificazione dati né `residentSync`).
`exhausted` non è più terminale dal fix R-190 (recovery sotto il cap
di fatigue → `available`, vedi nota 2 sopra).

## R-186 — Kernel conseguenze condiviso (artifact-r003, converged 4/4)

**Decisione:** le tre mutazioni per-residente — ferita, morte, XP — sono
ora un'unica macchina a stati pura in
`src/engine/game/idleVillage/residentConsequences.ts`
(`reduceResidentHealth` + adapter `applyConsequenceToResidentState` /
`applyConsequencesToVillage` / proiezioni `normalize*`). Prima la stessa
semantica era riscritta a mano in `applyPlanToState` (MinimalResident),
`applyHarm`/`applySiegeOutcome`/breccia (lab su ResidentState): coincideva
per ispezione, nulla impediva che divergesse.

| Aspetto | Livello | Dove | Nota |
|---|---|---|---|
| Precedenza `dead > injured > away/available`, wound=`max(existing, now+d)`, death pulisce i campi ferita, xp = guarded delta | **CANON-condiviso** | `residentConsequences.ts` | stessa riduzione su entrambi gli aggregati — parity test `tests/unit/idleVillage/residentConsequences.test.ts` |
| Guardia "ferite guariscono solo a riposo" nello sweep | CANON | `TimeEngine.ts` (R-139) | membro di attività `pending`/`running` con `endTime > tickEnd` non guarisce mid-flight — chiuso il buco WITNESS-05 (ferita a metà attività poteva rendere il residente `available` e riassegnabile mentre l'attività lo possedeva ancora) |
| Ledger idempotenza | caller-owned | `appliedQuestEffectIds` (store) / `resolvedInstances` (lab) | niente ledger su `VillageState`; `settlementEffectKey` single-sourcing del formato `${runId}:${key}` |
| `durationTicks` per-effetto su `resident-wounded` | CANON-condiviso | `SettlementEffect.durationTicks` | `/game` omette → flat `woundRecoveryTicks` (5); lab passa il tier (1/3/7). Il gap flat-vs-tier nel gioco reale resta una decisione aperta |
| Targeting posizionale harm, outcome→tier, tier→woundTicks | OBSERVED-ADAPTER | `lab.ts` (`positionalIndex`, `cfg`) | restano adapter lab, non canonici |

**Delta dichiarato** (WITNESS-04): `resident-dead` ora azzera anche
`injuredUntilTick` su `MinimalResident` — allinea il codice al contratto
documentato in `gameplayTypes.ts` («the wound fields are cleared»);
`tick()` non legge `injuredUntilTick` su `isDead` e i save vecchi sono
compatibili (campo opzionale). Fix reale: `QuestEpilogue` mostrava un
countdown di recupero su un caduto.

**Verifica:** `residentConsequences.test.ts` 17/17 (micro-rules, parity
step-by-step su 4 stati iniziali, mid-activity guard), `questSettlement`
21/21, lab **45/45** (+V9), replay deterministico byte-identico.

## Classi di esito (tag `end.fidelity` nel RunReport)

- `eroe caduto in missione` → **CANON** (harmProfile + resolve reali)
- `Re dei Goblin sconfitto` → **OBSERVED-ADAPTER** (milestone canon + reward lab)
- `collasso strutturale`, `fame`, `villager estinti`, `timeout` → **PROPOSTA**

## Lettura corretta dei risultati

- "win rate" e "hero death" sono misure **del lab** sulla fidelity matrix
  corrente, non stime del gioco reale.
- Confronti matched-seed validi *dentro* lo stesso livello di fedeltà e la
  stessa struttura di consumo RNG.
- Un finding che dipende da PROPOSTA (invasioni, fame) diventa finding di
  gioco solo quando la meccanica reale esiste.

## R-190 — Lab giocabile nel browser (`/macro-gameplay`)

- `tools/goblin-lab/` **committato** (era gitignored: `tools/` → `tools/*`
  + `!tools/goblin-lab/`) perché la pagina `src/ui/idleVillage/pages/
  MacroGameplayLabPage.tsx` ne dipende a build time.
- `lab.ts` è ora importabile da browser: API esportata (`init`, `act`,
  `build`, `train`, `assignWorkers`, `commitOfferToLab`, `advanceDay`,
  `policy`, `report`/`summary`, helper `nextInvasionEst` ecc.) e tail CLI
  gated su `argv[1]` via `globalThis.process` — nessuna esecuzione
  all'import, CLI invariata.
- `scenario.ts`: `configHash` passato da `node:crypto` sha256 → **FNV-1a
  64-bit** puro (browser-safe). Gli hash degli scenari cambiano rispetto
  ai log precedenti — resta un'identità di config, non crittografia.
- `invade()` single-source della formula threat con `nextInvasionEst()`
  (la UI mostra threat/difesa stimata della prossima ondata).
- **Fix canonico**: `exhausted→available` nello sweep notturno di
  `TimeEngine` quando `fatigue < maxFatigueBeforeExhausted` — vedi nota 2
  sopra. Regressione coperta in `TimeEngine.unit.test.ts` (R-190).
- Rotta orfana ripristinata: `/goblin-event-lab` (GoblinEventLabPage) +
  card in TestHub.
