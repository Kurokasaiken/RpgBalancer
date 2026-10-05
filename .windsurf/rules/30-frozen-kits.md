---
trigger: glob
globs: src/ui/idleVillage/frozen/**,src/ui/idleVillage/**/*.tsx,src/pages/minimal-*.tsx
description: Frozen Kits invariants for Idle Village components — registration, certification, barrel imports, and TestHub generation.
---

# Frozen Kits Invariants

Applies to every Idle Village component and minimal page.

## Kit registration

- Every new Idle Village component must be added as a frozen kit, extend an existing
  kit, or have a documented exception in `src/docs/docs/idle_village/EXCEPTIONS.md`.
- Public consumers import from `src/ui/idleVillage/frozen/kits/index.ts`
  (one-line barrel). Do not import from internal component paths.

## Provider chain

- Each kit must have a `KitShell`/`withKitShell` provider chain so it is
  self-contained and provider-safe.

## Registry entries

- Certified kits must have `contract`, `certManifestPath`, `docPath`, and `hub`
  metadata in `src/ui/idleVillage/frozen/registry.ts` (`KIT_REGISTRY`).
- Draft kits must be in `KIT_REGISTRY` with `status: 'draft'` and a `docPath`
  (optional but recommended for draft kits).
- New minimal pages must add `hub` metadata to the relevant `KIT_REGISTRY` entry
  so `TestHub` stays generated.

## Contract verification

- `tests/contract/minimal-vs-test.spec.ts` must pass for every certified kit.

## Creating new kits

- Use `npm run freeze:kit <KitName>` to scaffold a new kit and append it to
  `KIT_REGISTRY`. Keep the kit module small and focused on the canonical component.
