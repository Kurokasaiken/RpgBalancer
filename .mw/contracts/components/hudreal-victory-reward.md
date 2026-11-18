---
id: hudreal-victory-reward
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/hudReal/HudRealVictoryReward.tsx
scope_files:
  - src/ui/idleVillage/hudReal/HudRealVictoryReward.tsx
fast_checks:
  - tests/unit/idleVillage/hudRealVictoryReward.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: hudreal-victory-reward.INV-1
    source: plan
    source_ref: R-348
    statement: >-
      Il report di fine run usa il frame battezzato `/assets/ui/hud-real/victory/frame.webp`
      (pergamena B rigenerata, ruling «approvato, battezza» 2026-11-16): ogni zona DOM si
      siede su un affordance dipinto — placca→titolo, nastro→esito, anello→medaglione C1
      con ritratto reale, colonne→crew/rewards, divisore→echoes, placca inferiore→CTA,
      tappo ottone→close.
    test_refs:
      - tests/unit/idleVillage/hudRealVictoryReward.test.tsx
  - id: hudreal-victory-reward.INV-2
    source: plan
    source_ref: R-260
    statement: >-
      Il report mostra il piano pendente: il primo frame dipinto marca `settling` (via
      markRewardShown) e OGNI via di chiusura — CTA, Escape, X — convoglia su `onClose`,
      il boundary di commit; il componente non applica mai effetti di per sé.
    test_refs:
      - tests/unit/idleVillage/hudRealVictoryReward.test.tsx
  - id: hudreal-victory-reward.INV-3
    source: plan
    source_ref: R-348
    statement: >-
      Who came back: una riga per membro con medaglione C1, nome, stato scritto
      (returned/wounded/fallen — mai solo colore) e XP per-membro dal settlement plan;
      il caduto legge scurito/desaturato con nome sbarrato; tooltip per-persona con
      cause/titoli/malattie come il nicchio stock (R-234-returned-crew).
    test_refs:
      - tests/unit/idleVillage/hudRealVictoryReward.test.tsx
  - id: hudreal-victory-reward.INV-4
    source: plan
    source_ref: R-348
    statement: >-
      Il reveal staged è preservato: nastro esito → crew → rewards → echoes → CTA;
      auto-advance su stageMs, click/qualunque tasto affretta, Escape chiude.
      Il frame è cappato a 121vh di larghezza → mai oltre il viewport (R-239).
    test_refs:
      - tests/unit/idleVillage/hudRealVictoryReward.test.tsx
  - id: hudreal-victory-reward.INV-5
    source: plan
    source_ref: R-348
    statement: >-
      Contenuto reale, mai placeholder: rewards = sezioni epilogo
      consumed/reward/loot/xp (costo prima del yield, contratto S4), echoes =
      lore/info/titles/diseases party-level, tutto via i18n.
    test_refs:
      - tests/unit/idleVillage/hudRealVictoryReward.test.tsx
---
# hudreal-victory-reward

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/hudReal/HudRealVictoryReward.tsx`.

Superficie firmata R-348 (fork card `.mw/runs/20261116-r348-victory-ruling/visual-fork-victory-reward.md`): sostituisce `QuestRewardPopup` su `/game` (game-mappa2); il componente stock resta montato sulla route legacy `/game-frame-pixi`. Comportamento identico al contratto `quest-reward-popup` (staged reveal, commit boundary, focus contract); presentazione = frame battezzato + zone DOM (pattern `HudRealExpeditionLost`).
