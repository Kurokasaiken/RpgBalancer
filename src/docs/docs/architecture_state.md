---
title: Architecture Router — RPG Balancer
status: canonical-router
updated: 2026-10-05
---

# Architecture Router — RPG Balancer

> **Ruolo:** entry point canonico per le domande di architettura. Non contiene l'architettura —
> mappa dominio → fonte autorevole. Promosso a router canonico nel KB audit 2026-10-05
> (desiderata v25): i 4 ex-claimant sono marcati superseded/reference (vedi `KNOWLEDGE_AUDIT.md` §C2).

## Dominio → fonte autorevole

| Dominio | Fonte autorevole |
|---|---|
| Invarianti non negoziabili (persistence, config-first, skin, i18n, state, docs) | `.windsurf/rules/00-project-invariants.md` |
| Filosofia config-first / weight-based creator (il "perché") | `.windsurf/rules/philosophy.md` |
| Contratti componenti trusted/frozen | `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` + `trusted/*_trusted.md` |
| Sistemi canonici (skin, analytics, ecc.) | `coordinator/canonical-systems.md` |
| Modello matematico del Balancer | `src/docs/docs/balancer/balance_model_v1.md` + `RPG_BALANCER_MASTER_CONTEXT.md` |
| Stato operativo dei piani | `plans/INDEX.md` |
| Decisioni e perché | `context/DECISION_LOG.md` · `.mw/desiderata.md` (FROZEN) |
| Autorità documentali | `CANON.md` |
| Deploy/Guardian | `.windsurf/rules/60-guardian-deploy.md` |
| Shutdown governance | `.windsurf/rules/50-shutdown-governance.md` |

## Ex-claimant (non autorevoli)

- `ARCHITECTURE.md` — deep dive tecnico (Jan 2026, parzialmente stale) → reference.
- `ARCHITECTURE_REFERENCE.md` — regole config-first ora in `.windsurf/rules/` → superseded.
- `ARCHITECTURE_BIBLE.md` — governance assorbita da `CANON.md` + `40-documentation-governance` → superseded.

## Regola d'uso

Se una domanda non è coperta dalla tabella, la risposta non ha fonte autorevole: segnalarlo
al Director invece di dedurla. Per aggiornare questa mappa serve una modifica esplicita —
non si accumula stato di modulo qui (quello vive in `CURRENT_STATE.md` / `plans/INDEX.md`).
