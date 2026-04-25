/**
 * Assignment Undo/Redo Engine - NP-020
 * 
 * Timeline undo/redo engine with PersistenceService integration for
 * Idle Village resident assignment management. Provides comprehensive
 * change tracking, diff generation, and state management.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import * as PersistenceService from '@/shared/persistence/PersistenceService';
import {
  type AssignmentUndoConfig,
  type AssignmentChange,
  type AssignmentState,
  type AssignmentDiffSummary,
  type TimelineEntry,
  type AssignmentChangeType,
  generateChangeId,
  generateStateChecksum,
  formatTimestamp,
  calculateChangePriority,
  getChangeTypeColor,
  getChangeTypeIcon,
  DEFAULT_ASSIGNMENT_UNDO_CONFIG,
} from '../config/assignmentUndoConfig';

const diagnostics = createSandboxDiagnostics('AssignmentUndoEngine', 'undo');

/**
 * Undo/Redo Engine Events
 */
export interface UndoEngineEvents {
  /** Fired when a change is added to history */
  'change-added': { change: AssignmentChange };
  /** Fired when undo is performed */
  'undo-performed': { change: AssignmentChange; newState: AssignmentState };
  /** Fired when redo is performed */
  'redo-performed': { change: AssignmentChange; newState: AssignmentState };
  /** Fired when history is cleared */
  'history-cleared': { reason: string };
  /** Fired when timeline position changes */
  'timeline-changed': { position: number; totalEntries: number };
  /** Fired when persistence operation completes */
  'persistence-complete': { operation: 'save' | 'load'; success: boolean };
  /** Fired when error occurs */
  'error': { error: Error; context: string };
}

/**
 * Assignment Undo/Redo Engine
 */
export class AssignmentUndoEngine {
  private config: AssignmentUndoConfig;
  private changes: AssignmentChange[] = [];
  private currentIndex: number = -1;
  private persistenceService: typeof PersistenceService;
  private sessionId: string;
  private eventListeners: Map<keyof UndoEngineEvents, Array<(data: any) => void>> = new Map();
  private changeDetectionInterval?: NodeJS.Timeout;
  private autoSaveInterval?: NodeJS.Timeout;
  private lastKnownState: AssignmentState | null = null;

  constructor(config?: Partial<AssignmentUndoConfig>) {
    this.config = { ...DEFAULT_ASSIGNMENT_UNDO_CONFIG, ...config };
    this.persistenceService = PersistenceService;
    this.sessionId = this.generateSessionId();
    
    this.initializeEventListeners();
    this.loadPersistedState();
    this.startAutoSave();
    this.startChangeDetection();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize event listeners
   */
  private initializeEventListeners(): void {
    // Initialize event listener map
    const events: (keyof UndoEngineEvents)[] = [
      'change-added',
      'undo-performed',
      'redo-performed',
      'history-cleared',
      'timeline-changed',
      'persistence-complete',
      'error',
    ];
    
    events.forEach(event => {
      this.eventListeners.set(event, []);
    });
  }

  /**
   * Add event listener
   */
  public addEventListener<K extends keyof UndoEngineEvents>(
    event: K,
    listener: (data: UndoEngineEvents[K]) => void
  ): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(listener);
    this.eventListeners.set(event, listeners);
  }

  /**
   * Remove event listener
   */
  public removeEventListener<K extends keyof UndoEngineEvents>(
    event: K,
    listener: (data: UndoEngineEvents[K]) => void
  ): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(event, listeners);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit<K extends keyof UndoEngineEvents>(event: K, data: UndoEngineEvents[K]): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        diagnostics.error('Error in event listener', { event, error });
      }
    });
  }

  /**
   * Load persisted state from storage
   */
  private async loadPersistedState(): Promise<void> {
    if (!this.config.persistence.enabled) {
      return;
    }

    try {
      const storageKey = this.config.persistence.storageKey;
      const persistedData = await this.persistenceService.loadData(storageKey);
      
      if (persistedData) {
        const { changes, currentIndex, sessionId } = persistedData;
        
        // Validate persisted data
        if (this.validatePersistedData(changes, currentIndex)) {
          this.changes = changes;
          this.currentIndex = currentIndex;
          this.sessionId = sessionId || this.sessionId;
          
          diagnostics.info('Loaded persisted undo state', {
            changes: changes.length,
            currentIndex,
          });
          
          this.emit('timeline-changed', {
            position: this.currentIndex + 1,
            totalEntries: this.changes.length,
          });
        } else {
          diagnostics.warn('Invalid persisted data, starting fresh');
        }
      }
      
      this.emit('persistence-complete', { operation: 'load', success: true });
    } catch (error) {
      diagnostics.error('Failed to load persisted state', { error });
      this.emit('error', { error: error as Error, context: 'load-persisted-state' });
      this.emit('persistence-complete', { operation: 'load', success: false });
    }
  }

  /**
   * Validate persisted data integrity
   */
  private validatePersistedData(changes: AssignmentChange[], currentIndex: number): boolean {
    if (!Array.isArray(changes)) return false;
    if (typeof currentIndex !== 'number') return false;
    if (currentIndex < -1 || currentIndex >= changes.length) return false;
    
    // Validate each change
    return changes.every(change => 
      change.id &&
      change.type &&
      change.timestamp &&
      change.previousState &&
      change.newState &&
      change.sessionId
    );
  }

  /**
   * Save current state to persistence
   */
  private async savePersistedState(): Promise<void> {
    if (!this.config.persistence.enabled) {
      return;
    }

    try {
      const storageKey = this.config.persistence.storageKey;
      const data = {
        changes: this.changes,
        currentIndex: this.currentIndex,
        sessionId: this.sessionId,
        timestamp: Date.now(),
      };

      await this.persistenceService.saveData(storageKey, data);
      
      diagnostics.debug('Saved undo state', {
        changes: this.changes.length,
        currentIndex: this.currentIndex,
      });
      
      this.emit('persistence-complete', { operation: 'save', success: true });
    } catch (error) {
      diagnostics.error('Failed to save persisted state', { error });
      this.emit('error', { error: error as Error, context: 'save-persisted-state' });
      this.emit('persistence-complete', { operation: 'save', success: false });
    }
  }

  /**
   * Start auto-save interval
   */
  private startAutoSave(): void {
    if (!this.config.persistence.enabled) {
      return;
    }

    this.autoSaveInterval = setInterval(() => {
      this.savePersistedState();
    }, this.config.persistence.autoSaveInterval);
  }

  /**
   * Start change detection
   */
  private startChangeDetection(): void {
    if (!this.config.autoDetectChanges) {
      return;
    }

    this.changeDetectionInterval = setInterval(() => {
      this.detectChanges();
    }, this.config.changeDetectionInterval);
  }

  /**
   * Detect changes in assignment state
   */
  private async detectChanges(): Promise<void> {
    // This would integrate with the actual assignment state
    // For now, we'll implement a placeholder
    // In a real implementation, this would check the current state
    // against the last known state and create changes automatically
  }

  /**
   * Add a change to the history
   */
  public addChange(
    type: AssignmentChangeType,
    description: string,
    previousState: AssignmentState,
    newState: AssignmentState,
    metadata?: Partial<AssignmentChange['metadata']>
  ): void {
    const change: AssignmentChange = {
      id: generateChangeId(),
      type,
      timestamp: Date.now(),
      description,
      previousState: { ...previousState },
      newState: { ...newState },
      sessionId: this.sessionId,
      autoGenerated: false,
      metadata: {
        affectedResidents: this.getAffectedResidents(previousState, newState),
        affectedActivities: this.getAffectedActivities(previousState, newState),
        ...metadata,
      },
    };

    // Remove any changes after current index (redo stack)
    this.changes = this.changes.slice(0, this.currentIndex + 1);
    
    // Add new change
    this.changes.push(change);
    this.currentIndex++;

    // Enforce max history depth
    if (this.changes.length > this.config.maxHistoryDepth) {
      const excess = this.changes.length - this.config.maxHistoryDepth;
      this.changes = this.changes.slice(excess);
      this.currentIndex = Math.max(-1, this.currentIndex - excess);
    }

    diagnostics.info('Added change to history', {
      changeId: change.id,
      type,
      description,
      totalChanges: this.changes.length,
    });

    this.emit('change-added', { change });
    this.emit('timeline-changed', {
      position: this.currentIndex + 1,
      totalEntries: this.changes.length,
    });

    // Auto-save if enabled
    if (this.config.persistence.enabled) {
      this.savePersistedState();
    }
  }

  /**
   * Get affected residents from state change
   */
  private getAffectedResidents(previousState: AssignmentState, newState: AssignmentState): string[] {
    const residents = new Set<string>();
    
    // Add residents from previous state
    Object.keys(previousState.assignments).forEach(residentId => {
      residents.add(residentId);
    });
    
    // Add residents from new state
    Object.keys(newState.assignments).forEach(residentId => {
      residents.add(residentId);
    });
    
    return Array.from(residents);
  }

  /**
   * Get affected activities from state change
   */
  private getAffectedActivities(previousState: AssignmentState, newState: AssignmentState): string[] {
    const activities = new Set<string>();
    
    // Add activities from previous state
    Object.values(previousState.assignments).forEach(activityId => {
      activities.add(activityId);
    });
    
    // Add activities from new state
    Object.values(newState.assignments).forEach(activityId => {
      activities.add(activityId);
    });
    
    return Array.from(activities);
  }

  /**
   * Perform undo operation
   */
  public undo(): AssignmentState | null {
    if (!this.canUndo()) {
      diagnostics.warn('Cannot undo: no changes to undo');
      return null;
    }

    const change = this.changes[this.currentIndex];
    const previousState = change.previousState;
    
    this.currentIndex--;

    diagnostics.info('Performed undo', {
      changeId: change.id,
      type: change.type,
      newIndex: this.currentIndex,
    });

    this.emit('undo-performed', { change, newState: previousState });
    this.emit('timeline-changed', {
      position: this.currentIndex + 1,
      totalEntries: this.changes.length,
    });

    // Auto-save if enabled
    if (this.config.persistence.enabled) {
      this.savePersistedState();
    }

    return previousState;
  }

  /**
   * Perform redo operation
   */
  public redo(): AssignmentState | null {
    if (!this.canRedo()) {
      diagnostics.warn('Cannot redo: no changes to redo');
      return null;
    }

    this.currentIndex++;
    const change = this.changes[this.currentIndex];
    const newState = change.newState;

    diagnostics.info('Performed redo', {
      changeId: change.id,
      type: change.type,
      newIndex: this.currentIndex,
    });

    this.emit('redo-performed', { change, newState });
    this.emit('timeline-changed', {
      position: this.currentIndex + 1,
      totalEntries: this.changes.length,
    });

    // Auto-save if enabled
    if (this.config.persistence.enabled) {
      this.savePersistedState();
    }

    return newState;
  }

  /**
   * Check if undo is possible
   */
  public canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   */
  public canRedo(): boolean {
    return this.currentIndex < this.changes.length - 1;
  }

  /**
   * Get current state
   */
  public getCurrentState(): AssignmentState | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.changes.length) {
      return this.changes[this.currentIndex].newState;
    }
    return null;
  }

  /**
   * Get change history
   */
  public getHistory(): AssignmentChange[] {
    return [...this.changes];
  }

  /**
   * Get changes up to current index
   */
  public getAppliedChanges(): AssignmentChange[] {
    return this.changes.slice(0, this.currentIndex + 1);
  }

  /**
   * Get undo stack (changes that can be undone)
   */
  public getUndoStack(): AssignmentChange[] {
    if (this.currentIndex < 0) return [];
    return this.changes.slice(0, this.currentIndex + 1).reverse();
  }

  /**
   * Get redo stack (changes that can be redone)
   */
  public getRedoStack(): AssignmentChange[] {
    if (this.currentIndex >= this.changes.length - 1) return [];
    return this.changes.slice(this.currentIndex + 1);
  }

  /**
   * Generate diff summary for a change
   */
  public generateDiffSummary(change: AssignmentChange): AssignmentDiffSummary {
    const { previousState, newState, type, id, timestamp } = change;
    
    const details = {
      added: [] as AssignmentDiffSummary['details']['added'],
      removed: [] as AssignmentDiffSummary['details']['removed'],
      moved: [] as AssignmentDiffSummary['details']['moved'],
    };

    // Find added assignments
    Object.entries(newState.assignments).forEach(([residentId, activityId]) => {
      if (previousState.assignments[residentId] !== activityId) {
        if (!previousState.assignments[residentId]) {
          // Resident was added to activity
          details.added.push({
            residentId,
            residentName: this.getResidentName(residentId),
            activityId,
            activityName: this.getActivityName(activityId),
          });
        } else {
          // Resident was moved from one activity to another
          details.moved.push({
            residentId,
            residentName: this.getResidentName(residentId),
            fromActivityId: previousState.assignments[residentId],
            fromActivityName: this.getActivityName(previousState.assignments[residentId]),
            toActivityId: activityId,
            toActivityName: this.getActivityName(activityId),
          });
        }
      }
    });

    // Find removed assignments
    Object.entries(previousState.assignments).forEach(([residentId, activityId]) => {
      if (!newState.assignments[residentId]) {
        details.removed.push({
          residentId,
          residentName: this.getResidentName(residentId),
          activityId,
          activityName: this.getActivityName(activityId),
        });
      }
    });

    const impact = {
      affectedResidents: details.added.length + details.removed.length + details.moved.length,
      affectedActivities: new Set([
        ...details.added.map(a => a.activityId),
        ...details.removed.map(a => a.activityId),
        ...details.moved.map(a => a.fromActivityId).concat(details.moved.map(a => a.toActivityId)),
      ]).size,
      priority: 'low' as const,
      productivityImpact: this.calculateProductivityImpact(details),
    };

    impact.priority = calculateChangePriority(impact);

    return {
      changeId: id,
      type,
      summary: this.generateSummaryText(type, details),
      details,
      impact,
      timestamp,
    };
  }

  /**
   * Get resident name (placeholder implementation)
   */
  private getResidentName(residentId: string): string {
    // This would integrate with the actual resident data
    return `Resident ${residentId}`;
  }

  /**
   * Get activity name (placeholder implementation)
   */
  private getActivityName(activityId: string): string {
    // This would integrate with the actual activity data
    return `Activity ${activityId}`;
  }

  /**
   * Generate summary text for change
   */
  private generateSummaryText(
    type: AssignmentChangeType,
    details: AssignmentDiffSummary['details']
  ): string {
    switch (type) {
      case AssignmentChangeType.RESIDENT_ASSIGNED:
        return `Assigned ${details.added.length} resident(s) to activities`;
      case AssignmentChangeType.RESIDENT_UNASSIGNED:
        return `Unassigned ${details.removed.length} resident(s) from activities`;
      case AssignmentChangeType.RESIDENT_MOVED:
        return `Moved ${details.moved.length} resident(s) between activities`;
      case AssignmentChangeType.BATCH_ASSIGNMENT:
        return `Batch assigned ${details.added.length} resident(s)`;
      case AssignmentChangeType.BATCH_UNASSIGNMENT:
        return `Batch unassigned ${details.removed.length} resident(s)`;
      case AssignmentChangeType.EMERGENCY_REASSIGNMENT:
        return `Emergency reassignment of ${details.moved.length} resident(s)`;
      case AssignmentChangeType.AUTO_ASSIGNMENT:
        return `Auto-assigned ${details.added.length} resident(s)`;
      default:
        return 'Assignment change';
    }
  }

  /**
   * Calculate productivity impact
   */
  private calculateProductivityImpact(
    details: AssignmentDiffSummary['details']
  ): number {
    // Simple calculation - in real implementation this would be more sophisticated
    const totalChanges = details.added.length + details.removed.length + details.moved.length;
    const positiveChanges = details.added.length + details.moved.length;
    const negativeChanges = details.removed.length;
    
    if (totalChanges === 0) return 0;
    
    return (positiveChanges - negativeChanges) / totalChanges;
  }

  /**
   * Generate timeline entries
   */
  public generateTimelineEntries(): TimelineEntry[] {
    if (this.changes.length === 0) {
      return [];
    }

    const minTimestamp = Math.min(...this.changes.map(c => c.timestamp));
    const maxTimestamp = Math.max(...this.changes.map(c => c.timestamp));
    const timeRange = maxTimestamp - minTimestamp || 1;

    return this.changes.map((change, index) => {
      const position = timeRange > 0 ? (change.timestamp - minTimestamp) / timeRange : 0;
      
      return {
        id: change.id,
        position,
        type: change.type,
        label: change.description,
        timestamp: change.timestamp,
        isCurrent: index === this.currentIndex,
        navigable: index <= this.currentIndex,
        visual: {
          color: getChangeTypeColor(change.type, this.config),
          icon: getChangeTypeIcon(change.type),
          size: this.getEntrySize(change),
          opacity: index <= this.currentIndex ? 1 : 0.5,
        },
      };
    });
  }

  /**
   * Get entry size based on change importance
   */
  private getEntrySize(change: AssignmentChange): 'small' | 'medium' | 'large' {
    const affectedCount = change.metadata.affectedResidents.length;
    
    if (affectedCount >= 10) return 'large';
    if (affectedCount >= 3) return 'medium';
    return 'small';
  }

  /**
   * Navigate to specific point in timeline
   */
  public navigateToTimelineEntry(entryId: string): AssignmentState | null {
    const entryIndex = this.changes.findIndex(c => c.id === entryId);
    
    if (entryIndex === -1) {
      diagnostics.warn('Timeline entry not found', { entryId });
      return null;
    }

    this.currentIndex = entryIndex;
    const state = this.changes[entryIndex].newState;

    diagnostics.info('Navigated to timeline entry', {
      entryId,
      index: entryIndex,
    });

    this.emit('timeline-changed', {
      position: this.currentIndex + 1,
      totalEntries: this.changes.length,
    });

    // Auto-save if enabled
    if (this.config.persistence.enabled) {
      this.savePersistedState();
    }

    return state;
  }

  /**
   * Clear all history
   */
  public clearHistory(reason: string = 'manual'): void {
    const previousCount = this.changes.length;
    
    this.changes = [];
    this.currentIndex = -1;

    diagnostics.info('Cleared history', { reason, previousCount });

    this.emit('history-cleared', { reason });
    this.emit('timeline-changed', { position: 0, totalEntries: 0 });

    // Auto-save if enabled
    if (this.config.persistence.enabled) {
      this.savePersistedState();
    }
  }

  /**
   * Get statistics
   */
  public getStatistics(): {
    totalChanges: number;
    currentChangeIndex: number;
    canUndo: boolean;
    canRedo: boolean;
    changesByType: Record<AssignmentChangeType, number>;
    sessionDuration: number;
  } {
    const changesByType = this.changes.reduce((acc, change) => {
      acc[change.type] = (acc[change.type] || 0) + 1;
      return acc;
    }, {} as Record<AssignmentChangeType, number>);

    const sessionDuration = this.changes.length > 0 
      ? Date.now() - this.changes[0].timestamp 
      : 0;

    return {
      totalChanges: this.changes.length,
      currentChangeIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      changesByType,
      sessionDuration,
    };
  }

  /**
   * Cleanup and destroy engine
   */
  public destroy(): void {
    // Clear intervals
    if (this.changeDetectionInterval) {
      clearInterval(this.changeDetectionInterval);
    }
    
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    // Save final state
    if (this.config.persistence.enabled) {
      this.savePersistedState();
    }

    // Clear event listeners
    this.eventListeners.clear();

    diagnostics.info('Assignment undo engine destroyed');
  }
}
