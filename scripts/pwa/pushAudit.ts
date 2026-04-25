#!/usr/bin/env tsx
/**
 * Push Notification Readiness Audit CLI – NP-248
 * 
 * Audits push notification readiness for Punch Club PWA:
 * - Permission status
 * - Service Worker subscription
 * - Fallback schedule push
 * - Configuration validation
 * 
 * @since NP-248
 */

import { z } from 'zod';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Push audit result schema
 */
export const PushAuditResultSchema = z.object({
  timestamp: z.string(),
  auditId: z.string(),
  checks: z.object({
    permission: z.object({
      status: z.enum(['pass', 'fail', 'warning']),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
    }),
    serviceWorker: z.object({
      status: z.enum(['pass', 'fail', 'warning']),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
    }),
    subscription: z.object({
      status: z.enum(['pass', 'fail', 'warning']),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
    }),
    fallbackSchedule: z.object({
      status: z.enum(['pass', 'fail', 'warning']),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
    }),
    configuration: z.object({
      status: z.enum(['pass', 'fail', 'warning']),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
    }),
  }),
  summary: z.object({
    totalChecks: z.number(),
    passed: z.number(),
    failed: z.number(),
    warnings: z.number(),
    overallStatus: z.enum(['pass', 'fail', 'warning']),
  }),
  recommendations: z.array(z.string()),
});

export type PushAuditResult = z.infer<typeof PushAuditResultSchema>;

/**
 * Push configuration schema
 */
const PushConfigSchema = z.object({
  vapidPublicKey: z.string().optional(),
  notificationOptions: z.object({
    title: z.string(),
    body: z.string(),
    icon: z.string().optional(),
    badge: z.string().optional(),
    tag: z.string().optional(),
    requireInteraction: z.boolean().optional(),
  }).optional(),
  fallbackSchedule: z.object({
    enabled: z.boolean(),
    intervalMs: z.number().optional(),
    maxRetries: z.number().optional(),
  }).optional(),
});

type PushConfig = z.infer<typeof PushConfigSchema>;

/**
 * Push Notification Audit Engine
 */
export class PushNotificationAudit {
  private auditId: string;
  private results: PushAuditResult;
  private recommendations: string[] = [];

  constructor() {
    this.auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.results = this.initializeResults();
  }

  /**
   * Initialize audit results structure
   */
  private initializeResults(): PushAuditResult {
    return {
      timestamp: new Date().toISOString(),
      auditId: this.auditId,
      checks: {
        permission: { status: 'fail', message: 'Not checked' },
        serviceWorker: { status: 'fail', message: 'Not checked' },
        subscription: { status: 'fail', message: 'Not checked' },
        fallbackSchedule: { status: 'fail', message: 'Not checked' },
        configuration: { status: 'fail', message: 'Not checked' },
      },
      summary: {
        totalChecks: 5,
        passed: 0,
        failed: 0,
        warnings: 0,
        overallStatus: 'fail',
      },
      recommendations: [],
    };
  }

  /**
   * Check push notification permission
   */
  private checkPermission(): void {
    // In Node.js environment, we simulate browser checks
    // In real browser context, this would check Notification.permission
    
    const permissionStates = ['granted', 'denied', 'default'];
    const simulatedState = 'default'; // Simulated for CLI

    if (simulatedState === 'granted') {
      this.results.checks.permission = {
        status: 'pass',
        message: 'Push notification permission granted',
        details: { permission: simulatedState },
      };
    } else if (simulatedState === 'denied') {
      this.results.checks.permission = {
        status: 'fail',
        message: 'Push notification permission denied',
        details: { permission: simulatedState },
      };
      this.recommendations.push('User has denied push notifications. Implement permission re-request flow.');
    } else {
      this.results.checks.permission = {
        status: 'warning',
        message: 'Push notification permission not requested yet',
        details: { permission: simulatedState },
      };
      this.recommendations.push('Request push notification permission during onboarding or first session.');
    }
  }

  /**
   * Check Service Worker registration
   */
  private checkServiceWorker(): void {
    const swPath = join(process.cwd(), 'public', 'service-worker.js');
    const swExists = existsSync(swPath);

    if (swExists) {
      try {
        const swContent = readFileSync(swPath, 'utf-8');
        const hasPushHandler = swContent.includes('push') || swContent.includes('notification');
        
        if (hasPushHandler) {
          this.results.checks.serviceWorker = {
            status: 'pass',
            message: 'Service Worker exists with push handlers',
            details: { path: swPath, hasPushHandler },
          };
        } else {
          this.results.checks.serviceWorker = {
            status: 'warning',
            message: 'Service Worker exists but missing push handlers',
            details: { path: swPath, hasPushHandler },
          };
          this.recommendations.push('Add push event handlers to service-worker.js');
        }
      } catch (error) {
        this.results.checks.serviceWorker = {
          status: 'fail',
          message: 'Failed to read Service Worker file',
          details: { error: String(error) },
        };
      }
    } else {
      this.results.checks.serviceWorker = {
        status: 'fail',
        message: 'Service Worker file not found',
        details: { expectedPath: swPath },
      };
      this.recommendations.push('Create service-worker.js with push notification support');
    }
  }

  /**
   * Check push subscription configuration
   */
  private checkSubscription(): void {
    // Check for VAPID keys configuration
    const configPath = join(process.cwd(), 'pushConfig.json');
    const configExists = existsSync(configPath);

    if (configExists) {
      try {
        const configContent = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent) as PushConfig;
        const validated = PushConfigSchema.safeParse(config);

        if (validated.success) {
          const hasVapidKey = !!validated.data.vapidPublicKey;
          
          if (hasVapidKey) {
            this.results.checks.subscription = {
              status: 'pass',
              message: 'Push subscription configuration valid with VAPID key',
              details: { hasVapidKey, configPath },
            };
          } else {
            this.results.checks.subscription = {
              status: 'warning',
              message: 'Push configuration exists but missing VAPID public key',
              details: { hasVapidKey, configPath },
            };
            this.recommendations.push('Generate and configure VAPID keys for push notifications');
          }
        } else {
          this.results.checks.subscription = {
            status: 'fail',
            message: 'Push configuration invalid',
            details: { errors: validated.error.errors },
          };
          this.recommendations.push('Fix push configuration validation errors');
        }
      } catch (error) {
        this.results.checks.subscription = {
          status: 'fail',
          message: 'Failed to parse push configuration',
          details: { error: String(error) },
        };
      }
    } else {
      this.results.checks.subscription = {
        status: 'fail',
        message: 'Push configuration file not found',
        details: { expectedPath: configPath },
      };
      this.recommendations.push('Create pushConfig.json with VAPID keys and notification options');
    }
  }

  /**
   * Check fallback schedule push configuration
   */
  private checkFallbackSchedule(): void {
    const configPath = join(process.cwd(), 'pushConfig.json');
    
    if (existsSync(configPath)) {
      try {
        const configContent = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent) as PushConfig;
        
        if (config.fallbackSchedule?.enabled) {
          const hasInterval = !!config.fallbackSchedule.intervalMs;
          const hasRetries = !!config.fallbackSchedule.maxRetries;
          
          if (hasInterval && hasRetries) {
            this.results.checks.fallbackSchedule = {
              status: 'pass',
              message: 'Fallback schedule push configured correctly',
              details: {
                enabled: true,
                intervalMs: config.fallbackSchedule.intervalMs,
                maxRetries: config.fallbackSchedule.maxRetries,
              },
            };
          } else {
            this.results.checks.fallbackSchedule = {
              status: 'warning',
              message: 'Fallback schedule enabled but missing interval or retry config',
              details: { hasInterval, hasRetries },
            };
            this.recommendations.push('Configure fallback schedule interval and max retries');
          }
        } else {
          this.results.checks.fallbackSchedule = {
            status: 'warning',
            message: 'Fallback schedule push not enabled',
            details: { enabled: false },
          };
          this.recommendations.push('Enable fallback schedule push for reliability');
        }
      } catch (error) {
        this.results.checks.fallbackSchedule = {
          status: 'fail',
          message: 'Failed to check fallback schedule configuration',
          details: { error: String(error) },
        };
      }
    } else {
      this.results.checks.fallbackSchedule = {
        status: 'fail',
        message: 'Cannot check fallback schedule - config file missing',
      };
    }
  }

  /**
   * Check overall configuration
   */
  private checkConfiguration(): void {
    const configPath = join(process.cwd(), 'pushConfig.json');
    
    if (existsSync(configPath)) {
      try {
        const configContent = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent) as PushConfig;
        const validated = PushConfigSchema.safeParse(config);

        if (validated.success) {
          const hasNotificationOptions = !!validated.data.notificationOptions;
          const hasTitle = !!validated.data.notificationOptions?.title;
          const hasBody = !!validated.data.notificationOptions?.body;
          
          if (hasNotificationOptions && hasTitle && hasBody) {
            this.results.checks.configuration = {
              status: 'pass',
              message: 'Push notification configuration complete',
              details: { hasNotificationOptions, hasTitle, hasBody },
            };
          } else {
            this.results.checks.configuration = {
              status: 'warning',
              message: 'Push configuration incomplete',
              details: { hasNotificationOptions, hasTitle, hasBody },
            };
            this.recommendations.push('Complete notification options (title, body, icon)');
          }
        } else {
          this.results.checks.configuration = {
            status: 'fail',
            message: 'Configuration validation failed',
            details: { errors: validated.error.errors },
          };
        }
      } catch (error) {
        this.results.checks.configuration = {
          status: 'fail',
          message: 'Failed to validate configuration',
          details: { error: String(error) },
        };
      }
    } else {
      this.results.checks.configuration = {
        status: 'fail',
        message: 'Configuration file not found',
      };
    }
  }

  /**
   * Calculate summary
   */
  private calculateSummary(): void {
    const checks = Object.values(this.results.checks);
    
    this.results.summary.passed = checks.filter(c => c.status === 'pass').length;
    this.results.summary.failed = checks.filter(c => c.status === 'fail').length;
    this.results.summary.warnings = checks.filter(c => c.status === 'warning').length;

    if (this.results.summary.failed > 0) {
      this.results.summary.overallStatus = 'fail';
    } else if (this.results.summary.warnings > 0) {
      this.results.summary.overallStatus = 'warning';
    } else {
      this.results.summary.overallStatus = 'pass';
    }

    this.results.recommendations = this.recommendations;
  }

  /**
   * Run complete audit
   */
  async runAudit(): Promise<PushAuditResult> {
    console.log('🔍 Running Push Notification Readiness Audit...\n');

    this.checkPermission();
    this.checkServiceWorker();
    this.checkSubscription();
    this.checkFallbackSchedule();
    this.checkConfiguration();
    this.calculateSummary();

    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`⚠️  Warnings: ${this.results.summary.warnings}`);
    console.log(`❌ Failed: ${this.results.summary.failed}\n`);

    return this.results;
  }

  /**
   * Export to JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.results, null, 2);
  }

  /**
   * Export to Markdown
   */
  exportMarkdown(): string {
    const lines: string[] = [];

    lines.push('# Push Notification Readiness Audit Report');
    lines.push('');
    lines.push(`**Audit ID**: ${this.results.auditId}`);
    lines.push(`**Timestamp**: ${this.results.timestamp}`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push(`- **Overall Status**: ${this.results.summary.overallStatus.toUpperCase()}`);
    lines.push(`- **Total Checks**: ${this.results.summary.totalChecks}`);
    lines.push(`- **Passed**: ${this.results.summary.passed} ✅`);
    lines.push(`- **Warnings**: ${this.results.summary.warnings} ⚠️`);
    lines.push(`- **Failed**: ${this.results.summary.failed} ❌`);
    lines.push('');

    // Checks
    lines.push('## Audit Checks');
    lines.push('');

    const checkNames = {
      permission: 'Permission Status',
      serviceWorker: 'Service Worker',
      subscription: 'Push Subscription',
      fallbackSchedule: 'Fallback Schedule',
      configuration: 'Configuration',
    };

    for (const [key, name] of Object.entries(checkNames)) {
      const check = this.results.checks[key as keyof typeof this.results.checks];
      const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      
      lines.push(`### ${icon} ${name}`);
      lines.push('');
      lines.push(`**Status**: ${check.status.toUpperCase()}`);
      lines.push(`**Message**: ${check.message}`);
      
      if (check.details) {
        lines.push('');
        lines.push('**Details**:');
        lines.push('```json');
        lines.push(JSON.stringify(check.details, null, 2));
        lines.push('```');
      }
      lines.push('');
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      this.results.recommendations.forEach((rec, i) => {
        lines.push(`${i + 1}. ${rec}`);
      });
      lines.push('');
    }

    // Checklist
    lines.push('## Fix Checklist');
    lines.push('');
    lines.push('- [ ] Request push notification permission');
    lines.push('- [ ] Verify Service Worker registration');
    lines.push('- [ ] Configure VAPID keys');
    lines.push('- [ ] Set up push subscription');
    lines.push('- [ ] Enable fallback schedule push');
    lines.push('- [ ] Complete notification options');
    lines.push('- [ ] Test push notification delivery');
    lines.push('- [ ] Verify PersistenceService integration');
    lines.push('');

    return lines.join('\n');
  }
}

/**
 * CLI execution
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const format = args.includes('--json') ? 'json' : args.includes('--markdown') ? 'markdown' : 'both';
  const outputDir = 'test-results';

  // Create audit instance
  const audit = new PushNotificationAudit();

  // Run audit
  const result = await audit.runAudit();

  // Ensure output directory exists
  mkdirSync(outputDir, { recursive: true });

  // Generate outputs
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  if (format === 'json' || format === 'both') {
    const jsonPath = join(outputDir, `np-248-push-audit-${timestamp}.json`);
    writeFileSync(jsonPath, audit.exportJSON());
    console.log(`📄 JSON report: ${jsonPath}`);
  }

  if (format === 'markdown' || format === 'both') {
    const mdPath = join(outputDir, `np-248-push-audit-${timestamp}.md`);
    writeFileSync(mdPath, audit.exportMarkdown());
    console.log(`📄 Markdown report: ${mdPath}`);
  }

  // Exit with error code if audit failed
  if (result.summary.overallStatus === 'fail') {
    console.log('\n❌ Push notification readiness audit FAILED');
    process.exit(1);
  } else if (result.summary.overallStatus === 'warning') {
    console.log('\n⚠️  Push notification readiness audit completed with WARNINGS');
    process.exit(0);
  } else {
    console.log('\n✅ Push notification readiness audit PASSED');
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
