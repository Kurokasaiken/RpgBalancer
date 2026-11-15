# Desiderata — digest (PLAN-123)

> File in read-list AGENTS.md. Generato meccanicamente da
> `npx tsx scripts/ledgerSplit.ts desiderata digest` — deterministico,
> non editare a mano. Il canonico `.mw/desiderata.md` (sha256
> eae71073ebb8326f…, 38 sezioni v1–v38)
> resta BYTE-INTATTO ed è l'unica fonte per lo slice tooling
> (`mw-desiderata-slice`/`desiderata_slice`).
> Questo digest: indice completo + corpo verbatim di v27–v38
> (suffisso più grande ≤ 50000 char).

## Indice delle versioni

- **v1** — (senza titolo in heading) — Adottare il protocollo Mind Weaver nel progetto RPG: portare il workflow (explorer, planner, exec…
- **v2** — World Surface: mappa viva da esplorare con gli occhi — - La mappa di World Surface **non è più una dashboard tattica (Dispatch)**; è un **mondo da esplo…
- **v3** — POI Quest System — I POI di tipo *quest* si distinguono dagli altri POI per tre caratteristiche: (1) timer visivo co…
- **v4** — POI Quest System: pannelli flottanti e ritmo delle fasi — - "quando si apre il Detail nn posso + uscire e nn posso interagire con nient'altro."
- **v5** — Mockup AI → componente React + asset ad hoc: protocollo generale — Stabilire un protocollo generale, riutilizzabile, per passare da mockup generati con AI a compone…
- **v6** — Mockup → CSS/React + asset ad hoc: paintover consentito — Per qualsiasi componente UI o World Surface, il workflow operativo è: il Director prima prova CSS…
- **v7** — Documentazione AI-friendly + suite di test per l’integrazione di componenti in pagine — Quando un agente deve mettere componenti in una pagina, deve sapere come comportarsi senza dover…
- **v8** — Golden UI Foundation — Il piano Golden UI Foundation v2 è approvato come direzione. Non costruiamo un design system astr…
- **v9** — La geometria avversariale non deve essere amorfa — Il goo — blob scuro dai contorni organici e irregolari — non è l'unica forma
- **v10** — Placeholder funzionali e skin-ready per scheda, equip, consumabili e skill equip — Costruire componenti placeholder per scheda del personaggio, meccanismo di equip, oggetti equippa…
- **v11** — Skill Check Web V1: la rete lanciata, e il fallimento critico messo in scena — Uno *skill check cinematografico*, non un astrolabio. L'avversario è una
- **v12** — Strato punti-stat, Trial by Fire, consumabili e authoring delle attivita' — equippabili, consumabili, skill) realizzati in `src/pages/hero-components-lab.tsx`. v12 sta
- **v13** — Skill Check Web V1: contenimento e avversario sono due oggetti distinti — direzione A fra le tre presentate in sessione esplorativa.
- **v14** — Skill Check: una materia sola, due stati. Il goo è la tela coagulata — esplorazione e una ricerca sulla semiotica del segno visivo (Peirce: icona / indice / simbolo).
- **v15** — La stella copre la trama. Il personaggio, la difficoltà, e la differenza — La v14 trattava il fallimento come una fascia da inventare al muro, e la forma come un
- **v16** — Il goo torna, ma come densità e non come colata. La stella dimagrisce per gradi — sulla revoca del divieto della v15 e sulla direzione A+B emersa in sessione esplorativa.
- **v17** — Il contratto di copertura vince sulla forma — «fiore pieno va bene, vince il contratto».
- **v18** — Knowledge & Design Repository governato per RPG — ### User-stated
- **v19** — World Surface: ombre nuvole sempre attive, autorizzazione shader/parallasse overlay e Water Effect Lab — - il divieto di shader custom su World Surface diventa un **permesso condizionato** (lab, profila…
- **v20** — Astrolabe V6.3: materialità, prisma sul goo e fondi materici — ### User-stated (parole del Director)
- **v21** — World Surface: il mondo respira nella materia (terraferma) — ### User-stated (parole del Director)
- **v22** — Audit e direzioni per l'HUD esterno di RpgBalancer — ### User-stated
- **v23** — Mission Planner: la spedizione come problema da risolvere con simulazione live — ### User-stated
- **v24** — Macro plan Quest: prima una quest vera e divertente, poi l'integrazione, poi la generazione — ### User-stated
- **v25** — Audit e refactoring della knowledge base orientata agli agenti AI — - Audit della documentazione di tutti i progetti che usano Mind Weaver, priorità RPG Balancer (`~…
- **v26** — Strategist: layer di direzione pre-desiderata — - Un ruolo/skill `strategist` per **discussioni libere** su direzione, futuro del gioco, bilancia…
- **v27** — `QuestTheatre`: la quest nel gioco reale è una storia a nodi che aspetta ai bivi — ### User-stated
- **v28** — Luce dinamica 2D sulla mappa dipinta: ombre nuvole, god rays, luci su POI/landmark — - "va bene, e vorrei anche vedere il god rays" (approva penombra nuvole + sprite additivi + god r…
- **v29** — Trappole ricorrenti consumate al momento del lavoro (pre-flight, non registro) — - *"esempio di errore ricorrente: ad esempio: + volte nella pagina /game la mappa continua a dive…
- **v30** — Vista Villaggio (`Village` view mode) e Menu Edifici su `/game` — ### User-stated
- **v31** — Workflow single-agent: kanban/dispatch in pausa, chiusura a contratto — La kanban board, il dispatch coordinator/ai-worker/harness e la pipeline
- **v32** — Verifica comportamentale meccanica: da fatica del Director a gate (piano S0–S5) — *User-stated (fonte: desiderata v52 mind-weaver + dibattito + ruling)*
- **v33** — Gate d'intento alla chiusura: risultato vs desiderata e chiarimenti, non solo vs plan — *User-stated*
- **v34** — Cinematica delle scene quest: depth-parallax sistematico + regia dei beat — usando cm asset x le quest (cinematografiche, ecc). potresti prenderle e dividerle
- **v35** — Visual fork gate: nessuna scelta estetica silenziosa dell'agente — *User-stated*
- **v36** — Sistema vivo di contratti per-componente, integrazioni e test sincronizzati su `/game` — *User-stated*
- **v37** — Astrolabio: silhouette a famiglia uniforme per board, morph accoppiato — sulle soglie 10%/35% e sulla copertura qualitativa)
- **v38** — Expedition planning UI: assorbimento strutturale del mockup approvato — dopo il dibattito multi-AI `20261115-wanderlust-ui-plan` e i ruling D6 edge-tab /

## Corpo verbatim — v27–v38

## v27 — `QuestTheatre`: la quest nel gioco reale è una storia a nodi che aspetta ai bivi

**Status:** `FROZEN`
**Date:** 2026-10-06
**Authorized by:** Fausto
**Reason:** avallo via «avallo» in sessione esplorativa (R-088), dopo discussione della proposta ChatGPT «Presentazione della quest» (share `6ac5017a`).

**Relazione con altre desiderata:** non modifica il gameplay — la catena S1 (`PARTY → QUEST → PHASE → SITUATION → APPROACH → CHECK/CHOICE → CONSEQUENCE`) e QUEST_RULES restano invariate. Definisce **presentazione e semantica temporale** della quest sulla superficie canonica `/game`. v3/v4 restano fonte per il contratto dei pannelli (FloatingPanel: spostabile, riducibile a icona, non bloccante); il teatro eredita il container e ne cambia contenuto e scala. Il lab S1 resta sperimentale e fuori scope.

### User-stated

1. Scelte e skill check **non si risolvono automaticamente**. Solo il tempo scorre.
2. La quest si ferma alla prima fase che richiede il giocatore e **aspetta ai bivi** — *"una storia a nodi che mi aspetta ai bivi"*.
3. Il tempo reale pre-paga le durate: chi apre in ritardo gioca le fasi pendenti una dopo l'altra senza attese; *"il gameplay è identico"*.
4. Direzione **B**: `QuestTheatre` come componente nuovo — stage renderer (narrative / choice / check / consequence / reward) che **ospita** i contenuti esistenti (chronicle, skill check, reward panel, kit, log) dentro `FloatingPanel`, con modalità **expanded**.
5. **Scartati dalla proposta ChatGPT:** stato narrativo (`IN DANGER` / `RETURNING`) e livello di pericolo implicito — *"nn mi interessa"*.

### AI inference (derivata, marcata come tale — interpretazione avallata con il punto 3)

- Una fase **senza decisione** (puro viaggio, puro evento narrativo) si auto-completa allo scadere del suo tempo: la quest si ferma solo davanti a un bivio, un check o un checkpoint.
- Se il giocatore guarda *live*, le fasi arrivano man mano che i loro timer completano; i bivi lo aspettano.
- «Il mondo continua a esistere» resta un requisito percettivo (Pillar 1): il teatro non deve coprire lo stato del mondo più del necessario — coerente con v4 (nessun backdrop).

### Candidate dalla proposta (da validare nel piano)

- **Timeline narrativa** = traccia dei nodi passati + prossimo nodo noto; il futuro ignoto non si mostra, nemmeno come `?` — coerente con QUEST_RULES §2 (stat primaria sempre rivelata, resto intel-gated).
- **Party strip** sempre leggibile; **decision panel** per check/scelte (probabilità, conseguenze, assistenza disponibile).
- **Expedition kit** come drawer (non sempre visibile); **chronicle/log** con timestamp narrativi.
- **Retreat** sempre presente ma distinto, con **anteprima delle conseguenze** al click.
- **Art cinematografica** che porta il peso emotivo; UI sobria, quasi da libro illustrato.
- **Header** con titolo + obiettivo (e deadline se esiste).

### Cosa questo NON autorizza

- Nessuna auto-risoluzione di scelte, skill check o checkpoint — nessun default policy silenzioso.
- Nessun pannello modale bloccante né backdrop: vale v4 integralmente.
- Nessun duplicato di `QuestChronicle` / `MilestoneCheckModal` / `QuestRewardPanel`: il teatro *ospita*, non rifà (invariante Component Reuse).
- Nessuna implementazione prima del planner: v27 è desiderata, non mandato di esecuzione.
- Nessuna applicazione al lab S1 (sperimentale) né alla superficie deprecata.

### Still unresolved

- Forma esatta della modalità expanded (quanto del mondo resta visibile; docked vs floating massimizzato).
- Se più quest contemporanee = più teatri, o una quest attiva alla volta.
- Come il teatro segnala "la quest chiede attenzione" quando è ridotto a icona (halo POI, tick sul day-clock, entrambi).
- Destino del modello v3 (fasi temporizzate auto-risolte) quando il teatro arriva sulla superficie: convergenza o coesistenza.

### Emendamenti approvati

- **Deroga R-199 (2026-10-16):** la schermata di esito/ricompensa NON è ospitata nel teatro (contravviene al punto 4 «ospita… reward panel») — `QuestRewardPopup` è una placca page-level non-modale montata fuori dal DOM della finestra; il teatro conserva la narrativa di chiusura. Richiesta verbatim del Director: *"quando la quest finisce la schermata di reward deve essere un componente /popup esterno, nn all'interno della quest stessa"*. Valgono comunque v4 (niente backdrop/modali) e Component Reuse (corpo = `QuestEpilogue` condiviso).
- **Deroga R-199 (2026-10-16):** i companion opzionali (party/belt/log) partono **chiusi di default** (`questWindow.companionsDefaultOpen: false`) — revoca il «tutto visibile» di R-196, richiesta verbatim *"i componenti opzionali devono essere chiusi d default"*.

---

## v28 — Luce dinamica 2D sulla mappa dipinta: ombre nuvole, god rays, luci su POI/landmark

**Status:** `FROZEN`
**Date:** 2026-10-09
**Authorized by:** Fausto
**Reason:** avallo esplicito — "approvo, procedi" sulla candidata v28 rivista dopo la critica multi-AI web (`.mw/runs/2026-10-09-dynamic-lighting-critique/`).

**Intento del Director (verbatim):**
- "va bene, e vorrei anche vedere il god rays" (approva penombra nuvole + sprite additivi + god rays).
- "noi abbiamo un tool dove ci sn gli slidere degli effetti in quella pagina, le cose vanno la dentro. Voglio poterle mettere anche a 0% x vedere la differenza con e senza".
- Luci su: "POI e landmarks". Sole: "da in alto a sinistra verso basso a destra". Ombre: "nn so, proviamo entrambe le cose e poi decidiamo".

**Formulazione approvata (FROZEN):**
La mappa mondo dipinta (`/game-frame-pixi`, pipeline PixiJS/WebGL2) guadagna tre effetti di luce dinamica, tutti nel **tuning panel degli slider** (`TuningPanel`/`PixiMapTune`), ognuno con slider **0% = pass smontato dal render graph** (non output nero) per il confronto diretto con/senza:

1. **Ombre nuvole a confronto multi-variante** — selettore `cloudShadowMode: 'sprite' | 'blur' | 'raymarch'`, stesso tetto di opacità per tutte, decisione a pari p95:
   - `sprite` = gli offset cloud-shadow sprites esistenti;
   - `blur` = **baseline nuova**: occlusion texture low-res per banda nuvole (scrollata via uniform offset alla stessa velocità dello sprite, nessun rebake a runtime, tiling seamless) + blur direzionale separabile lungo la direzione del sole → penombra morbida;
   - `raymarch` = variante costosa solo per confronto visivo (marcia per-pixel nel campo di occlusione).
2. **God rays** — blur **direzionale** (non radiale screen-space) della maschera sintetica dei gap tra nuvole (`1 − occlusion`), in direzione mondo fisso TL→BR, quad viewport-sized, compositing additivo. Se a vista legge come sbavatura il Director lo taglia (slider a 0).
3. **Luci additive su POI e landmarks** — sprite falloff radiale `blendMode: add`, figli del world container (seguono pan/zoom gratis), flicker via alpha/scale sul ticker, cap ~12 visibili con budget di overdraw, tint per tipo da palette, clamp d'intensità da config.

**Vincoli (critica multi-AI assorbita):**
- Ogni effetto è un **quad viewport-sized con shader proprio** (blend multiply/add); MAI un Pixi filter sul container della mappa da 12 MP (replica il disastro CSS da 1016 ms).
- Tutto in PixiJS/WebGL2; DOM/CSS per luce dinamica escluso (misurato: inutilizzabile).
- Config-first: nuovi campi `PixiMapTune` via Zod, nessun valore hardcoded.
- **Soglie di abort pre-dichiarate** su `/map-benchmark` (Tauri, finestra visibile): penombra ≤ +2 ms p95, god rays ≤ +1 ms p95, light sprites ≤ +0.5 ms p95, worst frame ≤ 33 ms — più test combinato con tutti gli effetti attivi (i costi non sommano linearmente). Chi sfora non si abilita di default: si torna al piano.
- Test di parità: tutti gli slider a 0 deve dare la stessa distribuzione p50/p95/worst del renderer senza codice nuovo.
- Task 0: verificare dove vivono oggi le coordinate POI/landmark e che siano in world-space 4240×2828; se no, adapter esplicito + test che un POI noto cada sul pixel dipinto corretto a zoom 1.0.
- Niente volumetrica, niente filtri su layer full-res, niente pass a risoluzione mondo.

**Still unresolved:**
- Criterio finale di scelta `cloudShadowMode` dopo il confronto visivo del Director (decisione sua, post-misura).
- I landmark specifici che prendono luce e la loro sorgente di coordinate (manifest vs config — dipende da task 0).

---

## v29 — Trappole ricorrenti consumate al momento del lavoro (pre-flight, non registro)

**Status:** FROZEN
**Date:** 2026-10-11
**Authorized by:** Fausto
**Reason:** avallo esplicito — "procedi" sulla candidata presentata in sessione explorer (audit attriti MW-in-RPG)

**Intento del Director (verbatim):**
- *"esempio di errore ricorrente: ad esempio: + volte nella pagina /game la mappa continua a diventare troppo grande e l'HUD copre una parte di terrra, e nn dovrebbe. Poi aumenta il mare e appaiono delle linee tra il mare "vecchio" e quello nuovo."*
- *"opzione 3, ma dobbiamo assicurarci che vengano lette e utilizzate, tipo preflight e cose del genere"*

**Formulazione approvata (FROZEN):**

*User-stated*
1. Gestire gli errori ricorrenti di processo/protocollo emersi in RPG con regole preventive, non con un nuovo registro di osservazioni.
2. Le regole devono essere lette e usate davvero: meccanismo di pre-flight (o equivalente) che le porta dentro il lavoro al momento giusto.

*AI inference*
3. Il meccanismo è trigger-scoped: un file di trappole (`context/recurring-traps.md`) indicizzato per superficie; le skill `mw-*` lo consultano nel pre-flight quando il task tocca una superficie taggata.
4. Una trappola entra nel file solo con ≥2 istanze documentate (soglia `learn` / MW-P-005): niente cimitero di casi singoli.
5. Non un quindicesimo file `.windsurf/rules/` always-on: "sempre presente" ≠ "letto al momento giusto" (evidenza ATTRITI mind-weaver: regola in posizione di attenzione ottimale violata comunque — il problema è il momento che la interroga, non la posizione).
6. Contenuto RPG-specifico; se il meccanismo prova di funzionare, la generalizzazione a Mind Weaver è un passo successivo separato.

*Still unresolved*
- Se serve anche un guard meccanico per le trappole verificabili da codice (es. test "terra mai sotto HUD").
- Estensione del trigger a skill non-mw (`agent-execution-mandate`, `idle-village-task`) dopo prova d'uso.

---

## v30 — Vista Villaggio (`Village` view mode) e Menu Edifici su `/game`

**Status:** `FROZEN`
**Date:** 2026-10-15
**Authorized by:** Fausto
**Reason:** avallo esplicito via "C / mock / si" + "pianifica" sulla candidata v30 presentata in sessione explorer (R-194)

### User-stated
1. **Superficie in `/game` con `villaggio.png`:** implementare su `/game` la schermata del Villaggio e degli edifici usando `src/assets/mood/villaggio.png` come immagine principale.
2. **Rimozione watermark Gemini:** eliminare il simbolo a stella di Gemini in basso a destra da `villaggio.png`.
3. **Ingressi alla vista Villaggio (Direzione C):** la schermata si apre come **vista a tutta area dentro `/game`** (`activeNavId = 'village'`) sia cliccando sulla **regione `village`** della mappa del mondo, sia cliccando sul pulsante **`Village`** nella barra di navigazione in basso (`plinth`). Cliccando **`Map`** nella nav bar si torna alla mappa del continente.
4. **Icon-first e poco testo:** usare **icone e pochissimo testo** per gli edifici, delegando i dettagli (cosa fanno, livello, costi e valori di upgrade) al **tooltip sull'icona**.
5. **Rimozione del Warehouse dalla mappa:** il Magazzino (`Warehouse`, `building-stash`) **non** deve più apparire come icona/marker sulla mappa del continente; vive dentro la schermata del Villaggio (insieme all'accesso a `VillageStashPanel` e a `MerchantPanel`).
6. **Catalogo edifici e upgrade mock:** includere **Taglialegna, Cava/Miniera, Farm/Orto, Warehouse/Magazzino, Palizzata, Torre d'Osservazione** più gli altri edifici di dominio della documentazione (**Locanda, Fucina, Infermeria, Baraccamento, Emporio/Mercato**), completi di livelli, cosa fanno e valori di upgrade. Gli upgrade/costruzioni sono **mock-backed** (sola visualizzazione/controllo inerte come `PLAN-032 SP-2/SP-3`, nessuna mutazione reale dello store economico).

### AI inference
1. **Persistenza del canvas Pixi nello switch `Map` ↔ `Village`:** quando `activeNavId === 'village'`, la vista Villaggio copre lo slot mappa dentro `GameFrame` lasciando visibili le lastre HUD fisse (Risorse, Orologio/Giorno, Menu, Nav Plinth, Roster/Pannelli se aperti), mentre `PixiWorldMap` resta montato sotto per evitare il teardown/ricreazione del contesto WebGL2 (`PLAN-031` perf gate).
2. **Tooltip Hover-Pinnable (contratto `hud_component_guide.md` §5b.7, R-172):** poiché il tooltip sull'icona dell'edificio contiene valori di upgrade e, per Warehouse/Emporio, l'azione per aprire `VillageStashPanel` / `MerchantPanel`, il tooltip rispetta il contratto *hover-pinnable* del progetto (140ms grace al passaggio del mouse, pulsante pin e chiusura `X`, `SkinScope` + `data-hud-controls` sul root per trappola **T-03**).
3. **Inpainting locale + WebP per `villaggio.png`:** il watermark Gemini in basso a destra viene rimosso tramite patch-healing locale dei soli pixel della losanga (senza croppare i bordi dell'immagine 21:9), verificato a occhio nel browser reale (**T-04**).
4. **Aggiornamento del contratto `PLAN-032 SP-2/SP-3`:** il marker `building-stash` viene rimosso da `anchors` in `game-frame-pixi.tsx` (e i relativi test di SP-2 vengono aggiornati di conseguenza); la scorciatoia `v` e il menu Pannelli continuano a funzionare.
5. **Invarianti tecnici:** tutti i dati degli edifici (10-11 edifici, livelli, costi in `wood/iron/gold/food`, valori effetto, coordinate pin su `villaggio.png`) vivono in un modulo config validato con **Zod** (`villageBuildingsConfig.ts`, `deepFreeze`); tutte le stringhe usano `react-i18next` (`en` + `it-IT`) con sintassi ICU `{var}` (**T-11**).

### Still unresolved
- **Tasto rapido da tastiera:** se il tasto `v` debba aprire direttamente la vista `Village` o restare sul `VillageStashPanel` (default nel piano: `v` resta su `villageStash` nel registry `HUD_PANELS` per non rompere `PLAN-032-SP-2`, mentre `Esc` nella vista `Village` senza pannelli aperti riporta a `Map`).
- **Layout delle icone su `villaggio.png`:** calibrazione visiva a schermo in `1440×900` e `1280×800`.


---

## v31 — Workflow single-agent: kanban/dispatch in pausa, chiusura a contratto

**Status:** `FROZEN`
**Date:** 2026-10-16
**Authorized by:** Fausto
**Reason:** direttiva verbatim in sessione — "x adesso meti questa roba in pausa, in caso c servirà lo reimplementeremo secondariamente. quindi metti nei plan, nelle skill e qualsiasi altro riferimento di nn usare + il kanban e cose del genere. si crea un plan con un contratto, si implementa con l'agente locale in devin desktop, si controlla il contratto per vedere se tutto è stato fatto correttamente e basta"

**Formulazione approvata (FROZEN):**
La kanban board, il dispatch coordinator/ai-worker/harness e la pipeline
prompt-spec sono **in pausa**: non fanno più parte del workflow operativo e
non vengono cancellati (riattivazione solo su decisione esplicita del
Director, informata dal benchmark PLAN-039). Il ciclo operativo è:
**plan con contratto di verifica → implementazione con l'agente locale
(Devin Desktop) → controllo del contratto (`verify:bundle` → `bundle.json`)
→ chiusura `fatta` in `RICHIESTE.md` con citazione bundle.** Il gate
meccanico di chiusura resta attivo come `closure:lint` (ex `kanban:lint`,
solo gate R-189 su RICHIESTE/board-diff). Ledger operativo: `RICHIESTE.md`
+ `plans/INDEX.md`.

---

## v32 — Verifica comportamentale meccanica: da fatica del Director a gate (piano S0–S5)

**Status:** `FROZEN`
**Date:** 2026-10-17
**Authorized by:** Fausto — *"avallo"* (2026-10-17)
**Provenance:** bozza prodotta dal dibattito multi-AI `20261017-s0s5-debate` in mind-weaver (CONVERGED su `artifact-r002`) + ruling Director seq 50-51
**Reason:** il Director perde tempo nel ciclo "agente dichiara fatto → lui ritesta → fallisce → rispiega → ripete". Esiste già la materia prima (`verify:bundle` + `closure:lint`, CTR-001..004 con `components`, `.mw/regression/`, `recurring-traps.md` T-01..T-15); manca il binding meccanico file→check e la fase BV dentro le skill.

**Formulazione (bozza — da congelare):**

*User-stated (fonte: desiderata v52 mind-weaver + dibattito + ruling)*

1. Ridurre la fatica di verifica del Director: meno difetti trovati da lui dopo il "concluso", non una review in più.
2. Le verifiche diventano **gate meccanici fail-closed** dentro il circuito `verify:bundle`/`closure:lint` esistente — nessun secondo giudice LLM.
3. Un file toccato senza superficie mappata richiede una **disposition esplicita** (mappatura o `coverage_exception` auditabile); il bundle è ROSSO senza.
4. `coverage_exception` su comportamento non verificato → **gate bloccante `awaiting_director`** fino a `director_answer` (nessuna auto-approvazione dell'agente).
5. Bugfix: test di riproduzione prima del fix, con hash del file **e hash dell'output della run rossa**; modifiche legittime → nuova riproduzione protocollata, mai mutazione silenziosa.
6. Baseline rossa su superfici non toccate: **nessun escape hatch** — si ripara; se i presupposti del test non sussistono più, il test va **scartato** (rimozione registrata).
7. `verifier.json` = receipt generato da script (exit code + hash check legati all'albero finale); schema backward-compatible; giudizio LLM solo advisory.
8. La fase BV entra nelle skill: planner shift-left (CTR+traps delle superfici toccate → acceptance criteria), executor gate di chiusura meccanico; decision report con campi `resolved`/`open`/`escalated` (schema-check, contenuto advisory).
9. Misura: `found-by: agent-bv|director|gate` — quota `director` → ~0 in ~5 plan; tool AI a pagamento solo se resta gap misurato.

*Riferimento piano:* `.mw/runs/20261017-bv-rpg-critique/plan-s0-s5.md` (mind-weaver, status converged r003). Slice usabili singolarmente: S0 igiene AGENTS → S1 `contracts:check` nativo → S2 red-first lockato → S3 verifier.json receipt → S4 BV nelle skill → S5 dogfood+metrica.

*Still unresolved*
- Forma operativa della risposta Director a `awaiting_director` nel repo RPG (il meccanismo `director_answer` esiste nel runtime di dibattito mind-weaver; in RPG serve la porta equivalente nel circuito bundle/skill).
- Budget di completezza del mapping file→superficie per /game.

---

## v33 — Gate d'intento alla chiusura: risultato vs desiderata e chiarimenti, non solo vs plan

**Status:** `FROZEN`
**Date:** 2026-10-17
**Authorized by:** Fausto
**Reason:** Director, verbatim: *"rispetto a quello che voglio cm implementazione o fix, il risultato finale nn sia soddisfacente o sbagliato. il risultato nn deve essere misurato rispetto al plan e basta, ma anche rispetto alla desiderata e chiarimenti del director, magari controllato con ai esterne o qualcosa del genere x essere oggettivo"* — e: *"se alla conclusione del plan, il risultato finale nn è allineato alla desiderata, significa che qualcosa è andato storto nel planning o dopo, e va rifatto. nn è un plan concluso."*

**Formulazione (bozza — da congelare):**

*User-stated*

1. Il risultato finale di un plan è misurato rispetto alla **desiderata FROZEN + chiarimenti del Director**, non solo rispetto al plan e al suo contratto.
2. Se a conclusione il risultato non è allineato alla desiderata → qualcosa è andato storto nel planning o dopo → **va rifatto: non è un plan concluso.**
3. Il controllo d'allineamento può essere affidato a **AI esterne** o meccanismo equivalente, per obiettività.

*AI inference (bozza)*

4. **Gate bloccante su `fatta`/`completed`**, stesso rango di `closure:lint`: nessuna chiusura senza `intent PASS` o `waived-director` esplicito del Director.
5. **Intent ledger per task** (es. `.mw/runs/<task>/intent.md` creato all'avvio): slice della desiderata FROZEN pertinente + richiesta verbatim + ruling Director emersi in sessione. Ogni item mappa su obbligazione tecnica (`verification.json`), `intent-check`, o `human-eye` — coverage per-ID (pattern T-06).
6. **Audit in contesto pulito**: il revisore (AI esterna via `mw-ask`/broadcast o clean-context come `verifier.json`) riceve ledger + artefatti di evidenza, **non il diff**; per ogni item: `covered | gap | unverifiable` con citazione dell'evidenza. `gap`/`unverifiable` → blocco o escalation al Director.
7. **Confine onesto del giudice AI:** l'audit copre fedeltà/copertura dei requisiti dichiarati; il giudizio estetico/"soddisfacente" resta `human-eye` + signoff Director. Il check riduce i miss d'intento, non sostituisce il veto del Director.
8. **Diagnosi obbligatoria su fallimento:** intent rosso → la chiusura riporta se il disallineamento nasce nel plan (re-planning) o nell'esecuzione (re-implementazione) — il rework riparte dal punto guasto, non dal "non concluso" generico.
9. **Relazione con v32:** v32 copre l'asse contratto→evidenza (gate meccanici, *nessun giudice LLM*); v33 copre l'asse intento→risultato (giudice LLM ammesso, solo qui). I due gate sono cumulativi: `fatta` richiede bundle PASS **e** intent PASS.

*Decisioni Director (2026-10-17)*

10. **Revisore = pannello di AI esterne** (multi-provider, come i dibattiti web), non singolo modello.
11. **Check d'intento anche shift-left:** il plan viene controllato contro desiderata+chiarimenti **prima del battesimo** — l'errore di planning si paga una volta, non due.
12. **Slice FROZEN, mai il file intero — invariante globale:** nessun tool, skill o agente può passare l'intero `desiderata.md` a un modello/revisore; si passa **solo la versione FROZEN pertinente** estratta in file dedicato (precedente operativo: v49 estratta a mano per PLAN-060). Da fixare in tutti i consumatori (`mw-critique-plan.py` — bug noto T-014/PLAN-062, `mw-iterative-deliberate.py` con `--desiderata`, dibattiti web, skill che citano `--desiderata`). Lista completa dei consumatori da auditare nel plan.

*Still unresolved*
- Posizione del ledger (`intent.md` nella run dir vs sezione del manifest) e meccanismo di voto del pannello (maggioranza vs unanimità su `gap`).

---

## v34 — Cinematica delle scene quest: depth-parallax sistematico + regia dei beat

**Status:** `FROZEN`
**Date:** 2026-10-17
**Authorized by:** Fausto — *"procedi"* (2026-10-17, avallo sulla formulazione proposta presentata in sessione)
**Reason:** richiesta Director in sessione 2026-10-17 — *"x le immagini che stiamo
usando cm asset x le quest (cinematografiche, ecc). potresti prenderle e dividerle
in vari layer e fare degli effetti di parallasse per ciascuna, sistematicamente?
[...] Oppure sarebbe meglio generare le immagini direttamente cm prompt che danno
i layer distaccati e il parallasse? [...] Sei un lead UI senior designer [...] fa
una ricerca online, dammi una critica spietata e costruttiva [...] Poi proponi
delle soluzioni a tua volta, cn esempi di codice"* — e poi *"tutte, plan multi ai
web"*.

*Esplorazione svolta (sintesi):* ricerca online su stato dell'arte (layer
decomposition = ricerca 2025 non production-ready; parallasse 2.5D via depth map
= commodity matura; text-to-layered = research, non affidabile su scene
pittoriche) + audit del codice (Theater/StageBand = `<img>` DOM con Ken Burns +
cinemaFx config-driven; `DESIGN_PILLARS.md` §1 vieta parallasse a quad full-canvas
e prescrive deformazione in-place, v21). Direzione ibrida proposta e scelta dal
Director con *"tutte"*.

*User-stated*

1. Valutare e migliorare la qualità cinematografica delle immagini usate come
   asset delle quest (scene in `Theater`/QuestRunWindow e `StageBand`/S1 lab).
2. Il Director vuole **tutte** le parti della proposta ibrida presentata, e il
   piano prodotto tramite **dibattito multi-AI web**.

*AI inference (marcata)*

3. *"tutte"* = la direzione ibrida completa: (A) depth-parallax sistematico via
   depth map, (B) camera diretta dal beat, (C) overlay atmosferici separabili,
   (D) cutout 2-layer manuale solo su poche scene hero — più la dimostrazione
   tecnica su scena reale come prima slice.
4. Accettando la critica, restano fuori: slice sistematico in N layer dei raster
   esistenti; generazione "layered by prompt"; video loop AI (parcheggiato,
   candidato futuro per il trailer).
5. Scope: superfici quest (`Theater`, `StageBand`). La mappa mondo NON è in scope
   (già governata dalla decisione pillar + v21).
6. Vincoli ereditati: config-first (`questTheatreFx`/`atmosphereAssets`),
   reduced-motion ⇒ nessun effetto (I-5), token skin, budget WebView/Tauri
   profilato, verifiche solo headless/background (CTR-foreground-001).

*Still unresolved (delegati al dibattito/piano, non bloccano il freeze)*

- Quali scene hero ricevono il cutout 2-layer (scelta Director o proposta del piano).
- Ampiezza di drift, overscan e budget percettivo (da tarare sullo spike).
- Forma runtime del depth-parallax nel Theater (canvas Pixi vs WebGL minimo vs
  altra tecnica) — decisione tecnica delegata al piano.
- Se la depth bake entra nella pipeline `rpg-gen-mockup.py` o resta script separato.
- Criterio "abbastanza cinematografico": eye-check del Director sulla demo.

**Formulazione approvata (FROZEN):**
<!-- REQ:v34-goal -->Le scene quest su /game guadagnano qualità cinematografica
percepita in modo **sistematico** su tutti gli asset presenti e futuri, non solo
su casi singoli.<!-- REQ:v34-depth -->Parallasse via **depth map precalcolata**
per asset (es. Depth Anything V2 o equivalente) con **deformazione in-place dei
pixel** — coerente con DESIGN_PILLARS §1 (niente translate di quad interi;
ampiezza contenuta + overscan per non esporre bordi).<!-- REQ:v34-camera -->Mosse
di camera dirette dal tipo di beat (es. push-in su combat/harm, pan su viaggio,
hold+letterbox su dialogo, zoom su verdict), config-driven in `questTheatreFx`.
<!-- REQ:v34-atmo -->Overlay atmosferici separabili per scena (nebbia, luce,
particelle) — la classe di layer che i pillar ammettono in parallasse.
<!-- REQ:v34-cutout -->Cutout 2-layer manuale riservato a un piccolo set di scene
hero scelte dal Director (cutout + inpaint via pipeline locale esistente).
<!-- REQ:v34-exclusions -->Escluse: slice sistematico in N layer dei raster
esistenti; generazione layered-by-prompt; video loop AI.<!-- REQ:v34-slice -->
Prima slice verticale: **spike dimostrabile** del depth-parallax su una scena
reale (Theater o lab), valutabile a occhio dal Director prima dell'estensione al
catalogo.<!-- REQ:v34-invariants -->Config-first, reduced-motion ⇒ nessun
effetto, skin token, budget WebView profilato, verifiche headless.

## v35 — Visual fork gate: nessuna scelta estetica silenziosa dell'agente

*User-stated*

1. Quando un task crea o modifica elementi grafici e sono possibili
   rappresentazioni materialmente diverse, l'agente non sceglie a priori:
   prepara opzioni (default 2, max 3) con documento comparativo e preview
   visibile; il Director seleziona o rigetta.
2. Il risultato finale è misurato rispetto all'opzione selezionata iniziale
   (baseline congelata + emendamenti approvati).
3. Se non serve fork, l'agente dichiara lo skip con un puntatore verificabile.

*AI inference (marcata)*

4. Il fork vive in esplorazione (`mw-explorer`); fork scoperti in planning
   attivano `INTENT_GATE_VISUAL_FORK` in `mw-planner` (stop → ruling → resume
   sullo stesso draft).
5. Verifica ibrida: misure meccaniche same-viewport + giudizio umano; l'occhio
   del Director prevale sulla metrica (T-04).
6. Varianti scartate fuori dal tree di produzione; spike visuali con lifecycle
   dichiarato (`promote|remove`, default remove); un plan → un bundle (v31).
7. Preview = pagina servita su localhost aperta dal Director (Preview tab di
   Devin Desktop suggerita), mai apertura automatica (regola 16).
8. Enforcement meccanico: `closure:lint` fallisce su bundle che toccano file
   visivi nel diff reale senza copertura `visual-fork:` (card scope list o
   skip puntato) nel plan.

**Formulazione approvata (FROZEN):**
<!-- REQ:v35-fork -->Quando un task crea o modifica elementi grafici e sono
possibili rappresentazioni materialmente diverse (gerarchia, composizione,
densità, affordance), l'agente non sceglie a priori: prepara opzioni (default
2, max 3) con documento comparativo e preview visibile su localhost; il
Director seleziona o rigetta.<!-- REQ:v35-baseline -->Il risultato finale è
misurato rispetto all'opzione selezionata iniziale: baseline congelata con
hash+provenance + ledger emendamenti approvati dal Director.
<!-- REQ:v35-skip -->Se non serve fork, l'agente dichiara lo skip con un
puntatore verificabile (riferimento frozen citato, rappresentazione unica
nominata, o perimetro file non-visivo); uno skip senza puntatore è un difetto.
<!-- REQ:v35-verifica -->Verifica ibrida: obbligazioni same-viewport
pre-registrate + human-eye su artefatto side-by-side; l'occhio del Director
prevale sulla metrica (T-04); variante scartata mai in produzione; spike
visuale effimero salvo promozione dichiarata nel plan.

*Origine:* R-216; PLAN-047 (battezzato 2026-10-18); dibattito multi-AI web
converged `mind-weaver/.mw/runs/20261018-visual-fork-gate-debate/`
(artifact-r003, 5/5 ACCEPT). Implementazione: skill mw-explorer / mw-planner /
painter / mockup-generator + template `.mw/templates/visual-fork/` +
estensione `closure:lint`.

---

## v36 — Sistema vivo di contratti per-componente, integrazioni e test sincronizzati su `/game`

**Status:** `FROZEN`
**Date:** 2026-10-18
**Authorized by:** Fausto — *"procedi"* (2026-10-18, avallo sulla candidata v36 presentata in sessione)
**Reason:** il Director vuole evitare che la lista dei bug UI si allunghi e che vecchi bug si ripresentino a ogni ritocco di layout, estendendo la copertura a tutti i componenti e alle integrazioni di `/game` con un ciclo vivo di aggiornamento sincronizzato tra documentazione, contratti di interazione e test.

*User-stated*

1. Fare un audit di tutto ciò che è in `/game`, avere un documento per componente su come si deve comportare e test di validazione che controllino tutto ciò che deve fare e come lo deve fare.
2. Avere un documento di integrazione per le interazioni con gli altri componenti con cui può interagire.
3. Poiché il progetto è in divenire, quando si aggiorna un componente e cambia un comportamento, vanno aggiornati il documento e testato/modificato il test corrispondente.
4. Quando il Director dice *"questa cosa è un bug"* o chiede un comportamento specifico, questo va aggiunto al documento su come deve comportarsi / come devono interagire i componenti e, quando applicabile, va aggiunto o aggiornato il test automatico.
5. Produrre il piano tramite dibattito **Multi-AI web** (`mw-web-debate`).

*AI inference (marcata)*

6. **Riuso senza duplicazione (DRY / `40-documentation-governance`):** l'inventario meccanico di `/game` e le bozze `SCHEDA` di `PLAN-043 WS-5` (`S11`/`S12`), `COMPONENT_MASTER_INDEX.md`, `.mw/contracts/` e `.mw/surface-map.json` vengono unificati o collegati invece di creare un secondo registro parallelo.
7. **Granularità dei documenti d'integrazione:** i contratti d'integrazione coprono i flussi/accoppiamenti reali tra componenti su `/game` (es. `PixiWorldMap ↔ GameFrame HUD`, `Roster ↔ SlotRack ↔ QuestExpeditionDetail`, `QuestExpeditionDetail ↔ TimeEngine ↔ MapQuestPoi`, `QuestRunWindow ↔ Astrolabe ↔ Settlement/HUD`, `VillageScreenView ↔ VillageRegistry ↔ Stash/Merchant`), non il prodotto cartesiano di coppie che non interagiscono.
8. **Binding meccanico con i gate esistenti (`PLAN-044` / `PLAN-051`):** l'aggiornamento sincronizzato `codice ↔ doc componente/integrazione ↔ test` si aggancia a `.mw/surface-map.json`, `contracts:check`, `red-first` e `closure:lint`, distinguendo tra:
   - *bug* (comportamento rotto rispetto al contratto o segnalato dal Director → test rosso prima del fix + aggiornamento doc/contratto + fix verde),
   - *evoluzione intenzionale di comportamento* (aggiornamento esplicito di doc/contratto + aggiornamento test nello stesso task, mai test mutato in silenzio).

*Still unresolved (delegati al dibattito Multi-AI web)*

- Struttura esatta dei file (se 1 file per componente + 1 file per contratto d'interazione sotto `src/docs/docs/game_surface/` o `.mw/contracts/`, e come evitare esplosione di boilerplate).
- Come verificare meccanicamente che una modifica comportamentale a un componente abbia aggiornato anche doc + test senza bloccare i refactor puramente interni.
- Strategia di migrazione/ritiro delle vecchie spec e suite legacy (`/poi-quest-detail-roster-time-clock`) rispetto a `/game`.

**Formulazione approvata (FROZEN):**
<!-- REQ:v36-audit-components -->Su `/game` ogni componente attivo ha una scheda/contratto vivo che definisce cosa deve fare e come, collegato ai propri test di validazione;<!-- REQ:v36-integration-contracts --> le interazioni reali tra componenti sono coperte da contratti d'integrazione dedicati e test automatici collegati, a partire dall'audit completo di `/game`.<!-- REQ:v36-living-sync --> Il sistema è mantenuto vivo: (1) ogni modifica che altera il comportamento di un componente o di un'interazione deve aggiornare contestualmente il documento relativo e aggiungere/modificare il test collegato;<!-- REQ:v36-bug-or-spec-capture --> (2) ogni volta che il Director segnala un bug (*"questa cosa è un bug"*) o richiede un comportamento specifico, la regola viene aggiunta al documento del componente/integrazione e protetta da test automatico;<!-- REQ:v36-mechanical-binding --> (3) l'enforcement si integra nei gate meccanici esistenti (`surface-map`, `contracts:check`, `red-first`, `closure:lint`) senza duplicare i registri.<!-- REQ:v36-web-debate --> Il piano esecutivo viene definito tramite dibattito Multi-AI web (`mw-web-debate`).


## v37 — Astrolabio: silhouette a famiglia uniforme per board, morph accoppiato

**Status:** `FROZEN`
**Date:** 2026-10-23
**Authorized by:** Fausto — *"approvo"* (avallo sulla candidata in sessione, dopo i ruling
sulle soglie 10%/35% e sulla copertura qualitativa)
**Reason:** la forma deforme ricorrente nelle quest — valli scavate fin quasi al nucleo con
punte tonde — e' il quadrante proibito che la v17 e PLAN-010 avevano gia' chiuso per
costruzione e che `starProfile.ts` di V6.2 ha resuscitato disaccoppiando mix e depth.

**Relazione con v16/v17:** la v16 aveva sciolto le tre famiglie discrete («la stella
dimagrisce per gradi, ogni petalo col proprio delta») e vietato il ritorno alla famiglia
discreta. Questa desiderata **revoca quel divieto**: la famiglia torna discreta ma decisa
**a livello di board**, non per petalo — le punte continuano a variare nelle proporzioni.
Della v17 restano l'accoppiamento morph (punta tonda ⟺ valle alta) e l'impossibilita'
costruttiva del quadrante proibito; cade la semantica «coverage-wins» come pilota della
forma — la silhouette diventa un glifo qualitativo.

### User-stated (parole del Director)

1. «Peggore e' il delta x il party = fiore (il party e' in difficolta'), party un po' +
   forte = stella. Molto + forte = stella magra.»
2. «Sopra il 10% stella, sopra il 35% stella magra» — il margine e' stat vs difficolta'.
3. «Nn voglio c sia differenza tra le forme scelte» — tutte e cinque le punte sono della
   stessa famiglia; «il mezzo fiore strano nn deve apparire mai, alcune punte fiore e
   alcune punte stella nemmeno».
4. «Se la maggioranza delle stat sono + grandi [...] tutte le punte sono a forma di stella.
   Se invece no sono tutte a forma di fiore» — la famiglia si decide a maggioranza.
5. Ogni vertice ha costruzione propria nelle proporzioni: le lunghezze delle punte seguono
   le stat reali per asse.
6. Copertura dipinta: «circa gia' funziona cosi' cambiando le forme, lo stiamo rispettando»
   — glifo qualitativo, nessun solver esatto.

### AI inference (derivata, marcata come tale)

7. Ogni asse vota la propria famiglia dal margine (fiore <10%, stella 10-35%, magra >35%);
   il board prende il livello piu' alto che raggiunge la maggioranza (≥3 assi >35% ->
   magra; altrimenti ≥3 assi >10% -> stella; altrimenti fiore). Con una sola skill gli assi
   coincidono.
8. L'accoppiamento morph di `coverage.ts` (PLAN-010 CP-C) e' la forma della soluzione: un
   solo parametro decide insieme profondita' di valle e forma della punta — il quadrante
   «valle profonda + punta tonda» non e' costruibile.
9. Bande di valle di partenza: fiore ~0.42-0.55, stella ~0.15-0.30, magra ~0.15 — numeri
   da battezzare sui test visuali.

### Cosa questo NON autorizza

- nessuna forma fuori dalle tre famiglie (nessun mezzo-fiore, nessun disco con fessure,
  nessuna "blade");
- nessuna famiglia diversa per petalo;
- nessuna rimozione della stella magra («la stella magra ci serve, nn dobbiamo toglierla»);
- nessun cambio a verdetto o probabilita' (`skills`, `check.score` invariati — la
  silhouette e' display-only).

### Still unresolved

- bande di valle esatte e raggio di stiramento della stella magra — si battezzano sui
  test visuali della pagina V6.2.

**Formulazione approvata (FROZEN):**
<!-- REQ:v37-family-uniform -->La silhouette dell'astrolabio appartiene a una sola famiglia
per board — fiore | stella | stella magra — decisa a maggioranza delle stat reali per
asse;<!-- REQ:v37-thresholds --> soglie sul margine stat/difficolta': sopra il 10% stella,
sopra il 35% stella magra, altrimenti fiore;<!-- REQ:v37-morph-coupled --> profondita'
della valle e forma della punta sono accoppiate per costruzione: nessuna forma con valle
profonda e punta tonda, nessuna mescolanza di famiglie sullo stesso
board;<!-- REQ:v37-tip-lengths --> le lunghezze delle punte restano per-asse e seguono le
stat reali;<!-- REQ:v37-coverage-glyph --> la silhouette e' un glifo qualitativo — la
copertura dipinta e' approssimata dalla famiglia, nessun solver esatto.

## v38 — Expedition planning UI: assorbimento strutturale del mockup approvato

**Status:** `FROZEN`
**Date:** 2026-11-15
**Authorized by:** Fausto — *"approvato"* (avallo sulla candidata presentata in sessione,
dopo il dibattito multi-AI `20261115-wanderlust-ui-plan` e i ruling D6 edge-tab /
D10 Chronicle top-right)

### User-stated (parole del Director)

1. «xò come prima parte in assoluto voglio che sia l'assorbimento d questo mockup di
   di gpt, o come fase iniziale o come subplan 1. approvo» — il mockup ChatGPT è la
   baseline di direzione (registrato in `.mw/specs/expedition-ui/refs/`).
2. «mi piaceva l'idea di aver qualcosa che occupasse "meglio" la parte morta a destra» —
   il componente expedition è un cassetto/console ancorato al bordo destro, non una
   finestra flottante.
3. «da qui possiamo prendere un village stash migliorato» — stash come superficie a
   griglia + filtri + card dettaglio (contenuto del mockup stash-grid).
4. «per adesso voglio che sia in alto a destra e il resto si sposti a sinistra, poi si
   vede, niente tab pendente» — la superficie eventi futuri (Chronicle) è docked
   top-right; il top chrome si sposta a sinistra.
5. La mappa resta protagonista: niente superfici che la coprono senza motivo.

### AI inference (derivata, marcata come tale)

6. Lo stash vive come tab segmentato Roster|Stash nella colonna sinistra docked — il
   reliquiario centrale flottante del mockup è veto-adjacent (no-popup); il contenuto
   (griglia, filtri, dettaglio) si porta dentro il tab.
7. Stati minimi inclusi nella stessa fase perché economici ora: CTA disabilitata +
   motivo inline, slot party vuoto/pieno, empty-state edge-tab (D6 mode b), journey
   "N days" + totale.
8. Bag slot render-only in questa fase (assegnazione → S2).
9. Tutto via skinConfigRegistry, config Zod, i18n EN/IT, primitivi esistenti —
   implementazione conforme a artifact-r004 (`20261115-wanderlust-ui-plan`).

### Cosa questo NON autorizza

- popup/modal/overlay che coprono la mappa;
- modifiche a regole gameplay o meccaniche quest;
- alterare `QuestRunWindow` o superfici run;
- tipografia sentence-case, food-cost preview, bag-assign interattivo, accenti
  blu/verde, port della Chronicle (slice successive).

### Still unresolved

- forma finale della superficie Chronicle («poi si vede» — S1 riserva solo la zona
  top-right via token);
- estetica del dettaglio stash dentro il tab (griglia piena vs righe — si battezza
  in esecuzione sulla larghezza reale della rail).

**Formulazione approvata (FROZEN):**
<!-- REQ:v38-mockup-absorption -->Subplan 1 = assorbimento strutturale del mockup
ChatGPT su `/game`:<!-- REQ:v38-drawer-docked --> drawer expedition docked
flush-right (token clamp 360/23vw/460), canvas full-bleed con insets via Zustand e
pan/zoom clamp al rettangolo libero;<!-- REQ:v38-left-column --> colonna sinistra
Roster|Stash a tab segmentati, persistente di default, mutua esclusione ≤1100px;
<!-- REQ:v38-top-chrome --> top chrome snellito a sinistra, zona top-right riservata
alla futura Chronicle docked (niente tab pendente);<!-- REQ:v38-states --> stati
minimi: CTA disabilitata+motivo, slot party vuoto/pieno, empty-state edge-tab,
journey "N days"+totale;<!-- REQ:v38-invariants --> tutto via skinConfigRegistry,
config-first, i18n EN/IT, primitivi esistenti; niente overlay sulla mappa.
