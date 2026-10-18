# R3 — La sala del tesoro → `tesoro.png`

Il tesoro nella luce delle torce, «troppo facile, troppo esposto». Immagine pre-scelta: la trappola non è ancora scattata, le lastre sono integre.

Nodi coperti: `rv-sala, rv-check-trappola, rv-tesoro-scelta, rv-check-prendi, rv-check-sicuro`.

## Full prompt — generatori esterni (Gemini / Grok / GPT)

```text
LA SALA DEL TESORO — THE TREASURE ROOM — a wide vaulted chamber, its floor laid in large square slabs, a few of them subtly different in tone; at the center a spilled heap of coins, chalices and an ancient iron-bound chest lit by wall torches; counterweights on chains hang half-seen in the vault above; a worn path of bare stone leads to the heap while the sides stay in shadow. NO FIGURES — the party is never shown. The floor is whole: no cracks, no collapse yet. COMPOSITION: the treasure heap centered in warm torchlight, the slab floor leading to it in clear perspective, the hanging chains a quiet hint in the upper third. LIGHTING: warm torchlight, glints of gold, saturated violet-teal shadow in the vault corners. PALETTE: gold, amber and cinnabar against deep teal and ultramarine, Veronese green patina on the bronze; NO grey, NO brown, NO mud. TECHNIQUE: thick oil impasto, broad palette-knife strokes in the Jaime Jones / Jeff Easley tradition, tactile matter on canvas, stone, brass and timber; the chest and the nearest chalice rendered clean and sculptural at the focal point — split-rendering, Ruan Jia polish, defined but not photoreal; the world as rude beauty — weathered and tactile, never squalid. MOOD: temptation with a held breath: too easy, too exposed. Luminous, high-chroma — light wins over darkness, the deepest shadow is saturated color, never black murk. NO grim, NO gore, NO decay, NO mud, NO perfect symmetry, NO flat digital surfaces, NO airbrushed smoothness, NO sci-fi, NO text/UI/watermarks/frames, NO adventurers, NO armed travelers, NO creatures, NO people, NO visible collapse. Ultra-wide cinematic 21:9.
```

**Tags riuso:** `vault, treasure, coins, chalice, chest, slabs, counterweights, torchlight, no-people, no-creatures, generic`

## Generation notes

- Aspect 21:9 (ricodifica finale 3168×1344 JPEG q85 progressive, come la scene library).
- Dopo la generazione: nominare per **soggetto**, non per quest/fase; aggiungere la riga al `public/assets/scene-library/CATALOG.md`; aggiornare `NODE_ART` in `questArt.ts`.
- Verificare che non ci sia testo nell'immagine (kill list `NO text`): se compare, pulirlo come per `mercante-strada.jpg`.
