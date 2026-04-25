/**
 * Analytics Webhook Bridge
 * Forward filtered analytics events to Slack/Teams/Discord with config-first filtering.
 *
 * @see NP-263 – Analytics Webhook Bridge
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { saveData as persistSaveData, loadData as persistLoadData } from '../../src/shared/persistence/PersistenceService';

// Webhook bridge types
interface WebhookConfig {
  version: string;
  enabled: boolean;
  endpoints: WebhookEndpoint[];
  filters: EventFilter[];
  rateLimit: RateLimitConfig;
  retry: RetryConfig;
  security: SecurityConfig;
}

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  type: 'slack' | 'teams' | 'discord' | 'custom';
  enabled: boolean;
  headers?: Record<string, string>;
  template?: MessageTemplate;
  rateLimit?: RateLimitConfig;
}

interface EventFilter {
  id: string;
  name: string;
  enabled: boolean;
  eventType: string | string[];
  conditions: FilterCondition[];
  actions: FilterAction[];
}

interface FilterCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string | number | boolean;
  caseSensitive?: boolean;
}

interface FilterAction {
  type: 'forward' | 'block' | 'transform' | 'delay';
  target?: string; // endpoint ID
  delay?: number; // milliseconds
  transform?: TransformConfig;
}

interface TransformConfig {
  template: string;
  variables: Record<string, string>;
}

interface MessageTemplate {
  title?: string;
  text?: string;
  color?: string;
  fields?: MessageField[];
  footer?: string;
  timestamp?: boolean;
  variables?: Record<string, string>;
}

interface MessageField {
  title: string;
  value: string;
  short?: boolean;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  strategy: 'sliding' | 'fixed';
}

interface RetryConfig {
  maxAttempts: number;
  backoffMs: number;
  maxBackoffMs: number;
  strategy: 'exponential' | 'linear' | 'fixed';
}

interface SecurityConfig {
  signatureHeader: string;
  secret: string;
  timeoutMs: number;
}

interface AnalyticsEvent {
  eventType: string;
  timestamp: number;
  data: Record<string, any>;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

interface WebhookPayload {
  event: AnalyticsEvent;
  endpoint: WebhookEndpoint;
  timestamp: number;
  signature: string;
}

interface PreparedPayload {
  body: any;
  signature: string;
}

interface BridgeStats {
  totalEvents: number;
  processedEvents: number;
  forwardedEvents: number;
  blockedEvents: number;
  failedEvents: number;
  endpointsStats: Record<string, EndpointStats>;
  lastProcessed: number;
}

interface EndpointStats {
  sent: number;
  failed: number;
  lastSent?: number;
  lastError?: string;
  averageLatency?: number;
}

/**
 * Webhook Bridge Class
 */
export class WebhookBridge {
  private config: WebhookConfig;
  private stats: BridgeStats;
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private persistence: BridgePersistence;
  private persistenceKey: string;

  constructor(config: WebhookConfig, persistence: BridgePersistence = defaultPersistence, persistenceKey = DEFAULT_PERSISTENCE_KEY) {
    this.config = config;
    this.persistence = persistence;
    this.persistenceKey = persistenceKey;
    this.stats = {
      totalEvents: 0,
      processedEvents: 0,
      forwardedEvents: 0,
      blockedEvents: 0,
      failedEvents: 0,
      endpointsStats: {},
      lastProcessed: 0,
    };
    this.initializeRateLimiters();
  }

  /**
   * Initialize rate limiters for each endpoint
   */
  private initializeRateLimiters(): void {
    for (const endpoint of this.config.endpoints) {
      const rateLimit = endpoint.rateLimit || this.config.rateLimit;
      this.rateLimiters.set(endpoint.id, new RateLimiter(rateLimit));
    }
  }

  /**
   * Process analytics event through filters and forward to endpoints
   */
  async processEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    this.stats.totalEvents++;
    this.stats.lastProcessed = Date.now();

    try {
      // Apply filters
      const filterResults = await this.applyFilters(event);
      
      // Forward to matching endpoints
      await this.forwardEvent(event, filterResults);
      
      this.stats.processedEvents++;
    } catch (error) {
      console.error('[WebhookBridge] Error processing event:', error);
      this.stats.failedEvents++;
    }
  }

  /**
   * Apply event filters
   */
  private async applyFilters(event: AnalyticsEvent): Promise<FilterAction[]> {
    const actions: FilterAction[] = [];

    for (const filter of this.config.filters) {
      if (!filter.enabled) {
        continue;
      }

      // Check if event type matches filter
      const eventTypes = Array.isArray(filter.eventType) ? filter.eventType : [filter.eventType];
      if (!eventTypes.includes(event.eventType)) {
        continue;
      }

      // Evaluate filter conditions
      const matches = await this.evaluateConditions(event, filter.conditions);
      
      if (matches) {
        actions.push(...filter.actions);
      }
    }

    return actions;
  }

  /**
   * Evaluate filter conditions
   */
  private async evaluateConditions(event: AnalyticsEvent, conditions: FilterCondition[]): Promise<boolean> {
    for (const condition of conditions) {
      const value = this.getFieldValue(event, condition.field);
      
      if (!this.evaluateCondition(value, condition)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get field value from event (supports nested paths)
   */
  private getFieldValue(event: AnalyticsEvent, field: string): any {
    const parts = field.split('.');
    let value: any = event;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(value: any, condition: FilterCondition): boolean {
    const { operator, value: conditionValue, caseSensitive = true } = condition;
    
    // Handle case sensitivity for strings
    const compareValue = typeof value === 'string' && !caseSensitive ? value.toLowerCase() : value;
    const compareConditionValue = typeof conditionValue === 'string' && !caseSensitive ? conditionValue.toLowerCase() : conditionValue;
    
    switch (operator) {
      case 'equals':
        return compareValue === compareConditionValue;
      case 'contains':
        return typeof compareValue === 'string' && compareValue.includes(String(compareConditionValue));
      case 'startsWith':
        return typeof compareValue === 'string' && compareValue.startsWith(String(compareConditionValue));
      case 'endsWith':
        return typeof compareValue === 'string' && compareValue.endsWith(String(compareConditionValue));
      case 'regex':
        return new RegExp(String(compareConditionValue)).test(String(compareValue));
      case 'gt':
        return Number(compareValue) > Number(compareConditionValue);
      case 'lt':
        return Number(compareValue) < Number(compareConditionValue);
      case 'gte':
        return Number(compareValue) >= Number(compareConditionValue);
      case 'lte':
        return Number(compareValue) <= Number(compareConditionValue);
      default:
        return false;
    }
  }

  /**
   * Forward event to endpoints based on filter actions
   */
  private async forwardEvent(event: AnalyticsEvent, actions: FilterAction[]): Promise<void> {
    const endpointMap = new Map(this.config.endpoints.map(ep => [ep.id, ep]));
    
    for (const action of actions) {
      switch (action.type) {
        case 'forward':
          if (action.target && endpointMap.has(action.target)) {
            const endpoint = endpointMap.get(action.target)!;
            if (endpoint.enabled) {
              await this.sendToEndpoint(event, endpoint, action);
            }
          }
          break;
          
        case 'block':
          // Event is blocked, don't forward to any endpoints
          this.stats.blockedEvents++;
          return;
          
        case 'delay':
          if (action.delay) {
            await this.delay(action.delay);
          }
          break;
          
        case 'transform':
          if (action.transform) {
            event = this.transformEvent(event, action.transform);
          }
          break;
      }
    }
  }

  /**
   * Send event to specific endpoint
   */
  private async sendToEndpoint(event: AnalyticsEvent, endpoint: WebhookEndpoint, action?: FilterAction): Promise<void> {
    const rateLimiter = this.rateLimiters.get(endpoint.id);
    
    // Check rate limit
    if (rateLimiter && !rateLimiter.checkLimit()) {
      console.warn(`[WebhookBridge] Rate limit exceeded for endpoint: ${endpoint.name}`);
      return;
    }

    try {
      const payload = this.createPayload(event, endpoint);
      const startTime = Date.now();
      
      await this.sendWebhook(endpoint.url, payload, endpoint.headers);
      
      const latency = Date.now() - startTime;
      this.updateEndpointStats(endpoint.id, true, latency);
      this.stats.forwardedEvents++;
      
      console.log(`[WebhookBridge] Event forwarded to ${endpoint.name} (${latency}ms)`);
    } catch (error) {
      this.updateEndpointStats(endpoint.id, false);
      this.stats.failedEvents++;
      
      // Retry logic
      if (this.config.retry.maxAttempts > 1) {
        await this.retrySend(event, endpoint, action);
      }
      
      console.error(`[WebhookBridge] Failed to send to ${endpoint.name}:`, error);
    }
  }

  /**
   * Create webhook payload for endpoint
   */
  private createPayload(event: AnalyticsEvent, endpoint: WebhookEndpoint): PreparedPayload {
    const basePayload: WebhookPayload = {
      event,
      endpoint,
      timestamp: Date.now(),
      signature: this.createSignature(event),
    };

    let body: any;

    // Apply endpoint template if configured
    if (endpoint.template) {
      body = this.applyTemplate(basePayload, endpoint.template, endpoint.type);
    } else {
      // Default payload based on endpoint type
      switch (endpoint.type) {
        case 'slack':
          body = this.createSlackPayload(basePayload);
          break;
        case 'teams':
          body = this.createTeamsPayload(basePayload);
          break;
        case 'discord':
          body = this.createDiscordPayload(basePayload);
          break;
        default:
          body = basePayload;
      }
    }

    return {
      body,
      signature: basePayload.signature,
    };
  }

  /**
   * Create Slack payload
   */
  private createSlackPayload(payload: WebhookPayload): any {
    return {
      text: `Observatory Analytics: ${payload.event.eventType}`,
      attachments: [
        {
          color: 'good',
          fields: [
            {
              title: 'Event Type',
              value: payload.event.eventType,
              short: true,
            },
            {
              title: 'Timestamp',
              value: new Date(payload.event.timestamp).toISOString(),
              short: true,
            },
            {
              title: 'User ID',
              value: payload.event.userId || 'N/A',
              short: true,
            },
            {
              title: 'Session ID',
              value: payload.event.sessionId || 'N/A',
              short: true,
            },
          ],
          footer: 'Observatory Analytics',
          ts: Math.floor(payload.event.timestamp / 1000),
        },
      ],
    };
  }

  /**
   * Create Teams payload
   */
  private createTeamsPayload(payload: WebhookPayload): any {
    return {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": "0078D4",
      "summary": `Observatory Analytics: ${payload.event.eventType}`,
      "sections": [
        {
          "activityTitle": `Analytics Event: ${payload.event.eventType}`,
          "activitySubtitle": new Date(payload.event.timestamp).toISOString(),
          "facts": [
            {
              "name": "Event Type",
              "value": payload.event.eventType,
            },
            {
              "name": "User ID",
              "value": payload.event.userId || 'N/A',
            },
            {
              "name": "Session ID",
              "value": payload.event.sessionId || 'N/A',
            },
          ],
          "markdown": true,
        },
      ],
    };
  }

  /**
   * Create Discord payload
   */
  private createDiscordPayload(payload: WebhookPayload): any {
    return {
      content: `📊 Observatory Analytics Event`,
      embeds: [
        {
          title: payload.event.eventType,
          description: `Analytics event from Observatory pipeline`,
          color: 0x0078D4,
          fields: [
            {
              name: 'User ID',
              value: payload.event.userId || 'N/A',
              inline: true,
            },
            {
              name: 'Session ID',
              value: payload.event.sessionId || 'N/A',
              inline: true,
            },
            {
              name: 'Timestamp',
              value: new Date(payload.event.timestamp).toISOString(),
              inline: false,
            },
          ],
          footer: {
            text: 'Observatory Analytics',
          },
          timestamp: new Date(payload.event.timestamp).toISOString(),
        },
      ],
    };
  }

  /**
   * Apply custom template to payload
   */
  private applyTemplate(payload: WebhookPayload, template: MessageTemplate, endpointType: string): any {
    const variables = {
      ...template.variables,
      eventType: payload.event.eventType,
      timestamp: new Date(payload.event.timestamp).toISOString(),
      userId: payload.event.userId || 'N/A',
      sessionId: payload.event.sessionId || 'N/A',
    };

    const replaceVariables = (text: string): string => {
      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return (variables as Record<string, string>)[key] || match;
      });
    };

    const result: any = {};

    if (template.title) {
      result.title = replaceVariables(template.title);
    }

    if (template.text) {
      result.text = replaceVariables(template.text);
    }

    if (template.color) {
      result.color = template.color;
    }

    if (template.fields) {
      result.fields = template.fields.map(field => ({
        title: replaceVariables(field.title),
        value: replaceVariables(field.value),
        short: field.short,
      }));
    }

    if (template.footer) {
      result.footer = replaceVariables(template.footer);
    }

    if (template.timestamp) {
      result.timestamp = Math.floor(payload.event.timestamp / 1000);
    }

    // Wrap in endpoint-specific format
    switch (endpointType) {
      case 'slack':
        return {
          text: result.title || result.text,
          attachments: [result],
        };
      case 'teams':
        return {
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          themeColor: result.color || "0078D4",
          summary: result.title || result.text,
          sections: [result],
        };
      case 'discord':
        return {
          content: result.title || result.text,
          embeds: [result],
        };
      default:
        return result;
    }
  }

  /**
   * Transform event based on configuration
   */
  private transformEvent(event: AnalyticsEvent, transform: TransformConfig): AnalyticsEvent {
    const variables = {
      ...transform.variables,
      eventType: event.eventType,
      timestamp: event.timestamp.toString(),
      userId: event.userId || '',
      sessionId: event.sessionId || '',
    };

    const replaceVariables = (text: string): string => {
      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return (variables as Record<string, string>)[key] || match;
      });
    };

    // Create new event with transformed data
    return {
      ...event,
      eventType: replaceVariables(transform.template),
      data: {
        ...event.data,
        transformed: true,
        originalType: event.eventType,
      },
    };
  }

  /**
   * Create signature for payload
   */
  private createSignature(event: AnalyticsEvent): string {
    const payload = JSON.stringify(event);
    return createHash('sha256')
      .update(payload + this.config.security.secret)
      .digest('hex');
  }

  /**
   * Send webhook with retry logic
   */
  private async sendWebhook(url: string, payload: PreparedPayload, headers?: Record<string, string>): Promise<void> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Observatory-WebhookBridge/1.0',
        ...headers,
        [this.config.security.signatureHeader]: payload.signature,
      },
      body: JSON.stringify(payload.body),
      signal: AbortSignal.timeout(this.config.security.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Retry sending webhook
   */
  private async retrySend(event: AnalyticsEvent, endpoint: WebhookEndpoint, action?: FilterAction): Promise<void> {
    const { maxAttempts, backoffMs, maxBackoffMs, strategy } = this.config.retry;
    
    for (let attempt = 2; attempt <= maxAttempts; attempt++) {
      const delay = this.calculateRetryDelay(attempt, backoffMs, maxBackoffMs, strategy);
      await this.delay(delay);
      
      try {
        await this.sendToEndpoint(event, endpoint, action);
        console.log(`[WebhookBridge] Retry successful for ${endpoint.name} (attempt ${attempt})`);
        return;
      } catch (error) {
        console.error(`[WebhookBridge] Retry ${attempt} failed for ${endpoint.name}:`, error);
      }
    }
  }

  /**
   * Calculate retry delay
   */
  private calculateRetryDelay(attempt: number, baseMs: number, maxMs: number, strategy: string): number {
    let delay: number;
    
    switch (strategy) {
      case 'exponential':
        delay = baseMs * Math.pow(2, attempt - 1);
        break;
      case 'linear':
        delay = baseMs * attempt;
        break;
      case 'fixed':
      default:
        delay = baseMs;
        break;
    }
    
    return Math.min(delay, maxMs);
  }

  /**
   * Update endpoint statistics
   */
  private updateEndpointStats(endpointId: string, success: boolean, latency?: number): void {
    if (!this.stats.endpointsStats[endpointId]) {
      this.stats.endpointsStats[endpointId] = {
        sent: 0,
        failed: 0,
      };
    }
    
    const stats = this.stats.endpointsStats[endpointId];
    
    if (success) {
      stats.sent++;
      stats.lastSent = Date.now();
      
      if (latency !== undefined) {
        if (stats.averageLatency === undefined) {
          stats.averageLatency = latency;
        } else {
          stats.averageLatency = (stats.averageLatency + latency) / 2;
        }
      }
    } else {
      stats.failed++;
    }
  }

  /**
   * Get bridge statistics
   */
  getStats(): BridgeStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalEvents: 0,
      processedEvents: 0,
      forwardedEvents: 0,
      blockedEvents: 0,
      failedEvents: 0,
      endpointsStats: {},
      lastProcessed: 0,
    };
  }

  /**
   * Save configuration and stats to persistence
   */
  /**
   * Persist current bridge configuration and stats.
   */
  async saveState(): Promise<void> {
    const state = {
      config: this.config,
      stats: this.stats,
      timestamp: Date.now(),
    };

    await this.persistence.saveData(this.persistenceKey, state);
  }

  /**
   * Load configuration and stats from persistence
   */
  async loadState(): Promise<void> {
    try {
      const defaultState: BridgeState = {
        config: this.config,
        stats: this.stats,
        timestamp: Date.now(),
      };
      const state = await this.persistence.loadData(this.persistenceKey, defaultState);

      this.config = state.config;
      this.stats = state.stats;
      this.initializeRateLimiters();
    } catch (error) {
      console.error('[WebhookBridge] Failed to load state:', error);
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Rate Limiter Class
 */
class RateLimiter {
  private requests: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  checkLimit(): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Remove old requests
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);
    
    // Check if under limit
    if (this.requests.length < this.config.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }

  getRemainingRequests(): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const recentRequests = this.requests.filter(timestamp => timestamp > windowStart);
    return Math.max(0, this.config.maxRequests - recentRequests.length);
  }

  getResetTime(): number {
    if (this.requests.length === 0) {
      return 0;
    }
    
    const oldestRequest = Math.min(...this.requests);
    return oldestRequest + this.config.windowMs;
  }
}

/**
 * Persistence Service Interface
 */
interface BridgeState {
  config: WebhookConfig;
  stats: BridgeStats;
  timestamp: number;
}

interface BridgePersistence {
  saveData<T>(key: string, data: T): Promise<void>;
  loadData<T>(key: string, defaultValue: T): Promise<T>;
}

const DEFAULT_PERSISTENCE_KEY = 'analytics-webhook-bridge-state';

const defaultPersistence: BridgePersistence = {
  saveData: persistSaveData,
  loadData: persistLoadData,
};

/**
 * CLI Interface
 */
interface CLIArgs {
  config?: string;
  action?: 'process' | 'stats' | 'test' | 'reset';
  eventFile?: string;
  verbose?: boolean;
  help?: boolean;
}

function parseArgs(): CLIArgs {
  const args: CLIArgs = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    
    if (arg === '--config' && argv[i + 1]) {
      args.config = argv[i + 1];
      i++;
    } else if (arg === '--action' && argv[i + 1]) {
      args.action = argv[i + 1] as 'process' | 'stats' | 'test' | 'reset';
      i++;
    } else if (arg === '--event-file' && argv[i + 1]) {
      args.eventFile = argv[i + 1];
      i++;
    } else if (arg === '--verbose' || arg === '-v') {
      args.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }

  return args;
}

function showHelp(): void {
  console.log(`
Observatory Analytics Webhook Bridge

Usage:
  tsx scripts/analytics/webhookBridge.ts [options]

Options:
  --config <path>        Configuration file path (default: webhookConfig.json)
  --action <type>        Action: process, stats, test, reset (default: process)
  --event-file <path>    Event file for processing (with --action process)
  -v, --verbose          Verbose output
  -h, --help             Show this help message

Examples:
  tsx scripts/analytics/webhookBridge.ts
  tsx scripts/analytics/webhookBridge.ts --action stats
  tsx scripts/analytics/webhookBridge.ts --action test
  tsx scripts/analytics/webhookBridge.ts --action process --event-file events.json
  `);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  const configPath = args.config || join(process.cwd(), 'webhookConfig.json');
  
  if (!existsSync(configPath)) {
    console.error(`❌ Configuration file not found: ${configPath}`);
    console.error('Please create a webhookConfig.json file or specify --config');
    process.exit(1);
  }

  // Load configuration
  const configData = readFileSync(configPath, 'utf-8');
  const config: WebhookConfig = JSON.parse(configData);

  const bridge = new WebhookBridge(config);

  try {
    await bridge.loadState();
  } catch (error) {
    console.warn('⚠️  Could not load previous state, starting fresh');
  }

  switch (args.action) {
    case 'stats': {
      const stats = bridge.getStats();
      console.log('📊 Webhook Bridge Statistics:');
      console.log(`  Total Events: ${stats.totalEvents}`);
      console.log(`  Processed Events: ${stats.processedEvents}`);
      console.log(`  Forwarded Events: ${stats.forwardedEvents}`);
      console.log(`  Blocked Events: ${stats.blockedEvents}`);
      console.log(`  Failed Events: ${stats.failedEvents}`);
      console.log(`  Last Processed: ${new Date(stats.lastProcessed).toISOString()}`);
      
      if (Object.keys(stats.endpointsStats).length > 0) {
        console.log('\n📡 Endpoint Statistics:');
        for (const [endpointId, endpointStats] of Object.entries(stats.endpointsStats)) {
          console.log(`  ${endpointId}:`);
          console.log(`    Sent: ${endpointStats.sent}`);
          console.log(`    Failed: ${endpointStats.failed}`);
          console.log(`    Last Sent: ${endpointStats.lastSent ? new Date(endpointStats.lastSent).toISOString() : 'Never'}`);
          console.log(`    Avg Latency: ${endpointStats.averageLatency ? `${endpointStats.averageLatency.toFixed(2)}ms` : 'N/A'}`);
        }
      }
      break;
    }

    case 'test': {
      console.log('🧪 Testing webhook bridge...');
      
      // Create test event
      const testEvent: AnalyticsEvent = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: {
          test: true,
          message: 'Webhook bridge test',
        },
        userId: 'test-user',
        sessionId: 'test-session',
      };
      
      await bridge.processEvent(testEvent);
      console.log('✅ Test event processed');
      
      const testStats = bridge.getStats();
      console.log(`📊 Test Results: ${testStats.processedEvents} processed, ${testStats.forwardedEvents} forwarded`);
      break;
    }

    case 'reset': {
      bridge.resetStats();
      console.log('🔄 Statistics reset');
      await bridge.saveState();
      break;
    }

    case 'process':
    default: {
      if (!args.eventFile) {
        throw new Error('Event file required for processing (--event-file)');
      }

      if (!existsSync(args.eventFile)) {
        throw new Error(`Event file not found: ${args.eventFile}`);
      }

      const eventData = readFileSync(args.eventFile, 'utf-8');
      const events: AnalyticsEvent[] = JSON.parse(eventData);

      console.log(`📨 Processing ${events.length} events...`);
      
      for (const event of events) {
        await bridge.processEvent(event);
        
        if (args.verbose) {
          console.log(`✅ Processed: ${event.eventType}`);
        }
      }

      const finalStats = bridge.getStats();
      console.log(`📊 Processing complete: ${finalStats.processedEvents} processed, ${finalStats.forwardedEvents} forwarded`);
      break;
    }
  }

  await bridge.saveState();
  console.log('💾 State saved');
}

function isDirectExecution(): boolean {
  if (typeof process === 'undefined' || !process.argv?.[1]) {
    return false;
  }

  const entryPath = process.argv[1].startsWith('file://')
    ? process.argv[1]
    : `file://${process.argv[1]}`;

  return import.meta.url === entryPath;
}

if (isDirectExecution()) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}
