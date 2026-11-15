# Fixture — `skin:no-adhoc-css` (PLAN-122 T-3)

Invariant: `.windsurf/rules/00-project-invariants.md` §Skin/Theme — any new
skin/visual theme MUST be a `skinConfigRegistry` preset, never a standalone
`.css` file.

- `violation/adhoc-skin.css` — a standalone skin stylesheet not present in
  `scripts/governance/registries/cssAllowlist.json`. **MUST fail.**
- `clean/skin-preset.ts` — the sanctioned preset path (a `.ts` file is outside
  the check's `.css` surface). **MUST pass.**

Verified by `npm run governance:check -- --selftest` (check licensed by this
pair per P3 — no demotion may cite a check without a green fixture pair).
