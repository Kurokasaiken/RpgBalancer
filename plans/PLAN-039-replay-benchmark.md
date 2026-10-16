# PLAN-039 — Replay benchmark: sequenziale vs dispatch a esecutori esterni

**Stato:** sospeso (Director «accantona» 2026-10-16) — run parziale 3/18
in `test-results/bench-replay/replay-v1-2026-10-16T07-36-09/`; driver morto
mid-run. Ripresa richiede 2 fix pipeline: modello per-provider mancante per
`gemini` (riceve `openai/gpt-oss-120b` → 404) e `qwen/qwen3-coder:free`
ritirato dal free tier OpenRouter (serve slug nuovo). Dato grezzo già
visibile: 2 timeout 30min con `touched=0` su raw+contract — coerente con
l'esito PLAN-041 (nessuna lane free supera il contratto).
**Priorità:** P1
**Data:** 2026-10-16
**Desiderata/Richiesta:** R-204 — direzione C approvata dal Director («un bel
benchmark di replay C lanciato in notturna con night shift, e il guardian per
l'autospegnimento quando finisce»).

## Scopo

Misurare con dati propri — non stime — se conviene tornare al dispatch
multi-agente: stesso task, stesso base commit, tre approcci di spedizione,
esecuzione in worktree isolati, contratto d'uscita meccanico ri-verificato dal
driver (mai dalla parola dell'agente).

## Matrice

3 casi × 3 approcci (`raw` / `contract` / `context`) × 2 ripetizioni = 18 run.

- `raw`: solo obiettivo in prosa — baseline "spedizione stupida".
- `contract`: + test oracolo seeded che deve passare (non modificabile).
- `context`: + pacchetto contesto pre-raccolto (path, schema, convenzioni) —
  pattern verification-contract di work-solver.

Casi: `B1-i18n-icu` (replay reale R-193, bugfix meccanico),
`B2-metalayer-offers` (config additiva schema-shaped),
`B3-stash-item` (config additiva + i18n multi-file).

## Componenti

- `benchmarks/manifest.v1.json` — casi, base commit, oracle, forbidden globs.
- `benchmarks/prompts/<case>.<approach>.md` — 9 prompt.
- `benchmarks/contracts/*.contract.test.ts` — oracoli seeded nel worktree.
- `scripts/benchmark/replay.ts` — driver: worktree → seed+commit → deps
  (clone APFS di node_modules se manifest invariato) → harness executor →
  verify indipendente → scoring (touched/forbidden/golden coverage) →
  `test-results/bench-replay/<run>/` (json + patch + report.md).
- `scripts/benchmark/nightrun.ts` — wrapper guardian: registra sessione
  `bench-*` nel session-registry, heartbeat 60s, release COMPLETED/FAILED →
  lo shutdown manager può spegnere a coda drenata.
- npm: `bench:replay`, `bench:night`.

## Fix infrastrutturali emersi dallo smoke test

- `agentLoop` non passava `TOOL_DEFINITIONS` a `provider.complete` → i modelli
  con native tool-calling (gpt-oss) ignoravano il formato testuale `### Tool:`
  e bruciavano iterazioni inventando tool inesistenti. Ora i tool passano
  nativamente; il formato testuale resta fallback per modelli che lo seguono.
- `llama-3.3-70b-versatile` decommissionato su Groq → default manifest:
  `openai/gpt-oss-120b`.

### Seconda ondata di fix (smoke 2026-10-16 mattina)

- **Errori reali ingoiati come "timeout"**: `runPrompt` prendeva QUALSIASI
  rejection del `Promise.race` e la registrava come `timed out after 600000ms`
  con transcript vuoto — il fallimento provider era invisibile. Ora il motivo
  reale finisce in `summary` e sul log (`Task failed: <reason>`), e `replay`
  salva sempre `<runId>.agent.log` (stdout+stderr del harness) oltre alla
  coda dell'errore nel JSON del run.
- **Modello unico per tutti i provider**: l'adapter mandava `config.model`
  (id Groq `openai/gpt-oss-120b`) anche a Cerebras/OpenRouter → 404 fisso.
  Ora ogni provider parla il proprio `model` da `HARNESS_PROVIDERS`
  (groq `openai/gpt-oss-120b`, cerebras `gpt-oss-120b`, openrouter
  `qwen/qwen3-coder:free`); `HARNESS_MODEL` vale solo per il primario.
- **TPM Groq 8000**: transcript senza budget (tool output fino a 8000 char
  l'uno) superava il limite al ~6° turno → `Request too large`. Ora tool
  output ≤2000 char + `compactTranscript()`: oltre ~24k char di transcript i
  tool message più vecchi (tranne gli ultimi 4) vengono elisi a 200 char.
- **Timeout disallineati**: il driver uccideva a 900s ma `runPrompt` aveva un
  default interno di 600s → l'agente veniva segato a metà. Ora `replay`
  passa `--timeout <taskTimeoutMs>` esplicito.
- Limite noto restante: gpt-oss su Groq on_demand è lento (~200s/iter su
  prompt grandi, ragiona molto) — un run da 15min copre ~4-6 iterazioni;
  `touched=0` su un run va letto come "modello non converge nel budget", non
  come pipeline rotta.

## Domande che il benchmark deve illuminare

1. Dispatch separato (altra conversazione/process) conviene? → i run avvengono
   in processi/worktree separati per costruzione.
2. Contratto a priori + contesto pre-raccolto alzano il pass rate? → delta
   raw→contract→context su `contractPass` e `forbiddenViolations`.
3. Leverage inversion: quanto costa preparare il contratto vs fare il task.

## Doc-impact enforcement (implementato 2026-10-16)

- `scripts/docsImpactCheck.ts` + `npm run docs:impact` — lint dichiarazione
  (piani `.md` e `spec.json`) e check esecuzione (`--touched` / `--diff-base`).
- Gate post-run in `dispatch.ts`: spec con `documentation_impact REQUIRED`
  fallisce se i doc target non sono nel diff del worktree.
- Campo `documentation_impact` aggiunto a `TaskSpec` (`specParser.ts`).
- Rule 85 aggiornata con la sezione enforcement.
- Evidenza del gap: al primo lint, PLAN-031/036/038 sono REQUIRED **senza**
  target dichiarati; PLAN-021 non dichiara nulla.

## Safeguards / evidenza

- Contract test verificato dal driver, non dall'agente.
- Nessun commit/push sul repo principale: tutto in `tmp/bench-worktrees/` e
  `test-results/bench-replay/`.
- Modello pinned nel manifest; provider fallback gestito dal harness.

## Out / limiti noti

- Nessun caso percettivo/UI (T-04: serve un witness — i replay visuali
  richiedono verifica headed/headless dedicata, fuori scope v1).
- Sequenziale in v0; il parallelismo si inferisce dai tempi, v1.1 può
  aggiungere `--max-parallel`.
- `report.md` aggrega tempi/pass-rate; la qualità del patch resta a giudizio
  del Director in review mattutina.
