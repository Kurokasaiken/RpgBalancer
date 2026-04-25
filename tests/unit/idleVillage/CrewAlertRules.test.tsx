/**
 * Crew Alert Rules Tests - NP-031
 * 
 * Unit tests for crew alert rules hook and configuration.
 * Tests rule evaluation, alert generation, and persistence.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCrewAlertRules } from '../../../src/ui/idleVillage/hooks/useCrewAlertRules';
import type { CrewAlertRule } from '../../../src/ui/idleVillage/config/crewAlertRules';
import { CREW_ALERT_RULE_TYPES, CREW_ALERT_RULE_SEVERITY } from '../../../src/ui/idleVillage/config/crewAlertRules';
import { saveData, loadData } from '../../../src/shared/persistence/PersistenceService';

// Mock the persistence service
vi.mock('../../../src/shared/persistence/PersistenceService');

// Mock crew scheduler controller
const mockController = {
  getState: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  enqueueTask: vi.fn(),
  processQueue: vi.fn(),
  rebalanceQueue: vi.fn(),
  consumeAssignment: vi.fn(),
  getQueue: vi.fn(),
  getCrew: vi.fn(),
  getActivity: vi.fn(),
  pauseQueue: vi.fn(),
  resumeQueue: vi.fn(),
} as any;

describe('useCrewAlertRules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(saveData).mockResolvedValue(undefined);
    vi.mocked(loadData).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      mockController.getState.mockReturnValue({
        residents: [],
        queue: [],
        activities: [],
      });

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController })
      );

      expect(result.current.config.enabled).toBe(true);
      expect(result.current.config.rules).toHaveLength(8); // Default rules
      expect(result.current.alerts).toHaveLength(0);
      expect(result.current.enabled).toBe(true);
    });

    it('should load persisted configuration on mount', async () => {
      const persistedConfig = {
        enabled: false,
        rules: [
          {
            id: 'custom-rule',
            type: CREW_ALERT_RULE_TYPES.FATIGUE_THRESHOLD,
            name: 'Custom Rule',
            description: 'Test rule',
            enabled: true,
            severity: CREW_ALERT_RULE_SEVERITY.WARNING,
            alertLevel: 'medium',
            conditions: [
              {
                field: 'averageFatigue',
                operator: '>',
                threshold: 0.8,
              },
            ],
            cooldownMs: 60000,
            showNotification: true,
            addToHUD: true,
            tags: ['test'],
            priority: 50,
          },
        ],
        maxAlertHistory: 50,
        defaultCooldownMs: 30000,
        enablePersistence: true,
        alertRetentionMs: 86400000,
        maxConcurrentAlerts: 3,
        aggregation: {
          enabled: true,
          windowMs: 60000,
          maxAlerts: 5,
        },
        notifications: {
          enableDesktop: false,
          enableSound: false,
          soundVolume: 0.5,
          duration: 5000,
        },
      };

      vi.mocked(loadData).mockResolvedValueOnce(persistedConfig);

      mockController.getState.mockReturnValue({
        residents: [],
        queue: [],
        activities: [],
      });

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController })
      );

      await waitFor(() => {
        expect(result.current.config.enabled).toBe(false);
        expect(result.current.config.rules).toHaveLength(1);
      });
    });

    it('should handle persistence loading errors gracefully', async () => {
      vi.mocked(loadData).mockRejectedValue(new Error('Storage error'));

      mockController.getState.mockReturnValue({
        residents: [],
        queue: [],
        activities: [],
      });

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController, debug: true })
      );

      // Should still initialize with defaults
      expect(result.current.config.enabled).toBe(true);
      expect(result.current.config.rules).toHaveLength(8);
    });
  });

  describe('Rule Evaluation', () => {
    it('should trigger alerts when conditions are met', async () => {
      const mockState = {
        residents: [
          { id: '1', name: 'Resident 1', status: 'working', fatigue: 0.8, responseTime: 15000 },
          { id: '2', name: 'Resident 2', status: 'working', fatigue: 0.9, responseTime: 25000 },
          { id: '3', name: 'Resident 3', status: 'available', fatigue: 0.1, responseTime: 5000 },
        ],
        queue: [
          { id: 'q1', priority: 0.8, waitTime: 35000, started: false },
          { id: 'q2', priority: 0.6, waitTime: 25000, started: false },
        ],
        activities: [
          { type: 'work', count: 2 },
          { type: 'rest', count: 1 },
        ],
      };

      mockController.getState.mockReturnValue(mockState);

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController })
      );

      await waitFor(() => {
        expect(result.current.metrics).not.toBeNull();
        expect(result.current.metrics?.averageFatigue).toBeCloseTo(0.6, 1);
        expect(result.current.metrics?.exhaustedCount).toBe(1);
        expect(result.current.metrics?.queueSize).toBe(2);
      });

      // Wait for rule evaluation
      await waitFor(() => {
        expect(result.current.alerts.length).toBeGreaterThan(0);
      }, { timeout: 6000 });
    });

    it('should respect rule cooldowns', async () => {
      const mockState = {
        residents: [
          { id: '1', name: 'Resident 1', status: 'exhausted', fatigue: 0.95, responseTime: 10000 },
        ],
        queue: [],
        activities: [],
      };

      mockController.getState.mockReturnValue(mockState);

      const { result, rerender } = renderHook(() => 
        useCrewAlertRules({ controller: mockController })
      );

      // Wait for initial alert
      await waitFor(() => {
        expect(result.current.alerts.length).toBeGreaterThan(0);
      }, { timeout: 6000 });

      const initialAlertCount = result.current.alerts.length;

      // Trigger re-evaluation (should not create new alerts due to cooldown)
      rerender();

      await waitFor(() => {
        expect(result.current.alerts.length).toBe(initialAlertCount);
      }, { timeout: 1000 });
    });

    it('should not trigger alerts for disabled rules', async () => {
      const mockState = {
        residents: [
          { id: '1', name: 'Resident 1', status: 'exhausted', fatigue: 0.95, responseTime: 10000 },
        ],
        queue: [],
        activities: [],
      };

      mockController.getState.mockReturnValue(mockState);

      const { result } = renderHook(() => 
        useCrewAlertRules({ 
          controller: mockController,
          config: {
            rules: [
              {
                id: 'disabled-rule',
                type: CREW_ALERT_RULE_TYPES.FATIGUE_THRESHOLD,
                name: 'Disabled Rule',
                description: 'Should not trigger',
                enabled: false, // Disabled
                severity: CREW_ALERT_RULE_SEVERITY.WARNING,
                alertLevel: 'medium',
                conditions: [
                  {
                    field: 'exhaustedCount',
                    operator: '>',
                    threshold: 0,
                  },
                ],
                cooldownMs: 1000,
                showNotification: true,
                addToHUD: true,
                tags: ['test'],
                priority: 50,
              },
            ],
          },
        })
      );

      await waitFor(() => {
        expect(result.current.alerts).toHaveLength(0);
      }, { timeout: 6000 });
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      mockController.getState.mockReturnValue({
        residents: [],
        queue: [],
        activities: [],
      });

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController })
      );

      const newConfig = {
        enabled: false,
        maxAlertHistory: 200,
      };

      result.current.updateConfig(newConfig);

      expect(result.current.config.enabled).toBe(false);
      expect(result.current.config.maxAlertHistory).toBe(200);
      expect(vi.mocked(saveData)).toHaveBeenCalled();
    });

    it('should add new rule', () => {
      mockController.getState.mockReturnValue({
        residents: [],
        queue: [],
        activities: [],
      });

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController })
      );

      const initialRuleCount = result.current.config.rules.length;

      result.current.addRule({
        type: CREW_ALERT_RULE_TYPES.QUEUE_OVERLOAD,
        name: 'Test Rule',
        description: 'Test description',
        enabled: true,
        severity: CREW_ALERT_RULE_SEVERITY.INFO,
        alertLevel: 'low',
        conditions: [
          {
            field: 'queueSize',
            operator: '>',
            threshold: 10,
          },
        ],
        cooldownMs: 30000,
        showNotification: false,
        addToHUD: true,
        tags: ['test'],
        priority: 30,
      });

      expect(result.current.config.rules).toHaveLength(initialRuleCount + 1);
      expect(vi.mocked(saveData)).toHaveBeenCalled();
    });

    it('should update existing rule', () => {
      mockController.getState.mockReturnValue({
        residents: [],
        queue: [],
        activities: [],
      });

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController })
      );

      const ruleId = result.current.config.rules[0].id;
      
      result.current.updateRule(ruleId, {
        name: 'Updated Rule Name',
        enabled: false,
      });

      const updatedRule = result.current.config.rules.find(r => r.id === ruleId);
      expect(updatedRule?.name).toBe('Updated Rule Name');
      expect(updatedRule?.enabled).toBe(false);
      expect(vi.mocked(saveData)).toHaveBeenCalled();
    });

    it('should remove rule', () => {
      mockController.getState.mockReturnValue({
        residents: [],
        queue: [],
        activities: [],
      });

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController })
      );

      const initialRuleCount = result.current.config.rules.length;
      const ruleId = result.current.config.rules[0].id;

      result.current.removeRule(ruleId);

      expect(result.current.config.rules).toHaveLength(initialRuleCount - 1);
      expect(result.current.config.rules.find(r => r.id === ruleId)).toBeUndefined();
      expect(vi.mocked(saveData)).toHaveBeenCalled();
    });

    it('should toggle rule enabled state', () => {
      mockController.getState.mockReturnValue({
        residents: [],
        queue: [],
        activities: [],
      });

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController })
      );

      const ruleId = result.current.config.rules[0].id;
      const originalEnabled = result.current.config.rules.find(r => r.id === ruleId)?.enabled;

      result.current.toggleRule(ruleId);

      const updatedRule = result.current.config.rules.find(r => r.id === ruleId);
      expect(updatedRule?.enabled).toBe(!originalEnabled);
      expect(vi.mocked(saveData)).toHaveBeenCalled();
    });
  });

  describe('Alert Management', () => {
    it('should clear all alerts', async () => {
      // Create some alerts first
      const mockState = {
        residents: [
          { id: '1', name: 'Resident 1', status: 'exhausted', fatigue: 0.95, responseTime: 10000 },
        ],
        queue: [],
        activities: [],
      };

      mockController.getState.mockReturnValue(mockState);

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController })
      );

      // Wait for alerts to be generated
      await waitFor(() => {
        expect(result.current.alerts.length).toBeGreaterThan(0);
      }, { timeout: 6000 });

      // Clear alerts
      result.current.clearAlerts();

      expect(result.current.alerts).toHaveLength(0);
      expect(vi.mocked(saveData)).toHaveBeenCalled();
    });

    it('should dismiss specific alert', async () => {
      const mockState = {
        residents: [
          { id: '1', name: 'Resident 1', status: 'exhausted', fatigue: 0.95, responseTime: 10000 },
        ],
        queue: [],
        activities: [],
      };

      mockController.getState.mockReturnValue(mockState);

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController })
      );

      // Wait for alerts to be generated
      await waitFor(() => {
        expect(result.current.alerts.length).toBeGreaterThan(0);
      }, { timeout: 6000 });

      const alertId = result.current.alerts[0].id;
      const initialAlertCount = result.current.alerts.length;

      // Dismiss alert
      result.current.dismissAlert(alertId);

      expect(result.current.alerts.length).toBe(initialAlertCount - 1);
      expect(result.current.alerts.find(a => a.id === alertId)?.active).toBe(false);
      expect(vi.mocked(saveData)).toHaveBeenCalled();
    });
  });

  describe('Rule Queries', () => {
    it('should get rules by type', () => {
      mockController.getState.mockReturnValue({
        residents: [],
        queue: [],
        activities: [],
      });

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController })
      );

      const fatigueRules = result.current.getRulesByType(CREW_ALERT_RULE_TYPES.FATIGUE_THRESHOLD);
      
      expect(fatigueRules.length).toBeGreaterThan(0);
      expect(fatigueRules.every(rule => rule.type === CREW_ALERT_RULE_TYPES.FATIGUE_THRESHOLD)).toBe(true);
    });

    it('should get rules by severity', () => {
      mockController.getState.mockReturnValue({
        residents: [],
        queue: [],
        activities: [],
      });

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController })
      );

      const criticalRules = result.current.getRulesBySeverity(CREW_ALERT_RULE_SEVERITY.CRITICAL);
      
      expect(criticalRules.length).toBeGreaterThan(0);
      expect(criticalRules.every(rule => rule.severity === CREW_ALERT_RULE_SEVERITY.CRITICAL)).toBe(true);
    });

    it('should get rules by tags', () => {
      mockController.getState.mockReturnValue({
        residents: [],
        queue: [],
        activities: [],
      });

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController })
      );

      const healthRules = result.current.getRulesByTags(['health']);
      
      expect(healthRules.length).toBeGreaterThan(0);
      expect(healthRules.every(rule => rule.tags.includes('health'))).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should provide alert statistics', async () => {
      const mockState = {
        residents: [
          { id: '1', name: 'Resident 1', status: 'exhausted', fatigue: 0.95, responseTime: 10000 },
        ],
        queue: [],
        activities: [],
      };

      mockController.getState.mockReturnValue(mockState);

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController })
      );

      // Wait for alerts to be generated
      await waitFor(() => {
        expect(result.current.alerts.length).toBeGreaterThan(0);
      }, { timeout: 6000 });

      const stats = result.current.getAlertStats();

      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.active).toBeGreaterThanOrEqual(0);
      expect(typeof stats.byLevel).toBe('object');
      expect(typeof stats.bySeverity).toBe('object');
    });
  });

  describe('Error Handling', () => {
    it('should handle controller state errors gracefully', () => {
      mockController.getState.mockImplementation(() => {
        throw new Error('Controller error');
      });

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController, debug: true })
      );

      expect(result.current.metrics).toBeNull();
      expect(result.current.alerts).toHaveLength(0);
    });

    it('should handle malformed controller state', () => {
      mockController.getState.mockReturnValue({
        residents: null, // Malformed
        queue: 'not an array',
        activities: undefined,
      });

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController, debug: true })
      );

      expect(result.current.metrics).toBeNull();
      expect(result.current.alerts).toHaveLength(0);
    });
  });

  describe('Persistence', () => {
    it('should save configuration changes', () => {
      mockController.getState.mockReturnValue({
        residents: [],
        queue: [],
        activities: [],
      });

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController })
      );

      result.current.updateConfig({ enabled: false });

      expect(vi.mocked(saveData)).toHaveBeenCalledWith(
        'crew_alert_rules_config',
        expect.any(Object)
      );
    });

    it('should save alert history changes', async () => {
      const mockState = {
        residents: [
          { id: '1', name: 'Resident 1', status: 'exhausted', fatigue: 0.95, responseTime: 10000 },
        ],
        queue: [],
        activities: [],
      };

      mockController.getState.mockReturnValue(mockState);

      const { result } = renderHook(() => 
        useCrewAlertRules({ controller: mockController })
      );

      // Wait for alerts to be generated
      await waitFor(() => {
        expect(result.current.alerts.length).toBeGreaterThan(0);
      }, { timeout: 6000 });

      result.current.clearAlerts();

      expect(vi.mocked(saveData)).toHaveBeenCalledWith(
        'crew_alerts_history',
        expect.any(Array)
      );
    });
  });
});
