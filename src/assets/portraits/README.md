# Portraits

**Where the originals live.** The full-res source art — exactly as delivered
(Director downloads, artist exports, generated plates) — is copied into
`src/assets/portraits/`. Never link or reference files outside the repo
(`~/Downloads`, desktop): Vite only serves what the glob
`portraitAutoImports` picks up, and Downloads is transient. `medal/` is the
only derived folder — generated, never hand-edited.

Two versions of every resident portrait live here. They are not interchangeable:

| Where | Version | Used by |
|---|---|---|
| `src/assets/portraits/<name>.png` | **Full portrait** (landscape; e.g. 512×279 for the old busts, the villager plates are ~1400–1600 px wide) | PgCard, roster bust, detail views (CSS crop via `portraitCrop`), character sheet (`fullFigure` in `SchedaPergamena`/`HeroSheetPanel`) |
| `src/assets/portraits/medal/<name>.webp` | **Medallion square** (generated, top-anchored centred crop) | `WanderlustMedalOverlay`, drag preview circle, slot medal, flight proxy |

## Wiring a portrait to a resident (end-to-end)

1. Drop the full art in `src/assets/portraits/` (any of png/jpg/jpeg/webp; file names
   with spaces are fine — the stem becomes the auto-profile id `auto_<stem>`).
2. Generate the medallion square: `python3 scripts/build-medal-portraits.py`.
3. Add a static profile in `src/balancing/config/idleVillage/residentVisuals.ts`:
   `portrait.src` resolved via `AUTO_PORTRAIT_SOURCES.find(s => s.id.includes('<stem>'))`,
   `appliesToResidentIds: ['<resident-id>']`, and `fullFigure` (same or different art)
   for the character sheet.
4. Point the resident at it: `visualProfileId` in the seed
   (`testRosterResidents.ts`) or on the `SavedCharacter`.
   Resolution order: resident `portraitUrl` override → `statSnapshot.portraitUrl` →
   `matchVisualProfile(profileId → statProfileId → residentId)` → placeholder.
5. Everything downstream is automatic: `getResidentPortraitUrl` feeds cards/medals;
   `getMedalPortraitUrl` maps the full URL to the medal square **by file stem**
   (`medalPortraitAssets.ts`); `ALL_PORTRAIT_ASSET_URLS` feeds boot warm-up.
   Names/visuals are canonical — they propagate to existing saves
   (`mergeStoreConsequences` overlays only consequence fields).

## Framing contract (what the medallion crops)

The medallion square is `min(w, h)` centred horizontally, **anchored at the top**
(SVG `xMidYMin slice` — same as the runtime crop). Portrait prompts must keep the
face in the **top-centre band**: a low or off-axis face lands outside the circle.
Very wide plates are fine (villager art is ~2:1) — the crop takes the centre square.
Check `medal/<name>.webp` after generating; if the framing is wrong for one
character, adjust `portraitCrop`/`defaultCrop` on the resident profile rather than
patching the image.

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
