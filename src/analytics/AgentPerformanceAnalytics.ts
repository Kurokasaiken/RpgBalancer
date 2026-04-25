/**
 * Agent Performance Analytics Engine - NP-125
 * 
 * Core analytics engine for processing agent performance data from Kanban.
 * Calculates metrics, trends, and generates performance reports.
 * 
 * @since 2026-01-23
 * @author Sentinel-Coordinator
 */

import {
  type AgentAnalyticsConfig,
  type PerformanceRating,
  DEFAULT_AGENT_ANALYTICS_CONFIG,
  getPerformanceRating,
  calculateQualityScore,
  calculateCompletionTimeRatio,
  calculateErrorRate,
  calculateVelocity,
} from './config/agentAnalyticsConfig';

/**
 * Kanban task data structure
 */
export interface KanbanTask {
  id: string;
  status: string;
  dependencies: string;
  agent: string;
  startTime: string;
  endTime: string;
  duration: number;
  estimated: number;
  lastUpdate: string;
  notes: string;
}

/**
 * Agent performance metrics
 */
export interface AgentPerformanceMetrics {
  agentName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  averageCompletionTime: number;
  averageEstimatedTime: number;
  completionTimeRatio: number;
  errorRate: number;
  qualityScore: number;
  velocity: number;
  performanceRating: PerformanceRating;
  trends: {
    completionTime: 'improving' | 'stable' | 'declining';
    errorRate: 'improving' | 'stable' | 'declining';
    quality: 'improving' | 'stable' | 'declining';
  };
}

/**
 * Task quality metrics
 */
export interface TaskQualityMetrics {
  taskId: string;
  testCoverage: number;
  buildSuccess: boolean;
  lintErrors: number;
  documentationComplete: boolean;
  codeReviewScore: number;
  qualityScore: number;
}

/**
 * Performance trend data point
 */
export interface PerformanceTrendPoint {
  date: string;
  completionTime: number;
  errorRate: number;
  qualityScore: number;
  tasksCompleted: number;
}

/**
 * Agent Performance Analytics Engine
 */
export class AgentPerformanceAnalytics {
  private config: AgentAnalyticsConfig;
  private tasks: KanbanTask[];
  private qualityMetrics: Map<string, TaskQualityMetrics>;

  constructor(
    tasks: KanbanTask[],
    config: Partial<AgentAnalyticsConfig> = {}
  ) {
    this.config = {
      ...DEFAULT_AGENT_ANALYTICS_CONFIG,
      ...config,
    };
    this.tasks = tasks;
    this.qualityMetrics = new Map();
  }

  /**
   * Add quality metrics for a task
   */
  addQualityMetrics(taskId: string, metrics: Omit<TaskQualityMetrics, 'taskId' | 'qualityScore'>): void {
    const qualityScore = calculateQualityScore(metrics, this.config.qualityWeights);
    this.qualityMetrics.set(taskId, {
      taskId,
      ...metrics,
      qualityScore,
    });
  }

  /**
   * Get all unique agent names
   */
  getAgentNames(): string[] {
    const agents = new Set<string>();
    this.tasks.forEach(task => {
      if (task.agent && task.agent !== '-') {
        agents.add(task.agent);
      }
    });
    return Array.from(agents).sort();
  }

  /**
   * Get tasks for a specific agent
   */
  getAgentTasks(agentName: string): KanbanTask[] {
    return this.tasks.filter(task => task.agent === agentName);
  }

  /**
   * Calculate performance metrics for an agent
   */
  calculateAgentMetrics(agentName: string): AgentPerformanceMetrics {
    const agentTasks = this.getAgentTasks(agentName);
    const completedTasks = agentTasks.filter(t => t.status === 'Completato');
    const inProgressTasks = agentTasks.filter(t => t.status === 'In corso' || t.status === 'Assegnato');

    // Calculate completion time metrics
    const tasksWithDuration = completedTasks.filter(t => t.duration > 0 && t.estimated > 0);
    const avgCompletionTime = tasksWithDuration.length > 0
      ? tasksWithDuration.reduce((sum, t) => sum + t.duration, 0) / tasksWithDuration.length
      : 0;
    const avgEstimatedTime = tasksWithDuration.length > 0
      ? tasksWithDuration.reduce((sum, t) => sum + t.estimated, 0) / tasksWithDuration.length
      : 0;
    const completionTimeRatio = calculateCompletionTimeRatio(avgCompletionTime, avgEstimatedTime);

    // Calculate error rate (tasks with errors in notes)
    const tasksWithErrors = completedTasks.filter(t => 
      t.notes.toLowerCase().includes('error') || 
      t.notes.toLowerCase().includes('failed') ||
      t.notes.toLowerCase().includes('⚠️')
    );
    const errorRate = calculateErrorRate(tasksWithErrors.length, completedTasks.length);

    // Calculate quality score
    const taskQualityScores = completedTasks
      .map(t => this.qualityMetrics.get(t.id))
      .filter((m): m is TaskQualityMetrics => m !== undefined)
      .map(m => m.qualityScore);
    const avgQualityScore = taskQualityScores.length > 0
      ? taskQualityScores.reduce((sum, score) => sum + score, 0) / taskQualityScores.length
      : 75; // Default quality score

    // Calculate velocity
    const firstTask = completedTasks.sort((a, b) => 
      new Date(a.startTime || a.lastUpdate).getTime() - new Date(b.startTime || b.lastUpdate).getTime()
    )[0];
    const lastTask = completedTasks.sort((a, b) => 
      new Date(b.endTime || b.lastUpdate).getTime() - new Date(a.endTime || a.lastUpdate).getTime()
    )[0];
    
    let velocity = 0;
    if (firstTask && lastTask) {
      const startDate = new Date(firstTask.startTime || firstTask.lastUpdate);
      const endDate = new Date(lastTask.endTime || lastTask.lastUpdate);
      const daysElapsed = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      velocity = calculateVelocity(completedTasks.length, daysElapsed);
    }

    // Determine overall performance rating
    const completionTimeRating = getPerformanceRating(
      completionTimeRatio,
      this.config.thresholds.completionTime,
      false
    );
    const errorRateRating = getPerformanceRating(
      errorRate,
      this.config.thresholds.errorRate,
      false
    );
    const qualityRating = getPerformanceRating(
      avgQualityScore,
      this.config.thresholds.qualityScore,
      true
    );

    // Overall rating is the worst of the three
    const ratings: PerformanceRating[] = [completionTimeRating, errorRateRating, qualityRating];
    const ratingOrder: PerformanceRating[] = ['critical', 'needs_improvement', 'acceptable', 'good', 'excellent'];
    const performanceRating = ratings.reduce((worst, current) => {
      return ratingOrder.indexOf(current) < ratingOrder.indexOf(worst) ? current : worst;
    });

    // Calculate trends
    const trends = this.calculateTrends(agentName);

    return {
      agentName,
      totalTasks: agentTasks.length,
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      averageCompletionTime: avgCompletionTime,
      averageEstimatedTime: avgEstimatedTime,
      completionTimeRatio,
      errorRate,
      qualityScore: avgQualityScore,
      velocity,
      performanceRating,
      trends,
    };
  }

  /**
   * Calculate performance trends for an agent
   */
  private calculateTrends(agentName: string): {
    completionTime: 'improving' | 'stable' | 'declining';
    errorRate: 'improving' | 'stable' | 'declining';
    quality: 'improving' | 'stable' | 'declining';
  } {
    const agentTasks = this.getAgentTasks(agentName)
      .filter(t => t.status === 'Completato')
      .sort((a, b) => new Date(a.endTime || a.lastUpdate).getTime() - new Date(b.endTime || b.lastUpdate).getTime());

    if (agentTasks.length < this.config.minSampleSize) {
      return {
        completionTime: 'stable',
        errorRate: 'stable',
        quality: 'stable',
      };
    }

    // Split tasks into first half and second half
    const midpoint = Math.floor(agentTasks.length / 2);
    const firstHalf = agentTasks.slice(0, midpoint);
    const secondHalf = agentTasks.slice(midpoint);

    // Calculate completion time trend
    const firstHalfAvgTime = firstHalf
      .filter(t => t.duration > 0 && t.estimated > 0)
      .reduce((sum, t) => sum + calculateCompletionTimeRatio(t.duration, t.estimated), 0) / firstHalf.length;
    const secondHalfAvgTime = secondHalf
      .filter(t => t.duration > 0 && t.estimated > 0)
      .reduce((sum, t) => sum + calculateCompletionTimeRatio(t.duration, t.estimated), 0) / secondHalf.length;
    
    const completionTimeTrend = secondHalfAvgTime < firstHalfAvgTime * 0.9 ? 'improving' :
                                secondHalfAvgTime > firstHalfAvgTime * 1.1 ? 'declining' : 'stable';

    // Calculate error rate trend
    const firstHalfErrors = firstHalf.filter(t => 
      t.notes.toLowerCase().includes('error') || t.notes.toLowerCase().includes('failed')
    ).length;
    const secondHalfErrors = secondHalf.filter(t => 
      t.notes.toLowerCase().includes('error') || t.notes.toLowerCase().includes('failed')
    ).length;
    const firstHalfErrorRate = (firstHalfErrors / firstHalf.length) * 100;
    const secondHalfErrorRate = (secondHalfErrors / secondHalf.length) * 100;
    
    const errorRateTrend = secondHalfErrorRate < firstHalfErrorRate * 0.8 ? 'improving' :
                          secondHalfErrorRate > firstHalfErrorRate * 1.2 ? 'declining' : 'stable';

    // Calculate quality trend (if quality metrics available)
    const firstHalfQuality = firstHalf
      .map(t => this.qualityMetrics.get(t.id)?.qualityScore)
      .filter((q): q is number => q !== undefined);
    const secondHalfQuality = secondHalf
      .map(t => this.qualityMetrics.get(t.id)?.qualityScore)
      .filter((q): q is number => q !== undefined);
    
    let qualityTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (firstHalfQuality.length > 0 && secondHalfQuality.length > 0) {
      const firstAvg = firstHalfQuality.reduce((sum, q) => sum + q, 0) / firstHalfQuality.length;
      const secondAvg = secondHalfQuality.reduce((sum, q) => sum + q, 0) / secondHalfQuality.length;
      qualityTrend = secondAvg > firstAvg + 5 ? 'improving' :
                    secondAvg < firstAvg - 5 ? 'declining' : 'stable';
    }

    return {
      completionTime: completionTimeTrend,
      errorRate: errorRateTrend,
      quality: qualityTrend,
    };
  }

  /**
   * Get performance trend data points for an agent
   */
  getPerformanceTrendData(agentName: string, days: number = 30): PerformanceTrendPoint[] {
    const agentTasks = this.getAgentTasks(agentName)
      .filter(t => t.status === 'Completato')
      .sort((a, b) => new Date(a.endTime || a.lastUpdate).getTime() - new Date(b.endTime || b.lastUpdate).getTime());

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentTasks = agentTasks.filter(t => {
      const taskDate = new Date(t.endTime || t.lastUpdate);
      return taskDate >= cutoffDate;
    });

    // Group tasks by date
    const tasksByDate = new Map<string, KanbanTask[]>();
    recentTasks.forEach(task => {
      const date = new Date(task.endTime || task.lastUpdate).toISOString().split('T')[0];
      if (!tasksByDate.has(date)) {
        tasksByDate.set(date, []);
      }
      tasksByDate.get(date)!.push(task);
    });

    // Calculate metrics for each date
    const trendPoints: PerformanceTrendPoint[] = [];
    tasksByDate.forEach((tasks, date) => {
      const tasksWithDuration = tasks.filter(t => t.duration > 0 && t.estimated > 0);
      const avgCompletionTime = tasksWithDuration.length > 0
        ? tasksWithDuration.reduce((sum, t) => sum + t.duration, 0) / tasksWithDuration.length
        : 0;

      const tasksWithErrors = tasks.filter(t => 
        t.notes.toLowerCase().includes('error') || t.notes.toLowerCase().includes('failed')
      );
      const errorRate = (tasksWithErrors.length / tasks.length) * 100;

      const qualityScores = tasks
        .map(t => this.qualityMetrics.get(t.id)?.qualityScore)
        .filter((q): q is number => q !== undefined);
      const avgQualityScore = qualityScores.length > 0
        ? qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length
        : 75;

      trendPoints.push({
        date,
        completionTime: avgCompletionTime,
        errorRate,
        qualityScore: avgQualityScore,
        tasksCompleted: tasks.length,
      });
    });

    return trendPoints.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get all agent metrics
   */
  getAllAgentMetrics(): AgentPerformanceMetrics[] {
    return this.getAgentNames().map(agent => this.calculateAgentMetrics(agent));
  }

  /**
   * Get top performing agents
   */
  getTopPerformers(limit: number = 5): AgentPerformanceMetrics[] {
    const allMetrics = this.getAllAgentMetrics();
    const ratingOrder: PerformanceRating[] = ['excellent', 'good', 'acceptable', 'needs_improvement', 'critical'];
    
    return allMetrics
      .sort((a, b) => {
        const ratingDiff = ratingOrder.indexOf(a.performanceRating) - ratingOrder.indexOf(b.performanceRating);
        if (ratingDiff !== 0) return ratingDiff;
        return b.qualityScore - a.qualityScore;
      })
      .slice(0, limit);
  }

  /**
   * Get agents needing attention
   */
  getAgentsNeedingAttention(): AgentPerformanceMetrics[] {
    return this.getAllAgentMetrics().filter(metrics => 
      metrics.performanceRating === 'needs_improvement' || 
      metrics.performanceRating === 'critical' ||
      metrics.trends.errorRate === 'declining' ||
      metrics.trends.quality === 'declining'
    );
  }

  /**
   * Generate performance summary report
   */
  generateSummaryReport(): {
    totalAgents: number;
    totalTasks: number;
    completedTasks: number;
    averageQualityScore: number;
    averageVelocity: number;
    topPerformers: AgentPerformanceMetrics[];
    needsAttention: AgentPerformanceMetrics[];
  } {
    const allMetrics = this.getAllAgentMetrics();
    const completedTasks = allMetrics.reduce((sum, m) => sum + m.completedTasks, 0);
    const avgQuality = allMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / allMetrics.length;
    const avgVelocity = allMetrics.reduce((sum, m) => sum + m.velocity, 0) / allMetrics.length;

    return {
      totalAgents: allMetrics.length,
      totalTasks: this.tasks.length,
      completedTasks,
      averageQualityScore: Math.round(avgQuality),
      averageVelocity: Math.round(avgVelocity * 10) / 10,
      topPerformers: this.getTopPerformers(3),
      needsAttention: this.getAgentsNeedingAttention(),
    };
  }
}
