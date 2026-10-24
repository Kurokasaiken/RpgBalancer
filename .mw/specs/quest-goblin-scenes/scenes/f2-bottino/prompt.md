# F2 — Il bottino (`carro-nascosto`) → `bottino.jpg` — BRIEF v6 (fiction-true + canonical lint)

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
HIDDEN CACHE — A masterful cinematic oil painting in heavy textured impasto: thick, violent palette-knife strokes, visible layers of paint adding physical depth. A pit sunk in the forest floor, seen from above — and inside, goods a merchant would kill for: ROLLS OF FINE SILK. SUBJECT: at lower-center an unmistakable hollow dug between root flares — its rim of wrenched roots and pushed-back litter; dark tanned hides drawn back at one edge so the pit's interior falls to real depth and saturated shadow; and there, tucked in that shadow, several fabric bolts packed tight — the end of one bolt rolled out just enough to show its colors: a crimson-cinnabar edge, an indigo band, a fold of warm amber cloth — trade goods worth selling, unmistakably valuable, unmistakably hidden. One coin or brass clasp catches a sliver of dappled light at the silk's edge — the tell that guides the eye in. Around the pit, undisturbed undergrowth: emerald moss, bright ferns, root bark, ochre litter as accent not carpet. COMPOSITION: no horizon — the world is the floor; the pit is the dark focal mouth off-center; the silk colors and the gleam are the brightest notes in frame; a mossy bank occludes the lower-left edge. LIGHTING: dappled midday sun — the litter glints, the pit stays in saturated teal shade except the silk edges and the struck clasp. PALETTE: emerald moss and veronese-green undergrowth dominant, ultramarine in the pit's depth, deep teal-emerald every shadow, the silk bolts cinnabar-red, indigo and amber — NO grey, NO brown dominance, NO mud. The frame stays luminous and high-chroma — light wins over darkness, even the deepest shadow is saturated color, never black murk. TECHNIQUE: Jaime Jones broad oil strokes, Jeff Easley weight — the silk painted as folded ribbons of saturated color, tactile moss, root, bark — the world rendered as rude beauty, weathered and tactile, never squalid. MOOD: patience rewarded + the quiet thrill of the find. NO books or rectangular objects, NO grey desaturated bundle, NO chest or kettle or scattered goods, NO excavated earth ring, NO people, NO creatures, NO faces, NO fog painted, NO light shafts, NO smoke, NO grim, NO gore, NO decay, NO mud, NO symmetry, NO flat digital, NO airbrushed smoothness, NO sci-fi, NO text/UI/watermarks/frames/signatures/logos. 21:9 cinematic scope.
```

## Generation notes

- **Life plan**: bundle = anchor glint/static; leaf litter = dust field;
  il fagotto non si anima (è la scoperta, non un attore).
- **Scorecard**: veto se appare il carro o qualunque ruota; il fagotto
  deve essere leggibile-ma-camuffato (A2), non invisibile né ovvio.
- Aspect 2.4:1; recode 3168×1320; safe window 2.05.

**Tags riuso:** `forest-floor`, `hidden-cache`, `no-goblins`, `midday`, `from-above`, `generic`
