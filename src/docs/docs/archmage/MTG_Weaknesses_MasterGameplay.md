# MTG Gameplay Weaknesses – Master Findings (Jan 2026)

> Scope: consolidates all MTG research files but keeps only gameplay-relevant weaknesses so we can design Archmage combat systems that inherit depth without duplicating MTG's pain points.

## Context & Goal

- **Progetto:** modulo di combattimento per un videogame strategico (Archmage/Punch Club) che usa il linguaggio dei card game per generare agency, spike moment e tensione turn-by-turn.  
- **Obiettivo:** sublimare il genere deckbuilder/CCG, conservando la profondità decisionale di MTG ma liberandosi dei suoi vincoli fisici (mana screw/flood, apertura deterministica, overload senza UI).  
- **Approccio:** integrare i punti di forza MTG nell’ecosistema digitale (telemetria, UI scaffolding, fallback automatizzati) così che ogni elemento “carta” sia un comportamento emergente, non una limitazione del supporto fisico.  
  ↳ Riferimento strategico: `src/docs/docs/strategy/Archmage: trascend the trascendence.md`

## Executive Summary

### Pain Points to Avoid (MTG Lessons)

1. **Resource variance that bricks turns** – land draws alone can still create non-games even with mulligans/MDFCs; variance must live in spell behavior, not access.@docs/archmage/MTG_Weaknesses_Research.md#5-14 @docs/archmage/MTG_Weaknesses_DeepSeek.md#5-35
2. **Randomness without player levers** – opening hands or bomb rares can decide matches before counter-play exists; every stochastic element needs preview/bias/reroll tools.@docs/archmage/MTG_Weaknesses_Research.md#15-22 @docs/archmage/MTG_Weaknesses_DeepSeek.md#8-26
3. **Complexity creep** – layered rules/keywords overwhelm players and create computationally unbounded board states; mechanics must be staged with UI scaffolding.@docs/archmage/MTG_Weaknesses_Claude.md#51-90
4. **Tempo extremes** – Modern-style Turn‑4 kills or mana-screw passes collapse pacing in both directions; we need min/max pacing bands and fallback actions.@docs/archmage/MTG_Weaknesses_Claude.md#127-155
5. **Untested resource experiments** – community variants show appetite for dual resources but also cognitive overload when “everything becomes mana”; Archmage must prototype alternatives carefully before locking new randomness.@docs/archmage/MTG_Weaknesses_Research.md#30-36 @docs/archmage/MTG_Weaknesses_Claude.md#115-188

### Strengths Worth Preserving

- **Deckbuilding expression & identity** – resource systems should still let archetypes feel distinct and reward long-term planning (e.g., Runeterra spell banking without bricking control).@docs/archmage/MTG_Weaknesses_Grok.md#35-39
- **Tactical sequencing / spike moments** – MTG’s variance is fun when it produces memorable spikes; Archmage should keep surprise power plays but mantenere agency esplicita tramite risorse baseline + surge modellate dal sistema (ancora in esplorazione).@docs/archmage/MTG_Weaknesses_Claude.md#91-188
- **Interaction focus** – MTG shines when both players act every turn; our guardrails insist on baseline agency so the player always “does something cool” rather than watching mana issues unfold.@docs/archmage/MTG_Weaknesses_Grok.md#31-34
- **Depth with readability** – retain strategic depth but pair it with UI heatmaps/planners so complex decisions remain approachable (Gilded Observatory toolkit).@docs/archmage/MTG_Weaknesses_Claude.md#51-90

## 1. Resource Variance Fail States

- Land draws create "mana screw" (no plays) and "mana flood" (only lands), producing 5–20% non-games even with optimal deckbuilding; fixes like mulligans or MDFCs only soften, never remove, the issue.@docs/archmage/MTG_Weaknesses_Research.md#5-14 @docs/archmage/MTG_Weaknesses_DeepSeek.md#5-35 @docs/archmage/MTG_Weaknesses_Claude.md#5-49 @docs/archmage/MTG_Weaknesses_Grok.md#4-33
- Community experiments (dual decks, mana banking, adaptive shuffles) aim to separate resource access from card draw, but risk erasing deckbuilding expression if not carefully staged.@docs/archmage/MTG_Weaknesses_Research.md#12-14 @docs/archmage/MTG_Weaknesses_Claude.md#30-48
- **Archmage guardrail:** guarantee a baseline action economy each turn and shift variance into spell-behavior modulation instead of access to basic verbs.

## 2. Randomness Without Agency

- Rosewater's own criteria for "good variance"—upside focused, answerable, player-influenceable—are routinely violated when opening hands or early draws decide the match before counter-play exists.@docs/archmage/MTG_Weaknesses_Research.md#15-22 @docs/archmage/MTG_Weaknesses_Grok.md#23-33
- High-variance "bomb" rares and snowball combo kills create win states disconnected from tactical mastery, especially in Limited and older formats.@docs/archmage/MTG_Weaknesses_DeepSeek.md#8-26
- **Archmage guardrail:** every stochastic element (spell emergence, mana flux, mood decks) must expose levers to predict, bias, or re-roll outcomes.

## 3. Complexity Creep & Cognitive Load

- MTG's layered rules, ever-growing keywords, and wordy cards overwhelm new players, with academic work labeling the game computationally unbounded.@docs/archmage/MTG_Weaknesses_Research.md#23-35 @docs/archmage/MTG_Weaknesses_DeepSeek.md#18-24 @docs/archmage/MTG_Weaknesses_Claude.md#51-90 @docs/archmage/MTG_Weaknesses_ChatGPT.md#38-78
- Attempts like "New World Order" limit common-level intricacy but Eternal formats still accrete board complexity that slows matches and increases judge overhead.@docs/archmage/MTG_Weaknesses_Claude.md#64-90
- **Archmage guardrail:** stage mechanics via Core (idle) → Story progression, provide UI scaffolding (heatmaps, ritual planners), and cap concurrent keywords in any encounter.

## 4. Tempo, Pacing, and Non-Interaction

- Power creep compressed average match length (e.g., Modern Turn-4 kills), reducing counter-play windows and rewarding linear decks that ignore the opponent.@docs/archmage/MTG_Weaknesses_Claude.md#127-155
- When early turns brick due to mana issues, pacing collapses the other way—players watch instead of act—leading to perceived "non-games" on both extremes.@docs/archmage/MTG_Weaknesses_Grok.md#31-34 @docs/archmage/MTG_Weaknesses_Research.md#9-14
- **Archmage guardrail:** enforce minimum/maximum pacing bands (e.g., scripted threats can't close before Turn 3, fallback actions auto-trigger if a player would otherwise pass).

## 5. Comparative Resource Systems (Lessons Learned)

- Hearthstone's automatic ramp fixes screw/flood but sacrifices deckbuilding tension and surprise spikes.@docs/archmage/MTG_Weaknesses_Grok.md#35-39 @docs/archmage/MTG_Weaknesses_DeepSeek.md#37-41
- Legends of Runeterra shows hybrid potential: deterministic growth + spell-mana banking keeps interaction high without bricking control players.@docs/archmage/MTG_Weaknesses_Grok.md#35-39 @docs/archmage/MTG_Weaknesses_Claude.md#91-188
- Community variants (Danger Room, click economies, face-down mana) demonstrate appetite for dual-resource or action-point systems but highlight cognitive trade-offs if everything becomes mana.@docs/archmage/MTG_Weaknesses_Research.md#30-36 @docs/archmage/MTG_Weaknesses_Claude.md#115-188
- **Archmage guardrail:** adottare (o simulare) risorse dual-track – una stabile identitaria + una volatile tattica – così che l’identità del mazzo resti significativa mentre l’RNG tattico vive in canali controllabili.

## 6. Practical Checkpoints for Archmage Combat

1. **Baseline agency:** no turn should result in "no legal play"; fallback rituals or focus conversions must exist.@docs/archmage/MTG_Weaknesses_Research.md#5-14
2. **Variance with feedback:** whenever a random effect fires, surface previews, rerolls, or bias tokens so the player feels responsible for outcomes.@docs/archmage/MTG_Weaknesses_Research.md#15-22 @docs/archmage/MTG_Weaknesses_Grok.md#23-33
3. **Cognitive scaffolding:** cap simultaneous mechanics per archetype and keep UI aids mandatory to prevent MTG-style opacity.@docs/archmage/MTG_Weaknesses_Claude.md#51-90
4. **Tempo bands:** instrument telemetry for "no-action turns" and "sub-4-turn finishes" the way MTG Arena now tracks hand smoothing, preventing runaway pacing.@docs/archmage/MTG_Weaknesses_Claude.md#127-207
5. **Comparative prototyping:** prototype resource alternatives already validated in other CCGs before inventing new randomness for its own sake.@docs/archmage/MTG_Weaknesses_Claude.md#91-188 @docs/archmage/MTG_Weaknesses_Grok.md#35-39

## 7. Linked Initiatives

- **KS-080 STS Numeric Simulator Spec:** `docs/archmage/STS_NumericSimulator_Spec.md` traduce queste weakness in requisiti operativi per il simulatore numerico STS-like, garantendo che telemetria mana/agency/pacing sia config-first e misurabile fin dal prototipo.

These checkpoints become the gameplay lens for integrating MTG learnings into Punch Club telemetry, the Slay-the-Spire-style combat mock, and the broader Archmage duel system.
