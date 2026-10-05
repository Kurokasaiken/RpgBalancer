---
trigger: manual
description: Quest rules maintenance — QUEST_RULES.md tracks Director statements on quest rules, distinguishing ratified rules from proposals and divergences.
---

# Quest Rules Maintenance

Applies to every session in which the Director expresses a new or different
rule about quest behavior/resolution. Source: `plans/PLAN-020-quest-rules-canonical-doc.md`
(T-002), audit KB 2026-10-05 Q7.

## Purpose

`QUEST_RULES.md` is the canonical entry point for *current* quest rules. When
the Director's statements change the rules, the document must reflect it in
the same session — but a Director statement is not automatically a ratified
rule, and a divergence from a FROZEN source is never resolved silently.

## Invariants

1. **Same-session update.** When the Director introduces or modifies a quest
   rule, `QUEST_RULES.md` is updated in the same session. A rule left only in
   conversation is lost knowledge.
2. **Explicit status.** Every rule records its status: `vigente` (ratified —
   FROZEN desiderata, DECISION_LOG, or explicit Director ratification),
   `proposta` (Director floated it, not ratified), or `divergenza-nota`
   (conflicts with a FROZEN/canonical source, unresolved).
3. **No silent absorption.** If a new Director statement diverges from a
   FROZEN desiderata or another canonical source, the agent must flag the
   divergence and ask the Director which source prevails — never overwrite the
   existing authority.
4. **Source per rule.** Each rule carries RULE / STATUS / SOURCE (desiderata
   section, DECISION_LOG entry, or verbatim Director statement with date).
5. **Proposals stay proposals.** A proposal that is recorded in
   `QUEST_RULES.md` with status `proposta` (and in `context/OPEN.md` if it
   awaits ratification) is not a current rule until ratified.

## Workflow

```text
Director states something about quest rules
        ↓
evaluate status (ratified? proposal? divergent?)
        ↓
update QUEST_RULES.md with RULE / STATUS / SOURCE
        ↓
RATIFICATA → regola vigente
PROPOSTA   → status `proposta` + voce in context/OPEN.md
DIVERGENZA → status `divergenza-nota`, voce in context/OPEN.md,
             domanda esplicita al Director su quale fonte prevale
```

## References

- `QUEST_RULES.md` — canonical current-rules document (PLAN-020 T-001)
- `context/OPEN.md` — unresolved/divergence registry
- `.mw/desiderata.md` — FROZEN intent source (never edited here)
- `40-documentation-governance.md`, `45-director-intent-to-spec.md`
