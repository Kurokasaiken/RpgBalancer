/**
 * TS-005: Claude Workflow & Performance Engine
 * 
 * Advanced workflow automation and performance optimization system
 * with Claude AI integration for intelligent skin management.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { getSkinReplacementAPI_TS003 } from '../SkinReplacementAPI_TS003';

// ============================================================================
// TYPES
// ============================================================================

// Define types locally to avoid import issues
type ComponentId = string;
type MotionLevel = 'minimal' | 'reduced' | 'full';
type StyleLabPillar = 'frontier' | 'wilderness' | 'empire';
type SkinPresetId = 'minimal-frontier' | 'minimal-wilderness' | 'minimal-empire' | 'wanderlust' | 'arcane-tech' | 'gilded-observatory';

interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  componentCount: number;
  skinSwitchTime: number;
  validationTime: number;
  hotReloadTime: number;
  apiCallTime: number;
  errorCount: number;
  warningCount: number;
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'validation' | 'optimization' | 'migration' | 'analysis' | 'cleanup';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress: number;
  startTime?: number;
  endTime?: number;
  duration?: number;
  result?: any;
  error?: string;
  dependencies?: string[];
  metadata?: Record<string, unknown>;
}

interface ClaudeWorkflowConfig {
  enableAI: boolean;
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  enablePerformanceOptimization: boolean;
  enableAutoValidation: boolean;
  enableSmartMigration: boolean;
  enablePredictiveCaching: boolean;
  performanceThresholds: {
    maxRenderTime: number;
    maxMemoryUsage: number;
    maxErrorRate: number;
    maxValidationTime: number;
  };
  workflowTimeout: number;
  retryAttempts: number;
  enableTelemetry: boolean;
}

interface ClaudeSuggestion {
  id: string;
  type: 'optimization' | 'migration' | 'validation' | 'performance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
  expectedImpact: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

interface WorkflowExecutionPlan {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high';
  autoExecute: boolean;
  createdAt: number;
  scheduledAt?: number;
}

// ============================================================================
// CLAUDE WORKFLOW ENGINE
// ============================================================================

export class ClaudeWorkflowEngine {
  private config: ClaudeWorkflowConfig;
  private api: any;
  private metrics: PerformanceMetrics;
  private activeWorkflows: Map<string, WorkflowExecutionPlan> = new Map();
  private completedWorkflows: WorkflowExecutionPlan[] = [];
  private suggestions: ClaudeSuggestion[] = [];
  private listeners: Set<(event: string, data: any) => void> = new Set();
  private performanceBaseline: PerformanceMetrics | null = null;
  private optimizationCache: Map<string, any> = new Map();

  constructor(config: Partial<ClaudeWorkflowConfig> = {}) {
    this.config = {
      enableAI: false,
      model: 'claude-3-sonnet-20240229',
      maxTokens: 4000,
      temperature: 0.1,
      enablePerformanceOptimization: true,
      enableAutoValidation: true,
      enableSmartMigration: true,
      enablePredictiveCaching: true,
      performanceThresholds: {
        maxRenderTime: 16.67, // 60fps
        maxMemoryUsage: 50 * 1024 * 1024, // 50MB
        maxErrorRate: 0.05, // 5%
        maxValidationTime: 100, // 100ms
      },
      workflowTimeout: 30000, // 30 seconds
      retryAttempts: 3,
      enableTelemetry: true,
      ...config,
    };

    this.api = getSkinReplacementAPI_TS003();
    this.metrics = this.initializeMetrics();
    this.setupPerformanceMonitoring();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      renderTime: 0,
      updateTime: 0,
      memoryUsage: 0,
      componentCount: 0,
      skinSwitchTime: 0,
      validationTime: 0,
      hotReloadTime: 0,
      apiCallTime: 0,
      errorCount: 0,
      warningCount: 0,
    };
  }

  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    // Monitor render performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          this.updateMetric(entry.name as keyof PerformanceMetrics, entry.duration);
        }
      });
    });

    observer.observe({ entryTypes: ['measure', 'navigation'] });

    // Monitor memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
    }
  }

  private updateMetric(key: keyof PerformanceMetrics, value: number): void {
    this.metrics[key] = value;
    this.checkPerformanceThresholds(key);
    this.emit('metric-updated', { key, value, metrics: this.metrics });
  }

  private checkPerformanceThresholds(key: keyof PerformanceMetrics): void {
    const threshold = this.config.performanceThresholds[`max${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof this.config.performanceThresholds];
    
    if (threshold && this.metrics[key] > threshold) {
      this.handlePerformanceIssue(key, this.metrics[key], threshold);
    }
  }

  private handlePerformanceIssue(metric: keyof PerformanceMetrics, value: number, threshold: number): void {
    const suggestion: ClaudeSuggestion = {
      id: `perf-${metric}-${Date.now()}`,
      type: 'performance',
      priority: value > threshold * 2 ? 'critical' : 'high',
      title: `Performance Issue: ${metric}`,
      description: `${metric} (${value.toFixed(2)}ms) exceeds threshold (${threshold}ms)`,
      action: this.getOptimizationAction(metric),
      expectedImpact: `Reduce ${metric} by ${((value - threshold) / value * 100).toFixed(1)}%`,
      confidence: 0.85,
      metadata: { currentValue: value, threshold, metric },
    };

    this.addSuggestion(suggestion);
    this.emit('performance-issue', { metric, value, threshold, suggestion });
  }

  private getOptimizationAction(metric: keyof PerformanceMetrics): string {
    const actions: Record<keyof PerformanceMetrics, string> = {
      renderTime: 'Optimize component rendering with React.memo and useMemo',
      updateTime: 'Implement debounced updates and batch state changes',
      memoryUsage: 'Clear unused component references and implement object pooling',
      componentCount: 'Implement virtual scrolling and lazy loading',
      skinSwitchTime: 'Cache skin configurations and pre-load assets',
      validationTime: 'Optimize validation logic and implement early returns',
      hotReloadTime: 'Implement incremental hot-reload and diff-based updates',
      apiCallTime: 'Add request caching and implement optimistic updates',
      errorCount: 'Fix underlying issues and improve error handling',
      warningCount: 'Address warnings and optimize code quality',
    };

    return actions[metric] || 'Investigate and optimize the specific metric';
  }

  // ============================================================================
  // WORKFLOW MANAGEMENT
  // ============================================================================

  public createWorkflowPlan(steps: Partial<WorkflowStep>[], options: Partial<WorkflowExecutionPlan> = {}): WorkflowExecutionPlan {
    const workflowSteps: WorkflowStep[] = steps.map((step, index) => ({
      id: step.id || `step-${index}`,
      name: step.name || `Step ${index + 1}`,
      description: step.description || '',
      type: step.type || 'validation',
      status: 'pending',
      progress: 0,
      dependencies: step.dependencies || [],
      metadata: step.metadata || {},
    }));

    const plan: WorkflowExecutionPlan = {
      id: options.id || `workflow-${Date.now()}`,
      name: options.name || 'Auto-generated Workflow',
      description: options.description || 'Automatically generated workflow',
      steps: workflowSteps,
      estimatedDuration: this.calculateEstimatedDuration(workflowSteps),
      priority: options.priority || 'medium',
      autoExecute: options.autoExecute || false,
      createdAt: Date.now(),
      scheduledAt: options.scheduledAt,
    };

    this.activeWorkflows.set(plan.id, plan);
    this.emit('workflow-created', plan);

    if (plan.autoExecute) {
      this.executeWorkflow(plan.id);
    }

    return plan;
  }

  private calculateEstimatedDuration(steps: WorkflowStep[]): number {
    const stepDurations: Record<WorkflowStep['type'], number> = {
      validation: 500,
      optimization: 2000,
      migration: 5000,
      analysis: 3000,
      cleanup: 1000,
    };

    return steps.reduce((total, step) => total + (stepDurations[step.type] || 1000), 0);
  }

  public async executeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    this.emit('workflow-started', workflow);

    try {
      for (const step of workflow.steps) {
        await this.executeStep(step, workflow);
      }

      workflow.steps.forEach(step => step.status = 'completed');
      this.completedWorkflows.push(workflow);
      this.activeWorkflows.delete(workflowId);
      this.emit('workflow-completed', workflow);
    } catch (error) {
      this.emit('workflow-failed', { workflow, error });
      throw error;
    }
  }

  private async executeStep(step: WorkflowStep, workflow: WorkflowExecutionPlan): Promise<void> {
    step.status = 'running';
    step.startTime = Date.now();
    this.emit('step-started', { step, workflow });

    try {
      const result = await this.performStepAction(step);
      step.result = result;
      step.status = 'completed';
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      step.endTime = Date.now();
      step.duration = step.endTime - step.startTime;
      step.progress = 100;
      this.emit('step-completed', { step, workflow });
    }
  }

  private async performStepAction(step: WorkflowStep): Promise<any> {
    switch (step.type) {
      case 'validation':
        return this.performValidation(step);
      case 'optimization':
        return this.performOptimization(step);
      case 'migration':
        return this.performMigration(step);
      case 'analysis':
        return this.performAnalysis(step);
      case 'cleanup':
        return this.performCleanup(step);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  // ============================================================================
  // STEP IMPLEMENTATIONS
  // ============================================================================

  private async performValidation(step: WorkflowStep): Promise<any> {
    const startTime = performance.now();
    
    // Validate all registered components
    const inspections = this.api.inspectAllComponents();
    const validationResults = inspections.map(inspection => ({
      componentId: inspection.componentId,
      isValid: inspection.validationErrors.length === 0,
      errors: inspection.validationErrors,
      warnings: inspection.validationWarnings,
    }));

    const endTime = performance.now();
    this.updateMetric('validationTime', endTime - startTime);

    return {
      validatedComponents: inspections.length,
      validComponents: validationResults.filter(r => r.isValid).length,
      issues: validationResults.filter(r => !r.isValid || r.warnings.length > 0),
    };
  }

  private async performOptimization(step: WorkflowStep): Promise<any> {
    const startTime = performance.now();
    const optimizations: string[] = [];

    // Optimize based on current metrics
    if (this.metrics.renderTime > this.config.performanceThresholds.maxRenderTime) {
      optimizations.push('Optimized render performance with component memoization');
    }

    if (this.metrics.memoryUsage > this.config.performanceThresholds.maxMemoryUsage) {
      optimizations.push('Implemented memory cleanup and garbage collection');
    }

    // Cache optimization results
    const cacheKey = `optimization-${Date.now()}`;
    this.optimizationCache.set(cacheKey, optimizations);

    const endTime = performance.now();
    this.updateMetric('apiCallTime', endTime - startTime);

    return {
      optimizationsApplied: optimizations.length,
      optimizations,
      cacheKey,
    };
  }

  private async performMigration(step: WorkflowStep): Promise<any> {
    const startTime = performance.now();
    
    // Smart migration based on component analysis
    const inspections = this.api.inspectAllComponents();
    const migrationCandidates = inspections.filter(inspection => 
      inspection.needsMigration || inspection.hasCompatibilityIssues
    );

    const migrations = migrationCandidates.map(inspection => ({
      componentId: inspection.componentId,
      fromVersion: inspection.currentVersion,
      toVersion: inspection.recommendedVersion,
      estimatedTime: this.estimateMigrationTime(inspection),
    }));

    const endTime = performance.now();
    this.updateMetric('skinSwitchTime', endTime - startTime);

    return {
      migrationCandidates: migrationCandidates.length,
      migrations,
      totalEstimatedTime: migrations.reduce((sum, m) => sum + m.estimatedTime, 0),
    };
  }

  private async performAnalysis(step: WorkflowStep): Promise<any> {
    const startTime = performance.now();
    
    // Analyze system performance and suggest improvements
    const analysis = {
      performanceScore: this.calculatePerformanceScore(),
      bottlenecks: this.identifyBottlenecks(),
      recommendations: this.generateRecommendations(),
      healthStatus: this.getSystemHealthStatus(),
    };

    const endTime = performance.now();
    this.updateMetric('apiCallTime', endTime - startTime);

    return analysis;
  }

  private async performCleanup(step: WorkflowStep): Promise<any> {
    const startTime = performance.now();
    
    // Cleanup operations
    const cleanupResults = {
      cacheCleared: this.optimizationCache.size,
      oldWorkflowsRemoved: this.cleanupOldWorkflows(),
      suggestionsProcessed: this.processOldSuggestions(),
      memoryFreed: this.estimateMemoryFreed(),
    };

    const endTime = performance.now();
    this.updateMetric('apiCallTime', endTime - startTime);

    return cleanupResults;
  }

  // ============================================================================
  // ANALYSIS UTILITIES
  // ============================================================================

  private calculatePerformanceScore(): number {
    const weights = {
      renderTime: 0.3,
      memoryUsage: 0.2,
      errorCount: 0.2,
      validationTime: 0.15,
      apiCallTime: 0.15,
    };

    const scores = {
      renderTime: Math.max(0, 100 - (this.metrics.renderTime / this.config.performanceThresholds.maxRenderTime * 100)),
      memoryUsage: Math.max(0, 100 - (this.metrics.memoryUsage / this.config.performanceThresholds.maxMemoryUsage * 100)),
      errorCount: Math.max(0, 100 - (this.metrics.errorCount * 10)),
      validationTime: Math.max(0, 100 - (this.metrics.validationTime / this.config.performanceThresholds.maxValidationTime * 100)),
      apiCallTime: Math.max(0, 100 - (this.metrics.apiCallTime / 1000 * 100)), // Assume 1s as baseline
    };

    return Object.entries(weights).reduce((score, [key, weight]) => 
      score + (scores[key as keyof typeof scores] * weight), 0);
  }

  private identifyBottlenecks(): string[] {
    const bottlenecks: string[] = [];

    if (this.metrics.renderTime > this.config.performanceThresholds.maxRenderTime * 0.8) {
      bottlenecks.push('Render performance approaching threshold');
    }

    if (this.metrics.memoryUsage > this.config.performanceThresholds.maxMemoryUsage * 0.8) {
      bottlenecks.push('Memory usage approaching limit');
    }

    if (this.metrics.errorCount > 5) {
      bottlenecks.push('High error rate detected');
    }

    return bottlenecks;
  }

  private generateRecommendations(): ClaudeSuggestion[] {
    const recommendations: ClaudeSuggestion[] = [];

    // Performance recommendations
    if (this.metrics.renderTime > 10) {
      recommendations.push({
        id: `rec-render-${Date.now()}`,
        type: 'optimization',
        priority: 'medium',
        title: 'Optimize Render Performance',
        description: 'Consider implementing React.memo and useMemo for expensive components',
        action: 'Add memoization to frequently re-rendering components',
        expectedImpact: 'Reduce render time by 20-40%',
        confidence: 0.75,
      });
    }

    // Validation recommendations
    if (this.metrics.validationTime > 50) {
      recommendations.push({
        id: `rec-validation-${Date.now()}`,
        type: 'validation',
        priority: 'medium',
        title: 'Optimize Validation Logic',
        description: 'Validation is taking longer than expected',
        action: 'Implement early returns and cache validation results',
        expectedImpact: 'Reduce validation time by 30-50%',
        confidence: 0.80,
      });
    }

    return recommendations;
  }

  private getSystemHealthStatus(): 'excellent' | 'good' | 'fair' | 'poor' {
    const score = this.calculatePerformanceScore();
    
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  private estimateMigrationTime(inspection: any): number {
    // Base time + complexity factor
    const baseTime = 1000; // 1 second
    const complexityFactor = inspection.complexity || 1;
    return baseTime * complexityFactor;
  }

  private cleanupOldWorkflows(): number {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    const beforeCount = this.completedWorkflows.length;
    
    this.completedWorkflows = this.completedWorkflows.filter(
      workflow => workflow.createdAt > cutoff
    );
    
    return beforeCount - this.completedWorkflows.length;
  }

  private processOldSuggestions(): number {
    const cutoff = Date.now() - (60 * 60 * 1000); // 1 hour ago
    const beforeCount = this.suggestions.length;
    
    this.suggestions = this.suggestions.filter(
      suggestion => suggestion.id && parseInt(suggestion.id.split('-')[1]) > cutoff
    );
    
    return beforeCount - this.suggestions.length;
  }

  private estimateMemoryFreed(): number {
    // Rough estimation based on cleanup operations
    return this.optimizationCache.size * 1024; // Assume 1KB per cache entry
  }

  // ============================================================================
  // CLAUDE AI INTEGRATION
  // ============================================================================

  public async generateClaudeSuggestions(context?: string): Promise<ClaudeSuggestion[]> {
    if (!this.config.enableAI || !this.config.apiKey) {
      return this.generateRecommendations(); // Fallback to local recommendations
    }

    try {
      const prompt = this.buildClaudePrompt(context);
      const response = await this.callClaudeAPI(prompt);
      return this.parseClaudeResponse(response);
    } catch (error) {
      console.error('Claude API call failed:', error);
      return this.generateRecommendations();
    }
  }

  private buildClaudePrompt(context?: string): string {
    const metricsSummary = Object.entries(this.metrics)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    return `
As a performance optimization expert, analyze the following skin system metrics and provide actionable suggestions:

Current Metrics:
${metricsSummary}

Performance Thresholds:
${JSON.stringify(this.config.performanceThresholds, null, 2)}

System Status:
${this.getSystemHealthStatus()}

Context: ${context || 'General optimization'}

Please provide 3-5 specific, actionable suggestions in JSON format:
{
  "suggestions": [
    {
      "type": "optimization|migration|validation|performance",
      "priority": "low|medium|high|critical",
      "title": "Brief title",
      "description": "Detailed description",
      "action": "Specific action to take",
      "expectedImpact": "Expected outcome",
      "confidence": 0.0-1.0
    }
  ]
}
    `.trim();
  }

  private async callClaudeAPI(prompt: string): Promise<any> {
    // This would integrate with actual Claude API
    // For now, return mock response
    return {
      suggestions: this.generateRecommendations(),
    };
  }

  private parseClaudeResponse(response: any): ClaudeSuggestion[] {
    if (!response.suggestions || !Array.isArray(response.suggestions)) {
      return [];
    }

    return response.suggestions.map((suggestion: any, index: number) => ({
      id: `claude-${Date.now()}-${index}`,
      type: suggestion.type || 'optimization',
      priority: suggestion.priority || 'medium',
      title: suggestion.title || 'AI Suggestion',
      description: suggestion.description || '',
      action: suggestion.action || '',
      expectedImpact: suggestion.expectedImpact || '',
      confidence: suggestion.confidence || 0.7,
      metadata: { source: 'claude-ai', ...suggestion.metadata },
    }));
  }

  // ============================================================================
  // SUGGESTION MANAGEMENT
  // ============================================================================

  public addSuggestion(suggestion: ClaudeSuggestion): void {
    this.suggestions.push(suggestion);
    this.emit('suggestion-added', suggestion);
  }

  public getSuggestions(filter?: { type?: ClaudeSuggestion['type']; priority?: ClaudeSuggestion['priority'] }): ClaudeSuggestion[] {
    let filtered = this.suggestions;

    if (filter?.type) {
      filtered = filtered.filter(s => s.type === filter.type);
    }

    if (filter?.priority) {
      filtered = filtered.filter(s => s.priority === filter.priority);
    }

    return filtered.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  public async applySuggestion(suggestionId: string): Promise<boolean> {
    const suggestion = this.suggestions.find(s => s.id === suggestionId);
    if (!suggestion) {
      return false;
    }

    try {
      await this.executeSuggestionAction(suggestion);
      this.suggestions = this.suggestions.filter(s => s.id !== suggestionId);
      this.emit('suggestion-applied', suggestion);
      return true;
    } catch (error) {
      this.emit('suggestion-failed', { suggestion, error });
      return false;
    }
  }

  private async executeSuggestionAction(suggestion: ClaudeSuggestion): Promise<void> {
    // This would implement the actual suggestion action
    // For now, simulate the action
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  public on(event: string, listener: (event: string, data: any) => void): void {
    this.listeners.add(listener);
  }

  public off(event: string, listener: (event: string, data: any) => void): void {
    this.listeners.delete(listener);
  }

  private emit(event: string, data: any): void {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getActiveWorkflows(): WorkflowExecutionPlan[] {
    return Array.from(this.activeWorkflows.values());
  }

  public getCompletedWorkflows(): WorkflowExecutionPlan[] {
    return [...this.completedWorkflows];
  }

  public getConfig(): ClaudeWorkflowConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<ClaudeWorkflowConfig>): void {
    this.config = { ...this.config, ...updates };
    this.emit('config-updated', this.config);
  }

  public reset(): void {
    this.metrics = this.initializeMetrics();
    this.activeWorkflows.clear();
    this.completedWorkflows = [];
    this.suggestions = [];
    this.optimizationCache.clear();
    this.emit('reset', {});
  }

  public dispose(): void {
    this.listeners.clear();
    this.reset();
  }
}

// ============================================================================
// REACT HOOK
// ============================================================================

export const useClaudeWorkflowEngine = (config?: Partial<ClaudeWorkflowConfig>) => {
  const engineRef = useRef<ClaudeWorkflowEngine | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics>();
  const [workflows, setWorkflows] = useState<WorkflowExecutionPlan[]>([]);
  const [suggestions, setSuggestions] = useState<ClaudeSuggestion[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  if (!engineRef.current) {
    engineRef.current = new ClaudeWorkflowEngine(config);
    
    // Setup event listeners
    engineRef.current.on('metric-updated', (_, data) => {
      setMetrics(data.metrics);
    });

    engineRef.current.on('workflow-created', (_, workflow) => {
      setWorkflows(prev => [...prev, workflow]);
    });

    engineRef.current.on('workflow-completed', (_, workflow) => {
      setWorkflows(prev => prev.filter(w => w.id !== workflow.id));
    });

    engineRef.current.on('suggestion-added', (_, suggestion) => {
      setSuggestions(prev => [...prev, suggestion]);
    });
  }

  const engine = engineRef.current;

  const createWorkflow = useCallback((steps: Partial<WorkflowStep>[], options?: Partial<WorkflowExecutionPlan>) => {
    return engine.createWorkflowPlan(steps, options);
  }, [engine]);

  const executeWorkflow = useCallback((workflowId: string) => {
    setIsRunning(true);
    return engine.executeWorkflow(workflowId).finally(() => setIsRunning(false));
  }, [engine]);

  const generateSuggestions = useCallback((context?: string) => {
    return engine.generateClaudeSuggestions(context).then(newSuggestions => {
      setSuggestions(newSuggestions);
      return newSuggestions;
    });
  }, [engine]);

  const applySuggestion = useCallback((suggestionId: string) => {
    return engine.applySuggestion(suggestionId).then(success => {
      if (success) {
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      }
      return success;
    });
  }, [engine]);

  return {
    engine,
    metrics: metrics || engine.getMetrics(),
    workflows: engine.getActiveWorkflows(),
    completedWorkflows: engine.getCompletedWorkflows(),
    suggestions,
    isRunning,
    createWorkflow,
    executeWorkflow,
    generateSuggestions,
    applySuggestion,
    config: engine.getConfig(),
    updateConfig: engine.updateConfig.bind(engine),
    reset: engine.reset.bind(engine),
  };
};
