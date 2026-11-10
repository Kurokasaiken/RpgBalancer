# PLAN-116 — Cassetto a colonna destra + ghiera Zanara + rack a N posti

**Stato:** battezzato 2026-11-10 (Director: «Sì, battezzo») — F0 in corso.
**Parent:** R-323 (HUD/UI livello AAA, continuazione PLAN-113/114), PLAN-043 S5 (slot incastonatura), PLAN-112 G2 (palette e medaglione approvati).
**Origine (Director, 2026-11-10, verbatim):**
- *«più llargo, inoltre penso che un componente del genere dovrebbe prendere "tutta la parte a destra" della schermata, anche il footer e magari avere al suo interno anche la barra in alto a destra»*
- *«più stretta, inoltre sembra meno elegante come forme d quanto volessi, la parte finale con il pulsantone m sembra "ammassata", la aprte alta cn il compoennte nn è ben legato»* → fork testata, ruling **«1 · Dentro la cornice»**.
- *«Gli slot dentro questo componente nn sono quelli corretti, dovrebbero essere stati fatti "migliorati" rispetto a quelli originali, ma cn lo stesso funzionamento»*
- *«quel blu nn m dispiace, inoltre devi considerare che il numero d slot è variabile e può anche essere infinito (se aggiungi un pg si crea un nuovo slot vuoto accanto), quindi bisogna anche poter scorrere chi c'è dentro … i colori sembrano sbagliati (l'oro in particolare) e il "medaglione" è un po' diverso da quello che poi è stato battezzato»*

**Fonti di giudizio:** `.mw/runs/20261110-cassetto-explore/exploration.md` (critiche senior UI, misure), `visual-fork-cassetto-colonna.md` (ruling + baseline), `column/frame_v2.py` (tecnica di ricostruzione cornice provata in anteprima).

**Cosa NON è:**
- non monta il cassetto su `/game`: oggi `/game` non ha il flusso POI→quest (D8). La superficie è `/hud-compose?comp=cassetto` con la sessione quest reale (`HudRealCassettoHost`);
- non cambia le regole della spedizione (stime, rischio, ricompense, eleggibilità), né i dati delle quest;
- non aggiunge il supporto «posti infiniti» alle quest nel motore (D7): il rack deve *reggere* N posti e il posto vuoto in coda, che il controller già produce per `maxSlots: 'infinite'`;
- niente telefono (< 768 px): la colonna non si applica, come la pianta B1 (D10 di PLAN-112);
- niente animazioni nuove oltre a quelle esistenti dello slot (seat choreography, volo, estrazione).

## 0. Fatti verificati (2026-11-10)

- **Cornice:** `public/assets/ui/hud-real/cassetto/frame.webp` 639×1613, pulita (F3 PLAN-114). Contiene arte cotta: fila di 6 icone (testata), teschio, monete+forziere, frecce del viaggio, targa CONFIRM. Oro misurato (`scripts/hud-real/measure-materials.py`): L50 50, C50 37 — dentro le soglie G2-6 ma più spento delle barre (C50 42–44, L50 53–68).
- **Anteprima approvata (opzione 1):** colonna 420 px @1440×900, 400 px @1280×800, altezza piena; targhette risorse nella testata; riga costo sotto il titolo; CONFIRM a proporzioni native (scala uniforme ≤ 1,2) in un box del fondo alto +40 righe-arte; descrizione −40 righe-arte; barra tempo e nav centrate nella mappa libera. Baseline (card `visual-fork-cassetto-colonna.md`, ruling R-323/2026-11-10-colonna-testata, viewport 1440×900 e 1280×800): `column/fork-closeup-1440.png` sha256 `4e0f27bd42118492375ccb27a605712d5c66fe3b3d37355beb2c0152007c4eec`, `column/fork-1440.png` `c2aa3ab8dd6b3336cda563cbed8a65b4169b4fbfb497b9171969e7256ec13a33`, `column/fork-1280.png` `46504182a2a25cbd25dfd51b3acdd4078353242d1fa48b20dd155efa2480ec47`.
- **Slot:** il cassetto monta il `ResidentSlotRack` vero (`layout="detail"`, `slotVariant="hud64"`, `bezelPreset="b"`, `slotSize 42`) dentro `transform: scale(0.56)`. `BezelPreset` = `stock|a|b|c|ab`: **la ghiera Zanara firmata il 2026-11-06 (`bezel-zanara-fix-0.png`: 3 artigli, punto smeraldo, oro inciso + smalto; meccanica seat intatta; colori finali dai token di produzione) non è mai stata portata.**
- **Oro della ghiera (ritagli del mockup):** C50 21–24, L50 46–47, tinta 74–78 → fuori soglia G2-6 (C50 32–46, L50 50–73).
- **Medaglione battezzato:** anello approvato G2-3 `public/assets/ui/hud-real/C1/ring.webp` (oro vivo, fascia smeraldo, 3 gemme) usato da `HudRealRosterColumn` (ritratto nel foro `ZG.ring.hole`). Il ritratto incorniciato del mockup ghiera è un altro oggetto.
- **N posti:** `useResidentSlotController.deriveSlotBlueprints` con `maxSlots: 'infinite'` tiene sempre UN posto vuoto virtuale in coda (`isVirtual` → stato `placeholder`). Le quest oggi: posti scritti (required ∪ optional). Il rack ha già `overflowBehavior: 'scroll'` (scorrimento orizzontale, sfumature `--slot-rack-scroll-fade-*`, frecce, «Scroll for more» — `RackScroll.module.css`).
- **Kit congelato:** `slotRackKit` (frozen 1.0.0, cert su `[data-testid="resident-slot-rack-root"]` con le props canoniche). Un preset nuovo è additivo: il DOM con le props canoniche non cambia. Se il test del contratto del kit cambia esito → STOP (eccezione kit = decisione Director).
- **Contratti vivi toccati:** `slot-v12-renderer` (tier 2, nessuna INV), `resident-slot-rack` (INV-1 R-248 suoni, INV-2 R-257 medaglione duplicato), `use-quest-expedition-session` (solo lettura). Surface-map: `game-interaction` → `npm run test -- tests/unit/idleVillage`.
- **Desiderata:** l'ultima FROZEN è v37 (astrolabio): nessuna slice coperta da questo piano → niente check di disposizione P8. Valgono v35 (visual fork) e v36 (contratti vivi).

## 1. Principi

- **P1 — Fedeltà alla baseline.** Ogni fase visiva si chiude con un confronto affiancato (stessa viewport) contro la baseline della card; deviazioni materiali = STOP + ruling.
- **P2 — Asset puliti, niente stiramenti a runtime** (DECISION_LOG «mockup-signed-is-not-an-asset»): la colonna si compone di pezzi; gli ornamenti non si deformano mai, solo i campi neutri si estendono.
- **P3 — Funzionamento invariato.** La ghiera è un *preset* del renderer vero: stessa coreografia (empty → bezelSlam → teeth), stesso drag/drop, swap, estrazione col doppio clic, icone «perché no», `slot-button-*` per la geometria del volo.
- **P4 — Testi vivi e leggibili:** nessun testo sotto 12,8 px CSS a 1280×800 (`hudPx` / `--hud-text-k`), niente testo dipinto.
- **P5 — Colori dalla palette firmata** (G2-4/G2-6) misurati con `check-palette.py`; eccezione: smalto blu della ghiera (Director 2026-11-10).
- **P6 — Headless/background** per ogni cattura e prova (regola 16); occhio del Director come passo manuale.

## 2. Decisioni aperte (Director)

| ID | Domanda | Dove si decide |
|---|---|---|
| **D1** | Ghiera + medaglione: (A) la ghiera Zanara è il castone e il medaglione approvato (anello C1 + ritratto) ci si incastona dentro, gli artigli mordono l'anello; (B) un solo anello: l'anello approvato C1 diventa la ghiera (oro e smalto C1 + 3 artigli + punto smeraldo) | Gate F0 — card `visual-fork-ghiera.md`, tavole a 56/64/72 px, stati vuoto / valido / occupato / posto in coda |
| **D2** | Scorrimento dei posti: (A) una fila che scorre di lato (meccanismo già esistente, frecce + sfumature); (B) griglia su due file che scorre in verticale | Gate F0 — card `visual-fork-rack.md`, con 4, 7 e 12 posti |
| **D3** | Dove vanno chiudi/riduci (spariti con la fila icone) | Gate F0 (in coda alla card D1 o domanda a sé) |
| **D4** | Etichetta del pulsante e testo del motivo quando è spento (es. «Cibo insufficiente: servono 8») | Prima di F3 |
| **D5** | Titoli lunghi: rimpicciolire fino a un minimo o andare su due righe | Prima di F3 |
| **D6** | Filigrana sinistra a tutta altezza (critica: pesante) — tenerla com'è (arte firmata) o accorciarla | Gate F0 (domanda a sé, default = tenerla) |
| **D7** | Quest con posti infiniti nel motore | Fuori da questo piano (piano a parte se il Director lo vuole) |
| **D8** | Montaggio su `/game` | Fuori da questo piano (serve il flusso POI→quest su `/game`) |

Nessuna è decisa qui.

## 3. Fasi

**Marker visual-fork per decisione estetica:**
- composizione colonna, testata con targhette, CONFIRM, larghezze → `visual-fork: .mw/runs/20261110-cassetto-explore/visual-fork-cassetto-colonna.md` opzione **1**, baseline sopra;
- forma ghiera + medaglione → `visual-fork: .mw/runs/<F0>/visual-fork-ghiera.md` (da produrre in F0, ruling D1);
- forma dello scorrimento posti → `visual-fork: .mw/runs/<F0>/visual-fork-rack.md` (F0, ruling D2);
- oro: `visual-fork: skipped — colore vincolato dalla palette firmata G2-4/G2-6 — scripts/hud-real/check-palette.py soglie T`; smalto blu ghiera: ruling Director 2026-11-10 (RICHIESTE R-323).

Ogni fase richiede lo stato garantito dalla precedente.

### F0 — Gate visivi (ghiera, rack, controlli)
- Tavole headless (superficie #1/#2): ghiera A e B disegnate **alla taglia d'uso** (56/64/72 px, regola S2 PLAN-043: ritratto grande quanto il cerchio, ghiera fuori), oro ricalibrato sulla palette G2-6 (misurato), smalto blu; stati vuoto (aperta + icona ruolo, arretra), valido al passaggio (pre-chiusura), occupato (chiusa sul medaglione approvato), posto in coda (placeholder). Rack A/B con 4, 7, 12 posti dentro il pozzo «Party slots» della colonna a 1440×900 e 1280×800.
- Card `visual-fork-ghiera.md`, `visual-fork-rack.md` (template PLAN-047, nessun «consigliato»), più D3/D6 come domande semplici.
- **Uscita:** ruling D1, D2, D3, D6 + baseline sha256. Nessun task successivo presuppone una forma prima del ruling.

### F1 — Cornice a pezzi (asset)
- Script `scripts/hud-real/build-cassetto-column.py` (dalla tecnica provata in `column/frame_v2.py`): da `cassetto/frame.webp` produce in `public/assets/ui/hud-real/cassetto/column/`: testata con sede pulita per le targhette, bordo/ornamento sinistro (gemma intatta), bordo destro, angoli, campi pannello estendibili (briefing, party, journey, risk), box del fondo, targa CONFIRM come pezzo separato e simmetrico (metà sinistra specchiata), teschio/monete/forziere e frecce del viaggio come pezzi; `column-geometry.json` con le zone.
- Oro della cornice avvicinato alle barre (passo palette su questi pezzi; target C50 ≈ 42, dentro G2-6); `check-palette.py` deve passare sui pezzi nuovi.
- **Uscita:** pezzi + geometria, palette PASS, ricomposizione headless a 1440×900 e 1280×800 affiancata alla baseline (nessuna cucitura visibile — side-by-side ingrandito).

### F2 — Ghiera Zanara nel renderer
- `SlotV12Renderer`: preset nuovo (`BezelPreset` + `'zanara'`) secondo il ruling D1: 3 artigli, punto smeraldo, oro dai token della palette, smalto blu; medaglione approvato (anello C1 + ritratto) nella sede; coreografia invariata; il default e gli altri preset non cambiano.
- Contratto vivo `slot-v12-renderer`: **Mode B-add** — INV nuova «il preset zanara disegna 3 artigli + punto smeraldo; il preset di default resta identico» con test `tests/unit/idleVillage/SlotV12Renderer.zanara.test.tsx` (`// INV:`), `redfirst:record` (rosso prima del preset).
- **Uscita:** test verdi, `slotRackKit` contract test invariato (se cambia → STOP), tavola dal renderer vero affiancata alla baseline F0.

### F3 — Colonna `HudRealCassetto`
- Variante a colonna del cassetto composta dai pezzi F1 (posizionamento da `column-geometry.json`, campi che si estendono in CSS, ornamenti mai stirati), larghezza 420 @1440 / 400 @1280 (regola pura in `src/ui/idleVillage/hudReal/layout/cassettoColumn.ts` + test).
- Testata: targhette risorse come componenti DOM (stessa resa della barra firmata, testo `hudPx`), larghezza dettata dalla sede, margini uguali ai due lati; riga costo sotto il titolo (rossa se le scorte non bastano).
- CONFIRM: pezzo F1 a proporzioni native, aria sopra/sotto come la baseline; stato spento con motivo leggibile (D4).
- Titolo (D5), descrizione, journey, rischio/premi allineati su una linea di base; controlli D3.
- Rack: `ResidentSlotRack` vero con `bezelPreset="zanara"` alla taglia del ruling (niente `scale(0.56)`), overflow secondo D2, sfumature/frecce in materiale Zanara via variabili CSS esistenti; loadout `StashItemTile` nello stesso materiale.
- **Uscita:** test unitari della regola di larghezza e del calcolo costo/stato del pulsante; nessun testo < 12,8 px (misura DOM headless).

### F4 — Composizione `/hud-compose?comp=cassetto`
- Mappa + barra tempo e nav centrate nella mappa libera (regola pura in `gameHudPlacement.ts` o accanto, con test) + colonna; via il pulsante «dbg» (`HudRealCassettoHost.tsx:~143`), via secondo roster e pannello alabastro dalla composizione del cassetto.
- **Uscita:** catture headless 1440×900 e 1280×800 affiancate alla baseline.

### F5 — Funzionamento (N posti)
- E2E headless su `/hud-compose?comp=cassetto` (`tests/e2e/idleVillage/cassettoColumn.spec.ts`), solo input reali: trascina un residente in un posto (si chiude la ghiera), scambio su posto occupato, estrazione col doppio clic, motivo «perché no» su posto incompatibile, pulsante spento con motivo quando le scorte non bastano.
- N posti: fixture con 7 e 12 posti e un posto in coda (`isVirtual`) → il rack scorre (D2), il posto in coda resta raggiungibile, il trascinamento verso un posto fuori vista fa scorrere il rack (autoscroll dnd-kit) — misurato (`scrollLeft`/`scrollTop` prima/dopo).
- Contratti `resident-slot-rack` INV-1/INV-2 verdi (fast_checks).

### F6 — Chiusura
- `verification.json` → `verify:bundle` → `bundle.json`; voce R-323 aggiornata; occhio del Director (manuale) sulle catture e su `/hud-compose?comp=cassetto`.

## 4. Contratto di chiusura (`.mw/runs/<task>/verification.json`)

| id | tipo | comando / artefatto | bloccante |
|---|---|---|---|
| OB-1 | state | `npm run test -- tests/unit/idleVillage/SlotV12Renderer.zanara.test.tsx` (INV nuova, red-first registrato) | sì |
| OB-2 | state | `npm run test -- tests/unit/frozen` (contratto `slotRackKit` invariato) | sì |
| OB-3 | state | `npm run test -- tests/unit/idleVillage` (surface-map `game-interaction`; esclusioni preesistenti dichiarate con motivo) | sì |
| OB-4 | state | `npm run test -- tests/unit/idleVillage/cassettoColumn.test.ts` (larghezza colonna, centro mappa libera, costo/stato CONFIRM) | sì |
| OB-5 | state | `tools/hud-real/venv/bin/python -I scripts/hud-real/check-palette.py` (pezzi colonna + ghiera; eccezione smalto blu scritta in EXEMPT con motivo) | sì |
| OB-6 | state | `PW_BASE_URL=http://127.0.0.1:5173 npx playwright test -c playwright.dev-server.config.ts tests/e2e/idleVillage/cassettoColumn.spec.ts --project="Desktop Chrome"` (headless) | sì |
| OB-7 | metrics | misura DOM headless: testo minimo ≥ 12,8 px a 1280×800 e 1440×900; nessun overflow orizzontale nei campi | sì |
| OB-8 | frames | affiancati baseline↔implementazione a 1440×900 e 1280×800 (colonna intera + ingrandimenti testata, rack, fondo); esito pre-registrato per regione: PASS / FAIL / NOT_COMPARABLE (NOT_COMPARABLE ≠ PASS) | sì |
| OB-9 | state | `npm run build:check`, `tsc`, eslint sui file toccati | sì |
| OB-10 | signoff | occhio del Director (T-04) su catture e `/hud-compose?comp=cassetto` — passo manuale | sì |

Living contracts: `slot-v12-renderer` Mode B-add (OB-1); `resident-slot-rack` Mode C se il rack non cambia comportamento, Mode B-add se F3/F5 aggiungono una regola (es. «il posto in coda resta raggiungibile scorrendo»), con `sync`/`redfirst` relativi. `HudRealCassetto` e `hud-compose` non hanno contratto vivo.

## 5. Trappole da riapplicare a chiusura

- **T-04:** ogni claim visivo/animazione si chiude con un testimone che vede (catture ingrandite, misure di pixel; preview pane con animazioni congelate → pilotare `Animation.currentTime`), mai dal diff.
- **T-13:** sessioni parallele (village towers) — `verification.json`/probe su file propri, commit per sessione.
- **T-14:** testid e geometria `slot-button-*` invariati; driver e2e esistenti del rack verdi.
- **T-21:** controlli nella testata (D3) con hit-area verificata.

## 6. Avanzamento

(vuoto)
