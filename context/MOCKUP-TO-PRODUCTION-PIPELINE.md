# Da mockup a componente vero

Guida operativa appresa da HUD F3 (2026-11-09), Victory/Reward R-348 e
cassetto expedition R-353 (2026-11-16). Non sostituisce `painter`, PLAN-047
o i contratti di progetto: traccia l'**handoff fra arte approvata e
comportamento di produzione**.
Per gli asset HUD leggere anche
`.mw/specs/hud-real/MOCKUP-TO-ASSET-GUIDE.md`. Una reference approvata
definisce l'intento visivo; il runtime `/game` resta la fonte di dati,
interazioni e semantica. Un mockup cliccabile non dimostra che la produzione
funzioni, e un test verde non dimostra aderenza visiva.

## Tre casi

- **A — Frame nuovo**: la superficie nasce da un mockup/frame rigenerato
  (R-348, HUD F3). Percorso a gate sotto + `MOCKUP-TO-ASSET-GUIDE.md`.
- **B — Arte firmata da adattare**: il componente esiste già come arte
  approvata (R-323) e va modificata: togliere ornamenti, tagliare bordi,
  stirare aree, ricomporre angoli (R-353). Richiede la **bake pipeline**
  descritta sotto, poi gli stessi gate 4-7.
- **C — Restyle su componente DOM esistente**: il mockup mostra la stessa
  superficie già in produzione con materiali/composizione diversi
  (roster/stash R-353). Niente raster: si riscrive il look del componente
  riusando primitive firmate, senza toccare semantica e contratti. Vedi la
  sezione dedicata.

## Percorso a gate

Se un gate fallisce, conservare l'evidenza e fermarsi su quello stadio: non
promuovere uno screenshot o un asset a "componente completato".

| Gate | Azione | Artefatto verificabile | Uscita |
| --- | --- | --- | --- |
| 0. Inventario runtime | Catturare la superficie **vera** sulla route canonica, tracciare dati, stati, eventi, focus, close/commit, i18n, skin, responsive e contratti. Per elementi collegati mostrare anche la composizione congiunta. | Witness stock + mappa `dato/evento -> componente/handler` + casi limite. | Nessun comportamento richiesto resta solo nel mockup; kit e componenti riusabili identificati. |
| 1. Fork e ruling | Usare l'esplorazione/visual fork PLAN-047 dove necessario. Mostrare varianti nello stesso contesto di uso, con carico realistico, non solo la vignetta ideale. | Fork card con opzioni, ruling verbatim, condizioni del confronto e vincoli di porting. | Director seleziona la baseline; senza ruling, niente porting di una variante arbitraria. |
| 2. Baseline congelata | Copiare il riferimento approvato senza sovrascriverlo, registrare hash, prompt/generatore, data e limitazioni. Separare reference, asset di produzione e witness. | `approved-*` + `refs/REGISTERED.md` + fork card + provenance. | Sorgente riproducibile e confrontabile; qualsiasi nuova iterazione usa un altro nome. |
| 3. Asset pulito | Classificare le regioni come arte, testo vivo, controllo vivo o componente esistente. Produrre una cornice **senza testo/valori/ritratti dipinti**; per fondi con mappa cucita estrarre alpha reale, per una pergamena opaca intenzionale non inventare alpha. Misurare le vasche sulla cornice approvata. | Frame pulito + mappa delle zone in coordinate dell'arte + controllo dei bordi/affordance. | Zero testo baked che compete col DOM; bordi, ornamenti, medaglioni e pulsanti visivamente integri. Se l'inpaint lascia giunte/ghost, rigenerare il frame vuoto invece di accumulare toppe. |
| 4. Contratto runtime | Disegnare `props -> dati reali -> zone`, `azioni -> handler esistenti`, e stati della UI. Separare testo localizzato da decorazione. Prevedere carico massimo, testi lunghi e viewport minimi (scroll o resize **dentro** la vasca, non oltre l'ornamento). | Schema del componente + contratto/invarianti + tabella zone; piano per failure/lost/empty se applicabile. | Ogni CTA/close usa uno handler vero e ogni riga viene da dati veri; niente demo data nel componente di produzione. |
| 5. Porting | Montare il nuovo componente nel **path che il giocatore usa**; lasciare intatto il boundary transazionale del vecchio handler, e riusare kit, skin, scheduler e i18n. Non disegnare una seconda UI scollegata. | Diff di mount, component e asset + test dei nuovi comportamenti/invarianti. | La route reale monta la nuova superficie con un run/sessione reale; il mockup resta solo riferimento. |
| 6. Witness e confronto | Guidare la route vera headless/background; ispezionare l'immagine a occhio **affiancata alla baseline**, stessa viewport/stato quando confrontabili. Provare anche azioni, stati e carico, EN/IT, viewport stretti, focus/Escape; annotare cio che manca. | Screenshot live e side-by-side, log DOM/handler, signoff legato agli hash dei frame. | Niente difetti visibili o sovrapposizioni non dichiarati; nessun claim su stati non osservati. Se il confronto risulta `NOT_COMPARABLE`, registrarlo, non chiamarlo PASS. Il ruling estetico resta al Director. |
| 7. Safeguard e chiusura | Lint scoped, test rilevanti, build, index-sync/contratti, closure:lint, `verify:bundle` secondo manifest; classificare rosso nel proprio scope vs worktree condiviso. | Manifest, log, `verifier.json`, `bundle.json`, ledger aggiornato. | `fatta` solo con bundle valido e gate richiesti verdi/derogati esplicitamente. `BLOCKED` non equivale a `PASS`, anche quando il componente risulta montato e i test scoped passano. |

### Decisioni pratiche durante il porting

- **Quale fonte prevale?** Visuale approvato per look, componenti di
  produzione per semantica/azioni, desiderata FROZEN e contratti per invarianti.
  Una variazione materiale dalla baseline richiede nuovo ruling; una
  differenza incidentale va annotata, non nascosta.
- **Cornice come immagine?** Consentita se la cornice stessa coincide con
  l'asset approvato e pulito; il mockup completo con testo/controlli baked
  non costituisce un asset. Per scontorno e misura vedi
  `MOCKUP-TO-ASSET-GUIDE.md`; per il dettaglio fase-per-fase applica `painter`.
- **Come provare la capienza?** Preparare dati di esempio al massimo carico
  *nella review*; sul componente vero verificare anche array vuoti, elementi
  extra, nomi lunghi, tooltip/portals e localizzazioni. Non ridurre il font
  sotto la leggibilita solo per far tornare il raster.
- **Come guidare la quest?** Osservare prima se il report risulta gia montato:
  premere Escape alla cieca rischia di chiuderlo e committare il settlement. Usare
  il pulsante di chiusura della finestra quest solo quando quella finestra risulta
  ancora aperta. Separare errore di driver, HMR e regressione reale.
- **Come gestire il worktree condiviso?** Non "riparare" contratti o test
  altrui per far passare il bundle; per un import-closure INV aggiunto seguire
  il gate red-first/approvazione Director. Elencare puntualmente i gate rossi
  fuori scope e lasciare il verdetto onesto.

## Ciclo di revisione visiva (gate 6, proposta operativa)

Non fermarsi alla prima cattura: **baseline approvata + render reale ->
difetti localizzati -> fix circoscritto -> nuova cattura -> confronto**.

1. Congelare condizioni comparabili: viewport/DPR, browser/font, lingua,
   dati/stato, fase animazione; attendere un render stabile. Conservare
   separatamente stati che non hanno equivalente nel mockup. Non mascherare
   testo, bordi o altri elementi che si devono valutare.
2. Produrre per ogni stato un side-by-side, overlay e diff per regioni;
   misurare bbox/overflow dei componenti DOM. Pixel diff e SSIM servono
   a *trovare* zone sospette, non a decidere se la materia dipinta e fedele.
3. Far valutare le immagini a un critico visivo distinto dall'agente che
   modifica il codice. Ogni finding: regione/coordinate, cosa mostra la
   baseline, cosa mostra il render, gravita, evidenza, ipotesi di causa.
   Distinguere differenza intenzionale, rumore di rendering e difetto.
4. Ordinare i finding per impatto; correggere **un problema principale
   alla volta**, senza riscrivere la composizione. Ricatturare anche le
   regioni gia corrette: un fix locale puo spostare layout o degradare
   dettagli altrove. Testare interazioni e stati dopo il fix.
5. Fermarsi solo quando nessun difetto materiale resta *visibile alle
   condizioni di valutazione concordate* nei casi coperti, le regressioni
   non ricompaiono e i gate funzionali passano. L'agente non si auto-assegna
   un PASS estetico: il Director valuta il side-by-side finale. Se il
   progresso si arresta, l'asset non e pulibile o il confronto non e
   equivalente, segnare `BLOCKED`/`NOT_COMPARABLE` e chiedere ruling;
   non abbassare soglie o modificare la baseline per ottenere il verde.

Ricerca: [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots)
documenta screenshot stabili e limiti ambientali; [Anthropic, harness
design](https://www.anthropic.com/research/harness-design-long-running-apps)
separa generatore e valutatore; [RubSE](https://arxiv.org/html/2608.24138)
privilegia un repair target per round e memoria delle correzioni;
[DiffSpot](https://github.com/Tencent/DiffSpot) mostra che anche i modelli
visivi forti perdono differenze UI sottili. Quindi il critico AI e un
assistente al rilievo, **non** un oracolo del "non si vede piu".

## Caso B — Bake pipeline su arte firmata (R-353)

Il componente è arte approvata da alterare **senza perdere particolari**.
La regola: mai editare la sorgente — si baka un derivato con uno script
(`scripts/build-cassetto-extracted.mjs`) guidato da una spec JSON unica
(`src/balancing/config/idleVillage/cassettoExtractedEdge.json`) letta sia
dalla config TS sia dallo script: impossibile drift fra visual e layout.

### Classificazione preventiva (obbligatoria)

Prima di qualsiasi crop/stretch, separare ciò che è **dipinto** nell'arte da
ciò che è **DOM**:

- Dipinto (placche, icone, medaglioni): ogni trasformazione lo deforma → si
  ripristina 1:1 post-trasform (patch lacca sul ghost + originale centrato:
  voci `restore[]`).
- DOM (pills risorse, testi, bottoni): resta 1:1 via `unstretchedZones`,
  ri-centrato sul centro stirato — altrimenti risulta distorto/dislociato.

### Stadi del bake (ordine testato)

1. `eraseRects` — composite `dest-out` per eliminare ornamenti indesiderati
   (filigrana, smeraldi, ciondoli, festoni).
2. `barTile` — ripavimenta il bordo pulito; da `srcImage` esterno è una pasta
   unica stirata a piena altezza (niente repeat → zero banding).
3. `patchRects` — rattoppi di lacca piana dove serve (con `feather`).
4. `pieces` — ricomposizione: `extract` dalla sorgente o `srcImage` esterno
   (file con alpha già bakata + `destW`/`destH`), `flipH`/`flipV`,
   `feather`, `gamma`, `brighten` per il tono.
5. Crop bilaterale (`leftCutPx` sx + `edgeClipPx` dx → bordo a filo schermo).
6. Stretch orizzontale `wideFactor` (solo X — la Y resta 1:1).
7. `restore` — elementi dipinti ricomposti 1:1 sul ghost stirato.

### Trappole raster misurate in sessione

- **Sharp riordina le ops**: `extract` in pipeline viene applicato PRIMA di
  `composite` indipendentemente dall'ordine di chiamata → spezzare erase/
  composite e crop in **chiamate sharp separate**.
- **I pezzi leggono il canvas post-erase**: se la sorgente del pezzo cade in
  un eraseRect, il pezzo estrae trasparente — coprire prima, cancellare dopo
  (o spostare l'erase sotto la zona coperta dal pezzo).
- **Niente rettangoli che segano ornamenti a metà** ("tagliato in modo
  troppo brutale"): prendere **cluster interi** d'angolo, o ricostruire
  specchiando la regione omologa — controllando che la banda/labbro cada
  alla stessa Y dell'originale (un flipV sposta il labbro dell'angolo:
  misurare, non fidarsi).
- **Coordinate**: des → img (kx) → crop → out (stretch solo X). Misurare un
  offset sul canvas stirato e riportarlo sulla spec design porta a correzioni
  sbagliate — annotare sempre in quale spazio è la misura.
- **Feather + tono**: cuciture visibili si sciolgono con `feather` sui bordi
  del pezzo + `gamma`/`brighten` per pareggiare il vignetting — NON con patch
  piatte sotto (il ghost crea il rettangolo).

### Patch da AI (Gemini) — seconda istanza "regen > patching"

Quando la ricomposizione non ha sorgente omologa (corner coperto dai
ciondoli, barra da ripavimentare liscia): chiedere all'AI di sistemare il
componente e prendere **solo le patch** (barra, corner) — MAI l'asset
intero. L'AI reinterpreta layout e proporzioni: le zone DOM si
disallineerebbero e può violare invarianti (v1 Gemini ha ridisegnato un
frame sul bordo che deve restare piatto — turno correttivo con il vincolo
esplicito nel prompt).

- Estrazione patch: l'output AI è opaco → maschera alpha per distanza dal
  colore di fondo + MaxFilter + blur + ramp sui bordi → salvare come asset
  (`gemini-*.png` in `public/assets/.../`) e citarla come `srcImage`.
- Le patch AI sono **scelta di gusto**: proporle al Director come variante;
  la baseline R-323 resta di default.

### Guida Gemini web via CDP (operativo)

L'API non è disponibile (free-tier image quota 0 su `GOOGLE_API_KEY`,
OpenRouter senza crediti) → sessione web su Chrome Canary debug
`--remote-debugging-port=9222` (profile `.mw/providers/profiles/shared`):

- `connectOverCDP` browser-level si blocca con browser pesante → connettersi
  al `webSocketDebuggerUrl` della pagina (da `GET :9222/json`) con ws raw.
- Non rubare il tab del Director: `PUT /json/new?<url>` apre tab dedicato.
- Allegato: `DOM.setFileInputFiles` su `input[type=file]`; prompt via
  `execCommand('insertText')` su `[contenteditable]`; invio con
  `Input.dispatchKeyEvent` Enter.
- Harvest: le `img` `googleusercontent` contaminano il canvas (CORS →
  toDataURL null) — usare le `blob:`; poll su `GENERATED-IMAGE img` +
  flag busy del bottone stop.

## Caso C — Restyle su componente DOM esistente (roster/stash R-353)

Quando il mockup riveste una superficie DOM già in produzione non serve
nuova arte: si cambia il look del componente. Le regole apprese sul roster:

- **Primitiva firmata > fedeltà letterale.** Il mockup AI mostra un anello
  generico: si monta il componente firmato equivalente (`C1Medallion`, con la
  sua ghiera e `C1_GEOMETRY`), non si ricrea un disco ad-hoc né si copia il
  rendering AI. "Esattamente come il mockup" vale per composizione e materia,
  non per i pixel di un generatore.
- **Conservare gli anchor dati.** Decoratori overlay, drag overlay e test
  misurano attributi stabili (`[data-wanderlust-portrait]`, `data-roster-name`,
  `data-hero-level`). Sostituendo il componente interno, tenere l'attributo su
  un wrapper con le stesse bounds: i decoratori continuano a misurare senza
  sapere che il motore sotto è cambiato.
- **Geometria nuova dietro density, contratti intatti.** Le INV esistenti sono
  testate su rect stubbati (es. badge LV mai sul nome, R-234): non si tocca il
  path testato, si dirama il nuovo layout dietro `data-density="compact"` e si
  soddisfa comunque lo spirito dell'invariante (il badge sta sul medaglione,
  mai sulle lettere).
- **Rumore AI ≠ semantica.** Colori o valori del mockup che contraddicono i
  token semantici firmati (barra stamina teal nel mockup vs ambrata in
  `matericSkin.css`) NON si portano: la materia viene dal mockup, la semantica
  resta della config.
- **Composizione prima del dettaglio.** Il gap utile si descrive a parole
  ("ritratto 22px → medaglione 40px + badge pinnato sul corner + nome oro +
  barre con valori a destra"), si implementa a blocchi, si verifica col
  side-by-side — non si inseguono i singoli pixel.

## Esempio: roster/stash R-353

- Reference `mockup-stash-grid.jpg` registrata; il ruling fissò la direzione
  (niente fork). Roster: riga compatta = `C1Medallion` 40px + badge LV
  bottom-left + nome oro + barre HP/stamina `sm` con valori + hairline incisa
  al posto del filetto-box. Stash: da lista a griglia+tab+detail con
  `radiogroup` derivato da config e detail card nel vocabolario tooltip.
- Evidenza: `.mw/runs/20261116-r353-roster-restyle/` (witness pannello+full),
  `test-results/r353-sbs-{roster,stash}.png`, 7 test nuovi
  `r353StashGrid.test.tsx` con INV-3/INV-4 dichiarate.

## Esempio: Victory/Reward R-348

- Stock catturato da `/game`: `QuestRewardPopup`, reward path e boundary di
  collect. Fork B: pergamena scelta; V4 raster-patched bocciata per cuciture,
  ghost e testo non integrato. V5: Gemini web rigenera un frame 1024x745
  pulito, con anello vuoto e placca CTA. Frame e witness registrati sotto
  `.mw/specs/hud-real/refs/` (`REGISTERED.md`).
- Il port usa `HudRealVictoryReward.tsx` sul mount di `game-mappa2.tsx`,
  `C1Medallion` con ritratto reale, `buildQuestEpilogue` e il settlement
  esistente; non chiama esso stesso gli effetti di ricompensa. Contratto:
  `.mw/contracts/components/hudreal-victory-reward.md`.
- Evidenza: `.mw/runs/20261116-r348-victory-porting/` (test, lint, build,
  index-sync, witness human-eye PASS). Il **bundle risulta BLOCKED** da
  `closure:lint` sul worktree condiviso: non chiamare R-348 `fatta`. Il
  witness osservato riguarda una victory con un membro ferito: non prova
  5 membri in produzione, IT, responsive stretto, stati fallen/wipe o il click CTA
  end-to-end. Il mockup V5 aveva un carico 5+6, ma non sostituisce tali
  prove live. Il confronto side-by-side mockup vs produzione nelle medesime
  condizioni non risulta attestato nel bundle; resta da fare prima di un claim
  di aderenza visiva completa.

## Esempio: cassetto expedition R-353

- Arte R-323 approvata → variante "estratta": bordo dx a filo schermo,
  ornamenti sx rimossi, stretch x4/3 con restore 1:1 di teschio/forziere/
  placca CONFIRM e `unstretchedZones` per resources/riskValue/rewards/confirm.
- Iterazioni Director: pezzi → cluster d'angolo → corner originale traslato
  → ruling «corner gemini» (patch AI alpha-keyed). Barra da `srcImage` Gemini.
- Evidenza: `.mw/runs/20261116-cassetto-gemini-fix/`,
  `test-results/cassetto-review/`, `test-results/gemini-cassetto/`,
  pattern `.mw/runs/20261116-learn-mockup-to-component/pattern-candidate.md`.

## Pacchetto minimo per la prossima superficie

1. `stock-witness` + tabella dati/stati/azioni dalla route reale.
2. Fork card approvata + frame `approved-*` hashato e registrato, con
   prompt/generatore; nessuna modifica al file approvato.
3. Frame di produzione pulito + zone misurate + contratto dati/interazioni
   (incluse le condizioni di capienza e i casi negativi).
4. Componente montato sulla route reale + test di action/commit/i18n e
   test del contratto; mantenere le differenze dal mockup esplicite.
5. Witness headless della route reale + side-by-side e dichiarazione dei
   casi non osservati, con signoff legato al frame esatto.
6. Manifest con obbligazioni della slice; eseguire i comandi previsti dal
   progetto (es. `npm run contracts:index-sync -- --check`,
   `npm run contracts:check`, `npm run closure:lint`,
   `npm run verify:bundle -- --manifest=<path>`). Documentare `BLOCKED`
   senza convertire artificialmente in `PASS`.

## Fonti e limiti

Evidenza: `.mw/runs/2026-11-09-hud-real-f3/pattern-candidate.md`,
`.mw/runs/20261116-r348-victory-ruling/visual-fork-victory-reward.md`,
`.mw/runs/20261116-r348-victory-porting/verification.json` e
`bundle.json`. Autorita di esecuzione: skill `painter` (fasi e art gate),
`AGENTS.md`, `context/recurring-traps.md` (T-04/T-13), regola
`.windsurf/rules/46-approved-references.md`, contratti PLAN-054.
Questa guida registra un pattern osservato in tre port HUD, non crea un
nuovo vincolo canonico per ogni UI.
