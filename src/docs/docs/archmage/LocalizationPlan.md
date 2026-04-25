# Localization Plan

## Goals

- Author all primary specs in English now.
- Keep structure translation-ready: mirrored directories, shared front-matter, documented terminology.
- Avoid duplicating content manually; use scripts/templates to sync future translations.

## Directory Strategy

- Source of truth: `docs/archmage/*.md` (EN).
- When a document is stable, create `docs/i18n/<lang>/archmage/<SameFileName>.md`.
- Each translated file includes a header block:

```md
<!--
Translation of: docs/archmage/FILENAME.md
EN Commit: <hash or date>
Translator: <name>
Status: Draft / Review / Published
-->
```

- Shared assets (images, diagrams) live under `docs/assets/archmage/` to prevent duplication.

## Workflow

1. **Stabilize English draft** – mark `Status: Ready for i18n` in the doc footer.
2. **Translation request** – add entry to `docs/i18n/TRANSLATION_QUEUE.md` with filename, target language, deadline.
3. **Translation delivery** – translator copies the header block, references the EN commit hash, and notes any deviations.
4. **Review** – bilingual reviewer ensures terminology matches the glossary.
5. **Sync** – when EN doc changes, bump the header `EN Commit` value and flag the translation as `Needs Update` until re-reviewed.

## Terminology Management

- Maintain `docs/archmage/Glossary.md` (TODO) listing canonical names (spell types, mana colors, palace districts) with short descriptions.
- For each translation, add a language-specific glossary under `docs/i18n/<lang>/Glossary.md` referencing the same IDs.

## Tooling Hooks (future)

- Simple script (`scripts/i18n/checkStatus.ts`) to compare EN timestamps vs translation headers and report stale files.
- Optional integration with the existing Prompt Library to auto-generate translation tasks for agents.

## Current Status

- English docs ready/soon-ready for translation: `Vision.md`, `GameplayPillars.md`, `ArtDirection_Wanderlust.md`, `TechnicalDirection.md`.
- Glossary and queue files still TBD.
