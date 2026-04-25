# PWA Install Tracker QA Harness

## Overview

Config-first Playwright harness for testing PWA install tracker functionality in Punch Club. Simulates install prompt events, verifies telemetry emission, and measures acceptance rates against PC-M2E KPIs.

## Features

- **Config-First Design**: All scenarios defined in validated configuration
- **Event Simulation**: Simulates `beforeinstallprompt` and user actions
- **Telemetry Verification**: Captures and validates telemetry events
- **Screenshot Capture**: Automatic screenshots at key stages
- **Performance Tracking**: Measures prompt delay and action time
- **KPI Validation**: Verifies ≥90% install acceptance rate
- **Comprehensive Logging**: Detailed logs with timestamps

## Architecture

### Files

```
tests/
├── e2e/punchClub/
│   └── PWAInstallTrackerHarness.spec.ts    # Playwright test suite
└── utils/pwa/
    └── installTrackerHarness.ts            # Harness utilities

docs/punch_club/
└── pwa_install_tracker_harness.md          # This file

test-results/pwa-install-tracker/
├── harness-run-*.log                       # Test run logs
├── *-initial-*.png                         # Initial screenshots
├── *-prompt-*.png                          # Prompt screenshots
├── *-action-*.png                          # Action screenshots
└── *-complete-*.png                        # Completion screenshots
```

## Test Scenarios

### 1. Accept Immediate
- **Type**: accept
- **Action**: User accepts prompt immediately (100ms delay)
- **Expected**: `pwa_install_prompt_accepted` event
- **Outcome**: installed=true, userChoice="accepted"

### 2. Accept Delayed
- **Type**: accept
- **Action**: User accepts prompt after 2 seconds
- **Expected**: `pwa_install_prompt_accepted` event
- **Outcome**: installed=true, userChoice="accepted"

### 3. Dismiss Immediate
- **Type**: dismiss
- **Action**: User dismisses prompt immediately (100ms delay)
- **Expected**: `pwa_install_prompt_dismissed` event
- **Outcome**: installed=false, userChoice="dismissed"

### 4. Dismiss Delayed
- **Type**: dismiss
- **Action**: User dismisses prompt after 2 seconds
- **Expected**: `pwa_install_prompt_dismissed` event
- **Outcome**: installed=false, userChoice="dismissed"

### 5. Timeout
- **Type**: timeout
- **Action**: User ignores prompt for 5 seconds
- **Expected**: `pwa_install_prompt_timeout` event
- **Outcome**: installed=false, userChoice=null

## Configuration

### Harness Configuration Schema

```typescript
interface InstallTrackerHarnessConfig {
  scenarios: InstallScenario[];
  screenshots: {
    enabled: boolean;
    captureOnPrompt: boolean;
    captureOnAction: boolean;
    captureOnComplete: boolean;
    outputDir: string;
  };
  logging: {
    enabled: boolean;
    verbose: boolean;
    outputDir: string;
  };
  telemetry: {
    enabled: boolean;
    expectedEvents: string[];
    verifyPayload: boolean;
  };
  performance: {
    enabled: boolean;
    trackPromptDelay: boolean;
    trackActionTime: boolean;
  };
}
```

### Scenario Configuration Schema

```typescript
interface InstallScenario {
  id: string;
  type: 'accept' | 'dismiss' | 'timeout' | 'error';
  description: string;
  action: 'accept' | 'dismiss' | 'ignore' | 'error';
  actionDelay: number;
  expectedEvent: string;
  expectedOutcome: {
    installed: boolean;
    promptShown: boolean;
    userChoice: string | null;
  };
  timeout: number;
}
```

## Usage

### Running the Harness

```bash
# Run all harness tests
npm run test:e2e -- tests/e2e/punchClub/PWAInstallTrackerHarness.spec.ts

# Run with headed browser (for debugging)
npm run test:e2e -- tests/e2e/punchClub/PWAInstallTrackerHarness.spec.ts --headed

# Run specific scenario
npm run test:e2e -- tests/e2e/punchClub/PWAInstallTrackerHarness.spec.ts -g "accept-immediate"

# Run with verbose output
npm run test:e2e -- tests/e2e/punchClub/PWAInstallTrackerHarness.spec.ts --reporter=list
```

### Programmatic Usage

```typescript
import {
  createSafeHarnessConfig,
  simulateBeforeInstallPrompt,
  captureTelemetryEvents,
} from '@/tests/utils/pwa/installTrackerHarness';

// Create custom configuration
const config = createSafeHarnessConfig({
  scenarios: [
    {
      id: 'custom-accept',
      type: 'accept',
      description: 'Custom acceptance test',
      action: 'accept',
      actionDelay: 500,
      expectedEvent: 'pwa_install_prompt_accepted',
      expectedOutcome: {
        installed: true,
        promptShown: true,
        userChoice: 'accepted',
      },
      timeout: 5000,
    },
  ],
});

// Use in Playwright test
test('custom scenario', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await simulateBeforeInstallPrompt(page, config.scenarios[0]);
  const events = await captureTelemetryEvents(page);
  expect(events).toHaveLength(1);
});
```

## Telemetry Events

### Captured Events

1. **pwa_install_prompt_shown**
   - Emitted when install prompt is displayed
   - Payload: `{ timestamp, promptType }`

2. **pwa_install_prompt_accepted**
   - Emitted when user accepts install
   - Payload: `{ timestamp, userChoice: 'accepted' }`

3. **pwa_install_prompt_dismissed**
   - Emitted when user dismisses install
   - Payload: `{ timestamp, userChoice: 'dismissed' }`

4. **pwa_install_prompt_timeout**
   - Emitted when prompt times out
   - Payload: `{ timestamp, userChoice: null }`

5. **pwa_install_tracker_harness_run**
   - Emitted at end of harness run
   - Payload: `{ totalScenarios, passedScenarios, failedScenarios, acceptanceRate, averageDuration, timestamp }`

## Output

### Log File Format

```
[2026-01-24T10:00:00.000Z] [INFO] [HARNESS] Starting PWA Install Tracker QA Harness
[2026-01-24T10:00:00.100Z] [INFO] [accept-immediate] Starting scenario: User accepts install prompt immediately
[2026-01-24T10:00:00.200Z] [INFO] [accept-immediate] Telemetry capture initialized
[2026-01-24T10:00:00.300Z] [INFO] [accept-immediate] Screenshot captured: test-results/pwa-install-tracker/accept-immediate-initial-*.png
[2026-01-24T10:00:00.400Z] [INFO] [accept-immediate] Install prompt event simulated
[2026-01-24T10:00:00.500Z] [INFO] [accept-immediate] Prompt delay: 50ms
[2026-01-24T10:00:00.600Z] [INFO] [accept-immediate] User accepted install prompt
[2026-01-24T10:00:00.700Z] [INFO] [accept-immediate] Captured 1 telemetry events
[2026-01-24T10:00:00.800Z] [INFO] [accept-immediate] Telemetry payload verified successfully
[2026-01-24T10:00:00.900Z] [INFO] [accept-immediate] Scenario PASSED

================================================================================
PWA Install Tracker QA Harness - Run Summary
================================================================================

Timestamp: 2026-01-24T10:00:01.000Z
Total Scenarios: 5
Passed: 5
Failed: 0
Success Rate: 100.0%
Acceptance Rate: 100.0%
Average Duration: 1234ms

Scenario Results:
--------------------------------------------------------------------------------
  ✓ accept-immediate
    Duration: 1200ms
    Telemetry Events: 1
    Screenshots: 4
    Errors: 0

  ✓ accept-delayed
    Duration: 2100ms
    Telemetry Events: 1
    Screenshots: 4
    Errors: 0

  ✓ dismiss-immediate
    Duration: 1150ms
    Telemetry Events: 1
    Screenshots: 4
    Errors: 0

  ✓ dismiss-delayed
    Duration: 2050ms
    Telemetry Events: 1
    Screenshots: 4
    Errors: 0

  ✓ timeout
    Duration: 5670ms
    Telemetry Events: 1
    Screenshots: 4
    Errors: 0

================================================================================
```

### Screenshot Naming Convention

```
{scenarioId}-{stage}-{timestamp}.png

Examples:
- accept-immediate-initial-2026-01-24T10-00-00-000Z.png
- accept-immediate-prompt-2026-01-24T10-00-00-100Z.png
- accept-immediate-action-2026-01-24T10-00-00-200Z.png
- accept-immediate-complete-2026-01-24T10-00-00-300Z.png
```

## KPI Validation

### PC-M2E Requirements

- **Acceptance Rate**: ≥90%
- **Prompt Display Time**: <500ms
- **Action Response Time**: <100ms
- **Scenario Completion**: <10s per scenario

### Verification Tests

The harness includes automated verification tests:

1. **Acceptance Rate Threshold**
   - Verifies measured acceptance rate ≥90%
   - Calculated from accept scenarios only

2. **Telemetry Event Coverage**
   - Verifies all expected events were captured
   - Checks event payload structure

3. **Performance Benchmarks**
   - Verifies average scenario duration <10s
   - Tracks prompt delay and action time

4. **Screenshot Capture**
   - Verifies at least one screenshot per scenario
   - Ensures visual regression capability

## Troubleshooting

### Common Issues

#### 1. Telemetry Events Not Captured

**Symptom**: `result.telemetryEvents` is empty

**Solution**:
- Ensure `setupTelemetryCapture()` is called before simulating events
- Check that console.log is not mocked or overridden
- Verify `window.__TEST_TELEMETRY_EVENTS__` is accessible

#### 2. Screenshots Not Saved

**Symptom**: Screenshot files not found in output directory

**Solution**:
- Ensure output directory exists (created automatically)
- Check file permissions
- Verify `config.screenshots.enabled` is true

#### 3. Scenario Timeout

**Symptom**: Test times out before completion

**Solution**:
- Increase `scenario.timeout` value
- Check for network delays (should not use real network)
- Verify page navigation completes successfully

#### 4. Acceptance Rate Below Threshold

**Symptom**: Acceptance rate <90%

**Solution**:
- Review failed accept scenarios in logs
- Check telemetry event payloads for errors
- Verify `userChoice` values in outcomes

## CI/CD Integration

### GitHub Actions Example

```yaml
name: PWA Install Tracker QA

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  harness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Start dev server
        run: npm run dev &
        
      - name: Wait for server
        run: npx wait-on http://localhost:5173
      
      - name: Run PWA Install Tracker Harness
        run: npm run test:e2e -- tests/e2e/punchClub/PWAInstallTrackerHarness.spec.ts
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: pwa-install-tracker-results
          path: test-results/pwa-install-tracker/
      
      - name: Check acceptance rate
        run: |
          RATE=$(grep "Acceptance Rate:" test-results/pwa-install-tracker/harness-run-*.log | awk '{print $3}' | sed 's/%//')
          if (( $(echo "$RATE < 90" | bc -l) )); then
            echo "Acceptance rate $RATE% is below threshold (90%)"
            exit 1
          fi
```

## Best Practices

1. **Run Before Releases**: Always run harness before PWA releases
2. **Monitor Acceptance Rate**: Track acceptance rate trends over time
3. **Review Screenshots**: Manually inspect screenshots for UI issues
4. **Analyze Logs**: Review logs for patterns in failures
5. **Update Scenarios**: Add new scenarios as features evolve
6. **Verify Telemetry**: Ensure all events are captured correctly
7. **Performance Testing**: Monitor scenario duration trends

## Related Documentation

- [PC-M2E Plan](../plans/punch_club_m2e_plan.md)
- [PWA Install Tracker](./pwa_install_tracker.md)
- [Telemetry System](../telemetry/punch_club_telemetry.md)
- [Playwright Testing Guide](../testing/playwright_guide.md)

## Version History

- **v1.0.0** (2026-01-24): Initial implementation
  - Config-first harness architecture
  - 5 default test scenarios
  - Screenshot and logging support
  - Telemetry verification
  - KPI validation
  - CI/CD integration ready
