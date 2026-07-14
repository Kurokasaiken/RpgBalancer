# Canonical Systems - RPG Balancer

Central documentation of all official project systems. Every UI task must verify compatibility with ALL systems listed here before implementation.

## System: Skin/Theme

**Where it lives in code:**
- Registry: `src/ui/idleVillage/skins/skinConfigRegistry.ts`
- Primitives: `src/ui/idleVillage/skins/primitives/`
- Tokens: `src/ui/styleLab/tokens/gilded-observatory.css`
- Global CSS: `src/index.css`

**Legacy deprecated pattern:**
- Ad-hoc `.css` files for page/component styling
- Inline `style={{ ... }}` objects with hardcoded colors/sizes
- Component-level CSS-in-JS that duplicates theme tokens

**Governing invariant:**
- `.windsurf/rules/00-project-invariants.md` → "Skin/Theme system" section
- `.windsurf/rules/10-ui-invariants.md` → default skin system rules

**Adoption status:** ✅ ADOPTED
- All new skins/themes must be presets in `skinConfigRegistry`
- Zero new standalone `.css` files allowed
- Gilded Observatory is default theme for all new UI

---

## System: Localization / i18n

**Where it lives in code:**
- Core: `src/localization/i18n.ts`
- Config: `src/localization/locales/` (en, de, ar, etc.)
- Hook: `react-i18next` `useTranslation`
- Namespaces: `common`, `idleVillage`

**Legacy deprecated pattern:**
- Hardcoded Italian/English strings in JSX
- Inline user-facing text without `t()` wrapper
- Component-level translation dictionaries

**Governing invariant:**
- `.windsurf/rules/00-project-invariants.md` → "Localization" section

**Adoption status:** ✅ ADOPTED
- All user-facing strings must go through i18n
- Missing keys telemetered via `translation_missing`
- New keys added to locale resources, not inline

---

## System: Persistence / Config

**Where it lives in code:**
- Service: `@/shared/persistence/PersistenceService.ts`
- Methods: `saveData()`, `loadData()`, `clearData()`
- Config: `src/balancing/config/**`, `src/ui/idleVillage/config/**`
- Validation: Zod schemas in config modules

**Legacy deprecated pattern:**
- Direct `localStorage` / `sessionStorage` access
- Synchronous persistence middleware
- Ad-hoc storage implementations per component

**Governing invariant:**
- `.windsurf/rules/00-project-invariants.md` → "Persistence" section
- `.windsurf/rules/00-project-invariants.md` → "Config-first" section
- `.windsurf/rules/20-config-persistence.md`

**Adoption status:** ✅ ADOPTED
- All save/load MUST go through PersistenceService
- Config-first with Zod validation
- No direct localStorage/sessionStorage allowed

---

## System: Componentization

**Where it lives in code:**
- Atoms: `src/ui/atoms/`
- Fantasy atoms: `src/ui/fantasy/atoms/`
- Skin primitives: `src/ui/idleVillage/skins/primitives/`
- Reusable components: `src/ui/components/`

**Legacy deprecated pattern:**
- Duplicating primitive markup/styling in page components
- Creating standalone components that duplicate existing atoms
- Leaving new components as isolated files instead of adding to primitive directories

**Governing invariant:**
- `.windsurf/rules/00-project-invariants.md` → "Component Reuse" section

**Adoption status:** ⚠️ PARTIAL
- Primitive directories exist and are populated
- Some legacy duplication still present (30+ files with hardcoded strings, 37 CSS legacy files)
- New work must follow invariant; legacy debt is tracked separately

---

## System: State Management

**Where it lives in code:**
- Domain/game state: Zustand stores in `src/engine/game/**/store.ts`
- UI/presentation state: React Context in component directories
- Examples: `TimeEngine` (Zustand), `DensityContext` (Context)

**Legacy deprecated pattern:**
- Using Context for domain state that should be in Zustand
- Using Zustand for local UI state that should be in Context
- Mixed responsibilities (domain logic in Context, UI state in Zustand)

**Governing invariant:**
- `.windsurf/rules/00-project-invariants.md` → "State Management" section

**Adoption status:** ⚠️ PARTIAL
- Zustand used for core game state (TimeEngine, etc.)
- Context used for UI state (DensityContext, etc.)
- Some legacy mixed patterns exist; new work must follow invariant

---

## Usage Guidelines

### Before drafting any UI task:

1. **Read this document** (`coordinator/canonical-systems.md`)
2. **Check ALL systems** - not just skin/theme
3. **Verify compatibility** with each system's invariant
4. **Flag conflicts** if task violates any system
5. **Reference the invariant file** in the spec

### When a system is violated:

- **Do not execute** the violating operation
- **Flag the violation** explicitly in the spec/response
- **Propose an alternative** that respects the invariant
- **Update the plan** if needed to align with canonical systems

### Adding new systems:

When a new cross-cutting system becomes mandatory:
1. Add entry to this document
2. Write/update invariant in `.windsurf/rules/`
3. Update Strategist/Coordinator SKILL.md in `coordinator/skills/` to reference it
4. Communicate the change to all agents

---

## Last Updated

2026-07-14 - Initial creation with 5 systems documented
