# Agent Skills Governance

**⚠️ IMPORTANT: This directory is the SINGLE SOURCE OF TRUTH for agent skill definitions.**

## Source of Truth Policy

- **This directory (`coordinator/skills/`)** is the versioned, auditable source of truth for all agent skill mandates.
- **`.windsurf/skills/`** may be a local working copy used by Windsurf/Devin Desktop, but it is NOT the source of truth.
- **All changes to agent skills must be made here first**, then committed to git.
- **`.windsurf/skills/` should be treated as a read-only cache** that gets synced from this directory.

## Directory Structure

```text
coordinator/skills/
├── README.md                    # This file
├── strategist-mandate/
│   └── SKILL.md                 # Strategist role definition
├── coordinator-mandate/
│   └── SKILL.md                 # Coordinator role definition
├── agent-execution-mandate/
│   └── SKILL.md                 # Agent Execution role definition
└── idle-village-task/
    └── SKILL.md                 # Idle Village specific task mandate
```

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

Currently, the SKILL.md files in this directory are **placeholders**. The actual content needs to be exported from Windsurf/Devin Desktop's `.windsurf/skills/` directory and pasted here.

**Action required:**

1. Open Windsurf/Devin Desktop
2. Navigate to `.windsurf/skills/*/SKILL.md` for each skill
3. Copy the content
4. Replace the placeholder files in `coordinator/skills/*/SKILL.md`
5. Commit the changes

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
