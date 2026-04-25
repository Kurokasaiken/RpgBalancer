import { useState, useEffect, useMemo } from 'react';
import type { 
  TimeTrackingData, 
  TimeEntry, 
  PerformanceMetrics, 
  AgentMetrics, 
  CategoryMetrics, 
  TimeTrendPoint,
  DashboardFilters 
} from '../types';

/**
 * Hook for loading and processing time tracking data for Performance Dashboard
 */
export function usePerformanceData(filters?: DashboardFilters) {
  const [data, setData] = useState<TimeTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from time tracking system
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        // For development: load sample data
        // In production: load from actual time tracking system
        const response = await fetch('/test-results/time-tracking/sample-data.json');
        if (!response.ok) {
          throw new Error(`Failed to load time tracking data: ${response.status}`);
        }
        
        const jsonData: TimeTrackingData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load time tracking data');
        console.error('Error loading performance data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter entries based on provided filters
  const filteredEntries = useMemo(() => {
    if (!data) return [];
    
    return data.entries.filter(entry => {
      // Agent filter
      if (filters?.agent && entry.agent !== filters.agent) {
        return false;
      }
      
      // Category filter
      if (filters?.category && entry.category !== filters.category) {
        return false;
      }
      
      // Status filter
      if (filters?.status && entry.status !== filters.status) {
        return false;
      }
      
      // Date range filter
      if (filters?.dateRange) {
        const entryDate = new Date(entry.createdAt);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        if (entryDate < startDate || entryDate > endDate) {
          return false;
        }
      }
      
      return true;
    });
  }, [data, filters]);

  // Calculate performance metrics
  const metrics = useMemo((): PerformanceMetrics | null => {
    if (!data || filteredEntries.length === 0) return null;

    const entries = filteredEntries;
    const completedEntries = entries.filter(e => e.status === 'completed');
    
    // Basic metrics
    const totalTasks = entries.length;
    const completedTasks = completedEntries.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const totalTrackedMinutes = completedEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const averageDuration = completedTasks > 0 ? totalTrackedMinutes / completedTasks : 0;

    // Agent metrics
    const agentMetrics = calculateAgentMetrics(entries);

    // Category metrics
    const categoryMetrics = calculateCategoryMetrics(entries);

    // Time trends (group by date)
    const timeTrends = calculateTimeTrends(entries);

    return {
      totalTasks,
      completedTasks,
      completionRate,
      totalTrackedMinutes,
      averageDuration,
      agentMetrics,
      categoryMetrics,
      timeTrends
    };
  }, [data, filteredEntries]);

  return {
    data,
    metrics,
    filteredEntries,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      // Trigger data reload by calling the inner function
      (async () => {
        try {
          setError(null);
          const response = await fetch('/test-results/time-tracking/sample-data.json');
          if (!response.ok) {
            throw new Error(`Failed to load time tracking data: ${response.status}`);
          }
          const jsonData: TimeTrackingData = await response.json();
          setData(jsonData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load time tracking data');
        } finally {
          setLoading(false);
        }
      })();
    }
  };
}

/**
 * Calculate agent performance metrics
 */
function calculateAgentMetrics(entries: TimeEntry[]): Record<string, AgentMetrics> {
  const agentMap = new Map<string, TimeEntry[]>();
  
  // Group entries by agent
  entries.forEach(entry => {
    if (!agentMap.has(entry.agent)) {
      agentMap.set(entry.agent, []);
    }
    agentMap.get(entry.agent)!.push(entry);
  });

  const metrics: Record<string, AgentMetrics> = {};
  
  agentMap.forEach((agentEntries, agent) => {
    const completedEntries = agentEntries.filter(e => e.status === 'completed');
    const totalTasks = agentEntries.length;
    const completedTasks = completedEntries.length;
    const totalMinutes = completedEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const averageDuration = completedTasks > 0 ? totalMinutes / completedTasks : 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Category breakdown
    const categories: Record<string, number> = {};
    completedEntries.forEach(entry => {
      if (!categories[entry.category]) {
        categories[entry.category] = 0;
      }
      categories[entry.category] += entry.duration || 0;
    });

    metrics[agent] = {
      agent,
      totalTasks,
      completedTasks,
      totalMinutes,
      averageDuration,
      completionRate,
      categories
    };
  });

  return metrics;
}

/**
 * Calculate category performance metrics
 */
function calculateCategoryMetrics(entries: TimeEntry[]): Record<string, CategoryMetrics> {
  const categoryMap = new Map<string, TimeEntry[]>();
  
  // Group entries by category
  entries.forEach(entry => {
    if (!categoryMap.has(entry.category)) {
      categoryMap.set(entry.category, []);
    }
    categoryMap.get(entry.category)!.push(entry);
  });

  const metrics: Record<string, CategoryMetrics> = {};
  
  categoryMap.forEach((categoryEntries, category) => {
    const completedEntries = categoryEntries.filter(e => e.status === 'completed');
    const totalTasks = categoryEntries.length;
    const completedTasks = completedEntries.length;
    const totalMinutes = completedEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const averageDuration = completedTasks > 0 ? totalMinutes / completedTasks : 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Agent breakdown
    const agents: Record<string, number> = {};
    completedEntries.forEach(entry => {
      if (!agents[entry.agent]) {
        agents[entry.agent] = 0;
      }
      agents[entry.agent] += entry.duration || 0;
    });

    metrics[category] = {
      category,
      totalTasks,
      completedTasks,
      totalMinutes,
      averageDuration,
      completionRate,
      agents
    };
  });

  return metrics;
}

/**
 * Calculate time trends (group by date)
 */
function calculateTimeTrends(entries: TimeEntry[]): TimeTrendPoint[] {
  const dateMap = new Map<string, TimeEntry[]>();
  
  // Group entries by date (YYYY-MM-DD)
  entries.forEach(entry => {
    const date = new Date(entry.createdAt).toISOString().split('T')[0];
    if (!dateMap.has(date)) {
      dateMap.set(date, []);
    }
    dateMap.get(date)!.push(entry);
  });

  const trends: TimeTrendPoint[] = [];
  
  dateMap.forEach((dateEntries, date) => {
    const completedEntries = dateEntries.filter(e => e.status === 'completed');
    const totalMinutes = completedEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const completedTasks = completedEntries.length;
    const activeAgents = new Set(dateEntries.map(e => e.agent)).size;

    trends.push({
      date,
      totalMinutes,
      completedTasks,
      activeAgents
    });
  });

  // Sort by date
  return trends.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Helper function to format duration in human-readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  } else if (minutes < 1440) { // Less than 24 hours
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  } else {
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
}

/**
 * Helper function to format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Helper function to get color based on performance
 */
export function getPerformanceColor(value: number, type: 'completion' | 'duration' = 'completion'): string {
  if (type === 'completion') {
    if (value >= 90) return 'text-green-400';
    if (value >= 75) return 'text-yellow-400';
    if (value >= 50) return 'text-orange-400';
    return 'text-red-400';
  } else {
    // Duration - lower is better (compared to average)
    if (value <= 60) return 'text-green-400'; // Under 1 hour
    if (value <= 120) return 'text-yellow-400'; // 1-2 hours
    if (value <= 180) return 'text-orange-400'; // 2-3 hours
    return 'text-red-400'; // Over 3 hours
  }
}
