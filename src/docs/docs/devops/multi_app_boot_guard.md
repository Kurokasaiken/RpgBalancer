# Multi-App Dev Boot Guard & Auto-Recovery (NP-161)

## Overview

The Multi-App Boot Guard is a CLI orchestrator that automatically verifies critical application pages for runtime errors during development. It provides deterministic startup/shutdown of dev servers, runs Playwright smoke tests, applies config-first fixes, and logs structured evidence for telemetry.

## Target Applications

- **Idle Village Tools** (`/idle-village/tools`) – Village sandbox shell
- **Idle Village Sandbox** (`/idle-village/sandbox`) – Core sandbox interface  
- **STS CLI Simulator** (`/sts/cli`) – Text-based STS simulator
- **Punch Club PWA** (`/punch-club`) – Mobile-first PWA interface
- **Idle Village Map** (`/idle-village/map`) – Interactive map view

## Architecture

### Config-First Design

All page definitions, routes, error signatures, and retry policies live in `config/devBootGuardConfig.ts`. The CLI reads this configuration to drive orchestration without hardcoded values.

### Telemetry & Persistence

- **Telemetry Events**: `boot_guard_run`, `boot_guard_failure`, `boot_guard_recovery`
- **Persistence**: Async `PersistenceService` with key `multi_app_boot_guard_state`
- **Per-page State**: Tracks last status, run timestamp, retries, and errors

### Error Detection

The guard detects failures through:
- **DOM Text Scanning**: Looks for configured error signatures in page content
- **Console Errors**: Captures browser console error messages
- **Page Errors**: Handles uncaught JavaScript errors
- **Component Boundaries**: React ErrorBoundaries emit telemetry on failures

## Usage

### Quick Start

```bash
# Run full guard on all configured pages
npm run devops:boot-guard

# Run specific pages only
npm run devops:boot-guard -- --page idle-village-tools --page sts-cli

# Override retry count
npm run devops:boot-guard -- --max-retries 5

# Dry run (print actions without executing)
npm run devops:boot-guard -- --dry-run
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --page <id...>` | Limit to specific page IDs (comma-separated or repeat) | All pages |
| `-r, --max-retries <number>` | Override max retries per page | 3 |
| `--dry-run` | Print actions without executing Playwright | false |
| `--wait-for-server-ms <number>` | Dev server readiness timeout | 7000 |

### Configuration

Page definitions in `config/devBootGuardConfig.ts`:

```typescript
{
  id: 'sts-cli',
  label: 'STS CLI Simulator',
  route: '/sts/cli',
  successLocator: '[data-testid="sts-cli-shell"]',
  errorSignatures: ['STS CLI failed to load', 'STS Simulator Error'],
  requiredProcesses: [
    {
      name: 'sts-cli-backend',
      command: 'npm run sts:benchmark:quick',
    },
  ],
  maxRetries: 2,
}
```

## Integration Guide

### Adding Boot Guard Diagnostics to Components

1. **Import the hook**:
   ```typescript
   import { useBootGuardDiagnostics } from '@/ui/shared/bootGuard/useBootGuardDiagnostics';
   ```

2. **Use in component**:
   ```typescript
   const bootGuardDiagnostics = useBootGuardDiagnostics({
     pageId: 'my-page',
     source: 'MyComponent',
   });
   
   useEffect(() => {
     bootGuardDiagnostics.clearError();
   }, [bootGuardDiagnostics]);
   ```

3. **Wrap with ErrorBoundary**:
   ```jsx
   <ErrorBoundary
     fallbackRender={({ error }) => (
       <div data-testid="my-page-error">
         <p>Component failed to load.</p>
         <pre>{error.message}</pre>
       </div>
     )}
     onError={(error, info) => {
       bootGuardDiagnostics.captureError(error, info?.componentStack);
     }}
   >
     <YourComponent />
   </ErrorBoundary>
   ```

### Required Test IDs

For proper smoke test detection, ensure your components expose these test IDs:

- **Success Locator**: Element indicating successful boot (e.g., `[data-testid="app-shell"]`)
- **Error Fallback**: Element shown on errors (e.g., `[data-testid="app-error"]`)

## Artifacts & Logging

### Output Files

- **Structured Log**: `test-results/np-161-multi-app-boot-guard-latest.log`
- **Artifacts Directory**: `test-results/boot-guard-artifacts/`
- **Screenshots**: `{page-id}-{status}.png` on failures
- **Evidence Logs**: `{page-id}-{test-title}.log` with detailed failure info

### Log Format

```json
{
  "targetId": "sts-cli",
  "route": "/sts/cli",
  "successLocator": "[data-testid=\"sts-cli-shell\"]",
  "errorSignatures": ["STS CLI failed to load"],
  "timestamp": 1641234567890,
  "failures": ["Console errors: Cannot read property 'x' of undefined"]
}
```

## Development Workflow

### During Development

1. Make changes to target applications
2. Run boot guard to verify no regressions: `npm run devops:boot-guard`
3. Check artifacts if failures occur
4. Fix issues and re-run

### Before Commits

Run the full safeguard suite:
```bash
npm run lint
npm run build:check
npm run kanban:lint
npm run devops:boot-guard
```

## Troubleshooting

### Common Issues

**Dev Server Not Ready**
- Increase `--wait-for-server-ms` if startup is slow
- Check Vite output for readiness markers

**Flaky Tests**
- Increase `maxRetries` for specific pages in config
- Check for race conditions in component initialization

**Missing Test IDs**
- Verify `successLocator` exists in your component
- Ensure error fallbacks have proper test IDs

### Debug Mode

Enable verbose logging by setting `DEBUG=multi-app-boot-guard`:
```bash
DEBUG=multi-app-boot-guard npm run devops:boot-guard
```

## Implementation Details

### File Structure

```
├── config/devBootGuardConfig.ts          # Page definitions & schema
├── src/analytics/devBootGuard.ts         # Telemetry & persistence
├── src/ui/shared/bootGuard/
│   └── useBootGuardDiagnostics.ts        # React hook for components
├── scripts/devtools/multiAppBootGuard.ts # CLI orchestrator
├── tests/smoke/multiAppBootGuard.spec.ts # Playwright smoke tests
└── docs/devops/multi_app_boot_guard.md   # This documentation
```

### Process Management

The CLI ensures:
- **Single Dev Server**: Only one Vite instance running
- **Auxiliary Processes**: Starts/stops supporting processes per page
- **Graceful Shutdown**: SIGINT → SIGTERM escalation
- **Signal Handling**: Cleanup on Ctrl+C/interrupt

### Error Recovery

1. **Detection**: Console/page errors + DOM signature matching
2. **Telemetry**: Emit `boot_guard_failure` with full context
3. **Retry**: Up to configured max attempts
4. **Recovery**: Emit `boot_guard_recovery` on success
5. **Escalation**: Log final failure with artifacts

## Performance

### Benchmarks

| Operation | Typical Duration |
|-----------|------------------|
| Dev Server Startup | 3-7 seconds |
| Single Page Check | 2-5 seconds |
| Full Guard Run | 15-30 seconds |
| Screenshot Capture | < 1 second |

### Resource Usage

- **Memory**: ~50-100MB during execution
- **CPU**: Minimal during idle, spikes during Playwright
- **Disk**: ~10-50MB artifacts per run

## Security Considerations

- **No External Requests**: Guard runs entirely locally
- **Sandboxed Execution**: Playwright runs in isolated browser context
- **Config Validation**: Zod schemas prevent malformed configurations
- **Process Isolation**: Auxiliary processes run in separate child processes

## Maintenance

### Adding New Pages

1. Add page definition to `config/devBootGuardConfig.ts`
2. Ensure component has proper test IDs
3. Add boot guard diagnostics if needed
4. Update smoke test selectors if required

### Updating Dependencies

- Playwright versions should stay in sync with project
- Node.js 20+ required for structuredClone support
- TypeScript paths must resolve `@/ui/shared/bootGuard/*`

### Monitoring

Check `test-results/` directory for:
- Latest run logs
- Failure artifacts
- Performance trends over time

## Related Documentation

- [Playwright Testing Guide](../testing/playwright.md)
- [Error Boundary Patterns](../ui/error-boundaries.md)
- [Telemetry Events](../analytics/events.md)
- [Config-First Architecture](../architecture/config-first.md)
