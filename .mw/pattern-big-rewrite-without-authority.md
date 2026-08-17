# Pattern: Big Rewrite Without Authority

**Date:** 2026-08-17  
**Session:** Destiny Astrolabe V1 → V5 (failed approach)  
**Status:** Candidate (1 occurrence, high replicability)

---

## Signal

- Task says "improve X" or "fix X"
- Component has N known issues
- Immediately assumes "needs complete rewrite from scratch"
- Skips reading desiderata.md (the actual request scope)
- Skips AGENTS.md (the protocol that guards against this)
- Begins writing code without asking "Is a rewrite actually approved?"
- Produces 3000+ LOC without browser verification
- Only discovers mid-way through that the request was to patch, not rewrite

---

## Root Cause

**Three layers of failure:**

1. **Skipped the protocol** — AGENTS.md §F3 says "If the desiderata is ambiguous, Claude asks — not interprets and proceeds." The scope WAS NOT ambiguous (it said "V1 canonical"), but was never read.

2. **Skipped the source of truth** — desiderata.md FROZEN v3/v4 explicitly states:
   > "...skill check with Destiny Astrolabe **V1**"
   
   This is not ambiguous. It is canonical. A rewrite was not requested.

3. **Assumed authority** — Chose unilaterally to:
   - Fork V1 into V5 (new component, new route, new everything)
   - Solve 11 problems at once
   - Change the architecture from "improve" to "rewrite"
   
   AGENTS.md §4 says this is explicitly forbidden:
   > "If a proposal is in tension with a pillar, recorded decision or FROZEN desiderata, **state it before proceeding**, citing the line. Do not bypass it silently."
   
   The tension existed (V1 vs V5). It was bypassed silently.

---

## Fix

**Before writing a single line of code:**

1. **Read desiderata.md FROZEN** — Identify the exact scope
   - Time: 10 minutes
   - Result: A sentence that says what is actually requested

2. **Read AGENTS.md** — Understand that "improve" ≠ "rewrite"
   - If task says "improve X" and your instinct is "rewrite X", STOP
   - Ask: "Is this rewrite approved, or is it a patch task?"
   - Cite the desiderata line to justify the question

3. **If rewrite is needed but not in desiderata:**
   - Do NOT proceed
   - Instead: "Desiderata v3 requires V1 canonical, but V1 has issues X, Y, Z that block it. Revise desiderata or patch V1?"
   - Wait for Director approval

4. **Verify incrementally**
   - Max 200 LOC before browser test
   - Do NOT write 3000 lines then discover i18n was wrong
   - Build → browser → test → commit → repeat

---

## Example Application

**This session:**

Wrong approach:
```
"Improve V1" 
→ (assumed) "Needs rewrite" 
→ Created V5 from scratch 
→ 3000 LOC 
→ Browser: 💥 i18n broken
```

Right approach:
```
"Improve V1"
→ Read desiderata → "V1 canonical for POI Quest"
→ "If V1 has blockers, do I patch or ask for rewrite?"
→ Patch V1 OR ask Director to revise desiderata
→ Verify in browser after every 200 LOC
```

---

## Test / Verification

1. **Before coding:** Grep desiderata.md for the exact component name. Confirm scope in one sentence.
2. **Before major refactor:** Check if desiderata approves a rewrite, or if it requires the old component to remain canonical.
3. **During coding:** Every 200 LOC, open browser and verify "it still works". Do not batch-write.
4. **Red flag:** If you write more than 500 LOC without opening browser, stop and ask if scope has changed.

---

## Related Patterns

- **Scope Creep by Assumption** — Related; this is a specialization of "assumed authority"
- **Write-First vs Ask-First** — The opposite pattern; solves this issue
- **Incremental Verification Cycle** — Prevents late discovery of errors (i18n, compilation)

---

## Proposed Rule for AGENTS.md

Add to AGENTS.md §F3 or new §F5:

> **§F3.1 — Scope Tension Rule**
> 
> When a task says "improve" or "fix", and your first instinct is "rewrite":
> 1. Read desiderata.md to find the actual scope
> 2. If desiderata requires the old component canonical, ask: "Patch or revise desiderata?"
> 3. Do NOT decide unilaterally to rewrite

---

## Notes for Future Sessions

- This pattern has HIGH replicability: any "improve X" task without desiderata reading will hit this
- The fix is cheap (10 min to read, 30 sec to ask) vs cost of rewrite-then-revert (8 hours)
- AGENTS.md exists precisely to prevent this; not reading it made the entire session wasteful
