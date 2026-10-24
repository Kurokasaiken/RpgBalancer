# F1 — Ti arrampichi sull'albero (`gob-tracce-perfor`) → `albero.png`

> **NON GENERARE — check = pulsante sulla stessa schermata di fase** (decisione Director 2026-10-13). Riserva: il nodo riusa l'immagine di fase.

Nodi: `gob-tracce-perfor` (check STR+PER). Beat: pre-check — il pino che si
offre, visto dal basso. Niente scalatore disegnato, niente vista dall'alto:
il reveal (ciò che si vede dalla cima) non è in scena.

## Full prompt — generatori esterni (Gemini / Grok / GPT)

```text
ALBERO — painted in heavy oil impasto. A shot looking straight up the trunk of a colossal old pine standing three steps off the forest trail. SUBJECT: rough plated bark with natural handholds, a ladder of branches rising toward a canopy of green light overhead, the forest floor already falling away below the frame. NO CLIMBER — the tree itself is the dare; the climb belongs to the player. COMPOSITION: vertical thrust inside a wide cinematic frame, trunk dominant, canopy a vault of light, faint smoke drifting far behind. LIGHTING: bright daylight breaking through the canopy crown, luminous green light below. PALETTE: Veronese green canopy, deep teal-emerald bark shadow, amber daylight at the crown; NO grey, NO brown, NO mud. TECHNIQUE: thick oil impasto, broad palette-knife strokes in the Jaime Jones / Jeff Easley tradition, tactile matter on bark and needles; rude beauty — weathered and tactile, never squalid. MOOD: vertigo + the pull to see what only height reveals. Luminous, high-chroma — never black murk. NO grim, NO gore, NO decay, NO mud, NO symmetry, NO flat digital, NO airbrushed smoothness, NO sci-fi, NO text/UI/watermarks/frames, NO people, NO humanoid figures, NO goblins, NO creatures, NO view of a camp or hidden place — the reveal is not in the image. Ultra-wide cinematic 21:9.
```

**Tags riuso:** `forest, giant-tree, climbable, canopy, daylight, no-people, no-goblins, generic`

## Generation notes

- Il divieto chiave: «any view of a camp or hidden place» — niente reveal.
- Aspect ≥ 21:9 — contratto theatre stage 2.4:1 (`theaterAspect` in `gameFrameConfig`, gate `npm run check:quest-art`, tolleranza ±5%); cover-fit, soggetto focale nella fascia verticale centrale. Ricodifica target 3168×1320.
