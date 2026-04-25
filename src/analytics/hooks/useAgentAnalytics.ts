/**
 * Agent Analytics Hook - NP-125
 * 
 * React hook for accessing agent performance analytics data.
 * Provides real-time metrics, trends, and performance summaries.
 * 
 * @since 2026-01-23
 * @author Sentinel-Coordinator
 */

import { useState, useEffect, useMemo } from 'react';
import { AgentPerformanceAnalytics, type KanbanTask, type AgentPerformanceMetrics } from '../AgentPerformanceAnalytics';
import type { AgentAnalyticsConfig } from '../config/agentAnalyticsConfig';

/**
 * Hook return type
 */
export interface UseAgentAnalyticsReturn {
  /** All agent metrics */
  allMetrics: AgentPerformanceMetrics[];
  /** Metrics for a specific agent */
  getAgentMetrics: (agentName: string) => AgentPerformanceMetrics | undefined;
  /** Top performing agents */
  topPerformers: AgentPerformanceMetrics[];
  /** Agents needing attention */
  needsAttention: AgentPerformanceMetrics[];
  /** Summary report */
  summary: {
    totalAgents: number;
    totalTasks: number;
    completedTasks: number;
    averageQualityScore: number;
    averageVelocity: number;
  };
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refresh data */
  refresh: () => void;
}

/**
 * Parse Kanban CSV data
 */
function parseKanbanCSV(csvContent: string): KanbanTask[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const tasks: KanbanTask[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < headers.length) continue;

    const task: KanbanTask = {
      id: values[0] || '',
      status: values[1] || '',
      dependencies: values[2] || '',
      agent: values[3] || '',
      startTime: values[4] || '',
      endTime: values[5] || '',
      duration: parseFloat(values[6]) || 0,
      estimated: parseFloat(values[7]) || 0,
      lastUpdate: values[8] || '',
      notes: values.slice(9).join(',') || '',
    };

    tasks.push(task);
  }

  return tasks;
}

/**
 * Load Kanban data from CSV file
 */
async function loadKanbanData(): Promise<KanbanTask[]> {
  try {
    // Try to load from test-results/kanban-archives
    const response = await fetch('/test-results/kanban-archives/2026-01-12/kanban-history.csv');
    if (!response.ok) {
      throw new Error(`Failed to load Kanban data: ${response.statusText}`);
    }
    const csvContent = await response.text();
    return parseKanbanCSV(csvContent);
  } catch (error) {
    console.error('Error loading Kanban data:', error);
    return [];
  }
}

/**
 * Hook for agent performance analytics
 */
export function useAgentAnalytics(
  config?: Partial<AgentAnalyticsConfig>
): UseAgentAnalyticsReturn {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load Kanban data
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const kanbanTasks = await loadKanbanData();
        if (mounted) {
          setTasks(kanbanTasks);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [refreshTrigger]);

  // Create analytics engine
  const analytics = useMemo(() => {
    if (tasks.length === 0) return null;
    return new AgentPerformanceAnalytics(tasks, config);
  }, [tasks, config]);

  // Calculate all metrics
  const allMetrics = useMemo(() => {
    if (!analytics) return [];
    return analytics.getAllAgentMetrics();
  }, [analytics]);

  // Get top performers
  const topPerformers = useMemo(() => {
    if (!analytics) return [];
    return analytics.getTopPerformers(5);
  }, [analytics]);

  // Get agents needing attention
  const needsAttention = useMemo(() => {
    if (!analytics) return [];
    return analytics.getAgentsNeedingAttention();
  }, [analytics]);

  // Generate summary
  const summary = useMemo(() => {
    if (!analytics) {
      return {
        totalAgents: 0,
        totalTasks: 0,
        completedTasks: 0,
        averageQualityScore: 0,
        averageVelocity: 0,
      };
    }
    const report = analytics.generateSummaryReport();
    return {
      totalAgents: report.totalAgents,
      totalTasks: report.totalTasks,
      completedTasks: report.completedTasks,
      averageQualityScore: report.averageQualityScore,
      averageVelocity: report.averageVelocity,
    };
  }, [analytics]);

  // Get metrics for specific agent
  const getAgentMetrics = (agentName: string): AgentPerformanceMetrics | undefined => {
    return allMetrics.find(m => m.agentName === agentName);
  };

  // Refresh data
  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return {
    allMetrics,
    getAgentMetrics,
    topPerformers,
    needsAttention,
    summary,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Hook for agent trend data
 */
export function useAgentTrendData(
  agentName: string,
  days: number = 30,
  config?: Partial<AgentAnalyticsConfig>
) {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const kanbanTasks = await loadKanbanData();
        if (mounted) {
          setTasks(kanbanTasks);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const trendData = useMemo(() => {
    if (tasks.length === 0) return [];
    const analytics = new AgentPerformanceAnalytics(tasks, config);
    return analytics.getPerformanceTrendData(agentName, days);
  }, [tasks, agentName, days, config]);

  return {
    trendData,
    isLoading,
  };
}
