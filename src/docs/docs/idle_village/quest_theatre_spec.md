# QuestTheatre — Spec (requirements brief per S2)

**Fonte:** PLAN-021 v8 (`plans/PLAN-021-quest-theatre.md`), desiderata v27 FROZEN, R-088.
**Status:** `draft` — read-model v1 è una **proposta non normativa**; il contratto
normativo del runtime nasce in S2 (`contractVersion` lo dichiara).

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

## Acceptance legati (PLAYWRIGHT, T-009)

- Stesso snapshot → stesso render; nessun comando duplicato su reopen/re-render.
- `rejected(stale)` su intent con `expectedFrontierVersion` non corrente.
- `unsupported` esplicito per kind sconosciuto; nessun input.
- Expanded: copertura ≤ `maxCoverage` config, HUD/roster mai coperti,
  non-regressione sui consumatori esistenti di `FloatingPanel`.
- Segnale POI distinguibile con teatro aperto/ridotto/chiuso sotto eventi mondo.
