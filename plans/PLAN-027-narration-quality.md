---
title: 'PLAN-027 — Narration Quality (r001: post-debate revision)'
status: active
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

## 7. Iterazione r003 — pipeline su scenario AUTHORED (R-219, 2026-10-18)

La pipeline nata per i kit generati applicata allo scenario goblin
scritto a mano: nuovo driver `scripts/questRefine.mts` (estrae copy
esistente → gate baseline → critic → revise → re-render IT; output =
artefatto di review, mai scrive `scenarios/*.ts`). Arc contract authored
`.mw/specs/quest-goblin-narration/contract-v1.json`. Artefatto finale
`.mw/runs/goblin-refine-final/` — **0 issue su 18 nodi × EN/IT**.

**Bug reali trovati dalla prima run authored** (tutti fissati):

- il critic non conosceva le convenzioni authored → falsi positivi
  (chiedeva id in prosa, vietava la stat in `option.detail`, chiedeva
  ending facts nei verdetti locali). Aggiunto blocco `CRITIC_CONVENTIONS`
  + rubrica `competition-clarity` attiva solo se `contract.competition`.
- `promptForRevise` "rewrite it" su testo authored = licenza di
  redesign: un'arrampicata STR+PER è diventata una lettura del suolo PER.
  → `promptForAuthoredRevise` con fiction loccata (atto fisico + stat).
- `promptForRerender`: «campi in italiano» ambiguo → il modello
  traduceva le CHIAVI JSON; shape hint a 3 bande droppava `almost`/
  `bigwin` authored. → chiavi EN esplicite dalla `outputShape`, bande
  complete, divieto esplicito di copia verbatim degli anchor (gli anchor
  erano finiti in 10/15 body IT — plagio da riferimento di registro).
- `validateCopy` UNSUPPORTED_MECHANICS: `impugn\w+` flaggava «impugnano
  le lance» (verbo di combattimento) → ristretto a contesto legale.
- `sceneBrief`: `upfrontDamage` non dichiarato nei facts → il critic
  flaggava come `unsupported-cost` il sangue che il pedaggio paga
  davvero.
- `questRefine`: `--chain` multi-provider (codex quota esaurita
  mid-run → groq/gemini 429 → openrouter/free di salvataggio; qualità
  IT di openrouter/free insufficiente — 1 nodo riscritto a mano).

**Insegnamento**: su testo authored il critic+revise deve essere
*conservativo* — il rubric nata per bozze sottili "corregge" difetti
immaginari e il reviser riscrive oltre il mandato. La modalità authored
locca fiction+stat; il patch finale manuale resta parte del processo
(6 bande verdetti + 5 nodi corretti a mano, documentati nel report).

**Residuo**: review Director sul set finale (title `accampamento`,
label divergenti, 18 campi out-of-pipeline), decisione applicazione
(config EN vs spec IT) — R-135 impone EN su /game.

## 8. Iterazione r008 — architettura epistemica dal dibattito multi-AI (2026-10-19)

Il dibattito multi-provider (run `.mw/runs/20261018-narration-v3/`,
8 round, 12 witness) è converso su `artifact-r008.md`
(sha256 `eb25ec30…`, ACCEPT DeepSeek + Gemini; Claude e ChatGPT
`provider_dead` per cap account). Le obiezioni hanno prodotto un
redesign della pipeline, ora implementato:

- **`arcContract.ts`**: `world` block (closedWorld, allowedEntities,
  canonicalTerms, endSeeds, bannedSettingTerms, texture channels,
  enemyNouns), `nodeContracts[]` (framingFacts, verdictEffects per
  banda con facts/revealTerms/canonicalEffects/injuryAnchors,
  titleLock, recovery:'direct'), `contractLintIssues` (allowedEntities
  ∩ bannedSettingTerms = ∅, canonicalTerms coperti, no lessico
  meccanico), `worldPromptSection`.
- **`sceneBrief.ts`**: `EpistemicBlock` su `SceneBrief` +
  `attachEpistemic` — proietta world + nodeContracts sui brief, bande
  dal contratto union `verdictTable` (lo scenario goblin non ha tabella:
  la fonte è `verdictEffects`), path promotion dei fatti `setInfo`
  solo se sbloccati su OGNI route entrante (option.next, verdict goto,
  plain next). Fix: clausola `end` "bilancio costo/bottino" → registro
  poetico (Director 2026-10-18).
- **`narrationPrompt.ts`**: `REGISTER_BY_KIND` per tipo nodo,
  `promptForNodeR8` con partizione per campo (framing vs per-band
  verdict facts), PRE-REVEAL BAN esplicita, attackLines combat per
  canale sensoriale, closingLine con endSeeds, titleLock verbatim,
  opzioni action-only, sidecar `effectBindings` nello shape hint,
  `promptForFieldRevise` (revise field-scoped). Critic: nuova classe
  `outcome-entailment` bloccante — enumera indipendentemente le
  asserzioni di evento fisico e riconcilia col sidecar; `outcome-spoiler`
  e `ending-inconsistency` raffinate.
- **`validateCopy.ts`**: tokenizer+stemmer deterministico (diacritics
  off, elisioni, longest-suffix, stoplist normalizzata), `matchTerm`
  (bare = confini interi, `*` = prefisso), `copySchemaFor(brief)` shape
  strette per kind (check option label-only, combat attackLines ×5,
  end closingLine), `validateNodeCopyR8` con hard check: schema,
  title-lock, direct-loot-gate, pre-reveal-leak (solo framing),
  banned-setting, invented-proper-noun, option-mechanical-leak,
  ui-telemetry-leak, epicfail-missing-somatic, closer-shape,
  unsupported-outcome-event (binding mancante / effectId di altra
  banda / asserzione assente dal testo). Soft flag kit-level:
  PROP_PROPAGATION + LEXICAL_REPETITION via `kitSoftFlagsR8`.
- **`scripts/questRefine.mts`**: `--copy-file` per manoscritti IT
  nativi, gate combinato legacy+r008, revise field-scoped quando il
  brief è epistemico, contract-lint come pre-flight. Output sempre
  review artefact — mai `scenarios/*.ts`.
- **Fixtures di regressione**: `tests/fixtures/goblin-accepted-r008.ts`
  (manoscritto convergente completo + `effectBindings` +
  `GOBLIN_R008_REVIEWED_SOFT_FLAGS` con giustificazione per ogni flag)
  e `tests/fixtures/goblin-rejected-v2.ts` (un difetto per regola).
- **Test**: `narrationQuality.test.ts` +20 test r008 — 44/44 sul file,
  204/204 su `tests/unit/idleVillage/quests/`. `build:check` ✓.
- **Contratto goblin**: `.mw/specs/quest-goblin-narration/contract-v1.json`
  riscritto (584 righe) allineato ai 17 node id reali + world block.

**Residuo**: il manoscritto convergente r008 resta in attesa di review
Director (fixture accettato = bozza proposta, non ancora applicata);
F2 `bottino` nel grafo eseguibile è ancora choice+check — il redesign
`recovery:'direct'` richiede una modifica strutturale a
`scenarios/goblin.ts` che attende approvazione esplicita. Nessuna
scrittura su `goblin.ts` è stata fatta.
