# RPG Project Decision Log

**Version:** 1.0 (2026-05-20)  
**Purpose:** Record major architecture & strategy decisions with rationale. Audit trail for "why did we do X?"

---

## 2026-11-18 — R-357 chiusa `fatta` con waived-director; tracker unico = PLAN-125

**Da:** R-357 (`in corso`) cumulava la richiesta originale e il diario di esecuzione; il lavoro
residuo era scritto in due posti (voce ledger + §0bis del plan).
**A:** il deliverable della richiesta 2026-11-17 (critica AAA dell'HUD /game + mockup POI +
«come procedere») è assolto: critica consegnata, banco POI pubblicato, plan fix prodotto e
battezzato (PLAN-125 rev. 3). Chiusa `fatta` con `waived-director:` (gate closure:lint); tutto
il residuo — punti aperti del cassetto, Roster/Stash/Victory-Reward allo standard, mockup
Detail/Eventi/Sole/bande/POI, tipografia, icone — vive nel contratto di PLAN-125 (§0bis +
Fasi 7-8 + ordine operativo), tracker unico. I progressi si loggano nel plan, non più in
RICHIESTE.md.
**Fonte:** ruling Director 2026-11-18 «devi chiudere R-357 e fare in modo che quello che
ancora resta da fare sia in quel plan».

---

## 2026-11-18 — Regola: ogni bug fixato ha un test permanente; commit su worktree condiviso via temp-index

**Da:** i bugfix venivano chiusi su probe/witness ad hoc; test a discrezione del task. I commit su
worktree condiviso non avevano una tecnica stabilita (rischio di committare lo staging altrui, T-13).
**A:** (a) direttiva Director (D-300): ogni bug trovato e fixato deve avere un test di regressione
permanente, `test_refs` popolati nel contratto del componente, e quei test eseguiti a ogni modifica
del componente (enforcement meccanico: `livingSyncGate` Mode C + red-first record per invariant).
Applicato retroattivamente su R-359: 5 nuovi file INV-tagged, 18/18 verdi, red-first ×4.
(b) tecnica commit condivisa: `GIT_INDEX_FILE` + `read-tree` + `hash-object`/`cacheinfo` per file
entangled + `commit-tree`/`update-ref` — commit `db93d793`/`d4614cf9` con 0 file R-357 e index
altrui intatto. `commit-tree` non esegue gli hooks (governance:check saltato consapevolmente,
documentato nel bug record).
**Motivo:** R-359 (5 regressioni drag /game): ogni bug aveva una root cause diversa e silenziosa —
senza test permanenti sarebbero tornate invisibili. Il worktree condiviso richiedeva una via di
commit che non distruggesse lo staging parallelo.
**Fonte:** `.mw/runs/20261118-r359-learn/pattern-candidate.md` · `.mw/bugs/20261118-medallion-drag/bug.md` · PROPOSALS.md P-010/011/012

---

## 2026-10-24 — Sprite kit non occludono: cloud-sky tirato da andata

**Da:** i kit atmosphere `sprite` potevano essere attaccati a qualsiasi scena —
cloud-sky era registry-only solo per gusto ("una nuvola su mezzo campo stona").
**A:** i kit sprite sono overlay piatti: NON possono passare dietro occluder
near-plane dipinti. Una nuvola discreta che attraversa i pali del cancello si
legge come nebbia in primo piano. cloud-sky richiede cielo pulito (kill list
"NO distinct cloud silhouettes" è anche per questo) O una mask baked —
estensione possibile ma non implementata. `viaggio-andata` torna a `[]`.
**Motivo:** prova live su andata — il Director l'ha letta come "nebbia sul
cancello", non nuvola. Regola ora nel contratto ambient-layer.
**Fonte:** `.mw/runs/learn-20261024-sprite-occlusion/pattern-candidate.md`

### 2026-10-24 — PLAN-029 v1 implementato (SP-1..SP-8 core)

**Cosa:** implementazione integrale della spine v1 in una sessione:
candidate model+reducer+hash sha256+serialization; GenerationPanel
(picker+kit drawer JSON+tuning+export/import); validation orchestrator
con registry+6 gate runner+QualityGatesPanel; MC async runner SP-4 a
parità con deriveOfferBand; persistenza PersistenceService
(qgl:v1:candidates)+export envelope versionato; spec Playwright.
**Version constants risolte:** nuovo modulo `generation/versions.ts`
(SCHEMA_VERSION/ENGINE_VERSION) + `generatorVersion` sulle righe
registry — T-7 di SP-1 chiuso con owner creato ex-novo (la scelta
conservativa documentata: nessun owner affidabile pre-esisteva).
**Gap onesti registrati:** drawer SP-5 dedicati (party what-if,
variant entity) non fatti — il flusso variante passa da kit-edit;
spec e2e scritta ma non eseguita (T-04: nessun claim visivo);
nessuna status-matrix doc separata.
**Motivo:** il Director ha ordinato l'implementazione completa senza
pause ("procedi ad implementare tutto il plan senza fermarti x domande").
**Fonte:** sessione agente locale, PLAN-029 §8.


## 2026-10-25 — Mood keys: da 2 pilastri a 4 chiavi (evoluzione canone)

**Da:** bibbia §1 prevede DUE pilastri (Wilderness + Empire); "prismatic" come
qualità trasversale; "deserti basaltici" = geografia Empire.
**A:** FOUR mood keys (Director ruling in sessione mood-keys): Rude Beauty,
Impero Solare, **Prismatic** (rovine/invasioni da un ALTRO MULTIVERSO —
strutture aliene che non appartengono al paesaggio; iridescenza solo su
veli/membrane/lenti), **Dark Wasteland** (chiave propria: cobalto-vs-arancio,
oscurità luminosa, NO meteore, impasto violento, niente perfezione).
**Motivo:** il moodboard evoluto; la tassonomia 4-chiavi serve a generare
scena-library coerente per bioma.
**Fonte:** `context/research/2026-10-25-mood-keys/README.md` §Canon evolution.
**Nota:** la bibbia `art_direction_plan.md` §1 non è ancora aggiornata —
questa entry registra il ruling; la modifica della bibbia richiede
approvazione Director.

## 2026-10-25 — Gimmick «indagine»: requisiti Director + modello proposto (non ratificato)

**Contesto:** discussione di design sulla core gimmick investigativa
(transcript parziale in sessione; parte pomeridiana non recuperabile —
ingestion `context/ingestions/2026-10-25-gimmick-indagine-e-acquisizione-info.md`).
Registrata come R-286. La candidata «indagine a soffio» (ARCHITECTURE
§18.5) passa a modello articolato → ARCHITECTURE §19.

**Director-stated (requisiti di design):**

- Deduzione investigativa **realmente fallibile**: una conclusione
  sbagliata può perdere la quest — applicazione di QUEST_RULES §9 a una
  sconfitta epistemica (non ferita/morte/fuga).
- Stesso indizio **re-investigabile**: più interazioni/domande, valori
  che evolvono — mai una-tantum.
- Informazioni raccoglibili **anche passivamente** e **trasversalmente
  a tutte le gimmick** — requisito architetturale, motivato dal riuso.
- Estremi del dado: successo critico = convinto del *giusto* con
  sicurezza alta; fallimento critico = convinto dello *sbagliato* con
  sicurezza alta.

**Proposte AI (NON ratificate):** sicurezza a tre livelli; separazione
direzione × sicurezza; `win`→corretta+media / `fail`→sbagliata+media
(`almost` aperto); sicurezza = convinzione soggettiva del personaggio;
re-investigazione come nuova osservazione (mai auto-incremento; possibile
radicamento dell'errore); sistema a tre atti
acquisizione/interpretazione/deduzione; quattro modalità di acquisizione
(passiva, intenzionale, interazione, emergente); «evento informativo»
(informazione ≠ interpretazione); affidabilità per-evento
(oggettiva/parziale/fallibile).

**Aperto:** → OPEN-023 (7 sub-questioni, incl. semantica `almost`, climax
a «dichiarazione irrevocabile», layer «interpretazioni» nel run state).

**Fonte:** sessione Director↔AI 2026-10-25; modello in
`context/QUEST_GENERATION_ARCHITECTURE.md` §19.

## 2026-10-25 — Transcript integrale recuperato: requisiti Director aggiuntivi + correzioni di provenance

**Contesto:** il transcript integrale della conversazione ChatGPT
22→25 ottobre è stato recuperato dallo share link
(`context/ingestions/2026-10-22-25-quest-generation-gimmick-transcript.md`)
e ingerito in supplemento
(`context/ingestions/2026-10-25-transcript-integrale-gap-analysis.md`,
ledger S-01..S-25). La parte del 22 ottobre non era mai stata ingerita.

**Director-stated (requisiti recuperati dalla parte mai ingerita):**

- **Gameplay-first (verbatim 22/10 20:44):** «dobbiamo innanzitutto
  rendere il processo di creazione delle quest meccanicamente divertenti
  e interessanti online, al resto pensiamo dopo» — priorità su
  varietà/qualità meccanica prima di narrativa e macro.
- **Quest per l'amico:** obiettivo immediato = una quest funzionante e
  comprensibile da far provare; non bloccare la prova in attesa del
  sistema finale.
- **Una quest authored per gimmick (25/10):** scrivere autorialmente un
  tipo di quest per ogni gimmick — fasi tutte agganciate al gameplay,
  twist e storia interessante insieme.

**Correzioni di provenance:** «non recuperabile» dell'ingestione
primaria (E-15/E-17/E-21) parzialmente superato — corpus gialli
(Christie/Doyle, finalisti *Il doppio indizio* e *I quattro sospettati*),
modello registro/diario/ricostruzione e contenuto del docx di passaggio
sono nel transcript. Resta mancante la sessione separata del pomeriggio
25/10 («dichiarazione irrevocabile», soluzioni scartate) → OPEN-023.

**Proposte AI (NON ratificate, nuove):** ranking gimmick (Rituale prima
candidata, Corruzione, Cargo volatile; Race sconsigliata come modello);
tassonomia 8 meccaniche investigative + metodo design in 5 step; dossier
autoriale a 7 voci con twist a ritroso; 5 livelli di generazione con
target «alto tasso di risultati utilizzabili»; 5 domande di valutazione
+ 6 ingredienti quest; roadmap a 5 fasi; modello i18n narrativo
(lingua sorgente + versione + glossario).

**Fonte:** `context/ingestions/2026-10-25-transcript-integrale-gap-analysis.md`;
ARCHITECTURE §19.6 aggiornato; OPEN-023 (e,g parziali; nuove h).

## 2026-10-25 — Modello gimmick corretto: core gimmick vs sfumature sul tema vs domain kit

**Director-stated (modello corretto, sostituisce il censimento piatto):**

- Una core gimmick può avere **più sfumature/varianti sul tema**: stessa
  algebra del problema, diversa espressione del limite/pressione.
- Esempio canonico — gimmick «avanzamento sul tracciato» (tracciato +
  victory point + eventi che spostano avanti/indietro): sfumature =
  **a tempo** (X VP in N round), **contro avversario** (il limite è il
  cursore dell'antagonista), **resistenza** (tower-defense: accumulare
  i VP sopportando N round di pressione). Miglia/km a cavallo = flavour,
  livello domain kit.
- Il censimento attuale è **sbagliato**: contiene molte «gimmick» che
  sono la stessa gimmick con variazioni — «invece di avere 15 gimmick,
  ne avremo molte di meno». Vanno divise in core + sfumature (task →
  OPEN-024, R-287).
- La gimmick «investigation» (§19, OPEN-023) creata in questa
  discussione è una core gimmick **diversa davvero** — algebra
  epistemica, non tracciato di VP.

**Conseguenze registrate (PROPOSAL):** asse «condizione-limite
parametrizzata» da aggiungere al contratto `CoreGimmick` (CONTRACTS §2);
metrica di varietà strutturale (§18.4) applicata alle core *dopo* il
collasso delle sfumature.

**Fonte:** Director in sessione 2026-10-25 (voice, verbatim in
ARCHITECTURE §20.1); modello formalizzato in
`context/QUEST_GENERATION_ARCHITECTURE.md` §20.

## 2026-10-26 — Parallax plate: struttura E contenuto (A13)

**Da:** il gate parallasse verificava solo la struttura (focale laterale,
layering, terreno continuabile) — ridge_P1 "passava" ma era una cartolina
vuota: prato pulito, fireflies diurne senza causa, foreground tappeto.
**A:** il giudizio su una piastra richiede entrambe le checklist: struttura
parallasse + contenuto A11/A12. Regole nuove: ambient ancorato alla light
identity, near layer = massima densità di interesse, accento come campo
causale con dosaggio verificato, fauna come scala+storia+ancora runtime.
**Motivo:** 3 edit diretti del Director su ridge P1 (papaveri causali,
cervi al torrente, fiori multihue nel fg) hanno dimostrato il gap.
**Fonte:** `.mw/runs/20261026-learn-parallax-plate/pattern-candidate.md`,
protocollo v5 A13.

## 2026-10-26 — commission-vs-specification confermato per ablazione

**Da:** pattern-prompt-sovereignty come ipotesi (run 2026-10-24) — il prompt
Director verbatim è la spec.
**A:** confermato empiricamente: blind rank Director su ablazione A0-A4 —
commission→rubrica-t2 batte engineered, free, e commission+rubrica-t1.
La rubrica conta per POSIZIONE (turn-2), la search persa era il difetto
dominante singolo.
**Motivo:** ablazione 5 arm × {claude, deepseek} × 3 + blind scoring.
**Fonte:** `.mw/runs/pattern-commission-vs-specification.md`,
`mind-weaver/.mw/runs/20261024-ablation-a0a4x/`, `20261026-hats-gate/`.

## 2026-10-29 — `mappa2`: regioni (territori) e biomi sono due livelli distinti

**Da:** `regions.json` == `biomes.json` (10 voci, poligoni grossolani); le animazioni leggevano le
regioni come biomi.
**A:** regioni = 20 territori di gioco contigui stile Risiko (mare incluso, `region_ids.png`);
biomi = 13 tipi di terreno ripetibili in zone lontane (`biome_ids.png`). **Le animazioni, la canopy e il
meteo chiavano a bioma, mai a regione.**
**Motivo:** richiesta Director R-293 — le zone di gioco e il look del terreno non coincidono (stesso
bioma in posti distanti; una regione può contenere più biomi).
**Fonte:** `plans/PLAN-099-mappa2-territories-and-biomes.md`, `RICHIESTE.md` R-293.


## 2026-10-29 — Scope della gimmick: core perdura e si interlaccia; gimmick di scena ammesse

**Director-stated:** una quest deve avere una core gimmick che **perdura
per tutta la storia (o quasi)** e **si interlaccia con le varie scene**;
possono esistere anche **gimmick specifiche di una singola scena**.

**Conseguenze registrate (PROPOSAL):** le algebre (tracciato /
indagine / cash-out) sono ortogonali allo scope — istanziabili come
core o come gimmick locale (scena-interrogatorio, micro-PYL, fuga a
tempo); distinzione gimmick-di-scena (algebra giocabile) vs archetipo
decisionale (forma di scelta, non sempre algebra); «interlacciarsi»
formalizzato dalla regola 75% + hook (§2).

**Fonte:** Director in sessione 2026-10-29; modello in
`context/QUEST_GENERATION_ARCHITECTURE.md` §20.10.

## 2026-10-29 — Tassonomia gimmick definita dal Director (versione corrente)

**Director-stated (tassonomia):**

- **Tracciato** — arrivare alla fine del tracciato; varianti: a tempo,
  a tempo reward, tracciati multipli (gara), inverso (difesa), scorta,
  avvelenato (HP di un membro del party).
- **Livello di allarme** — valore su/giù; a soglia +1 livello → quest
  più difficile/pericolosa (dial a gradini, non corsa).
- **Investigazione** — doppio tracciato per pista: ogni punto = indizio
  su pro/contro, con alta/bassa convinzione.
- **Tiro contrapposto** — X tiri a media successo; ritenti quanto vuoi
  ma ogni tiro costa di più (danni, difficoltà).
- Skin/domain kit rinviati («c pensiamo poi»).

**Aperto:** a tempo reward (variante vs modificatore ortogonale),
allarme come core vs modulo, PYL vs tiro contrapposto, conferma modello
doppio-tracciato indagine → §21.6.

**Fonte:** Director in sessione 2026-10-29; canonico in
`context/QUEST_GENERATION_ARCHITECTURE.md` §21 (supera §20.3/§20.5
dove diverge).

## 2026-10-29 — Ruling: reward-time ortogonale, cash-out meccanica innestabile, gimmick componibili

**Director-stated:**

- «A tempo reward» è **ortogonale** (asse di reward, non variante) —
  applicabile a qualsiasi variante di tracciato.
- **Cash-out** forse «meccanica su + gimmik» — leaning innestabile, non
  core propria («è da pensare», non ratificato).
- **Le gimmick potranno essere innestabili tra loro, anche
  investigare** — composizione come proprietà generale (core +
  moduli/gimmick innestati + gimmick di scena).

**Fonte:** Director in sessione 2026-10-29; registrato in
`context/QUEST_GENERATION_ARCHITECTURE.md` §21.7.

## 2026-10-30 — Lock di forma su upscale generativo: la banda compositata, non il modello

**Da:** PLAN-096 assumeva che il lock di forma dipendesse dal generatore giusto (denoise/ControlNet corretti).
**A:** Il lock pixel-exact è la banda di contorno compositata dal master neutrale come ultimo passo; il generatore è intercambiabile — Gemini-web col prompt diretto del Director (D-228) dentro il lock ha dato la migliore fedeltà misurata (edgeIoU 0.61) e batte ComfyUI anche sul tempo per tile. Ricetta completa nel dibattito `mind-weaver/.mw/runs/20261030-mappa2-upscale-recipes/artifact-r003.md` (4/4 ACCEPT).
**Motivo:** evidenza misurata sul crop cascata/vegetazione: ogni generatore senza lock muove i contorni; dentro il lock la scelta del generatore diventa questione solo estetica/costo.
**Fonte:** `.mw/runs/20261030-upscale-learn/pattern-candidate.md`

## 2026-11-01 — Deploy verification: «200 OK» non è «done»; landing unificata su /mappa2-lab

**Da:** il ciclo commit→push→deploy si chiudeva sul successo del deploy guard
(pagine che rispondono 200 + contenuto). La landing su `/` era game frame su
desktop e mappa2-lab su mobile (R-297).
**A:** (1) il deploy è «done» solo con verifica post-deploy sul path reale —
per superfici Pixi probe headless con WebGL (`--enable-unsafe-swiftshader`),
perché senza GPU il renderer cade su Canvas e salta i code path mesh/shader
(crash `pack.packRoot` su /game invisibile ai check 200); invariante in
`00-project-invariants.md`, probe `scripts/_tmp-*.mjs`. (2) `/` renderizza
`Mappa2LabPage` su tutti i device + canonicalizza URL (R-305, estende R-297);
il game frame resta su `/game` e `/game-frame-pixi`.
**Motivo:** deploy del 2026-11-01 dichiarato OK con `/game` rotto per gli
utenti WebGL; il Director ha imposto verifica-fino-a-verde e landing unica.
**Fonte:** `.mw/runs/20261101-deploy-verify-learn/pattern-candidate.md`

## 2026-11-07 — expedition-session-mount-contract (learn dal port cassetto)

**Da:** montare `useQuestExpeditionSession` fuori da `/game` sembrava bastasse il hook.
**A:** la catena completa è: `isDetailOpen` (gate di tutta l'assegnazione/eleggibilità/stima) → `wrapDetail:()=>null` (nasconde il dettaglio produzione, la nuova superficie È il dettaglio) → `{session.overlays}` (contiene `DragOutcomeFlight` che scrive `assignments` a volo atterrato — senza, il volo non completa mai) → `<DndContext sensors>` → `data-testid="slot-button-{id}"` (geometria volo) → `data-resident-id` sulle card. Ogni pezzo mancato produce un fallimento silenzioso diverso.
**Motivo:** il port del cassetto Zanara ha esposto l'intero contratto implicito di montaggio — la sessione è progettata per /game e nessun pezzo documenta che è obbligatorio.
**Fonte:** `.mw/runs/20261107-hud-cassetto-learn/pattern-candidate.md`

## 2026-11-09 — mockup-signed-is-not-an-asset (learn dalla F3 Zanara)

**Da:** portare una superficie firmata = usare il mockup come `<img>` e coprire il testo dipinto con `<Cover>` opachi — bastava che dati e interazioni fossero reali.
**A:** un mockup firmato è un CONCEPT (sfondo cucito, testo/widget dipinti). L'asset runtime è un FRAME PULITO: alpha RGBA scontornata al pixel + interni svuotati nell'asset (graft da asset fratelli, fill smalto, inpaint del testo) — zero toppe CSS. Zone misurate con griglia `cv2.line`, pulizia verificata a pixel (`bright-frac`), fit per dimensione vincolante, e "allineato" solo dopo side-by-side col firmato (T-04).
**Motivo:** tre giri di "toppe" bocciati dal Director (`ritagliato rozzamente`, `inaccettabile`) — la verifica era su dati/interazioni, non sul confronto visivo col firmato.
**Fonte:** `.mw/runs/2026-11-09-hud-real-f3/pattern-candidate.md` + `.mw/specs/hud-real/MOCKUP-TO-ASSET-GUIDE.md`

## 2026-11-10 — harmonize-object-in-scene-then-reclaim (learn dalla pagina Village)

**Da:** aggiungere un edificio ritagliandolo da un'immagine generata (su verde o da una composizione AI), poi ritoccando bordi e ombre; posizione presa dall'immagine generata e giudicata a occhio.
**A:** armonizzare l'edificio dentro la scena reale composta (l'AI ridipinge solo edificio e base), riprendere solo edificio+base allineati via ORB sul fondo, misurare la linea di terra del proprio dipinto, verificare dal vivo con confronto all'originale.
**Motivo:** i ritagli restavano adesivi; l'immagine generata ridipinge fiume e prato, quindi le sue coordinate locali non valgono sul nostro dipinto (spostamento globale ~0 non implica geometria locale coincidente); la verifica sulla sola composizione non basta.
**Fonte:** `.mw/runs/2026-11-10-village-building-layers/pattern-candidate.md`

## 2026-11-10 — cassetto-colonna-testata-integrata (ruling R-323)

**Da:** cassetto 360 px con la barra risorse appoggiata sopra la testata (due cornici sovrapposte), poi anteprima a 480 px con arte allargata.
**A:** cassetto = colonna destra a tutta altezza, più stretta (420 px a 1440, 400 a 1280); le risorse diventano targhette nella testata della cornice (la barra perde cornice e medaglione), sotto il titolo il costo della spedizione; CONFIRM con proporzioni native (solo scala uniforme) e aria; ornamenti mai stirati.
**Motivo:** il Director ha giudicato l'anteprima meno elegante, il fondo ammassato e la testata non legata; tra «risorse dentro la cornice» e «barra sopra, colonna sotto» ha scelto la prima. Regola collegata: critica da senior UI AAA prima di ogni parere o piano HUD/UI.
**Fonte:** `.mw/runs/20261110-cassetto-explore/visual-fork-cassetto-colonna.md`

## 2026-11-11 — Due famiglie di opportunità sulla mappa (OPEN-026, parziale)

**Da:** proposta esterna (ChatGPT) di tre categorie sulla mappa — quest (storia), job (incarico), attività (esplora / studia / costruisci) — ognuna con icona-verbo e colore propri.
**A:** sulla mappa di `/game` il giocatore vede **due famiglie**: **spedizione** (una volta, a rischio, passa dal planner) e **lavoro** (continuativo, con slot e resa). «Esplora / studia / costruisci» **non** sono una famiglia: sono verbi che possono stare in entrambe; il verbo compare come icona di riga dentro l'Hub, non sul marker (sul marker il glifo resta il luogo, Sigillo D1).
**Motivo:** la differenza che conta per il giocatore è meccanica, non tematica; «Activity» nel codice è già l'ombrello di tutti i POI (`ActivityDefinition`), quindi come terza famiglia avrebbe rotto il vocabolario.
**Da confermare:** la minaccia/evento (rombo) resta una variante della spedizione con la sua sagoma, come già nel Sigillo — non è stata rimessa in discussione dalla domanda.
**Resta aperto (OPEN-026):** ritorno della famiglia lavoro su `/game` (oggi `deprecated`, CTR-game-008); metallo dell'anello per famiglia (R-177).
**Fonte:** Director in sessione 2026-11-11 («2 famiglie»); `context/ingestions/2026-11-11-poi-stati-hub-opportunita.md`

## 2026-11-11 — Luogo sulla mappa: hover = scheda alabastro, clic = ventaglio (OPEN-025, parziale)

**Da:** tre forme proposte per il componente Luogo (punto della mappa con più attività correlate): A pergamena con righe, B teatro con sigilli in fila, C ventaglio di sigilli attorno al luogo.
**A:** combinazione su due gesti, sulla mappa e senza cambiare pagina:
- **mouse over** sul Luogo → la scheda verde e alabastro (linguaggio `HudRealPanel`: testo + immagine) che presenta il luogo;
- **clic** sul Luogo → **ventaglio**: i sigilli delle sue attività si aprono attorno al luogo sulla mappa, ognuno con il proprio halo di tempo (stessa grammatica del Sigillo); il clic su un sigillo apre il dettaglio esistente.
**Motivo:** l'hover dà contesto (immagine, racconto) senza impegno; il ventaglio tiene l'azione nel mondo e riusa la grammatica di stato già decisa per i POI. Le critiche dell'explorer a C (niente posto per immagine/descrizione) sono assorbite dalla scheda in hover.
**Aggiunta (stesso giorno):** oltre ~6–8 attività il ventaglio si dispone su **due anelli concentrici** di sigilli (scelto contro «8 più urgenti + sigillo «altre»»).
**Aggiunta (stesso giorno):** anello interno = **urgenza** (in scadenza / finito da ritirare), esterno = il resto. Motivo del Director: oltre al villaggio i posti con tante attività saranno pochi e fatti quasi solo di job, quindi la famiglia distinguerebbe poco; le eccezioni urgenti sono rare e proprio per questo contano. Il clic su un sigillo del ventaglio apre il **dettaglio specifico** dell'attività (oggi, per le quest, il cassetto laterale del planner).
**Resta aperto (OPEN-025):** forma e taglia della scheda in hover (quella attuale è fatta per una sola attività con placca d'azione); dettaglio dei job (non esiste ancora un equivalente del cassetto); capienza oltre i due anelli (improbabile); collisioni con i POI vicini; chiusura del ventaglio; equivalente senza mouse (controller/touch).
**Fonte:** Director in sessione 2026-11-11 («mouse over il componente di alabastro … onClick ventaglio»).

## 2026-11-11 — POI prima, da soli; POI vicini diventano automaticamente un Luogo

**Da:** PLAN-117 rev. 1 con POI Zanara e Luogo nello stesso piano.
**A:** si lavora **prima sul POI da solo** (PLAN-117 rev. 2); il Luogo va in un piano successivo, dopo il ruling sul POI. Regola nuova: **se molti POI sono vicini diventano automaticamente un Luogo** e si mostrano nel modo nuovo (hover scheda alabastro / clic ventaglio) — un Luogo può nascere dalla vicinanza, non solo essere scritto a mano.
**Motivo:** il ventaglio è fatto di POI (taglia e sagoma ne decidono le distanze); il POI serve ovunque, il Luogo in pochi posti; una decisione per volta.
**Aggiunta (stesso giorno):** «vicini» = **distanza nel mondo** (fissa a ogni zoom, non dipende dallo schermo). La soglia si misura allo zoom più lontano, dove i POI non raggruppati sono più vicini sullo schermo (PLAN-117 D-8, F1 T1.3).
**Resta aperto:** il valore della soglia.
**Fonte:** Director in sessione 2026-11-11 («lavoriamo sul POI da solo, se ce ne sn tanti vicini deve divnetare automaticamente un luogo …»).


## 2026-11-11 — Alabastro: solo per pochi elementi «eccezionali»

**Da:** design-intent v2 del kit Zanara (ruling 2026-11-06): «La lingua vera (NON alabastro)» — il kit pf-3 tutto in alabastro era un errore di ancoraggio.
**A:** la regola resta (la lingua di base è smalto smeraldo/navy + oro inciso + gemme, **non** tutto in alabastro), ma l'alabastro è **ammesso per pochi elementi scelti**, come componente eccezionale. Primo uso approvato: la scheda in hover del Luogo (testo + immagine), PLAN-117 / OPEN-025.
**Motivo:** Director: «nn deve essere tutto fatto in alabastro, cm accadeva prima. Ma x pochi elementi scelti può andare, e questo mi sembra un ottimo modo x usare quel componente "eccezionale"».
**Come si applica:** POI, barre, pannelli ricorrenti restano su smalto + oro; l'alabastro va proposto solo come eccezione dichiarata, un elemento alla volta.
**Fonte:** Director in sessione 2026-11-11.

## 2026-11-11 — POI: il glifo dice il tipo, non il luogo; blu ammesso; forma «cheap» bocciata

**Da:** Sigillo D1 (`poi_family_spec.md` § Sigillo, anatomia riga 6): «Glyph = the **place**, not the verb».
**A:** il glifo del POI mostra **il tipo** di attività. Motivo del Director: *«è giusto che mostri il tipo e nn il luogo: dove è è già il luogo, xè dovrei indicarlo?»* — la posizione sulla mappa dice già il luogo. Conseguenza: il tipo è portato dal glifo (leggibile anche senza colore), quindi colore e sagoma non sono più l'unico veicolo della famiglia.
**Colore:** il **blu** del mockup Gemini 2026-11-11 (`.mw/runs/20261111-poi-zanara/gen/director-gemini-open-prompt.webp`) va bene; il teal/verde-acqua precedente no.
**Forma e materiale:** bocciati come *«troppo cheap, troppo dozzinale, plastico»* (medaglioni a stella-bussola tutti uguali, gemme ovunque, lucido uniforme).
**Supera:** Sigillo D1 (glifo = luogo) — OBSOLETE → questa voce, 2026-11-11.
**Fonte:** Director in sessione 2026-11-11.

## 2026-11-12 — POI: le punte della sagoma restano (sono ciò che lo rende leggibile)

**Scoperta (2026-11-11, mockup Gemini a stella-bussola):** le punte della sagoma rompono la texture della mappa e fanno staccare il POI su ogni bioma; insieme al campo scuro sono la causa della leggibilità misurata sulla mappa2 (prova `.mw/runs/20261111-poi-zanara/evidence/G-*`).
**Regola:** la sagoma con le punte **resta**. La critica del 2026-11-11 riguardava le **4 gemme identiche** sulle punte (copia del gioiello della nav), non le punte: le punte restano in oro, il gioiello colorato è uno solo.
**Errore corretto:** nel brief di aggiustamento v3 l'agente aveva chiesto di togliere le punte laterali e in basso — regressione su una scoperta già fatta; corretto su segnalazione del Director 2026-11-12.

## 2026-11-12 — POI: strada «v4 ricca» indicata dal Director

**Direzione:** la tavola `.mw/runs/20261111-poi-zanara/gen/director-v4-ricco.webp` (smalto bombato con craquelure, cornice d'oro a rivetti con ornamenti, punte, gemme) è per il Director «la strada corretta»; proposta sua: **blu per le quest al posto dell'oro**.
**Prova a 48 px sulla mappa2 (`evidence/v4-zoom-48.png`):** il campo d'oro si perde su deserto e montagna (conferma la proposta blu); il blu si legge ovunque; il verde sulla foresta è debole; icone multi-materiale (scudo+spade, figura incappucciata) diventano rumore a 48 px; l'icona bussola compete con il gioiello della nav.
**Stato:** direzione indicata, non ancora approvata come baseline.

## 2026-11-12 — PLAN-117 battezzato (rev. 5): layer opportunità della mappa

**Approvato dal Director («approvo») dopo dibattito multi-AI `20261111-plan117-rev4` (converged 4/4, artifact-r002).** Decisioni prese:
- **D-1:** lab `/lab/poi-luogo` su `PixiWorldMap` + anchors (niente montaggio su `/game` finché il flusso POI→quest di PLAN-116 D8 non esiste).
- **D-9:** **3 tipi POI** — quest / job / event-locale (evento puntuale con scadenza), sagome+punte proprie; gli Eventi strategici restano fuori mappa. Divergenza di claude (preferiva 2) registrata; OB-7 = criterio oggettivo di distinguibilità a 32px in grigio.
- **D-10:** colore famiglia ammesso come **rinforzo**; l'identità sta su sagoma+punte (daltonismo-safe).
- **D-11:** urgenza = pulsazione **+ equivalente statico** non-colore (niente vermiglio); attivo con prefers-reduced-motion.
- **D-12:** `StrategicEventKind` = componente timeline dedicato ordinato per scadenza, **mai** marker mappa; `event` in `MapPOIType` = solo evento locale puntuale.
- **D-13:** modello canonico `Region 1:N Place 1:N POI`; `placeId` obbligatorio opaco; `regionId` provisional con consolidamento al gate F6.
- **D-15:** chiusura a due livelli — il core F0–F4 chiude PLAN-117; F5 (Eventi) e F6 (Regioni) possono spin-off in piani successori con contratti propri.
- **Grammatica Sigillo rev. 5 (P1):** bordo=visibilità, sagoma+punte=famiglia, glifo=attività puntuale (non famiglia, non luogo — il luogo lo danno posizione e scheda hover), anello=tempo con verso semantico CW=in corso (colore famiglia) / CCW=countdown (arancione) + geometria ridondante (pieno capo tondo vs tacche+gioiello terminale).
- **Veto modali GX-0042 esteso al core:** scheda hover e ventaglio ancorati non bloccanti, dettaglio in sezione dedicata.
**Supera/integra:** voci 2026-11-11 su POI (aggregazione emergente bocciata definitivamente; «vermiglio=urgenza» sostituito; famiglia evento ridefinita come evento-locale).
**Fonte:** `plans/PLAN-117-poi-zanara-e-luogo.md` rev. 5; run `mind-weaver/.mw/runs/20261111-plan117-rev4/` (report.md, artifact-r002.md).

## 2026-11-12 — POI: cornice verde scelta (baseline di lavoro)

**Scelta del Director:** cornice `.mw/runs/20261111-poi-zanara/piece/poi-frame-green.png` = versione con anello interno, gemme delle quattro punte ingrandite 1,3× in proporzione (oro + gemma + castone insieme), **collare sottile quasi nero** (`#060c14`, ~1 px a 48 px) e **bagliore dorato intenso in controluce** come strato separato (`poi-glow-gold.png`, radiale, sommato alla mappa in modalità screen, non un secondo collare).
**Scoperte di questo giro:** allungare solo l'oro delle punte le rende fili che spariscono a 32–48 px (Director: «le punte sembrano sparire»); a far spiccare la sagoma servono rombi di gemma grandi + contorno; un «alone» fatto come fascia colorata attorno alla sagoma è un secondo collare, non una luce — il bagliore deve essere radiale e additivo («come se ci fosse una fonte luminosa dietro»); collare spesso/scuro bocciato come troppo pesante.
**Nel gioco:** il bagliore è uno strato a parte (CSS `mix-blend-mode: screen` o equivalente) così colore/intensità possono seguire lo stato.
**Prossimi:** versione blu con zaffiri; eventuali punte in più (da decidere); punte laterali da rifinire; listelli del rombo in basso.

## 2026-11-12 — Halo del POI: il tempo riempie la cornice, non un anello esterno

**Decisione del Director:** il tempo si legge riempiendo di smalto la **fascia esterna** della cornice, quella con le gemme (opzione 2). Il riempimento è parte del materiale del POI, non un arco sovrapposto: niente anello colorato attorno. Il mockup di riferimento (`images/17.webp`, mockup sbagliato in tutto il resto) mostra il principio: la banda verde dietro l'oro si allarga man mano che il tempo avanza.
**Senso:** lavoro = riempimento in senso orario da dodici; scadenza = svuotamento in senso antiorario. Stessa fascia, punto di partenza e verso diversi.
**Estremi:** vuoto = solo oro, nessuno smalto; pieno = tutta la fascia esterna in smalto (stato «finito» leggibile senza pulsazione).
**Ancora da decidere:** colore dello smalto per stato (il vermiglio resta solo per l'urgenza); se l'arco sta sopra o sotto il bagliore (proposta: sopra, sottile, ma ora non serve più come elemento separato).
**Da aggiornare dopo conferma:** `poi_family_spec.md` (sezione Halo grammar), `design-intent-v2.md`, questo log.

## 2026-11-12 — Riempimento dell'halo: colore della famiglia del POI

**Decisione del Director:** lo smalto che riempie la fascia esterna ha il **colore della famiglia** del POI, lo stesso della cupola: lavoro (job) = verde smeraldo, spedizione (quest) = blu. Non sono previsti altri colori per ora. Supera la proposta dei colori di stato (avorio/argento/rosso del mockup `gen/director-halo-fill-example.webp`).
**Aperto:** il Director non è convinto del blu per le quest; da provare un'alternativa sulla mappa. Da chiarire anche come si segnala l'urgenza ora che il colore non cambia con lo stato (badge «!» e/o altro).
**Fonte:** Director in sessione 2026-11-12.

## 2026-11-12 — POI: niente badge; urgenza solo sull'arco di scadenza

**Decisione del Director:** **nessun badge di stato** sul POI (clessidra, «!», forziere, spunta: non previsti). L'urgenza riguarda solo l'arco **antiorario** (scadenza), e forse non serve nemmeno lì; al massimo l'**ultimo 10%** vira al rosso: blu → viola → rosso per le quest, verde → … → rosso per i lavori.
**Nota tecnica (prova `evidence/urgency-ramps.png`):** la miscela diretta dei colori passa per toni spenti (verde→rosso = marrone fangoso, blu→rosso = malva grigio); la miscela percettiva passa per tinte vive (verde→rosso = oliva→ambra→arancio, blu→rosso = viola→magenta). Per il verde l'ambra intermedia rischia di confondersi con l'oro della cornice.
**Supera:** stato «decision waiting» come badge separato e il vermiglio del Sigillo a 25% della finestra (ora 10%, e solo se serve).

## 2026-11-12 — Viraggio all'urgenza: miscela percettiva per entrambe le famiglie

**Decisione del Director:** l'ultimo tratto dell'arco di scadenza passa dal colore della famiglia al rosso con la **miscela percettiva** (colori vivi, niente marrone). Verde → oliva/ambra/arancio → rosso per i lavori; blu → viola/magenta → rosso per le quest. Niente tratto marrone dedicato.
**Nota:** il passaggio verde→rosso attraversa ambra, vicina all'oro della cornice: resta da verificare sulla mappa che l'arco si legga ancora in quel tratto.

## 2026-11-12 — Arco di tempo del POI: versione «C, acceso e largo»

**Scelta del Director:** riempimento della fascia esterna con verde **più acceso** (`#16c46c`, più chiaro al centro, meno «bruciato» dalle incisioni) e fascia **più larga**, estesa verso l'interno (da 0,885 a 0,845 del raggio esterno; ~2,2 px a 48 px, ~3 px a 64 px).
**Motivo:** a 48 px l'arco era 1,5 px e il verde scuro quasi invisibile sulla foresta (prova `evidence/arc-intensity-test.png`).
**Aperto:** colore acceso equivalente per le quest (blu/alternativa); viraggio al rosso (soglia da riprovare, 25% proposto); animazione legata al progresso del tempo.

## 2026-11-12 — Arco del POI verde: stesso verde dell'interno

**Decisione del Director:** il verde dell'arco è lo stesso verde dell'**interno** del componente (la cupola), non un verde più acceso. Supera la scelta «C» (`#16c46c`), giudicata troppo chiara.
**Misura:** la cupola ha molte sfumature; valore tipico `#073f25`, 75° percentile `#185d35`, 90° percentile `#2d784c` (tinta ~152°). Adottato il **90° percentile `#2d784c`**, cioè lo smeraldo luminoso della cupola. Il valore tipico e il 75° si confondono con il collare scuro e con la foresta.
**Costo noto:** a 48 px è meno leggibile di `#12a35a`; a 32 px l'arco non si legge comunque (spessore ~1,3 px). Prova: `evidence/green-dome-test.png`.

## 2026-11-12 — POI verde BATTEZZATO

**Componente battezzato (famiglia lavoro, verde):** cornice `.mw/runs/20261111-poi-zanara/piece/battezzato/poi-green-frame-alpha.png` (trasparente, senza collare, bagliore e icona) + `poi-green-frame-for-gemini.png` (stessa cornice su sfondo piatto `#0a1622`). Caratteristiche: anello interno con filigrana, cupola ingrandita, 4 rombi di gemma ingranditi 1,3× in proporzione, punte, ritocchi puliti.
**Strati che aggiunge il codice:** collare quasi nero sottile (`#060c14`, ~1 px a 48 px), bagliore dorato a raggi come strato additivo (`piece/poi-glow-gold.png`), arco di tempo nella fascia esterna (livelli in `piece/layers/`).
**Arco:** canale 0,845–0,972 del raggio; verde **`#226a40`** (tra il 75° e il 90° percentile dei verdi della cupola, più scuro del 90° su richiesta del Director); scarica antioraria da pieno, riempimento orario per il lavoro; viraggio percettivo al rosso (soglia da fissare, 25% proposto).
**Prossimo:** versione blu (quest) da ricolorare con Gemini a partire da `poi-green-frame-for-gemini.png`; poi aggiornare `poi_family_spec.md` e `design-intent-v2.md`.

## 2026-11-12 — POI quest (zaffiro) BATTEZZATO; asset in public; handoff

**Battezzato dal Director:** cornice blu ricolorata da Gemini a partire dal POI verde (sagoma coincide al 90,5 %, oro invariato, cupola un po' più scura: L 45 contro 52). Stessa sagoma e stessi materiali del verde; cambia solo lo smalto.
**Asset tracciati:** `public/assets/ui/hud-real/poi/` — `poi-job-frame.webp` (verde), `poi-quest-frame.webp` (blu), `poi-glow-gold.webp`, `poi-icon-logs.webp`, `layers/*` + `arc-geometry.json`.
**Handoff:** `context/handoff-poi-zanara-production.md` (cosa è deciso, come si compone, punti da risolvere rispetto a PLAN-117 rev. 5, cosa non è stato verificato).
**Aperto:** colore dell'arco per le quest; terza cornice minaccia/evento; tutti i punti di §5 dell'handoff.

## 2026-11-12 — Ruling sulle divergenze PLAN-117 rev. 5 ↔ POI battezzati

**Da:** `context/handoff-poi-zanara-production.md` §5 — sette divergenze tra PLAN-117 rev. 5 (battezzato da un'altra sessione) e le decisioni/asset della sessione POI; punti 1–5 risolti con il Director in sessione, una domanda per volta.
**A:**
1. **Famiglia = segno di forma su sagoma condivisa (ibrido).** Le cornici battezzate restano la base e non si rifanno da zero, ma ogni famiglia riceve un segno di forma proprio (numero/stile delle punte o altro segno d'oro) leggibile a 32 px in grigio. Quale segno → fork visivo sulla mappa (desiderata v35). Risolve §5.1: lo spirito di P4/OB-3c (famiglia leggibile senza colore) resta, assolto dal segno di forma invece che dalla sagoma intera.
2. **Famiglie = 2.** Solo lavoro e spedizione hanno un POI sulla mappa; l'evento-locale non ha marker: la forma «evento» di rev. 5 diventa solo glifo nella timeline Eventi (ripiego già previsto da D-9). `MapPOIType` restringe a `quest|job` (o `event` resta dichiarato ma senza marker); test e matrice sagome da 3 a 2. Risolve §5.2.
3. **Arco di scadenza = colore famiglia che vira al rosso.** Confermata la scelta battezzata: l'arancione CCW di rev. 5 (C4) è superato. Risolve §5.3.
4. **Urgenza = solo viraggio al rosso.** Niente pulsazione, niente badge, niente equivalente statico non-colore: l'ultimo tratto dell'arco antiorario vira al rosso percettivo (`#e8553a`). OB-3b (pulsazione+statico) da emendare. Risolve §5.5.
5. **Il tempo riempie il ring del componente, liscio.** Verbatim Director: *«nn c'è un canale, c'è il normale ring del componente»* — niente tacche né gioiello terminale nel countdown (C4 superato del tutto). La differenza lavoro/scadenza è nello **stato iniziale e nel verso** (verbatim: *«scadenza cambia verso ma parte da pieno e si svuota, mentre lavoro è il contrario: parte da vuoto e si riempie»*): scadenza = tempo rimasto, pieno → vuoto antiorario; lavoro = tempo trascorso, vuoto → pieno orario; a parità di percentuale gli archi sono speculari (destra vs sinistra delle 12). Il capo tondo era comunque vietato da T-02. Risolve §5.4.
**Resta aperto (§5.6–5.7):** colore dell'arco per le quest (blu su mare = caso peggiore) e soglia del viraggio al rosso (10 % invisibile a 48 px, 25 % leggibile solo da ~64 px; `urgentStartsAtRemaining: 0.25` in `arc-geometry.json` è **proposta**, non decisione). Entrambi da decidere su compositi a dimensione reale sulla mappa2 — ruling visivo, non astratto.
**Fonte:** Director in sessione 2026-11-12 (ruling su `handoff-poi-zanara-production.md`).

### 2026-11-13 — Veto: niente testo sotto i POI mappa

Il Director ha posto un veto esplicito e permanente: **mai un'etichetta
testuale sotto i marker POI sulla mappa** («niente testo sotto, mai»). La
leggibilità del marker passa solo per il materiale: sagoma, smalto, collare,
anello, icona — il nome/stato resta nell'interazione (click → scheda).

### 2026-11-14 — Ghiera DRAGHI = slot corretto (R-333); cassetto su /game (R-334)

Il Director battezza la ghiera draghi come **lo slot corretto** e ordina la
sostituzione nel cassetto alla dimensione esistente. Decisioni incorporate:

- **Composizione sandwich:** disco smaltato col drago *dietro* il medaglione
  del residente, ring di bronzo + banda *davanti* («sotto l'outer ring del
  componente»). Implementazione: layer DOM portal z-5 (integrale) + frame
  forato dentro il bezel group z-20 — meccanica stock invariata (slam 440ms,
  open pose -30°/1.18×, zero denti `toothAngles: []`).
- **Proporzione chiusura** tuned dal Director sugli slider del lab:
  ghiera ×1.15 / medaglione ×0.9 — il ring interno si chiude sul bordo del
  medaglione (castone). Fattori relativi: riusabili a qualsiasi taglia slot.
- **Medaglione:** `medaglione-battezzato-v3` firmato; in produzione è FRAME
  (foro trasparente) + ritratto reale — niente faccia dipinta nei sedili.
- **Palette:** gold ghiera ri-matchato in LAB sul gold del medaglione
  (L50 37→49, C50 28→40) — il "brunito" era solo lightness/chroma, non hue.
- **Montato in:** `HudRealCassetto` (`bezelPreset="draghi"`, `slotSize 42`,
  `scale(0.56)` — stessa dimensione del preset `b` precedente). Il preset `b`
  resta la ghiera di produzione di `/game` (R-214) fino a ruling diverso.
- **R-334 — cassetto su `/game`:** il click su un quest POI apre
  `HudRealCassetto` al posto di `QuestExpeditionDetail` tramite
  `HudRealCassettoDetail` (adapter su `QuestExpeditionDetailProps` letto dal
  nodo dentro `wrapDetail`, `game-mappa2.tsx`): la sessione
  `useQuestExpeditionSession` resta l'unica fonte — slots, estimate, items,
  canSend/send/clear reali, stage/Escape/dnd invariati.
- **R-334bis (2026-11-15) — contratto completato:** l'adapter espone bag
  pouch + stash binding (`onOpenStash`), `resourceItems`, `disabledReason`,
  `totalDays`/site-leg da `expeditionTotalDays`, banda danger i18n e
  `onOpenRoster`: il cassetto su `/game` copre il contratto R-337/R-339, non
  più solo la parte visuale.
- **R-334ter (2026-11-15) — reliquary su `/game`:** `legacyOpen` monta
  `HudRealReliquary` al posto di `LegacyReliquaryPanel` (stesso contratto:
  `legacySlotsFor(villageBuildingLevel)` + onClose). Fix asset: le label
  cotte ITEMS/BLUEPRINTS cancellate dalle capsule (smalto via clone-fill) —
  le live label restano le uniche intestazioni; sottotitolo live "LEGACY"
  rimosso (si camuffava da label sulla colonna HEROES). Il magazzino resta
  `VillageStashPanel` — è già la superficie canonica anche nella triade.

## 2026-11-15 — R-340: quattro superfici `/game` su visual firmato, dati reali invariati

- **Regola applicata:** stesso pattern di R-334 — swap del solo strato
  presentazionale dentro i mount esistenti; feed, sessioni, stage
  ownership ed Escape arbitration non toccati.
- **Portati:** `HudRealLedgerPanel` (events), `HudRealMerchantPanel`
  (merchant, BUY disabilitato per contratto), `HudRealExpeditionLost`
  (lost report su copia staged, reward path ancora stock),
  `HudRealLevelUp` (drop-in di `HeroLevelCeremony`, stessa sorgente
  `subscribeHeroLevelUp`), `HudRealMemorial` (menu MEMORIAL, dress zanara —
  `GameMenuDialog.chromeless` nuovo flag: veil/Escape/focus invariati,
  placca tolta; dress `skin` conserva il panel stock).
- **Non portati (con motivo):** skill-check — `QuestSkillCheckColumn`
  monta già il motore reale V62; roster — `HudRealRosterColumn` è
  click-only e non copre il drag-to-assign (rinviato a design rail
  compatibile DnD).
- **Verifiche:** 5 witness Playwright (merchant, ledger+invasion row,
  lost report con tomba reale, level-up con stat-gain reali, memorial
  gallery su /game), `errors:0`, tsc/build:check/lint/closure:lint verdi.

## 2026-11-15 — R-340bis: rail roster drag-to-assign verificato dal vivo; ownership per data.source, non kill-switch

- **Decisione:** le righe di `RosterStashRail` sono `useDraggable` col
  payload identico alla card di produzione + tag `source:'roster-rail'`.
  Il kill-switch `dragEnabled={!panels.visible.roster}` è stato rimosso:
  il member picker di sessione si apre SEMPRE col cassetto e copre le
  prime righe della rail — disabilitare il drag proprio allora è un
  self-goal. Ownership separata per `data.source`: l'`onDragEnd` del
  roster flottante ritorna `undefined` sui drag rail (settle senza
  commit); il monitor del rail ignora i drag delle card.
- **Bug fixati in verifica:** (1) l'`onPointerDown` custom sovrascriveva
  `listeners.onPointerDown` di dnd-kit (drag mai attivato) → concatenato;
  (2) mancava `data-resident-id` sul row → il tap-to-assign di produzione
  non trovava il `from` del flight.
- **Verificato:** 2 run Playwright consecutive — `aria-pressed` attivo,
  ghost in volo, commit reale `member-1:villager-baldassarre`, medaglia
  nel sedile, badge `ASSIGNED` sulla riga rail, `errors:0`. Tap →
  `handleResidentSelect` ritorna `true` (route produzione corretta).
- **Residuo noto (non rail):** `startTransition` della sessione a volte
  non committa `mode:'flight'`/`assignments` (anche l'hook `assignToSlot`
  ha mancato un commit in una run) — ambiente T-13 o bug sessione
  preesistente nel tap-to-assign, da investigare a parte. Il member
  picker copre le prime righe della rail (layout overlap — le righe
  scoperte draggano regolarmente).
- **Safeguard:** tsc, build:check, lint (0 err), closure:lint, unit
  r339RosterStashRail+expedition 29/29 verdi.

## 2026-11-15 — R-346: rail espansa = superficie picker del planner; niente roster flottante auto-aperto

- **Problema:** il member picker (`drag-test-container`, roster flottante
  stage-managed) si auto-apriva a ogni cassetto via `usePanelWhileOpen`
  (contratto R-184) e si posizionava a x:72 sopra la rail docked (w:320),
  coprendo le prime ~4 righe — quelle righe non ricevevano pointerdown.
- **Decisione:** gate sull'auto-open: `anyExpeditionDetailOpen &&
  !(railExpanded && view==='map' && !hudHidden)`. Con la rail montata ed
  espansa la superficie picker è lei (PLAN-119 AC4/T5 — `onOpenRoster`
  punta già alla rail). Rail assente/foldata (chip, mutex <1100px, HUD
  nascosta, altra view) → il flottante apre come prima: il picker resta
  sempre disponibile, give-back invariato.
- **Chiarito anche:** il "non-commit startTransition" di R-340bis NON è un
  bug — probe dedicata mostra `assignToSlot` che committa sempre a t+3s
  sotto SwiftShader (transition lente per design, non sospese).
- **Verificato:** Playwright — picker assente con rail espansa (topmost
  sulla prima riga = la riga stessa), picker presente con rail a chip,
  errors:0 entrambe le run. Safeguard tutti verdi.

## 2026-11-16 — Victory/reward popup: baseline battezzata = V5 pergamena Gemini-clean

**Da:** il reward path vittoria (`QuestRewardPopup`) era l'ultima superficie /game
stock senza controparte firmata; fork visivo R-348 con 4 opzioni AI (ChatGPT) +
2 fork HTML. Famiglia scelta «B pergamena».
**A:** la B patchata a mano (V4) è stata bocciata 4 volte dal Director per
texture sintetica, cuciture, tipografia — il raster 660px non reggeva il
patching. Soluzione: **rigenerazione AI del frame senza scritte** via Gemini
web (CDP, image-editing sulla B originale, +30% alto, anello→medaglione) → V5
approvata «approvato, battezza».
**Motivo:** la rigenerazione AI produce pergamena organica uniforme che nessun
compositing a mano raggiunge; ogni zona DOM si siede su affordance dipinta
(placca CTA, divisore echoes, anello medaglione). Lezione duratura: **frame
vuoto rigenerato > patching raster** — stessa tecnica da usare per le prossime
superfici firmate (QuestRunWindow, Chronicle drawer).
**Fonte:** `.mw/runs/20261116-r348-victory-ruling/visual-fork-victory-reward.md`,
`.mw/specs/hud-real/refs/REGISTERED.md`.

**Learn post-porting (R-356, 2026-11-16; osservazione, non nuovo ruling):**
la rigenerazione del frame risolve il problema dell'asset ma non basta a
chiudere il port. Il percorso riutilizzabile comprende anche il contratto
dati/azioni sulla route vera, il witness confrontato con la baseline e il
bundle. Il componente R-348 monta su `/game` con OB-1..OB-5 PASS, mentre
`closure:lint` mantiene il bundle BLOCKED (OB-6); gli stati non osservati nel
witness restano da verificare. Guida:
`context/MOCKUP-TO-PRODUCTION-PIPELINE.md`; evidenza:
`.mw/runs/20261116-r348-victory-porting/pattern-candidate.md`.

**Learn post-restyle (R-353, 2026-11-16; osservazione, non nuovo ruling):**
la guida mockup→produzione guadagna il **caso C**: quando il mockup riveste una
superficie DOM già in produzione non serve arte nuova — si riscrive il look del
componente con primitive firmate (`C1Medallion` > anello generico del mockup),
si preservano gli anchor dati (`data-wanderlust-portrait`, `data-roster-name`)
su cui misurano decoratori e drag, la geometria nuova si dirama dietro
`data-density` lasciando intatte le INV testate, e i colori del mockup che
contraddicono la semantica config NON si portano (stamina ambrata > teal AI).
**Fonte:** `context/MOCKUP-TO-PRODUCTION-PIPELINE.md` (sezione caso C),
`.mw/runs/20261116-learn-mockup-to-component/pattern-candidate.md`.

## 2026-11-17 — R-357 / PLAN-125: ruling sulle decisioni HUD D-1..D-7

**Da:** PLAN-125 (fix HUD `/game`, esclusi i POI) con 7 decisioni aperte.
**A (verbatim Director 2026-11-17, sintesi per voce):**
- **D-1 risorse:** *"abbiamo deciso di mettere le risorse al centro"* → la barra centrale resta; nel cassetto (planner) le risorse **non servono più** (supera la parte «risorse nella testata» di R-323). In alto a destra va il **componente Eventi** (PLAN-117 F5, oggi inesistente): va creato, con mockup; il cassetto aperto **lo copre** e il design lo deve prevedere.
- **Upgrade di tutti i componenti:** *"tutti i componenti vanno migliorati, upgradati, rifatto un mock? direi di sì"* → nuovi mockup per tutti i componenti HUD, inclusa la barra risorse ripensata come componente centrale.
- **D-2 clessidra sul cibo:** significa «a zero»; non deve esserci sempre; **rinviata**.
- **D-3 pulsante:** *"va bene il pulsante launch expedition"* → la placca verde del mockup è ammessa come azione primaria del cassetto. **Eccezione** al veto placca CTA del 2026-10-20 limitata a questo pulsante, non revoca generale.
- **D-4 tipografia:** provare **3 stili** e decidere dal risultato.
- **D-5 illustrazione cassetto:** **rigenerare** (non ritagliare dal mockup).
- **D-6 icone:** *"dobbiamo creare tutte le icone da capo, sia per stash che per POI, che per qualsiasi altra cosa"* → programma icone unico, trasversale (stash, POI, nav, risorse…).
- **D-7 sole:** deve **uscire** dalla barra; il componente del tempo deve essere importante.
**D-8 (stesso giorno, «1 · Sì, così»):** banda alta = **tempo a sinistra, risorse al centro, Eventi a destra**. Motivo: il cassetto copre la colonna destra, il tempo non deve mai essere coperto, e le risorse a destra avevano generato la duplicazione nel cassetto (R-323).
**Fonte:** `RICHIESTE.md` R-357; `plans/PLAN-125-hud-fix-r357.md` rev. 2.

## 2026-11-17 — R-357 / PLAN-125: battesimo cornici HUD e placca risorse (mockup Gemini v4b)
**Da:** cornici lisce a filo d'oro (produzione e mockup v3/v4); placca risorse attuale.
**A (verbatim Director):** *"Molto belle le cornici così, le battezzo, voglio quelle ma dobbiamo sistemare meglio"*; *"anche il componente delle risorse sono meglio, cambiamo anche quello"*.
- Golden reference: `.mw/specs/expedition-ui/refs/mockup-r357-cornici-aperta.png` (+ `-chiusa.png`). Vale per **grammatica delle cornici** (filo esterno oro antico, fascia champagne incisa, filo interno; angoli ad acanto con gemma a griffe; intestazioni incise con ornamento centrale; fermaglio al centro del bordo alto, niente «testa» sul Ledger) e per la **placca risorse** (icone dipinte, numeri grandi, fregio centrale sotto).
- Non vale per i contenuti: *"roster e stash hanno perso le opzioni di filtro, e quello di world ledger dovrebbe essere come quello di roster"* → i controlli dei pannelli restano quelli della produzione (Roster: filtro ▾, ordina ▾, verso, vista, riduci, chiudi; Stash: chip categoria, conteggio merci), e il World Ledger adotta la **stessa toolbar del Roster** al posto della griglia di chip.
**Fonte:** `RICHIESTE.md` R-357.

## 2026-11-17 — R-357 / PLAN-125: ruling sul giro GPT v4c e metodo «un elemento alla volta»
**Da:** mockup HUD intero come unico oggetto di giudizio.
**A (verbatim Director):** *"ha cambiato la parte che mi piaceva di quei nuovi componenti [le cornici battezzate]. I filtri nuovi sono buoni, approvati. Il Sole nuovo bocciato, il componente centrale in alto approvato. Tutti questi componenti avranno bisogno di bande per mostrare anche i componenti nascosti (altri pg, altri oggetti, altri eventi). Come procediamo? un elemento alla volta? cominciamo a fixare quello che abbiamo già scelto e approvato?"*
- **Approvati:** toolbar/filtri nuovi (`mockup-r357-hud-aperta-v4c.png`: imbuto, ordina, verso, vista, riduci, chiudi, uguale su Roster/Stash/Ledger — l'icona «ordina» va resa identica); componente centrale in alto (risorse).
- **Bocciato:** il sole nuovo (v4c, corona giorno/notte). Da rifare da solo.
- **Cornici:** restano quelle battezzate di `mockup-r357-cornici-aperta.png` (g4); GPT v4c le ha alterate, quindi v4c NON è golden per le cornici.
- **Nuovo requisito:** ogni pannello a lista (Roster, Stash, Ledger) deve prevedere una **banda di scorrimento** (scrollbar incisa) per mostrare gli elementi nascosti: altri eroi, altri oggetti, altri eventi.
- **Metodo:** un elemento alla volta, ciascuno con il proprio prompt/allegato, invece del giudizio sull'HUD intero; si parte dagli elementi già scelti.
**Fonte:** `RICHIESTE.md` R-357.

## 2026-11-17 — R-357 / PLAN-125: cassetto largo approvato come base; clic «entrambe le cose»
**Da:** cassetto estratto da `column-*-extracted.webp` (taglio sx + stiramento 4/3, icone troncate già nell'arte R-323, percorso danneggiato), con fascia risorse e senza area oggetti.
**A (verbatim Director):** *"questo era + bello, no?"* (golden v2) · *"C vuole un'area a parte x gli oggetti da portare in viaggio, e se clicchi dovrebbe aprire lo stash"* · *"deve essere agevolmente + largo e la parte a destra senza spazio vuoto o frame"* · *"entrambe le cose a seconda di dove premi"* · *"È la base"*.
- **Base:** `.mw/specs/expedition-ui/refs/mockup-r357-cassetto-largo.png` (golden del cassetto; sostituisce v2).
- **Struttura:** niente barra risorse (D-1) né «EXPEDITION CONSOLE»; vignetta + titolo vivo + descrizione; PARTY SLOTS, **SUPPLIES (nuovo)**, JOURNEY, RISK & REWARDS, LAUNCH EXPEDITION. Largo ~+25–33% (≈520 px a 1440×900), destra a filo schermo.
- **Interazione (raccomandata, accettata con «È la base»):** ghiera → Roster in modalità assegna; tasca → Stash in modalità «porta con te»; titolo del blocco con › → **Detail** come componente a parte, a sinistra del cassetto, flottante, non modale (GX-0042), uno alla volta, chiusura X/Esc. Journey senza Detail.
- **Da fare nel codice:** togliere `data-cassetto-resources`; blocco SUPPLIES; larghezza (`widthMaxPxExtracted`, oggi 613) e arte rifatta dal nuovo golden a risoluzione piena; clic sui blocchi; mockup del Detail (non fatto).
**Fonte:** `RICHIESTE.md` R-357.

## 2026-11-17 — R-358 / PLAN-126: battesimo del piano cold-boot bytes (D-2)
**Da:** PLAN-126 in stato `proposta` (artifact-r003 del dibattito MW `20261117-rpg-boot-plan`, CONVERGED 2/2 chatgpt+gemini su sha `ac06f1cf`); R-358 `in corso` in attesa di ruling.
**A (verbatim Director):** *"battezzo il plan PLAN-126, eseguilo"*.
- Piano attivo con ordine §9: Fase A misura (HAR byte budget per categoria, timing per fase su SwiftShader + GPU reale, A/B packaging con gate ≥2s riproducibile) → Fase B byte (audit WebP → pixel-diff harness → audit pixel ridondanti → re-encode solo su item `safe` con visual gate OB-4) → Fase C decode/upload solo se la misura lo conferma → Fase D spike KTX2 in parallelo dopo Fase A → Fase E piccoli guadagni opzionali.
- **D-1 resta aperta** (soglia di parità visiva per re-encode/downscale: ruling Director prima che varianti tocchino produzione) — blocca T-B4 e il deploy di qualsiasi variante di asset.
- Kill list ratificata immutata: niente lazy/deferred/streaming (mandato R-166), niente archivio binario monolitico come fix primario, niente tuning HTTP/3.
**Fonte:** `plans/PLAN-126-game-cold-boot-bytes.md`; `RICHIESTE.md` R-358.

## 2026-11-17 — PLAN-126 Fase A: la misura smentisce "byte-bound", kill evidence-based
**Da:** §0 del plan registrava "byte-bound" come fatto (stime on-disk 132+54MB); il dibattito convergeva su "byte + decode/upload".
**Misurato** (run `.mw/runs/plan126-boot-bytes/`, `T-A-findings.md`):
- Wire totale reale = **16.4MB** (HAR prod, `har-budget.json`) — il traffico on-disk ≠ traffico on-wire.
- GPU reale (ANGLE Metal M4): veil 7.2s, di cui fetch fan-out 3.9s (~55%); upload ~4ms + texSubmit 134ms.
- SwiftShader: veil 28.3s — sceneBuild 18.4s e decode wall 24s dominano.
- A/B packaging (stessi byte, 344 file vs 12 bundle): delta 984ms < gate 2s → **no-adopt**.
**Decisioni derivate dall'evidenza:**
- Fase C upload (T-C3) **killata** — upload non è il collo su nessuno dei due env.
- Packaging/bundling **killato** sotto il gate ≥2s riproducibile.
- Il collo residuo è decode/scheduling (SwiftShader) e request fan-out + CDN tail (GPU): la leva byte (Fase B) resta utile sul piano decode ma non basta da sola a spiegare i ~122s prod — attesa forte componente di varianza CDN/env del probe.
**Fonte:** `.mw/runs/plan126-boot-bytes/T-A-findings.md`, `har-budget.json`, `timing-*.json`, `ab-packaging.json`.

## 2026-11-17 — R-357 / PLAN-125: cassetto /game approvato per palette (ghiere, cornice nord, elementi dipinti)
**Da:** cassetto montato con oro più arancio/scuro della nav, ghiere bronzo, cornice nord a filo, aloni su teschio/forziere.
**A (verbatim Director):** *«approvo»* dopo l'allineamento slot↔frame (ghiere 41°/53%/64% vs frame 42°/56%/71%, misurato live /game 1440×900).
- Riferimento palette = nav in basso al centro (oro 45°/49%/79%, verde (10,67,42)); helper `scripts/lib_grade_gold.py`; asset in `public/assets/ui/hud-real/cassetto3/` + `ghiera-glifo*.webp` (preset `draghiGlifo`; drago archiviato in `ghiera-draghi.webp`/preset `draghi`).
- `cost` non esiste nel cassetto (idea in `.mw/specs/expedition-ui/ideas.md#cost-preview`); niente barra risorse (D-1).
- **Non coperto dall'approvazione:** Detail, Roster «assegna»/Stash «porta con te», animazione laterale, variante ≤1100 px e 1280, commit, `sync:bug`/`redfirst`/contratto `hud-real-cassetto`.
**Fonte:** `RICHIESTE.md` R-357.

## 2026-11-17 — R-358 / PLAN-126: ruling D-1 — parità visiva approvata, T-B4 sbloccato
**Da:** D-1 aperta dal battesimo; pipeline che baka `game-grade-*` lossless per scelta (matematica affine) e canopy v2hi a q95.
**Metodo (OB-4):** pixel-diff `asset-pixel-diff.py` (soglia RGB=8) su varianti q75/q80/q85 + **live in-game** prima/dopo via request interception (Metal GPU, 3200×2000@2x, nessuna modifica a public/ durante il test) — `.mw/runs/plan126-boot-bytes/d1-live/`.
**A (verbatim Director):** *"approvo"* (dopo «testiamo» e «devo vedere il risultato dal vivo»).
**Approvato:**
- `game-grade-mult.webp` + `game-grade-add.webp`: lossless → **q85** (leva maggiore, ~3.5MB → ~0.48MB).
- Tutti i 40 `*.canopy.v2hi.webp`: q95 → **q85** (diff live indistinguibili a zoom 2.0).
- `assets/ui/bg.webp`: → **q75** (worst case testato live, indistinguibile sotto overlay).
- Nessun downscale; T-B3 confermava i sorgenti prevalentemente sottocampionati (maxZoom=3, DPR2).
**Fonte:** `d1-live/` compositi, `d1-variants/report/` pixel-diff, `director-signoff.json` nel run dir.

## 2026-11-18 — Modello subagent: niente pin hardcoded, inherit-parent via `subagent_general`
**Da:** errore `ResourceExhausted: weekly usage quota has been exhausted` durante fan-out subagent; in parallelo il log mostrava `agent.subagent_model=swe-1-6-fast did not resolve to an available, allowed model`.
**Verificato:** cache catalogo `~/.cache/devin/cli/model_configs_v7` — `swe-1-6-fast` rimosso dal catalogo; unico flag "free" = sidekick SWE-2 Medium nei modelli Fusion. La quota settimanale copre tutti i modelli: a quota esaurita fallisce qualunque chiamata.
**Decisione Director:** i subagent non devono puntare a un modello hardcoded — "quello gratuito o quello che stiamo usando". Rimosso `model:` dai 6 profili (`~/.config/devin/agents/*`, `.devin/agents/rpg-*`) e `agent.subagent_model` da `~/.config/devin/config.json`; i custom ora vanno al router di default (si auto-adatta al catalogo). `subagent_general` resta l'unico profilo che eredita il modello del parent → profilo preferito quando il subagent deve girare sul modello in uso. Aggiornate `.windsurf/rules/55-delegation-context-budget.md` e `~/.devin/rules/delegation-context-budget.md`.
**Fonte:** log `devin_20261118-083841_5267.log`, `devin doctor` (6 profili OK dopo fix).

## 2026-11-18 — R-357 / PLAN-125: pulsante LAUNCH EXPEDITION del cassetto approvato (forma e metodo)
**Da:** pulsante ritagliato dal golden (punte tagliate, rettangolo scuro, «un colore con una scritta sopra»), poi due rigenerazioni Gemini che peggioravano a ogni giro.
**A (verbatim Director):** *«questo era il lato pulito, sa di AI slop, quindi deve essere prima fixato, poi usato per fare anche la parte a sinistra che stai peggiorando ad ogni iterazione»* → *«Sì, è giusta»* (forma).
- **Metodo duraturo:** per i pezzi simmetrici si usa **solo il lato pulito del golden**, ripulito e **specchiato**; niente rigenerazione web-AI iterata (ogni giro diverge). Implementato in `scripts/build-cassetto3-assets.py` (inpaint scritta → asse → metà destra → 2× + denoise + unsharp → specchio → chiave del fondo).
- **Asset:** `public/assets/ui/hud-real/cassetto3/cta-plaque.webp` (1500×317, trasparente); guardia `r357CassettoFrame.test.ts` (`// INV:cassetto-cta-tips-intact`). Le versioni Gemini sono archiviate in `.mw/runs/20261118-cta-button-gemini/`, non usate.
- **Non coperto:** nitidezza (limite del golden 1024 px: asset a piena risoluzione o ridisegno vettoriale dalle estremità, a carico del Director/futuro), filetti agli angoli alti, commit.
**Fonte:** `RICHIESTE.md` R-357.
## 2026-11-19 — R-361 / PLAN-128: due ori nella HUD, canonico solo quello della Nav
**Da:** misura per materiale (`scripts/hud-real/material_palette.py`, `test-results/slicekit/material-palette-nav.{json,png}`): sulla stessa schermata convivono l'*oro filetto* (Nav, barre Risorse/Tempo; ΔE00 mediana vs Nav 2–5) e l'*oro filigrana champagne* (cornici Roster/Stash, cassetto, fascia sotto Risorse; ΔE00 9–24, più chiaro e con ombre meno profonde), confermati a occhio a 3×.
**Decisione Director (verbatim):** *«Due ruoli e x dare un po' di varietà, solo gold penso sarebbe opprimente. ma solo quello della nav è canonico, gli altri "ci sto lavorando su".»*
- **Riferimento canonico:** l'oro della Nav (e il resto dei suoi materiali) è il riferimento in `context/mockup-pipeline-profile.md` [P3].
- **Secondo oro:** il ruolo "filigrana" è voluto, ma la sua resa attuale **non** è un riferimento: è lavoro in corso; non si tara nessuna fascia su di essa.
- **Non coperto:** come si definisce il secondo oro rispetto al canonico (stessa luce? stessa scala d'ornamento?) — aperto.
**Fonte:** sessione Claude Code 2026-11-19.
## 2026-11-19 — R-361 / PLAN-128: cornice pannelli rigenerata — gemme e interno sui materiali Nav
**Da:** cornice panel-frame5 rigenerata con Gemini (`.mw/runs/20261119-panel-frame5-regen/`, candidato nuovo golden, non ancora battezzato) montata su `/game`.
**Decisione Director (verbatim):** *«il gold m sembra diverso, ma nn abbastanza diverso da sembrare voluto, gemme nav va bene, anche l'interno direi che deve essere il verde "canonico"»*
- **Secondo oro:** deve differire dall'oro Nav in modo **evidente e voluto** (una differenza piccola sembra un errore). In prova: champagne (legge come argento antico) e bronzo (legge come rame), entrambi a ΔE00 8–9 dalla Nav con le stesse ombre profonde.
- **Gemme:** colore delle gemme della Nav (`material-palette-nav.json`, materiale «gemma»).
- **Interno dei pannelli:** smalto smeraldo della Nav al posto della lacca petrolio. Oggi nessun token lo esprime (profilo [P3]): in prova i token `--skin-hud-lacquer-*` ridefiniti solo dentro Roster/Stash.
- **Metallo (Director, verbatim «Bronzo»):** il secondo oro delle cornici è il **bronzo** (`gen/frame-g1-bronzo.png`).
- **Non coperto:** gli spicchi d'angolo (`backings` del manifest, colore fisso `#0f1b1f`) restano petrolio; battesimo della cornice.
## 2026-11-19 — R-361 / PLAN-128: Roster e Stash — interno smeraldo, X sulla fascia, niente versioni ridotte
**Da:** il Director ha approvato gli angoli della cornice bronzo («Sì, avanti») e ha chiesto di proseguire con la lista: interno nel verde canonico, X non «sotto il frame», niente versione ridotta, e rifare pulsanti/filtri.
**Decisioni (verbatim del Director dove citato):** *«niente versioni ridotte x quei 2, va bene in quella barra»* (Roster e Stash si aprono dai pulsanti della barra in basso) · *«anche l'interno direi che deve essere il verde "canonico"»*.
- **Interno:** nuovi token `--skin-hud-enamel-{lift,base,deep}` = smalto della Nav (`#00462f` / `#063427` / `#091d15`, misurati da `nav/bar.webp`), letti da `HudPlaque tone="enamel"` per Roster e Stash; riempimento card e «cuneo» d'angolo seguono lo smalto. I riquadri scuri (oggetti, pulsanti tondi, chip livello) restano lacca petrolio: sono i «pozzetti», come nella Nav.
- **X:** il pulsante di chiusura sta sulla fascia alta, a destra, 22 px (`data-panel-close`); tolti «riduci/ripristina» dallo Stash (stato, strip, test R-246) e «Hide roster» dal Roster.
- **Test:** `villageStash.test.tsx` aggiornato (un solo pulsante, nessuna modalità ridotta); il vecchio test «minimises to a title strip» è sostituito.
- **Non coperto:** pulsanti tondi e filtri (da rifare), pulsanti Roster/Stash nella barra in basso, scelta gemme tonde vs diamanti Nav, battesimo della cornice.
**Fonte:** sessione Claude Code 2026-11-19; `.mw/runs/20261119-panel-frame5-regen/`.
## 2026-11-19 — R-361 / PLAN-128: controlli HUD — golden `controls-sheet-g2` approvato e montato su Roster/Stash
**Da:** il Director ha chiesto di rifare i pulsanti, i filtri e i componenti dei filtri di Roster e Stash e di far generare i nuovi controlli a GPT.
**Decisione Director (verbatim):** *«Sì, invia»* (brief) · *«Sì, giro 2»* · *«Sì, approvo»* → il foglio del giro 2 (`.mw/specs/expedition-ui/refs/controls-sheet-g2.png`) è il **golden dei controlli** (registrato in `REGISTERED.md`).
- **Cosa c'è nel golden:** 4 tipi × 5 stati (tondo, ovale, pillola-filtro, selettore; normale/hover/premuto/selezionato/disabilitato); anello d'oro Nav, pozzetto petrolio vuoto, alone smeraldo solo sul selezionato; senza testo/icone/gemme.
- **Montaggio:** `slicekit/controls` (20 pezzi, ~105 KB): tondo = 1 pezzo per stato; pillola = capo sx + capo dx + striscia centrale ripetibile per stato. Le toolbar `data-hud-oval` (Roster, X) usano il tondo; le linguette dello Stash usano `data-ctl="pill"`. Gli aloni hover/selezionato sono `box-shadow` con token (`--skin-hud-gem` nuovo), non raster.
- **Non coperto:** ovale e selettore (nel golden, non tagliati: «minimo asset»); i selettori dell'intestazione del Roster (restano nel look vecchio finché non si taglia la riga «selettore»); stati hover/premuto/selezionato non ancora visti in cattura reale; V2/V3 e corsia Tauri; icone nuove (piano a parte).
**Fonte:** sessione Claude Code 2026-11-19; `test-results/slicekit/controls.json`, `.mw/runs/20261119-hud-controls-gpt/`.
## 2026-11-19 — R-361 / PLAN-128: anelli meno arancio, Stash come Roster, niente contatori X/Y
**Decisione Director (verbatim):** *«troppo arancio quei ring, stash voglio che sia come roster, possibilmente. nn mettiamo X/Y, nn credo servira mai»*.
- **Anelli:** ricolorati sulla tinta/croma dell'oro Nav (misura: 64–75°/63–75 → 78–84°/38–47); il golden registrato resta l'originale ChatGPT, la deviazione è nel derivato `controls-sheet-g2-keyed.png` (script `prep_controls_keyed.py`) e nel record.
- **Stash come Roster:** intestazione = titolo a sinistra + toolbar di pulsanti tondi a destra; il filtro per tipo diventa pulsanti tondi solo-icona (stessi `role=radio`/testid; etichetta in `aria-label`/`title`) e la X chiude. Via la riga delle linguette.
- **Contatori:** tolti «6/6» (Roster V2), «6 of 24 goods» (intestazione Stash) e «6 of 24 goods in store» (piè Stash). Interpretazione: «X/Y» = i contatori, non il pulsante X di chiusura (che deve restare). La capacità resta nel view-model, solo non disegnata.
- **Precarico:** `preloadControlsArt()` — gli stati hover/premuto/selezionato/disabilitato sono immagini CSS scaricate al primo uso.
- **Test:** `villageStash.test.tsx` aggiornato (niente contatori, filtro e X nella riga del titolo).
## 2026-11-19 — R-361 / PLAN-128: testi e spaziature dello Stash allineati al Roster
**Decisione Director (verbatim):** *«si, allinea anche il testo di Stash a quello del roster, diamo una spaziatura corretta, ecc»* (dopo la conferma di «X/Y» = contatori e del filtro tondo).
- **Misurato (stili calcolati, stessa cattura):** titolo Roster 600 12px Cinzel, spaziatura 2,4px, avorio `--skin-body-color`; Stash aveva 700 13px oro. Margine interno Roster 22px (`plaque-clearance` 12 + `panel-padding` 10); Stash 10px (titolo a 44px per sfuggire al nodo d'angolo).
- **Fatto:** Stash usa gli stessi token — titolo (`--skin-hud-title-*`, `--skin-body-color`), margine interno `calc(plaque-clearance + panel-padding)`, riga d'intestazione senza padding proprio; nome dell'oggetto nel dettaglio = stile dei nomi del Roster (`StashItemTooltipBody tone="panel"`, i suggerimenti restano com'erano); griglia a tessere minimo 46px (ne entrano 6 nei 356px). Verifica: riga d'intestazione e bordo destro dei controlli identici ai due pannelli (x 534, larghezza 356, bordo 378).
- **Non toccato:** le righe di descrizione (EB Garamond 12px, il Roster non ha testo corrente da confrontare); il vuoto verticale dello Stash (modifica non in staging di un'altra sessione).
## 2026-11-19 — R-361 / PLAN-128: Roster e Stash a sinistra, Stash corto, contenuto adattabile
**Decisione Director (verbatim):** *«nn li voglio vedere centrali, stash fallo + "corto" meno alto, e i componenti dentro stash, nn so, li facciamo adattabili alla pagina? fallo circa delle stesse dimensioni del roster»*.
- **Causa del «centrale»:** `zoneRects` del solver centra la banda delle tre zone con margini simmetrici; con solo la zona sinistra occupata (centro e destra a larghezza 0) il Roster/Stash finiva al centro dello schermo. Fix: una zona sinistra **sola** si appoggia al bordo sinistro (`edgePx`); con un'altra zona occupata i margini restano simmetrici come prima. Test: `stageZonesSolver.test.ts` (3 nuovi).
- **Stash corto:** nella coppia Roster+Stash lo Stash prendeva tutto il resto della colonna (400 px a 1440×900). Ora `min(resto, naturalHeightPx)` con `villageStash.naturalHeightPx` 360 → **300** (= Roster). Il contenuto si adatta: la griglia è `auto-fill` (a 1280 va su 2 righe × 3).
- **INCIDENTE T-13 (stato condiviso):** durante questo lavoro 4 miei file sul Roster denso (`WanderlustRosterCardV2.tsx`, `HeroLevelDecor.tsx`, `WanderlustStatBar.tsx`, il passo 46 in `DragTestContainerV2.tsx`) sono tornati alla versione precedente (riscrittura da un'altra sessione sugli stessi file — nel working tree c'erano anche suoi cambi, es. soglia 11px in `WanderlustStatBar`); le altre mie modifiche erano intatte. Riapplicate e verificate con un marcatore per file, prima e dopo la cattura. Causa esatta non accertata.
- **Non coperto:** a 1280 px (zona 260 px) la barra del Roster mostra meno controlli del solito (non indagato); barra di scorrimento dipinta; contorno/stati della card; riferimento «originale» del Roster.
## 2026-11-19 — R-361 / PLAN-128: cornice dei pannelli più sottile
**Decisione Director (verbatim):** *«cornice + sottile»* (dopo il confronto con e senza cornice sulla HUD vera).
- **Fatto:** `thinFrameManifest(panelFrame6Frame, 0.6)` (in `sliceKitManifest.ts`) riduce della stessa proporzione dimensioni, scostamenti, span e fascia di tutti i pezzi; l'arte e la specifica restano invariate. Roster e Stash la usano.
- **Verificato:** cattura a 1440×900 della HUD vera; angolo alto-sinistra ingrandito, nodo con gemma in posizione, bordo più leggero.
- **Non verificato:** a 1280 px e 1920 px con la cornice sottile; hover e stati; Tauri.
## 2026-11-19 — R-361 / PLAN-128: cornice sottile anche sopra, meno vuoto nei pannelli
**Decisione Director (verbatim):** *«cornice sottile anche "sopra", riadatta gli spazi (meno spazio vuoto)»*.
- **Fascia superiore:** scala propria 0,4 (era 0,6): banda da 18 a 12 px; angoli alti spostati in proporzione (`thinFrameManifest(m, 0.6, 0.4)`).
- **Spazio sopra il titolo:** da 28 a 12 px nei due pannelli (token nuovo `--skin-hud-frame-top` = 6 px, usato da Roster e Stash).
- **Stash:** altezza naturale 300 → 260 px (sotto il Roster); il dettaglio resta visibile per intero a 1440×900.
- **Barra in alto:** non toccata. È già la variante sottile (`resources/bar-slim`, 58 px); ridurla ancora vuol dire ritagliare o ridipingere il pezzo, non ridurre la scala (il testo andrebbe sotto il minimo di 11 px).
## 2026-11-19 — R-361 / PLAN-128: errori agli angoli alti della cornice sottile (corretti)
**Decisione Director (verbatim):** *«questi sn gli errori della barra che vanno fixati, nn toccare il componente delle risorse»* (due ritagli degli angoli alti). «Barra» = la fascia alta della cornice dei pannelli; la barra risorse NON è stata toccata (il brief GPT per ridipingerla non è stato inviato).
- **Correzione di quanto avevo fatto:** la scala separata della fascia alta (0,4) era sbagliata per questa arte: il ritaglio dell'angolo contiene un tratto di fascia a altezza piena. Ora una sola scala uniforme 0,5 per tutta la cornice (fascia ~15 px, montanti ~9 px).
- **Altro:** sfumatura dell'angolo verso la fascia 16→44; minimo di luminosità (L≥13) per le ombre dentro gli angoli (la curva C-1b le rendeva nere); montanti laterali accorciati (span 30→24) per non sporgere sopra la fascia.
- **Non fatto:** ridipingere le barre in alto (da riformulare con entrambe le barre, vedi richiesta separata).
## 2026-11-19 — R-361 / PLAN-128: angoli della cornice sottile — posizione dei gioielli, ali sul verde, forziere tolto
**Decisione Director (verbatim):** *«cn sn ancora gli angoli sotto che sporgono sul verde, e i componenti degli angoli sul frame ora sono dentro il frame... inoltre elimina il simbolo dello stash dalla cornice»* e *«anche la parte del gioiello deve essere nel posto giusto»*.
- **Bug mio:** l'offset verticale degli angoli alti era scalato due volte → gioielli 8,4 px dentro il frame (da quando esiste la cornice sottile). Corretto; misurato dal DOM: i 4 angoli coincidono con il golden entro 0,1 px.
- **Ali sul verde:** tagliate (cutouts nella spec); cuneo d'angolo non più scalato (l'arco del pannello è fisso a 18 px).
- **Forziere:** tolto dalla cornice dello Stash (pezzo, asset, variante, test 5→4 immagini).
- **Non verificato:** a 1280/1920; in Tauri.
## 2026-11-19 — PASS strutturale ≠ fedeltà al golden (learn, bocciatura Director)
**Da:** probe V2 FAIL→PASS + metriche DOM presentati come «4/4 fix chiusi e verificati».
**A:** su superfici con golden, nessuno stato si dichiara senza pair golden-vs-live nel bundle + divergenze classificate; il report nomina il pass soddisfatto (V2 contratto ≠ Pass 1 fedeltà ≠ Pass 3 harmony).
**Motivo:** Director: «hai fato un lavoro pessimo, non vedi quanto sono diverse le cose che hai fatto rispetto all'originale» — reliquary/stash/roster restano scheletri vs la grammatica del golden nonostante i fix meccanici verdi. Seconda istanza del pattern (prima: slicer byte-identico su componente sorgente sbagliato).
**Fonte:** `.mw/runs/20261119-learn-golden-fidelity/pattern-candidate.md`; proposta P-013 (trappola candidata T-30).
## 2026-11-19 — PLAN-128: slicewright adottato come gate di affettabilità pre-slice
**Decisione Director (verbatim):** *«procedi»* (dopo prior-art research e prova reale sul golden).
- **Adozione:** `npx -y slicewright inspect` diventa il gate di affettabilità in Fase A (nuovo Passo 1ter in `SLICEKIT.md`): misura span stirabili, smearing, bordi ripetuti, cuciture e padding-contenuto **prima** del taglio.
- **Prova sul golden reale:** sul candidato bronzo `candidate-cornici-bronzo-r1.png` rileva span stirabili di 1 px per asse (`stretch.x/y.short`, `insets.large`) — la stessa diagnosi della causa dei ~6 respingimenti sugli angoli, prodotta in secondi. Rimedi prescritti = quelli convergenti col Director (inset autoriali / bordi più puliti).
- **Prior art:** nessun tool copre ≥60% del metodo (registro T0–T3 e giudizio su candidati montati restano differenziatori); top-5 tecniche assorbibili in `.mw/runs/plan128-review-2026-11-19/PRIOR-ART.md`.
- **Non verificato:** slicewright non eseguito su `--insets`/spec esistente né integrato in `closure:lint`; capabilities degli altri tool da README.
**Fonte:** sessione Devin 2026-11-19; prove in `.mw/runs/plan128-review-2026-11-19/` (preview `slicewright-preview-bronzo.png`).
## 2026-11-20 — Fork visivi: tutti i mock prodotti vanno mostrati, nessuna pre-selezione
**Decisione Director (verbatim):** *«la regola dice falli tutti e mostrami i mock tra cui scegliere. se nn c'è scritto esplicitamente deve essere aggiunto a queste strategie»*.
- **Regola registrata:** ogni candidato generato/costruito per una decisione estetica è mostrato al Director come mock nel contesto d'uso — l'agente non pre-filtra. Il cap «opzioni default 2, max 3» di PLAN-047/v35 vale per la fork card, non per il numero di mock presentati.
- **Dove:** aggiunto a `context/mockup-pipeline-profile.md` [P7] (primo bullet).
- **Contesto:** ruling sulla fork card banda di scorrimento (`.mw/runs/20261120-scroll-band/visual-fork-scroll-band.md`, PLAN-125 Fase 7a / PLAN-127 N=3 #1) — i 3 candidati A/B/C erano già tutti mostrati.
**Fonte:** sessione Devin 2026-11-20.
## 2026-11-20 — Banda di scorrimento condivisa: ruling «Oro inciso» (B)
**Decisione Director (verbatim):** *«Oro inciso»* — dopo richiesta *«mostramele insieme a tutto il resto del componente»* (mock montati sul roster vero di /game).
- **Golden:** `.mw/specs/expedition-ui/refs/scroll-band-oro-inciso.png` (sha256 `99098b02…`, riga in REGISTERED.md). Baseline congelata `R-2026-11-20-scroll-band-B`.
- **Design:** pozzetto inciso scuro + thumb ottone champagne con tacche incise + perni ai capi; condivisa Roster/Stash/Ledger (PLAN-125 Fase 7a, PLAN-127 N=3 #1).
- **Note di processo:** bug 2a roster fixato (`data-hud-scroll` sulla lista); scrollbar dipinta non catturabile in headless-macOS (overlay scrollbars non si dipingono — limite ambiente, verifica su macchina Director).
- **Residuo implementazione:** primitivo condiviso + mount Roster/Stash; ricevuta slice-kit `test-results/slicekit/scroll-band.json`.
## 2026-11-20 — Banda di scorrimento: ruling finale «A — smalto» sul componente reale
**Decisione Director (verbatim):** *«A — smalto, la sfumatura nn so quanto sia corretta»* — scelta fatta sulle catture full-component (`.mw/runs/20261120-verify-frame7/full-{a,b,c}.png`, 1440×900 `?frame=thin&band=`).
- **Effetto:** `hudScrollBandConfig.variant = 'a'` (default live); `?band=b|c` restano selezionabili in dev. Il thumb usa la stessa smalto teal della placca CTA (`--skin-cta-bg` `#2c7683→#113743`) — risposta al dubbio sulla sfumatura: è il materiale canonico CTA; se preferisce lo smeraldo degli anelli è un cambio di un gradiente.
- **Supera:** il ruling precedente «Oro inciso» (B) registrato poco sopra — golden B resta congelato come baseline registrata (REG-registered), non cancellato.
## 2026-11-20 — Pannelli stage: drag libero ovunque, senza snap né resize
**Decisione Director (verbatim):** *«nn voglio questa distinzione secca d dove è una cosa in base a dov'è. tutti si può spostare ovunque senza snap, senza cambiare di dimensioni, ecc»*.
- **Contratto nuovo:** il DROP committa il rect libero visto dal drag (posizione + dimensioni congelate in `placements{id:{x,y,w,h}}`); occupancy/zona non si trasferisce mai; il pannello resta della sua zona d'origine e fluttua clampato all'envelope di stage. Eccezione mantenuta: drop sul chrome strip (rail ali / tab row) → collassa a strip; strip trascinata sullo stage → ri-espande al punto. Doppio click = reset al dock.
- **Pair roster+stash:** lo stack verticale nell'ala sinistra vale solo se NESSUNO dei due ha placement — chi è piazzato libero esce dallo stack, l'altro prende l'ala intera.
- **Roster:** `widthMode: 'natural'` (bloccato ~400px, ruling precedente stesso messaggio) — il caso ~932px sparisce perché non esiste più cross-zone transfer.
- **Test:** `stageZonesSolver.test.ts` sezione §D.1 riscritta sul nuovo contratto (23 test verdi).
## D-20261120-piastrina — Icone su piastrina: A = cornice hover (R-367, D-6)
Il Director battezza il trattamento **A** (filetto ottone champagne + angoli
acanto incisi) come firma della cornice-piastrina. La cornice è **stato
hover/selected**, non chrome a riposo: a riposo la cella resta pozzetto lacca +
icona dipinta (come `mockup-stash-grid.jpg`). Shelf stash a **2 righe** fisse.
Nessun gap tra cornice e cella. Forziere header: assente nel frame7 live (era
solo `emblem-chest` dei manifest frame5, non più montati).
## 2026-11-21 — Pannelli Roster/Stash: consolidamento + fix controlli + shelf 3×2
Stato congelato dal vivo (no query param, 1440×900 + 1280×720):
- **Placca `field`**: campo smalto a filo cornice su Roster e Stash — il secondo rettangolo stondato (cartouche `shape="panel"`) e i 4 crescent `geometry.backings` di frame7 (spicchi scuri agli angoli) sono rimossi; spec `panel-frame7.json` risliced, audit verde.
- **Banda A «gemma»**: thumb `#2ea377→#14705a→#0a3f30` (smeraldo delle gemme frame7, ruling Director «approvo gemma» — supera il teal CTA annotato sopra). Visibile solo con overflow reale (`scrollHeight - clientHeight > 1`): verificato Roster=visibile / Stash=nascosta.
- **Fix controlli header (regressioni):** `RosterSortIcon` migrato a `data-ctl="round"` + `EngravedIcon cmd-sort` (era il disco vetroso legacy); `::before` speculare e `box-shadow` dei bottoni generici skin spenti sui controlli dipinti (`[data-ctl]`); `round-disabled` ripristinato nel blocco `[data-hud-controls]` (il base override lo mascherava).
- **Shelf Stash 3×2 (D-20261120-piastrina implementata):** `panel.shelfColumns=3`, `shelfVisibleRows=2`, `shelfRowPx=46` in `villageStashConfig`; `naturalHeightPx` 340→400 (gameFrameConfig); `detailMinPanelHeightPx` 240→360 così la detail card convive con la griglia senza clip (a 1280 resta nascosta: griglia protagonista).
**Fonte:** sessione Devin 2026-11-21.
## 2026-11-20 — Victory/Reward (PLAN-125 7d): fork risolto «A — pergamena», banda condivisa montata
**Da:** Fase 7d chiedeva «palette Nav + cornice nuova + banda condivisa» sul report di fine
run; tre trattamenti candidati catturati live su `/game` da run reale
(`.mw/runs/20261120-victory-fork/`): A pergamena firmata, B pergamena dentro la cornice
condivisa, C report in lingua pannelli (campo smalto + cornice + pezzi rimontati).
**A:** shipping = **A — pergamena battezzata** (INV-1 invariato, nessun amend); il fork
resta dev-gated su `?victory=framed|panel` (+ swap `?frame=` come i pannelli) per
iterazioni future — non genera mockup. La **banda condivisa** `HudScrollBand` è montata
sulle 3 zone scroll (crew/rewards/echoes) anche sullo shipping: stessa banda dei pannelli,
variante **`a` smalto/gemma** confermata (succede alla B «oro inciso», che resta il golden
registrato). Record conversione `test-results/slicekit/victory.json`; INV-6 permanente.
**Fonte:** ruling Director 2026-11-20 (fork question in sessione).

## 2026-11-20 — Quarantena dei file rotti del merge backup → main
**Da:** merge `backup/main-pre-rebase-2026-11-20` in `main` (commit `00cd031d2`). Dodici file avevano
errori di sintassi già presenti su `origin/main` e nel backup, identici in tutte le copie sul disco.
Il type-check si fermava a questi errori, quindi nessun controllo di tipo copriva il resto del progetto.
**Decisione (Director):** cancellare e quarantenare, scelta «quarantena + documentazione + verifica».
Spostati 81 file fuori da `src/`, `tests/`, `scripts/` in `quarantine/2026-11-20-merge-broken/`
(elenco e istruzioni di ripristino in `quarantine/2026-11-20-merge-broken/README.md`). Include i 12
file rotti e le dipendenze dirette e indirette: profiler delle mappe, monitor multi-villaggio,
sandbox/MapPage e relativi test.
**Verifica:** `vite build` passa. Il type-check non ha più errori di sintassi, ma restano circa 3.900
errori di tipo in 641 file, debito già presente e ora visibile. Nessun commit o push ancora.
**Da fare:** decidere se ripristinare i file (`git mv` inverso) o cancellarli definitivamente.

## 2026-11-21 — Cassetto: componenti rigenerati da Gemini + bordo vero dell'originale (R-357 / PLAN-125)
**Da:** Director — pulsante «con un'immagine sopra messa male, pulsante mezzo cancellato dietro, riga sotto, pezzo verde in basso a sinistra»;
«il mockup è molto più bello: sfondo verde elaborato, componenti interni più curati. Perché non lo abbiamo ottenuto?»
**Causa:** il fondo era un collage di ritagli dalla stessa immagine 1024 px già composta (pulsante con i vicini, barra alta capovolta come bordo
basso, ornamento sinistro corto) e lo sfondo un gradiente CSS molto più chiaro del mockup (mediana (12,84,57) contro (1,32–58,24–31)).
**Fatto:** (1) pulsante rigenerato da Gemini da solo su magenta, senza scritta, scontornato e graduato oro-nav → `cta-plaque.webp` (PLAQUE_H 381);
(2) sfondo marmo smeraldo generato da Gemini → `ground.webp` (colore coincide con il mockup); (3) cornice dei riquadri generata da Gemini →
`box-frame.webp` usata come `border-image` su `wellStyle` (4 riquadri); (4) bordo in basso = fascia vera del mockup → `frame-bottom.webp`
sopra una striscia scura, parte dal bordo sinistro dello sfondo (niente pezzo verde). Prompt, riferimenti e catture:
`.mw/runs/20261121-cassetto-components/`. La build legacy del pulsante resta dietro `REBUILD_LEGACY_CTA=1`.
**Nota di metodo:** i componenti si generano uno per giro su fondo piatto e ad alta risoluzione, poi si compongono; la verifica è il confronto
affiancato col mockup, non solo i test (T-30). Deroga a `brushwork-1` (HUD pulita): sul cassetto lo sfondo è ora dipinto per ruling Director 2026-11-21.
**Fonte:** ruling Director 2026-11-21 (sessione).
**Aggiunta (stesso giorno):** (5) nicchie provviste rigenerate da Gemini, seconda passata con cornice d'oro spessa (la prima aveva una linea troppo sottile, spariva a
85 px) → `niche.webp` come `border-image`; generati ma NON montati: anello dei posti (`.mw/runs/20261121-cassetto-components/out/seat-keyed.png`, la ghiera a draghi
è condivisa con altre superfici, serve decisione) e barra del viaggio (`journey-keyed.png`, non permette il segmento acceso).
**Aggiunta (stesso giorno, «sistema tutto» + «aggiungili a hud-lab»):** (6) fascia sinistra: la piastrella `rail-mid` da 160 u si ripeteva ogni 160 u con una giuntura
visibile → `rail-mid-long.webp` = le 800 px di fascia vera e continua del mockup piegate avanti/indietro/avanti fino a 1072 u (entrambe le estremità combaciano con gli
ornamenti, nessuna giuntura); `rail-mid.webp` resta (serve a `plugins/cassetto.py` per la sezione d'oro). (7) **Pezzi riutilizzabili** raccolti in
`src/ui/idleVillage/skins/primitives/paintedPieces.ts` (ricette `paintedGround`, `paintedBoxFrame`, `paintedNiche`, `PAINTED_PIECES`, `PLAQUE_ASPECT`), usati dal cassetto e
dal lab: un componente futuro li indossa spargendo la ricetta, senza copiare CSS. (8) **hud-lab (PLAN-129):** nuove card `candidato` in `catalog.ts` — `ground-marmo`,
`box-frame-oro`, `niche-oro`, `rim-oro`, `seat-ring` — e `cta-confirm` aggiornata alla placca rigenerata (host in `hosts.tsx`, registro in `hostRegistry.ts`). Stato
`candidato` e non `battezzato`: ruling estetico sul risultato non ancora dato. L'anello dei posti è generato e in catalogo ma NON sostituisce la ghiera a draghi su `/game`
(ruling Director). Barra del viaggio generata ma scartata (linea mediana, nessun segmento acceso). `hud-real/cassetto3/` contiene gli asset vecchi (superati).
**Aggiunta (2026-11-21, cassetto → HUD):** confronto sulla stessa cattura: barre in alto e nav sono più finite del cassetto; il cassetto si adegua alla HUD (non il contrario). Barra orizzontale `HudScrollBandX` al posto delle frecce dei posti (Director: «non voglio pulsanti … ma la barra come hanno già roster e stash»); oro misurato e ri-graduato; CTA con smalto/metallo separati; viaggio e nicchie nel linguaggio HUD. Dettagli e misure in `RICHIESTE.md` (voce «Cassetto → linguaggio HUD»). `HudScrollBand` verticale (contrattata) non è stata toccata.
**Aggiunta (2026-11-21, «Vignette + title»):** testa del cassetto riportata verso il mockup. Vignetta: filtro `brightness(1.55) contrast(1.06) saturate(1.15)` + alone di luce e dissolvenza in basso, altezza 228→246 u (luma ~58→69 contro ~92 del mockup: le copertine di quest sono foreste scure, oltre non va senza lavare il colore). La cornice d'ottone spessa resta: ruling 2026-11-20 «2 · Cornice più marcata» (il mockup invece non ha cornice, il dipinto sfuma: scelta da riconfermare). Titolo: oro HUD (inchiostro «Day 1» misurato (243,225,147)) a gradiente, 54 u; briefing oro-crema `#ecdca0`. **Nota:** `C.title` (#f7efd8) resta l'inchiostro dei valori; il commento storico «troppo Gold… titoli ivory come la nav» (R-357) è superato solo per il titolo di quest, per richiesta 2026-11-21 — tornare indietro = un token.
**Aggiunta (2026-11-21, «Remove frame»):** cornice d'ottone della vignetta tolta (amenda «2 · Cornice più marcata» del 2026-11-20, e i curl d'angolo/gemma sulla vignetta): il dipinto corre dalla fascia al bordo destro, sta sotto la barra alta e sfuma nel pannello con una maschera (74%→100%); altezza 262 u, il cartiglio sale di 18 u. Il primo bordo sotto il dipinto è quello del cartiglio.
**Aggiunta (2026-11-21, «andiamo di gold come il mockup»):** testi e colori interni del cassetto portati al caldo del mockup. Misure: etichette del mockup ≈ crema (251,244,217), titoli di sezione/valori oro (242,215,147)–(233,217,145); le nostre erano grigio-verdi (143,178,162). Ora: etichette e didascalie `muted` → `#eadfb4`, etichette dei posti via `--slot-rack-slot-label-color` e `p` → `#f1e6bd` (scoped al cassetto), glifi di ruolo `#f3e193` (scoped, `!important` sul colore inline del renderer condiviso), valori giorni e ricompensa → `goldInk #f3e193`, «+» delle nicchie pieno. Titoli di sezione ancora assenti (ruling 17/11).
**Aggiunta (2026-11-21, angoli della cornice):** gli ornamenti `rail-top`/`rail-bottom` erano ritagliati dal mockup a larghezza fissa (foglie tagliate in verticale, punte del bottone dentro l'angolo in basso). Sostituiti da due angoli **generati da Gemini** vuoti su magenta (`frame-corner-tl.webp` con l'arco rotondo sopra il dipinto + barra; `frame-corner-bl.webp` con il ricciolo che entra nella riga d'oro; il primo tentativo in basso aveva un «baffo» che sporgeva → rigenerato con il divieto esplicito). Barra e riga arrivano al bordo destro dentro le stesse immagini (ultime colonne replicate: nessun attacco); fascia centrale `rail-mid-fold.webp` piegata dal pezzo in basso, che passa SOTTO gli angoli per 70 px dove l'angolo sfuma (niente taglio netto). Tolti `rail-top`, `rail-mid-long`, `rail-bottom`, `frame-top`, `frame-bottom` e l'arco SVG disegnato a mano. Pulsante ridotto a 740 u perché la punta sinistra non tocchi il ricciolo. ChatGPT non usato: limite del piano gratuito.
**Aggiunta (2026-11-21, nuovo mockup «il viaggio è superiore» + «chiaroscuro» + «oro più acceso»):** riferimento nuovo `images/5.webp` (cassetto Goblin con cornice simmetrica sottile). Misure: fondo (3,28,23), pozzetti nero-teal (8,16,16), segmento attivo smeraldo (5,63,33), etichette oro spento (196,191,145), titolo (242,217,143). **Fatto:** (1) barra del viaggio rifatta come nel mockup — tre chevron nero-teal con bordo d'oro, segmento attivo smeraldo (Outbound), diamanti smeraldo ai giunti e alle estremità, icona incisa (`ico-target`/`ico-axe`/`ico-gust`) + nome nel segmento, giorni piccoli sotto il nome (dato di gioco, non nel mockup); (2) chiaroscuro: fondo scurito con velo teal-nero (~25%), `wellStyle` nero-teal `rgba(3,14,13,.78)`, nicchie con interno scurito ×0,5 (oro intatto), etichette `muted` → `#cfc796`, etichette posti `#d9d29f`; (3) oro dei pezzi interni riportato al livello della cornice (misura: cornici sat 62/val 79, CTA 50/65, nicchie 50/71, filetto riquadri 44/60 → `grade_gold` sat×1,2–1,5, val×1,13–1,24; originali in `.mw/runs/20261121-cassetto-components/out/pre-boost/`); (4) pulsante: lacca verde `cta-plaque-enamel.webp` con saturazione ×1,55 e luminosità ×1,38 (era grigio-verde spento), etichetta `--skin-cassetto-cta-text` `#eafff5` → `#f6e9b0` (crema-oro come il mockup). **Non fatto (struttura):** cornice simmetrica sottile con diamanti, fila di teschi rossi + ricompensa a intervallo, ritratti nelle ghiere, titoli di sezione.
**Aggiunta (2026-11-21, «due errori… questo pezzo di nero»):** le ombre dipinte dentro la fascia/angoli generati erano nero puro (tra le barre d'oro, attorno alle gemme) e leggevano come buchi neri sulla mappa. Ritinte in smeraldo scurissimo `(0,10L+1 .. 0.95L+12 .. 0.7L+9)` solo sui pixel scuri non-oro (luminanza < 75, peso sfumato 75→35, oro saturo escluso): ombreggiatura mantenuta, niente nero. Applicato a `frame-corner-tl`, `frame-corner-bl`, `rail-mid-fold`; originali in `.mw/runs/20261121-cassetto-components/out/pre-shadow/`. Da verificare dal Director sui due punti indicati (ritagli `images/6.png`, `7.png`).
**Aggiunta (2026-11-21, «il viaggio è ancora sbagliato»):** la barra del viaggio non seguiva la struttura del mockup (3 frecce a punta, icona accanto al nome, giorni dentro il segmento). Rifatta: UNA pillola con estremi arrotondati divisa da tagli diagonali in tre segmenti nero-teal con bordo d'oro (attivo smeraldo = Outbound), diamante smeraldo al centro del bordo alto e basso di ogni segmento, uno su ogni giunto e uno a ciascun estremo; icona incisa SOPRA il nome (`ico-target`/`ico-axe`/`ico-gust`, 48 u). I giorni, assenti nel mockup ma dato di gioco, sono una riga piccola sotto la pillola (`cassetto-leg-days-N`) più il totale. Il file del mockup (`images/5.webp`) non era più su disco: ricostruito dalle misure e dalla descrizione salvate, non da un confronto pixel.
**Aggiunta (2026-11-21, «Risk/reward + journey» dal mockup v3 `refs/mockup-cassetto-goblin-v3.webp`):** (1) **Rischio e ricompensa = DUE pozzetti** affiancati con cornice, ciascuno con emblema (teschio / baule), etichetta scritta «Risk» / «Reward» (`cassetto-risk-label`, `cassetto-reward-label`), poi teschi (rischio) e quantità (ricompensa); le % del sim restano (ruling 2026-11-20): % morte bordeaux, % riuscita con alloro. **Amenda** il ruling 2026-11-20 «etichette Risk/Reward non scritte» — il mockup le scrive; test `INV:cassetto-risk-reward-wells`. (2) **Viaggio:** pillola più alta (148 u) con estremi interamente arrotondati, tre segmenti **incassati** (banda scura interna + labbro chiaro, riflesso sul segmento attivo), diamanti agli estremi, ai giunti e al centro di bordo alto e basso di ogni segmento, stelline a 4 punte ai lati dell'icona, icona incisa 50 u sopra il nome; i giorni restano sotto la pillola (dato di gioco assente dal mockup). Confronto: il mockup mostra «120–180» e cinque teschi accesi, noi mostriamo il dato reale della quest.
**Aggiunta (2026-11-21, «togli il ricciolo… centra il pulsante… troppo nera»):** (1) **Ricciolo in basso a sinistra tolto**: l'angolo in basso è ora l'angolo in alto specchiato in verticale (`frame-corner-tl.webp` con `scaleY(-1)`): arco tondo che entra nella riga d'oro, simmetrico a quello sopra; `frame-corner-bl.webp` non è più usato (resta su disco, originale in `out/pre-curl/`). Un tentativo di tagliare il ricciolo e disegnare un raccordo a mano è stato scartato (bordi netti). (2) **Pulsante centrato** nella colonna del contenuto (`CTA_CENTER_U = 541`, 820 u; prima 740 u a destra per non toccare il ricciolo). (3) **Risk/Reward stondati**: bordo oro con raggio 44 u, doppio filetto interno, niente 9-slice. (4) **Viaggio generato da Gemini** (`journey-bar.webp`: pillola con segmento sinistro smeraldo, due scuri incassati, bordo oro, gemme su estremi/giunti/centri; scontornata da magenta, 1024×123): icone e nomi restano DOM sopra, centri segmento in % (`JOURNEY_CENTERS`); il SVG disegnato a mano è rimosso. Limite noto: il primo taglio è quasi verticale, il secondo obliquo; risoluzione nativa bassa. (5) **«Troppo nera» risolto**: i pozzetti (`wellStyle`) ora usano lo smalto HUD (`--skin-hud-enamel-lift/base/deep` = (0,70,47) → (6,52,39) → (9,29,21)): verde in alto, quasi nero in basso, come le barre superiori e la nav; velo scuro del fondo ridotto da 26% a 12%.
**Aggiunta (2026-11-21, bilanciamento verde/nero «come nelle top bar»):** misurato sulle barre in alto: cuore nero-petrolio (1,17,25) lum 14, verde solo come alone sul bordo (lum 24–30), ~80% nero / 20% verde; il passaggio precedente (smalto pieno alto→basso, lum 35–50) rovesciava il rapporto. Ora `wellStyle` = cuore `#01111a` con alone verde stretto in alto e in basso + filo/alone interno verde (`inset … rgba(24,110,78,.30)`); stessi ingredienti sui pozzetti stondati Risk/Reward. Fondo = gradino più verde (velo `rgba(10,60,40,.10)` invece del nero). Misura dopo: barra del tempo cuore lum 14,2 → pozzetti 14,4–17,0; fondo 21,8–23,5; nav 34,6 (gradino lacca). Lo smeraldo saturo resta solo agli accenti (Outbound, pulsante, gemme).

**Aggiunta (2026-11-21, «un pezzo nero che esce ad angolo» — fix):** il pezzo nero era dentro `frame-corner-tl.webp` (1447×520), nella giuntura arco→barra (x 263–617, y 0–45): schegge scure opache sopra la silhouette d'oro (l'edge superiore nel golden è tutto oro; ombreggiatura solo dentro) + granelli scuri dentro la banda del rail. BL = stessa immagine `scaleY(-1)` → difetto identico specchiato: un file sistemato = entrambi gli angoli. Fix `fix-joint-shards.py` (run dir): per x≥240 il *leading dark run* (pixel scuri opachi sopra il primo oro della colonna, prime 20 righe) → alpha 0, iterato a convergenza (il taglio espone nuovi run); granelli scuri <600 px racchiusi nell'oro della banda → mediana oro locale. Il cuneo d'ombra interno arco↔barra resta (è nel golden). Misure: leading-dark 157 px (run max 16) → 9 (run 5); i residui sono rumore di confine da ri-encode webp (colori bronzo scuro, non nero). Originale in `out/pre-joint/`. Provenance `pieces.json` riallineata su tl/bl/rail-mid-fold (sha256 + nota postprocess). Test `// INV:hud-real-cassetto.INV-7` in `r357CassettoFrame` (massa ≤40 px E run ≤7: rosso 157/16 sul buggato, verde 9/5 sul fissato; red-first registrato). Verifica live headless `/hud-compose?comp=cassetto` 1440×900: entrambi i bordi puliti (`test-results/cassetto-review/`). Non verificato: angolo su /game con party vero (stesso asset, stesso montaggio); `closure:lint` resta rosso su debris pre-esistenti (poiZanara, paintedPieces, ricevute slice-kit cassetto — non toccati da questo fix).
**Aggiunta (2026-11-21 bis, «parte esterna dell'angolo, una specie di triangolo nero che esce» — fix):** sotto la punta destra dell'arco (x~210–350, y~50–110) una *macchia scura semitrasparente* (alpha 40–120, quindi invisibile alla maschera `op>120` del primo fix — per questo era sopravvissuta) gocciolava sotto la linea dei dentini d'oro nel vuoto: un triangolo nero appeso alla silhouette. Nel golden sotto l'arco c'è sfondo aperto → per x∈[195,460], sotto il pixel d'oro più basso di ogni colonna (righe 30–170) tutto ciò che non è oro → alpha 0 (~25 600 px). Seconda passata inline sui residui di encode (−104 px). Misure: non-oro sotto i dentini 631 → 54 px (residui = jitter alpha di confine, sparsi 1–3 px, invisibili). Stessa INV `hud-real-cassetto.INV-7` estesa con la clausola sotto-arco (≤150; rosso 631/157 sul buggato, verde sul fissato; red-first ri-registrato). Provenance tl riallineata. Witness: `test-results/cassetto-review/underarch-board.png`, `tri-zoom-v5.png`, `full-v5.png`.
**Aggiunta (2026-11-21 ter, «nero tutto dietro il frame, in alto e in basso esterno al frame di sinistra» — fix):** diagnosi — i buchi del reticolo di `rail-mid-fold.webp` sono *trasparenti* (42% del pezzo) e il campo enamel partiva a `u(36)`: la metà sinistra del frame galleggiava sulla mappa, che nei punti scuri leggeva come nero dietro il reticolo; nel golden dietro le maglie c'è il marmo smeraldo. Fix in due atti: (a) enamel `left: u(36)` → `left: 0` in `HudRealCassetto.tsx:375` — ora il marmo copre tutta la zona visibile del frame (la colonna è `overflow:hidden`, nessuna barra verde: il margine scuro a sinistra delle viti è il bordo dipinto del golden); (b) halo-cut sui due pezzi (`fix-joint-shards.py` pass 3): px neri (lum<85, non-oro, non-gemma) entro ~2.5px della trasparenza **esterna** (connessa al bordo immagine, non ai buchi interni) → alpha 0: rail 153 px, corner 761 px — viticci neri che sporgevano oltre il bordo d'oro sulla mappa. Nuova `hud-real-cassetto.INV-8` (enamel backing + exterior-halo lum<50: rail ≤15, corner ≤400; buggy 26/518); red-first registrato. Provenance sha riallineata (rail `5a6e50e3…`, corner `3c2eb1d6…`). Witness: `test-results/cassetto-review/final-board-v7.png`, `compose-cassetto-v7.png` — la striscia di sfondo visibile a sinistra dell'ornamento è ora marmo.
**Aggiunta (2026-11-21 quater, «sembra peggio di prima, non ci dev'essere il nero» — correzione del fix):** il backing a `left:0` col marmo annerito leggeva come lastra nera uniforme — nel golden dietro le viti c'è un margine smeraldo *luminoso* (~(25,45,28), g dominante) e le tasche scure sono *olivastre calde* (~(28,26,10)), non verdi-fredde. Corretto in due mosse: (a) strip dedicata sotto il frame `left:0, width:u(150)` sopra l'enamel — stesso `ground.webp` con wash smeraldo `rgba(20,72,48,.62)` → dietro le maglie si vede smeraldo dipinto, mai nero; (b) ritint warm-olive delle ~107k px scuri non-oro/non-gemma in rail+corner (ramp lum→(1.35,1.10,0.50)·lum, blend .8): le tasche passano da (27,43,21) freddo a ~(28,23,11) caldo come il golden. Backup `out/pre-olive/`. Test invariato (soglie reggono: residui halo contano ancora lum<50), sha riallineati. Witness: `rail-3way-v8.png`, `compose-cassetto-v8.png`.
**Aggiunta (2026-11-21 quinquies, «angolo colorato invece di essere ritagliato — eliminarlo e basta» — soluzione finale):** il backing DOM (enamel a left:0 + strip smeraldo u(150)) sbucava oltre la silhouette organica come rettangolo colorato. Soluzione: NESSUN backing DOM — enamel tornato a `u(36)`; i pezzi restano ritagliati: i buchi del reticolo e l'esterno della silhouette sono trasparenti e mostrano il mondo. Il "nero" che restava era la *materia cotta*: ritint warm-olive già applicato (pass 4) + halo esterno tagliato (pass 3). Tentativo di fill-in-asset (pass 5) scartato: i buchi sono finestre aperte, non tasche — riempirle ricreava la stessa toppa colorata. INV-8 riscritta: (a) asserisce `left: u(36)` e assenza di backing sotto il frame; (b) halo esterno ≤ soglia. Test 3/3 verdi. Witness `rail-3way-v9.png`, `compose-cassetto-v9.png`.
**Aggiunta (2026-11-21 sexies, «alone verde scuro tutt'attorno + quel quadrato» — diagnosi finale):** due difetti diversi, uno mio e uno strutturale. (1) **L'alone verde scuro** era la fascia di margine dipinta che avevo cotto oltre la silhouette (~10px, 94k px): annullata ripristinando l'alpha pre-margine (backup `out/pre-pockets/` + `out/pre-margin/`) — la silhouette torna ritagliata vera. (2) **Il "quadrato"** era un artefatto di composito, non di asset: il bordo sinistro **rettilineo** della vignette (x=973px screen) cadeva dentro la zona traforata sotto l'arco del corner (img x920–1432) — attraverso le finestre si vedeva un taglio dritto di foresta teal attaccato all'oro. Spiega anche i report precedenti: lo stesso bordo dritto era «nero» quando dietro c'era l'enamel scuro e «verde» col wash. Consultazione esterna confermata (chatGPT/codex via mw-ask: «bordo geometrico netto visto a frammenti nei trafori → rettangolo percepito»; Gemini timeout). Fix in `HudRealCassetto.tsx`: vignette `marginLeft u(2)` → `u(-50)` (parte sotto i viticci opachi) + mask orizzontale `linear-gradient(90deg, transparent, #000 u(70))` sul wrapper — nessun bordo dritto coincide più con un traforo; il dipinto sfuma sotto l'arco come nel golden. INV-8 e suite cassetto verdi (31/31), build:check ok, provenance riallineata (`frame-corner-tl e9af6289…`, `rail-mid-fold c43fef15…`). Witness `test-results/cassetto-review/final-board-v13.png`, `compose-cassetto-v13.png` (roster chiuso nel witness). Nota: nel lab il "nero fuori" a sinistra del frame è lo sfondo/mappa visibile attraverso il ritaglio — nessun layer fuori dalla colonna.
**Aggiunta (2026-11-21 septies, «è ancora lì» — i rettangoli segnati a mano erano il bordo sinistro dell'enamel):** il Director ha marcato i difetti su uno strumento di marking dedicato (`public/tmp-mark/mark.html`, coordinate screenshot): bande a gradini sopra/sotto l'ornamento + strisce sul bordo. La misura pixel-per-pixel ha chiuso la diagnosi: **non era materia cotta** — a screen x≈937 una linea netta verticale separa la mappa (blu) dallo smalto piatto scuro (1,25,14 ≈ fallback `#04281a` di `paintedGround()`), e corre su **tutta l'altezza della colonna**: il bordo sinistro *rettilineo* del campo enamel (`left: u(36)`) visto a frammenti attraverso i trafori della filigrana → «il rettangolo … sia sopra che sotto». Stesso meccanismo del "quadrato" della vignette, terzo artefatto della serie: **qualsiasi bordo rettilineo che attraversa un ritaglio organico viene ricostruito come rettangolo**. Prima era stata fatta una passata chirurgica sull'asset (taglio vela scura x40–170/y0–140, gemme protette da maschera dilatata — 1877 px, sha `99ad38dd…`), corretta ma non toccava la causa: il layer DOM dietro. Fix: `HudRealCassetto.tsx` — mask `linear-gradient(90deg, transparent, #000 u(120))` sul div enamel, il bordo si dissolve sotto l'ornamento invece di tagliare; geometria `left: u(36)` invariata (niente backing reintrodotto). INV-8 esteso con la nuova asserzione (enamel `left: u(36)` + mask 90deg), test 3/3 verdi; suite cassetto 31/31; build:check ok. Witness `test-results/cassetto-review/final-board-v15.png`, `compose-cassetto-v15/-v16.png` (roster chiuso). Freezato dal Director 2026-11-21; learn → `.mw/runs/20261121-cassetto-enamel-edge/pattern-candidate.md`, promosso a `recurring-traps.md` T-33.

## 2026-11-21 — OB-7 cassetto: rulings estetici della review charter (14/14)

**Da:** PLAN-131 ha prodotto i component charter `reconstructed`; OB-7 richiedeva l'occhio
Director sul pilota cassetto (review visuale su `/hud-charter-review`, witness V2 R-374).
**A:** ruling Director 2026-11-21T22:20Z (JSON completo in
`.mw/runs/20261121-plan131-charters/signoff-OB7.json`):
- **confermati** (appreciated): placca CONFIRM, cornice da pezzi standalone, vignetta a
  filo bordo, emblemi lit/dimmed, banda viaggio pill, scroller peek+fade;
- **correzioni** → openIssues dirette: pozzi troppo neri in proporzione (materiale
  nero-teal confermato → **D-open-4 chiuso, niente lacca-petrolio/amend**), spaziatura
  sx/dx da ribilanciare, blocco risk/reward senza label + % sopra + reward 5 simboli +
  gain via click/tooltip, proporzioni scroller senza toccare frame/barra, disabled
  «troppo vivo» → prova −40% sat lacca, motivo CTA disabilitata → **visibile**
  (allinea REQ:v38-states senza amend), vignetta → arte per-quest;
- **lasciato aperto**: affordance HudScrollBandX;
- **esplorazione residua**: spessore cornice (forse meno spessa);
- **chiuso**: edge-tab cassetto chiuso → resta chiuso senza tab — **amend v38 D6b da
  formalizzare** nelle desiderata.
Charter cassetto promosso `director-verified` + `ornamentLevel 'II'` (proposta accettata,
contro-ruling possibile). I 7 seed restano `reconstructed`.
**Fonte:** ruling Director via JSON ruling page 2026-11-21.

## 2026-11-21 — D-4 tipografia HUD: ruling «A inciso» + implementazione

**Da:** PLAN-125 D-4 richiedeva 3 prove tipografiche side-by-side sulle superfici
reali `/hud-compose` e la scelta del Director. Prove in
`.mw/runs/20261120-d4-typography/` (board 2×2 + specimen leggibilità):
A Marcellus+Cardo, B Almendra SC+Almendra, C Carrois Gothic SC+IM Fell English
(dress copperplate/elisir).
**Ruling Director 2026-11-21: «A»** — Marcellus display + Cardo serif.
**Implementazione:** woff2 latin self-hosted in `public/fonts/` (marcellus-400,
cardo-400/700/italic — stesso pattern dei volti esistenti, zero dipendenza di
rete); `@font-face` in `index.css`; stack su `--skin-font-display`/`--skin-font-serif`
e bridge `--wl-*` in `skinCssVariables.ts` (Marcellus→Cinzel→Trajan Pro,
Cardo→EB Garamond→Georgia); rename in-place dei literal su 71 file in
`src/ui/idleVillage/**`, `wanderlust-surface`, `base.css --font-header`,
`hud-compose` — i nomi vecchi restano come fallback nelle stack.
**Nota semantica:** Marcellus ha minuscolo vero (Cinzel no) → nomi/titoli in
title-case («Giggiolillo») salvo `text-transform: uppercase`; guida HUD §4.3
aggiornata. Floor PLAN-127 11px non toccato (nessuna dimensione modificata).
**Fuori scope volutamente:** lab pinned (hud-lab spikes, styleLab, v9, moodboard),
`FantasyTheme`/designSystem. Witness live `/hud-compose?comp=cassetto`:
`shots/live-a-cassetto.png` (font caricati nativi, rendering verificato a
occhio). `build:check` verde; lint scope: 1 errore preesistente in HEAD
(`WanderlustLayout.tsx:511` react-refresh, non correlato). 43 failure
vitest suite skins preesistenti e infrastrutturali (`Preset not found:
wanderlust`), nessun test asserisce nomi font. T-13: worktree condiviso —
`HudRealCassetto*` in riscrittura attiva da altra sessione; rename applicato
anche lì, nessun sovrascrittura.

## 2026-11-21 — Victory/Reward pergamena: eye-review fix pass (R-357, PLAN-125 Fase 7d)

Ruling Director su cattura pergamena: «A, ma senza il bordo nero dietro,
la scritta Expedition Report è poco visibile, la scritta Close Report nn è
centrata, le scritte al centro sembrano incollate e c'è un rettangolo strano».

Root cause + fix (bug registrato `INV:hudreal-victory-reward.INV-7`,
`source: director-bug`, Mode A red-first):
1. **Bordo nero** = velo radiale `.75` + `drop-shadow(.78)` → `.52` + `.45`.
2. **Titolo illeggibile** = ink `#16241f` su cartiglio teal scuro → `#ecdcae`
   + incisione scura.
3. **CTA bassa** = copia ~10px sotto il centro ottico della placca →
   `translateY(-1.4cqh)` sul testo (zone già centrata sul campo dipinto).
4. **Centro incollato** = label↔righe gap 0 → zone nudge (label −8px, righe
   +10/−18px) + gap echoes `0.4`→`1cqh`.
5. **Rettangolo strano** = streak `::before` del bottone-base `.skin-scope`:
   su row `all:unset` il pseudo assoluto risolve contro la zona scroll
   posizionata → fascia chiara 45%h. Esentato via
   `.skin-scope [data-victory-report] button::before` (convenzione
   `data-belt-rows`), utile anche a CTA/X.

Pattern riusabile: `all:unset` rende un bottone `position:static`, quindi i
suoi `::before/::after` assoluti si ancorano all'antenato posizionato più
vicino — sotto `.skin-scope` i bottoni "non-bottoni" vanno esentati dal
materiale base (streak/hover) via attributo di scope.

## 2026-11-21b — Victory/Reward: medaglione anchor dentro l'anello dipinto (INV-8)

«Il medaglione è troppo grande» — il C1 ornato (156px + crescent) copriva
l'anello dipinto sottile (~140px, centro ~226,412) che nel golden è il
*holder* vuoto previsto per il ritratto. Fix: il ritratto anchor è un disco
118px dentro l'anello dipinto (`getMedalPortraitUrl` + borderRadius 50%);
la variante `panel` (dev-only, niente anello dipinto) conserva il C1 ring.
INV:hudreal-victory-reward.INV-8 — test rosso lockato → fix → 8/8 verdi.

### Annotazione Director — il «rettangolo nero» è il drop-shadow (R-357, INV-7)

Su richiesta dell'agente è stato fornito uno strumento di annotazione
(`.mw/runs/20261121-victory-fix/annotate-report.html`, servito su :8791):
il Director ha disegnato 23 rettangoli che tracciano il PERIMETRO completo
della pergamena — una fascia nera su tutti e 4 i lati. Root cause: il
`filter: drop-shadow` sullo shell — l'img frame.webp è un rettangolo opaco
senza alpha, quindi l'ombra è un rettangolo nero sfumato; la riduzione
`.78→.45` non bastava perché il problema è la FORMA (rettangolare), non
l'intensità. Fix: `filter` rimosso del tutto — i bordi dipinti portano già
la propria ombreggiatura e il velo dà la separazione dalla mappa.
Implicazione riusabile: su frame baked rettangolari niente drop-shadow CSS —
solo ombre cotte nell'art o asset con alpha reale.

## 2026-11-21c — PLAN-131: advisory Claude sui charter, rulings Director

Review esterna di Claude (briefing `.mw/runs/20261121-plan131-charters/briefing-claude.md`):
segnalata incoerenza reale — la scala `ornamentLevel` era descritta invertita
nel briefing (I sobrio / III cerimoniale) vs il canonico PLAN-131 §2
(I monumentale · II prezioso · III funzionale, radice: ruling v4 sui
«3 livelli di ricchezza»). Briefing corretto; schema e signoff erano già
allineati al canonico.

Ratifiche Director 2026-11-21:
- **Re-verify `director-verified` a trigger, non a scadenza** — ratificato:
  la verifica resta valida finché non cambia il contesto attorno (palette
  condivisa, nav, top-chrome, composizione schermata) o su richiesta
  esplicita; agganciato alla harmony review PLAN-128, niente decay temporale.
- **Reward concreto VISIBILE** — ruling rivisto (post-advisory Pillar 4):
  il reward si mostra nel blocco, sotto la % di vittoria, presentato «bene»;
  il tooltip resta per il dettaglio, non porta il valore principale.
- **Pair-comparison nel battesimo** — adottato come pratica: quando un ruling
  apre un visual-fork la review mostra attuale + alternativa, non solo il
  witness corrente; non obbligatorio per difetti evidenti.
- **`rejected` (campo charter per soluzioni provate e scartate)** —
  RATIFICATO e implementato: `rejectedSchema` {item, reason, ruling}
  con ruling obbligatorio (gate schema + test); seed nel cassetto:
  lacca-petrolio (→nero-teal) ed edge-tab (→resta chiuso).
- **`pairsWith`** — non aggiunto: nessun consumer, la relazione emerge dalla
  harmony review. **«un solo I per schermata»** — regola di composizione da
  harmony review, non gate meccanico.

## 2026-11-22 — Cassetto V3: implementati i rulings OB-7

Applicati a `HudRealCassettoV2` i rulings del charter-review (conferma occhio
Director pendente su ogni voce — openIssue del charter aggiornati con ref
«IMPLEMENTATO V3»):

- **Asse condiviso 530→560** (app-2 «vicini al frame sx, vuoto dx»):
  padL 120→148, padR 85→52 — l'asse si ancora alla card smaltata PERCEPITA
  (il campo visibile parte ~u120 dopo il fade-in), non a quella geometrica.
  Amend contratto `cassetto-v2-cta-panel-centre` + `well-clearance`.
- **Pozzi verso nero-teal** (app-1 «troppo nero»): glow verde allargato
  0–30%/70–100%, core liftato a nero-teal (#04222b/#01141c/#03302a).
- **Risk/reward** (app-5 + ruling rivisto): label RISK/REWARD rimosse; % sopra
  la scala lit/dimmed e allineate; reward 5 forzieri via `rewardLevel`
  (POI `tier` authored: main=5, normal=3 — mapping nuovo, ruling da confermare);
  reward concreto visibile in chips orlate sotto la % vittoria (Pillar 4);
  tooltip per dettaglio. Nuovo INV `cassetto-v2-reward-visible`.
- **Scroller party** (app-7): seat 230→205u, peek 105→80u — frame e journey
  intatti.
- **Motivo CTA visibile** (iss-a): band sopra la placca — riallinea V2
  all'INV-2 (lo sr-only era divergenza dal contratto, non la regola).
- **Disabled −40% sat** (iss-c/α): `enamelDisabled` saturate .72→.43.

Non toccati per ruling: HudScrollBandX (iss-d aperto), spessore cornice
(app-3 openExploration — serve variante d'asset, non un tweak di costante),
vignetta per-quest (β: `quest.vignette` già live via coverArt; arte dedicata
resta openIssue di pipeline). Witness: `.mw/runs/20261122-cassetto-v3-ob7/`
(`/hud-compose?comp=cassetto&poi=poi-goblin&risk=3&pcts=28,74&reward=4`,
headless, zero pageErrors).

## 2026-11-22 — Cassetto: rimozione fold chip `›` (amend expedition-drawer.INV-1/3/5 + cassetto-slide-lateral)
- **Ruling Director** (screenshot, «c'è una specie di freccia › — eliminala»): il collapse chip sul bordo sinistro della colonna e il chip ripiegato sul bordo destro sono rimossi. Sigilla OB-7 γ «il cassetto resta chiuso senza tab»: UNA sola forma — colonna espansa con quest, assente senza. Chiusura solo via `onClose` dell'adapter.
- **Amend**: `.mw/contracts/components/expedition-drawer.md` INV-1/INV-3/INV-5 + `hud-real-cassetto.md` `cassetto-slide-lateral` (slide-out era coreografia del fold → rimosso). Test r339ExpeditionDrawer/r357DrawerSlide riscritti: `useExpeditionDrawer` resta vestigiale, il drawer non lo legge.
- **Viaggi**: `journey-bar.webp` → `journey-pill.webp` (asset ornamentale battezzato nel mockup), centri segmento ri-misurati 17.4/52/82%.
- **Review page**: witness `v2-*` stale → `v3-*` rigenerati post-ruling.

## 2026-11-22 — Cassetto: motivo CTA NON dipinto (supera OB-7 iss-a «motivo-visibile»)
- **Ruling Director** («togli le scritte party incomplete ecc.» sul witness V3): la frase di motivo del CTA disabilitato NON va dipinta — il band sopra la placca resta pulito. Il motivo resta nel DOM `sr-only` e via `aria-describedby` (screen reader). **Supera il ruling OB-7 iss-a «motivo-visibile»** e riallinea il contratto V2 (`states.disabled`: «motivo sr-only, NON dipinto») — il render visibile di ieri era drift, oggi risolto per ruling.
- `rejected` charter: «motivo CTA dipinto in band sopra la placca» — provato, visto, scartato.

## 2026-11-22 — Victory: il «rettangolo nero» era il margine dipinto del webp (INV-7, chiusura)

Dopo la rimozione del `drop-shadow` (entry 2026-11-21b) il profilo pixel ha
mostrato che la fascia nera persistente (lum 13-18, identica pre/post fix)
era **dentro** il rettangolo dell'immagine: `frame.webp` è RGB opaco e porta
~50-70px di margine quasi-nero dipinto attorno ai bordi sfrangiati — il
"rettangolo" dei 23 rect annotati dal Director. Primo fix via `mask-image`
a 4 gradienti — **respinto** («è rimasta un'ombra, hai mandato in alfa una
parte»): la sfumatura alleggeriva il bordo ma lasciava l'ombra e mangiava
contenuto. Fix definitivo: **flood-cut dell'asset** — px border-connected
con lum<45 & sat<30 → alpha 0 (160k px, 20%); la silhouette strappata è il
bordo vero, la mappa corre fino allo strappo, zero alpha nel contenuto.
Backup pre-cut `.mw/runs/20261121-victory-fix/frame-backup-precut.webp`.
Test INV-7 esteso, 8/8 verdi. Witness finale
`.mw/runs/20261121-victory-fix/parchment-alphacut2/` — run reale, 0 errori.
Pattern gemello di T-33 (cassetto): *qualsiasi bordo rettilineo che
attraversa una scena organica viene ricostruito come rettangolo* — qui
persino il bordo dell'asset stesso.
Nota ops: il reaper MW (`mw-reap`) uccideva dev server (L3-orphan) e il
chromium headless (L6-browser-hog) a metà witness — dev server ora lanciato
via `mw-run --lease 2h --port 5173`, browser root adottato via `mw-adopt`.

## 2026-11-22 — Cassetto: campo esterno NERO battezzato
- **Ruling Director** («prova a mettere lo sfondo nero invece che verde — non dentro i frame interni, solo dentro quello esterno» → **«battezzo»**): il campo smaltato della colonna passa a velo nero ~86% sul marmo (`rgba(3,5,5,.86)` + fallback `#060807`). I frame interni (pozzi, cartouche, journey, placca) mantengono i loro fill — la traslucenza scurisce sul nero senza toccare le ricette. Effetto letto nel witness: «cornice oro su velluto nero con cammei verdi». Registrato in `appreciated` del charter; il fork non era pinnato da nessun INV, nessun amend richiesto.

## 2026-11-22 — Victory/Reward: BATTEZZO del report finale (R-357, Fase 7d chiusa)

«battezzo» — il Director approva lo stato live della pergamena dopo il
fix-pass completo (INV-7 + INV-8): drop-shadow rimosso, margine nero del
webp flood-cut ad alpha (silhouette strappata vera — seconda iterazione
dopo il mask-feather respinto), titolo/CTA/spaziatura/ritratto-a-disco,
band a smalto condivisa. Artefatto registrato:
`.mw/specs/hud-real/refs/approved-victory-pergamena-live.png` (witness
headless run reale, da `.mw/runs/20261121-victory-fix/parchment-alphacut2/`),
entry in REGISTERED.md. PLAN-125 Fase 7d (N=3 PLAN-127) → completata.
