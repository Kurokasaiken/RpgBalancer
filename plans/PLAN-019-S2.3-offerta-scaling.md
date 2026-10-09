---
title: 'PLAN-019-S2.3 — Offerta POI: questPois config, bande pericolo/reward, resolveQuestOffer + world-scaling'
status: draft
created: 2026-10-09
desiderata: v24 (PLAN-019, stadio S2), D-H (planning surface), D-I (world-scaling — Director 2026-10-09), R-105 (bande pericolo)
request: R-107
parent: PLAN-019-S2 (figlio 3/5)
related: simulateQuest (Monte Carlo — esiste), questPoiSession, TimeEngine (daysPlayed reale), equipmentStorage/heroItems (avgEquipPower), useQuestAssignmentPreview
---

# PLAN-019-S2.3 — Offerta e world-scaling

## Perimetro

Il POI prende i valori dalla config corretta (D-H) e pericolo/reward passano
da un punto unico di risoluzione con modificatori esterni — tra cui il primo
**world-scaling reale** (D-I). Niente UI in questo figlio: produce i dati
che S2.4 mostra.

## Pezzi

### `questPois` config (Zod)

`{id, x, y, questId, availableDays, estimatedDuration (game-ticks),
slots: {required[], optional[]}}` — due POI dello slice (goblin, rovine).

### Bande di espressione

- `dangerBands` (R-105, esiste): fascia **derivata** via `simulateQuest` su
  party di riferimento dichiarato in config, **etichettata come ipotesi sul
  riferimento** — mai promessa sul party assegnato.
- `rewardTiers` (**nuovo schema Zod**): bande label+icona per la quantità di
  reward — stesso pattern delle dangerBands, mai numeri crudi in UI.

### `resolveQuestOffer(offer, modifiers)` — il «constructor»

Punto unico di risoluzione di pericolo/reward/durata. `modifiers` = bag di
input esterni; **i valori risolti si congelano nell'istanza di run alla
creazione** — un run attivo non cambia se config o mondo cambiano a metà
(coerente con la frontiera deterministica). Nuove sorgenti future si
innestano nel bag senza cambiare il contratto.

### `worldScaling` v0 (D-I — sostituibile come unità)

`collectWorldProgressSignals()` → segnali → config `worldScaling` (Zod:
pesi + bande) → `{dangerScale, rewardScale}` nel bag.

| Segnale | Fonte | Stato |
|---|---|---|
| `daysPlayed` | TimeEngine (day index) | reale |
| `avgHeroPower` | derivato da `statSnapshot` dei residenti | **metrica da definire** — mock-hook tracciato se non esiste una power metric canonica |
| `avgEquipPower` | `equipmentStorage`/`heroItems` | hook reale, formula da definire |

Formula v0 minimale: score pesato → lookup su bande → scale. Formula e
sorgenti sono **un'unità sostituibile**: si riscrive solo «da dove e come
viene fatto il calcolo», il contratto di consumo resta stabile (parola
d'ordine del Director).

## Task

- **T-1 — `questPois` schema + 2 POI authored** (goblin, rovine).
- **T-2 — Fascia derivata** via `simulateQuest` su party di riferimento da
  config + etichetta «ipotesi sul riferimento». Test: la fascia cambia al
  cambiare di scenario o riferimento.
- **T-3 — `rewardTiers` schema.**
- **T-4 — `resolveQuestOffer` + congelamento nel run.** Test: moltiplicatori
  applicati, valori congelati nel record persistito.
- **T-5 — `collectWorldProgressSignals` + `worldScaling` config.**
  `daysPlayed` reale; `avgHeroPower`/`avgEquipPower` con derivazioni v0
  documentate (mock-hook dichiarati dove il segnale canonico manca). Test:
  scale diversi a segnali diversi.
- **T-6 — Safeguard + evidence.**

## Fuori scope

UI di presentazione (S2.4) · reward variabili by-party (hook
`rewardPreview`, futuro) · calibrazione letalità R-105 (la fascia sì, i
numeri no) · sorgenti di scaling oltre i 3 segnali (edifici, eventi —
arrivano nel bag quando esistono).

## Acceptance

1. I due POI esistono in config con tutti i valori risolti da schema, nessun
   hardcode.
2. Fascia pericolo derivata (non hardcoded) e marcata come ipotesi sul
   riferimento; reward espresso in tier da config.
3. `resolveQuestOffer` produce offer risolta con scale dal world-scaling;
   i valori entrano congelati nel run.
4. `worldScaling` è una funzione/config sostituibile come unità; segnali
   mancanti elencati come mock-hook nell'evidence.
5. Safeguard verdi + evidence log.
