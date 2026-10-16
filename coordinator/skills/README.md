# Agent Skills Governance

**⚠️ IMPORTANT: This directory is the SINGLE SOURCE OF TRUTH for agent skill definitions.**

## Source of Truth Policy

- **This directory (`coordinator/skills/`)** is the versioned, auditable source of truth for all agent skill mandates.
- **`.windsurf/skills/`** may be a local working copy used by Windsurf/Devin Desktop, but it is NOT the source of truth.
- **All changes to agent skills must be made here first**, then committed to git.
- **`.windsurf/skills/` should be treated as a read-only cache** that gets synced from this directory.

## Directory Structure (2026-10-16)

```text
coordinator/skills/              # dir reale — .devin/.windsurf/.claude/skills sono symlink qui
├── README.md                    # This file
├── agent-execution-mandate/     # Agent Execution role
├── auditor-sentinel/            # Code Auditor workflow
├── coordinator-mandate/         # IN PAUSA (R-208) — kanban/dispatch sospesi
├── fixer-task/                  # STORICO (R-208) — fixer pipeline dispatch, solo su richiesta
├── guardian-mandate/            # auto-commit/auto-shutdown safeguards
├── idle-village-task/           # dominio /game (Pixi, HUD, quest, skin, frozen kits)
├── mockup-generator/
├── mw-executor|mw-explorer|mw-planner|mw-regression/  # wrapper MW per RPG
├── painter/                     # mockup visuali → componenti React
├── strategist/                  # direzione pre-desiderata (macro, non dispatch)
├── strategist-mandate/          # STORICO (R-208) — pipeline prompt-spec in pausa
├── bugfix -> mind-weaver/.agents/skills/bugfix   (symlink)
├── learn  -> mind-weaver/.agents/skills/learn    (symlink)
└── skills -> mind-weaver/.agents/skills          (mount condiviso: skill MW + vendored)
```

Le skill globali Mind Weaver (incluse quelle vendored: pixijs-*, vercel-*,
frontend-design, webapp-testing, web-design-guidelines, skill-creator,
playwright-cli) vivono in `mind-weaver/.agents/skills` e sono visibili qui via
il mount `skills/` e in `~/.agents/skills` via symlink.

## Sync Process

### Option 1: Symlink (Recommended if supported)

If Windsurf/Devin Desktop supports symlinks, create a symlink from `.windsurf/skills/` to `coordinator/skills/`:

```bash
# Remove existing .windsurf/skills/ if it exists
rm -rf .windsurf/skills

# Create symlink
ln -s ../coordinator/skills .windsurf/skills
```

### Option 2: Manual Sync

If symlinks are not supported, manually sync changes:

```bash
# Copy from versioned source to Windsurf working directory
cp -r coordinator/skills/* .windsurf/skills/
```

**When to sync:**

- After committing changes to `coordinator/skills/`
- Before starting a new Windsurf/Devin session
- After pulling changes from git that include skill updates

## Status

Le SKILL.md qui sono reali e mantenute (non più placeholder). Le skill di
metodologia globale vivono in `mind-weaver/.agents/skills` — modificarle lì,
mai qui. Skill sospese/storiche: `coordinator-mandate`, `strategist-mandate`,
`fixer-task` (R-208 — marcate nella description, non invocare).

## Governance References

These skill definitions are referenced by:

- `src/docs/docs/plans/systems_governance_alignment_plan.md`
- `coordinator/canonical-systems.md`
- `src/docs/docs/coordinator/prompt_writing_guide.md`

All references to `.windsurf/skills/` in those documents should be updated to point to `coordinator/skills/` instead.

## Why This Change?

Previously, agent skill definitions lived in `.windsurf/skills/`, which is gitignored. This meant:

- Governance rules were not version-controlled
- Changes to agent behavior were not auditable
- The team could not review or approve skill changes
- There was no history of governance evolution

By moving skills to `coordinator/skills/` under version control:

- All governance changes are tracked in git
- The team can review and approve skill updates
- There is a clear audit trail of governance evolution
- Skills are reproducible across different environments
