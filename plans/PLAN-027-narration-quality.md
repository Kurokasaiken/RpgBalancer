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
