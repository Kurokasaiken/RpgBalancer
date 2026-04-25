# Performance Dashboard Guide

## Overview

The Performance Dashboard provides comprehensive time tracking analytics and performance insights for the RPG Balancer project. It visualizes metrics from the time tracking system to help with planning, resource allocation, and performance optimization.

## Features

### 📊 Key Metrics
- **Total Tasks**: Number of tracked tasks
- **Completion Rate**: Percentage of completed tasks
- **Total Time**: Cumulative time across all tasks
- **Average Duration**: Mean time per completed task

### 📈 Visualizations
- **Time Trends**: Historical view of task completion and time spent
- **Category Distribution**: Breakdown of time by task categories
- **Agent Performance**: Comparative analysis of agent productivity

### 🔧 Interactive Features
- **Filtering**: By agent, category, status, and date range
- **Export**: CSV and JSON export capabilities
- **Real-time Updates**: Refresh capability for latest data

## Architecture

### File Structure
```
src/ui/analytics/
├── PerformanceDashboard.tsx      # Main dashboard component
├── components/
│   ├── MetricCard.tsx            # KPI display cards
│   ├── TimeSeriesChart.tsx       # Trend visualization
│   ├── CategoryChart.tsx         # Distribution analysis
│   └── AgentMetricsTable.tsx     # Performance comparison
├── hooks/
│   └── usePerformanceData.ts     # Data loading and processing
├── types.ts                      # TypeScript interfaces
└── __tests__/
    ├── PerformanceDashboard.test.tsx
    └── usePerformanceData.test.ts
```

### Data Flow

1. **Data Source**: Time tracking system (`test-results/time-tracking/`)
2. **Hook**: `usePerformanceData` loads and processes data
3. **Components**: Visualize processed metrics
4. **Export**: Generate downloadable reports

## Usage

### Basic Usage

```tsx
import { PerformanceDashboard } from '@/ui/analytics/PerformanceDashboard';

function AnalyticsPage() {
  return (
    <PerformanceDashboard 
      showExport={true}
      className="custom-styles"
    />
  );
}
```

### With Filters

```tsx
import { PerformanceDashboard } from '@/ui/analytics/PerformanceDashboard';
import { useState } from 'react';

function AnalyticsPage() {
  const [filters, setFilters] = useState({
    agent: 'Cascade',
    category: 'development',
    dateRange: {
      start: '2026-01-01',
      end: '2026-01-31'
    }
  });

  return (
    <PerformanceDashboard 
      filters={filters}
      onFiltersChange={setFilters}
      showExport={true}
    />
  );
}
```

## Data Structure

### Time Entry

```typescript
interface TimeEntry {
  taskId: string;
  taskDescription: string;
  agent: string;
  startTime?: string;        // ISO string
  endTime?: string;          // ISO string
  duration?: number;        // minutes
  estimatedDuration?: number; // minutes
  category: string;         // 'infrastructure', 'balancing', etc.
  status: 'planning' | 'in_progress' | 'completed' | 'paused';
  notes?: string;
  createdAt: string;        // ISO string
  updatedAt: string;        // ISO string
}
```

### Performance Metrics

```typescript
interface PerformanceMetrics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  totalTrackedMinutes: number;
  averageDuration: number;
  agentMetrics: Record<string, AgentMetrics>;
  categoryMetrics: Record<string, CategoryMetrics>;
  timeTrends: TimeTrendPoint[];
}
```

## Customization

### Adding New Metrics

1. **Update Types**: Add new fields to `PerformanceMetrics`
2. **Extend Hook**: Calculate new metrics in `usePerformanceData`
3. **Create Component**: Add visualization component
4. **Integrate**: Include in main dashboard

### Custom Charts

```tsx
// Example: Custom performance chart
function CustomPerformanceChart({ data }: { data: PerformanceMetrics }) {
  // Custom SVG or canvas implementation
  return (
    <div className="default-card p-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">
        Custom Performance View
      </h3>
      {/* Custom chart implementation */}
    </div>
  );
}
```

## Performance Considerations

### Data Loading
- **Async Loading**: Non-blocking data fetch
- **Error Handling**: Graceful fallbacks
- **Caching**: React hooks prevent unnecessary refetches

### Rendering
- **SVG Charts**: Lightweight, no external dependencies
- **Responsive Design**: Mobile-optimized layouts
- **Lazy Loading**: Components render as data becomes available

### Large Datasets
- **Filtering**: Client-side filtering reduces rendering load
- **Pagination**: Table can be extended with pagination
- **Virtualization**: Consider for very large datasets

## Testing

### Unit Tests

```bash
# Run dashboard tests
npm run test -- src/ui/analytics/__tests__/

# Run with coverage
npm run test -- src/ui/analytics/ --coverage
```

### Test Coverage

- **Hook Testing**: Data loading and processing logic
- **Component Testing**: Rendering and interaction
- **Integration Testing**: End-to-end workflows
- **Performance Testing**: Large dataset handling

## Integration

### With Time Tracking System

The dashboard automatically reads from the time tracking system output:

```json
// test-results/time-tracking/sample-data.json
{
  "entries": [...],
  "metadata": {
    "version": "1.0.0",
    "lastUpdated": "2026-01-08T00:30:00.000Z",
    "totalTasks": 3,
    "totalCompletedTasks": 3,
    "totalTrackedMinutes": 265
  }
}
```

### With Other Systems

- **Kanban Integration**: Pull task data from agent assignments
- **Build System**: Track build and deployment times
- **Test Results**: Analyze test execution performance

## Styling

### Theme Integration

The dashboard uses the Gilded Observatory theme:

```css
/* Main container */
.observersatory-page

/* Cards */
.default-card

/* Colors */
.text-slate-200    /* Primary text */
.text-slate-400    /* Secondary text */
.text-indigo-400   /* Accent color */
.bg-slate-900      /* Background */
```

### Responsive Design

- **Mobile**: Single column, collapsible sections
- **Tablet**: Two column layout
- **Desktop**: Full multi-column layout

## Troubleshooting

### Common Issues

1. **Data Not Loading**
   - Check file path: `test-results/time-tracking/sample-data.json`
   - Verify JSON format
   - Check network tab for fetch errors

2. **Empty Charts**
   - Verify data has entries
   - Check filters aren't too restrictive
   - Ensure completed tasks have duration

3. **Performance Issues**
   - Reduce dataset size with filters
   - Check for memory leaks
   - Monitor rendering performance

### Debug Mode

Enable debug logging:

```tsx
<PerformanceDashboard 
  debug={true}
  onDataLoad={(data) => console.log('Loaded:', data)}
/>
```

## Future Enhancements

### Planned Features

- **Real-time Updates**: WebSocket integration
- **Advanced Filtering**: Multi-select filters
- **Custom Reports**: User-defined report templates
- **Trend Analysis**: Predictive analytics
- **Benchmarking**: Industry comparisons

### Extension Points

- **Plugin System**: Custom chart components
- **API Integration**: External data sources
- **Export Formats**: PDF, Excel, PowerBI
- **Notifications**: Performance alerts

## Best Practices

### Data Management
- Keep time tracking data consistent
- Regular cleanup of old entries
- Validate data quality

### Performance
- Use appropriate time ranges
- Implement caching strategies
- Monitor bundle size

### User Experience
- Provide loading states
- Handle errors gracefully
- Make data exportable

---

## Support

For questions or issues with the Performance Dashboard:

1. Check this guide
2. Review test files for examples
3. Consult the time tracking documentation
4. Check the component source code
