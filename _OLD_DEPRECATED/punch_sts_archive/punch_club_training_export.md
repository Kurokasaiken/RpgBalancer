# Punch Club Training Plan Export CLI - NP-052

## Overview

The Punch Club Training Plan Export CLI provides a comprehensive command-line interface for exporting training plans with filters, multiple output formats, and telemetry integration. It supports JSON, Markdown, and CSV export formats with extensive filtering options for sessions, KPIs, and statistics.

## Features

### Export Capabilities
- **Multiple Formats**: JSON, Markdown, and CSV export
- **Flexible Filtering**: Filter by date range, status, exercise, and more
- **Configurable Options**: Include/exclude KPIs, sessions, stats, equipment, and notes
- **Sorting & Grouping**: Sort by date, duration, difficulty, or status; group by various criteria
- **Batch Export**: Export multiple plans at once
- **Validation**: Built-in validation for training plan structure

### CLI Commands
- **export**: Export training plans with filters and options
- **list**: List available training plans in table or JSON format
- **info**: Show detailed information about training plans
- **validate**: Validate training plan files and directories
- **create**: Create new training plans from combat configuration

### Integration Points
- **PersistenceService**: Load/save training plans with async storage
- **Combat Config**: Generate plans from existing configuration
- **Telemetry**: Emit `pc_training_plan_exported` events for tracking
- **File System**: Fallback to file system for plan storage

## Installation

The CLI is included in the RPG Balancer project. No additional installation required.

```bash
# Ensure Node.js 20+ is active
source ~/.nvm/nvm.sh && nvm use

# Make CLI executable (optional)
chmod +x scripts/punchClub/trainingPlanExport.ts
```

## Usage

### Export Commands

#### Basic Export
```bash
# Export all training plans to JSON
tsx scripts/punchClub/trainingPlanExport.ts export

# Export to Markdown
tsx scripts/punchClub/trainingPlanExport.ts export --format markdown

# Export to CSV
tsx scripts/punchClub/trainingPlanExport.ts export --format csv
```

#### Filtering Options
```bash
# Export specific plan
tsx scripts/punchClub/trainingPlanExport.ts export --plan "my-training-plan"

# Filter by date range
tsx scripts/punchClub/trainingPlanExport.ts export --date-range 2023-01-01,2023-01-31

# Filter by status
tsx scripts/punchClub/trainingPlanExport.ts export --status completed,skipped

# Filter by exercise
tsx scripts/punchClub/trainingPlanExport.ts export --exercise cardio,strength

# Sort by duration (descending)
tsx scripts/punchClub/trainingPlanExport.ts export --sort duration --order desc

# Group by exercise
tsx scripts/punchClub/trainingPlanExport.ts export --group exercise
```

#### Include/Exclude Options
```bash
# Include only KPIs
tsx scripts/punchClub/trainingPlanExport.ts export --kpi --no-sessions --no-stats --no-equipment --no-notes

# Include only sessions
tsx scripts/punchClub/trainingPlanExport.ts export --sessions --no-kpi --no-stats --no-equipment --no-notes

# Include everything (default)
tsx scripts/punchClub/trainingPlanExport.ts export --kpi --sessions --stats --equipment --notes
```

#### Output Configuration
```bash
# Specify output file
tsx scripts/punchClub/trainingPlanExport.ts export --output my-export.json

# Custom output directory
tsx scripts/punchClub/trainingPlanExport.ts export --output-dir ./custom/exports

# Verbose output
tsx scripts/punchClub/trainingPlanExport.ts export --verbose
```

### Management Commands

#### List Training Plans
```bash
# List all plans in table format
tsx scripts/punchClub/trainingPlanExport.ts list

# List plans in JSON format
tsx scripts/punchClub/trainingPlanExport.ts list --format json

# Filter by name or tag
tsx scripts/punchClub/trainingPlanExport.ts list --filter cardio
```

#### Show Plan Information
```bash
# Show summary of all plans
tsx scripts/punchClub/trainingPlanExport.ts info

# Show detailed info for specific plan
tsx scripts/punchClub/trainingPlanExport.ts info --plan "my-training-plan" --detailed

# Show plan summary
tsx scripts/punchClub/trainingPlanExport.ts info --plan "my-training-plan"
```

#### Validate Training Plans
```bash
# Validate single file
tsx scripts/punchClub/trainingPlanExport.ts validate --file ./data/exports/punchClub/my-plan.json

# Validate directory
tsx scripts/punchClub/trainingPlanExport.ts validate --directory ./data/exports/punchClub

# Validate with custom directory
tsx scripts/punchClub/trainingPlanExport.ts validate --directory ./custom/exports
```

#### Create Training Plans
```bash
# Create basic plan
tsx scripts/punchClub/trainingPlanExport.ts create --name "Beginner Cardio" --description "Cardio training for beginners"

# Create plan with custom settings
tsx scripts/punchClub/trainingPlanExport.ts create \
  --name "Advanced Strength" \
  --description "Advanced strength training program" \
  --author "Trainer John" \
  --target-level 20 \
  --focus strength,defense \
  --output advanced-strength.json

# Create plan with default settings
tsx scripts/punchClub/trainingPlanExport.ts create \
  --name "Balanced Training" \
  --description "Balanced cardio and strength training" \
  --target-level 10
```

## Output Formats

### JSON Format
```json
{
  "id": "test-plan-1",
  "name": "Test Training Plan",
  "description": "A test training plan for unit testing",
  "version": "1.0.0",
  "createdAt": "2023-01-19T12:00:00.000Z",
  "updatedAt": "2023-01-19T12:00:00.000Z",
  "author": "Test Author",
  "targetLevel": 10,
  "focusAreas": ["cardio", "strength", "technique"],
  "schedule": {
    "frequency": "weekly",
    "sessionsPerWeek": 3,
    "preferredDays": ["monday", "wednesday", "friday"],
    "preferredTime": "18:00"
  },
  "sessions": [
    {
      "id": "session-1",
      "exerciseId": "cardio",
      "scheduledAt": "2023-01-19T18:00:00.000Z",
      "duration": 30,
      "targetStats": { "stamina": 2, "health": 1 },
      "status": "completed",
      "difficulty": "medium",
      "intensity": 1.0,
      "equipment": ["treadmill"]
    }
  ],
  "kpis": {
    "totalSessions": 2,
    "completedSessions": 1,
    "skippedSessions": 0,
    "failedSessions": 0,
    "totalDuration": 75,
    "averageSessionDuration": 37.5,
    "statProgression": { "stamina": 2, "health": 1, "strength": 0 },
    "strengthGains": 0,
    "staminaGains": 2,
    "speedGains": 0,
    "defenseGains": 0,
    "techniqueGains": 0,
    "healthGains": 1,
    "experienceGained": 100,
    "moneyEarned": 50,
    "completionRate": 0.5,
    "averageIntensity": 1.1,
    "trainingStreak": 1,
    "lastTrainingDate": "2023-01-19T18:00:00.000Z"
  },
  "baselineStats": {
    "health": 100,
    "stamina": 100,
    "strength": 10,
    "speed": 10,
    "defense": 10,
    "technique": 10
  },
  "targetStats": {
    "health": 150,
    "stamina": 120,
    "strength": 20,
    "speed": 15,
    "defense": 15,
    "technique": 15
  },
  "equipment": ["treadmill", "dumbbells", "punching bag"],
  "notes": "Test notes for the training plan",
  "tags": ["test", "cardio", "strength"],
  "isPublic": false,
  "isTemplate": false,
  "exportedAt": "2023-01-19T12:00:00.000Z",
  "serializerVersion": "1.0.0"
}
```

### Markdown Format
```markdown
# Test Training Plan

**Description:** A test training plan for unit testing
**Author:** Test Author
**Target Level:** 10
**Version:** 1.0.0.0
**Created:** 1/19/2023
**Updated:** 1/19/2023

## Focus Areas

- **Cardio**
- **Strength**
- **Technique**

## Schedule

- **Frequency:** weekly
- **Sessions per Week:** 3
- **Preferred Days:** monday, wednesday, friday
- **Preferred Time:** 18:00

## Performance Metrics

- **Total Sessions:** 2
- **Completed Sessions:** 1
- **Completion Rate:** 50.0%
- **Total Duration:** 75 minutes
- **Average Session Duration:** 37.5 minutes
- **Training Streak:** 1 days

### Stat Gains

- **Stamina:** +2
- **Health:** +1

## Training Sessions

| Date | Exercise | Duration | Status | Difficulty | Intensity |
|------|----------|----------|--------|------------|
| 1/19/2023 | cardio | 30min | ✅ completed | 🟡 Medium | 1.0x |
| 1/21/2023 | strength | 45min | 📅 scheduled | 🔴 Hard | 1.2x |

## Equipment

- treadmill
- dumbbells
- punching bag

## Notes

Test notes for the training plan

## Tags

- test
- cardio
- strength
```

### CSV Format
```csv
Training Plan Export
Name,Test Training Plan
Description,A test training plan for unit testing
Author,Test Author
Target Level,10
Version,1.0.0.0
Created,1/19/2023
Updated,1/19/2023

Performance Metrics
Metric,Value
Total Sessions,2
Completed Sessions,1
Completion Rate,50.0%
Total Duration,75 minutes
Average Session Duration,37.5 minutes
Training Streak,1 days

Stat Gains
Stat,Gains
Strength,0
Stamina,2
Speed,0
Defense,0
Technique,0
Health,1

Training Sessions
Date,Exercise ID,Duration,Status,Difficulty,Intensity,Notes
1/19/2023,cardio,30min,completed,Medium,1.0,
1/21/2023,strength,45min,scheduled,Hard,1.2,
```

## Data Structures

### Training Plan
```typescript
interface TrainingPlan {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  targetLevel: number;
  focusAreas: ('cardio' | 'strength' | 'technique' | 'defense' | 'speed')[];
  schedule: {
    frequency: ('daily' | 'weekly' | 'bi-weekly' | 'monthly');
    sessionsPerWeek: number;
    preferredDays: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
    preferredTime: string; // HH:MM format
  };
  sessions: TrainingSession[];
  kpis: TrainingKPI;
  baselineStats?: FighterStats;
  targetStats?: FighterStats;
  equipment?: string[];
  notes?: string;
  tags?: string[];
  isPublic: boolean;
  isTemplate: boolean;
  parentPlanId?: string;
  childPlanIds?: string[];
}
```

### Training Session
```typescript
interface TrainingSession {
  id: string;
  exerciseId: string;
  scheduledAt: string; // ISO timestamp
  duration: number; // minutes
  targetStats: Record<string, number>;
  actualStats?: Record<string, number>;
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  notes?: string;
  equipment?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  intensity: number; // 0.1 to 2.0
}
```

### Training KPI
```typescript
interface TrainingKPI {
  totalSessions: number;
  completedSessions: number;
  skippedSessions: number;
  failedSessions: number;
  totalDuration: number; // minutes
  averageSessionDuration: number;
  statProgression: Record<string, number>;
  strengthGains: number;
  staminaGains: number;
  speedGains: number;
  defenseGains: number;
  techniqueGains: number;
  healthGains: number;
  experienceGained: number;
  moneyEarned: number;
  completionRate: number; // 0 to 1
  averageIntensity: number;
  trainingStreak: number;
  lastTrainingDate?: string;
  preferredDifficulty?: 'easy' | 'medium' | 'hard';
  mostUsedExercise?: string;
}
```

### Fighter Stats
```typescript
interface FighterStats {
  health: number; // 1-999
  stamina: number; // 1-200
  strength: number; // 1-100
  speed: number; // 1-100
  defense: number; // 1-100
  technique: number; // 1-100
}
```

## Export Configuration

### Export Options
```typescript
interface TrainingPlanExportConfig {
  format: 'json' | 'markdown' | 'csv';
  includeKPIs: boolean;
  includeSessions: boolean;
  includeStats: boolean;
  includeEquipment: boolean;
  includeNotes: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  statusFilter?: ('scheduled' | 'in_progress' | 'completed' | 'skipped' | 'failed')[];
  exerciseFilter?: string[];
  sortBy: 'date' | 'duration' | 'difficulty' | 'status';
  sortOrder: 'asc' | 'desc';
  groupBy: 'none' | 'week' | 'month' | 'exercise' | 'difficulty';
}
```

## Filtering Examples

### Date Range Filtering
```bash
# Export sessions from January 2023
tsx scripts/punchClub/trainingPlanExport.ts export --date-range 2023-01-01,2023-01-31

# Export sessions from last week
tsx scripts/punchClub/trainingPlanExport.ts export --date-range $(date -d '7 days' -I '%Y-%m-%d'),$(date -I '%Y-%m-%d')
```

### Status Filtering
```bash
# Export only completed sessions
tsx scripts/punchClub/trainingPlanExport.ts export --status completed

# Export completed and skipped sessions
tsx scripts/punchClub/trainingPlanExport.ts export --status completed,skipped

# Export failed sessions for debugging
tsx scripts/punchClub/trainingPlanExport.ts export --status failed
```

### Exercise Filtering
```bash
# Export only cardio sessions
tsx scripts/punchClub/trainingPlanExport.ts export --exercise cardio

# Export multiple exercise types
tsx scripts/punchClub/trainingPlanExport.ts export --exercise cardio,strength,technique

# Export specific exercises
tsx scripts/punchClub/trainingPlanExport.ts export --exercise treadmill,dumbbells
```

### Sorting Options
```bash
# Sort by duration (longest first)
tsx scripts/punchClub/trainingPlanExport.ts export --sort duration --order desc

# Sort by difficulty (hardest first)
tsx scripts/punchClub/trainingPlanExport.ts export --sort difficulty --order desc

# Sort by status (completed first)
tsx scripts/punchClub/trainingPlanExport.ts export --sort status --order desc
```

### Grouping Options
```bash
# Group by exercise
tsx scripts/punchClub/trainingPlanExport.ts export --group exercise

# Group by difficulty
tsx scripts/punchClub/trainingPlanExport.ts export --group difficulty

# Group by week
tsx scripts/punchClub/trainingPlanExport.ts export --group week

# Group by month
tsx scripts/punchClub/trainingPlanExport.ts export --group month
```

## Workflows

### Daily Export Routine
```bash
# Export all plans with KPIs and sessions
tsx scripts/punchClub/trainingPlanExport.ts export --format json --output-dir ./daily-exports

# Export summary for review
tsx scripts/punchClub/trainingPlanExport.ts list --format table

# Validate all exported files
tsx scripts/punchClub/trainingPlanExport.ts validate --directory ./daily-exports
```

### Weekly Analysis
```bash
# Export last week's data
tsx scripts/punchClub/trainingPlanExport.ts export --date-range $(date -d '7 days' -I '%Y-%m-%d'),$(date -I '%Y-%m-%d') --format markdown

# Export completed sessions only
tsx scripts/punchClub/trainingPlanExport.ts export --status completed --format csv --output weekly-completed.csv

# Export with detailed information
tsx scripts/punchClub/trainingPlanExport.ts export --verbose --include-kpi --include-sessions --include-stats
```

### Plan Creation
```bash
# Create beginner plan
tsx scripts/punchClub/trainingPlanExport.ts create \
  --name "Beginner Cardio" \
  --description "Low-intensity cardio training for beginners" \
  --target-level 5 \
  --focus cardio \
  --output beginner-cardio.json

# Create advanced plan
tsx scripts/punchClub/trainingPlanExport.ts create \
  --name "Advanced Strength" \
  --description "High-intensity strength training for advanced athletes" \
  --target-level 20 \
  --focus strength,defense \
  --output advanced-strength.json

# Create balanced plan
tsx scripts/punchClub/trainingPlanExport.ts create \
  --name "Balanced Training" \
  --description "Balanced cardio and strength training" \
  --target-level 10 \
  --focus cardio,strength,technique \
  --output balanced-training.json
```

### Validation and Quality Assurance
```bash
# Validate all exported files
tsx scripts/punchClub/trainingPlanExport.ts validate --directory ./data/exports/punchClub

# Validate specific file
tsx scripts/punchClub/trainingPlanExport.ts validate --file ./data/exports/punchClub/my-plan.json

# List all plans with validation status
tsx scripts/punchClub/trainingPlanExport.ts list --format table
```

## Telemetry Integration

### Telemetry Events
The CLI automatically emits telemetry events for tracking:

#### Export Events
```typescript
{
  "event": "pc_training_plan_exported",
  "timestamp": "2023-01-19T12:00:00.000Z",
  "data": {
    "planId": "test-plan-1",
    "planName": "Test Training Plan",
    "format": "json",
    "config": {
      "includeKPIs": true,
      "includeSessions": true,
      "sortBy": "date",
      "sortOrder": "asc",
      "groupBy": "none"
    },
    "outputFile": "test-training-plan-2023-01-19.json",
    "sessionsCount": 2,
    "kpis": {
      "totalSessions": 2,
      "completedSessions": 1,
      "completionRate": 0.5
    }
  }
}
```

#### Creation Events
```typescript
{
  "event": "pc_training_plan_created",
  "timestamp": "2023-01-19T12:00:00.000Z",
  "data": {
    "planId": "auto-generated-plan-123",
    "planName": "Beginner Cardio",
    "targetLevel": 5,
    "focusAreas": ["cardio"],
    "sessionsCount": 15,
    "outputFile": "beginner-cardio-2023-01-19.json"
  }
}
```

### Telemetry Storage
- **Location**: `telemetry_<event>_<timestamp>`
- **Format**: JSON with metadata
- **Access**: Via PersistenceService
- **Retention**: Follows project retention policies

## Integration Points

### Persistence Service
```typescript
// Load training plans
const plans = await loadData('punch-club-training-plans', null);

// Save telemetry events
await saveData(`telemetry_${event}_${Date.now()}`, {
  event,
  timestamp: new Date().toISOString(),
  data,
});
```

### Combat Configuration
```typescript
// Create plan from combat config
const plan = TrainingPlanSerializer.createFromCombatConfig(
  DEFAULT_COMBAT_CONFIG,
  'My Training Plan',
  'Description',
  'Author',
  10
);
```

### File System Integration
```typescript
// Fallback to file system
const exportDir = './data/exports/punchClub';
const files = await readdir(exportDir);
const jsonFiles = files.filter(f => f.endsWith('.json'));
```

## Error Handling

### Common Errors
```bash
# No training plans found
Error: No training plans found
Solution: Create plans using create command or check storage

# Invalid plan format
Error: Invalid training plan format
Solution: Use validate command to check file structure

# Permission denied
Error: EACCES: permission denied
Solution: Check file permissions and directory access

# Invalid date range
Error: Invalid date range format
Solution: Use YYYY-MM-DD,YYYY-MM-DD format
```

### Recovery Strategies
1. **Validation First**: Always validate before exporting
2. **Dry Run Mode**: Use --verbose to see detailed output
3. **Fallback Options**: CLI falls back to file system if persistence fails
4. **Error Logging**: Detailed error messages for debugging
5. **Graceful Degradation**: Partial exports when possible

## Performance Considerations

### Large Plans
- **Session Limits**: CLI handles plans with 100+ sessions efficiently
- **Memory Usage**: Streaming export for very large datasets
- **File Size**: JSON files can become large with extensive histories

### Batch Operations
- **Parallel Processing**: Multiple plans exported in sequence
- **Memory Optimization**: One plan at a time to avoid memory issues
- **File I/O**: Async operations prevent blocking

### Export Performance
| Operation | Expected Time |
|-----------|---------------|
| Small Plan (10 sessions) | < 100ms |
| Medium Plan (50 sessions) | < 500ms |
| Large Plan (100+ sessions) | < 1s |
| CSV Export | < 500ms |
| Markdown Export | < 300ms |

## Best Practices

### File Organization
```bash
# Use consistent naming conventions
tsx scripts/punchClub/trainingPlanExport.ts export --output "training-plan-$(date +%Y-%m-%d).json"

# Organize exports by date
tsx scripts/punchClub/trainingPlanExport.ts export --output-dir ./exports/$(date +%Y/%m)

# Use descriptive filenames
tsx scripts/punchClub/trainingPlanExport.ts export --plan "cardio-strength-plan" --output "cardio-strength-plan-$(date +%Y-%m-%d).json"
```

### Validation Workflow
```bash
# Always validate before using
tsx scripts/punchClub/trainingPlanExport.ts validate --file ./my-plan.json

# Validate entire directory
tsx scripts/punchClub/trainingPlanExport.ts validate --directory ./exports

# Check plan integrity before export
tsx scripts/punchClub/trainingPlanExport.ts info --plan "my-plan" --detailed
```

### Backup Strategy
```bash
# Create timestamped backups
tsx scripts/punchClub/trainingPlanExport.ts export --output "backup-$(date +%Y-%m-%d).json"

# Export to multiple formats for redundancy
tsx scripts/punchClub/trainingPlanExport.ts export --format json
tsx scripts/punchClub/trainingPlanExport.ts export --format markdown
tsx scripts/punchClub/trainingPlanExport.ts export --format csv
```

## Troubleshooting

### Common Issues

#### Plan Not Found
```bash
# Check if plan exists
tsx scripts/punchClub/trainingPlanExport.ts list --filter "plan-name"

# Check exact ID
tsx scripts/punchClub/trainingPlanExport.ts info --plan "exact-plan-id"
```

#### Export Fails
```bash
# Use verbose output for debugging
tsx scripts/punchClub/trainingPlanExport.ts export --verbose

# Check file permissions
ls -la ./data/exports/punchClub/

# Validate plan structure
tsx scripts/punchClub/trainingPlanExport.ts validate --file ./my-plan.json
```

#### Format Issues
```bash
# Check supported formats
tsx scripts/punchClub/trainingPlanExport.ts --help

# Verify format compatibility
tsx scripts/punchClub/trainingPlanExport.ts export --format json
tsx scripts/punchClub/trainingPlanExport.ts export --format markdown
tsx scripts/punchClub/trainingPlanExport.ts export --format csv
```

### Debug Mode
```bash
# Enable verbose logging
tsx scripts/punchClub/trainingPlanExport.ts export --verbose

# Show detailed plan information
tsx scripts/punchClub/trainingPlanExport.ts info --plan "my-plan" --detailed

# Validate and export in one step
tsx scripts/punchClub/trainingPlanExport.ts validate --file ./my-plan.json && \
  tsx scripts/punchClub/trainingPlanExport.ts export --plan "my-plan" --verbose
```

## Version Compatibility

### Supported Versions
- **Current Version**: 1.0.0
- **Supported Formats**: JSON, Markdown, CSV
- **Schema Version**: 1.0.0

### Version Migration
- **Automatic**: CLI handles version compatibility automatically
- **Validation**: Rejects unsupported versions with clear error messages
- **Backward Compatibility**: Plans from 1.0.0 are fully supported

### Future Compatibility
- **Version 2.0.0**: Planned support for additional fields
- **Breaking Changes**: Major version increments will include migration guides
- **Deprecation**: Deprecated features will be clearly marked

## Security Considerations

### Data Protection
- **Read-Only**: Export operations never modify original data
- **Local Storage**: All exports saved to local directories only
- **No Sensitive Data**: Only training plan data is exported
- **Config-First**: No hardcoded credentials or secrets

### File System Access
- **Authorized Directories**: Limited to `./data/exports/punchClub` by default
- **Permission Checks**: Validates file access before writing
- **Safe Paths**: Prevents directory traversal attacks
- **Extension Validation**: Ensures files have proper extensions

### Operation Safety
- **Dry Run Mode**: No destructive operations
- **Validation First**: Always validates before exporting
- **Error Handling**: Graceful failure recovery
- **Backup Protection**: Original files never modified

## Examples and Templates

### Basic Export Template
```bash
# Export all plans with full details
tsx scripts/punchClub/trainingPlanExport.ts export \
  --format json \
  --include-kpi \
  --include-sessions \
  --include-stats \
  --include-equipment \
  --include-notes \
  --output "training-plans-$(date +%Y-%m-%d).json"
```

### Filtered Export Template
```bash
# Export completed sessions from last month
tsx scripts/punchClub/trainingPlanExport.ts export \
  --date-range $(date -d '30 days' -I '%Y-%m-%d'),$(date -I '%Y-%m-%d') \
  --status completed \
  --sort date \
  --format markdown \
  --output "completed-sessions-$(date +%Y-%m-%d).md"
```

### Analysis Export Template
```bash
# Export for analysis with grouping
tsx scripts/punchClub/trainingPlanExport.ts export \
  --group exercise \
  --sort duration \
  --order desc \
  --format csv \
  --output "training-analysis-$(date +%Y-%m-%d).csv"
```

### Creation Template
```bash
# Create comprehensive training plan
tsx scripts/punchClub/trainingPlanExport.ts create \
  --name "Comprehensive Training" \
  --description "Complete training program covering all aspects" \
  --author "Professional Trainer" \
  --target-level 15 \
  --focus cardio,strength,technique,defense,speed \
  --output "comprehensive-training-$(date +%Y-%m-%d).json"
```

## Advanced Usage

### Custom Filtering
```bash
# Complex filtering example
tsx scripts/punchClub/trainingPlanExport.ts export \
  --date-range 2023-01-01,2023-03-31 \
  --status completed,skipped \
  --exercise cardio,strength \
  --sort duration \
  --order desc \
  --group exercise \
  --format markdown \
  --verbose
```

### Batch Processing
```bash
# Export multiple plans with different formats
for plan in "cardio-plan" "strength-plan" "technique-plan"; do
  tsx scripts/punchClub/trainingPlanExport.ts export \
    --plan "$plan" \
    --format json \
    --output "${plan}-$(date +%Y-%m-%d).json"
  tsx scripts/punchClub/trainingPlanExport.ts export \
    --plan "$plan" \
    --format markdown \
    --output "${plan}-$(date +%Y-%m-%d).md"
done
```

### Automation Integration
```bash
# Daily export script
#!/bin/bash
DATE=$(date +%Y-%m-%d)
OUTPUT_DIR="./exports/$DATE"

# Create directory
mkdir -p "$OUTPUT_DIR"

# Export all plans in multiple formats
tsx scripts/punchClub/trainingPlanExport.ts export \
  --format json \
  --output-dir "$OUTPUT_DIR"

tsx scripts/punchClub/trainingExport.ts export \
  --format markdown \
  --output-dir "$OUTPUT_DIR"

# Validate all exports
tsx scripts/punchClub/trainingPlanExport.ts validate \
  --directory "$OUTPUT_DIR"

# Generate summary report
tsx scripts/punchClub/trainingPlanExport.ts list \
  --format table > "$OUTPUT_DIR/summary.txt"

echo "Training plan export completed: $DATE"
```

## CLI Reference

### Global Options
- `-v, --verbose`: Enable verbose logging
- `--output-dir <dir>`: Output directory for exports (default: ./data/exports/punchClub)
- `--log-dir <dir>`: Guardian log directory (default: ./test-results/auto-commit-guardian)
- `--format <format>`: Output format: ascii, json, markdown (default: ascii)
- `--no-telemetry`: Disable telemetry emission

### Export Options
- `--plan <id>`: Training plan ID to export (exports all if not specified)
- `--format <format>`: Output format: json, markdown, csv (default: json)
- `--kpi`: Include KPI metrics (default: true)
- `--no-kpi`: Exclude KPI metrics
- `--sessions`: Include training sessions (default: true)
- `--no-sessions`: Exclude training sessions
- `--stats`: Include stats progression (default: true)
- `no-stats`: Exclude stats progression
- `--equipment`: Include equipment list (default: true)
- `--no-equipment`: Exclude equipment list
- `notes`: Include notes (default: true)
- `--no-notes`: Exclude notes
- `--date-range <range>`: Date range filter (format: YYYY-MM-DD,YYYY-MM-DD)
- `--status <status>`: Status filter (comma-separated: scheduled,in_progress,completed,skipped,failed)
- `--exercise <exercises>`: Exercise filter (comma-separated exercise IDs)
- `--sort <field>`: Sort by: date, duration, difficulty, status (default: date)
- `--order <order>`: Sort order: asc, desc (default: asc)
- `--group <field>`: Group by: none, week, month, exercise, difficulty (default: none)
- `--output <file>`: Output file name (auto-generated if not provided)

### List Options
- `--format <format>`: Output format: table, json (default: table)
- `--filter <filter>`: Filter by name or tag

### Info Options
- `--plan <id>`: Training plan ID (shows summary if not specified)
- `--detailed`: Show detailed information

### Validate Options
- `--file <path>`: Training plan file to validate
- `--directory <dir>`: Directory containing training plans (default: ./data/exports/punchClub)

### Create Options
- `--name <name>`: Training plan name (required)
- `--description <desc>`: Training plan description
- `--author <author>`: Author name (default: System)
- `--target-level <level>`: Target level (default: 10)
- `--focus <areas>`: Focus areas (comma-separated: cardio,strength,technique,defense,speed)
- `--output <file>`: Output file name (auto-generated if not provided)

## Help and Documentation

### Get Help
```bash
# Show main help
tsx scripts/punchClub/trainingPlanExport.ts --help

# Show export command help
tsx scripts/punchClub/trainingPlanExport.ts export --help

# Show create command help
tsx scripts/punchClub/trainingPlanExport.ts create --help
```

### Version Information
```bash
# Show CLI version
tsx scripts/punchClub/trainingPlanExport.ts --version
```

## File Structure

### CLI Script
```
scripts/punchClub/
├── trainingPlanExport.ts          # Main CLI script (600+ lines)
└── trainingPlanExport.ts.md          # This documentation
```

### Core Library
```
src/balancing/punchClub/
├── TrainingPlanSerializer.ts      # Core serializer (800+ lines)
├── combatConfig.ts               # Combat configuration
└── ...
```

### Tests
```
tests/unit/punchClub/
├── TrainingPlanExport.test.ts         # Unit tests (400+ lines)
└── ...
```

### Documentation
```
docs/cli/
└── punch_club_training_export.md      # This comprehensive guide
```

### Data Storage
```
data/exports/punchClub/
├── *.json                        # Exported training plans
├── *.md                         # Markdown exports
├── *.csv                         # CSV exports
```

## Development

### Running Tests
```bash
# Run unit tests
npm run test -- tests/unit/punchClub/TrainingPlanExport.test.ts

# Run with coverage
npm run test -- tests/unit/punchClub/TrainingPlanExport.test.ts --coverage

# Run all punch club tests
npm run test -- tests/unit/punchClub/
```

### Development Workflow
1. **Make Changes**: Modify serializer or CLI
2. **Run Tests**: Execute unit tests to verify functionality
3. **Test CLI**: Test CLI commands manually
4. **Validate**: Use validate command to check exports
5. **Documentation**: Update documentation as needed

### Building for Distribution
```bash
# Build project
npm run build

# Test CLI after build
tsx scripts/punchClub/trainingPlanExport.ts --version
```

## Contributing

### Code Style
- Follow TypeScript best practices
- Use JSDoc comments for all public methods
- Maintain consistent error handling patterns
- Use type-safe interfaces throughout

### Testing
- Add unit tests for new features
- Test edge cases and error conditions
- Mock external dependencies appropriately
- Maintain high test coverage

### Documentation
- Update this guide for new features
- Add examples for complex use cases
- Keep CLI help up to date
- Include troubleshooting sections

## Support

### Getting Help
- **CLI Help**: `tsx scripts/punchClub/trainingPlanExport.ts --help`
- **Version Info**: `tsx scripts/punchClub/trainingPlanExport.ts --version`
- **Validation**: `tsx scripts/punchClub/trainingPlanExport.ts validate --help`

### Reporting Issues
- **Bug Reports**: Include CLI output, error messages, and reproduction steps
- **Feature Requests**: Describe use case and expected behavior
- **Performance Issues**: Include plan size and system specifications

### Community
- **Discussions**: Use project issue tracker for discussions
- **Pull Requests**: Follow project contribution guidelines
- **Documentation**: Update docs as part of feature development

---

**Version**: 1.0.0  
**Author**: Vector-PC  
**Last Updated**: 2023-01-20  
**Compatibility**: Node.js 20+
