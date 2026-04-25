/**
 * PersistenceService Chaos Monkey Harness
 * 
 * Fault injection testing system for PersistenceService with KPI tracking,
 * scenario management, and comprehensive reporting capabilities.
 */

import { EventEmitter } from 'events';
import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';
import { PersistenceService } from '../persistence/PersistenceService';
import {
  ChaosHarnessConfig,
  ChaosScenario,
  FaultInjection,
  FaultType,
  FaultSeverity,
  ChaosOperationResult,
  ChaosScenarioResult,
  ChaosKPIConfig,
  DEFAULT_CHAOS_HARNESS_CONFIG,
  CHAOS_HARNESS_PRESETS,
  ChaosExportConfig,
  ChaosHarnessPreset,
} from './PersistenceChaosConfig';

// Export types for external use
export type {
  ChaosHarnessConfig,
  ChaosScenario,
  FaultInjection,
  FaultType,
  FaultSeverity,
  ChaosOperationResult,
  ChaosScenarioResult,
  ChaosKPIConfig,
  ChaosExportConfig,
  ChaosHarnessPreset,
};

export { DEFAULT_CHAOS_HARNESS_CONFIG, CHAOS_HARNESS_PRESETS };

const diagnostics = createHeadlessDiagnostics('PersistenceChaosHarness', 'shared');

/**
 * Chaos harness state
 */
interface ChaosHarnessState {
  /** Currently active scenarios */
  activeScenarios: Map<string, ChaosScenario>;
  /** Operation results history */
  operationHistory: ChaosOperationResult[];
  /** Scenario results history */
  scenarioResults: ChaosScenarioResult[];
  /** Current configuration */
  config: ChaosHarnessConfig;
  /** Harness status */
  status: 'idle' | 'running' | 'stopping' | 'stopped';
  /** Metrics tracking */
  metrics: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    totalFaultsInjected: number;
    averageLatency: number;
    maxLatency: number;
    minLatency: number;
    errorRate: number;
    dataIntegrityIssues: number;
    resourceExhaustionEvents: number;
    cascadeEvents: number;
  };
}

/**
 * Fault injector interface
 */
interface FaultInjector {
  /** Inject fault into operation */
  inject(operation: string, data: any, fault: FaultInjection): Promise<any>;
  /** Check if fault should be applied */
  shouldApply(operation: string, fault: FaultInjection): boolean;
  /** Get fault parameters */
  getParameters(fault: FaultInjection): any;
}

/**
 * Latency fault injector
 */
class LatencyFaultInjector implements FaultInjector {
  shouldApply(operation: string, fault: FaultInjection): boolean {
    return fault.targetOperations.includes(operation) && fault.enabled;
  }

  getParameters(fault: FaultInjection): any {
    return fault.parameters as {
      minDelay: number;
      maxDelay: number;
      distribution: 'fixed' | 'uniform' | 'exponential' | 'normal';
      jitter: number;
    };
  }

  async inject(operation: string, data: any, fault: FaultInjection): Promise<any> {
    const params = this.getParameters(fault);
    let delay: number;

    switch (params.distribution) {
      case 'fixed':
        delay = params.minDelay;
        break;
      case 'uniform':
        delay = params.minDelay + Math.random() * (params.maxDelay - params.minDelay);
        break;
      case 'exponential':
        delay = params.minDelay * Math.exp(Math.random() * Math.log(params.maxDelay / params.minDelay));
        break;
      case 'normal':
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        delay = params.minDelay + (params.maxDelay - params.minDelay) * (z0 + 1) / 2;
        delay = Math.max(params.minDelay, Math.min(params.maxDelay, delay));
        break;
      default:
        delay = params.minDelay;
    }

    // Add jitter
    if (params.jitter > 0) {
      delay *= (1 + (Math.random() - 0.5) * params.jitter);
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    return data;
  }
}

/**
 * Failure fault injector
 */
class FailureFaultInjector implements FaultInjector {
  shouldApply(operation: string, fault: FaultInjection): boolean {
    return fault.targetOperations.includes(operation) && fault.enabled;
  }

  getParameters(fault: FaultInjection): any {
    return fault.parameters as {
      errorType: 'timeout' | 'network' | 'storage' | 'quota' | 'permission' | 'unknown';
      message: string;
      code?: string;
      autoRetry: boolean;
      retryAttempts: number;
    };
  }

  async inject(operation: string, data: any, fault: FaultInjection): Promise<any> {
    const params = this.getParameters(fault);
    
    const error = new Error(params.message) as Error & { code?: string };
    error.code = params.code;
    
    throw error;
  }
}

/**
 * Corruption fault injector
 */
class CorruptionFaultInjector implements FaultInjector {
  shouldApply(operation: string, fault: FaultInjection): boolean {
    return fault.targetOperations.includes(operation) && fault.enabled;
  }

  getParameters(fault: FaultInjection): any {
    return fault.parameters as {
      corruptionType: 'truncate' | 'modify' | 'nullify' | 'duplicate' | 'scramble';
      corruptionPercentage: number;
      targetKeys?: string[];
      preserveStructure: boolean;
    };
  }

  async inject(operation: string, data: any, fault: FaultInjection): Promise<any> {
    const params = this.getParameters(fault);
    
    if (!data || typeof data !== 'object') {
      return data;
    }

    const corrupted = JSON.parse(JSON.stringify(data)); // Deep clone
    
    switch (params.corruptionType) {
      case 'truncate':
        if (Array.isArray(corrupted)) {
          corrupted.length = Math.floor(corrupted.length * (1 - params.corruptionPercentage));
        } else if (typeof corrupted === 'object') {
          const keys = Object.keys(corrupted);
          const keysToRemove = Math.floor(keys.length * params.corruptionPercentage);
          for (let i = 0; i < keysToRemove; i++) {
            delete corrupted[keys[i]];
          }
        }
        break;
        
      case 'modify':
        if (params.targetKeys && params.targetKeys.length > 0) {
          for (const key of params.targetKeys) {
            if (key in corrupted) {
              corrupted[key] = this.corruptValue(corrupted[key]);
            }
          }
        } else {
          this.corruptObject(corrupted, params.corruptionPercentage);
        }
        break;
        
      case 'nullify':
        if (params.targetKeys && params.targetKeys.length > 0) {
          for (const key of params.targetKeys) {
            if (key in corrupted) {
              corrupted[key] = null;
            }
          }
        } else {
          this.nullifyObject(corrupted, params.corruptionPercentage);
        }
        break;
        
      case 'duplicate':
        if (Array.isArray(corrupted)) {
          const duplicateCount = Math.floor(corrupted.length * params.corruptionPercentage);
          for (let i = 0; i < duplicateCount && i < corrupted.length; i++) {
            corrupted.push(JSON.parse(JSON.stringify(corrupted[i])));
          }
        }
        break;
        
      case 'scramble':
        this.scrambleObject(corrupted, params.corruptionPercentage);
        break;
    }
    
    return corrupted;
  }

  private corruptValue(value: any): any {
    if (typeof value === 'string') {
      return value.split('').reverse().join('');
    } else if (typeof value === 'number') {
      return value * (Math.random() * 2 - 1);
    } else if (typeof value === 'boolean') {
      return !value;
    } else if (Array.isArray(value)) {
      return value.reverse();
    } else if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value);
      if (keys.length > 0) {
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        value[randomKey] = this.corruptValue(value[randomKey]);
      }
    }
    return value;
  }

  private corruptObject(obj: any, percentage: number): void {
    const keys = Object.keys(obj);
    const keysToCorrupt = Math.floor(keys.length * percentage);
    
    for (let i = 0; i < keysToCorrupt; i++) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      obj[randomKey] = this.corruptValue(obj[randomKey]);
    }
  }

  private nullifyObject(obj: any, percentage: number): void {
    const keys = Object.keys(obj);
    const keysToNullify = Math.floor(keys.length * percentage);
    
    for (let i = 0; i < keysToNullify; i++) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      obj[randomKey] = null;
    }
  }

  private scrambleObject(obj: any, percentage: number): void {
    const keys = Object.keys(obj);
    const keysToScramble = Math.floor(keys.length * percentage);
    
    for (let i = 0; i < keysToScramble; i++) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const randomValue = Math.random() > 0.5 ? null : this.corruptValue(obj[randomKey]);
      obj[randomKey] = randomValue;
    }
  }
}

/**
 * Timeout fault injector
 */
class TimeoutFaultInjector implements FaultInjector {
  shouldApply(operation: string, fault: FaultInjection): boolean {
    return fault.targetOperations.includes(operation) && fault.enabled;
  }

  getParameters(fault: FaultInjection): any {
    return fault.parameters as {
      timeout: number;
      partialTimeout: boolean;
      timeoutBehavior: 'reject' | 'timeout' | 'hang';
    };
  }

  async inject(operation: string, data: any, fault: FaultInjection): Promise<any> {
    const params = this.getParameters(fault);
    
    if (params.timeoutBehavior === 'hang') {
      // Never resolve
      return new Promise(() => {});
    }
    
    await new Promise((_, reject) => {
      setTimeout(() => {
        const error = new Error(`Operation timeout after ${params.timeout}ms`);
        reject(error);
      }, params.timeout);
    });
    
    return data;
  }
}

/**
 * Partial fault injector
 */
class PartialFaultInjector implements FaultInjector {
  shouldApply(operation: string, fault: FaultInjection): boolean {
    return fault.targetOperations.includes(operation) && fault.enabled;
  }

  getParameters(fault: FaultInjection): any {
    return fault.parameters as {
      successRate: number;
      returnPartial: boolean;
      missingPercentage: number;
    };
  }

  async inject(operation: string, data: any, fault: FaultInjection): Promise<any> {
    const params = this.getParameters(fault);
    
    if (Math.random() > params.successRate) {
      throw new Error('Partial failure injected');
    }
    
    if (params.returnPartial && typeof data === 'object' && data !== null) {
      const corrupted = JSON.parse(JSON.stringify(data));
      this.removePartialData(corrupted, params.missingPercentage);
      return corrupted;
    }
    
    return data;
  }

  private removePartialData(obj: any, percentage: number): void {
    if (Array.isArray(obj)) {
      const itemsToRemove = Math.floor(obj.length * percentage);
      for (let i = 0; i < itemsToRemove; i++) {
        const randomIndex = Math.floor(Math.random() * obj.length);
        obj.splice(randomIndex, 1);
      }
    } else if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      const keysToRemove = Math.floor(keys.length * percentage);
      for (let i = 0; i < keysToRemove; i++) {
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        delete obj[randomKey];
      }
    }
  }
}

/**
 * Intermittent fault injector
 */
class IntermittentFaultInjector implements FaultInjector {
  shouldApply(operation: string, fault: FaultInjection): boolean {
    return fault.targetOperations.includes(operation) && fault.enabled;
  }

  getParameters(fault: FaultInjection): any {
    return fault.parameters as {
      pattern: 'random' | 'periodic' | 'burst' | 'decay';
      burstSize: number;
      periodDuration: number;
      activePeriods: number;
    };
  }

  async inject(operation: string, data: any, fault: FaultInjection): Promise<any> {
    const params = this.getParameters(fault);
    const timestamp = Date.now();
    
    let shouldFail = false;
    
    switch (params.pattern) {
      case 'random':
        shouldFail = Math.random() < 0.5;
        break;
      case 'periodic':
        const period = Math.floor(timestamp / params.periodDuration) % (params.activePeriods + 1);
        shouldFail = period < params.activePeriods;
        break;
      case 'burst':
        const burstCycle = Math.floor(timestamp / (params.periodDuration * 2));
        shouldFail = burstCycle % 2 === 0;
        break;
      case 'decay':
        const timeInPeriod = (timestamp % params.periodDuration) / params.periodDuration;
        shouldFail = Math.exp(-timeInPeriod * 3) > 0.5;
        break;
    }
    
    if (shouldFail) {
      throw new Error('Intermittent failure injected');
    }
    
    return data;
  }
}

/**
 * Cascade fault injector
 */
class CascadeFaultInjector implements FaultInjector {
  shouldApply(operation: string, fault: FaultInjection): boolean {
    return fault.targetOperations.includes(operation) && fault.enabled;
  }

  getParameters(fault: FaultInjection): any {
    return fault.parameters as {
      triggerConditions: string[];
      cascadeDelay: number;
      propagationFactor: number;
      maxCascadeDepth: number;
    };
  }

  async inject(operation: string, data: any, fault: FaultInjection): Promise<any> {
    const params = this.getParameters(fault);
    
    // Simple cascade implementation - in real scenario, this would track cascade depth
    if (params.triggerConditions.includes(operation)) {
      await new Promise(resolve => setTimeout(resolve, params.cascadeDelay));
      throw new Error(`Cascade failure triggered by ${operation}`);
    }
    
    return data;
  }
}

/**
 * Exhaustion fault injector
 */
class ExhaustionFaultInjector implements FaultInjector {
  shouldApply(operation: string, fault: FaultInjection): boolean {
    return fault.targetOperations.includes(operation) && fault.enabled;
  }

  getParameters(fault: FaultInjection): any {
    return fault.parameters as {
      resourceType: 'memory' | 'storage' | 'quota' | 'connections';
      exhaustionRate: number;
      recoveryTime: number;
      partialThreshold: number;
    };
  }

  async inject(operation: string, data: any, fault: FaultInjection): Promise<any> {
    const params = this.getParameters(fault);
    
    // Simple exhaustion simulation - in real scenario, this would track resource usage
    const random = Math.random();
    if (random < params.exhaustionRate) {
      throw new Error(`${params.resourceType} resource exhausted`);
    }
    
    return data;
  }
}

/**
 * Persistence Chaos Harness
 */
export class PersistenceChaosHarness extends EventEmitter {
  private state: ChaosHarnessState;
  private persistenceService: PersistenceService;
  private faultInjectors: Map<FaultType, FaultInjector>;
  private scenarioTimers: Map<string, NodeJS.Timeout>;
  private namespace: string;

  constructor(config: Partial<ChaosHarnessConfig> = {}, namespace?: string) {
    super();
    
    this.state = {
      activeScenarios: new Map(),
      operationHistory: [],
      scenarioResults: [],
      config: { ...DEFAULT_CHAOS_HARNESS_CONFIG, ...config },
      status: 'idle',
      metrics: {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        totalFaultsInjected: 0,
        averageLatency: 0,
        maxLatency: 0,
        minLatency: Infinity,
        errorRate: 0,
        dataIntegrityIssues: 0,
        resourceExhaustionEvents: 0,
        cascadeEvents: 0,
      },
    };
    
    this.persistenceService = new PersistenceService();
    this.faultInjectors = new Map();
    this.scenarioTimers = new Map();
    this.namespace = namespace || this.state.config.settings.defaultNamespace;
    
    this.initializeFaultInjectors();
  }

  /**
   * Initialize fault injectors
   */
  private initializeFaultInjectors(): void {
    this.faultInjectors.set('latency', new LatencyFaultInjector());
    this.faultInjectors.set('failure', new FailureFaultInjector());
    this.faultInjectors.set('corruption', new CorruptionFaultInjector());
    this.faultInjectors.set('timeout', new TimeoutFaultInjector());
    this.faultInjectors.set('partial', new PartialFaultInjector());
    this.faultInjectors.set('intermittent', new IntermittentFaultInjector());
    this.faultInjectors.set('cascade', new CascadeFaultInjector());
    this.faultInjectors.set('exhaustion', new ExhaustionFaultInjector());
  }

  /**
   * Start chaos scenario
   */
  async startScenario(scenarioId: string): Promise<void> {
    const scenario = this.state.config.scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    if (!scenario.enabled) {
      throw new Error(`Scenario ${scenarioId} is disabled`);
    }

    if (this.state.activeScenarios.has(scenarioId)) {
      throw new Error(`Scenario ${scenarioId} is already active`);
    }

    if (this.state.activeScenarios.size >= this.state.config.settings.maxConcurrentScenarios) {
      throw new Error('Maximum concurrent scenarios reached');
    }

    diagnostics.info(`Starting chaos scenario: ${scenarioId}`, { scenario });
    
    this.state.activeScenarios.set(scenarioId, scenario);
    this.state.status = 'running';
    
    // Set up scenario timer
    const timer = setTimeout(() => {
      this.stopScenario(scenarioId);
    }, scenario.duration);
    
    this.scenarioTimers.set(scenarioId, timer);
    
    // Emit scenario started event
    this.emit('scenarioStarted', { scenarioId, scenario });
    
    // Emit telemetry
    this.emitTelemetryEvent('persistence_chaos_scenario_started', {
      scenarioId,
      scenarioName: scenario.name,
      faults: scenario.faults.length,
      duration: scenario.duration,
    });
  }

  /**
   * Stop chaos scenario
   */
  async stopScenario(scenarioId: string): Promise<void> {
    const scenario = this.state.activeScenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} is not active`);
    }

    diagnostics.info(`Stopping chaos scenario: ${scenarioId}`, { scenario });
    
    // Clear timer
    const timer = this.scenarioTimers.get(scenarioId);
    if (timer) {
      clearTimeout(timer);
      this.scenarioTimers.delete(scenarioId);
    }
    
    // Remove from active scenarios
    this.state.activeScenarios.delete(scenarioId);
    
    // Generate scenario result
    const result = this.generateScenarioResult(scenarioId, scenario);
    this.state.scenarioResults.push(result);
    
    // Update status
    if (this.state.activeScenarios.size === 0) {
      this.state.status = 'idle';
    }
    
    // Emit scenario stopped event
    this.emit('scenarioStopped', { scenarioId, result });
    
    // Emit telemetry
    this.emitTelemetryEvent('persistence_chaos_scenario_stopped', {
      scenarioId,
      scenarioName: scenario.name,
      result: {
        totalOperations: result.summary.totalOperations,
        successfulOperations: result.summary.successfulOperations,
        failedOperations: result.summary.failedOperations,
        averageLatency: result.summary.averageLatency,
        errorRate: result.summary.errorRate,
      },
    });
  }

  /**
   * Stop all active scenarios
   */
  async stopAllScenarios(): Promise<void> {
    const scenarioIds = Array.from(this.state.activeScenarios.keys());
    
    diagnostics.info(`Stopping all chaos scenarios`, { scenarioIds });
    
    await Promise.all(scenarioIds.map(id => this.stopScenario(id)));
  }

  /**
   * Execute operation with chaos injection
   */
  async executeOperation<T>(
    operation: string,
    data: T,
    operationFn: (data: T) => Promise<any>
  ): Promise<any> {
    const startTime = Date.now();
    let result: any;
    let success = false;
    let error: any;
    const injectedFaults: FaultType[] = [];
    
    try {
      // Apply fault injections
      let processedData = data;
      
      for (const scenario of this.state.activeScenarios.values()) {
        for (const fault of scenario.faults) {
          if (Math.random() < fault.probability) {
            const injector = this.faultInjectors.get(fault.type);
            if (injector && injector.shouldApply(operation, fault)) {
              diagnostics.debug(`Injecting fault: ${fault.type} into operation: ${operation}`, { fault });
              
              processedData = await injector.inject(operation, processedData, fault);
              injectedFaults.push(fault.type);
              this.state.metrics.totalFaultsInjected++;
              
              // Emit fault injected telemetry
              this.emitTelemetryEvent('persistence_chaos_fault_injected', {
                faultType: fault.type,
                operation,
                scenarioId: scenario.id,
                severity: fault.severity,
              });
            }
          }
        }
      }
      
      // Execute the operation
      result = await operationFn(processedData);
      success = true;
      
      // Track data integrity if enabled
      if (this.state.config.kpiConfig.trackDataIntegrity) {
        const integrityCheck = this.checkDataIntegrity(data, result);
        if (!integrityCheck.passed) {
          this.state.metrics.dataIntegrityIssues++;
          diagnostics.warn('Data integrity issues detected', { integrityCheck });
        }
      }
      
    } catch (err) {
      error = err;
      success = false;
      diagnostics.error(`Operation failed: ${operation}`, { error, injectedFaults });
    }
    
    const duration = Date.now() - startTime;
    
    // Create operation result
    const operationResult: ChaosOperationResult = {
      operation,
      success,
      duration,
      error: error ? {
        type: error.constructor.name,
        message: error.message,
        code: (error as any).code,
        stack: error.stack,
      } : undefined,
      injectedFaults,
      timestamp: startTime,
    };
    
    // Update metrics
    this.updateMetrics(operationResult);
    
    // Add to history
    this.state.operationHistory.push(operationResult);
    
    // Keep history size manageable
    if (this.state.operationHistory.length > 1000) {
      this.state.operationHistory = this.state.operationHistory.slice(-500);
    }
    
    // Emit operation completed event
    this.emit('operationCompleted', operationResult);
    
    // Emit telemetry
    this.emitTelemetryEvent('persistence_chaos_operation_completed', {
      operation,
      success,
      duration,
      injectedFaults,
      error: error ? error.message : undefined,
    });
    
    if (!success) {
      throw error;
    }
    
    return result;
  }

  /**
   * Save data with chaos injection
   */
  async saveData<T>(key: string, data: T): Promise<void> {
    return this.executeOperation('save', { key, data }, async ({ key, data }) => {
      const namespacedKey = `${this.namespace}:${key}`;
      await this.persistenceService.saveData(namespacedKey, data);
    });
  }

  /**
   * Load data with chaos injection
   */
  async loadData<T>(key: string): Promise<T | null> {
    return this.executeOperation('load', { key }, async ({ key }) => {
      const namespacedKey = `${this.namespace}:${key}`;
      return await this.persistenceService.loadData(namespacedKey);
    });
  }

  /**
   * Clear data with chaos injection
   */
  async clearData(key: string): Promise<void> {
    return this.executeOperation('clear', { key }, async ({ key }) => {
      const namespacedKey = `${this.namespace}:${key}`;
      await this.persistenceService.clearData(namespacedKey);
    });
  }

  /**
   * Apply preset configuration
   */
  applyPreset(preset: ChaosHarnessPreset): void {
    this.state.config = CHAOS_HARNESS_PRESETS[preset];
    diagnostics.info(`Applied chaos harness preset: ${preset}`, { preset });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ChaosHarnessConfig>): void {
    this.state.config = { ...this.state.config, ...config };
    diagnostics.info('Updated chaos harness configuration', { config });
  }

  /**
   * Get current state
   */
  getState(): ChaosHarnessState {
    return { ...this.state };
  }

  /**
   * Get operation history
   */
  getOperationHistory(limit?: number): ChaosOperationResult[] {
    if (limit) {
      return this.state.operationHistory.slice(-limit);
    }
    return [...this.state.operationHistory];
  }

  /**
   * Get scenario results
   */
  getScenarioResults(limit?: number): ChaosScenarioResult[] {
    if (limit) {
      return this.state.scenarioResults.slice(-limit);
    }
    return [...this.state.scenarioResults];
  }

  /**
   * Export results
   */
  exportResults(config: ChaosExportConfig): string {
    const { operationHistory, scenarioResults } = this.state;
    
    // Filter based on config
    let filteredOperations = operationHistory;
    let filteredScenarios = scenarioResults;
    
    if (config.timeRange) {
      const startTime = config.timeRange.start.getTime();
      const endTime = config.timeRange.end.getTime();
      
      filteredOperations = operationHistory.filter(op => 
        op.timestamp >= startTime && op.timestamp <= endTime
      );
      
      filteredScenarios = scenarioResults.filter(scenario => 
        scenario.startTime >= startTime && scenario.endTime <= endTime
      );
    }
    
    if (config.scenarios) {
      filteredScenarios = filteredScenarios.filter(scenario => 
        config.scenarios!.includes(scenario.scenarioId)
      );
    }
    
    if (config.operations) {
      filteredOperations = filteredOperations.filter(op => 
        config.operations!.includes(op.operation)
      );
    }
    
    switch (config.format) {
      case 'json':
        return JSON.stringify({
          config: config.includeSummary ? this.state.config : undefined,
          operations: config.includeRawResults ? filteredOperations : undefined,
          scenarios: config.includeRawResults ? filteredScenarios : undefined,
          metrics: config.includeKPI ? this.state.metrics : undefined,
          summary: config.includeSummary ? {
            totalOperations: this.state.metrics.totalOperations,
            successfulOperations: this.state.metrics.successfulOperations,
            failedOperations: this.state.metrics.failedOperations,
            averageLatency: this.state.metrics.averageLatency,
            errorRate: this.state.metrics.errorRate,
            totalFaultsInjected: this.state.metrics.totalFaultsInjected,
            dataIntegrityIssues: this.state.metrics.dataIntegrityIssues,
            resourceExhaustionEvents: this.state.metrics.resourceExhaustionEvents,
            cascadeEvents: this.state.metrics.cascadeEvents,
          } : undefined,
          exportedAt: new Date().toISOString(),
        }, null, 2);
        
      case 'csv':
        const headers = ['Timestamp', 'Operation', 'Success', 'Duration', 'Error', 'InjectedFaults'];
        const rows = filteredOperations.map(op => [
          new Date(op.timestamp).toISOString(),
          op.operation,
          op.success.toString(),
          op.duration.toString(),
          op.error ? op.error.message : '',
          op.injectedFaults.join(';'),
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
        
      case 'markdown':
        let markdown = '# Persistence Chaos Monkey Results\n\n';
        markdown += `**Generated:** ${new Date().toISOString()}\n`;
        markdown += `**Total Operations:** ${this.state.metrics.totalOperations}\n`;
        markdown += `**Success Rate:** ${((1 - this.state.metrics.errorRate) * 100).toFixed(2)}%\n`;
        markdown += `**Average Latency:** ${this.state.metrics.averageLatency.toFixed(2)}ms\n`;
        markdown += `**Total Faults Injected:** ${this.state.metrics.totalFaultsInjected}\n\n`;
        
        if (config.includeSummary && filteredScenarios.length > 0) {
          markdown += '## Scenario Results\n\n';
          for (const scenario of filteredScenarios) {
            markdown += `### ${scenario.scenarioName}\n\n`;
            markdown += `- **Duration:** ${scenario.duration}ms\n`;
            markdown += `- **Operations:** ${scenario.summary.totalOperations}\n`;
            markdown += `- **Success Rate:** ${((1 - scenario.summary.errorRate) * 100).toFixed(2)}%\n`;
            markdown += `- **Average Latency:** ${scenario.summary.averageLatency.toFixed(2)}ms\n`;
            markdown += `- **Faults Injected:** ${scenario.faultSummary.totalFaultsInjected}\n\n`;
          }
        }
        
        if (config.includeRawResults && filteredOperations.length > 0) {
          markdown += '## Operation Details\n\n';
          markdown += '| Timestamp | Operation | Success | Duration | Error | Faults |\n';
          markdown += '|-----------|-----------|---------|----------|-------|--------|\n';
          
          for (const op of filteredOperations.slice(0, 100)) { // Limit to prevent huge markdown
            markdown += `| ${new Date(op.timestamp).toISOString()} | ${op.operation} | ${op.success} | ${op.duration}ms | ${op.error?.message || ''} | ${op.injectedFaults.join(',')} |\n`;
          }
        }
        
        return markdown;
        
      default:
        throw new Error(`Unsupported export format: ${config.format}`);
    }
  }

  /**
   * Reset harness state
   */
  reset(): void {
    this.state.operationHistory = [];
    this.state.scenarioResults = [];
    this.state.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      totalFaultsInjected: 0,
      averageLatency: 0,
      maxLatency: 0,
      minLatency: Infinity,
      errorRate: 0,
      dataIntegrityIssues: 0,
      resourceExhaustionEvents: 0,
      cascadeEvents: 0,
    };
    
    diagnostics.info('Reset chaos harness state');
  }

  /**
   * Generate scenario result
   */
  private generateScenarioResult(scenarioId: string, scenario: ChaosScenario): ChaosScenarioResult {
    const startTime = Date.now() - scenario.duration;
    const endTime = Date.now();
    
    // Filter operations for this scenario
    const scenarioOperations = this.state.operationHistory.filter(op => 
      op.timestamp >= startTime && op.timestamp <= endTime
    );
    
    // Calculate summary statistics
    const totalOperations = scenarioOperations.length;
    const successfulOperations = scenarioOperations.filter(op => op.success).length;
    const failedOperations = totalOperations - successfulOperations;
    const errorRate = totalOperations > 0 ? failedOperations / totalOperations : 0;
    
    const durations = scenarioOperations.map(op => op.duration);
    const averageLatency = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
    const maxLatency = durations.length > 0 ? Math.max(...durations) : 0;
    const minLatency = durations.length > 0 ? Math.min(...durations) : 0;
    
    // Count faults by type and severity
    const faultsByType: Record<FaultType, number> = {} as Record<FaultType, number>;
    const faultsBySeverity: Record<FaultSeverity, number> = {} as Record<FaultSeverity, number>;
    
    for (const operation of scenarioOperations) {
      for (const faultType of operation.injectedFaults) {
        faultsByType[faultType] = (faultsByType[faultType] || 0) + 1;
        
        const fault = scenario.faults.find(f => f.type === faultType);
        if (fault) {
          faultsBySeverity[fault.severity] = (faultsBySeverity[fault.severity] || 0) + 1;
        }
      }
    }
    
    // Count specific issues
    const dataIntegrityIssues = scenarioOperations.filter(op => 
      op.dataIntegrity && !op.dataIntegrity.passed
    ).length;
    
    const resourceExhaustionEvents = scenarioOperations.filter(op => 
      op.error && op.error.message.includes('exhausted')
    ).length;
    
    const cascadeEvents = scenarioOperations.filter(op => 
      op.error && op.error.message.includes('cascade')
    ).length;
    
    return {
      scenarioId,
      scenarioName: scenario.name,
      startTime,
      endTime,
      duration: scenario.duration,
      operations: scenarioOperations,
      summary: {
        totalOperations,
        successfulOperations,
        failedOperations,
        averageLatency,
        maxLatency,
        minLatency,
        errorRate,
        dataIntegrityIssues,
        resourceExhaustionEvents,
        cascadeEvents,
      },
      faultSummary: {
        totalFaultsInjected: Object.values(faultsByType).reduce((sum, count) => sum + count, 0),
        faultsByType,
        faultsBySeverity,
      },
      kpiMetrics: {
        throughput: totalOperations / (scenario.duration / 1000), // ops per second
        reliability: 1 - errorRate,
        efficiency: successfulOperations / totalOperations,
        faultDensity: Object.values(faultsByType).reduce((sum, count) => sum + count, 0) / totalOperations,
      },
    };
  }

  /**
   * Update metrics
   */
  private updateMetrics(result: ChaosOperationResult): void {
    this.state.metrics.totalOperations++;
    
    if (result.success) {
      this.state.metrics.successfulOperations++;
    } else {
      this.state.metrics.failedOperations++;
    }
    
    // Update latency metrics
    this.state.metrics.maxLatency = Math.max(this.state.metrics.maxLatency, result.duration);
    this.state.metrics.minLatency = Math.min(this.state.metrics.minLatency, result.duration);
    
    // Calculate average latency
    const totalLatency = this.state.operationHistory.reduce((sum, op) => sum + op.duration, 0);
    this.state.metrics.averageLatency = totalLatency / this.state.operationHistory.length;
    
    // Update error rate
    this.state.metrics.errorRate = this.state.metrics.failedOperations / this.state.metrics.totalOperations;
  }

  /**
   * Check data integrity
   */
  private checkDataIntegrity(original: any, processed: any): { passed: boolean; issues: string[] } {
    const issues: string[] = [];
    
    try {
      // Basic structure check
      if (typeof original !== typeof processed) {
        issues.push(`Type mismatch: ${typeof original} vs ${typeof processed}`);
      }
      
      // Deep equality check for simple cases
      if (typeof original === 'object' && original !== null && processed !== null) {
        const originalStr = JSON.stringify(original);
        const processedStr = JSON.stringify(processed);
        
        if (originalStr !== processedStr) {
          issues.push('Data content mismatch detected');
        }
      }
      
      // Check for null values where they shouldn't be
      if (processed !== null && typeof processed === 'object') {
        const checkForNulls = (obj: any, path: string = '') => {
          for (const key in obj) {
            if (obj[key] === null && obj.hasOwnProperty(key)) {
              issues.push(`Unexpected null value at ${path}${key}`);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              checkForNulls(obj[key], `${path}${key}.`);
            }
          }
        };
        
        checkForNulls(processed);
      }
      
    } catch (error) {
      issues.push(`Integrity check failed: ${error.message}`);
    }
    
    return {
      passed: issues.length === 0,
      issues,
    };
  }

  /**
   * Emit telemetry event
   */
  private emitTelemetryEvent(eventName: string, data: any): void {
    if (!this.state.config.settings.enableMetricsExport) return;
    
    this.emit('telemetry', {
      eventName,
      data,
      timestamp: Date.now(),
      harness: 'persistence-chaos',
      namespace: this.namespace,
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Stop all scenarios
    for (const timer of this.scenarioTimers.values()) {
      clearTimeout(timer);
    }
    this.scenarioTimers.clear();
    
    // Remove all listeners
    this.removeAllListeners();
    
    diagnostics.info('Persistence Chaos Harness destroyed');
  }
}
