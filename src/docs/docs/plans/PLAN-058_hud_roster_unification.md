# PLAN-058 — HUD unificata sul Roster: lastre, icone, Sigillo POI, cursori

**Richiesta:** R-177 (+ feedback Director 2026-10-13). **Revisione di partenza:** https://claude.ai/artifact/8GCPcaB4LhYjDPdiLr4K7P
**Stato:** proposto · **Pianifica:** Opus · **Esegue:** Sonnet, un task per sessione, impegno medio · **Rivede:** Opus a fine fase, poi il Director.

## Regola madre

**Il Roster V2 (`src/ui/idleVillage/rosterV2/`, montato su `/game`) è il riferimento.** Ogni lastra, guida e componente HUD deve "sembrare il Roster": stesso bordo, stessa lacca, stessi raggi, stessa scala tipografica, stessa densità. In caso di dubbio vince il Roster. Il Roster V1 certificato (`MatericFrame`/`WellBronzeBezel`) resta byte-identico.

## Decisioni del Director (2026-10-13, chiuse)

- D1 — **Icone di luogo**, non di azione (coerente con R2.1). Il verbo si vede aprendo il POI.
- D2 — **Le icone sono esenti dal divieto di simmetria** della bibbia: sagoma simmetrica e centrata; l'asimmetria vive nella materia (usura, luce da sinistra-alto).
- D3 — **Niente teschi.** Minacce: segni d'artiglio, zanne/mascella, lance incrociate o stendardo strappato, corona spezzata (Re goblin).
- D4 — Halo = una cosa (tempo) in due modi: si svuota = scadenza, si riempie = lavoro. Scatto unico in scadenza; pulsa a fine finché il giocatore agisce.
- D5 — Gemma e riflesso lucido del POI: via. Lettere incise: restano.
- D6 — **Fantasy, mai generico** (2026-10-13, dopo il primo giro di cursori): il puntatore è un **guanto d'arme** con l'indice teso, non una freccia (anche le mani sono guanti); niente pallini/anelli sulla punta, niente dischetti di stato, niente semaforo verde/rosso, e il cursore non cambia colore mentre trascini. Lo stato si dice con la **sagoma di un oggetto** nella materia del cursore: scintilla (interagisci, rilascio sì), occhio (ispeziona), clessidra (attesa), lucchetto di ferro (disabilitato), lame di ferro incrociate (rilascio no). Vale per cursori, badge e icone: guida HUD regola 6b e §5c, bibbia §11.3.
- D7 (2026-10-13, risposte a T4.1) — Tre tipi di offerta distinti: quest normale, **main quest** (halo pieno dall'inizio, si svuota su tutta la finestra, taglia L), evento/minaccia. Offerta scaduta: sparisce senza pulsare. Lettere incise: **invariate** (supera la riduzione a 12–16 in T4.2). Dettaglio in `poi_family_spec.md` §Sigillo.

## Fuori scope (YAGNI)

Mappa cliccabile dall'avvio e POI al giorno 1 (decisione di gioco, TODO separato in R-177); sistema della fame; generazione delle immagini dipinte (le genera il Director con i prompt di questo piano); pagine di laboratorio diverse da `/game`.

## Trappole da rispettare (`context/recurring-traps.md`)

- **T-01** — layout `/game`/`refit`: nessuna modifica che cambi l'altezza delle lastre fisse senza aggiornare gli insets in `gameFrameConfig` e rimisurare che i fissi non coprano la terra.
- **T-02** — archi progressivi: niente `strokeLinecap="round"` su archi che possono valere 0; verificare a progresso 0.
- **T-03** — dropdown/popover dentro `data-hud-controls`.
- **T-07** — l'halo prende stato e progresso solo da `mapQuestPoiView`, mai da un loop proprio.

---

## Fase 0 — Estrarre la regola dal Roster (Opus)

**T0.1 · Misura del Roster.** Leggere `MatericRosterComponentV2`, `WanderlustRosterCardV2`, `HudPlaque` e misurare in pagina (`/game`, roster aperto, 1440×900): bordo (spessori, colori), lacca, raggi, padding, gap, altezza riga, scala tipografica (famiglie, px, peso, letter-spacing, maiuscoletto sì/no), colori testo primario/secondario, barre.
*Accettazione:* tabella valori con file:riga di provenienza.

**T0.2 · Token `--skin-roster-*` → `--skin-hud-*`.** Portare i valori misurati in token condivisi in `skinCssVariables.ts` (`BASE_SKIN_CSS_VARS`, + override `lacquer_atlas` dove serve). Il Roster V2 passa a leggere i token **senza cambiare un pixel**.
*Accettazione:* screenshot del Roster prima/dopo con differenza di pixel = 0 (o ≤ 0,1% per antialias); `hudGuards.test.ts` verde.

**T0.3 · Guida.** Riscrivere `src/docs/docs/design/hud_component_guide.md` §1–§5 attorno alla regola madre: "il risultato deve sembrare il Roster", tabella token, scala tipografica (maiuscoletto Cinzel solo per etichette ≤ 3 parole, frasi in EB Garamond, minimo 12 px), icona attaccata al valore (gap 6–8 px), numero pieno solo se non al massimo. Rimuovere il riferimento morto a `LiquidHalo` (§7).
*Accettazione:* guida aggiornata; nessun riferimento a componenti inesistenti.

*Esito T0.1–T0.3 (2026-10-13, in attesa del sì del Director):* misura in `test-results/plan-058-2026-10-13-T0.1-roster-measure.md` (+ 5 difetti del Roster per T1.6); 26 token `--skin-hud-*` di misura in `BASE_SKIN_CSS_VARS` (nessun override di preset: stessi valori in ogni skin), letti da `DragTestContainerV2`, `WanderlustRosterCardV2` e dal ruolo `data-hud-controls`; differenza Roster prima/dopo = 0 px e 0 stili calcolati su `base` e `lacquer_atlas` (`test-results/plan-058-2026-10-13-T0.2-roster-before-after.png`); `hudGuards` 6/6 (nuovo test: il Roster legge tutti i token di misura); guida §1–§5 riscritta, §7 senza `LiquidHalo`, altri riferimenti morti corretti.

*Pagina Gate F0 (2026-10-14):* `test-results/plan-058-2026-10-14-gate-f0-token-compare.html` — 24 token di misura confrontati su codice, guida (§4.2) e Roster dal vivo in `base` e `lacquer_atlas`: coincidono tutti. Il confronto ha trovato una notazione ambigua nella riga `row-filet` della guida (corretta) e un'incoerenza del Roster (icone dei menu a 12 px, dei bottoni a 14 px, annotata in guida §4.5).

**T0.4 · Grammatica di layout e interazione** (nuovo §6 della guida, misurata sul Roster dove esiste, decisa e scritta dove manca):
- *Allineamento:* testo a sinistra; numeri a destra con `tabular-nums` quando sono in colonna; centrato solo per titoli brevi di lastra e valori singoli; icona e testo allineati sulla linea di base o sul centro ottico, mai "a occhio".
- *Spaziatura:* griglia a 4 px; padding interno e gap delle lastre identici al Roster; zone sicure dai bordi dello schermo; margine minimo tra lastre.
- *Testo:* scala chiusa (es. 11/12/14/16/20/24), interlinea, maiuscole solo con letter-spacing, troncamento con tooltip del testo intero (mai "A…" senza tooltip), numeri abbreviati (1,2k), lunghezze italiane/inglesi (l'italiano è ~30% più lungo).
- *Stati di ogni controllo:* riposo, hover, premuto, focus da tastiera (visibile), disabilitato con motivo leggibile, selezionato. Area cliccabile minima 32×32 anche se l'icona è più piccola.
- *Feedback:* tooltip (ritardo ~400 ms, stessa materia, posizione che non copre l'oggetto), conferme, errori, stati vuoti con testo ("Nessun evento"), caricamento.
- *Livelli:* ordine z unico (`zLayers`), chi copre chi, ombre e scrim coerenti.
- *Movimento:* durate e curve standard (entrata, uscita, hover), una sola famiglia; `prefers-reduced-motion`.
- *Scala e risoluzioni:* 1280×720 → 2560×1440 e 16:10/21:9; scala UI (100/125/150%) come opzione; nessun testo sotto 12 px a 1280.
- *Accessibilità:* contrasto testo ≥ 4,5:1 sulla lacca; mai il colore come unico canale; navigazione da tastiera e scorciatoie elencate.
- *Audio UI:* un suono per hover/click/conferma/errore (aggancio, non produzione: fuori scope qui).

*Accettazione:* §6 scritto con valori numerici, ognuno con fonte "dal Roster" o "deciso qui"; una checklist da 10 righe che ogni task di Fase 1 incolla nel proprio report.

*Esito T0.4 (2026-10-13):* `hud_component_guide.md` §6 «Layout e interazione» (6.1-6.12): allineamento, spaziatura, scala testo 12/13/14/16/20/24, stati con area cliccabile ≥ 32×32, feedback (tooltip 400 ms), livelli da `zLayers`, tabella movimento, risoluzioni 1280×720→2560×1440, accessibilità con contrasto misurato (titoli 6,5-9,9:1, etichette 5,5-8,2:1, secondario 4,9-7,3:1 sulla lacca più chiara), audio solo aggancio, checklist da 10 righe (§6.12). Ogni valore marcato [Roster] / [codice] / [deciso]. Difetto trovato: `--skin-btn-disabled-opacity` 0,4 → ~2:1, da correggere in Fase 1.

**Gate F0:** pagina di confronto token Roster ↔ guida. Sì del Director. ✅ **Approvato 2026-10-13** (Roster prima/dopo identico, misure del Roster come metro, regole [deciso] di §6 incluse).

## Fase 1 — Lastre come il Roster (Sonnet, un task per sessione)

Ogni task: solo token di T0.2, zero letterali di colore/misura nuovi; aggiungere i file toccati a `STRICT_FILES` in `hudGuards.test.ts`; screenshot prima/dopo a 1440 e 1280.

- **T1.1 · Lastra risorse (`ResourceReadout`, `resourceReadoutItems`).** Icona 28–30 px attaccata al numero, etichetta sotto (11–12 px maiuscoletto), delta/giorno nella riga. Stato critico (scorta ≤ soglia esistente `foodDangerDays`): tessera intera in vermiglio, non solo il testo. Larghezza lastra ridotta al contenuto.
- **T1.2 · Lastra tempo (`WhenWhereCluster`).** Allineata ai token; medaglione notturno senza viola (bronzo/argento).
  *Esito T1.2 (2026-10-13):* notte argento al posto del viola via `DayNightPoiSkin nightTone="silver"` (palette `DAYNIGHT_SILVER_NIGHT` in `dayNightPoiSkinConfig.ts`; default `arcane` invariato per le altre 10 pagine che usano il componente certificato); striscia velocità: bottone 32×32 (area cliccabile) con pillola interna alta `--skin-hud-control-height`, testo `--skin-hud-name-*`, transizioni 140 ms; nome luogo e tag «In pausa» sui token; gap sui token. tsc pulito, hudGuards 9/9, DayNightActionCard 15/15; `DayNightPOI.test.tsx` 13 fallimenti **preesistenti** (test di aprile su un'implementazione vecchia: cerca `.rounded-full` e il testo «Day 1»). Screenshot 1280/1440/2560 + ciclo giorno-notte in scratchpad della sessione.
- **T1.3 · Nav (`GameFrame` plinth, `HudRecenterButton`).** Voci bloccate leggibili con lucchetto (velate, non grigie illeggibili); il pulsante Ricentra non usa più lo stesso glifo di "Mappa".
- **T1.4 · Registro eventi (`HudEventLedger`).** Frasi in Garamond, maiuscoletto solo per intestazione/filtri; righe con densità del Roster.
- **T1.5 · Menu, pannelli, occhio (`HudGameMenu`, `HudPanelsMenu`, `HudHideToggle`).** Stessa materia; badge del menu pannelli con significato esplicito (tooltip/aria) o rimosso.
- **T1.6 · Roster V2: correzioni.** Filtri non troncati, pulsanti-icona leggibili, barre etichettate, "100/100" nascosto se pieno. (È il riferimento: correggere bug, non stile.)

*Accettazione fase:* tsc pulito sui file toccati; `hudGuards` + test dei componenti verdi; fissi non coprono la terra (misura T-01); screenshot affiancati.
**Gate F1:** sì del Director sugli screenshot.

## Fase 2 — Kit dei prompt d'icona (Opus)

**T2.1 · Capitolo "Icone" nella bibbia** (`src/docs/docs/plans/art_direction_plan.md`, nuovo §11): due livelli — *dipinte* (oggetti del mondo: glifi POI, risorse, medaglione giorno/notte; 512→128/64/32) e *incise* (comandi: SVG pieni monocromi `currentColor`, griglia 24); D1–D3; luce in alto a sinistra; leggibilità a 24 px; prova in scala di grigi; materia = bronzo consumato su lacca teal, niente oro lucido, niente foglie/oggettini, niente cornici dipinte (il bordo lo mette il codice).

**T2.2 · Registro icone** `src/docs/docs/art-direction/icons/registry.yaml`: per voce `id, livello, famiglia, soggetto (una riga), taglie, stato (needed|prompted|candidate|approved), prompt, file, provenance`. Popolato dal contenuto canonico (vedi Fase 3); niente quest legacy (city-rats, bandit-camp…).

**T2.3 · Generatore** `scripts/gen-icon-prompts.py`: dal registro produce `.mw/specs/icons/<id>/prompt.md` con blocco di stile fisso + riga soggetto + kill list + contratto d'uscita, in tre varianti (GPT image, Gemini, Grok). Il blocco di stile vive in un solo file.

**T2.4 · Lint** `scripts/lint-icon-prompts.py` (non riusa il lint delle scene): blocco stile presente e invariato, soggetto ≤ 1 frase, kill list completa, nessun termine vietato (skull, gold shiny, leaves, frame/border), sfondo/uscita dichiarati.

**T2.5 · Cancello di contrasto** `scripts/poi-terrain-gate.py`: compone ogni icona/POI su 8 ritagli reali della mappa graded; fallisce se il bordo < 3:1 o se due famiglie POI sono troppo simili in scala di grigi.

**T2.6 · Sei prompt "ancora":** rovine, accampamento goblin, segni d'artiglio (dipinti POI); oro, cibo, legno (risorse). Sostituisce `poi_icon_prompts.md` (marcato superato) e aggiorna `.mw/specs/hud-resource-icons`.

*Esito T2.1–T2.6 (2026-10-13):* bibbia v0.14 §11; kit `src/docs/docs/art-direction/icons/prompt_kit.yaml` (stile bloccato da hash) + registro `registry.yaml` (46 voci: 19 dipinte, 27 incise); `gen-icon-prompts.py` (`--check` per il drift); `lint-icon-prompts.py` 6/6 verdi, `--self-test` 9/9; `poi-terrain-gate.py` verde sul Sigillo (bordo min 4,12:1; anelli attuali min 1,10–1,19:1 con `--legacy`), foglio in `test-results/poi-terrain-gate/<data>/`; 6 ancore in `.mw/specs/icons/{poi-goblin-camp,poi-ruins,threat-claws,res-gold,res-food,res-wood}/prompt.md`. Stato registro: ancore `prompted`.
*Esito T2.6 rivisto (2026-10-14):* soggetti riscritti per le taglie d'uso (glifi POI 26 px, risorse 28 px; campo `display_px` nel registro); lint I8 «dettaglio fine» (raggi, crepe, anelli, rigature, incisioni) con 9/9 al self-test; pacchetto unico `.mw/specs/icons/ANCORE-prompt-pack.md`. *Esito T3.3 parziale (2026-10-14):* il Director ha fornito il foglio `~/Downloads/icone.jpeg` (6 ancore). Ritagliate (fondo grigio rimosso con maschera graduale, decontaminazione dei bordi), montate: master 512 in `public/assets/ui/poi/` (poi-goblin-camp, poi-ruins, threat-claws) e `public/assets/ui/resources/` (res-gold, res-food, res-wood), più 128/64/32 accanto. Registro: stato `candidate`. Verifica a 26/28 px ingranditi ×4: leggibili; gli artigli sono i più deboli (teal scuro sulla lacca). **Glifi POI collegati (2026-10-14):** `MapQuestPoi` usa il glifo per id di quest (`poi-goblin` → camp, `poi-rovine` → ruins); `PoiMatericV3_5` disegna il glifo sopra vetro e ombra (L5b), la croce di default resta com'era. Verificato sulla mappa: il glifo c'è, ma è scuro (media 110/80/58 nel sorgente su medaglione quasi nero): serve un ritocco del prompt a toni più chiari. Il glifo della tenda è stato rigenerato senza «orecchie». **Ancora da fare:** risorse (`resourceReadoutItems.tsx`, file di T1.1) e il Sigillo completo (vetro e specular da togliere, D5).

*Esito Gate F2 (2026-10-14):* le sei ancore sono `approved` (Director). Tenda v2 (senza orecchie), rovine v2 (arenaria), artigli v2 e pane v2/oro/legna montati in `public/assets/ui/poi/` e `public/assets/ui/resources/` (master 512 + 128/64/32), riferiti da `MapQuestPoi` e `HUD_ICON_ASSETS`; nessun file letto da Downloads.

**Gate F2:** il Director genera le 6 ancora con gli strumenti esterni e sceglie. Le scelte diventano immagini di riferimento per tutti i prompt successivi.

## Fase 3 — Il set completo (Sonnet + Director)

**T3.1 · Prompt del set dipinto** dal registro, con le ancora come riferimento:
- POI luogo: Sterminio goblin (accampamento), Rovine sotto il Fiume; famiglie offerta foraggio, scavo, carovana, ricognizione, persone, assalto.
- Minacce: invasione (lance/stendardo), Re goblin (corona spezzata), bestie (zanne).
- Risorse: oro, cibo, legno; ferro **solo se** entra nel canonico (decisione aperta, vedi sotto).
- Medaglione giorno/notte: alba, giorno, tramonto, notte.

*Esito T3.1 (2026-10-14):* 13 soggetti scritti (6 offerte, 3 minacce, 4 medaglioni) per le taglie d'uso (POI 26 px, medaglione 24 px; niente raggi: «punte di fiamma» smussate), registro → `prompted`, 0 voci `needed`. Il kit aggiunge la riga `REFERENCE` (solo non-ancore) da usare con `.mw/specs/icons/ANCORE-reference.png` (le 6 ancore approvate su lacca). Pacchetto unico `.mw/specs/icons/SET-T3.1-prompt-pack.md` (`gen-icon-prompts.py --pack`). Lint 19/19 verdi, self-test 9/9, generatore in sync. Revisione delle 48 incise: pagina https://claude.ai/artifact/HmRCNGttDeaCTDZkB3YdDU (scelte nel db `decisioni`, lette da Claude).

*Esito T3.2 (2026-10-14):* 44 glifi in `engravedIcons.tsx` (tolti `ph-*` ed `evt-threat`: oro/cibo/legno e minaccia usano le dipinte via `HUD_ICON_ASSETS`). Revisione del Director su https://claude.ai/artifact/HmRCNGttDeaCTDZkB3YdDU: 33 approvate (30 nel registro + i 2 chevron e il forziere ritoccato), 11 ridisegnate in attesa di nuovo voto (ricentra, spedizione, ascia, borsa, pergamena, bisaccia, compagnia, bottega, guardia, esploratore, fiala). `scripts/mount-icon.py` monta le dipinte (T3.3): 12 montate in `ui/poi` e `ui/time`; tramonto mancante; il medaglione del tempo non è ancora collegato (colori da decidere).

*Esito T3.2 chiuso (2026-10-14):* tutte le 44 incise approvate dal Director (8 giri di revisione sulla pagina). Ultime: ricentra = mirino, spedizione = tenda, compagnia = tre mezzibusti, bottega = insegna con sacco d'oro, esploratore = arco e freccia, bisaccia = sagoma ricalcata da un riferimento d'archivio (illustrazione stock con filigrana: verificare la licenza o ridisegnare il contorno prima della release).

**T3.2 · Set inciso (Sonnet disegna gli SVG):** menu, pausa, play, velocità, pannelli, occhio/occhio chiuso, chiudi, filtra, ordina, lucchetto, ricentra (bussola), villaggio, mappa, bottega, taverna; 6 tipi evento (minaccia, quest, spedizione, costruzione, raccolto, visita); ruoli (capo, membro, guardia del corpo, esploratore), ferita. Sostituisce `hudIcons.tsx` a tratto 1.6 e tutti gli usi di `lucide-react` nell'HUD di `/game` (incl. `QuestRunWindow`).

**T3.3 · Pipeline di montaggio** per le dipinte che arrivano: scontorno, riduzione 128/64/32 con passata a 32, WebP in `public/assets/ui/poi/` e `public/assets/ui/resources/`, `poi-terrain-gate` verde, registro → `approved`. Finché un'icona manca: segnaposto vettoriale inciso, mai la croce.

*Accettazione:* zero import `lucide-react` nei componenti HUD di `/game` (test di guardia); lint prompt verde; registro senza voci `needed` per le icone P0.

## Fase 4 — Sigillo POI e halo (Opus schema, Sonnet codice)

**T4.1 · Schema (Opus).** Contratto visivo in `src/docs/docs/idle_village/poi_family_spec.md`: bordo doppio (scuro `#0b0a08` 2 px + avorio `#efe3c6` 1,5 px), sagoma = famiglia (tondo con coda = impresa, tessera = lavoro, rombo = minaccia), taglia S/M/L = magnitudo minacce, glifo = luogo, halo interno neutro (avorio/verderame), **vermiglio = solo urgenza**. Stati: disponibile, in scadenza (<25%, soglia esistente in `questAvailability`), scaduto/finito (pulsazione lenta ~2 s fino all'azione; `prefers-reduced-motion` → luce fissa), velato.
**T4.2 · Codice (Sonnet).** In `PoiMatericV3_5` (o nuova variante se toccare la 3.5 rompe altre pagine — verificare prima con mw-regression): via gemma e riflesso; lettere incise ridotte a 12–16 e collegate al timer (si spengono con il tempo, stesso progress dell'halo, T-07) — **superato da D7: lettere invariate**; colori da token `--skin-poi-*` nuovi; `poiColorConfig.ts` adeguato.
*Accettazione:* `poi-terrain-gate` verde su tutti i biomi; test halo a progresso 0, 25%, 100% (T-02); screenshot su 6 biomi a colori e in grigio.
*Esito T4.2 parziale (2026-10-14):* prop `sigillo` di `PoiMatericV3_5` (solo `MapQuestPoi`/`MapDemoPoi`): vetro, specular e gemma tolti (D5), anello in bronzo neutro e campo in lacca uguali per tutte le famiglie, bordo doppio scuro 2 px + avorio 1,5 px in pixel di schermo, glifo sopra tutto. Altre pagine invariate. `poi-terrain-gate` verde. **Mancano:** sagome per famiglia (tondo con coda / tessera / rombo), taglie S/M/L, regola dell'halo (neutro, vermiglio solo urgenza), coda al posto della gemma, glifo al 55-60% del campo. Colore degli anelli: da decidere dopo la prova a occhio del Director.

*Esito T4.2 resto (2026-10-14):* dietro la stessa prop `sigillo` di `PoiMatericV3_5` (altre pagine invariate; smoke `POISkinIntegration` e `poiMatericSkinConfig` verdi). **Sagome** per famiglia come placca di bronzo dietro il medaglione tondo: impresa = tondo con coda (la coda prende il posto della gemma), lavoro = tessera (medaglione ×0,785), minaccia = rombo (×0,7), bordo doppio sul contorno di ciascuna. **Taglie** S/M/L = 44/55/69 px (`poiSigillo.ts`); la main quest è L. **Tier**: campo opzionale `tier: 'normal'|'main'` in `QuestPoiSchema`; `mapQuestPoiView` lo riceve (main = halo pieno dall'inizio, si svuota su tutta la finestra, nessun salto al vermiglio) ed espone `done`. **Halo**: avorio mentre una scadenza si svuota, verderame mentre il lavoro si riempie, vermiglio solo in `expiring` (e sul badge «decisione in attesa»); scatto unico in scadenza (non più il respiro infinito), pulsazione ~2 s a run finito, luce fissa con `prefers-reduced-motion`. **Glifo** al ~57% del campo. **Token** `--skin-poi-*` in `BASE_SKIN_CSS_VARS`. **Lettere invariate** (D7). Test: `poiSigillo.test.tsx` (11: halo a progresso 0 / 25% / 100% senza cap tondi sugli archi, sagome, bordo 2 + 1,5 px, toni, pulsazione, taglie), `mapQuestPoi.test.ts` 14/14, `questAvailability`, `hudGuards` 10/10, `tsc` pulito sui file toccati. `poi-terrain-gate` verde (bordo min 4,12:1; famiglie distinte in grigio ≥ 0,116). **Correzione allo schema T4.1:** l'halo sta *fuori* dal bordo (come da desiderata v3), non dentro. **Non fatto / non verificato:** stato velato (nessuna fonte dati), `poiColorConfig.ts` non toccato (il Sigillo usa palette propria), glifi dipinti di lavoro e minaccia (restano le croci, T3.1), colore degli anelli (aspetta l'occhio del Director); sul `/game` dal vivo ho visto a occhio sagome e bordi ingranditi e il tono verderame della quest in corso (letto dal DOM), ma **non** vedo scatto in scadenza, pulsazione a run finito né una main quest, perché nel gioco nessuna quest è `main` e le offerte non scadono mai (finestra 10 000 giorni): quei tre percorsi sono coperti dai test, non da un testimone visivo. Prova Tauri e 6 biomi in colore/grigio dal vivo: da fare. Foglio del cancello: `test-results/poi-terrain-gate/2026-10-14/sheet.png`.

**Gate F4:** sì del Director.

## Fase 5 — Cursori (Sonnet)

**T5.1** · Estendere `scripts/draw-cursors.py` (ottone, già nel repo): guanto che indica, al posto della freccia (default, interagisci, ispeziona, attesa, disabilitato) + guanti-mano (afferrabile, trascina, rilascio sì, rilascio no, sposta mappa); 32/48/64 px; hotspot sulla punta reale. Emblemi secondo D6 (sagome fantasy, non dischetti).
**T5.2** · `gameFrameCursors.css`: mappatura stati, precedenza drag > hover, invalido > valido; collegare rilascio sì/no agli slot dnd-kit.
**T5.3** · Prova nella build Tauri su Mac Retina (bug WebKit sui cursori @2x). Se fallisce: cursore DOM come piano B (decisione aperta).
*Accettazione:* tutti gli stati raggiungibili in `/game`; screenshot Tauri.
**Gate F5:** sì del Director. Rimozione dei cursori inutilizzati (Kenney, guanto pixel) dopo il sì.

---

## Decisioni aperte (non decise da questo piano)

- **Ferro** tra le risorse canoniche: è nel laboratorio goblin, non nel config canonico.
- **Cursore Tauri:** `image-set` CSS o cursore DOM, dipende da T5.3.
- **DESIGN_PILLARS r.33 vs r.43** e **Pillar 1 "cornice intagliata"**: D1 risolve il caso POI, ma il testo dei pillar va corretto dal Director.

## Verifica finale del piano

Fine Fase 5: su `/game` a 1440×900 e 1280×800 — nessun componente HUD fuori token (test guardia), zero `lucide-react` nell'HUD, `poi-terrain-gate` verde, cursori in tutti gli stati, screenshot Tauri, evidenza in `test-results/plan-058-<data>.log`.
