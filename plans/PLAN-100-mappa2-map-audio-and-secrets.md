---
title: PLAN-100 — `mappa2` Suono di zona e segreti cliccabili
status: draft — da battezzare Director (nessuna implementazione eseguita)
owner: agente locale (planner)
created: 2026-10-29
source_request: decisioni Director 2026-10-29 sulla lista idee di ambiente (vedi PLAN-089 «Decisioni Director 2026-10-29»)
parent: PLAN-089
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md (row)
  - RICHIESTE.md (vettore + esito, al battesimo)
  - test-results/plan-100-mappa2-map-audio-secrets/ (evidence)
---

# PLAN-100 — Suono di zona e segreti cliccabili su `/mappa2-lab`

## Perché

Il Director ha scelto due cose che costano poco e danno molto:

1. **Il suono della cascata quando ci si zooma sopra.** Altri suoni di zona sono
   interessanti ma da valutare dopo.
2. **Segreti cliccabili, solo in zone super specifiche:** un clic fa un suono,
   tre clic fanno partire un'animazione nascosta. Riferimento: il tabellone di
   Hearthstone, dove certi elementi rispondono al clic e alcuni nascondono
   un'animazione.

Esplicitamente **no** a piccoli oggetti cliccabili sparsi che reagiscono: sono
fastidiosi. I segreti devono essere pochi e messi in punti precisi.

## Parte A — Suono di zona (v1: solo cascata)

- Un loop del rombo della cascata si sente **solo da zoomati** e solo quando la
  cascata è vicina al centro dello schermo.
- Volume = f(zoom) × f(distanza del punto d'impatto dal centro della vista):
  silenzio sotto una soglia di zoom (da tarare, ipotesi 1.2), crescita morbida,
  massimo vicino allo zoom massimo; dissolvenze di almeno 300 ms, mai scatti.
- Passa dal bus audio del gioco (`src/ui/idleVillage/state/audioBus.ts`:
  `window.AudioContext` con il master del giocatore), quindi rispetta volume
  master/effetti e il "movimento ridotto" non c'entra; parte solo dopo un gesto
  dell'utente (regola del browser).
- Pausa quando la scheda è nascosta.
- Estensione futura (non in v1): stesso meccanismo per altre zone (mare sulla
  costa, foresta, vulcano) se il Director lo chiede.

## Parte B — Segreti cliccabili

**Meccanica**
- Hotspot **pochi** (proposta: massimo 4–6 su tutta la mappa), ognuno con una
  forma precisa (poligono), non un'area larga.
- 1° clic → un suono breve (nessuna animazione).
- 3° clic entro una finestra breve (proposta 2,5 s) → animazione nascosta
  one-shot, poi tempo di ricarica (proposta 20 s) prima che si possa rifare.
- Nessun indizio visivo permanente; al massimo il cursore cambia sopra l'hotspot
  (da decidere, O-3).
- Il clic conta solo se non è un trascinamento della mappa e non cade su un POI,
  una struttura o un'altra interazione di gioco (le interazioni di gioco vincono
  sempre).
- Nessun effetto sul gameplay in v1 (O-4: eventuale registro "segreti trovati").

**Candidati (da scegliere col Director, O-1)** — esempi coerenti col dipinto:
- la cascata (es. un salmone o un pesce dorato che risale il getto);
- il cratere del vulcano (sbuffo e lapilli);
- lo scoglio della sirena (la sirena si tuffa: lega con PLAN-094);
- l'arco naturale dei canyon rossi (un'eco e un rapace che passa sotto);
- il lago alpino (un pesce salta).

**Asset per ogni segreto:** 1 suono breve, 1 animazione (pose o rig) + eventuale
suono dell'animazione. Gli asset li genera il Director (ruling 2026-10-27).

## Architettura (sintesi)

- Contratto leaf `public/assets/world/mappa2/base/secrets.json` (+ schema Zod
  strict dedicato, come `secondary-water`): per hotspot `id`, poligono in px
  mondo, suono del clic, animazione nascosta, tempi.
- Runtime in `PixiWorldMap.tsx`: hit-test del poligono sul punto cliccato in
  coordinate mondo, conteggio clic per hotspot, pool sprite per le animazioni,
  nessuna allocazione nel ticker; identico su WebGL e Canvas.
- Audio: un piccolo modulo che crea i nodi una volta sola sul bus esistente.
- Lab: toggle "map audio", slider soglia di zoom e volume, pulsante per provare
  ogni segreto, overlay di debug dei poligoni.

## Task

- [ ] **T-001** Scelta hotspot e suoni col Director (O-1, O-2).
- [ ] **T-002** Contratto `secrets.json` + schema + unit test (incl. negativi:
  poligono fuori mappa, hotspot sovrapposti, troppi hotspot).
- [ ] **T-003** Audio di zona cascata: curva zoom/distanza, bus, pausa scheda,
  controlli lab.
- [ ] **T-004** Segreti: hit-test, conteggio 1/3 clic, ricarica, priorità alle
  interazioni di gioco, animazioni one-shot.
- [ ] **T-005** E2E con input reali: il trascinamento non conta come clic, il 3°
  clic avvia l'animazione, la ricarica funziona, i POI vincono sugli hotspot;
  audio verificato con un nodo di analisi (livello > 0 solo da zoomati).
- [ ] **T-006** Witness Director (T-04): ascolto e visione dal vivo.

## Contratto di chiusura

- **OB-1** Unit schema `secrets.json`.
- **OB-2** E2E `tests/e2e/idleVillage/mappa2Secrets.spec.ts` (WebGL + Canvas).
- **OB-3** Safeguards scoped (lint, test, `build:check`; `contracts:check` dipende
  dal ruling Mode B-amend pendente sul renderer).
- **OB-4** Evidence: registrazione con audio della cascata a zoom crescente e dei
  segreti.
- **OB-5** `human-eye` + ascolto Director.

## Decisioni aperte

- **O-1** Quali hotspot (e quanti).
- **O-2** Suoni: generati, libreria con licenza o registrati? Formato e durata.
- **O-3** Indizio: nessuno, oppure solo il cursore che cambia?
- **O-4** I segreti trovati si registrano (collezione/achievement Steam) o restano
  puro easter egg?
- **O-5** Soglia di zoom e volume massimo della cascata.

## Rischi

- Conflitto con i clic di gioco (POI, strutture, regioni): mitigato dalla priorità
  alle interazioni di gioco e da poligoni piccoli.
- Audio fastidioso a lungo andare: volume basso di default, dissolvenze lente,
  slider nel menu impostazioni (bus già esistente).
- Worktree condiviso: `PixiWorldMap.tsx` è toccato da più piani in parallelo (T-13).

> **Asset:** l'elenco unico (pose, dimensioni, stato) è in [`ASSETS-mappa2.md`](ASSETS-mappa2.md).
