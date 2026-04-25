# Service Worker Rollback System

## Overview
Config-first system for managing service worker version tracking and rollback with safety checks and telemetry integration.

## Features
- **Version Tracking**: Complete history of SW deployments
- **Automatic Rollback**: Error threshold-based rollback (optional)
- **Safety Checks**: Multi-level validation before rollback
- **User Consent**: Configurable consent requirement
- **Rollback History**: Complete audit trail
- **Telemetry Integration**: `pc_sw_rollback_triggered` events
- **CLI Manager**: Interactive command-line tool

## Usage

### Programmatic API

```typescript
import { SWRollbackSystem } from '@/analytics/punchClub/swRollbackSystem';

const system = new SWRollbackSystem({
  enableAutoRollback: false,
  errorThreshold: 10,
  requireUserConsent: true,
  maxRollbackAttempts: 3,
});

// Register new version
system.registerVersion({
  version: '1.2.3',
  deployedAt: Date.now(),
  buildHash: 'abc123def456',
  isStable: false,
});

// Record errors
system.recordError('fetch_failed', 'Network timeout');

// Check safety
const checks = system.performSafetyChecks('1.2.2');

// Initiate rollback
await system.initiateRollback(
  {
    trigger: 'manual',
    errorMessage: 'Critical bug detected',
    timestamp: Date.now(),
    errorCount: 0,
  },
  true // user consent
);
```

### CLI Manager

```bash
# Show current status
npm run sw:rollback -- --action status

# Register new version
npm run sw:rollback -- --action register --version "1.2.3"

# Initiate rollback
npm run sw:rollback -- --action rollback --trigger manual --message "Critical bug"

# View rollback history
npm run sw:rollback -- --action history

# Clear version history
npm run sw:rollback -- --action clear --force
```

## Configuration

### RollbackConfig

```typescript
{
  enableAutoRollback: boolean;      // Default: false
  errorThreshold: number;           // Default: 10
  errorWindowMs: number;            // Default: 300000 (5 min)
  requireUserConsent: boolean;      // Default: true
  maxRollbackAttempts: number;      // Default: 3
  versionHistoryLimit: number;      // Default: 10
  storageKey: string;               // Default: 'pc_sw_version_history'
}
```

## Version Schema

### SWVersion

```typescript
{
  version: string;           // Version identifier (e.g., "1.2.3")
  deployedAt: number;        // Deployment timestamp
  buildHash: string;         // Build hash for verification
  isStable: boolean;         // Stability flag
  rollbackCount: number;     // Number of rollbacks to this version
}
```

### Stability Marking

Mark versions as stable after verification period:

```typescript
system.registerVersion({
  version: '1.2.3',
  deployedAt: Date.now(),
  buildHash: 'abc123',
  isStable: true, // Mark as stable
});
```

## Failure Triggers

### Trigger Types

1. **update_failed**: Service worker update failed
2. **activation_failed**: Service worker activation failed
3. **fetch_failed**: Fetch operation failed
4. **cache_failed**: Cache operation failed
5. **manual**: Manual rollback initiated
6. **error_threshold**: Error threshold exceeded

### Error Recording

```typescript
// Record single error
system.recordError('fetch_failed', 'Network timeout');

// Automatic rollback when threshold exceeded
// (if enableAutoRollback: true and requireUserConsent: false)
```

## Safety Checks

### Check Types

1. **version_exists**: Target version exists in history
2. **rollback_limit**: Rollback attempt limit not exceeded
3. **rollback_frequency**: Not too many recent rollbacks

### Severity Levels

- **low**: Informational
- **medium**: Warning
- **high**: Significant issue
- **critical**: Blocking issue

### Example

```typescript
const checks = system.performSafetyChecks('1.2.2');

checks.forEach(check => {
  console.log(`${check.checkName}: ${check.passed ? 'PASS' : 'FAIL'}`);
  if (!check.passed) {
    console.log(`  Severity: ${check.severity}`);
    console.log(`  Reason: ${check.reason}`);
  }
});
```

## Rollback Process

### Standard Rollback

1. **Initiate**: Call `initiateRollback()` with reason
2. **Safety Checks**: System performs validation
3. **User Consent**: Prompt user if required
4. **Execute**: Unregister current SW, register target SW
5. **Record**: Add entry to rollback history
6. **Telemetry**: Emit `pc_sw_rollback_triggered` event

### Automatic Rollback

Requires configuration:
```typescript
{
  enableAutoRollback: true,
  errorThreshold: 10,
  errorWindowMs: 300000,
  requireUserConsent: false,
}
```

When error count exceeds threshold within time window, automatic rollback triggers.

## Emergency Rollback Procedure

### Scenario: Critical Production Bug

**Step 1: Assess Situation**
```bash
npm run sw:rollback -- --action status
```

Review current version and available stable versions.

**Step 2: Check Safety**
```bash
npm run sw:rollback -- --action history
```

Review recent rollback history for patterns.

**Step 3: Initiate Rollback**
```bash
npm run sw:rollback -- --action rollback \
  --trigger manual \
  --message "Critical bug: [description]"
```

System will prompt for confirmation.

**Step 4: Verify Rollback**
```bash
npm run sw:rollback -- --action status
```

Confirm new version is active.

**Step 5: Monitor**
- Check service worker registration in DevTools
- Monitor error rates
- Verify functionality

### Scenario: Automatic Rollback Failed

**Step 1: Check Logs**
```bash
npm run sw:rollback -- --action history
```

Review failed rollback entry.

**Step 2: Force Rollback**
```bash
npm run sw:rollback -- --action rollback \
  --trigger manual \
  --message "Manual override after auto-rollback failure" \
  --force
```

**Step 3: Clear Service Worker Cache**
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});

caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});
```

**Step 4: Hard Refresh**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

### Scenario: No Stable Version Available

**Step 1: Register Emergency Version**
```bash
npm run sw:rollback -- --action register \
  --version "emergency-1.0.0"
```

**Step 2: Deploy Emergency SW**
Deploy minimal service worker with basic functionality.

**Step 3: Mark as Stable**
Update version in system to mark as stable.

## Telemetry

**Event**: `pc_sw_rollback_triggered`

**Payload**:
```typescript
{
  timestamp: number;
  fromVersion: string;
  toVersion: string;
  trigger: FailureTrigger;
  errorCount: number;
  userConsent: boolean;
  success: boolean;
  safetyChecks: Array<{
    checkName: string;
    passed: boolean;
    severity: string;
  }>;
}
```

## Best Practices

### Version Management

1. **Semantic Versioning**: Use semver (1.2.3)
2. **Build Hashes**: Include git commit hash
3. **Stability Period**: Wait 24-48h before marking stable
4. **Version Limit**: Keep 10 most recent versions

### Rollback Strategy

1. **Always to Stable**: Only rollback to stable versions
2. **User Consent**: Require consent for production
3. **Safety Checks**: Never bypass critical checks
4. **Documentation**: Document all manual rollbacks

### Error Handling

1. **Threshold Tuning**: Adjust based on traffic
2. **Time Window**: 5 minutes for error aggregation
3. **Error Types**: Track different failure types
4. **Monitoring**: Set up alerts for error spikes

### Testing

1. **Staging Environment**: Test rollback in staging
2. **Rollback Drills**: Practice emergency procedures
3. **Automated Tests**: Test rollback system regularly
4. **User Impact**: Minimize disruption during rollback

## Integration with NP-110

The rollback system integrates with NP-110 SW Update Simulator:

```typescript
// Simulate update failure
simulator.simulateUpdateFailure();

// Record error in rollback system
system.recordError('update_failed', 'Simulated failure');

// Check if auto-rollback triggered
const history = system.getRollbackHistory();
```

## CLI Reference

### Actions

**status**: Show current SW status and version history

**register**: Register new SW version
- Required: `--version`
- Optional: Build hash auto-generated

**rollback**: Initiate rollback
- Required: `--trigger`
- Optional: `--message`, `--force`

**history**: View rollback history
- Shows last 10 rollback entries

**clear**: Clear version history
- Required: `--force`

### Options

- `--action, -a`: Action to perform
- `--version, -v`: Version identifier
- `--trigger, -t`: Failure trigger type
- `--message, -m`: Error message
- `--force, -f`: Force operation without prompts
- `--config, -c`: Path to config file
- `--help, -h`: Show help message

## Troubleshooting

### Rollback Not Working

**Check 1**: Service worker support
```javascript
if ('serviceWorker' in navigator) {
  console.log('SW supported');
} else {
  console.error('SW not supported');
}
```

**Check 2**: Registration status
```javascript
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Registration:', reg);
});
```

**Check 3**: Safety checks
```bash
npm run sw:rollback -- --action status
```

### Version History Corrupted

**Solution**: Clear and rebuild
```bash
npm run sw:rollback -- --action clear --force
npm run sw:rollback -- --action register --version "current-version"
```

### Too Many Rollbacks

**Cause**: Rollback limit exceeded

**Solution**: 
1. Investigate root cause
2. Fix underlying issue
3. Clear history if necessary
4. Increase `maxRollbackAttempts` temporarily

## Performance

- **Storage**: ~1KB per version entry
- **Rollback Time**: 2-5 seconds
- **Safety Checks**: <10ms
- **History Limit**: 10 versions (configurable)

## Security Considerations

1. **User Consent**: Always require for production
2. **Version Verification**: Validate build hashes
3. **Audit Trail**: Complete rollback history
4. **Access Control**: Restrict CLI access
5. **Telemetry**: Monitor for suspicious patterns

## Dependencies

- **NP-110**: SW Update Simulator
- **PC-M2**: PWA Performance Plan
- **Zod**: Schema validation
- **LocalStorage**: Version history persistence

## Example Scenarios

### Scenario 1: Planned Rollback

```bash
# Deploy new version
npm run sw:rollback -- --action register --version "1.3.0"

# Monitor for issues
# ...

# Rollback if needed
npm run sw:rollback -- --action rollback \
  --trigger manual \
  --message "Performance regression detected"
```

### Scenario 2: Automatic Rollback

```typescript
// Configure auto-rollback
const system = new SWRollbackSystem({
  enableAutoRollback: true,
  errorThreshold: 10,
  errorWindowMs: 300000,
  requireUserConsent: false,
});

// Errors accumulate
system.recordError('fetch_failed');
// ... 10 errors within 5 minutes ...

// Automatic rollback triggers
// Check history
const history = system.getRollbackHistory();
console.log('Auto-rollback:', history[history.length - 1]);
```

### Scenario 3: Multi-Stage Rollback

```bash
# Stage 1: Rollback to previous version
npm run sw:rollback -- --action rollback --trigger manual

# Stage 2: If still broken, rollback further
npm run sw:rollback -- --action rollback --trigger manual

# Stage 3: Emergency version
npm run sw:rollback -- --action register --version "emergency"
```
