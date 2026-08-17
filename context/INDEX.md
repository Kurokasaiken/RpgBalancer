---
title: Context Index
type: reference
updated: 2026-08-15
---

# Context Index

One line per file. Add a line when a file is discovered and useful; remove when deleted.
Format: `[filename](path) — one sentence — \`tag\``

[DESIGN_PILLARS.md](DESIGN_PILLARS.md) — direction and inspiration pillars — `direction`
[context/DECISION_LOG.md](DECISION_LOG.md) — history of decisions — `history`
[src/docs/docs/MASTER_PLAN.md](src/docs/docs/MASTER_PLAN.md) — roadmap and phase tracking — `planning`
[src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md](src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md) — trusted component registry — `components` `trusted`
[.windsurf/rules/00-project-invariants.md](.windsurf/rules/00-project-invariants.md) — non-negotiable project constraints — `invariants`
[.windsurf/rules/40-documentation-governance.md](.windsurf/rules/40-documentation-governance.md) — trusted/frozen doc policy — `governance`
[.windsurf/rules/philosophy.md](.windsurf/rules/philosophy.md) — RPG balancer philosophy and config-first rules — `philosophy`
[.windsurf/skills/strategist-mandate/SKILL.md](.windsurf/skills/strategist-mandate/SKILL.md) — strategic plan prompt generation — `skill` `strategy`
[.windsurf/skills/coordinator-mandate/SKILL.md](.windsurf/skills/coordinator-mandate/SKILL.md) — task dispatch and Kanban — `skill` `dispatch`
[.windsurf/skills/agent-execution-mandate/SKILL.md](.windsurf/skills/agent-execution-mandate/SKILL.md) — implementation execution — `skill` `execution`
[.windsurf/skills/idle-village-task/SKILL.md](.windsurf/skills/idle-village-task/SKILL.md) — idle village specific tasks — `skill` `idle-village`
[.windsurf/skills/mw-explorer/SKILL.md](.windsurf/skills/mw-explorer/SKILL.md) — Mind Weaver exploration workflow — `skill` `mind-weaver`
[.windsurf/skills/mw-planner/SKILL.md](.windsurf/skills/mw-planner/SKILL.md) — Mind Weaver planning workflow — `skill` `mind-weaver`
[.windsurf/skills/mw-executor/SKILL.md](.windsurf/skills/mw-executor/SKILL.md) — Mind Weaver execution workflow — `skill` `mind-weaver`
[.windsurf/skills/mw-regression/SKILL.md](.windsurf/skills/mw-regression/SKILL.md) — Mind Weaver anti-regression guard — `skill` `mind-weaver`
|[.windsurf/skills/learn/SKILL.md](.windsurf/skills/learn/SKILL.md) — Mind Weaver learning workflow: pattern capture and context maintenance — `skill` `mind-weaver` `learning`
|[.windsurf/skills/bugfix/SKILL.md](.windsurf/skills/bugfix/SKILL.md) — Mind Weaver generic bugfix workflow — `skill` `mind-weaver` `bugfix`
[AGENTS.md](AGENTS.md) — agent instructions for RPG — `agent`
[CLAUDE.md](CLAUDE.md) — pointer to AGENTS.md — `agent`
[RICHIESTE.md](RICHIESTE.md) — intent ledger — `agent`
[context/MIND_WEAVER_MULTI_AI_PROTOCOLS.md](context/MIND_WEAVER_MULTI_AI_PROTOCOLS.md) — comandi e workflow multi-AI di Mind Weaver in RPG — `mind-weaver` `multi-ai` `protocols`
[src/docs/docs/plans/poi_quest_system_exploration.md](src/docs/docs/plans/poi_quest_system_exploration.md) — POI quest: cerchio magico come timer, quest card a fasi, skill check per fase (R-005, esplorazione con risposte) — `exploration` `idle-village`
[src/docs/docs/plans/poi_quest_system_plan.md](src/docs/docs/plans/poi_quest_system_plan.md) — POI quest: piano implementativo T-001→T-009, desiderata v3 FROZEN — `plan` `idle-village`
[.mw/plans/poi-quest-config-first-cleanup.md](.mw/plans/poi-quest-config-first-cleanup.md) — sub-plan TP1–TP5 per la cleanup config-first di `/poi-quest-detail-roster-time-clock` — `plan` `idle-village`
[src/docs/docs/idle_village/poi_quest_detail_roster_time_clock_page_workflow.md](src/docs/docs/idle_village/poi_quest_detail_roster_time_clock_page_workflow.md) — workflow e contratti della pagina POI quest — `idle-village` `workflow`
[src/docs/docs/idle_village/poi_quest_detail_roster_time_clock_error_registry.md](src/docs/docs/idle_village/poi_quest_detail_roster_time_clock_error_registry.md) — registro errori POI quest detail roster time clock — `idle-village` `errors`
[test-results/poi-quest-detail-roster-time-clock-runtime-2026-08-14.md](test-results/poi-quest-detail-roster-time-clock-runtime-2026-08-14.md) — evidence log build/test del ciclo TP1–TP5 — `evidence` `idle-village`
[test-results/poi-quest-config-first-cleanup-lessons-2026-08-15.md](test-results/poi-quest-config-first-cleanup-lessons-2026-08-15.md) — lezioni apprese dalla cleanup config-first — `learning` `idle-village`
[.devin/skills/mockup-generator/SKILL.md](.devin/skills/mockup-generator/SKILL.md) — workflow skill per generazione mockup AI → componente + asset — `skill` `mind-weaver` `art-direction`
[src/docs/docs/plans/ai_mockup_workflow.md](src/docs/docs/plans/ai_mockup_workflow.md) — workflow operativo per mockup AI e integrazione componenti — `plan` `art-direction`
[plans/PLAN-MOCKUP-TO-COMPONENT-v1.md](plans/PLAN-MOCKUP-TO-COMPONENT-v1.md) — piano v1 mockup→componente, bocciato dalla delibera multi-AI (storia) — `plan` `art-direction`
[.mw/runs/explore-mockup-to-component/SYNTHESIS.md](.mw/runs/explore-mockup-to-component/SYNTHESIS.md) — sintesi critica ChatGPT+Claude su v1: 6 blocking, ricerca alpha/CLIP/LoRA, architettura Contract→StyleLock→AssetManifest — `evidence` `art-direction` `multi-ai`
[plans/PLAN-MOCKUP-TO-COMPONENT-v2.md](plans/PLAN-MOCKUP-TO-COMPONENT-v2.md) — piano v2 mockup→componente: CSS/React-first, 2 ingressi, whitelist licenze, decisioni Director ratificate — `plan` `art-direction`
[.mw/runs/coldread-mockup-v2/SYNTHESIS.md](.mw/runs/coldread-mockup-v2/SYNTHESIS.md) — cold read avversariale su v2: verdetto NO, 5 blocking, 7 correzioni richieste — `evidence` `art-direction` `multi-ai`
[plans/PLAN-MOCKUP-TO-COMPONENT-v3.md](plans/PLAN-MOCKUP-TO-COMPONENT-v3.md) — piano v3 con decisioni Director, fast path, metrica ibrida, governance ridotta, pilot GoblinEventLabPage — `plan` `art-direction`
[.mw/runs/handoff-mockup-to-component-20260814.md](.mw/runs/handoff-mockup-to-component-20260814.md) — handoff di sessione: lezioni, errori, decisioni, prossimo passo — `handoff` `art-direction`
[public/mockups/external/goblin-event-lab/MOCKUP.md](public/mockups/external/goblin-event-lab/MOCKUP.md) — esempio esterno di mockup (goblin invasion) su cui provare il pilot v2 — `evidence` `art-direction` `mockup`
[.mw/runs/2026-08-15/pattern-candidate-poi-quest-dnd-overlay-test-hooks.md](.mw/runs/2026-08-15/pattern-candidate-poi-quest-dnd-overlay-test-hooks.md) — pattern: test hook fallback per E2E dnd-kit — `pattern` `idle-village` `testing`
|[src/docs/docs/idle_village/village_event_system_spec.md](src/docs/docs/idle_village/village_event_system_spec.md) — event system, post-quest outcomes, world events, timeout — `idle-village` `events`
|[src/docs/docs/idle_village/idle_village_gameplay_math_spec.md](src/docs/docs/idle_village/idle_village_gameplay_math_spec.md) — gameplay math: time, fatigue, injury, quest power, rewards — `idle-village` `math`
|[src/docs/docs/idle_village/skill_check_workflow_spec.md](src/docs/docs/idle_village/skill_check_workflow_spec.md) — D20 and D100 skill check subsystems, spell creator gap — `idle-village` `skill`
|[src/docs/docs/idle_village/quest_failure_and_recovery_spec.md](src/docs/docs/idle_village/quest_failure_and_recovery_spec.md) — quest failure, timeout, injury/death, recovery — `idle-village` `quest`
[plans/PLAN-004-poi-quest-ui-regressions.md](plans/PLAN-004-poi-quest-ui-regressions.md) — piano di battaglia per ERR-028/030 — `plan` `idle-village` `bugfix"
[src/docs/docs/plans/world_surface_reactive_artifact_plan.md](src/docs/docs/plans/world_surface_reactive_artifact_plan.md) — piano no-parallax: mappa come manufatto reattivo — `plan` `world-surface` `no-parallax`
