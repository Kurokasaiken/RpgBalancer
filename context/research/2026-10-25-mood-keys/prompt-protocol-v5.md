# Wanderlust Prompt Protocol v5 — artifact r004
(r003 + chatgpt bisect epistemics fix; r002 + dispositions of chatgpt/deepseek objections:
 anchor-by-operation, operational severity test, attribution honesty,
 hypothesis labeling)

## 0. Design stance
Gemini web = stochastic collaborator: no seeds, no API. Discipline replaces
determinism. Acceptance is by SEEN image only (witness), never by prompt
validity or file existence. Untested hypotheses are labeled as such and
never canonized without 2+ confirmations.

## 1. Two artifacts per image
- GENERATION_PROMPT — ordered artistic instructions sent to Gemini.
- PRODUCTION_RECORD — never submitted: ASSET_ID, REF_CLEAN verdict,
  ACCEPTANCE_TESTS, REVISION_STATE (invariants/targets/budget), attribution
  log. Diagnostic notes are not art instructions.

## 2. GENERATION_PROMPT — fixed field order
1. REF (image + role: properties to keep / defects to exclude)
2. MOOD_KEY + LIGHT_EVENT (one key; canonical light behavior)
3. DOMINANT_COLOR_FIELDS — 1–2 fields declared as PRIMARY SUBJECTS with
   COLOR_FIELD_ROLE + named pigment + RELATIVE_VISUAL_DOMINANCE (qualitative:
   "the sky dominates the upper frame", not "occupies 60%"). Rationale:
   zones-as-percentages in field 3 = layout instruction colliding with
   COMPOSITION (both providers objected); token-collision fix is an
   UNTESTED HYPOTHESIS → A/B test before canonizing.
4. SUBJECT_CLASS + class-typed SUBJECT block (§7) incl. ROLE_READ
5. COMPOSITION — archetype, camera, planes fg/mid/bg, negative space,
   focal hierarchy, MOOD_PROOF; optional FIELD_EXTENT sub-field
   (zone geometry) ONLY when the archetype requires it — gated in GATE
   vs focal hierarchy + camera.
6. SCALE_ANCHOR
7. BAPTIZED_STYLE_REGISTER — verbatim, zero paraphrase
8. HYGIENE — ≤5 structural, never contradicting dominant fields
9. FORMAT — 21:9 full-bleed

## 3. GATE — pre-send (binary; one authoring retry then stop)
G1 REF-CLEAN verdict; G2 KEY-LOCK (key NOTs: Prismatic no sky beams;
Wasteland no meteors); G3 DOMINANCE (fields as subjects + dominance,
not palette list, not % zones); G4 REGISTER ≥4 baptized phrases verbatim;
G5 HYGIENE ≤5, no contradiction; G6 FORMAT 21:9; G7 ONE-VARIABLE —
applies to generation prompts AND edit instructions ("change only X" =
one field); semantic vs literal delta: a register re-injection is a
SECOND intervention, logged separately, never claimed as single-field
attribution; G8 FIELD_EXTENT (if present) consistent with focal
hierarchy + camera.

## 4. FORK — route AFTER a compound-failure assessment
First assess ALL defects (composition, key, ref-contamination, subject
read, color/light, texture) — first-match without assessment is unsafe
(ref defect + wrong composition can coexist; regenerating with the same
bad ref reproduces both). Then route:
1. Composition/focal wrong → REGENERATE.
2. KEY/mood wrong → REGENERATE (REF/KEY/DOMINANT failure).
3. REF-defect copied → fix/swap REF + REF-CLEAN, REGENERATE.
4. ROLE_READ wrong (creature reads as prop; witness as protagonist;
   action beat illegible at thumbnail) → REGENERATE.
5. Only color/light/dominant-field wrong on right composition+key →
   EDIT same chat: "keep composition, change only X" (one field).
6. Anatomy/subject-structure wrong → REGENERATE. Operational severity
   test: a defect is edit-eligible iff it is confined to a nameable
   spatial zone AND the fix requires no change to subject silhouette or
   its relation to the focal hierarchy; otherwise REGENERATE.
7. Texture degradation → RE-ANCHOR event (not an edit): same chat,
   full BAPTIZED_STYLE_REGISTER verbatim re-paste + "preserve current
   composition and lighting". Permitted only if composition/subject
   intact + defect localized. Broadly smooth/glossy or re-anchor fails
   → thread DEAD, hard reset to B0. Does not count toward edit budget;
   logged as re-anchor. Do not spend it automatically.
8. Post-edit REGRESSION GATE: target improved AND invariants preserved
   AND no material regression → accept/continue; target improved but
   protected property regressed → failed edit, assess recoverability;
   target unchanged/worsened → do not repeat blindly.

## 5. Isolation diagnostics
- B0 = first composition-accepted image; verbatim prompt in ledger.
- One-field delta per iteration; two changes = two generations.
- ANCHOR BY OPERATION (replaces absolute B0 rule):
   * fresh corrective branches / regenerations anchor to B0;
   * localized edits and re-anchors that must preserve accepted changes
     anchor to the LATEST ACCEPTED image;
   * chaining (edit→edit on predecessor) is permitted ONLY for ops that
     change LIGHT_EVENT or MOOD_PROOF alone — never ops touching
     DOMINANT_COLOR_FIELDS or STYLE (self-contamination compounds);
   * a chained edit showing texture decay triggers §4.7 re-anchor, and
     the next corrective op re-anchors to B0.
- Attribution grammar: color+comp-right → DOMINANT_FIELDS/STYLE;
   mood → KEY; muted/storybook drift → STYLE/HYGIENE; artifact → REF;
   layout → COMPOSITION; role illegible → SUBJECT/ROLE_READ.
- Conviction: same defect + same single-field intervention + same
   acceptance criterion, reproduced twice; record contradictory
   outcomes, never count only successes. "Suspect" otherwise — no-seeds
   causality is imperfect.
- ATTRIBUTION HONESTY: because every edit re-injects register (second
   intervention), field conviction is ONLY available from
   generation-prompt ablation — edits are for correction, not
   attribution. Never claim an edit convicted a field.
- Bisect: two suspects → change one; a fix narrows the active defect —
   neither suspect is acquitted without independent ablation evidence
   (a successful correction may mask or interact with the other field).

## 6. Conversation lifecycle + state
- SAME CHAT (default; tabs stay open — Director rule): near-miss within
   budget, key+REF unchanged, no degradation signal.
- FRESH CHAT when: composition/key/REF/class change; budget exhausted;
   degradation confirmed; chat holds ≥2 unrelated images; cross-key
   jump (never edit across keys).
- DEGRADATION SIGNALS: clipped flat-white highlights; impasto reads
   smooth/glossy; composition drift despite "keep composition". Cause:
   attention decay prunes register vocabulary — every edit re-injects
   register (logged as second intervention).
- BUDGET: per thread = gen0 + ≤2 field-edits (3rd earned ONLY if edits
   1–2 addressed different fields AND degradation checklist clean);
   +1 re-anchor event (separate). Per asset ≤6 image ops; 2 consecutive
   cap-hits in a session → audit the TEMPLATE; escalate to Director.
- CARRYOVER on chat close: B0 verbatim + last best image path + open
   symptom → fresh chat rehydrates by re-paste + attach.
- PROMPT LEDGER per image (durable, repo): image_id | class | KEY | REF |
   B0 | op# | delta (or re-anchor) | verdict | symptom | attribution |
   chat ref. Convictions → template amendments only after 2 confirmations.

## 7. Subject-class blocks
- CREATURE: ANATOMY_ANCHOR (skeleton/silhouette; anti-anthropomorphic-drift rule = [HYPOTHESIS] pending evidence),
   MUSCLE_LOAD, TEXTURE_MAPPING (iridescence→membranes only), EMBODIES,
   ROLE_READ (actor vs prop), SCALE_ANCHOR, MOTION/POSE. Anatomy → regen.
- HUMAN: EXPRESSION_VECTOR (one emotion), GAZE_LOCK (direction+target,
   mirrored in COMPOSITION), SCALE_RATIO (monumental compression —
   numeric threshold e.g. <10% is a TESTABLE PRESET, not canon unless
   Director ratifies), COSTUME/PROPS, ROLE_READ (witness/protagonist/
   obstacle). Severity-classified failures.
- LANDSCAPE: DOMINANT fields as subjects (strongest case), HORIZON_ANCHOR,
   PLANE_LAYERING, ATMOSPHERIC_DENSITY, place-witnesses. [HYPOTHESIS] most edit-
   friendly class → full budget.
- CINEMATIC_QUEST_SCENE: ACTION_BEAT (one verb, legible at thumbnail =
   ROLE_READ), PARALLAX_FOREGROUND_ZONE (never occludes focal),
   AMBIENT_EFFECT_ZONE (bound to a spatial zone, never global wash),
   FOCAL_HIERARCHY (1 primary ≤2 secondary), NARRATIVE_TENSION, WITNESS;
   embeds compact creature/human sub-block; scene KEY governs. Edits
   only for ambient/light; parallax/focal → regenerate.

## 8. Acceptance
Visual rubric (composition, key-mood, dominant fields, light-event,
register/impasto, hygiene): each passes on SEEING the image.
Structural pass ≠ mood pass. Director eye-check = promotion gate.
