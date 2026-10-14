---
title: Convergenza settlement — un solo contratto di conseguenze sui due aggregati residente
status: candidate
created: 2026-10-14
desiderata: FROZEN R-176/R-179 (lab verso gameplay reale); v12 (rischio per-slot e aggregato); PLAN-019-S2.5 (settlement idempotente)
request: R-186 (RICHIESTE.md) — «far scrivere gli esiti di questSettlement anche su VillageState»
---

# BOZZA — non battezzata. Attende avallo del Director.

## Contesto verificato sul codice (R-184 + audit mirato 2026-10-14)

Tre rappresentazioni residente, due aggregati vivi:

| Aggregato | Motore | Chi scrive | Dove vive |
|---|---|---|---|
| `MinimalGameplayState` (`MinimalResident[]`) | `tick()` di `minimalGameRules` | `questSettlement.applyPlanToState` | `/game` reale, persistito |
| `VillageState` (`Record<id, ResidentState>`) | `advanceTime` di `TimeEngine` | `scheduleActivity`, sweep, lab | legacy/sandbox/test + **goblin-lab** |
| `minimalGameRules.ResidentState` | calcoli interni `tick()` | — | dentro lo store |

Fatto decisivo: **`VillageState` non è l'aggregato vivo di `/game`** —
`advanceTime`/`useActivityScheduler` compaiono solo in `legacy/`,
`VillageSandbox*` e test hooks. Il gioco reale gira su `MinimalResident` +
`tick()`, e `selectResidentRosterStates` (useMinimalGameplay:125) proietta
già `MinimalResident → ResidentState` in sola lettura (`isDead`/`isInjured`/
`isOnExpedition` → `dead`/`injured`/`away`).

## Il problema da non creare

Scrivere gli esiti del settlement *anche* su `VillageState` dentro `/game`
produrrebbe un **aggregato fantasma**: nessuno lo farebbe avanzare
(niente fatigue/sweep/consumo reale), la doppia scrittura divergerebbe di
nuovo al primo drift, e si aggiungerebbe una sincronizzazione implicita —
esattamente ciò che R-184 ha eliminato nel lab. Rifiutato.

Il problema reale non è "due aggregati non sincronizzati" ma **"due
semantiche di conseguenza scritte due volte"**: `applyPlanToState` sa
come si ferisce/uccide/paga un residente (wound → `injuredUntilTick =
max(...)`, dead → azzera injury+working, XP come delta guardato, ledger
idempotente); il lab ri-scrive quella semantica a mano in `applyHarm` /
`applySiegeOutcome`. Dopo R-184 le due semantiche coincidono *per
ispezione* — ma niente impedisce che divergano al prossimo edit.

## Decisione (opzione scelta)

**Un solo contratto di conseguenze, due applicatori sottili.**

`SettlementPlan`/`SettlementEffect` restano il formato canonico delle
conseguenze (PLAN-019-S2.5, già journal+idempotente). Si estrae il nucleo
di semantica per-residente in un modulo engine-side puro e si fornisce
`applyPlanToVillageState` speculare di `applyPlanToState`. Il lab smette
di scrivere ferite/morti a mano: emette `SettlementEffect` e li applica
via la stessa unità. `/game` non cambia comportamento runtime.

Non si fa: unificazione dei due modelli (R-184: contesti diversi),
two-way sync live (`residentSync` oggi è solo prune-roster — una sync
bidirezionale è la migrazione fragile che il Director ha escluso),
doppia scrittura su aggregato non vivo.

## Tasks

### T-1 — Nucleo condiviso engine-side
`src/engine/game/idleVillage/settlementConsequences.ts` (nuovo, puro,
zero import UI/store):
- Tipi `SettlementEffect`/`SettlementPlan` spostati qui (o in
  `settlementTypes.ts`); `questSettlement.ts` re-exporta → nessun break.
- Micro-regole pure condivise: `nextRecoveryTick(existing, tick, ticks)`
  = max; semantica morte (terminale, azzera ferita); delta guardato XP.
- `applyPlanToVillageState(state, plan, tick, opts)`:
  `resident-wounded` → `status:'injured'`, `isInjured:true`,
  `injuryRecoveryTime=max(existing, tick+opts.woundRecoveryTicks)`;
  `resident-dead` → `status:'dead'`, `currentHp:0`, `isInjured:false`;
  `resident-xp` → `xp += amount`; `village-gold` → `resources.gold +=`
  delta guardato; `village-xp`/`loadout-release`/`partyIds` → no-op
  documentati (VillageState non ha xp pool né flag expedition —
  la disponibilità torna via completamento attività, fix R-184).
  Ledger: `opts.appliedEffectKeys: Set<string>` posseduto dal caller
  (stessa chiave `${runId}:${effect.key}`) → `appliedNow`.
- Test nuovi `settlementConsequences.test.ts` + **parity test**: stesso
  plan → esito per-residente equivalente sui due aggregati
  (wounded↔injured+recovery, dead↔dead/isDead, xp identico).

### T-2 — Refactor `applyPlanToState` sul nucleo
Le regole wound/dead/xp/ledger diventano chiamate alle micro-regole
condivise. Nessun cambio di comportamento: la suite settlement esistente
(tests/unit/idleVillage/quests/questSettlement.test.ts) è la guardia —
deve restare verde byte-per-byte sul comportamento.

### T-3 — Il lab adotta il contratto
In `tools/goblin-lab/lab.ts`:
- `applyHarm` → targeting posizionale resta OBSERVED-ADAPTER, ma la
  scrittura diventa `SettlementEffect` (`resident-wounded`/`resident-dead`)
  applicata via `applyPlanToVillageState`; `recoveryTicks` = giorni del
  tier S2 (parametro, non hardcoded — così il lab resta avanti al
  canonico flat-5 senza mentire).
- `applySiegeOutcome` + vittime breccia → stesso canale.
- Ledger lab = `Set` in `LabState` (o riuso di `resolvedInstances` per
  gli effetti istanza).
- Niente cambio a metriche/end-run/hero-death (regole lab dichiarate).

### T-4 — Test, documenti, safeguards
- Lab suite 44/44 + nuove invarianti di parità semantica.
- `npm run test` scope settlement/TimeEngine; `build:check`;
  `kanban:lint`; lint scope.
- `FIDELITY.md`: il percorso conseguenze promosso da OBSERVED-ADAPTER a
  CANON-semantica-condivisa (targeting harm resta adapter); residuo
  "doppio aggregato" riscritto come "doppio aggregato, singolo contratto".
- Evidence log `test-results/r186-*.log`; chiusura R-186 in RICHIESTE.

## Decisioni aperte (da non decidere in silenzio)

1. **`woundRecoveryTicks` flat-5 vs tier** — l'unità prende il valore dal
   caller. Il gioco resta a 5 finché una decisione non consuma
   `globalRules.injuryTiers` (gap già documentato S2/R-184). Riaprire?
2. **`village-xp`/`loadout-release` su VillageState** — proposta: no-op
   documentati. Se serve xp-village anche nel lab, mapparlo su una
   risorsa esplicita.
3. **Il ledger dentro `VillageState`** — proposta: campo opzionale
   `appliedQuestEffectIds?: string[]` solo quando servirà persistenza
   produzione; nel lab il Set vive in `LabState`.

## Criterio di successo verificabile

Conseguenza identica sui due modelli garantita da un solo codice
condiviso (non da ispezione): il parity test T-1 verde + suite settlement
invariata + lab 44/44 + replay deterministico intatto.
