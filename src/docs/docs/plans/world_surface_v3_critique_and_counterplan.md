---
title: World Surface V3 — Critica al piano tattico e contro-proposta
status: Draft
owner: Lead Systems Design
created: 2026-08-11
reviews: world_surface_v3_tactical_plan.md v2.2, world_surface_v3_domain_model_decision.md, sub-plan A.1–I
method: audit codice verificato + ricerca stato dell'arte 2026 + evidenza empirica di sessione
---

# Critica al piano tattico World Surface V3, e contro-proposta

## Verdetto in una riga

Il piano è **ben scritto e mal fondato**: descrive con grande cura un sistema costruito sopra uno scaffold vuoto, con numeri inventati, dipendenze che non esistono, e un contratto che contraddice i moduli che dovrebbe alimentare. La decomposizione in sub-plan non ha risolto nessuno di questi problemi — li ha resi più difficili da vedere.

Non va buttato. Va **riordinato**: quasi tutta la conoscenza di dominio è buona, è la *sequenza* a essere invertita.

---

## Parte I — I tre difetti fatali

### F1. Il contratto (A.2) è incompatibile con i moduli che deve alimentare (D, E)

Questo è il difetto che blocca l'esecuzione, e nessuno dei due round di review multi-AI lo ha intercettato.

Il `domain_model_decision.md` — che A.2 implementa esplicitamente ("Schemi Zod per tutte le entità **del domain model**", A.2:85) — definisce entità che **non hanno gli stessi campi** di quelle descritte nel piano tattico, da cui D, E, F e G prendono i requisiti.

| Entità | Piano tattico | Domain model (ciò che A.2 costruirà) | Esito |
|---|---|---|---|
| `EventSeverity` | `tier` 0–3, **4** durate di fase, `visual`, `audio`, `cap`, `deescalation` (§11) | `rank` 1–5, **1** tupla `phaseDurationMs`, liste di eleggibilità. Testualmente: *"does **not** contain phase scripts, audio, visual payloads, or de-escalation logic"* | **Inconciliabile** |
| `AttentionZone.trigger` | `camera-enter`, `pointer-dwell` (1200ms, ±15px), `enter`, `revisit`, `world-state` (§9) | `event-severity`, `wonder-visible`, `season` | **Il modello di interazione è sparito** |
| `Wonder` | spawn transiente, rarità 1/15min, durata 2–20s, `mustBeInViewport` (§12) | entità statica con `position` fissa e `importance` 1–100 | Concetto diverso |
| `LayerBudget` | 10 campi + cost class + quality profile + coda + degradazione (§4) | 3 campi: `maxPixiObjects`, `textureVramBudgetMb`, `enforcement` | ~70% rimosso |
| `Breath` | 5 elementi × (ciclo, ampiezza, opacità) (§7) | 1 globale: `{enabled, cycleDurationMs, amplitudePx}` | Collassato |
| `Parallax` | moltiplicatori per layer + `maxOffsetPx` + easing + dead zone + frame ancorato (§8) | `{id, factor, zIndex}` | Cap, easing, dead zone spariti |

Ora si guardi il grafo delle dipendenze: **D** dichiara *"Dependencies: Sub-plan A (schema `AttentionZone`)"* (D:61) e la sua Intent chiede la state machine con `pointer-dwell` a 1200ms e tolleranza Δ15px. **E** dichiara *"Dependencies: Sub-plan A (schema `EventSeverity`)"* (E:60) e chiede *"durate fasi come tuple `[min,max]` in `EventSeveritySchema`"* (E:31) — al plurale, quattro fasi.

Nessuno dei due potrà partire. L'esecutore di D aprirà il contratto appena congelato, non troverà `pointer-dwell`, e avrà due scelte: bloccarsi, oppure forkare lo schema — violando l'invariante *"nessuna duplicazione di schemi"* che il piano ripete tre volte. E che, come mostrato in F2, **è già violata nel repo oggi**.

La causa strutturale: i sub-plan sono documenti da 70 righe che referenziano "sub-plan A" in astratto invece della lista concreta dei campi. L'incompatibilità è invisibile finché non si aprono due file contemporaneamente. La decomposizione ha *creato* questo punto cieco.

> **La `AttentionZone` del domain model non ha né puntatore, né camera, né dwell.** La desiderata v2 dice: *"un mondo da esplorare con gli occhi"*, *"reazioni nascoste"*. Il contratto che stiamo per congelare non può esprimerle. È la parte più grave: non un mismatch di campi, ma la perdita del cuore emotivo della feature.

### F2. Il piano è ancorato all'artefatto sbagliato

| | `/world-surface` (V2) | `/world-surface-v3` |
|---|---|---|
| Codice | **1.029 righe funzionanti** (312 pagina + 717 renderer) | **358 righe, 21 file, zero logica** |
| Cosa fa | 21 layer, pan, zoom con anchor world-space, autofit, editor layer, persistenza, overlay Pixi reale (273 righe) | renderizza 5 `<div>` vuoti |
| Stato | è la mappa che il Director guarda | pagina nera |

Il piano investe 9 nodi sullo scaffold vuoto. Gli hook sono autodichiarati placeholder (`useWorldSurfaceState.ts:4` — *"returns static defaults only… not implemented yet"*), `causticEffects.ts` è di 4 righe, i 4 file di test V3 sommano 53 righe e verificano che i div si montino.

Il piano descrive V3 come una base da *"consolidare"* (§33). Non c'è niente da consolidare: è un albero di cartelle con i nomi giusti e zero comportamento.

Peggio: la desiderata v2 lascia esplicitamente aperta la domanda — *"Se il percorso `/world-surface` dovrà puntare a V3 e cosa succede al legacy"*. **Quella domanda non ha mai avuto risposta**, e il piano ha assunto silenziosamente che V3 vinca. Una decisione di quel peso non si prende per omissione.

Nel frattempo il Director ha passato l'intera sessione di oggi su `/world-surface` a segnalare tre problemi concreti — clipping in basso, tilt invisibile, pan difficile a zoom alto. **Nessuno dei tre compare nel piano.** Il piano progetta il Kraken mentre la barca imbarca acqua.

### F3. Il tilt in CSS 3D non può funzionare, e lo sappiamo per averlo provato

Il piano §3 assegna al layer DOM *"Base Painted Map + Gargoyle Frame + Attention Zones"* e a Pixi la dinamica, tenuti in sync via *"Viewport Matrix Sync"*.

In questa sessione ho implementato un tilt `rotateX/rotateY` + `perspective` su quel DOM. Risultato misurato: la stringa di transform arrivava **corretta** nel DOM (`rotateX(15deg) rotateY(18deg)`, verificato via JS), l'animazione girava (log a 60fps), **e sullo schermo non si muoveva nulla**. Nessun errore in console.

La ricerca spiega esattamente perché, ed è peggio di un bug:

- I layer sono **4240×2828**. Il limite canvas/texture di WebKit è **4096**. Siamo già oltre.
- Il comportamento documentato oltre il limite hardware è **blank senza errore** — nessuna eccezione da intercettare. È precisamente ciò che ho osservato.
- Ogni layer promosso a texture nel compositor 3D costa **4240×2828×4B ≈ 48 MB** di VRAM. Con 21 layer siamo a **~1 GB** di sole texture, prima dei render target. Chromium a quel punto fa eviction dei tile e nei casi gravi **cade su rasterizzazione software**.

Il piano non menziona mai né la dimensione dei layer né il limite di texture. Costruisce l'intera architettura di rendering sopra un presupposto — *"il DOM può ospitare la mappa dipinta trasformata"* — che è **già falso alle dimensioni attuali degli asset**.

> Se il tilt 3D è irrinunciabile va fatto in WebGL con texture tilizzate, o si passa a Three.js ortho. In CSS su immagini full-size non si può.

---

## Parte II — Cinque difetti seri

### S1. I numeri di budget sono fiction, sbagliati di un ordine di grandezza

Il piano fissa *"asset critici iniziali ≤ 4 MB compressi"* (§22).

Realtà misurata: `layers/` pesa **28 MB** in PNG non compressi. `Background.png` da solo è **7,35 MB**, `Frame.png` **5,92 MB**. E dentro `public/` — quindi tutto spedibile — ci sono anche `layers.backup-predilation/` (**altri 28 MB**) e `source/` (**23 MB**): **79 MB totali**, più un `manifest.json.bak`.

Il piano manca del bersaglio di **7×** sui soli layer attivi, di **20×** su ciò che oggi finisce nel bundle. E non contiene **nessun nodo** per una pipeline asset: niente WebP/AVIF, niente tiling, niente mip.

Questa è l'ironia strutturale del piano: la singola azione a più alto impatto e più basso rischio dell'intera feature — convertire 28 MB di PNG in ~3-4 MB di AVIF e tilizzare i due file sopra i 5 MB — **non è un nodo**. Mentre nove nodi sono dedicati alla cerimonia di schema.

Il piano è onesto sul fatto che i suoi numeri siano inventati — *"placeholder da profilare"* compare in §4 e §22 — ma poi **schedula la misurazione dopo il codice che dipende dai numeri**. È l'inversione che rende ogni soglia non falsificabile.

### S2. Dipendenze inesistenti presentate come risolte

**`clockKit`** — §18 lo chiama *"frozen kit certificato"* e dice *"si importa con una singola riga"*. Il cert dice `"certified": false`, `contractSha: "pending-playwright-run"`, note "Bootstrap". La route di riferimento citata (`/minimal-clock`) non è quella nel cert.

**`WorldClock` / `TimeEngine`** — §18 impone *"non usare `Date.now()`; usare un adapter `WorldClock`"*, e C, D, E, F, G ereditano tutti questo invariante. **Nessuno dei due simboli esiste nel repo.** Zero occorrenze. Il contratto `clockKit` non espone `now()`.

Sub-plan B non è quindi un adapter sottile: è **costruire da zero la sorgente temporale** da cui dipende tutto il resto. È un blocco P0 travestito da fatto compiuto.

**La pipeline Pixi** — §3 progetta da zero l'Engine Pipeline Pattern, l'HiDPI con `resolution: devicePixelRatio`, il sync pan/zoom DOM↔Pixi. È **già tutto implementato** in `WorldSurfacePixiOverlay.tsx:172-200`, incluso l'identico handling di `devicePixelRatio` che §4 "prescrive". Il piano ignora 273 righe di codice funzionante e ne riprogetta il sostituto.

**`ParallaxConfig`** — §19 step 2 lo elenca fra gli schemi da aggiungere. Esiste già nel contratto centrale (`config/worldSurfaceConfig.ts:132-135`). Ed esiste **anche** in una seconda copia più povera sotto `worldSurface/config/` — la duplicazione che il piano vieta è già nel repo, e i test V3 importano quella sbagliata.

### S3. La sequenza mette il rischio massimo per ultimo

Ordine attuale: `A.1 → B → A.2 → A.3 → {C,D,E,G} → F → H`.

Il contratto viene per primo. Ma il contratto è la parte a **rischio minimo** dell'intero piano: sono oggetti Zod e funzioni pure, interamente testabili, zero incognite.

Le incognite vere sono tre, e sono tutte rimandate a **H, l'ultimo nodo**:
1. l'ibrido DOM+Pixi regge il pan/zoom nelle tre WebView?
2. 28 MB di PNG si caricano in modo accettabile?
3. il linguaggio visivo legge come "mondo vivo" o come rumore?

Otto nodi di investimento prima della prima evidenza sul fatto che l'approccio funzioni. È l'inversione a cascata classica: si congela ciò che è economico da cambiare e si rimanda ciò che è costoso da scoprire.

### S4. La decomposizione ha perso il contenuto e tenuto la cerimonia

1.067 righe di piano padre → 9 sub-plan da **65-85 righe** (esclusi A.2, A.3, B). Ognuno ha dieci sezioni: frontmatter, classificazione, intent, acceptance, invariants, constraints, approach notes, file targets, dependencies, safeguards, open questions. Il blocco `safeguards` è copia-incollato quasi verbatim in tutti e nove.

Attorno a ~15 righe di sostanza reale.

E il contenuto ingegneristico del padre — la tabella cost class, i quality profile, la policy di degradazione, il diagramma FSM, la mappatura tier di 10 eventi × 6 colonne, il catalogo di 10 biomi × 5 colonne, il catalogo wonder — **non è stato portato nei sub-plan**. I sub-plan dicono *"dalla tabella §11 del piano tattico"*.

Quindi l'esecutore deve tenere due documenti in testa, il sub-plan non è auto-sufficiente, e la decomposizione ha aggiunto indirezione senza aggiungere eseguibilità. È esattamente il meccanismo che ha nascosto **F1**.

Nota di igiene: `world_surface_v3_subplan_A_root_config.md` (155 righe) è ancora su disco ma non è nell'indice — è un orfano dopo lo split in A.1/A.2/A.3. Un esecutore può raccoglierlo per sbaglio.

### S5. Ambizioni verificabili solo con strumenti che non esistono

§20 elenca ~20 categorie di test: visual regression a DPR 1/2, degradazione con frame time sintetici, test di allocazione GC/pool, *"il 99% dei tick non produce re-render"*, smoke Tauri con p95 e heap.

Realtà: 4 file di test V3 per **53 righe** che verificano il mount dei div, 6 `it.todo`, e **un test rotto su main** (`WorldSurfaceLayerOrder.test.tsx:195` — cerca `getAllByLabelText('Drag to reorder')`, il DOM espone `aria-label="village Scale"`). Il piano assume una baseline verde che non c'è.

Non esiste harness di visual regression, né di frame time, né di smoke Tauri. Ognuno di quei tre è un progetto a sé. Elencarli come acceptance criteria su sub-plan da 70 righe è il meccanismo con cui i nodi non chiudono mai.

### S6 (bonus). Alcune scelte contraddicono misure già fatte

- **Parallasse per layer vs seam.** Il renderer attuale applica deliberatamente **una sola transform sul container padre** proprio per evitare le cuciture fra layer (scelta documentata nell'audit). §8 propone moltiplicatori per layer (clouds 1.20x, water 0.90x, underwater 0.75x) — che reintroducono transform per layer, cioè esattamente la classe di artefatti che il codice attuale è stato progettato per evitare. In questa sessione, **azzerare la parallasse per layer è stato il fix delle cuciture**. Il piano propone di disfarlo senza saperlo.
- **60 fps è un tetto, non un target.** §22 chiede *"60 stable, min 45"* con quality profile fino a `high: DPR 2.0, ≤16.7ms`. Su macOS, WKWebView **cappa `requestAnimationFrame` a 60fps** indipendentemente dal display; l'issue Tauri è chiusa come *"not planned"*, e l'unico workaround usa una **API privata Apple**. Va scritto che 60 è il massimo legalmente ottenibile, non un obiettivo intermedio.
- **Linux fallisce in silenzio.** WebKitGTK può servire WebGL2 da rasterizer software mentre tutto sembra a posto, e **maschera la renderer string**: non si può rilevare a runtime. La doc Tauri raccomanda un toggle qualità manuale. La policy di degradazione automatica di §4 non funziona su Linux, per costruzione.
- **WebGPU non va lasciato in auto.** Pixi 8.19 ha bug aperti in cui il fallback WebGPU→WebGL **non scatta** e il rendering fallisce del tutto. Serve `preference: 'webgl'` esplicito. C'è anche un bug specifico Tauri sui path asset assoluti.
- **QuadTree e object pool sono over-engineering qui.** Per 10-100 rettangoli statici, un linear scan è sotto il microsecondo; il costo O(n²) citato in letteratura riguarda collision detection all-pairs, non point-in-rect. Il pooling serve a migliaia di allocazioni/secondo — cioè alle **particelle**, non a una sprite ogni 15 minuti. Due complessità architetturali senza un problema misurato.

---

## Parte III — Cosa è buono, e va tenuto

Per equità, questo piano contiene lavoro di dominio di qualità che sarebbe stupido buttare:

- **La tabella tier eventi** (§11): 10 eventi × presage/threat/active/consequence risolta e non risolta. È design di gioco vero, pensato.
- **Il catalogo biomi** (§15) con vita calma, cue ambientale, creature e wonder eleggibili per bioma. Ottimo materiale.
- **Il principio del respiro** (§7) e il suo test percettivo — *"il giocatore dice «la foresta respira», non «la foresta oscilla»"*. È la frase migliore del documento.
- **La separazione `EventSeverity` / `PresentationPolicy` / `EventAdmissionPolicy`** (§11). Concettualmente corretta.
- **80/15/5 come budget percettivo temporale** invece che geometrico (§5). Reinquadramento intelligente.
- **La distinzione wonder-visuale vs evento-gameplay** per Meteor e Storm (§6). Cattura una trappola reale.
- **Il divieto sulle particelle generiche** (§14): niente golden sparkles, floating orbs, glitter costante. Disciplina giusta.
- **La tensione con Pillar 2** su Tier 3 è stata *notata* tre volte. Non risolta — ma vederla è già molto.

Nella contro-proposta questo materiale **sopravvive integralmente**. Cambia solo *quando* viene consumato.

---

## Parte IV — Contro-proposta

### Il riquadro

> **Smettere di costruire una seconda mappa. Far respirare quella che esiste.**

Cinque principi che invertono il piano attuale:

1. **Misura, poi fissa la soglia.** Mai il contrario. Nessun numero di budget entra in un documento prima di essere stato osservato su hardware target.
2. **Un artefatto, non due.** La forcella V2/V3 si chiude il primo giorno, con una decisione esplicita del Director.
3. **Fette verticali che finiscono in qualcosa che si guarda**, non strati orizzontali che finiscono in uno schema.
4. **Prima l'incognita più cara** (rendering, peso asset, leggibilità visiva), per ultima la più economica (oggetti Zod).
5. **Il config si estrae dal codice che funziona.** Config-first non significa config-prima-dell'evidenza: significa che i valori spediti vivono nel config.

### Slice 0 — Verità a terra *(prerequisito assoluto, nessuna nuova astrazione)*

**Decisione del Director richiesta, in apertura:** `/world-surface` è LA mappa. `/world-surface-v3` viene cancellata o redirezionata.
*Questa è la domanda che la desiderata v2 ha lasciato aperta. Va chiusa a voce, non per omissione.*

Poi, pura igiene — nessun design, solo fatti:

- Rimuovere `layers.backup-predilation/` (28 MB) e `source/` (23 MB) da `public/`: **51 MB che oggi finiscono nel bundle utente**.
- **Pipeline asset**: PNG → AVIF/WebP come step di build; tilizzare `Background.png` e `Frame.png`. Obiettivo dichiarato: portare i layer sotto i **4096px** per lato, che è il limite WebKit e la causa di **F3**.
- Rimuovere il `worldSurfaceConfig.ts` duplicato sotto `worldSurface/`; puntare i test V3 al contratto centrale.
- Riparare il test rotto su main.
- **Strumentare**: HUD frame-time p50/p95, DPR, conteggio texture, memoria — sulla mappa vera, con gli asset veri, nella shell Tauri vera. Registrare su macOS e Windows (Linux con toggle manuale, vista la detection impossibile).
- Pinnare `preference: 'webgl'` in Pixi.

**Uscita:** *un numero*. «La mappa a 21 layer, in AVIF, su hardware target, gira a X ms p95, con Y MB di texture.» Ogni cifra di budget di ogni documento successivo deriva da qui. Nessuna è più inventata.

Questa fetta da sola risolve **S1**, **S2** (parziale), **F3**, e rende **S3** impossibile da ripetere.

### Slice 1 — Una sensazione, completa

Una sola: **il respiro**. Non il framework di config per il respiro — il respiro vero, sulla mappa vera.

Nuvole che scorrono, acqua che luccica, alberi che ondeggiano. CSS compositor-only, dietro un singolo feature flag, sui 21 layer esistenti. Valori hard-coded, per ora.

**Uscita:** il Director guarda e dice «la mappa è viva» oppure «non lo vedo». Quella risposta vale più dell'intera tabella §7. Solo dopo che legge bene, le costanti si estraggono in config.

### Slice 2 — Una reazione nascosta, completa

Una zona. Una reazione. Posizione hard-coded. Interazione vera.

E si risponde alla domanda che la desiderata pone davvero — *«quale trigger principale?»* — **provandoli entrambi** sulla mappa reale: `camera-enter` contro `pointer-dwell`. Dieci minuti di Director che usa la cosa chiudono ciò che tre round di review multi-AI hanno lasciato aperto in tre documenti diversi.

**Uscita:** un trigger deciso, per osservazione. Solo allora si scrive lo schema `AttentionZone` — la cui forma a quel punto è **nota** invece che dibattuta.

### Slice 3 — Il contratto, estratto dal codice che funziona

Adesso si scrivono gli schemi. Saranno giusti, perché descrivono codice esistente e comportamento validato.

È il lavoro di A.2, ma eseguito come **estrazione** anziché come speculazione. Diventa un task piccolo e a basso rischio invece del nodo più denso del piano. E **F1 non può ripetersi**, perché il contratto viene scritto *dopo* i suoi consumatori, non prima.

### Slice 4 — Tier eventi, minimo

Tier 0 e Tier 1 soltanto, sulla mappa vera, con la tabella §11 come sorgente.

**Tier 3 resta bloccato** finché il Director non chiude esplicitamente la tensione con Pillar 2. Scrivere una FSM il cui stato terminale è *"permanent (ruin state)"* mentre la domanda «vogliamo davvero chiudere il run?» è aperta in tre documenti, è il modo migliore per scrivere codice da cancellare.

### Slice 5 — Una wonder

L'ombra del Kraken. Una sola.

Object pool **solo se** la strumentazione di Slice 0 mostra stutter da GC. Altrimenti è complessità senza un problema.

### Cosa sparisce dal piano, e perché

| Elemento | Destino | Motivo |
|---|---|---|
| QuadTree | Rimosso | Linear scan su ≤100 rettangoli è sotto il microsecondo |
| Object pool per sprite | Condizionale | Serve a migliaia di alloc/sec — le particelle, non le wonder |
| Tilt CSS 3D | Rimosso o riprogettato in WebGL | Layer 4240px oltre il limite WebKit 4096; ~1 GB VRAM; fallisce in silenzio |
| Parallasse per layer | Sospeso | Reintrodurrebbe le cuciture che il fix di oggi ha eliminato |
| Quality profile a 4 livelli | Ridotto a 2 + toggle manuale | Su Linux la detection è impossibile per costruzione |
| Target 120fps / DPR 2.0 | Riscritto | Su macOS 60fps è il tetto legale |
| 9 sub-plan | 6 fette verticali | Ognuna finisce in qualcosa che si guarda |

---

## Le tre domande per il Director

Il piano ne elenca sette come "aperte". Tre bloccano tutto e vanno chiuse **prima** di scrivere altro codice:

1. **`/world-surface` o `/world-surface-v3`?** La desiderata v2 lo lascia aperto. Non si può decidere per omissione. *(Raccomandazione: `/world-surface`, e V3 si cancella.)*
2. **Un evento Tier 3 può davvero chiudere il run?** In tensione dichiarata con Pillar 2, aperta in tre documenti. Finché non è chiusa, nessuna FSM.
3. **Linux è una piattaforma di rilascio?** Se sì, serve un toggle qualità manuale by design, perché il software rendering non è rilevabile. Se no, si risparmia un'intera classe di problemi.

---

## Nota di metodo

Due dei difetti fatali di questo documento non sono stati trovati leggendo il piano. Sono stati trovati **eseguendolo**:

- **F3** è emerso perché ho implementato il tilt e non funzionava — poi la ricerca ha spiegato che non poteva funzionare.
- **S1** è emerso da un `du -sh`.

Il piano è stato revisionato da quattro AI in due round e nessuna ha aperto un terminale. È il motivo per cui Slice 0 esiste, ed è il motivo per cui ogni fetta successiva finisce in un'osservazione anziché in un artefatto.
