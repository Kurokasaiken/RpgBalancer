import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { startTask, stopTask, pauseTask, resumeTask, loadTimeTrackingData } from './timeTracker.js';

const TEST_DATA_DIR = join(process.cwd(), 'test-results', 'time-tracking-test');

describe('Time Tracking System', () => {
  beforeEach(() => {
    // Mock the time tracking directory for testing
    process.env.TIME_TRACKING_TEST_DIR = TEST_DATA_DIR;
  });

  afterEach(() => {
    // Clean up test data
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true });
    }
    delete process.env.TIME_TRACKING_TEST_DIR;
  });

  it('should start and stop a task', () => {
    startTask('TEST-001', 'Test Task', 'TestAgent', 60);
    
    const data = loadTimeTrackingData();
    expect(data.entries).toHaveLength(1);
    
    const entry = data.entries[0];
    expect(entry.taskId).toBe('TEST-001');
    expect(entry.taskDescription).toBe('Test Task');
    expect(entry.agent).toBe('TestAgent');
    expect(entry.estimatedDuration).toBe(60);
    expect(entry.status).toBe('in_progress');
    expect(entry.startTime).toBeDefined();
    
    stopTask('TEST-001', 'Test completion');
    
    const updatedData = loadTimeTrackingData();
    const updatedEntry = updatedData.entries[0];
    expect(updatedEntry.status).toBe('completed');
    expect(updatedEntry.endTime).toBeDefined();
    expect(updatedEntry.duration).toBeGreaterThan(0);
    expect(updatedEntry.notes).toBe('Test completion');
  });

  it('should pause and resume a task', () => {
    startTask('TEST-002', 'Pause Test', 'TestAgent');
    
    pauseTask('TEST-002');
    
    const data = loadTimeTrackingData();
    const entry = data.entries[0];
    expect(entry.status).toBe('paused');
    expect(entry.endTime).toBeDefined();
    
    resumeTask('TEST-002');
    
    const resumedData = loadTimeTrackingData();
    const resumedEntry = resumedData.entries[0];
    expect(resumedEntry.status).toBe('in_progress');
    expect(resumedEntry.startTime).toBeDefined();
    expect(resumedEntry.endTime).toBeUndefined();
  });

  it('should handle multiple tasks', () => {
    startTask('TEST-003', 'Task 1', 'Agent1', 30);
    startTask('TEST-004', 'Task 2', 'Agent2', 45);
    
    const data = loadTimeTrackingData();
    expect(data.entries).toHaveLength(2);
    
    stopTask('TEST-003');
    
    const updatedData = loadTimeTrackingData();
    expect(updatedData.entries.filter(e => e.status === 'completed')).toHaveLength(1);
    expect(updatedData.entries.filter(e => e.status === 'in_progress')).toHaveLength(1);
  });

  it('should infer categories correctly', () => {
    startTask('TEST-005', 'Test implementation with unit tests', 'TestAgent');
    
    const data = loadTimeTrackingData();
    const entry = data.entries.find(e => e.taskId === 'TEST-005');
    expect(entry?.category).toBe('Testing');
    
    startTask('TEST-006', 'Fix bug in component', 'TestAgent');
    
    const bugData = loadTimeTrackingData();
    const bugEntry = bugData.entries.find(e => e.taskId === 'TEST-006');
    expect(bugEntry?.category).toBe('Bug Fix');
  });

  it('should update metadata correctly', () => {
    startTask('TEST-007', 'Metadata Test', 'TestAgent');
    stopTask('TEST-007');
    
    const data = loadTimeTrackingData();
    expect(data.metadata.totalTasks).toBe(1);
    expect(data.metadata.totalCompletedTasks).toBe(1);
    expect(data.metadata.totalTrackedMinutes).toBeGreaterThan(0);
  });
});
