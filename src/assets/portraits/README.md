# Portraits

Two versions of every resident portrait live here. They are not interchangeable:

| Where | Version | Used by |
|---|---|---|
| `src/assets/portraits/<name>.png` | **Full portrait** (512×279, landscape) | PgCard, roster bust, detail views (CSS crop via `portraitCrop`) |
| `src/assets/portraits/medal/<name>.webp` | **Medallion square** (279×279, generated) | `WanderlustMedalOverlay`, drag preview circle, slot medal, flight proxy |

## Why the medallion has its own file

The medallion shows only a circle of about 55 units. `WanderlustMedalOverlay` frames the
portrait with SVG `preserveAspectRatio="xMidYMin slice"`, which is a centred, top-anchored
square. The full PNG is ~250 KB and decodes slowly on first use, so the medallion appeared
late after a drop. The medal square is the same framing at ~20 KB.

## Generating the medal squares (automatic)

After adding or replacing a portrait, run:

```bash
python3 scripts/build-medal-portraits.py
```

- The crop is the centred square of side `min(w, h)`, anchored at the top. It matches what the medallion shows.
- Output is native resolution (no resampling). Use `--size 256` to downsize only. It never upscales.
- Existing outputs are skipped when newer than the source. Use `--force` to rebuild.
- Sources whose square is below 256 px get a warning, because a 2× medallion would upscale them.
- Name matching is by file stem: `portrait male warrior.png` → `medal/portrait male warrior.webp`.
- The `medal/` folder is excluded from `portraitAutoImports` (top-level glob only), so it never becomes a resident portrait.

Mapping from full portrait to medal square lives in
`src/balancing/config/idleVillage/medalPortraitAssets.ts` (`getMedalPortraitUrl`). Callers
keep passing the full portrait URL. A portrait with no medal square falls back to the full one.

## Scaling

- The portrait fills 55 of the medallion's 86 units, so a medallion of M CSS px shows the 279 px square at about 0.64·M px. At 2× DPR, 279 px is enough up to M ≈ 218 CSS px (the sizes in use are 40–96).
- Above that size the square is upscaled and softens slightly.
- If a larger medallion is needed, regenerate with a bigger source, not with CSS scaling.
