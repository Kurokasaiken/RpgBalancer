# Web-AI Prompt Protocol (R-284, Director ruling 2026-10-24)

Prodotto del dibattito multi-AI web `20261024-prompt-protocol`
(mind-weaver `.mw/runs/20261024-prompt-protocol/`), artifact r004 —
sha256 `b1fca13c915cf1b1c2d5253711a5cee25f5f6ba2d6591d9132984d6c98ff764b`,
converged con acceptance 4/4 (chatgpt, claude, gemini, deepseek; grok
rimosso `provider_dead` in fase di acceptance, dissent registrato sotto).

Scope: OGNI prompt che il sistema scrive per AI web (ricerca, critica,
mockup brief, dibattito multi-turno, broadcast) E per agenti interni
(hat/persona, agenti con file access). Estende `research-prompt-protocol.md`
(R-278) da "domande di ricerca" a tutte le call type. Vincolo Director:
burocrazia minima — regole + dove vive il machinery, non template library.

## P0 — The one rule

**Write a commission, never a specification.** A commission names a speaker
with authority, a task verb aimed at an object, a stance, and a deliverable
in prose ("critica spietata… proponi soluzioni con esempi di codice"). A
specification enumerates axes, schemas and output shapes and asks the model
to judge within them. The observed failure was a speech-act substitution:
the model satisfied the spec it was given. Every other defect (rubric-as-
input, mid-prompt grading, JSON contract, A/B/C sections, minimum counts,
register shift, dropped search imperative) is an instance of this one cause.

Authoring check (the one-line lint): **if a sentence in the solicitation can
be rewritten as "the model must output X", move it out of the solicitation.**

## P1 — Machinery placement table (applies to every call type)

| Piece | Lives in | Rule |
|---|---|---|
| Persona / hat / authority | SOLICITATION, first clause | Authority language, one breath ("sei il lead… hai l'ultima parola su…"). Internal agents: system prompt, same form. |
| Stance | SOLICITATION | What makes output judgment, not coverage ("spietata e costruttiva"). |
| Task verb + object | SOLICITATION | Verb aimed at the attachment; the attachment IS the object. |
| Search imperative | SOLICITATION, verbatim | Explicit ("fa una ricerca online") whenever research is required — never implied. Harness flags replies with no external sources as `no_research`. |
| Attachments declaration | SOLICITATION, universal clause — only in calls that carry attachments (capability-class recorded per round in the digest for traceability) | "gli allegati SONO il documento/componente" — mandatory on Gemini, harmless elsewhere, becomes standard. text_only_fallback calls are a separate capability-class with their own commission (no attachment clause, explicit TEXT_ONLY preamble); the hash applies within a capability-class, not across classes. Capability-specific ingestion instructions live in versioned provider adapters, never improvised per call. |
| Deliverable | SOLICITATION, prose | Named as things of value ("esempi di codice, ecc."), never as fields/sections/counts. |
| Component spec / context | TURN 1 payload attachment or omit | Context, not commission. For critique: the screenshots ARE the spec; spec text only in turn 2 if contract behavior matters. |
| Art-direction rubric | TURN 2 + DIGEST — never turn 1 | Turn 2 filters the model's own proposals ("quali tue proposte violano la grammatica? correggile") — constrains selection, never the critique. Digest uses it as clustering/mapping axes only. Harness greps turn-1 payload for rubric terms (`--skin-hud-*`, axis names) and blocks dispatch on match. |
| JSON / verdict contract | DELETED from solicitation | Orchestrator/digest extracts structure from prose (turn 2 if needed). Consumer is an LLM, not a parser. |
| A/B/C sections, per-axis citation, minimum counts ("≥1 structural") | DELETED | Specification addressed to the model-as-evaluator — the primary cause. Structure emerges as output. |
| Canary (capability gate) | THROWAWAY conversation | Canary image only, once per provider session (Grok: per round — capability empirically unstable). Failure = out of image-quorum for that round; session-exclusion only after 2 consecutive failures. Never in the critique conversation (primes inventory enumeration). |
| observed_facts (grounding proof) | HARNESS post-hoc audit — the quorum gate | No longer demanded of the critic. The image-grounded quorum counts a response only if the orchestrator can verify 2-3 concrete critique claims against authored ground-truth facts (appearance-specific, verified absent from payload). Optional complement: one post-critique line "descrivi in una riga tinta/pattern di X nello shot isolato" — after the critique so it cannot prime it. Fallback: if a critique yields <2 checkable claims vs ground-truth, the post-critique one-line probe becomes mandatory for that round; provider stays out of image-quorum until one of the two passes. Fail-closed outcome: if both fail, the critique is retained as non-grounded (text-only) evidence — excluded from the image-grounded quorum for that round, never discarded; the round proceeds with remaining quorum members. |
| Severity / P0-P3 / proposal ranking | TURN 2 asked of the model, or digest-cited | The critic's own priorities are judgment; the digest cites verbatim, never re-labels. |

## P2 — Solicitation properties

DISPATCH-BLOCKING rules (lint fails ⇒ no send):
1. Never contains: rubric axes/terms, output schema, "cita per ogni punto",
   counts, canary, observed_facts, section labels (`===`, English headers).
2. Always contains: persona+authority, task verb, stance, deliverable in
   prose; search verb when research is required; attachments sentence when
   attachments exist.
3. Commission clauses byte-identical across providers (hash-enforced).
   Provider deltas live only in the harness.

WARNINGS (lint warns, does not block — calibrated heuristics pending
ablation evidence; numeric limits are provisional, not proven):
4. One breath as default: a solicitation that needs paragraphs is likely
   two commissions — prefer splitting over stuffing.
5. Register warning: spec-document register (English headers, colon-lists,
   code tokens inline) is a smell — the commission speaks colloquial.
6. Enumeration warning: every enumerated noun becomes salient — long
   inventories are a smell, not a limit.

## P3 — Per-call-type deltas

- **Research / broadcast / mw-ask**: solicitation only + R-278 rules
  (problem not deliverable, open section "cosa non stiamo vedendo?",
  adversarial ask, surprising-over-safe, self-check "ho codificato la
  risposta nella domanda?").
- **Critique (catalog)**: turn 1 commission + shots; turn 2 rubric-
  constrained proposal repair + priorities; harness audit for grounding.
- **Mockup brief**: commission + image-forensic rules (masses/light not
  object inventory; light event not mood; no interpretive language;
  negative space as instruction).
- **Multi-turn debate**: persona-forward hat (authority+stance only),
  grounding ledger as quoted payload (data not instructions), no
  mid-stream JSON, votes/positions only in final turn.
- **Internal agents**: same commission principle, different placement —
  system prompt = hat (authority clause + stance-with-cost) + references
  by path (rubric/files, never inlined); user turn = commission. Their
  output contract is legitimate (consumed by code) via native tool/
  structured-output schema, not prose JSON. Grounding = harness check
  that cited file paths exist and were read (agent-equivalent of canary).

## P4 — Per-provider harness deltas (transport, never commission content)

- **Claude**: total rendered payload <25k chars (logged stabilize failures
  ~30k); overflow material as attachments or split turn.
- **Gemini**: attachments-declaration clause is load-bearing here;
  MIME/attachment handling in adapter.
- **Grok**: serialized calls + backoff; canary re-probe per round;
  text_only ⇒ out of image-quorum for the round, usable for text roles.
- **DeepSeek**: timeout ≥300s + reconcile path; probe first so a stabilize
  failure doesn't waste the critique.
- **ChatGPT**: no delta observed; `search_enabled` recorded per session.

## P5 — Digest rules (stops re-caging)

1. The digest is a mapper/aggregator, never a judge. Forbidden: quality or
   "ruthlessness" scores, re-ranking, re-framing.
2. Every critique point preserved VERBATIM before any clustering.
   Clustering is annotation, never replacement.
3. A point that fits no rubric axis is flagged `orthogonal` and surfaced
   FIRST to the Director, not last.
4. Quote-or-mapping rule (mechanically checkable): the digest may only
   cite language present in the critique; anything else is a mapping
   claim allowed only against rubric axes.
5. `orthogonal_rate` reported per round — trending toward zero = drift
   alarm (the loop is converging on the rubric).
6. Director judges quality on raw prose (sampled); the digest is an index
   into the transcripts, not a replacement.

## P6 — Hats (internal agents)

Gate on ablation AFTER form-rewrite — never delete a hat for failing a
form it was never written in. Rewrite rule: authority clause +
stance-with-cost ("ti pagano per trovare ciò che il team non vuole
sentire"), not interpretive labels ("objective" cannot be rendered).
A hat survives only if it beats a no-hat baseline blind on the same task.
Predictions to test (not verdicts): `objective_critic` fails as written;
`critique_and_counterplan` likely survives (two real jobs);
`system_design`/`cloud_architect`/`software_engineer`/`ui_developer`
likely tie with no-hat (role titles add little over repo context) —
probable deletions.

## P7 — Ablation (verifica a posteriori, ruling Director 2026-10-24)

Adozione immediata per ruling; l'ablazione resta mandata come verifica
a posteriori (non gate). Se i risultati contraddicono il protocollo, le
regole interessate si rivedono con lo stesso processo.

5 arms × {ChatGPT, Claude} × 3 runs, blind-scored by Director + metrics:

| Arm | Content | Tests |
|---|---|---|
| A0 | Free prompt verbatim | baseline |
| A1 | Engineered verbatim | reproduces defect |
| A2 | A1 + only search restored | isolates known confound |
| A3 | Commission-restored, rubric in turn-1 payload | rubric position |
| A4 | Commission turn 1 + rubric turn 2 (this protocol) | full design |

Metrics: external sources, code blocks, independent-insight index
(critique nouns absent from prompt), rubric-term overlap, Director blind
rank.

DECISION RULE (pre-registered):
- ADOPT iff A4 ≥ A0 on Director blind rank AND A4 > A1.
- A2 ≈ A0 on insight ⇒ the dropped imperative was the whole defect:
  adopt only commission-restore + search imperative; P1/P5/P6 rules
  downgrade to hypotheses pending further evidence.
- A3 > A4 on blind rank on BOTH providers ⇒ rubric-in-turn-1-payload
  wins; P1 rubric row reverts to payload. Any smaller margin ⇒ turn-2
  stands.
- Mixed/undefined: if no arm separates from A0 beyond run-to-run
  variance, A0's form (commission, no rubric, no contract) IS the
  protocol and all other machinery stays unadopted.
- Contingency (deepseek note): if A3 ≈ A4 < A0 on insight, the
  payload-vs-no-payload question is confounded — run A5 (commission,
  no payload at all) before deciding.

## Recorded dissent (not resolved by consensus — resolved by A3/A4)

- **grok**: rubric belongs in turn-1 payload ("grammar internalized before
  proposing") — hold-out vs 4/5 turn-2+digest. Ablation arm A3 is the
  empirical test of exactly this.
- **grok**: delete the entire hat library vs gate-after-rewrite.

## Implementation notes (post-acceptance, non-blocking — from provider notes)

- Record in the digest which grounding path admitted each provider to the
  quorum per round (claim-audit vs probe) — drift in admission mode is a
  signal (claude, T-034 note).
- Capability-class label (attachments vs text_only) is recorded per round
  — incorporated in P1.
