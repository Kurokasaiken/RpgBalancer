---
title: 'PLAN-086 — Quest Playground (test surface semplificata)'
status: draft
created: 2026-10-25
parent: PLAN-029
debate: mw-web-debate `20261025-quest-playground` — artifact r007 converged
  4/4 (chatgpt, gemini, grok, deepseek; claude escluso provider_dead)
artifact_sha256: caa9f8f29f18bd6f1705bc2c48741a9de173c36314dc2eefce9bd541a4e419d1
---

# PLAN-086 — Quest Playground

Superficie dedicata al test rapido delle quest generate, separata dal lab
editoriale (`/quest-generation-lab` resta il workbench documentale). Link
incrociato tra le due pagine.

## Layout (artifact r007 — consenso mediato)

Single-column, play sopra / controlli sotto (ruling Director):

```
Header: title · [← Lab] · scenario id + hash badge · [Save & Approve]
PLAY (top):
  ├─ PRESSURE STRIP — meter per var: `acqua 3/8 ▮▮▮▯▯▯` (fill=current,
  │   tick=threshold), delta arrow vs step precedente, armed-twist chips
  ├─ NODE CARD — nodeId · kind · fase · title/body · verdictTable grid
  │   completa · vars del nodo · armed twists con rearm
  │   └─ OPTIONS inline full-width: label │ odds% │ gate badge │
  │      costo/reward │ [Apply] — hidden/gated visibili, tintate, badge
  │      con motivo (requires: X / hidden by flag Y)
  ├─ TRAIL — collapsed, nodi visitati (più recente prima)
  └─ COVERAGE STRIP — nodi visitati/raggiungibili · opzioni provate/viste ·
     twists armed/fired · rami raggiungibili-non-visitati (BFS incl. twist
     edges; irraggiungibili marcati a parte)
CONTROLS (bottom):
  ├─ Generation: gimmick chips · kit chips (filtrati) · tuning = number
  │   inputs con stepper clamped (NO slider — quantizzazione disonesta) ·
  │   [Generate] + hash readout
  ├─ Advanced (collapsed): primaryStats override (offer-level, badged),
  │   dangerScale/rewardScale sotto label "run modifiers — not in hash"
  ├─ Quick-load: baked catalog + candidati salvati (status badges)
  └─ [Sorprendimi] random gimmick+kit+tuning
Gates: badge collassato non-bloccante + runValidation espandibile
```

## Contratti chiave (da r007)

- **Debug play onesto**: solo `applyChoice` reale — nessun force/jump/
  replay in v1 (candidati per dopo).
- **Save & Approve** = l'atto di approvazione: payload = scenario + input
  generazione + scenarioHash + RUN receipt {seed, party snapshot,
  dangerScale/rewardScale, engineVersion}. Content = hash(inputs);
  run trajectory = receipt completo; engineVersion diverso =
  non-riproducibilità onesta.
- **Pressure var metadata**: tabella per-gimmick accanto al registry
  (race: you/rival→goal; flood: acqua→limite, uscita→uscitaGoal).
- **Tag filter**: rigettato — i tag sono metadata derivati dal kit, non un
  asse di generazione.
- **Party**: `referenceParty` dello scenario (calibration party).
- Gates mai bloccanti; solo schema-parse failure è fatale (banner).

## Scarti deliberati (dal dibattito)

- Right-rail options pane (grok) — rompe l'ordine di lettura debug.
- Timeline verticale dei nodi (grok) — mentisce sul grafo a rami.
- Slider per tuning (grok) — disonesti su knob interi.
- ⚠ idle flag (deepseek) — non ancorato a predicato meccanico.
- Forcing check/verdict (chatgpt Q1) — serve supporto engine, post-v1.
- Replay/confronto percorsi (chatgpt Q4) — serve rewind engine, post-v1.

## Task

| T | Task |
|---|------|
| T-1 | Route `/quest-playground` + pagina + link incrociato col lab |
| T-2 | `DebugRunPlayer` — step-through istantaneo, opzioni inline con gate |
| T-2b | INFO STATE nel node card — info possedute/richieste/concedibili + |
|     | eventi informativi nel trail (ponte gimmick indagine §19) |
| T-3 | Pressure strip — meter vars vs thresholds via tabella per-gimmick |
|     | estensibile accanto al registry (gimmick-agnostica) |
| T-4 | Coverage strip — BFS reachable + counters onesti |
| T-5 | Controls: gimmick/kit/tuning/scales/primaryStats override + Generate; |
|     | gimmick chips da registry, senza generatori → badge «proposal» |
| T-6 | Save & Approve → shared candidate store + run receipt completo + |
|     | checklist 5 domande S-18 (manuale, non gate) |
| T-7 | Gates badge collassato + gates panel espandibile |
| T-7b | Quick-load esteso: anche scenari authored (goblin/rovine) per |
|     | verifica dossier autoriali S-03/S-10 |
| T-8 | i18n en/it/pseudo + test unit + smoke e2e |

## Note

- Claude escluso dall'elettorato: adapter web dead (6 failure su 2 sessioni).
- ChatGPT ha obiettato 4 volte in acceptance, ogni emendamento assorbito:
  idle flag, save-semantics, seed-vs-content, party snapshot, engineVersion
  scope. Il contratto receipt ne esce rafforzato.

## Emendamento A — allineamento al concetto gimmick evoluto (2026-10-25)

Le ingestion `2026-10-25-gimmick-indagine-e-acquisizione-info` (R-286,
ARCHITECTURE §19) e `2026-10-25-transcript-integrale-gap-analysis`
(S-01..S-25) cambiano il perimetro del concetto gimmick. Il playground
va progettato **gimmick-agnostico**, non sulle sole race/flood:

### A-1. Il debug play espone anche il layer informativo

Requisito Director E-03: le informazioni si raccolgono **passivamente e
trasversalmente** — qualsiasi gimmick può emettere «eventi informativi».
Il NODE CARD mostra quindi oltre a vars anche:

- **INFO STATE** — info possedute (setInfo accumulati), info richieste
  dalle opzioni gated, info che il nodo può concedere (grantInfo)
- **eventi informativi** nel trail — quando un'opzione/emissione produce
  un'info, il trail la segna (ponte verso la gimmick indagine: lì gli
  eventi avranno direzione×sicurezza — E-06 — e il modello interpretazione)
- per la gimmick indagine (futura, §19): direzione/sicurezza per
  interpretazione come estensione dello stesso pannello — non una
  superficie separata

### A-2. Pressure metadata = tabella per-gimmick estensibile

La `PRESSURE_STRIP` legge una tabella dichiarativa accanto al
gimmickRegistry — oggi race (you/rival→goal) e flood
(acqua→limite, uscita→uscitaGoal); nuove gimmick la estendono, non la
riscrivono. Per «indagine» il modello pressione sarà prove/sospetto/
scadenza (§18.5/§19); per meld rotta/soglia/scadenza (§17).

### A-3. Roster in evoluzione — ranking documentato

Censimento §18.5 + §19: 2 implementate, 1 registrata (meld), 1 contratto
(mimic), 6 candidate (rituale, scorta, difesa, cargo volatile,
corruzione, indagine), 5 famiglie scoperte. Ranking AI S-08:
**Rituale** prima candidata, Corruzione, Cargo volatile, poi Indagine.
Il picker gimmick NON hardcoda — legge il registry e mostra solo le
righe con `generate` effettivo (righe senza generatore = badge
«proposal», non selezionabili).

### A-4. Le 5 domande di valutazione → checklist onesta al save

S-18 propone 5 domande di valutazione struttura (decisioni vs sequenza
ottimale, strategie multiple, compromessi reali, imprevisti efficaci,
due run diverse). Nel playground compaiono come **checklist manuale
non-verificabile** al momento del Save & Approve — il Director le spunta
o no; sono guida di giudizio, non gate meccanico (S-19: la misura
automatica del divertimento non esiste ancora).

### A-5. Contesti Director riallineati

- S-01 gameplay-first → il playground È lo strumento "vedi se funziona".
- S-02 quest-per-amico → il save-on-approval + export chiude quel loop.
- S-03 authored-quest-per-gimmick → il playground serve per *verificare*
  le quest authored dei dossier (S-10), non solo le generate: il
  quick-load deve accettare anche scenari authored (goblin/rovine) —
  estensione del catalogo quick-load già prevista.
- Aperte (S-21/S-22, non decise): livello target generazione
  (catalogo/ibrido/dinamico) e priorità spedizione vs investigativa —
  registrate in OPEN, non bloccano T-1..T-8.
