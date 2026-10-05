# AI-Friendly Spec Template

> Use this template for any page, kit, or integration surface that must be readable by an LLM and self-testable.
>
> Keep sections in this order. Use `GIVEN / WHEN / THEN` for every behavior. Link tests from the `Evidence` section.

---

## Metadata

- **Title:** [Name of the surface]
- **Status:** `draft` | `candidate` | `trusted` | `frozen`
- **Type:** `component-spec` | `interaction-spec` | `workflow-spec` | `page-spec`
- **Updated:** YYYY-MM-DD
- **Owner:** [role or task ID]

## Goal

One sentence: what this surface does and why it exists.

## Canonical sources

- State: [Zustand store / hook / config]
- Config: [path to config schema]
- Test data: [path to JSON/config fixtures]
- Runtime evidence: [path to test-results log]

## Data flow

```text
[Source] → [Transform] → [Consumer] → [Output]
```

| Step | Source | Data | Consumer | Effect |
|------|--------|------|----------|--------|
| 1 | | | | |

## State machine

```text
[state A] ──(event)──► [state B]
```

## Scenarios

### S-001 — [Title]

**GIVEN** [precondition]

**WHEN** [action / event]

**THEN** [expected behavior and visual contract]

**Test:** [test file and test name]

## Visual / runtime contract

- [Visual element or runtime invariant]
- [Another invariant]

## Invariants

- [ ] [Invariant]
- [ ] [Another invariant]

## Test commands

```bash
# E2E
npx playwright test [path-to-spec]

# Unit
npm run test -- [scope]

# Build
npm run build:check
```

## Evidence

- Last run: YYYY-MM-DD
- Result: [passed / blocked / N/T]
- Log: `test-results/[filename].md`

## References

- Root spec: [link]
- Child specs: [link]
- Master index: `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md`
