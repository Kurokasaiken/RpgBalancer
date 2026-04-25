/**
 * Mobile Playtest Logger Tests - NP-225
 * 
 * Comprehensive test suite for playtest logging system.
 * 
 * @since 2026-01-24
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlaytestLogger } from '@/ui/playtest/systems/playtestLogger';
import {
  DEFAULT_PLAYTEST_CONFIG,
  type PlaytestEvent,
  type PlaytestSession,
  type BugReport,
  type DeviceInfo,
  generateEventId,
  generateSessionId,
  getDeviceInfo,
  isInteractionEvent,
  isErrorEvent,
  getEventSeverity,
  anonymizeEvent,
  filterSensitiveContent,
} from '@/ui/playtest/config/playtestConfig';

// Mock global objects
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Test Browser)',
  platform: 'Test Platform',
  vendor: 'Test Vendor',
  hardwareConcurrency: 4,
  maxTouchPoints: 5,
};

const mockScreen = {
  width: 1024,
  height: 768,
  colorDepth: 24,
};

const mockPerformance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50000000,
  },
};

const mockWindow = {
  devicePixelRatio: 2,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setInterval: vi.fn(),
  clearInterval: vi.fn(),
};

// Setup mocks
Object.defineProperty(globalThis, 'navigator', {
  value: mockNavigator,
  writable: true,
});

Object.defineProperty(globalThis, 'screen', {
  value: mockScreen,
  writable: true,
});

Object.defineProperty(globalThis, 'performance', {
  value: mockPerformance,
  writable: true,
});

Object.defineProperty(globalThis, 'window', {
  value: mockWindow,
  writable: true,
});

describe('Playtest Logger Configuration', () => {
  describe('generateEventId', () => {
    it('should generate unique event IDs', () => {
      const id1 = generateEventId();
      const id2 = generateEventId();
      
      expect(id1).toMatch(/^evt_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^evt_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should include timestamp in ID', () => {
      const id = generateEventId();
      const timestamp = parseInt(id.split('_')[1]);
      
      expect(timestamp).toBeCloseTo(Date.now(), 1000);
    });
  });

  describe('generateSessionId', () => {
    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      
      expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('getDeviceInfo', () => {
    it('should return device information', () => {
      const deviceInfo = getDeviceInfo();
      
      expect(deviceInfo.userAgent).toBe(mockNavigator.userAgent);
      expect(deviceInfo.platform).toBe(mockNavigator.platform);
      expect(deviceInfo.vendor).toBe(mockNavigator.vendor);
      expect(deviceInfo.hardwareConcurrency).toBe(mockNavigator.hardwareConcurrency);
      expect(deviceInfo.screenResolution).toBe('1024x768');
      expect(deviceInfo.colorDepth).toBe(mockScreen.colorDepth);
      expect(deviceInfo.pixelRatio).toBe(mockWindow.devicePixelRatio);
      expect(deviceInfo.touchSupport).toBe(true);
      expect(deviceInfo.maxTouchPoints).toBe(mockNavigator.maxTouchPoints);
    });
  });

  describe('isInteractionEvent', () => {
    it('should identify interaction events', () => {
      expect(isInteractionEvent('tap')).toBe(true);
      expect(isInteractionEvent('swipe')).toBe(true);
      expect(isInteractionEvent('pinch')).toBe(true);
      expect(isInteractionEvent('scroll')).toBe(true);
      expect(isInteractionEvent('interaction')).toBe(true);
    });

    it('should not identify non-interaction events', () => {
      expect(isInteractionEvent('error')).toBe(false);
      expect(isInteractionEvent('crash')).toBe(false);
      expect(isInteractionEvent('performance')).toBe(false);
      expect(isInteractionEvent('navigation')).toBe(false);
      expect(isInteractionEvent('session_start')).toBe(false);
      expect(isInteractionEvent('session_end')).toBe(false);
    });
  });

  describe('isErrorEvent', () => {
    it('should identify error events', () => {
      expect(isErrorEvent('error')).toBe(true);
      expect(isErrorEvent('crash')).toBe(true);
    });

    it('should not identify non-error events', () => {
      expect(isErrorEvent('tap')).toBe(false);
      expect(isErrorEvent('swipe')).toBe(false);
      expect(isErrorEvent('performance')).toBe(false);
      expect(isErrorEvent('navigation')).toBe(false);
      expect(isErrorEvent('session_start')).toBe(false);
      expect(isErrorEvent('session_end')).toBe(false);
    });
  });

  describe('getEventSeverity', () => {
    it('should return correct severity for crash', () => {
      const event: PlaytestEvent = {
        id: 'test',
        timestamp: Date.now(),
        type: 'crash',
        sessionId: 'session-1',
      };
      
      expect(getEventSeverity(event)).toBe('critical');
    });

    it('should return correct severity for error', () => {
      const event: PlaytestEvent = {
        id: 'test',
        timestamp: Date.now(),
        type: 'error',
        sessionId: 'session-1',
      };
      
      expect(getEventSeverity(event)).toBe('high');
    });

    it('should return correct severity for performance', () => {
      const event: PlaytestEvent = {
        id: 'test',
        timestamp: Date.now(),
        type: 'performance',
        sessionId: 'session-1',
      };
      
      expect(getEventSeverity(event)).toBe('medium');
    });

    it('should return low severity for other events', () => {
      const event: PlaytestEvent = {
        id: 'test',
        timestamp: Date.now(),
        type: 'tap',
        sessionId: 'session-1',
      };
      
      expect(getEventSeverity(event)).toBe('low');
    });
  });

  describe('anonymizeEvent', () => {
    it('should anonymize sensitive fields', () => {
      const event: PlaytestEvent = {
        id: 'test',
        timestamp: Date.now(),
        type: 'tap',
        sessionId: 'session-1',
        target: 'sensitive-element-123',
        element: 'Sensitive Element 123',
        stackTrace: 'Error at sensitive-function.js:123:45',
      };
      
      const anonymized = anonymizeEvent(event);
      
      expect(anonymized.target).toBe('*e***e***e***e***-***');
      expect(anonymized.element).toBe('*e***e***e*** *e***');
      expect(anonymized.stackTrace).toBe('[REDACTED]');
    });

    it('should preserve non-sensitive fields', () => {
      const event: PlaytestEvent = {
        id: 'test',
        timestamp: Date.now(),
        type: 'tap',
        sessionId: 'session-1',
        coordinates: { x: 100, y: 200 },
        duration: 500,
      };
      
      const anonymized = anonymizeEvent(event);
      
      expect(anonymized.id).toBe('test');
      expect(anonymized.timestamp).toBe(event.timestamp);
      expect(anonymized.type).toBe('tap');
      expect(anonymized.coordinates).toEqual(event.coordinates);
      expect(anonymized.duration).toBe(500);
    });
  });

  describe('filterSensitiveContent', () => {
    it('should filter credit card numbers', () => {
      const content = 'Card number: 4111-1111-1111-1111';
      const filtered = filterSensitiveContent(content);
      
      expect(filtered).toBe('Card number: [CARD]');
    });

    it('should filter email addresses', () => {
      const content = 'Email: test@example.com';
      const filtered = filterSensitiveContent(content);
      
      expect(filtered).toBe('Email: [EMAIL]');
    });

    it('should filter IP addresses', () => {
      const content = 'IP: 192.168.1.1';
      const filtered = filterSensitiveContent(content);
      
      expect(filtered).toBe('IP: [IP]');
    });

    it('should filter tokens', () => {
      const content = 'Token: abc123def456ghi789jkl';
      const filtered = filterSensitiveContent(content);
      
      expect(filtered).toBe('Token: [TOKEN]');
    });
  });
});

describe('PlaytestLogger', () => {
  let logger: PlaytestLogger;

  beforeEach(() => {
    logger = new PlaytestLogger();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Session Management', () => {
    it('should start a new session', async () => {
      const sessionId = await logger.startSession();
      
      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      
      const session = logger.getCurrentSession();
      expect(session).toBeDefined();
      expect(session!.id).toBe(sessionId);
      expect(session!.startTime).toBeDefined();
      expect(session!.deviceInfo).toBeDefined();
      expect(session!.buildVersion).toBeDefined();
      expect(session!.platform).toBeDefined();
    });

    it('should end current session', async () => {
      await logger.startSession();
      
      const session = await logger.endSession();
      
      expect(session).toBeDefined();
      expect(session!.endTime).toBeDefined();
      expect(session!.duration).toBeDefined();
      expect(session!.completed).toBe(true);
      expect(session!.events.length).toBeGreaterThan(0); // session_start + session_end
    });

    it('should return null when ending non-existent session', async () => {
      const session = await logger.endSession();
      
      expect(session).toBeNull();
    });

    it('should record session duration correctly', async () => {
      const startTime = Date.now();
      await logger.startSession();
      
      // Simulate some time passing
      vi.advanceTimersByTime(1000);
      mockPerformance.now.mockReturnValue(startTime + 1000);
      
      const session = await logger.endSession();
      
      expect(session!.duration).toBe(1000);
    });
  });

  describe('Event Logging', () => {
    beforeEach(async () => {
      await logger.startSession();
    });

    it('should log events during session', () => {
      logger.logEvent({
        type: 'tap',
        coordinates: { x: 100, y: 200 },
        target: 'button',
      });

      const session = logger.getCurrentSession();
      expect(session!.interactionCount).toBe(1);
    });

    it('should log error events', () => {
      logger.logEvent({
        type: 'error',
        value: 'Test error message',
        stackTrace: 'Error at test.js:1:1',
      });

      const session = logger.getCurrentSession();
      expect(session!.errorCount).toBe(1);
    });

    it('should log crash events', () => {
      logger.logEvent({
        type: 'crash',
        value: 'Application crashed',
      });

      const session = logger.getCurrentSession();
      expect(session!.crashDetected).toBe(true);
      expect(session!.errorCount).toBe(1);
    });

    it('should not log events when not recording', async () => {
      await logger.endSession();
      
      const initialCount = logger.getCurrentSession()?.events.length || 0;
      
      logger.logEvent({
        type: 'tap',
        coordinates: { x: 100, y: 200 },
      });

      expect(logger.getCurrentSession()?.events.length).toBe(initialCount);
    });

    it('should limit events per session', async () => {
      const limitedLogger = new PlaytestLogger({
        logging: {
          ...DEFAULT_PLAYTEST_CONFIG.logging,
          maxEventsPerSession: 5,
        },
      });
      
      await limitedLogger.startSession();
      
      // Log more events than limit
      for (let i = 0; i < 10; i++) {
        limitedLogger.logEvent({
          type: 'tap',
          coordinates: { x: i, y: i },
        });
      }

      const session = limitedLogger.getCurrentSession();
      expect(session!.events.length).toBe(5);
    });
  });

  describe('Heatmap Data', () => {
    beforeEach(async () => {
      await logger.startSession();
    });

    it('should add interaction events to heatmap', () => {
      logger.logEvent({
        type: 'tap',
        coordinates: { x: 100, y: 200 },
      });

      const heatmapData = logger.getHeatmapData();
      expect(heatmapData).toHaveLength(1);
      expect(heatmapData[0].x).toBe(100);
      expect(heatmapData[0].y).toBe(200);
      expect(heatmapData[0].type).toBe('tap');
    });

    it('should not add non-interaction events to heatmap', () => {
      logger.logEvent({
        type: 'error',
        value: 'Test error',
      });

      const heatmapData = logger.getHeatmapData();
      expect(heatmapData).toHaveLength(0);
    });

    it('should limit heatmap points', async () => {
      const limitedLogger = new PlaytestLogger({
        heatmap: {
          ...DEFAULT_PLAYTEST_CONFIG.heatmap,
          maxPoints: 3,
        },
      });
      
      await limitedLogger.startSession();
      
      // Add more points than limit
      for (let i = 0; i < 5; i++) {
        limitedLogger.logEvent({
          type: 'tap',
          coordinates: { x: i, y: i },
        });
      }

      const heatmapData = limitedLogger.getHeatmapData();
      expect(heatmapData).toHaveLength(3);
    });
  });

  describe('Bug Reports', () => {
    beforeEach(async () => {
      await logger.startSession();
    });

    it('should auto-create bug reports for errors', () => {
      logger.logEvent({
        type: 'error',
        value: 'Test error message',
      });

      const bugReports = logger.getBugReports();
      expect(bugReports).toHaveLength(1);
      expect(bugReports[0].type).toBe('error');
      expect(bugReports[0].severity).toBe('high');
    });

    it('should auto-create bug reports for crashes', () => {
      logger.logEvent({
        type: 'crash',
        value: 'Application crashed',
      });

      const bugReports = logger.getBugReports();
      expect(bugReports).toHaveLength(1);
      expect(bugReports[0].type).toBe('crash');
      expect(bugReports[0].severity).toBe('critical');
    });

    it('should respect severity threshold', async () => {
      const limitedLogger = new PlaytestLogger({
        bugReporting: {
          ...DEFAULT_PLAYTEST_CONFIG.bugReporting,
          severityThreshold: 'high',
        },
      });
      
      await limitedLogger.startSession();
      
      // Low severity event should not create report
      limitedLogger.logEvent({
        type: 'performance',
        value: 'Low performance',
      });

      const bugReports = limitedLogger.getBugReports();
      expect(bugReports).toHaveLength(0);
    });

    it('should create manual bug reports', () => {
      const reportId = logger.createManualBugReport({
        title: 'Manual Bug Report',
        description: 'Test description',
        steps: ['Step 1', 'Step 2'],
        expected: 'Expected behavior',
        actual: 'Actual behavior',
        severity: 'medium',
        type: 'ui',
        attachments: {
          logs: [],
          performance: {},
        },
        resolved: false,
      });

      const bugReports = logger.getBugReports();
      expect(bugReports).toHaveLength(1);
      expect(bugReports[0].id).toBe(reportId);
      expect(bugReports[0].title).toBe('Manual Bug Report');
    });

    it('should limit bug reports per session', async () => {
      const limitedLogger = new PlaytestLogger({
        bugReporting: {
          ...DEFAULT_PLAYTEST_CONFIG.bugReporting,
          maxReportsPerSession: 2,
        },
      });
      
      await limitedLogger.startSession();
      
      // Create more reports than limit
      for (let i = 0; i < 5; i++) {
        limitedLogger.logEvent({
          type: 'error',
          value: `Error ${i}`,
        });
      }

      const bugReports = limitedLogger.getBugReports();
      expect(bugReports.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Session Statistics', () => {
    it('should return statistics for active session', async () => {
      await logger.startSession();
      
      logger.logEvent({ type: 'tap', coordinates: { x: 100, y: 200 } });
      logger.logEvent({ type: 'swipe', coordinates: { x: 150, y: 250 } });
      logger.logEvent({ type: 'error', value: 'Test error' });

      const stats = logger.getSessionStats();
      
      expect(stats.eventCount).toBe(3);
      expect(stats.interactionCount).toBe(2);
      expect(stats.errorCount).toBe(1);
      expect(stats.bugReportCount).toBe(1);
      expect(stats.heatmapPointCount).toBe(2);
    });

    it('should return zero statistics for no session', () => {
      const stats = logger.getSessionStats();
      
      expect(stats.duration).toBe(0);
      expect(stats.eventCount).toBe(0);
      expect(stats.interactionCount).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(stats.bugReportCount).toBe(0);
      expect(stats.heatmapPointCount).toBe(0);
    });
  });

  describe('Export Functionality', () => {
    beforeEach(async () => {
      await logger.startSession();
    });

    it('should export session as JSON', async () => {
      logger.logEvent({
        type: 'tap',
        coordinates: { x: 100, y: 200 },
        value: 'test data',
      });

      const exported = await logger.exportSession('json');
      const parsed = JSON.parse(exported);
      
      expect(parsed.id).toBeDefined();
      expect(parsed.events).toHaveLength(2); // session_start + tap
      expect(parsed.events[1].type).toBe('tap');
    });

    it('should export session as CSV', async () => {
      logger.logEvent({
        type: 'tap',
        coordinates: { x: 100, y: 200 },
        value: 'test data',
      });

      const exported = await logger.exportSession('csv');
      
      expect(exported).toContain('Timestamp,Type,Element,Coordinates,Duration,Value');
      expect(exported).toContain('tap');
      expect(exported).toContain('100,200');
    });

    it('should throw error when no active session', async () => {
      await logger.endSession();
      
      await expect(logger.exportSession('json')).rejects.toThrow('No active session');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing session gracefully', () => {
      expect(() => logger.logEvent({ type: 'tap' })).not.toThrow();
      expect(logger.getCurrentSession()).toBeNull();
      expect(logger.getHeatmapData()).toEqual([]);
      expect(logger.getBugReports()).toEqual([]);
    });

    it('should handle export without session gracefully', async () => {
      await expect(logger.exportSession('json')).rejects.toThrow();
    });
  });
});

describe('Integration Tests', () => {
  let logger: PlaytestLogger;

  beforeEach(() => {
    logger = new PlaytestLogger();
    vi.clearAllMocks();
  });

  it('should handle complete playtest workflow', async () => {
    // Start session
    const sessionId = await logger.startSession();
    expect(sessionId).toBeDefined();

    // Log various events
    logger.logEvent({ type: 'tap', coordinates: { x: 100, y: 200 } });
    logger.logEvent({ type: 'swipe', coordinates: { x: 150, y: 250 }, direction: 'right' });
    logger.logEvent({ type: 'pinch', coordinates: { x: 200, y: 300 } });
    logger.logEvent({ type: 'scroll', value: 'Scrolled down' });
    logger.logEvent({ type: 'performance', value: { fps: 60, memory: 50000000 } });

    // Create manual bug report
    const reportId = logger.createManualBugReport({
      title: 'UI Issue',
      description: 'Button not responding',
      steps: ['1. Click button', '2. No response'],
      expected: 'Button should work',
      actual: 'Button not responding',
      severity: 'medium',
      type: 'ui',
      attachments: {
        logs: [],
        performance: {},
      },
      resolved: false,
    });

    // Check statistics
    const stats = logger.getSessionStats();
    expect(stats.eventCount).toBe(6);
    expect(stats.interactionCount).toBe(3);
    expect(stats.bugReportCount).toBe(1);
    expect(stats.heatmapPointCount).toBe(3);

    // Export data
    const jsonExport = await logger.exportSession('json');
    const csvExport = await logger.exportSession('csv');
    
    expect(jsonExport).toContain(sessionId);
    expect(csvExport).toContain('tap,swipe,pinch');

    // End session
    const session = await logger.endSession();
    expect(session).toBeDefined();
    expect(session!.completed).toBe(true);
    expect(session!.events.length).toBeGreaterThan(6); // includes session events
  });

  it('should handle error conditions gracefully', async () => {
    // Simulate error during session
    await logger.startSession();
    
    // Log error
    logger.logEvent({
      type: 'error',
      value: 'Test error',
      stackTrace: 'Error at test.js:1:1',
    });

    // Check crash detection
    const session = logger.getCurrentSession();
    expect(session!.errorCount).toBe(1);
    expect(session!.crashDetected).toBe(false);

    // Log crash
    logger.logEvent({
      type: 'crash',
      value: 'Application crashed',
    });

    const updatedSession = logger.getCurrentSession();
    expect(updatedSession!.crashDetected).toBe(true);
    expect(updatedSession!.errorCount).toBe(2);

    // End session should still work
    const finalSession = await logger.endSession();
    expect(finalSession).toBeDefined();
    expect(finalSession!.crashDetected).toBe(true);
  });
});
