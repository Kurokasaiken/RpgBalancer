---
id: PLAN-135
title: /game — vista di partenza libera dalla HUD con una cornice di mare/coste dipinta (apron)
status: draft
request: R-387
date: 2026-11-25
surfaces: [/game, PixiWorldMap, mappa2 asset pack]
traps: [T-01, T-04, T-13, T-25, T-26, T-27, T-28, T-32, T-33, T-34]
contracts: [pixi-world-map (INV-10 Mode B-amend, INV-11 Mode B-amend, INV-12 Mode B-add)]
---

# PLAN-135 — Vista di partenza libera dalla HUD: apron dipinto attorno a mappa2

## 1. Il problema, misurato

A riposo la barra risorse/giorno copre la cima delle montagne e la cascata. Il dipinto mappa2 è 2752×1536
(~16:9): a cover fit riempie lo schermo e la terra arriva a y = 44 dal bordo alto. Per tenere la terra
dentro l'area libera (sotto le barre in alto, sopra la nav) lo zoom deve scendere e lo schermo mostra
**oltre il bordo del dipinto**. Quanto, misurato con `placeGameHud` reale + bbox del continente
(x 656–2343, y 44–1269), gap 8 px:

| finestra | zoom fit | serve sopra | serve ai lati | serve sotto |
|---|---|---|---|---|
| 1280×720 | 0.427 | 179 | 247 | 0 |
| 1366×768 | 0.466 | 160 | 214 | 0 |
| 1440×900 | 0.574 | 122 | 3 | 0 |
| 1536×864 | 0.544 | 131 | 159 | 0 |
| 1920×1080 | 0.721 | 88 | 80 | 0 |
| 1920×1200 | 0.819 | 72 | 0 | 0 |
| 2000×1024 (finestra Director) | 0.675 | 97 | 229 | 0 |
| 2560×1440 | 0.970 | 81 | 67 | 0 |
| 2560×1080 / 3440×1440 (21:9) | 0.72 / 0.97 | 88 / 81 | 524 / 521 | 0 |

(px di mondo 2752; script di misura: T1.) Le barre Eventi in alto a destra (R-386, in corso) non sono
ancora nel calcolo: T1 le include leggendo gli ingombri da tutto il chrome fisso.

Conclusione: **serve dipinto vero oltre il bordo** — ~200 px sopra e 250–560 px ai lati, niente sotto.
Nessuna regolazione di camera lo evita (sul 16:9 non c'è margine di pan), e il mare generato dal
motore non può continuare coste e scogliere che il dipinto taglia.

## 2. Perché il tentativo del 2026-11-25 è fallito (rivertito)

1. **Problema mai quantificato.** Ho cambiato camera e asset senza misurare quanto dipinto serviva a
   ogni finestra: la tabella sopra mancava. Il fallimento ai lati (ultrawide, finestra del Director)
   era prevedibile dal primo giorno.
2. **Un solo testimone.** Verificato quasi sempre a 1920×1080 di giorno; il Director usa ~2000×1024.
   Il contratto del fit (`game_map_fit_contract.md`) elenca già i viewport target 1280–3440 — ignorato (T-04).
3. **Contro una trappola nota.** T-01: «MAI risolvere allargando la decorazione: sposta la soglia e
   aggiunge cuciture». È esattamente ciò che ho fatto (margine di mare + striscia + plate generato).
4. **Rattoppo a catena (T-32 regola 5).** >10 patch sulla cucitura del mare senza convergenza, invece di
   fermarmi alla terza e cambiare approccio.
5. **Layer non attribuito prima del fix (T-33).** Gli archi sopra la montagna li ho prima attribuiti al
   dipinto, poi alle mie strisce: erano il velo deep-sea che `seaMargin > 0` accende *dentro* il canvas
   (420 px, sfoca il dipinto). Il marrone nella baia erano i fogli `fx/game-grade-*` fissi nel mondo.
6. **Accoppiamenti nascosti scoperti uno alla volta.** Il dipinto è replicato in ~15 asset per posto
   (base hi/2752/tasselli, Mare, maschere costa/schiuma/zone, chiome+manifest, grade, mountain
   shade/clarity, notte, bioluminescenza, regioni). Spostare terra richiede di spostarli tutti.
7. **Prototipi non rappresentativi.** Le prove in Python (senza grade, notte, effetti, HUD) sono state
   approvate e poi tradite dal motore.
8. **Fuori richiesta.** Il Director ha chiesto la parte in alto a destra; ho toccato mare, chiome, maschere,
   tasselli in serie senza ri-chiedere.

Questo piano evita tutti e otto: misura prima (§1), matrice di testimoni fissata prima del codice (T7),
nessuna terra spostata (gli angoli restano dove sono, come chiesto), dipinto vero invece di mare
generato, un solo pezzo d'arte nuovo con gate del Director.

## 3. La soluzione: apron dipinto, canvas intatto

- Il canvas 2752×1536 e **tutti** i suoi asset restano byte-identici: POI, maschere, regioni, tasselli,
  grade, notte. Nessuna coordinata cambia.
- Si aggiunge un **apron**: una cornice dipinta *attorno* al canvas (coordinate negative / oltre 2752),
  ottenuta per outpainting del dipinto approvato. L'outpainting conserva i pixel originali, quindi al
  bordo la continuità è per costruzione: scogliere e isole tagliate vengono completate, il mare continua.
- Il motore disegna l'apron sotto il canvas e lo tratta come «mare dipinto»: grade e notte estesi per
  clamp del bordo dei fogli (stessa luce del canvas), velo deep-sea **mai** dentro il canvas.
- La camera: fit sulla terra dentro l'area libera (ingombri letti dal chrome fisso reale), pan limitato
  all'apron, **il fit è il massimo zoom-out** (ruling Director), MAPPA → fit.

`visual-fork: skipped — rappresentazione unica: continuazione del dipinto approvato (look 2026-11-10); la
scelta estetica è il gate del Director sull'immagine generata (T3) — PLAN-135 §3`.

## 4. Decisioni aperte (Director, prima di T2)

- **D1 — Finestre da coprire.** (a) fino a 16:9/16:10 + finestra del Director → apron sopra 200, lati 260,
  sotto 0; (b) anche ultrawide 21:9 → lati 560 (≈ +40 % di dipinto ai lati).
  **Decisa 2026-11-26 (Director: «Sì, anche 21:9») → (b): apron sopra 200, lati 560, sotto 0 (px di mondo 2752; ×2 nella sorgente hi).**
- **D2 — Chi genera l'apron.** Il dipinto è 5504×3072 (sorgente hi): Gemini via web esce a 1024×572, troppo
  basso per una cornice che si vede a riposo. Ruling 2026-10-27: gli asset li genera il Director. Proposta:
  il Director con uno strumento a piena risoluzione (es. espansione generativa); io preparo canvas
  espanso, maschera e prompt. In alternativa Gemini a strisce, con rischio di stili diversi tra strisce.
  **Decisa 2026-11-26 (Director: «Gemini a strisce») → coda `scripts/gen-mappa2-sprite.mjs`, strategia in T2.**
- **D3 — Schiuma animata sulle coste dell'apron.** Le coste del canvas hanno schiuma animata, quelle
  dell'apron no (solo dipinta). Proposta: accettare per ora; human-eye in T7 decide.

## 5. Task

**T1 — Misura riproducibile e funzione pura del fit** (codice; nessun cambio visivo)
- `src/ui/idleVillage/pixiSpike/restingFit.ts`: funzione pura `restingFit({ viewport, chromeRects,
  landBounds, apron })` → `{ zoom, panX, panY, apronNeeded }`. `landBounds` calcolato una volta dal
  dipinto (componente di terra principale di `Mare.v2.webp`) e salvato in config, non scritto a mano.
- Gli ingombri del chrome fisso si leggono dai rect reali di `[data-hudslot]` (time, resources, nav,
  eventi R-386 quando c'è), non da un elenco di barre.
- Test unit `tests/unit/idleVillage/restingFit.test.ts`: tabella §1 come fixture; per ogni viewport
  target, terra ∩ chrome = ∅ e rettangolo visibile ⊆ canvas + apron (rosso finché l'apron è 0 su D1).
- Uscita: `apron.json` con le misure sopra/lati per la scelta D1.

**T2 — Pacchetto per l'outpainting** (dipende da D1, D2)
- Da `layers/base_flat.hi.webp` (5504×3072, con alberi): canvas espanso con i bordi D1 ×2, maschera dei
  bordi trasparenti, riferimento della costa vicina. Prompt registrato (T-26 registro stile verbatim, T-27
  riferimento pulito, T-28 semantica): completare scogliere e isole tagliate, mare che continua i toni del
  dipinto, l'ultimo ~30 % verso l'esterno solo acqua aperta, niente terra nuova notevole, niente testo.
- Strisce Gemini (D2): l'uscita è 1024×572, quindi si lavora a 1× (2752) e l'apron avrà la risoluzione del
  canvas 1× (a riposo lo zoom è 0.43–0.97: sufficiente; zoom alto sull'apron = sfocato, vedi §7).
  Ritagli 1024×572 che contengono il dipinto e il vuoto da riempire: sopra ~5 ritagli (372 px di dipinto +
  200 vuoti, sovrapposti di 256 px), ogni lato ~4 ritagli (464 di dipinto + 560 vuoti), angoli compresi:
  ~13 chiamate + rifacimenti. Ordine: prima gli angoli, poi i tratti tra loro, ogni ritaglio porta anche la
  parte già generata del vicino (ancora di stile, una immagine per giro).
- Gemini ridipinge tutto il ritaglio: si tiene SOLO la parte vuota, unita al canvas originale con una
  sfumatura di 24 px sul bordo; le sovrapposizioni tra strisce si fondono con sfumatura lunga.
- Precondizione T-34 (una finestra Canary aperta, anche ridotta a icona) dichiarata al Director prima di
  lanciare; conteggio delle immagini nuove (T-25); mai finestre in primo piano.

**T3 — Gate dell'immagine** (automatico + Director)
- Script di verifica per striscia e per il risultato unito: dimensioni esatte; continuità al bordo del
  canvas (differenza di tono sulle righe di giunzione ≤ soglia misurata dentro il dipinto); giunture tra
  strisce senza salto di tono; anello esterno = acqua (maschera colore). FAIL → nuova generazione, non
  ritocco (T-32).
- human-eye: il Director approva l'apron su un montaggio a riposo alle viewport D1. Baseline registrata
  (path + sha256) in `.mw/specs/mappa2-apron/`.

**T4 — Asset dell'apron** (script, `scripts/build-mappa2-apron.py`)
- Dall'immagine approvata: 4 strisce (sopra, sinistra, destra, sotto se serve) a 1× e la maschera
  terra/mare dell'apron. Niente rettangolo pieno (budget GPU: il canvas resta il grosso). Dimensioni e
  posizione in `manifest.json` (`apron` = rect in coordinate di mondo).
- Le strisce includono una fascia di sovrapposizione col canvas solo per il controllo di continuità
  (T7), non disegnata.

**T5 — Motore** (`PixiWorldMap.tsx`, superficie contrattata)
- Disegna le strisce dell'apron sotto il canvas; sea pattern e schiuma limitati dalla maschera dell'apron
  (oggi fuori dal canvas lo shader considera tutto mare).
- Grade del giorno e piani notte estesi sull'apron per clamp del bordo dei fogli (stessa luce del canvas,
  la notte scurisce anche la cornice).
- Velo deep-sea **mai** dentro il canvas; oltre l'apron il deep-sea resta irraggiungibile (pan limitato).
- Margini asimmetrici (sopra/lati ≠ sotto) per non toccare il fogliame di primo piano in basso.

**T6 — Camera su /game** (`game-mappa2.tsx`)
- Fit = `restingFit` (T1) con i rect del chrome; massimo zoom-out = fit; pan limitato all'apron; MAPPA →
  fit. I pannelli flottanti non entrano nel calcolo (contratto del fit §3).
- Mobile (`isMobileFitViewport`, telefono/landscape miniatura) invariato: fuori scopo.

**T7 — Testimoni** (headless, nessuna finestra in primo piano; porta 5197, Node 22)
- Matrice fissata prima del codice: le 11 finestre §1, 21:9 incluso (D1 = b) × giorno/notte × riposo,
  + zoom 2× sui quattro angoli e sul bordo alto.
- Metriche pre-registrate: (a) terra ∩ chrome a riposo = 0 px (dai rect DOM + proiezione del bbox);
  (b) nessun pixel oltre canvas+apron sullo schermo; (c) cucitura: differenza media di luminanza tra le
  4 righe del canvas e le 4 dell'apron al bordo ≤ soglia misurata sulle righe interne del dipinto;
  (d) canvas a riposo pixel-identico al canvas attuale nelle zone non coperte dall'apron (nessun asset del
  canvas cambiato: `git diff --stat public/assets/world/mappa2` = solo file nuovi).
- human-eye: montaggio affiancato prima/dopo per finestra, consegnato al Director.

## 6. Contratto di chiusura

`.mw/runs/plan135-game-map-apron/verification.json` → `npm run verify:bundle` → `bundle.json`, citato dalla
voce `fatta` di R-387.

| id | tipo | blocca | verifica |
|---|---|---|---|
| OB-1 | state | sì | `npm run test -- tests/unit/idleVillage/restingFit.test.ts` verde (fixture §1, red-first registrato prima di T6) |
| OB-2 | state | sì | `npx playwright test -c playwright.dev-server.config.ts tests/e2e/idleVillage/gameMappa2.spec.ts -g camera` verde con INV-10 emendato (fit = massimo zoom-out, terra fuori dal chrome) e INV-11 (MAPPA → fit) |
| OB-3 | state | sì | INV-12 nuovo: «il canvas non è mai velato; l'apron segue grade e notte» con test `// INV:pixi-world-map.INV-12` in `mappa2ApprovedLook.test.ts` |
| OB-4 | evidence | sì | metriche T7 (a)(b)(c)(d) PASS a ogni finestra della matrice, giorno e notte; NOT_COMPARABLE ≠ PASS |
| OB-5 | human-eye | sì | approvazione Director dell'apron (T3) e del montaggio finale (T7) |
| OB-6 | state | sì | `npx tsc --noEmit -p .` + `npm run test -- tests/unit/idleVillage/mappa2ApprovedLook.test.ts` verdi |

Living contracts: INV-10 e INV-11 di `pixi-world-map` → **Mode B-amend** con `redfirst:retire` e
`source_ref: R-387` (R-331 superato dal ruling 2026-11-25); INV-12 → **Mode B-add** con
`npm run sync:bug -- --component pixi-world-map --source-ref R-387` + `redfirst:record`.
Trappole riapplicate a chiusura: T-01 (nessun mare generato a riposo: il fit vive sull'apron dipinto),
T-04 (testimoni T7), T-13 (worktree condiviso: commit solo dei file di questo piano), T-32/T-33.

## 7. Fuori scopo (YAGNI)

Spostare o ridisegnare terra del canvas; cambiare posizione/dimensione della HUD; apron ad alta
risoluzione nei tasselli per lo zoom (si valuta dopo T7 se a zoom alto sull'apron il Director vede sfocato);
mobile.

## 8. Emendamenti della fase di clarification (2026-11-26, artifact r001)

Questa sezione è normativa e prevale su qualunque frase precedente in conflitto.

1. **Gate bottom/side prima della generazione.** T1 emette prima un feasibility report per viewport:
   bottom-required world-px e side-required world-px calcolati dai rect live del chrome fisso. T2 è
   hard-gated su `bottom-required = 0` e `side-required ≤ 560` per **ogni** viewport approvato, 21:9
   incluso. Qualunque eccezione è stop globale e ritorno al Director; non esiste procedere su un subset.
2. **Eventi R-386.** “Presente” significa nodo visibile `[data-hudslot="events"]` con rect non nullo a
   `/game` a riposo nel branch sotto test. Se assente, T1 registra coverage gap; OB-4 non può passare
   finché il rect non esiste ed è misurato, oppure il Director waived esplicitamente quella copertura.
3. **Fit runtime.** `restingFit` è ricalcolato live su mount/resize e al cambiamento dei rect osservati
   degli HUD slot. `apron.json` congela il worst-case chrome envelope per viewport/slot; se chrome futuro
   fa superare il fabbisogno oltre l'apron, il test contrattuale fallisce e il piano si riapre.
4. **Clamp camera.** L'invariante è `visible frame ⊆ canvas ∪ apron` a ogni zoom/pan: clamp del frame,
   non del centro. L'orlo dell'apron non deve mai essere visibile come confine verso vuoto/deep-sea.
   Nessun mare procedurale è fallback visivo oltre l'apron. 21:9 è il target certificato più largo;
   finestre più larghe sono fuori certificazione, ma non possono mostrare vuoto: la camera zooma oltre il
   fit HUD-free piuttosto che rivelare fuori-apron.
5. **BBox terra.** Il vincolo hard del fit è la componente continente principale. Isole ed elementi di
   angolo/foreground non sono hard-constraints del fit, ma restano testimoni human-eye in T7; se il
   risultato visivo li nasconde in modo inaccettabile, T7 fallisce e torna al Director.
6. **Metrica cuciture pre-registrata.** Prima di T2 l'artefatto esecutivo deve congelare: maschera di
   campionamento (path+sha256), formula percentile, larghezza/orientamento strip, coordinate dei join e
   soglia. Baseline: delta di luminanza media assoluta tra strip adiacenti da 4 px dentro il dipinto
   originale vicino alle transizioni costa/mare; join canvas/apron e strip/strip devono restare entro la
   soglia del 95° percentile congelato.
7. **Banda esterna acqua.** Il 30% esterno della profondità dell'apron è acqua aperta stretta. Le
   continuazioni di scogliere/isole tagliate possono stare solo nel 70% interno e devono arrivare a
   presenza visibile zero prima del confine della banda esterna. Controllo automatico pre-gate con
   maschera acqua/terra e connected components a costanti congelate + approvazione human-eye finale.
8. **Nessuna terra indipendente nuova.** Pre-gate automatico: qualunque componente terra/oggetto
   nell'apron che non interseca la zona di continuazione adiacente al canvas e ha area ≥64 world-px²
   oppure lato massimo bbox ≥8 world-px è hard-fail; componenti minori sono flaggati per review umana.
   Le costanti esatte vanno congelate prima di T2.
9. **T3 hard gate e granularità.** Il Director approva il composito finale, con difetti annotati per
   striscia/giunzione. Un rifiuto rigenera il più piccolo insieme di strisce/giunzioni implicato, non
   automaticamente tutto l'apron; il contatore T-32 è per striscia/giunzione. T4+ non parte finché T3
   human-eye è registrato in `.mw/specs/mappa2-apron/` con path+sha256.
10. **Canary/T-34.** L'automazione può usare/lanciare Canary solo in background o hidden (`open -g -j`),
    mai foreground/focus. Una finestra hidden/minimized è ammessa solo perché T-34 richiede window count
    non zero per creazione tab fail-closed. Il Director interviene manualmente solo per login/bootstrap.
11. **Riferimento stile.** Non esiste un prompt generativo originale preservato e recuperabile per il
    look 2026-11-10. Fonte autorevole: dipinto approvato + `src/ui/idleVillage/config/mappa2ApprovedLook.ts`.
    T2 deve scrivere il prompt di outpainting verbatim, registrarlo con path+sha256 prima della
    generazione e usare il dipinto/bordi originali come riferimento visivo pulito.
12. **Zoom/risoluzione apron.** L'apron 1× è limite accettato. I testimoni 2× di T7 sono human-eye per
    cuciture/artefatti, non metrica quantitativa di sharpness. Tile apron hi-res sono follow-up separato.

## 9. Emendamenti del round 1 di dibattito (artifact r002)

Questa sezione prevale su §8 e su ogni frase precedente in conflitto.

1. **T1.5 — Feasibility freeze obbligatorio.** Dopo T1 e prima di qualunque chiamata generativa si produce
   `.mw/specs/mappa2-apron/feasibility.json` (git-tracked, sha256 registrato) contenente: rect live degli
   HUD slot per viewport, fabbisogno top/left/right/bottom, slack rispetto a top=200/side=560/bottom=0,
   `frameClampMinZoom`, slack del frame dentro l'apron, event-bar rect o assenza esplicita, costanti e
   script sha delle metriche sotto. Nessuna generazione parte senza questo file.
2. **Events bar come gate di spesa.** Se `[data-hudslot="events"]` non è presente come rect visibile non
   nullo dopo due animation frame a riposo, la feasibility è `INCOMPLETE_EVENTS`; perfino la pilot strip è
   bloccata salvo waiver esplicito del Director. Se presente, qualunque fabbisogno `top>200`, `side>560`
   o `bottom≠0` è stop globale. Headroom sotto 24 world-px non blocca da solo ma deve essere riportato al
   Director come rischio prima della spesa.
3. **Fit/clamp math.** Sia `zLand` lo zoom massimo che tiene la terra principale fuori dal chrome e
   `zFrame=max(viewportW/3872, viewportH/1736)` il minimo che tiene il frame dentro l'apron. Il fit è
   `zRest=max(zLand,zFrame)` e lo stato è `LAND_CLEAR` se `zLand>=zFrame`, altrimenti
   `LAND_CLIPPED_BY_CLAMP`. OB-4 fallisce su qualunque `LAND_CLIPPED_BY_CLAMP`; slack per viewport va in
   `feasibility.json`. Resize/DPR: prima re-clamp zoom, poi pan; se la camera era a riposo, snap al nuovo fit.
4. **Pilot strip package.** Prima del batch completo: 3 strisce pilota, un angolo difficile con costa che
   attraversa il bordo più le due strisce adiacenti top/side, così si testano canvas join, strip-strip join
   orizzontale e verticale. Si eseguono estrazione, compositing, metriche e montaggio runtime reale. Il
   Director approva o rifiuta la pilot prima delle chiamate restanti. Fallimento = cambio strategia, non
   batch speso “a speranza”.
5. **Crop plan deterministico.** T2 genera `crop-plan.json` tramite script: rect di ogni crop, source
   region, kept region, overlap, ordine, output size attesa, join ids, retry budget. Il numero `~13` non è
   un requisito; contano solo il piano calcolato e il suo sha. Ogni chiamata usa come autorità il dipinto
   originale + prompt registrato + approved look; le strisce vicine sono solo riferimento locale secondario.
6. **Compositing solo outward.** Le strisce apron non scrivono alcun pixel dentro `[0,2752]×[0,1536]`.
   L'overlap col canvas è solo reference/controllo. Ordine di compositing deterministico, una maschera di
   feather per join, nessuna doppia sfumatura dentro il canvas. La sfumatura di 24 px è solo lato apron.
7. **Color transfer controllato.** Per ogni striscia, mean/std sRGB della parte generata sono corretti
   usando solo la regione painted overlap come reference; parametri registrati per striscia. Il gate valuta
   le statistiche post-transfer sia sui join canvas/apron sia sulla varianza cross-strip.
8. **Seam metric set.** Il singolo delta di luminanza non basta. `feasibility.json` congela: maschera di
   campionamento costa/mare (path+sha), banda in px, lattice deterministico (stride), strip 4 px, orientamento
   per join, coordinate join, script sha e valori soglia. Metriche minime: (a) photometric mean absolute
   sRGB per-channel + luminance; (b) low-frequency delta dopo blur 32 px; (c) structural gradient continuity
   Sobel attraverso il join. Baseline = distribuzione di coppie equivalenti dentro il dipinto originale su
   lattice deterministico; soglie percentile congelate prima della generazione. Human-eye resta obbligatorio.
9. **Classifier acqua/terra.** La banda esterna e il test “nuova terra” usano lo stesso classificatore
   congelato: palette acqua di riferimento dal dipinto (swatch path+sha), regola di distanza in spazio colore
   nominato, maschera land/sea derivata, morphological opening con kernel esplicito, scale factor esplicito.
   Componenti borderline vanno a review umana; foam/highlights non devono diventare hard-fail per rumore.
10. **Render identity oltre byte identity.** Prima di T4 si cattura baseline canvas-only alla matrice target.
    T7 verifica sia `git diff` asset-level sia screenshot render-level del canvas region a riposo, stessa
    viewport/time-of-day, tolleranza zero salvo eccezione visiva esplicitamente approvata dal Director.
    L'apron deve avere pass grade/notte separati senza alterare i pass del canvas.
11. **Void test operazionale.** Unit test: containment del frame in world coordinates con rounding
    conservatore (`floor` sul minimo, `ceil` sul massimo). Witness e2e con sentinel color fuori apron:
    zero pixel sentinel visibili ai bordi schermo in tutta la matrice.
12. **Review manifest.** T3 produce `review_manifest.json`: pannelli esatti viewport × day/night × view,
    dimensioni, ordine, filename+sha256, id per strip/join annotabile. L'approvazione del Director è firma
    testuale registrata sopra `sha256(review_manifest.json)`; senza quella firma T4 non parte.
13. **Chrome envelope runtime.** In dev/test, rect live che superano l'envelope congelato sono errore;
    in produzione clamp-and-warn, mai void silenzioso. T7 include perturbazione controllata dei rect +10%
    e richiede PASS oppure failure esplicita.
14. **Scope della garanzia terra.** La garanzia meccanica è solo “componente continente principale ∩ chrome
    = 0”. Isole/elementi di foreground restano accettazione visiva Director. Se il Director vuole “nessuna
    terra di nessun tipo sotto HUD”, serve una land mask completa e una nuova decisione: questo piano non lo
    assume implicitamente.

## 10. Emendamenti del round 2 di dibattito (artifact r003)

Questa sezione prevale su §8–§9 e su ogni frase precedente in conflitto.

1. **Scale lock dei crop.** `crop-plan.json` deve fissare per ogni crop `world_to_crop_scale_x = 1.0`,
   `world_to_crop_scale_y = 1.0`, transformation matrix, rect sorgente/kept/output e join ids. Output size
   diversa da input size, rescaling non uniforme o necessità di resample implicito = FAIL automatico della
   pilot/striscia. Nessuna striscia viene “adattata” scalando silenziosamente.
2. **Pilot kill criteria pre-registrati.** Prima della prima chiamata, `feasibility.json` congela: output
   size attesa, scale lock, soglia di repaint della painted reference, classificatore acqua/terra, metriche
   seam per classe di join, retry budget. Automatic FAIL se: dimensioni errate, scale ratio ≠1, painted
   reference oltre soglia, outer-water fail, nuova terra hard-fail, seam oltre soglia. Massimo 2 rigenerazioni
   per striscia e 1 ciclo pilot; oltre si ferma tutto e si torna al Director con fallback esplicito allo
   strumento full-res (già alternativa D2), non con patching infinito.
3. **Baseline seam per classe di join.** Le distribuzioni interne di riferimento sono separate per
   `coast-crossing`, `open-water` e `corner`; ogni join id in `crop-plan.json` dichiara la sua classe. Non si
   applica un P95 pooled a geometrie diverse. Gli script della pilot devono essere esattamente quelli finali,
   senza eccezioni pilot-only.
4. **Color transfer in CIELAB.** Il transfer usa CIELAB D65, delta Euclideano `ΔE*ab`, parametri mean/std
   calcolati solo su overlap classificato come acqua aperta dalla maschera congelata. Se l'overlap non ha
   acqua sufficiente, il transfer è `NOT_APPLICABLE`: niente correzione globale fasulla; valgono metriche di
   join + human-eye. Parametri e campioni validi registrati per striscia.
5. **Classifier acqua/terra concreto.** Spazio colore: CIELAB D65. Distanza: `ΔE*ab`. Palette acqua:
   coordinate swatch, dimensione campione, raggio per swatch e file path+sha dentro `feasibility.json`.
   La maschera land/sea derivata subisce morphological opening con kernel quadrato 3×3; scala apron 1× =
   1 px immagine per 1 world-px. Dopo opening: componente indipendente con area ≥64 world-px² oppure bbox
   max side ≥8 world-px = hard-fail; componenti minori = flag human review. Kernel, area e span sono frozen.
6. **Coordinate bande esterne.** Apron world rect: `x∈[-560,3312]`, `y∈[-200,1536]`. Banda esterna strict
   open-water: top `y∈[-200,-140)`; left `x∈[-560,-392)`; right `x∈[3144,3312]`. Continuazioni ammesse solo
   dentro top `y∈[-140,0]`, left `x∈[-392,0]`, right `x∈[2752,3144)` e devono arrivare a zero prima della
   banda esterna. Nei corner vale l'unione dei vincoli delle due bande; il crop-plan registra come vengono
   campionati.
7. **Frame rect e rounding.** Il frame clamp usa il rect apron dal manifest, non costanti hard-coded;
   `feasibility.json` registra anche il rect atteso sopra e un unit test lo confronta. `zFrame` usa le
   dimensioni viewport in CSS px, non device px; DPR viene registrato ma non entra nella formula. Unit test:
   containment con floor(min)/ceil(max). Render test: sentinel color fuori apron e conteggio framebuffer
   reale = 0 pixel sentinel ai bordi, quindi rounding diverso di Pixi non può passare silenziosamente.
   `LAND_CLIPPED_BY_CLAMP` è hard failure diagnostico della resting-view acceptance.
8. **Events waiver.** Il batch completo resta bloccato senza events rect misurato. Solo la pilot può essere
   autorizzata con waiver Director che registra un assumed worst-case events rect (banda top-right massima
   attesa) e dichiara che la validity della pilot è condizionata al fatto che il rect reale stia dentro
   quell'envelope. Nel branch corrente il nodo `[data-hudslot="events"]` esiste già: il percorso normale è
   misurazione, non waiver. Misura in CSS px, browser zoom 100%, viewport della matrice, rect stabile/nonzero
   per due animation frame, DPR registrato.
9. **Primo paint e stato “a riposo”.** Fino a rect chrome stabili/nonzero per due frame, la camera usa il
   worst-case chrome envelope congelato, mai cover-fit non protetto; poi `restingFit` live prende il controllo.
   “A riposo” è uno state flag impostato a mount/MAPPA quando zoom/pan coincidono con `restingFit`, cancellato
   a qualunque pan/zoom utente. Resize/DPR snap-to-fit solo se il flag è true.
10. **Ordering contrattuale.** INV-12 (`mappa2ApprovedLook.test.ts`) è scritto prima di T5, quindi T5 è
    test-driven. INV-10/11 amend/retire, `redfirst` e cambio camera T6 stanno nello stesso commit. OB-1
    red-first resta registrato prima di T6. Il baseline render canvas-only della matrice è catturato in T1.5,
    prima di qualunque generazione, non dopo la pilot.
11. **Deep-sea veil.** `feasibility.json` registra la costante/uniform veil usata dal test; unit test in
    `mappa2ApprovedLook.test.ts` asserisce maschera/intensità zero per frammenti dentro il canvas. L'apron ha
    pass grade/notte separati.
12. **Review manifest.** `review_manifest.json` è git-tracked prima della richiesta di approvazione e contiene
    pannelli, dimensioni, ordine, filename+sha e strip/join ids. La firma Director sopra il suo sha è l'unica
    approvazione valida. Il montaggio include anche witness human-eye esplicito “nessuna terra visibile di
    qualunque categoria sotto chrome fisso a riposo”; la garanzia meccanica resta continent-only.

## 11. Emendamento di convergence — ownership dei corner (artifact r004)

Questa sezione prevale su §8–§10 in caso di conflitto.

1. **Corner ownership mask.** `crop-plan.json` deve definire per ogni pixel di output dell'apron una
   ownership mask mutuamente esclusiva: esattamente una sorgente/striscia proprietaria e una sola operazione
   di compositing per pixel. Nei corner dove top e side si overlappono, la priorità è deterministica e
   registrata per join/strip id; nessun pixel può ricevere due feather o due vincoli contraddittori.
   Copertura incompleta oppure overlap di ownership = FAIL automatico di crop-plan/pilot prima della spesa
   ulteriore. Il montaggio T3 include una ownership/debug view dei corner così il Director può ispezionare
   la zona senza inferenze.
