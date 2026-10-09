# Quest UI Component Guide

Guida prescrittiva per costruire schermate di quest (lab S1 e successivi). Nasce dal
redesign cockpit di `QuestS1LabPage` (PLAN-023, artifact multi-AI
`.mw/runs/20261007-quest-s1-lab-ui-redesign/artifact-r005.md`). Vale per ogni nuova
superficie quest.

> **Componente battezzato su `/game` (Director 2026-10-09, PLAN-019-S2 D-F):**
> `QuestRunWindow` (`src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx`)
> è la superficie canonica della quest in corso — Regia/menu Pannelli (tasto Q),
> motore `useQuestRun`/`questRun.ts`; il teatro PLAN-025 converge dentro di esso.
> Le regole di questa guida si applicano a `QuestRunWindow` e a ogni sua
> evoluzione.

> **Superfici e colori**: questa guida governa *layout e pipeline di presentazione*.
> Per estetica, superfici (`HudPlaque`), token `--skin-hud-*`, controlli e tipografia
> il riferimento è `src/docs/docs/design/hud_component_guide.md` (Lacquer Atlas) —
> in particolare §6b «Schermate d'azione a pagina intera», scritta per questo lab
> (PLAN-024).

## 1. Layout: cockpit a tre regioni, zero scroll

Una schermata di quest risponde in uno sguardo a tre domande: *dove sono, chi sta
per pagare, cosa posso fare*. Il layout è quindi:

```
┌──────────────────────────────────────────────────────────┐
│ context strip  (titolo, seed, oro, ritmo, controlli)     │
├──────────────────────────────────────────────────────────┤
│ formazione (party slot)   │ scena/astrolabio │ orda      │
├──────────────────────────────────────────────────────────┤
│ Action Zone: opzioni → cinematica → verdict → prossima   │
│             azione; cintura consumabili in fondo          │
└──────────────────────────────────────────────────────────┘
```

- **Zero scroll** nel viewport di riferimento (1366×768). Le dimensioni verticali
  arrivano da `questLabPresentation.layout` (contextStripVh / stageBandVh /
  actionZoneVh), mai hardcoded nel JSX.
- Il **log/cronaca è un drawer**, non una colonna a pari larghezza. La decisione
  domina lo schermo; la consultazione è occasionale.
- L'**Action Zone è stateful**: `idle` (opzioni) → `presenting` (cinematica) →
  `verdict` (card) → di nuovo `idle`. Il verdict *sostituisce* il contenuto della
  zona, non è una banda extra.

## 2. La regola d'oro: eventi strutturati, mai parsing del log

La UI anima **dati strutturati emessi dall'engine**, non testo:

- `ResolvedCheck` → `id`, `harms: HarmEvent[]`, `exposure`, `kills`,
  `authoredText`/`harmLines` (già splittati), `transit`, `flavor`.
- `QuestRunState.recentHarms` → danni ambientali (fuori dai check).

Chi ha bisogno di un'informazione nuova la aggiunge al contratto engine, non
parsa `outcomeText` né il chronicle.

## 3. Presented vs committed: la pipeline di presentazione

L'engine **committa subito**; la UI **presenta** in beat:

`cinematic → verdict → kills → harm (uno alla volta) → settle → settled`

- Un solo reducer (`usePresentationTimeline` in `questS1Lab/presentationTimeline.ts`),
  keyed by `resolution.id` (o seq dell'ultimo harm ambientale).
- **Invariante:** `presentedHp == committedHp` dopo flush o settle — testata in
  `presentationTimeline.test.ts`.
- Ogni accelerazione (skip, fast, flush) attraversa lo stesso reducer. **Mai**
  un secondo canale che muta lo stato mostrato.
- Flush forzato su `visibilitychange` e unmount. `inputGuardMs` dal config
  separa lo skip dal click sull'azione successiva.
- Skip **progressivo**: un solo bottone che avanza di beat in beat; premuto in
  rapida successione equivale a flush-all.

## 4. Il canale danno (un canale, due stati)

- **Floater transiente**: `−N` che sale e svanisce sopra la card bersaglio
  (`FloatingText`, timing/stagger/max da `PRES.damage`).
- **Chip delta duraturo**: `−12` pinnato sulla card fino all'azione successiva —
  il residuo che risponde "chi ha preso quanto" anche a skip avvenuto.
- **Ghost layer sulla barra HP**: il segmento perso drena verso il nuovo valore.
- **Tombstone + rank-shift**: alla morte lo slot mostra la lapide; i vivi
  chiudono i ranghi verso l'orda e i valori di exposure ricalcolano.

L'HP nel verdict card NON si ripete in prosa — va sul canale visivo. La card
porta solo chip non-HP (kill, trofei, flag).

## 5. Formazione ed esposizione

- Party in **ordine fisico** (formazione Darkest-Dungeon-like): il front-liner è
  adiacente all'orda, non al centro.
- Exposure = probabilità per singolo hit: icona tier + pips + % + banda superiore
  della card. Tier da `PRES.formation.exposureTiers`.
- **Spent marker**: pallino su chi è già stato colpito nel turno corrente.
- Orda: **token anonimi** + `×N/total` + intent glyph `⚔×k` (hits/turno è
  costante di spec, noto prima del click).

## 6. Astrolabio: quando e come

- `DestinyAstrolabeV62` è il componente canonico. Estensioni di presentazione
  (`speed`, `skipToResult`, docked) si aggiungono al kit/engine, non si forkano.
- **Narrativa**: centrato, overlay della scena, full-motion.
- **Combattimento**: dockato nello stage-gap tra formazione e orda — il giocatore
  tiene gli occhi su HP ed esposizione mentre la ruota gira.
- Il verdetto è già deciso dall'engine: `skipToResult` è gratuito e sempre onesto
  (`honestTargetPos` garantisce coerenza palla/verdetto).

## 7. Stakes e consumabili: niente fasi separate

- **Stakes pre-click nel tooltip dell'opzione** (hover/focus): success bound,
  ferita%, morte%, pedaggio deterministico, contributor stat con icone.
- **Cintura consumabili** nella Action Zone: click = arm per il *prossimo* check.
  Una volta armato, tutti i tooltip mostrano il delta live (`45→60 ✦`). L'engine
  consuma solo al commit. Nessun modale, nessuna fase.

## 8. Config e primitive

- Ogni timing/dimensione/soglia vive in `questLabPresentation.ts` (Zod) o nel
  config di dominio. **Zero numeri nel JSX.**
- Superfici: primitive canoniche (`Materic*`/`SkinScope`) dove esistono; i layout
  di cockpit usano markup ad hoc solo per la griglia di regione (non è una
  superficie materica).
- Reduced motion: `PRES.motion.defaultMotionLevel` — floaters/ghost degradano a
  cambio di stato immediato.

## 9. i18n

Ogni stringa visibile va in `idleVillage.questS1Lab.*` (en + it-IT + pseudo per
le chiavi nuove). Icone stat via `STAT_ICONS`/`getStatIconComponent` in
`questRun.ts` — la stessa icona in preview, titolo check e card party.
