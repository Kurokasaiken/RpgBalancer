---
title: 'PLAN-019-S2.4 — Planning surface + lancio: detail viva, assegnazione trusted, Invia spedizione, halo, routing'
status: proposed
created: 2026-10-09
revised: 2026-10-09 (r1 figli: claude+chatgpt 2× MAJOR → assorbito. r2: 2× MAJOR → assorbito; run `…/s2.4/r2/`. D-K riformulata su semantica percorso-effettivo — da ratificare Director)
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
  `statMatching` da config — residente morto/in spedizione →
  `compatibilityState='invalid'` (grayscale, `aria-disabled`, drag
  soppresso: meccanismo frozen, non guardia nuova). **Feriti — DECISO
  (Director 2026-10-09)**: ammessi alla spedizione, **senza warning**;
  il forecast ne tiene conto automaticamente perché l'adapter S2.2 applica
  HP di partenza ridotto + modificatori stat da `InjuryEngine` — la
  penalità vive nei dati, non nell'UI.
- **Lock `inExpedition` — contratto di lettura** (critica r2): residente
  `inExpedition` **iff** appartiene all'unico run persistito non terminale
  — derivato, mai scritto a parte; `run.party[].residentId` deve essere
  nel record persistito (precondizione T-1: verificato o estensione schema
  con migrazione versionata). Tabella stato-run → lock (running /
  waitingForPlayer / end-non-liquidato / settled / retreat / wipe)
  condivisa con S2.5; S2.5 possiede lo stato terminale e le conseguenze,
  questo figlio **non** implementa un secondo meccanismo di lock.
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
- **Pericolosità dinamica**: `estimateForParty` (S2.3) ricalcola a ogni
  cambio di assegnazione; bande compatte (pulito/ferite/morti/wipe)
  etichettate «stima su N simulazioni»; party incompleto → stato
  «incompleto», mai numeri parziali o precisione finta. **Contratto di
  calcolo** (critica r1+r2): seed deterministico derivato da
  (scenario, assegnazione); N fisso da config; esecuzione debounced;
  risultato cached per chiave assegnazione; stato «calcolo…» invece del
  numero precedente; **budget fissato ora**: p95 ≤ 300 ms complessivi con
  nessun singolo task > 50 ms sul main thread — Web Worker o chunking
  come soluzione di default; la misura è criterio di accettazione di T-2
  (non scoperta a fine slice in T-5).
- **Preview quest totale**: esiti attesi, reward atteso, durata.
  `rewardPreview` = base da config marcato «stima» (reward-by-party è
  futuro — hook pronto).
- **«Invia spedizione»**: disabilitato finché gli slot `required` non sono
  validi; gli `optional` non bloccano.
- **Loadout pre-invio** (proposta D-H-2): stash picker consumabili (R-102)
  nel detail; il `loadout` si congela nel run. **Dipende dal contratto
  item di S2.2 (T-5)** — **nessun fallback «sacca vuota»** (critica r2:
  partire senza consumabili altera il bilancio validato in S1 e rende la
  stima diversa dal gioco pianificato): se il contratto item non è pronto,
  le consumabili sono mostrate **«non disponibili in questa versione»** e
  il forecast marcato «senza consumabili»; deroga registrata in
  DECISION_LOG come quella int/cha.
- **Persistenza assegnazione parziale — esclusione deliberata** (critica
  r2): l'assegnazione parziale vive nella session POI e **si perde al
  reload — deciso**; non è un task futuro di questo slice, si riapre solo
  se un requisito successivo la rende necessaria.

## Post-invio

- **Invio atomico — transizione autorevole unica** (critica r1+r2):
  `useQuestRun.start` è l'unica transizione, con **precondizioni
  ri-verificate al momento della scrittura** (nessun run attivo, nessun
  residente già impegnato, snapshot completo dei valori congelati S2.3) —
  idempotente rispetto al doppio invio **e atomica rispetto al singolo
  writer** (test di doppio invio concorrente, non solo sequenziale);
  lock `inExpedition` **derivato** dal run persistito, sessione POI e
  badge roster **letture** dello stato persistito — mai scritture
  separate. Test reload a metà lancio.
- **Halo** (D-J): elapsed/`estimatedDuration` da config — stima di
  avanzamento, non legata alla frontiera, **non si ferma ai bivi**. **Stati
  dichiarati** (critica r1): `pieno-in-attesa` ≠ `concluso` (nodo `end`
  risolto) — l'esito compare solo al secondo. **Assenza lunga** (critica
  r2): il tempo non produce mai esiti — dopo qualunque assenza si presenta
  il primo bivio non risolto (v27 vieta default silenziosi); badge bivio
  binario (decisione attesa sì/no), non conteggio; test catch-up con
  assenza lunga in T-5.
- **Gating nodi a schedule — D-K ratificata** (Director 2026-10-09, forma
  riformulata r2): `readyAt(nodo) = arrivo sul nodo lungo il percorso
  effettivo + nodeDuration` (durata per nodo da config). Su lineare
  coincide con l'esempio Director (torno a metà → fasi scadute in
  sequenza); sui rami è coerente. **Durata viva** (Director, stessa
  risposta): se il percorso raggiunge un **nodo extra**, la sua
  `nodeDuration` **si aggiunge alla durata totale in quel momento** — il
  denominatore dell'halo si aggiorna a run in corso (non solo nella
  preview) e **le tile fasi in basso si adattano** (appare la fase nuova).
  Il layer schedule possiede questa regola: `readyAt` resta deterministico
  perché dipende dal percorso committato, non da previsioni. **T-0
  verifica che il layer viva sopra `matureReady`** senza toccare il
  motore.
- **Caricamento della finestra** (D-K): `QuestRunWindow` tile = fasi
  superate + preview della successiva; durante l'attesa la frase di
  flavour/transit. **Coordinato con PLAN-025** (la presentazione è sua):
  qui si definisce solo il contratto dati (fasi superate + prossima +
  transit disponibili), il layout resta di PLAN-025 — niente seconda
  fonte di verità.
- **Routing click POI**: offerta → detail; spedizione attiva →
  `QuestRunWindow`; post-settlement → aftermath.
- **Segnale bivio** (proposta D-H-4): badge/pulse sul POI quando la
  spedizione aspetta una decisione — riusa il meccanismo PLAN-025 D-6.
- **Contratto congelato con PLAN-025**: firma `useQuestRun` + schema
  persistito concordati prima di questo figlio; se `ENGINE_SCHEMA_VERSION`
  cambia a metà slice, migrazione versionata dichiarata.

## Task

- **T-0 — Spike bloccante D-K ↔ frontiera v27** (critica r2 — dipendenze e
  output espliciti; **gate di T-3 e T-4**, T-1/T-2 procedono in parallelo).
  Prova di compatibilità **eseguibile** su un grafo rappresentativo (almeno
  un bivio + un nodo senza decisione + un ramo alternativo — goblin la
  copre): verificare se il gating è esprimibile come **layer sopra
  `matureReady`** con la semantica riformulata (`readyAt = arrivo +
  nodeDuration` lungo il percorso effettivo). **Output obbligatori**: (a)
  firma del layer (proprietario del clock, stato persistito delle finestre,
  regole di maturazione per nodi su rami alternativi/saltati/scadenze
  simultanee, comportamento al reload e al catch-up); (b) test di parità
  con `matureReady` su goblin e rovine; **oppure** (c) memo di deroga I-3
  per il Director con diff minimo del motore — se serve, si ferma solo
  T-4/parti di T-3, non il resto del figlio. Esito in DECISION_LOG.
- **T-1 — Eleggibilità quest in `statMatching`/dropRules** (config Zod).
  Precondizione verificata: `run.party[].residentId` presente e persistito
  (altrimenti estensione schema con migrazione versionata) → lock derivato
  + badge roster come lettura dello stesso dato.
- **T-2 — Detail planning**: offerta, slot info+modificatori, forecast
  dinamico (`simulateQuest` al cambio assegnazione, stato incompleto,
  worker/chunking, **p95 ≤ 300 ms come accettazione**), preview totale,
  durata, bande, loadout picker.
- **T-3 — «Invia spedizione» + lancio** (**dipende da T-0** per cosa si
  congela nel run — durate nodo/readyAt): gate required, freeze valori,
  transizione autorevole con precondizioni ri-verificate alla scrittura.
- **T-4 — Halo + routing click + caricamento finestra (D-K):** halo
  elapsed/duration senza pause; contratto dati tile = completate + preview
  prossima + transit. **Le parti legate allo schedule dei nodi dipendono
  dall'esito di T-0** — nessuna semantica fissata prima.
- **T-5 — E2E Playwright reale su `/game`** (pattern
  `poiQuestDetailRosterTimeClock.spec.ts`, hook `__idleVillageTestHooks`):
  percorso felice — bloom valid/invalid, card non eleggibile
  `data-compatibility='invalid'`, `[data-resident-id]` nello slot, forecast
  che cambia a party diverso, send disabilitato/abilitato, halo parte
  all'invio, click POI attivo apre `QuestRunWindow` — **più i casi che
  rompono** (critica r1+r2): reload con run in corso (catch-up, incl.
  assenza lunga → primo bivio non risolto), doppio invio **concorrente**,
  residente lockato reso invalid nel roster, transizione
  incompleto↔completo senza numeri parziali, e **parità forecast↔run**:
  asserzione che i valori congelati nell'istanza avviata (scenario,
  modificatori, party/stat snapshot, loadout, durata) siano identici a
  quelli mostrati all'invio — anche se roster o segnali mondo cambiano
  dopo il lancio.
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
