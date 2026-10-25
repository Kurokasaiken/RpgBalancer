# deepseek — memorial-panel critique (DECLARED FAILURE)

> **Declared failure (2026-10-25):** run `20261025-critique-memorial-panel`,
> verbatim R-282 prompt, 3 shots (default-ctx-a, default-ctx-b,
> default-iso-0). Five physical attempts on T-001 — all transport/infra
> failures under heavy shared-browser contention (~190 CDP targets from
> parallel critique workers):
>
> - attempt 1: tab never auto-attached ("background tab did not
>   auto-attach within 20s, 2 attempts").
> - **A-001**: `ATTACH_FAILED` on the 3rd image (`default-iso-0.png`) —
>   first two attached fine.
> - **A-002**: images attached (2), then composer selector missing on
>   `https://chat.deepseek.com/`; reconcile ABSENT (prompt provably not
>   sent). This failure journaled `conversation_url=https://chat.deepseek.com/`
>   which poisoned the run's provider binding.
> - CDP `connect_over_cdp` timeout (120s) — browser wedge.
> - `Target.attachToTarget: No target with given id found` — tab closed
>   mid-attach.
> - `CONVERSATION_UNAVAILABLE` ×2: stored URL (home) "redirected" to home.
>
> **Tooling gap (for the record):** a bound conversation_url equal to the
> provider home page is unrecoverable via `record reseed`: `_same_conv`
> in `runstate.py` (and `_same_conversation` in `mw-web-turn.py`) return
> False for empty paths, so `pending_reseed` never triggers and send's
> stored-URL check always fails. A reseed WAS recorded (events seq 10)
> but cannot take effect.
>
> No critique was produced. This file must not feed the visual fork.
