# POI Sigillo — brief di design unico (explorer, 2026-10-20, R-234)

> Richiesta: un solo brief per il marker POI quest («Sigillo») su `/game` e per ogni interazione intorno: stati, rischio, famiglia, tempo, comparsa, hover/focus, click → planner, tastiera, tanti POI insieme, tutti i biomi, reduced-motion. Poi una visual fork e lo stop per il ruling.
> **Aggiornato 2026-10-22.** Dopo il brief il Director ha rigettato la fork sul rischio e ha guidato il lavoro sul marker reale: vedi «Stato delle decisioni» qui sotto. Le sezioni 1–8 sono la fotografia misurata del 2026-10-20 (prima delle modifiche).
> Catture: `shots/poi-brief/` (`applied/` = marker dopo le modifiche) · card della fork rigettata: `.mw/runs/20261020-poi-explorer/visual-fork-poi-sigillo.md`.
> Legenda: **FATTO** (visto o misurato in questa sessione) · **CODICE** (letto nel sorgente, non visto) · **NON VERIFICATO**.

## Stato delle decisioni (2026-10-20 → 2026-10-22)

**Decise dal Director e già nel codice** (commit `fe915c6c`, `96316c07`):

| Cosa | Decisione | Dove |
|---|---|---|
| Rischio sulla sagoma (corna, orlo dentato) | **bocciato**: «non è nelle richieste» | fork rigettata, §9 |
| Filo bianco del bordo | tolto: la linea interna prende il metallo della famiglia | `poiSigilloFamilies.ts`, token `--skin-poi-border-inner` |
| Metallo della ghiera per famiglia | quest **bronzo**, lavoro **avorio**, attività **acciaio** (il teal fu provato e sostituito dall'avorio) | `poiSigilloFamilies.ts` |
| Campo dietro il glifo | pergamena, poi virato **sabbia/beige** `#d3be91 → #b09866`; il campo scuro e il colore diverso per famiglia sono stati scartati | tema `stoneColors` |
| Glifo | leggermente più grande (42 su 86) | `PoiMatericV3_5.tsx` |
| Halo di lavoro | da menta neon a **argento lunare** `#9fb3c4`, stesso bagliore | token `--skin-poi-halo-work` |
| Pallino rosso «decisione in attesa» | **eliminato**; la segnalazione sul POI non esiste più | `MapQuestPoi.tsx` |
| Hover | **scintillio** di 5 lettere dell'orlo, non un giro completo | `PoiMatericV3_5.tsx` |
| Percorso del party | arriva al POI e **passa sotto** il marker; bronzo; **puntinato** davanti al party, **pieno** dietro con un luccichio; **serpentina** (curva con seme per run) invece della retta; niente sigillo di destinazione | `QuestJourneyRoute.tsx`, `questJourney.ts` (`meanderWaypoints`), `PixiWorldMap.tsx` |

**Verificato:** test Sigillo 11/11, route/journey 116/116 (working tree), tsc pulito sui file toccati; catture reali 1440×900 in `shots/poi-brief/applied/`; dalla misura DOM in movimento: lo scintillio compare per ~1 s con al massimo 2 punti contemporanei, il luccichio scorre sul tratto percorso in ~3 s e riparte.
**Non verificato:** Tauri; il luccichio e lo scintillio *a occhio in movimento* (solo misura del DOM e fotogrammi); più di 4 POI contemporanei; la serpentina con altri semi e altre posizioni di POI; il marker a 1280×800 dopo le modifiche.

**Ancora aperto:**
1. Segnale per una **decisione in attesa** (dopo la rimozione del pallino): occhio d'ottone (6b) o solo pannello. Il Director ha risposto «va bene così» (2026-10-22): per ora nessun segnale sul marker.
2. **Glifi dipinti di lavoro e attività:** mancano; sul marker c'è ancora la croce dorata. Brief per generarli: [POI_glifi_mancanti_brief.md](POI_glifi_mancanti_brief.md).
3. **Interazioni del brief non fatte:** focus da tastiera nella materia (oggi il quadrato blu del browser), etichetta accessibile con lo stato della spedizione, comparsa che ignora `prefers-reduced-motion` (scala 0,7→1 ancora attiva), costo DOM con tanti POI (~227 nodi a riposo, fino a ~1 400 con l'halo; ~10 filtri con id fissi duplicati per istanza).
4. **Forme per famiglia (tessera, rombo):** su `/game` esiste solo la quest; il Director ha chiesto «a cosa servono?» e non ha deciso se tenerle.
5. **Contrasto del glifo sul campo sabbia:** la croce dorata si legge male (placeholder in attesa dei glifi veri); tenda e rovine reggono.
6. **La fork B4-map** (palette per famiglia, campo, comparsa) resta di un'altra sessione; le sue conclusioni su campo e metalli sono state in parte assorbite dalle decisioni sopra, ma non c'è un suo ruling.

## 0. Cosa decide il Director e cosa è già deciso

**Già deciso (non si rimette in discussione qui):**

| Fonte | Cosa fissa |
|---|---|
| desiderata **v3 FROZEN** (`.mw/desiderata.md:91`) | il tempo è un **cerchio magico che si scrive attorno al POI** dalle ore 12, lettera per lettera, **senza binari né cerchio preesistente** |
| PLAN-058 T4.1/T4.2 + `poi_family_spec.md` §Sigillo | bordo doppio (scuro 2 px + avorio 1,5 px) = farsi vedere; **sagoma = famiglia** (tondo con coda = impresa, rombo = minaccia); **taglia S/M/L = posta in gioco**; glifo = luogo (mai la croce); alone = tempo, solo tempo; vermiglio solo per l'urgenza; lettere incise **invariate** (D7) |
| Director Q2 2026-10-13 | scaduto = sparisce senza pulsare |
| ruling **POI-T = B** 2026-10-20 | **«la sagoma dice il rischio»**, niente testo sul marker (il mockup v3 lo mostrava con corna che crescono e ottone → brace) |
| guida HUD regola **6b** | niente cerchi con simbolo, niente pallini di stato, niente semaforo verde/rosso; uno stato è la **sagoma di un oggetto** in ottone/inchiostro; il ferro è l'unico neutro |
| CTR-game-008 | su `/game` esiste solo la famiglia quest; `job`/`training`/… sono deprecati |

**Da decidere (fork, §9):** come la sagoma porta il rischio **senza** rubare il posto alla famiglia e al tempo. Le opzioni sono tre perché la B4-map C (tempo sul bordo della sagoma) va riconciliata con il ruling POI-T.

**Fuori da questa fork:** palette per famiglia, campo e comparsa (la fork B4-map, in attesa del suo ruling e di un'altra sessione: non toccata).

## 1. Il marker oggi, misurato (FATTO salvo dove detto)

Catture `shots/poi-brief/` sul server proprio (porta 5207, config dell'audit, WebGL Metal headless).

| Cosa | Esito |
|---|---|
| Al boot | 1 POI (goblin) a 1,06 s; il secondo (rovine) a 6,0 s. Comparsa: opacità 0→1 e scala 0,7→1 in ~0,9 s, 15 passi misurati a 50 ms. **Fluida.** |
| Comparsa con `prefers-reduced-motion: reduce` | **identica**: scala 0,7→1 in ~0,9 s (`entrance-reduced-motion.json`). Solo la scrittura dell'alone salta (CODICE, MQP:175). |
| Riposo / hover | nessun tooltip; l'hover cambia poco (F3: 6,7% dei pixel). `poi-rest-hover-focus.png` |
| Tastiera | il POI è il **primo stop di Tab** della pagina; Enter apre il planner. **Il focus è il contorno blu del browser**, un quadrato, fuori materia. |
| Etichetta | `aria-label` «Goblin Extermination — open the quest» **in ogni stato** (anche in corso). Dentro c'è un secondo `role="img"` con l'etichetta di ripiego «Resident medal» (CODICE, V35:522-524). |
| Click | apre il planner (offerta) o la finestra della run (run viva) — CODICE, `useQuestExpeditionSession.tsx:960-967`. |
| Glifi | goblin = tenda dipinta; rovine = colonne, che a 55 px si leggono come uno **stivale** (F5). Le famiglie senza glifo per POI cadono sulla **croce** (`icon_<type>.webp` non esiste). |
| Run in corso, andata | **il disco-bersaglio del percorso (anello con punto) copre il glifo del POI.** `poi-run-andata-svolgimento.png` sinistra. |
| Run in corso, sul posto | **il gettone del party si posa sul glifo**: per tutta la run il POI non dice più cos'è. A destra. |
| Alone di lavoro | verderame, sulla mappa si legge **ciano** (la lente L4 di F5 lo conta fuori palette). |
| Decisione in attesa | **pallino rosso di 14 px** in alto a destra, mezzo nascosto dall'alone (regola 6b). |
| Costo DOM | **227 nodi e 6 `<filter>` per marker a riposo**; con l'alone ~+1 200 nodi (CODICE, stima dell'esploratore: 2 bande × 100 lettere). Filtri con id fissi (`f-dp`, `f-gl`, `f-glow`, `f-patina`, `f-back`) **duplicati per istanza**; un rAF per marker sempre attivo (`animRim`, V35:491-509). |
| 1280×800 | stessi comportamenti (Tab 1°, click → planner); marker 55 px. |
| Bug collaterale | minimizzando la finestra della run **la mappa sparisce** (`TypeError … 'ids'`): è il bug trovato da un'altra sessione (DepthScene `app.destroy(true)`), fix non ancora in `main`. Le catture della run sono state fatte trascinando la finestra di lato. `map-lost-after-minimise.png` |

**Stati che il gioco non sa mostrare oggi (CODICE):**
- `expiring`, `expired` e l'alone «main» **non possono comparire su `/game`**: nessun POI ha una finestra (`availableUntilDay`) né `tier: 'main'`.
- completato e fallito sono **identici** (stessa pulsazione); l'esito (`reward`/`survived`/`fled`/`wipe`) non arriva al marker.
- lo stato dell'alone `pieno-in-attesa` è calcolato (`questSchedule.ts:62`) ma il marker lo ignora.
- **«bloccato» non esiste** in nessun dato; «velato» di PLAN-058 non ha fonte.
- **il rischio non arriva al marker**: la fascia (`bassa <15 / media <45 / alta <75 / letale`, `questPois.ts:50-55`) si calcola solo quando si apre il planner (Monte Carlo 2000 run, `questOffer.ts:188-204`).

## 2. Le 8 soluzioni del «Medaglione di Valenflø» in `PoiMatericV3_5` oggi

| # | Soluzione | Oggi | Nota |
|---|---|---|---|
| 1 | un canale per significato (tabella unica) | **in parte** | sagome per famiglia, token `--skin-poi-*`, vermiglio solo urgenza ✓; `new`=`available` e completato=fallito ancora collassati; nessuna tabella di grammatica unica |
| 2 | anello leggibile: casing co-esteso, 24 lettere, banda 9 px, tacche ai quarti | **in parte** | casing scuro che segue la penna con cappuccio `butt` ✓ (V35:718-724); stelle cardinali ai quarti ✓; **100 lettere per banda restano** per decisione del Director (D7) — non è un difetto aperto |
| 3 | progresso fuori da React | **no** (mitigato) | resta su stato React; quantizzato a 24 passi e throttling 500 ms (T-08) |
| 4 | `<defs>` una volta sola | **no** | `useId` solo per gradienti/bloom; 5 filtri con id fissi duplicati (misurati 6 `<filter>` per marker) |
| 5 | hit box sul dipinto, ruoli giusti | **in parte** | radice `div role="button" tabIndex=0` con Enter/Spazio ✓; etichetta senza stato; `role="img"` «Resident medal» interno; alone e sagoma dipinti fuori dai 55 px cliccabili; focus blu del browser |
| 6 | ombra fuori sagoma, hover che solleva | **non verificato** | l'hover è schiarimento + scia d'oro sulle lettere; nessuna ombra di contatto vista a 55 px |
| 7 | burst armato dopo il mount, fermo-scoppio-assestamento | **no** | burst lineare 200 ms, scatta se il marker monta già a 1 (V35:427-443) |
| 8 | un guscio (`PoiShell`) + arte intercambiabile | **no** | `Math.random()` nelle imperfezioni (V35:218-240): non testabile a snapshot |

## 3. Canali: un significato per canale

Il marker deve rispondere a quattro domande senza che una rubi il posto all'altra. La riga «rischio» è la sola aperta.

| Domanda | Canale | Regola |
|---|---|---|
| Lo vedo su questo terreno? | **bordo doppio** | sempre, ogni stato e taglia, in px di schermo |
| Che cos'è? | **sagoma base** (famiglia) + **glifo** (luogo) | impresa = tondo con coda; minaccia = rombo; main quest = impresa in L. Il glifo non viene **mai** coperto (oggi lo coprono percorso e party) |
| Quanto pesa? | **taglia** S/M/L | come PLAN-058 |
| Quanto è pericoloso? | **la sagoma** (POI-T B) | **forked, §9**: corona aggiunta, bordo dentato, oppure corona con il tempo sul bordo |
| Quanto manca? | **alone** (cerchio magico, desiderata v3) | ivory si svuota = scadenza; si riempie = lavoro; vermiglio = urgenza |
| Cosa vuole da me? | **emblema-oggetto** sulla spalla destra (6b) | uno per stato: niente pallini. Occhio = decisione in attesa; scintilla = esito da raccogliere; lame di ferro = run persa; lucchetto di ferro = bloccato |

Due regole trasversali:
- **Il colore conferma, non porta.** Ogni stato deve leggersi in scala di grigi (il mockup ha l'interruttore).
- **Un solo moto per volta per marker**, e il moto urgente è uno solo sulla mappa (Medaglione F-01).

## 4. Stati

| Stato | Dato che lo accende (oggi / da creare) | Lettura sul marker | Moto | Reduced-motion |
|---|---|---|---|---|
| **appena comparso** | reveal di `questRevealSchedule` | comparsa (B4-map decide la coreografia) | una volta | solo dissolvenza, **niente scala** (oggi la scala resta: da correggere) |
| **disponibile** | `questStatus: available` | quieto: bordo, sagoma, glifo, rischio. Nessun alone (normale) | nessuno | — |
| **main quest disponibile** | `tier: 'main'` (nessun POI lo usa) | taglia L + alone avorio pieno che si svuota su tutta la finestra | nessuno | — |
| **in scadenza** | `expiring` (<25% della finestra; **nessun POI ha finestra**) | alone pieno vermiglio che si svuota in senso antiorario | **uno scatto** all'ingresso (400 ms) | luce fissa |
| **in corso · andata** | run `in_progress`, fase `andata` (PLAN-053) | alone di lavoro che si riempie in senso orario; il percorso **finisce sul bordo**, non sul glifo | scrittura dell'alone | salta al valore |
| **in corso · sul posto** | fase `svolgimento` | come sopra; il gettone del party **accanto** al marker (spalla sinistra), mai sopra il glifo | — | — |
| **decisione in attesa** | `frontier.status === 'waiting'` | emblema **occhio** d'ottone sulla spalla destra (sostituisce il pallino rosso); alone fermo | lento respiro dell'emblema (2 s) | emblema fisso |
| **in corso · ritorno** | fase `ritorno` | alone pieno e fermo (`pieno-in-attesa`, oggi ignorato); il bottino resta sul gettone del party sul percorso (T-006), non sul POI | — | — |
| **esito da raccogliere · vinto** | run finita, esito `reward`/`survived` | emblema **scintilla**; pulsazione lenta ~2 s finché il giocatore non apre | pulsazione | luce fissa |
| **esito da raccogliere · perso** | esito `fled`/`wipe` | emblema **lame di ferro incrociate**; alone in ferro; nessuna pulsazione festosa | nessuno | — |
| **consumato** | `consumedPoiIds` alla chiusura del rapporto | sparisce con dissolvenza (fantasma 700 ms) | una volta | dissolvenza |
| **scaduto** | `expired` | sparisce senza pulsare (Q2) | dissolvenza | dissolvenza |
| **bloccato / velato** | **nessuna fonte** | ferro, opacità 0,45, emblema **lucchetto di ferro**; il click apre il planner con il motivo | nessuno | — |

## 5. Rischio — *superata: il Director non vuole il rischio sul marker (2026-10-20)*

- **Fonte:** la fascia d'offerta già esistente (`dangerBandFor`, 4 fasce). Va calcolata **alla comparsa** (o in cache per seme), non solo all'apertura del planner, e passata a `mapQuestPoiView` (T-07: un'unica fonte).
- **Che cosa dice:** il rischio **dell'offerta** con il party di riferimento della simulazione, non quello del party che il giocatore comporrà (quello resta nel planner). Il planner deve usare la stessa parola della sagoma (oggi «Danger High» in rosso: semaforo, F3).
- **Brace e vermiglio non si confondono:** brace = materia del marker (pericolo); vermiglio = solo il tempo che scade. Su ocra/terra rossa la brace perde tinta (24° contro 24°): il rischio deve reggersi sulla **forma**, la brace è solo conferma.

## 6. Interazione

| Gesto | Regola | Oggi |
|---|---|---|
| hover | il marker si solleva di 2 px (solo `transform`) e le lettere dell'orlo si accendono; cursore `interact` | schiarimento debole |
| hover → nome? | **domanda aperta (§10 Q1)**: POI-T B ha scelto «niente testo»; Revisione HUD e R2.1 prevedevano una targhetta al passaggio | nessun tooltip |
| focus da tastiera | anello di focus **nella materia**: doppio filo avorio/ottone che segue la sagoma, offset 3 px; mai il quadrato blu | contorno blu del browser |
| ordine di Tab | uno stop per lo **strato POI** (roving tabindex); frecce tra i POI in ordine spaziale; Esc torna alla mappa; i POI dopo la HUD, non prima | ogni POI è uno stop, ed è il primo della pagina |
| Enter / Spazio / click | offerta → planner; run viva → finestra della run; esito → rapporto | come detto ✓ |
| etichetta accessibile | «{nome} — {famiglia} — rischio {fascia} — {stato}{, n%}». Il progresso con `role="progressbar"` e annunci solo ai quarti | solo il nome |
| hit box | copre la sagoma dipinta (con la corona, se c'è) e la coda; l'alone resta decorativo | 55 px, sagoma e alone fuori |
| drop dal roster | invariato (`data-drop-state` già presente) | — |

## 7. Tanti POI insieme

- **Distanza minima** fra ancore = diametro dell'alone + 8 px alla zoom corrente; se due POI collidono, lo spostamento è sul glifo (una piccola leva verso l'esterno), mai sulla coda, che è l'ancora vera.
- **Ordine di sovrapposizione per urgenza:** decisione in attesa > in scadenza > esito da raccogliere > in corso > disponibile > bloccato. Oggi è l'ordine del DOM.
- **Un solo moto urgente sulla mappa** alla volta (lo scatto di scadenza): gli altri aspettano o restano fissi.
- **Budget:** con 10 POI oggi sarebbero ~2 300 nodi a riposo e fino a ~14 000 con gli aloni; 60 filtri; 10 rAF sempre accesi. Il tetto proposto: ≤ 300 nodi per marker con alone, defs condivisi, nessun rAF fermo.
- **Zoom indietro:** sotto il 60% di zoom l'alone si riduce alle quattro tacche cardinali e la corona (se scelta) resta: è il rischio che si legge «tutti insieme» (POI-T B).

## 8. Biomi e scala di grigi

- Il bordo doppio regge già su 8 ritagli (`poi-terrain-gate`, min 4,12:1). Il canale del rischio scelto deve passare lo **stesso cancello**: in grigio, le quattro fasce distinguibili a 55 px su tutti i biomi.
- Nel mockup ogni opzione è composta su **8 ritagli reali** della mappa a 2× (mare, foresta, prato, sabbia, ocra, terra bruna, neve, brughiera), con interruttore scala di grigi.

## 9. La fork (card + mockup) — **RIGETTATA 2026-10-20**

> Il Director: «Corna e orlo sn bocciati in ogni caso» e il rischio sulla sagoma «nn è nelle richieste». I problemi da risolvere sono quelli di R-177: bordo/filo bianco, halo neon che si riempie, ghiera solo bronzo; più la domanda sulle sagome per famiglia. Le §1–§8 (misure, stati, interazione) restano valide; questa sezione resta solo come storia.

Tre opzioni sullo stesso asse: *dove sta il rischio sulla sagoma*. Tutte tengono famiglia, glifo, taglia e bordo di PLAN-058 e la palette baseline (la palette è la fork B4-map).

| | A · Corona di corna | B · Orlo dentato | C · Sagoma-orologio + corona |
|---|---|---|---|
| rischio | corna sopra la sagoma: 0/1/2 coppie + punta centrale a «letale»; ottone → brace a «letale» | il contorno stesso si dentella: liscio / tacche / denti / denti spezzati con brace nelle crepe | corna come A |
| tempo | cerchio magico intorno (desiderata v3) | cerchio magico intorno (desiderata v3) | **tracciato sul bordo della sagoma** (B4-map C); nessun cerchio intorno |
| argomento più forte | è il mockup già scelto in POI-T: si conta da lontano, anche in grigio | stesso ingombro del marker di oggi, nessuna collisione con l'alone alle ore 12, densità migliore | il marker più compatto e il più economico (via ~1 200 nodi di lettere); riconcilia B4-map C |
| costo / rischio | le corna entrano nell'alone alle ore 10–2, proprio dove la scrittura parte; marker più alto | a 55 px «media» e «alta» si confondono; i denti tagliano il bordo doppio | **tocca la desiderata v3 FROZEN** («cerchio magico attorno al POI»): serve una revisione esplicita; le lettere incise (D7) spariscono dall'alone |

Matrice completa, opzioni dal vivo e requisiti di codice: [mockups/poi-fork-v1.html](mockups/poi-fork-v1.html) e la card.

## 10. Domande aperte per il Director — *Q2 (verderame) e Q3 (campo) risolte: vedi «Stato delle decisioni»; Q1, Q4, Q5 restano*

1. **Nome al passaggio.** POI-T B = «niente testo». Vale anche per una targhetta incisa al passaggio del mouse (come le regioni) o solo per il testo **fisso** sul marker? Revisione HUD (R2.1) la prevedeva.
2. **Verderame dell'alone di lavoro.** Sulla mappa legge ciano e, accanto al vermiglio, fa semaforo (6b elenca ottone/inchiostro/ferro/brace). Resta, o il lavoro si scrive in ottone («si riempie di luce», desiderata v3)?
3. **Bloccato.** Esiste nella demo? Se sì, qual è la fonte (edificio mancante, prerequisito di quest)?
4. **Emblemi di stato** (occhio, scintilla, lame, lucchetto): proposti dalla lista D6; se vanno disegnati come le icone incise di PLAN-058 è un lavoro d'asset a parte.
5. **Tensione 6b sul Sigillo stesso:** il medaglione tondo con un glifo dentro è «un cerchio con un simbolo». F3 l'ha segnalato; nessuna opzione qui lo risolve, perché è PLAN-058 approvato.

## 11. Copertura delle fonti (T-06)

| Fonte | Dove atterra |
|---|---|
| Medaglione F-01…F-10, soluzioni 1–8 | §2 (ogni soluzione), §3, §6, §7 |
| Revisione HUD §B POI, §1 Sigillo, asset P0 «cornici Sigillo 3 sagome × 4 stati» | §0, §3, §4, §10 Q1 |
| PLAN-043-S11 B4-map (baseline/A/B/C) + addendum reveal | §0 (fuori fork), §9 C, §4 riga «appena comparso» |
| ruling POI-T B | §0, §3, §9 |
| F3 POI (muto, croce, 6b, reveal) | §1, §6, §10 Q5 |
| F5 §2 (hover muto, nessun tooltip, secondo POI a stivale, croce) | §1, §6, §10 Q1 |
| PLAN-053 (andata/svolgimento/ritorno, bottino sul percorso) | §1, §4 |
| desiderata v3 | §0, §9 C |
