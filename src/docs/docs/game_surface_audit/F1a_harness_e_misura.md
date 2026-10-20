# F1a — Harness unico di cattura + strumento di misura (Sonnet, 2026-10-20)

Codice: `harness/harness.mjs.txt` e `harness/smoke-f1a.mjs.txt` (estensione `.txt` per non farli entrare in lint/tsc; per usarli: rinominare in `.mjs`, avviare `vite` su una porta propria con Node 20, `node smoke-f1a.mjs`). Headless, nessuna finestra in primo piano.

## Cosa fa
- `openGame`: apre `/game` headless e aspetta il **segnale dell'app** (hook del POI), non un timeout.
- `reachSkillCheck`: lancia la run con `demoLaunch` (hook, dichiarato `hook-assisted`), poi guida con input reali (Enter sui beat, click sulle scelte) e `advanceTicks` sulle frontiere in viaggio, fino a `quest-check-board` visibile. Misurato: **~12-13 s** contro i minuti del full-flow con 4 drag reali.
- `snap`: PNG + JSON con viewport, dpr, reduced-motion, **come è stato raggiunto lo stato** e il limite («un frame non prova il movimento»).
- `frameSequence`: N frame a intervallo fisso, con per ogni frame `astroFrames`, `astroIdle`, animazioni CSS running/paused.
- `measure`: C1–C5, C7–C9 da DOM, numeri non giudizi. C6 (contrasto) e C10 restano fuori: richiedono pixel e giudizio.

## Fatti ottenuti dal solo smoke test (nessuna immagine ancora guardata)
1. Su `/game` lo skill check si dipinge nel percorso **Column** (`quest-check-column`), non nell'overlay portal. Coerente con `game-frame-pixi.tsx:1527`.
2. **Il congelamento è provato da un contatore, non a occhio:** `data-astro-frames` resta a 4 in tutti e 6 i campioni su 3 s, `data-astro-idle="parked"`, **5 animazioni CSS in `paused`**. Le animazioni ferme non sono solo il loop rAF: anche i CSS ambientali (`[data-astro-idle="parked"] * { animation-play-state: paused }`, `QuestSkillCheckColumn.tsx:61`).
3. **Nel percorso Column non c'è `.da-tira`:** nessun pulsante di lancio nel DOM. Il check risulta già risolto quando l'harness arriva (contatore frame già a 4, `parked`): il lancio è automatico. Il full-flow cerca `.da-tira` solo per il percorso overlay. Questo spiega «non ha il pulsante per lanciare» come comportamento del percorso di default, **da confermare con il default di `bridge.autoThrow`**.
4. Candidati C1 (icone non centrate), dopo aver corretto i falsi positivi: `quest-party-toggle` (dx −4.5 px) e `quest-belt-toggle` (dx −5.5 px), entrambi nell'header della QuestRunWindow. **Solo candidati**: la misura è di bbox, e se il bottone ha un secondo elemento nascosto o un badge, la diagnosi cambia. Serve la lettura visiva (F1c).

## Difetti dello strumento trovati e già corretti
- C1 contava bottoni con icona **e** testo → ora solo icon-only.
- C4 includeva SVG decorativi da 1293 px → ora solo ≤ 64 px.
Lezione: un numero meccanico non è un fatto finché non se ne è guardato un campione.

## Lacune note dell'harness (per F1b)
- **Stato «armato» non catturato.** `quest-check-board` è presente anche dopo il verdetto, quindi l'harness arriva a verdetto già risolto. Serve un segnale di stato distinto (frame counter a 0 / `data-astro-idle` assente) e il modo di spegnere l'auto-lancio per vedere il check prima del tiro.
- Nessun `page.clock` ancora: l'inferenza che affianchi rAF e `animations:'disabled'` è da provare, non da assumere.
- C6 (contrasto) non misurato; contenuto Pixi (POI, mappa) non misurabile via DOM.
- Lo stato è `hook-assisted` per il lancio: va dichiarato in ogni immagine che ne deriva.

## Non verificato
Nessuna immagine prodotta in questo passo è stata guardata. Nessun giudizio visivo (centratura reale, «tagliato», qualità dell'idle) è stato espresso.
