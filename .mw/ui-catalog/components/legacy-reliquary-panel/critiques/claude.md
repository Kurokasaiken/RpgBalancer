# claude — DECLARED FAILURE (free-tier message quota exhausted until 12:20)

DECLARED FAILURE. Run `20261025-critique-legacy-reliquary-panel`, turn T-001,
verbatim R-282 prompt, 3 shots (ctx-a, ctx-b, iso-0).

**T-001 (send --post-only):** `ATTACH_FAILED` — «no upload affordance found
for …/default-ctx-a.png» after 180s (attempt A-001, failure bundle
`.mw/runs/20261025-critique-legacy-reliquary-panel/failures/T-001-A-001-claude`).

**Root cause (verbatim from live DOM probe, `dom.txt` in the bundle):**
«Hai esaurito i messaggi gratuiti fino alle 12:20» — the Claude **free-tier
message quota is exhausted until 12:20 local** (~4h after the attempt at
~08:03). The composer/upload affordance is disabled account-wide; this is
NOT an image-perception failure — the prompt could not be submitted at all.
Images from prior runs are still visible in the draft area of the DOM,
confirming the session itself is healthy.

No retry was attempted: the block is a hard timed quota, not a transient
provider error (contrast with the transient «Questa risposta non è stata
caricata» retried successfully on village-slot-overlay T-002 earlier today).

Earlier same-day success for reference: village-slot-overlay T-002 was
image-grounded on this same session (06:39Z collect SUCCESS).
