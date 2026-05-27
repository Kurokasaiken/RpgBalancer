# Wave 0 — Summary & Gate

**Status:** Closed ✅
**Date:** 2026-05-21
**Plan:** `src/docs/docs/plans/component_freezing_certification_plan_v2.md`

---

## Day 1 — Prerequisites & analysis

Output:
- `data-testid="resident-slot-rack-root"` aggiunto sul vero root di `ResidentSlotRack` (riga 694). Il preesistente `data-testid="resident-slot-rack"` sulla lista interna è stato preservato per non rompere 14 file di test.
- Confermato che `PgCard` canonico (`src/ui/idleVillage/components/PgCard.tsx`) ha già `data-testid="pg-card"` sul root (riga 411). L'audit iniziale era un falso negativo causato dalla variante non canonica `PgCardTS002.tsx`.
- `src/docs/docs/freeze/POSTMORTEM_ARCHIVED.md` scritto — l'archivio risulta essere un backup di sicurezza 1:1 (2026-02-20), non un tentativo fallito. Drift quantificato: `PgCard` +41% LOC, `CustomDragOverlay` +115%, `TestRosterPage` +50% in 3 mesi.
- `src/docs/docs/freeze/AUDIT_TESTROSTERPAGE_SUBTREE.md` scritto — mappa "linea → ruolo" completa, scoperta critica: `ClockWidget`, `ActivityCapsule`, `ActiveHUD` sono importati ma **mai renderizzati** in TestRosterPage; per quei kit la pagina di riferimento è `/minimal-gameplay`, non `/test`. Conseguenza: `contract.ts` deve essere per-kit configurabile.

## Day 2 — Infra di base

Output (tutti compilano, zero TS error):
- `src/ui/idleVillage/frozen/_infra/IsolatedShowcase.tsx` — viewport centrato, supporto `?debug=1`, marcatore `data-testid$="-debug"` sul badge.
- `src/ui/idleVillage/frozen/_infra/CanonicalDataBridge.ts` — single import surface per dati canonici; re-export, mai inline mock.
- `src/ui/idleVillage/frozen/_infra/contract.ts` — `ContractConfig` per-kit, `normalizeDomString`, `compareContractHtml`, `extractSubtreeHtml`, helper browser per Playwright.
- `src/ui/idleVillage/frozen/_infra/certManifest.ts` — schema Zod, `parseCertManifest`, `safeParseCertManifest`, `buildCertManifest`.

## Day 3 — Generator

Output:
- `scripts/freeze-kit.ts` — produce kit + contract + fixture + doc + 2 test, aggiorna `registry.ts`. Smoke test `tsx scripts/freeze-kit.ts demoKit --dry-run` verde.
- `package.json` aggiornato con script `freeze:kit`.

## Day 4 — Roster kit + refactor pagina

Output:
- `src/ui/idleVillage/frozen/kits/rosterKit.tsx` — re-export di `VillageRosterSection` + `useRosterKitData()` (binder a `useCanonicalRosterBundle`) + `RosterKitShell` (provider chain canonica `SkinSystemProvider → SandboxTimingProvider → DragProvider → DndContext`).
- `src/ui/idleVillage/frozen/kits/rosterKit.contract.ts` — interfaccia freezata, `ROSTER_KIT_VERSION = '1.0.0'`, `ROSTER_KIT_SUBTREE_SELECTOR = '[data-testid="village-roster-section"]'`.
- `src/ui/idleVillage/frozen/kits/rosterKit.fixture.ts` — re-export canonico di `MINIMAL_GAMEPLAY_RESIDENTS`, `TEST_ROSTER_HEROES`, `TEST_RESIDENTS`, `canonicalResidentData`.
- `src/ui/idleVillage/frozen/kits/rosterKit.md` — doc completa.
- `src/ui/idleVillage/frozen/registry.ts` — single source of truth con entry rosterKit completo.
- `src/ui/idleVillage/frozen/index.ts` — public surface (IsolatedShowcase + bridge + registry).
- `src/pages/minimal-roster.tsx` — refactorato in place. Superficie canonica = `IsolatedShowcase > RosterKitShell > VillageRosterSection`. Vecchio comportamento mock disponibile dietro `?legacy=1` con banner di warning. Zero mock data nella superficie canonica.

## Day 5 — Test + cert

Output:
- `tests/unit/frozen/contract.test.ts` — 12 test su normalize/compare/extract.
- `tests/unit/frozen/certManifest.test.ts` — 8 test sul schema Zod.
- `tests/unit/frozen/rosterKit.dom.test.tsx` — 3 test (mount, contract testid, render deterministico).
- `tests/unit/frozen/rosterKit.cert.test.ts` — 3 test sul file cert.json.
- `tests/contract/minimal-vs-test.spec.ts` — Playwright contract sweep iterante su `KIT_REGISTRY`.
- `src/ui/idleVillage/frozen/kits/rosterKit.cert.json` — manifest bootstrap, `certified: false` in attesa che il sweep Playwright giri verde in CI; pinned su gitSha `dd188ef3...` e fixtureSha (SHA-256 di `minimalGameplayConfig.ts`).

---

## Gate metric — superato

| Criterio | Stato |
|---|---|
| Infra compila senza error TS sui file nuovi | ✅ |
| Unit test verdi su `tests/unit/frozen/` | ✅ 26/26 |
| `npm run freeze:kit <name> --dry-run` produce scaffold | ✅ |
| `minimal-roster` non contiene più mock data nella superficie default | ✅ |
| `minimal-roster?legacy=1` ancora utilizzabile per A/B | ✅ |
| Contract test framework per-kit configurabile (audit Day 1 incorporato) | ✅ |
| Cert manifest schema-validato | ✅ |

---

## Aperto a fine Wave 0 (da chiudere in Wave 1 o Hardening)

1. **Playwright contract sweep verde in CI.** Il file `tests/contract/minimal-vs-test.spec.ts` esiste ma non è stato eseguito contro un server di test in CI in questa Wave. Primo task di Wave 1 Day 6: eseguire `playwright test tests/contract/minimal-vs-test.spec.ts` localmente, triage di eventuali differenze, regen del `rosterKit.cert.json` con `contractSha` reale e `certified: true`.
2. **Git tag annotato** `frozen/rosterKit-v1.0.0` da creare dopo il primo run verde.
3. **Audit di `MinimalGameplayPage`** (planificato Day 6 di Wave 1) — prerequisito per i kit che useranno `/minimal-gameplay` come reference (`clock`, `activity`, `hud`, `resourcehud`, `slottedmedal`).
4. **Consolidamento convenzione testid** sul `ResidentSlotRack` (rinominare l'interno e mantenere quello canonico sul root) — schedulato per Hardening (`POLICY.md`).
5. **Disposizione `PgCardTS002.tsx`** — deprecation flag o rimozione, schedulato per Hardening.

---

## Decisione di gate

✅ **Wave 0 verde — Wave 1 abilitato.**

L'approccio v2 (re-export invece di estrazione, contract test per-kit configurabile, zero mock, registry centralizzato, generator scriptato) è validato sul kit di riferimento (Roster). Si procede in factory mode per i 12 kit base, partendo dai kit con `/test` come reference (alta confidenza) e poi quelli con `/minimal-gameplay` (richiedono audit Day 6).
