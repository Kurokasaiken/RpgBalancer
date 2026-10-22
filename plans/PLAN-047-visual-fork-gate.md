# PLAN-047: Visual Fork Gate — opzioni visive prima del plan, baseline congelata, verifica sul selezionato

**Status:** `completed` — battezzato e implementato 2026-10-18
(Director: «Battezza e implementa», default §11.4 confermati, T-006 come
estensione di `closure:lint`). T-001..T-007 consegnati 2026-10-18; bundle
`.mw/runs/20261018-plan-047-visual-fork-gate/` = **PASS OB-1..OB-8**
(signoff Director con `frames_sha256` binding). Semantica T-006 raffinata
v2 per ruling Director 2026-10-18 — "scope per plan" (§11.6). Preview:
auto-open nella scheda Preview di Devin Desktop (ruling Director — regola
16 non copre la scheda interna); proxy path-scoped bug → T-19.
**Desiderata:** **v35 FROZEN** (§10 — congelata dal Director 2026-10-18)
**Richiesta:** R-216
**Esplorazione:** `.mw/runs/explore-visual-options-workflow-20261018/` (multi-AI,
converged 1 ciclo) · **Dibattito plan:** `mind-weaver/.mw/runs/20261018-visual-fork-gate-debate/`
**Relazioni:** estende il workflow single-agent v31 senza riattivare kanban/dispatch;
riusa la metrica ibrida F8 di `PLAN-MOCKUP-TO-COMPONENT-v3` (workflow assorbito
nelle skill `painter`/`mockup-generator`); si appoggia al gate d'intento v33
(PLAN-045) e alle guardie meccaniche v32 (PLAN-044). Riferimenti frozen citabili
dagli skip: `src/ui/idleVillage/frozen/kits/` (+ relativo indice/registry),
`skinConfigRegistry`, token `--skin-hud-*`, `*_trusted.md`, desiderata FROZEN,
ruling Director. Precedente operativo: lab `/bezel-variants` (R-214).
**Rev:** r003 — emendamenti dall'acceptance round T-004 (obiezioni residue
W-11 chatgpt, W-12 claude): il check meccanico deriva la superficie visiva dal
**diff reale del bundle**, non solo dai `files_touched` dichiarati, e verifica
la copertura per-componente contro scope list e skip puntati.
(r002 — emendamenti dal round-1: trigger effect-based con puntatore
verificabile, anti-straw-man, `baseline_kind`/`frozen_at`, contratto di
confronto pre-registrato, ledger separati, loop reject_all/compositi chiusi,
spike con lifecycle, check meccanico nel plan, dry-run pre-landing.)

## 1. Diagnosi

Oggi la forma visiva di un componente può cristallizzarsi dentro il plan senza un
ruling del Director: l'agente esplora, pianifica e presenta una sola direzione
estetica già impacchettata nei task. Il Director approva una scatola chiusa o
bocca l'intero piano per ragioni estetiche — rework a valle. Il caso R-214 ha
mostrato il pattern corretto (varianti su pagina ad hoc → ruling → promozione),
ma è avvenuto **dopo** l'implementazione, come correzione.

**Perimetro onesto del gate** (debate, claude#12): il gate mira alla classe di
fallimento "*direzione rappresentazionale scelta dall'agente*" — gerarchia,
composizione, densità, affordance, struttura. Non mira alla classe
"*finitura/materiale percepita*" (un bezel può risultare scadente anche dentro
la silhouette approvata): quella resta territorio T-04 human-eye, dove il gate
aiuta solo perché la baseline è un riferimento esplicito. Il pilot è anche il
test di quanto le due classi si sovrappongano nella pratica.

## 2. Invarianti (dall'intento Director — non eludibili)

- Nessuna scelta di rappresentazione visiva presa dall'agente a priori quando
  esistono alternative materiali (gerarchia, composizione, densità, affordance).
- Le opzioni si mostrano **prima** dell'approvazione del plan: default **2**,
  massimo **3** per fork strutturali. Un solo giro di ruling può coprire più
  card in una sola seduta (batching — la card resta per-decisione, la seduta no).
- Il risultato finale è **misurato rispetto all'opzione selezionata iniziale**:
  baseline congelata + ledger degli emendamenti approvati dal Director.
- Verifica visiva **ibrida**: misure meccaniche same-viewport per
  geometria/layout/palette + giudizio umano per identità/materiale.
  **Precedenza esplicita: l'occhio del Director vince sempre sulla metrica**
  (T-04) — una metrica verde non chiude un giudizio umano aperto; una metrica
  rossa non chiude un giudizio umano soddisfatto, ma va registrata.
- v31: un plan → un bundle. Le varianti scartate non entrano nell'albero di
  produzione e non generano bundle multipli.
- Regola 16: catture/verifiche headless; la preview si apre
  **automaticamente dentro la scheda Preview di Devin Desktop** (non è una
  finestra foreground esterna — ruling Director 2026-10-18).
- Invarianti progetto: config-first, token skin, i18n, primitive esistenti,
  reduced-motion ⇒ nessun effetto, budget WebView profilato. Una selezione che
  viola un invariante è **indefinibile**, non emendabile (§7, exit unbuildable).

## 3. Posizione del gate e trigger

Il fork visivo vive in **`mw-explorer`** (EXPLORATION), prima del plan. Il plan
recepisce una direzione estetica già scelta. `mw-planner` non genera opzioni di
routine: se scopre un fork **non anticipato** durante la decomposizione, si
ferma e riapre la decisione (`INTENT_GATE_VISUAL_FORK`, §6).

**Definizione meccanica di "plan visivo"** (per enforcement, non per
giudizio): un plan è visivo se almeno un task dichiara `files_touched` che
intersecano `src/ui/**`, `src/skins/**`, config di token/skin
(`skinConfigRegistry`, `*skin*config*`, temi). È una condizione enumerabile,
grep-abile, senza aggettivi.
**L'enforcement non si fida della dichiarazione** (W-12): il check di §6/T-006
deriva la superficie visiva **dal diff reale del bundle** (file effettivamente
modificati che matchano gli stessi glob). Un file visivo presente nel diff ma
assente dai `files_touched` dichiarati è un **difetto del plan** — chiude
l'omissione silenziosa per sotto-dichiarazione.

**Trigger del fork** — si apre solo se TUTTE queste condizioni:
1. il task crea o modifica elementi grafici/visivi;
2. esistono ≥2 rappresentazioni materialmente diverse (gerarchia, composizione,
   densità o affordance differenti — non micro-variazioni cosmetiche);
3. la direzione non è già fissata dai riferimenti frozen elencati in testata.

**Boundary effect-based** (non basata sulla dimensione del diff — dibattito
chatgpt#1, deepseek#5): uno skip è valido solo se la modifica **conserva**
grammatica visiva, gerarchia, affordance e leggibilità. Tipo-di-cambio come
euristica, non come test:
- *Expected-fork:* componenti nuovi, cambi di layout/composizione, nuovi
  elementi visivi, nuove affordance, restyling che cambiano la grammatica.
- *Expected-skip (euristica, sempre subordinata al test d'effetto):* ritocchi
  di singolo token che non cambiano contrasto/gerarchia percepita, spacing
  nudge, swap di icone nella stessa grammatica e stessa affordance, cambi
  solo-copy, bugfix sull'aspetto esistente.
- **Incertezza = fork.** Se l'explorer non può affermare con sicurezza che
  l'effetto conserva grammatica/gerarchia/affordance/leggibilità, il fork si
  apre. Un'euristica non è una licenza.
- **Regola aggregata** (claude#2): se i task visivi di un plan *cumulativamente*
  alterano composizione o gerarchia di una regione a schermo, lo skip è nullo
  per l'intero plan — anche se ogni task, preso da solo, sembrerebbe cosmetico.

**Skip con puntatore verificabile** (W-01, maggioranza 5/5): se una condizione
manca → niente fork, ma l'explorer lo dichiara nella run con un riferimento
controllabile:
- condizione 3 (direzione già fissata) → cita **file + clausola** del
  riferimento frozen che fissa la direzione;
- condizione 2 (una sola rappresentazione) → nomina la rappresentazione
  considerata e perché non ne esiste una seconda materiale;
- condizione 1 (non visivo) → cita il perimetro file del task (nessun
  `files_touched` visivo).

Uno skip **senza puntatore** è un difetto del plan — rilevabile meccanicamente
dal check di §6/T-006. Uno skip **con puntatore errato** è un difetto segnalabile
dal reviewer al battezzo: il check meccanico garantisce la forma, il giudizio
umano garantisce la sostanza. Onestà esplicita: nessun testo rende lo skip
impossibile da aggirare — il gate alza il costo del silenzio, non lo azzera.

**Scope della card:** il fork è **per decisione estetica, non per componente**.
Una card copre una famiglia di componenti che condivide la stessa direzione
(precedente: preset bezel su tutto il rack slot) **e deve enumerare la scope
list**: i componenti coperti sono elencati per nome. Un componente visivo nel
plan non coperto da alcuna card né da uno skip puntato = difetto del plan.
Componenti che differiscono per funzione o posizione nella gerarchia non
condividono una card.

## 4. Artefatto: visual-fork card

Un file `.mw/runs/<run>/visual-fork.md` (o `visual-fork-<nome>.md` se più card),
template in `.mw/templates/visual-fork/`, leggero e versionabile nella run.
Contenuto:

- **Scope**: elenco dei componenti coperti dalla decisione.
- **Condizioni della decisione**: viewport, stato e — quando pertinenti —
  contenuto localizzato lungo, stato interattivo, reduced-motion. Le viewport
  **a cui il Director ha effettivamente valutato** sono registrate (impostazione
  device della Preview tab o dato riferito): il ruling vale per quelle
  condizioni, non si estende ad altre senza dichiarazione.
- **Opzioni**: id (A/B/C), nome, intento comunicativo, riferimento visivo
  (path immagine/screenshot o route preview), e **`option_provenance`**: una
  riga per opzione — da quale famiglia di alternative è tratta e perché è
  materialmente distinta dalle altre (il menu non lo scrive solo lo chef —
  W-02). **Nessun marker "recommended" di default**; il Director può chiederlo
  esplicitamente.
- **Anti-domination**: ogni opzione dichiara il suo argomento più forte e il
  costo del sceglierla; la matrice deve contenere **almeno un asse su cui
  ciascuna opzione non-raccomandata vince**. Se nessun asse esiste, il fork è
  degenere → l'explorer riformula le opzioni prima di sottoporle.
- **Matrice comparativa** su assi **selezionati per il fork** da un menu fisso:
  gerarchia/densità, ancoraggio ai token skin, layout/overflow e testi
  localizzati lunghi, stati interattivi, responsive, costo implementativo
  (complessità DOM, budget WebView), reduced-motion/accessibilità. Solo gli
  assi rilevanti per la decisione si compilano — non è un modulo universale.
  Gli assi DOM-dipendenti selezionati impongono la superficie minima (§5).
- **Ruling**: `selected: A|B|C|null`, vincoli/emendamenti verbatim del Director,
  `reject_all` → ritorno a explorer col feedback (§6 per la semantica del loop).
- **Ruling composito** («A col layout di B»): i vincoli entrano nel ledger come
  emendamenti **al ruling**; se il composito è materialmente una nuova opzione,
  si produce A' e si ri-sottopone **una sola volta**. Un A' rigettato conta come
  un voto `reject_all` ai fini del bound di §6.
- **Baseline**:
  - `baseline_kind: png | screenshot | dom-region` — un campo, tre valori;
  - `baseline_frozen_at: <ruling-id>` — l'hash è stampato dal ruling che
    congela (in caso di A', dal secondo ruling);
  - `png` → sha256 del file immagine;
  - `screenshot` → sha256 dello screenshot canonico a viewport registrata
    (+ route/source state come evidenza di supporto);
  - `dom-region` → sha256 della serializzazione DOM/CSS canonica della regione
    (+ screenshot di supporto).
  - **La baseline si verifica sempre sul componente di produzione, mai sullo
    spike** (anti-circolarità, claude#10): lo screenshot dello spike è la
    baseline, il confronto avviene su ciò che entra nel tree.
- **Puntatore durevole**: quando l'opzione entra in produzione, provenance +
  hash della baseline vengono **promossi nel contract di ciascun componente
  della scope list** (stesso ruolo della provenance del mockup oggi). La card
  nella run è il record della decisione; i contract sono il riferimento perenne.
- **Due ledger separati** (W-06):
  - `amendments`: revisioni visive **approvate dal Director** dopo il ruling
    (verbatim + data). Solo queste spostano l'accettazione.
  - `incidental_deviations`: deviazioni **dichiarate dall'agente** a chiusura,
    non baseline-shifting. Il gate v33 legge entrambi: gli amendments come
    autorità, le deviazioni come disclosure.
  - **Materialità per asse**: una deviazione che cambia il valore di un asse
    compilato nella matrice (gerarchia, densità, overflow, ancoraggio token,
    fascia di complessità DOM) è **materiale** → STOP + ruling. Tutto il resto
    è cosmetico → incidental_deviations. La classificazione è contro gli assi
    scritti, non contro l'aggettivo del momento.

## 5. Superfici di preview (decise per-caso, registrate nella card)

In ordine di costo crescente — si usa la più economica sufficiente, con un
vincolo: **se un asse DOM-dipendente è selezionato nella matrice** (overflow,
testi localizzati lunghi, stati interattivi, responsive, reduced-motion
applicato), la superficie minima è la #2 — un PNG non può decidere un asse DOM.
Siccome gli assi si selezionano per-fork (§4), un fork di puro mood/materiale
può legittimamente restare su #1.

1. **Galleria statica di mockup**: PNG da pipeline `mockup-generator` serviti in
   una pagina HTML minima — per scelte di mood/silhouette/materiale.
2. **Harness statico**: pagina HTML/CSS isolata fuori dal tree di produzione
   (es. sotto `tests/fixtures/` o `.mw/runs/<run>/harness/` servita da static
   server), ancorata ai token skin reali — per scelte di layout/densità/overflow.
3. **Route lab nel dev server**: precedente `/bezel-variants` — quando la
   decisione dipende da stato, interazione o responsive reale. Le route spike
   vivono sotto un namespace lab dedicato (es. `/lab/*`), mai sotto le route di
   prodotto.

**Lifecycle dello spike** (W-05): #3 è codice, costruito come deliverable
**visual spike** dichiarato nella card, con destino esplicito:
- il plan/task che lo ospita dichiara `spike: promote | remove`;
- `remove` → il contratto di chiusura verifica l'assenza dei residui previsti
  (route, import, asset, voci di configurazione) e il bundle esclude le
  varianti scartate;
- `promote` → la promozione è un task del plan, non una comodità: lo spike
  passa per la stessa verifica del codice scritto ex novo;
- default in assenza di dichiarazione: `remove`.

**Chi costruisce le superfici:** #1-#2 sono artefatti dell'explorer (nessuna
modifica all'albero di produzione, stesso status degli altri artefatti di run).
#3 è lo spike sopra.

In tutti i casi la pagina è servita su `localhost` e **aperta
automaticamente nella Preview tab di Devin Desktop** (selettore elemento,
device size, console) — la scheda Preview è la superficie prevista dal
Director, non una finestra foreground esterna (ruling Director 2026-10-18).
Gli screenshot di evidenza restano headless.

## 6. INTENT_GATE_VISUAL_FORK in mw-planner

Se durante la pianificazione emerge un bivio visivo non anticipato:

1. **Stop**: niente task esecutivi che presuppongano una delle forme.
2. **Emissione blocco `INTENT_GATE_VISUAL_FORK`** con le alternative e la matrice
   della card (la card si genera qui se non esiste — artefatto di gate, non
   implementazione).
3. **Ruling Director** → il planner riprende **lo stesso draft** e finalizza il
   piano sulla sola opzione scelta, citando path+hash della baseline. Il draft
   sospeso non viene riscritto da zero; il `verification.json` si scrive dopo
   il ruling, quindi non invalida nulla (se esiste già un contratto — caso di
   revisione — il gate registra un bump di revisione del plan).
4. **`REJECT_ALL`** → il task torna a `mw-explorer` col feedback; nessun piano
   viene prodotto, il codice di produzione resta intatto.
   **Semantica del loop** (W-07): il secondo giro non ri-rolla la stessa
   famiglia — l'explorer deve (a) produrre almeno un'opzione di **sintesi**
   derivata dalle ragioni del rigetto verbatim, e (b) dichiarare quale **asse di
   variazione** cambia rispetto al giro precedente. Dopo 2 `reject_all` sullo
   stesso fork (un A' rigettato conta come voto), si scala al Director: vincoli
   scritti dal Director oppure reframing del fork — non un terzo giro identico.

**Marker obbligatorio e check meccanico** (W-01/W-08): un plan visivo (definizione
§3) **deve** citare per ogni decisione estetica la baseline (card + hash) oppure
`visual-fork: skipped — <motivo> — <puntatore>`.

- Il **check pre-battesimo v33** include: (a) grep del marker su ogni plan
  visivo, cross-checkato con i `files_touched` dei task; (b) una riga di
  checklist: ogni task visivo cita l'id dell'opzione selezionata e non porta
  elementi assenti dalla baseline.
- Il **check meccanico permanente** (T-006) estende `closure:lint` con due
  verifiche (W-11/W-12):
  1. *Superficie reale*: il check calcola i file visivi dal **diff reale del
     bundle** (glob §3). Un file visivo nel diff assente dai `files_touched`
     dichiarati → difetto del plan, chiusura fallita.
  2. *Copertura*: ogni file visivo nel diff deve ricadere sotto la scope list
     di una card citata **o** sotto uno skip puntato (il mapping file→card
     avviene via la dichiarazione task→file del plan; un file visivo non
     coperto da nessuna delle due → chiusura fallita).
  Il lint certifica **presenza + copertura dichiarata**, non la correttezza
  semantica dello skip o della scope list: quella resta al reviewer —
  onestà esplicita, stessa clausola di §3.
- L'assenza silenziosa è quindi un difetto **rilevabile meccanicamente**, non
  solo segnalabile.

## 7. Esecuzione e verifica

- `painter` **e** `mockup-generator` consumano la baseline selezionata come
  golden reference: provenance + hash nel contract di ogni componente della
  scope list (W-09 — entrambe le skill sono consumer della baseline).
- **Precedenza con v3 F3:** il fork decide *quale* opzione (≤3, mostrate al
  Director); dentro l'opzione selezionata, painter può ancora generare ≤4
  mockup candidate per scelte a livello di asset — **passo interno di painter,
  non ri-esposto al Director come opzioni** (regola v3 F3 invariata — livello
  diverso).
- **Contratto di confronto pre-registrato** (W-03/W-04): nei `verification.json`
  dei task visivi, scritto **al tempo del plan** e non editabile a chiusura:
  - per ogni asse misurabile selezionato: regione/proprietà osservata,
    condizione di confronto, tolleranza;
  - esito per asse: `PASS | FAIL | NOT_COMPARABLE` — NOT_COMPARABLE non è PASS
    e va risolto col giudizio umano;
  - le viewport/condizioni coperte = quelle registrate nella card (§4), non una
    matrice universale;
  - per baseline `png` → confronto strutturale/regionale pre-registrato, mai
    pixel-match; `screenshot`/`dom-region` → confronto stessa viewport e stato.
- **Artefatto diff per l'occhio** (gemini#5): per ogni plan visivo, l'obbligazione
  `human-eye` è accompagnata da un **artefatto side-by-side** (baseline vs
  implementazione, con regioni evidenziate dove meccanicamente possibile): il
  Director giudica su un confronto costruito per esporre le deviazioni, non su
  due schede aperte a memoria. L'occhio vince sulla metrica (§2); le deviazioni
  incidentali vanno comunque nel ledger.
- **Diritto di emendamento:** deviazione materiale (per-asse, §4) scoperta in
  implementazione → STOP + nuovo ruling (l'agente propone, il Director decide).
  Deviazioni cosmetiche → `incidental_deviations` a chiusura.
- **Exit unbuildable** (deepseek#13): se l'opzione selezionata risulta
  inattuabile dentro gli invarianti (budget WebView, reduced-motion, token
  skin), il fork si riapre citando l'invariante verbatim; l'opzione rigettata
  per infattibilità è registrata nel ledger con l'invariante citato. Nessun
  downgrade silenzioso.
- Chiusura: v31 (`verify:bundle` → `bundle.json` → `fatta`) + gate v33
  (intento vs desiderata+chiarimenti, incluso il ruling visivo verbatim e i
  due ledger).

## 8. Task

| Task | Contenuto | Verifica |
|---|---|---|
| T-001 | `mw-explorer` SKILL.md: sezione "Visual fork gate" — trigger, boundary effect-based (+aggregata, +incertezza), definizione plan visivo, 2/3 opzioni con provenance/anti-domination, card, preview surfaces (+regola assi DOM, spike lifecycle), ruling/reject_all+bound con sintesi | grep sezione + campi obbligatori |
| T-002 | `mw-planner` SKILL.md: `INTENT_GATE_VISUAL_FORK` (stop/emissione/ruling/resume/reject_all) + regola "baseline citata o skip puntato" + checklist pre-battesimo | grep gate + regole |
| T-003 | `painter` **e** `mockup-generator` SKILL.md: la baseline del fork selezionato è il golden reference; provenance+hash promossi nei contract della scope list; verifica vs baseline (contratto pre-registrato); artefatto side-by-side per human-eye; precedenza F3 interna | grep pre-flight/phase |
| T-004 | `.mw/templates/visual-fork/visual-fork-card.md` (template card §4: scope, condizioni, opzioni+provenance, matrice per-assi, ruling, baseline_kind/frozen_at, due ledger) + riga in `context/INDEX.md` | file exists + campi + index entry |
| T-005 | `AGENTS.md`: un bullet nel workflow Mind Weaver che nomina il gate; `plans/INDEX.md`: riga PLAN-047 | grep + `closure:lint` |
| T-006 | Check meccanico marker+copertura: estensione di `closure:lint` (o check invocato da esso) — (a) superficie visiva derivata dal **diff reale del bundle** vs `files_touched` dichiarati (file visivo nel diff non dichiarato = difetto); (b) ogni file visivo del diff coperto da scope list di card o skip puntato | test su plan finti: senza marker, con `files_touched` sotto-dichiarato, con file visivo fuori scope; `closure:lint` PASS su repo reale |
| T-007 | **Dry-run pre-landing**: una card sintetica compilata col template su dati reali R-214 (bezel variants come se fosse pre-plan): opzioni+provenance, matrice, ruling simulato, baseline hash. Costo: un artefatto, nessun codice | card esiste, tutti i campi obbligatori compilati, Director conferma di poter dare un ruling in <10 min |

Post-landing: primo task visivo reale che attiva il gate fa da pilot.
**Criterio di fallimento esplicito** (annotato in R-216): se nei primi due plan
visivi post-landing emerge uno skip senza puntatore verificabile, o un fork con
opzione dominata (nessun asse vinto), il gate si riapre (pattern `learn` →
`PROPOSALS.md`).

## 9. Contratto di chiusura (bozza — si raffina al battezzo)

- **OB-1** `state`: `mw-explorer` SKILL.md contiene la sezione gate con trigger
  effect-based, boundary+regola aggregata, formato card (scope/provenance/
  baseline_kind/due ledger), preview surfaces+spike lifecycle, percorso ruling.
- **OB-2** `state`: `mw-planner` SKILL.md contiene `INTENT_GATE_VISUAL_FORK`, la
  regola "baseline citata o skipped puntato", la checklist pre-battesimo e la
  semantica del loop reject_all (sintesi+asse di variazione+bound).
- **OB-3** `state`: `painter` e `mockup-generator` SKILL.md citano la baseline
  del fork come golden reference, il puntatore nei contract, il contratto di
  confronto pre-registrato e l'artefatto side-by-side per l'occhio.
- **OB-4** `state`: template card esiste con tutti i campi §4 + riga
  `context/INDEX.md`.
- **OB-5** `state`: `AGENTS.md` + `plans/INDEX.md` aggiornati.
- **OB-6** `state`: check meccanico T-006 esiste e fa fail-closed su (a)
  bundle visivo senza marker, (b) `files_touched` sotto-dichiarato, (c) file
  visivo fuori copertura card/skip (evidenza: run su plan finti) +
  `closure:lint` PASS sul repo reale.
- **OB-7** `state`: dry-run card T-007 prodotta e completa.
- **OB-8** `human-eye`: il Director rilegge le sezioni gate + la dry-run card e
  conferma che riflettono l'intento ("questo gate mi fa scegliere davvero" è
  giudizio umano, incluse le viewport di ruling registrate).

## 10. Desiderata v35 (FROZEN — Director 2026-10-18)

> *User-stated:* quando un task crea o modifica elementi grafici e sono
> possibili rappresentazioni materialmente diverse, l'agente non sceglie a
> priori: prepara opzioni (default 2, max 3) con documento comparativo e
> preview visibile; il Director seleziona o rigetta; il risultato finale è
> misurato rispetto all'opzione selezionata iniziale (baseline congelata +
> emendamenti approvati). Se non serve fork, l'agente dichiara lo skip con un
> puntatore verificabile.
>
> *AI inference (bozza):* il fork vive in esplorazione; fork scoperti in
> planning attivano `INTENT_GATE_VISUAL_FORK`; verifica ibrida con occhio
> prevalente sulla metrica (T-04); varianti scartate fuori dal tree di
> produzione (v31); preview = pagina servita su localhost aperta dal Director,
> mai apertura automatica (regola 16). v35 FROZEN resta autoritativa sulle
> skill: emendarla è un passo del Director, una skill che diverge è un difetto.

## 11. Decisioni del Director (tutte risolte 2026-10-18)

1. ~~Congelare la formulazione §10~~ — **v35 FROZEN** (Director 2026-10-18,
   incl. clausola skip puntato).
2. ~~Posizione card~~ — **risolta nel dibattito**: card in `.mw/runs/<run>/`
   (record della decisione) + puntatore provenance+hash promosso nel contract
   dei componenti a implementazione (referente perenne).
3. ~~Enforcement meccanico~~ — **risolta**: il check marker+copertura entra nel
   plan come T-006; **forma scelta dal Director 2026-10-18: estensione di
   `closure:lint`** (stesso punto di enforcement del gate R-189).
4. ~~Conferma default~~ — **confermati tutti dal Director 2026-10-18**: bound
   reject_all = 2 giri con opzione di sintesi obbligatoria al secondo giro;
   spike default `remove`; pilot post-landing con criterio di fallimento;
   dry-run T-007 pre-landing; cap opzioni = 3.
5. **Limite noto dichiarato** (claude#5, parzialmente irrisolvibile nei vincoli
   frozen): con max 3 opzioni per giro lo spazio di ricerca è piccolo; la
   mitigazione è la regola asse-di-variazione+sintesi, non l'aumento del cap.
   Il Director può comunque sempre dettare vincoli o chiedere più opzioni — il
   cap è un default dell'agente, non un limite al Director.
6. **Semantica T-006 "scope per plan"** (ruling Director 2026-10-18, primo
   incontro reale del gate: 20 file visivi di sessioni parallele nel diff
   worktree, tutti WIP pre-v35). La versione "ogni file visivo scoperto =
   errore" puniva il WIP altrui in worktree condiviso. Semantica v2: file
   visivo scoperto → **errore** se non dichiarato in alcun plan (omissione
   silenziosa) o se dichiarato in plan con `Desiderata: ≥v35`; → **warning
   transitorio** se dichiarato solo in plan pre-v35 (copertura dovuta alla
   chiusura di quel plan). Attribuzione: basename/path/prefisso `src/` ≥3
   segmenti (glob `**` mai attributivi) in `plans/*.md` + `docs/plans/*.md`.

## 12. Documentation Impact (regola 85)

**REQUIRED** — superfici: skill `mw-explorer`/`mw-planner`/`painter`/
`mockup-generator`, template `.mw/templates/visual-fork/`, `AGENTS.md`,
`context/INDEX.md`, `plans/INDEX.md`, `closure:lint` (estensione marker).
Routing: gli update stanno nei task T-001..T-007; nessun trusted/frozen
component toccato (nessun `*_trusted.md` da aggiornare).
