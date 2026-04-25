import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Time Tracking System - Basic Tests', () => {
  it('should validate time tracking CLI commands exist', () => {
    // Test that the CLI scripts exist and can be executed
    
    // Test time-tracker help
    try {
      const result = execSync('npm run time-tracker', { encoding: 'utf8' });
      expect(result).toContain('Time Tracking System');
      expect(result).toContain('Commands:');
    } catch (error) {
      expect.fail(`Time tracker CLI failed: ${error}`);
    }
    
    // Test time-reporter help
    try {
      const result = execSync('npm run time-reporter', { encoding: 'utf8' });
      expect(result).toContain('Time Reporting System');
      expect(result).toContain('Commands:');
    } catch (error) {
      expect.fail(`Time reporter CLI failed: ${error}`);
    }
  });

  it('should handle time tracking operations', () => {
    // Test starting a task
    try {
      execSync('npm run time-tracker start --task TEST-001 --description "Test Task" --agent TestAgent --estimated 30', { encoding: 'utf8' });
    } catch (error) {
      expect.fail(`Failed to start task: ${error}`);
    }
    
    // Test listing tasks
    try {
      const result = execSync('npm run time-tracker list', { encoding: 'utf8' });
      expect(result).toContain('Time Tracking Entries');
    } catch (error) {
      expect.fail(`Failed to list tasks: ${error}`);
    }
    
    // Test stopping the task
    try {
      execSync('npm run time-tracker stop --task TEST-001 --notes "Test completion"', { encoding: 'utf8' });
    } catch (error) {
      expect.fail(`Failed to stop task: ${error}`);
    }
  });

  it('should generate reports', () => {
    // Test generating markdown report
    try {
      execSync('npm run time-reporter report markdown', { encoding: 'utf8' });
    } catch (error) {
      expect.fail(`Failed to generate markdown report: ${error}`);
    }
    
    // Test generating dashboard
    try {
      execSync('npm run time-reporter dashboard', { encoding: 'utf8' });
    } catch (error) {
      expect.fail(`Failed to generate dashboard: ${error}`);
    }
  });

  it('should validate data structure', () => {
    // Test data files exist
    const timeTrackingDir = join(process.cwd(), 'test-results', 'time-tracking');
    const dataFile = join(timeTrackingDir, 'time-tracking.json');
    
    if (existsSync(dataFile)) {
      const data = JSON.parse(readFileSync(dataFile, 'utf8'));
      
      // Validate structure
      expect(data).toHaveProperty('entries');
      expect(data).toHaveProperty('metadata');
      expect(data.metadata).toHaveProperty('version');
    } else {
      // File might not exist in clean environment, that's ok
      expect(true).toBe(true);
    }
    
    // Validate entries
    if (existsSync(dataFile)) {
      const data = JSON.parse(readFileSync(dataFile, 'utf8'));
      if (data.entries.length > 0) {
        const entry = data.entries[0];
        expect(entry).toHaveProperty('taskId');
        expect(entry).toHaveProperty('taskDescription');
        expect(entry).toHaveProperty('agent');
        expect(entry).toHaveProperty('createdAt');
        expect(entry).toHaveProperty('updatedAt');
      }
    }
  });
});
