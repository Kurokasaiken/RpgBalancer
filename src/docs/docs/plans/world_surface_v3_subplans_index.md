---
title: World Surface V3 — Sub-plans Index
status: Draft
parent_plan: world_surface_v3_tactical_plan.md
classification: index
created: 2026-08-13
revised: 2026-08-13
---

# World Surface V3 — Sub-plans Index

Indice dei sub-plan draft per il piano tattico `world_surface_v3_tactical_plan.md` v2.2.

| Nodo | File | Classificazione | Execution hint | Dipende da |
|---|---|---|---|---|
| DM | [Domain Model Decision](world_surface_v3_domain_model_decision.md) | decision | reference | delibera multi-AI |
| A.1 | [Sub-plan A.1 — Consumer audit e freeze contratto](world_surface_v3_subplan_A1_consumer_audit.md) | sub-plan | architectural | — |
| A.2 | [Sub-plan A.2 — Fragments, schemas, validation](world_surface_v3_subplan_A2_contract_validation.md) | sub-plan | verified | A.1, B |
| A.3 | [Sub-plan A.3 — Registry e migrazione consumer](world_surface_v3_subplan_A3_registry_migration.md) | sub-plan | verified | A.1, A.2 |
| B | [Sub-plan B — WorldClock adapter](world_surface_v3_subplan_B_worldclock_adapter.md) | sub-plan | architectural | — |
| C | [Sub-plan C — EffectAdmissionController](world_surface_v3_subplan_C_effect_admission.md) | task | verified | A.2, B |
| D | [Sub-plan D — AttentionZone Resolver](world_surface_v3_subplan_D_attention_zone.md) | sub-plan | verified | A.2, B |
| E | [Sub-plan E — EventSeverity + FSM](world_surface_v3_subplan_E_event_severity.md) | sub-plan | verified | A.2, B |
| F | [Sub-plan F — Wonder Spawner + Pool](world_surface_v3_subplan_F_wonder_spawner.md) | sub-plan | verified | A.2, B, C, E |
| G | [Sub-plan G — Breath / Parallax / Underwater V3](world_surface_v3_subplan_G_breath_parallax_underwater.md) | sub-plan | verified | A.2, B, C |
| H | [Sub-plan H — Demo verticale](world_surface_v3_subplan_H_demo_integration.md) | sub-plan | architectural | A.3, B, C, D, E, F, G |
| I | [Sub-plan I — Freeze e Kanban](world_surface_v3_subplan_I_docs_kanban.md) | task | assisted | approvazione A.1–A.3, B–H |

## Ordine di esecuzione

1. **A.1 e B in parallelo** — consumer audit e tempo.
2. **A.2** — contratto, schemas, composer, validation (dipende da A.1 e B).
3. **A.3** — registry e migrazione consumer (dipende da A.2 e A.1).
4. **C, D, E, G in parallelo** — admission, attention, severity, breath/parallax (dipendono da A.2 e B).
5. **F in parallelo** — wonder (dipende da A.2, B, C, E).
6. **H** — integrazione (dipende da A.3, B, C, D, E, F, G).
7. **I** — congelamento e Kanban (dipende dall'approvazione).
