# Idle Village Activity HUD KPI Exporter

## Overview

The Activity HUD KPI Exporter is a comprehensive system for exporting performance metrics from the Idle Village Phase 12 Active HUD. It provides detailed insights into resident activities, location utilization, success rates, and drop performance with flexible filtering and multiple export formats.

## Features

### 📊 Comprehensive KPI Tracking
- **Activity Metrics**: Progress, success rates, drop performance, completion times
- **Resident Analytics**: Performance trends, fatigue levels, skill utilization
- **Location Insights**: Utilization rates, efficiency scores, dominant activity types
- **Global Summaries**: Overall system performance and efficiency metrics

### 🔍 Advanced Filtering
- **Activity Types**: Filter by job, quest, maintenance, exploration, social, training
- **Status Filtering**: Active, completed, failed, paused, cancelled activities
- **Location-Based**: Filter by specific locations or location types
- **Resident Filtering**: Focus on specific residents or groups
- **Performance Ranges**: Filter by success rates, progress, priority levels
- **Time-Based**: Filter by start/completion time ranges

### 📤 Multiple Export Formats
- **JSON**: Complete structured data with metadata
- **CSV**: Tabular format for spreadsheet analysis
- **Custom Fields**: Selectable data inclusion options

### 📈 Telemetry Integration
- **Export Events**: Automatic telemetry emission for monitoring
- **Performance Metrics**: Export duration, file sizes, processing times
- **Filter Tracking**: Record of applied filters for analysis

## Installation

The KPI Exporter is included in the Idle Village UI package:

```bash
# Run the CLI tool
node scripts/idleVillage/activityHudExport.ts

# Or use with npm scripts
npm run activity-hud-export
```

## Quick Start

### Basic Usage

```bash
# Export all active activities to JSON
node scripts/idleVillage/activityHudExport.ts

# Export completed activities to CSV
node scripts/idleVillage/activityHudExport.ts \
  --format csv \
  --activity-statuses completed

# Export with specific filters
node scripts/idleVillage/activityHudExport.ts \
  --activity-types job,quest \
  --location-ids forest-1,mine-1 \
  --success-rate-min 80 \
  --format json
```

### Sample Data Generation

```bash
# Generate sample data for testing
node scripts/idleVillage/activityHudExport.ts \
  --sample \
  --sample-size 100 \
  --format csv \
  --output test-data/sample-activities.csv
```

## Data Schema

### Activity KPI Structure

```typescript
interface ActivityKPI {
  id: string;                    // Unique activity identifier
  name: string;                  // Activity display name
  type: ActivityType;            // job | quest | maintenance | exploration | social | training
  status: ActivityStatus;        // idle | active | paused | completed | failed | cancelled
  locationId: string;            // Location identifier
  locationName: string;          // Location display name
  assignedResidents: string[];   // Assigned resident IDs
  assignedResidentNames: string[]; // Assigned resident names
  progress: number;              // Progress percentage (0-100)
  estimatedTimeRemainingMin: number; // Estimated remaining time
  elapsedTimeMin: number;         // Actual elapsed time
  successRate: number;           // Success rate percentage (0-100)
  dropSuccessRate: number;        // Drop success rate (0-100)
  totalDrops: number;            // Total drops collected
  successfulDrops: number;       // Successful drops
  failedDrops: number;           // Failed drops
  priority: number;              // Priority level (1-10)
  tags: string[];                // Activity tags
  startedAt: number;             // Start timestamp
  lastUpdated: number;           // Last update timestamp
  completedAt: number | null;    // Completion timestamp
  performanceScore: number;      // Performance score (0-100)
  efficiencyScore: number;       // Efficiency score (0-100)
}
```

### Resident Summary Structure

```typescript
interface ResidentActivitySummary {
  id: string;                    // Resident unique identifier
  name: string;                  // Resident display name
  currentActivityId: string | null; // Current activity ID
  currentActivityName: string | null; // Current activity name
  totalCompleted: number;        // Total activities completed
  totalFailed: number;           // Total activities failed
  averageSuccessRate: number;    // Average success rate
  averageCompletionTimeMin: number; // Average completion time
  currentFatigue: number;         // Current fatigue percentage (0-100)
  currentHappiness: number;       // Current happiness percentage (0-100)
  activeSkills: string[];         // Skills being utilized
  performanceTrend: 'improving' | 'stable' | 'declining'; // Performance trend
}
```

### Location Summary Structure

```typescript
interface LocationActivitySummary {
  id: string;                    // Location unique identifier
  name: string;                  // Location display name
  type: LocationType;            // village | forest | mine | farm | workshop | temple
  totalActivities: number;       // Total activities at location
  activeActivities: number;       // Currently active activities
  averageSuccessRate: number;    // Average success rate
  utilizationRate: number;       // Utilization percentage (0-100)
  dominantActivityType: ActivityType; // Most common activity type
  efficiencyScore: number;       // Location efficiency score (0-100)
}
```

## CLI Reference

### Options

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--format` | `-f` | string | json | Export format (json/csv) |
| `--output` | `-o` | string | - | Output file path |
| `--output-dir` | - | string | test-results | Output directory |
| `--activity-types` | - | string[] | - | Filter by activity types (comma-separated) |
| `--activity-statuses` | - | string[] | - | Filter by activity statuses (comma-separated) |
| `--location-ids` | - | string[] | - | Filter by location IDs (comma-separated) |
| `--resident-ids` | - | string[] | - | Filter by resident IDs (comma-separated) |
| `--progress-min` | - | number | - | Minimum progress percentage (0-100) |
| `--progress-max` | - | number | - | Maximum progress percentage (0-100) |
| `--success-rate-min` | - | number | - | Minimum success rate percentage (0-100) |
| `--success-rate-max` | - | number | - | Maximum success rate percentage (0-100) |
| `--priority-min` | - | number | - | Minimum priority (1-10) |
| `--priority-max` | - | number | - | Maximum priority (1-10) |
| `--tags` | - | string[] | - | Filter by tags (comma-separated) |
| `--performance-min` | - | number | - | Minimum performance score (0-100) |
| `--performance-max` | - | number | - | Maximum performance score (0-100) |
| `--sort-by` | - | string | name | Sort field (name/progress/successRate/priority/startedAt/elapsedTimeMin) |
| `--sort-order` | - | string | asc | Sort order (asc/desc) |
| `--limit` | - | number | - | Limit number of records |
| `--offset` | - | number | 0 | Offset for pagination |
| `--include-inactive` | - | boolean | false | Include inactive activities |
| `--no-completed` | - | boolean | false | Exclude completed activities |
| `--no-failed` | - | boolean | false | Exclude failed activities |
| `--no-metadata` | - | boolean | false | Exclude metadata |
| `--no-resident-summaries` | - | boolean | false | Exclude resident summaries |
| `--no-location-summaries` | - | boolean | false | Exclude location summaries |
| `--sample` | - | boolean | false | Generate sample data |
| `--sample-size` | - | number | 50 | Number of sample records |
| `--no-telemetry` | - | boolean | false | Disable telemetry events |
| `--telemetry-dir` | - | string | test-results | Telemetry output directory |
| `--verbose` | - | boolean | false | Enable verbose logging |

### Examples

#### Basic Export Examples

```bash
# Export all activities to JSON
node scripts/idleVillage/activityHudExport.ts

# Export active jobs and quests to CSV
node scripts/idleVillage/activityHudExport.ts \
  --format csv \
  --activity-types job,quest \
  --activity-statuses active

# Export high-priority activities with good performance
node scripts/idleVillage/activityHudExport.ts \
  --priority-min 7 \
  --performance-min 80 \
  --sort-by performanceScore \
  --sort-order desc
```

#### Location and Resident Filtering

```bash
# Export activities from specific locations
node scripts/idleVillage/activityHudExport.ts \
  --location-ids forest-1,mine-1,farm-1 \
  --format csv \
  --output forest-activities.csv

# Export activities for specific residents
node scripts/idleVillage/activityHudExport.ts \
  --resident-ids alice,bob,charlie \
  --include-resident-summaries \
  --format json
```

#### Performance Analysis

```bash
# Export failed activities for analysis
node scripts/idleVillage/activityHudExport.ts \
  --activity-statuses failed \
  --success-rate-max 50 \
  --sort-by successRate \
  --format csv \
  --output failed-activities.csv

# Export high-performing activities
node scripts/idleVillage/activityHudExport.ts \
  --success-rate-min 90 \
  --performance-min 85 \
  --drop-success-rate-min 90 \
  --sort-by performanceScore \
  --sort-order desc \
  --limit 20
```

#### Time-based Analysis

```bash
# Export activities started in the last 24 hours
node scripts/idleVillage/activityHudExport.ts \
  --started-after $(date -d '1 day ago' +%s)000 \
  --sort-by startedAt \
  --sort-order desc

# Export completed activities this week
node scripts/idleVillage/activityHudExport.ts \
  --activity-statuses completed \
  --completed-after $(date -d '7 days ago' +%s)000 \
  --format csv
```

## Export Formats

### JSON Format

The JSON export provides complete structured data with metadata:

```json
{
  "exportMetadata": {
    "exportedAt": 1642694400000,
    "version": "1.0.0",
    "source": "manual",
    "format": "json",
    "totalRecords": 25
  },
  "summary": {
    "totalActiveActivities": 8,
    "totalCompletedActivities": 12,
    "overallSuccessRate": 85.5,
    "overallDropSuccessRate": 90.2,
    "averageActivityDurationMin": 45.5,
    "totalActiveResidents": 8,
    "totalUtilizedLocations": 4,
    "globalEfficiencyScore": 87.8
  },
  "activities": [
    {
      "id": "activity-1",
      "name": "Forest Gathering",
      "type": "job",
      "status": "active",
      "locationId": "forest-1",
      "locationName": "Forest Area 1",
      "assignedResidents": ["alice", "bob"],
      "assignedResidentNames": ["Alice", "Bob"],
      "progress": 75.5,
      "estimatedTimeRemainingMin": 30,
      "elapsedTimeMin": 45,
      "successRate": 85.2,
      "dropSuccessRate": 92.1,
      "totalDrops": 15,
      "successfulDrops": 14,
      "failedDrops": 1,
      "priority": 7,
      "tags": ["outdoor", "gathering"],
      "startedAt": 1642690800000,
      "lastUpdated": 1642694400000,
      "completedAt": null,
      "performanceScore": 88.5,
      "efficiencyScore": 91.2
    }
  ],
  "residentSummaries": [...],
  "locationSummaries": [...]
}
```

### CSV Format

The CSV export provides tabular data for spreadsheet analysis:

```csv
ID,Name,Type,Status,Location,Assigned Residents,Progress,Success Rate,Drop Success Rate,Priority,Elapsed Time,Performance Score,Efficiency Score,Started At,Completed At
activity-1,Forest Gathering,job,active,Forest Area 1,Alice;Bob,75.5,85.2,92.1,7,45,88.5,91.2,2022-01-20T12:00:00.000Z,
activity-2,Mine Exploration,quest,completed,Mine Area 1,Charlie,100.0,92.8,88.5,8,60,94.2,89.7,2022-01-20T11:30:00.000Z,2022-01-20T12:30:00.000Z
```

## KPI Metrics

### Performance Indicators

#### Activity-Level Metrics
- **Success Rate**: Percentage of successful activity completion
- **Drop Success Rate**: Percentage of successful drop collection
- **Performance Score**: Overall activity performance (0-100)
- **Efficiency Score**: Time and resource efficiency (0-100)
- **Progress**: Current completion percentage
- **Priority**: Activity importance level (1-10)

#### Resident-Level Metrics
- **Average Success Rate**: Resident's historical performance
- **Performance Trend**: Improving/stable/declining performance
- **Current Fatigue**: Resident's current fatigue level (0-100)
- **Current Happiness**: Resident's current happiness level (0-100)
- **Active Skills**: Skills currently being utilized

#### Location-Level Metrics
- **Utilization Rate**: Percentage of location capacity used
- **Average Success Rate**: Location's overall performance
- **Efficiency Score**: Location's overall efficiency (0-100)
- **Dominant Activity Type**: Most common activity at location

#### Global Metrics
- **Global Efficiency Score**: System-wide efficiency (0-100)
- **Overall Success Rate**: System-wide success rate
- **Overall Drop Success Rate**: System-wide drop performance
- **Average Activity Duration**: Typical activity completion time

### Baseline KPI Values

| Metric | Target Range | Description |
|--------|--------------|-------------|
| Success Rate | 80-95% | Activity completion success rate |
| Drop Success Rate | 85-95% | Drop collection success rate |
| Performance Score | 70-90% | Overall activity performance |
| Efficiency Score | 75-90% | Resource and time efficiency |
| Utilization Rate | 60-85% | Location capacity utilization |
| Global Efficiency | 80-90% | System-wide efficiency |

## Telemetry Integration

### Export Events

The system automatically emits telemetry events for each export:

```json
{
  "eventType": "iv_activity_hud_exported",
  "timestamp": 1642694400000,
  "exportMetadata": {
    "format": "csv",
    "totalRecords": 25,
    "exportDurationMs": 1500,
    "fileSizeBytes": 2048,
    "appliedFilters": {
      "activityTypes": ["job", "quest"],
      "successRateRange": { "min": 80 }
    },
    "exportOptions": {
      "format": "csv",
      "sortBy": "performanceScore",
      "sortOrder": "desc"
    }
  },
  "kpiSummary": {
    "totalActiveActivities": 8,
    "overallSuccessRate": 85.5,
    "globalEfficiencyScore": 87.8,
    "totalActiveResidents": 8,
    "totalUtilizedLocations": 4
  },
  "performanceMetrics": {
    "dataCollectionTimeMs": 500,
    "processingTimeMs": 800,
    "exportTimeMs": 200,
    "memoryUsageMB": 25.5
  }
}
```

### Performance Monitoring

The telemetry system tracks:
- **Export Duration**: Time taken to generate and save export
- **File Size**: Size of exported data
- **Filter Complexity**: Number and type of filters applied
- **Processing Performance**: Data collection, processing, and export times
- **Memory Usage**: Memory consumption during export

## API Usage

### Programmatic Export

```typescript
import { 
  createDefaultActivityKPI,
  createActivityHUDExportedTelemetry,
  validateActivityHUDKPIExport
} from '@/ui/idleVillage/activeHud/ActivityHudKPIExporter';

// Create sample activity
const activity = createDefaultActivityKPI({
  name: 'Custom Activity',
  type: 'quest',
  status: 'active',
  progress: 75,
  successRate: 85.5
});

// Validate export data
const exportData = validateActivityHUDKPIExport({
  exportMetadata: {
    exportedAt: Date.now(),
    version: '1.0.0',
    source: 'api',
    format: 'json',
    totalRecords: 1
  },
  summary: { /* summary data */ },
  activities: [activity],
  residentSummaries: [],
  locationSummaries: []
});

// Create telemetry event
const telemetry = createActivityHUDExportedTelemetry(
  exportData,
  1000, // exportDurationMs
  1024  // fileSizeBytes
);
```

### Integration with Active HUD Store

```typescript
// Example integration with Active HUD store
import { useActiveHUD } from '@/ui/idleVillage/hooks/useActiveHUD';

function ActivityHUDExporter() {
  const { activities, residents, locations } = useActiveHUD();
  
  const exportKPI = async (filters: ActivityHUDKPIFilter) => {
    // Transform store data to KPI format
    const kpiData = transformStoreToKPI(activities, residents, locations, filters);
    
    // Export data
    const exportResult = await exportData(kpiData, {
      format: 'json',
      includeMetadata: true
    });
    
    // Emit telemetry
    const telemetry = createActivityHUDExportedTelemetry(
      kpiData,
      exportResult.duration,
      exportResult.fileSize
    );
    
    emitTelemetryEvent(telemetry);
    
    return exportResult;
  };
  
  return { exportKPI };
}
```

## Performance Considerations

### Export Performance

| Operation | Target Time | Description |
|-----------|--------------|-------------|
| Data Collection | < 500ms | Gathering data from HUD store |
| Processing | < 800ms | Applying filters and transformations |
| JSON Export | < 200ms | Serializing to JSON format |
| CSV Export | < 300ms | Converting to CSV format |
| Total Export | < 1500ms | Complete export operation |

### Memory Usage

- **Base Memory**: ~25MB for export operations
- **Large Datasets**: Additional ~1MB per 1000 activities
- **Filter Processing**: ~5MB for complex filters
- **File Generation**: ~10MB for large exports

### Optimization Tips

1. **Use Filters**: Reduce dataset size with targeted filters
2. **Limit Records**: Use `--limit` for large datasets
3. **Exclude Unnecessary Data**: Use `--no-*` flags to exclude unused sections
4. **Batch Processing**: Process large exports in batches
5. **CSV for Large Data**: CSV is more memory-efficient for large datasets

## Troubleshooting

### Common Issues

#### Large Export Files
```bash
# Limit export size
node scripts/idleVillage/activityHudExport.ts \
  --limit 1000 \
  --format csv \
  --output large-export.csv
```

#### Memory Issues
```bash
# Exclude unnecessary data
node scripts/idleVillage/activityHudExport.ts \
  --no-resident-summaries \
  --no-location-summaries \
  --no-metadata
```

#### Slow Export Performance
```bash
# Use specific filters to reduce data
node scripts/idleVillage/activityHudExport.ts \
  --activity-statuses active \
  --progress-min 50 \
  --sort-by progress
```

#### Filter Not Working
```bash
# Use verbose logging to debug filters
node scripts/idleVillage/activityHudExport.ts \
  --verbose \
  --activity-types job \
  --success-rate-min 80
```

### Debug Mode

```bash
# Enable verbose logging and sample data
node scripts/idleVillage/activityHudExport.ts \
  --verbose \
  --sample \
  --sample-size 10 \
  --format json \
  --no-telemetry
```

## Integration Examples

### CI/CD Pipeline

```yaml
# .github/workflows/activity-hud-export.yml
name: Activity HUD Export

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  export-kpi:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Export Activity KPI
        run: |
          node scripts/idleVillage/activityHudExport.ts \
            --format csv \
            --activity-statuses active,completed \
            --success-rate-min 70 \
            --output-dir kpi-exports/ \
            --telemetry-dir telemetry/
      
      - name: Upload KPI Data
        uses: actions/upload-artifact@v3
        with:
          name: kpi-exports
          path: kpi-exports/
```

### Monitoring Integration

```typescript
// Custom monitoring dashboard
import { useActivityHUDKPIExport } from '@/ui/idleVillage/hooks/useActivityHUDKPIExport';

function KPIDashboard() {
  const { exportKPI, isExporting, lastExport } = useActivityHUDKPIExport();
  
  const handleExport = async (filters: ActivityHUDKPIFilter) => {
    try {
      const result = await exportKPI(filters, {
        format: 'json',
        includeMetadata: true
      });
      
      console.log(`Exported ${result.totalRecords} records to ${result.filePath}`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  
  return (
    <div>
      <button onClick={() => handleExport({ activityTypes: ['job'] })}>
        Export Jobs
      </button>
      <button onClick={() => handleExport({ successRateMin: 90 })}>
        Export High Performance
      </button>
    </div>
  );
}
```

## Data Analysis Examples

### Performance Analysis

```python
# Python example for analyzing exported CSV data
import pandas as pd
import matplotlib.pyplot as plt

# Load exported data
df = pd.read_csv('activity-hud-kpi.csv')

# Success rate analysis
success_rates = df.groupby('Type')['Success Rate'].mean()
print("Success Rates by Activity Type:")
print(success_rates)

# Performance trends
df['Started At'] = pd.to_datetime(df['Started At'])
daily_performance = df.groupby(df['Started At'].dt.date)['Performance Score'].mean()

# Visualization
plt.figure(figsize=(12, 6))
plt.subplot(1, 2, 1)
success_rates.plot(kind='bar')
plt.title('Success Rate by Activity Type')
plt.ylabel('Success Rate (%)')

plt.subplot(1, 2, 2)
daily_performance.plot()
plt.title('Daily Performance Trend')
plt.ylabel('Performance Score')
plt.xticks(rotation=45)

plt.tight_layout()
plt.show()
```

### Resident Performance Analysis

```python
# Analyze resident performance from JSON export
import json

# Load JSON export
with open('activity-hud-kpi.json', 'r') as f:
    data = json.load(f)

# Extract resident summaries
residents = data['residentSummaries']

# Find top performers
top_performers = sorted(
    residents, 
    key=lambda x: x['averageSuccessRate'], 
    reverse=True
)[:5]

print("Top 5 Performing Residents:")
for resident in top_performers:
    print(f"{resident['name']}: {resident['averageSuccessRate']:.1f}% success rate")
```

## Contributing

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd rpg-balancer

# Install dependencies
npm install

# Run tests
npm test -- tests/unit/idleVillage/ActivityHudKPIExporter.test.ts

# Run linting
npm run lint -- src/ui/idleVillage scripts/idleVillage

# Build check
npm run build:check
```

### Adding New Metrics

1. **Update Schema**: Add new fields to ActivityKPI interface
2. **Update Validation**: Extend Zod schemas
3. **Update Export**: Include new fields in export logic
4. **Add Tests**: Cover new metrics in test suite
5. **Update Documentation**: Document new metrics

### Adding New Filters

1. **Extend Filter Schema**: Add new filter options
2. **Update CLI**: Add command-line options
3. **Implement Logic**: Apply filters in processing
4. **Add Tests**: Test filter functionality
5. **Update Documentation**: Document new filters

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions about the Activity HUD KPI Exporter:

1. Check the troubleshooting section above
2. Review existing GitHub issues
3. Create detailed bug reports with:
   - Configuration used
   - Export options applied
   - Error messages and logs
   - Steps to reproduce

---

*Generated by Activity HUD KPI Exporter v1.0.0*
