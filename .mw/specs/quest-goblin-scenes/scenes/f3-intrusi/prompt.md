# F3 — Gli intrusi (`intrusi`) → `intrusi.jpg` — BRIEF v2 (SHOULDER)

Beat: sagome goblin che si insinuano verso la radura — il player le vede
arrivare da dietro copertura. Specchio dell'agguato: qui siamo noi gli
osservatori nascosti.

## Correlazione

- **Archetipo: SHOULDER** — massa rocciosa near ~35% angolo basso-DX
  (specchio: agguato usa sx, qui dx per la rotazione bordo); i due terzi
  aperti sulla treeline con le sagome.
- **Shot**: `enter-creep` lungo la spalla → `pose-tense` → drift.
- **Ambient**: `dust`, `glint` su punte/metallo nelle sagome (occhi/armi
  = il primo segnale), `drift` basso. NO fireflies (giorno/alert),
  NO fog (regola f7/fog=tracce).
- **Hooks**: A1 discovery — le sagome dipinte leggibili-ma-camuffate;
  contarle = `countedIntruders` → vantaggio sul check sorpresa.
- **Kill list**: niente volti/anatomie goblin leggibili, niente palo
  isolato come near (massa convessa con gradini interni), niente nebbia
  dipinta, niente fili/allarmi.

## Full prompt

```text
THE INFILTRATORS — painted in heavy oil impasto. A forest path at midday watched from behind cover — the moment before they know we see them. SUBJECT: at the treeline edge, low dark shapes slipping between the trunks — three or four goblin silhouettes crouched in the undergrowth, moving in file toward the clearing — pointed ears and a weapon edge catching stray light, bodies half-swallowed by fern shadow — a mass of sneaking shapes, never one readable face. COMPOSITION: a broad mossy boulder-and-root mass fills the lower-right corner and right edge, cropped by frame — our cover — a single convex dark mass with a clean silhouette and visible inner depth steps (stacked stones, layered roots — never a flat wall, never a thin post); the left two-thirds open onto a sunlit path curving past the treeline where the infiltrators move, the treeline stepping back in two clear depth planes; above the treeline a wedge of pale sky, smooth low-frequency. NO symmetry — the mass leans asymmetric. LIGHTING: hard midday sun on the open path, the near mass in deep saturated shadow — the infiltrators read as saturated silhouettes and points of metal glint against the lit ground. PALETTE: Wanderlust pigments — ambra sunlit path, verde Veronese undergrowth, deep teal/smeraldo shadow, ultramarine in the treeline depth; never grey, never brown, never mud. TECHNIQUE: thick oil impasto, palette-knife strokes, Jaime Jones / Jeff Easley tradition, tactile on stone, root, moss; Justin Gerard whimsy in the goblin shapes — grotesque but vibrant, never horror. MOOD: we see them before they see us — the held breath of advantage. Luminous, high-chroma — light wins over darkness, even the deepest shadow is saturated color, never black murk. NO fog painted, NO shafts, NO smoke, NO embers, NO dust clouds painted, NO readable faces or anatomy, NO close-up goblins, NO weapons raised — they sneak, they do not charge, NO wire or traps, NO text/UI/watermarks, NO symmetry, NO gore, NO grim, NO sci-fi. Ultra-wide cinematic 2.4:1.
```

## Generation notes

- **Life plan**: sagome = reveal-as-grade candidato (T1 PLAN-084) +
  glint su armi; la massa near = plateau warp per il creep.
- **Scorecard**: bake obbligatorio — se la massa è gradiente e non
  plateau, rigenerare (è il motore del creep, come in agguato).
- Aspect 2.4:1; recode 3168×1320.
