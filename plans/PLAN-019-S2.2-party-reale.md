---
title: 'PLAN-019-S2.2 — Party reale: pipeline stats residenti, item veri, createRun generalizzato'
status: draft
created: 2026-10-09
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
| `perc` | `%tohit` → `hitChance` (flat `txc` candidato) | reale |
| `agi` | `evasion` (dodge) | reale |
| `int` | `mock` | **mockChannel: true** — deroga registrata |
| `cha` | usa il canale `int` | **mockChannel: true** |

La tabella è `{from, scale?, mockChannel?}` per stat — quando il Director
decide le derivazioni reali di `int`/`cha` si cambia solo la config.
I check degli scenari che leggono canali mock sono **elencabili dalla
config** (deroga esplicita, non nascosta — critica r1).

## Task

- **T-1 — `questMemberStats` schema + config.** Tabella di derivazione Zod.
- **T-2 — `residentToQuestMember(resident)`.** Legge `statSnapshot`, applica
  la tabella, HP da config (regola in TUNE), portrait da
  `getResidentPortraitUrl`, ruolo dagli slot assegnati (leader/member/
  bodyguard). Puro e testabile — niente UI.
- **T-3 — `createRun` generalizzato.** Accetta `{party, loadout, seed,
  clock}`; il path `presetId` resta per lab e Monte Carlo (I-3).
  **Test di equivalenza:** un party costruito per riprodurre un preset deve
  produrre la stessa traiettoria del path `presetId` per N seed.
- **T-4 — Check di calibrazione (non tuning).** Con il party di riferimento
  reale (config), `simulateQuest` deve dare per ogni check una probabilità
  dentro la banda dichiarata in config; fuori banda = finding riportato al
  Director, non aggiustamento silenzioso.
- **T-5 — Item reali.** La sacca legge `questItems` (Zod, MP-02) invece dei
  flag mock `hasPozione`/ecc.; alias config mappa flag storici → item id;
  lo stash picker (R-102) e il counterfactual consumabile della preview
  continuano a funzionare.
- **T-6 — Safeguard + evidence.**

## Fuori scope

Derivazioni reali definitive di `int`/`cha` (attesa decisione Director —
basta cambiare config) · modifiche al balancer · equip/skill nel party
(equip è già dentro `statSnapshot` se il modello lo riflette — da verificare
in T-2, altrimenti mock-hook dichiarato).

## Acceptance

1. Un party di residenti reali esegue `goblin`/`rovine` end-to-end con stat
   derivate per la tabella — nessun dato inventato nel percorso dei canali
   reali.
2. Test di equivalenza preset≡party verde su N seed.
3. Check di calibrazione eseguito; eventuali fuori-banda riportati come
   finding nell'evidence, non corretti di nascosto.
4. Elenco generabile dei check su canali mock (`mockChannel`) per i due
   scenari dello slice.
5. Item reali nel run; alias retrocompatibile per i flag storici.
6. Safeguard verdi + evidence log.
