/**
 * TS-005: Claude Workflow & Performance Test Suite
 * 
 * Comprehensive test suite for the TS-005 Claude workflow and performance system.
 * Tests workflow automation, performance monitoring, Claude AI integration,
 * and optimization engine functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ClaudeWorkflowEngine, useClaudeWorkflowEngine } from '@/ui/idleVillage/skins/claude/ClaudeWorkflowEngine';
import { PerformanceMonitor, usePerformanceMonitor } from '@/ui/idleVillage/skins/claude/PerformanceMonitor';
import { useClaudeIntegration, useClaudeWorkflowIntegration, useClaudePerformanceIntegration } from '@/ui/idleVillage/skins/claude/useClaudeIntegration';
import { WorkflowAutomationEngine, useWorkflowAutomation } from '@/ui/idleVillage/skins/claude/WorkflowAutomation';
import { PerformanceOptimizationEngine, usePerformanceOptimization } from '@/ui/idleVillage/skins/claude/PerformanceOptimizationEngine';

// Mock the skin replacement API
vi.mock('@/ui/idleVillage/skins/SkinReplacementAPI_TS003', () => ({
  getSkinReplacementAPI_TS003: vi.fn(() => ({
    getCurrentState: vi.fn(() => ({
      activeBindings: { 'test-component': { presetId: 'minimal-frontier' } },
    })),
    inspectAllComponents: vi.fn(() => [
      {
        componentId: 'test-component',
        validationErrors: [],
        validationWarnings: [],
        needsMigration: false,
        hasCompatibilityIssues: false,
        currentVersion: '1.0.0',
        recommendedVersion: '1.0.0',
        complexity: 1,
      },
    ]),
  })),
}));

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    },
  },
  writable: true,
});

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));

describe('TS-005: Claude Workflow & Performance', () => {
  describe('ClaudeWorkflowEngine', () => {
    let workflowEngine: ClaudeWorkflowEngine;

    beforeEach(() => {
      workflowEngine = new ClaudeWorkflowEngine({
        enableAI: false, // Disable AI for tests
        enablePerformanceOptimization: true,
        enableAutoValidation: true,
        enableSmartMigration: true,
        enablePredictiveCaching: true,
      });
    });

    afterEach(() => {
      workflowEngine.dispose();
    });

    it('should initialize with default configuration', () => {
      const config = workflowEngine.getConfig();
      
      expect(config.enableAI).toBe(false);
      expect(config.enablePerformanceOptimization).toBe(true);
      expect(config.enableAutoValidation).toBe(true);
      expect(config.enableSmartMigration).toBe(true);
      expect(config.enablePredictiveCaching).toBe(true);
      expect(config.model).toBe('claude-3-sonnet-20240229');
      expect(config.maxTokens).toBe(4000);
    });

    it('should create workflow plan with steps', () => {
      const steps = [
        { name: 'Test Step 1', type: 'validation' as const, description: 'Test validation step' },
        { name: 'Test Step 2', type: 'optimization' as const, description: 'Test optimization step' },
      ];

      const workflow = workflowEngine.createWorkflowPlan(steps, {
        name: 'Test Workflow',
        description: 'Test workflow description',
        priority: 'high' as const,
      });

      expect(workflow.id).toBeDefined();
      expect(workflow.name).toBe('Test Workflow');
      expect(workflow.description).toBe('Test workflow description');
      expect(workflow.priority).toBe('high');
      expect(workflow.steps).toHaveLength(2);
      expect(workflow.steps[0].name).toBe('Test Step 1');
      expect(workflow.steps[0].type).toBe('validation');
      expect(workflow.steps[0].status).toBe('pending');
    });

    it('should calculate estimated duration for workflow', () => {
      const steps = [
        { type: 'validation' as const },
        { type: 'optimization' as const },
        { type: 'analysis' as const },
      ];

      const workflow = workflowEngine.createWorkflowPlan(steps);
      
      // Validation (500ms) + Optimization (2000ms) + Analysis (3000ms) = 5500ms
      expect(workflow.estimatedDuration).toBe(5500);
    });

    it('should execute workflow steps sequentially', async () => {
      const steps = [
        { name: 'Test Step', type: 'validation' as const, description: 'Test step' },
      ];

      const workflow = workflowEngine.createWorkflowPlan(steps);
      
      await expect(workflowEngine.executeWorkflow(workflow.id)).resolves.not.toThrow();
      
      const activeWorkflows = workflowEngine.getActiveWorkflows();
      const completedWorkflows = workflowEngine.getCompletedWorkflows();
      
      expect(activeWorkflows).toHaveLength(0);
      expect(completedWorkflows).toHaveLength(1);
      expect(completedWorkflows[0].id).toBe(workflow.id);
      expect(completedWorkflows[0].steps[0].status).toBe('completed');
    });

    it('should handle workflow execution failures', async () => {
      const steps = [
        { 
          name: 'Failing Step', 
          type: 'validation' as const, 
          description: 'Step that will fail',
        },
      ];

      const workflow = workflowEngine.createWorkflowPlan(steps);
      
      // Mock a failing step
      const originalPerformStepAction = (workflowEngine as any).performStepAction;
      (workflowEngine as any).performStepAction = vi.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(workflowEngine.executeWorkflow(workflow.id)).rejects.toThrow('Test error');
      
      const activeWorkflows = workflowEngine.getActiveWorkflows();
      expect(activeWorkflows).toHaveLength(0);
    });

    it('should generate Claude suggestions', async () => {
      const suggestions = await workflowEngine.generateClaudeSuggestions('Test context');
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('id');
      expect(suggestions[0]).toHaveProperty('type');
      expect(suggestions[0]).toHaveProperty('priority');
      expect(suggestions[0]).toHaveProperty('title');
      expect(suggestions[0]).toHaveProperty('description');
      expect(suggestions[0]).toHaveProperty('action');
      expect(suggestions[0]).toHaveProperty('expectedImpact');
      expect(suggestions[0]).toHaveProperty('confidence');
    });

    it('should filter suggestions by type and priority', () => {
      // Add some test suggestions
      workflowEngine.addSuggestion({
        id: 'test-1',
        type: 'optimization',
        priority: 'high',
        title: 'Test Optimization',
        description: 'Test description',
        action: 'Test action',
        expectedImpact: 'Test impact',
        confidence: 0.8,
      });

      workflowEngine.addSuggestion({
        id: 'test-2',
        type: 'validation',
        priority: 'medium',
        title: 'Test Validation',
        description: 'Test description',
        action: 'Test action',
        expectedImpact: 'Test impact',
        confidence: 0.7,
      });

      const optimizationSuggestions = workflowEngine.getSuggestions({ type: 'optimization' });
      const highPrioritySuggestions = workflowEngine.getSuggestions({ priority: 'high' });

      expect(optimizationSuggestions).toHaveLength(1);
      expect(optimizationSuggestions[0].type).toBe('optimization');
      expect(highPrioritySuggestions).toHaveLength(1);
      expect(highPrioritySuggestions[0].priority).toBe('high');
    });

    it('should apply suggestions successfully', async () => {
      workflowEngine.addSuggestion({
        id: 'test-suggestion',
        type: 'optimization',
        priority: 'medium',
        title: 'Test Suggestion',
        description: 'Test description',
        action: 'Test action',
        expectedImpact: 'Test impact',
        confidence: 0.8,
        autoApplicable: true,
      });

      const result = await workflowEngine.applySuggestion('test-suggestion');
      
      expect(result).toBe(true);
      
      const suggestions = workflowEngine.getSuggestions();
      expect(suggestions.find(s => s.id === 'test-suggestion')).toBeUndefined();
    });

    it('should update configuration', () => {
      const newConfig = {
        enableAI: true,
        model: 'claude-3-opus-20240229',
        maxTokens: 8000,
      };

      workflowEngine.updateConfig(newConfig);
      const config = workflowEngine.getConfig();

      expect(config.enableAI).toBe(true);
      expect(config.model).toBe('claude-3-opus-20240229');
      expect(config.maxTokens).toBe(8000);
    });

    it('should reset engine state', () => {
      // Add some data
      workflowEngine.createWorkflowPlan([{ name: 'Test', type: 'validation' as const, description: 'Test' }]);
      workflowEngine.addSuggestion({
        id: 'test',
        type: 'optimization',
        priority: 'medium',
        title: 'Test',
        description: 'Test',
        action: 'Test',
        expectedImpact: 'Test',
        confidence: 0.8,
      });

      workflowEngine.reset();

      expect(workflowEngine.getActiveWorkflows()).toHaveLength(0);
      expect(workflowEngine.getCompletedWorkflows()).toHaveLength(0);
      expect(workflowEngine.getSuggestions()).toHaveLength(0);
    });
  });

  describe('useClaudeWorkflowEngine Hook', () => {
    it('should provide workflow engine functionality', () => {
      const { result } = renderHook(() => useClaudeWorkflowEngine({
        enableAI: false,
        enablePerformanceOptimization: true,
      }));

      expect(result.current.engine).toBeDefined();
      expect(result.current.metrics).toBeDefined();
      expect(result.current.workflows).toBeDefined();
      expect(result.current.completedWorkflows).toBeDefined();
      expect(result.current.suggestions).toBeDefined();
      expect(result.current.isRunning).toBe(false);
      expect(typeof result.current.createWorkflow).toBe('function');
      expect(typeof result.current.executeWorkflow).toBe('function');
      expect(typeof result.current.generateSuggestions).toBe('function');
      expect(typeof result.current.applySuggestion).toBe('function');
    });

    it('should create and execute workflow', async () => {
      const { result } = renderHook(() => useClaudeWorkflowEngine());

      await act(async () => {
        const workflow = result.current.createWorkflow([
          { name: 'Test Step', type: 'validation' as const, description: 'Test' }
        ], {
          name: 'Test Workflow',
          autoExecute: false,
        });

        expect(workflow).toBeDefined();
        expect(workflow.name).toBe('Test Workflow');
        expect(workflow.autoExecute).toBe(false);
      });
    });
  });

  describe('PerformanceMonitor', () => {
    let performanceMonitor: PerformanceMonitor;

    beforeEach(() => {
      performanceMonitor = new PerformanceMonitor();
    });

    afterEach(() => {
      performanceMonitor.dispose();
    });

    it('should initialize with default thresholds', () => {
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.renderTime).toBe(0);
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.fps).toBe(60);
      expect(metrics.errorCount).toBe(0);
    });

    it('should start and stop monitoring', () => {
      expect(performanceMonitor.isMonitoringActive()).toBe(false);

      performanceMonitor.startMonitoring(1000);
      expect(performanceMonitor.isMonitoringActive()).toBe(true);

      performanceMonitor.stopMonitoring();
      expect(performanceMonitor.isMonitoringActive()).toBe(false);
    });

    it('should collect snapshots during monitoring', () => {
      performanceMonitor.startMonitoring(100); // Fast interval for testing

      // Wait for at least one snapshot
      setTimeout(() => {
        const snapshots = performanceMonitor.getSnapshots();
        expect(snapshots.length).toBeGreaterThan(0);
        expect(snapshots[0]).toHaveProperty('timestamp');
        expect(snapshots[0]).toHaveProperty('renderTime');
        expect(snapshots[0]).toHaveProperty('memoryUsage');
      }, 150);

      performanceMonitor.stopMonitoring();
    });

    it('should generate performance report', () => {
      // Add some test data
      performanceMonitor.startMonitoring(100);
      
      setTimeout(() => {
        const report = performanceMonitor.generateReport(1000); // 1 second period
        
        expect(report).toHaveProperty('id');
        expect(report).toHaveProperty('generatedAt');
        expect(report).toHaveProperty('period');
        expect(report).toHaveProperty('summary');
        expect(report).toHaveProperty('trends');
        expect(report).toHaveProperty('recommendations');
        expect(report).toHaveProperty('alerts');
        
        expect(report.summary).toHaveProperty('averageRenderTime');
        expect(report.summary).toHaveProperty('peakMemoryUsage');
        expect(report.summary).toHaveProperty('totalErrors');
        expect(report.summary).toHaveProperty('averageFps');
        expect(report.summary).toHaveProperty('uptime');
        expect(report.summary).toHaveProperty('healthScore');
      }, 200);

      performanceMonitor.stopMonitoring();
    });

    it('should create alerts for threshold violations', () => {
      // Simulate a threshold violation
      performanceMonitor.recordMetric('renderTime', 50); // Exceeds 16.67ms threshold
      
      const alerts = performanceMonitor.getAlerts();
      const renderAlerts = alerts.filter(a => a.metric === 'renderTime');
      
      expect(renderAlerts.length).toBeGreaterThan(0);
      expect(renderAlerts[0].type).toBe('critical');
      expect(renderAlerts[0].currentValue).toBe(50);
      expect(renderAlerts[0].threshold).toBe(33.33); // Critical threshold
    });

    it('should acknowledge and resolve alerts', () => {
      // Create an alert
      performanceMonitor.recordMetric('renderTime', 50);
      const alerts = performanceMonitor.getAlerts();
      const alertId = alerts[0].id;

      // Acknowledge alert
      performanceMonitor.acknowledgeAlert(alertId);
      let acknowledgedAlerts = performanceMonitor.getAlerts({ acknowledged: true });
      expect(acknowledgedAlerts).toHaveLength(1);

      // Resolve alert
      performanceMonitor.resolveAlert(alertId);
      const resolvedAlerts = performanceMonitor.getAlerts({ resolved: true });
      expect(resolvedAlerts).toHaveLength(1);
    });

    it('should apply optimization recommendations', async () => {
      // Generate recommendations by triggering alerts
      performanceMonitor.recordMetric('renderTime', 50);
      performanceMonitor.recordMetric('memoryUsage', 200 * 1024 * 1024); // 200MB
      
      const recommendations = performanceMonitor.getRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);

      const recommendationId = recommendations[0].id;
      const result = await performanceMonitor.applyRecommendation(recommendationId);
      
      expect(result).toBe(true);
      
      const appliedRecommendations = performanceMonitor.getRecommendations({ applied: true });
      expect(appliedRecommendations.find(r => r.id === recommendationId)).toBeDefined();
    });
  });

  describe('usePerformanceMonitor Hook', () => {
    it('should provide performance monitoring functionality', () => {
      const { result } = renderHook(() => usePerformanceMonitor({ autoStart: false }));

      expect(result.current.monitor).toBeDefined();
      expect(result.current.isMonitoring).toBe(false);
      expect(result.current.metrics).toBeDefined();
      expect(result.current.alerts).toBeDefined();
      expect(result.current.recommendations).toBeDefined();
      expect(result.current.reports).toBeDefined();
      expect(typeof result.current.startMonitoring).toBe('function');
      expect(typeof result.current.stopMonitoring).toBe('function');
      expect(typeof result.current.generateReport).toBe('function');
      expect(typeof result.current.applyRecommendation).toBe('function');
    });

    it('should auto-start monitoring when requested', () => {
      const { result } = renderHook(() => usePerformanceMonitor({ autoStart: true }));

      expect(result.current.isMonitoring).toBe(true);
    });
  });

  describe('useClaudeIntegration Hook', () => {
    it('should provide Claude integration functionality', () => {
      const { result } = renderHook(() => useClaudeIntegration({
        enableAutoOptimization: true,
        cacheEnabled: true,
      }));

      expect(result.current.isConnected).toBe(true);
      expect(result.current.requests).toBeDefined();
      expect(result.current.suggestions).toBeDefined();
      expect(result.current.queueStatus).toBeDefined();
      expect(result.current.cacheStats).toBeDefined();
      expect(typeof result.current.makeRequest).toBe('function');
      expect(typeof result.current.generateSuggestions).toBe('function');
      expect(typeof result.current.analyzePerformance).toBe('function');
      expect(typeof result.current.optimizeSystem).toBe('function');
    });

    it('should make Claude requests', async () => {
      const { result } = renderHook(() => useClaudeIntegration());

      await act(async () => {
        const response = await result.current.makeRequest('suggestion', 'Test prompt');
        
        expect(response).toHaveProperty('id');
        expect(response).toHaveProperty('requestId');
        expect(response).toHaveProperty('content');
        expect(response).toHaveProperty('suggestions');
        expect(response).toHaveProperty('analysis');
        expect(response).toHaveProperty('confidence');
        expect(response).toHaveProperty('processingTime');
        expect(response).toHaveProperty('model');
        expect(response).toHaveProperty('tokensUsed');
      });
    });

    it('should generate suggestions', async () => {
      const { result } = renderHook(() => useClaudeIntegration());

      await act(async () => {
        const response = await result.current.generateSuggestions({ test: 'context' });
        
        expect(response.suggestions).toBeDefined();
        expect(Array.isArray(response.suggestions)).toBe(true);
        expect(response.suggestions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('useClaudeWorkflowIntegration Hook', () => {
    it('should provide integrated workflow and Claude functionality', () => {
      const { result } = renderHook(() => useClaudeWorkflowIntegration({
        enableAutoOptimization: true,
      }));

      expect(result.current.claude).toBeDefined();
      expect(result.current.workflow).toBeDefined();
      expect(result.current.isReady).toBe(true);
      expect(typeof result.current.createIntelligentWorkflow).toBe('function');
      expect(typeof result.current.executeIntelligentWorkflow).toBe('function');
    });

    it('should create intelligent workflow', async () => {
      const { result } = renderHook(() => useClaudeWorkflowIntegration());

      await act(async () => {
        const workflow = await result.current.createIntelligentWorkflow({ test: 'context' });
        
        expect(workflow).toBeDefined();
        expect(workflow.name).toBe('Claude-Generated Workflow');
        expect(workflow.description).toBe('Automatically generated workflow based on AI analysis');
        expect(workflow.steps.length).toBeGreaterThan(0);
      });
    });
  });

  describe('useClaudePerformanceIntegration Hook', () => {
    it('should provide performance and Claude integration', () => {
      const { result } = renderHook(() => useClaudePerformanceIntegration());

      expect(result.current.claude).toBeDefined();
      expect(result.current.performance).toBeDefined();
      expect(typeof result.current.analyzeAndOptimize).toBe('function');
      expect(typeof result.current.predictPerformanceIssues).toBe('function');
    });

    it('should analyze and optimize performance', async () => {
      const { result } = renderHook(() => useClaudePerformanceIntegration());

      await act(async () => {
        const result = await result.current.analyzeAndOptimize();
        
        expect(result).toHaveProperty('analysis');
        expect(result).toHaveProperty('suggestions');
        expect(result).toHaveProperty('autoApplied');
        expect(typeof result.autoApplied).toBe('number');
      });
    });
  });

  describe('WorkflowAutomationEngine', () => {
    let automationEngine: WorkflowAutomationEngine;
    let mockWorkflowEngine: ClaudeWorkflowEngine;
    let mockClaudeIntegration: any;
    let mockPerformanceMonitor: any;

    beforeEach(() => {
      mockWorkflowEngine = new ClaudeWorkflowEngine({ enableAI: false });
      mockClaudeIntegration = {
        optimizeSystem: vi.fn().mockResolvedValue({ suggestions: [] }),
        clearQueue: vi.fn(),
      };
      mockPerformanceMonitor = {
        metrics: { renderTime: 20, memoryUsage: 60 * 1024 * 1024, fps: 45 },
        alerts: [],
        getAlerts: vi.fn().mockReturnValue([]),
      };

      automationEngine = new WorkflowAutomationEngine(
        mockWorkflowEngine,
        mockClaudeIntegration,
        mockPerformanceMonitor
      );
    });

    afterEach(() => {
      automationEngine.dispose();
      mockWorkflowEngine.dispose();
    });

    it('should initialize with default rules', () => {
      const rules = automationEngine.getRules();
      
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toHaveProperty('id');
      expect(rules[0]).toHaveProperty('name');
      expect(rules[0]).toHaveProperty('triggers');
      expect(rules[0]).toHaveProperty('actions');
      expect(rules[0]).toHaveProperty('priority');
    });

    it('should create custom automation rules', () => {
      const rule = automationEngine.createRule({
        id: 'test-rule',
        name: 'Test Rule',
        description: 'Test automation rule',
        enabled: true,
        triggers: [
          {
            id: 'test-trigger',
            name: 'Test Trigger',
            description: 'Test trigger',
            type: 'performance',
            enabled: true,
            config: {},
            triggerCount: 0,
            conditions: [
              { metric: 'renderTime', operator: '>', value: 16.67 },
            ],
          },
        ],
        actions: [
          {
            id: 'test-action',
            name: 'Test Action',
            description: 'Test action',
            type: 'workflow',
            enabled: true,
            config: {},
            executionCount: 0,
            successRate: 0,
          },
        ],
        cooldownPeriod: 60000,
        priority: 'medium',
      });

      expect(rule.id).toBe('test-rule');
      expect(rule.name).toBe('Test Rule');
      expect(rule.triggers).toHaveLength(1);
      expect(rule.actions).toHaveLength(1);
    });

    it('should create scheduled tasks', () => {
      const task = automationEngine.createScheduledTask({
        id: 'test-task',
        name: 'Test Task',
        description: 'Test scheduled task',
        schedule: '0 12 * * *', // Daily at noon
        enabled: true,
        actions: [
          {
            id: 'test-action',
            name: 'Test Action',
            description: 'Test action',
            type: 'cleanup',
            enabled: true,
            config: {},
            executionCount: 0,
            successRate: 0,
          },
        ],
        timezone: 'UTC',
      });

      expect(task.id).toBe('test-task');
      expect(task.schedule).toBe('0 12 * * *');
      expect(task.enabled).toBe(true);
      expect(task.nextExecution).toBeGreaterThan(Date.now());
    });

    it('should start and stop automation', () => {
      expect(automationEngine.isAutomationActive()).toBe(false);

      automationEngine.start();
      expect(automationEngine.isAutomationActive()).toBe(true);

      automationEngine.stop();
      expect(automationEngine.isAutomationActive()).toBe(false);
    });

    it('should execute rules manually', async () => {
      const rule = automationEngine.createRule({
        id: 'manual-test-rule',
        name: 'Manual Test Rule',
        description: 'Rule for manual execution',
        enabled: true,
        triggers: [],
        actions: [
          {
            id: 'manual-action',
            name: 'Manual Action',
            description: 'Manual test action',
            type: 'notification',
            enabled: true,
            config: {},
            executionCount: 0,
            successRate: 0,
          },
        ],
        cooldownPeriod: 0,
        priority: 'low',
      });

      const result = await automationEngine.executeRuleManually(rule.id);
      
      expect(result).toBe(true);
      
      const executions = automationEngine.getExecutions({ ruleId: rule.id });
      expect(executions).toHaveLength(1);
      expect(executions[0].success).toBe(true);
    });

    it('should provide automation statistics', () => {
      const stats = automationEngine.getAutomationStats();
      
      expect(stats).toHaveProperty('totalRules');
      expect(stats).toHaveProperty('enabledRules');
      expect(stats).toHaveProperty('totalExecutions');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('averageExecutionTime');
      expect(stats).toHaveProperty('totalScheduledTasks');
      expect(stats).toHaveProperty('enabledScheduledTasks');
      
      expect(typeof stats.totalRules).toBe('number');
      expect(typeof stats.successRate).toBe('number');
    });
  });

  describe('useWorkflowAutomation Hook', () => {
    it('should provide workflow automation functionality', () => {
      const mockWorkflowEngine = new ClaudeWorkflowEngine({ enableAI: false });
      const mockClaudeIntegration = {
        optimizeSystem: vi.fn(),
        clearQueue: vi.fn(),
      };
      const mockPerformanceMonitor = {
        metrics: {},
        alerts: [],
        getAlerts: vi.fn(),
      };

      const { result } = renderHook(() => 
        useWorkflowAutomation(mockWorkflowEngine, mockClaudeIntegration, mockPerformanceMonitor)
      );

      expect(result.current.engine).toBeDefined();
      expect(result.current.isRunning).toBe(false);
      expect(result.current.rules).toBeDefined();
      expect(result.current.scheduledTasks).toBeDefined();
      expect(result.current.executions).toBeDefined();
      expect(result.current.stats).toBeDefined();
      expect(typeof result.current.startAutomation).toBe('function');
      expect(typeof result.current.stopAutomation).toBe('function');
      expect(typeof result.current.createRule).toBe('function');
      expect(typeof result.current.executeRuleManually).toBe('function');
    });
  });

  describe('PerformanceOptimizationEngine', () => {
    let optimizationEngine: PerformanceOptimizationEngine;

    beforeEach(() => {
      optimizationEngine = new PerformanceOptimizationEngine();
    });

    afterEach(() => {
      optimizationEngine.dispose();
    });

    it('should initialize with default strategies', () => {
      const strategies = optimizationEngine.getStrategies();
      
      expect(strategies.length).toBeGreaterThan(0);
      expect(strategies[0]).toHaveProperty('id');
      expect(strategies[0]).toHaveProperty('name');
      expect(strategies[0]).toHaveProperty('type');
      expect(strategies[0]).toHaveProperty('priority');
      expect(strategies[0]).toHaveProperty('conditions');
      expect(strategies[0]).toHaveProperty('impact');
      expect(strategies[0]).toHaveProperty('cost');
    });

    it('should add custom optimization strategies', () => {
      const strategy = optimizationEngine.addStrategy({
        id: 'test-strategy',
        name: 'Test Strategy',
        description: 'Test optimization strategy',
        type: 'render',
        priority: 'high',
        enabled: true,
        config: { threshold: 20 },
        conditions: [
          { metric: 'renderTime', operator: '>', value: 20 },
        ],
        impact: {
          renderTime: 25,
          memoryUsage: 5,
          cpuUsage: 15,
          networkRequests: 0,
          confidence: 0.80,
        },
        cost: {
          implementationTime: 30,
          complexity: 'medium',
          risk: 'low',
          maintenanceOverhead: 'low',
        },
      });

      expect(strategy.id).toBe('test-strategy');
      expect(strategy.type).toBe('render');
      expect(strategy.priority).toBe('high');
    });

    it('should identify applicable strategies', () => {
      const testMetrics = {
        renderTime: 25, // Exceeds threshold
        memoryUsage: 40 * 1024 * 1024,
        fps: 60,
        componentCount: 5,
        skinSwitchTime: 100,
        validationTime: 50,
        hotReloadTime: 200,
        apiCallTime: 500,
        errorCount: 0,
        warningCount: 2,
        layoutShift: 0,
        networkLatency: 100,
        cpuUsage: 30,
      };

      const applicableStrategies = optimizationEngine.identifyApplicableStrategies(testMetrics as any);
      
      expect(applicableStrategies.length).toBeGreaterThan(0);
      expect(applicableStrategies[0].enabled).toBe(true);
    });

    it('should execute optimizations', async () => {
      const testMetrics = {
        renderTime: 25,
        memoryUsage: 60 * 1024 * 1024,
        fps: 45,
        componentCount: 15,
        skinSwitchTime: 200,
        validationTime: 150,
        hotReloadTime: 300,
        apiCallTime: 1200,
        errorCount: 3,
        warningCount: 5,
        layoutShift: 0.1,
        networkLatency: 600,
        cpuUsage: 40,
      };

      const results = await optimizationEngine.optimize(testMetrics as any);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('strategyId');
      expect(results[0]).toHaveProperty('beforeMetrics');
      expect(results[0]).toHaveProperty('afterMetrics');
      expect(results[0]).toHaveProperty('improvements');
      expect(results[0]).toHaveProperty('success');
      expect(results[0]).toHaveProperty('duration');
    });

    it('should predict performance metrics', async () => {
      const predictions = await optimizationEngine.predictPerformance(30); // 30 minutes
      
      expect(Array.isArray(predictions)).toBe(true);
      expect(predictions.length).toBeGreaterThan(0);
      expect(predictions[0]).toHaveProperty('metric');
      expect(predictions[0]).toHaveProperty('currentValue');
      expect(predictions[0]).toHaveProperty('predictedValue');
      expect(predictions[0]).toHaveProperty('confidence');
      expect(predictions[0]).toHaveProperty('timeHorizon');
    });

    it('should manage cache operations', () => {
      const testData = { key: 'value', timestamp: Date.now() };
      
      // Set cache
      optimizationEngine.setCache('test-key', testData, 60000); // 1 minute TTL
      
      // Get cache
      const cached = optimizationEngine.getCache('test-key');
      expect(cached).toEqual(testData);
      
      // Get cache stats
      const stats = optimizationEngine.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.totalHits).toBe(1);
      expect(stats.hitRate).toBe(1); // 1 hit out of 1 request
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should provide optimization statistics', () => {
      const stats = optimizationEngine.getOptimizationStats();
      
      expect(stats).toHaveProperty('totalOptimizations');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('averageImprovement');
      expect(stats).toHaveProperty('totalTimeSaved');
      expect(stats).toHaveProperty('mostEffectiveStrategy');
      expect(stats).toHaveProperty('cacheHitRate');
      
      expect(typeof stats.totalOptimizations).toBe('number');
      expect(typeof stats.successRate).toBe('number');
    });
  });

  describe('usePerformanceOptimization Hook', () => {
    it('should provide performance optimization functionality', () => {
      const { result } = renderHook(() => usePerformanceOptimization());

      expect(result.current.engine).toBeDefined();
      expect(result.current.isOptimizing).toBe(false);
      expect(result.current.strategies).toBeDefined();
      expect(result.current.results).toBeDefined();
      expect(result.current.predictions).toBeDefined();
      expect(result.current.stats).toBeDefined();
      expect(result.current.queueStatus).toBeDefined();
      expect(typeof result.current.optimize).toBe('function');
      expect(typeof result.current.predictPerformance).toBe('function');
      expect(typeof result.current.addStrategy).toBe('function');
      expect(typeof result.current.updateStrategy).toBe('function');
    });

    it('should execute optimizations', async () => {
      const { result } = renderHook(() => usePerformanceOptimization());

      await act(async () => {
        const optimizationResults = await result.current.optimize();
        
        expect(Array.isArray(optimizationResults)).toBe(true);
        expect(optimizationResults.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should predict performance', async () => {
      const { result } = renderHook(() => usePerformanceOptimization());

      await act(async () => {
        const predictions = await result.current.predictPerformance(15);
        
        expect(Array.isArray(predictions)).toBe(true);
        expect(predictions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should integrate workflow engine with Claude integration', async () => {
      const { result: workflowResult } = renderHook(() => useClaudeWorkflowEngine({
        enableAI: false,
      }));
      
      const { result: claudeResult } = renderHook(() => useClaudeIntegration({
        enableAutoOptimization: true,
      }));

      await act(async () => {
        // Create workflow with Claude suggestions
        const workflow = workflowResult.current.createWorkflow([
          { name: 'AI Analysis', type: 'analysis' as const, description: 'AI-powered analysis' },
        ]);

        expect(workflow).toBeDefined();
        expect(workflow.steps[0].name).toBe('AI Analysis');
      });
    });

    it('should integrate performance monitoring with optimization', async () => {
      const { result: monitorResult } = renderHook(() => usePerformanceMonitor({
        autoStart: true,
      }));
      
      const { result: optimizationResult } = renderHook(() => usePerformanceOptimization());

      await act(async () => {
        // Wait for some monitoring data
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const optimizationResults = await optimizationResult.current.optimize();
        
        expect(optimizationResults).toBeDefined();
        expect(Array.isArray(optimizationResults)).toBe(true);
      });
    });

    it('should integrate automation with performance monitoring', async () => {
      const mockWorkflowEngine = new ClaudeWorkflowEngine({ enableAI: false });
      const mockClaudeIntegration = {
        optimizeSystem: vi.fn().mockResolvedValue({ suggestions: [] }),
        clearQueue: vi.fn(),
      };
      const mockPerformanceMonitor = {
        metrics: { renderTime: 25, memoryUsage: 60 * 1024 * 1024, fps: 45 },
        alerts: [],
        getAlerts: vi.fn().mockReturnValue([]),
      };

      const { result } = renderHook(() => 
        useWorkflowAutomation(mockWorkflowEngine, mockClaudeIntegration, mockPerformanceMonitor)
      );

      await act(async () => {
        result.current.startAutomation();
        
        expect(result.current.isRunning).toBe(true);
        
        // Create a rule that should trigger
        const rule = result.current.createRule({
          id: 'integration-test-rule',
          name: 'Integration Test Rule',
          description: 'Rule for integration testing',
          enabled: true,
          triggers: [
            {
              id: 'integration-trigger',
              name: 'Integration Trigger',
              description: 'Trigger for integration test',
              type: 'performance',
              enabled: true,
              config: {},
              triggerCount: 0,
              conditions: [
                { metric: 'renderTime', operator: '>', value: 20 },
              ],
            },
          ],
          actions: [
            {
              id: 'integration-action',
              name: 'Integration Action',
              description: 'Action for integration test',
              type: 'optimization',
              enabled: true,
              config: {},
              executionCount: 0,
              successRate: 0,
            },
          ],
          cooldownPeriod: 0,
          priority: 'medium',
        });

        expect(rule).toBeDefined();
        expect(rule.id).toBe('integration-test-rule');
        
        result.current.stopAutomation();
        expect(result.current.isRunning).toBe(false);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle workflow engine errors gracefully', async () => {
      const workflowEngine = new ClaudeWorkflowEngine({ enableAI: false });
      
      // Try to execute non-existent workflow
      await expect(workflowEngine.executeWorkflow('non-existent')).rejects.toThrow();
      
      workflowEngine.dispose();
    });

    it('should handle Claude API failures gracefully', async () => {
      const { result } = renderHook(() => useClaudeIntegration());

      // Mock a failed request
      await act(async () => {
        // This should handle failures gracefully and fall back to local recommendations
        const response = await result.current.makeRequest('suggestion', 'Test prompt');
        
        expect(response).toBeDefined();
        expect(response.suggestions).toBeDefined();
      });
    });

    it('should handle performance monitoring edge cases', () => {
      const performanceMonitor = new PerformanceMonitor();
      
      // Test with no monitoring data
      expect(() => performanceMonitor.generateReport(1000)).toThrow('No data available');
      
      performanceMonitor.dispose();
    });

    it('should handle optimization engine edge cases', async () => {
      const optimizationEngine = new PerformanceOptimizationEngine();
      
      // Test with no applicable strategies
      const goodMetrics = {
        renderTime: 10,
        memoryUsage: 30 * 1024 * 1024,
        fps: 60,
        componentCount: 5,
        skinSwitchTime: 50,
        validationTime: 25,
        hotReloadTime: 100,
        apiCallTime: 200,
        errorCount: 0,
        warningCount: 0,
        layoutShift: 0,
        networkLatency: 50,
        cpuUsage: 20,
      };

      const results = await optimizationEngine.optimize(goodMetrics as any);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      optimizationEngine.dispose();
    });

    it('should handle concurrent optimization attempts', async () => {
      const optimizationEngine = new PerformanceOptimizationEngine();
      
      const badMetrics = {
        renderTime: 30,
        memoryUsage: 80 * 1024 * 1024,
        fps: 30,
        componentCount: 20,
        skinSwitchTime: 300,
        validationTime: 200,
        hotReloadTime: 400,
        apiCallTime: 1500,
        errorCount: 5,
        warningCount: 10,
        layoutShift: 0.2,
        networkLatency: 800,
        cpuUsage: 60,
      };

      // Start first optimization
      const firstOptimization = optimizationEngine.optimize(badMetrics as any);
      
      // Try to start second optimization - should fail
      await expect(optimizationEngine.optimize(badMetrics as any)).rejects.toThrow('Optimization already in progress');
      
      // Wait for first optimization to complete
      await firstOptimization;
      
      optimizationEngine.dispose();
    });
  });
});
