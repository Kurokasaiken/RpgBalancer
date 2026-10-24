# R7 — Le rovine sotto il fiume — copertina → `rovine-hero.png`

Copertina della quest nel planner e immagine del punto di non ritorno: l'ingresso sommerso delle rovine.

Nodi coperti: `quest-card (copertina), rv-checkpoint`.

## Full prompt — generatori esterni (Gemini / Grok / GPT)

```text
LE ROVINE SOTTO IL FIUME — COPERTINA — THE RUINS BENEATH THE RIVER — painted in heavy oil impasto. SUBJECT: a broad river bending around a sunken stone gateway, its carved lintel and two toppled columns rising half out of the water, steps descending into dark green depth, reeds and willows on the banks, a flight of pale birds crossing the sky; a faint warm glow far inside the arch hints at torchlight below. NO FIGURES. COMPOSITION: the half-sunken gateway on the right third, the river sweeping in a long curve from the left, the sky open above. LIGHTING: warm morning sun raking the lintel, golden dust motes over the water, saturated teal in the arch. PALETTE: gold and cinnabar stone against vibrant azure water and Veronese green, deep teal-emerald shadows; NO grey, NO brown, NO mud. TECHNIQUE: thick oil impasto, broad palette-knife strokes in the Jaime Jones / Jeff Easley tradition, tactile matter on canvas, stone, brass and timber; the carved lintel and the first steps rendered clean and sculptural at the focal point — split-rendering, Ruan Jia polish, defined but not photoreal; the world as rude beauty — weathered and tactile, never squalid. MOOD: an invitation older than memory. Luminous, high-chroma — light wins over darkness, the deepest shadow is saturated color, never black murk. NO grim, NO gore, NO decay, NO mud, NO perfect symmetry, NO flat digital surfaces, NO airbrushed smoothness, NO sci-fi, NO text/UI/watermarks/frames, NO adventurers, NO armed travelers, NO creatures, NO people, NO modern ruins, NO pyramids, NO sphinx. Ultra-wide cinematic 21:9.
```

**Tags riuso:** `ruins, gateway, river, columns, steps, willows, morning, card-cover, wide, no-people, no-creatures`

## Generation notes

- Aspect 21:9 (ricodifica finale 3168×1344 JPEG q85 progressive, come la scene library).
- Dopo la generazione: nominare per **soggetto**, non per quest/fase; aggiungere la riga al `public/assets/scene-library/CATALOG.md`; aggiornare `NODE_ART` in `questArt.ts`.
- Verificare che non ci sia testo nell'immagine (kill list `NO text`): se compare, pulirlo come per `mercante-strada.jpg`.
