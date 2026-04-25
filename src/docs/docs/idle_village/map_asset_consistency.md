# Map Asset Consistency CLI

## Overview
CLI tool that verifies consistency between Phase E map metadata (JSON) and UI components (WorkerCard/LocationCard), reporting missing assets.

## Usage
```bash
npm run map-asset-consistency [options]
```

## Options
- `--auto-open-report` - Automatically open the generated report
- `--output <path>` - Custom output path for the report
- `--severity <level>` - Minimum severity level to report (error|warning|info)

## Output
Generates a Markdown report with:
- Missing assets
- Component export validation
- Severity scoring
- Asset registry status

## Integration
- Telemetry: `map_asset_consistency_run` events
- Persistence: Results saved via PersistenceService
- CI/CD: Can be integrated in build pipelines

## TODO
- Implement asset registry configuration
- Add severity scoring algorithm
- Create comprehensive test suite
