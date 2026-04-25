import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Progress } from '../../../components/ui/progress';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../../components/ui/table';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Download,
  RefreshCw,
  Filter,
  Clock,
  FileText
} from 'lucide-react';
import { createTelemetryEvent } from '../../../shared/telemetry/telemetry';

type CheckStatus = {
  status: 'pass' | 'fail' | 'warning' | 'skip' | 'unknown';
  duration?: number;
  error?: string;
  issues?: number;
  timestamp: number;
};

interface SafeguardCheckResult {
  promptId: string;
  title: string;
  status: 'pass' | 'fail' | 'warning' | 'unknown';
  checks: Record<'lint' | 'test' | 'build' | 'kanban', CheckStatus>;
  lastEvidence: number;
  evidencePath: string;
  severity: number;
  issues: string[];
  metadata: Record<string, unknown>;
}

interface SafeguardReport {
  generatedAt: number;
  version: string;
  summary: {
    totalPrompts: number;
    passed: number;
    failed: number;
    warnings: number;
    unknown: number;
    averageSeverity: number;
    worstSeverity: number;
  };
  results: SafeguardCheckResult[];
  globalIssues: string[];
  period: {
    start: number;
    end: number;
  };
}

type FilterStatus = 'all' | 'pass' | 'fail' | 'warning' | 'unknown';
type FilterDateRange = 'all' | 'today' | 'week' | 'month';

interface DashboardFilters {
  status: FilterStatus;
  promptId: string;
  dateRange: FilterDateRange;
}

/**
 * Props for SafeguardMonitorDashboard component
 */
export interface SafeguardMonitorDashboardProps {
  /** Initial safeguard report data */
  initialData?: SafeguardReport;
  /** Function to fetch latest report */
  onRefresh?: () => Promise<SafeguardReport>;
  /** Auto-refresh interval in milliseconds */
  autoRefreshInterval?: number;
  /** Show compact view */
  compact?: boolean;
}

/**
 * Safeguard Monitor Dashboard Component
 * 
 * Displays aggregated safeguard status across all prompts with filters,
 * progress tracking, and CSV export functionality.
 */
export function SafeguardMonitorDashboard({
  initialData,
  onRefresh,
  autoRefreshInterval = 30000, // 30 seconds
  compact = false,
}: SafeguardMonitorDashboardProps) {
  const [data, setData] = useState<SafeguardReport | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    status: 'all',
    promptId: '',
    dateRange: 'all',
  });
  const [selectedPrompt, setSelectedPrompt] = useState<SafeguardCheckResult | null>(null);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefreshInterval || !onRefresh) return;

    const interval = setInterval(async () => {
      try {
        const report = await onRefresh();
        setData(report);
      } catch (err) {
        console.error('Auto-refresh failed:', err);
      }
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, onRefresh]);

  // Manual refresh
  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setLoading(true);
    setFetchError(null);
    
    try {
      const report = await onRefresh();
      setData(report);
      
      // Telemetry event
      createTelemetryEvent('safeguard_monitor_refreshed', {
        timestamp: Date.now(),
        trigger: 'manual',
      });
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (!data) return;

    const csv = reportToCsv(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safeguard-monitor-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Telemetry event
    createTelemetryEvent('safeguard_monitor_exported', {
      format: 'csv',
      timestamp: Date.now(),
    });
  };

  // Filter results
  const filteredResults = useMemo(() => {
    if (!data) return [];

    return data.results.filter(result => {
      // Status filter
      if (filters.status !== 'all' && result.status !== filters.status) {
        return false;
      }

      // Prompt ID filter
      if (filters.promptId && !result.promptId.toLowerCase().includes(filters.promptId.toLowerCase())) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const resultDate = new Date(result.lastEvidence);
        const now = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            if (resultDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'week': {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (resultDate < weekAgo) return false;
            break;
          }
          case 'month': {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (resultDate < monthAgo) return false;
            break;
          }
        }
      }

      return true;
    });
  }, [data, filters]);

  // Get status icon
  const getStatusIcon = (status: SafeguardCheckResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get status color
  const getStatusColor = (status: SafeguardCheckResult['status']) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get check status icon
  const getCheckIcon = (status: CheckStatus['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'fail':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      default:
        return <HelpCircle className="h-3 w-3 text-gray-500" />;
    }
  };

  // Telemetry on mount
  useEffect(() => {
    createTelemetryEvent('safeguard_monitor_viewed', {
      timestamp: Date.now(),
      hasInitialData: !!initialData,
      autoRefreshEnabled: !!autoRefreshInterval,
    });
  }, [initialData, autoRefreshInterval]);

  if (!data) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No safeguard data available</p>
            {onRefresh && (
              <Button onClick={handleRefresh} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Load Data
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Safeguard Monitor Dashboard</h1>
          <p className="text-gray-600">
            Last updated: {new Date(data.generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          {onRefresh && (
            <Button onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
          <Button onClick={handleExportCsv} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{data.summary.totalPrompts}</div>
              <p className="text-gray-600">Total Prompts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{data.summary.passed}</div>
              <p className="text-gray-600">Passed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{data.summary.failed}</div>
              <p className="text-gray-600">Failed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{data.summary.warnings}</div>
              <p className="text-gray-600">Warnings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{data.summary.averageSeverity.toFixed(1)}</div>
              <p className="text-gray-600">Avg Severity</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Global Issues */}
      {data.globalIssues.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {data.globalIssues.map((issue, index) => (
                <div key={index}>{issue}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-48">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value: FilterStatus) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-48">
              <label className="text-sm font-medium mb-2 block">Prompt ID</label>
              <Input
                placeholder="Filter by prompt ID..."
                value={filters.promptId}
                onChange={(e) => setFilters(prev => ({ ...prev, promptId: e.target.value }))}
              />
            </div>
            <div className="flex-1 min-w-48">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={filters.dateRange} onValueChange={(value: FilterDateRange) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Results ({filteredResults.length} of {data.results.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prompt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lint</TableHead>
                <TableHead>Test</TableHead>
                <TableHead>Build</TableHead>
                <TableHead>Kanban</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Last Evidence</TableHead>
                {!compact && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map((result) => (
                <TableRow key={result.promptId} className="cursor-pointer hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{result.promptId}</div>
                      <div className="text-sm text-gray-600">{result.title}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(result.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(result.status)}
                        {result.status}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getCheckIcon(result.checks.lint.status)}
                      <span className="text-sm">{result.checks.lint.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getCheckIcon(result.checks.test.status)}
                      <span className="text-sm">{result.checks.test.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getCheckIcon(result.checks.build.status)}
                      <span className="text-sm">{result.checks.build.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getCheckIcon(result.checks.kanban.status)}
                      <span className="text-sm">{result.checks.kanban.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={result.severity} max={100} className="w-12" />
                      <span className="text-sm">{result.severity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      {new Date(result.lastEvidence).toLocaleDateString()}
                    </div>
                  </TableCell>
                  {!compact && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPrompt(result)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedPrompt && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <CardContent className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedPrompt.promptId}</h2>
              <Button variant="ghost" onClick={() => setSelectedPrompt(null)}>
                ×
              </Button>
            </div>
            
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="checks">Checks</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{selectedPrompt.title}</h3>
                  <Badge className={getStatusColor(selectedPrompt.status)}>
                    {selectedPrompt.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Severity Score</label>
                    <div className="flex items-center gap-2">
                      <Progress value={selectedPrompt.severity} max={100} className="flex-1" />
                      <span>{selectedPrompt.severity}/100</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Evidence</label>
                    <div className="text-sm">
                      {new Date(selectedPrompt.lastEvidence).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Evidence Path</label>
                  <div className="text-sm text-gray-600 font-mono">
                    {selectedPrompt.evidencePath}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="checks" className="space-y-4">
                {(Object.entries(selectedPrompt.checks) as Array<
                  [keyof SafeguardCheckResult['checks'], CheckStatus]
                >).map(([name, check]) => (
                  <Card key={name}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {getCheckIcon(check.status)}
                          <span className="font-medium capitalize">{name}</span>
                        </div>
                        <Badge variant={check.status === 'pass' ? 'default' : 'destructive'}>
                          {check.status}
                        </Badge>
                      </div>
                      {check.duration && (
                        <div className="text-sm text-gray-600 mt-1">
                          Duration: {check.duration}ms
                        </div>
                      )}
                      {check.error && (
                        <div className="text-sm text-red-600 mt-1">
                          Error: {check.error}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="issues" className="space-y-4">
                {selectedPrompt.issues.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPrompt.issues.map((issue, index) => (
                      <Alert key={index}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{issue}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No issues found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Convert safeguard report to CSV format
 */
function reportToCsv(report: SafeguardReport): string {
  const headers = [
    'promptId',
    'title',
    'status',
    'lint_status',
    'lint_duration',
    'test_status',
    'test_duration',
    'build_status',
    'build_duration',
    'kanban_status',
    'kanban_duration',
    'severity',
    'lastEvidence',
    'evidencePath',
    'issues',
  ];
  
  const rows = report.results.map(result => [
    result.promptId,
    `"${result.title.replace(/"/g, '""')}"`,
    result.status,
    result.checks.lint.status,
    result.checks.lint.duration || '',
    result.checks.test.status,
    result.checks.test.duration || '',
    result.checks.build.status,
    result.checks.build.duration || '',
    result.checks.kanban.status,
    result.checks.kanban.duration || '',
    result.severity,
    new Date(result.lastEvidence).toISOString(),
    result.evidencePath,
    `"${result.issues.join('; ').replace(/"/g, '""')}"`,
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export default SafeguardMonitorDashboard;
