# PLAN-041 — Model Arena: misura per-modello e protocollo di dispatch

**Stato:** completed (2026-10-16 — arena eseguita, verdetti in
`benchmarks/ARENA-REPORT.md`: nessuna lane free supera il contratto; Groq×2 e
Mistral inconclusive per quota/saturazione, nemotron fallisce il gate,
cerebras 402, gemini 503-burst; il locale resta unico executor affidabile —
coerente con desiderata v31 / R-208)
**Priorità:** P1
**Data:** 2026-10-16
**Desiderata/Richiesta:** R-204 — protocollo di misura dettato dal Director
(2026-10-16): baseline locale → costo del contratto → arena per-modello →
esclusione dei modelli non corretti → piano di parallelizzazione → uso massimo
dell'agente locale.
**Documentation Impact:** REQUIRED — `plans/INDEX.md`, RICHIESTE R-204,
`benchmarks/README.md`, rule 85 già aggiornata; CANON non toccato (niente doc
canonici nuovi senza avallo).

## Domanda

Vale la pena dispatchare a esecutori esterni gratuiti, o il collo è il costo di
scrittura del contratto? Si risponde solo misurando, per modello e per archetipo.

## Protocollo di misura (dettato dal Director)

1. **Baseline locale (SWE-2 High)**: tempo per risolvere il task *senza*
   contratto, sui casi B1-B3 in worktree — misurato in sessione dedicata,
   stesso oracolo usato per verificare (il contract test resta scoring, non
   guida). Output: `localBaselineMs` per caso.
2. **Costo del contratto**: tempo per scrivere il contract packet (test oracolo
   + prompt contract/context) per un caso. Dato già osservabile: la sessione
   che ha prodotto i 3 pacchetti B1-B3 (~9 prompt + 2 test) è la misura grezza;
   per un dato pulito si cronometra la scrittura del packet di un 4° caso.
   **Se (1) < (2) → leverage inversion → il task resta locale, niente dispatch.**
3. **Arena per-modello**: `benchmarks/manifest.v2.json` — stessi 3 casi,
   approccio `contract` fissato, una corsia per modello free:
   `gemini-3.8-flash` (AI Studio), `openai/gpt-oss-120b` (Groq),
   `qwen/qwen3.8-27b` (Groq), `gpt-oss-120b` (Cerebras — stessi pesi, latenza
   diversa), `qwen/qwen3-coder:free` (OpenRouter). Metriche: `agentMs`,
   `contractPass`, touched/violations, iterazioni (dall'evidenza harness).
4. **Gate di correttezza**: un modello entra nella shortlist solo se
   `contractPass` su ≥1 run per caso e zero violazioni forbidden; escluso
   altrimenti (niente "quasi giusto" — l'oracolo decide).
5. **Piano di parallelizzazione**: dal report si derivano (a) corsie per
   archetipo (quale modello per quale task), (b) quante corsie in parallelo
   reggono le quote free (Groq 1k req/day per modello, Gemini ~1.5k,
   Cerebras ~1M tok/day), (c) il WIP-cap reale = review bandwidth del Director.
6. **Agente locale al massimo**: il ruolo del locale non è executor ma
   contract-writer + planner + reviewer — i tre anelli dove la qualità del
   contesto decide il risultato. Il benchmark misura se questa divisione paga.

## Routing deciso dal Director (2026-10-16)

- Lane free primarie: **Groq** e **Gemini** — sfruttare fino al tetto di
  quota giornaliera per modello (i modelli Groq hanno budget separati).
- OpenRouter secondario (50 req/giorno senza top-up; Cerebras 402-billing e
  Mistral quota-piccola sono lane marginali — si misurano, non si pianificano).
- **L'agente locale è sempre nella coda e lavora di default**: ciò che le lane
  esterne non coprono (task non dispatchabili, quote esaurite, gate percettivi
  T-04) torna al locale — non aspetta una lane libera. Gli esterni servono a
  parallelizzare, non a sostituire.

## Componenti (già costruiti in questa sessione)

- `HARNESS_PROVIDER` env → pin di un singolo provider (arena runs);
  `getAvailableProviders` filtra la chain.
- Provider `gemini` primo nella chain (`harnessProviders.ts`,
  `gemini-3.8-flash` — `2.5-flash` ritirato per i nuovi utenti, verificato
  404→200 su `/v1beta/openai/`); fallback groq → cerebras → openrouter → mistral.
- Fix adapter: URL join senza doppio slash; `response.text()`+parse resiliente
  (una risposta non-JSON non faceva più crashare con `Unexpected end of JSON`).
- `replay.ts`: dimensione `models` nel manifest (`{provider, model}` per corsia,
  runId `…-<provider>-r<n>`), `--timeout` propagato, evidenza sempre scritta
  (grace del driver oltre il timeout interno).
- `manifest.v2.json` — arena: 3 casi × 6 modelli × 1 rep = 18 run.

## Verifica / evidenza

- `test-results/bench-replay/model-arena-<ts>/report.md` per modello:
  pass rate, mean agentMs, touched, violazioni.
- Report finale `benchmarks/ARENA-REPORT.md` (da scrivere dopo la run):
  shortlist modelli × archetipo, decisione dispatch-vs-locale per caso,
  proposta corsie parallele con cap.
- Gate di chiusura: il report contiene per ogni modello un verdetto
  INCLUDE/EXCLUDE motivato dall'oracolo, non da impressioni.

## Out / rischi

- Quote free ruotano senza preavviso (llama-3.3, kimi, llama-4 già usciti):
  il manifest è il punto unico dove aggiornare i modelli; un 404 su un lane è
  dato, non bug.
- `raw`/`context` restano in v1 come confronto di approccio; l'arena fissa
  `contract` per isolare la variabile modello.
- Baseline locale è misura singola (n=1) — utile per ordini di grandezza,
  non per statistiche.
