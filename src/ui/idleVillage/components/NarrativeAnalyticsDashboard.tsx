/**
 * NP-029 – Idle Village Quest Narrative Hooks Refactor
 * 
 * Narrative analytics dashboard component for displaying
 * comprehensive telemetry data and performance metrics.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity,
  Clock,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw,
  Filter,
  Calendar
} from 'lucide-react';

import { useNarrativeTelemetry } from '../hooks/useNarrativeTelemetry';
import { useNarrativeConfig } from '../hooks/useNarrativeConfig';

interface NarrativeAnalyticsDashboardProps {
  className?: string;
  refreshInterval?: number;
  showExport?: boolean;
  showFilters?: boolean;
  timeRange?: 'hour' | 'day' | 'week' | 'month';
}

export function NarrativeAnalyticsDashboard({
  className = '',
  refreshInterval = 10000, // 10 seconds
  showExport = true,
  showFilters = true,
  timeRange = 'day',
}: NarrativeAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  const {
    events,
    metrics,
    isConnected,
    getStats,
    topEvents,
    topMetrics,
    exportData,
  } = useNarrativeTelemetry({
    enabled: true,
  });

  const {
    config,
    hooks,
    templates,
    hookIds,
  } = useNarrativeConfig({
    autoRefresh: true,
  });

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastRefresh(Date.now());
    
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsRefreshing(false);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `narrative-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter data based on time range
  const filteredData = useMemo(() => {
    const now = Date.now();
    let cutoffTime: number;

    switch (selectedTimeRange) {
      case 'hour':
        cutoffTime = now - (60 * 60 * 1000);
        break;
      case 'day':
        cutoffTime = now - (24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = now - (24 * 60 * 60 * 1000);
    }

    const filteredEvents = events.filter(e => e.timestamp > cutoffTime);
    const filteredMetrics = metrics.filter(m => m.timestamp > cutoffTime);

    return {
      events: filteredEvents,
      metrics: filteredMetrics,
      timeRange: selectedTimeRange,
    };
  }, [events, metrics, selectedTimeRange]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const { events, metrics } = filteredData;
    const stats = getStats();

    // Event analytics
    const eventCounts = new Map<string, number>();
    events.forEach(event => {
      eventCounts.set(event.name, (eventCounts.get(event.name) || 0) + 1);
    });

    // Metric analytics
    const metricStats = new Map<string, { sum: number; count: number; min: number; max: number; avg: number }>();
    metrics.forEach(metric => {
      const existing = metricStats.get(metric.name) || { sum: 0, count: 0, min: metric.value, max: metric.value, avg: 0 };
      existing.sum += metric.value;
      existing.count++;
      existing.min = Math.min(existing.min, metric.value);
      existing.max = Math.max(existing.max, metric.value);
      existing.avg = existing.sum / existing.count;
      metricStats.set(metric.name, existing);
    });

    // Hook performance
    const hookPerformance = new Map<string, { triggers: number; successes: number; avgTime: number }>();
    events.forEach(event => {
      if (event.name === 'hook_triggered') {
        const hookId = String(event.properties.hookId || 'unknown');
        const existing = hookPerformance.get(hookId) || { triggers: 0, successes: 0, avgTime: 0 };
        existing.triggers++;
        if (event.properties.conditionsMatched > 0) {
          existing.successes++;
        }
        hookPerformance.set(hookId, existing);
      }
    });

    // Template usage
    const templateUsage = new Map<string, number>();
    events.forEach(event => {
      if (event.name === 'template_selected') {
        const templateId = String(event.properties.templateId || 'unknown');
        templateUsage.set(templateId, (templateUsage.get(templateId) || 0) + 1);
      }
    });

    // Engagement metrics
    const engagementMetrics = events
      .filter(e => e.name === 'narrative_engagement')
      .map(e => ({
        narrativeId: String(e.properties.narrativeId),
        score: Number(e.properties.engagementScore) || 0,
        timeSpent: Number(e.properties.timeSpent) || 0,
        interactions: Number(e.properties.interactions) || 0,
      }));

    const avgEngagement = engagementMetrics.length > 0
      ? engagementMetrics.reduce((sum, m) => sum + m.score, 0) / engagementMetrics.length
      : 0;

    const avgTimeSpent = engagementMetrics.length > 0
      ? engagementMetrics.reduce((sum, m) => sum + m.timeSpent, 0) / engagementMetrics.length
      : 0;

    return {
      totalEvents: events.length,
      totalMetrics: metrics.length,
      uniqueEvents: eventCounts.size,
      uniqueMetrics: metricStats.size,
      eventCounts: Object.fromEntries(eventCounts),
      metricStats: Object.fromEntries(metricStats),
      hookPerformance: Object.fromEntries(hookPerformance),
      templateUsage: Object.fromEntries(templateUsage),
      avgEngagement,
      avgTimeSpent,
      engagementCount: engagementMetrics.length,
      topEvents: Array.from(eventCounts.entries()).sort(([, a], [, b]) => b - a).slice(0, 10),
      topMetrics: Array.from(metricStats.entries()).sort(([, a], [, b]) => b.count - a.count).slice(0, 10),
    };
  }, [filteredData, getStats]);

  // Calculate trends
  const trends = useMemo(() => {
    const now = Date.now();
    const previousPeriod = now - (2 * 24 * 60 * 60 * 1000); // 2 days ago
    const currentPeriod = now - (24 * 60 * 60 * 1000); // 1 day ago

    const currentEvents = events.filter(e => e.timestamp > currentPeriod);
    const previousEvents = events.filter(e => e.timestamp > previousPeriod && e.timestamp <= currentPeriod);

    const currentMetrics = metrics.filter(m => m.timestamp > currentPeriod);
    const previousMetrics = metrics.filter(m => m.timestamp > previousPeriod && m.timestamp <= currentPeriod);

    const eventTrend = previousEvents.length > 0 
      ? ((currentEvents.length - previousEvents.length) / previousEvents.length) * 100 
      : 0;

    const metricTrend = previousMetrics.length > 0 
      ? ((currentMetrics.length - previousMetrics.length) / previousMetrics.length) * 100 
      : 0;

    return {
      events: eventTrend,
      metrics: metricTrend,
      period: '24h',
    };
  }, [events, metrics]);

  return (
    <div className={`narrative-analytics-dashboard ${className}`}>
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Narrative Analytics Dashboard</CardTitle>
            <div className="flex items-center gap-2">
              {showFilters && (
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="hour">Last Hour</option>
                  <option value="day">Last 24 Hours</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                </select>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {showExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Last refresh: {new Date(lastRefresh).toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Time range: {selectedTimeRange}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Events
              </TabsTrigger>
              <TabsTrigger value="metrics" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Metrics
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="engagement" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Engagement
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Events</p>
                        <p className="text-2xl font-bold">{analytics.totalEvents}</p>
                        <div className="flex items-center gap-1 text-sm">
                          {trends.events >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          )}
                          <span className={trends.events >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {Math.abs(trends.events).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <FileText className="w-8 h-8 text-blue-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Metrics</p>
                        <p className="text-2xl font-bold">{analytics.totalMetrics}</p>
                        <div className="flex items-center gap-1 text-sm">
                          {trends.metrics >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          )}
                          <span className={trends.metrics >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {Math.abs(trends.metrics).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <BarChart3 className="w-8 h-8 text-green-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Engagement</p>
                        <p className="text-2xl font-bold">{analytics.avgEngagement.toFixed(1)}</p>
                        <p className="text-sm text-muted-foreground">
                          {analytics.engagementCount} narratives
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-purple-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Time Spent</p>
                        <p className="text-2xl font-bold">{(analytics.avgTimeSpent / 1000).toFixed(1)}s</p>
                        <p className="text-sm text-muted-foreground">per narrative</p>
                      </div>
                      <Clock className="w-8 h-8 text-orange-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.topEvents.slice(0, 5).map(([name, count], index) => (
                        <div key={name} className="flex justify-between items-center">
                          <span className="text-sm truncate">{name}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={(count / analytics.totalEvents) * 100} className="w-16 h-2" />
                            <Badge variant="secondary" className="text-xs">{count}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.topMetrics.slice(0, 5).map(([name, stats], index) => (
                        <div key={name} className="flex justify-between items-center">
                          <span className="text-sm truncate">{name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{stats.avg.toFixed(2)}</span>
                            <Badge variant="outline" className="text-xs">{stats.count}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">System Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Telemetry</span>
                        <Badge variant={config.telemetry.enabled ? 'default' : 'destructive'}>
                          {config.telemetry.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Hooks</span>
                        <Badge variant="secondary">{hookIds.length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Templates</span>
                        <Badge variant="secondary">{Object.keys(templates).length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Connection</span>
                        <Badge variant={isConnected ? 'default' : 'destructive'}>
                          {isConnected ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Event Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {Object.entries(analytics.eventCounts).map(([name, count]) => (
                          <div key={name} className="flex justify-between items-center">
                            <span className="text-sm">{name}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={(count / analytics.totalEvents) * 100} className="w-24 h-2" />
                              <Badge variant="secondary" className="text-xs">{count}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {filteredData.events.slice(-20).reverse().map((event, index) => (
                          <div key={event.id} className="p-2 border rounded">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-medium">{event.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {Object.entries(event.properties).slice(0, 3).map(([key, value]) => (
                                <span key={key} className="mr-2">
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Metrics Tab */}
            <TabsContent value="metrics" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Metric Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {Object.entries(analytics.metricStats).map(([name, stats]) => (
                          <div key={name} className="p-3 border rounded">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">{name}</span>
                              <Badge variant="secondary" className="text-xs">{stats.count} samples</Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Min:</span>
                                <span className="ml-1 font-medium">{stats.min.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Max:</span>
                                <span className="ml-1 font-medium">{stats.max.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Avg:</span>
                                <span className="ml-1 font-medium">{stats.avg.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Sum:</span>
                                <span className="ml-1 font-medium">{stats.sum.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {filteredData.metrics.slice(-20).reverse().map((metric, index) => (
                          <div key={`${metric.name}-${metric.timestamp}`} className="p-2 border rounded">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{metric.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">{metric.value.toFixed(2)}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(metric.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                            {metric.tags && (
                              <div className="flex gap-1 mt-1">
                                {Object.entries(metric.tags).map(([key, value]) => (
                                  <Badge key={key} variant="outline" className="text-xs">
                                    {key}: {value}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Hook Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {Object.entries(analytics.hookPerformance).map(([hookId, performance]) => (
                          <div key={hookId} className="p-3 border rounded">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">{hookId}</span>
                              <Badge variant="secondary" className="text-xs">
                                {performance.successes}/{performance.triggers}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Success Rate:</span>
                              <Progress 
                                value={performance.triggers > 0 ? (performance.successes / performance.triggers) * 100 : 0} 
                                className="flex-1 h-2" 
                              />
                              <span className="text-xs font-medium">
                                {performance.triggers > 0 ? ((performance.successes / performance.triggers) * 100).toFixed(1) : 0}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Template Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {Object.entries(analytics.templateUsage).map(([templateId, usage]) => (
                          <div key={templateId} className="flex justify-between items-center">
                            <span className="text-sm">{templateId}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={(usage / Object.values(analytics.templateUsage).reduce((sum, count) => sum + count, 0)) * 100} className="w-20 h-2" />
                              <Badge variant="secondary" className="text-xs">{usage}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Engagement Tab */}
            <TabsContent value="engagement" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Engagement Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{analytics.avgEngagement.toFixed(1)}</p>
                          <p className="text-sm text-muted-foreground">Avg Engagement Score</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{(analytics.avgTimeSpent / 1000).toFixed(1)}s</p>
                          <p className="text-sm text-muted-foreground">Avg Time Spent</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="text-center">
                        <p className="text-lg font-bold">{analytics.engagementCount}</p>
                        <p className="text-sm text-muted-foreground">Total Engagement Events</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Engagement Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {events
                          .filter(e => e.name === 'narrative_engagement')
                          .slice(-20)
                          .reverse()
                          .map((event, index) => (
                            <div key={event.id} className="p-2 border rounded">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-medium">
                                  {String(event.properties.narrativeId)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(event.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Score:</span>
                                  <span className="ml-1 font-medium">
                                    {Number(event.properties.engagementScore).toFixed(1)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Time:</span>
                                  <span className="ml-1 font-medium">
                                    {(Number(event.properties.timeSpent) / 1000).toFixed(1)}s
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Interactions:</span>
                                  <span className="ml-1 font-medium">
                                    {Number(event.properties.interactions)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
