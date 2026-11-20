# Navigation — cosa leggere, quando (snapshot 2026-11-19)

Mappa del knowledge pack. Convenzione stati (campo reale dichiarato nei file —
il vocabolario del repo non è ancora normalizzato, vedi §governance del primer):

- **canonical/canon** = autorità vigente · **candidate** = candidato a canonico
- **DRAFT/draft** = bozza di dominio, non deciso · **PROPOSAL/proposta** = proposta
  non ratificata · **vigente/active/reference** = in uso · **STALE** = datato,
  verificare prima di citare · **spec** = contratto tecnico di qualcosa di esistente

**Regola d'oro:** prima di proporre leggi `repo-snapshot/OPEN.md` e
`repo-snapshot/REJECTED.md`. Prima di affermare "nel gioco è così" leggi
`CURRENT_STATE.md`, non i piani.

## Tier 0 — orientamento (sempre)

| File | Stato | Quando leggerlo |
|---|---|---|
| `00-PRIMER.md` | — | Primo file: vocabolario, autorità, ruolo di Claude |
| `repo-snapshot/CANON.md` | canonical | "Quale doc decide cosa" — mappa delle autorità |
| `repo-snapshot/CURRENT_STATE.md` | snapshot | Stato runtime reale alla data del pack |
| `repo-snapshot/DESIGN_PILLARS.md` | canonical (per CANON) | Test di coerenza di OGNI proposta di design |
| `repo-snapshot/desiderata-digest.md` | FROZEN | Intenti congelati del Director |

## Quest & gimmick (focus del Project)

| File | Stato | Quando leggerlo |
|---|---|---|
| `repo-snapshot/QUEST_RULES.md` | canonical | Regole quest vigenti (regola→fonte→stato) |
| `repo-snapshot/GOOD_QUEST_DEFINITION.md` | canon | "Cos'è una buona quest" + proprietà S1–S5 |
| `repo-snapshot/QUEST_GAMEPLAY_SCIENCE.md` | research | Base scientifica: suspense, fallimento, scelta |
| `repo-snapshot/QUEST_GIMMICK_CHANNELS_RESEARCH.md` | active | Canali gimmick: binding adottato, F1–F12 |
| `repo-snapshot/QUEST_GENERATION_ARCHITECTURE.md` | PROPOSAL | Framework: gimmick core, regola 75%, archetipi decisionali |
| `repo-snapshot/QUEST_GENERATION_SPEC.md` | PROPOSAL | Specchietto riassuntivo del generatore |
| `repo-snapshot/QUEST_GENERATION_CONTRACTS.md` | PROPOSAL | Contratti del generatore + gap motore noti |
| `repo-snapshot/QUEST_AUTHORING_PLAYBOOK.md` | draft | Come si crea una quest oggi (processo reale) |
| `repo-snapshot/QUEST_IMPRINTS.md` | DRAFT | Imprint: contratti per beat + istanziazioni |
| `repo-snapshot/QUEST_OPPORTUNITY_LAYER.md` | PROPOSAL | Meta-layer opportunità: gate, famiglie, tempo |
| `repo-snapshot/QUEST_CAMPAIGN_MACRO.md` | PROPOSAL | Macro-campagna, mid/endgame |
| `repo-snapshot/QUEST_ECONOMY_NOTES.md` | PROPOSAL | Economia villaggio↔quest (human-days, juice) |
| `repo-snapshot/QUEST_V6_REDESIGN.md` | PROPOSAL | Redesign quest S1 guidato dalla science |
| `repo-snapshot/QUEST_S1_DESIGN.md` | vigente | Matrice design quest «La cassa delle sementi» |
| `repo-snapshot/QUEST_GOBLIN_REWORK_PROPOSAL.md` | proposta | Critica pacing/suspense della quest goblin |
| `repo-snapshot/quest_sterminio_goblin_spec.md` | spec | Manoscritto completo quest goblin (implementata) |
| `repo-snapshot/GAME_INVASION_SEQUENCE.md` | reference | Sequenza evento invasione (implementata) |

## Sistemi & bilanciamento

| File | Stato | Quando leggerlo |
|---|---|---|
| `repo-snapshot/idle_village_gameplay_math_spec.md` | candidate | Matematica: tempo, fatica, quest power, reward |
| `repo-snapshot/skill_check_workflow_spec.md` | candidate | Skill check D20/D100 |
| `repo-snapshot/quest_failure_and_recovery_spec.md` | spec | Fallimento, timeout, morte, recovery |
| `repo-snapshot/village_event_system_spec.md` | spec | Eventi di mondo, outcome post-quest |
| `repo-snapshot/BALANCING_SYSTEM.md` | reference | Sistema di bilanciamento |
| `repo-snapshot/BALANCING_DEEP_DIVE.md` | reference | Analisi approfondita bilanciamento |
| `repo-snapshot/STAT_BALANCING_ANALYSIS.md` | reference | Analisi bilanciamento stat |
| `repo-snapshot/COMBAT_SYSTEM_DESIGN.md` | reference | Design del combat |
| `repo-snapshot/SPELL_CREATION_SPEC.md` | spec | Creazione spell |
| `repo-snapshot/SPELL_TYPE_GUIDELINES.md` | reference | Linee guida tipi di spell |
| `repo-snapshot/VILLAGE_ECONOMY.md` | DRAFT | Economia villaggio (bozza — early/midgame da definire) |
| `repo-snapshot/PROGRESSION.md` | DRAFT | Progressione eroi/villaggio (bozza — endgame aperto) |

## Narrativa, mercato, governance

| File | Stato | Quando leggerlo |
|---|---|---|
| `repo-snapshot/NARRATIVE.md` | DRAFT | Setting, semi narrativi, storia emergente |
| `repo-snapshot/GAMEPLAY_DESIGN.md` | canonical (per CANON) | Visione gameplay attuale |
| `repo-snapshot/COMPETITIVE_LANDSCAPE.md` | research | Competitor, prezzi, posizionamento |
| `repo-snapshot/STEAM_PAGE_PLAN.md` | plan | Piano pagina Steam |
| `repo-snapshot/BUSINESS_PLAN.md` | reference | Business plan, funding, round outreach |
| `repo-snapshot/RPG_PROJECT_CONTEXT.md` | reference | Governance e vincoli semantici |
| `repo-snapshot/GLOSSARY.md` | reference | Termini di dominio |
| `repo-snapshot/architecture_state.md` | canonical | Router dominio→fonte tecnica |
| `repo-snapshot/PROJECT_PHILOSOPHY.md` | active | Filosofia del progetto |
| `repo-snapshot/RICHIESTE.md` | live | Richieste attive: cosa è in volo ORA |
| `repo-snapshot/OPEN.md` | live | Domande aperte — leggi prima di proporre |
| `repo-snapshot/REJECTED.md` | live | Direzioni scartate — non riproporle |
| `repo-snapshot/VERTICAL_SLICE_ROADMAP.md` | **STALE** (auto-dichiarato) | Solo storia del piano slice — NON citare come stato |
| `repo-snapshot/CLAUDE_PROMPTS.md` | tool | Prompt stub del Director per sessioni per-argomento |
| `director-knowledge/*` | curated | Gusti e direzione di Fausto (fuori repo, sempre caricare) |

## Esclusi di proposito

`CLASSIFICATION.md` (1MB tassonomia meccanica), `context/ingestions/*` (transcript
L4 di conversazioni passate — chiedili a Fausto se servono), `DECISION_LOG` (storia),
`plans/*`, `context/recurring-traps.md` (interno agli agenti locali), codice e asset.
