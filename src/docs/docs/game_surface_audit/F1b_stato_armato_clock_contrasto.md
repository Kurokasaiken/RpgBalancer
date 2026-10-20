# F1b — Stato armato, `page.clock`, contrasto da pixel, 1280×800 (Sonnet, 2026-10-20)

Codice: `harness/*.txt` (rinominare in `.mjs`/`.ts`). Immagini e JSON: `shots/skillcheck-f1b/`. **Nessuna immagine è stata ancora guardata** (F1c, Opus). Tutto sotto è misura meccanica.

## 1. Tre problemi di cattura scoperti (sono materiale per «problemi con gli screenshot»)

| # | Problema | Evidenza | Soluzione adottata |
|---|---|---|---|
| P1 | **Il Chromium headless di default non ha WebGL.** Pixi ripiega su `CanvasRenderer`: ogni screenshot standard (anche quelli di `quest_full_flow/`) potrebbe non mostrare ciò che vede il giocatore. | `getContext('webgl2')` → `false` con args vuoti. Con `--use-angle=metal`: `ANGLE (Apple M4)`. Con swiftshader: renderer software. Stack trace di Pixi in un errore mostrava `CanvasRenderer.render`. | Harness lancia con `--use-angle=metal` (headless, nessuna finestra). Il backend GL è scritto nel manifest di ogni PNG. Su macchine senza GPU: swiftshader, **dichiarato** come renderer diverso. |
| P2 | **Un dev server sul worktree vivo si ricarica da solo.** Vite fa `page reload` a ogni edit di `RICHIESTE.md`, `plans/*.md`, `context/*.jsonl`, perché `assetsInclude: ['**/*.md']` li rende moduli. | Log Vite: 5 `page reload` in pochi secondi; un run ha perso il contesto a metà (`Execution context was destroyed`). Con la config isolata: 0 reload su 4 run. | `vite.audit.config.ts`: stessa app, `watch.ignored` su md/jsonl/plans/context/.mw. Alternativa più stabile: build + preview. |
| P3 | **`page.clock.install()` prima del boot rompe il canvas Pixi.** | `TypeError: Cannot read properties of null (reading 'ids')` in `checkAndUpdateTexture` al primo `runFor`: il ticker gira con texture non ancora caricate. | Installare il clock **dopo** il boot e l'arrivo allo stato voluto (`install` tardivo + `pauseAt`). Funziona. |

Un quarto limite, già noto: il contatore di frame di un headless carico è basso (5 fps con Canvas, 14-20 fps con Metal sul dev server), quindi i tempi in frame non sono quelli di una macchina da gioco; i tempi in millisecondi sì, perché guidati dal tempo.

## 2. Il clock controllato funziona (per lo skill check)

Con clock tardivo e `pauseAt`: 80 → 80 frame in 1 s reale (congelato); `runFor(1000)` → +62-63 frame (stepping a ~16 ms); lancio → verdetto in 4 s di tempo finto; poi `astroFrames` si ferma (831) e `data-astro-idle="parked"`. Risultato: **frame deterministici** e catture ripetibili del singolo istante, indipendenti dal carico della macchina. Resta da non usare per il boot della mappa.

## 3. Stato ARMATO ora catturabile, con tempi misurati (stesso risultato a 1440×900 e 1280×800)

| Fase | 1440×900 | 1280×800 |
|---|---|---|
| Check montato → pulsante «Throw» visibile | **4.1 s** | **4.1 s** |
| Click Throw → verdetto | 4.0 s | 3.6 s |
| Verdetto → loop parcheggiato | 0.72 s | 0.78 s |
| Frame dopo il parcheggio | fermi (389) | fermi (327) |
| Animazioni CSS in `paused` a fine | 5 | 5 |

Fatti che cambiano le ipotesi di F0 §4 e F1a:
- **Il pulsante di lancio esiste** (`.da-tira`, etichetta «Throw»), ma compare solo dopo ~4 s di intro. Prima non c'è nulla da premere. La segnalazione «non ha il pulsante per lanciare» può essere quei 4 s, non un'assenza: **da leggere a schermo in F1c**.
- Premere Enter durante l'intro **salta il check** (`skipToResult`): lo smoke di F1a l'aveva fatto senza accorgersene e aveva fotografato un check già risolto. Il driver ora aspetta dopo ogni Enter e rifiuta di spacciare per «armato» uno stato risolto.
- Il parcheggio è deterministico: ~0.7-0.8 s dopo il verdetto, su entrambi i viewport.

## 4. Misure meccaniche da leggere in F1c (candidati, non diagnosi)

| Criterio | Candidato | Nota |
|---|---|---|
| C1 centratura | `quest-party-toggle` dx **−4.5 px**, `quest-belt-toggle` dx **−5.5 px** (header QuestRunWindow) | identico a 1440 e 1280; bbox, non centro ottico |
| C5 clipping | 6 elementi a 1440, 7 a 1280 con overflow nascosto e contenuto più grande (es. `quest-theatre-frame` 745×340 in 730×303, `scene-col`, `arena`) | alcuni sono clipping voluto (scena), da distinguere a vista |
| C6 contrasto | 11 testi sotto soglia a verdetto parcheggiato (49-51 misurati); i peggiori: lettere `T I O` da 46 px color crema `rgb(237,224,196)` su sfondo chiaro, **rapporto 1.06-1.23** | sospetto artefatto: lettere in rivelazione con alpha 0.92 su un bagliore; **va visto** prima di dichiarare un difetto |
| C8 occupazione | pannello quest a x=310..1070 a 1440 (centro 690, viewport 720: −30 px); a 1280 x=150..910 (centro 530, viewport 640: **−110 px**) | il layout 3-zone può spostare di proposito; da leggere |
| C4 icone | 22 `engraved` + 4 `other` (≤64 px); dimensioni 12, 14, 16, 17, 18, 21, 33.6, 38.5, 55 px; tratti 1, 2, 36 px | molte scale; da vedere se per ruolo |

## 5. Limiti dichiarati / non verificato
- Nessuna immagine guardata; nessun giudizio di centratura reale, «tagliato», qualità dell'idle.
- Il lancio della run è `hook-assisted` (`demoLaunch`); nessun input reale sul planner.
- Contrasto: sfondi non uniformi, testi con alpha; approssimato.
- Un solo percorso (Column) catturato; il percorso overlay (portal) non è stato raggiunto.
- Frame rate bassi: tempi in frame non rappresentativi.

## 6. Pronto per F1c
Cosa leggere con Opus: `20-armed-throw-visible*.png`, `10-intro-t0/t1500`, `30/31-spin`, `40-verdict`, `41/42-parked`, confronto 1440/1280, e i candidati della §4. La domanda per ogni immagine: **cosa vede un giocatore** in intro (4 s senza pulsante), allo spin, al verdetto, e dopo il parcheggio (cosa è fermo, cosa è «morto»).
