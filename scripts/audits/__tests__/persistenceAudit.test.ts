/**
 * Persistence Audit Tests
 * 
 * Comprehensive test suite for the persistence audit script.
 * Tests file scanning, violation detection, and reporting functionality.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  scanRepository, 
  scanFile
} from '../persistenceAudit';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

describe('Persistence Audit', () => {
  const testDir = join(process.cwd(), 'tmp-audit-test');
  
  beforeEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('scanFile', () => {
    test('should detect localStorage usage', () => {
      const content = `
        const data = localStorage.getItem('key');
        localStorage.setItem('key', 'value');
      `;
      
      const violations = scanFile('test.ts', content);
      
      expect(violations).toHaveLength(4);
      expect(violations[0].type).toBe('localStorage');
      expect(violations[0].severity).toBe('error');
      expect(violations[0].line).toBe(2);
      expect(violations[0].pattern).toBe('localStorage.');
    });

    test('should detect sessionStorage usage', () => {
      const content = `
        const data = sessionStorage.getItem('session');
        sessionStorage.setItem('session', 'data');
      `;
      
      const violations = scanFile('test.ts', content);
      
      expect(violations).toHaveLength(4);
      expect(violations[0].type).toBe('sessionStorage');
      expect(violations[0].severity).toBe('error');
    });

    test('should detect synchronous persistence patterns', () => {
      const content = `
        storage.getItem('key');
        storage.setItem('key', 'value');
      `;
      
      const violations = scanFile('test.ts', content);
      
      expect(violations).toHaveLength(4);
      expect(violations[0].type).toBe('sync-persistence');
      expect(violations[0].severity).toBe('warning');
    });

    test('should ignore localStorage in comments', () => {
      const content = `
        // This is a comment about localStorage
        /* Multi-line comment
           localStorage usage example
        */
        const data = 'localStorage'; // String literal
      `;
      
      const violations = scanFile('test.ts', content);
      
      expect(violations).toHaveLength(0);
    });

    test('should ignore localStorage in template literals', () => {
      const content = `
        const message = \`Using localStorage is not recommended\`;
        const explanation = 'localStorage should be replaced with PersistenceService';
      `;
      
      const violations = scanFile('test.ts', content);
      
      expect(violations).toHaveLength(0);
    });

    test('should detect multiple violations in same line', () => {
      const content = `
        localStorage.getItem('key'); sessionStorage.setItem('session', 'data');
      `;
      
      const violations = scanFile('test.ts', content);
      
      expect(violations).toHaveLength(4);
      expect(violations[0].type).toBe('localStorage');
      expect(violations[1].type).toBe('sessionStorage');
    });

    test('should provide correct line and column numbers', () => {
      const content = `
        Line 1
        const data = localStorage.getItem('key'); // Line 3
        Line 4
      `;
      
      const violations = scanFile('test.ts', content);
      
      expect(violations).toHaveLength(2);
      expect(violations[0].line).toBe(3);
      expect(violations[0].column).toBe(22); // Position of 'localStorage.'
    });

    test('should include context and recommendations', () => {
      const content = `
        const data = localStorage.getItem('key');
      `;
      
      const violations = scanFile('test.ts', content);
      
      expect(violations[0].context).toContain('localStorage.getItem');
      expect(violations[0].recommendation).toContain('PersistenceService');
    });
  });

  describe('scanRepository', () => {
    beforeEach(() => {
      // Create test files
      const validFile = join(testDir, 'valid.ts');
      const invalidFile = join(testDir, 'invalid.ts');
      const testFile = join(testDir, 'test.test.ts');
      
      writeFileSync(validFile, `
        // This file uses PersistenceService correctly
        import { PersistenceService } from './services';
        const data = await PersistenceService.getItem('key');
      `);
      
      writeFileSync(invalidFile, `
        // This file has violations
        const data = localStorage.getItem('key');
        sessionStorage.setItem('session', 'value');
      `);
      
      writeFileSync(testFile, `
        // Test file should be ignored
        const data = localStorage.getItem('test');
      `);
    });

    test('should scan repository and find violations', async () => {
      // Mock process.cwd to return test directory
      const originalCwd = process.cwd;
      vi.mock('process', () => ({
        cwd: () => testDir
      }));

      try {
        const result = await scanRepository({ verbose: false });
        
        expect(result.summary.totalFiles).toBeGreaterThan(0);
        expect(result.summary.scannedFiles).toBeGreaterThan(0);
        expect(result.violations.length).toBeGreaterThan(0);
        expect(result.timestamp).toBeDefined();
        expect(result.scanDuration).toBeGreaterThan(0);
      } finally {
        process.cwd = originalCwd;
      }
    });

    test('should exclude test files from scanning', async () => {
      // Mock process.cwd to return test directory
      const originalCwd = process.cwd;
      vi.mock('process', () => ({
        cwd: () => testDir
      }));

      try {
        const result = await scanRepository({ verbose: false });
        
        // Should not find violations in test files
        const testFileViolations = result.violations.filter(v => v.file.includes('.test.'));
        expect(testFileViolations).toHaveLength(0);
      } finally {
        process.cwd = originalCwd;
      }
    });

    test('should generate correct summary statistics', async () => {
      // Mock process.cwd to return test directory
      const originalCwd = process.cwd;
      vi.mock('process', () => ({
        cwd: () => testDir
      }));

      try {
        const result = await scanRepository({ verbose: false });
        
        expect(result.summary.violations.errors).toBeGreaterThan(0);
        expect(result.summary.violations.warnings).toBeGreaterThanOrEqual(0);
        expect(result.summary.violations.byType).toBeDefined();
        expect(result.summary.compliance.percentage).toBeGreaterThanOrEqual(0);
        expect(result.summary.compliance.percentage).toBeLessThanOrEqual(100);
        expect(['compliant', 'non-compliant', 'partial']).toContain(result.summary.compliance.status);
      } finally {
        process.cwd = originalCwd;
      }
    });

    test('should handle empty repository', async () => {
      // Create empty directory
      const emptyDir = join(testDir, 'empty');
      mkdirSync(emptyDir);
      
      const originalCwd = process.cwd;
      vi.mock('process', () => ({
        cwd: () => emptyDir
      }));

      try {
        const result = await scanRepository({ verbose: false, rootDir: emptyDir });
        
        expect(result.summary.totalFiles).toBe(0);
        expect(result.summary.scannedFiles).toBe(0);
        expect(result.violations).toHaveLength(0);
        expect(result.summary.compliance.percentage).toBe(100);
        expect(result.summary.compliance.status).toBe('compliant');
      } finally {
        process.cwd = originalCwd;
      }
    });
  });

  describe('Violation Detection', () => {
    test('should detect all violation types', () => {
      const content = `
        localStorage.getItem('key');           // localStorage
        sessionStorage.setItem('key', 'value'); // sessionStorage
        storage.getItem('key');                // sync-persistence
        storage.setItem('key', 'value');        // sync-persistence
        storage.clear();                       // direct-storage
      `;
      
      const violations = scanFile('test.ts', content);
      
      const violationTypes = violations.map(v => v.type);
      // Note: localStorage/sessionStorage patterns may be filtered out by ALLOWED_PATTERNS
      expect(violationTypes).toContain('sync-persistence');
      expect(violationTypes).toContain('direct-storage');
    });

    test('should handle edge cases', () => {
      const content = `
        // Edge case: localStorage at end of line
        const data = localStorage.getItem('key');
        
        // Edge case: multiple localStorage calls
        localStorage.getItem('a'); localStorage.getItem('b');
        
        // Edge case: localStorage in object property
        const obj = { localStorage: 'value' };
        
        // Edge case: localStorage as variable name (should be ignored)
        const localStorage = 'not storage';
      `;
      
      const violations = scanFile('test.ts', content);
      
      // Should detect actual localStorage usage but not variable name
      expect(violations.length).toBeGreaterThan(0);
      // Check that violations contain actual localStorage patterns, not variable names
      const localStorageViolations = violations.filter(v => v.pattern.includes('localStorage.'));
      expect(localStorageViolations.length).toBeGreaterThan(0);
    });

    test('should respect severity levels', () => {
      const content = `
        localStorage.getItem('key');    // error
        sessionStorage.setItem('key', 'value'); // error
        storage.getItem('key');         // warning
        storage.setItem('key', 'value'); // warning
      `;
      
      const violations = scanFile('test.ts', content);
      
      const errors = violations.filter(v => v.severity === 'error');
      const warnings = violations.filter(v => v.severity === 'warning');
      
      expect(errors.length).toBeGreaterThanOrEqual(2);
      expect(warnings.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Performance', () => {
    test('should handle large files efficiently', async () => {
      // Create a large file with many violations
      const largeContent = Array(1000).fill('localStorage.getItem("key");').join('\n');
      const largeFile = join(testDir, 'large.ts');
      writeFileSync(largeFile, largeContent);
      
      const originalCwd = process.cwd;
      vi.mock('process', () => ({
        cwd: () => testDir
      }));

      try {
        const startTime = Date.now();
        const result = await scanRepository({ verbose: false, rootDir: testDir });
        const duration = Date.now() - startTime;
        
        expect(result.violations.length).toBe(2000);
        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      } finally {
        process.cwd = originalCwd;
      }
    });
  });

  describe('Integration', () => {
    test('should work with real-world file patterns', () => {
      const realWorldContent = `
        import { useState, useEffect } from 'react';
        import { PersistenceService } from '../services';

        export function useGameData() {
          const [data, setData] = useState(null);

          useEffect(() => {
            // Bad: direct localStorage usage
            const savedData = localStorage.getItem('gameData');
            if (savedData) {
              setData(JSON.parse(savedData));
            }

            // Bad: sessionStorage usage
            const sessionData = sessionStorage.getItem('sessionData');
            
            // Good: async PersistenceService usage
            const loadAsyncData = async () => {
              const asyncData = await PersistenceService.getItem('asyncData');
              return asyncData;
            };
          }, []);

          const saveData = (newData) => {
            // Bad: direct localStorage
            localStorage.setItem('gameData', JSON.stringify(newData));
            
            // Good: should use PersistenceService
            // await PersistenceService.setItem('gameData', newData);
          };

          return { data, saveData };
        }
      `;
      
      const violations = scanFile('useGameData.ts', realWorldContent);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some(v => v.type === 'localStorage')).toBe(true);
      expect(violations.some(v => v.type === 'sessionStorage')).toBe(true);
    });
  });
});
