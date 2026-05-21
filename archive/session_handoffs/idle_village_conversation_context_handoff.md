# Idle Village / Vertical-Base — Conversation Context Handoff
Generated: 2026-05-12

This file is a high-fidelity handoff of the conversation context, intended to let another ChatGPT/Claude/agent continue the work without losing the real state of the project.

## 0. How to use this file
Treat this file as the current working baseline unless the user explicitly contradicts it.

Most important rule:
User runtime truth overrides all agent reports, audits, screenshots-from-tools, or code reasoning.

If a future agent/report says something is fixed but the user says it is still wrong, the user is authoritative.

---

## 1. Authoritative project truths

### 1.1 Project goal
Core loop:
Character creation → Combat simulation → Balance analysis → Village management → Hero progression → Repeat

The project is effectively:
- an RPG combat/balancing sandbox
- with a village/incremental loop as secondary gameplay layer

### 1.2 Vertical slice target
Current target: a technical internal demo proving:
- weight-based creator pattern works
- combat simulator works
- village sandbox works
- the integrated loop is viable

Out of scope for now:
- multiplayer
- networking
- large content pipeline
- broad polish beyond what is needed for the vertical-base

### 1.3 Surfaces
Canonical meanings:
- /minimal-gameplay = current canonical runtime surface for the village/vertical-base
- /test = verification harness
- /vertical = planned integrated surface, does not yet exist

Archived/removed scope stays out of scope unless the user explicitly asks to revive it.

### 1.4 Architecture truths
Formal data/source hierarchy:
- Character = primary source of truth for combat entities
- Resident = village-side projection of Character
- Character storage = canonical source
- Character → Resident conversion pipeline = canonical projection path
- Village Resident Store = village-side canonical resident source
- Pages/components should consume resident state, not re-derive it

High-level target architecture:
- Domain → Application → UI → Infrastructure

### 1.5 Documentation & governance truths
Documentation hierarchy:
- Draft → Candidate → Trusted → Frozen

Canonical documentation entry point:
- COMPONENT_MASTER_INDEX.md

Rules:
- runtime first
- docs after verified runtime
- no documentation closure before runtime verification

Critical governance rules active:
- user-truth override
- visual/runtime tasks cannot be closed by build/lint/code reasoning alone
- UI/runtime/visual tasks require real runtime verification evidence

---

## 2. Tooling / workflow truths

### 2.1 Agent roles
Official roles:
- Strategist = architecture / governance
- Coordinator = task chain / registration / dependency audit
- Executioner = runtime implementation or focused verification

Preferred working style:
- fewer prompts
- stronger prompts
- one task at a time
- no mixed analysis+fix+docs tasks unless explicitly intended

### 2.2 Practical workflow
For visual/runtime bugs, the working method evolved into:
1. identify exact component/system
2. inspect canonical baseline
3. fix smallest runtime issue
4. verify against real runtime
5. only then add tests/docs if needed

For motion/visual/UI bugs:
- manual user confirmation is mandatory for closure
- automated checks are supportive, not sufficient by themselves

---

## 3. Work completed during this conversation

Below, items are split by confidence level.

### 3.1 User-confirmed / authoritative completions
These are the most trustworthy items because the user explicitly confirmed them or moved on after direct runtime validation.

#### A. /minimal-gameplay loads again
At one point a regression blocked /minimal-gameplay; this was later resolved and the user confirmed the page was usable again.

#### B. /test and /minimal-gameplay both load
Dynamic import / loading failures were fixed earlier in the conversation.

#### C. Portrait rendering in /minimal-gameplay
There was a long portrait debugging thread.
The decisive bug was:
- the DOM in /minimal-gameplay was using raw/stale portraitUrl
- instead of the resolved portrait source

After the fix targeting the actual render path, the user explicitly said:
“FUNZIONA !”

That is the strongest closure signal for the portrait issue in /minimal-gameplay.

Important nuance:
- many earlier portrait reports were false positives and should be ignored
- the reliable closure point is the one after the raw-vs-resolved propagation bug was fixed and the user confirmed success

#### D. Roster ordering now works acceptably
Later in the conversation, after adding/adjusting sort behavior, the user said:
“adesso ordina”

So the ordering issue should be treated as functionally acceptable now, even if previous reports about “intentional sorting” were wrong.

### 3.2 Agent-completed and likely good, but secondary to user-truth
These items were reported completed by agents and are internally consistent, but should still be treated as subordinate to user runtime truth.

#### A. Character → Resident canonicalization
A full task chain was executed around:
- canonical bootstrap
- Village Resident Store
- adoption in /test
- adoption in /minimal-gameplay
- verification
- docs reconciliation

This is likely the current baseline unless disproven by the user.

#### B. Portrait propagation regression tests
A minimal regression suite was reportedly added to protect the resolved-portrait-over-raw-portrait bug.
Treat this as probably useful, but not more authoritative than user runtime behavior.

#### C. Roster order contract audit
An audit found sorting logic in DragTestContainer, but earlier “intentional” conclusions were explicitly invalidated by the user later.
Only the final runtime behavior matters.

#### D. Motion verification framework registration
A task chain for motion verification was registered:
- runtime probe
- Playwright motion verification
- manual signoff

This is process infrastructure, not proof that motion bugs are solved.

---

## 4. Major non-authoritative reports to ignore

These should not be used as baseline truth if they conflict with the user or with later evidence.

### A. Any report claiming a visual bug was fixed before user confirmation
Applies especially to:
- portrait fixes
- roster order
- spring return
- pickup alignment

### B. Any report saying reverse alphabetical roster order was acceptable/intended
The user later overrode this.
Desired alphabetical behavior is A → Z, and later the user accepted the order after further work.

### C. Puppeteer-only portrait confirmations
At one stage Puppeteer said portraits were visible while the user still saw broken portraits.
Those reports are non-authoritative.

### D. Motion “fixed” reports without user confirmation
Repeatedly happened for:
- spring-back
- drag pickup alignment

Those reports should be assumed invalid unless the user explicitly confirms the behavior.

---

## 5. Current most important open issue

### 5.1 Open bug: drag pickup alignment regression
This is the main unresolved blocker at the end of the conversation.

User-authoritative description:
When the user starts dragging the token:
- the cursor/hand is not centered on the token
- it is shifted (user described it as not aligned; screenshot showed the cursor visibly to the right of the token)

This means:
- pickup alignment is still broken
- spring-return work should not be considered done
- pickup must be fixed before refining final spring-back behavior

---

## 6. Current motion-state conclusions

### 6.1 Pickup and spring are two different contracts
This was an important realization in the conversation.

Contract 1 — pickup alignment
At drag start:
- cursor/hand should be centered on the token

Contract 2 — spring return
When released:
- dragged visual should return to the image/token origin
- not to the left side of the card
- not to a generic card center

Current state:
- pickup alignment: still broken
- spring-return: not yet trustworthily solved
- do not treat spring-return as the next task until pickup is fixed

### 6.2 Important motion rule
Do not use:
- estimated geometry
- padding guesses
- header height guesses
- inferred layout offsets

For motion anchor work, the correct source is:
- the real measured DOM rect of the visible token/image element
- and the true pointer pickup point

---

## 7. Recent prompt/task history near the end

### A. Roster sort icon placement
There was a task to place the sort icon in the same visible control cluster as TUTTI.
The user wanted:
- icon in the same cluster as TUTTI
- compact UI
This is likely resolved enough for now unless the user says otherwise.

### B. Spring return anchor fix
There were multiple attempts to fix the spring anchor.
None are authoritative because the user still said it was wrong.

### C. Binary portrait slot/image isolation
Used to prove that:
- the slot/layout existed
- a hardcoded image could render
- the remaining portrait issue was source/prop propagation, not slot visibility
This was useful historically, but that bug is now considered resolved.

### D. Exact prompt last given for the active bug
The most relevant prompt given near the end of the conversation was effectively:
Drag Pickup Alignment Regression Fix / True Pointer Pickup Alignment Fix

The last user-confirmed state after those attempts was:
- still not aligned

---

## 8. Authoritative current state by area

### 8.1 Character → Resident pipeline
Status: likely complete baseline
Confidence: medium-high
Reason: many tasks completed around it; no later user contradiction on the core architecture

### 8.2 /minimal-gameplay as canonical runtime surface
Status: confirmed
Confidence: high
Reason: repeatedly reinforced by the user

### 8.3 /test as verification harness
Status: confirmed
Confidence: high
Reason: repeatedly reinforced by the user

### 8.4 Portraits in /minimal-gameplay
Status: confirmed fixed
Confidence: high
Reason: user explicitly said it works after the decisive raw-vs-resolved fix

### 8.5 Roster order
Status: acceptable/working now
Confidence: medium-high
Reason: user explicitly said “adesso ordina”

### 8.6 Drag pickup alignment
Status: open / regressed
Confidence: very high
Reason: latest user statement says it is still not aligned

### 8.7 Spring return to image/token origin
Status: open / not trustworthy
Confidence: high
Reason: repeated non-authoritative completions; user did not confirm it

---

## 9. Things to NOT touch right now
Until the pickup bug is fixed, avoid reopening:
- portrait resolution/content
- sorting logic
- docs reconciliation
- broad drag/drop refactors
- test expansion unrelated to pickup/motion measurement
- archived scope

Also avoid trusting:
- build-success-only completion reports
- “it should now work” statements without direct user confirmation

---

## 10. Best immediate continuation plan

### Step 1 — fix pickup alignment
This is the single most important next task.

Goal:
- when the token is grabbed, cursor/hand must be centered on it

Important constraints:
- no broad refactor
- no spring polishing yet
- no docs
- no portrait work
- no sorting work

### Step 2 — only after pickup is truly fixed, revisit spring return
Goal:
- return to token/image origin
- not left edge
- not card center

### Step 3 — then enforce motion verification
Use:
- runtime probe
- automated measurable assertions if needed
- user signoff for final correctness

---

## 11. Suggested exact next prompt
This was the correct next-task prompt near the end of the conversation:

### Prompt: Drag Pickup Alignment Regression Fix
Use this as the next execution step if continuing the same plan.

```text
AGENT
Idle Village Runtime Fix Executioner - Drag Pickup Alignment Regression Fix

INSTRUCTIONS
You are a Windsurf agent: consult the `agent-execution-mandate` skill before starting, follow the mandate, complete the safeguard suite, and satisfy Kanban requirements.

OBJECTIVE
Fix the new drag regression where the cursor/hand is no longer centered on the token when the user starts dragging it.

GV-WF-001 IS ACTIVE
This task cannot be closed from code reasoning or build success alone.
It is complete only if the real runtime shows the cursor/hand aligned with the token center at drag start.

CURRENT USER-VERIFIED TRUTH
- after recent spring-return experiments, drag pickup alignment is broken
- when the user grabs a token, the hand/cursor is shifted instead of being centered on the token
- this regression must be fixed before continuing spring-return work

IMPORTANT
This task is about DRAG PICKUP ALIGNMENT ONLY.
Do NOT continue spring-return refinement in this task unless strictly required to remove the regression.
If needed, revert or isolate the recent spring-anchor changes that altered pickup alignment.

WHAT YOU MUST DO
1. inspect the drag start / pickup path in real runtime
2. identify the exact coordinate/reference now used for token pickup alignment
3. compare:
   - expected pickup anchor = token center under cursor
   - actual pickup anchor = shifted
4. trace the first exact divergence across:
   - PgCard
   - DraggableWorker
   - CustomDragOverlay
   - transform-origin / drag-home-center / overlay offset logic
5. apply the minimum fix required so drag pickup is centered on the token again
6. do NOT broaden into final spring-return polishing in this task
7. verify in real runtime that:
   - at drag start, the cursor/hand is centered on the token
   - the misalignment regression is gone
8. stop there

STRICT CONSTRAINTS
- no docs
- no portrait work
- no roster sorting work
- no broad drag/drop refactor
- minimal regression fix only

MANDATORY COMPLETION EVIDENCE
A. exact file/function/line where pickup alignment was broken
B. exact files/lines changed
C. exact minimal fix applied
D. real runtime proof that pickup is centered again at drag start
E. explicit statement whether any spring-return code was reverted or isolated
F. evidence log path

SAFEGUARDS
- lint on touched files
- build:check
- kanban:lint

EVIDENCE LOG
- `test-results/drag-pickup-alignment-regression-fix-<YYYY-MM-DD>.log`
```

---

## 12. Compact resume prompt for another assistant/chat
If needed, the following short prompt can be used to resume elsewhere:

```text
Continue an Idle Village / vertical-base conversation from this baseline:

- /minimal-gameplay = canonical runtime surface
- /test = verification harness
- user-truth override is active
- UI/runtime/visual tasks cannot be closed without real runtime verification
- Character -> Resident pipeline is the baseline architecture
- portraits in /minimal-gameplay were user-confirmed fixed
- roster ordering is now acceptable
- current main open bug is drag pickup alignment:
  - when grabbing the token, the cursor/hand is still not centered on it
  - screenshot evidence showed visible misalignment
- do NOT resume with portraits/sorting/docs
- first task is to fix pickup alignment, then later revisit spring-return

Use the handoff file as authoritative baseline and keep the next task narrowly scoped.
```

---

## 13. Final caution
If future reports say:
- “fixed”
- “complete”
- “passes build”
- “runtime verified”

but the user still says it is wrong, then:
- the report is not authoritative
- the task remains open
- do not move on

This rule is central to continuing this project sanely.
