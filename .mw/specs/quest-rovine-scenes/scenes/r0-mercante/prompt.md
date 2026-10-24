# R0 — Il mercante all'ingresso → `mercante.png`

L'incontro un istante prima della conversazione: un mercante racconta di un ingresso antico sotto il fiume. NPC consentito; il party non è mai disegnato.

Nodi coperti: `rv-mercante, rv-check-osserva, rv-check-incalza`.

## Full prompt — generatori esterni (Gemini / Grok / GPT)

```text
IL MERCANTE ALL'INGRESSO — THE MERCHANT AT THE RIVER — painted in heavy oil impasto. SUBJECT: a weathered riverside track at the edge of a wide, slow river; a broad merchant in a faded cinnabar coat stands on a flat stone near the water, one hand pointing toward a dark arch half-sunk under the far bank, the other clutching a coil of wet rope, his eyes already on the viewer; a mule with a patched pack waits behind him; reeds and mossy boulders frame the bank. NO OTHER FIGURES — the approaching party is never shown. COMPOSITION: the merchant off-center on the lower left, the water-level arch visible but unexplained at the right third, river mist between them. LIGHTING: warm late-morning sun low over the water, golden dust motes in the mist, saturated shadow in the reeds. PALETTE: cinnabar and amber against Veronese green, vibrant azure water, deep teal-emerald shadows; NO grey, NO brown, NO mud. TECHNIQUE: thick oil impasto, broad palette-knife strokes in the Jaime Jones / Jeff Easley tradition, tactile matter on canvas, stone, brass and timber; the merchant's face rendered clean and sculptural at the focal point — split-rendering, Ruan Jia polish, defined but not photoreal; the world as rude beauty — weathered and tactile, never squalid. MOOD: a bargain half-told: curiosity with the quiet suspicion of strangers. Luminous, high-chroma — light wins over darkness, the deepest shadow is saturated color, never black murk. NO grim, NO gore, NO decay, NO mud, NO perfect symmetry, NO flat digital surfaces, NO airbrushed smoothness, NO sci-fi, NO text/UI/watermarks/frames, NO adventurers, NO armed travelers, NO creatures, NO figure other than the merchant. Ultra-wide cinematic 21:9.
```

**Tags riuso:** `river, riverbank, npc-merchant, mule, arch, mist, morning, people-allowed, no-creatures, generic`

## Generation notes

- Aspect 21:9 (ricodifica finale 3168×1344 JPEG q85 progressive, come la scene library).
- Dopo la generazione: nominare per **soggetto**, non per quest/fase; aggiungere la riga al `public/assets/scene-library/CATALOG.md`; aggiornare `NODE_ART` in `questArt.ts`.
- Verificare che non ci sia testo nell'immagine (kill list `NO text`): se compare, pulirlo come per `mercante-strada.jpg`.
