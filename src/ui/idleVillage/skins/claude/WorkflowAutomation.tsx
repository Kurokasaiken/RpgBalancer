/**
 * TS-005: Workflow Automation Utilities
 * 
 * Advanced workflow automation system for the TS-Series skin system with
 * scheduled tasks, triggers, and intelligent automation capabilities.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ClaudeWorkflowEngine, type WorkflowExecutionPlan, type WorkflowStep } from './ClaudeWorkflowEngine';
import { useClaudeIntegration } from './useClaudeIntegration';
import { usePerformanceMonitor } from './PerformanceMonitor';

// ============================================================================
// TYPES
// ============================================================================

// Define types locally to avoid import issues
type ComponentId = string;
type MotionLevel = 'minimal' | 'reduced' | 'full';
type StyleLabPillar = 'frontier' | 'wilderness' | 'empire';
type SkinPresetId = 'minimal-frontier' | 'minimal-wilderness' | 'minimal-empire' | 'wanderlust' | 'arcane-tech' | 'gilded-observatory';

interface AutomationTrigger {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'time' | 'event' | 'manual' | 'threshold' | 'schedule';
  enabled: boolean;
  config: Record<string, unknown>;
  lastTriggered?: number;
  triggerCount: number;
  conditions: TriggerCondition[];
}

interface TriggerCondition {
  metric?: string;
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=';
  value: number;
  timeWindow?: number; // milliseconds
}

interface AutomationAction {
  id: string;
  name: string;
  description: string;
  type: 'workflow' | 'optimization' | 'notification' | 'cleanup' | 'validation';
  config: Record<string, unknown>;
  enabled: boolean;
  executionCount: number;
  lastExecuted?: number;
  successRate: number;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: AutomationTrigger[];
  actions: AutomationAction[];
  cooldownPeriod: number; // milliseconds
  lastExecuted?: number;
  executionHistory: AutomationExecution[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface AutomationExecution {
  id: string;
  ruleId: string;
  timestamp: number;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  results: ActionResult[];
  duration: number;
  success: boolean;
  error?: string;
}

interface ActionResult {
  actionId: string;
  success: boolean;
  duration: number;
  result?: any;
  error?: string;
}

interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  schedule: string; // Cron-like expression
  enabled: boolean;
  workflowId?: string;
  actions: AutomationAction[];
  nextExecution: number;
  lastExecution?: number;
  executionCount: number;
  timezone: string;
}

// ============================================================================
// WORKFLOW AUTOMATION ENGINE
// ============================================================================

export class WorkflowAutomationEngine {
  private rules: Map<string, AutomationRule> = new Map();
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private executions: AutomationExecution[] = [];
  private isRunning = false;
  private intervals: Map<string, number> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private workflowEngine: ClaudeWorkflowEngine;
  private claudeIntegration: ReturnType<typeof useClaudeIntegration>;
  private performanceMonitor: ReturnType<typeof usePerformanceMonitor>;

  constructor(
    workflowEngine: ClaudeWorkflowEngine,
    claudeIntegration: ReturnType<typeof useClaudeIntegration>,
    performanceMonitor: ReturnType<typeof usePerformanceMonitor>
  ) {
    this.workflowEngine = workflowEngine;
    this.claudeIntegration = claudeIntegration;
    this.performanceMonitor = performanceMonitor;
    this.setupDefaultRules();
  }

  private setupDefaultRules(): void {
    // Performance-based auto-optimization rule
    this.createRule({
      id: 'auto-performance-optimization',
      name: 'Auto Performance Optimization',
      description: 'Automatically optimize when performance degrades',
      enabled: true,
      triggers: [
        {
          id: 'performance-degradation',
          name: 'Performance Degradation Trigger',
          description: 'Triggers when performance metrics exceed thresholds',
          type: 'performance',
          enabled: true,
          config: { threshold: 0.7 }, // 70% of threshold
          triggerCount: 0,
          conditions: [
            { metric: 'renderTime', operator: '>', value: 16.67 },
            { metric: 'memoryUsage', operator: '>', value: 50 * 1024 * 1024 },
            { metric: 'fps', operator: '<', value: 45 },
          ],
        },
      ],
      actions: [
        {
          id: 'auto-optimize',
          name: 'Auto Optimize',
          description: 'Execute performance optimization workflow',
          type: 'workflow',
          enabled: true,
          config: { workflowType: 'optimization' },
          executionCount: 0,
          successRate: 0,
        },
        {
          id: 'notify-performance',
          name: 'Performance Notification',
          description: 'Send performance degradation notification',
          type: 'notification',
          enabled: true,
          config: { level: 'warning' },
          executionCount: 0,
          successRate: 0,
        },
      ],
      cooldownPeriod: 300000, // 5 minutes
      priority: 'high',
    });

    // Scheduled cleanup rule
    this.createScheduledTask({
      id: 'daily-cleanup',
      name: 'Daily Cleanup',
      description: 'Perform daily system cleanup and maintenance',
      schedule: '0 2 * * *', // 2 AM daily
      enabled: true,
      actions: [
        {
          id: 'cleanup-cache',
          name: 'Cache Cleanup',
          description: 'Clear expired cache entries',
          type: 'cleanup',
          enabled: true,
          config: { type: 'cache' },
          executionCount: 0,
          successRate: 0,
        },
        {
          id: 'cleanup-alerts',
          name: 'Alert Cleanup',
          description: 'Clear old resolved alerts',
          type: 'cleanup',
          enabled: true,
          config: { type: 'alerts', olderThan: 86400000 }, // 24 hours
          executionCount: 0,
          successRate: 0,
        },
      ],
      timezone: 'UTC',
    });
  }

  // ============================================================================
  // RULE MANAGEMENT
  // ============================================================================

  public createRule(rule: Omit<AutomationRule, 'executionHistory'>): AutomationRule {
    const automationRule: AutomationRule = {
      ...rule,
      executionHistory: [],
    };

    this.rules.set(rule.id, automationRule);
    this.emit('rule-created', automationRule);
    return automationRule;
  }

  public updateRule(ruleId: string, updates: Partial<AutomationRule>): AutomationRule | null {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    const updatedRule = { ...rule, ...updates };
    this.rules.set(ruleId, updatedRule);
    this.emit('rule-updated', updatedRule);
    return updatedRule;
  }

  public deleteRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      this.emit('rule-deleted', { ruleId });
    }
    return deleted;
  }

  public getRules(filter?: { enabled?: boolean; priority?: AutomationRule['priority'] }): AutomationRule[] {
    let rules = Array.from(this.rules.values());

    if (filter?.enabled !== undefined) {
      rules = rules.filter(r => r.enabled === filter.enabled);
    }

    if (filter?.priority) {
      rules = rules.filter(r => r.priority === filter.priority);
    }

    return rules.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // ============================================================================
  // SCHEDULED TASK MANAGEMENT
  // ============================================================================

  public createScheduledTask(task: Omit<ScheduledTask, 'nextExecution' | 'executionCount'>): ScheduledTask {
    const scheduledTask: ScheduledTask = {
      ...task,
      nextExecution: this.calculateNextExecution(task.schedule),
      executionCount: 0,
    };

    this.scheduledTasks.set(task.id, scheduledTask);
    this.emit('scheduled-task-created', scheduledTask);
    return scheduledTask;
  }

  private calculateNextExecution(cronExpression: string): number {
    // Simple cron parser - in production, use a proper cron library
    const now = Date.now();
    const [minute, hour, day, month, dayOfWeek] = cronExpression.split(' ').map(Number);
    
    const next = new Date(now);
    next.setMinutes(minute || 0);
    next.setHours(hour || 0);
    
    // If the time has passed today, schedule for tomorrow
    if (next.getTime() <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    return next.getTime();
  }

  public getScheduledTasks(filter?: { enabled?: boolean }): ScheduledTask[] {
    let tasks = Array.from(this.scheduledTasks.values());

    if (filter?.enabled !== undefined) {
      tasks = tasks.filter(t => t.enabled === filter.enabled);
    }

    return tasks.sort((a, b) => a.nextExecution - b.nextExecution);
  }

  // ============================================================================
  // AUTOMATION EXECUTION
  // ============================================================================

  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.setupPerformanceMonitoring();
    this.setupScheduledTaskMonitoring();
    this.emit('automation-started', {});
  }

  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.emit('automation-stopped', {});
  }

  private setupPerformanceMonitoring(): void {
    const interval = setInterval(() => {
      this.checkPerformanceTriggers();
    }, 5000); // Check every 5 seconds

    this.intervals.set('performance-monitoring', interval);
  }

  private setupScheduledTaskMonitoring(): void {
    const interval = setInterval(() => {
      this.checkScheduledTasks();
    }, 60000); // Check every minute

    this.intervals.set('scheduled-task-monitoring', interval);
  }

  private async checkPerformanceTriggers(): Promise<void> {
    if (!this.isRunning) return;

    const metrics = this.performanceMonitor.metrics;
    const rules = this.getRules({ enabled: true });

    for (const rule of rules) {
      for (const trigger of rule.triggers) {
        if (trigger.type === 'performance' && this.shouldTrigger(trigger, metrics)) {
          await this.executeRule(rule, trigger);
        }
      }
    }
  }

  private shouldTrigger(trigger: AutomationTrigger, metrics: any): boolean {
    if (!trigger.enabled) return false;

    // Check cooldown period
    if (trigger.lastTriggered && Date.now() - trigger.lastTriggered < 60000) {
      return false; // 1 minute cooldown between triggers
    }

    // Check conditions
    return trigger.conditions.every(condition => {
      if (!condition.metric || !(condition.metric in metrics)) return true;

      const metricValue = metrics[condition.metric];
      switch (condition.operator) {
        case '>': return metricValue > condition.value;
        case '<': return metricValue < condition.value;
        case '=': return metricValue === condition.value;
        case '>=': return metricValue >= condition.value;
        case '<=': return metricValue <= condition.value;
        case '!=': return metricValue !== condition.value;
        default: return false;
      }
    });
  }

  private async checkScheduledTasks(): Promise<void> {
    if (!this.isRunning) return;

    const now = Date.now();
    const tasks = this.getScheduledTasks({ enabled: true });

    for (const task of tasks) {
      if (now >= task.nextExecution) {
        await this.executeScheduledTask(task);
        task.lastExecution = now;
        task.executionCount++;
        task.nextExecution = this.calculateNextExecution(task.schedule);
        this.emit('scheduled-task-executed', task);
      }
    }
  }

  private async executeRule(rule: AutomationRule, trigger: AutomationTrigger): Promise<void> {
    // Check rule cooldown
    if (rule.lastExecuted && Date.now() - rule.lastExecuted < rule.cooldownPeriod) {
      return;
    }

    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      const results: ActionResult[] = [];

      for (const action of rule.actions) {
        if (!action.enabled) continue;

        const actionResult = await this.executeAction(action);
        results.push(actionResult);

        // Update action stats
        action.executionCount++;
        action.lastExecuted = Date.now();
        const successRate = action.executionCount > 0 ? 
          results.filter(r => r.actionId === action.id && r.success).length / action.executionCount : 0;
        action.successRate = successRate;
      }

      const duration = Date.now() - startTime;
      const success = results.every(r => r.success);

      const execution: AutomationExecution = {
        id: executionId,
        ruleId: rule.id,
        timestamp: startTime,
        trigger,
        actions: rule.actions,
        results,
        duration,
        success,
      };

      this.executions.push(execution);
      rule.executionHistory.push(execution);
      rule.lastExecuted = Date.now();
      trigger.lastTriggered = Date.now();
      trigger.triggerCount++;

      // Keep only last 100 executions per rule
      if (rule.executionHistory.length > 100) {
        rule.executionHistory = rule.executionHistory.slice(-100);
      }

      // Keep only last 1000 executions total
      if (this.executions.length > 1000) {
        this.executions = this.executions.slice(-1000);
      }

      this.emit('rule-executed', { rule, execution, success });

    } catch (error) {
      const execution: AutomationExecution = {
        id: executionId,
        ruleId: rule.id,
        timestamp: startTime,
        trigger,
        actions: rule.actions,
        results: [],
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.executions.push(execution);
      rule.executionHistory.push(execution);
      this.emit('rule-execution-failed', { rule, execution, error });
    }
  }

  private async executeScheduledTask(task: ScheduledTask): Promise<void> {
    const startTime = Date.now();

    try {
      for (const action of task.actions) {
        if (!action.enabled) continue;

        await this.executeAction(action);
        action.executionCount++;
        action.lastExecuted = Date.now();
      }

      this.emit('scheduled-task-completed', { task, duration: Date.now() - startTime });
    } catch (error) {
      this.emit('scheduled-task-failed', { task, error });
    }
  }

  private async executeAction(action: AutomationAction): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      let result: any;

      switch (action.type) {
        case 'workflow':
          result = await this.executeWorkflowAction(action);
          break;
        case 'optimization':
          result = await this.executeOptimizationAction(action);
          break;
        case 'notification':
          result = await this.executeNotificationAction(action);
          break;
        case 'cleanup':
          result = await this.executeCleanupAction(action);
          break;
        case 'validation':
          result = await this.executeValidationAction(action);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      return {
        actionId: action.id,
        success: true,
        duration: Date.now() - startTime,
        result,
      };
    } catch (error) {
      return {
        actionId: action.id,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async executeWorkflowAction(action: AutomationAction): Promise<any> {
    const workflowType = action.config.workflowType as string;
    
    // Create workflow based on type
    const steps = this.getWorkflowSteps(workflowType);
    const workflow = this.workflowEngine.createWorkflowPlan(steps, {
      name: `Automated ${workflowType} Workflow`,
      description: `Automatically generated ${workflowType} workflow`,
      autoExecute: true,
      priority: 'medium',
    });

    return this.workflowEngine.executeWorkflow(workflow.id);
  }

  private getWorkflowSteps(type: string): Partial<WorkflowStep>[] {
    const stepTemplates = {
      optimization: [
        { name: 'Performance Analysis', type: 'analysis' as const, description: 'Analyze current performance' },
        { name: 'Apply Optimizations', type: 'optimization' as const, description: 'Apply performance optimizations' },
        { name: 'Validate Results', type: 'validation' as const, description: 'Validate optimization results' },
      ],
      validation: [
        { name: 'System Validation', type: 'validation' as const, description: 'Validate system configuration' },
        { name: 'Component Validation', type: 'validation' as const, description: 'Validate component bindings' },
        { name: 'Generate Report', type: 'analysis' as const, description: 'Generate validation report' },
      ],
      cleanup: [
        { name: 'Cache Cleanup', type: 'cleanup' as const, description: 'Clean up expired cache entries' },
        { name: 'Alert Cleanup', type: 'cleanup' as const, description: 'Clean up old alerts' },
        { name: 'Memory Cleanup', type: 'cleanup' as const, description: 'Free up memory' },
      ],
    };

    return stepTemplates[type as keyof typeof stepTemplates] || stepTemplates.optimization;
  }

  private async executeOptimizationAction(action: AutomationAction): Promise<any> {
    // Use Claude integration for intelligent optimization
    const metrics = this.performanceMonitor.metrics;
    return this.claudeIntegration.optimizeSystem(Object.keys(metrics));
  }

  private async executeNotificationAction(action: AutomationAction): Promise<any> {
    const level = action.config.level as string || 'info';
    const message = `Automation Alert: ${action.name} - ${action.description}`;
    
    // In a real implementation, this would send to a notification system
    console.log(`[${level.toUpperCase()}] ${message}`);
    
    return { message, level, timestamp: Date.now() };
  }

  private async executeCleanupAction(action: AutomationAction): Promise<any> {
    const cleanupType = action.config.type as string;
    
    switch (cleanupType) {
      case 'cache':
        // Clear cache
        return this.claudeIntegration.clearQueue();
      case 'alerts':
        // Clear old alerts
        const olderThan = action.config.olderThan as number || 86400000;
        return this.performanceMonitor.alerts.filter(a => Date.now() - a.timestamp < olderThan);
      case 'memory':
        // Trigger garbage collection if available
        if ('gc' in window) {
          (window as any).gc();
        }
        return { memoryFreed: true };
      default:
        return { cleaned: true };
    }
  }

  private async executeValidationAction(action: AutomationAction): Promise<any> {
    // Use Claude integration for validation
    const config = this.workflowEngine.getConfig();
    return this.claudeIntegration.validateConfiguration(config);
  }

  // ============================================================================
  // MANUAL EXECUTION
  // ============================================================================

  public async executeRuleManually(ruleId: string): Promise<boolean> {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    const manualTrigger: AutomationTrigger = {
      id: 'manual-trigger',
      name: 'Manual Trigger',
      description: 'Manually triggered execution',
      type: 'manual',
      enabled: true,
      config: {},
      triggerCount: 0,
      conditions: [],
    };

    await this.executeRule(rule, manualTrigger);
    return true;
  }

  public async executeScheduledTaskManually(taskId: string): Promise<boolean> {
    const task = this.scheduledTasks.get(taskId);
    if (!task) return false;

    await this.executeScheduledTask(task);
    return true;
  }

  // ============================================================================
  // ANALYTICS AND REPORTING
  // ============================================================================

  public getExecutions(filter?: { ruleId?: string; success?: boolean; timeRange?: { start: number; end: number } }): AutomationExecution[] {
    let executions = [...this.executions];

    if (filter?.ruleId) {
      executions = executions.filter(e => e.ruleId === filter.ruleId);
    }

    if (filter?.success !== undefined) {
      executions = executions.filter(e => e.success === filter.success);
    }

    if (filter?.timeRange) {
      executions = executions.filter(e => 
        e.timestamp >= filter.timeRange!.start && e.timestamp <= filter.timeRange!.end
      );
    }

    return executions.sort((a, b) => b.timestamp - a.timestamp);
  }

  public getAutomationStats(): {
    totalRules: number;
    enabledRules: number;
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    totalScheduledTasks: number;
    enabledScheduledTasks: number;
  } {
    const rules = Array.from(this.rules.values());
    const executions = this.getExecutions();
    const tasks = Array.from(this.scheduledTasks.values());

    const successRate = executions.length > 0 ? 
      executions.filter(e => e.success).length / executions.length : 0;

    const averageExecutionTime = executions.length > 0 ?
      executions.reduce((sum, e) => sum + e.duration, 0) / executions.length : 0;

    return {
      totalRules: rules.length,
      enabledRules: rules.filter(r => r.enabled).length,
      totalExecutions: executions.length,
      successRate,
      averageExecutionTime,
      totalScheduledTasks: tasks.length,
      enabledScheduledTasks: tasks.filter(t => t.enabled).length,
    };
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  public on(event: string, listener: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  public off(event: string, listener: (data: any) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Workflow automation event listener error:', error);
        }
      });
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  public isAutomationActive(): boolean {
    return this.isRunning;
  }

  public reset(): void {
    this.executions = [];
    this.rules.forEach(rule => {
      rule.executionHistory = [];
      rule.lastExecuted = undefined;
    });
    this.scheduledTasks.forEach(task => {
      task.executionCount = 0;
      task.lastExecution = undefined;
    });
    this.emit('reset', {});
  }

  public dispose(): void {
    this.stop();
    this.rules.clear();
    this.scheduledTasks.clear();
    this.executions = [];
    this.listeners.clear();
  }
}

// ============================================================================
// REACT HOOK
// ============================================================================

export const useWorkflowAutomation = (
  workflowEngine: ClaudeWorkflowEngine,
  claudeIntegration: ReturnType<typeof useClaudeIntegration>,
  performanceMonitor: ReturnType<typeof usePerformanceMonitor>
) => {
  const engineRef = useRef<WorkflowAutomationEngine | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [stats, setStats] = useState<ReturnType<WorkflowAutomationEngine['getAutomationStats']>>();

  if (!engineRef.current) {
    engineRef.current = new WorkflowAutomationEngine(workflowEngine, claudeIntegration, performanceMonitor);
    
    // Setup event listeners
    engineRef.current.on('rule-created', (rule) => {
      setRules(prev => [...prev, rule]);
    });

    engineRef.current.on('rule-updated', (rule) => {
      setRules(prev => prev.map(r => r.id === rule.id ? rule : r));
    });

    engineRef.current.on('rule-deleted', ({ ruleId }) => {
      setRules(prev => prev.filter(r => r.id !== ruleId));
    });

    engineRef.current.on('rule-executed', ({ execution }) => {
      setExecutions(prev => [execution, ...prev.slice(0, 999)]); // Keep last 1000
    });

    engineRef.current.on('scheduled-task-executed', (task) => {
      setScheduledTasks(prev => prev.map(t => t.id === task.id ? task : t));
    });
  }

  const engine = engineRef.current;

  const startAutomation = useCallback(() => {
    engine.start();
    setIsRunning(true);
  }, [engine]);

  const stopAutomation = useCallback(() => {
    engine.stop();
    setIsRunning(false);
  }, [engine]);

  const createRule = useCallback((rule: Omit<AutomationRule, 'executionHistory'>) => {
    return engine.createRule(rule);
  }, [engine]);

  const updateRule = useCallback((ruleId: string, updates: Partial<AutomationRule>) => {
    return engine.updateRule(ruleId, updates);
  }, [engine]);

  const deleteRule = useCallback((ruleId: string) => {
    return engine.deleteRule(ruleId);
  }, [engine]);

  const executeRuleManually = useCallback((ruleId: string) => {
    return engine.executeRuleManually(ruleId);
  }, [engine]);

  const createScheduledTask = useCallback((task: Omit<ScheduledTask, 'nextExecution' | 'executionCount'>) => {
    const createdTask = engine.createScheduledTask(task);
    setScheduledTasks(prev => [...prev, createdTask]);
    return createdTask;
  }, [engine]);

  const executeScheduledTaskManually = useCallback((taskId: string) => {
    return engine.executeScheduledTaskManually(taskId);
  }, [engine]);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(engine.getAutomationStats());
    }, 5000);

    return () => clearInterval(interval);
  }, [engine]);

  return {
    engine,
    isRunning,
    rules,
    scheduledTasks,
    executions,
    stats,
    startAutomation,
    stopAutomation,
    createRule,
    updateRule,
    deleteRule,
    executeRuleManually,
    createScheduledTask,
    executeScheduledTaskManually,
    reset: engine.reset.bind(engine),
  };
};
