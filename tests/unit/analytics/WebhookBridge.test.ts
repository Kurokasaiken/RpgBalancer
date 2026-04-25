/**
 * Webhook Bridge Tests
 * Unit tests for analytics webhook bridge functionality
 * 
 * @see NP-263 – Punch Club Analytics Webhook Bridge
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebhookBridge } from '../../../scripts/analytics/webhookBridge';

// Mock PersistenceService
const mockPersistence = {
  saveData: vi.fn(),
  loadData: vi.fn(),
};

// Mock fetch
global.fetch = vi.fn();

// Test configuration
const testConfig = {
  version: '1.0.0',
  enabled: true,
  endpoints: [
    {
      id: 'test_slack',
      name: 'Test Slack',
      url: 'https://hooks.slack.com/test',
      type: 'slack' as const,
      enabled: true,
    },
    {
      id: 'test_teams',
      name: 'Test Teams',
      url: 'https://outlook.office.com/test',
      type: 'teams' as const,
      enabled: true,
    },
  ],
  filters: [
    {
      id: 'test_filter',
      name: 'Test Filter',
      enabled: true,
      eventType: 'test_event',
      conditions: [
        {
          field: 'userId',
          operator: 'equals' as const,
          value: 'test-user',
        },
      ],
      actions: [
        {
          type: 'forward' as const,
          target: 'test_slack',
        },
      ],
    },
  ],
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
    strategy: 'sliding' as const,
  },
  retry: {
    maxAttempts: 1,
    backoffMs: 100,
    maxBackoffMs: 100,
    strategy: 'fixed' as const,
  },
  security: {
    signatureHeader: 'X-Test-Signature',
    secret: 'test-secret',
    timeoutMs: 50,
  },
};

describe('WebhookBridge', () => {
  let bridge: WebhookBridge;

  beforeEach(() => {
    vi.clearAllMocks();
    bridge = new WebhookBridge(testConfig, mockPersistence);
  });

  describe('Initialization', () => {
    it('should initialize with configuration', () => {
      expect(bridge).toBeDefined();
    });

    it('should load state from persistence', async () => {
      const mockState = {
        config: testConfig,
        stats: {
          totalEvents: 10,
          processedEvents: 8,
          forwardedEvents: 6,
          blockedEvents: 2,
          failedEvents: 0,
          endpointsStats: {},
          lastProcessed: Date.now(),
        },
        timestamp: Date.now(),
      };

      mockPersistence.loadData.mockResolvedValue(mockState);
      await bridge.loadState();

      expect(mockPersistence.loadData).toHaveBeenCalledWith(
        'analytics-webhook-bridge-state',
        expect.objectContaining({
          config: testConfig,
          stats: expect.any(Object),
          timestamp: expect.any(Number),
        })
      );
    });

    it('should handle load state errors gracefully', async () => {
      mockPersistence.loadData.mockRejectedValue(new Error('Load failed'));
      
      // Should not throw
      await expect(bridge.loadState()).resolves.toBeUndefined();
    });
  });

  describe('Event Processing', () => {
    it('should process events that match filters', async () => {
      const event = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { test: true },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      // Mock successful fetch
      (global.fetch as any).mockResolvedValue({
        ok: true,
      });

      await bridge.processEvent(event);

      const stats = bridge.getStats();
      expect(stats.totalEvents).toBe(1);
      expect(stats.processedEvents).toBe(1);
      expect(stats.forwardedEvents).toBe(1);
    });

    it('should block events that do not match filters', async () => {
      const event = {
        eventType: 'other_event',
        timestamp: Date.now(),
        data: { test: true },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      await bridge.processEvent(event);

      const stats = bridge.getStats();
      expect(stats.totalEvents).toBe(1);
      expect(stats.processedEvents).toBe(1);
      expect(stats.forwardedEvents).toBe(0);
    });

    it('should handle disabled bridge', async () => {
      const disabledConfig = { ...testConfig, enabled: false };
      const disabledBridge = new WebhookBridge(disabledConfig, mockPersistence);

      const event = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { test: true },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      await disabledBridge.processEvent(event);

      const stats = disabledBridge.getStats();
      expect(stats.totalEvents).toBe(0);
    });
  });

  describe('Filter Conditions', () => {
    it('should evaluate equals condition correctly', async () => {
      const filterConfig = {
        ...testConfig,
        filters: [
          {
            id: 'equals_filter',
            name: 'Equals Filter',
            enabled: true,
            eventType: 'test_event',
            conditions: [
              {
                field: 'userId',
                operator: 'equals' as const,
                value: 'test-user',
              },
            ],
            actions: [
              {
                type: 'forward' as const,
                target: 'test_slack',
              },
            ],
          },
        ],
      };

      const filteredBridge = new WebhookBridge(filterConfig, mockPersistence);

      const matchingEvent = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { test: true },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      const nonMatchingEvent = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { test: true },
        userId: 'other-user',
        sessionId: 'test-session',
      };

      (global.fetch as any).mockResolvedValue({ ok: true });

      await filteredBridge.processEvent(matchingEvent);
      await filteredBridge.processEvent(nonMatchingEvent);

      const stats = filteredBridge.getStats();
      expect(stats.forwardedEvents).toBe(1);
    });

    it('should evaluate contains condition correctly', async () => {
      const filterConfig = {
        ...testConfig,
        filters: [
          {
            id: 'contains_filter',
            name: 'Contains Filter',
            enabled: true,
            eventType: 'test_event',
            conditions: [
              {
                field: 'data.message',
                operator: 'contains' as const,
                value: 'important',
              },
            ],
            actions: [
              {
                type: 'forward' as const,
                target: 'test_slack',
              },
            ],
          },
        ],
      };

      const filteredBridge = new WebhookBridge(filterConfig, mockPersistence);

      const matchingEvent = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { message: 'This is important' },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      const nonMatchingEvent = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { message: 'This is normal' },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      (global.fetch as any).mockResolvedValue({ ok: true });

      await filteredBridge.processEvent(matchingEvent);
      await filteredBridge.processEvent(nonMatchingEvent);

      const stats = filteredBridge.getStats();
      expect(stats.forwardedEvents).toBe(1);
    });

    it('should evaluate greater than condition correctly', async () => {
      const filterConfig = {
        ...testConfig,
        filters: [
          {
            id: 'gt_filter',
            name: 'Greater Than Filter',
            enabled: true,
            eventType: 'test_event',
            conditions: [
              {
                field: 'data.value',
                operator: 'gt' as const,
                value: 100,
              },
            ],
            actions: [
              {
                type: 'forward' as const,
                target: 'test_slack',
              },
            ],
          },
        ],
      };

      const filteredBridge = new WebhookBridge(filterConfig, mockPersistence);

      const matchingEvent = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { value: 150 },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      const nonMatchingEvent = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { value: 50 },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      (global.fetch as any).mockResolvedValue({ ok: true });

      await filteredBridge.processEvent(matchingEvent);
      await filteredBridge.processEvent(nonMatchingEvent);

      const stats = filteredBridge.getStats();
      expect(stats.forwardedEvents).toBe(1);
    });

    it('should handle multiple conditions (AND logic)', async () => {
      const filterConfig = {
        ...testConfig,
        filters: [
          {
            id: 'multi_filter',
            name: 'Multi Condition Filter',
            enabled: true,
            eventType: 'test_event',
            conditions: [
              {
                field: 'userId',
                operator: 'equals' as const,
                value: 'test-user',
              },
              {
                field: 'data.priority',
                operator: 'equals' as const,
                value: 'high',
              },
            ],
            actions: [
              {
                type: 'forward' as const,
                target: 'test_slack',
              },
            ],
          },
        ],
      };

      const filteredBridge = new WebhookBridge(filterConfig, mockPersistence);

      const matchingEvent = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { priority: 'high' },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      const nonMatchingEvent1 = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { priority: 'high' },
        userId: 'other-user',
        sessionId: 'test-session',
      };

      const nonMatchingEvent2 = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { priority: 'low' },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      (global.fetch as any).mockResolvedValue({ ok: true });

      await filteredBridge.processEvent(matchingEvent);
      await filteredBridge.processEvent(nonMatchingEvent1);
      await filteredBridge.processEvent(nonMatchingEvent2);

      const stats = filteredBridge.getStats();
      expect(stats.forwardedEvents).toBe(1);
    });
  });

  describe('Filter Actions', () => {
    it('should handle block action', async () => {
      const filterConfig = {
        ...testConfig,
        filters: [
          {
            id: 'block_filter',
            name: 'Block Filter',
            enabled: true,
            eventType: 'blocked_event',
            conditions: [
              {
                field: 'data.block',
                operator: 'equals' as const,
                value: true,
              },
            ],
            actions: [
              {
                type: 'block' as const,
              },
            ],
          },
        ],
      };

      const filteredBridge = new WebhookBridge(filterConfig, mockPersistence);

      const event = {
        eventType: 'blocked_event',
        timestamp: Date.now(),
        data: { block: true },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      await filteredBridge.processEvent(event);

      const stats = filteredBridge.getStats();
      expect(stats.totalEvents).toBe(1);
      expect(stats.blockedEvents).toBe(1);
      expect(stats.forwardedEvents).toBe(0);
    });

    it('should handle delay action', async () => {
      const filterConfig = {
        ...testConfig,
        filters: [
          {
            id: 'delay_filter',
            name: 'Delay Filter',
            enabled: true,
            eventType: 'delayed_event',
            conditions: [
              {
                field: 'data.delay',
                operator: 'equals' as const,
                value: true,
              },
            ],
            actions: [
              {
                type: 'delay' as const,
                delay: 100,
              },
              {
                type: 'forward' as const,
                target: 'test_slack',
              },
            ],
          },
        ],
      };

      const filteredBridge = new WebhookBridge(filterConfig, mockPersistence);

      const event = {
        eventType: 'delayed_event',
        timestamp: Date.now(),
        data: { delay: true },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      (global.fetch as any).mockResolvedValue({ ok: true });

      const startTime = Date.now();
      await filteredBridge.processEvent(event);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
      expect(filteredBridge.getStats().forwardedEvents).toBe(1);
    });

    it('should handle transform action', async () => {
      const filterConfig = {
        ...testConfig,
        filters: [
          {
            id: 'transform_filter',
            name: 'Transform Filter',
            enabled: true,
            eventType: 'original_event',
            conditions: [
              {
                field: 'data.transform',
                operator: 'equals' as const,
                value: true,
              },
            ],
            actions: [
              {
                type: 'transform' as const,
                transform: {
                  template: 'TRANSFORMED: {{eventType}}',
                  variables: { prefix: 'TRANSFORMED' },
                },
              },
              {
                type: 'forward' as const,
                target: 'test_slack',
              },
            ],
          },
        ],
      };

      const filteredBridge = new WebhookBridge(filterConfig, mockPersistence);

      const event = {
        eventType: 'original_event',
        timestamp: Date.now(),
        data: { transform: true },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      (global.fetch as any).mockResolvedValue({ ok: true });

      await filteredBridge.processEvent(event);

      // Check that fetch was called with transformed event
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('TRANSFORMED: original_event'),
        })
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      const rateLimitConfig = {
        ...testConfig,
        rateLimit: {
          maxRequests: 2,
          windowMs: 1000,
          strategy: 'sliding' as const,
        },
      };

      const rateLimitedBridge = new WebhookBridge(rateLimitConfig, mockPersistence);

      const event = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { test: true },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      (global.fetch as any).mockResolvedValue({ ok: true });

      // Send 3 events rapidly
      await rateLimitedBridge.processEvent(event);
      await rateLimitedBridge.processEvent(event);
      await rateLimitedBridge.processEvent(event);

      const stats = rateLimitedBridge.getStats();
      // Only 2 should be forwarded due to rate limiting
      expect(stats.forwardedEvents).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle webhook delivery failures', async () => {
      const event = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { test: true },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      // Mock fetch failure
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await bridge.processEvent(event);

      const stats = bridge.getStats();
      expect(stats.totalEvents).toBe(1);
      expect(stats.failedEvents).toBe(1);
      expect(stats.forwardedEvents).toBe(0);
    });

    it('should handle HTTP errors', async () => {
      const event = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { test: true },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      // Mock HTTP error
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await bridge.processEvent(event);

      const stats = bridge.getStats();
      expect(stats.failedEvents).toBe(1);
      expect(stats.forwardedEvents).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should track statistics correctly', async () => {
      const events = [
        {
          eventType: 'test_event',
          timestamp: Date.now(),
          data: { test: true },
          userId: 'test-user',
          sessionId: 'test-session',
        },
        {
          eventType: 'other_event',
          timestamp: Date.now(),
          data: { test: false },
          userId: 'test-user',
          sessionId: 'test-session',
        },
      ];

      (global.fetch as any).mockResolvedValue({ ok: true });

      for (const event of events) {
        await bridge.processEvent(event);
      }

      const stats = bridge.getStats();
      expect(stats.totalEvents).toBe(2);
      expect(stats.processedEvents).toBe(2);
      expect(stats.forwardedEvents).toBe(1); // Only one matches filter
      expect(stats.blockedEvents).toBe(0);
      expect(stats.failedEvents).toBe(0);
    });

    it('should reset statistics', async () => {
      const event = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { test: true },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      (global.fetch as any).mockResolvedValue({ ok: true });

      await bridge.processEvent(event);
      expect(bridge.getStats().totalEvents).toBe(1);

      bridge.resetStats();
      expect(bridge.getStats().totalEvents).toBe(0);
    });

    it('should track endpoint statistics', async () => {
      const event = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { test: true },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      (global.fetch as any).mockResolvedValue({ ok: true });

      await bridge.processEvent(event);

      const stats = bridge.getStats();
      expect(stats.endpointsStats['test_slack']).toBeDefined();
      expect(stats.endpointsStats['test_slack'].sent).toBe(1);
      expect(stats.endpointsStats['test_slack'].failed).toBe(0);
    });
  });

  describe('Persistence', () => {
    it('should save state to persistence', async () => {
      await bridge.saveState();

      expect(mockPersistence.saveData).toHaveBeenCalledWith(
        'analytics-webhook-bridge-state',
        expect.objectContaining({
          config: testConfig,
          stats: expect.any(Object),
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe('Payload Generation', () => {
    it('should generate Slack payload correctly', async () => {
      const event = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { test: true },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      (global.fetch as any).mockResolvedValue({ ok: true });

      await bridge.processEvent(event);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          body: expect.stringContaining('Observatory Analytics: test_event'),
        })
      );
    });

    it('should use custom template when provided', async () => {
      const templateConfig = {
        ...testConfig,
        endpoints: [
          {
            ...testConfig.endpoints[0],
            template: {
              title: 'Custom {{eventType}}',
              text: 'User: {{userId}}',
              color: 'good',
              fields: [
                {
                  title: 'Event',
                  value: '{{eventType}}',
                  short: true,
                },
              ],
              footer: 'Custom Footer',
              timestamp: true,
              variables: {
                prefix: 'Custom',
              },
            },
          },
        ],
      };

      const customBridge = new WebhookBridge(templateConfig, mockPersistence);

      const event = {
        eventType: 'test_event',
        timestamp: Date.now(),
        data: { test: true },
        userId: 'test-user',
        sessionId: 'test-session',
      };

      (global.fetch as any).mockResolvedValue({ ok: true });

      await customBridge.processEvent(event);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          body: expect.stringContaining('Custom test_event'),
        })
      );
    });
  });
});
