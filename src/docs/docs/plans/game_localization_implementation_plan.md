# Game Localization Implementation Plan

## Metadata

- **Status**: Draft / Proposal
- **Scope**: Project-wide UI copy and text internationalization (i18n)
- **Primary domain**: Idle Village first, then Balancer, STS, and StyleLab surfaces
- **Target languages (initial)**: en (source), it, fr, de, es, pt-BR, ja, zh-CN
- **Estimated effort**: 6–8 weeks for full Idle Village vertical slice, 12–16 weeks for full project coverage
- **Owner**: Strategist / Architecture

---

## 1. Executive Summary

This plan proposes a modern, ICU-first localization layer for the RPG project. The codebase currently ships a very small `LocalizationService` and `useLocalization` hook that handle only a single Idle Village tooltip bundle, plus a config-driven `interactionModeCopy` file. The rest of the UI is almost entirely hardcoded English/Italian text.

**Recommended choice**: `i18next` + `react-i18next` with `i18next-icu-format`, `i18next-http-backend`, and `i18next-resources-for-ts` for type generation. This stack is the only one that satisfies all of the project's constraints: namespace-driven code splitting, lazy-loaded locale bundles, Vite compatibility, TMS interoperability, TypeScript type safety, and a non-disruptive migration path from the existing `LocalizationService`.

**Immediate value**: by the end of the first phase, the game will be able to switch locale at runtime, all new strings will be externalized, and a pseudo-localization locale (`pseudo`) will expose UI overflow issues before any translator is hired.

---

## 2. Current State Analysis

### 2.1 Existing localization code

| File | Role | Strengths | Gaps |
|------|------|-----------|------|
| `src/localization/LocalizationService.ts` | Singleton that stores active locale and a tooltip-only dictionary | Subscribable, lightweight, supports simple `{key}` replacement | Only one domain (`idleVillage.workerTooltip`), one locale (`en`), no plurals, no ICU, no lazy loading |
| `src/hooks/useLocalization.ts` | React hook built on `useSyncExternalStore` | Integrates with existing singleton | Exposes only `workerTooltip`, `format`, `setLocale`; not used by most UI |
| `src/ui/idleVillage/config/interactionModeCopy.ts` | Zod-schemas config for interaction-mode copy | Config-first, metadata-rich (`context`, `category`, `maxLength`, `translatable`, `accessibility`) | Hardcoded Italian/English mix; not integrated with a translation runtime |
| `src/ui/idleVillage/hooks/useTooltipCopy.ts` | Tooltip copy accessor with telemetry | Telemetry-ready | No locale switching; fallback copy is hardcoded |
| `src/data/idleVillage/tooltips.json` | Tooltip JSON bundle | Externalized | Only `en` and only one small section |

### 2.2 Hardcoded text scan

A preliminary scan of `src/ui` reveals:

- **619** `.tsx` files in `src/ui`.
- Many `.tsx` files contain dozens of visible text nodes and quoted strings (labels, placeholders, titles, tooltips, ARIA attributes, FTUE messages, button text, narrative text, etc.).
- Hotspots by volume: Idle Village components (`SlotV12Renderer`, `QuestChronicle`, `NarrativePanel`, `ActivityCapsule`, `WanderlustMedalOverlay`, `GenericPoiSkin`, `TestRosterPage`, diagnostic panels), Balancer tooling, StyleLab demos, and the Spell editor.

**Key finding**: the project does not have a "small text surface." Text is embedded in markup, config constants, telemetry payloads, and fallback objects. Any extraction must be staged and prioritized by vertical slice.

### 2.3 Stack facts

- **React**: `^19.2.4`
- **Bundler**: Vite 6
- **TypeScript**: `~5.9.3`
- **Styling**: Tailwind CSS 4
- **State**: Zustand 5
- **Validation**: Zod 4
- **Persistence**: async `PersistenceService.ts` only (project rule)
- **Mobile**: PWA + Tauri 2

No i18n library is currently installed.

---

## 3. Goals and Non-Goals

### 3.1 Goals

1. **Externalize all player-facing text** from `.tsx`/`.ts` files into JSON/JSON-with-ICU locale bundles.
2. **Support runtime locale switching** without a full page reload.
3. **Lazy-load locale bundles per feature** to keep initial PWA/Tauri bundle small.
4. **Use ICU MessageFormat** for plurals, select, gender, and number formatting.
5. **Preserve the config-first philosophy**: UI text is driven by validated config schemas with metadata.
6. **Type-safe keys**: `t('idle:slot.title')` should be typed at compile time.
7. **Pseudo-localization** as a first-class locale to stress-test layout and font coverage.
8. **Integration with telemetry** so localization events (locale changed, missing key, fallback used) are observable.
9. **Migration path** that keeps existing `LocalizationService` and `interactionModeCopy` working until replaced.

### 3.2 Non-Goals (for this plan)

- Full professional translation (this is an i18n engineering plan; translation/LQA is a separate procurement phase).
- RTL layout mirroring in the first phase (RTL is Phase 2 because it requires UI mirroring and font work).
- Voice-over / audio localization.
- Complete CJK font atlas optimization (this is a rendering production task, not a localization engine task).

---

## 4. Best Practice Summary (2026)

Based on the research, the consensus for game i18n in 2026 is:

- **Use ICU MessageFormat** as the default message syntax. It is supported by every serious translation platform and AI tooling (Crowdin, Lokalise, Phrase, Tolgee, Smartcat) and handles plural rules, select, gender, and number formatting correctly.
- **Never concatenate string fragments**; use named placeholders (`{name}`, `{count}`) and rich-text wrappers.
- **Externalize strings into standard files** (JSON with ICU, or XLIFF/PO for export/import to TMS).
- **Namespaces / code-splitting**: split bundles by domain to avoid loading every language of every feature at startup.
- **Pseudo-localization** early and often: it is the cheapest way to catch overflow, missing glyphs, and hardcoded strings.
- **Context and metadata** matter: include `context`, `maxLength`, `description`, and `translatable` per string so translators know where a string is used.
- **Text expansion headroom**: design UI for 30–40% expansion (German) and 20–30% (French/Italian); CJK usually contracts but requires font-size and line-height adjustments.
- **Fonts and rendering**: use a pan-Unicode fallback stack (Noto Sans, Source Han Sans, Noto Sans Arabic) and test for shaping (Arabic/Hebrew) and atlas size (CJK).
- **RTL is a UI-system feature**, not just a text-direction flag; it requires layout mirroring and BiDi algorithm support.
- **Automated extraction** from source code prevents stale keys and manual copy-paste.

### 4.1 Library comparison

| Library | Pros | Cons | Verdict |
|---------|------|------|---------|
| **react-i18next + i18next-icu** | Namespaces, lazy loading, huge ecosystem, Vite-friendly, plug-in TMS, easy migration from existing service | Non-ICU default format; needs the `i18next-icu` plugin | **Recommended** |
| **react-intl (FormatJS)** | Native ICU, stable, excellent formatting | No namespaces, no built-in lazy loading, larger bundle (~20 kB gzipped), extraction pipeline is fiddly | Not ideal for this multi-domain game codebase |
| **LinguiJS** | Tiny runtime, automatic extraction, ICU via macros | Requires Babel/SWC macro; SWC plugin is experimental; PO files are less game-pipeline friendly | Too risky for a Vite/React 19 project without Babel |
| **Tolgee SDK** | In-context editing, standalone JSON mode | Best value is with the Tolgee platform; adds vendor surface | Could be used later as a TMS, but i18next is the safer engine core |

---

## 5. Proposed Architecture

### 5.1 Core stack

```
i18next
react-i18next
i18next-icu                  // ICU MessageFormat support
i18next-http-backend         // lazy-load JSON bundles from /public/locales
i18next-browser-languagedetector // detect navigator locale
i18next-resources-for-ts     // generate TypeScript types from JSON (dev)
i18next-parser               // extraction (dev)
```

### 5.2 Directory structure

```
public/
  locales/
    en/
      common.json        // shared terms, buttons, labels
      idleVillage.json   // Idle Village domain
      balancing.json     // Balancer / combat tools
      styleLab.json      // Style Lab / physics lab
      spell.json         // Spell editor
      sts.json           // STS simulator
      wanderlust.json    // Wanderlust surface
      errors.json        // global error messages
    it/
      common.json
      idleVillage.json
      ...
    pseudo/              // pseudo-localization for testing
      common.json
      ...

src/
  localization/
    i18n.ts              // i18next instance configuration
    i18n.types.ts        // generated types
    I18nProvider.tsx     // React provider wrapper
    LocaleConfig.ts      // Zod schema for locale/metadata
    LocaleConfigStore.ts // Zustand/persistence for active locale
    useTranslation.ts    // typed wrapper around react-i18next
    useLocalizedString.ts // fallback-friendly helper
    extractMissingKey.ts // telemetry for missing strings
    pseudoLocalize.ts    // build-time pseudo locale generator
    adapters/
      LocalizationServiceAdapter.ts  // bridge to legacy singleton
      InteractionModeCopyAdapter.ts  // bridge to legacy config
    namespaces/
      common.ts          // namespace constants
      idleVillage.ts
      ...
```

### 5.3 Key design decisions

1. **Namespace per feature** (`common`, `idleVillage`, `balancing`, `styleLab`, `spell`, `sts`, `wanderlust`, `errors`). This mirrors the existing `src/ui` directory structure and enables lazy loading.
2. **JSON source files with ICU syntax** (e.g., `{count, plural, one {1 sword} other {{count} swords}}`). This is the standard that translators and CAT tools understand.
3. **Typed keys via code generation**: run `npm run i18n:types` to regenerate `i18n.types.ts` from `public/locales/en/*.json`.
4. **Persistent locale via `PersistenceService`** (async), not `localStorage` directly.
5. **Default locale `en`**, fallback chain `en` → source string → key name.
6. **Pseudo-locale** is generated by replacing ASCII characters with accented variants and wrapping with `[!! ... !!]` to test expansion (e.g., `Hello {name}` → `[!! Ħëļļö {name} !!]`).
7. **Legacy adapter**: keep `LocalizationService` and `useLocalization` exporting the same shape, but internally reading from `i18next` so existing consumers continue to work while being migrated.

### 5.4 `i18next` configuration sketch

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ICU from 'i18next-icu';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(ICU)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    ns: ['common', 'idleVillage', 'balancing', 'styleLab', 'spell', 'sts', 'wanderlust', 'errors'],
    defaultNS: 'common',
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'rpg-locale',
    },
    interpolation: { escapeValue: true },
    react: { useSuspense: false },
  });
```

Note: language detection will be replaced by `LocaleConfigStore` that uses `PersistenceService`; the detector is a fallback only.

### 5.5 Typed hook sketch

```typescript
import { useTranslation as useI18nTranslation } from 'react-i18next';
import type { DefaultNamespace, Resources } from './i18n.types';

export function useTranslation(ns?: DefaultNamespace) {
  const { t, i18n } = useI18nTranslation<Resources>(ns);
  return { t, i18n, locale: i18n.language };
}
```

---

## 6. Implementation Plan

### Phase 1 — Foundation (week 1)

**Goal**: set up the engine, types, config, and a single migrated namespace.

**Files to create**

- `src/localization/i18n.ts`
- `src/localization/I18nProvider.tsx`
- `src/localization/i18n.types.ts`
- `src/localization/LocaleConfig.ts`
- `src/localization/LocaleConfigStore.ts`
- `src/localization/useTranslation.ts`
- `src/localization/pseudoLocalize.ts`
- `src/localization/adapters/LocalizationServiceAdapter.ts`
- `src/localization/adapters/InteractionModeCopyAdapter.ts`
- `public/locales/en/common.json`
- `public/locales/en/idleVillage.json`
- `public/locales/pseudo/common.json`
- `public/locales/pseudo/idleVillage.json`
- `scripts/i18n/generateTypes.ts`
- `scripts/i18n/extract.ts` (initial pass, may be manual or parser-based)
- `scripts/i18n/buildPseudo.ts`

**Files to modify**

- `package.json` — add `i18next`, `react-i18next`, `i18next-icu`, `i18next-http-backend`, `i18next-browser-languagedetector`, `i18next-resources-for-ts` (dev), `i18next-parser` (dev)
- `src/main.tsx` — wrap `<App />` with `<I18nProvider />`
- `src/localization/LocalizationService.ts` — delegate to `i18next` via adapter
- `src/hooks/useLocalization.ts` — keep same interface, return `i18n` data
- `src/ui/idleVillage/config/interactionModeCopy.ts` — export JSON-compatible ICU data; use adapter for lookups
- `src/data/idleVillage/tooltips.json` — move into `public/locales/en/idleVillage.json`

**Tasks**

1. Install i18n packages.
2. Define `LocaleConfig` Zod schema (locale, direction, fontFamily, fallbackLocale, textExpansionFactor).
3. Implement `LocaleConfigStore` using `PersistenceService` for async load/save.
4. Configure `i18next` with ICU, HTTP backend, namespaces, and lazy loading.
5. Create `I18nProvider` and wrap root.
6. Generate `i18n.types.ts` from `en` JSON files.
7. Implement `useTranslation` typed wrapper.
8. Migrate `tooltips.json` to `idleVillage` namespace and update `LocalizationService` adapter.
9. Migrate `interactionModeCopy` entries into `idleVillage` namespace with metadata preserved.
10. Add `npm run i18n:types` and `npm run i18n:extract` scripts.
11. Run `build:check`, `lint`, `kanban:lint`, and unit tests.

**Deliverables**

- Runtime locale switch works for `en` and `pseudo`.
- Existing `useLocalization` consumers still work.
- `interactionModeCopy` still returns entries but backed by ICU JSON.

**Status**: `Completato` 2026-07-10 — Evidence: `test-results/i18n-001-foundation-2026-07-10.log`.

- Tutti i file target creati/modificati; `i18n:types` e `i18n:build-pseudo` funzionanti.
- `build:check`, `lint` (src/localization), `test:unit -- tests/unit/localization`, `kanban:lint` passano.

### Phase 2 — Idle Village Extraction Sprint (weeks 2–4)

**Goal**: externalize the highest-volume Idle Village text into `idleVillage` namespace.

**Priority order**

1. Worker tooltip and status labels (already partially done).
2. Slot rack / POI detail / Activity capsule labels and ARIA text.
3. Quest chronicle, telemetry panel, and risk display text.
4. Narrative panels, FTUE, map, and scheduler UI.
5. Diagnostic and sandbox-only panels (test harnesses can stay English if not player-facing).

**Tasks**

1. Run extraction script and catalog every string.
2. Create `public/locales/en/idleVillage.json` with structured keys:
   - `idleVillage.workerTooltip.labels.hp`
   - `idleVillage.slotRack.empty`
   - `idleVillage.questChronicle.title`
   - `idleVillage.ftue.welcome`
   - `idleVillage.errors.invalidDrop`
3. Replace JSX text with `<Trans i18nKey="..." />` or `t('...')`.
4. Add `context`/`maxLength` metadata to each key.
5. Generate `pseudo` locale and run visual regression tests for overflow.
6. Add unit tests for `LocaleConfigStore` and `useTranslation`.
7. Add telemetry events: `locale_changed`, `translation_missing`, `translation_fallback_used`.

**Deliverables**

- Idle Village player-facing UI is fully localizable.
- Pseudo-locale reveals no critical overflow in primary screens.
- `idleVillage` namespace lazy-loads on first access.

### Phase 3 — Tooling & Automation (week 4)

**Goal**: make extraction, type generation, and pseudo-locale generation repeatable.

**Files to create**

- `scripts/i18n/extractKeys.ts` — AST-based extraction using `i18next-parser`
- `scripts/i18n/validateKeys.ts` — ensures all keys used in code exist in `en`
- `scripts/i18n/generatePseudo.ts` — generates `pseudo` locale from `en`
- `scripts/i18n/auditKeys.ts` — lists missing keys per namespace
- `tests/i18n/i18n.test.ts` — missing-key and pseudo-locale tests

**Tasks**

1. Configure `i18next-parser` with `src/ui/**/*.{ts,tsx}` and `public/locales/$LOCALE/$NAMESPACE.json`.
2. Add `npm run i18n:extract` and `npm run i18n:validate`.
3. Add `npm run i18n:build-pseudo`.
4. Add CI step that fails if `en` keys are missing or `i18n:types` is stale.
5. Document key naming convention: `namespace:domain.section.key`.

**Status**: `Completato` 2026-07-13 — `scripts/i18n/extractKeys.ts`, `validateKeys.ts`, `generatePseudo.ts`, `auditKeys.ts`, `generateTypes.ts` and `tests/i18n/i18n.test.ts` are in place; `npm run i18n:extract`, `i18n:validate`, `i18n:types`, `i18n:build-pseudo` and `i18n:audit` are functional; evidence in `test-results/i18n-004-tooling-2026-07-13.log`. CI step: run `i18n:validate` (or `i18n:extract --check`) in CI to block PRs with missing keys.

### Phase 4 — Wider Project Coverage (weeks 5–8)

**Goal**: extend namespaces to Balancer, STS, StyleLab, Spell, and Wanderlust surfaces.

**Namespaces**

- `balancing` — stat editor, combat viewer, formula safety, weight wizard
- `spell` — spell editor, info forms, lifecycle
- `styleLab` — demo panels, physics lab UI, skin dev tools
- `sts` — simulator UI, combat replay, telemetry
- `wanderlust` — surface layout, medal overlay
- `errors` — global error boundary and fallback messages

**Tasks**

1. Create `public/locales/en/<namespace>.json` for each.
2. Migrate hardcoded strings in each feature.
3. Add per-namespace lazy loading routes.
4. Update `App.tsx` / route config to load namespaces on route enter.

**Status**: `Completato` 2026-07-13 — namespaces `balancing`, `spell`, `styleLab`, `sts`, `wanderlust`, `lore`, `errors` created and populated; player-facing strings extracted from `Balancer.tsx`, `SpellCreation.tsx`, `SpellLibrary.tsx`, `SpellEditor.tsx`, `StyleLaboratoryPanel.tsx`, `WanderlustMockupPage.tsx`, `QuestChronicle.tsx`, and lore samples; pseudo-locale generated for all new namespaces; `i18n:extract`, `i18n:validate`, `i18n:build-pseudo`, `build:check`, `kanban:lint`, `npm run build`, and `tsc --noEmit` pass; evidence in `test-results/i18n-005-wider-coverage-2026-07-13.log`.

### Phase 5 — Advanced Features (weeks 9–10)

**Goal**: pluralization, number/date formatting, RTL prep, and font strategy.

**Tasks**

1. Add ICU plural examples to `en` bundles.
2. Replace `date-fns` usage with `Intl.DateTimeFormat` where appropriate.
3. Add locale-specific font family tokens to `LocaleConfig` and Tailwind config.
4. Add RTL detection helper; update `html dir="..." lang="..."` in `LocaleConfigStore`.
5. Add `i18n` visual regression tests for `pseudo`, `de` and `ar` (expansion test).
6. Document font stack recommendations: Noto Sans + Noto Sans Arabic + Source Han Sans SC/TC/JP/KR.

**Status**: `Completato` 2026-07-13 — ICU plural/select examples added to `common.json` (en/de/ar); `intlFormatters.ts` and `useIntlFormatters` hook created with `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat`; `LocaleConfig` extended with `de`, `ar`, `ja`, `zh-CN` and `LOCALE_FAMILIES`; `rtlUtils.ts` created with `getDirectionForLocale`, `isRTL`, `getLocaleFontFamily`, `applyLocaleAttributes`; `LocaleConfigStore` applies `lang`/`dir`/`font-family` on init and setConfig; `tailwind.config.js` exposes `font-locale` token via CSS variable; `de` and `ar` locale JSONs created; `tests/i18n/i18n.test.ts` extended with 10 new tests for ICU, Intl formatters, RTL, and fonts; `tests/i18n/i18n.visual.spec.ts` added for pseudo/de/ar visual regression on `home`, `/idle-village`, `/balancer`, `/punch-club`; `i18n:extract`, `i18n:validate`, `i18n:build-pseudo`, `build:check`, `kanban:lint`, `npm run build`, `tsc --noEmit` pass; evidence in `test-results/i18n-006-advanced-2026-07-13.log`.

### Phase 6 — Localization QA & TMS Integration (week 11+)

**Goal**: export for translators and integrate a TMS or community workflow.

**Status**: `Completato` 2026-07-13 — `scripts/i18n/exportTms.ts` exports `public/locales/en/*.json` to XLIFF 1.2 (`dist/i18n/tms-export`) preserving `context` and `maxLength`; `scripts/i18n/importTms.ts` merges XLIFF/PO files (`dist/i18n/tms-import`) into `public/locales/<locale>/*.json` and `*.meta.json`; `npm run i18n:export` and `npm run i18n:import` scripts added; `LQAProvider` and `LQAOverlay` enabled in dev mode via `?lqa=true`; `docs/localization/TRANSLATION_GUIDE.md` created; round-trip tested and metadata preserved; `i18n:validate`, `build:check`, `test:unit`, `kanban:lint` pass; evidence in `test-results/i18n-007-tms-lqa-2026-07-13.log`.

**Tasks**

1. Add `scripts/i18n/exportTms.ts` to convert JSON to XLIFF or PO.
2. Add `scripts/i18n/importTms.ts` to merge TMS exports back to JSON.
3. Configure Crowdin / Lokalise / Tolgee CLI with `public/locales`.
4. Build an in-game `LQA` mode to overlay keys and context.
5. Run pseudo-localization and full-playthrough LQA in target languages.

---

## 7. Migration Strategy

### 7.1 Adapter pattern for legacy services

Instead of deleting `LocalizationService` and `useLocalization` immediately, wrap them around `i18next`:

```typescript
// src/localization/adapters/LocalizationServiceAdapter.ts
export const localizationService = {
  getLocale: () => i18n.language,
  setLocale: (locale: string) => i18n.changeLanguage(locale),
  getWorkerTooltipCopy: () => i18n.getResourceBundle('en', 'idleVillage').workerTooltip,
  format: (template: string, params?: Record<string, string | number>) =>
    i18n.t(template, { ...params }),
  subscribe: (listener: () => void) => {
    const cb = () => listener();
    i18n.on('languageChanged', cb);
    return () => i18n.off('languageChanged', cb);
  },
};
```

This keeps existing call sites working while the code is migrated to `useTranslation`.

### 7.2 Gradual string migration

1. **New code**: must use `useTranslation` or `Trans` and external keys.
2. **Refactor code**: when touching a component, externalize its strings in the same PR.
3. **Audit code**: run `i18n:extract` weekly; missing keys are tracked.
4. **Legacy freeze**: mark `interactionModeCopy.ts` and `useTooltipCopy.ts` as deprecated after Phase 2.

### 7.3 Config-first integration

Locale configuration should live alongside other config files:

- `src/balancing/config/localization/defaultLocaleConfig.ts` — canonical config
- `src/localization/LocaleConfig.ts` — Zod schema and runtime types
- `public/locales` — generated/editable JSON bundles

---

## 8. Testing Strategy

### 8.1 Unit tests

- `LocaleConfigStore` persistence and fallback behavior.
- `useTranslation` returns correct strings and re-renders on locale change.
- `ICU` plural/select formatting for representative locales.
- `LocalizationServiceAdapter` exposes the same API as the old singleton.
- Missing key telemetry is emitted.

### 8.2 Integration / E2E

- Language switcher updates all visible text.
- Lazy loading loads correct namespace files.
- Pseudo-locale reveals no text overflow or truncation on primary screens.
- `locale` is restored on reload from `PersistenceService`.

### 8.3 Visual regression

- Add `pseudo` locale snapshots to Playwright visual tests.
- Add `de` locale snapshots to verify expansion.
- Add `ar` locale snapshots after RTL Phase 2.

### 8.4 Automated validation

- `i18n:extract` runs in CI and fails if new hardcoded strings are introduced without keys.
- `i18n:validate` runs in CI and fails if code references a missing key.
- `i18n:types` runs in CI and fails if `en` JSON changed without type regeneration.

---

## 9. Safeguards and Quality Gates

Each phase must pass:

1. `npm run lint` (with warnings budget respected)
2. `npm run build:check`
3. `npm run test:unit -- tests/i18n/` and `tests/unit/localization/`
4. `npm run kanban:lint`
5. `i18n:validate` and `i18n:types` up to date

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large refactor touches 600+ files | High | Phase by feature; no big-bang PR; use adapter pattern |
| Existing `LocalizationService` and `useLocalization` diverge | Medium | Adapter preserves API; deprecate later |
| Lazy loading causes layout flicker | Medium | Use `useSuspense: false` and loading skeletons; preload on route enter |
| ICU syntax errors in JSON break runtime | Medium | Validate JSON with `i18next-icu` parser in `i18n:validate` |
| Pseudo-locale reveals many UI overflows | Low–Medium | Fix during Phase 2; it's the intended value of pseudo-loc |
| TMS export/import format drift | Low | Export to XLIFF 1.2 with `context` and `maxLength` metadata preserved |
| Fonts not supporting CJK/Arabic | Medium | Add font-family tokens in Phase 5; test with Noto/Source Han stack |
| RTL UI mirroring is expensive | High | Scope to Phase 5; only if Arabic/Hebrew are prioritized markets |
| Team rejects ICU syntax | Low | ICU is the 2026 standard; provide examples and documentation |

---

## 11. First Week Concrete Task List

For the developer who picks up Phase 1:

1. Open `package.json` and add the i18n dependencies.
2. Create `src/localization/i18n.ts` and initialize i18next.
3. Create `src/localization/I18nProvider.tsx` and wrap `App` in `src/main.tsx`.
4. Create `src/localization/LocaleConfig.ts` with Zod schema.
5. Create `src/localization/LocaleConfigStore.ts` using `PersistenceService`.
6. Move `src/data/idleVillage/tooltips.json` → `public/locales/en/idleVillage.json`.
7. Create `src/localization/adapters/LocalizationServiceAdapter.ts`.
8. Refactor `src/localization/LocalizationService.ts` to use the adapter.
9. Add `npm run i18n:types` and `npm run i18n:extract` scripts.
10. Run `npm run build:check`, `npm run lint`, `npm run kanban:lint`, and `npm run test:unit`.
11. Update `src/docs/docs/coordinator/agent_assignments.md` via `/kanban-update` workflow.

---

## 12. Appendix

### A. Key naming convention

- Format: `<namespace>:<domain>.<section>.<key>`
- Examples:
  - `common:actions.save`
  - `idleVillage:slotRack.emptySlot.label`
  - `idleVillage:workerTooltip.statuses.injured`
  - `balancing:formulaSafety.cycleDetected.message`

### B. ICU MessageFormat examples

```json
{
  "swordCount": "{count, plural, one {1 sword} other {{count} swords}}",
  "characterGreeting": "Hello {name}, you have {count, number} new messages.",
  "questOutcome": "{outcome, select, success {Victory!} failure {Defeat...} other {Unknown}}",
  "riskLevel": "{level, select, low {Low Risk} medium {Medium Risk} high {High Risk} critical {Critical Risk}}"
}
```

### C. Recommended package versions

```json
{
  "i18next": "^25.0.0",
  "react-i18next": "^15.0.0",
  "i18next-icu": "^2.3.1",
  "i18next-http-backend": "^3.0.0",
  "i18next-browser-languagedetector": "^8.0.0",
  "i18next-resources-for-ts": "^1.5.0",
  "i18next-parser": "^9.0.0"
}
```

Use exact versions once lockfile is updated.

### D. Glossary / style guide stub

Create `locales/TRANSLATION_GUIDE.md` for translators:

- Tone: "Noble Heroic Realism" — formal, elevated, sun/triumph imagery.
- Character names: keep original unless explicitly requested.
- Place names: translate to match cultural feel; document decisions.
- Abbreviations: `HP`, `MP`, `XP` may be kept; `ATK`/`DEF` localized if needed.

### E. RTL quick reference

- Detect direction: `['ar', 'he', 'fa', 'ur'].includes(locale)`.
- Set `document.documentElement.dir = direction; document.documentElement.lang = locale;`.
- Tailwind CSS 4 supports `rtl:` and `ltr:` prefixes; use logical properties (`ms-`, `me-`, `start`, `end`).
- Font: `Noto Sans Arabic` or `Amiri` for Arabic; `Noto Sans Hebrew` for Hebrew.
