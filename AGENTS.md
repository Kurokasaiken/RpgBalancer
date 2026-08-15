All'inizio di ogni sessione: leggi `DESIGN_PILLARS.md`, `context/DECISION_LOG.md`, `RICHIESTE.md`, `.mw/desiderata.md` e `context/INDEX.md` (se esiste).

## Cosa sono, e cosa non sono

- **`DESIGN_PILLARS.md` — la direzione.** I riferimenti d'ispirazione del gioco e le scelte
  concrete di gameplay/UI/visual che ne derivano. Il file dice di sé stesso di essere *"la lente
  con cui controllare: è coerente con i pillar?"*.
- **`context/DECISION_LOG.md` — la storia.** Le decisioni prese e il perché.
- **`RICHIESTE.md` — le richieste esplicite.** Ciò che Fausto ha chiesto, con le sue parole. Le voci
  `aperta` e `in corso` sono lavoro impegnato.
- **`.mw/desiderata.md` — desiderata FROZEN.** Decisioni di intento approvate; il workflow parte da qui.
- **`context/INDEX.md` — catalogo contesto.** Indice dei documenti caldi del progetto, da consultare
  quando serve.

Questo progetto non ha un `CANON.md`: finché non ce l'ha, niente qui è canonizzato.
Direzione e storia non sono la stessa cosa di un vincolo, e non vanno trattate come tale.

## Workflow Mind Weaver in RPG

- **Fase esplorativa:** invoca `.windsurf/skills/mw-explorer/SKILL.md`.
- **Fase di pianificazione:** invoca `.windsurf/skills/mw-planner/SKILL.md`.
- **Fase esecutiva:** invoca `.windsurf/skills/mw-executor/SKILL.md`, che a sua volta carica il
  mandato `.windsurf/skills/agent-execution-mandate/SKILL.md` per i task specifici di RPG.
- **Prima di toccare codice esistente:** invoca `.windsurf/skills/mw-regression/SKILL.md`.
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
