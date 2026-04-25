import type {
  PerformanceDashboardProps,
  PerformanceMetrics,
  TimeTrackingData,
  CategoryMetrics,
  AgentMetrics,
} from './types';
import { usePerformanceData, formatDuration, formatPercentage, getPerformanceColor } from './hooks/usePerformanceData';

/**
 * Performance Dashboard - Main dashboard component for time tracking metrics
 */
export function PerformanceDashboard({
  filters,
  showExport = true,
  className = '',
}: PerformanceDashboardProps) {
  const { data, metrics, loading, error } = usePerformanceData(filters);

  if (loading) {
    return (
      <div className={`observatory-page min-h-screen bg-slate-900 p-6 ${className}`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-700 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-slate-700 rounded mb-8"></div>
            <div className="h-64 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`observatory-page min-h-screen bg-slate-900 p-6 ${className}`}>
        <div className="max-w-7xl mx-auto">
          <div className="default-card p-6 border-red-500">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Data</h2>
            <p className="text-slate-300">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`observatory-page min-h-screen bg-slate-900 p-6 ${className}`}>
        <div className="max-w-7xl mx-auto">
          <div className="default-card p-6">
            <h2 className="text-xl font-semibold text-slate-200 mb-2">No Data Available</h2>
            <p className="text-slate-400">No time tracking data found for the selected filters.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`observatory-page min-h-screen bg-slate-900 p-6 ${className}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-200">Performance Dashboard</h1>
            <p className="text-slate-400">Time tracking metrics and performance insights</p>
          </div>
          
          {showExport && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => exportToCSV(metrics)}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
              >
                Export CSV
              </button>
              <button 
                onClick={() => exportToJSON(data)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Export JSON
              </button>
            </div>
          )}
        </header>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Tasks"
            value={metrics.totalTasks.toString()}
            subtitle="All tracked tasks"
            color="text-blue-400"
          />
          <MetricCard
            title="Completed"
            value={metrics.completedTasks.toString()}
            subtitle={formatPercentage(metrics.completionRate)}
            color={getPerformanceColor(metrics.completionRate, 'completion')}
          />
          <MetricCard
            title="Total Time"
            value={formatDuration(metrics.totalTrackedMinutes)}
            subtitle="Across all tasks"
            color="text-purple-400"
          />
          <MetricCard
            title="Avg Duration"
            value={formatDuration(metrics.averageDuration)}
            subtitle="Per completed task"
            color={getPerformanceColor(metrics.averageDuration, 'duration')}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Trends Chart */}
          <div className="default-card p-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Time Trends</h3>
            <TimeSeriesChart data={metrics.timeTrends} />
          </div>

          {/* Category Distribution */}
          <div className="default-card p-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Category Distribution</h3>
            <CategoryChart data={metrics.categoryMetrics} />
          </div>
        </div>

        {/* Agent Performance Table */}
        <div className="default-card p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Agent Performance</h3>
          <AgentMetricsTable data={metrics.agentMetrics} />
        </div>
      </div>
    </div>
  );
}

/**
 * Metric Card Component
 */
interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: string;
}

function MetricCard({ title, value, subtitle, color }: MetricCardProps) {
  return (
    <div className="default-card p-6">
      <h3 className="text-sm font-medium text-slate-400 mb-2">{title}</h3>
      <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
      <div className="text-xs text-slate-500">{subtitle}</div>
    </div>
  );
}

/**
 * Time Series Chart Component (Simplified SVG implementation)
 */
interface TimeSeriesChartProps {
  data: Array<{ date: string; totalMinutes: number; completedTasks: number }>;
}

function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  if (data.length === 0) {
    return <div className="text-center text-slate-500 py-8">No trend data available</div>;
  }

  const maxMinutes = Math.max(...data.map(d => d.totalMinutes));
  const chartHeight = 200;
  const chartWidth = 400;
  const padding = 40;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={chartWidth} height={chartHeight} className="w-full">
        {/* Grid lines */}
        {[...Array(5)].map((_, i) => {
          const y = padding + (i * (chartHeight - 2 * padding)) / 4;
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={chartWidth - padding}
              y2={y}
              stroke="#475569"
              strokeWidth="1"
            />
          );
        })}

        {/* Data line */}
        <polyline
          fill="none"
          stroke="#818cf8"
          strokeWidth="2"
          points={data.map((point, i) => {
            const x = padding + (i * (chartWidth - 2 * padding)) / (data.length - 1);
            const y = chartHeight - padding - (point.totalMinutes / maxMinutes) * (chartHeight - 2 * padding);
            return `${x},${y}`;
          }).join(' ')}
        />

        {/* Data points */}
        {data.map((point, i) => {
          const x = padding + (i * (chartWidth - 2 * padding)) / (data.length - 1);
          const y = chartHeight - padding - (point.totalMinutes / maxMinutes) * (chartHeight - 2 * padding);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="#818cf8"
              className="hover:r-6 transition-all cursor-pointer"
            >
              <title>
                {`${new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • ${
                  point.totalMinutes
                }m`}
              </title>
            </circle>
          );
        })}

        {/* X-axis labels */}
        {data.map((point, i) => {
          if (i % Math.ceil(data.length / 5) === 0) { // Show every 5th label
            const x = padding + (i * (chartWidth - 2 * padding)) / (data.length - 1);
            return (
              <text
                key={i}
                x={x}
                y={chartHeight - 10}
                fill="#94a3b8"
                fontSize="10"
                textAnchor="middle"
              >
                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
}

/**
 * Category Chart Component (Horizontal bars)
 */
interface CategoryChartProps {
  data: Record<string, CategoryMetrics>;
}

function CategoryChart({ data }: CategoryChartProps) {
  const categories = Object.values(data);
  
  if (categories.length === 0) {
    return <div className="text-center text-slate-500 py-8">No category data available</div>;
  }

  const maxMinutes = Math.max(...categories.map(c => c.totalMinutes));

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div key={category.category} className="flex items-center gap-3">
          <div className="w-24 text-sm text-slate-400 truncate">
            {category.category}
          </div>
          <div className="flex-1">
            <div className="h-6 bg-slate-700 rounded relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${(category.totalMinutes / maxMinutes) * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-white font-medium">
                  {formatDuration(category.totalMinutes)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Agent Metrics Table Component
 */
interface AgentMetricsTableProps {
  data: Record<string, AgentMetrics>;
}

function AgentMetricsTable({ data }: AgentMetricsTableProps) {
  const agents = Object.values(data);
  
  if (agents.length === 0) {
    return <div className="text-center text-slate-500 py-8">No agent data available</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 text-slate-300">Agent</th>
            <th className="text-right py-3 px-4 text-slate-300">Tasks</th>
            <th className="text-right py-3 px-4 text-slate-300">Completed</th>
            <th className="text-right py-3 px-4 text-slate-300">Rate</th>
            <th className="text-right py-3 px-4 text-slate-300">Total Time</th>
            <th className="text-right py-3 px-4 text-slate-300">Avg Duration</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.agent} className="border-b border-slate-800 hover:bg-slate-800/50">
              <td className="py-3 px-4 font-medium text-slate-200">{agent.agent}</td>
              <td className="text-right py-3 px-4 text-slate-300">{agent.totalTasks}</td>
              <td className="text-right py-3 px-4 text-slate-300">{agent.completedTasks}</td>
              <td className={`text-right py-3 px-4 font-medium ${getPerformanceColor(agent.completionRate, 'completion')}`}>
                {formatPercentage(agent.completionRate)}
              </td>
              <td className="text-right py-3 px-4 text-slate-300">{formatDuration(agent.totalMinutes)}</td>
              <td className={`text-right py-3 px-4 font-medium ${getPerformanceColor(agent.averageDuration, 'duration')}`}>
                {formatDuration(agent.averageDuration)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Export functions
 */
function exportToCSV(metrics: PerformanceMetrics) {
  const csvContent = [
    ['Agent', 'Total Tasks', 'Completed Tasks', 'Completion Rate', 'Total Minutes', 'Avg Duration'],
    ...Object.values(metrics.agentMetrics).map(agent => [
      agent.agent,
      agent.totalTasks,
      agent.completedTasks,
      formatPercentage(agent.completionRate),
      agent.totalMinutes,
      agent.averageDuration
    ])
  ].map(row => row.join(',')).join('\n');

  downloadFile(csvContent, 'performance-metrics.csv', 'text/csv');
}

function exportToJSON(data: TimeTrackingData | null) {
  if (!data) return;
  
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, 'time-tracking-data.json', 'application/json');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
