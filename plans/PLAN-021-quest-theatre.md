---
title: 'PLAN-021 — QuestTheatre: la quest nel gioco reale come storia a nodi che aspetta ai bivi'
status: active
impl_status: "Phase 1 parziale — T-001..T-004 eseguiti (2026-10-06), stage renderer core incluso. Route dev live: /game-frame-theatre. Tesi 'aspetta ai bivi nel gioco reale' NON verificata: adapter finto. Integration Gate (T-008) aperta."
created: 2026-10-06
revised: 2026-10-06 (v2..v8 — cold read multi-AI web ×7: chatgpt + claude; gemini-web failed ogni round. v8: read-model = informazioni richieste dalla UI, intent semantici, probe A/B su T-002, test Pillar 1 misurabile, expanded opt-in, divergenza nextKnown dichiarata; disaccordo residuo ChatGPT registrato)
desiderata: v27 (FROZEN 2026-10-06)
request: R-088
parent: PLAN-019 (stadio S4 — integrazione; anticipato come piano di presentazione)
related: useQuestPoiSession (sessione v3 su /game), QuestS1LabPage (reference sperimentale)
---

# PLAN-021 — QuestTheatre (v8)

## Perimetro dichiarato

Presentation-first, in forma onesta: produce (a) un **requirements brief per S2** — cosa
il teatro deve poter *vedere* e quali intent deve poter *emettere* — e (b) il componente
`QuestTheatre` verificato su fixture e su route dev, dietro un **adapter contract
provvisorio e non normativo**. Il contratto normativo del runtime nasce in S2; se S2 lo
modifica, il refactor del teatro è costo dichiarato e accettato (budget v2).

Non implementa semantica temporale, scheduling, persistenza, economia, RNG né formato dei
nodi. Il read-model qui sotto descrive **informazioni richieste dalla UI**, non semantica
del runtime: S2 decide come e quando quelle informazioni diventano vere.

**Disaccordo residuo risolto (Director 2026-10-06):** il critico ChatGPT riteneva che
T-004..T-007 dovessero attendere S2; il Director ha scelto di procedere — il teatro si
costruisce ora sul contratto provvisorio non-normativo, con preview visibile sulla route
dev sopra la mappa viva (obiettivo esplicito: «una preview da vedere sul gameplay vero»).
Budget di rifacimento su read-model v2 dichiarato e accettato.

## Ancoraggio (desiderata v27 FROZEN)

1. La quest è una **storia a nodi che aspetta ai bivi**: scelte e skill check **non** si
   auto-risolveno mai; solo il tempo scorre; chi guarda live vede le fasi arrivare man
   mano; chi apre in ritardo le gioca senza attese.
2. `QuestTheatre` = componente nuovo — **stage renderer** (narrative / choice / check /
   consequence / reward) che **ospita** i contenuti esistenti dentro `FloatingPanel`
   (v4: spostabile, riducibile a icona, non bloccante), con modalità **expanded**.
3. Scartati: stato narrativo (`IN DANGER`/`RETURNING`), livello di pericolo implicito.
4. **Candidati da validare, non requisiti**: timeline narrativa, futuro ignoto nascosto,
   party strip, decision panel, expedition kit drawer, chronicle/log, retreat con anteprima
   conseguenze, art cinematografica, header con obiettivo.
   **Divergenza esplicita dichiarata**: la timeline v1 mostra **solo nodi passati**; il
   «prossimo nodo noto» di v27 è rinviato perché richiede un successore unico calcolato
   dal runtime, non garantito nei branching — `nextKnown?: NodeRef` entra in v1 come campo
   opzionale sempre assente nelle fixture (costo zero ora, nessuna rottura dopo).
5. Non autorizzati: auto-risoluzione di scelte/check, pannelli modali, duplicati di
   `QuestChronicle`/`MilestoneCheckModal`/`QuestRewardPanel`, applicazione al lab S1 o alla
   superficie deprecata, implementazione prima del piano.

## Invariante di ownership (verificabile)

`QuestTheatre` è strictly **read / present / command surface**: non possiede stato di
gameplay, non calcola esiti, non applica consequence, non consuma risorse, non genera RNG,
non avanza autonomamente, non esegue catch-up, non emette comandi duplicati per
apertura/chiusura/re-render. Dato lo stesso snapshot, il rendering live/reopen è identico.
Ogni comando è delegato al runtime owner, unica autorità sugli effetti.

## Requirements brief per S2 (read-model proposto, non normativo)

### Informazioni richieste dalla UI (v1)

- **Frontier informativo**: sequenza dei nodi già risolti + il nodo corrente; nessun nodo
  oltre il corrente è osservabile. *(Come il runtime decide cosa è risolto è materia S2 —
  il teatro riceve uno snapshot già valutato.)*
- **Stato nodo osservabile**: `pending | resolved | awaitingPlayer | unsupported`
  (kind sconosciuto → `unsupported` esplicito, nessun avanzamento né auto-risoluzione).
- **Stato run**: `running | success | fled | wiped`.
- Per nodo: `nodeId`, stage kind, testo/opzioni/preview/`retreatPreview` **come forniti
  dal runtime** (il teatro non deduce né ricostruisce mai). Per la run: party view
  (hp/ferito/morto/ruolo, read-only), obiettivo.
- Campi opzionali runtime-valorizzati (se assenti la UI li omette):
  `nextKnown?: NodeRef`; `inAttesaDal?: timestamp` (party-impegno visibile qualunque sia la
  policy); `attentionPolicy?: 'free' | 'partyLocked' | 'expires'` (mostrata, mai decisa);
  `blockedReason?: string` (richiesto **solo se** il runtime può invalidare una run
  sospesa — vedi D-open-6).
- `contractVersion`.

**Extension points (rientrano solo se una UI approvata ne dimostra la necessità)**:
delivery push per il live-reveal, `resolvedAt` per la timeline narrativa.

### Command surface (intent UI, non comandi runtime)

Solo intent semantici: `submitDecision` (choice / checkpoint-continue / check-answer),
`retreat`, `collectReward` — ognuno con `{commandId, nodeId, expectedFrontierVersion,
payload minimo}`. La mappatura intent→comandi runtime (nomi, granularità, transazioni) è
adapter boundary da chiudere in S2 — il piano non la ratifica. Esiti: `accepted`,
`pending` (risolto solo da nuova emissione di snapshot, mai da timeout locale), `rejected`
— distinzione utile alla UI solo in `stale` (rileggi lo snapshot) vs altro (mostra il
messaggio del runtime).

### Stage → kind → forma UI

| stage | kind | forma UI |
|---|---|---|
| timed (viaggio, narrative, consequence) | timed | testo/esito, nessun input |
| choice / check / checkpoint | decision | decision panel (retreat come opzione di prima classe) |
| reward | decision | collect esplicito (QUEST_RULES; precondizione leader vivo visibile) |

(`awaitsAck` rinviato a quando un autore lo richiede.)

### Requisito di rappresentabilità awaitingPlayer-vs-mondo (D-open-6)

PLAN-021 non sceglie la policy. Requisito sul read-model: il runtime deve poter
rappresentare l'esito di un frontier `awaitingPlayer` mentre il mondo continua —
scelta ancora **valida** / **invalidata** / **sostituita** / **da rivalutare** — come
stato esterno esplicito (`blockedReason` + stato nodo). Il teatro le renderizza tutte;
S2 decide quale esiste davvero.

## Semantica UI di frontiera

- **Chiudere ≠ ritirarsi**: chiudere lascia la run in `awaitingPlayer`, riapribile dal POI.
- **Retreat**: opzione di prima classe nello stage decision/checkpoint (QUEST_RULES:
  continua/ritirati prima di ogni check rischioso). Mostra solo il `retreatPreview`
  fornito dal runtime — nessuna conseguenza ricostruita dal teatro.
- **Segnale attenzione**: una forma sola in v1 — halo sul POI, binario («c'è una
  decisione», senza intensità né escalation). **Requisito aperto nel brief S2**: segnale
  di *attesa prolungata* (non di pericolo) — il tick sul day-clock è il candidato naturale
  perché porta già la durata; estensione condizionata al test T-009, non anticipata.
- **TheatreTrack**: solo nodi già risolti + `nextKnown` se il runtime lo fornisce; il
  teatro non deduce mai il futuro dal grafo.
- **Kit check**: `CheckKitProps` (in: probabilità, pool consumabili; out: verdict) in
  T-001; feasibility dei kit (`MilestoneCheckModal` non modale? `DestinyAstrolabeV62`
  senza dipendenze lab?) in T-006. Default: percorso v3 canonico.

## Domande aperte / gate

- **D-open-1 — Forma dell'expanded**: neutra fino alla misura di T-003 (massimizzato vs
  dock — dock solo se compatibile con v4).
- **D-open-3 — Destino del modello v3 su /game**: (a) convergenza, (b) ritiro v3,
  (c) coesistenza per tipo di quest. Owner per quest. Gate dell'Integration Gate (T-008).
- **D-open-4 — Multi-quest**: unresolved per v27; il read-model non incorpora l'assunzione
  di quest singola.
- **D-open-5 — Costo dell'attesa**: requisito del runtime, gate di T-008. Richiesta al
  Director gestita come memo separato (non deliverable di T-001).
- **D-open-6 — Mondo vs quest sospesa**: nessuna policy proposta; requisito di
  rappresentabilità sopra; semantica da S2.

## Task

- **T-001 — Spec AI-friendly + requirements brief.** `src/docs/docs/idle_village/quest_theatre_spec.md`:
  read-model v1 (campi richiesti + opzionali + extension points), intent surface,
  stage→kind→forma, `CheckKitProps`, feasibility dock-vs-v4, criterio expanded
  misurabile, invariante UI «nessun comando duplicato», Given/When/Then per stage
  (ingresso reward con precondizione leader vivo).
- **T-002 — Fixture suite + probe (nessuna libreria runtime).** Tipi read-model + scenari
  fixture minimali indipendenti da `questRun` (branching, timed/decision, **fixture
  avversaria**: mondo che cambia durante l'attesa — le quattro forme D-open-6 come stati
  esterni) + harness disposable. **Probe binario** sulle quest authored (`cassa`,
  `rovine`), campi divisi in due liste: **A strutturali** (nodeId, kind, testo/opzioni,
  party view, stato run) — popolabili con funzione pura sullo stato serializzato, finding
  bloccante per T-005; **B temporali** (`awaitingPlayer`, `inAttesaDal`,
  `expectedFrontierVersion`) — non osservabili nel lab per costruzione, forniti
  dall'adapter finto di T-004, registrati come requisito per S2. Nessun finding obbliga
  S2 a preservare concetti di `questRun`.
- **T-003 — `FloatingPanel` expanded mode (opt-in, contratto geometrico).** Stato
  `expanded` **opt-in per istanza** via config Zod (`allowExpanded`, default `false`);
  `%` max viewport coperta e area minima mappa visibile/interattiva per breakpoint; HUD e
  roster mai coperti; v4 intatta. **Non-regressione obbligatoria sui consumatori
  esistenti di `FloatingPanel`** (snapshot/RTL invariati). Playwright a viewport ridotto
  incluso caso peggiore (pool massimo consumabili). Se il criterio non regge → fallback
  v4-compatibile di D-open-1.
- **T-004 — `QuestTheatre` scheletro su route dev dedicata.** Header (titolo/obiettivo +
  `inAttesaDal`/`attentionPolicy` quando forniti), `PartyStrip`, footer, chiudi≠ritirati;
  segnale = halo POI binario (riuso). i18n `idleVillage:questTheatre.*`. **Mount su route
  di sviluppo dedicata che riusa il Game Frame Pixi (stesso `overlaySlot`), mai `/game`
  canonica** — adapter finto che fornisce anche i campi temporali, nessun
  `useQuestPoiSession`, nessuna persistenza.
- **T-005 — Stage: timed + choice + unsupported.** Richiede probe senza finding bloccanti
  (lista A). Budget dichiarato per rifacimento su read-model v2 di S2.
- **T-006 — Stage: check + reward + retreat in-checkpoint.** Kit check dietro
  `CheckKitProps` (feasibility qui) + `QuestRewardPanel` — hosting, non duplicazione.
- **T-007 — `TheatreTrack` + `ChronicleDrawer`.** Qui si dimostra la necessità degli
  extension points (`resolvedAt`, delivery push) → eventuale promozione. Rinviati:
  `ExpeditionKit` drawer, party-detail, art cinematografica — piano separato.
- **T-008 — Integration Gate (non implementazione).** Montaggio su `/game` solo quando:
  (a) decisione Director su D-open-3; (b) S2 espone contratto runtime/persistenza
  canonico; (c) policy D-open-5 dichiarata; (d) semantica `awaitingPlayer`-vs-mondo
  definita da S2 (D-open-6). Fino ad allora il piano resta alla route dev di T-004.
- **T-009 — Safeguard + evidence.** `lint`, `test -- <scope>`, `build:check`,
  `kanban:lint`; Playwright `questTheatre.spec.ts` (stesso snapshot → stesso render
  live/reopen, nessun comando duplicato su reopen/re-render, chiudi≠ritirati, expanded
  coverage + non-regressione consumatori, caso peggiore consumabili, hosting
  check/reward). **Test Pillar 1 misurabile**: driver scriptato sulla route dev produce
  eventi di mondo (altro POI che richiede attenzione) mentre il teatro è aperto/ridotto/
  chiuso — il segnale della quest deve restare distinguibile in tutti e tre gli stati
  (evidenza concreta per D-open-6). Evidence `test-results/`.

## Stato implementazione (2026-10-06, Phase 1)

Eseguito: T-001 (`quest_theatre_spec.md`), T-002 (`theatreContract.ts`, `fixtures.ts`,
`fakeTheatreRuntime.ts`, `probeQuestRun.ts` + 7 test in
`tests/unit/idleVillage/questTheatre/`), T-003 (`FloatingPanel.expandable` opt-in +
`expandedInsetPx`, config Zod `questTheatreConfig`), T-004 (`QuestTheatre.tsx` +
route `/game-frame-theatre` con POI halo binario e Director driver). Stage renderer
core (T-005/T-006/T-007 in forma preview): timed/consequence, choice, check,
checkpoint, reward, unsupported esplicito; retreat di prima classe con preview
runtime-provided; `TheatreTrack` (solo risolti + corrente) e `ChronicleDrawer`.

**Divergenza registrata su T-004:** il piano chiedeva «nessun `useQuestPoiSession`»
sulla route dev; la route monta invece la sessione reale per avere il mondo vivo
(clock, roster, DnD, POI quest reale opzionale) attorno al teatro — richiesta
esplicita del Director («preview sul gameplay vero»). Il teatro NON consuma la
sessione: è interamente guidato dall'adapter finto su una fixture, quindi non
esiste un secondo owner sulla stessa quest.

**Probe findings (T-002):** lista A popolabile via funzione pura su `questRun` su
entrambe le quest authored — con un'eccezione registrata per S2: il trail dei nodi
visitati NON è serializzato (`LogEntry` porta solo prosa); il read-model canonico
deve portarlo o il runtime deve ricostruirlo. Lista B (`awaitingPlayer`,
`inAttesaDal`, `expectedFrontierVersion`) assente per costruzione nel lab — fornita
dall'adapter finto, requisito per S2.

**Non ancora coperto dal piano:** Playwright `questTheatre.spec.ts` (acceptance
T-009), `CheckKitProps` feasibility + hosting `MilestoneCheckModal`/`QuestRewardPanel`
(T-006 usa stage propri, non i kit), `COMPONENT_MASTER_INDEX`. Evidence:
`test-results/r088-quest-theatre-2026-10-06.log`.

## Stato implementazione (2026-10-10, convergenza PLAN-025)

La direzione è cambiata per decisione del Director (PLAN-025 D-F): **il teatro
converge dentro `QuestRunWindow`**, il componente battezzato su `/game` — non il
contrario. PLAN-021 resta il piano che ha definito il **contratto read-model**
(`theatreContract.ts` → v2 in `questRunAdapter.ts`) e lo stage renderer
`QuestTheatre`, entrambi ora provati sul motore reale.

Già assorbito da PLAN-025 (T-004…T-011):

- **Adapter reale su route dev** — `/game-frame-theatre` monta
  `createQuestRunAdapter` su `useQuestRun` (fixture fake rimossi dalla rotta;
  tick driver + toggle orologio in Regia). La tesi «aspetta ai bivi nel gioco
  reale» è ora verificabile dal vivo — pending osservato in run E2E
  (`quest-theatre-playtest.ts`, `waitMs`/`beatMs`/`pendingMs` separati).
- **`QuestTheatre` impara `combat`/`pending`** — stage decision con telemetria
  turno/nemici e barra di maturazione.
- **Contratto v2** — `node.pending{startedAt,readyAt}`, `party.hp`, intent
  `useItem`/`useConsumable`, reject `duplicate`; `visitedNodes` dalla traversata
  reale (finding T-002 risolto: trail serializzato nel dominio).
- **Integration Gate (T-008 qui)**: di fatto anticipata per la quest goblin
  (D-1) — il montaggio canonico è `QuestRunWindow` su `/game`; `QuestTheatre`
  resta la vista dev/Regia. La rimozione della superficie parallela → PLAN-025
  T-012, gated sull'acceptance Director (budget no-skip + gate umano A aperti).

Resta fuori/scoperto: Playwright `questTheatre.spec.ts`, hosting dei kit check/
reward nel teatro, promozione del contratto a `trusted`.

## NOT In Scope

- Semantica temporale/scheduling, formato canonico del runtime, persistenza reale,
  regole di economia/simulazione, mount su `/game` → S2 / Integration Gate.
- Deadline su nodi decision. Convergenza/ritiro v3 (D-open-3). Motore del lab; S2/S3.
- Policy multi-quest (unresolved v27); expedition kit drawer; party detail; art
  cinematografica (piano separato).

## Documentation Impact: REQUIRED

- `src/docs/docs/idle_village/quest_theatre_spec.md` (nuovo, T-001).
- `QUEST_RULES.md` — solo dopo ratifiche: «scelte e skill check mai auto-risolti; solo il
  tempo scorre; il run attende ai bivi».
- `COMPONENT_MASTER_INDEX.md` — `QuestTheatre`, `FloatingPanel` (expanded, opt-in).
- `context/INDEX.md`, `plans/INDEX.md` — registrazione **come Phase 1 parziale**: la tesi
  «aspetta ai bivi regge nel gioco reale» resta non verificata finché T-008 non è
  eseguito.
- `test-results/quest-theatre-<data>.md` — evidence.

## Acceptance

- Read-model v1 = informazioni richieste dalla UI, marcato non-normativo; popolabile
  dalle fixture senza campi sintetizzati dal teatro; probe A/B eseguito (lista A senza
  finding bloccanti → sblocca T-005); `contractVersion` presente.
- Intent surface completa (checkpoint incluso), `expectedFrontierVersion` e
  `rejected(stale)` testati; `pending` mai risolto da timeout locale.
- Invariante ownership rispettato; stesso snapshot → stesso render live/reopen; fixture
  avversaria (quattro forme D-open-6) renderizzata.
- Nessuna regola di gameplay/economia/temporale introdotta: tutte rinviate a Director/S2.
- `FloatingPanel` expanded opt-in per istanza, criterio misurabile rispettato,
  non-regressione sui consumatori esistenti dimostrata.
- Chiudere il teatro non ritira la quest; test Pillar 1 (segnale distinguibile sotto
  eventi di mondo, nei tre stati del teatro) superato.
- Teatro osservato su route dev dedicata sopra mappa viva; `/game` canonica mai toccata
  prima dell'Integration Gate; piano registrato come Phase 1 parziale.
