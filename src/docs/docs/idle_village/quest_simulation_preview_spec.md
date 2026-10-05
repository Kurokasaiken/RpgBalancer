---
title: Quest Simulation Preview — spec (R-082)
type: spec
status: implementato — `questSimulation.ts` + `QuestSimulationPreview`/`QuestCheckPreview` nella pagina `/quest-s1-lab` (2026-10-04)
updated: 2026-10-05
provenance: copia tracciata di `.mw/runs/20261004-rovine-preview-chatgpt/preview-prompt.md` (gitignored) — spec a 28 sezioni da conversazione ChatGPT 2026-10-04
---

# Prompt — Quest Simulation Preview

> Prodotto da ChatGPT (2026-10-04) su richiesta del Director per il
> componente Preview della quest (totale + pre-check). Verbatim, in inglese
> come consegnato. Status: PROPOSAL — pronto per il dispatch a un coding
> agent dopo revisione.
>
> **Divergenza nota rispetto a PLAN-018/v23:** prescrive Monte Carlo (10.000
> sim, seeded RNG); il Mission Planner esistente usa DP esatta rng-free.
> Decisione MC vs DP vs ibrido da prendere in PLAN-019-S3.

---

Implement a complete Quest Simulation Preview system for RpgBalancer.

IMPORTANT:
This is a MOCKUP / PREVIEW component for the quest system.
Do not redesign the existing quest architecture.
Do not invent a second stat system.
Use the existing canonical Balancer stats/configuration and the existing quest/check data structures wherever they already exist.

The goal is to let the designer immediately understand:

1. What is likely to happen to the current party during the whole quest.
2. What is likely to happen at the NEXT skill check.
3. How those predictions change when:
   - party members are added/removed
   - equipment changes
   - consumables are added/removed
   - a consumable is committed to the upcoming check
   - check configuration changes.

## 1. TWO DISTINCT PREVIEWS

Create two related UI components.

A) QUEST TOTAL PREVIEW — probabilistic simulation of the ENTIRE QUEST using the currently configured party/loadout.

B) PRE-CHECK PREVIEW — probabilistic outcome of ONLY THE NEXT SKILL CHECK, before the player resolves it.

Both must use the same underlying simulation/calculation logic. Never implement separate ad-hoc formulas for the two previews.

## 2. CORE PRINCIPLE

The preview is NOT a deterministic prediction — it is a Monte Carlo simulation / probabilistic forecast. The UI must communicate "With this party and these choices, this is what is likely to happen", NOT "This will happen". Every displayed percentage must be derived from repeated simulated runs. Use a deterministic random seed while the inputs remain unchanged so the UI does not jitter on every render. When an input changes, derive a new simulation seed/version and recalculate.

## 3. QUEST TOTAL PREVIEW

Component: `QuestSimulationPreview`. Receives: quest definition, party, equipment/loadout, available consumables, consumables committed to the quest/check, current quest state, relevant Balancer configuration, simulation configuration.

Each simulation run must:

1. clone the initial party state
2. process every quest phase
3. perform every relevant skill check
4. apply the configured modifiers
5. apply consumables when configured
6. determine check verdict
7. determine individual wounds/deaths
8. update party state
9. update time/duration
10. process retreat/failure/continuation logic
11. stop when the quest ends
12. record the final result.

Do NOT simply multiply independent check probabilities. The simulation must preserve state between phases — e.g. phase 2 wounds a villager → that villager is wounded during phases 3–6; leader dies during phase 3 → follow the actual configured leader-death rule. The total preview must represent the actual quest state machine.

## 4. NUMBER OF SIMULATIONS

Default: 10,000 simulations. Configurable. UI must remain responsive; reuse an established simulation utility if it exists. Do not block the UI unnecessarily.

## 5. QUEST TOTAL PREVIEW OUTPUT

Display at minimum:

- QUEST OUTCOME — success %, failure %, aborted/retreated % (if retreat supported)
- PARTY CONSEQUENCES — P(0 deaths), P(1+ deaths), P(2+ deaths), average deaths per successful quest, P(at least 1 wounded), average wounded, P(leader wounded), P(leader dies)
- TIME — average/min/max duration, optionally P50/P90
- REWARD — average gold/value, average loot, probability of optional/high-risk rewards

IMPORTANT: do not display only averages. "0.43 deaths" is much less useful than "0 deaths: 64% / 1+ deaths: 36%". Use distributions where appropriate.

## 6. PARTY BREAKDOWN

For every party member: survival probability, death probability, wound probability, probability of finishing healthy, expected downtime if wounded. Example: `Leader — Healthy 71% / Wounded 23% / Dead 6%`. The player needs to understand WHO is being put at risk.

## 7. REACTIVE PARTY INPUT

Fully reactive: add/remove villager, change leader, change equipment, change a stat, add/remove/assign a consumable → the preview recalculates automatically. No "Run Simulation" button — input state is the simulation dependency. Do not recompute on every unrelated React render: memoize the simulation input; re-run only when meaningful inputs change.

## 8. PARTY COMPOSITION

Party composition must matter — adding a character can affect group check strength, individual exposure, wound/death distribution, leader survival, available abilities, stat combinations, quest duration, total human opportunity cost. Removing produces the inverse where appropriate. Do NOT assume "more characters = always safer": follow the actual quest rules.

## 9. PRE-CHECK PREVIEW

Component: `QuestCheckPreview` — ONLY the next skill check, shown immediately before the player commits. Answers: "If I resolve this check NOW with the current party/loadout/consumable choice, what is likely to happen?"

Display: CHECK (e.g. FORÇA + CONSTITUIÇÃO, DC 13), PARTY STRENGTH (effective value/modifier), OUTCOME DISTRIBUTION (Epic Fail/Fail/Almost/Win/Big Win %), CONSEQUENCES (no injury %, 1+ wounded %, 1+ deaths %, leader wounded %, leader death %), TIME (+0/+1/+2 days etc.). Use whatever consequence categories actually exist — do not invent categories.

## 10. CONSUMABLE TOGGLE

The pre-check preview must immediately change when the player chooses USE CONSUMABLE / DO NOT USE. Example (illustrative only, NOT hardcoded — must come from simulation):

```
WITHOUT CONSUMABLE: Win 43% BigWin 8% Almost 22% Fail 20% EpicFail 7% | 1+ wound 31% | 1+ death 9%
WITH CONSUMABLE:    Win 58% BigWin 14% Almost 19% Fail 8%  EpicFail 1% | 1+ wound 17% | 1+ death 3%
```

## 11. CONSUMABLE SEMANTICS

A consumable affects the simulation per its defined semantics — NOT automatically "+X to roll". It may: modify a stat, modify a check, reduce injury/death risk, downgrade consequences, reveal information, change the available approach, modify time, change the outcome distribution. Use the existing consumable model; simulate the actual effect.

## 12. CONSUMABLE COMMITMENT

Distinguish AVAILABLE CONSUMABLE from COMMITTED TO THIS CHECK. The preview uses the committed state (`Potion x2 → [ DON'T USE ] [ USE ]`). Show "Consumed on this check"; the preview updates. Do NOT mutate persistent inventory on toggle — the preview is a hypothetical state; actual consumption happens only when the check is confirmed/resolved.

## 13. COUNTERFACTUAL COMPARISON

Where space permits, show CURRENT STATE vs WITH CONSUMABLE: `Death risk 8% → 3% (DELTA −5pp)`. Much more useful than "Potion gives +10" — the player understands the consequence of the decision.

## 14. WHY / CAUSAL EXPLANATION

Not a black box. Before detailed percentages, a short causal summary:

```
WHY?
+ Strong Force from leader
+ Party has 3 additional bodies
− Weak Constitution
− Current party has 1 wounded member
+ Potion reduces consequence severity
```

Use the existing "WHY before percentages" design principle. Explain gameplay causality, not implementation details.

## 15. DELTA / REQUIREMENT EFFECT

The closer/farther the party is from the required skill, the more/less dangerous the check: above requirement → higher success, fewer injuries/deaths; below → lower success, more severe consequences. Not a single arbitrary flat modifier if the Balancer already provides a mechanism — reuse the canonical Balancer calculation.

## 16. HIGH-RISK / HIGH-REWARD CHECKS

Support approaches with different risk profiles (e.g. STEALTH = lower reward/severity vs FIGHT = higher reward/exposure). Preview updates when the player changes approach. Example (illustrative only): STEALTH Success 68% / 1+ wound 18% / 1+ death 2% vs FIGHT Success 61% / 1+ wound 43% / 1+ death 12%.

## 17. QUEST TOTAL MUST USE THE SAME DECISIONS

Configurable decisions (stealth vs fight, safe vs risky merchant, continue vs retreat, consumable vs not, optional room vs return): the total preview simulates the currently selected/default strategy. Do not invent autonomous AI decisions unless the mockup requires them. Label clearly `SIMULATED STRATEGY` so the user knows what the preview assumes (e.g. "Risky merchant / Stealth / Take treasure / Continue / Explore second chamber / Return").

## 18. RETREAT / CONTINUE

Respect the quest checkpoint. If RETURN / CONTINUE exists, the total simulation must represent both strategies — ideally two preview states (RETURN AT CHECKPOINT vs CONTINUE AT CHECKPOINT) to compare expected reward/time/wounds/deaths. Critical for testing push-your-luck.

## 19. LEADER RULE

The leader is the operational anchor of the expedition. While the leader is alive + not wounded + not exhausted, the player may continue sending available humans on quests; if the leader becomes wounded/exhausted/dead, expedition capacity is blocked until recovery/replacement per existing rules. The Quest Total Preview must report: leader survival, leader injury, leader exhaustion, expected downtime — strategically more important than a generic "quest failed" number.

## 20. TIME / HUMAN ECONOMY

Expose time as a real resource: expected duration (days), human-days committed, expected wounded downtime (human-days), total opportunity cost if supported. Do NOT invent a monetary conversion — human-days are themselves the resource.

## 21. VISUAL HIERARCHY (quest total)

1. QUEST SUCCESS / FAILURE
2. DEATH RISK
3. WOUND RISK
4. EXPECTED TIME
5. REWARD
6. PARTY MEMBER CONSEQUENCES

Not a spreadsheet — a game design tool. Understandable in seconds: compact cards, bars, icons, percentages; no huge explanatory text blocks.

## 22. PRE-CHECK VISUAL HIERARCHY

1. Check being attempted
2. Party effectiveness
3. Outcome distribution
4. Injury/death risk
5. Consumable effect
6. Time consequence

Example layout:

```
--------------------------------
CROSS THE UNDERGROUND RIVER
FORCE + CONSTITUTION — DC 13
Party: +8

SUCCESS 72% / ALMOST 14% / FAIL 11% / EPIC FAIL 3%
CONSEQUENCES: Wounded 18% · Dead 4%

[ USE POTION ] — Death risk 4% → 1% · Wound risk 18% → 9%

[ RESOLVE CHECK ]
--------------------------------
```

## 23. SIMULATION ENGINE SEPARATION

Do NOT put simulation logic inside React rendering code. Create/reuse a pure simulation layer: `simulateQuest(input, seed)`, `simulateCheck(input, seed)` — both consume the same canonical quest/stat/consequence rules. The UI only renders results. Critical because later we want: automated balancing, batch simulations, tests, quest comparison, tuning, designer tooling.

## 24. DETERMINISM

Seeded RNG. Same `quest + party + equipment + consumables + strategy` → same preview until inputs change. No `Math.random()` inside rendering. On meaningful input change: derive a new deterministic seed from input state — prevents flicker while letting the player see a changed simulation.

## 25. TEST CASES

At least: (1) base party, (2) add villager, (3) remove villager, (4) replace leader, (5) increase main stat, (6) decrease main stat, (7) add consumable but don't use, (8) use consumable, (9) remove consumable, (10) wounded member, (11) dead member, (12) leader wounded, (13) leader dead, (14) stealth approach, (15) combat approach, (16) retreat, (17) continue, (18) guaranteed success, (19) guaranteed failure, (20) no possible death. For every case verify the preview changes only when relevant simulation inputs change.

## 26. IMPORTANT UX REQUIREMENT

The designer must be able to: open quest → see total forecast → add a villager → immediately see success/wound/death/human-days change → open next check → see pre-check forecast → toggle consumable → see the WITHOUT/WITH counterfactual → change party → see the forecast change → resolve the check → **the actual result comes from the SAME simulation/check logic the preview represents**. The preview is never a decorative approximation disconnected from resolution.

## 27. MOCKUP DATA

Use the underground-river quest structure: (1) Merchant safe/risky, (2) Underground river Force+Constitution, (3) Guards Stealth OR Fight (fight = higher risk/reward), (4) Treasure room Perception → failed perception triggers Dexterity+Constitution trap check, (5) Checkpoint Return/Continue, (6) Additional chamber unavoidable attrition/time, (7) Return event wounded-traveler/healing. Use actual quest definitions already present if they exist; do not create a parallel quest representation.

## 28. ACCEPTANCE CRITERIA

Complete only when: Quest Total Preview exists; Pre-Check Preview exists; same simulation rules; party changes recalc; consumable toggle recalcs; total sim preserves state between phases; wounds/deaths propagate; leader state affects simulation; time simulated; human-days calculated; risk/reward approaches produce different distributions; retreat/continue representable; per-member outcomes visible; deterministic while inputs unchanged; no UI flicker; no hardcoded percentages; no second stat system; canonical Balancer stats and quest infrastructure reused; tests cover the counterfactuals.

The final result should feel like a designer's "X-ray" of the quest: "What happens if I send THESE people? / add THIS person? / spend THIS consumable? / take the risky route? / what am I actually risking?"

---

## Nota aggiunta da ChatGPT (counterfactual-first)

Le due preview non devono essere semplicemente «Quest: 73% successo / Check:
68% successo» ma **strumenti controfattuali**:

```
              SENZA POZIONE   CON POZIONE
Successo          61%            73%
Feriti            38%            21%
Morti              9%             3%
+1 giorno         27%            14%

              PARTY ATTUALE   + VILLAGER
Successo          61%            68%
Feriti            38%            31%
Morti              9%             6%
Human-days         24             30
```

Più potente per il design: giochi col mockup come se fossi il giocatore.
E la simulazione della quest totale deve eseguire la quest **fase per fase**
— non una formula che moltiplica le probabilità dei 6 check: se al check 3
muore un villager, al check 4 c'è davvero un villager in meno; se il leader
viene ferito la simulazione si comporta di conseguenza. È ciò che rende la
Preview utile anche per il bilanciamento.
