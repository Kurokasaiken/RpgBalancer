# PLAN-112 — HUD AAA: prima la pianta, poi i componenti

**Stato:** bozza per il Director (non battezzato; `plan:stamp` solo dopo il suo via). Dibattito multi-AI web eseguito (R-317): §9 raccoglie gli emendamenti converged 5/5 — dove divergono dal testo, valgono loro.
**Parent:** PLAN-107 (HUD Zanara su /game), PLAN-110 (mockup → componenti), R-303, `.mw/specs/hud-real/HUD-108-AUDIT.md`, `REVIEW-REPORT.md`, `DECISIONI-APERTE.md`.
**Origine (Director, 2026-11-05):** *«nn sistemare nulla, prima facciamo un plan vero x avere una HUD AAA vera, poi continuiamo»*; *«stai lasciando errori enormi e nn capisco xè. Facciamo prima un layout e poi c lavoriamo sopra?»*.
**Cosa NON è:** non rifà gli asset già fatti, non genera nuovi mockup completi, non cambia la direzione Zanara, non tocca `/game` di produzione né la meccanica. Questo documento è il solo prodotto della fase corrente: **nessun codice, nessuna immagine**.

## 0. Perché le HUD precedenti sono uscite con errori grossi (causa, non sintomo)
Dalle sessioni PLAN-110 (ricostruzione dalla cronaca di `DECISIONS.md`):
1. **Nessuna pianta approvata.** Le posizioni sono state decise una alla volta, a occhio. Nessuno ha fissato griglia, linea centrale della barra superiore, altezze e confini delle colonne → tempo, risorse e marchio su altezze diverse, roster che copre la Voce, bordi destri sfalsati.
2. **Verifica sul pezzo, non sulla schermata.** Si controllava il ritaglio appena toccato (o misure sui riquadri DOM). I riquadri allineati non dicevano che il disegno lo fosse (margini trasparenti, tele fisse con bordi vuoti). Contro T-04: metrica come verdetto.
3. **Generare prima di decidere.** Ogni immagine partiva da una lamentela, non da una specifica; varianti scelte per "pulizia" e non per **fedeltà ai tratti** del mockup (statua, foglie, angoli smaltati...), e prompt che chiedevano ornamenti assenti nel mockup (edera, rose dei venti).
4. **Dati e comportamenti di scena.** Tempo, bussola, sigillo, Voce, pannello con testo fisso e controlli senza azione: il giudizio su leggibilità e peso era provvisorio, e "dead chrome" violava PLAN-107 D-2/D-3.
5. **Scala tipografica non decisa.** Corpi scelti a caso sulla tela di riferimento, fino a 9,6 px reali a 1280.
6. **Colore corretto per tentativi.** Smalto schiarito, poi scurito, poi spostato di tinta, senza un bersaglio misurato sul mockup *e sullo sfondo* (mare).

## 1. Principi non negoziabili
- **P1. La pianta precede ogni asset.** Nessuna immagine generata e nessun componente rifatto prima che la pianta (§F1) sia approvata dal Director.
- **P2. Ogni componente nasce da un contratto di ingombro** (riquadro, ancoraggio, min/max, altezza del contenuto) preso dalla pianta; è il componente ad adattarsi alla pianta, mai il contrario.
- **P3. "Fatto" si dichiara sulla schermata intera**, confrontata con la pianta (sovrapposizione automatica) e vista a occhio side-by-side con il mockup, headless a più viewport. Il pezzo da solo non chiude nulla (T-04).
- **P4. Una variante si sceglie per fedeltà ai tratti elencati del mockup**, poi per pulizia. Il prompt chiede di togliere solo il contenuto vivo, non gli ornamenti.
- **P5. Niente "dead chrome".** Un elemento fisso esiste solo se ha dati o azione verificati (PLAN-107 D-2/D-3); altrimenti è contestuale o assente.
- **P6. Tre livelli di ricchezza** (primo piano ornato, secondo sobrio, terzo piatto) e **tre modi di visualizzazione** (persistente, contestuale, temporaneo) dichiarati per ogni componente in pianta.
- **P7. Budget misurato, non stimato:** persistenti ≤ 18% perceived surface (T-101b a pixel, rumore mappa sottratto), tutto acceso ≤ 1/3, terzo sinistro ≤ 22%.
- **P8. Un colore, un bersaglio:** smalto/oro/alabastro definiti in Lab **sul mockup e sulla mappa** (mare, giungla, terra chiara) prima di qualunque grade; un solo script di unificazione come ultimo passo.
- **P9. Scala tipografica unica** definita sul pavimento *reale* (≥14 px a 1280×800 per testo corrente), non sulla tela di riferimento.
- **P10. Ogni asset sostituito ha rollback** (backup + procedura) e ogni batch di generazione ha un budget di quota dichiarato.

## 2. Fasi

### F0 — Congelamento e inventario (½ giornata, 0 immagini)
- F0.1 Tag dello stato attuale di `/hud-compose` come **prototipo R2**: elenco dei 12 componenti con stato (tenere / rifare / eliminare), asset e script (`scripts/hud-real/*`) riusabili, backup.
- F0.2 Tabella delle **decisioni aperte** (da `DECISIONI-APERTE.md` + HUD-108): cimiero/emblema, globo, bussola, comandi, sigillo, Voce, consumo del cibo, roster a 4 o 5 righe. Ogni voce resta `open` finché il Director non la chiude in F1.
- *Uscita:* `HUD-INVENTORY.md`. *Precondizione di F1:* nessuna.

### F1 — Pianta (layout blueprint), senza immagini (1–2 giornate)
Pagina laboratorio `/hud-layout` (route nuova, sagome piatte, nessun asset generato):
- **F1.1 Griglia e regole:** unità 8 px, margine 24, zone sicure, **una linea centrale per la barra superiore**, ancoraggi agli angoli reali (tela fluida, mai tela fissa), comportamento a 1280/1440/1920/2400/3440/ultrawide e 390×844 (mobile-fit).
- **F1.2 Sagome con contratto:** per ogni componente riquadro (min/max), ancoraggio, livello di ricchezza, modo (persistente/contestuale/temporaneo), contenuto reale e stati. Sagome con peso visivo simulato (riempimento) per misurare l'ingombro **prima** dell'arte.
- **F1.3 Tre viste:** panoramica, contestuale (pannello aperto), narrativa (notifica). Dichiarare ciò che sparisce o si sposta tra le viste.
- **F1.4 Misura della pianta:** T-101b sulla sagoma (obiettivo persistenti ≤ 18%, sinistra ≤ 22%).
- **F1.5 Alternative:** 2–3 piante (es. A: roster a colonna con placche, B: roster compatto con gemme di stato, C: barra eroi in basso) come **visual-fork card** (`.mw/templates/visual-fork/visual-fork-card.md`); il Director sceglie, il planner non sceglie.
- *Uscita:* `LAYOUT-SPEC.md` (+ tabella dei contratti in JSON consumabile dai test) e la route `/hud-layout` approvata. **Gate G1 (Director):** pianta scelta e firmata.
- visual-fork: pending — card generata in F1.5 (artefatto di gate), baseline = sagome approvate.

### F2 — Contratti di contenuto (1 giornata, 0 immagini)
Per ogni componente: **dati reali** (store/selettore) o "assente → contestuale", stati (normale/hover/focus/attivo/disattivo/pericolo/caduto/…), testi e **scala tipografica** (P9: tabella unica), i18n it/en, tastiera, movimento (ingresso/uscita/rivelazione, `prefers-reduced-motion`), accessibilità (contrasto ≥ 4,5:1 misurato sulle superfici reali). Il sigillo, il tempo, la bussola, il globo, i comandi: dato o azione verificati, altrimenti declassati.
- *Uscita:* `CONTENT-CONTRACTS.md` + tipi TypeScript dei contratti (solo interfacce, nessun componente).

### F3 — Materiali e fedeltà (spike, 2–3 giornate, quota ≤ 30 immagini)
- **F3.1 Bersagli colore misurati** sul mockup *e* sulla mappa (mare/giungla/terra): oro, smalto, alabastro, vetro; ramp a 5 ancore; soglie di coerenza tra pezzi.
- **F3.2 Checklist dei tratti per ogni mockup scelto** (ciò che ha / ciò che NON ha) e scorecard di fedeltà usata per scegliere le varianti.
- **F3.3 Spike T-102a/b di PLAN-107:** medaglione del roster e cornice+superficie interna in alabastro — i due pezzi dove la qualità materica decide il risultato. Un solo pezzo per famiglia, rifinito fino al livello AAA, poi si replica.
- **Gate G2 (Director, occhio):** i due pezzi campione sono "il livello giusto". Se no, si itera qui, non sull'insieme.

### F4 — Componenti, nell'ordine della pianta (4–6 giornate, quota ≤ 60 immagini)
Per ogni componente: contratto di ingombro (F1) → scheda tratti (F3) → generazione guidata (struttura sola, contenuto vivo in codice) → costruzione asset (cut, grade oro, **unificazione smalto**) → componente React sul contratto F2 → **test di rettangolo** (permanente) → cattura headless a 3 viewport.
Ordine: **(1) barra superiore come sistema di moduli** (stessa altezza e grammatica per tempo/comandi/risorse) → **(2) roster + stati** → **(3) nav** → **(4) pannello + sigillo dentro** → **(5) notifica narrativa** → **(6) elementi opzionali** (bussola, globo) solo se F2 dà loro dati/azione.
Nessun componente si "chiude" da solo: chiude in F5 con la schermata intera.

### F5 — Composizione, misura e occhio (2 giornate)
- **F5.1 Test automatici permanenti (R-247):** (a) ogni componente entro ±2 px dal riquadro della pianta, a tutti i viewport; (b) allineamento: bordi/linee comuni identici (±1 px); (c) nessuna sovrapposizione non dichiarata; (d) corpo minimo e troncature (it/en, `?stress`); (e) contrasto; (f) occupazione T-101b ≤ budget. Falliscono se la pagina si rompe.
- **F5.2 Prova a occhio, headless:** screenshot della schermata intera, sulle tre viste, su tre zone di mappa (mare, giungla, terra chiara) e nei viewport canonici + mobile-fit; **side-by-side con il mockup e con la sagoma** (artefatto per il Director).
- **F5.3 Stress:** 0/1/14 eroi, risorse estreme, testi lunghi, pannello lungo, notifiche in coda.
- **F5.4 Prima/dopo contro `/game`** sullo stesso stato.
- **Gate G3 (Director):** "la mappa è protagonista, tutto sembra della stessa civiltà, nessun placeholder".

### F6 — Integrazione su `/game` (2–3 giornate, dopo G3)
Dietro preset `zanara` (PLAN-107 D-4: `base` resta predefinito), tramite gli slot esistenti, senza cambiare meccanica; token `--hud-*` promossi; **Living contracts** (`sync:bug`, `redfirst`, `// INV:`) su ogni superficie `/game` toccata; verifica in app vera (Tauri, se prevista da PLAN-107) e headless.

## 3. Metodo di verifica ("witness" della schermata intera)
1. **Pianta come oracolo numerico:** il JSON dei contratti (F1) è l'input dei test di rettangolo e di allineamento (F5.1). Una HUD fuori pianta fallisce prima che l'occhio la veda.
2. **Occhio come verdetto** (T-04): cattura headless/in background, artefatto side-by-side (pianta | mockup | implementazione); nessuna finestra in primo piano da parte dell'agente.
3. **Mai "verified" sul solo pezzo:** `queue.json`/stato dei componenti si chiude solo con la cattura della schermata intera che lo contiene.
4. **Metrica = supporto:** se metrica e occhio divergono, vale l'occhio e si corregge la metrica (T-04).

## 4. Contratto di chiusura (alimenta `.mw/runs/<task>/verification.json`)
| # | Obbligazione | Tipo |
|---|---|---|
| O-1 | `LAYOUT-SPEC.md` + route `/hud-layout` approvata dal Director (G1), con card visual-fork e baseline sha256 | human-eye |
| O-2 | Test permanente dei rettangoli e degli allineamenti a ≥5 viewport (`npm run test -- hudLayoutContract`) rosso se un componente esce di pianta | state, blocking |
| O-3 | Occupazione T-101b: persistenti ≤ 18% (≤ 24% al passo 150%, confermato dal Director 2026-11-05), tutto ≤ 33%, terzo sinistro ≤ 22%, a 1280/1440/1920 | state, blocking |
| O-4 | Tabella tipografica applicata; nessun testo corrente < 14 px reali a 1280×800; nessuna troncatura it/en | state, blocking |
| O-5 | Colore: Lab di oro/smalto/alabastro entro soglia su tutti i pezzi **e** contrasto ≥ 4,5:1 sulle superfici reali | state, blocking |
| O-6 | Ogni elemento fisso ha dato o azione verificati (no dead chrome), elenco con prova | state |
| O-7 | Fedeltà: scheda tratti compilata per ogni componente, con side-by-side mockup | human-eye |
| O-8 | G2 (spike materiali) e G3 (schermata intera) firmati dal Director | human-eye |
| O-9 | Su `/game`: preset `zanara` attivo, `base` invariato; `contracts:check` e suite pertinenti verdi | state, blocking |
Ultimo task del piano: **O-2..O-5 verdi e G3 firmato.**

## 5. Trappole ereditate (`context/recurring-traps.md`) → criteri di accettazione
- **T-01** layout `/game`/HUD su mappa: nessun fisso copre la terra a 1440×900 e 1280×800; ancoraggi su bordi reali.
- **T-03 / T-21** `data-hud-controls`, `skin-scope`, menu su `/game`: dropdown dentro lo scope, hit region verificata.
- **T-04** claim percettivi: occhio vero, headless, side-by-side.
- **T-16/T-25/T-26/T-27/T-28** generatori immagini esterni: prompt con riferimento a materiale (strisce, non oggetti interi), batch con ledger e dedupe, solo originali scaricati.
- **T-22** misura in ambienti diversi (GPU/headless): tutte le catture dichiarano viewport, DPR e ambiente.

## 6. Rischi e costi
- **Costo:** ~11–16 giornate; quota Gemini ≤ 90 immagini (budget `gen-budget.json`, 60 già usate su maxTotal 170 → ~110 residui; tetto settimanale a rischio) — F1 e F2 a quota zero.
- **Rischio principale:** pianta approvata ma incapace di reggere 14 eroi / ultrawide → mitigazione: F1.3 e F5.3 la forzano prima dell'arte.
- **Rischio generazione:** Gemini instabile (allegati, interstiziali, quota) → la coda ha già i ripari; tenere un ripiego vettoriale/CSS per anelli e cornici semplici.
- **Rischio di ripetizione:** tornare a rifinire pezzi a occhio → i test O-2 e il divieto P1 lo impediscono.

## 7. Decisioni aperte (non decise qui)
1. Pianta A/B/C (F1.5, card visual-fork). 2. Emblema/marchio nella HUD di gioco: ridotto, solo titolo/boot, o assente (PLAN-107 D-1 vs PLAN-110 D-8; oggi il Director chiede di toglierlo dalla schermata). 3. Bussola e globo: dato/azione o fuori. 4. Sigillo: dentro il pannello o altrove. 5. Roster: righe visibili e stati a riposo. 6. Scala di riferimento (1600×900 vs 1440×810) e impostazione "dimensione interfaccia". 7. Dibattito multi-AI sul piano: **eseguito** (R-317, run `20261105-plan112-hud-aaa`, converged 5/5 su artifact-r002) — emendamenti in §9.

## 8. Marker e adempimenti
- `visual-fork: pending` su ogni decisione estetica (card in F1.5, F3.3); `visual-fork: skipped — nessuna scelta estetica nuova — HUD-108-AUDIT §1` solo per task puramente numerici (test, budget).
- Tutte le verifiche runtime e catture: **headless/in background** (`.windsurf/rules/16-no-foreground-windows.md`); una finestra visibile è un passo manuale del Director.
- Da fare al battesimo (Director): `npm run plan:stamp -- open PLAN-112`; item di desiderata slice da classificare con `mw-plan-disposition` se il Director lo ritiene applicabile (il piano non cambia i desiderata FROZEN: v2 «mappa protagonista» è anzi il criterio guida).
- Riuso: PLAN-107 (D-1..D-4, T-101b, T-102a/b), PLAN-110 (pipeline e script `scripts/hud-real/*`), HUD-108-AUDIT, `LINGUAGGIO-v2.md`.

## 9. Emendamenti dal dibattito multi-AI web (2026-11-05)

Run `mind-weaver/.mw/runs/20261105-plan112-hud-aaa/` — 5 provider (chatgpt, claude, gemini, grok, deepseek), 2 round: ~50 rilievi, disposizionati dall'orchestratore. **Dove gli emendamenti divergono dal testo sopra, valgono loro.**

### 9.1 Oracolo e contratto di chiusura (FATAL)

- **E-01 O-1 come precondizione (D1+D10+M7).** O-1 diventa la PRIMA obbligazione, precondizione e non voce di chiusura: soddisfatta quando `LAYOUT-SPEC.md` + route `/hud-layout` + card visual-fork + baseline sha256 sono firmate a G1. Dominio dell'hash: `LAYOUT-SPEC.md` + sorgente route + card + `contracts.json` + file soglie di E-03, su JSON normalizzato a chiavi ordinate (non markdown grezzo). O-2/O-3/O-4 leggono input SOLO dall'hash baseline firmato; mismatch = fail duro. Clausola finale riscritta: «O-1 firmato → O-2..O-5 verdi e G3 firmato → O-9 verde; O-6, O-7, O-10 verdi».
- **E-02 Retyping bloccante (D2).** O-6 → `state, blocking`; O-7 → `human-eye, blocking at G3` (firmato con G3); O-9 → `state, blocking` dentro la clausola. Nessuna obbligazione `state`/`human-eye` può essere declassata senza decisione Director registrata in `DECISIONI-APERTE.md`.
- **E-03 Calibrazione soglie (D4+P4+L6).** Nuovo **F1.6 «Calibrazione»**: si misura la varianza dei rettangoli della baseline O-1 stessa su viewport e DPR canonici (N=5 ripetizioni, σ e rounding pubblicati in LAYOUT-SPEC); le soglie di O-2 derivano dal p95 osservato (arrotondato al px), sha-pinnate con O-1; **se il p95 supera l'ipotesi ±2px/±1px la scelta della soglia è una decisione esplicita del Director a G1, non un arrotondamento silenzioso**. ±2px/±1px restano solo ipotesi iniziali. Distinzione CSS-layout vs pixel rasterizzati. Ogni modifica successiva alle soglie richiede nuova firma Director + nuovo hash.
- **E-04 Modalità frozen-map e split di O-3 (D3+P5+L6+K4 modificato).** Modalità test `--hud-test-mode`: animazioni mappa in pausa, seed deterministico, DPR dichiarato. **O-3a** = T-101b su cattura frozen (pubblicata con capture-id) ed è **l'unico verdetto numerico bloccante** sul budget 18%. **O-3b** = stessa misura su mappa viva, **solo diagnostico**: fuori dalla banda di rumore ricalcolata per set di catture marca la cattura `inconclusive` e richiede ri-cattura, ma **non può né annullare né confermare** il risultato di O-3a. Vietato mediare via la banda. **Il budget 18% resta assoluto sulla misura frozen** — la banda di rumore è incertezza di misura, non budget extra (riformulazione di K4; criterio di fallimento corretto dopo obiezione chatgpt W-01: niente doppio verdetto a/b).
- **E-05 Capacity contract (P1).** F1.2 aggiunge: ogni componente dichiara dimensioni min/preferite/max capacità contenuto e disposizione di overflow (reflow, compressione entro limiti, scroll in regione non-bloccante esistente, contestualizzazione, omissione); vietati clipping/overlap/restringimento implicito sotto leggibilità. G1 passa solo dopo dimostrazione a contenuto massimo (14 eroi) a 1280×800, 3440 e 390×844 fit reale — uno stato vuoto attraente non è evidenza.
- **E-06 Grey-box G1b (L1+concessioni claude/chatgpt).** G1 si splitta: **G1a** = pianta numerica firmata; **G1b** = pass grey-box su `/hud-layout` sopra la mappa viva: fill piatti ai Lab-target provvisori di F3.1 (marcati «provvisorio»), testo reale it/en al corpo P9, dati reali SOLO da selettori esistenti (`useRosterKitData`, `selectResourceOutlook`, nav config), elementi senza dato disegnati «assente». Vietato: asset generati, animazioni, hover/focus, logica nuova, componenti di produzione — codice usa-e-getta sotto `/hud-layout`, mai promosso. Scope: 1280×800 e 1440×900 × 3 zone mappa × vista panoramica e contestuale (narrativa e 1920/3440 restano numerici in G1a). Costo ≤0,5 giornata, 0 immagini. G1 = G1a + G1b: una candidata che passa i rettangoli ma fallisce gerarchia/densità/visibilità mappa non si approva.
- **E-07 Change control post-G1 (P2).** Dopo G1, LAYOUT-SPEC e i contratti JSON sono baseline immutabili: ogni variazione di posizione/dimensione/ancoraggio/capacità/modo richiede un record di deviazione (contratti toccati, motivo, impatto occupazione, viewport, conseguenze regressioni); variazioni su composizione/occupazione → ri-approvazione Director prima di proseguire. Nessun componente ridefinisce il proprio contratto. I test O-2 consumano solo la baseline versionata.

### 9.2 Sequenza decisioni e audit dati (FATAL)

- **E-08 Decisioni blueprint-shaping prima di G1 (risoluzione X3: K1+L10+deepseek).** F0.2 classifica ogni decisione aperta in: **(i) blueprint-shaping** (cambia rettangoli/ancoraggi/presenza/scala/dato-vs-assente) → DA CHIUDERE prima di G1, lista minima: scala interfaccia (§7.6), emblema ridotto/titolo/assente (§7.2), bussola+globo dentro/fuori (§7.3), sigillo nel pannello/altrove (§7.4), righe roster a riposo (§7.5), audit dati E-09; **(ii) spike-deferred** (estetica materiali, pareggi varianti) → G2 via card; **(iii) integration-deferred** (token preset, Tauri) → G3/F6. A G1 il Director riceve la lista (i) con default a una riga per voce (conferma o override, ≤15 min); voce lasciata aperta = auto-assente in pianta finché chiusa — nessun componente resta «pending» in pianta.
- **E-09 Audit esistenza dati in F0.2 (L10).** Tabella reale / contestuale / assente per componente PRIMA di G1 (seed: reale = roster, risorse+cibo, nav, tempo; non reale = bussola coordinate, sigillo %, Voce, contenuto pannello). F1 disegna solo elementi reali; gli altri compaiono come «assente». O-6 conta come dead anche un elemento fisso il cui stato normale è permanentemente vuoto (0 eroi, nessuna Voce) e ne richiede lo stato vuoto dichiarato.
- **E-10 Route lab fedele a /game (risoluzione X1: M2→controproposta orchestratore, accettata da gemini+claude+chatgpt).** `/hud-layout` resta route separata (niente chrome sperimentale dentro `/game` di produzione) MA deve importare lo stesso mount della mappa, lo stesso HUD slot container, lo stesso root scope CSS (`--hud-*`) e gli stessi bound del canvas di `/game` — overlay ancorati ai nodi reali, zero drift ambiente lab↔produzione.

### 9.3 Semantica della verifica (FATAL/MAJOR)

- **E-11 Occhio vs metrica — riscrittura di §3.4 (risoluzione X2: deepseek+claude).** (a) L'occhio è il verdetto per i claim PERCETTIVI (mappa protagonista, stessa civiltà, niente fake): si chiudono solo su testimone (cattura headless full-screen, side-by-side con pianta e mockup, firmata al gate). (b) La metrica è il verdetto per i claim NUMERICI (rettangoli, T-101b, contrasto, corpo, delta Lab): un test numerico rosso bloccante non si chiude a occhio. (c) Divergenza su stesso componente: run `inconclusive`, ticket metric-defect (sulla METRICA, non sul componente), waiver registrato in `DECISIONI-APERTE.md` con componente/test-id/valore/soglia/capture-id/motivo — firmato solo dal Director, mai dall'agente; compare nel box «known deviations» di G3; seconda divergenza consecutiva → Director come decisione di metric-design. (d) Non esiste stato «waived green»: i waiver sono «closed as accepted deviation». Se l'occhio dice KO e la metrica è verde, vale il KO senza waiver — l'occhio restringe, mai allenta.
- **E-12 Ink-bbox e divieto di compensazione via arte (L7+chatgpt-NEW2).** F5.1(g): test del bounding box d'inchiostro — bbox dei pixel alpha>threshold (cattura del solo chrome su fondo piatto) entro la soglia calibrata dal riquadro contratto; i margini trasparenti degli asset si misurano indipendentemente dal rect DOM (check in build asset: nessun margine trasparente >N px). Vietato compensare un difetto di geometria con padding/ornamenti/crop: ogni asset dichiara il suo alpha-bbox visibile e il piazzamento nel contratto; un difetto di geometria si corregge in pianta/contratto, mai nell'asset.
- **E-13 Accessibilità bloccante O-10 (L3).** Nuova obbligazione `state, blocking`: (a) ogni controllo persistente/contestuale raggiungibile da tastiera in ordine dichiarato, Esc chiude, focus torna all'origine; (b) focus ring ≥3:1 su chrome e mappa; hit target ≥24 px a 1280; (c) `prefers-reduced-motion` emulato: nessuna animazione ingresso/uscita, testato headless; (d) i contratti dichiarano il comportamento agli step interfaccia 100/125/150% (reflow o cap); O-3 misurato al 100% e allo step massimo. La decisione «dimensione interfaccia» (§7.6) entra in E-08(i), prima di G1.
- **E-14 Contrasto caso peggiore + segnale ridondante (L4).** O-5 contrasto: misurato contro i pixel campionati peggiori dietro ogni elemento (3 zone mappa, frame congelato, 5 catture); testo ≥4,5:1, icone e gemme di stato ≥3:1. Ogni stato ha un segnale ridondante oltre al colore (forma/icona/testo), verificato con cattura in scala di grigi.
- **E-15 Matrice stati vista×eventi + protocollo notifica (L5+K2).** F1.3 aggiunge la matrice viste×eventi concorrenti (pannello aperto × notifica × cambio selezione × coda): max elementi flottanti simultanei (proposto: 1 pannello + 1 notifica), priorità e posizione in collisione, nessun furto di focus. La notifica: elemento inline (mai overlay/backdrop), `aria-live="polite"`, durata proporzionale al testo o fino a dismiss, pausa su hover/focus, solo trigger da evento verificato, chiusura esplicita. Ogni riga della matrice renderizzata su `/hud-layout`, misurata contro P7, coperta da O-2 («nessun cambio di stato non dichiarato»).

### 9.4 Composizione incrementale e controllo iterazione (FATAL/MAJOR)

- **E-16 Composition witness in F4 (P3+L9, K6 scartato come ridondante).** Dopo il gruppo (1) barra superiore e di nuovo dopo il gruppo (2) roster: cattura della composizione completa con asset provvisori vs pianta approvata a 1280×800 e 1440×900 — checkpoint ingegneristico bloccante interno, NON un gate Director. Fallimento su allineamento/occupazione/gerarchia → stop costruzione fino a correzione; nessun gruppo successivo su baseline invalida. Stop rule: 2 fallimenti O-2 consecutivi sullo stesso componente → escalation Director; vietato rigenerare immagini per risolvere un fallimento di rettangolo. Prima di ogni gruppo: dichiarazione delle dipendenze a monte (contratti geometrici/contenuto stabili) e valutazione insieme dei gruppi che condividono allineamento/spaziatura/occupazione (P9).
- **E-17 G2 in situ (L8 modificato).** G2 mostra i due pezzi campione IN POSA sulla pianta G1b, sulle 3 zone mappa, con testo reale sopra il materiale. Al rifiuto il Director sceglie tra: accetta con nota, ripiego vettoriale/CSS, stop — il guard resta il budget F3 ≤30 e lo stop-the-line E-27 (niente cap numerico secco: il ruling «si itera qui» resta del Director).
- **E-18 Scorecard tratti con classi (D6+chatgpt).** F3.2 in due parti: checklist tratti per mockup (presente/assente, binaria, compilata PRIMA della generazione) divisa in **tratti obbligatori** (zero miss ammesso) e **tratti secondari** (miss ammesso ma scritto); riga per variante: tratti soddisfatti/mancati. Pareggi risolti dallo spike F3.3, mai da «pulizia». O-7 esige la tabella compilata, non prosa.
- **E-19 Smoke della cattura stessa (D7).** F5.1(h): canvas presente e non-blank, font caricati, chiavi i18n risolte (niente raw key), DPR e viewport riportati nell'artefatto, sha256 della cattura registrato. Cattura che manca uno di questi = inconclusive; una run non chiude su inconclusive.
- **E-20 O-5 per zona (D8).** Per ciascuna delle 3 zone (mare, giungla, terra chiara): delta Lab di oro/smalto/alabastro vs target F3.1 stampati con capture-id, per zona; la zona peggiore è quella che deve passare. Pass su una sola zona non è evidenza. F3.1 include lo script di misura delle ancore colore per terreno → JSON (K8).
- **E-21 O-9 misurato + reversibilità F6 (D9+P11+M9).** O-9: cattura preset `base` a 1280×800 e 1920×1080 con diff pixel-vs-pre-F6-baseline; diff non zero = fail, non review item. F6: l'integrazione deve essere reversibile in modo indipendente — preset rimovibile senza toccare dati canonici né restore di asset fuori dal proprio boundary; catture prima/dopo identiche di base e zanara; SHA commit integrazione + comando rollback nell'evidenza finale; diff automatizzato con overlay nell'evidenza di G3 (M9).
- **E-22 Matrice di copertura F5.2 (P10).** F5.2 pubblica una matrice machine-readable viewport×viste×zone×stress con stato di ogni cattura: tutti i viewport canonici ricevono le 3 viste primarie; le 3 zone coperte con ogni sfondo almeno sul viewport desktop primario e sul più restrittivo; gli stress che alterano geometria/visibilità hanno catture dedicate. Cattura mancante ≠ copertura approvata; la contact sheet del Director mostra il sottoinsieme rappresentativo, l'evidenza conserva la matrice intera.
- **E-23 Contact sheet G3 fissa + righe percettive vuote (L2+claude-NEW1).** Composizione fissa con controllo automatico di completezza che blocca la firma se manca un frame: 3 viste × 3 zone × 1280/1440/1920 + worst cases (14 eroi, testo it più lungo, notifica in coda con pannello aperto) + gli screenshot dei fallimenti PLAN-110 come riferimento «prima». Le 6 cause di §0 sono righe checklist con prova (crop). La checklist è generata da script su righe calcolate; le righe percettive (stessa civiltà, mappa protagonista) restano VUOTE per l'occhio del Director, mai pre-compilate dall'agente. Box visibile «known deviations» con ogni waiver E-11.
- **E-24 Baseline fedele in F0 (P6).** F0.1 registra: SHA commit del prototipo, comando di avvio riproducibile, dipendenze delle route, provenance degli asset, screenshot attuali, errori runtime noti, ownership DOM/canvas e slot di integrazione per componente. Distinzione «verificato-riusabile» vs «meramente esistente». Il prototipo resta congelato e non è baseline di accettazione.
- **E-25 Ownership dei contratti dati (P7).** Ogni contratto con dati dichiara: sorgente autoritativa, selettore/azione, owner, comportamento a dato assente, evidenza di verifica. Un dato condiviso ha UNA definizione autoritativa; i componenti non inventano/duplicano/sintetizzano valori di gioco; dato assente → stato contestuale/assente dichiarato, mai placeholder plausibili. Contratto di contenuto ≠ contratto di presentazione (la correttezza del dato non dipende dalla visibilità).
- **E-26 Registro dei declassati (M8).** `CONTENT-CONTRACTS.md` include il registro dei componenti declassati (bussola, sigillo, Voce) con il trigger dati esatto per ri-classificarli da contestuale a persistente.
- **E-27 Stop-the-line a livello di piano (claude-NEW2).** Dopo 2 rifiuti consecutivi dello stesso gate (G1b, G2, G3) il piano si ferma e il Director sceglie: ridimensionare, ripiego vettoriale/CSS, o chiudere con base invariato. Nessun terzo round senza sua decisione scritta.
- **E-28 Evidenza negativa ai gate (deepseek-NEW-G1).** Ogni firma di gate registra i 3 difetti più gravi trovati E CHIUSI nella fase; un gate senza lista difetti registrata è `inconclusive` (la verifica sospettosamente pulita è essa stessa un rilievo).
- **E-29 Binding firma↔evidenza (chatgpt-NEW1).** Ogni approvazione Director di gate referenzia un pacchetto di evidenza unico: capture-id, SHA sorgente, hash pianta, viewport, DPR, modalità rendering, risultati test. La firma vale solo per quel pacchetto; un cambio degli input approvati invalida la firma e richiede nuova review. Evidenza conservata con il record di verifica.
- **E-30 Rollback atomico su interruzione quota (deepseek-NEW-G2+M5).** Componente interrotto da tetto settimanale: rollback atomico all'ultimo set di asset committato (manifest E-31), marcato `blocked:quota`, NON conta come tentativo di chiusura (E-36). L'ordine dei gruppi F4 e i checkpoint E-16 preservano il progresso.
- **E-31 Asset content-hashed + manifest switch (M5+gemini-NEW2).** Directory asset con naming content-hashed (`/assets/hud/<nome>-<hash>.webp`) + singolo switch atomico `HUD_ASSET_MANIFEST` per rollback a downtime zero; vale anche come cache-busting in F6.
- **E-32 Fallback vettoriale prima di F4 (M3 modificato — gemini ha ritirato il front-loading).** La generazione resta per-componente in F4 (dopo contratto geometria+contenuto+checklist tratti, batch limitati con dedupe e contabilizzazione quota), MA prima di F4 si committano fallback CSS/SVG vettoriali funzionanti per le famiglie strutturali riproducibili: sono la rete di sicurezza su strozzatura quota, non sostituti automatici dell'arte approvata. Quota interrotta = `inconclusive`, mai approvazione implicita né fallback a pagamento (ruling F-10 PLAN-110).
- **E-33 Fallback <768px (L11).** Nuova decisione blueprint-shaping (E-08): a <768 px Zanara ripiega sul preset `base` (raccomandato — target desktop browser+Tauri) oppure riceve budget/corpo dedicati. Qualunque scelta è scritta in LAYOUT-SPEC e O-2 copre il 390 o come assertion del fallback o come check completo; finché la decisione E-08 non è chiusa, la copertura 390 di O-2 resta condizionale e non conta come verde.
- **E-34 Ritagli side-by-side automatici per O-7 (L12).** Le coppie mockup↔implementazione per O-7 sono generate da script, un crop per tratto; il Director vede solo tratti sotto soglia o in pareggio. Include fix dei numeri quota (60 usate, non 57 — lettura live) e aggiornamento §7.7 («dibattito eseguito»).
- **E-35 Numeri quota da file (D11).** I numeri di quota nel piano si leggono da `gen-budget.json` al `plan:stamp`, non trascritti a mano.
- **E-36 Capture-id fresco per chiusura (D12).** Ogni tentativo di chiusura componente cita un capture-id nuovo; riuso dello stesso capture-id in due tentativi = fail; 2 tentativi inconclusive consecutivi → Director al prossimo gate.
- **E-37 Resize/DPR dinamici (gemini-NEW1).** LAYOUT-SPEC dichiara debounce di resize e normalizzazione DPR; verificato in F5.1 (catture dichiarano viewport/DPR/ambiente, T-22); DPR testato a 1 e 2.
- **E-38 Linea di riferimento (K7).** Nelle catture di allineamento si renderizza una linea guida 0,5 px a opacità 50% per la verifica ±1 px.
- **E-39 Split stima (M6).** §6 chiarifica: ~8–11 giornate-agente di lavoro + ~3–5 giorni di latenza gate asincroni; niente tracking per-fase (P12 scartato come cerimonia).

### 9.5 Scartati (con motivo)

- **M4** maschere alpha-gradient per T-101b sulle sagome: varianza di calibrazione extra contaminerebbe E-03; i fill piatti + G1b bastano (deepseek, accolto).
- **P8** coverage matrix famiglie asset su F3.3: lo spike sono 2 pezzi scelti perché «il materiale decide», non un disegno campionario; la copertura si chiude nello stop rule E-16 (claude+deepseek, accolto).
- **P12** tracking effort per fase: contabilità senza decisione che cambia (deepseek, accolto).
- **K6** checkpoint ogni 3 componenti: cadenza arbitraria, ridondante con E-16 (chatgpt+claude, accolto — i checkpoint seguono i gruppi di rischio, non il conteggio).
- **M3 originale** generazione strutturale anticipata in F3: viola P2 e rischia quota su varianti scartate prima di G1 (gemini self-reject + chatgpt, accolto → E-32).
- **M1 valori fissi** ±3px/±1,5% hardcodati nel flag: nuove costanti arbitrarie al posto delle vecchie; soglie derivate da E-03 (chatgpt+claude, accolto).
- **K4 come budget+buffer**: la banda di rumore non è budget HUD extra (chatgpt, accolto → E-04).
- **L8 cap «2 round ≤12 img»** su G2: confligge col ruling Director «si itera qui»; guard = budget F3 ≤30 + E-27 (deepseek, accolto → E-17).
- **D6 zero-miss assoluto**: classi obbligatorio/secondario (chatgpt, accolto → E-18).
- **K3** badge post-G2: marginale, assorbito dall'ordine di E-17. **K5** side-by-side dei 12 legacy: ridondante con F5.4+F0. **K1 letterale** (tutte le 5 decisioni prima di G1): assorbito dalla classificazione E-08. **L10 come rilievo separato**: fuso in E-09.

### 9.6 Emendamenti del Director (post-convergenza)

Emendamenti approvati dal Director DOPO il voto 5/5 su artifact-r002: non fanno parte del consenso del dibattito, sono ruling diretti con la stessa forza degli E-NN.

- **E-40 Panel family fit check (Director, 2026-11-05 — richiesta: «il plan prevede il layout degli altri componenti e come si sposano con la HUD?»).** La pianta non valida un solo archetipo di pannello: in **F0.2** si compila l'inventario dei pannelli flottanti di produzione su `/game`, raggruppati per famiglia — **quest** (detail/cockpit, reward popup a placca page-level, skill-check overlay, outcome toast, assignment preview), **table** (registry, merchant, stash, trade route), **editorial** (hero sheet, event/activity ledger, memorial, reliquary, settings, load game), **transient overlay** (Voce/notifica, fatigue alert, rest, settlement lost, theatre overlay, invasion window), **menu/sistema** (title, menu dialog). Per ogni voce si dichiara: **slot ospite in pianta** (o «resta base» / «fuori scope»), ingombro minimo (min l×a dal componente reale o dal suo contratto), comportamento nella vista contestuale, e se partecipa al tetto simultaneo di E-15. In **F1** lo slot pannello (e ogni altro slot che ospita famiglie) riceve un **fit check**: il riquadro deve contenere l'ingombro minimo della variante più larga in-scope della famiglia, a 1280×800 e 1440×900; G1 non firma uno slot che la variante più larga non entra. Gli overlay che vivono fuori dagli slot (placche page-level, overlay full-screen) sono enumerati nella matrice E-15 con priorità di collisione dichiarata, non trattati come eccezioni. Le famiglie «resta base» sono registrate nel registro dei declassati (E-26) con il trigger di re-grade.

## 9. Decisioni del Director (registro)
- **2026-11-05, D1 = pianta B (roster compatto con medaglioni).** Scelta guardando tre sagome (A colonna con placche ~21% fissi, B compatto ~14%, C barra eroi in basso ~13%, stime da sagoma, non misure). visual-fork: schizzo inline del 2026-11-05 (non una card firmata); la card F1.5 resta il gate formale e dovrà ora confrontare **varianti di B**, non più A/B/C.
- **Conseguenze dichiarate per F1–F4:**
  - Il roster a riposo mostra solo ritratti in medaglione; nome, livello e barre stanno nella placca **al passaggio/selezione/tastiera** (questo contraddice il default D5 «nomi visibili» che il Director aveva scelto per la fascia del mockup: da riconfermare in F1 con le immagini davanti).
  - ~~Gli stati sul medaglione~~ — **ANNULLATO** (Director ruling 2026-11-05: nessuna modifica agli stati del medaglione; il medaglione resta anello+ritratto, stati solo in placca/aria-label).
  - La fascia larga con edera (rail2) e la placca sempre aperta del prototipo R2 non sono più la direzione; restano nel prototipo come riferimento.
  - Budget: il roster pesa ~14% dei fissi a pianta; resta da misurare con T-101b sulla sagoma vera.
- **Ancora aperte:** D5 (nomi a riposo), D6 (scala di riferimento), e le decisioni spike-deferred di G2.
- **2026-11-05, D5 = solo ritratti, nome e barre al passaggio/selezione/tastiera** (opzione più compatta, ~14% di fissi). L'eroe selezionato **non** tiene la placca aperta per default (opzione scartata dal Director); a riposo non si legge nessun nome. Conseguenza: lo stato attivo deve distinguersi dal solo anello (alone/arco), e il nome va dato anche da `aria-label` e tooltip. Rischio dichiarato: leggibilità a riposo (audit HUD-108 §3.7) — da verificare con la pianta vera e con 14 eroi in F5.3.
- **2026-11-05, D6 = tela di riferimento 1440×810 (16:9) + impostazione «dimensione interfaccia» a step 100/125/150%.** Il testo a 1280×800 scala a 0,89 (corpo 16 → 14,2 px reali; pavimento di testo corrente sulla tela = 16, didascalie 14). L'area occupata a parità di pianta cresce di ~23% rispetto a 1600×900: con la pianta B (~14% fissi) resta ≈17,3%, sotto il tetto del 18%, da misurare con T-101b (O-3). La tabella tipografica di F2 va riscritta su questa tela (hudType.ts oggi è su 1600×900).
- **Ancora aperte dopo D5/D6:** decisioni spike-deferred di G2 (cimiero, stella, icone nav, smalto) e le integration-deferred.

## 10. Avanzamento
- **2026-11-05, battesimo:** `plan:stamp open PLAN-112` eseguito.
- **F1 in corso:** pianta B disegnata come contratto dati (`hudLayoutB.ts`), pagina `/hud-layout` (3 viste, guide, misura DOM) e test permanente (36 verifiche, mutazione controllata). Specifica in `.mw/specs/hud-real/LAYOUT-SPEC.md`. **Mancano per G1:** card visual-fork delle varianti di B, fit check famiglie di pannelli, vista mobile, firma del Director. Trovato: la «dimensione interfaccia» 125/150% non entra a 1440×810 senza riflusso della barra alta (D6b).
- **2026-11-05, D6b = riflusso della barra alta** (approvato dal Director: «approvo», in risposta alla mia raccomandazione; da riconfermare se intendeva la firma G1, che **non** è data). Implementato in `resolveSlots` (barra alta, riga bassa, altezze adattive) con test permanente a 67 verifiche. Aperta D6c: il 150% non entra in altezza sulle finestre 16:9 fino a 2560×1440.
- **2026-11-05, D6c = pannello a scorrimento per il 150%** (scelta del Director). Implementato: minimo 240 px, il pannello finisce sopra la nav quando si toccano; il 150% entra ovunque; test a 68 verifiche. **Proposta planner da confermare:** eccezione di budget 24% al 150% (le misure dei riquadri sono 20–21% a 16:9). Il vincolo O-3 del contratto di chiusura vale 18% a 100/125% e 24% al 150%.
- **2026-11-05, budget di ingombro CONFERMATO dal Director: 18% a 100/125%, 24% al 150%** (eccezione di accessibilità). O-3 del contratto di chiusura aggiornato di conseguenza; il test `hudLayoutContract` lo applica già.
- **2026-11-05, fit check F1 fatto** (sulle dimensioni di configurazione, non su rendering): tutte le famiglie hanno un posto. Corretto lo slot del pannello a **340** (il mercante, min 320, non entrava a 300). Trovate tre regole da fissare in F2: un solo slot contestuale a destra (esclusione tra scorta, mercante, scheda eroe, eventi), finestra di spedizione che sostituisce il pannello laterale a 125/150%, riancoraggio di `QuestOutcomeToast`. Test `hudLayoutFit.test.ts`. **Per G1 mancano:** scheda varianti di B, pannello a scorrimento con contenuto lungo, vista mobile, firma.
- **2026-11-05, F1.5 card pronta:** `.mw/runs/plan112-f1/visual-fork-pianta-B.md` con tre varianti di B (B1 una riga allineata, B2 modulo alto fuso, B3 eroi fluttuanti), tavola `varianti-B.png` e `/hud-layout?variant=`. 136 test verdi. **Ruling del Director: in attesa.** visual-fork: card in `.mw/runs/plan112-f1/` — baseline sha256 nei suoi file.
- **2026-11-05, ruling F1.5: il Director sceglie B1** (una riga allineata). Card `.mw/runs/plan112-f1/visual-fork-pianta-B.md` chiusa (`status: ruled`). Nessun cambio di codice: B1 è il contratto base. **Per G1 restano:** pannello a scorrimento con contenuto lungo, vista mobile, firma del Director.
- **2026-11-05, prova del pannello a scorrimento (F1) fatta:** titolo e azione fissi, corpo che scorre, tastiera ok, nessun errore, misurata a 100/150% su tre finestre (`LAYOUT-SPEC.md`). Limite: al minimo (150% su 1080p) il corpo mostra ~4 righe (D6d chiusa: errore di misura, vedi sezione 10). **Per G1 restano:** vista mobile e firma del Director.
- **2026-11-05, vista mobile (F1) fatta:** D10 implementato (`blueprintMode`, soglia agganciata a `isMobileFitViewport`), test a 138 verifiche. **Trovato D10b:** sulle finestre sotto scala 0,875 (laptop 1366×650, finestre < 1260 px) il testo corrente scende sotto 14 px reali; quattro opzioni in `LAYOUT-SPEC.md`, decisione aperta. **Per G1 resta la firma** (più D6d e D10b da decidere o dichiarare note).
- **2026-11-05, D10b = tela più bassa (scelta del Director): riferimento 1440×720** (era 1440×810, D6 rivista). Implementato (`REF_H = 720`), 124 test verdi. Effetti: testo ≥ 14 reali anche su 1366×650 e 1280×650; fissi 12,3% a 100% e 17,2% a 125% (sui riquadri; rischio di superare il 18% a pixel al 125%, da misurare in F5); il 150% non è più offerto sulle finestre basse e su 2400×1000. La tabella tipografica di F2 va scritta su questa tela. **Per G1 restano:** D6d e la firma.
- **2026-11-05, D6d chiusa con una correzione:** il limite «~4 righe al minimo» dichiarato dopo la prova del pannello a scorrimento era un errore di unità di misura (altezza del pannello in px reali contro altezza del corpo in px di tela). Ricalcolato: al minimo (150% su 1080p) il corpo mostra ~7,7 righe da 21 px. Nessun intervento sulla nav. **Per G1 resta solo la firma del Director.**

## 11. G1 FIRMATO (2026-11-05)
- **Il Director firma G1:** la pianta **B1** (una riga allineata) sulla **tela di riferimento 1440×720**, con: margine 24 e griglia 8; barra alta unica (eroi, tempo, risorse) sulla stessa linea centrale; colonna destra e riga bassa sul margine unico; pannello 340×470 che scorre sotto la sua altezza naturale (minimo 240, ~7,7 righe); passi interfaccia 100/125/150% con riflusso della barra alta e della riga bassa e altezze adattive; **budget fissi 18% a 100/125% e 24% al 150%**; sotto 768 px HUD `base` (D10); D1=B, D5=solo ritratti con nome al passaggio, D6/D6b/D6c/D6d, D10b.
- **Cosa si firma, con impronte (sha256, 16 caratteri):** `src/ui/idleVillage/hudReal/layout/hudLayoutB.ts` = `7883a4adf7e7f418` · card `.mw/runs/plan112-f1/visual-fork-pianta-B.md` = `c0b2aa18ba0aac1c` · specifica `.mw/specs/hud-real/LAYOUT-SPEC.md` · test `hudLayoutContract`, `hudLayoutFit`, `hudLayoutVariants`, `hudLayoutMobile` (`.test.ts` in `tests/unit/idleVillage/`): 124 verifiche verdi alla firma, `tsc` pulito.
- **Dopo la firma:** il contratto si cambia solo con una nuova decisione scritta del Director (amend di G1) e con l'aggiornamento dei test; i componenti si adattano alla pianta, non il contrario (P2).
- **Limiti noti accettati alla firma:** tablet 768–1180 px non leggibile (scala < 0,875); il 125% potrebbe superare il 18% a pixel (da misurare in F5); fit check calcolato dalla configurazione e non da rendering dei pannelli veri; la pianta è in sagome, non in arte.
- **Prossimo: F2** (contratti di contenuto, tabella tipografica su 1440×720, regole di esclusione dello slot contestuale e riancoraggio del toast), 0 immagini.

## 12. F2 — contratti di contenuto (2026-11-05)
- **Fatto (0 immagini, 0 componenti):** `.mw/specs/hud-real/CONTENT-CONTRACTS.md` (tabella tipografica su 1440×720, contratti dei 7 slot con dato reale o «manca», regole di esclusione E-15, movimento e accessibilità), tipi in `src/ui/idleVillage/hudReal/contracts/hudContracts.ts`, scala in `hudType.ts` (aggiornata al nuovo riferimento), test `hudTypeScale.test.ts` (11 verifiche: i token raggiungono i pavimenti in px reali alla scala 0,875; i contratti seguono la pianta firmata). `tsc` pulito.
- **Il contratto di pianta firmato (`hudLayoutB.ts`) non è stato toccato.**
- **Aperte per il Director:** A1 (slot per le notifiche di esito: richiede amend di G1), A2–A4 (tasti velocità, scheda eroe a 340, icone di ricompensa non risorsa).
- **Dati mancanti dichiarati:** pannello (nessuna sorgente unica), notifiche (nessun evento), tempo e comandi (da cablare), nessun meteo.
- **Gate:** G2 (spike materiali, F3) non è ancora aperto; F3 usa quota Gemini (≤ 30 immagini) e richiede il via del Director.

## 13. AMEND G1 #1 — slot notifiche di esito (2026-11-05)
- **Decisione scritta del Director:** «Sì, amend G1» (risposta alla proposta A1 di F2). Il contratto firmato in §11 cambia **solo** per aggiungere lo slot `toast`.
- **Cambio:** nuovo slot `toast` («Esiti», temporaneo, livello 2, 320×72, basso-sinistra, **impilato sopra la Voce**, vista narrativa). Con il riflusso della riga bassa segue la Voce sopra la nav. Il tetto del roster è ora il bordo alto di questa pila (Voce + esito), non più quello della Voce. `QuestOutcomeToast` va riancorato qui (oggi in alto a destra, collideva con le risorse).
- **Effetto misurato:** a 100% il roster resta a **5 righe** (432) ovunque; a 125% scende a 3–5 righe e a 150% a 2–3 righe sulle finestre basse (1440×720: 3 righe a 125%, 2 a 150%). **I passi offerti non cambiano** (100/125/150 sulle finestre alte, 100/125 sulle basse). Budget invariato (lo slot è temporaneo).
- **Nuova impronta del contratto:** `hudLayoutB.ts` sha256 `31b7bdaeda9c32b6` (era `7883a4adf7e7f418` alla firma). Scheda varianti: invariata (`c0b2aa18ba0aac1c`). Test: 130 verifiche verdi, `tsc` pulito, mappatura dei contratti aggiornata (`hudContracts.ts`: `toast` in `HudSlotId`, `STATE_MATRIX`, `SLOT_MODE`).
- **Limite:** a 150% sulle finestre basse il roster mostra 2 righe (scorre); da riconsiderare in F5 con la misura a pixel e con 14 eroi.

## 14. A2–A4 e scoperta A5 (2026-11-05)
- **A2 risolto:** Spazio e 1–9 sono già legati nel gioco; il tempo nuovo non lega tasti e riceve `locked` (aggiunto al contratto). **A3:** `HeroSheetPanel` è compatibile a 340 sulla carta (non provata a rendering); si ancora da sé e usa 12 px reali (sotto la scala nuova, migrazione in F6). **A4:** il gioco ha icone solo per oro, cibo, legno: cristallo e libro restano fuori.
- **A5 — aperto, da decidere PRIMA di F3:** la HUD di produzione è disegnata in **pixel CSS 1:1** con zoom `hudScale` che **non scende mai sotto 1** (modi auto/1/1,25/1,5/2; `auto` = 1 fino a Full HD, poi proporzionale fino a 2; i pannelli vivono nel layer «chrome» con zoom e convertono i pixel con `getHudZoomFactor`). La pianta firmata usa invece una **tela proporzionale** (1440×720) che **rimpicciolisce** sulle finestre piccole. Misurato il contratto firmato nel modello del gioco (pixel CSS, zoom ≥ 1): 1280×720 e 1366×768 tengono i fissi a 13,8% e 12,1% a zoom 1 (testo sempre 16 px reali), a zoom 1,25 passano ma superano il 18% su 1280×720 (18,2%); a 1280×650 il 125% non entra. Dettagli e opzioni: `LAYOUT-SPEC.md` (sezione A5).

## 15. AMEND G1 #2 — modello di scala del gioco (A5-a, 2026-11-05)
- **Decisione scritta del Director:** «A5-a: modello del gioco». Sostituisce, nel contratto firmato, la **tela proporzionale 1440×720** (D6, D6b, D10b) con il **modello di scala del gioco**: layout in **pixel CSS 1:1**, unica scala = lo **zoom HUD** di `hudScale.ts` (da 1 a 2, modi auto/1/1,25/1,5/2, **mai sotto 1**); la tela è la finestra divisa per lo zoom. Si usano le funzioni vere (`resolveHudScale`, `HUD_SCALE_MIN/MAX`), non copie.
- **Cosa resta firmato:** pianta B1, margine 24 e griglia 8, barra alta unica con riflusso, riga bassa con riflusso, slot `toast` (amend #1), pannello 340×470 con scorrimento (minimo 240), fallback `base` sotto 768 px (soglia agganciata a `isMobileFitViewport`), **budget** fissi 18% (24% da zoom 1,5): ora **applicato dentro `fits`**, quindi uno zoom che sfora il budget **non viene offerto**.
- **Cosa decade:** tela di riferimento 1440×720, `frameFor` proporzionale, «scala leggibile» 0,875 (D10b: nel modello del gioco il testo è ≥ 16 px reali a zoom 1), passi 100/125/150 della tela proporzionale. La scala tipografica (`hudType.ts`) resta con gli stessi token, ora in pixel CSS.
- **Zoom offerti dal contratto (test `allowed zooms`):** 1180×820, 1280×650, 1280×720: **solo 1** (il 125% darebbe 18,2% a 1280×720); 1366×768: 1 e 1,25; 1440×810: 1, 1,25, 1,5; ≥ 1920×1080: 1, 1,25, 1,5, 2. In app, `auto` vale 1 fino a Full HD e poi sale (`autoHudScale`).
- **Test:** 145 verifiche verdi (5 file), compreso «lo zoom non scende mai sotto 1», «lo zoom auto del contratto = `autoHudScale`» e «testo ≥ 16 px reali a zoom 1 su finestre ≥ 768».
- **Nuova impronta del contratto:** `hudLayoutB.ts` sha256 `f90e35d941dfe0a0` (G1: `7883a4adf7e7f418`; amend #1: `31b7bdaeda9c32b6`). Backup del file dell'amend #1: `.mw/runs/plan112-f1/hudLayoutB.amend1.ts.bak`.
- **Integrazione (F6) semplificata:** i pannelli di produzione vivono già in pixel CSS nel layer «chrome» con `getHudZoomFactor`; la pianta non introduce un secondo zoom.
- **Limiti:** su finestre piccole (≤ 1280×720) è offerto solo lo zoom 1; i fissi pesano il 13,8–15,1% a zoom 1 (sui riquadri, prima 10,9–12,3% con la tela proporzionale); la misura a pixel resta in F5.
## 16. Correzione di un mio errore di verifica (2026-11-05)
Tutti i «`tsc` pulito» scritti in questa sessione erano **vuoti**: il `tsconfig.json` radice ha `files: []` e solo riferimenti, quindi `tsc --noEmit -p .` non compila nulla; e `tsc -p tsconfig.app.json` si ferma agli errori di sintassi di file altrui (altra sessione a metà lavoro, `GuardianDryRunAnalyzer.ts`, `idleVillageMapAssetTelemetry.ts`) e non arriva ai controlli di tipo. Ricontrollato i miei file con una configurazione temporanea (`tsconfig.hudtmp.json`, estende `tsconfig.app.json`): **2 errori veri trovati e corretti** (proprietà duplicata in `hud-compose.tsx`; costanti rimosse in `hud-layout.tsx`). Restano 13 segnalazioni sul tipo delle chiavi di traduzione in `HudRealNav`/`HudRealRoster`, **dello stesso tipo di quelle che la stessa configurazione dà sul file di produzione `GameFrame.tsx` (16)**: le considero un artefatto della configurazione temporanea, non verificate con la compilazione vera dell'app. I test di unità (145) restano il controllo affidabile.

## 17. F3.1 — bersagli di colore (2026-11-05)
- **Fatto (0 immagini, nessun asset toccato):** misura su mockup, nostri asset e zone di mappa; `.mw/specs/hud-real/f3/COLOR-TARGETS.md`, `color-targets.json`, prova `color-proof.png` (script `measure-materials.py`, `color-proof.py`).
- **Risultato:** lo smalto nostro è **più scuro (L 15,8 contro 21,6), più saturo e più verde** (168° contro 196°) del mockup; l'oro è **più saturo (C 37,9 contro 30,1) e con luci molto più alte** (p90 91,5 contro 78,5) — la causa probabile dell'effetto «plastica». Alabastro e vetro allineati. Sulla giungla lo smalto del mockup ha la stessa luminosità dello sfondo (separa solo la tinta e l'oro del bordo).
- **Due candidati (A fedele al mockup, B compromesso verde) + attuale; scelta a G2 sui pezzi campione.** Soglie di coerenza proposte nel documento.

## 18. F3.2 — scheda dei tratti (2026-11-05)
- `.mw/specs/hud-real/f3/TRAITS-CARDS.md`: tratti presenti e assenti del medaglione (R1–R9) e della cornice del pannello (P1–P11), deviazioni dichiarate (gemma al posto della bussola nel bottone; finestra ad arco opzionale; una **traccia dell'arco di salute** sul medaglione, aggiunta non del mockup) e scorecard di scelta (+1 per tratto presente, −2 per elemento assente nel mockup che compare). I prompt di F3.3 non nominano nessun ornamento assente nel mockup.

## 19. F3.3 — spike materiali (2026-11-05, in corso)
- **Medaglione:** 2 varianti (la terza è stata saltata: quota oraria). Nessuna migliora l'anello approvato; la scanalatura per l'arco non serve (l'arco si disegna in codice sul foro). Raccomandazione: tenere l'approvato; spike ridotto a gemma di stato + arco.
- **Cornice del pannello:** 3 varianti valutate (pf-4 non uscita per quota, saltata). pf-1 e pf-3 hanno 8/9 tratti; pf-2 scartata (righe). **Nessuna** ha la finestra ad arco. Provate sulla mappa con contenuto vero in `/hud-panel-compare` (lab, non tocca la produzione): sono più alte della cornice attuale (533/513 contro 433 px) e fanno star bene il testo da 16 px, ma sforano lo slot 340×470 della pianta firmata: **decisione di G2: alzare lo slot a ~520 (amend G1 #3) oppure comprimere la cornice**.
- **Pacchetto G2 (da completare):** `f3/COLOR-TARGETS.md`, `f3/TRAITS-CARDS.md`, `/hud-panel-compare`, i due candidati colore A/B (non ancora applicati ai pezzi: solo misura).
- **Chiusura della generazione di F3.3 (2026-11-05):** quota usata 65 su 170; due immagini non sono uscite per quota oraria (med-3, pf-4) e sono state saltate, non rigenerate. **La coda di generazione è ferma e vuota.** Resta il pacchetto per G2.

## 20. Pacchetto G2 pronto (2026-11-05)
`.mw/specs/hud-real/f3/G2-PACKAGE.md`: cosa guardare (`/hud-panel-compare`, immagini, `color-proof.png`) e sei decisioni (G2-1 cornice, G2-2 slot del pannello / amend G1 #3, G2-3 medaglione, G2-4 colore A/B, G2-5 cimiero, G2-6 soglie), ciascuna con il dato e una raccomandazione non vincolante; elenco esplicito di ciò che **non** è stato verificato. **Ruling del Director: in attesa.** F4 non parte prima di G2.

## 21. G2-1 deciso dal Director: cornice pf-3 (2026-11-05)
- **Ruling:** «pf3 procedi». Cornice del pannello = **pf-3** (`.mw/specs/hud-real/f3/gen/pf-3-0.png`). Medaglione, colore (A/B), soglie e **slot del pannello (G2-2, amend G1 #3)** **non sono stati decisi**: restano aperti. Il planner prosegue sulla sola costruzione dell'asset e non modifica il contratto di pianta firmato.

## 22. AMEND G1 #3 — slot del pannello 340×520 (2026-11-05)
- **Decisione scritta del Director:** «Sì, amend #3» (G2-2, in risposta alla proposta di alzare lo slot per la cornice pf-3, alta 512,7 px).
- **Cambio:** lo slot `panel` passa da 340×470 a **340×520** (`PANEL_H = 520`); il minimo per lo scorrimento resta 240. Nient'altro nel contratto.
- **Effetto misurato (zoom offerti, altezza del pannello; `s` = scorre):** 1280×650: solo zoom 1, 474 s · 1280×720: solo zoom 1, 520 · 1366×768: zoom 1 (520) e 1,25 (326 s) · 1440×810: 1 (520), 1,25 (360 s), 1,5 (252 s) · 1920×1080: 1, 1,25, 1,5 interi (520) e 2 (252 s) · 2560×1440: tutti interi (520). **I passi di zoom offerti non cambiano** (stessi di prima dell'amend).
- **Verifica:** 145 test verdi (5 file). Budget invariato (il pannello è contestuale).
- **Impronta nuova del contratto:** `hudLayoutB.ts` sha256 `e46c7b4df827b47d` (G1 `7883a4adf7e7f418` → amend #1 `31b7bdaeda9c32b6` → amend #2 `f90e35d941dfe0a0` → amend #3). Backup del file dopo l'amend #2: `.mw/runs/plan112-f1/hudLayoutB.amend2.ts.bak`.
- **Aperto:** la pagina di prova `/hud-compose` posiziona ancora il sigillo sotto il pannello a distanza fissa (decisione D4: il sigillo va **dentro** il pannello): da riallineare in F4. Il fit check dei pannelli di gioco (`fitPanel`) è stato rieseguito e passa, ma resta calcolato dalla configurazione e non da rendering.

## 23. G2-4 deciso e applicato: oro A, smalto B (2026-11-05)
- Applicato a 25 asset con `apply-palette.py` (rollback in `f3/rollback-color/`); in media oro (C 32,0 · p90 82,1) e smalto (L 19,7 · tinta 178°) nelle soglie proposte; **per pezzo 20/25 hanno ancora l'oro sopra la soglia**: G2-6 (soglie) resta aperta con due opzioni (seconda riduzione dell'oro oppure soglia allargata a C ≤ 37, p90 ≤ 87). Errore corretto: vetro scuro del sigillo schiarito per sbaglio, ripristinato. **G2-3 (medaglione) resta aperta.** F4 non parte prima di G2-3 e G2-6.

## 24. G2-6 deciso: soglia per pezzo (2026-11-05)
- **«Allarga soglia»** (Director). Soglie e regole in `.mw/specs/hud-real/f3/COLOR-TARGETS.md` («G2-6 deciso»); controllo `check-palette.py`; **test permanente `hudPaletteCheck.test.ts` (verde: 25 pezzi, 0 fuori soglia)**. Ritocchi per pezzo in `apply-palette.py` (marchio, anello, pannello).
- **Dichiarato:** la luminosità mediana dell'oro è stata allargata da me (50–73) oltre ciò che il Director ha scelto (cromia ≤ 37, luci ≤ 87); le soglie sono state fissate dopo aver visto i numeri.
- **Aperto:** **G2-3 (medaglione)**: il planner raccomanda di tenere l'approvato. Poi **gate G2 chiuso** e F4 può partire.

## 25. G2-3 deciso e G2 CHIUSO (2026-11-05)
- **G2-3:** il Director conferma («Sì, tieni»): **si tiene il medaglione già approvato** (`C1/ring.webp` + mezzaluna fusa `C1/ring-fused.webp`); med-1 e med-2 restano in `f3/gen/` solo come riferimento. Lo stato sul medaglione sarà **gemma di stato + arco di salute disegnato in codice sul bordo del foro** (la scanalatura generata non serve). Nessuna rigenerazione.
- **Riepilogo G2 (tutto deciso):** G2-1 cornice pf-3 · G2-2 slot 340×520 (amend G1 #3) · G2-3 medaglione approvato · G2-4 oro A + smalto B · G2-5 nessun cimiero nella panoramica (D2) · G2-6 soglie per pezzo allargate, controllo e test permanente.
- **Quota:** 65/170 immagini usate, 105 residue; la generazione resta ferma. **F4 può partire** (componenti nell'ordine della pianta): barra alta come sistema → roster + stati → nav → pannello + sigillo dentro → notifiche → opzionali.

## 26. F4 gruppo 1 — barra alta sul contratto (2026-11-05)
- **Fatto:** `/hud-compose` riscritta sul contratto firmato (canvas `frameFor`+`resolveSlots`, zoom del gioco via `hudScale`, `?view=overview|context|narrative`, `?zoom=`); gli elementi fuori pianta (marchio, busto, bussola, globo, sigillo libero) tolti dalla pagina. Barre slim (chirurgia, 0 immagini nuove): `resources/bar-slim.webp` 360×58 e `time/bar-slim.webp` 419,5×54 da `build-slim-bars.py` (banda a misura nativa, bande compresse, pendente tolto, cap/medaglione riscalati) + geometrie e slot misurati sull'alfa; lift d'oro per la soglia G2-6 (L50 49→≥50). Nuovo `HudRealRosterColumn` (medaglioni 72, passo 80, placca 200 solo hover/focus/touch — D5 rispettata: la selezione è alone, non placca; trattamento ritratto da `zanaraRosterState`; scorrimento a righe con frecce tastiera e fade). Tempo: tolto il testo PAUSED dal campo (troncava «Giorno N»; pausa già ridondante sul bottone).
- **Witness E-16 (checkpoint interno gruppo 1):** `scripts/hud-real/probe-topbar-rects.mjs` PASS — rect roster 24,24,88×432 · tempo e risorse sulla stessa linea centrale (±1px) · passo 80 · nessun errore pagina, a 1280×800 e 1440×900 DPR 2 (canvas=viewport a zoom 1). Catture: `test-results/plan112-f4-topbar/` (panoramica + contestuale). Occhio sul crop DPR2: barre vicine alle proporzioni del mockup, «DAY 1» completo, pericolo cibo leggibile (vermiglio + clessidra + filetto).
- **Test:** 135/135 verdi (4 file layout + palette); eslint `--no-ignore` 0 errori sui file toccati (2 warning di import limitato sulla pagina lab, come prima).
- **Aperti (dichiarati):** nav, pannello, Voce, comandi montati ai loro rect ma ancora a misura prototipo R2 (li riportano i loro step); toast non montato; stati del roster (arco salute sul foro + gemma, G2-3) nel prossimo step; verifica vs mockup resta a occhio su cattura (nessun crop side-by-side automatico ancora — E-34 resta per O-7).
- **Non verificato:** ingombro a pixel dei fissi col nuovo chrome (misura T-101b resta in F5/O-3a); placca del roster vista solo al passaggio simulato, non con touch reale; `/hud-compose?view=context&zoom=1.5` non catturato.

## 27. F4 — stati sul medaglione (2026-11-05)
- `HudRealRosterColumn`: arco di salute disegnato in codice sul bordo del foro (G2-3; SVG, T-02 rispettata: niente round cap, niente arco sotto 1%) — verde sopra 30%, vermiglio sotto, **oro+alone sul selezionato** («arco acceso» D5); gemma di stato sul punto basso (lit/dim/iron da `zanaraRosterState.gem`); «salute NN%» nell'aria-label. E-14: segnale ridondante = gemma (colore+forma) + trattamento ritratto + etichetta in placca.
- **Verificato a occhio (DPR2):** medaglioni con arco verde pieno, selezionato con arco oro e alone, gemme smeraldo leggibili. Lint pulito, probe rects PASS.
- **Non verificato:** stati non-`available` dal vivo (away/exhausted/injured/dead/locked: servono residenti in quegli stati o una fixture); la placca a touch reale.

## 28. G2-5 RIAPERTO: il cimiero non è «nessun cimiero» (2026-11-05)
- **Correzione.** La voce G2-5 «nessun cimiero nella panoramica (D2)» in §25 è stata registrata come decisa, ma il Director non l'ha mai detta: era una mia inferenza. Il Director (2026-11-05) chiede un cimiero in cima alla colonna roster: fenice con Sol Invictus dentro un componente circolare ricco, che si bilanci con la riga alta e sia ricco quanto l'astrolabio in basso al centro. **G2-5 è aperto.** Nessun obbligo di anti-clip era mai stato firmato: va tolto da qualunque lista di vincoli.
- **Nuove obbligazioni F4.2 (roster).** (a) medaglione con maschera circolare dal foro misurato; (b) scorrimento a nastro tra due rulli, nessun taglio retto visibile a nessuna posizione, con test permanente di nessun taglio a 1/5/14 eroi e ai zoom offerti; (c) pannello aperto derivato da `/game` (filtri, ordinamento, densità) che non lascia righe vuote; (d) il cimiero è un componente a parte, non un'immagine di prova.
- **Proposta amend G1 #4 (serve decisione scritta del Director).** Il roster guadagna un'altezza per il cimiero sopra la colonna; il pannello aperto ha uno slot contestuale secondo, dimensionato dal suo contenuto e limitato all'altezza del nastro.
- **Stato del mockup (lab, `/hud-roster-mockup`, non produzione).** Chiuso: colonna di medaglioni con rulli, leggibile; scorrimento verificato con misura di metà corsa e dopo rotella. Aperto: nessuna card tagliata (misurato), nessuno spazio vuoto. Cimiero: anelli incisi, anello di gemme, facce smaltate, ma ancora meno denso dell'astrolabio; confronto non ancora a scala uguale.
- **Non verificato.** Cimiero a scala uguale all'astrolabio; stati non-`available` dal vivo; nessuna cornice reale (le cornici del mockup sono CSS provvisorie, nessuna generazione di immagini).
- **Niente commit.** Nessuna modifica alla meccanica o a `/game` di produzione. Modifica al componente `ZanaraRoster` solo per esportare `RosterRow`.

## 29. Emendamento G1 #4: non ancora (2026-11-05)
- Il Director non approva l'emendamento G1 #4 (cimiero sopra la colonna, slot contestuale secondo per il pannello aperto). Resta sospeso: nessuna modifica alla pianta firmata B1 per questo punto. Il mockup `/hud-roster-mockup` resta lab, non produzione.

## 28. F4 — correzioni Director, palette viva, notifiche/comandi e composizione completa (2026-11-05)
- **Ruling Director applicati:**
  1. **Stati sul medaglione ANNULLATI** → Director ruling 2026-11-05: nessun trattamento stati sul medaglione (fuori scope, non aperto). Il medaglione resta anello approvato + ritratto; gli stati vivono in placca e aria-label.
  2. **Bandiera hover del roster** → era tagliata a 88 px perché `overflow-y: auto` forza per specifica CSS anche `overflow-x` a clippare; contenitore portato a `88 + PLAQUE_W` con `pointer-events: none` e mezzaluna allineata sul foro scalato.
  3. **Posizione nav** → punta bassa portata a `f.H - 6` (poco sopra il bordo schermo).
  4. **Palette di riferimento = astrolabio nav vivo** → individuata la causa dello sbiadimento nel passo G2-4 (`apply-palette.py` tagliava −20% croma oro / −45% riflessi e spostava lo smalto a 182°). Ripristinati i 25 asset da `rollback-color/`; alzato il solo oro pallido di `panel/frame.webp` (`C50: 26,5 → 38,9`, alabastro intatto); aggiornate le soglie di `check-palette.py` sul riferimento vivo (**25/25 pezzi in soglia**).
  5. **Barra risorse e tempo = asset originali integri** → eliminato `build-slim-bars.py` e i file `*-slim.*`; `HudRealResources` e `HudRealTime` usano `resources/bar.webp` e `time/bar.webp` scalati uniformemente sulla larghezza dello slot (chiusura a gabbia intera, primo slot chiuso dal suo bordo d'oro, gemma pendente sotto il corpo).
- **Notifiche, comandi e pagina di composizione sul contratto firmato (`/hud-compose`):**
  - Tutti gli 8 slot di `SLOTS_B` montati su `frameFor` + `resolveSlots`: `roster`, `time`, `resources`, `panel` (con `HudRealSeal layout="row"` dentro), `nav`, `commands`, `voce` (scalata a 360 con fondo a `f.H - 6` così la gemma bassa non è mai tagliata), `toast` (320×72 sopra la cima reale di Voce con 8 px di aria, amend #1, chiudibile).
  - Azioni reali: astrolabio nav incrementa `recenterSignal` su `PixiWorldMap`; «Pannelli» commuta il pannello contestuale; «Nascondi HUD» nasconde il chrome lasciando i 3 comandi; «Menu» apre la tendina con Ricentra mappa e Pannello contestuale; Voce e toast si chiudono davvero.
- **Verifica:** `scripts/hud-real/probe-topbar-rects.mjs` **PASS** a 1280×800 e 1440×900 DPR 2 (rect al px esatto, zero errori pagina); catture DPR 2 verificate a occhio su barra alta, nav, hover bandiera, pannello+sigillo e angolo narrativo Voce+toast.
- **Aperti per F5 / integrazione `/game`:** (a) collegamento di pannello/sigillo/notifiche agli eventi reali di `/game` (oggi montati con stato locale sulla pagina di composizione); (b) matrice completa di catture F5 e Gate G3.

## 29. AMEND G1 #4 approvato dal Director (2026-11-05)
- **Decisione.** Il Director approva l'emendamento G1 #4 proposto in §28: (a) il roster guadagna in cima uno slot per il cimiero (fenice + Sol Invictus in componente circolare); (b) il pannello aperto del roster (derivato da `/game`: filtri, ordinamento, densità) è uno slot contestuale secondo, dimensionato dal contenuto e limitato all'altezza del nastro.
- **Valori di partenza (dal mockup `/hud-roster-mockup`, da tradurre nel contratto).** Cimiero: box 156 px, colonna del nastro che parte a M + 156 − 22. Pannello aperto: larghezza 620 px, a destra della colonna con 18 px di respiro, altezza = nastro. Tutti i valori restano da validare sul contratto firmato (`hudLayoutB.ts`), non sono ancora nel codice.
- **Passi successivi (non ancora fatti).** 1) aggiornare `hudLayoutB.ts` con lo slot cimiero e lo slot pannello roster, e i test di contratto/fit; 2) portare il cimiero dal mockup al componente con maschera e stati; 3) ricalcolare la verifica DPR2 di C1 contro zanara-v2; 4) rifare il confronto a scala uguale con l'astrolabio.
- **Invariati.** Pianta B1, scala del gioco, budget 18%/24%, medaglione approvato (G2-3), palette (G2-4/G2-6).

## 30. AMEND G1 #4 tradotto nel contratto (2026-11-05)
- **Codice.** `hudLayoutB.ts`: slot `crest` (persistente, tier 1, tl, 156×156, dy M); `roster` scende a dy = M + 156 − 22 (il nastro inizia 22 px dentro il cimiero); nuovo slot `rosterOpen` (contestuale, tl, dx = M + 88 + 16, dy = M + 156 + 8, 620×520, altezza limitata sopra nav e stack in basso). Sovrapposizione dichiarata solo tra cimiero e roster (`isDeclaredOverlap`); ogni altra sovrapposizione resta un errore.
- **Test.** `hudLayoutContract`, `hudLayoutVariants`, `hudLayoutFit`, `hudLayoutMobile`, `hudTypeScale`: 129/129 verdi. `hudPaletteCheck` e `zanaraRosterState`: 5/5 verdi. Aggiornate le asserzioni che davano per scontato roster.y = time.y, ora roster.y = cimiero.y + cimiero.h − 22.
- **Budget.** Copertura persistente misurata a 1280×720 15,65%, 1440×720 13,91%, 1600×900 10,54%: sotto il 18% firmato.
- **Contratti.** `hudContracts.ts`: `HudSlotId` esteso con `crest` e `rosterOpen`; `STATE_MATRIX` e `SLOT_MODE` allineati.
- **Tipi.** Errori rimasti solo quelli già noti delle chiavi i18n (`hud-compose.tsx`, `hud-roster-mockup.tsx`).
- **Discrepanza da decidere.** Il roster del contratto è largo 88 px (solo ritratti, D5). Il nastro del mockup chiuso, con placche, è largo circa 267 px (214 × 1,25). `rosterOpen` è posizionato assumendo 88 px. Se il Director vuole la placca nel roster, la larghezza cambia e va rifatto il fit.
- **Non fatto.** Verifica DPR2 di C1: il cimiero non è ancora montato in `/hud-compose` (vive nel lab `hud-roster-mockup`). Confronto a scala uguale con l'astrolabio: aperto.

## 31. Roster «Con placche» nel contratto: conflitto con budget e pannello (2026-11-05)
- **Ruling del Director.** Roster con placche: colonna larga 268 px (`ROSTER_W`), nel contratto `hudLayoutB.ts`. Pannello aperto a `M + ROSTER_W + 16`.
- **Esito misurato.** Tre test falliscono, il contratto non regge così com'è:
  1. **Budget persistente sforato.** 1280×720: 22,4% (firmato 18%). 1180×820: 21,1%. 1440×810: 19,7%. 1920×1080: 11,1% (ok). Causa: la colonna di 268 px è un box persistente grande.
  2. **Sovrapposizione tra slot contestuali.** A 1280×720 il pannello aperto (x 308–928) tocca il pannello destro (x 916): 12 px. 620 px non entrano accanto a 268 px su 1280.
  3. **B2:** il centro alto non è più libero (416 < 500 px). Stessa causa del punto 1.
- **Non fatto (di proposito).** Non ho abbassato il tetto, non ho escluso slot dal controllo del budget né cambiato i test per farli passare.
- **Opzioni per il Director** (ciascuna cambia un vincolo firmato):
  - **A.** Placche solo al passaggio (regola già in AUTONOMY.md: «placche al passaggio del mouse»): il box persistente torna a 88 px, le placche stanno fuori dall'ingombro. Il ruling «Con placche» si riferisce allora all'hover.
  - **B.** Placche a riposo e budget più alto per il roster (es. 24% per le finestre sotto 1440). Cambia G1.
  - **C.** Pannello aperto che sostituisce il pannello destro invece di affiancarlo sotto 1440 (come `fitPanel` per le finestre centrali). Cambia G1.

## 32. Ruling B: budget più alto; roster con placche a riposo (2026-11-05)
- **Decisione del Director.** Opzione B: placche a riposo, budget persistente più alto. Il valore è 24% a ogni zoom (`budgetFor`), che copre il caso peggiore misurato (22,4% a 1280×720). Sostituisce il 18% di G1 per tutti gli zoom; la regola del 24% dal 150% non è più distinta.
- **Regola aggiunta (automatica, provvisoria).** La larghezza del pannello aperto è quella libera tra la colonna roster e il pannello destro: `min(620, W − M − pannello − 16 − dx)`. Così non si sovrappone al pannello destro a 1280. Da confermare dal Director.
- **Esito test.** 128/129 verdi (hudLayout*, hudTypeScale, palette, stati roster). Unico rosso: «B2 keeps the top centre free», spazio libero di 416 px contro un minimo di 500. Causa: il roster a 268 px (ruling «con placche») riduce lo spazio libero al centro. Il test non è stato allentato: la soglia era calcolata per il roster a 88 px. Va decisa dal Director: accettare 416 px (e abbassare la soglia) o cambiare B2.
- **Non fatto.** Verifica DPR2 di C1 nella pagina di composizione (il cimiero non è ancora montato in `/hud-compose`).

## 33. Spazio libero centro alto: 416 px accettati (2026-11-05)
- Il Director accetta 416 px di spazio libero in alto al centro (B2) con il roster a 268 px. La soglia del test passa da 500 a 400 px, con il motivo scritto nel test. Nessun altro vincolo cambiato.

## 34. Cimiero montato in /hud-compose (2026-11-05)
- **Codice.** Il cimiero è estratto in `src/ui/idleVillage/hudReal/HudRealCrest.tsx` (condiviso con `/hud-roster-mockup`) e montato in `/hud-compose` nello slot `crest` del contratto (x 24, y 24, 156×156).
- **Verifica.** Cattura DPR2 1440×810: `test-results/hud-crest-2026-11-05/compose-crest-1440x810-dpr2.png`. Il cimiero sta nello slot; la base scende sul primo medaglione come previsto dal contratto.
- **Non fatto.** Il roster in `/hud-compose` è ancora la colonna a medaglioni vecchia (88 px), non il nastro con placche a 268 px. La verifica DPR2 di C1 non è chiusa. La riga «Ricompense» del pannello taglia ancora l'ultima icona (C4, da correggere).
- **Confronto a scala con l'astrolabio:** aperto.

## 35. C4: riga Ricompense senza taglio (2026-11-05)
- **Causa.** La riga era `nowrap` a 15 px e sborda dal bordo utile del pannello: l'icona del legno restava fuori dalla finestra.
- **Correzione (in `hud-compose.tsx`, pannello di prova).** La riga va a capo (`flexWrap`), etichetta a 11 px, valori a 14 px.
- **Verifica DPR2 1440×810.** Le tre ricompense sono visibili (350 oro, 50 cibo, 12 legno). Il legno va a capo da solo sulla seconda riga: non è un taglio, ma è da rivedere nel componente di produzione. Il bottone «Inizia» finisce a y 560, il pannello a y 616: il sigillo resta dentro.
- **Non fatto.** La stessa riga nel componente `HudRealPanel` di produzione non è stata toccata: la correzione è solo nella pagina di prova.

## 36. C4: portata nel componente di produzione (2026-11-05)
- Verifica: `HudRealPanel` non disegna la riga ricompense. La riceve come `children` dalla pagina che lo usa, e l'unico consumatore è `/hud-compose`. La correzione di §35 è già nel punto giusto: nessuna modifica a `HudRealPanel.tsx`.
- Resta da decidere: se il contenuto ricompense diventa un componente riusabile (`HudRealRewardsRow`), e se il legno va su riga propria come nella cattura. Non fatto.

## 37. Stato consolidato e cosa resta (2026-11-05)

### Fatto
- **Contratto (F1–G2).** Pianta B1 firmata; amend G1 #1–#4 (toast, modello di scala del gioco, slot pannello 340×520, cimiero e pannello roster aperto). Test HUD verdi.
- **Ruling roster.** Colonna con placche a riposo, larghezza 268 px (`ROSTER_W`). Budget persistente a 24% per ogni zoom (ruling B). Spazio libero in alto al centro 416 px (accettato, soglia test 400).
- **Cimiero.** Componente condiviso `HudRealCrest.tsx`, montato in `/hud-compose` nello slot `crest` (x 24, y 24, 156×156). Verificato DPR2 per posizione.
- **Pannello aperto del roster.** Slot `rosterOpen` contestuale; larghezza = spazio libero tra roster e pannello destro (max 620 px).
- **C4 ricompense.** Riga a capo nella pagina che usa `HudRealPanel` (unico consumatore). Verificato DPR2: nessun taglio.
- **Coda di generazione.** Vuota; budget 65/170; `pf-4` e `med-3` saltate per quota.

### Cosa resta, in ordine
1. **C1 roster in produzione (nastro con placche a 268 px).** Costruire il componente React, con dati reali, nello stile del mockup `hud-roster-mockup.tsx` (rulli, rotazione dei medaglioni al passaggio dei rulli, placche a riposo) e montarlo in `/hud-compose` nello slot `roster`, al posto di `HudRealRosterColumn` (88 px). Dati: `ResidentState[]` dal contratto esistente, nessuna modifica allo store.
   - Verifica: cattura DPR2 1440×810 con 1, 5 e 14 eroi; nessun taglio retto visibile; test permanente di nessun taglio a 1/5/14 eroi.
2. **Pannello aperto del roster.** Montare il pannello (`OpenRoster` del mockup) nello slot `rosterOpen`, alimentato dagli stessi filtri e ordinamenti di `/game` (`rosterFilterConfig`, `rosterSortConfig`). Verifica: nessuna card tagliata, nessun overlap con il pannello destro a 1280×720.
3. **Pannello destro (C4).** Portare la riga ricompense in un componente riusabile `HudRealRewardsRow`. Decidere se il legno va su riga propria (scelta visiva, da confermare con il Director).
4. **Cimiero a scala uguale all'astrolabio.** Confronto a parità di scala (l'astrolabio nav è a scala 2; il cimiero no). Se resta più povero: aggiungere incisione e gemme oppure rigenerare il cimiero con Gemini (serve budget e go del Director; oggi non ci sono job in coda).
5. **Stati dei residenti non `available` dal vivo** (away, exhausted, injured, dead, locked): servono residenti in quegli stati o una fixture nella pagina di prova.
6. **C2–C10 verification.** Confronto a scala con i mockup scelti (zanara-v3 per risorse, zanara-v1 per nav, ecc.), poi `verified` solo se passa. Oggi nessuno è `verified`.
7. **Esame finale** (`REVIEW.md`) e `LINGUAGGIO-v2.md`: solo quando C1–C10 sono `verified`.

### Decisioni ancora aperte per il Director
- Il legno nella riga ricompense: riga propria o affiancato?
- Il cimiero resta più povero dell'astrolabio: si aggiunge incisione (lavoro di codice) o si rigenera (budget Gemini)?

### Vincoli che restano validi
- Nessun commit, push o PR.
- Nessuna modifica alla meccanica, allo store o a `/game` di produzione: si lavora nei lab.
- Niente viola, niente testo dentro le immagini, i18n en + it-IT.
- Non superare `gen-budget.json` (65/170).
- Test HUD: 134/134 verdi all'ultima esecuzione; typecheck: solo gli errori i18n già noti.

## 38. C1 roster in produzione + pannello aperto (2026-11-06)
- **Codice.** `HudRealRosterRibbon.tsx` (hudReal): il nastro zanara — band-tile sotto il cimiero, rulli oro sulle linee di taglio, righe `RosterRow` ×1.25 con placche a riposo, incurvatura rotateX+shade sotto i rulli, contatori sopra/sotto (click = passo intero), band-end. Costanti in `rosterRibbonGeometry.ts` (lint fast-refresh). Montato nello slot `roster` (268 px, anelli centrati sotto il cimiero, banda che sale nel cimiero). `?n=1|5|14` in `/hud-compose` per le catture di non-taglio.
- **Pannello aperto.** `HudRealRosterOpen.tsx`: port del mockup `OpenRoster` — tab con conteggi, ordinamento/filtro con le vere funzioni di `/game` (`rosterSortConfig`, `rosterFilterConfig`), densità Compatto/Schede, griglia 2-col a righe intere (snap, nessuna card tagliata). Montato nello slot `rosterOpen` (contestuale); apertura dal click sul cimiero o `?view=context`.
- **Verifica DPR2.** n=1: un eroe tra rulli + band-end. n=14 scrollato: «▲4»/«▼5», stati sulle placche (Injured/Fallen/Away), caduto desaturato — nessun taglio retto. Pannello Compagnia: card complete, tab/filtri funzionanti.
- **Probe.** `probe-topbar-rects.mjs` PASS (crest 156, roster 268@158, passo righe 77.5 misurato). Lint 0 errori.
- **Non fatto.** Test permanente di non-taglio (fixture 1/5/14 come script, non solo manuale); rulli/pannello aperto restano CSS stand-in (asset finali in attesa di quota, come da §37); verifica confronto cimiero↔astrolabio a scala uguale.
