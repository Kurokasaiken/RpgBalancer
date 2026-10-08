---
title: Context Index
type: reference
updated: 2026-10-06
---

# Context Index

One line per file. Add a line when a file is discovered and useful; remove when deleted.
Format: `[filename](path) — one sentence — \`tag\``

## Retrieval layers — «se la risposta non basta, dove guardo dopo?»

- **L0 — Orientation:** `AGENTS.md`, `CURRENT_STATE.md` — cosa è il progetto e
  dov'è lo stato attuale.
- **L1 — Canonical facts:** `CANON.md` (mappa delle autorità),
  `QUEST_RULES.md`, `src/docs/docs/architecture_state.md`, i doc canonici di
  dominio. Se la domanda è «cosa vale oggi», rispondi da qui.
- **L2 — Rationale / relationships:** `context/DECISION_LOG.md`,
  `plans/INDEX.md` + i plan linkati, `.mw/desiderata.md` (intento FROZEN).
  Per «perché è così» scendi qui.
- **L3 — Negative / unresolved:** `context/REJECTED.md`,
  `context/OPEN.md`, piani `superseded`. Per «cosa abbiamo scartato / cosa è
  ancora aperto».
- **L4 — Provenance / evidence:** `context/ingestions/`, `.mw/runs/`
  (scratch, non tracciato), `test-results/`. Per «da dove viene questa
  conoscenza / cosa è stato detto nella conversazione».

[DESIGN_PILLARS.md](DESIGN_PILLARS.md) — direction and inspiration pillars — `direction`
[context/DECISION_LOG.md](context/DECISION_LOG.md) — history of decisions — `history`
[context/QUEST_GAMEPLAY_SCIENCE.md](context/QUEST_GAMEPLAY_SCIENCE.md) — living bibliography: real studies on suspense/failure/choice psychology for quest gameplay — `research` `quest` `design`
[src/docs/docs/MASTER_PLAN.md](src/docs/docs/MASTER_PLAN.md) — roadmap and phase tracking — `planning`
[src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md](src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md) — trusted component registry — `components` `trusted`
[.windsurf/rules/00-project-invariants.md](.windsurf/rules/00-project-invariants.md) — non-negotiable project constraints — `invariants`
[.windsurf/rules/40-documentation-governance.md](.windsurf/rules/40-documentation-governance.md) — trusted/frozen doc policy — `governance`
[.windsurf/rules/80-quest-rules-maintenance.md](.windsurf/rules/80-quest-rules-maintenance.md) — QUEST_RULES.md si aggiorna su nuove regole quest del Director; status vigente/proposta/divergenza, conflitto → domanda — `governance` `quest`
[.windsurf/rules/85-documentation-impact.md](.windsurf/rules/85-documentation-impact.md) — contratto Documentation Impact dei piani (NONE/OPTIONAL/REQUIRED + routing degli update) — `governance` `documentation`
[.windsurf/rules/philosophy.md](.windsurf/rules/philosophy.md) — RPG balancer philosophy and config-first rules — `philosophy`
[.windsurf/skills/strategist-mandate/SKILL.md](.windsurf/skills/strategist-mandate/SKILL.md) — strategic plan prompt generation (storico, solo contesto per R-004) — `skill` `strategy`
[coordinator/skills/strategist/SKILL.md](coordinator/skills/strategist/SKILL.md) — layer di direzione pre-desiderata: discussione libera, macro plan, handoff a desiderata (desiderata v26) — `skill` `strategy` `mind-weaver`
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
[.mw/runs/2026-08-28-poi-materic-v4/pattern-candidate.md](.mw/runs/2026-08-28-poi-materic-v4/pattern-candidate.md) — pattern: archi progressivi con cap tondo (3a ricorrenza), loop rAF che deve leggere lo store, mix-blend-mode isolato da antenati trasformati — `pattern` `idle-village` `svg` `animation`
[.mw/pattern-big-rewrite-without-authority.md](.mw/pattern-big-rewrite-without-authority.md) — pattern: assunzione di riscrittura senza autorità dalla desiderata FROZEN; regola: leggere sempre desiderata prima di codare — `pattern` `protocol` `learning`
[.mw/runs/20261007-learn-coverage-invariant/pattern-candidate.md](.mw/runs/20261007-learn-coverage-invariant/pattern-candidate.md) — pattern candidato: sintesi sopra un ledger atomico perde dettagli «orfani di schema»; fix = coverage check per-ID alla scrittura, non a richiesta — `pattern` `protocol` `learning` `documentation`
[context/QUEST_IMPRINTS.md](context/QUEST_IMPRINTS.md) — probe S5: imprint IMPR-001 «contratto col cuore» con function spec per beat + 3 istanziazioni su tag diversi (palude/gilda, mare, santuario) — `quest` `narrative` `design` `proposal`
|[src/docs/docs/plans/idle_village_hero_components_placeholder_plan.md](src/docs/docs/plans/idle_village_hero_components_placeholder_plan.md) — piano ombrello per placeholder scheda/equip/consumabili/skill — `plan` `idle-village` `hero`
|[src/docs/docs/plans/idle_village_hero_sheet_dynamic_stats_plan.md](src/docs/docs/plans/idle_village_hero_sheet_dynamic_stats_plan.md) — Sub-Plan A2: hero sheet con stat dinamiche dal Balancer registry, Lv/XP mock, skill equipaggiate (R-073) — `plan` `idle-village` `hero`
|[CANON.md](CANON.md) — mappa delle autorità documentali — `governance` `canon`
|[CURRENT_STATE.md](CURRENT_STATE.md) — fotografia dello stato runtime — `state` `reference`
|[GLOSSARY.md](GLOSSARY.md) — glossario canonico del progetto — `reference`
|[src/docs/docs/balancer/balance_model_v1.md](src/docs/docs/balancer/balance_model_v1.md) — Canonical Mathematical Inventory del Balancer (audit in corso) — `balancer` `audit` `planning`
|[src/docs/docs/balancer/RPG_BALANCER_MASTER_CONTEXT.md](src/docs/docs/balancer/RPG_BALANCER_MASTER_CONTEXT.md) — Master Context / Handoff completo del Balancer (visione + design intent + audit) — `balancer` `handoff` `design`
|[.mw/runs/20261004-rovine-preview-chatgpt/](.mw/runs/20261004-rovine-preview-chatgpt/README.md) — conversazione ChatGPT 2026-10-04 archiviata (gitignored): provenance originale — copie tracciate in `context/QUEST_ECONOMY_NOTES.md`, `src/docs/docs/idle_village/quest_rovine_scenario_spec.md`, `quest_simulation_preview_spec.md` — `quest` `idle-village` `design` `proposal`
|[context/QUEST_S1_DESIGN.md](context/QUEST_S1_DESIGN.md) — matrice di design del lab S1 «La cassa delle sementi» (confermata dal Director 2026-10-02; parametri = mock da Gate A) — `quest` `design` `L2`
|[context/QUEST_ECONOMY_NOTES.md](context/QUEST_ECONOMY_NOTES.md) — note di design economia-villaggio: human-days, quest-opportunità, leader-capacity, juice — status PROPOSAL (OPEN-010) — `quest` `village` `design` `proposal` `L2`
|[context/QUEST_V6_REDESIGN.md](context/QUEST_V6_REDESIGN.md) — redesign S1 «TAKEN≠SECURED» guidato da QUEST_GAMEPLAY_SCIENCE — status PROPOSAL — `quest` `design` `proposal` `L2`
|[src/docs/docs/idle_village/quest_rovine_scenario_spec.md](src/docs/docs/idle_village/quest_rovine_scenario_spec.md) — spec scenario «Le Rovine sotto il Fiume» (implementato, regressione) — `quest` `idle-village` `spec`
|[context/QUEST_GOBLIN_REWORK_PROPOSAL.md](context/QUEST_GOBLIN_REWORK_PROPOSAL.md) — proposta di rework emotivo/narrativo della quest goblin (R-103): ricerca su pacing/suspense, playtest col motore reale, 12 difetti, critica al brief ChatGPT, interventi P0/P1/P2, metriche emotive — `quest` `proposal` `narrative`
|[src/docs/docs/idle_village/quest_sterminio_goblin_spec.md](src/docs/docs/idle_village/quest_sterminio_goblin_spec.md) — **documento unico** «Sterminio dei goblin»: targeting posizionale a cascata (Director), fasi F0–F7, escalation, manoscritto narrativo completo (transit/action names/verdictFlavor, R-099), regole di scrittura e budget di rischio — `quest` `idle-village` `spec`
|[src/docs/docs/idle_village/quest_simulation_preview_spec.md](src/docs/docs/idle_village/quest_simulation_preview_spec.md) — spec Quest Simulation Preview R-082 (implementata) — `quest` `idle-village` `spec` `preview`
|[KNOWLEDGE_AUDIT.md](KNOWLEDGE_AUDIT.md) — audit KB per agenti AI (desiderata v25): struttura, gap, 10 contraddizioni, problemi autorità/retrieval, proposte F1–F9 — `audit` `governance` `knowledge`
|[KNOWLEDGE_REFACTOR_REPORT.md](KNOWLEDGE_REFACTOR_REPORT.md) — health report finale refactor R-085: authority map per dominio, retrieval test 40 domande (33P/3Pa/5F), documenti pericolosi residui — `audit` `governance` `knowledge`
|[VILLAGE_ECONOMY.md](VILLAGE_ECONOMY.md) — dominio economia villaggio: loop produzione, human-days/leader-capacity/quest-opportunità (proposte OPEN-010) — DRAFT bozza — `village` `economy` `draft` `L1`
|[PROGRESSION.md](PROGRESSION.md) — dominio progressione eroi/villaggio: XP, sblocchi, blueprint, licenze — DRAFT bozza — `progression` `draft` `L1`
|[NARRATIVE.md](NARRATIVE.md) — dominio narrativa: setting, struttura quest, semi narrativi, storia emergente — DRAFT bozza — `narrative` `draft` `L1`
|[QUEST_RULES.md](QUEST_RULES.md) — doc canonico regole quest vigenti (PLAN-020): regola → fonte → stato — `quest` `canonical` `L1`
|[context/REJECTED.md](context/REJECTED.md) — registro approcci/idee valutati e rifiutati con motivo — `knowledge` `rejected` `L3`
|[context/OPEN.md](context/OPEN.md) — registro delle questioni irrisolte con link a fonti e piani — `knowledge` `open` `L3`
|[context/ingestions/](context/ingestions/) — report di ingestion del knowledge-extractor (ledger estrazione→reconciliazione, evidence non canonica) — `knowledge` `evidence` `L4`
|[context/ingestions/2026-10-05-progettare-quest-strategiche.md](context/ingestions/2026-10-05-progettare-quest-strategiche.md) — ingestion report conversazione «Progettare quest strategiche»: Extraction Ledger E-01..E-18 + reconciliazione (coda conversazione) — `knowledge` `evidence` `quest` `L4`
|[context/ingestions/2026-10-05-progettare-quest-strategiche-transcript-completo.md](context/ingestions/2026-10-05-progettare-quest-strategiche-transcript-completo.md) — ingestion del transcript integrale (200 msg, `.mw/runs/20261005-transcript-quest-strategiche/`): Ledger E-19..E-49, nuove OPEN-012/013/014 — `knowledge` `evidence` `quest` `L4`
|[context/ingestions/2026-10-06-quest-strategiche-continuazione.md](context/ingestions/2026-10-06-quest-strategiche-continuazione.md) — ingestion della continuazione 2026-10-05 (share 6ac4b926): checklist authoring E-01, anti-pattern REJ-007, thread aperto «quest originale del Director da decomporre» — `knowledge` `evidence` `quest` `L4`
|[.mw/runs/20261006-emergent-narrative-research/](.mw/runs/20261006-emergent-narrative-research/BROADCAST.md) — ricerca R-090 narrativa emergente: prompt + broadcast chatgpt/grok/deepseek (claude fallito, gemini rifiutato) + ricerca propria; principi integrati in `context/QUEST_GAMEPLAY_SCIENCE.md` P48–P63 e `NARRATIVE.md` §3 — `evidence` `quest` `narrative` `research` `L4`
|[context/ingestions/2026-10-06-quest-cross-direct.md](context/ingestions/2026-10-06-quest-cross-direct.md) — ingestion share «Sistema di quest cross direct» (R-091, coda voice-mode): primitive dei beat, separazione struttura/flavor, generatore a vincoli in 3 passi (orbita OPEN-014) — `knowledge` `evidence` `quest` `narrative` `L4`
||[context/ingestions/2026-10-07-registro-narrativo-del-mondo.md](context/ingestions/2026-10-07-registro-narrativo-del-mondo.md) — ingestion share «Registro narrativo del mondo» (R-093): intenti Director vs proposte AI su conseguenze, memoria e legacy; macro-piano non ratificato (OPEN-016) — `knowledge` `evidence` `quest` `narrative` `L4`
