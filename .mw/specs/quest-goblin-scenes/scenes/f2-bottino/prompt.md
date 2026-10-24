# F2 — Il bottino (`carro-nascosto`) → `bottino.jpg` — BRIEF v4 (fiction-true: gob-bottino)

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
WHAT WAS HIDDEN — painted in heavy oil impasto. A patch of forest undergrowth seen from above that has been put back together with too much care. VIEWPOINT: we look down from a rise at the forest floor — high oblique, the near bank's roots and bracken frame the lower edge. SUBJECT: the ground itself — leaf litter, root flares, fern shadow — and there, at lower-center, a single patch of undergrowth that is subtly wrong: leaves arranged a little too evenly, litter smoothed over a low mound, ferns replanted at the rim where the soil was dug — the tidiness of a thing buried in secret; at one edge, barely readable, the taut dark lip of a hide-lined hollow peeking through. Nothing is open, nothing is out — the cache is closed. COMPOSITION: no horizon — the world is the floor; the too-tidy patch sits as a small off-center island, wrong only to the patient eye; the forest floor meanders organically around it — the anomaly is order among disorder. NO symmetry. LIGHTING: dappled midday light through canopy — the litter glints, the patch stays matte and still; the eye finds it by texture, not by light. PALETTE: Wanderlust pigments — verde Veronese undergrowth, ochre-amber where light lands, ultramarine in the treeline shade, deep teal in every shadow; never grey, never brown mud. The frame stays luminous and high-chroma — light wins over darkness, even the deepest shadow is saturated color, never black murk. TECHNIQUE: thick oil impasto, broad palette-knife strokes, Jaime Jones / Jeff Easley tradition — tactile litter, moss, root bark; rude beauty. MOOD: the patient eye rewarded — nothing here, except the place that pretends too hard to be nothing. NO goods or objects visible anywhere — no bundle, no tarp, no kettle, no sacks, no chest, NO people, NO goblins or creatures, NO faces, NO fog painted, NO light shafts, NO smoke, NO readable text/UI/watermarks, NO symmetry, NO sci-fi, NO flat digital. Ultra-wide cinematic 2.4:1.
```

## Generation notes

- **Life plan**: bundle = anchor glint/static; leaf litter = dust field;
  il fagotto non si anima (è la scoperta, non un attore).
- **Scorecard**: veto se appare il carro o qualunque ruota; il fagotto
  deve essere leggibile-ma-camuffato (A2), non invisibile né ovvio.
- Aspect 2.4:1; recode 3168×1320; safe window 2.05.
