/**
 * Performance Dashboard Types
 * Based on time tracking system data structure
 */

export interface TimeEntry {
  taskId: string;
  taskDescription: string;
  agent: string;
  startTime?: string;        // ISO string
  endTime?: string;          // ISO string
  duration?: number;        // minutes
  estimatedDuration?: number; // minutes
  category: string;         // 'infrastructure', 'balancing', 'integration', etc.
  status: 'planning' | 'in_progress' | 'completed' | 'paused';
  notes?: string;
  createdAt: string;        // ISO string
  updatedAt: string;        // ISO string
}

export interface TimeTrackingData {
  entries: TimeEntry[];
  metadata: {
    version: string;              // '1.0.0'
    lastUpdated: string;           // ISO string
    totalTasks: number;
    totalCompletedTasks: number;
    totalTrackedMinutes: number;
  };
}

export interface AgentMetrics {
  agent: string;
  totalTasks: number;
  completedTasks: number;
  totalMinutes: number;
  averageDuration: number;
  completionRate: number;
  categories: Record<string, number>; // category -> minutes
}

export interface CategoryMetrics {
  category: string;
  totalTasks: number;
  completedTasks: number;
  totalMinutes: number;
  averageDuration: number;
  completionRate: number;
  agents: Record<string, number>; // agent -> minutes
}

export interface PerformanceMetrics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  totalTrackedMinutes: number;
  averageDuration: number;
  agentMetrics: Record<string, AgentMetrics>;
  categoryMetrics: Record<string, CategoryMetrics>;
  timeTrends: TimeTrendPoint[];
}

export interface TimeTrendPoint {
  date: string;           // YYYY-MM-DD
  totalMinutes: number;
  completedTasks: number;
  activeAgents: number;
}

export interface DashboardFilters {
  agent?: string;
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string;
}

export interface PerformanceDashboardProps {
  filters?: DashboardFilters;
  showExport?: boolean;
  className?: string;
}
