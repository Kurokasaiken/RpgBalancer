# F0 — Evento di viaggio: il mercante (opzionale) → `mercante.png`

Evento casuale in viaggio (pattern S1: «Viaggio — mercante»). Beat: l'incontro
un istante prima che avvenga. Il mercante è un NPC — consentito e presente;
il party del giocatore non è mai disegnato.

## Full prompt — generatori esterni (Gemini / Grok / GPT)

```text
MERCANTE — A roadside encounter about to begin where a forest road forks, the meeting seen from the travelers' side of the road. SUBJECT — the merchant: a broad, weathered man in a faded cinnabar coat, one hand raised in open greeting, the other resting on rope-lashed goods — pots, rolled cloth, a hand-painted sign still swinging; brass fittings catch the light, a small roadside shrine of stacked stones stands by the wheel of his canvas-covered wagon. NO OTHER FIGURES — the approaching party is never shown. COMPOSITION: merchant and wagon off-center on the road, forest pressing close on both sides under a vibrant azure sky. LIGHTING: warm midday sun through golden dust motes, saturated shadow pooling under the wagon. PALETTE: cinnabar and amber against Veronese green, vibrant azure sky, deep teal-emerald shadows; NO grey, NO brown, NO mud. TECHNIQUE: thick oil impasto, broad palette-knife strokes in the Jaime Jones / Jeff Easley tradition, tactile matter on canvas, brass and timber; the merchant's face rendered clean and sculptural at the focal point — split-rendering, Ruan Jia polish, defined but not photoreal; the world as rude beauty — weathered and tactile, never squalid. MOOD: road-luck + the quiet suspicion of strangers. Luminous, high-chroma — light wins over darkness, the deepest shadow is saturated color, never black murk. NO grim, NO gore, NO decay, NO mud, NO perfect symmetry, NO flat digital surfaces, NO airbrushed smoothness, NO sci-fi, NO text/UI/watermarks/frames, NO adventurers, NO armed travelers, NO creatures, NO figure other than the merchant. Ultra-wide cinematic 21:9.
```

**Tags riuso:** `road, fork, npc-merchant, wagon, goods, midday, azure-sky, people-allowed, no-goblins, generic`

## Generation notes

- Scena opzionale — attivarla quando il nodo evento mercante esiste nel
  grafo della quest.
- Aspect ≥ 21:9 — contratto theatre stage 2.4:1 (`theaterAspect` in `gameFrameConfig`, gate `npm run check:quest-art`, tolleranza ±5%); cover-fit, soggetto focale nella fascia verticale centrale. Ricodifica target 3168×1320.
