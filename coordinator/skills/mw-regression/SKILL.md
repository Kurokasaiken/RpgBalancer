---
name: mw-regression
description: >
  Guard anti-regressione Mind Weaver scopato al progetto RPG. Usa prima
  di toccare codice RPG esistente: pre-modification check su
  recurring-traps e componenti trusted/frozen; a chiusura impone un
  test di regressione permanente su bugfix e nuovo comportamento
  (R-247). Specifico di RPG; fuori progetto non applicabile.
---

# mw-regression

Apply before touching any existing component or contract.

## Pre-modification check

1. Describe the current real behavior of the component.
2. List past decisions (`DESIGN_PILLARS.md`, `context/DECISION_LOG.md`, trusted `*_trusted.md` docs, `.windsurf/rules/`) that constrain it.
3. Identify exactly which parts you will modify and why.
4. If a change would violate a documented `Must-not-change` or a design pillar, stop and flag it before proceeding.
5. If verification involves a browser, keep it headless/background — never open a foreground window automatically (`.windsurf/rules/16-no-foreground-windows.md`).

## After the change

1. Run the relevant smoke test (build, unit test, or component render).
2. Verify the `Must-not-change` constraints are still respected.
3. If the change updates or fixes a regression, update the relevant trusted doc and evidence log.
4. If the change fixes a bug or adds/changes behavior, write or update a **permanent regression test** that would fail without the change (R-247):
   - on contracted surfaces (`// INV:` blocks, `sync:bug` components): red-first evidence via `npm run redfirst:record` and the `// INV:<id>` tag, per the Living contracts workflow;
   - elsewhere: a new or updated test under `tests/` that lands with the same change.
   Smoke tests alone do not close a behavior change — the new behavior must stay guarded by a test that survives the task.
5. If no permanent automated test is genuinely feasible, declare the exception explicitly (verification manifest: `human-eye` obligation with motivation). A silently untested behavior change is a defect, not an exemption.
