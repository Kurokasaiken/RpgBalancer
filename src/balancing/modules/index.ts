/**
 * Module Index - Balancing System
 * 
 * This file documents all balancing modules and their status.
 * Combat engine MUST import from these modules, not reimplement.
 */

// ============================================================================
// ACTIVE MODULES (Implemented in Combat)
// ============================================================================

export { MitigationModule } from './mitigation';
// Status: ✅ ACTIVE - Used in combat/logic.ts
// Formulas: Armor (PoE formula), Resistance, Penetration
// Combat Usage: Line 84-91 in logic.ts

export { CriticalModule } from './critical';
// Status: ✅ ACTIVE - Used in combat/logic.ts  
// Formulas: Crit damage calculation
// Combat Usage: Line 78 in logic.ts

export { HitChanceModule } from './hitchance';
// Status: ✅ ACTIVE - Used in combat/logic.ts
// Formulas: TxC vs Evasion, asymptotic caps
// Combat Usage: Line 54 in logic.ts

export { CoreModule } from './core';
// Status: ✅ COMPLETE - Used in tests only
// Formulas: HTK (Hits To Kill) calculations
// Combat Usage: Test utilities

// ============================================================================
// PENDING MODULES (Ready but not in Combat)
// ============================================================================

export { SustainModule } from './sustain';
// Status: ⏸️ READY - Awaiting STEP 6 implementation
// Formulas: Lifesteal, Regen, healing caps
// Blocker: Combat engine lacks per-turn healing logic
// TODO: Implement in combat/logic.ts when turn-based engine is ready

// ============================================================================
// NEW MODULES (Week 2 - DoT/Buff Systems)
// ============================================================================

export { DotModule } from './dot';
// Status: ✅ READY - Week 2 implementation
// Formulas: DoT/HoT ticks, stacking, duration management
// Combat Usage: To be integrated in combat/logic.ts

export { BuffModule } from './buffs';
// Status: ✅ READY - Week 2 implementation
// Formulas: Stat modifiers (additive/multiplicative), shields, status effects
// Combat Usage: To be integrated in combat/logic.ts

export { SpellCostModule } from './spellcost';
// Status: ✅ READY - Week 3 implementation  
// Formulas: Spell power (HP-equivalent), mana cost calculation
// Uses: DotModule + BuffModule for accurate power calculation

// ============================================================================
// FUTURE MODULES (Not Yet Created)
// ============================================================================

// export { BuffModule } from './buffs';
// Status: ❌ NOT CREATED
// Formulas: Buff/debuff duration, stacking, cleanse
// Blocker: Requires effect manager system

// export { DotModule } from './dot';
// Status: ❌ NOT CREATED  
// Formulas: Damage/Heal over Time, tick intervals
// Blocker: Requires turn-based engine

// export { CooldownModule } from './cooldowns';
// Status: ❌ NOT CREATED
// Formulas: CDR (cooldown reduction), haste
// Blocker: Requires ability system

/**
 * ARCHITECTURE RULES
 * 
 * 1. ALL formulas belong in modules, not in combat engine
 * 2. Combat engine IMPORTS these modules
 * 3. Tests validate alignment between modules and combat
 * 4. Weights in statWeights.ts assume module formulas are implemented
 * 
 * See: architecture.md for full philosophy
 */
