---
id: hud-component-charter
kind: component
role: shared-kernel
tier: 2
root_file: "src/config/hud/charters.ts"
scope_files:
  - "src/config/hud/charterSchema.ts"
  - "src/config/hud/charters.ts"
  - "src/pages/hud-lab/charterSection.tsx"
fast_checks:
  - "NODE_OPTIONS=--require=./polyfill-crypto.cjs npx vitest run tests/unit/idleVillage/componentCharters.test.ts"
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: hud-charters
    source: plan
    source_ref: PLAN-131 §5 OB-2 (plan battezzato Director 2026-11-21, r004)
    statement: >-
      Gate permanente sul registro dei component charter (src/config/hud/charters.ts):
      copertura live — ogni LabEntry kind:component con status battezzato|candidato ha
      un charter; join componentId↔catalogo; materials ⊆ enum materials di pieces.json;
      materials.region ⊆ anatomia∪{global} per entrambi i kind; anatomy kind:'regions'
      ⇒ ref esistente + sha256 del file; kind:'zones' ⇒ validazione strutturale;
      anatomy assente ⇒ status candidato; states ⊆ enum + 'default' su battezzato;
      typeFloor con esattamente uno di minPx|ref; battezzato ⇒ anatomy + ≥1 appreciated
      con ruling; director-verified ⇒ verifiedBy + ornamentLevel; candidato ⇒ ≥1 dei tre
      array core non vuoto; ogni openExploration con ref; familyOrigin su famiglia a
      singolo componente; stage derivato e pinnato (il pin si aggiorna solo dopo ruling);
      scheda charter visibile nella card /hud-lab (join sempre asserito).
    test_refs:
      - tests/unit/idleVillage/componentCharters.test.ts
---
# hud-component-charter

Unità `shared-kernel` (tier 2) — contratto vivo PLAN-054.
Root: `src/config/hud/charters.ts` (PLAN-131, battezzato Director 2026-11-21).

La forma compilata di un componente battezzato: materiali per regione, stati,
pavimento tipografico, proporzioni, appreciated/openIssues/openExploration,
confidence e stage derivato. Confine dichiarato: `charter = forma`,
`INV runtime = comportamento` — questo contratto presidia la FORMA (gate sui
dati + presenza scheda nel lab), non il comportamento runtime.

Autorità esterne riusate (non duplicate): `pieces.json` (vocabolario
materiali, PLAN-130), `scripts/hud-real/specs/*.regions.json` (anatomia arte),
`src/pages/hud-lab/catalog.ts` (status governance/mount, PLAN-129).

## Scope

- `src/config/hud/charterSchema.ts`
- `src/config/hud/charters.ts`
- `src/pages/hud-lab/charterSection.tsx`

## Decision history

- 2026-11-21 — PLAN-131 r004: schema + registro + gate `INV:hud-charters`
  creati; pilota cassetto + 7 seed `reconstructed`; promozione a
  `director-verified` solo via diff per componente dopo occhio Director (OB-7).
