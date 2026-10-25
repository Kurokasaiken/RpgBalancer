# claude — DECLARED FAILURE (free-tier message quota exhausted until 12:20)

DECLARED FAILURE. Run `20261025-critique-village-building-pins`, turn T-001,
verbatim R-282 prompt, 3 shots (ctx-a, ctx-b, iso-0).

**T-001:** `send --post-only` reported POSTED with `image_attached: 3`
(48s), conversation_url `https://claude.ai/new`. The subsequent `collect`
waited 333s and failed with «Claude response did not stabilize» —
**response_count: 0** on inspect. Failure bundle:
`.mw/runs/20261025-critique-village-building-pins/failures/T-001-A-001-claude`.

**Root cause:** the quota banner «Hai esaurito i messaggi gratuiti fino
alle 12:20» is still present in the bundle DOM (`dom.txt`: 2× «esaurito»,
2× «fino alle»). The composer accepted the submit gesture but the
quota-blocked UI swallowed the message — no assistant turn was ever
created. Hard timed quota (until 12:20 local), not a transient error;
no retry attempted.

Cross-run evidence for the same block: `legacy-reliquary-panel` T-001
(ATTACH_FAILED, banner in DOM), `new-game-confirm` T-001 (Enter-press
timeout on the disabled composer).
