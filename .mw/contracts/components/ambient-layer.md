---
id: ambient-layer
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/questS1Lab/render/AmbientLayer.tsx
scope_files:
  - src/ui/idleVillage/questS1Lab/render/AmbientLayer.tsx
fast_checks:
  - tests/unit/idleVillage/questCinematics/runtimeInvariants.test.tsx
  - tests/unit/idleVillage/questCinematics/sceneManifest.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: ambient-layer.INV-1
    source: director-spec
    source_ref: R-271
    statement: >-
      AmbientFxSchema accetta i tipi PLAN-052 showcase (glint, fireflies,
      moths, shaft) con defaults applicati e rifiuta tipi ignoti e campi
      fuori bounds.
    test_refs:
      - tests/unit/idleVillage/questCinematics/sceneManifest.test.ts
  - id: ambient-layer.INV-2
    source: director-spec
    source_ref: R-271
    statement: >-
      drawAmbientFrame emette operazioni canvas per ogni tipo FX dichiarato
      come funzione pura del clock (stesso t → stesso op stream) e ripristina
      globalCompositeOperation 'source-over' a fine frame.
    test_refs:
      - tests/unit/idleVillage/questCinematics/runtimeInvariants.test.tsx
---

# ambient-layer

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/questS1Lab/render/AmbientLayer.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/questS1Lab/render/AmbientLayer.tsx`.

## Scope

- `src/ui/idleVillage/questS1Lab/render/AmbientLayer.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->

## Regola occlusione sprite kits (Director ruling 2026-10-24)

I kit `kind: 'sprite'` (`cloud-sky`, `cloud-shadow`, `birds-far`) sono overlay
DOM piatti: NON possono occludere dietro elementi near-plane dipinti. Prima di
attaccare un kit sprite a una scena, verificare che nessun occluder near
attraversi la banda del kit — altrimenti lo sprite legge come velo in primo
piano (il caso cloud-sky su viaggio-andata: nuvola sopra i pali del cancello =
"nebbia"). Alternative: bake mask da depth map (estendere il meccanismo pool
dei kit fog ai sprite) o scene con cielo pulito (la kill list "NO distinct
cloud silhouettes" esiste anche per questo).

## Bocciature (eye-check Director, 2026-10-24)

- **`flow` v1 (strip-displacement canvas) — BOCCIATO**: spostare strip di
  texture dipinta dentro una banda smuove il contenuto intorno e non legge
  come acqua. Il flow vero richiede shader UV-displacement + flow map reale
  (procedurale o estratta da video) — il tipo è stato rimosso, non
  resuscitare la versione canvas-strip.
- **`leaves` v1 (ellipse traslucide ~22s) — BOCCIATO**: foglie = blade
  appuntita (quadratiche), caduta ~3-4s nella banda, fill opaco, tumble
  con rotazione. Non ritracciare a pallini soft.
