---
id: PLAN-136
title: Stash/magazzino — socket Eventi default, filtri in testata, alcove quadrate e scroll condizionale
status: active
request: R-391
date: 2026-11-26
baptized: 2026-11-26 Director «approvo, procedi»
surfaces: [/game, VillageStashPanel, roster header controls, Time bar sockets, HUD control vocabulary]
traps: [T-03, T-04, T-05, T-13, T-30, T-32, T-33]
contracts: [village-stash-panel (INV-3/INV-5 Mode B-amend; nuove INV Mode B-add), game-top-chrome (solo audit/alignment se i socket Tempo divergono), drag-test-container-v2 (header controls, audit/alignment)]
---

# PLAN-136 — Stash/magazzino: socket Eventi default, filtri in testata, alcove quadrate e scroll condizionale

## 1. Richiesta e baseline vincolanti

Raccordo successivo R-392: [PLAN-137](PLAN-137-hud-night-11.md) pianifica il passaggio dal look Eventi a Night 11. Restano validi i comportamenti e i derivati v1 di questo piano; non promuovere il vecchio socket come golden del nuovo look.

Richiesta Director R-391 (verbatim in `RICHIESTE.md`): i filtri devono usare la reference del pannello Eventi; lo stesso elemento vale per il pulsante di chiusura “X grande”; titolo solo `Stash`/`Magazzino`; filtri in testata a sinistra della chiusura; scrollbar laterale solo quando gli item superano quelli visibili; hover del bordo alcova colorato; frame delle alcove nella stessa famiglia/colore del controllo chiusura/filtri, eventualmente rigenerato da Gemini ma quadrato; niente scritta visibile sotto la griglia.

Reference preservate (regola 46):

- `.mw/specs/hud-real/refs/ref-round-filter-sockets-2026-11-26.png` sha256 `f64631afc7cb928e79970544d78572b5420573ec607cadf03eddb92a7163970f` — crop Director dei socket Eventi, reference corretta/default.
- `.mw/specs/hud-real/refs/stash-current-state-2026-11-26.png` sha256 `9723b328d74e211834ca0cf883da6f5db815dc1829217e7222fc20bdd8fa49ed` — stato attuale, baseline prima/dopo, non golden.
- Registrazione già annotata in `.mw/specs/hud-real/refs/REGISTERED.md` e cross-reference in `.mw/specs/hud-eventi/NOTES.md`.

`visual-fork: skipped — il Director ha già fornito la baseline vincolante dei socket e la trasformazione richiesta (round socket → square alcova); non ci sono alternative estetiche da scegliere per conto suo. L’eventuale asset quadrato rigenerato passa comunque un human-eye gate prima del montaggio.`

## 1bis. Critica multi-AI API non-web

Run richiesta dal Director: `.mw/runs/20261126-185450-plan136-multi-ai-api/` (nessun provider web, solo API). Artifact principali:

- `synthesis.md` — sintesi agente delle critiche accettate/respinte e degli emendamenti applicati.
- `critique-gemini.md`, `critique-groq-qwen.md`, `critique-groq-oss.md` — critiche dirette riuscite.
- `critique-openrouter.md` — vuoto, non usato.
- `cycle-01/A.md` + `drift-report.md` — tentativo `mw-iterative-deliberate`, terminato `EXTRACTION_SUSPECT`; non conta come convergenza.

Esito integrato: le critiche valide hanno reso il piano **deterministic-first** sugli asset, hanno chiarito la semantica empty-slot/scroll, hanno spostato round/square socket a `candidate` fino a gate tecnico+umano, hanno rafforzato hash/provenance/test e la gestione dei failure esterni. Sono state respinte le proposte di rimuovere living contracts, escludere Tempo/Roster o eliminare il human-eye gate perché contraddicono R-391/governance visuale.

## 2. Lettura dello stato attuale

1. `VillageStashPanel.tsx` usa oggi `data-ctl="round"` alimentato dagli asset `slicekit/controls/round-*.webp`: sono ring piatti oro/smalto, non identici ai socket incassati della reference Eventi.
2. Il roster di produzione (`MatericRosterComponentV2` → `DragTestContainerV2`) usa gli stessi `data-ctl="round"` per filtro/sort/chiusura, quindi eredita la stessa divergenza.
3. Il componente Tempo ha socket dipinti dentro `time/bar-slim.webp`; a prima vista appartengono già alla famiglia reference, ma il piano include un audit visivo/misurato: se divergono vanno corretti nella stessa passata, non lasciati “quasi uguali”.
4. Il backing `stash-frame-clean.webp` contiene pozzetti grigi e una scrollbar verticale **dipinti**. Questo viola due requisiti: le alcove devono avere frame della famiglia oro/socket e la scrollbar non può sparire quando non serve se è cotta nel backing.
5. I filtri kind sono attualmente sotto la griglia; la scritta helper read-only (`stash-mode-hint`) è visibile nella fascia bassa.

Conseguenza architetturale: non basta cambiare colore CSS. Per avere scroll corretto le alcove devono diventare DOM/asset vivo che scorre insieme agli item; il backing deve essere rigenerato o derivato **senza pozzetti e senza track**. Evitare toppe progressive (T-32): preferire rigenerazione pulita o una trasformazione documentata e gated, non patch CSS sopra patch.

## 3. Decisioni di design proposte

- **Controllo canonico “round socket”**: il socket dei filtri Eventi diventa il default visuale per controlli rotondi HUD (filtri, sort, close, piccoli comandi icona). È un controllo circolare incassato nero/verde con rim oro; stato attivo = glow verde, focus/hover = brightening/glow senza cambiare famiglia.
- **Stash title row**: titolo localizzato solo `Magazzino` / `Stash`; gruppo filtri in testata immediatamente a sinistra del close; close usa lo stesso socket, più grande delle icone filtro e con glifo `cmd-close` leggibile.
- **Alcove**: ogni cella è un socket quadrato nella stessa materia del round socket (rim oro, interno scuro/laccato). La forma è quadrata, non un secondo box annidato: il socket è la cella. Asset statico e stati interattivi sono separati: il file contiene il socket neutro; hover/focus/selected sono effetti DOM/CSS misurabili, come nel pannello Eventi.
- **Scroll**: nessuna track visibile a riposo. La capacità visibile è misurata dalla geometria reale della viewport (colonne × righe interamente visibili, ricalcolata con `ResizeObserver`). La track/thumb appare solo se `filteredItems.length > visibleCapacity`; gli empty slot decorativi di riempimento non contano come overflow e non devono mai attivarla. Sparisce quando filtro o quantità rientrano.
- **Niente scritta bassa**: rimuovere tutte le scritte visibili sotto la griglia (`openHint`, `notReady`, `bagFullHint`, `elsewhere`). Restano annunci screen-reader/live-region e tooltip semantici, mai testo painted o helper visivo nel footer.
- **Nessuna regressione comportamentale**: dual-mode ledger, click-to-assign, disponibilità derivata, tooltip condiviso e filtro kind restano identici; questo piano è visuale/layout, non riscrive la logica stash. Il test di hit/click esistente va però rieseguito perché dimensioni e posizione dei controlli cambiano.

## 4. Task

### T1 — Canonical round socket asset + audit superfici

- Creare script riproducibile `scripts/hud-real/build-round-socket-control.py` che estrae/deriva il socket circolare **in modo deterministico** dalla slice sorgente Eventi (`events/panel-bodytop.webp` o dalla reference registrata se più pulita), con alpha circolare e output `round-socket-normal.webp`.
- L’asset è solo il socket neutro. Hover/selected/focus/disabled restano effetti DOM/CSS misurabili, salvo evidenza contraria nel pannello Eventi; non generare stati raster ridondanti.
- Salvare spec/recipe in `.mw/specs/hud-real/specs/round-socket.json` (NON in `scripts/hud-real/specs/`: quella directory è scansionata dal slice-audit, che si aspetterebbe ricevute di slicing per asset non slicati — emendamento in esecuzione 2026-11-26); registrare il pezzo in `src/config/hud/pieces.json` come `round-socket-events-v1` con status **`candidate`**. Diventa `baptized` solo dopo gate tecnico (hash, alpha/bounding box, palette) + human-eye; la reference concettuale è battezzata, il derivato non lo è automaticamente.
- Audit visivo/misurato dei socket Tempo vs reference: screenshot headless crop + confronto dimensioni/palette/forma. Se già coerenti, documentare “conforme”. Se divergono, correggerli perché R-391 lo richiede esplicitamente, ma come sotto-task separato con contratto aggiornato e witness dedicato: niente ritocco silenzioso dentro la passata stash.
- Aggiornare `skinScope.css` in modo che `data-ctl="round"` usi il nuovo socket canonico, con dimensioni configurate e senza reintrodurre il vecchio ring piatto.
- Test permanente: un test DOM/asset che fallisce se `data-ctl="round"` torna a puntare ai vecchi `slicekit/controls/round-*.webp`, se manca il pezzo canonico registrato o se manca provenance/sha nel manifest dei pezzi.

### T2 — Backing stash senza celle/scroll dipinti

- **Deterministic-first**: creare `scripts/hud-real/clean-stash-backing.py` che rimuove integralmente pozzetti e track dalla zona shelf di `stash-frame-clean.webp` tramite maschera dichiarata + inpainting/sintesi dai pixel neutri adiacenti. Il frame esterno, il chest medallion, le coordinate e l’aspect devono restare invariati.
- Gate automatico: dimensioni/aspect invariati; maschera pozzetti/track azzerata; niente testo dipinto aggiunto; niente spostamento delle coordinate della cornice esterna; output con sha/provenance registrato.
- Solo se il risultato deterministico fallisce il gate tecnico o umano, usare Gemini image-edit come **fallback vincolato**: stesso frame ornato e chest medallion, senza pozzetti/track/testo, massimo **2 iterazioni**. Oltre il budget ci si ferma e si chiede ruling, non si accumulano patch seriali.
- Registrare generator/prompt/asset in `.mw/specs/hud-real/` e nel piece/spec appropriato; mantenere intatto il backing precedente come reference storica, mai overwrite distruttivo.

### T3 — Square alcove socket asset

- **Deterministic-first**: creare `scripts/hud-real/build-square-socket.py` che compone il socket quadrato dai materiali/palette del round socket canonico (oro rim, interno scuro/laccato) su maschera quadrata con angoli autoriali misurati; output pulito su alpha. Valutare 9-slice/border-image solo se serve scalabilità; le celle attuali sono a dimensione fissa, quindi un asset fixed-size è ammesso se non introduce tagli durante scroll/resize.
- Il file è il socket neutro. Hover/focus = stato DOM/CSS sul bordo/glow, testabile via classe/computed style; non rasterizzare una variante hover salvo necessità visiva dimostrata.
- Solo se il derivato deterministico non raggiunge la materia della reference, usare Gemini image-edit vincolato alla reference round (`ref-round-filter-sockets-2026-11-26.png`) come fallback, massimo **2 iterazioni**; poi human-eye e stop/ruling.
- Gate tecnico prima del montaggio: alpha pulita, bounding box stabile, palette/ΔE coerente col round socket entro soglia dichiarata, assenza di testo/artefatti. Human-eye gate sul quadrato prima del montaggio resta obbligatorio.
- Asset finale `square-socket-*.webp`, spec/generator preservati, entry `square-socket-events-v1` in `pieces.json` come **`candidate`**; promozione a `baptized` solo dopo approvazione Director/human-eye e witness montato.

### T4 — Layout e comportamento dello Stash

- Testata: titolo solo `t('gameFrame.stash.title')` con i18n aggiornata (`Magazzino` / `Stash`); filtri kind spostati in testata a sinistra del close; ordine finale `[title] [spacer] [filters] [close]`.
- Close: stesso round socket canonico, dimensione maggiore dei filtri (“X grande”), icona `cmd-close`, aria/title invariati.
- Griglia: rimuovere la dipendenza dai pozzetti dipinti. Ogni cella DOM usa il square socket come sfondo/frame. Se `filteredItems.length <= visibleCapacity`, renderizzare item reali + empty slot fino alla capacità visibile per preservare l’aspetto a griglia piena; se gli item superano la capacità, gli empty slot servono solo a completare l’ultima riga e non contano ai fini overflow.
- Scroll: calcolare `visibleCapacity` da colonne e righe interamente visibili via layout misurato/`ResizeObserver`; renderizzare track/thumb solo se `filteredItems.length > visibleCapacity`. La thumb segue `scrollTop`; filtri e resize ricalcolano. Nessuna track dipinta nel backing e nessuna track invisibile quando non c’è overflow.
- Accessibilità scroll: quando overflow esiste, la regione scrollabile resta utilizzabile da tastiera e la track/thumb non cattura focus inutilmente; quando overflow non esiste non ci devono essere controlli fantasma né annunci ingannevoli.
- Hover/focus cella: stato visivo sul bordo/frame dello square socket (glow/colore) sia mouse sia keyboard focus; assertion primaria su classe/data-state/computed style, con screenshot come witness secondario. Ridotto/neutro su read-only ma comunque percepibile se la cella è ispezionabile.
- Footer: eliminare le scritte visibili `stash-mode-hint`, `stash-bag-full-hint`, `stash-elsewhere`; mantenere live-region sr-only per annunci ledger e tooltip item.
- Non cambiare autorità dati: `useVillageStashStore`, `bagAssignEligibility`, tooltip condiviso e click-to-assign restano le uniche fonti.

### T5 — Allineamento roster/tempo/documentazione default

- Roster (`DragTestContainerV2` header): verificare che filtro/sort/direction/close ereditino il nuovo `data-ctl="round"`; correggere dimensioni/colore/icona solo se l’eredità non basta. Preferire eredità passiva/CSS globale; nessuna fork visuale separata e nessuna riscrittura del componente roster.
- Tempo: applicare l’esito dell’audit T1. Se i socket dipinti nella barra non sono identici alla reference, correggere l’asset o la geometria perché richiesto da R-391, ma in sotto-task separato con witness e contratto dichiarato; non mutare il medaglione sole/luna R-380/R-390.
- Documentazione “default element”: aggiornare la documentazione viva canonica (`src/config/hud/charters.ts`, contratto `.mw/contracts/components/village-stash-panel.md`, eventuali trusted docs/spec HUD vigenti). Non riscrivere piani chiusi come PLAN-129: il piano resta storia, la fonte viva sono charter/contratti/spec. La frase contrattuale deve dire che il socket Eventi è il controllo round default per filtri/chiusura su stash, roster e tempo.
- i18n: aggiornare `public/locales/en/idleVillage.json`, `it-IT`, `pseudo` e tipi generati se richiesto dal workflow i18n; niente stringhe hardcoded. Aggiungere una verifica mirata sulle chiave stash toccate; i failure i18n globali preesistenti vanno registrati come debito parallelo, non corretti fuori scope.

### T6 — Regressioni permanenti e witness

- Red-first prima del fix: test che falliscono sullo stato attuale per:
  - filtri assenti dalla testata/ancora sotto la griglia;
  - titolo diverso da `Magazzino`/`Stash`;
  - presenza di testo visivo nel footer;
  - track visibile quando `filteredItems.length <= visibleCapacity`;
  - track assente quando `filteredItems.length > visibleCapacity`;
  - frame alcova non associato al pezzo square canonico;
  - `data-ctl="round"` non associato al pezzo round canonico.
- Aggiornare/scrivere test permanenti in `tests/unit/idleVillage/r353StashGrid.test.tsx`, `villageStash.test.tsx`, e un test mirato roster/control vocabulary; tag `// INV:` dove il contratto vivo lo richiede.
- Test hover/focus con pseudo-interazione reale o classe di stato: assertare `data-state`/classe/computed style, non solo screenshot. Test click/close e click-to-assign per confermare che il cambio dimensioni/hit-area non ha rotto il comportamento.
- Test asset/provenance: manifest/sha presenti per round e square socket; script riproducibili esistono; output non punta ai vecchi ring; niente asset `candidate` montato in produzione dopo la chiusura senza promozione documentata.
- Witness runtime headless su `/game` (mai finestre in primo piano): stato chiuso/aperto stash, hover cella, filtro attivo, caso `<= visibleCapacity` senza scroll, caso `> visibleCapacity` con scroll, prima/dopo a pari viewport. Montaggio square grid 2×2 o 3×3 secondo regola visual-artifacts.
- Se serve un seed temporaneo per superare la capacità visibile, usarlo solo in test/lab o mock store, non alterare la config produzione solo per screenshot.

## 5. Living contracts e classificazione

- `village-stash-panel.INV-3` — **Mode B-amend**, autorizzato da R-391: cambia posizione/forma dei filtri (da sotto griglia a testata), titolo e composizione celle. `redfirst:retire` per gli assertion obsoleti, poi nuovi test.
- `village-stash-panel.INV-5` — **Mode B-amend**, autorizzato da R-391: il backing non può più contenere pozzetti/scroll dipinti; la cornice resta ma la shelf diventa DOM viva.
- Nuove invarianti — **Mode B-add**:
  - filtri kind in testata a sinistra del close;
  - track scroll solo su overflow reale;
  - nessuna scritta visiva sotto la griglia;
  - square alcove socket + hover/focus state;
  - round socket Eventi default condiviso da stash/roster/tempo.
- `drag-test-container-v2` e `game-top-chrome`: prima audit. Se il cambio è solo eredità visiva dello stesso controllo o conformità documentale, classificazione **Mode C/Auto-Neutral**; se si muta comportamento o asset coperto da INV, dichiarare Mode B-amend con R-391 prima del fix.

## 6. Contratto di chiusura

`.mw/runs/plan136-stash-round-sockets/verification.json` → `npm run verify:bundle` → `bundle.json`, citato dalla voce `fatta` di R-391.

| id | tipo | blocca | verifica |
|---|---|---|---|
| OB-1 | state | sì | test regressione stash aggiornati verdi (`r353StashGrid`, `villageStash`, test scroll/hover/testata) con red-first registrato |
| OB-2 | state | sì | test control vocabulary/roster + asset provenance verdi: `data-ctl="round"` punta al pezzo canonico, sha/manifest presenti, niente ritorno ai vecchi asset |
| OB-3 | evidence | sì | witness headless prima/dopo a pari viewport: filtri in testata, close socket, alcove quadrate, hover visibile, footer senza scritte |
| OB-4 | evidence | sì | witness headless dei due casi scroll: senza overflow nessuna track; con overflow track/thumb presente e funzionale |
| OB-5 | human-eye | sì | approvazione Director del socket quadrato e del pannello finale montato dopo passaggio dei gate tecnici asset/layout; eventuale scarto documentato e iterato entro budget |
| OB-6 | state | sì | `npm run lint -- <scope>`, `npm run test -- <scope>`, `npm run build:check`, `npm run closure:lint` entro timeout; baseline/alien failures registrati in `verification.json` con file/autore/mtime quando preesistenti, senza correggere lavoro parallelo |
| OB-7 | state | sì | documentazione aggiornata: contratto stash, charter/vocabolario HUD, REGISTERED refs, i18n/tipi; `governance:check` o blocco preesistente esplicitamente attribuito |

## 7. Rischi e confini

- Worktree molto sporco e sessioni parallele attive: nessun commit scoped, nessuna “correzione” di failure fuori scope; mtime/autore prima di interpretare un rosso (T-13).
- Non toccare la logica ledger/quest/planner né il medaglione Tempo R-380/R-390.
- Non aprire finestre in primo piano: probe, screenshot e verifiche sempre headless/background.
- Non usare `cqw` indiscriminatamente contro la guidance slice-kit: la geometria del backing può restare proporzionale, ma testo/controlli devono rispettare floor e leggibilità.
- La generazione Gemini del backing o del quadrato è solo fallback dopo il tentativo deterministico: massimo 2 iterazioni per asset, poi stop e ruling. Non è una licenza a patch seriali.
- Le critiche multi-AI che chiedevano di escludere Tempo/Roster o rimuovere i living contracts sono state respinte perché contraddicono R-391 e la governance visuale; il rischio si riduce con audit separato e witness, non cancellando il requisito.
