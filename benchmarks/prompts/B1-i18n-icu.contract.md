Several user-facing strings in this repo use `{{var}}` mustache-style interpolation placeholders, but the project's i18n stack uses ICU message format, where placeholders are `{var}` (single braces). Inside ICU plural/select blocks the count placeholder is written `#`.

Find every malformed interpolation placeholder in the JSON locale resources under `public/locales/` and fix it to the correct ICU form. Do not touch i18next `loadPath`/`backend` URL templating (those legitimately use `{{lng}}`/`{{ns}}`). Do not change key names.

Contract of done — a failing test exists and must pass:

  npm run test -- tests/i18n/icuInterpolation.test.ts

Do NOT modify `tests/i18n/icuInterpolation.test.ts`; it encodes the expected behavior. Run it before finishing and report the result honestly.
