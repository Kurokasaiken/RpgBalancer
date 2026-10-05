# Goblin Invasion Event Card — Design Tokens (v1)

Extracted from `public/mockups/external/goblin-event-lab/goblin-invasion-mockup.png` via PIL median-cut quantization (16/24 colors) + manual curation for accents.

## Palette

### Surface / paper

| Token | Hex | Use |
|-------|-----|-----|
| `--wl-parchment` | `#e9e3c5` | Banner background, main parchment |
| `--wl-parchment-dim` | `#c2b583` | Aged/darker paper areas |

### Timber

| Token | Hex | Use |
|-------|-----|-----|
| `--wl-timber-light` | `#c2b583` | Highlighted wood grain |
| `--wl-timber-mid` | `#976e37` | Main frame wood |
| `--wl-timber-dark` | `#5d4824` | Deep wood grooves, shadow side |
| `--wl-timber-ink` | `#3e3e28` | Wood knots, heavy shadow |

### Stone / thatch

| Token | Hex | Use |
|-------|-----|-----|
| `--wl-stone` | `#6f7357` | Stone ribs, thatch shadow |
| `--wl-stone-dark` | `#38361f` | Deep stone crevices |

### Shadow (Bible: deep teal/emerald, never grey/brown)

| Token | Hex | Use |
|-------|-----|-----|
| `--wl-shadow-teal` | `#09100d` | Directional shadows (dark teal) |
| `--wl-shadow-emerald` | `#18271a` | Secondary deep green shadow |

### Accents (manually curated from reference)

| Token | Hex | Use |
|-------|-----|-----|
| `--wl-forest-green` | `#4a7c3b` | Goblin totem base / war paint |
| `--wl-war-red` | `#b0301a` | Tattered banners, threat text |
| `--wl-cinabrese` | `#c94a2f` | Bright red highlights |
| `--wl-amber` | `#d4a030` | Gold / sun-warmed accents |
| `--wl-ultramarine` | `#4a6fa5` | Sky, button, small blue gems |
| `--wl-sky` | `#7ab8c9` | Sky gradient light |

### Text

| Token | Hex | Use |
|-------|-----|-----|
| `--wl-text-primary` | `#2e1a0a` | Main body text on parchment |
| `--wl-text-light` | `#e9e3c5` | Text on dark buttons |
| `--wl-text-warning` | `#c94a2f` | Threat / urgency callouts |

## Typography

- Title: carved/rune-like uppercase, bold, with slight horizontal compression, shadow inset.
- Body: sans/serif hybrid, legible at 14-18px.
- Label: condensed uppercase tracking.

## Sizing (relative to card)

- Card: `aspect-ratio: 3/4`.
- Banner title: ~12% card height.
- Hero artwork (totem + sky): ~40% card height.
- Description panel: ~12% card height.
- Stats row: ~20% card height.
- Action buttons: ~16% card height total.

## Effects

- Solar Triumph: warm top-left highlight, cool bottom-right shadow.
- Dust motes: subtle golden particles, CSS-only where possible.
- Texture: wood grain and parchment roughness via SVG feTurbulence or CSS noise.
