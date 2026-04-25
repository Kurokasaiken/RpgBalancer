import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DropValidationAuditEngine } from './dropValidationAudit.js';
import { DEFAULT_VALIDATION_AUDIT_CONFIG } from '../../src/ui/idleVillage/config/dropValidationAuditConfig.js';

describe('DropValidationAudit CLI', () => {
  let engine: DropValidationAuditEngine;

  beforeEach(() => {
    engine = new DropValidationAuditEngine(DEFAULT_VALIDATION_AUDIT_CONFIG);
  });

  it('should create audit engine with default config', () => {
    expect(engine).toBeDefined();
  });

  it('should run audit with mock data', async () => {
    const result = await engine.runAudit();
    
    expect(result).toBeDefined();
    expect(result.id).toMatch(/^audit-session-/);
    expect(result.name).toBe(DEFAULT_VALIDATION_AUDIT_CONFIG.name);
    expect(result.summary).toBeDefined();
    expect(result.contextResults).toBeDefined();
    expect(result.exportData).toBeDefined();
  });

  it('should generate all export formats', async () => {
    const result = await engine.runAudit();
    
    expect(result.exportData.json).toBeDefined();
    expect(result.exportData.markdown).toBeDefined();
    expect(result.exportData.csv).toBeDefined();
    
    // Check JSON export is valid
    const parsed = JSON.parse(result.exportData.json);
    expect(parsed.id).toBe(result.id);
    
    // Check markdown export contains expected sections
    expect(result.exportData.markdown).toContain('# ' + result.name);
    expect(result.exportData.markdown).toContain('## Summary');
    
    // Check CSV export has headers
    expect(result.exportData.csv).toContain('Context ID,Context Name');
  });

  it('should validate stat tags correctly', async () => {
    const result = await engine.runAudit();
    
    // Should have some validation results
    expect(result.summary.totalValidations).toBeGreaterThan(0);
    expect(result.summary.totalContexts).toBeGreaterThan(0);
  });

  it('should emit telemetry events', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await engine.runAudit();
    
    // Check telemetry was emitted (it's split across multiple console.log calls)
    expect(consoleSpy).toHaveBeenCalledWith('📊 Telemetry emitted:', 'iv_drop_audit_run');
    
    consoleSpy.mockRestore();
  });
});
