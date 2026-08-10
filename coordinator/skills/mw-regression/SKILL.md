---
name: mw-regression
description: Mind Weaver anti-regression guard for RPG
---

# mw-regression

Apply before touching any existing component or contract.

## Pre-modification check

1. Describe the current real behavior of the component.
2. List past decisions (`DESIGN_PILLARS.md`, `context/DECISION_LOG.md`, trusted `*_trusted.md` docs, `.windsurf/rules/`) that constrain it.
3. Identify exactly which parts you will modify and why.
4. If a change would violate a documented `Must-not-change` or a design pillar, stop and flag it before proceeding.

## After the change

1. Run the relevant smoke test (build, unit test, or component render).
2. Verify the `Must-not-change` constraints are still respected.
3. If the change updates or fixes a regression, update the relevant trusted doc and evidence log.
