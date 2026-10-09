---
title: 'PLAN-019-S2.4 — Planning surface + lancio: detail viva, assegnazione trusted, Invia spedizione, halo, routing'
status: draft
created: 2026-10-09
desiderata: v24 (PLAN-019, stadio S2), v27 (frontiera), D-G (assegnazione giocatore), D-H (planning surface), D-J (halo elapsed), D-K (gating nodi a schedule + caricamento finestra) — Director 2026-10-09
request: R-107
parent: PLAN-019-S2 (figlio 4/5)
depends: PLAN-019-S2.1 (offer header), PLAN-019-S2.2 (party reale), PLAN-019-S2.3 (offer risolta)
related: useQuestPoiSession (session POI esistente — riuso, adapter sottile), ActivityCapsuleDetailSkinAware, stack trusted roster↔slot (roster_drag_trusted.md + spec collegate), QuestRunWindow (componente battezzato D-F), useQuestRun (owner del run), PLAN-025 (contratto congelato), tests/e2e/idleVillage/poiQuestDetailRosterTimeClock.spec.ts (pattern certificato)
---

# PLAN-019-S2.4 — Planning surface + lancio

## Perimetro

Il cuore visibile dello slice: il POI detail diventa la **superficie di
planning viva** (D-H) dove il giocatore compone il party dal roster reale
via lo **stack trusted roster↔slot** (D-G), valuta pericolo/reward dinamici,
e preme **«Invia spedizione»**. Da lì: halo che si riempie (D-J), click POI
attivo → `QuestRunWindow`.

## Assegnazione sullo stack trusted (D-G — frozen, non si reinventa)

- **Sorgente**: `VillageRosterSection` + `PgCard` (`didDragRef`),
  `CustomDragOverlay` (preview circolare), `DragContext`/`DragProvider`.
- **Target**: `ResidentSlotRack` nel detail; gli slot mappano i ruoli quest
  (leader/member/bodyguard); `useResidentSlotController`; assegnazione
  scritta **dopo `onFlightComplete`**, non in `onDragEnd`.
- **Validazione**: eleggibilità quest espressa in `residentDropRules` +
  `statMatching` da config — residente morto/in spedizione/ferito →
  `compatibilityState='invalid'` (grayscale, `aria-disabled`, drag
  soppresso: meccanismo frozen, non guardia nuova).
- **Invarianti d'interazione**: `collisionDetection={pointerWithin}`,
  sensori da `getCurrentDragConfig()`, `flagResidentAfterRejectedInteraction`,
  `RESIDENT_DRAG_MIME`, dnd-kit congelato. Toccare il contratto runtime di
  questi componenti → aggiornare `roster_drag_trusted.md` +
  `COMPONENT_MASTER_INDEX.md` (governance documentazione).
- Nessun party pre-assegnato, nessun preset nel percorso POI, nessun sistema
  di drag parallelo, nessun duplicato di `PgCard`/`ResidentSlotRack`.

## Planning surface (D-H)

- **Offerta da config** (S2.1 `offer` + S2.3 risolta): titolo, obiettivo,
  tags, reward (tier), durata.
- **Slot con spiegazione**: requisito, ruolo («cosa fa»), modificatori del
  residente assegnato, contributo al rischio — dinamico sugli slot occupati.
- **Pericolosità dinamica**: `simulateQuest` ricalcola a ogni cambio di
  assegnazione; bande compatte (pulito/ferite/morti/wipe) etichettate
  «stima su N simulazioni»; party incompleto → stato «incompleto», mai
  numeri parziali o precisione finta.
- **Preview quest totale**: esiti attesi, reward atteso, durata.
  `rewardPreview` = base da config marcato «stima» (reward-by-party è
  futuro — hook pronto).
- **«Invia spedizione»**: disabilitato finché gli slot `required` non sono
  validi; gli `optional` non bloccano.
- **Loadout pre-invio** (proposta D-H-2): stash picker consumabili (R-102)
  nel detail; il `loadout` si congela nel run.
- **Persistenza assegnazione parziale** (proposta D-H-3): chiudere il
  detail non perde gli slot (verificare al reload, altrimenti mock-hook).

## Post-invio

- All'invio: `residentToQuestMember` → `PartyMember[]` → `useQuestRun.start`
  con i **valori risolti congelati** (S2.3) → `QuestRunWindow` presenta
  (D-F); la sessione POI **rilascia** lo stato per quel POI (I-4); residenti
  marcati `inExpedition` con **badge sul roster** (proposta D-H-1) e
  non eleggibili altrove finché il lock tiene.
- **Halo** (D-J): elapsed/`estimatedDuration` da config — stima di
  avanzamento, non legata alla frontiera, **non si ferma ai bivi**; a run
  conclusa → pieno + esito.
- **Gating nodi a schedule** (D-K): ogni nodo ha la sua finestra sulla
  durata totale (`1 tick = 1 s`); un nodo è **risolvibile dal giocatore**
  quando la sua porzione di tempo è maturata — la maturazione non dipende
  dalla risoluzione dei nodi precedenti, quindi i nodi scaduti si risolvono
  **in sequenza senza attesa** (es. ritorno a metà durata → le prime fasi si
  risolvono una dopo l'altra). Implicazione sulla frontiera v27 da verificare
  qui: se la maturazione si ferma su `awaitingPlayer`, D-K la cambia —
  `readyAt` assoluto da schedule.
- **Caricamento della finestra** (D-K): `QuestRunWindow` segue lo stesso
  modello — le tile in fondo mostrano **solo le fasi superate + preview
  della successiva**; durante l'attesa tra una fase e l'altra si mostra la
  **frase di flavour/transit**.
- **Routing click POI**: offerta → detail; spedizione attiva →
  `QuestRunWindow`; post-settlement → aftermath.
- **Segnale bivio** (proposta D-H-4): badge/pulse sul POI quando la
  spedizione aspetta una decisione — riusa il meccanismo PLAN-025 D-6.
- **Contratto congelato con PLAN-025**: firma `useQuestRun` + schema
  persistito concordati prima di questo figlio; se `ENGINE_SCHEMA_VERSION`
  cambia a metà slice, migrazione versionata dichiarata.

## Task

- **T-1 — Eleggibilità quest in `statMatching`/dropRules** (config Zod) +
  `inExpedition` lock + badge roster.
- **T-2 — Detail planning**: offerta, slot info+modificatori, forecast
  dinamico (`simulateQuest` al cambio assegnazione, stato incompleto),
  preview totale, durata, bande, loadout picker.
- **T-3 — «Invia spedizione» + lancio**: gate required, freeze valori,
  `useQuestRun.start`, rilascio sessione, lock residenti.
- **T-4 — Halo + routing click + badge bivio + caricamento finestra (D-K):**
  halo elapsed/duration senza pause; tile fasi = completate + preview
  prossima; frase transit durante l'attesa; risoluzione in batch dei nodi
  scaduti a schedule assoluto.
- **T-5 — E2E Playwright reale su `/game`** (pattern
  `poiQuestDetailRosterTimeClock.spec.ts`, hook `__idleVillageTestHooks`):
  bloom valid/invalid, card non eleggibile `data-compatibility='invalid'`,
  `[data-resident-id]` nello slot, forecast che cambia a party diverso,
  send disabilitato/abilitato, halo parte all'invio, click POI attivo apre
  `QuestRunWindow`.
- **T-6 — Safeguard + evidence.**

## Fuori scope

Mission Planner (S3) · teatro/beats (PLAN-025) · multi-quest parallele ·
reward-by-party (hook solo).

## Acceptance

1. Il giocatore compone il party dal roster reale; nessun pre-assegnato.
2. Il detail mostra offerta + slot informati + pericolo dinamico + preview +
   durata + bande — tutto da config/derivato, niente hardcoded.
3. Send gated sugli slot required; all'invio run reale con valori congelati,
   residenti lockati+badge, halo attivo.
4. Click POI attivo → `QuestRunWindow`; bivio segnalato sul POI.
5. E2E reale verde su `/game`; trusted docs aggiornati se il contratto
   runtime è toccato.
6. Safeguard verdi + evidence log.
