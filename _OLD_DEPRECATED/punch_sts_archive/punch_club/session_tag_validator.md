# Session Tag Validator Documentation

## Overview

The Session Tag Validator is a comprehensive CLI tool for validating Punch Club session tagging data against PC-M3 requirements. It provides config-first validation for consent flow and telemetry sessions with detailed reporting and analytics capabilities.

## Features

- **Config-First Validation**: Customizable validation rules and thresholds
- **Comprehensive Schema Validation**: Zod-based schema validation with detailed error reporting
- **Multiple Export Formats**: JSON, Markdown, and CSV output options
- **Performance Metrics**: Processing speed and memory usage tracking
- **Telemetry Integration**: Automatic event emission for analytics
- **CLI Interface**: Full-featured command-line tool with multiple commands
- **Sample Data Generation**: Built-in sample data generator for testing

## Architecture

### Core Components

#### SessionTagRules
Main validation engine that implements all business rules and validation logic with configurable thresholds.

#### SessionTagValidator CLI
Command-line interface that orchestrates the validation process and generates reports.

#### Validation Schema
Comprehensive Zod schema defining the structure and constraints of session tags.

### Validation Categories

- **Schema Validation**: Basic structure and type validation
- **Required Fields**: Ensures all mandatory fields are present
- **Timestamp Validation**: Validates datetime formats and logical consistency
- **Consent Validation**: Ensures consent requirements are met
- **Performance Validation**: Checks performance metrics against thresholds
- **Enum Validation**: Validates all enum values against allowed lists
- **Business Rules**: Custom business logic validation

## Usage Examples

### Basic Validation
```bash
# Validate session tag dataset
npm run session-tag-validator validate --input session-tags.json

# Specify custom output directory
npm run session-tag-validator validate --input data.json --output ./reports

# Export to Markdown format
npm run session-tag-validator validate --input data.json --format markdown
```

### Advanced Validation
```bash
# Use custom configuration
npm run session-tag-validator validate --input data.json --config custom-config.json

# Enable strict validation mode
npm run session-tag-validator validate --input data.json --strict

# Filter by minimum severity
npm run session-tag-validator validate --input data.json --severity high

# Emit telemetry events
npm run session-tag-validator validate --input data.json --telemetry
```

### Utility Commands
```bash
# Display session tag schema
npm run session-tag-validator schema --format typescript

# Show current configuration
npm run session-tag-validator config --config custom-config.json

# Generate sample data
npm run session-tag-validator sample --count 50 --output test-data.json
```

## Session Tag Schema

### Core Fields
```typescript
interface SessionTag {
  // Identification
  session_id: string;           // Required: Unique session identifier
  tag_name: string;              // Required: Human-readable tag name
  category: SessionTagCategory;  // Required: Category (consent|install|telemetry|user_flow|performance|error)
  
  // Timestamps
  created_at: string;            // Required: ISO datetime when tag was created
  updated_at: string;            // Required: ISO datetime when tag was last updated
  session_start: string;         // Required: ISO datetime when session started
  session_end?: string;          // Optional: ISO datetime when session ended
  
  // User Context
  user_id: string;               // Required: Unique user identifier
  device_type: DeviceType;       // Required: Device type (mobile|desktop|tablet|unknown)
  app_version: string;           // Required: Application version
  os_version?: string;           // Optional: Operating system version
  
  // Consent Information
  consent_status: ConsentStatus; // Required: Consent status (granted|denied|pending|expired)
  consent_flow_version?: string;  // Optional: Consent flow version
  install_source?: string;       // Optional: Install source (app_store|direct|etc.)
  
  // Event Information
  event_type: string;            // Required: Type of event
  event_count: number;           // Optional: Number of events (>=0, default 1)
  event_sequence: number;        // Optional: Event sequence number (>=1, default 1)
  
  // Classification
  severity: SessionTagSeverity;  // Optional: Severity level (low|medium|high|critical, default low)
  status: SessionTagStatus;      // Optional: Tag status (active|inactive|pending|archived, default active)
  
  // Metadata
  metadata?: Record<string, unknown>; // Optional: Additional metadata
  tags?: string[];               // Optional: Tag labels
  
  // Analytics
  duration_ms?: number;          // Optional: Session duration in milliseconds
  error_count: number;           // Optional: Number of errors (>=0, default 0)
  performance_score?: number;    // Optional: Performance score (0-100)
}
```

### Enums
```typescript
enum SessionTagCategory {
  CONSENT = 'consent',
  INSTALL = 'install',
  TELEMETRY = 'telemetry',
  USER_FLOW = 'user_flow',
  PERFORMANCE = 'performance',
  ERROR = 'error',
}

enum SessionTagSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

enum SessionTagStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ARCHIVED = 'archived',
}

enum DeviceType {
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
  TABLET = 'tablet',
  UNKNOWN = 'unknown',
}

enum ConsentStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  PENDING = 'pending',
  EXPIRED = 'expired',
}
```

## Configuration

### Default Configuration
```json
{
  "required_fields": [
    "session_id",
    "timestamp",
    "user_id",
    "event_type",
    "device_type",
    "app_version"
  ],
  "allowed_categories": [
    "consent",
    "install",
    "telemetry",
    "user_flow",
    "performance",
    "error"
  ],
  "max_session_duration_hours": 24,
  "max_event_count": 10000,
  "require_consent_for_tracking": true,
  "validate_timestamps": true,
  "validate_user_flow": true,
  "performance_thresholds": {
    "max_session_duration_ms": 3600000,
    "max_error_rate": 0.1,
    "min_performance_score": 50
  },
  "enum_validation": {
    "device_types": ["mobile", "desktop", "tablet", "unknown"],
    "consent_statuses": ["granted", "denied", "pending", "expired"],
    "event_types": [
      "session_start",
      "session_end",
      "consent_request",
      "consent_granted",
      "consent_denied",
      "install_start",
      "install_complete",
      "page_view",
      "user_action",
      "error",
      "performance_metric"
    ],
    "categories": ["consent", "install", "telemetry", "user_flow", "performance", "error"]
  }
}
```

### Custom Configuration
Create a custom configuration file and reference it:

```bash
npm run session-tag-validator validate --config custom-config.json
```

Example custom configuration:
```json
{
  "required_fields": ["session_id", "user_id", "event_type"],
  "max_session_duration_hours": 12,
  "require_consent_for_tracking": false,
  "performance_thresholds": {
    "max_session_duration_ms": 1800000,
    "max_error_rate": 0.05,
    "min_performance_score": 70
  }
}
```

## Validation Rules

### Required Fields Validation
Ensures all mandatory fields are present and non-empty:

- **session_id**: Unique identifier for the session
- **timestamp**: Creation timestamp in ISO format
- **user_id**: Unique user identifier
- **event_type**: Type of event that occurred
- **device_type**: Type of device used
- **app_version**: Application version

### Timestamp Validation
Validates timestamp formats and logical consistency:

- **Future Timestamps**: Rejects timestamps in the future
- **Session Order**: Ensures session_start ≤ created_at
- **Session Duration**: Ensures session_end ≥ session_start if present

### Consent Validation
Ensures consent requirements are met:

- **Tracking Without Consent**: Warns when tracking events occur without consent
- **Pending Consent**: Warns when tracking occurs with pending consent
- **Consent Flow**: Validates consent status transitions

### Performance Validation
Checks performance metrics against thresholds:

- **Session Duration**: Warns about unusually long sessions
- **Error Rate**: Errors when error rate exceeds threshold
- **Performance Score**: Warns about low performance scores

### Enum Validation
Validates all enum values against allowed lists:

- **Device Types**: mobile, desktop, tablet, unknown
- **Consent Status**: granted, denied, pending, expired
- **Event Types**: Predefined list of event types
- **Categories**: Allowed session tag categories

## Report Formats

### JSON Report
Structured data format suitable for programmatic consumption:

```json
{
  "timestamp": "2026-01-22T10:30:00.000Z",
  "dataset_path": "session-tags.json",
  "total_sessions": 1000,
  "validation_result": {
    "valid": true,
    "errors": [],
    "warnings": [
      {
        "field": "tags[45].duration_ms",
        "message": "Session duration exceeds threshold",
        "code": "LONG_SESSION",
        "recommendation": "Consider session timeout or segmentation"
      }
    ],
    "summary": {
      "totalTags": 1000,
      "validTags": 995,
      "invalidTags": 5,
      "warningCount": 12,
      "errorCount": 5,
      "criticalErrors": 0
    }
  },
  "config_summary": {...},
  "performance_metrics": {...},
  "recommendations": [...]
}
```

### Markdown Report
Human-readable format with sections and formatting:

```markdown
# Session Tag Validation Report

**Generated:** January 22, 2026, 10:30 AM
**Dataset:** session-tags.json
**Total Sessions:** 1000
**Validation Time:** 1250ms

## Summary
- **✅ Valid:** 995
- **❌ Invalid:** 5
- **🔴 Errors:** 5
- **🟡 Warnings:** 12
- **📊 Success Rate:** 99.5%

## Performance Metrics
- **Processing Speed:** 800 sessions/sec
- **Memory Usage:** 45.2 MB
- **File Size:** 2.1 MB

## Validation Configuration
- **Required Fields:** session_id, timestamp, user_id, event_type, device_type, app_version
- **Allowed Categories:** consent, install, telemetry, user_flow, performance, error
- **Max Session Duration:** 24 hours
- **Max Event Count:** 10000
- **Consent Required:** Yes

## Errors
### session_id
🔴 **MISSING_REQUIRED_FIELD:** Session ID is required

## Warnings
### duration_ms
⚠️ **LONG_SESSION:** Session duration exceeds threshold
💡 **Recommendation:** Consider session timeout or segmentation

## Recommendations
- Fix critical errors before processing session data
- Review warnings for data quality improvements
- Update event type whitelist
```

### CSV Report
Tabular format suitable for spreadsheet analysis:

```csv
Session Tag Validation Report
Generated,2026-01-22T10:30:00.000Z
Dataset,session-tags.json
Total Sessions,1000
Validation Time,1250

Summary
Metric,Count
Valid,995
Invalid,5
Errors,5
Warnings,12
Success Rate,99.5%

Performance Metrics
Metric,Value
Processing Speed,800 sessions/sec
Memory Usage,45.2 MB
File Size,2.1 KB

Errors
Field,Code,Message,Severity
session_id,MISSING_REQUIRED_FIELD,"Session ID is required",critical

Warnings
Field,Code,Message,Recommendation
duration_ms,LONG_SESSION,"Session duration exceeds threshold","Consider session timeout"
```

## Error Codes

### Schema Errors
- **SCHEMA_ERROR**: Basic schema validation failed
- **MISSING_REQUIRED_FIELD**: Required field is missing or empty
- **INVALID_ENUM**: Value not in allowed enum list

### Timestamp Errors
- **FUTURE_TIMESTAMP**: Timestamp is in the future
- **INVALID_DURATION**: Session end before session start
- **TIMESTAMP_ORDER**: Timestamp ordering issues

### Business Rule Errors
- **CONSENT_VIOLATION**: Tracking without proper consent
- **HIGH_ERROR_RATE**: Error rate exceeds threshold
- **SESSION_TOO_LONG**: Session duration exceeds maximum
- **LOW_PERFORMANCE**: Performance score below threshold

### Warning Codes
- **LONG_SESSION**: Session duration unusually long
- **LOW_PERFORMANCE**: Performance score could be improved
- **CONSENT_PENDING**: Consent status is pending
- **UNKNOWN_EVENT_TYPE**: Event type not in whitelist

## Performance Characteristics

### Processing Speed
- **Small datasets** (<100 sessions): <100ms
- **Medium datasets** (100-1000 sessions): 100-500ms
- **Large datasets** (1000-10000 sessions): 500-2000ms
- **Very large datasets** (>10000 sessions): 2-10 seconds

### Memory Usage
- **Base memory**: ~20MB
- **Per session**: ~10KB additional memory
- **Large dataset support**: Tested up to 50000 sessions

### File Size Limits
- **JSON parsing**: Up to 100MB files
- **Memory constraints**: Dependent on available system memory
- **Recommended**: Keep files under 50MB for optimal performance

## Integration Points

### PC-M3 Compliance
The validator ensures compliance with PC-M3 requirements:

- **Consent Flow**: Validates consent status and flow version
- **Telemetry Structure**: Ensures proper telemetry event structure
- **Session Tracking**: Validates session lifecycle events
- **Device Classification**: Ensures proper device type classification

### Analytics Integration
- **Telemetry Events**: Emits `pc_session_tag_validator_run` events
- **Performance Metrics**: Tracks processing performance
- **Error Tracking**: Monitors validation error rates
- **Data Quality**: Provides data quality metrics

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Validate Session Tags
  run: |
    npm run session-tag-validator validate \
      --input data/session-tags.json \
      --severity critical \
      --telemetry
    
    # Fail if critical errors found
    if [ $? -ne 0 ]; then
      echo "Critical validation errors detected"
      exit 1
    fi
```

## Troubleshooting

### Common Issues

#### No Sessions Validated
If all sessions fail validation:
1. Check JSON file format and structure
2. Verify required fields are present
3. Check for syntax errors in JSON

#### High Error Rate
If error rate is unexpectedly high:
1. Review configuration requirements
2. Check enum value lists
3. Verify timestamp formats
4. Validate consent flow implementation

#### Performance Issues
If validation is slow:
1. Reduce dataset size for testing
2. Check available system memory
3. Consider splitting large files
4. Disable optional validations

#### Export Errors
If export fails:
1. Verify output directory exists and is writable
2. Check file permissions
3. Ensure sufficient disk space
4. Validate output format selection

### Error Messages

#### "Dataset must be an array"
The input JSON file must contain an array of session tags, not a single object.

#### "Failed to load dataset"
Check file path, file permissions, and JSON syntax.

#### "Could not load config"
Verify configuration file path and JSON syntax.

## Best Practices

### Data Preparation
1. **Consistent Timestamps**: Use ISO datetime format consistently
2. **Proper Enum Values**: Use values from predefined enums
3. **Complete Metadata**: Include all relevant metadata fields
4. **Event Sequencing**: Maintain proper event sequence numbers

### Validation Workflow
1. **Start with Default Config**: Use default configuration initially
2. **Review Warnings**: Address warnings before errors
3. **Custom Configuration**: Adjust thresholds based on requirements
4. **Regular Validation**: Validate data regularly to catch issues early

### Configuration Management
1. **Version Control**: Track configuration changes
2. **Environment Specific**: Use different configs for different environments
3. **Documentation**: Document custom configuration choices
4. **Testing**: Test configuration changes with sample data

## API Reference

### SessionTagRules Class

#### Constructor
```typescript
new SessionTagRules(config?: SessionTagValidationConfig)
```

#### Methods

##### validateTag(tag: unknown): ValidationResult
Validates a single session tag against all rules.

##### validateTags(tags: unknown[]): ValidationResult
Validates multiple session tags and aggregates results.

##### getConfig(): SessionTagValidationConfig
Returns current validation configuration.

##### updateConfig(config: Partial<SessionTagValidationConfig>): void
Updates validation configuration with partial changes.

### CLI Commands

#### validate
Validate session tag dataset and generate reports.

**Options:**
- `--input <path>`: Input JSON dataset file (required)
- `--output <path>`: Output directory (default: test-results)
- `--format <format>`: Output format (json|markdown|csv)
- `--config <path>`: Configuration file path
- `--severity <level>`: Minimum severity (low|medium|high|critical)
- `--telemetry`: Emit telemetry events
- `--strict`: Enable strict validation mode

#### schema
Display session tag schema in specified format.

**Options:**
- `--format <format>`: Output format (json|typescript)

#### config
Display current configuration.

**Options:**
- `--config <path>`: Configuration file path
- `--strict`: Enable strict validation mode

#### sample
Generate sample session tag data.

**Options:**
- `--output <path>`: Output file path
- `--count <number>`: Number of sample records

## Version History

### v1.0.0 (2026-01-22)
- Initial release with core validation functionality
- CLI tool with multiple export formats
- Comprehensive schema validation
- Performance metrics and telemetry integration
- Sample data generation
- Complete documentation

## Future Enhancements

### Planned Features
- **Real-time Validation**: Continuous validation of streaming data
- **Custom Rules Engine**: User-defined validation rules
- **Data Profiling**: Advanced data quality analysis
- **Integration APIs**: REST API for programmatic access
- **Web Dashboard**: Visual interface for validation management
- **Historical Analysis**: Track validation trends over time

### API Stability
- Core validation algorithms: Stable
- CLI interface: Stable
- Configuration format: Stable
- Report formats: Stable

## Support

For issues and questions:
1. Check this documentation
2. Review test cases for usage examples
3. Consult the main Punch Club documentation
4. Check existing GitHub issues

## License

Part of the RPG Balancer project. See project license for details.
