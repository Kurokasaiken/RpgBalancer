Several user-facing strings in this repo use `{{var}}` mustache-style interpolation placeholders, but the project's i18n stack uses ICU message format (`i18next-icu` registered globally via `src/localization/i18n.ts`), where placeholders are `{var}`. Inside ICU plural/select blocks the count placeholder is `#`. i18next `backend.loadPath` templating legitimately keeps `{{lng}}`/`{{ns}}` — do not touch it.

Contract of done — a failing test exists and must pass:

  npm run test -- tests/i18n/icuInterpolation.test.ts

Do NOT modify `tests/i18n/icuInterpolation.test.ts`; it encodes the expected behavior.

## Pre-gathered context (do not re-derive)

Files known to contain malformed placeholders (fix all occurrences, then re-scan for any missed ones):
- `public/locales/en/idleVillage.json`, `public/locales/it-IT/idleVillage.json`, `public/locales/pseudo/idleVillage.json`
- `public/locales/en/common.json`, `public/locales/de/common.json`, `public/locales/ar/common.json`, `public/locales/pseudo/common.json`
- `public/locales/de/idleVillage.json`

Conventions:
- The `pseudo` locale is a pseudo-localization: strings are wrapped in `!! ... !!` and placeholders stay inside; keep that convention.
- `src/localization/i18n.types.ts` mirrors interpolation variable types for keys — if a placeholder variable inside a string changes name it must stay consistent, otherwise just fix brace style there if the file embeds literal message strings.
- JSON files must remain valid JSON; preserve formatting/indentation style of each file.

Scope: only `public/locales/**` and, if strictly required by the test, `src/localization/i18n.types.ts`. Nothing under `src/ui/`, `plans/`, `.mw/`.
