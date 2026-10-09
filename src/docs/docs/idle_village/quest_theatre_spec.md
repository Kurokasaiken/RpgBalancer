# QuestTheatre — Spec (requirements brief per S2)

**Fonte:** PLAN-021 v8 (`plans/PLAN-021-quest-theatre.md`), desiderata v27 FROZEN, R-088.
**Status:** `draft` — read-model v1 è una **proposta non normativa**; il contratto
normativo del runtime nasce in S2 (`contractVersion` lo dichiara).
**Convergenza (Director 2026-10-09, PLAN-019-S2 D-F):** il componente battezzato
della quest in corso su `/game` è **`QuestRunWindow`**
(`src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx`) — questa spec è il
contributo teatro che converge *dentro* `QuestRunWindow` (R-106 iter. 3 «un solo
componente»), non un componente separato.

## Cos'è

`QuestTheatre` è il componente che presenta una quest node-driven sulla superficie
canonica: una **storia a nodi che aspetta ai bivi** — scelte e skill check non si
auto-risolveno mai, solo il tempo scorre (v27). Vive dentro `FloatingPanel`
(spostabile, riducibile, non bloccante — v4), con modalità **expanded** opt-in.

**Strictly read / present / command surface:** nessuno stato di gameplay, nessun
calcolo di esiti, nessun RNG, nessun catch-up, nessun comando duplicato su
re-render. Ogni comando è un intent delegato al runtime owner.

## Read-model v1 (informazioni richieste dalla UI)

```
TheatreRunView
  contractVersion: number
  runId: string
  title: string
  objective?: string
  runState: 'running' | 'success' | 'fled' | 'wiped'
  frontierVersion: number            // bump a ogni emissione di snapshot
  nodes: TheatreNodeView[]           // SOLO risolti + corrente (frontier)
  party: TheatrePartyMemberView[]    // read-only
  log: TheatreLogEntry[]

TheatreNodeView
  nodeId: string
  kind: string                       // 'timed'|'choice'|'check'|'checkpoint'|'consequence'|'reward'|…
  state: 'pending' | 'resolved' | 'awaitingPlayer' | 'unsupported'
  title?, text?
  options?: TheatreChoiceOption[]    // {id,label,preview?,disabled?} runtime-provided
  retreatPreview?: string            // runtime-provided, mai ricostruito dal teatro
  resolvedSummary?: string           // una riga per la track
  checkPreview?: { probabilityPct?: number; note?: string }

Opzionali (runtime-valorizzati; se assenti la UI li omette):
  nextKnown?: string
  inAttesaDal?: number
  attentionPolicy?: 'free' | 'partyLocked' | 'expires'
  blockedReason?: string
```

## Intent surface (UI → runtime)

| intent | payload | quando |
|---|---|---|
| `submitDecision` | `{commandId, nodeId, expectedFrontierVersion, optionId}` | choice, checkpoint-continue, check-answer |
| `retreat` | `{commandId, nodeId, expectedFrontierVersion}` | opzione di prima classe nel decision stage |
| `collectReward` | `{commandId, nodeId, expectedFrontierVersion}` | stage reward |

Esiti: `accepted` | `pending` (risolto solo da nuova emissione snapshot, mai da
timeout locale) | `rejected` — distinzione UI: `stale` → rileggi lo snapshot,
altro → mostra il messaggio del runtime.

## Stage → kind → forma UI

| stage | kind | forma |
|---|---|---|
| viaggio / narrative / consequence | timed | testo/esito, nessun input |
| choice / check / checkpoint | decision | decision panel + retreat di prima classe |
| reward | decision | collect esplicito (precondizione leader vivo visibile) |
| sconosciuto | unsupported | stato esplicito, nessun avanzamento |

## Semantica di frontiera

- **Chiudere ≠ ritirarsi:** chiudere il pannello lascia la run in `awaitingPlayer`,
  riapribile dal POI.
- **Segnale attenzione:** halo binario sul POI (una sola forma in v1); day-clock
  come estensione condizionata al test di visibilità.
- **TheatreTrack:** solo nodi risolti + `nextKnown` se il runtime lo fornisce.
  Il teatro non deduce mai il futuro dal grafo.
- **Invariante:** dato lo stesso snapshot, render live/reopen identico.

### Frontiera temporale (PLAN-025 T-004 — implementata in `questRun.ts`)

- Il run porta `frontier: { status, startedAt, readyAt }`, `frontierVersion`
  (bump a ogni avanzamento committed) ed `engineSchemaVersion`.
- **Un solo modo di avanzare per input:** `submitCommand(run, optionId, {tick})`
  risolve al massimo il nodo corrente — un `CHECK:` si risolve inline come
  conseguenza della scelta committata — poi la run *arriva* al nodo successivo
  e si ferma. Mai oltre un nodo `waiting` aggiuntivo.
- **Solo il tempo attraversa i non-bivi:** `info`/`harm` entrano come
  `pending` con `readyAt = startedAt + nodeTicks`; `matureReady(run, tick)`
  consuma in sequenza i nodi maturati e si ferma al primo `waiting`/`ended`.
- **Effetti alla maturazione, scena all'arrivo:** l'arrivo mostra il testo
  (`body`); danni e routing (F7: `gob-ritorno` → `gob-agguato`) scattano a
  `readyAt` — il sollievo resta leggibile prima dell'agguato.
- **Catch-up deterministico:** il nodo successivo parte dal `readyAt` del
  predecessore — chi apre in ritardo consuma tutta la catena maturata in un
  solo `matureReady`, senza riprodurre attese.
- **Durate senza numeri nuovi:** `nodeDurationTicks(questId, totalTicks)` =
  tick autoriali della quest ÷ nodi maturabili; `nodeTicks = 0` (lab, Monte
  Carlo) = maturazione istantanea.
- **`applyChoice` legacy** = `submitCommand` + `matureReady(∞)` — lab e MC
  invariati (test di parità: stesso seed → stesso stato).
- **Reload:** frontier + seed + versioni persistiti; `matureReady(now)` dopo il
  load riproduce lo stesso catch-up deterministico.

### Adapter runtime reale (PLAN-025 T-006 — `questRunAdapter.ts`)

- `snapshotQuestRun(run, {tick})` → `TheatreRunView` v2: i nodi risolti
  vengono da `run.visitedNodes` (storia append-only, rivisite incluse — la
  track mostra ogni passaggio, es. il loop F6), mai dal grafo; il nodo di
  frontiera è `awaitingPlayer` | `pending` | `resolved`.
- `pending` espone `node.pending{startedAt,readyAt}` e **nessuna opzione**;
  `combat` espone `run.combat{turn,enemiesLeft}`; `bag` = flag sacca → item
  stash (`labelKey` i18n — l'adapter non produce mai copy).
- `createQuestRunAdapter(getRun,{getTick,onMutate})`: dispatch con guard
  stale (`expectedFrontierVersion`/`nodeId`), rifiuto su `pending`, dedupe
  per `commandId` (`rejected:duplicate`); `useItem` solo per oggetti
  istantanei (pozione/cure — i modificatori di check si armano, non si
  spendono qui); `retreat`/`collectReward` → rifiuto onesto (il motore non
  ha flussi generici: il ritiro è un'opzione authored).

### BeatSequencer (PLAN-025 T-008 — `questS1Lab/beatSequencer.ts`)

- Un commit del motore può portare più momenti (scena + check + N harms +
  fine): `projectBeats(mark, after, {maxBeats})` li proietta in beat ordinati
  camminando il diff del `run.log` — NODE→`scene`, CHECK→`check`,
  WOUND/DEATH/HARM→un `harm` beat ciascuno, QUEST_END→`end`. Gli id sono
  stabili (`scene-<visitedIdx>`, `chk-N`, `harm-<seq>`, `end`, `recap`).
- **Il sequencer non inventa mai:** i beat arrivano solo da ciò che il motore
  ha committato nel delta mark→after; niente nodi futuri, niente esiti.
- **Tetto della coda:** oltre `questWindow.beats.maxQueue` la testa saltata
  compatta in un beat `recap` («mentre eri via…») — reopen compatto.
- **`useBeatCursor`** riproduce con i timing di config; click/Enter/Spazio =
  skip progressivo; `flush` = «vai al bivio» (drain alla frontiera);
  `prefers-reduced-motion` = drain istantaneo. Il cursore è per-mount del
  componente: minimizzare non interrompe, riaprire ripropone la coda
  pendente compattata.
- **E1:** una multi-morte in un commit presenta un beat a membro — colore
  spento + icona, click per continuare (D-8), mai un paragrafo unico.
- `useQuestRun.beats`: coda append-only per commit (`mark` catturato prima
  della mutazione in-place); reload/start/clear la azzerano — nessun replay
  spurio su restore.

## Acceptance legati (PLAYWRIGHT, T-009)

- Stesso snapshot → stesso render; nessun comando duplicato su reopen/re-render.
- `rejected(stale)` su intent con `expectedFrontierVersion` non corrente.
- `unsupported` esplicito per kind sconosciuto; nessun input.
- Expanded: copertura ≤ `maxCoverage` config, HUD/roster mai coperti,
  non-regressione sui consumatori esistenti di `FloatingPanel`.
- Segnale POI distinguibile con teatro aperto/ridotto/chiuso sotto eventi mondo.
