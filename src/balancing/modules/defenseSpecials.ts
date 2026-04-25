/**
 * Defense Specials Module - Defensive Special Abilities
 * 
 * Calculates damage prevention, crowd control resistance, damage reflection,
 * and other defensive special abilities.
 * 
 * @module DefenseSpecialsModule
 * @since 2026-01-11
 * @author Cascade
 */

/**
 * Defense special configuration
 */
export interface DefenseSpecialConfig {
  /** Anti-critical chance reduction (0-100) */
  antiCritChance: number;
  /** Anti-critical damage reduction (0-100) */
  antiCritDamageReduction: number;
  /** Crowd control resistance (0-100) */
  ccResistance: number;
  /** Damage reflection percentage (0-100) */
  damageReflection: number;
  /** Damage absorption percentage (0-100) */
  damageAbsorption: number;
}

/**
 * Defense analysis results
 */
export interface DefenseResults {
  /** Damage prevented by defensive specials */
  damagePrevented: number;
  /** TTD modifiers from defensive abilities */
  ttdModifiers: {
    /** TTD multiplier from damage prevention */
    preventionMultiplier: number;
    /** TTD multiplier from damage reflection */
    reflectionMultiplier: number;
    /** Overall TTD modifier */
    overallMultiplier: number;
  };
  /** Effective CC resistance */
  effectiveCCResistance: number;
  /** Net damage after reflection */
  netDamageAfterReflection: number;
}

/**
 * Default defense special configurations
 */
export const DEFAULT_DEFENSE_CONFIGS: Record<string, DefenseSpecialConfig> = {
  basic: {
    antiCritChance: 10,
    antiCritDamageReduction: 25,
    ccResistance: 15,
    damageReflection: 0,
    damageAbsorption: 5,
  },
  advanced: {
    antiCritChance: 20,
    antiCritDamageReduction: 50,
    ccResistance: 30,
    damageReflection: 10,
    damageAbsorption: 15,
  },
  elite: {
    antiCritChance: 35,
    antiCritDamageReduction: 75,
    ccResistance: 50,
    damageReflection: 20,
    damageAbsorption: 25,
  },
  legendary: {
    antiCritChance: 50,
    antiCritDamageReduction: 90,
    ccResistance: 75,
    damageReflection: 30,
    damageAbsorption: 35,
  },
};

/**
 * Defense Specials Module - Defensive Special Abilities
 * 
 * Provides calculations for damage prevention, crowd control resistance,
 * damage reflection, and other defensive special abilities.
 */
export const DefenseSpecialsModule = {
  /**
   * Calculates damage prevented by anti-critical abilities
   * 
   * Formula: preventedDamage = incomingDamage * critChance * (antiCritChance/100) * (antiCritDamageReduction/100)
   * 
   * @param incomingDamage Incoming damage before mitigation
   * @param critChance Enemy critical hit chance (0-100)
   * @param config Defense special configuration
   * @returns Damage prevented by anti-critical abilities
   */
  calculateDamagePrevented: (
    incomingDamage: number,
    critChance: number,
    config: DefenseSpecialConfig
  ): number => {
    if (incomingDamage <= 0 || critChance <= 0) return 0;

    // Calculate critical hits that would be prevented
    const preventedCrits = critChance * (config.antiCritChance / 100);
    
    // Calculate damage reduction for prevented criticals
    const critDamageReduction = preventedCrits * (config.antiCritDamageReduction / 100);
    
    // Assume critical hits do 2x damage
    const preventedDamage = incomingDamage * critDamageReduction;
    
    return preventedDamage;
  },

  /**
   * Calculates damage absorbed by damage absorption abilities
   * 
   * Formula: absorbedDamage = incomingDamage * (damageAbsorption / 100)
   * 
   * @param incomingDamage Incoming damage before absorption
   * @param config Defense special configuration
   * @returns Damage absorbed
   */
  calculateDamageAbsorbed: (
    incomingDamage: number,
    config: DefenseSpecialConfig
  ): number => {
    if (incomingDamage <= 0) return 0;
    
    return incomingDamage * (config.damageAbsorption / 100);
  },

  /**
   * Calculates total damage prevented by all defensive abilities
   * 
   * @param incomingDamage Incoming damage before mitigation
   * @param critChance Enemy critical hit chance
   * @param config Defense special configuration
   * @returns Total damage prevented
   */
  calculateTotalDamagePrevented: (
    incomingDamage: number,
    critChance: number,
    config: DefenseSpecialConfig
  ): number => {
    const antiCritPrevented = DefenseSpecialsModule.calculateDamagePrevented(
      incomingDamage, critChance, config
    );
    
    const absorbedDamage = DefenseSpecialsModule.calculateDamageAbsorbed(
      incomingDamage, config
    );
    
    return antiCritPrevented + absorbedDamage;
  },

  /**
   * Calculates TTD modifiers from defensive abilities
   * 
   * @param incomingDamage Incoming damage before mitigation
   * @param critChance Enemy critical hit chance
   * @param config Defense special configuration
   * @returns TTD modifiers
   */
  calculateTTDModifiers: (
    incomingDamage: number,
    critChance: number,
    config: DefenseSpecialConfig
  ): DefenseResults['ttdModifiers'] => {
    const totalPrevented = DefenseSpecialsModule.calculateTotalDamagePrevented(
      incomingDamage, critChance, config
    );
    
    const netDamage = Math.max(0, incomingDamage - totalPrevented);
    
    // Prevention multiplier: how much longer you survive
    const preventionMultiplier = incomingDamage / Math.max(1, netDamage);
    
    // Reflection multiplier: damage returned to attacker
    const reflectedDamage = netDamage * (config.damageReflection / 100);
    const reflectionMultiplier = 1 + (reflectedDamage / Math.max(1, incomingDamage));
    
    // Overall multiplier combines both effects
    const overallMultiplier = preventionMultiplier * reflectionMultiplier;
    
    return {
      preventionMultiplier,
      reflectionMultiplier,
      overallMultiplier,
    };
  },

  /**
   * Calculates effective crowd control resistance
   * 
   * Formula: effectiveResistance = baseResistance * (1 + ccResistance/100)
   * 
   * @param baseCCResistance Base crowd control resistance
   * @param config Defense special configuration
   * @returns Effective CC resistance
   */
  calculateEffectiveCCResistance: (
    baseCCResistance: number,
    config: DefenseSpecialConfig
  ): number => {
    const resistanceBonus = config.ccResistance / 100;
    return Math.min(100, baseCCResistance * (1 + resistanceBonus));
  },

  /**
   * Calculates net damage after damage reflection
   * 
   * Formula: netDamage = incomingDamage - (incomingDamage * damageReflection / 100)
   * 
   * @param incomingDamage Incoming damage
   * @param config Defense special configuration
   * @returns Net damage after reflection
   */
  calculateNetDamageAfterReflection: (
    incomingDamage: number,
    config: DefenseSpecialConfig
  ): number => {
    const reflectedDamage = incomingDamage * (config.damageReflection / 100);
    return Math.max(0, incomingDamage - reflectedDamage);
  },

  /**
   * Complete defense analysis
   * 
   * @param incomingDamage Incoming damage before mitigation
   * @param critChance Enemy critical hit chance
   * @param baseCCResistance Base crowd control resistance
   * @param config Defense special configuration
   * @returns Complete defense analysis results
   */
  analyzeDefense: (
    incomingDamage: number,
    critChance: number,
    baseCCResistance: number,
    config: DefenseSpecialConfig
  ): DefenseResults => {
    const damagePrevented = DefenseSpecialsModule.calculateTotalDamagePrevented(
      incomingDamage, critChance, config
    );
    
    const ttdModifiers = DefenseSpecialsModule.calculateTTDModifiers(
      incomingDamage, critChance, config
    );
    
    const effectiveCCResistance = DefenseSpecialsModule.calculateEffectiveCCResistance(
      baseCCResistance, config
    );
    
    const netDamageAfterReflection = DefenseSpecialsModule.calculateNetDamageAfterReflection(
      incomingDamage, config
    );

    return {
      damagePrevented,
      ttdModifiers,
      effectiveCCResistance,
      netDamageAfterReflection,
    };
  },

  /**
   * Gets predefined defense configuration
   * 
   * @param configType Type of defense configuration
   * @returns Defense configuration
   */
  getDefenseConfig: (configType: keyof typeof DEFAULT_DEFENSE_CONFIGS): DefenseSpecialConfig => {
    return DEFAULT_DEFENSE_CONFIGS[configType];
  },

  /**
   * Calculates defense effectiveness rating
   * 
   * @param damagePrevented Damage prevented
   * @param incomingDamage Total incoming damage
   * @returns Defense effectiveness rating (0-100)
   */
  getDefenseEffectiveness: (
    damagePrevented: number,
    incomingDamage: number
  ): number => {
    if (incomingDamage <= 0) return 0;
    
    const effectiveness = (damagePrevented / incomingDamage) * 100;
    return Math.min(100, Math.max(0, effectiveness));
  },

  /**
   * Determines defense tier based on effectiveness
   * 
   * @param effectiveness Defense effectiveness (0-100)
   * @returns Defense tier classification
   */
  getDefenseTier: (effectiveness: number): 'basic' | 'advanced' | 'elite' | 'legendary' => {
    if (effectiveness >= 60) return 'legendary';
    if (effectiveness >= 40) return 'elite';
    if (effectiveness >= 20) return 'advanced';
    return 'basic';
  },
};
