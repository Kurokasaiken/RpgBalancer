# P0-3 Ingest-amnesia case — PLAN-090 Phase 0
Date: 2026-10-28

## Setup
Latest ingestion: `context/ingestions/2026-10-28-deep-research-context-architecture/` (4 AI research files, ~59KB) + prior 42 files (~976KB total).

## Question
What durable knowledge from a pasted discussion reaches the next session WITHOUT re-reading the file?

## Measured answer
- The INDEX.md row points to the directory (one line, L4 evidence layer) — the content itself is not in any session-start surface.
- No distilled preferences/decisions/vetoes from ingestions are extracted anywhere automatically. `knowledge-extractor` exists but must be invoked manually and targets canonical docs, not an advisory lane.
- Concrete example from today: the 4 research docs contain Director-relevant decisions (R-292 ruling material) — nothing of that is presented to a fresh session except this R-292 entry, which had to be hand-written.

## Gap confirmed (baseline for Task 4 ingest-time delta)
Observable error (Director, 2026-10-28): «GPT web ne rimane arricchito, mw no». Baseline = 0 durable extractions per ingestion. Target = every new ingestion emits a delta (preferences/choices/vetoes/corrections) into `context/auto/` with provenance+confidence+review-by, banner ADVISORY-NOT-CANON, "skip derivable" filter.
