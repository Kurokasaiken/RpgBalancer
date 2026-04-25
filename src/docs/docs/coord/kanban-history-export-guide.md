# Kanban History Export & Archive Guide

## Overview

The Kanban History Export system provides comprehensive CLI tools for exporting, analyzing, and archiving kanban history data from the agent assignments kanban board. This system enables data-driven insights into project progress, agent performance, and workflow optimization.

## Features

### 🚀 Export Capabilities
- **Multiple Formats**: JSON, CSV, Markdown, HTML
- **Advanced Filtering**: Status, agent, date range, and custom filters
- **Flexible Sorting**: By last update, ID, status, or duration
- **Data Limiting**: Configurable result limits for focused analysis

### 📊 Analytics & Insights
- **Performance Metrics**: Completion rates, average durations, task distribution
- **Agent Analytics**: Individual performance tracking and comparison
- **Temporal Analysis**: Monthly activity patterns and trends
- **Status Distribution**: Real-time workflow state monitoring

### 📦 Archive Management
- **Automated Archiving**: Multi-format export with metadata
- **Version Control**: Date-stamped archives for historical tracking
- **Compression Support**: Efficient storage of large datasets
- **Metadata Tracking**: Complete audit trail for compliance

## Installation & Setup

### Prerequisites
- Node.js 20.19.6+ (as specified in `.nvmrc`)
- TypeScript support
- Access to kanban data files

### Dependencies
```bash
npm install commander chalk ora cli-table3
```

### File Structure
```
scripts/coord/
├── kanbanHistoryExport.ts        # Main CLI tool
└── __tests__/
    └── KanbanHistoryExport.test.ts # Test suite

docs/coord/
└── kanban-history-export-guide.md # This guide

test-results/kanban-archives/
└── [YYYY-MM-DD]/                 # Date-stamped archives
    ├── kanban-history.json
    ├── kanban-history.csv
    ├── kanban-history.md
    ├── kanban-history.html
    └── archive-metadata.json
```

## Usage Guide

### Basic Export Commands

#### Export All Data (JSON)
```bash
npx ts-node scripts/coord/kanbanHistoryExport.ts export
```

#### Export Specific Format
```bash
# CSV Export
npx ts-node scripts/coord/kanbanHistoryExport.ts export --format csv --output kanban-data.csv

# Markdown Export
npx ts-node scripts/coord/kanbanHistoryExport.ts export --format markdown --output kanban-report.md

# HTML Export
npx ts-node scripts/coord/kanbanHistoryExport.ts export --format html --output kanban-dashboard.html
```

### Advanced Filtering

#### Filter by Status
```bash
npx ts-node scripts/coord/kanbanHistoryExport.ts export --status Completato --format csv
```

#### Filter by Agent
```bash
npx ts-node scripts/coord/kanbanHistoryExport.ts export --agent "Cascade" --format json
```

#### Date Range Filtering
```bash
npx ts-node scripts/coord/kanbanHistoryExport.ts export \
  --start-date 2026-01-01 \
  --end-date 2026-01-31 \
  --format markdown
```

#### Combined Filtering
```bash
npx ts-node scripts/coord/kanbanHistoryExport.ts export \
  --status Completato \
  --agent "Cascade" \
  --start-date 2026-01-01 \
  --end-date 2026-01-31 \
  --sort-by duration \
  --sort-order desc \
  --limit 50 \
  --format html
```

### Analytics & Analysis

#### Generate Analytics Report
```bash
npx ts-node scripts/coord/kanbanHistoryExport.ts analyze
```

This displays:
- Overall task metrics
- Status breakdown
- Agent performance comparison
- Monthly activity patterns

### Archiving

#### Create Complete Archive
```bash
npx ts-node scripts/coord/kanbanHistoryExport.ts archive
```

This creates:
- Multi-format exports (JSON, CSV, Markdown, HTML)
- Archive metadata with timestamps
- Organized in date-stamped directory
- Complete audit trail

#### Dry Run Archive (Preview)
```bash
npx ts-node scripts/coord/kanbanHistoryExport.ts archive --dry-run
```

## Command Reference

### Export Command
```bash
export [options]

Options:
  -f, --format <format>     Export format (json, csv, markdown, html) [default: "json"]
  -o, --output <path>       Output file path [default: "kanban-export.json"]
  -s, --status <status>     Filter by status
  -a, --agent <agent>       Filter by agent
  --start-date <date>       Filter by start date (YYYY-MM-DD)
  --end-date <date>         Filter by end date (YYYY-MM-DD)
  --sort-by <field>         Sort by field (lastUpdate, id, status, duration) [default: "lastUpdate"]
  --sort-order <order>      Sort order (asc, desc) [default: "desc"]
  --limit <number>          Limit number of entries
  --include-archived        Include archived entries
```

### Analyze Command
```bash
analyze

Displays comprehensive kanban analytics including:
- Total tasks and completion metrics
- Status distribution breakdown
- Agent performance comparison
- Monthly activity patterns
- Average duration statistics
```

### Archive Command
```bash
archive [options]

Options:
  --dry-run                 Show what would be archived without creating files

Creates complete archive with:
- All export formats
- Metadata and timestamps
- Organized directory structure
- Audit trail information
```

## Export Formats

### JSON Format
Complete data with analytics and metadata:
```json
{
  "metadata": {
    "exportedAt": "2026-01-11T16:45:00.000Z",
    "totalEntries": 150,
    "source": "src/docs/docs/coordinator/agent_assignments.md"
  },
  "analytics": {
    "total": 150,
    "byStatus": { "Completato": 120, "In corso": 20, "Non assegnato": 10 },
    "byAgent": { "Cascade": 80, "ChatGPT Codex 5.1": 70 },
    "completedTasks": 120,
    "averageDuration": 135.5,
    "completionRate": 80.0,
    "activeTasks": 20,
    "archivedTasks": 0,
    "monthlyActivity": { "2026-01": 150 },
    "agentPerformance": {
      "Cascade": { "completed": 80, "averageDuration": 125.0, "completionRate": 85.0 },
      "ChatGPT Codex 5.1": { "completed": 40, "averageDuration": 145.0, "completionRate": 75.0 }
    }
  },
  "data": [...]
}
```

### CSV Format
Tabular data for spreadsheet analysis:
```csv
ID,Status,Dependencies,Agent,Start Time,End Time,Duration,Estimated,Last Update,Notes
KS-001,Completato,-,Cascade,2026-01-01 10:00,2026-01-01 12:00,120,120,2026-01-01,"Evidence: Task completed"
KS-002,In corso,KS-001,ChatGPT Codex 5.1,2026-01-02 09:00,-,-,180,2026-01-02,"Working on implementation"
```

### Markdown Format
Human-readable report with tables and formatting:
```markdown
# Kanban History Export

*Generated on 1/11/2026*

## Analytics Summary

- **Total Tasks**: 150
- **Completed**: 120 (80.0%)
- **Active**: 20
- **Average Duration**: 135.5 minutes

### Status Breakdown

| Status | Count |
|--------|-------|
| Completato | 120 |
| In corso | 20 |
| Non assegnato | 10 |
```

### HTML Format
Styled web report with interactive elements:
- Responsive design with CSS styling
- Interactive tables with hover effects
- Performance metrics dashboard
- Agent performance charts
- Color-coded status indicators

## Analytics Metrics

### Overall Metrics
- **Total Tasks**: Total number of kanban entries
- **Completed Tasks**: Number of completed tasks
- **Active Tasks**: Currently in-progress tasks
- **Completion Rate**: Percentage of completed tasks
- **Average Duration**: Mean task completion time

### Status Distribution
- **Completato**: Completed tasks
- **In corso**: Currently active tasks
- **Non assegnato**: Unassigned tasks
- **Assegnato**: Assigned but not started
- **Archived**: Archived tasks

### Agent Performance
- **Task Count**: Total tasks per agent
- **Completion Rate**: Percentage of completed tasks per agent
- **Average Duration**: Mean completion time per agent
- **Efficiency Score**: Performance relative to team average

### Temporal Analysis
- **Monthly Activity**: Task volume by month
- **Trend Analysis**: Performance over time
- **Peak Periods**: High-activity timeframes
- **Velocity Metrics**: Task completion speed

## Configuration

### Default Settings
```typescript
const defaultConfig = {
  format: 'json',
  includeArchived: false,
  sortBy: 'lastUpdate',
  sortOrder: 'desc',
  outputPath: 'kanban-export.json',
};
```

### Custom Configuration
The tool supports runtime configuration via command-line options. All settings can be overridden per command.

### Performance Tuning
- **Large Datasets**: Use `--limit` for focused analysis
- **Memory Efficiency**: Process data in chunks for >10K entries
- **Export Optimization**: Choose appropriate format for data size

## Integration Examples

### CI/CD Pipeline Integration
```bash
#!/bin/bash
# Weekly kanban analytics
npx ts-node scripts/coord/kanbanHistoryExport.ts export \
  --format json \
  --output "reports/weekly-kanban-$(date +%Y-%m-%d).json" \
  --start-date $(date -d '7 days ago' +%Y-%m-%d)

# Generate analytics report
npx ts-node scripts/coord/kanbanHistoryExport.ts analyze > "reports/weekly-analytics-$(date +%Y-%m-%d).md"
```

### Monthly Reporting
```bash
#!/bin/bash
# Monthly archive creation
npx ts-node scripts/coord/kanbanHistoryExport.ts archive

# Generate comprehensive report
npx ts-node scripts/coord/kanbanHistoryExport.ts export \
  --format html \
  --output "reports/monthly-report-$(date +%Y-%m).html" \
  --start-date $(date -d '30 days ago' +%Y-%m-%d)
```

### Agent Performance Review
```bash
#!/bin/bash
# Individual agent analysis
AGENT="Cascade"
npx ts-node scripts/coord/kanbanHistoryExport.ts export \
  --agent "$AGENT" \
  --format csv \
  --output "reports/${AGENT}-performance-$(date +%Y-%m-%d).csv" \
  --sort-by duration \
  --sort-order desc
```

## Troubleshooting

### Common Issues

#### File Not Found Error
```
Error: Kanban file not found: src/docs/docs/coordinator/agent_assignments.md
```
**Solution**: Ensure the kanban file exists at the expected path. Check file permissions and directory structure.

#### Permission Denied Error
```
Error: Write permission denied
```
**Solution**: Check write permissions for output directory. Use `sudo` if necessary or choose a different output path.

#### Memory Issues with Large Datasets
```
Error: JavaScript heap out of memory
```
**Solution**: Use `--limit` to reduce dataset size or process data in smaller chunks.

#### Date Parsing Errors
```
Error: Invalid date format
```
**Solution**: Ensure dates are in YYYY-MM-DD format. Check kanban data for inconsistent date formats.

### Performance Optimization

#### Large Dataset Handling
- Use `--limit` for focused analysis
- Process data in time-based chunks
- Consider CSV format for memory efficiency

#### Export Format Selection
- **JSON**: Full data with analytics (larger file size)
- **CSV**: Tabular data only (smaller file size)
- **Markdown**: Human-readable (medium file size)
- **HTML**: Styled report (largest file size)

#### Filtering Efficiency
- Apply filters early in the pipeline
- Use specific date ranges to reduce data volume
- Combine multiple filters for precise results

## API Reference

### Core Functions

#### `loadKanbanData()`
Loads kanban data from markdown file.
```typescript
async function loadKanbanData(): Promise<KanbanRow[]>
```

#### `filterData(data, config)`
Filters and sorts kanban data based on configuration.
```typescript
function filterData(data: KanbanRow[], config: ExportConfig): KanbanRow[]
```

#### `generateAnalytics(data)`
Generates comprehensive analytics from kanban data.
```typescript
function generateAnalytics(data: KanbanRow[]): KanbanAnalytics
```

#### Export Functions
```typescript
async function exportJSON(data: KanbanRow[], analytics: KanbanAnalytics, outputPath: string): Promise<void>
async function exportCSV(data: KanbanRow[], outputPath: string): Promise<void>
async function exportMarkdown(data: KanbanRow[], analytics: KanbanAnalytics, outputPath: string): Promise<void>
async function exportHTML(data: KanbanRow[], analytics: KanbanAnalytics, outputPath: string): Promise<void>
```

### Type Definitions

#### `KanbanRow`
```typescript
interface KanbanRow {
  id: string;
  status: string;
  dependencies: string;
  agent: string;
  startTime: string;
  endTime: string;
  duration: string;
  estimated: string;
  lastUpdate: string;
  notes: string;
  lineNumber: number;
}
```

#### `KanbanAnalytics`
```typescript
interface KanbanAnalytics {
  total: number;
  byStatus: Record<string, number>;
  byAgent: Record<string, number>;
  completedTasks: number;
  averageDuration: number;
  completionRate: number;
  activeTasks: number;
  archivedTasks: number;
  monthlyActivity: Record<string, number>;
  agentPerformance: Record<string, {
    completed: number;
    averageDuration: number;
    completionRate: number;
  }>;
}
```

## Best Practices

### Data Management
- **Regular Backups**: Archive data monthly to prevent loss
- **Version Control**: Track archive versions for historical analysis
- **Data Validation**: Verify data integrity before analysis
- **Privacy Compliance**: Ensure sensitive data is properly handled

### Performance Optimization
- **Incremental Processing**: Process data in manageable chunks
- **Memory Management**: Monitor memory usage with large datasets
- **Format Selection**: Choose appropriate export format for use case
- **Filter Efficiency**: Apply filters early to reduce processing load

### Reporting Standards
- **Consistent Naming**: Use standardized file naming conventions
- **Documentation**: Include metadata and context in reports
- **Visualization**: Use HTML format for interactive dashboards
- **Automation**: Schedule regular exports for continuous monitoring

### Quality Assurance
- **Test Coverage**: Comprehensive test suite for all functions
- **Error Handling**: Graceful error recovery and user feedback
- **Data Validation**: Verify export accuracy and completeness
- **Performance Testing**: Validate performance with large datasets

## Security Considerations

### Data Protection
- **Access Control**: Limit access to kanban data files
- **Encryption**: Consider encryption for sensitive data
- **Audit Trail**: Maintain complete audit logs
- **Backup Security**: Secure storage of archived data

### Privacy Compliance
- **Data Minimization**: Export only necessary data
- **Anonymization**: Remove personal information where appropriate
- **Retention Policies**: Implement data retention schedules
- **Compliance Monitoring**: Regular compliance audits

## Future Enhancements

### Planned Features
- **Real-time Monitoring**: Live dashboard with WebSocket updates
- **Advanced Analytics**: Machine learning insights and predictions
- **Integration APIs**: REST API for programmatic access
- **Custom Reports**: Template-based report generation
- **Data Visualization**: Interactive charts and graphs
- **Multi-source Support**: Integration with multiple kanban systems

### Performance Improvements
- **Streaming Processing**: Handle unlimited dataset sizes
- **Caching Layer**: Improve response times for repeated queries
- **Parallel Processing**: Multi-threaded data processing
- **Database Backend**: Support for database storage
- **Compression**: Reduce storage requirements
- **Incremental Updates**: Process only changed data

### User Experience
- **Web Interface**: Browser-based export and analysis tool
- **Mobile Support**: Responsive design for mobile devices
- **Custom Filters**: Save and reuse filter configurations
- **Scheduled Exports**: Automated export scheduling
- **Notification System**: Email alerts for key metrics
- **Collaboration Features**: Shared reports and dashboards

## Support & Maintenance

### Getting Help
- **Documentation**: This guide and inline code documentation
- **Issue Tracking**: Report issues via project issue tracker
- **Community Support**: Team collaboration channels
- **Code Review**: Peer review for contributions

### Maintenance Schedule
- **Weekly**: Data validation and performance monitoring
- **Monthly**: Archive creation and cleanup
- **Quarterly**: Feature updates and security patches
- **Annually**: Comprehensive system review and optimization

### Contributing
- **Code Standards**: Follow project coding guidelines
- **Test Requirements**: Comprehensive test coverage
- **Documentation**: Update documentation for changes
- **Review Process**: Peer review for all contributions

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-11  
**Maintainer**: Project Coordination Team
