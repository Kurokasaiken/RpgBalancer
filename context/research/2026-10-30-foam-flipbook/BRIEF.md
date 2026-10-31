# R-299/B — Painted foam flipbook for the west-rim arch (mappa2)

Goal: the white surf around the sea arch + stacks animates like real surf —
not a painted blob sliding (rejected: detail-only flow poses, whole-image
translation, alpha pulse, and the shader crests alone).

Chosen path (Director): painted pose VARIANTS — Gemini repaints the SAME
region with foam in different positions; each variant is alpha-masked to
sea+coast band and becomes a seaPatch pose frame. Runtime cycles them
(seaPatches infra, no code change). Rocks stay pixel-identical via mask.

Pipeline: gen-mappa2-sprite.mjs on NEW chat per frame (old shared chat has
broken attach — HANDOFF). Frames: f1-surged, f2-drained, f3-breaking.
