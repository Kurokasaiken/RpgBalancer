# R2 — Le guardie nella galleria → `guardie.png`

Due guardie davanti al passaggio, prima di decidere se sgattaiolare o combattere. Guardie = NPC consentiti.

Nodi coperti: `rv-guardie, rv-check-sneak, rv-check-fight`.

## Full prompt — generatori esterni (Gemini / Grok / GPT)

```text
LE GUARDIE NELLA GALLERIA — THE GUARDS IN THE GALLERY — painted in heavy oil impasto. SUBJECT: a long torchlit stone gallery narrowing toward a low doorway; two guards in dull-gold lamellar and cinnabar sashes stand at ease with long pikes grounded, one leaning a shoulder on a carved pillar, the other turned toward a flicker in the dark; rubble and loose flagstones in the foreground, a heap of crates by the wall hiding a possible path along the shadow side. THE PARTY IS NEVER SHOWN. COMPOSITION: the two guards small and centered at the end of the gallery, the loose stones and the shadowed side path large in the foreground, receding perspective. LIGHTING: warm torchlight in amber pools against cool blue-violet shadow, golden dust in the air. PALETTE: amber and cinnabar torchlight against ultramarine and teal shadow, Veronese green moss on the pillars; deep teal-emerald shadows; NO grey, NO brown, NO mud. TECHNIQUE: thick oil impasto, broad palette-knife strokes in the Jaime Jones / Jeff Easley tradition, tactile matter on canvas, stone, brass and timber; the nearer guard's face and the pike heads rendered clean and sculptural at the focal point — split-rendering, Ruan Jia polish, defined but not photoreal; the world as rude beauty — weathered and tactile, never squalid. MOOD: held breath: the way past is quiet or it is bloody. Luminous, high-chroma — light wins over darkness, the deepest shadow is saturated color, never black murk. NO grim, NO gore, NO decay, NO mud, NO perfect symmetry, NO flat digital surfaces, NO airbrushed smoothness, NO sci-fi, NO text/UI/watermarks/frames, NO adventurers, NO armed travelers, NO creatures, NO figure other than the two guards, NO drawn weapons mid-strike. Ultra-wide cinematic 21:9.
```

**Tags riuso:** `gallery, torchlight, guards, pikes, rubble, shadow-path, people-allowed, no-creatures, generic`

## Generation notes

- Aspect 21:9 (ricodifica finale 3168×1344 JPEG q85 progressive, come la scene library).
- Dopo la generazione: nominare per **soggetto**, non per quest/fase; aggiungere la riga al `public/assets/scene-library/CATALOG.md`; aggiornare `NODE_ART` in `questArt.ts`.
- Verificare che non ci sia testo nell'immagine (kill list `NO text`): se compare, pulirlo come per `mercante-strada.jpg`.
