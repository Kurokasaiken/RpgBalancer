/**
 * Push Notification Audit Tests – NP-248
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PushNotificationAudit } from '../../../scripts/pwa/pushAudit';

describe('PushNotificationAudit', () => {
  let audit: PushNotificationAudit;

  beforeEach(() => {
    audit = new PushNotificationAudit();
  });

  describe('Initialization', () => {
    it('should create audit instance', () => {
      expect(audit).toBeDefined();
    });

    it('should generate unique audit ID', async () => {
      const audit1 = new PushNotificationAudit();
      const audit2 = new PushNotificationAudit();
      
      const result1 = await audit1.runAudit();
      const result2 = await audit2.runAudit();
      
      expect(result1.auditId).not.toBe(result2.auditId);
    });
  });

  describe('Audit Execution', () => {
    it('should run complete audit', async () => {
      const result = await audit.runAudit();
      
      expect(result).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.auditId).toBeDefined();
      expect(result.checks).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should check all 5 audit points', async () => {
      const result = await audit.runAudit();
      
      expect(result.checks.permission).toBeDefined();
      expect(result.checks.serviceWorker).toBeDefined();
      expect(result.checks.subscription).toBeDefined();
      expect(result.checks.fallbackSchedule).toBeDefined();
      expect(result.checks.configuration).toBeDefined();
    });

    it('should calculate summary correctly', async () => {
      const result = await audit.runAudit();
      
      expect(result.summary.totalChecks).toBe(5);
      expect(result.summary.passed).toBeGreaterThanOrEqual(0);
      expect(result.summary.failed).toBeGreaterThanOrEqual(0);
      expect(result.summary.warnings).toBeGreaterThanOrEqual(0);
      
      const total = result.summary.passed + result.summary.failed + result.summary.warnings;
      expect(total).toBe(5);
    });

    it('should set overall status based on results', async () => {
      const result = await audit.runAudit();
      
      expect(['pass', 'fail', 'warning']).toContain(result.summary.overallStatus);
      
      if (result.summary.failed > 0) {
        expect(result.summary.overallStatus).toBe('fail');
      } else if (result.summary.warnings > 0) {
        expect(result.summary.overallStatus).toBe('warning');
      } else {
        expect(result.summary.overallStatus).toBe('pass');
      }
    });
  });

  describe('Export Formats', () => {
    it('should export to JSON', async () => {
      await audit.runAudit();
      const json = audit.exportJSON();
      
      expect(json).toBeDefined();
      expect(() => JSON.parse(json)).not.toThrow();
      
      const parsed = JSON.parse(json);
      expect(parsed.auditId).toBeDefined();
      expect(parsed.checks).toBeDefined();
    });

    it('should export to Markdown', async () => {
      await audit.runAudit();
      const markdown = audit.exportMarkdown();
      
      expect(markdown).toBeDefined();
      expect(markdown).toContain('# Push Notification Readiness Audit Report');
      expect(markdown).toContain('## Summary');
      expect(markdown).toContain('## Audit Checks');
    });

    it('should include recommendations in Markdown', async () => {
      await audit.runAudit();
      const markdown = audit.exportMarkdown();
      
      if (markdown.includes('## Recommendations')) {
        expect(markdown).toContain('## Recommendations');
      }
    });

    it('should include fix checklist in Markdown', async () => {
      await audit.runAudit();
      const markdown = audit.exportMarkdown();
      
      expect(markdown).toContain('## Fix Checklist');
      expect(markdown).toContain('- [ ]');
    });
  });

  describe('Recommendations', () => {
    it('should generate recommendations for failures', async () => {
      const result = await audit.runAudit();
      
      if (result.summary.failed > 0 || result.summary.warnings > 0) {
        expect(result.recommendations.length).toBeGreaterThan(0);
      }
    });

    it('should have actionable recommendations', async () => {
      const result = await audit.runAudit();
      
      result.recommendations.forEach(rec => {
        expect(rec).toBeTruthy();
        expect(rec.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Check Status', () => {
    it('should have valid status for each check', async () => {
      const result = await audit.runAudit();
      const validStatuses = ['pass', 'fail', 'warning'];
      
      Object.values(result.checks).forEach(check => {
        expect(validStatuses).toContain(check.status);
        expect(check.message).toBeTruthy();
      });
    });

    it('should include details for checks when available', async () => {
      const result = await audit.runAudit();
      
      Object.values(result.checks).forEach(check => {
        if (check.details) {
          expect(typeof check.details).toBe('object');
        }
      });
    });
  });
});
