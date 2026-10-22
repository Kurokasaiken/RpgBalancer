---
title: "PLAN-043-S12 — Riesame completo e chiusura"
parent: PLAN-043
status: active
created: 2026-10-17 (scorporato dal master PLAN-043; lavoro del 2026-10-16)
source_request: R-207
documentation_impact: REQUIRED
---

# PLAN-043-S12 — Riesame completo e chiusura

Master: [PLAN-043](PLAN-043-game-quest-surface-pass.md) · stato operativo in [INDEX](INDEX.md).

## Richiesta

Chiusura di PLAN-043 (riesame della pagina richiesto dal Director nella pianificazione, 2026-10-16).

## Task

- **T7.1** Audit di F0 ripetuto (statico + runtime) e catture complete a 1280/1920/2560 con tutti i pannelli e la quest goblin dal vero fino alla ricompensa; confronto prima/dopo.
- **T7.2** Ogni componente di `/game` coperto dai guardiani, o con motivazione scritta.
- **T7.3** Documenti: `hud_component_guide.md`, `interaction_core_spec.md` (slot), `quest_ui_component_guide.md`, `COMPONENT_MASTER_INDEX.md`, `CURRENT_STATE.md`; PLAN-058 chiuso.
- **T7.3b** Propagare la bocciatura di Lacquer Atlas: titolo e §4.1 di `hud_component_guide.md`, bibbia §11.3 («bronzo consumato su lacca teal»), kit dei prompt (`prompt_kit.yaml`, «deep teal lacquer»: verificare che le icone approvate stiano sulla lacca petrolio scura della skin `base`, `#0f2a35`→`#060f16`; le icone già approvate non si rigenerano senza un sì del Director).
- **T7.4** Prova in Tauri: step **manuale del Director** (regola 16), con elenco di cosa guardare.
- **T7.5** (da S0): misure a runtime di contrasto e area cliccabile; cattura della ricompensa a fine run.

## Verifica finale

## 7. Verifica finale (misurabile, headless)

- E2E verdi: `gameQuestFullFlow`, `gameQuestExpedition`, `gameQuestLifecycle`, `gameQuestPlannerLayout`, `gameQuestReveal`, `gameVillageView`.
- Unit verdi: `questRunWindow`, `questExpeditionBag`, `ResidentSlotRack.*`, `residentXpAndSwap`, `questOutcomeToast`, `questRewardPopup`, `questCheckOptions`, `villageBuildings`, `hudGuards`.
- Test di scambio e calamita con drag «umano»: 20/20 su entrambe le quest.
- Audit F0 ripetuto: zero violazioni non motivate su tutti i componenti di `/game`.
- Catture a 1280/1920/2560 di tutti i pannelli e della quest goblin fino alla ricompensa, zero elementi fuori dalla placca.
- Evidence in `test-results/plan-043/` e bundle di chiusura.

## Contratto di chiusura

- Tutte le voci della verifica finale verdi.
- Voce `fatta` in RICHIESTE R-207 con il bundle citato.
- Bundle di chiusura non ancora prodotto (`.mw/runs/plan043-{sid}/verification.json` → `verify:bundle`).
