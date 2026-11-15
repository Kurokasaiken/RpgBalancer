# RPG Project Decision Log

**Version:** 1.0 (2026-05-20)  
**Purpose:** Record major architecture & strategy decisions with rationale. Audit trail for "why did we do X?"

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
