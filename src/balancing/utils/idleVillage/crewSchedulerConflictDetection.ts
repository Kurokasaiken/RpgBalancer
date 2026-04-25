/**
 * NP-023 – Idle Village Crew Scheduler Conflict Detection Algorithms
 * 
 * Specialized detection algorithms for different types of crew scheduling conflicts.
 * Each algorithm focuses on specific conflict patterns and provides detailed analysis.
 */

import type { QueuedAssignment } from '@/ui/idleVillage/hooks/useCrewScheduler';
import type { ConflictDefinition, ConflictType, ConflictSeverity } from './crewSchedulerConflictResolver';

// ============================================================================
// Detection Algorithm Interfaces
// ============================================================================

export interface DetectionAlgorithm {
  id: string;
  name: string;
  description: string;
  conflictType: ConflictType;
  detect(queue: QueuedAssignment[], context: DetectionContext): ConflictDefinition[];
  getThresholds(): DetectionThresholds;
  setThresholds(thresholds: DetectionThresholds): void;
}

export interface DetectionContext {
  timestamp: number;
  crewLimits: Record<string, number>;
  activityRequirements: Record<string, ActivityRequirement>;
  residentCapabilities: Record<string, ResidentCapability>;
  globalLimits: GlobalLimits;
}

export interface DetectionThresholds {
  enabled: boolean;
  severity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  custom: Record<string, unknown>;
}

export interface ActivityRequirement {
  minSkillLevel: number;
  requiredStats: string[];
  maxConcurrentAssignments: number;
  fatigueImpact: number;
}

export interface ResidentCapability {
  maxAssignments: number;
  skills: Record<string, number>;
  fatigueRecoveryRate: number;
  specializationBonus: Record<string, number>;
}

export interface GlobalLimits {
  maxQueueSize: number;
  maxConcurrentResolutions: number;
  priorityInversionThreshold: number;
}

// ============================================================================
// Crew Limit Detection Algorithm
// ============================================================================

export class CrewLimitDetectionAlgorithm implements DetectionAlgorithm {
  id = 'crew_limit_detection';
  name = 'Crew Limit Detection';
  description = 'Detects when residents exceed their maximum assignment limits';
  conflictType: ConflictType = 'crew_limit_exceeded';
  
  private thresholds: DetectionThresholds = {
    enabled: true,
    severity: { low: 1, medium: 2, high: 3, critical: 5 },
    custom: {}
  };

  detect(queue: QueuedAssignment[], context: DetectionContext): ConflictDefinition[] {
    if (!this.thresholds.enabled) return [];

    const conflicts: ConflictDefinition[] = [];
    const residentAssignments = this.groupAssignmentsByResident(queue);

    residentAssignments.forEach((assignments, residentId) => {
      const limit = context.crewLimits[residentId] || 3;
      const overage = assignments.length - limit;
      
      if (overage > 0) {
        conflicts.push({
          id: `crew_limit_${residentId}_${context.timestamp}`,
          type: this.conflictType,
          severity: this.calculateSeverity(overage),
          description: `Resident ${residentId} has ${assignments.length} assignments (limit: ${limit})`,
          affectedAssignments: assignments.map(a => a.id),
          detectedAt: context.timestamp,
          metadata: {
            residentId,
            assignmentCount: assignments.length,
            limit,
            overage,
            assignments: assignments.map(a => ({
              id: a.id,
              activityId: a.activityId,
              priority: a.priorityScore,
              fatigue: a.factors.fatigue
            }))
          }
        });
      }
    });

    return conflicts;
  }

  getThresholds(): DetectionThresholds {
    return { ...this.thresholds };
  }

  setThresholds(thresholds: DetectionThresholds): void {
    this.thresholds = { ...thresholds };
  }

  private groupAssignmentsByResident(queue: QueuedAssignment[]): Map<string, QueuedAssignment[]> {
    const groups = new Map<string, QueuedAssignment[]>();
    
    queue.forEach(assignment => {
      const assignments = groups.get(assignment.residentId) || [];
      assignments.push(assignment);
      groups.set(assignment.residentId, assignments);
    });

    return groups;
  }

  private calculateSeverity(overage: number): ConflictSeverity {
    if (overage >= this.thresholds.severity.critical) return 'critical';
    if (overage >= this.thresholds.severity.high) return 'high';
    if (overage >= this.thresholds.severity.medium) return 'medium';
    return 'low';
  }
}

// ============================================================================
// Fatigue Overload Detection Algorithm
// ============================================================================

export class FatigueOverloadDetectionAlgorithm implements DetectionAlgorithm {
  id = 'fatigue_overload_detection';
  name = 'Fatigue Overload Detection';
  description = 'Detects assignments with dangerously high fatigue levels';
  conflictType: ConflictType = 'fatigue_overload';
  
  private thresholds: DetectionThresholds = {
    enabled: true,
    severity: { low: 0.5, medium: 0.7, high: 0.85, critical: 0.95 },
    custom: {}
  };

  detect(queue: QueuedAssignment[], context: DetectionContext): ConflictDefinition[] {
    if (!this.thresholds.enabled) return [];

    const conflicts: ConflictDefinition[] = [];

    queue.forEach(assignment => {
      const fatigue = assignment.factors.fatigue;
      
      if (fatigue >= this.thresholds.severity.low) {
        conflicts.push({
          id: `fatigue_${assignment.id}_${context.timestamp}`,
          type: this.conflictType,
          severity: this.calculateFatigueSeverity(fatigue),
          description: `Assignment ${assignment.id} has high fatigue: ${(fatigue * 100).toFixed(1)}%`,
          affectedAssignments: [assignment.id],
          detectedAt: context.timestamp,
          metadata: {
            assignmentId: assignment.id,
            residentId: assignment.residentId,
            activityId: assignment.activityId,
            fatigueLevel: fatigue,
            fatiguePercentage: Math.round(fatigue * 100),
            priorityScore: assignment.priorityScore,
            recoveryTime: this.estimateRecoveryTime(fatigue, context)
          }
        });
      }
    });

    return conflicts;
  }

  getThresholds(): DetectionThresholds {
    return { ...this.thresholds };
  }

  setThresholds(thresholds: DetectionThresholds): void {
    this.thresholds = { ...thresholds };
  }

  private calculateFatigueSeverity(fatigue: number): ConflictSeverity {
    if (fatigue >= this.thresholds.severity.critical) return 'critical';
    if (fatigue >= this.thresholds.severity.high) return 'high';
    if (fatigue >= this.thresholds.severity.medium) return 'medium';
    return 'low';
  }

  private estimateRecoveryTime(fatigue: number, context: DetectionContext): number {
    // Estimate recovery time in minutes based on fatigue level
    const baseRecoveryRate = 0.1; // 10% fatigue recovery per time unit
    const residentRecoveryBonus = context.residentCapabilities['default']?.fatigueRecoveryRate || 1.0;
    const effectiveRecoveryRate = baseRecoveryRate * residentRecoveryBonus;
    
    return Math.ceil(fatigue / effectiveRecoveryRate);
  }
}

// ============================================================================
// Skill Mismatch Detection Algorithm
// ============================================================================

export class SkillMismatchDetectionAlgorithm implements DetectionAlgorithm {
  id = 'skill_mismatch_detection';
  name = 'Skill Mismatch Detection';
  description = 'Detects assignments with poor skill matching';
  conflictType: ConflictType = 'skill_mismatch';
  
  private thresholds: DetectionThresholds = {
    enabled: true,
    severity: { low: 0.6, medium: 0.4, high: 0.2, critical: 0.1 },
    custom: {}
  };

  detect(queue: QueuedAssignment[], context: DetectionContext): ConflictDefinition[] {
    if (!this.thresholds.enabled) return [];

    const conflicts: ConflictDefinition[] = [];

    queue.forEach(assignment => {
      const skillMatch = assignment.factors.statTagMatch;
      
      if (skillMatch < this.thresholds.severity.low) {
        const resident = context.residentCapabilities[assignment.residentId];
        const activity = context.activityRequirements[assignment.activityId];
        
        conflicts.push({
          id: `skill_mismatch_${assignment.id}_${context.timestamp}`,
          type: this.conflictType,
          severity: this.calculateSkillMismatchSeverity(skillMatch),
          description: `Assignment ${assignment.id} has poor skill match: ${(skillMatch * 100).toFixed(1)}%`,
          affectedAssignments: [assignment.id],
          detectedAt: context.timestamp,
          metadata: {
            assignmentId: assignment.id,
            residentId: assignment.residentId,
            activityId: assignment.activityId,
            skillMatch,
            skillMatchPercentage: Math.round(skillMatch * 100),
            residentSkills: resident?.skills || {},
            requiredSkills: activity?.requiredStats || [],
            alternativeResidents: this.findAlternativeResidents(assignment, context)
          }
        });
      }
    });

    return conflicts;
  }

  getThresholds(): DetectionThresholds {
    return { ...this.thresholds };
  }

  setThresholds(thresholds: DetectionThresholds): void {
    this.thresholds = { ...thresholds };
  }

  private calculateSkillMismatchSeverity(match: number): ConflictSeverity {
    if (match <= this.thresholds.severity.critical) return 'critical';
    if (match <= this.thresholds.severity.high) return 'high';
    if (match <= this.thresholds.severity.medium) return 'medium';
    return 'low';
  }

  private findAlternativeResidents(
    assignment: QueuedAssignment,
    context: DetectionContext
  ): string[] {
    const alternatives: string[] = [];
    const activity = context.activityRequirements[assignment.activityId];
    
    if (!activity) return alternatives;

    Object.entries(context.residentCapabilities).forEach(([residentId, capability]) => {
      if (residentId === assignment.residentId) return;
      
      // Check if resident has better skill match
      const hasRequiredSkills = activity.requiredStats.every(
        stat => capability.skills[stat] >= activity.minSkillLevel
      );
      
      if (hasRequiredSkills) {
        alternatives.push(residentId);
      }
    });

    return alternatives.slice(0, 3); // Return top 3 alternatives
  }
}

// ============================================================================
// Queue Overflow Detection Algorithm
// ============================================================================

export class QueueOverflowDetectionAlgorithm implements DetectionAlgorithm {
  id = 'queue_overflow_detection';
  name = 'Queue Overflow Detection';
  description = 'Detects when the assignment queue exceeds safe limits';
  conflictType: ConflictType = 'queue_overflow';
  
  private thresholds: DetectionThresholds = {
    enabled: true,
    severity: { low: 15, medium: 20, high: 25, critical: 30 },
    custom: {}
  };

  detect(queue: QueuedAssignment[], context: DetectionContext): ConflictDefinition[] {
    if (!this.thresholds.enabled) return [];

    const conflicts: ConflictDefinition[] = [];
    const queueSize = queue.length;
    const threshold = context.globalLimits.maxQueueSize || this.thresholds.severity.medium;
    
    if (queueSize > threshold) {
      const overage = queueSize - threshold;
      
      conflicts.push({
        id: `queue_overflow_${context.timestamp}`,
        type: this.conflictType,
        severity: this.calculateSeverity(overage),
        description: `Queue has ${queueSize} assignments (threshold: ${threshold})`,
        affectedAssignments: queue.map(a => a.id),
        detectedAt: context.timestamp,
        metadata: {
          queueSize,
          threshold,
          overage,
          averagePriority: this.calculateAveragePriority(queue),
          oldestAssignment: this.findOldestAssignment(queue),
          newestAssignment: this.findNewestAssignment(queue),
          assignmentsByActivity: this.groupAssignmentsByActivity(queue)
        }
      });
    }

    return conflicts;
  }

  getThresholds(): DetectionThresholds {
    return { ...this.thresholds };
  }

  setThresholds(thresholds: DetectionThresholds): void {
    this.thresholds = { ...thresholds };
  }

  private calculateSeverity(overage: number): ConflictSeverity {
    if (overage >= this.thresholds.severity.critical) return 'critical';
    if (overage >= this.thresholds.severity.high) return 'high';
    if (overage >= this.thresholds.severity.medium) return 'medium';
    return 'low';
  }

  private calculateAveragePriority(queue: QueuedAssignment[]): number {
    if (queue.length === 0) return 0;
    const sum = queue.reduce((acc, a) => acc + a.priorityScore, 0);
    return sum / queue.length;
  }

  private findOldestAssignment(queue: QueuedAssignment[]): QueuedAssignment | null {
    if (queue.length === 0) return null;
    return queue.reduce((oldest, current) => 
      current.timestamp < oldest.timestamp ? current : oldest
    );
  }

  private findNewestAssignment(queue: QueuedAssignment[]): QueuedAssignment | null {
    if (queue.length === 0) return null;
    return queue.reduce((newest, current) => 
      current.timestamp > newest.timestamp ? current : newest
    );
  }

  private groupAssignmentsByActivity(queue: QueuedAssignment[]): Record<string, number> {
    const groups: Record<string, number> = {};
    
    queue.forEach(assignment => {
      groups[assignment.activityId] = (groups[assignment.activityId] || 0) + 1;
    });

    return groups;
  }
}

// ============================================================================
// Priority Inversion Detection Algorithm
// ============================================================================

export class PriorityInversionDetectionAlgorithm implements DetectionAlgorithm {
  id = 'priority_inversion_detection';
  name = 'Priority Inversion Detection';
  description = 'Detects when lower priority assignments block higher priority ones';
  conflictType: ConflictType = 'priority_inversion';
  
  private thresholds: DetectionThresholds = {
    enabled: true,
    severity: { low: 0.1, medium: 0.3, high: 0.5, critical: 0.8 },
    custom: {}
  };

  detect(queue: QueuedAssignment[], context: DetectionContext): ConflictDefinition[] {
    if (!this.thresholds.enabled) return [];

    const conflicts: ConflictDefinition[] = [];
    const sortedByTimestamp = [...queue].sort((a, b) => a.timestamp - b.timestamp);
    const sortedByPriority = [...queue].sort((a, b) => b.priorityScore - a.priorityScore);
    const threshold = context.globalLimits.priorityInversionThreshold || this.thresholds.severity.medium;

    // Check for priority inversions in top N assignments
    const checkCount = Math.min(sortedByTimestamp.length, 10);
    
    for (let i = 0; i < checkCount; i++) {
      const earlyAssignment = sortedByTimestamp[i];
      const highPriorityAssignment = sortedByPriority[i];

      if (earlyAssignment.id !== highPriorityAssignment.id) {
        const priorityDiff = highPriorityAssignment.priorityScore - earlyAssignment.priorityScore;
        
        if (priorityDiff > threshold) {
          conflicts.push({
            id: `priority_inversion_${earlyAssignment.id}_${highPriorityAssignment.id}_${context.timestamp}`,
            type: this.conflictType,
            severity: this.calculateSeverity(priorityDiff),
            description: `Priority inversion: ${earlyAssignment.id} arrived before ${highPriorityAssignment.id} but has lower priority`,
            affectedAssignments: [earlyAssignment.id, highPriorityAssignment.id],
            detectedAt: context.timestamp,
            metadata: {
              earlyAssignment: earlyAssignment.id,
              highPriorityAssignment: highPriorityAssignment.id,
              priorityDiff,
              earlyPriority: earlyAssignment.priorityScore,
              highPriority: highPriorityAssignment.priorityScore,
              timeDifference: highPriorityAssignment.timestamp - earlyAssignment.timestamp,
              queuePosition: i
            }
          });
        }
      }
    }

    return conflicts;
  }

  getThresholds(): DetectionThresholds {
    return { ...this.thresholds };
  }

  setThresholds(thresholds: DetectionThresholds): void {
    this.thresholds = { ...thresholds };
  }

  private calculateSeverity(priorityDiff: number): ConflictSeverity {
    if (priorityDiff >= this.thresholds.severity.critical) return 'critical';
    if (priorityDiff >= this.thresholds.severity.high) return 'high';
    if (priorityDiff >= this.thresholds.severity.medium) return 'medium';
    return 'low';
  }
}

// ============================================================================
// Specialization Conflict Detection Algorithm
// ============================================================================

export class SpecializationConflictDetectionAlgorithm implements DetectionAlgorithm {
  id = 'specialization_conflict_detection';
  name = 'Specialization Conflict Detection';
  description = 'Detects when too many low-specialization assignments are queued for same activity';
  conflictType: ConflictType = 'specialization_conflict';
  
  private thresholds: DetectionThresholds = {
    enabled: true,
    severity: { low: 2, medium: 3, high: 4, critical: 5 },
    custom: {
      lowSpecializationThreshold: 0.3
    }
  };

  detect(queue: QueuedAssignment[], context: DetectionContext): ConflictDefinition[] {
    if (!this.thresholds.enabled) return [];

    const conflicts: ConflictDefinition[] = [];
    const activityAssignments = this.groupAssignmentsByActivity(queue);
    const lowSpecThreshold = this.thresholds.custom.lowSpecializationThreshold as number || 0.3;

    activityAssignments.forEach((assignments, activityId) => {
      const lowSpecAssignments = assignments.filter(a => a.factors.specialization < lowSpecThreshold);
      
      if (lowSpecAssignments.length >= this.thresholds.severity.low) {
        conflicts.push({
          id: `specialization_${activityId}_${context.timestamp}`,
          type: this.conflictType,
          severity: this.calculateSeverity(lowSpecAssignments.length),
          description: `Activity ${activityId} has ${lowSpecAssignments.length} low-specialization assignments`,
          affectedAssignments: lowSpecAssignments.map(a => a.id),
          detectedAt: context.timestamp,
          metadata: {
            activityId,
            lowSpecCount: lowSpecAssignments.length,
            totalAssignments: assignments.length,
            lowSpecPercentage: Math.round((lowSpecAssignments.length / assignments.length) * 100),
            averageSpecialization: this.calculateAverageSpecialization(assignments),
            specializedResidents: this.findSpecializedResidents(activityId, context)
          }
        });
      }
    });

    return conflicts;
  }

  getThresholds(): DetectionThresholds {
    return { ...this.thresholds };
  }

  setThresholds(thresholds: DetectionThresholds): void {
    this.thresholds = { ...thresholds };
  }

  private groupAssignmentsByActivity(queue: QueuedAssignment[]): Map<string, QueuedAssignment[]> {
    const groups = new Map<string, QueuedAssignment[]>();
    
    queue.forEach(assignment => {
      const assignments = groups.get(assignment.activityId) || [];
      assignments.push(assignment);
      groups.set(assignment.activityId, assignments);
    });

    return groups;
  }

  private calculateSeverity(lowSpecCount: number): ConflictSeverity {
    if (lowSpecCount >= this.thresholds.severity.critical) return 'critical';
    if (lowSpecCount >= this.thresholds.severity.high) return 'high';
    if (lowSpecCount >= this.thresholds.severity.medium) return 'medium';
    return 'low';
  }

  private calculateAverageSpecialization(assignments: QueuedAssignment[]): number {
    if (assignments.length === 0) return 0;
    const sum = assignments.reduce((acc, a) => acc + a.factors.specialization, 0);
    return sum / assignments.length;
  }

  private findSpecializedResidents(activityId: string, context: DetectionContext): string[] {
    const specialized: string[] = [];
    
    Object.entries(context.residentCapabilities).forEach(([residentId, capability]) => {
      const specialization = capability.specializationBonus[activityId] || 0;
      if (specialization > 0.5) {
        specialized.push(residentId);
      }
    });

    return specialized;
  }
}

// ============================================================================
// Detection Algorithm Registry
// ============================================================================

export class DetectionAlgorithmRegistry {
  private algorithms = new Map<string, DetectionAlgorithm>();

  constructor() {
    this.registerDefaultAlgorithms();
  }

  register(algorithm: DetectionAlgorithm): void {
    this.algorithms.set(algorithm.id, algorithm);
  }

  unregister(algorithmId: string): void {
    this.algorithms.delete(algorithmId);
  }

  get(algorithmId: string): DetectionAlgorithm | undefined {
    return this.algorithms.get(algorithmId);
  }

  getAll(): DetectionAlgorithm[] {
    return Array.from(this.algorithms.values());
  }

  getEnabled(): DetectionAlgorithm[] {
    return this.getAll().filter(algo => algo.getThresholds().enabled);
  }

  detectConflicts(queue: QueuedAssignment[], context: DetectionContext): ConflictDefinition[] {
    const allConflicts: ConflictDefinition[] = [];
    
    this.getEnabled().forEach(algorithm => {
      try {
        const conflicts = algorithm.detect(queue, context);
        allConflicts.push(...conflicts);
      } catch (error) {
        console.error(`Error in detection algorithm ${algorithm.id}:`, error);
      }
    });

    return allConflicts;
  }

  private registerDefaultAlgorithms(): void {
    this.register(new CrewLimitDetectionAlgorithm());
    this.register(new FatigueOverloadDetectionAlgorithm());
    this.register(new SkillMismatchDetectionAlgorithm());
    this.register(new QueueOverflowDetectionAlgorithm());
    this.register(new PriorityInversionDetectionAlgorithm());
    this.register(new SpecializationConflictDetectionAlgorithm());
  }
}
