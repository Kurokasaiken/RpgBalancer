# Arcimago Mana System Plan (v0.1)

Last updated: 2026-01-23

## Goals
- Config-first (`src/balancing/config/archmage/manaSystemConfig.ts`).
- Dual pool legible: Temporary → Permanent (St) + Broken feedback.
- Probabilistic ma biasable (preview odds, savings bonus).
- Telemetry-ready (`mana_draw`, `mana_spend`, `stabilization_attempt`, `broken_mana_recycled`).
- UI coerente con Gilded Observatory (tre slot verticali, stato visibile).

## Resource Model
| Pool | Note |
| --- | --- |
| Temporary Mana | Pesca per turno. Sparisce se non stabilizzato.
| Permanent Mana (St) | Pool stabile, non decay. Cap per turno configurabile.
| Broken Mana | Mana fallito; torna nel deck con priorità ridotta.
| Stabilization Slots | Tre slot globali con probabilità e progress tracker.

## Turn Pipeline
1. `calculateManaDraw` – Usa mana deck pesato + bias (turno, archetype, modifiers) → Temporary mana tokens.
2. `allocateManaSpend` – Consuma prima St (configurabile), poi Temporary. Telemetria breakdown.
3. `runStabilizationCheck` – Fino a tre tentative: base slot chance + savings bonus + modifiers. Risultati:
   - Successo → `permanentMana += value`, slot registra decay.
   - Fallimento → token marcato `broken`, entra in `brokenQueue`.
4. `resolveBrokenMana` – Decide quanto broken rientra nel deck e con quale priorità.

## Config Keys (draft)
```ts
interface ArcimagoManaSystemConfig {
  turnCaps: { maxPermanentGainPerTurn: number };
  stabilization: {
    slots: Array<{
      id: 'slotA' | 'slotB' | 'slotC';
      baseChance: number;
      successDecayPenalty: number;
      minChance: number;
      maxChance: number;
    }>;
    savingsBonusPerPoint: number;
    savingsBonusCap: number;
  };
  manaDeck: {
    families: Record<STSManaType, { weight: number; tags?: string[] }>;
    brokenPenaltyWeight: number;
  };
}
```

## Integration checkpoints
- **Engine**: nuovo modulo `ArcimagoManaSystem.ts` con funzioni pure.
- **State**: `playerState` esteso con `{ permanentMana: number; temporaryMana: ManaToken[]; brokenQueue: ManaToken[]; }`.
- **Hooks/UI**: `useSTSNumericSimulatorEngine` legge i nuovi campi, UI mostra slot stabilizzazione + log eventi.
- **Telemetry**: estendere `STSTelemetryConfig` con canali Arcimago.
- **Tests**: Vitest per draw, spend, stabilize, broken recycle (config-driven).
```
