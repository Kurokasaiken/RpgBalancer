# F2 — Il bottino (`carro-nascosto`) → `bottino.jpg` — BRIEF v3 (TABLEAUX, occlusion-first)

Beat: il fagotto della refurtiva avvistato dall'alto — la fiction dice
"si vede solo dall'alto". Pre-check, nessuna persona, nessun goblin.

## Correzione v3 (2026-10-24): occlusione, non enumerazione

v2 fallita due volte: elencare gli oggetti (kettle/rope/sack) li rendeva
soggetto scoperto. Regola appresa: il segreto si dipinge come ANOMALIA
(un bordo di tela, un nodo) dentro un terreno uniforme, con occludente
vicino — mai come oggetti. La "cache" non è cosa c'è, è che qualcosa
stona. Gli oggetti enumerati diventano sempre il soggetto.

## Correlazione (archetype × shot × ambient)

- **Archetipo: TABLEAUX/ISLAND** — camera dall'alto sulla radura boscosa;
  il fagotto è il detail island nel terzo basso-centro (non tocca i
  bordi). Orizzonte fuori frame — il mondo è il suolo.
- **Shot**: `hold` + push-down lento (verdict-zoom) — la scoperta
  dall'alto si legge in fermo.
- **Ambient**: `dust` (radura), `glint` sulle minuterie metalliche
  sparse, `drift` sul bordo bosco. NO fog (giorno), NO shaft (coperto).
- **Hooks**: A2 hidden object — il fagotto ha un bordo di tela cerata che
  si distingue appena dal terreno; se il player lo trova prima del
  reveal: `lootFound` → intel sul check.
- **Kill list dedicata**: niente carro (fiction revocata), niente
  campanelli/fili/corde, niente trappole visibili, niente figure.

## Full prompt

```text
HIDDEN CACHE — painted in heavy oil impasto. A forest floor glimpsed from above, over the edge of a rise — a secret that only elevation reveals. VIEWPOINT: we are crouched at the top of a mossy bank looking steeply down — the near edge of the bank, a tumble of roots and bracken, frames the lower half of the image and partially screens the hollow below. SUBJECT: the forest floor itself is the painting — leaf litter, root flares, fern shadows — and there, mostly swallowed by the litter at the hollow's floor, one thing does not belong: the straight taut edge of a waxed canvas tarp, a pale corded knot, the clean geometry of something packed and hidden — nothing of what lies beneath is visible, no goods, no contents, only the covered shape betrayed by its own geometry. COMPOSITION: no horizon — the world is the ground; the near bank occupies the lower third as a soft dark occluder, the hollow sits mid-frame with the hidden shape small at its center, the treeline closes the top in shade; everything organic meanders — the single man-made shape hides by being small, not centered, not hero-lit. NO symmetry. LIGHTING: dappled midday light through the canopy — the litter shimmers, the hidden shape stays in shadowed stillness; the anomaly reads by texture contrast, not by light. PALETTE: Wanderlust pigments — ultramarine in the treeline shadow, verde Veronese undergrowth, ochre-amber where light lands, deep teal in every shade; never grey, never brown mud. The frame stays luminous and high-chroma — light wins over darkness, even the deepest shadow is saturated color, never black murk. TECHNIQUE: thick oil impasto, broad palette-knife strokes, Jaime Jones / Jeff Easley tradition — tactile leaf litter, moss, root bark; rude beauty. MOOD: the patient eye rewarded — nothing here, except the thing that pretends to be nothing. NO objects visible on or near the hidden shape — no kettle, no rope lying out, no sacks, no chest, NO open goods of any kind, NO people, NO goblins or creatures, NO faces, NO fog painted, NO light shafts, NO smoke, NO readable text/UI/watermarks, NO symmetry, NO sci-fi, NO flat digital. Ultra-wide cinematic 2.4:1.
```

## Generation notes

- **Life plan**: bundle = anchor glint/static; leaf litter = dust field;
  il fagotto non si anima (è la scoperta, non un attore).
- **Scorecard**: veto se appare il carro o qualunque ruota; il fagotto
  deve essere leggibile-ma-camuffato (A2), non invisibile né ovvio.
- Aspect 2.4:1; recode 3168×1320; safe window 2.05.
