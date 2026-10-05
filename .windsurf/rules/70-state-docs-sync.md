---
trigger: manual
description: State docs sync — SESSION_HANDOFF is the journal, CURRENT_STATE the curated snapshot.
---

# State Docs Sync

Ruoli dei documenti di stato (decisione Director, KB audit 2026-10-05):

- **`SESSION_HANDOFF.md`** — journal vivo: si appende a fine sessione/milestone.
- **`CURRENT_STATE.md`** — snapshot curato: fotografia del runtime, non il journal.
- `HANDOFF.md`, `CHANGELOG.md`, `VERTICAL_SLICE_PROGRESS.md`, `idle-village-context*.md`
  sono marcati `HISTORICAL` — non fonti.

## Regola

Quando `SESSION_HANDOFF.md` registra un milestone completato o un cambio di stato rilevante,
`CURRENT_STATE.md` va aggiornato **nella stessa sessione** — non in una passata futura.

Se il contenuto di `CURRENT_STATE.md` è più vecchio dell'ultimo handoff rilevante,
vince l'handoff: trattare CURRENT_STATE come stale e segnalarlo.
