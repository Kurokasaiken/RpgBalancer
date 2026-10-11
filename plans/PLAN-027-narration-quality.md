---
title: 'PLAN-027 — Narration Quality (r001: post-debate revision)'
status: draft
created: 2026-10-10
revised: 2026-10-10 (debate 20261010-narration-quality: deepseek/gemini/grok,
  claude+chatgpt rate-limited; objections WITNESS-01..04 disposizionate)
request: Director 2026-10-10 — kit bocciato («molto poco professionale»)
parent: PLAN-026 (T4)
---

# PLAN-027 — Narration Quality (r001)

## 0. Cosa è cambiato dal draft r000 (debate outcomes)

- **L4 reframed**: il gate deterministico è *regression-locking*, mai
  giudice di qualità (WITNESS-04 sustained). «Allowed but poorly used»
  non è catturabile da term-list — resta un flag, non un giudizio.
- **D2 risolta → hybrid**: EN draft → **facts-locked IT re-render**
  con EN come voice reference (non translation, non dual-independent).
  «Constrained translation» e «re-render» convergono una volta
  specificato che il renderer non altera i giudizi (WITNESS-01 amended).
- **Pass 0 → arc contract per kit**: una chiamata frontier per kit
  (non per nodo, non per run) emette il contratto d'arco — phase map,
  rival role, competition framing, ending fact-set, prop glosses —
  human-approvable, conservato nell'artefatto (WITNESS-02 amended:
  gemini «mandatory» + deepseek «static contract» riconciliati).
- **Negative anchors REJECTED** (WITNESS-03, 2-1; grok dissenting
  unrebutted — stale). Il corpus dei difetti va distillato in regole
  per il critic rubric, non in esempi negativi nel prompt.
- **Few-shot**: solo positive, excerpt-sized (2–3 righe), da scene
  authored goblin/rovine/cassa.

## 1. La pipeline convergente

```
Pass 0  — ARC CONTRACT (1 call/kit, frontier): phase map, rival
          name+role, competition framing sentence, ending fact-set,
          prop glosses. Human-approvable; stored in artifact provenance.
          Risponde a: sicuro-describes-start, flavour-not-a-race,
          prop-as-magic, premio-vs-obiettivo incoerenti.

Pass 1  — EN NODE DRAFTS (1 call/nodo, frontier primary / mid-tier
          fallback): brief meccanico + arc contract + excerpted
          positive voice anchors + story-so-far (titolo + una riga
          delle scene precedenti) + sibling labels già emesse.

Pass 2  — DETERMINISTIC GATE (per nodo, gratis): schema Zod;
          forbidden terms per-locale; trait ids / stat names / var
          names / internal ids vietati in prosa; digits; label
          uniqueness per kit; names.rival deve apparire nel flavour;
          creature lexemes ∈ vocab; vocab-term recurrence counter
          (>N per kit → FLAG per review umana, non reject — il solo
          modo onesto verso «allowed but lazy»).

Pass 3  — LLM CRITIC (1 call/nodo, frontier, condizionale): rubrica =
          classi di difetto del corpus (leak paraphrase, register
          drift, phase-vs-arc mismatch, label indistinzione, prop-as-
          magic, lore invention, costi non-pagati asseriti). Output:
          findings strutturati, non prosa. Salta se il draft è già
          pulito su gate+heuristic (conditional critique).

Pass 4  — REVISE (1 call/nodo, solo se findings): con findings citati.

Pass 5  — IT RE-RENDER (1 call/nodo o /kit, frontier): da fatti
          locked + EN come voice reference + glossario. NON traduzione
          letterale: il renderer non altera giudizi né fatti, ri-voica
          in italiano. I campi locale-invarianti (nomi propri, ids)
          vs locale-rendered sono dichiarati nell'artefatto → il check
          di parità D5 è verificabile.

Emit    — single .ts, nested { en: {...}, it: {...} }, provenance
          completa (provider/modello/prompt-version/arc-contract).
```

## 2. Divisione gate vs critic (D3 — risolta)

- **Gate** = tutto ciò meccanicamente decidibile: schema, blacklist
  (trait/stat/var/id), termini vietati per-locale, unicità label,
  rival-in-flavour, creature ∈ vocab, recurrence counter (flag).
- **Critic** = tutto ciò che richiede lettura: registro, leak parafrasati,
  prop-as-magic, lore inventata, coerenza fase-arco, costi run-specific.
- Il corpus dei difetti diventa la rubrica del critic + regole del gate:
  mai esempi negativi nel prompt del generatore.

## 3. Decisioni D1–D6 (converged)

- **D1 modello**: frontier primary via proxy (`anthropic`, claude-sonnet-
  class) per pass 0/3/4/5; mid-tier fallback accettabile solo per pass 1.
- **D2 bilingue**: EN draft → facts-locked IT re-render (hybrid).
- **D3 split**: decidable→gate, interpretive→critic (sopra).
- **D4 economia**: ~44 call/kit worst case; conditional critique;
  hard per-kit call ceiling, fail loud.
- **D5 artefatto**: single .ts nested `{en, it}`; parità machine-checkable
  perché i campi locale-invarianti sono dichiarati.
- **D6 acceptance**: umana obbligatoria sul primo kit per dominio; dopo
  ≥1 exemplar approvato il kit approvato diventa voice anchor e la
  review diventa spot-check.

## 4. DoD (invariato di sostanza)

- Kit rigenerato passa la review Director senza rilievi A/B/C.
- Gate esteso rifiuta deterministicamente il kit bocciato (regression
  test: race-miniera r000 deve fallire la validazione).
- Artefatto bilingue EN+IT emesso e validato; benchmark P4 bit-identico.
- Provenance: provider/modello/prompt-version/arc-contract embeddati.

## 5. Stato implementazione (2026-10-10, r001 landata)

**Implementato e verificato** (evidence: `test-results/plan027-r001-implementation-2026-10-10.log`):

- Pass 0 `arcContract.ts` — schema, copertura fasi 1:1, prompt architetto,
  seam `--contract` human-approvable, contract in provenance.
- Gate esteso — trait/stat/creature/internal-id per-locale, unicità
  label+titoli, rival-in-flavour, prize-in-objective, recurrence flag;
  fix boundary destro ('sea' ⊄ 'sealed').
- Critic (rubrica 10 classi), revise, IT facts-locked re-render,
  `localeParityIssues`, artefatto nested `{ en, it }`.
- **Regression DoD**: `tests/fixtures/race-miniera-rejected.kit.ts`
  fallisce il nuovo gate — `narrationQuality.test.ts` (17 test).
- **race-miniera rigenerato**: codex/gpt-5.6-terra (quota esaurita a
  metà run) → fallback gemini-3.8-flash; 86 tentativi, 0 failure.
  Benchmark P4 su `gen-race-miniera` localizzato: meccaniche intatte.
- Verifiche: 275/275 scope canonico, build:check ✓, kanban:lint ✓.

**DoD residuo**: review Director (D6 — primo kit del dominio). Flags
umani aperti: 'campana del turno' 12× IT (motivo da contratto), prop EN
letterali italiani nei body (glossario prop bilingue = iterazione).

## 6. Iterazione r002 — critica ChatGPT web (2026-10-11)

Run web `20261011-quest-copy-critique` (ChatGPT, cappello editor
narrativo). Tesi centrale del provider: *«la distinzione è tra
ripetizione funzionale e ripetizione che sostituisce la progressione:
ogni ripresa deve aggiungere informazione, cambiare il rischio o rendere
più urgente la scelta»*. Esiti assorbiti:

- **Bug meccanico reale trovato**: `sicuro` presentava il premio in
  disgiunzione col crollo («reclamare la vena, OPpure il soffitto») ma
  `takeLoot` è su OGNI verdetto — premio garantito, check = solo costo
  fisico. `sconfitta` prometteva contestazione del verdetto, meccanica
  inesistente. Corretti a mano IT+EN.
- **Gate v2 deterministico** (`validateCopy.ts`): regole
  `guaranteed-reward` (premio garantito mai in disgiunzione col rischio,
  mai presentato come perdibile nei flavor di fail) e
  `unsupported-mechanic` (contestazione/appello del verdetto). Regola
  progettuale confermata: il gate verifica condizioni precise, la
  qualità letteraria resta al critic.
- **`SceneBrief.guaranteedRewards`**: `sceneBrief.ts` calcola i
  `takeLoot` presenti su TUTTI i verdetti e li dichiara nei `facts` —
  il modello non può più scrivere il bug perché il fatto è nel brief.
- **Contratto v2** (`arcContract.ts`): `nodeContracts[]` per-nodo —
  `narrativeDelta` (vs ogni entry state, mai rispetto a un nodo
  precedente specifico), `rivalAction` (azione varia, non metodo
  ripetuto), `motifFunction` (funzione del motivo, non obbligo di
  citarlo), `mechanicalClaims`, `endingClaimsAllowed`. Opzionale nello
  schema (retrocompat r001); `contractIssues` impone coverage 1:1 se
  presente. Iniettato nei prompt scena via
  `nodeContractPromptSection`.
- **Test controllato**: contratto v2 authored
  (`test-results/narration-quality-debate/race-miniera-contract-v2.json`,
  viaA/imboscata/vetta secondo l'analisi del provider), rigenerazione
  `--only viaA,imboscata,vetta` → miglioramento verificato: Mara
  *esita* in imboscata (la gara si ferma), canarino muto→immobile
  (motivo evolve), sabotaggio pre-esistente con prova materiale.
  Fix manuale `vetta`: il modello aveva inventato un'opzione di
  «ritirata» inesistente (i soli sbocchi sono CHECK sicuro/varco).
- **Infra**: fix adapter `mw-web-turn` chatgpt (DOM 2026-10 —
  `data-message-author-role` rimosso; user `[class*="bg-user-message"]`,
  assistant `h4.sr-only /^chatgpt/i` + primo `[class*="prose"]`);
  mind-weaver commit `aae2b41b`. Provider: codex quota esaurita (fino
  2026-11-09), gemini 429 transitorio → `vetta` generata su groq.
- Test: `narrationQuality.test.ts` 24 test (61/61 scope narrativo),
  build:check ✓, kanban:lint ✓.

**Residuo**: review Director sulla copy r002 dei 3 nodi; estensione
contratto v2 ai restanti domini dopo approvazione.
