All'inizio di ogni sessione: leggi `CANON.md`, `CURRENT_STATE.md`, `DESIGN_PILLARS.md`, `context/DECISION_LOG.md`, `RICHIESTE.md`, `.mw/desiderata.md` e `context/INDEX.md` (se esiste).

## Cosa sono, e cosa non sono

- **`CANON.md` — la mappa delle autorità.** Quale documento decide cosa per ciascun
  tipo di scelta. Non sostituisce i documenti che elenca.
- **`CURRENT_STATE.md` — lo stato attuale.** Fotografia temporale di cosa è implementato,
  in corso, progettato, bloccato o deprecato.
- **`DESIGN_PILLARS.md` — la direzione.** I riferimenti d'ispirazione del gioco e le scelte
  concrete di gameplay/UI/visual che ne derivano. Il file dice di sé stesso di essere *"la lente
  con cui controllare: è coerente con i pillar?"*.
- **`context/DECISION_LOG.md` — la storia.** Le decisioni prese e il perché.
- **`RICHIESTE.md` — le richieste esplicite.** Ciò che Fausto ha chiesto, con le sue parole. Le voci
  `aperta` e `in corso` sono lavoro impegnato.
- **`.mw/desiderata.md` — desiderata FROZEN.** Decisioni di intento approvate; il workflow parte da qui.
- **`context/INDEX.md` — catalogo contesto.** Indice dei documenti caldi del progetto, da consultare
  quando serve.

Questo progetto ha `CANON.md` come mappa delle autorità; fino a una revisione esplicita, ogni documento elencato qui conserva il proprio ruolo. Direzione e storia non sono la stessa cosa di un vincolo, e non vanno trattate come tale.

## Workflow Mind Weaver in RPG

- **Ciclo operativo (R-208, 2026-10-16):** kanban board e dispatch
  (coordinator/ai-worker/harness, prompt-spec) sono **in pausa**. Il flusso è:
  plan con contratto (obbligazioni verificabili) → implementazione con
  l'agente locale → `verify:bundle` sul contratto → chiusura `fatta` in
  `RICHIESTE.md` con `bundle:`. Il gate meccanico è `npm run closure:lint`
  (ex `kanban:lint`, solo gate R-189). Niente righe su
  `src/docs/docs/coordinator/agent_assignments.md`.
- **Fase esplorativa:** invoca `.windsurf/skills/mw-explorer/SKILL.md`.
- **Fase di pianificazione:** invoca `.windsurf/skills/mw-planner/SKILL.md`.
- **Fase esecutiva:** invoca `.windsurf/skills/mw-executor/SKILL.md`, che a sua volta carica il
  mandato `.windsurf/skills/agent-execution-mandate/SKILL.md` per i task specifici di RPG.
- **Prima di toccare codice esistente:** invoca `.windsurf/skills/mw-regression/SKILL.md`.
- **Pre-flight delle trappole ricorrenti — anche senza invocare nessuna skill.** Una richiesta diretta
  («fixa X», «cambia Y») non passa da `mw-executor`, quindi il pre-flight non scatterebbe: prima di toccare
  codice leggi l'indice per superficie di `context/recurring-traps.md` e le trappole che il task tocca; prima di
  dichiarare il lavoro fatto, riapplicale. In particolare T-04: un claim su scene, animazioni o UI si chiude solo
  con un testimone che può vedere ciò che afferma (non basta il diff né una metrica), e ciò che non è stato
  verificato va detto (vedi la proposta P-001 in `PROPOSALS.md`). Se altre sessioni lavorano sullo
  stesso worktree, applica anche T-13: un failure di safeguard/probe va prima sospettato come
  collisione di stato condiviso (mtime + autore), non come bug nel tuo scope — riprova prima di
  intervenire, e mai commit scoped che catturerebbe lavoro altrui (vedi P-002 in `PROPOSALS.md`).
- **Mai aprire finestre, app o browser in primo piano in automatico.** Ogni esecuzione
  automatizzata è headless o in background (Puppeteer/Chrome for Testing, Playwright,
  screenshot, probe perf, `open` solo con `-g`). Una finestra visibile richiede opt-in
  esplicito del Director in sessione — invariante `.windsurf/rules/16-no-foreground-windows.md`
  (ruling 2026-10-15, già CTR-foreground-001 in Mind Weaver).
- Quando il Director esprime un'intenzione operativa, catturala in `RICHIESTE.md` prima di rispondere.
  Il riferimento deve essere `.mw/desiderata.md` v1 (FROZEN).

## Riferimenti operativi Mind Weaver in RPG

- **Python runtime multi-AI:** `RPG/.mw/venv/bin/python` (symlink al venv di `mind-weaver`).
- **Script multi-AI:** `RPG/scripts/mw-ask.py`, `RPG/scripts/mw-iterative-deliberate.py`,
  `RPG/scripts/mw-broadcast.py`, `RPG/scripts/mw-critique-plan.py`, ecc.
  **Invoca sempre come** `python scripts/<nome>.py` **, mai** `./scripts/<nome>.py`**: i wrapper in
  `RPG/scripts/` sono symlinks a `.mw/bin/forward.py` e non hanno il bit eseguibile.
- **Configurazione:** `RPG/.mw/deliberation-config.yaml`, `.mw/deliberation-config-explorer.yaml`,
  `.mw/deliberation-config-planner.yaml`, `.mw/prompt-enhancers.md`, `.mw/critique-definition.md`.
- **Credenziali:** `RPG/.env` (symlink a `mind-weaver/.env`). Contiene API key e `TELEGRAM_BOT_TOKEN`.
- **Provider API supportati:** `openrouter`, `groq`, `anthropic`, `openai`, `cerebras`, `mistral`,
  `gemini` (usa `GOOGLE_API_KEY`).
- **Provider web:** `chatgpt`, `claude` — richiedono sessioni autenticate in `.mw/providers/sessions/`.
- **Bridge Telegram:** `RPG/tools/telegram-mw-bridge.py` legge `.env` di RPG, invoca
  `RPG/scripts/mw-ask.py` con fallback a `mind-weaver/scripts/mw-ask.py`.
- **Skill di apprendimento e bugfix:**
  - `RPG/.agents/skills/learn/SKILL.md` — cattura pattern e mantiene contesto.
  - `RPG/.agents/skills/bugfix/SKILL.md` — workflow generico di bugfix.
- **Output delle deliberazioni:** `RPG/.mw/runs/<timestamp>/` per i risultati di
  `mw-iterative-deliberate.py` e delle skill `learn`/`bugfix`.

## Cosa fai

Prima di rispondere a qualcosa che può modificare la direzione — gameplay, monetizzazione,
progressione, art direction, scope — rileggili.

Se una proposta è in tensione con un pilastro, con una decisione registrata o con la desiderata
FROZEN, **dillo prima di procedere, citando la riga.** Non aggirarla in silenzio, non risolverla da solo.

Puoi criticare i pilastri. Se una proposta è buona *e* in tensione con la direzione dichiarata, il
modo corretto è nominare la tensione e chiedere se la direzione va rivista — non scegliere da solo
quale delle due vince. Quella scelta è di Fausto.

Se non sai, dillo. Non dedurre una direzione che non è scritta.
