# PROPOSALS

Candidati a regola. **Non sono canone**: li promuove solo il Director (`CANON.md` / `AGENTS.md` non si toccano da qui).
Soglia: pattern visto in almeno due contesti distinti o in due sessioni diverse.

## P-001 — Un claim di successo ha bisogno di un testimone che possa vedere, e di un blocco di chiusura (2026-10-14)

**Stato:** proposta, in attesa del Director.
**Pattern:** `.mw/runs/20261014-094734-invasion-verification/pattern-candidate.md` §1.
**Istanze (3 contesti):** R-056 mare 2026-09 · R-177 2026-10-08 · invasione `/game` 2026-10-13/14 (`.mw/bugs/20261014-verification-false-pass/bug.md`).
**Già coperto in parte da:** `context/recurring-traps.md` T-04 (claim percettivi: occhio nel browser reale, non solo metrica).

**Cosa si propone di aggiungere a T-04 (3ª istanza):**
1. Il testimone deve *poter* vedere ciò che si afferma. Browser pane `hidden` non lo è per animazioni; Playwright headless con frame sampling e contact sheet sì.
2. Dove il testimone non esiste, l'unico stato ammesso è `NON VERIFICATO`; un controllo che non ha girato è `NON ESEGUITO` (es. `tsc` fermo su errori di sintassi altrui).
3. Blocco di chiusura obbligatorio per modifiche a scene/animazioni: `Richiesto / Verificato con / NON verificato / Anomalie osservate`.
4. Un'anomalia osservata ha un esito, non una nota.

**Applicato 2026-10-14 (Director: «procedi, tocca entrambi»):** pointer al pre-flight delle trappole, valido anche senza invocare skill, in `AGENTS.md` (Workflow) e `CLAUDE.md`. Il testo delle clausole 1-4 in T-04 **non** è stato modificato: resta in attesa.

**Gap che il pointer affronta (1 istanza):** il pre-flight non scatta se non si invoca `mw-executor` — vedi pattern 2 e decisioni 1-2 del piano `.mw/plans/verification-false-pass-prevention.md`.

## P-002 — Sessioni parallele sullo stesso worktree: lo stato condiviso rompe le tue prove, non il tuo codice (2026-10-16)

**Stato:** **applicata** (Director «procedi» 2026-10-16) — operativa come T-13 in `context/recurring-traps.md` (letta in pre-flight via indice per superficie) + clausola esplicita in `AGENTS.md` §Workflow (sospetto-collisione su failure, mai commit scoped su worktree condiviso).
**Pattern:** `.mw/runs/learn-r199-20261016-092815/pattern-candidate.md` §A.
**Istanze (5+ contesti, una settimana):** verifier.json estraneo nella run dir di R-196 (hash stantii → BLOCKED) · kanban rosso su righe/bundle a metà scrittura di PLAN-035, R-198, R-202 · `safeguards.log` FORGED dopo il bundling · dev server killato mid-probe (`ERR_CONNECTION_REFUSED`) · HMR full-reload da edit paralleli → `Execution context destroyed` e hook test transienti in Playwright · `build:check` timeout sotto carico altrui.

**Cosa si propone (nuova trappola T-13 in `context/recurring-traps.md`):**
1. Su fallimento di safeguard/probe, prima `ls -la` su run dir e righe coinvolte: mtime recenti + autore diverso = collisione da riprovare, non bug da fixare.
2. Mai "aggiustare" righe/bundle/log di sessioni altrui (scrittura che collide con lavoro a metà); hash drift → `produceBundle --no-exec` invece di riesecuzione.
3. Probe riprovabili: flusso wrappato in retry+reload, resume su stato persistito (`getRun()` esiste → salta il launch), selettori-unione per superfici alternative, guard `?.` su `window.__idleVillageTestHooks` durante HMR.
4. Nessun commit scoped su worktree condiviso — le modifiche delle altre sessioni verrebbero catturate.

**Perché ora:** il ritorno del multi-agente (R-204: harness wave parallele, coordinator, agenti esterni) rende la coesistenza sistemica, non eccezione — la regola preventiva serve in pre-flight, non a posteriori.

## P-003 — Driver E2E contro un contratto mobile: testid/affordance/timing cambiano a ogni piano, e i driver mentono in silenzio (2026-10-16)

**Stato:** approvata dal Director (2026-10-16) → promossa a trappola T-14 in `context/recurring-traps.md`.
**Pattern:** `.mw/runs/learn-r200-20261016-114500/pattern-candidate.md` §2 + `.mw/runs/learn-r199-20261016-092815/pattern-candidate.md` (engine-semantics-vs-test-driver-clock).
**Istanze (3 contesti distinti, stessa famiglia):** R-199 — il gate `readyAt` su `submitCommand` ha rotto 5 file di test: i driver passavano tick stantii → comandi rifiutati in silenzio, run mai terminate · PLAN-040 T-003 — l'astrolabe è migrato da `quest-check-astrolabe` (docked) a `quest-check-overlay` in `#game-modal-root`: il selettore del driver non matchava più nulla, il check beat restava in hold 45s (`checkHoldMs`) invece di fallire chiaro · PLAN-040 chiusura — `generatedCatalog.bench`: il predicato `reachableFrom` seguiva 2 archi su 4 dell'engine (mancavano `node.next` e `combat.nextCleared`/`nextSurvivors`) → 22 falsi orfani deterministici; stessa famiglia lato unit-test: la prova statica resta indietro quando il contratto del grafo cresce.

**Cosa si propone (trappola T-14 in `context/recurring-traps.md`):**
1. Prima di fidarsi di un driver dopo un atterraggio parallelo, grep dei selettori/hook usati vs `src/` — un match zero è contratto cambiato, non bug di prodotto.
2. Scrivere i driver su affordance **semantiche e version-tolleranti** (`.da-tira`, `aria-label`, `data-drop-state`, hook `getRun`) con fallback, non su testid posizionali di una singola rev.
3. Un driver che fallisce deve produrre un errore diagnostico entro secondi, non attendere il timeout della guardia (45s di `checkHoldMs` mascherano un selettore morto): asserire "il controllo atteso esiste" prima di usarlo in loop.
4. Quando un contratto UI cambia, aggiornare nella stessa sessione **guida + selettori tabella + fallimenti noti** (`e2e_game_quest_lifecycle_guide.md`): la doc stale è il punto in cui il churn diventa invisibile.

**Perché ora:** con più piani in volo (R-199, PLAN-040, R-202) le affordance migrano di DOM-layer a ogni rev; senza disciplina i test E2E producono falsi verdi/falsi stalli più veloci di quanto si possa diagnosticare.

## P-004 — `page.evaluate(fn)` sotto tsx/esbuild: la closure non esiste nel browser (2026-10-16)

**Stato:** approvata dal Director (2026-10-16) → promossa a trappola T-15 in `context/recurring-traps.md`.
**Pattern:** `.mw/runs/learn-plan040-20261016-145000/pattern-candidate.md` §1.
**Istanze (2 contesti distinti):** `scripts/quest-theatre-playtest.ts` — nota inline già presente ("tsx compiles inner functions with helpers that don't exist in the browser") · `scripts/verification/attestEnv.ts` — helper R-189 con `page.evaluate(async () => {...})`: sotto tsx produceva `env: null` + `samples: []` silenziosi → INVALID_ENV su 5 obbligazioni del bundle PLAN-040.

**Cosa si propone (trappola T-15 in `context/recurring-traps.md`):**
1. `page.evaluate` riceve solo **sorgenti stringa** (`page.evaluate(SRC)`), mai closure, in qualsiasi script che possa girare sotto tsx/esbuild (`keepNames` wrappa le funzioni con `__name`, assente nel contesto pagina).
2. Un attestato fallito deve fallire rumoroso (`env: null` → errore esplicito del probe), non propagarsi come dato nullo fino al gate.
3. Fix già applicato a `attestEnv.ts` (DOM_PROBE_SRC/PROBE_INJECT_SRC/PROBE_REMOVE_SRC) — serve la regola per gli script futuri.

## P-005 — `vite preview` serve una build statica: il bundle stantio mente come un bug nel codice (2026-10-17)

**Stato:** proposta — 2 contesti distinti in una settimana.
**Pattern:** `.mw/runs/20261017-learn-ws0ws1-slot-drag-evidence/pattern-candidate.md` §"stale-preview-bundle".
**Istanze (2 contesti distinti):** (1) WS-0+WS-1 — `[swapdbg]` log emessi dal bundle :5179 ma rimossi dal sorgente: la suite falliva su un path già riscritto, diagnosi su codice fantasma finché `dist-playwright` non è stata ribuildata (dpr2 capture verde subito dopo). (2) WS-2 probe-port-collision — server preview su porta condivisa, pkill di un probe parallelo uccide il server della `verify:bundle` (exit_code=null su OB-03); cfr. observation.jsonl.

**Cosa si propone (trappola candidata, es. T-16):**
1. Prima di diagnosticare un failure su `vite preview`: `curl -s localhost:<port>/game | grep -o 'src/main.tsx\|assets/index-[A-Za-z0-9_-]*\.js'` — `src/main.tsx` = dev vivo, `assets/index-*.js` = build (confronta mtime con l'ultimo edit sorgente).
2. `preview:playwright` va ribuildato dopo OGNI edit sorgente toccato dalla prova; mai diagnosticare su un bundle la cui età non hai verificato.
3. Probe/spec usa una porta dedicata e dichiarata (`CAPTURE_BASE_URL`), mai la porta del bundle/verify condivisa.


## P-006 — La root servita deve essere l'artefatto, non la `index.html` di vite (2026-10-20)

**Stato:** proposta — 2 contesti distinti (stessa famiglia di P-005: «la superficie nel browser non è ciò che credi», meccanismo diverso).
**Istanze:** (1) `learn-plan047-preview` — `browser_preview` path-scoped: il proxy serve la `index.html` per gli asset → pagina bianca; fix usato: registrazione sulla ROOT + redirect-stub. (2) 2026-10-20 — `python3 -m http.server` sulla root del repo: serve la `index.html` di vite (moduli TSX irrisolvibili) → pagina bianca nella sidebar; fix usato: `--directory .mw/review/<round>/` + symlink per gli asset fuori albero. Entrambe: l'URL che l'utente apre deve risolvere **l'artefatto**, non la entry dell'app.

**Cosa si propone (trappola candidata):**
1. Prima di consegnare un URL al Director (preview, statico, lab): `curl -s <url>/` deve mostrare il markup dell'artefatto — se risponde `<script type="module" src="/src/main.tsx">` è la entry vite → pagina bianca garantita.
2. Server statici per artefatti: sempre `--directory <dir-dell-artefatto>` + symlink per asset esterni (http.server li segue); mai la root del repo.
3. Test dell'artefatto attraverso lo **stesso layer dell'utente** (DOM montato via proxy/screenshot headless), non solo `200` upstream.
4. Corollario (istanza odierna): «la pagina si aggiorna di continuo» su worktree condiviso = vite HMR che segue le scritture di sessioni parallele — verificare `find src -newermt` prima di diagnosticare; per test Director servire snapshot congelato (build + preview su porta dedicata) o la review page statica.

## P-007 — La metrica percettiva presa sull'ambiente sbagliato mente: preview ≠ dev server (2026-10-21)

**Stato:** **promossa → T-22** (`context/recurring-traps.md`, 2026-10-21, ruling Director «procedi»). 3+ contesti distinti nella stessa famiglia («il layer di verifica non è il layer dell'utente»): P-005 (bundle stantio, stato sbagliato), learn-20261020-2115 A (HMR churn, superficie in movimento), R-238 (ambiente sbagliato, timing non trasferibile).
**Pattern:** `.mw/runs/learn-20261021-1404/pattern-candidate.md` §A.
**Istanza:** R-238 Bug A — suite E2E su `vite preview` (build minificata) misurava pointerdown→medaglione 376-431 ms e passava; sul dev server :5173 usato dal Director lo stesso gesto costava 510-732 ms (`jsxDEV` ~5.5 s self-time, `startTransition` a bassa priorità, re-render pagina). Il test era verde sull'ambiente sbagliato e misurava un marker DOM anziché il paint percepito.

**Cosa si propone (estensione della famiglia P-005):**
1. Per bug di **latenza/percezione** la misura va presa sul runtime che esibisce il sintomo (dev server se il Director lavora lì); il preview build resta il runner della suite, ma la diagnosi e il signoff si fanno sul runtime dell'utente.
2. Misura l'elemento che l'utente vede, non il marker DOM più precoce disponibile — o fai coincidere i due (stesso `data-debug-*` sul nodo realmente visibile).
3. «Il test è verde ma il sintomo resta» non è un falso positivo da archiviare: è la discrepanza che indica il divario di layer — investiga dove i due ambienti divergono (instrumentation, scheduling, build).
4. Corollario tecnico (pattern B della stessa run): quando il commit React è il collo di bottiglia della latenza percepita, il feedback può comparire via DOM diretto sul subtree warm-mounted e cedere al vero render in `useLayoutEffect` pre-paint — handoff seamless, nessun re-render per la comparsa.

## P-008 — `localhost` risolve su due famiglie IP: un dev server bound su una sola produce «Failed to fetch» latched (2026-10-23)

**Stato:** proposta — 2 istanze nello stesso giorno (R-276 mattina e sera), stessa firma utente.
**Pattern:** `.mw/runs/learn-20261023-dynamic-import-latch/pattern-candidate.md`.
**Fix già applicato (config, non regola):** `server.host: '127.0.0.1'` in `vite.config.ts`.

**Cosa si propone (trappola candidata, famiglia T-17):**
1. Su `Failed to fetch dynamically imported module: …?t=<n>`: decodificare `t` (epoch-ms → `date -r`) e incrociare con le mtime dei file salvati in quel minuto — il modulo nominato è il top-level dell'`import()`, non il colpevole.
2. Verificare il bind, non solo la risposta: `curl -4` e `curl -6` su `localhost` — una famiglia refused mentre il browser può averla in cache = asimmetria da fixare sul `server.host`, non sul codice.
3. «Persistente nella tab» ≠ «persistente sul server»: l'`ErrorBoundary` latcha il transiente; il test di verità è un **contesto browser fresco**, non il reload ragionato.
4. Mitigazione opzionale da valutare: auto-reload una-tantum in `ErrorBoundary` sulla classe «dynamically imported module»/ChunkLoadError — nessuna modifica fatta, serve ruling Director.

**Nota operativa appresa:** `nvm use` può dichiarare successo lasciando `node` alla versione cache-hashed della shell — `hash -r` prima di riavviare processi pinati.


## P-009 — REF-CLEAN: la style-reference va ispezionata per firme/difetti prima dell'attach (2026-10-25)

Seconda occorrenza (prima: 2026-10-24 sessione goblin — già in
`observation.jsonl`). La kill-list del prompt non copre difetti presenti
nella reference: firma dipinta, watermark, bordo. Proposta: preflight
meccanico sulle ref — crop/scan dei 4 corner per testo/firme, e veto su ref
"sporche" nel pipeline di generazione. Oggi: regola manuale in
`scene_prompt_form.md` + trappola T-27. Un checker d'angolo (OCR-lite o
contrasto-localizzato) lo renderebbe automatico.
