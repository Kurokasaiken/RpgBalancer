/**
 * Injury System
 * 
 * Core injury tracking system with injury management, recovery simulation,
 * treatment application, and medical item integration for RPG Balancer.
 * 
 * @author RPG Balancer Team
 * @since 2026-01-24
 */

import { 
  InjurySystemConfig, 
  InjuryType, 
  Treatment, 
  MedicalItem, 
  InjurySeverity, 
  BodyPart,
  getInjuryType,
  getTreatment,
  getMedicalItem,
  getTreatmentsForInjury,
  DEFAULT_INJURY_SYSTEM_CONFIG
} from './config/injurySystemConfig';

/**
 * Active injury instance
 */
export interface ActiveInjury {
  id: string;
  injuryType: InjuryType;
  sustainedAt: number; // timestamp
  currentSeverity: InjurySeverity;
  recoveryProgress: number; // 0-100%
  estimatedRecoveryTime: number; // in hours
  treatments: string[]; // treatment IDs applied
  complications: string[];
  painLevel: number; // 0-100%
  isHealed: boolean;
  isWorsening: boolean;
}

/**
 * Treatment application result
 */
export interface TreatmentResult {
  success: boolean;
  treatmentId: string;
  injuryId: string;
  effects: {
    healingProgress: number; // % increase
    painReduction: number; // % reduction
    durationReduction: number; // hours reduced
    sideEffects: string[];
  };
  timestamp: number;
}

/**
 * Injury system state
 */
export interface InjurySystemState {
  activeInjuries: ActiveInjury[];
  medicalInventory: Record<string, number>; // item ID -> quantity
  treatmentHistory: TreatmentResult[];
  totalInjuriesSustained: number;
  totalTreatmentsApplied: number;
  lastUpdateTime: number;
}

/**
 * Injury system class
 */
export class InjurySystem {
  private config: InjurySystemConfig;
  private state: InjurySystemState;
  private telemetryEnabled: boolean;

  constructor(config: InjurySystemConfig = DEFAULT_INJURY_SYSTEM_CONFIG) {
    this.config = config;
    this.telemetryEnabled = config.telemetry.enabled;
    this.state = this.initializeState();
  }

  /**
   * Initialize system state
   */
  private initializeState(): InjurySystemState {
    return {
      activeInjuries: [],
      medicalInventory: {},
      treatmentHistory: [],
      totalInjuriesSustained: 0,
      totalTreatmentsApplied: 0,
      lastUpdateTime: Date.now(),
    };
  }

  /**
   * Sustain an injury
   */
  public sustainInjury(injuryId: string, source?: string): ActiveInjury | null {
    const injuryType = getInjuryType(this.config, injuryId);
    if (!injuryType) {
      console.error(`Injury type ${injuryId} not found`);
      return null;
    }

    // Check max concurrent injuries
    if (this.state.activeInjuries.length >= this.config.settings.maxConcurrentInjuries) {
      console.warn('Maximum concurrent injuries reached');
      return null;
    }

    const activeInjury: ActiveInjury = {
      id: this.generateInjuryId(),
      injuryType,
      sustainedAt: Date.now(),
      currentSeverity: injuryType.severity,
      recoveryProgress: 0,
      estimatedRecoveryTime: this.calculateRecoveryTime(injuryType),
      treatments: [],
      complications: [],
      painLevel: this.calculateInitialPain(injuryType),
      isHealed: false,
      isWorsening: false,
    };

    this.state.activeInjuries.push(activeInjury);
    this.state.totalInjuriesSustained++;
    this.state.lastUpdateTime = Date.now();

    this.emitTelemetry('injury_sustained', {
      injuryId: activeInjury.id,
      injuryType: injuryId,
      severity: injuryType.severity,
      bodyPart: injuryType.bodyPart,
      source,
    });

    return activeInjury;
  }

  /**
   * Apply treatment to an injury
   */
  public applyTreatment(treatmentId: string, injuryId: string): TreatmentResult | null {
    const treatment = getTreatment(this.config, treatmentId);
    const injury = this.state.activeInjuries.find(i => i.id === injuryId);

    if (!treatment) {
      console.error(`Treatment ${treatmentId} not found`);
      return null;
    }

    if (!injury) {
      console.error(`Injury ${injuryId} not found`);
      return null;
    }

    if (injury.isHealed) {
      console.warn('Cannot treat healed injury');
      return null;
    }

    // Check if treatment is applicable
    if (!treatment.targetInjuries.includes(injury.injuryType.id)) {
      console.warn(`Treatment ${treatmentId} not applicable to injury ${injuryId}`);
      return null;
    }

    // Check requirements
    if (!this.checkTreatmentRequirements(treatment)) {
      console.warn(`Treatment ${treatmentId} requirements not met`);
      return null;
    }

    // Calculate success with variation
    const successRoll = Math.random() * 100;
    const successThreshold = treatment.application.successRate + 
      (Math.random() - 0.5) * this.config.settings.treatmentSuccessVariation;
    const success = successRoll <= successThreshold;

    if (!success) {
      this.emitTelemetry('treatment_failed', {
        treatmentId,
        injuryId,
        successRoll,
        successThreshold,
      });
      return null;
    }

    // Apply treatment effects
    const result = this.applyTreatmentEffects(treatment, injury);
    
    // Update state
    injury.treatments.push(treatmentId);
    this.state.treatmentHistory.push(result);
    this.state.totalTreatmentsApplied++;
    this.state.lastUpdateTime = Date.now();

    // Consume items if applicable
    this.consumeTreatmentItems(treatment);

    this.emitTelemetry('treatment_applied', {
      treatmentId,
      injuryId,
      success: true,
      effects: result.effects,
    });

    return result;
  }

  /**
   * Apply treatment effects to injury
   */
  private applyTreatmentEffects(treatment: Treatment, injury: ActiveInjury): TreatmentResult {
    const effects = {
      healingProgress: treatment.effects.healingBonus,
      painReduction: treatment.effects.painReduction,
      durationReduction: (injury.estimatedRecoveryTime * treatment.effects.healingBonus) / 100,
      sideEffects: treatment.application.sideEffects || [],
    };

    // Update injury state
    injury.recoveryProgress = Math.min(100, injury.recoveryProgress + effects.healingProgress);
    injury.painLevel = Math.max(0, injury.painLevel - effects.painReduction);
    injury.estimatedRecoveryTime = Math.max(1, injury.estimatedRecoveryTime - effects.durationReduction);

    // Check if healed
    if (injury.recoveryProgress >= 100) {
      injury.isHealed = true;
      injury.painLevel = 0;
      this.emitTelemetry('injury_healed', {
        injuryId: injury.id,
        injuryType: injury.injuryType.id,
        totalTreatments: injury.treatments.length,
        recoveryTime: Date.now() - injury.sustainedAt,
      });
    }

    return {
      success: true,
      treatmentId: treatment.id,
      injuryId: injury.id,
      effects,
      timestamp: Date.now(),
    };
  }

  /**
   * Check treatment requirements
   */
  private checkTreatmentRequirements(treatment: Treatment): boolean {
    // Check items
    if (treatment.requirements.items) {
      for (const item of treatment.requirements.items) {
        const available = this.state.medicalInventory[item.id] || 0;
        if (available < item.quantity) {
          return false;
        }
      }
    }

    // Check cooldown
    if (treatment.requirements.cooldown) {
      const lastApplication = this.state.treatmentHistory
        .filter(t => t.treatmentId === treatment.id)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      if (lastApplication) {
        const cooldownEnd = lastApplication.timestamp + (treatment.requirements.cooldown * 60 * 60 * 1000);
        if (Date.now() < cooldownEnd) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Consume treatment items
   */
  private consumeTreatmentItems(treatment: Treatment): void {
    if (treatment.requirements.items) {
      for (const item of treatment.requirements.items) {
        const current = this.state.medicalInventory[item.id] || 0;
        this.state.medicalInventory[item.id] = Math.max(0, current - item.quantity);
      }
    }
  }

  /**
   * Add medical item to inventory
   */
  public addMedicalItem(itemId: string, quantity: number): boolean {
    const item = getMedicalItem(this.config, itemId);
    if (!item) {
      console.error(`Medical item ${itemId} not found`);
      return false;
    }

    const current = this.state.medicalInventory[itemId] || 0;
    const newQuantity = current + quantity;

    // Check stack limit
    if (item.usage.stackable && item.usage.maxStack) {
      this.state.medicalInventory[itemId] = Math.min(item.usage.maxStack, newQuantity);
    } else {
      this.state.medicalInventory[itemId] = newQuantity;
    }

    this.state.lastUpdateTime = Date.now();
    return true;
  }

  /**
   * Use medical item
   */
  public useMedicalItem(itemId: string, injuryId?: string): boolean {
    const item = getMedicalItem(this.config, itemId);
    const available = this.state.medicalInventory[itemId] || 0;

    if (!item || available <= 0) {
      return false;
    }

    // If no injury specified, check if there are any active injuries
    if (!injuryId) {
      if (this.state.activeInjuries.length === 0) {
        return false;
      }
      injuryId = this.state.activeInjuries[0].id;
    }

    // Apply item effects
    const injury = this.state.activeInjuries.find(i => i.id === injuryId);
    if (injury && !injury.isHealed) {
      injury.recoveryProgress = Math.min(100, injury.recoveryProgress + item.effects.healingAmount);
      injury.painLevel = Math.max(0, injury.painLevel - item.effects.painRelief);
      
      if (injury.recoveryProgress >= 100) {
        injury.isHealed = true;
        injury.painLevel = 0;
      }
    }

    // Consume item
    this.state.medicalInventory[itemId] = available - 1;
    if (this.state.medicalInventory[itemId] === 0) {
      delete this.state.medicalInventory[itemId];
    }

    this.state.lastUpdateTime = Date.now();
    return true;
  }

  /**
   * Update injury recovery (call this periodically)
   */
  public updateRecovery(deltaTime: number): void {
    const now = Date.now();
    const deltaHours = deltaTime / (60 * 60 * 1000); // Convert ms to hours

    // Skip update for zero or negative time
    if (deltaHours <= 0) {
      return;
    }

    for (const injury of this.state.activeInjuries) {
      if (injury.isHealed) continue;

      // Natural healing
      if (this.config.settings.naturalHealingEnabled) {
        const naturalHealing = injury.injuryType.recovery.naturalHealingRate * deltaHours;
        injury.recoveryProgress = Math.min(100, injury.recoveryProgress + naturalHealing);
      }

      // Check for complications
      if (injury.injuryType.recovery.complications) {
        for (const complication of injury.injuryType.recovery.complications) {
          if (Math.random() < 0.01) { // 1% chance per update
            if (!injury.complications.includes(complication)) {
              injury.complications.push(complication);
              injury.isWorsening = true;
              this.emitTelemetry('injury_complicated', {
                injuryId: injury.id,
                complication,
              });
            }
          }
        }
      }

      // Check for worsening
      if (Math.random() < (this.config.settings.injuryDecayRate / 100)) {
        injury.recoveryProgress = Math.max(0, injury.recoveryProgress - 5);
        injury.painLevel = Math.min(100, injury.painLevel + 10);
        injury.isWorsening = true;
        this.emitTelemetry('injury_worsened', {
          injuryId: injury.id,
          recoveryProgress: injury.recoveryProgress,
        });
      }

      // Update estimated recovery time
      injury.estimatedRecoveryTime = Math.max(1, 
        injury.estimatedRecoveryTime - deltaHours * (injury.recoveryProgress / 100)
      );

      // Check if healed
      if (injury.recoveryProgress >= 100) {
        injury.isHealed = true;
        injury.painLevel = 0;
        this.emitTelemetry('injury_healed', {
          injuryId: injury.id,
          injuryType: injury.injuryType.id,
          totalTreatments: injury.treatments.length,
          recoveryTime: now - injury.sustainedAt,
        });
      }
    }

    // Remove healed injuries
    this.state.activeInjuries = this.state.activeInjuries.filter(injury => !injury.isHealed);
    this.state.lastUpdateTime = now;
  }

  /**
   * Get current injury status
   */
  public getInjuryStatus(): {
    activeInjuries: ActiveInjury[];
    totalPain: number;
    worstInjury: ActiveInjury | null;
    canTreat: boolean;
    criticalInjuries: ActiveInjury[];
  } {
    const activeInjuries = [...this.state.activeInjuries];
    const totalPain = activeInjuries.reduce((sum, injury) => sum + injury.painLevel, 0);
    const worstInjury = activeInjuries.reduce((worst, injury) => 
      injury.painLevel > (worst?.painLevel || 0) ? injury : worst, null
    );
    const criticalInjuries = activeInjuries.filter(injury => 
      injury.injuryType.severity === 'critical' || injury.injuryType.severity === 'fatal'
    );
    const canTreat = activeInjuries.some(injury => 
      !injury.isHealed && getTreatmentsForInjury(this.config, injury.injuryType.id).length > 0
    );

    return {
      activeInjuries,
      totalPain,
      worstInjury,
      canTreat,
      criticalInjuries,
    };
  }

  /**
   * Get available treatments for all active injuries
   */
  public getAvailableTreatments(): Array<{
    treatment: Treatment;
    applicableInjuries: ActiveInjury[];
    canApply: boolean;
  }> {
    const treatments = this.config.treatments.map(treatment => {
      const applicableInjuries = this.state.activeInjuries.filter(injury =>
        !injury.isHealed && treatment.targetInjuries.includes(injury.injuryType.id)
      );

      return {
        treatment,
        applicableInjuries,
        canApply: applicableInjuries.length > 0 && this.checkTreatmentRequirements(treatment),
      };
    });

    return treatments.filter(t => t.applicableInjuries.length > 0);
  }

  /**
   * Get system state
   */
  public getState(): InjurySystemState {
    return { ...this.state };
  }

  /**
   * Reset system
   */
  public reset(): void {
    this.state = this.initializeState();
  }

  /**
   * Calculate recovery time for injury
   */
  private calculateRecoveryTime(injuryType: InjuryType): number {
    const variance = (Math.random() - 0.5) * injuryType.recovery.variance * 2;
    return Math.max(1, injuryType.recovery.baseDuration + variance);
  }

  /**
   * Calculate initial pain level
   */
  private calculateInitialPain(injuryType: InjuryType): number {
    const severityMultipliers = {
      minor: 20,
      moderate: 40,
      severe: 60,
      critical: 80,
      fatal: 95,
    };
    return severityMultipliers[injuryType.severity];
  }

  /**
   * Generate unique injury ID
   */
  private generateInjuryId(): string {
    return `injury_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Emit telemetry event
   */
  private emitTelemetry(event: string, data: any): void {
    if (!this.telemetryEnabled) return;

    // Emit to analytics system
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', event, data);
    }

    // Also emit to custom event system
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('injury_system_telemetry', {
        detail: { event, data, timestamp: Date.now() }
      }));
    }
  }

  /**
   * Get injury statistics
   */
  public getStatistics(): {
    totalInjuries: number;
    activeInjuries: number;
    healedInjuries: number;
    totalTreatments: number;
    averageRecoveryTime: number;
    mostCommonInjury: string;
    treatmentSuccessRate: number;
  } {
    const totalTreatments = this.state.treatmentHistory.length;
    const successfulTreatments = this.state.treatmentHistory.filter(t => t.success).length;
    const treatmentSuccessRate = totalTreatments > 0 ? (successfulTreatments / totalTreatments) * 100 : 0;

    const injuryCounts = this.state.treatmentHistory.reduce((counts, treatment) => {
      const injury = this.state.activeInjuries.find(i => i.id === treatment.injuryId);
      if (injury) {
        counts[injury.injuryType.id] = (counts[injury.injuryType.id] || 0) + 1;
      }
      return counts;
    }, {} as Record<string, number>);

    const mostCommonInjury = Object.entries(injuryCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

    return {
      totalInjuries: this.state.totalInjuriesSustained,
      activeInjuries: this.state.activeInjuries.length,
      healedInjuries: this.state.totalInjuriesSustained - this.state.activeInjuries.length,
      totalTreatments,
      averageRecoveryTime: this.calculateAverageRecoveryTime(),
      mostCommonInjury,
      treatmentSuccessRate,
    };
  }

  /**
   * Calculate average recovery time
   */
  private calculateAverageRecoveryTime(): number {
    const healedInjuries = this.state.treatmentHistory
      .filter(t => t.success)
      .map(t => this.state.activeInjuries.find(i => i.id === t.injuryId))
      .filter(Boolean);

    if (healedInjuries.length === 0) return 0;

    const totalTime = healedInjuries.reduce((sum, injury) => {
      return sum + (Date.now() - injury!.sustainedAt);
    }, 0);

    return totalTime / healedInjuries.length / (60 * 60 * 1000); // Convert to hours
  }
}

/**
 * Default injury system instance
 */
export const injurySystem = new InjurySystem();
