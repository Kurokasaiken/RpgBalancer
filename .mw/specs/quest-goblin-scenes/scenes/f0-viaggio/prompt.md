# F0 — Viaggio (`gob-inizio`) → `viaggio.png`

Nodi: `gob-inizio`. Beat: la partenza — la strada fuori dal villaggio.
Party del giocatore mai disegnato; NPC/generici ammessi (qui la strada resta
vuota per mood). Eventi casuali di viaggio (mercante, incidente): scena
dedicata opzionale `f0-mercante`.

## Full prompt — generatori esterni (Gemini / Grok / GPT)

```text
VIAGGIO — A majestic wide-angle departure landscape on a frontier road leaving a mountain village at morning, composed for a cinematic theater view. SUBJECT: cart ruts cut deep in pale dust, a weathered milestone of alpine stone, the last timber-and-golden-thatch roofs shrinking low behind; ahead the road dives toward a sun-drenched ancient forest wall and jagged Dolomites peaks clawing a vibrant azure sky. NO TRAVELERS — the party belongs to the player; the departure lives in the land itself. COMPOSITION: the road a single leading line, village low behind, forest wall and monumental peaks dominating the frame, deliberately asymmetric. LIGHTING: clean brilliant morning sun slamming into surfaces, long saturated shadows, golden prismatic dust motes drifting in the air. PALETTE: ultramarine distance, Veronese green forest wall, amber light, vibrant azure sky; shadows deep teal-emerald — NO grey, NO brown, NO mud, NO black. TECHNIQUE: thick oil impasto, broad confident palette-knife strokes in the Jaime Jones / Jeff Easley tradition, Sparth-like monumental scale in the peaks, tactile matter on dust, timber and stone; the world rendered as rude beauty — weathered and tactile, never squalid. MOOD: departure + the world widening with risk. The frame stays luminous and high-chroma — light wins over darkness, even the deepest shadow is saturated color, never black murk. NO grim, NO gore, NO decay, NO mud, NO perfect symmetry, NO flat digital surfaces, NO airbrushed smoothness, NO sci-fi, NO text, NO UI, NO watermarks, NO frames, NO people, NO humanoid figures, NO creatures of any kind. Ultra-wide cinematic 21:9.
```

**Tags riuso:** `road, village-outskirts, morning, azure-sky, mountains, departure, wilderness, no-people, no-goblins, generic`

## Generation notes

- La strada vuota è una scelta di mood: «si marcia» lo legge il giocatore.
- Aspect ≥ 21:9 — contratto theatre stage 2.4:1 (`theaterAspect` in `gameFrameConfig`, gate `npm run check:quest-art`, tolleranza ±5%); cover-fit, soggetto focale nella fascia verticale centrale. Ricodifica target 3168×1320.
