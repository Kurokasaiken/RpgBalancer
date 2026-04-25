# Minimal Gameplay QA Checklist – How To

This guide explains how QA-Sage (or any Idle Village QA agent) should work with the `minimalQaChecklist` CLI introduced in NP-MIN-PLAN-209.

## 1. Prerequisites
- Node 20.19+ (`nvm use` as per repo instructions)
- Kanban file up to date at `src/docs/docs/coordinator/agent_assignments.md`
- Minimal Gameplay config exports committed (`src/balancing/config/idleVillage/minimalGameplayConfig.ts`)
- Optional: freshest Minimal Gameplay snapshot JSON if you plan to include config evidence (`snapshot serializer from NP-MIN-PLAN-206`)

## 2. CLI Usage
Run via tsx:

```bash
# basic run (writes to test-results/<timestamp>.md)
tsx scripts/idleVillage/minimalQaChecklist.ts

# custom output file
tsx scripts/idleVillage/minimalQaChecklist.ts --output test-results/mg-checklist-latestreview.md

# attach config snapshot for evidence linking
tsx scripts/idleVillage/minimalQaChecklist.ts \
  --include-config data/exports/idleVillage/minimal-snapshot-2026-02-12.json

# verbose logging (prints section/item counts)
tsx scripts/idleVillage/minimalQaChecklist.ts --verbose
```

### Available Flags
| Flag | Description |
| --- | --- |
| `-o, --output <file>` | Override default output path (`test-results/minimal-qa-checklist-<timestamp>.md`). |
| `--include-config <path>` | Attach metadata (size, excerpt) for a config snapshot stored under the repo. Path is resolved from project root. |
| `-v, --verbose` | Prints additional info about generated sections/items. |
| `-h, --help` | Shows usage summary. |

## 3. Output Structure
The Markdown file contains:
1. **Summary header** – generation timestamp, config version, tracked location/resident counts, event log entries.
2. **Active MG Prompts table** – only `MG-*` rows with status `In corso` or `Non assegnato`.
3. **Four sections** aligned with NP-MIN-PLAN-209 scope:
   - Persistence Validation
   - Telemetry Coverage
   - UI & HUD Review
   - Documentation & Evidence
4. **Safeguard TODO list** – pre-populated with required commands:
   - `npm run lint -- scripts/idleVillage`
   - `npm run test -- tests/unit/scripts/MinimalQaChecklist.test.ts`
   - `npm run build:check`
   - `npm run kanban:lint`
5. **Config Snapshot Reference** – shown only when `--include-config` is passed.
6. **Notes** – reminders about nightly cron + archival.

## 4. Archival & Evidence Rules
1. Save the Markdown output in `test-results/` with timestamp (already default behavior).
2. Reference the file in the Kanban evidence column when closing NP-MIN prompts.
3. Zip or attach associated config snapshots, lint/test/build logs in the same evidence path if needed.
4. For coordinated QA runs, aggregate outputs into `docs/qa/runs/<date>-minimal-checklist.md` (manual step).

## 5. Automation / Cron Suggestions
- **Nightly production check (recommended)**
  - Command: `tsx scripts/idleVillage/minimalQaChecklist.ts --output test-results/nightly/minimal-qa-checklist-$(date +%F).md`
  - Schedule via GitHub Actions or local launchd at 02:00 CET.
  - Include `--include-config data/exports/idleVillage/minimal-snapshot-latest.json` after the snapshot serializer finishes.
- **Pre-release gate**
  - Run the CLI plus the safeguard suite before promoting MG releases to main.

## 6. Troubleshooting
| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| Empty "Active Prompts" table | No `MG-*` rows marked `In corso` or `Non assegnato` | Verify Kanban statuses; run `/kanban-update` if stale. |
| CLI exits with "Unknown option" | Typo in flag | Run with `--help` to confirm supported flags. |
| Markdown missing snapshot block | Did not pass `--include-config` or file path invalid | Double-check path (relative to repo) and rerun. |
| Test suite failing | Updated CLI logic without adjusting `MinimalQaChecklist.test.ts` snapshots | Update/extend tests to match new behavior. |

## 7. Checklist Completion Flow
1. Run CLI → produce Markdown.
2. Execute safeguard commands, capture logs to `test-results/np-min-plan-209-qa-checklist-<date>.log`.
3. Update Kanban row (using `/kanban-update`) with evidence link.
4. Store Markdown + logs in version control.
5. Mention the generated file and log in the final prompt handoff message (per project workflow).

Keeping this doc up to date is part of the Documentation & Evidence section—edit here whenever the CLI gains new flags or when safeguard requirements change.
