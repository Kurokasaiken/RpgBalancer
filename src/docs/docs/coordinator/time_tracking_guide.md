# Time Tracking System Guide

## Overview

The Time Tracking System provides comprehensive task execution analysis for the RPG Balancer project. It supports both automatic and manual time logging with Kanban integration, enabling objective metrics on task duration, agent performance, and project trends.

## Features

- **Task Time Tracking**: Start, stop, pause, and resume task timing
- **Kanban Integration**: Automatic time metadata in agent_assignments.md
- **Multiple Report Formats**: JSON, Markdown, CSV, and HTML dashboard
- **Category Analysis**: Automatic categorization and metrics by task type
- **Agent Performance**: Individual and comparative agent metrics
- **Trend Analysis**: Daily aggregation and historical trends
- **CLI Interface**: Command-line tools for manual tracking and reporting

## Quick Start

### 1. Track a New Task

```bash
# Start tracking a task with estimated duration
npm run time-tracker start --task KS-067 --description "Time Tracking System" --agent Cascade --estimated 120

# Stop the task with completion notes
npm run time-tracker stop --task KS-067 --notes "Implementation completed successfully"
```

### 2. View Current Tasks

```bash
# List all tasks
npm run time-tracker list

# List only active tasks
npm run time-tracker list --filter active

# List completed tasks
npm run time-tracker list --filter completed
```

### 3. Generate Reports

```bash
# Generate markdown report (default)
npm run time-reporter report markdown

# Generate JSON report
npm run time-reporter report json

# Generate CSV report
npm run time-reporter report csv

# Generate HTML dashboard
npm run time-reporter dashboard
```

## CLI Commands

### Time Tracker (`npm run time-tracker`)

#### Start Task
```bash
npm run time-tracker start --task <taskId> --description <desc> --agent <agent> [--estimated <minutes>]
```

**Required arguments:**
- `--task`: Task ID (e.g., KS-067)
- `--description`: Task description
- `--agent`: Agent name

**Optional arguments:**
- `--estimated`: Estimated duration in minutes

#### Stop Task
```bash
npm run time-tracker stop --task <taskId> [--notes <notes>]
```

#### Pause/Resume Task
```bash
npm run time-tracker pause --task <taskId>
npm run time-tracker resume --task <taskId>
```

#### List Tasks
```bash
npm run time-tracker list [--filter <all|active|completed>]
```

### Time Reporter (`npm run time-reporter`)

#### Generate Reports
```bash
npm run time-reporter report [json|markdown|csv]
```

#### Generate Dashboard
```bash
npm run time-reporter dashboard
```

## Kanban Integration

### Time Columns

The Kanban table in `agent_assignments.md` includes time tracking columns:

| Column | Description |
|--------|-------------|
| **Start Time** | When task execution began |
| **End Time** | When task execution completed |
| **Duration** | Actual execution time in minutes |
| **Est.** | Estimated duration in minutes |

### Manual Time Entry

For tasks tracked manually, update the Kanban with time metadata:

```markdown
| KS-067 Time Tracking System | Completato | - | Cascade | 2026-01-07 21:00 | 2026-01-07 23:30 | 150 | 120 | 2026-01-07 | Evidence: Time tracking system implemented with CLI tools, reporting, and Kanban integration. |
```

### Time Format

- **Start/End Time**: `YYYY-MM-DD HH:MM` (24-hour format)
- **Duration**: Minutes (integer)
- **Estimated**: Minutes (integer, optional)

## Automatic Categories

The system automatically categorizes tasks based on description:

| Category | Keywords |
|----------|----------|
| **Testing** | test, spec, e2e |
| **Development** | config, balancer, ui |
| **Documentation** | doc, guide, readme |
| **Bug Fix** | fix, bug, issue |
| **Refactoring** | refactor, cleanup, optimize |
| **General** | (default) |

## Report Formats

### Markdown Report

- Overview metrics
- Category breakdown table
- Agent performance analysis
- Recent trends (last 7 days)
- Notable tasks (longest/shortest)

**Location**: `test-results/time-tracking/time-report.md`

### JSON Report

- Complete data structure
- All metrics and calculations
- Machine-readable format
- API integration ready

**Location**: `test-results/time-tracking/time-report.json`

### CSV Report

- Flat table format
- All task entries
- Spreadsheet compatible
- Data analysis ready

**Location**: `test-results/time-tracking/time-report.csv`

### HTML Dashboard

- Visual metrics display
- Category time bars
- Auto-refresh (30 seconds)
- Browser-based viewing

**Location**: `test-results/time-tracking/dashboard.html`

## Metrics Analysis

### Key Metrics

- **Completion Rate**: Percentage of tasks completed vs. total
- **Average Duration**: Mean execution time across completed tasks
- **Category Performance**: Time distribution by task category
- **Agent Efficiency**: Individual agent completion rates and averages
- **Trend Analysis**: Daily patterns and productivity trends

### Performance Indicators

#### High Performance
- Completion rate > 80%
- Average duration within estimated range
- Consistent daily output

#### Areas for Improvement
- Tasks exceeding estimates by >50%
- Low completion rates in specific categories
- Inconsistent daily patterns

## Workflow Integration

### For Agents

1. **Start Task**: Begin tracking when starting work
   ```bash
   npm run time-tracker start --task KS-XXX --description "Task description" --agent YourName --estimated 60
   ```

2. **Pause/Resume**: Use for interruptions
   ```bash
   npm run time-tracker pause --task KS-XXX
   npm run time-tracker resume --task KS-XXX
   ```

3. **Complete Task**: Stop when finished
   ```bash
   npm run time-tracker stop --task KS-XXX --notes "Implementation details"
   ```

4. **Update Kanban**: Add time metadata to agent_assignments.md

### For Coordinators

1. **Daily Review**: Generate reports to track progress
   ```bash
   npm run time-reporter report markdown
   ```

2. **Performance Analysis**: Review agent metrics and trends
   ```bash
   npm run time-reporter dashboard
   ```

3. **Planning**: Use historical data for better estimates

## Data Storage

### File Structure

```
test-results/time-tracking/
├── time-tracking.json    # Primary data file
├── time-report.md        # Markdown report
├── time-report.json      # JSON report
├── time-report.csv       # CSV report
└── dashboard.html        # HTML dashboard
```

### Data Format

```json
{
  "entries": [
    {
      "taskId": "KS-067",
      "taskDescription": "Time Tracking System",
      "agent": "Cascade",
      "startTime": "2026-01-07T21:00:00.000Z",
      "endTime": "2026-01-07T23:30:00.000Z",
      "duration": 150,
      "estimatedDuration": 120,
      "category": "Development",
      "status": "completed",
      "notes": "Implementation completed successfully",
      "createdAt": "2026-01-07T21:00:00.000Z",
      "updatedAt": "2026-01-07T23:30:00.000Z"
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "lastUpdated": "2026-01-07T23:30:00.000Z",
    "totalTasks": 1,
    "totalCompletedTasks": 1,
    "totalTrackedMinutes": 150
  }
}
```

## Best Practices

### Time Estimation

1. **Break Down Tasks**: Estimate smaller components separately
2. **Use Historical Data**: Reference similar completed tasks
3. **Include Buffer**: Add 20-30% buffer for unexpected issues
4. **Track Estimates vs. Actual**: Improve future estimates

### Consistent Tracking

1. **Start Immediately**: Begin tracking when starting work
2. **Pause for Breaks**: Don't include break time in task duration
3. **Add Detailed Notes**: Record obstacles, solutions, and learnings
4. **Update Kanban**: Keep time metadata current

### Review Process

1. **Daily**: Review active tasks and progress
2. **Weekly**: Generate comprehensive reports
3. **Monthly**: Analyze trends and adjust estimates
4. **Per Project**: Review overall performance metrics

## Troubleshooting

### Common Issues

**Task not found:**
```bash
npm run time-tracker list --filter all
```

**Missing time data:**
```bash
# Check data file exists
ls test-results/time-tracking/time-tracking.json
```

**Report generation fails:**
```bash
# Ensure data exists and is valid
npm run time-tracker list
```

### Data Recovery

Time tracking data is stored in `test-results/time-tracking/time-tracking.json`. 
For data recovery:

1. Check the file exists and is readable
2. Verify JSON format is valid
3. Use `npm run time-tracker list` to validate data integrity

## Integration Examples

### CI/CD Integration

```yaml
# .github/workflows/time-tracking.yml
- name: Generate Time Report
  run: |
    npm run time-reporter report markdown
    npm run time-reporter dashboard
    
- name: Upload Reports
  uses: actions/upload-artifact@v3
  with:
    name: time-tracking-reports
    path: test-results/time-tracking/
```

### Project Management Integration

Export data for project management tools:

```bash
# Export to CSV for spreadsheet analysis
npm run time-reporter report csv

# Export to JSON for API integration
npm run time-reporter report json
```

## API Reference

### Time Tracker Functions

```typescript
import { startTask, stopTask, pauseTask, resumeTask, listTasks } from './scripts/timeTracker.js';

// Start tracking
startTask('KS-067', 'Description', 'Agent', 120);

// Stop tracking
stopTask('KS-067', 'Completion notes');

// List tasks
listTasks('active');
```

### Time Reporter Functions

```typescript
import { generateReport, generateDashboard, calculateMetrics } from './scripts/timeReporter.js';

// Generate report
generateReport('markdown');

// Generate dashboard
generateDashboard();

// Calculate metrics
const metrics = calculateMetrics(data);
```

## Future Enhancements

- **Web Interface**: Browser-based time tracking UI
- **Integration APIs**: REST API for external tool integration
- **Advanced Analytics**: Predictive modeling and trend forecasting
- **Team Collaboration**: Shared projects and team metrics
- **Mobile Support**: Mobile app for on-the-go tracking

## Support

For issues or questions about the Time Tracking System:

1. Check this guide for common solutions
2. Review CLI help: `npm run time-tracker` or `npm run time-reporter`
3. Check data files in `test-results/time-tracking/`
4. Contact the project coordinator for assistance
