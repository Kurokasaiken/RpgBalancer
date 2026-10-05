# Protocolli multi-AI di Mind Weaver in RPG

## Architettura proxy

Mind Weaver non viene duplicato in `RPG/`. Il runtime, la configurazione, il catalogo endpoint e le credenziali restano in `mind-weaver/`; in `RPG/` esistono solo symlink e forwarder che fanno girare gli script con `cwd=RPG`.

Cosa è condiviso (symlink):

| RPG | punta a |
|---|---|
| `.mw/venv` | `mind-weaver/.mw/venv` |
| `.mw/deliberation-config.yaml` | `mind-weaver/.mw/deliberation-config.yaml` |
| `.mw/deliberation-config-explorer.yaml` | `mind-weaver/.mw/deliberation-config-explorer.yaml` |
| `.mw/deliberation-config-planner.yaml` | `mind-weaver/.mw/deliberation-config-planner.yaml` |
| `.mw/prompt-enhancers.md` | `mind-weaver/.mw/prompt-enhancers.md` |
| `.mw/critique-definition.md` | `mind-weaver/.mw/critique-definition.md` |
| `.mw/catalog` | `mind-weaver/.mw/catalog` |
| `.mw/providers` | `mind-weaver/.mw/providers` |
| `.env` | `mind-weaver/.env` |

Cosa è locale in `RPG/`:

- `.mw/desiderata.md` — desiderata di progetto
- `.mw/INDEX.md` — indice documentazione
- `.mw/runs/` — output delle run multi-AI
- `.mw/manual-dispatch/` — coda task manuali
- `plans/` — piani Mind Weaver
- `tools/telegram-mw-bridge.py` e `tools/telegram_state.py` — bridge Telegram
- `.mw/bin/forward.py` — forwarder vero e proprio
- `scripts/mw-*.py` — wrapper che invocano `forward.py`

Il forwarder esegue `mind-weaver/.mw/venv/bin/python <script-di-mind-weaver>` impostando `cwd=RPG`. Per questo motivo i path relativi (`.mw/`, `plans/`, `.mw/runs/`) risolvono dentro `RPG/`, mentre moduli e dipendenze vengono da `mind-weaver/`.

## Comandi che le skill devono usare

### Domanda singola

```bash
.mw/venv/bin/python scripts/mw-ask.py \
  --provider codex --model gpt-5.6-terra \
  --prompt "..."
```

Con cappello professionale:

```bash
.mw/venv/bin/python scripts/mw-ask.py \
  --provider groq --model llama-3.3-70b-versatile \
  --hat system_design \
  --prompt "..."
```

### Multi-AI iterativo — esplorazione

```bash
.mw/venv/bin/python scripts/mw-iterative-deliberate.py \
  --phase explore \
  --desiderata .mw/desiderata.md \
  --prompt "..." \
  --config .mw/deliberation-config-explorer.yaml \
  --out .mw/runs/explore-<slug>
```

### Multi-AI iterativo — pianificazione

```bash
.mw/venv/bin/python scripts/mw-iterative-deliberate.py \
  --phase plan \
  --desiderata .mw/desiderata.md \
  --prompt "..." \
  --config .mw/deliberation-config-planner.yaml \
  --out .mw/runs/plan-<slug> \
  --max-cycles 10
```

### Cold read / broadcast multi-provider

```bash
.mw/venv/bin/python scripts/mw-broadcast.py \
  --prompt "..." \
  --providers openrouter,groq,codex
```

### Critica esterna di un piano

```bash
.mw/venv/bin/python scripts/mw-critique-plan.py \
  --plan plans/PLAN-NNN-slug.md \
  --desiderata .mw/desiderata.md \
  --out .mw/runs/critique-<slug>
```

### Web provider (cookie/sessione)

```bash
.mw/venv/bin/python scripts/mw-web-cookie-import.py --provider chatgpt
.mw/venv/bin/python scripts/mw-broadcast.py \
  --web \
  --prompt "..." \
  --providers chatgpt,claude
```

## Regole per le skill

1. **Caricare `.mw/desiderata.md`** e trovare la versione `FROZEN` pertinente prima di invocare qualsiasi protocollo.
2. **Scegliere il giusto protocollo:**
   - esplorazione aperta → `mw-iterative-deliberate --phase explore`
   - scrittura/revisione piano → `mw-iterative-deliberate --phase plan`
   - verifica claim/assunzioni → `mw-broadcast` o `mw-critique-plan`
   - risposta rapida a una domanda specifica → `mw-ask`
3. **Passare sempre `--desiderata .mw/desiderata.md`** (path relativo a `cwd=RPG`).
4. **Salvare output in `.mw/runs/<slug>/`** o in `plans/` a seconda del protocollo.
5. **Non invocare** i file in `coordinator/skills/` o `strategist-mandate` come skill; vanno letti come mandati/contesto e passati al prompt di `mw-iterative-deliberate` via `--context-file`.
6. **Usare `.mw/venv/bin/python scripts/...`**, mai `mind-weaver/.mw/venv/bin/python` diretto, così `cwd` resta `RPG/`.

## Telegram bridge

```bash
.mw/venv/bin/python tools/telegram-mw-bridge.py
```

La mappa chat → workspace sta in `.mw/telegram-state/authorized-chats.yaml`. Il bridge usa `.env` (che punta a `mind-weaver/.env`) per `TELEGRAM_BOT_TOKEN` e `TELEGRAM_USER_ID`. Il bridge esegue `mw-ask.py` (dal proxy) con `cwd=RPG`, quindi le risposte e i piani generati da Telegram restano in `RPG/`.

## File di riferimento

- `context/DECISION_LOG.md` — storia delle decisioni
- `.mw/desiderata.md` — desiderata FROZEN di RPG
- `.mw/INDEX.md` — indice dei documenti di progetto
- `AGENTS.md` — regole operative per gli agenti
