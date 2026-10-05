---
title: Quest S1 Design Matrix — «La cassa delle sementi»
type: design-knowledge
status: vigente (contenuti confermati dal Director 2026-10-02; parametri numerici = mock da calibrare al Gate A)
updated: 2026-10-05
provenance: copia tracciata di `.mw/runs/20261002-s1-quest-design/quest-design.md` (gitignored) — il contenuto è identico; questa copia è il riferimento stabile citato da QUEST_RULES.md
---

> **Provenance:** documento di design del lab S1, contenuti confermati dal
> Director il 2026-10-02. Originale in `.mw/runs/20261002-s1-quest-design/`
> (non tracciato). Le **regole vigenti** derivate sono compilate in
> `QUEST_RULES.md`; questo file conserva la matrice completa e il razionale.

---

# La cassa delle sementi — matrice

Contenuti della bozza AI **confermati dal Director**: goblin, torre, Passo del Corvo,
mercante ambulante, prigioniero in gabbia, simbolo del corvo, lettera (seme narrativo).

## Regole fissate dal Director (2026-10-02)

- **Leader** = **slot fisso della quest** (primo slot obbligatorio); il giocatore sceglie solo
  chi ci mette. Leader morto → reward di quest persa, anche a obiettivo ottenuto.
- **Ferita** = il PG ferito ha **rischio di ferita/morte aumentato nei check successivi**.
  Resta in spedizione, partecipa. HP separati (valori in lab).
- **Board wipe** = **tutti i PG morti**. Nessun trigger speciale: il wipe emerge quando i
  rischi per slot si sommano male.
- **Fonte di danno non-check** = **incidente in viaggio** (es. frana/caduta sul Passo):
  ferita diretta a uno slot, il bodyguard NON può intercettarla → il confine del bodyguard
  è osservabile in gioco.
- **Bodyguard** = slot opzionale; intercetta **tutti** gli esiti di ferita/morte da skill
  check destinati agli slot protetti, **finché è vivo** (ferito continua a intercettare).
  Solo danni da skill check.
- **Verdetti → rischi per slot** (pre-roll): `win` −5pp ferita+morte; `fail`/`almost` neutri;
  `bigwin` = −5pp **cumulati** + downgrade morte→ferita; `epicfail` upgrade ferita→morte.
  Quantità dello spostamento critico = parametro da bilanciare nel lab. In S1 la meccanica si
  chiama «modificatore di verdetto» — **nessuna keyword** (si decide in S2).
- **«Continua ad esplorare»**: se dopo la prova-obiettivo prosegui e poi fuggi/muori,
  **non perdi niente** (bottino e reward tenuti). Il rischio della scelta è solo la vita
  dei PG — la regola «leader morto = reward persa» resta sempre attiva.
- **Wipe** (tutti i PG morti) = **si perde tutto**: bottino, reward, PG.
- **Death save**: implementato. Su un esito di morte, il PG ha un **tiro del 5%** per
  sopravvivere come ferito. Valore di mock, si calibra al Gate.
- **Preset**: 4 — fisico / percettivo-intellettivo / ibrido / **con bodyguard** (party ridotto
  in stat ma con slot dedicato, per sentire il sacrificio).
- **Mercante**: pozione cura / fumogeno infiltrazione / corda arrampicata — confermati.
- **Prigioniero in gabbia**: confermato (liberarlo = check, ricompensa al ritorno).

## Nodi

| # | Nodo | Tipo | Stat | Rischio (per slot) | Fallimento → prosecuzione | Successo → |
|---|---|---|---|---|---|---|
| 0 | Partenza | setup | — | — | — | preset + gold + PG nello slot leader |
| 1 | Viaggio — mercante | scelta | — | — | non comprare = nessun effetto | oggetto + voce sul simbolo |
| 1b | Incidente di viaggio | evento diretto | — | ferita a uno slot | ferita = +rischio nei check seguenti; bodyguard non intercetta | — |
| 2 | Esplorazione | check rischioso (CP prima) | Perc / Perc+Int / For+Cos+Perc | solo approccio C: ferita/HP | info minime; con C possibile allarme → nodo 5 più difficile | info parziali/complete |
| 3 | Conseguenza | info | — | — | — | rivela pattuglia / turni / porta laterale / creatura |
| 4 | Scelta di approccio | scelta | — | — | — | decide la stat del nodo 5 |
| 5 | Evento | check rischioso (CP) | Agi / Car / Car+Int / For+Cos | ferita o morte per slot | allarme attivo → nodi 6-9 più difficili; si prosegue comunque | passaggio pulito |
| 6 | Nuova esplorazione | check | Perc+Int | nessuno se allarme spento; ferita se allarme | cassa non localizzata → riprova con difficoltà↑ o rinuncia | trovi cassa + lore |
| 7 | Scoperta/lore | info | — | — | — | simbolo del corvo, lettera |
| 8 | Prigioniero (opzionale) | scelta → check | For o Agi | allarme | prigioniero non liberato; allarme possibile | nuovo residente al ritorno + gold |
| 9 | **Prova-obiettivo** | check rischioso (CP) | Agi+Cos | ferita/morte | **obiettivo perso** → quest fallita (bottino resta) | cassa ottenuta |
| 9b | Continua ad esplorare? | scelta | — | riapre rischio su nodi extra | fuga dopo = niente perso (leader vivo a parte) | bottino extra |
| 10 | Ritorno | esito | — | — | — | reward se cassa + leader vivo |

## Parametri di mock (valori iniziali ragionevoli — si bilanciano nel lab)

| Parametro | Valore mock |
|---|---|
| Rischi base check rischioso | ferita 15% / morte 3% per slot |
| Approccio C esplorazione (arrampicata) | ferita 20% / morte 3% |
| Nodo 5 con allarme / nodo 9 | ferita 20% / morte 5% |
| Scontro astratto (forza bruta / allarme) | ferita 25% / morte 8% |
| Slot bodyguard (rischio proprio) | ferita 25% / morte 8% |
| Slot leader | ferita 10% / morte 2% (il bodyguard intercetta prima) |
| Ferito → check successivi | +5pp ferita e morte |
| `win` | −5pp ferita e morte |
| `bigwin` | −5pp + tutta la chance di morte spostata su ferita |
| `epicfail` | tutta la chance di ferita spostata su morte |
| Death save | 5% su esito morte → sopravvive ferito |
| Gold iniziale / prezzi mercante | 20 gold; pozione 10 / fumogeno 6 / corda 6 |
| Incidente di viaggio (non-check) | ferita a uno slot casuale, 25% di accadere |

## Cosa resta aperto

Nessuna decisione di contenuto. I valori sopra sono mock di partenza — il Director li ritocca
nel playtest. Death save al 5% è un mock anch'esso: al Gate si valuta se crea il momento
«forse ce la fa» o è solo rumore statistico.

## Cosa resta da osservare al Gate A

- Il bodyguard produce il sacrificio leggibile o è tassa obbligata/rumore?
- Il modificatore di verdetto si *sente* («bigwin = scampata per miracolo»)?
- «Continua ad esplorare» crea tensione anche se si rischiano solo vite?
- L'incidente di viaggio rende chiaro il confine check/non-check?
