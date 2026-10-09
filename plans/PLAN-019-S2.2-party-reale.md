---
title: 'PLAN-019-S2.2 — Party reale: pipeline stats residenti, item veri, createRun generalizzato'
status: active
created: 2026-10-09
revised: 2026-10-09 (r1 figli: 2× MAJOR → assorbito. r2: 2× MAJOR → assorbito; run `…/s2.2/r2/`. Director 2026-10-09: `perc←txc` chiuso; feriti ammessi con HP/modificatori ridotti)
desiderata: v24 (PLAN-019, stadio S2), D-C (derivazione stats — Director 2026-10-09)
request: R-107
parent: PLAN-019-S2 (figlio 2/5)
related: useQuestRun.ts, questRun.ts (I-3: motore invariato), statMatching, questItems.schema.ts (MP-02), questStash.ts, getResidentPortraitUrl, InjuryEngine
---

# PLAN-019-S2.2 — Party reale

## Perimetro

Il run parte con residenti **veri**, non preset di laboratorio. Questo figlio
costruisce la pipeline unica `residente → PartyMember` e gli item reali. Le
competenze si derivano dallo **StatBlock combat** del balancer
(`statSnapshot`), secondo la tabella D-C — mai valori inventati.

## Pipeline `questMemberStats` (config Zod, unica fonte)

| LabStat | Regola (D-C) | Canale |
|---|---|---|
| `str` | `damage` | reale |
| `con` | `hp` | reale |
| `perc` | `txc` (flat — indipendente da evasion) | reale |
| `agi` | `evasion` (dodge) | reale |
| `int` | `mock` | **mockChannel: true** — deroga registrata |
| `cha` | usa il canale `int` | **mockChannel: true** |

**`scale` è OBBLIGATORIA per ogni canale reale** (critica r1: le stat reali
`damage`~25/`hp`~150-230/`txc`/`evasion` non sono nel dominio LabStat
20-75 su cui gli scenari sono tarati — senza scala esplicita la pipeline
produce numeri arbitrari e le probabilità dei check si rompono). Ogni riga:
`{from, scale: {kind: 'linear'|'clamp'|'thresholds', inputRange, outputRange},
round, missing, mockChannel?}` — forma esplicita, range di input dai
residenti reali del balancer, range di output coerente con le attese degli
scenari, gestione valori mancanti/invalidi, arrotondamento dichiarato.
**+ riga `runHp` nella stessa tabella** (critica r2): gli HP di run hanno
la propria scala con vincolo — devono stare nel range per cui gli scenari
sono stati validati in S1, perché i danni (`upfrontDamage`/combat/harm)
sono in unità lab e il motore non cambia (I-3). **T-1b**: tabella di
distribuzione stat reali → stat quest, approvata dal Director **prima**
del check di calibrazione — guardando le **distribuzioni**, non le
probabilità dei check (altrimenti la scala diventa tuning mascherato).

**Fonte `perc` — CHIUSA (Director 2026-10-09): `perc ← txc`** (flat,
indipendente da evasion — coerente con la nota critica r2 sull'anticorrelazione:
`hitChance = txc+50−evasion` avrebbe reso i PG agili ciechi in Percezione).
Il test di correlazione tra canali sui residenti reali resta in T-2 come
guardia.

**Equip NON modifica le stat combat** (FACT verificato 2026-10-09:
`useResidentHeroState` sovrappone a `statSnapshot` solo i campi
`equipment`/`inventory`/`skills` come metadati; `damage`/`hp`/`txc`/
`evasion` non ricevono bonus equip). Dichiarato: **in questo slice i check
non dipendono dall'equip**; l'effetto equip→stat è un hook futuro (rileva
anche per `avgEquipPower` di S2.3).

La tabella è unica fonte — quando il Director decide le derivazioni reali di
`int`/`cha` si cambia solo la config. I check degli scenari che leggono
canali mock sono **elencabili dalla config** (deroga esplicita).

## Task

- **T-1 — `questMemberStats` schema + config.** Tabella di derivazione Zod.
- **T-2 — `residentToQuestMember(resident, role)`.** Legge `statSnapshot`,
  applica la tabella, **HP di run = riga `runHp` della stessa config**
  (nel range validato S1 — v. tabella). **Confine ferite — regola unica
  (Director 2026-10-09, supera l'esclusione di r2)**: il residente ferito è
  **ammesso** (v24 rev.2: «il ferito può continuare» — e ripartire), senza
  warning dedicato; l'adapter legge lo stato ferita come parte dello stato
  reale del residente: **HP di partenza ridotto** (pool HP del party
  minore) + **modificatori alle stat** da `InjuryEngine`. Il forecast usa
  lo stesso adapter → ne tiene conto automaticamente; se `InjuryEngine`
  non espone ancora i modificatori numerici, la riduzione HP è il minimo
  reale e i modificatori stat sono mock-hook dichiarato in config.
  `role` è **parametro** (leader/member/bodyguard) — la derivazione dagli
  slot vive in S2.4. Portrait da `getResidentPortraitUrl`. Deterministico
  e testabile — niente UI.
- **T-3 — `createRun` generalizzato.** Accetta `{party, loadout, seed,
  clock}`; il path `presetId` resta per lab e Monte Carlo (I-3).
  **Test separati** (critica r1): (a) *regressione motore* — `createRun`
  con `PartyMember` costruiti a mano equivalenti a un preset → stessa
  traiettoria del path `presetId` per N seed su politica uniforme;
  (b) *golden dell'adapter* — `residentToQuestMember` su fixture di
  residenti reali con output atteso per stat, inclusi casi limite
  (`Partial<StatBlock>` senza `hp`/`damage`, valori mancanti/invalidi).
- **T-4 — Check di calibrazione a due livelli** (critica r2). Con il
  **party di riferimento reale** (residenti nominati in config, stat
  reali), `simulateQuest` misura per ogni check la probabilità osservata
  contro un **riferimento di calibrazione per-check dichiarato e
  versionato, indipendente dal risultato osservato** — le bande di
  pericolo dell'offer NON sono i riferimenti per-check (misurano la
  classificazione globale, non la difficoltà del singolo check); se il
  lab non fornisce la probabilità attesa, il riferimento si deriva dalle
  simulazioni per-check di `questSimulation.ts` sullo scenario authored
  originale e si dichiara come config versionata. Per ogni check si
  registra: scenario, competenza, distribuzione input reali, riferimento,
  probabilità simulata, scostamento. **Due esiti distinti**: (a)
  *diagnostica* — gli scostamenti si registrano durante S2.3/S2.4; (b)
  *gate di accettazione* — prima che S2.2 sia chiuso per uso integrato,
  ogni scostamento è classificato e approvato dal Director o corretto e
  ritestato: gli unici tre esiti ammessi sono **ri-approvare la scala,
  spostare la banda in config versionata, accettare+registrare**. Un
  finding documentato ≠ chiuso. T-4 include la **distribuzione delle
  morti** (non solo le probabilità dei check) e l'equivalenza anche per
  HP non-preset.
- **T-5 — Item reali + contratto di consumo.** La sacca legge `questItems`
  (Zod, MP-02); alias config mappa flag storici → item id. **Contratto di
  consumo dichiarato** (critica r1): la sorgente è la **sacca di
  spedizione** (non l'inventario residente); il `loadout` si congela nel
  run alla creazione; il consumo durante il run è registrato **solo nello
  stato del run** — il writeback verso lo stato di gioco è esclusivamente
  in S2.5 con la stessa chiave di idempotenza (niente doppio consumo
  run+settlement). **Riserva alla creazione** (critica r2): alla creazione
  del run gli item del loadout passano a stato `reserved` **chiavato sul
  runId** — non selezionabili da un'altra spedizione; il rilascio su ogni
  transizione terminale (incluso `clear`) è responsabilità di S2.5 —
  interfaccia tra sibling dichiarata qui. Lo stash picker (R-102) e il
  counterfactual consumabile continuano a funzionare.
- **T-6 — Safeguard + evidence.**

## Fuori scope

Derivazioni reali definitive di `int`/`cha` (attesa decisione Director —
basta cambiare config) · modifiche al balancer · equip/skill nel party
(equip è già dentro `statSnapshot` se il modello lo riflette — da verificare
in T-2, altrimenti mock-hook dichiarato). **FACT registrato (critica r2,
contraddizione rimossa)**: `statSnapshot` **non** contiene bonus equip —
T-2 include un test che fallisce se due residenti con stesso
`statSnapshot` e equip diverso producono `PartyMember` diversi;
equip→stat è hook futuro dichiarato, mai implicito.

## Acceptance

1. Un party di residenti reali esegue `goblin`/`rovine` end-to-end con stat
   derivate per la tabella con scala esplicita — nessun dato inventato nel
   percorso dei canali reali.
2. Equivalenza motore (a) e golden adapter (b) verdi su N seed.
3. Check di calibrazione eseguito; eventuali fuori-banda riportati come
   finding nell'evidence, non corretti di nascosto.
4. Elenco generabile dei check su canali mock (`mockChannel`) per i due
   scenari dello slice.
5. Item reali nel run; alias retrocompatibile per i flag storici.
6. Safeguard verdi + evidence log.
