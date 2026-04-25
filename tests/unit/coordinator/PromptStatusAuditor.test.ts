/**
 * Coordinator Prompt Status Auditor Tests
 * Unit tests for prompt status analyzer
 * 
 * @see NP-145 – Coordinator Prompt Status Auditor CLI
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPromptStatusAnalyzer,
  PromptStatusAnalyzer,
  type PromptData,
  DEFAULT_STATUS_AUDIT_CONFIG,
} from '../../../src/coordinator/promptStatusAnalyzer';

describe('PromptStatusAnalyzer', () => {
  let analyzer: PromptStatusAnalyzer;

  beforeEach(() => {
    analyzer = createPromptStatusAnalyzer();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = analyzer.getConfig();
      expect(config.windowDays).toBe(30);
      expect(config.staleThresholdDays).toBe(7);
    });

    it('should accept custom configuration', () => {
      const customAnalyzer = createPromptStatusAnalyzer({
        windowDays: 14,
        staleThresholdDays: 5,
      });
      const config = customAnalyzer.getConfig();
      expect(config.windowDays).toBe(14);
      expect(config.staleThresholdDays).toBe(5);
    });

    it('should update configuration', () => {
      analyzer.updateConfig({ windowDays: 60 });
      const config = analyzer.getConfig();
      expect(config.windowDays).toBe(60);
    });
  });

  describe('Data Management', () => {
    it('should add single prompt', () => {
      const prompt: PromptData = {
        id: 'NP-001',
        description: 'Test Prompt',
        status: 'Non assegnato',
        priority: 'medium',
      };
      analyzer.addPrompt(prompt);
      const report = analyzer.analyzeStatus();
      expect(report.summary.totalPrompts).toBe(1);
    });

    it('should add multiple prompts', () => {
      const prompts: PromptData[] = [
        { id: 'NP-001', description: 'Prompt 1', status: 'Non assegnato' },
        { id: 'NP-002', description: 'Prompt 2', status: 'In corso' },
      ];
      analyzer.addPrompts(prompts);
      const report = analyzer.analyzeStatus();
      expect(report.summary.totalPrompts).toBe(2);
    });

    it('should clear prompts', () => {
      analyzer.addPrompt({ id: 'NP-001', description: 'Test', status: 'Non assegnato' });
      analyzer.clearPrompts();
      const report = analyzer.analyzeStatus();
      expect(report.summary.totalPrompts).toBe(0);
    });
  });

  describe('Status Analysis', () => {
    it('should count prompts by status', () => {
      const prompts: PromptData[] = [
        { id: 'NP-001', description: 'P1', status: 'Non assegnato' },
        { id: 'NP-002', description: 'P2', status: 'In corso' },
        { id: 'NP-003', description: 'P3', status: 'Completato' },
        { id: 'NP-004', description: 'P4', status: 'Bloccato' },
      ];
      analyzer.addPrompts(prompts);
      const report = analyzer.analyzeStatus();
      
      expect(report.summary.nonAssegnato).toBe(1);
      expect(report.summary.inCorso).toBe(1);
      expect(report.summary.completato).toBe(1);
      expect(report.summary.bloccato).toBe(1);
    });

    it('should detect stale prompts', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      
      const prompt: PromptData = {
        id: 'NP-001',
        description: 'Stale Prompt',
        status: 'In corso',
        startDate: oldDate.toISOString(),
        priority: 'medium',
      };
      
      analyzer.addPrompt(prompt);
      const report = analyzer.analyzeStatus();
      
      expect(report.summary.stalePrompts).toBeGreaterThan(0);
      expect(report.stalePrompts.length).toBeGreaterThan(0);
    });

    it('should detect blocked prompts', () => {
      const prompt: PromptData = {
        id: 'NP-001',
        description: 'Blocked Prompt',
        status: 'Bloccato',
      };
      
      analyzer.addPrompt(prompt);
      const report = analyzer.analyzeStatus();
      
      expect(report.summary.blockedPrompts).toBe(1);
      expect(report.blockedPrompts.length).toBe(1);
    });

    it('should calculate acceptance rate', () => {
      const prompts: PromptData[] = [
        { id: 'NP-001', description: 'P1', status: 'Completato' },
        { id: 'NP-002', description: 'P2', status: 'Completato' },
        { id: 'NP-003', description: 'P3', status: 'In corso' },
        { id: 'NP-004', description: 'P4', status: 'Non assegnato' },
      ];
      
      analyzer.addPrompts(prompts);
      const report = analyzer.analyzeStatus();
      
      expect(report.summary.acceptanceRate).toBe(50); // 2/4 = 50%
    });
  });

  describe('Recommendations', () => {
    it('should recommend action for stale prompts', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 15);
      
      const prompt: PromptData = {
        id: 'NP-001',
        description: 'Very Stale',
        status: 'In corso',
        startDate: oldDate.toISOString(),
        priority: 'medium',
      };
      
      analyzer.addPrompt(prompt);
      const report = analyzer.analyzeStatus();
      
      expect(report.stalePrompts.length).toBeGreaterThan(0);
      expect(report.stalePrompts[0].recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend action for blocked prompts', () => {
      const prompt: PromptData = {
        id: 'NP-001',
        description: 'Blocked',
        status: 'Bloccato',
      };
      
      analyzer.addPrompt(prompt);
      const report = analyzer.analyzeStatus();
      
      expect(report.blockedPrompts[0].recommendations).toContain(
        expect.stringContaining('Blocked')
      );
    });

    it('should recommend action for low acceptance rate', () => {
      const prompts: PromptData[] = [
        { id: 'NP-001', description: 'P1', status: 'Non assegnato' },
        { id: 'NP-002', description: 'P2', status: 'In corso' },
        { id: 'NP-003', description: 'P3', status: 'Completato' },
      ];
      
      analyzer.addPrompts(prompts);
      const report = analyzer.analyzeStatus();
      
      // 1/3 = 33.3% < 90%
      expect(report.recommendations.some(r => r.includes('Acceptance rate'))).toBe(true);
    });

    it('should show success message when all good', () => {
      const prompts: PromptData[] = [
        { id: 'NP-001', description: 'P1', status: 'Completato' },
        { id: 'NP-002', description: 'P2', status: 'Completato' },
        { id: 'NP-003', description: 'P3', status: 'Completato' },
      ];
      
      analyzer.addPrompts(prompts);
      const report = analyzer.analyzeStatus();
      
      expect(report.recommendations.some(r => r.includes('✅'))).toBe(true);
    });
  });

  describe('Export Formats', () => {
    it('should export to Markdown', () => {
      const prompt: PromptData = {
        id: 'NP-001',
        description: 'Test',
        status: 'Completato',
      };
      
      analyzer.addPrompt(prompt);
      const report = analyzer.analyzeStatus();
      const markdown = analyzer.exportToMarkdown(report);
      
      expect(markdown).toContain('# Coordinator Prompt Status Audit');
      expect(markdown).toContain('Summary');
      expect(markdown).toContain('Total Prompts');
    });

    it('should export to JSON', () => {
      const prompt: PromptData = {
        id: 'NP-001',
        description: 'Test',
        status: 'Completato',
      };
      
      analyzer.addPrompt(prompt);
      const report = analyzer.analyzeStatus();
      const json = analyzer.exportToJSON(report);
      
      expect(json).toBeTruthy();
      const parsed = JSON.parse(json);
      expect(parsed.summary).toBeDefined();
      expect(parsed.summary.totalPrompts).toBe(1);
    });

    it('should include stale prompts in Markdown', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      
      const prompt: PromptData = {
        id: 'NP-001',
        description: 'Stale',
        status: 'In corso',
        startDate: oldDate.toISOString(),
        priority: 'medium',
      };
      
      analyzer.addPrompt(prompt);
      const report = analyzer.analyzeStatus();
      const markdown = analyzer.exportToMarkdown(report);
      
      if (report.stalePrompts.length > 0) {
        expect(markdown).toContain('Stale Prompts');
      }
    });

    it('should include blocked prompts in Markdown', () => {
      const prompt: PromptData = {
        id: 'NP-001',
        description: 'Blocked',
        status: 'Bloccato',
      };
      
      analyzer.addPrompt(prompt);
      const report = analyzer.analyzeStatus();
      const markdown = analyzer.exportToMarkdown(report);
      
      expect(markdown).toContain('Blocked Prompts');
    });
  });

  describe('Priority Handling', () => {
    it('should use priority-specific thresholds', () => {
      const criticalPrompt: PromptData = {
        id: 'NP-001',
        description: 'Critical',
        status: 'In corso',
        priority: 'critical',
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      };
      
      analyzer.addPrompt(criticalPrompt);
      const report = analyzer.analyzeStatus();
      
      // Critical threshold is 1 day, so 2 days should be stale
      expect(report.stalePrompts.length).toBeGreaterThan(0);
    });

    it('should recommend expediting critical prompts', () => {
      const prompt: PromptData = {
        id: 'NP-001',
        description: 'Critical',
        status: 'In corso',
        priority: 'critical',
      };
      
      analyzer.addPrompt(prompt);
      const report = analyzer.analyzeStatus();
      
      const analysis = report.allPrompts[0];
      expect(analysis.recommendations.some(r => r.includes('Critical'))).toBe(true);
    });
  });

  describe('Dependency Tracking', () => {
    it('should detect unmet dependencies', () => {
      const prompts: PromptData[] = [
        {
          id: 'NP-001',
          description: 'Dependent',
          status: 'In corso',
          dependencies: ['NP-999'], // Non-existent dependency
        },
      ];
      
      analyzer.addPrompts(prompts);
      const report = analyzer.analyzeStatus();
      
      expect(report.allPrompts[0].hasUnmetDependencies).toBe(true);
    });

    it('should not flag met dependencies', () => {
      const prompts: PromptData[] = [
        {
          id: 'NP-001',
          description: 'Dependency',
          status: 'Completato',
        },
        {
          id: 'NP-002',
          description: 'Dependent',
          status: 'In corso',
          dependencies: ['NP-001'],
        },
      ];
      
      analyzer.addPrompts(prompts);
      const report = analyzer.analyzeStatus();
      
      const dependent = report.allPrompts.find(p => p.promptId === 'NP-002');
      expect(dependent?.hasUnmetDependencies).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty prompt list', () => {
      const report = analyzer.analyzeStatus();
      expect(report.summary.totalPrompts).toBe(0);
      expect(report.summary.acceptanceRate).toBe(0);
    });

    it('should handle prompts without dates', () => {
      const prompt: PromptData = {
        id: 'NP-001',
        description: 'No dates',
        status: 'Non assegnato',
      };
      
      analyzer.addPrompt(prompt);
      const report = analyzer.analyzeStatus();
      
      expect(report.allPrompts[0].daysInStatus).toBe(0);
    });

    it('should handle prompts without priority', () => {
      const prompt: PromptData = {
        id: 'NP-001',
        description: 'No priority',
        status: 'In corso',
      };
      
      analyzer.addPrompt(prompt);
      const report = analyzer.analyzeStatus();
      
      expect(report.allPrompts[0].priority).toBe('medium'); // Default
    });
  });
});
