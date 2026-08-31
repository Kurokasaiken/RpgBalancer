# Primitive Composition Rules

How to assemble `Materic*` primitives and Golden Components without visual noise.

## 1. No thick borders inside other components

- `MatericSurface` and `MatericInset` are **top-level containers**.
- `MatericSurface` / `MatericInset` must **not** be used as internal wrappers inside another component.
- Inside a component, use `MatericFrame` to separate sub-sections.

## 2. Frame semantics

| Primitive | Use for | Notes |
|-----------|---------|-------|
| `MatericSurface` | Top-level panels/cards | Carries a thick border and its own floor. |
| `MatericInset` | Recessed wells inside a surface | Thick border + floor, sits inside a `MatericSurface`. |
| `MatericFrame` | Internal borders / sub-sections | Frame-only edge; no filled floor. |

## 4. Background colors

- `bronze` is for frames, treasure, strong accents.
- `obsidian` is the default dark/teal internal surface for data panels.
- `parchment` is for light/clean data surfaces.
- `jade` is for secondary panels.
- `bronze` must never be used as the background of a character sheet or data-dense card.

## 5. Stack rule

- Do not stack thick-bordered containers (`MatericSurface`, `MatericInset`) inside each other.
- One thick border per top-level component is enough.
- Sub-sections use `MatericFrame`.

## 6. Backgrounds and backdrops

- `MatericCloudWall` is a **square scenic backdrop** for world events. Place the card *on top* of it.
- `MatericEventCard` ships with an **optional built-in cloud background** (`clouds` prop). Use it when the card is shown on a plain surface.
- Never mix the two: if you place the card on a `MatericCloudWall`, set `clouds={false}` on the card.
- A backdrop is not a background of another component — it is a separate layer the component sits on.

## 7. Portraits and medals

- `MatericPortrait` and `WanderlustMedalOverlay` are the canonical visual tokens for residents and items.
- Do not re-implement circular frames or token borders.

## 8. Buttons and badges

- `MatericButton` for actions.
- `MatericBadge` for tags, counters, inventory items.
- `MatericPlaque` for section titles and important values.
- `MatericCloseButton` for dismiss actions.

## 9. Stats and data

- `MatericStatBar` for hp, stamina, xp, danger.
- `MatericRecordList` for key/value tables.
- `MatericField` for a single label/value pair.
- `MatericFieldGroup` for grouped fields.

## Examples

### Good — PgDetailCard

```tsx
<MatericFrame variant="molding">
  <MatericPortrait ... />
  <MatericPlaque> ... </MatericPlaque>

  <MatericFrame variant="molding">
    <MatericStatBar ... />
  </MatericFrame>

  <MatericFrame variant="molding">
    <MatericRecordList ... />
  </MatericFrame>
</MatericFrame>
```

### Good — event card on cloud wall

```tsx
<div style={{ position: 'relative', width: 600, height: 600 }}>
  <MatericCloudWall size={600} style={{ top: 0, left: 0 }} />
  <MatericEventCard
    clouds={false}
    ...
    style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
  />
</div>
```

### Bad — nested thick borders

```tsx
<MatericSurface shape="card" material="bronze">
  <MatericSurface shape="card" material="obsidian">
    ...
  </MatericSurface>
</MatericSurface>
```

## Verification

- Before adding a primitive, ask: "Is this inside another component?"
- If yes, prefer `MatericFrame` or a flat layout.
- If no, `MatericSurface` / `MatericInset` are acceptable.
- If a component needs a backdrop, make the backdrop a sibling, not a parent.
