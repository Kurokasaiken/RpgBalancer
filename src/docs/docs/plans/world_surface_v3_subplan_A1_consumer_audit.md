---
title: World Surface V3 — Sub-plan A.1 — Consumer audit (v2)
status: Draft
version: 2
parent_plan: world_surface_v3_tactical_plan.md
node: A.1
classification: sub-plan
execution_hint: architectural
created: 2026-08-13
revised: 2026-08-13
---

# Sub-plan A.1 — Consumer audit (v2)

## Classificazione e giustificazione

`sub-plan`. Discovery puro. Prima di qualsiasi schema o registry è necessario capire chi consuma oggi i config esistenti, quali campi assume, e come adattarlo al nuovo contratto. **Nessun freeze di API o coordinate**: A.1 produce evidenza, non decisioni definitive.

## Intent

Auditare **tutti i consumer attuali** di `src/ui/idleVillage/worldSurface/` (e di `worldSurface` in generale) e produrre `CONSUMER_AUDIT.md` con: consumer, import, field usati, coordinate/trasformazioni usate, disposizione candidata (`adapt` | `compat-adapter` | `remove`), e note su incompatibilità con il domain model.

## Acceptance

- `CONSUMER_AUDIT.md` elenca consumer diretti e indiretti: hooks, layers, pagine, store Zustand, test, barrel exports, dynamic imports, data attributes CSS/DOM, Pixi runtime, eventuali file config locali.
- Per ogni consumer: file, import coinvolti, field/config usati, conversione coordinate attuale (screen / world / local / Pixi / DOM), disposizione candidata e perché.
- L'audit distingue chiaramente tra consumer del **contratto** (config/schemi) e consumer del **runtime** (Pixi/DOM/state).
- Nessun consumer è modificato in questo nodo.
- `npm run build:check` verde.

## Invariants (RPG)

- No duplicazione di schemi: i consumer non devono possedere definizioni di dominio locali (da registrare come evidenza, non da imporre).
- `world_pixels/top_left` è il candidato coordinate space canonico; A.1 ne verifica la compatibilità, non lo congela.
- `CONSUMER_AUDIT.md` è l'unico artifact di questo nodo.

## Constraints

- Non modificare i consumer; solo lettura, grep, tsc, documentazione.
- Il documento di audit non sostituisce il contratto, ma lo informa.
- I consumer indiretti (data attributes, store, barrel) devono essere inclusi, non solo import statici.
- Le disposizioni (`adapt`, `compat-adapter`, `remove`) sono **candidature**, non decisioni definitive.

## Approach notes

- Usare `grep` per import di `worldSurface/config/*`, `worldSurface/hooks/*`, `worldSurface/utils/*`, `useWorldSurface*`.
- Usare `tsc` per tracciare dipendenze di tipo.
- Cercare riferimenti a coordinate (e.g., `x`, `y`, `position`, `world`, `screen`, `viewport`, `camera`, `zoom`, `DPR`).
- Cercare riferimenti a `reaction`, `wonder`, `biome`, `event`, `breath`, `parallax`, `underwater` in `src/ui/idleVillage/`.
- Produrre tabella markdown in `CONSUMER_AUDIT.md`.
- Non avviare A.2 prima di avere `CONSUMER_AUDIT.md`.

## File targets

- `src/ui/idleVillage/worldSurface/CONSUMER_AUDIT.md` (nuovo)
- `test-results/world-surface-v3-A1-audit.md` (evidence log, opzionale)
- Lettura (no modifica): `src/ui/idleVillage/worldSurface/**/*`, `src/pages/world-surface-v3.tsx`, `src/ui/idleVillage/TestHub.tsx`

## Dependencies

- Domain model decision (`world_surface_v3_domain_model_decision.md`) come riferimento.
- Nessun consumer può iniziare la migrazione prima di questo audit.

## Safeguards

```bash
npm run build:check
npm run kanban:lint
```

## Open questions

- Formato di `CONSUMER_AUDIT.md`: tabella markdown, JSON o YAML? (decidere in esecuzione, markdown P0)
- Disposizioni sono vincolanti o solo candidature? (Solo candidature in A.1)
