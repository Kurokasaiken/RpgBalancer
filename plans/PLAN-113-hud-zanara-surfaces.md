# PLAN-113 — HUD Zanara: tutte le superfici di `/game` in `/hud-compose`

**Stato:** bozza per il Director (non battezzato; `plan:stamp` solo dopo il suo via).
**Parent:** PLAN-112 (pianta B1 firmata, chrome persistente), PLAN-110 (pipeline mockup→componenti), PLAN-107 (HUD Zanara su /game), PLAN-047 (visual-fork gate).
**Origine (Director, 2026-11-06, R-319, verbatim):** *«http://localhost:5173/hud-compose deve prendere tutti i componenti e superfici d /game e farle diventare in questa nuova chiave. prendi i componenti uno ad uno, fanne uno screenshot e chiedi a gemini o chatGPT d farne una versione abbellita, ricca e opuletanta cm il resto d quella pagina. Inoltre: prima d fare questo lavoro dobbiamo fare un elenco di quello che c'è, fare uno studio x migliorare il layout e poi mostrarmi eventuali tipi diversi di mockup per ogni elemento. E gli elementi che stanno insieme, tipo roster + magazzino + planner vanno mostrati insieme. dobbiamo fare un buon plan»*.
**Cosa NON è:** non tocca `/game` di produzione, la meccanica, lo store, la pianta B1 firmata del chrome persistente. Non rifà gli asset già approvati (barre, nav, pannello pf-3, cimiero, roster ribbon). L'integrazione su `/game` resta PLAN-112 F6 / piano successivo.

## 0. Decisioni già date dal Director (2026-11-06, round esplorativo)

- **D-PLAN:** nuovo PLAN-113 figlio di PLAN-112 (scope: famiglie di superfici/pannelli; PLAN-112 chiude il chrome persistente).
- **COMP-1 = Direzione 1 «a gruppi».** I mockup **e** il runtime del lab mostrano le famiglie convivere come su `/game` (es. triade roster aperto + magazzino + planner insieme). Conseguenza accettata: serve un **contratto di composizione** aggiuntivo (slot/zone di convivenza in `/hud-compose` o viste lab dedicate) — la pianta B1 firmata non si tocca; il budget d'ingombro per superfici coesistenti è una decisione nuova da misurare e far firmare, non un allentamento implicito.
- **SCOPE-1: tutto, inclusi gli elementi Pixi** (marker POI, halo, route di viaggio, pin villaggio) e la vista villaggio dipinta.
- **PROVIDER-1: Gemini** via pipeline esistente (`scripts/hud-real/gen-queue.mjs`, `quota-runner.mjs`, `runs.jsonl`, `compile-prompt.py`, `hud-gen-gate.py` calibrato). ChatGPT web fuori (sessione morta).

## 1. Principi (ereditati da PLAN-112 P1–P10 + nuovi)

- **P1–P10 PLAN-112 restano validi** (pianta prima degli asset, contratto di ingombro, «fatto» sulla schermata intera, fedeltà ai tratti, niente dead chrome, tre livelli di ricchezza e tre modi, budget misurato, colore a bersaglio Lab, scala tipografica unica, rollback per asset).
- **P-113-A — Un mockup parte dalla produzione** (R-282): screenshot del componente reale su `/game` → abbellimento in chiave Zanara; mai generazione da zero; consegna a grandezza reale, un file per opzione; il ranking di gusto è del Director.
- **P-113-B — Le famiglie si mostrano insieme** (COMP-1): ogni visual-fork di famiglia presenta il **gruppo composto** (gli elementi che convivono su `/game` nello stesso fotogramma), non i singoli pezzi.
- **P-113-C — Una famiglia alla volta** (sequenza Director): screenshot → abbellimento → ruling → baseline congelata → implementazione → famiglia successiva.
- **P-113-D — Le superfici mantengono dato reale**: ogni mockup e ogni implementazione monta dati veri (store/selettori esistenti) o dichiara «dato mancante» — mai contenuto plausibile finto (P5).
- **P-113-E — Gli elementi Pixi seguono lo stesso linguaggio**: marker/halo/route/pin ricevono il trattamento Zanara come design su spec dedicato, montati sulla `PixiWorldMap` del lab (mappa2), mai su `/game` di produzione.

## 2. Inventario delle superfici (seed verificato sul codice 2026-11-06)

| Famiglia | Superfici (file reali) | Note |
|---|---|---|
| **A. Compagnia** (triade) | `VillageRosterSection` (roster aperto, già montato su placca provvisoria in `rosterOpen`), `VillageStashPanel`, `QuestExpeditionDetail` + colonna forecast, `HeroSheetPanel` | Su `/game`: ala sx (roster+stash co-espansi `authorizedPairs`) + `centerStage` planner. Il planner (460–820px) è composizione centro-scena, non pannello da 340. |
| **B. Quest in corso** | `QuestRunWindow` (teatro, scelte, fasi), `QuestSkillCheckOverlay`/`QuestCheckOptionsPanel`/astrolabio V6.2, `QuestPartyRosterPanel`/`QuestBeltPlaque`/`QuestLogPanel`, `QuestJourneyPhaseStrip`, `QuestVerdictCard`, `QuestEpilogue`, `QuestReturnedCrew`, `QuestRewardPopup`, `QuestOutcomeToast`, `QuestStageCluster`, `QuestSkillCheckColumn`, `AmanuensePage` | Superficie più ricca; ha già un linguaggio proprio (placche, cinema). |
| **C. Villaggio** | `VillageScreenView` (dipinto + pin edifici), `VillageRegistry` (drawer), `VillageSlotOverlay`, `VillagePinFrame`, `MockUpgradeControl` | Vista a schermo intero: caso speciale, non un pannello. |
| **D. Commercio** | `MerchantPanel`, `MarketActionCard`, `TradeRoutePanel` | Merchant: min 320 entra nello slot 340. |
| **E. Cronaca & memoria** | `HudEventLedger`/`ActivityLogPanel`/`EventLogPanel`, `MemorialPanel`, `LegacyReliquaryPanel` | Ledger = ala dx su `/game`. |
| **F. Cerimonie & esiti** | `HeroLevelCeremony`, `SettlementLostOverlay`, `MinimalGameOverModal`/`GameOverModal`, expedition-lost, `WorldSurfaceEventCard`/`WorldSurfaceEventShroud`, `GoblinInvasionWindow` | Momenti full-screen, opulenza massima, frequenza rara. |
| **G. Sistema** | `TitleScreen`, `GameMenuDialog`, `LoadGamePanel`, `SettingsPanel`, `GameMenuConfirm`, `GameEntry`, `GameBootScreen` | PLAN-076 implementato; eye-check in sospeso. |
| **H. Transienti & chrome minore** | `FatigueAlertToast`, `RestOverlay`, `RegionTooltip`, `HudTooltip`, `ObjectiveCartouche`, `NextEventTab`, `HudGameMenu`, `HudPanelsMenu` | Re-skin sul linguaggio; costo basso. |
| **I. Mappa (Pixi)** | `MapQuestPoi` + `MagicCircleHalo`, `QuestJourneyRoute`, pin villaggio, `RegionTooltip` mappa | Elementi dentro il canvas; spec dedicata. |
| — | **Esclusi:** `DirectorPanel`, `TuningPanel`, profiler, audit, pagine lab | Dev-only. |

## 3. Fasi

### F0 — Inventario e catture base (0 immagini)

- Per **ogni superficie** della tabella §2: file, famiglia, trigger di apertura, dati reali (selettore/store), stati, dimensioni min/naturali (da config `stageZones.panels`, `questWindow`, o misura DOM), viewport canonici, e **cattura headless dello stato attuale** — isolata e in contesto su `/game` (WebGL via `--enable-unsafe-swiftshader`).
- Ogni ID ha uno sbarco esplicito o un motivo di esclusione scritto (T-06).
- **Uscita:** `.mw/specs/hud-real/PANELS-INVENTORY.md` + matrice di catture in `test-results/plan113-inventory/` (contact sheet «cosa c'è oggi», artefatto per il Director).

### F1 — Studio del layout di composizione (0 immagini)

Direzione 1 già scelta: le famiglie convivono. Resta da progettare **come**:

- **F1.1 Contratto di composizione:** per ogni gruppo (A triade, B quest-cluster, C vista villaggio, D+E ali, F full-screen) si dichiara: elementi simultanei, ancoraggi, ingombri minimi, priorità di collisione (estende la matrice E-15 oltre lo slot unico), comportamento ai passi di zoom offerti.
- **F1.2 Varianti di composizione** come visual-fork card (es. triade A: ali replicate dal 3-zone stage vs fascia unificata vs pannelli liberi agganciati al roster ribbon). Preview sulla root del dev server / redirect-stub (T-19).
- **F1.3 Budget di convivenza:** misura T-101b delle composizioni a gruppo (oggi il tetto 18/24% copre i persistenti; i gruppi aperti non sono ancora misurati insieme) → cifra da far firmare.
- **Gate GC-1 (Director):** composizione scelta e firmata per gruppo. F2 non parte prima.

### F2 — Mockup abbelliti per famiglia (quota, una famiglia alla volta)

Per ogni famiglia, in ordine:

1. **Scheda tratti** (F3.2-style): cosa ha / cosa non ha il componente attuale e il linguaggio Zanara (oro, smalto 168°/L19, alabastro, Cinzel/EB Garamond, gemme, incisioni — da `LINGUAGGIO-v2.md` e `f3/TRAITS-CARDS.md`), tratti obbligatori vs secondari.
2. **Prompt lintato** (`compile-prompt.py` + canale `prompt.md`, T-17): screenshot di produzione allegato + riferimenti Zanara approvati (angoli delle ref puliti, T-27); registro STYLE verbatim (T-26); kill list (mai viola nella UI, niente marrone, niente testo in immagine).
3. **Gen-queue** (2–3 varianti per famiglia) con ledger `runs.jsonl`; attesa incremento prima della cattura (T-25); gate `hud-gen-gate.py`.
4. **Contact sheet a gruppo** composta sullo screenshot in contesto (R-282) → **visual-fork card** → **ruling Director → baseline sha256**.
5. Se un candidato è peggiore della produzione, non esce (regola R-282): si itera o si dichiara «keep + reskin-only».

Ordine famiglie proposto (da confermare): **A triade → B quest → D commercio → E cronaca → C villaggio → F cerimonie → G sistema → H transienti → I mappa/Pixi.**

### F3 — Implementazione in `/hud-compose` (per famiglia, dopo il ruling)

- Asset: cut + grade oro + `unify-enamel.py` come ultimo passo; rollback per ogni asset sostituito.
- Componente React sul contratto di composizione (F1), dati reali, stati e tastiera dal CONTENT-CONTRACTS esteso; i18n it/en; nessun valore hardcoded (config-first).
- Montaggio in `/hud-compose` nella vista/gruppo dedicata; cattura DPR2; test permanente di rettangolo/non-taglio; witness sulla composizione intera del gruppo (T-04), non sul solo pezzo.

### F4 — Verifica d'insieme e gate per famiglia

- Ogni famiglia chiude con: card ruled + baseline + componente montato + witness DPR2 + test verdi. Gate **GF-<famiglia>** (occhio Director): «sembra della stessa civiltà del resto della pagina».
- Stop-the-line (ereditato E-27): 2 rifiuti consecutivi sullo stesso gate → si ferma e decide il Director (ridimensionare / ripiego CSS-vettoriale / chiudere la famiglia).

## 4. Metodo di verifica

1. **Contratto come oracolo:** i contratti di composizione (F1) alimentano test permanenti di rettangolo/allineamento/non-taglio.
2. **Occhio come verdetto percettivo** (T-04): witness headless a DPR2, side-by-side produzione vs baseline approvata; una finestra visibile è passo manuale del Director, mai azione dell'agente.
3. **Witness di gruppo:** la chiusura di famiglia cita la cattura della composizione composta, mai il componente singolo.
4. **Metrica = supporto:** divergenza occhio/metrica → vale l'occhio, si corregge la metrica (E-11).

## 5. Contratto di chiusura (alimenta `.mw/runs/<task>/verification.json`)

| # | Obbligazione | Tipo |
|---|---|---|
| OB-1 | `PANELS-INVENTORY.md` completo: ogni superficie `/game` ha sbarco o esclusione scritta; matrice catture base in `test-results/plan113-inventory/` | state, blocking |
| OB-2 | Contratto di composizione per gruppo + ruling GC-1 registrato (card + baseline sha256) | human-eye, blocking |
| OB-3 | Per famiglia: scheda tratti + card visual-fork ruled + baseline sha256 | human-eye, blocking a GF |
| OB-4 | Per famiglia: componente montato in `/hud-compose`, cattura DPR2 della composizione, test permanente rettangolo/non-taglio verde | state, blocking |
| OB-5 | Quota rispettata: `gen-budget.json` mai superato; ledger `runs.jsonl` per ogni job | state, blocking |
| OB-6 | Safeguards sullo scope: `npm run lint -- <scope>`, `npm run test -- <scope>`, `npm run build:check` verdi | state, blocking |
| OB-7 | Witness di gruppo (composizione composta, non pezzo singolo) per ogni famiglia chiusa | human-eye |

Ultimo task del piano: **OB-1..OB-6 verdi + GF delle famiglie in scope firmati.**

## 6. Trappole ereditate (`context/recurring-traps.md`) → criteri di accettazione

- **T-01** layout `/game`/HUD su mappa: le composizioni non coprono la terra ai viewport firmati.
- **T-02** archi a lunghezza 0: nessun `strokeLinecap="round"` su archi progressivi.
- **T-03** scope CSS: dropdown/popover/portal delle superfici nuove dentro lo scope del root.
- **T-04** claim percettivi: solo witness, mai diff/metrica come verdetto; ciò che non è verificato si dichiara.
- **T-06** copertura inventario per-ID alla scrittura.
- **T-13** worktree condiviso: failure di safeguard/probe prima sospettati come collisione; nessun commit scoped.
- **T-16/T-17** prompt via canale lintato (`compile-prompt.py`, blocco `prompt.md` immutato), mai ad-hoc.
- **T-19** `browser_preview` solo sulla root del dev server (o redirect-stub).
- **T-21** controlli nativi dentro chrome: hit region = rect elemento; allargare il controllo.
- **T-22** misura sul runtime che esibisce il sintomo (dev server per latenza; probe Pixi con `--enable-unsafe-swiftshader`).
- **T-24** ogni nuova superficie verificata a 390×844 touch (o fallback `base` dichiarato come D10).
- **T-25/T-26/T-27/T-28** batch immagini: attesa incremento, registro STYLE, ref pulite, semantica-mood prima del pigmento.
- **z-index/stacking context:** overlay sopra pannelli `fixed`/`absolute` → `createPortal(document.body)`, assert parent=body.
- **Invarianti di progetto:** persistenza solo via `PersistenceService`; config-first (Zod); skin via preset/registry (nessun `.css` ad hoc — il canale hudReal è asset+geometry modules, pattern già approvato); i18n en/it-IT; riuso primitives/frozen kits prima di componenti nuovi; JSDoc su funzioni/interface nuove.

## 7. Rischi e costi

- **Quota:** `gen-budget.json` @2026-11-06: **65/170 usate → ~105 residue** (da rileggere al `plan:stamp`, E-35). Stima 2–4 immagini × 9 famiglie ≈ **25–40**; budget per famiglia dichiarato a F2, rollback atomico su stop quota (`blocked:quota`, non conta come tentativo).
- **Costo:** ~8–14 giornate-agente + latenza gate asincroni.
- **Rischio composizione (COMP-1):** gruppi aperti insieme possono superare il budget d'ingombro → mitigazione F1.3 (misura prima delle firme, nessun allentamento implicito; se una composizione non entra, opzioni per il Director: shrink, stack o esclusione).
- **Rischio planner:** la triade A è composizione centro-scena (non slot 340) — il caso più delicato: il fork di F1.2 decide prima la forma, poi l'arte.
- **Rischio Pixi (famiglia I):** gli elementi canvas non sono DOM; il mockup guida il design, l'implementazione richiede sprite/texture per `PixiWorldMap` del lab — costo diverso dai pannelli DOM, da pesare a F1.
- **Rischio ripetizione:** rifinire pezzi a occhio → divieto P1/P3 (schermata intera o niente).

## 8. Decisioni aperte (da chiudere con il Director)

1. **Ordine famiglie F2** (proposto A→B→D→E→C→F→G→H→I): conferma o riordino.
2. **Budget quota per famiglia** e riserva (proposta: ≤4/famiglia, riserva ~30 per iterazioni).
3. **Forma del contratto di composizione:** estensione `hudLayoutB.ts` (stesso file firmato) vs modulo separato `hudComposeGroups.ts` (proposta: separato — B1 firmata non si tocca).
4. **Famiglia C (vista villaggio):** mockup dell'intera vista dipinta+pinnata o solo degli elementi HUD sopra di essa (pin/tooltip/drawer)?
5. **Famiglia I (Pixi):** i marker sono disegnati in canvas — si genera arte (sprite) o si trattano come design-only con implementazione vettoriale?
6. **Dibattito multi-AI sul piano:** convenzione PLAN-081 — riservato a piani con decisioni architetturali materiali o su richiesta. Qui l'architettura eredita PLAN-112; proposta: **non necessario** di default, il Director può chiederlo.
7. **GC-1 vs fork per gruppo:** una firma unica di composizione o un ruling per gruppo (proposta: per gruppo, più leggero).

## 9. Marker

- `visual-fork: pending` su ogni decisione estetica (composizione F1.2, baseline per famiglia F2); `visual-fork: skipped — <motivo> — <puntatore>` solo per task puramente numerici.
- Tutte le verifiche runtime e catture: **headless/in background** (`.windsurf/rules/16-no-foreground-windows.md`); probe Pixi con `--enable-unsafe-swiftshader` (R-304).
- Al battesimo (Director): `npm run plan:stamp -- open PLAN-113`; item desiderata slice via `mw-plan-disposition` se applicabile (nessuna desiderata FROZEN cambiata: v6 mockup→componente e v8 Golden UI coprono il metodo).
- Registro decisioni: rulings in questo file (§0) e in `.mw/specs/hud-real/DECISIONS.md` per quelle esecutive.

## 10. Emendamenti dal dibattito multi-AI web (2026-11-06)

Run `20261106-plan113-hud-surfaces` — 5 provider invitati; elettorato effettivo: claude + deepseek (chatgpt e grok `provider_dead`, gemini bloccato su rate-limit Google — retry possibile). **Dove gli emendamenti divergono dal testo sopra, valgono loro.**

### FATAL / strutturali

- **E-01 Kit-first (claude, FATAL — quota/yield).** La stima «2–4 immagini × 9 famiglie» prezza mockup, ma il deliverable di F3 sono **asset riusabili** (cornici, placche, tab, stati): il chrome ha consumato ~65 immagini per ~12 componenti (≈10/asset dopo scarti). A quel rendimento ~105 immagini coprono 1–2 famiglie. **Emendamento:** inserire **F1.5 — kit Zanara condiviso** (cornice pannello nine-slice, placca, tab, stati bottone, divisore, tooltip, gemma/badge) generato una sola volta con tetto dichiarato (~35 immagini); le famiglie si compongono dal kit via React + geometry modules; la generazione per famiglia si limita ai pezzi hero unici (cerimonie, cinema quest); i mockup di composizione-variante si costruiscono da **kit + screenshot reali**, non da nuove immagini Gemini.
- **E-02 Screenshot di gruppo = composito dichiarato (deepseek, FATAL).** R-282 («mockup parte da produzione») vs COMP-1 («famiglie insieme») è una contraddizione: nessuno stato reale di `/game` mostra le famiglie composte come le richiede il fork. **Regola aggiunta a P-113-A:** per i gruppi lo «screenshot di produzione» ammesso è **composito**: catture isolate reali montate nel layout di composizione approvato in F1 — dichiarato, non generazione da zero, e unico modo legittimo di soddisfare R-282 sui gruppi.
- **E-03 Fattibilità tecnica per C e I prima di F2 (deepseek).** La vista villaggio (C) e gli elementi Pixi (I) **non sono mockup-abili con la pipeline raster** (sprite atlas/vettoriale/shader ≠ PNG di scena). La decisione §8.5 si anticipa in **F1/GC-1**: C e I hanno un **gate di fattibilità tecnica separato** da GF-<famiglia>, firmato prima di spendere immagini.

### MAJOR

- **E-04 Contratto quota (deepseek).** La riserva non è una stima: è un **hard floor** (proposta: ~30, Director fissa il numero). Una famiglia il cui lavoro attraverserebbe la riserva → `blocked:quota` + stop esplicito, mai «itera finché basta». §7 riscritto di conseguenza.
- **E-05 Oracolo percettivo per famiglia (deepseek).** Ogni card F2 cita la **coppia di reference Zanara approvate** (LINGUAGGIO-v2 + f3/TRAITS-CARDS + asset approvati specifici) come termine di paragone; il ruling cita quale tratto si discosta. Il gate GF non è più solo «occhio»: è occhio su baseline nominata.
- **E-06 Nine-slice e overflow (claude).** F0 aggiunge una **matrice contenuto-estremi** (vuoto/tipico/massimo) per superficie; i tagli F3 devono essere nine-slice-ready (cornici elastiche), verificato sui casi estremi, non solo sul tipico.
- **E-07 COMP-1 misurato in F1.1, non F1.3 (claude).** L'occupazione delle composizioni a gruppo si misura **durante la stesura del contratto di composizione** (F1.1), non alla fine di F1: una composizione che non entra nel budget si ridisegna prima delle firme.

### MINOR

- **E-08 Scope OB-6 per famiglia.** Ogni task F3 dichiara il suo glob lint/test (per-F-family); OB-6 resta bloccante ma su scope nominato.
- **E-09 Latenza dei gate come costo critico.** §7: «costo critico = latenza dei gate Director (GC-1 + GF per famiglia); nessuna famiglia parte senza il ruling del gate precedente» + tempo-morto esplicito.
- **E-10 §8.6 riformulato** (deepseek): il dibattito era «non necessario» per motivazione debole — COMP-1 era già ruling Director; il contratto §8.3 è esecuzione. (Nota: il dibattito è comunque avvenuto su richiesta — questa riga resta come correzione di forma.)
- **E-11 Viewport per card F2** (deepseek): ogni card riporta viewport target + fallback mobile; famiglie C e F firmano il fallback `base` come D10.

### Scartati / non verificati

- Il terzo punto MAJOR di claude (testo troncato a «340 wing + 680 planner…») è stato disposizionato come E-07 dalla parte leggibile; se la parte mancante contiene un altro rilievo, torna in un round successivo.

### Emendamenti round 2 (acceptance r001 → OBJECT di claude e deepseek disposizionati)

- **E-12 Cap di convivenza (claude f3, ripristinato).** Budget di convivenza **separato** dichiarato prima di F1.2: le composizioni a gruppo si misurano contro un tetto proprio (non il 24% dei persistenti); varianti generate solo entro quel tetto. Una composizione che lo supera si ridisegna prima del GC-1.
- **E-13 Parità di produzione (claude f4, MAJOR bloccante).** Le superfici del lab devono essere **port dei componenti di produzione** con la nuova veste, non copie nuove: OB-4 emendato — il montaggio riusa il componente di produzione o dichiara il port esplicito; altrimenti la famiglia è un fork che diverge (costo F6 PLAN-112 non finanziato).
- **E-14 Fixture seeding in F0 (claude f5).** Metà inventario non è catturabile da un load pulito di `/game` (verdetto, game over, cerimonie, mercante): F0 produce **saved-state presets** (fixture di stato persistito via PersistenceService) per aprire ogni superficie; OB-1 emendato — inventario + preset + catture.
- **E-15 Floors oggettivi come OB (claude f7).** Nuova **OB-4b (state, blocking):** testo ≥14 px reali, contrasto ≥4,5:1, hit target ≥24 px per famiglia — metriche indipendenti dal gusto.
- **E-16 Famiglia pilota (claude f8).** Dopo il kit (F1.5) si ri-stima lo yield; la prima famiglia esecutiva è **una pilota economica (D o H)** per calibrare, poi le famiglie dure (A, B). L'ordine F2 si aggiorna: kit → pilota → resto.
- **E-17 Split di budget esplicito (claude + deepseek).** §7 e OB-5 riscritti: **kit ~35** (tetto separato) · **hero per famiglia** (dichiarato) · **riserva floor ~30** intoccabile — il floor si applica su kit+hero+iterazioni; valori letti da `gen-budget.json` al `plan:stamp` (E-35 PLAN-112).
- **E-18 §F2 riscritto per tipo di fork (deepseek).** Due classi dichiarate: **art-fork** (hero pieces — B quest, C villaggio, F cerimonie) vs **fork di composizione + reskin dal kit** (A, D, E, G, H). OB-3 «card ruled» vale solo dove esiste art-fork; le famiglie reskin chiudono su contratto di composizione + witness kit.
- **E-19 Spec di fattibilità C+I nominata (deepseek).** Nuova **OB-2c (state, blocking al GC-1):** spec di fattibilità per C (vista dipinta) e I (Pixi) — formato (sprite atlas/vettoriale/shader), risoluzione, hit-test, comportamento zoom — firmata al GC-1. Senza spec il gate non esiste.
- **E-20 Composito sul layout firmato (claude + deepseek).** E-02 precisato: il composito di gruppo usa **il layout firmato al GC-1** (non una variante F1.2) e dichiara quali catture lo compongono — il loophole è chiuso.
- **E-21 E-10 rimosso** (claude): il contratto di composizione è una decisione architetturale; il dibattito era necessario (ha trovato difetti strutturali).
- **E-22 Flag veto popup/modal registrato** (claude): la profile slice porta un veto provvisorio su popup/modal; il ruling «semantics preserved» è definitivo per questo piano → **il Director ritira o delimita il veto**, o le superfici modali B/F/G rischiano difetti di verifica a valle. Decisione segnata in §8 come aperta Director.
- **E-23 Triage dello stop-the-line** (claude f12): i 2 rifiuti che fermano la linea richiedono triage (prompt cattivo vs gate cattivo) prima di contare come rifiuto — un prompt malformato non è un rifiuto di design.
- **E-24 Reference per viewport (deepseek).** E-05 precisato: la coppia di reference è per viewport target della card; se manca una reference mobile, la card dichiara il fallback `base` (come D10) e il ruling **non copre il mobile**.

## 11. Revisione post-scoperte (2026-11-06 — emendamento strutturale)

Raccolta dei cambi resi necessari dalle scoperte di F0–F2-parziale. Vincono dove divergono dalle sezioni precedenti, come §10.

### E-25 Tassonomia cornici per tier (critica Director — template ripetitivo)
Il kit E-01 resta il vocabolario condiviso **T0/T1** (tab, bottoni, divisori, tooltip, placca pf-3-class per pannelli ordinari). Ogni superficie **≥T2** riceve una **cornice dedicata** col suo ornamento (bespoke, non template): T2 superfici di lavoro (mobile compagnia, arredo planner, hero sheet, menu), T3 hero (quest window, invasion, verdict), T4 cerimonie. Vedi `COMPOSITION-SPEC.md` §7.

**Ricalcolo scope arte:** le famiglie "reskin" A/D/E/G/H non sono più senza-asset: ognuna valuta se serve la cornice di tier dedicata. D ed E stanno bene su pf-3 (T1, pilota verificata). A ha le sue cornici (mobile + arredo generati). G (menu) e H (transienti) restano probabilmente T1/T0.

### E-26 Tecnica edit-ancorato (yield misurato)
Le generazioni ancorate su una ref approvata producono la lingua al primo colpo (~2-3 img/asset utili, non ~10 stimato). **Regola:** ogni nuovo asset aggancia come ref 1 l'asset approvato più vicino per ruolo + la material-strip; la variante si itera come edit sulla stessa chat ancorando la versione corrente. Risultati: kit 8 img/4 pezzi, qwin 3, qwinr 2, triad-frames 4 — budget a 82/170 con 3 superfici hero già coperte.

### E-27 Regole di contenuto emerse (da F3-pilota)
- **Campi sempre piani:** ornamento solo su bordi/spandrelli/angoli; il contenuto vivo (testo, liste, icone) vive su zone alabastro pulite — niente testo sopra ornamento.
- **Primitive di produzione, non icone generiche:** le righe/item usano i componenti visivi veri della superficie (`StashItemTile` per stash, `HudGlyph` solo per id validi); i nomi icona di config non sono glyph HUD.
- **Comportamento di produzione preservato:** scroll dentro le placche, modalità, densità — la verifica è su rect/scroll, non solo a vista.
- **Teatro quest = pista separata:** la depth-scene dentro la finestra B segue scene-author (scheda-scena + ok Director prima di generare); il chrome della finestra segue la pipeline gen-queue.

### E-28 F2 riformulata per famiglia (processo corretto)
Per famiglia, in ordine: **1)** assegnazione tier (E-25) + verifica se serve cornice dedicata; **2)** generazione cornice ancorata su ref più vicina (E-26) ×2-3 varianti; **3)** contact sheet → ruling Director → baseline sha; **4)** port su cornice con primitive vere (E-27) + dati reali; **5)** capture DPR2 + test permanenti + gate GF.

### E-29 Stato delle baseline pendenti (alla data)
- **B1 quest window:** qwin-2 firmata come baseline pre-critica; candidati opulenza `qwinr-1/2` — conferma Director pendente.
- **A triade:** mobile `mc-1/2` e arredo `pa-1/2` generati — ruling pendente.
- **Mappatura tier→famiglia:** da confermare (proposta: menu G=T2, ledger E=T1, resto come da §7 spec).

### E-30 Prompt method — libertà creativa all'AI (ruling Director 2026-11-06)
I prompt di generazione NON dettano ornamento (statue/drappo/corona sono interferenza): ref = screenshot reale della superficie/contesto approvato, prompt = specifica funzionale completa (tipo componente, zone, testi, pulsanti, contenuto) + richiesta di PROPOSTE di layout. Constraints solo obbligatori: lingua materiale (alabastro/oro/smalto — serve coerenza civiltà), kill-list (no testo/numeri/colori fuori palette, sfondo navy, vista ortografica). L'AI propone, il Director rulea. Retro-attivo: i prompt futuri seguono questo metodo; i lotti già generati restano valutabili ma non sono il modello.

### E-31 Contratto contenuto PRIMA dell'arte (correzione processo, Director 2026-11-06)
Per ogni superficie hero si scrive prima il **layout spec di contenuto** (zone, cosa mostrano, stati, dati veri, contenuto-estremi — formato `LAYOUT-B1-quest-window.md`) e SOLO POI si genera la cornice che la ospita. Le cornici già fatte (qwin, mobile, arredo) non si buttano: si **verificano contro la spec** — se una zona dipinta non regge il contenuto (es. le 3 placche scelta dipinte vs conteggio variabile 1-3+), si rigenera solo quella zona come fascia libera. Ordine corretto: spec contenuto → cornice → port → verifica.

### E-32 Superfici con GC firmato esenti da layout ruling (convergenza claude+deepseek)
Una superficie coperta da un contratto GC già firmato NON passa per discussione layout: riceve solo presentazione contro il contratto esistente. La triade A (V2 firmata) non si ri-discute.

### E-33 Tabella budget per famiglia (convergenza claude+deepseek+codex)
Le quote immagini si contano per famiglia×tier×pezzi×quota +20% retry, non per asset. Regola dura: a floor riserva raggiunto, le famiglie restanti escono T1-flat. Tabella pubblicata e aggiornata nel budget ledger.

### E-34 Contratto di accettazione per superficie (convergenza chatgpt+claude+groq)
Prima di ogni arte: matrice stati minima (default/populated/empty/loading/error/disabled, overflow, viewport matrix 390×844→1920, scroll ownership, coesistenza con superfici confinanti). Non solo layout.

### E-35 Constraint sheet ai provider (convergenza chatgpt+claude)
Le discussioni AI ricevono la constraint sheet (viewport, contenuto-estremi, regole scroll, coesistenza); le proposte si valutano SU quello, non sul gusto.

### E-36 Ruling modalità esplicito (convergenza codex+claude)
La regola popup/modal va chiarita: quali superfici possono sovrapporsi (regime dedicato vs docked vs inline). E-27 la nominava senza fissarla.

### E-37 Port superfici firmate E/F su /hud-compose (2026-11-08)
Primo lotto di port con dati reali, pattern host `HudReal*` come il cassetto:
- **E3 reliquiario** → `HudRealReliquary` (`?comp=reliquary`): tavola eredità 3 colonne, slot reali da `legacySlotsFor(villageBuildingLevel)`, pick in-memory (semantica produzione — eredità non salvata, ruling pendente PLAN-067 T-C4).
- **E2 memoriale** → `HudRealMemorial` (`?comp=memorial`): sala a nicchie (8-A firmato), voci reali `s.memorial`; `?seed=memorial` = fixture lab per testimoni.
- **F1 level-up** → `HudRealLevelUp` (`?comp=levelup`): 9-B luce ascendente, ASCOLTA il bus reale `hero_levelup_mock`; trigger chip lab dispatcha evento reale → gains reali `heroLevelGains`. Verificato: placca con gains reali (Agi 72→78 ecc.).
- **F4 expedition lost** → `HudRealExpeditionLost` (`?comp=lost`): 10-B, emblema alato prodotto `hud-real/C1/emblem.webp` spento + tombe da `lostReportModel` reale su party fixture lab (documentata — nessun wipe settled sullo store lab).
- Primitive condivise estratte in `hudReal/zanaraOrn.tsx` (palette Z + Orn*/ZanaraPlaque/ZanaraButton); consolidamento cassetto su quel modulo = follow-up (baseline firmata non toccata).
- Verifica: tsc ok, build:check ok, capture `test-results/signed-{reliquary,memorial,levelup,lost}.png`.

### E-38 Volo cassetto VERIFICATO + astrolabio B2 (2026-11-08)
- **Volo cassetto non è un bug**: la catena select→flight→commit è sana — `assigned` 0→1 confermato in probe (`cassetto-assigned.png`, seat leader con ritratto). Il "gap" era un artefatto di misura: `startTransition` affamata sotto SwiftShader (rendering software CPU-bound) + probe con attese troppo corte (~2.8s end-to-end in headless, su GPU reale ~330ms come produzione).
- **B2 astrolabio** → `HudRealAstrolabe` (`?comp=astrolabe`): il VERO `DestinyAstrolabeV62Standalone` frozen dentro la mobilia Zanara (cornice intagliata + cartiglio + THROW smaltato). Stesso contratto props della colonna produzione (autoStart/removeSounds/hideInternalCard/settledIdle, `mode:'random'`). **Limite dichiarato**: la palette interna del quadrante è CSS frozen — il recolor interno è task di contratto sul kit frozen, non un host.
