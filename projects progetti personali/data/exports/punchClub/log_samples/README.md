# Punch Club Log Samples

This directory contains sample log files for testing the Punch Club Log Ingest CLI.

## Sample Files

### basic-session.json
A basic session with combat, leveling, and tag events.

### mobile-session.json
Mobile-specific session with touch events and PWA telemetry.

### error-session.json
Session with various error conditions for testing validation.

### large-session.json
Large dataset for performance testing (10,000+ entries).

## Log Format

All samples follow the JSON line-delimited format:

```json
{"timestamp": 1641894400000, "eventType": "combat_completed", "sessionId": "session-123", "payload": {"won": true, "damageDealt": 45, "damageTaken": 12}, "source": "game"}
```

## Usage

```bash
# Test with basic session
./scripts/cli/logIngestCLI.ts ingest -i basic-session.json

# Validate error session
./scripts/cli/logIngestCLI.ts validate -i error-session.json --verbose

# Performance test with large dataset
./scripts/cli/logIngestCLI.ts ingest -i large-session.json --progress

# Generate KPIs for mobile session
./scripts/cli/logIngestCLI.ts kpi -i mobile-session.json
```

## Event Types

Samples include these Punch Club event types:

- `session_started` - Session initialization
- `combat_completed` - Combat results
- `level_up` - Level progression
- `experience_gained` - Experience rewards
- `money_gained` - Currency rewards
- `training_completed` - Training sessions
- `stat_points_allocated` - Stat point allocation
- `tag_added` - Session tags
- `session_ended` - Session completion
- `pwa_install_prompt_shown` - PWA install events
- `pwa_install_success` - PWA installation success

## Data Privacy

All sample data is synthetic and contains no real user information. Session IDs, timestamps, and gameplay data are randomly generated for testing purposes.

## Adding New Samples

When adding new sample files:

1. Follow the JSON line-delimited format
2. Include realistic session flows
3. Add error conditions for validation testing
4. Update this README with descriptions
5. Test with the CLI before committing

## Performance Benchmarks

- `basic-session.json`: ~50 entries, <100ms processing
- `mobile-session.json`: ~100 entries, <200ms processing  
- `error-session.json`: ~25 entries, <50ms processing
- `large-session.json`: ~10,000 entries, <2s processing
