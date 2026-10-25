# chatgpt — PROVIDER FAILURE (images not perceived / attach broken)

DECLARED FAILURE. Two attempts were made on run
`20261025-critique-village-slot-overlay` with the verbatim R-282 prompt
and 3 image attachments (ctx-a, ctx-b, iso-0). This is the third
image-perception failure for chatgpt today (see nav-bar, hud-corner
digests); adapter code notes the same defect observed 2026-10-25
("attach reported ok, model saw nothing").

## Attempt T-001 (post-only, 3 images attached per transport)

Transport reported `image_attached: 3`, but the captured conversation
URL was the client-side placeholder `local-chatgpt:e1abd53e-…`; the
collect landed on `https://chatgpt.com/` (CONVERSATION_MISMATCH,
journaled). The real conversation was recovered at
https://chatgpt.com/c/6adda1cf-e184-83eb-8f16-abda7516f274 and its
response — generated despite `image_attached: 3` — declares the images
invisible (verbatim):

> «Posso affrontarlo come farebbe un Lead UI/UX Designer AAA […]
> C'è però un elemento essenziale: in questo messaggio non vedo
> un'immagine del componente né il suo codice sorgente. Non voglio
> inventare difetti specifici o spacciare una critica generica per una
> review del componente reale.»

The remainder is a generic critique framework (criteria table) with no
component-specific observations — not image-grounded.

## Attempt T-002 (retry, x2)

- Same-conversation resend (prompt + 3 shots): `ATTACH_FAILED —
  no upload affordance found` (composer exposes no attach control).
- Fresh-conversation resend: `ATTACH_FAILED — no upload affordance
  found` again.

One retry exhausted per worker instructions; provider excluded from the
image-grounded quorum. Claude and deepseek produced image-grounded
critiques on the same shots, so the shots are valid and the failure is
provider-side.
