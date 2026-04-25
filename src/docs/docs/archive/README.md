---
title: Documentation Archive
status: active
owner: Documentation-Curator
last_reviewed: 2026-02-11
domain: docs
description: "Staging area for historical/legacy documentation"
---

# Documentation Archive

This folder contains **retired or legacy documents** that should remain accessible for historical reference but must not drive current implementation.

## Conventions

1. Group archives by domain (`idle_village/`, `punch_sts/`, `balancer/`, etc.).
2. Each subfolder needs a local `README.md` summarizing:
   - Why these docs were archived.
   - Which active doc or plan replaces them.
   - Any warnings (e.g., “dev-only, do not reintroduce”).
3. Files inside archive keep their original content + a frontmatter flag `status: archived`.
4. New prompts must not edit files under `archive/` unless explicitly tasked with historical research.

## Migration Checklist

- [ ] Move completed/obsolete plans from `src/docs/docs/plans/` when their prompt is done or > 60 days old.
- [ ] Update this README with links to key archives if needed.
- [ ] Add a note in the Architecture Bible whenever a major doc is archived (for discoverability).
