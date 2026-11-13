# Goblin Invasion — External Mockup Example

**Component target:** `GoblinEventLabPage` → `http://localhost:5173/goblin-event-lab`
**Status:** External mockup reference for the mockup-to-component pipeline (when implemented)
**Date added:** 2026-08-14

---

## Files

| File | Description |
|---|---|
| `goblin-invasion-mockup.png` | Main event panel mockup (full version) |
| `goblin-invasion-mockup-copy.png` | Copy of the main mockup (likely variant/alternate) |
| `goblin-march-trasparente.png` | Goblin march icon/emblem, transparent (with arrow) |
| `goblin-march-trasparente-no-freccia.png` | Same icon without the arrow |

---

## Visual analysis for the pipeline

### What the mockup contains
- **Outer frame:** wooden/twined border with banner top.
- **Banner:** "GOBLIN INVASION" title in a runic/painted font.
- **Central illustration:** goblin totem/mask with spears and red war paint/banners.
- **Copy block:** "WORLD EVENT / A GOBLIN ARMY IS MARCHING... / YOUR VILLAGE WILL BE ATTACKED".
- **Stats row:** "ENEMY STRENGTH 3,200+ GOBLINS", "ARRIVAL IN 2 DAYS", "TARGET YOUR VILLAGE".
- **CTAs:** "PREPARE DEFENSES", "VIEW DEFENSES".

### Pipeline notes
- **Baked text present:** All user-facing text is rendered as pixels in the image. This is a **production violation** — every string must be replaced with `useTranslation` keys and rendered in React.
- **High visual density:** Many decorative details (twine, spears, banners, gems). A good stress test for the "CSS/React first" principle — most of these should become tokens/CSS, only the central illustration and specific icons should be assets.
- **Textured frame:** The wooden border is a candidate for `CSS_PROCEDURAL` (borders, shadows, gradients) or a small `RGBA_TEXTURE` if the painted impasto is irreplaceable.
- **Central totem/illustration:** likely the only true `RGBA_TEXTURE` candidate, if rigeneration cannot reproduce it via `img2img`/`IP-Adapter` from this reference.
- **Goblin march icons:** `SVG_INLINE` candidates; the transparent PNGs can serve as shape reference for `Potrace`/`VTracer`.

### Provenance
- **Source:** external mockup supplied by the Director.
- **License / category (A/B/C):** **TO BE VERIFIED** before any asset derived from these images enters `public/assets/`.
- **Do not use as production assets until provenance is recorded and license confirmed.**

---

## Classification draft (to be finalized when the pipeline runs)

| Element | Proposed classification | Notes |
|---|---|---|
| Outer wooden frame | `TOKEN` + `CSS_PROCEDURAL` | Use border-image, shadows, color tokens |
| Top banner | `TOKEN` + `SVG_INLINE` | Parchment texture via CSS; title is i18n text |
| Central goblin totem | `RGBA_TEXTURE` or `REGENERATE` (route 2) | Most distinctive painted element |
| Red war banners | `SVG_INLINE` or `CSS_PROCEDURAL` | Geometric shapes, can be tokenized |
| "WORLD EVENT" copy | `TOKEN` (i18n) | Text baked in mockup, must be React |
| Stats row icons | `SVG_INLINE` | Swords, castle, goblin silhouettes |
| Countdown medallion | `TOKEN` + `SVG_INLINE` | Circular frame, number is data |
| CTA buttons | `PRIMITIVE` (frozen kit) | `SkinButton` or equivalent |

---

## Related project files

- `src/ui/idleVillage/pages/GoblinEventLabPage.tsx`
- `src/ui/idleVillage/trailer/GoblinEventModalV1.tsx` ... `V14.tsx`
