# Push Notification Readiness Audit Playbook

**NP-248** – Punch Club Push Notification Readiness Audit  
**Agent**: Nexus-SW – Push Reliability  
**Status**: ✅ Complete

## Overview

Comprehensive audit system for Punch Club PWA push notification readiness. Validates permission status, Service Worker subscription, fallback schedule push, and configuration completeness.

## Features

- **5 Audit Checks**: Permission, SW, subscription, fallback, configuration
- **CLI Tool**: Automated audit with JSON/Markdown reports
- **Fix Checklist**: Actionable recommendations
- **Exit Codes**: 0 (pass/warning), 1 (fail)
- **Config-First**: Zod schema validation

## Audit Checks

### 1. Permission Status

**Check**: Notification permission state  
**Pass**: Permission granted  
**Warning**: Permission not requested (default)  
**Fail**: Permission denied

**Browser API**:
```javascript
Notification.permission // 'granted' | 'denied' | 'default'
```

**Fix**:
- Request permission during onboarding
- Implement permission re-request flow for denied state
- Use PersistenceService to track permission requests

### 2. Service Worker

**Check**: SW file exists with push handlers  
**Pass**: SW exists with push/notification handlers  
**Warning**: SW exists but missing handlers  
**Fail**: SW file not found

**Required Handlers**:
```javascript
self.addEventListener('push', (event) => {
  // Handle push event
});

self.addEventListener('notificationclick', (event) => {
  // Handle notification click
});
```

**Fix**:
- Create `public/service-worker.js`
- Add push event listener
- Add notification click handler
- Register SW in main app

### 3. Push Subscription

**Check**: VAPID keys and subscription config  
**Pass**: Valid config with VAPID public key  
**Warning**: Config exists but missing VAPID key  
**Fail**: Config file not found or invalid

**Configuration** (`pushConfig.json`):
```json
{
  "vapidPublicKey": "BG7x...",
  "notificationOptions": {
    "title": "Punch Club",
    "body": "New training session available!",
    "icon": "/assets/icon-192.png",
    "badge": "/assets/badge-72.png",
    "tag": "training-reminder",
    "requireInteraction": false
  }
}
```

**Fix**:
- Generate VAPID keys: `npx web-push generate-vapid-keys`
- Create `pushConfig.json` with keys
- Store private key securely (server-side)
- Configure notification options

### 4. Fallback Schedule Push

**Check**: Fallback mechanism for failed pushes  
**Pass**: Enabled with interval and retry config  
**Warning**: Enabled but missing interval/retries  
**Fail**: Not enabled or config missing

**Configuration**:
```json
{
  "fallbackSchedule": {
    "enabled": true,
    "intervalMs": 3600000,
    "maxRetries": 3
  }
}
```

**Fix**:
- Enable fallback schedule in config
- Set appropriate interval (e.g., 1 hour)
- Configure max retries (e.g., 3)
- Implement retry logic with exponential backoff

### 5. Configuration

**Check**: Complete notification options  
**Pass**: All required fields present  
**Warning**: Missing optional fields  
**Fail**: Missing required fields

**Required Fields**:
- `notificationOptions.title`
- `notificationOptions.body`

**Optional Fields**:
- `icon`, `badge`, `tag`, `requireInteraction`

**Fix**:
- Complete all notification options
- Add app icon and badge
- Configure notification tags for grouping
- Set requireInteraction based on priority

## CLI Usage

### Basic Audit

```bash
tsx scripts/pwa/pushAudit.ts
```

### JSON Output

```bash
tsx scripts/pwa/pushAudit.ts --json
```

### Markdown Output

```bash
tsx scripts/pwa/pushAudit.ts --markdown
```

### Both Formats

```bash
tsx scripts/pwa/pushAudit.ts
```

## Output Files

Reports are saved to `test-results/`:

- `np-248-push-audit-<timestamp>.json`
- `np-248-push-audit-<timestamp>.md`

## Exit Codes

- **0**: Audit passed or completed with warnings
- **1**: Audit failed (critical issues found)

## Integration with CI/CD

### GitHub Actions

```yaml
- name: Push Notification Audit
  run: tsx scripts/pwa/pushAudit.ts
  
- name: Upload Audit Report
  uses: actions/upload-artifact@v3
  with:
    name: push-audit-report
    path: test-results/np-248-push-audit-*.md
```

### Pre-deployment Check

```bash
#!/bin/bash
tsx scripts/pwa/pushAudit.ts
if [ $? -ne 0 ]; then
  echo "Push notification audit failed. Fix issues before deploying."
  exit 1
fi
```

## Fix Checklist

### Initial Setup

- [ ] Generate VAPID keys
- [ ] Create `pushConfig.json`
- [ ] Store private key securely
- [ ] Create Service Worker file
- [ ] Add push event handlers
- [ ] Register Service Worker

### Permission Flow

- [ ] Request permission during onboarding
- [ ] Handle permission denied gracefully
- [ ] Implement permission re-request UI
- [ ] Track permission state with PersistenceService
- [ ] Show permission rationale before requesting

### Subscription Management

- [ ] Subscribe user after permission granted
- [ ] Store subscription in PersistenceService
- [ ] Handle subscription expiration
- [ ] Implement subscription refresh logic
- [ ] Send subscription to backend

### Fallback Mechanism

- [ ] Enable fallback schedule in config
- [ ] Implement retry logic with exponential backoff
- [ ] Track failed push attempts
- [ ] Log fallback activations
- [ ] Monitor fallback success rate

### Testing

- [ ] Test permission request flow
- [ ] Test push notification delivery
- [ ] Test notification click handling
- [ ] Test fallback schedule activation
- [ ] Test subscription refresh
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

### Monitoring

- [ ] Track permission grant rate
- [ ] Monitor push delivery rate
- [ ] Track notification click-through rate
- [ ] Monitor fallback activation frequency
- [ ] Alert on high failure rates

## Troubleshooting

### Permission Denied

**Symptom**: User denied notification permission  
**Solution**:
1. Explain benefits of notifications
2. Provide in-app settings to re-request
3. Use alternative engagement methods

### Service Worker Not Registered

**Symptom**: SW registration fails  
**Solution**:
1. Check SW file path
2. Verify HTTPS (required for SW)
3. Check browser console for errors
4. Ensure SW scope is correct

### Push Not Received

**Symptom**: Push sent but not delivered  
**Solution**:
1. Verify subscription is valid
2. Check VAPID keys match
3. Verify SW push handler exists
4. Check browser push service status
5. Activate fallback schedule

### Subscription Expired

**Symptom**: Subscription no longer valid  
**Solution**:
1. Implement subscription refresh
2. Re-subscribe user automatically
3. Update subscription on backend
4. Track subscription lifecycle

## Best Practices

### Permission Request

1. **Timing**: Request during meaningful user action
2. **Context**: Explain why notifications are valuable
3. **Graceful Degradation**: App works without notifications
4. **Re-request**: Provide UI to re-enable if denied

### Notification Content

1. **Clear Title**: Concise and actionable
2. **Relevant Body**: Specific information
3. **Appropriate Icon**: Recognizable app icon
4. **Action Buttons**: Enable quick actions
5. **Deep Links**: Navigate to relevant content

### Reliability

1. **Fallback Schedule**: Always have backup delivery
2. **Retry Logic**: Exponential backoff for failures
3. **Monitoring**: Track delivery and engagement
4. **Testing**: Regular end-to-end tests
5. **Graceful Errors**: Handle failures silently

### Performance

1. **Batch Notifications**: Group related updates
2. **Quiet Hours**: Respect user preferences
3. **Frequency Limits**: Avoid notification fatigue
4. **Relevance**: Only send valuable notifications
5. **Personalization**: Tailor to user interests

## Dependencies

- **service-worker.ts**: Push event handlers
- **pushConfig.json**: VAPID keys and options
- **PersistenceService**: Subscription storage
- **Web Push API**: Browser notification API
- **VAPID**: Voluntary Application Server Identification

## Security Considerations

### VAPID Keys

- **Private Key**: Never expose in client code
- **Public Key**: Safe to include in client
- **Rotation**: Rotate keys periodically
- **Storage**: Store private key in secure vault

### Subscription Data

- **Encryption**: Use HTTPS for transmission
- **Storage**: Store securely with PersistenceService
- **Expiration**: Handle expired subscriptions
- **Validation**: Verify subscription before sending

### User Privacy

- **Consent**: Explicit permission required
- **Transparency**: Clear about notification types
- **Control**: Easy opt-out mechanism
- **Data Minimization**: Only collect necessary data

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Permission Grant Rate | >60% | First request acceptance |
| Delivery Rate | >95% | Successful deliveries |
| Click-Through Rate | >10% | Notification engagement |
| Fallback Activation | <5% | Backup delivery usage |
| Subscription Refresh | <1% | Re-subscription rate |

## Related Documentation

- [Service Worker Guide](./service_worker_guide.md)
- [Push Notification Best Practices](./push_best_practices.md)
- [VAPID Key Generation](./vapid_keys.md)
- [Notification Permissions](./notification_permissions.md)

---

**Status**: ✅ Complete  
**Evidence**: `test-results/np-248-push-audit.log`  
**CLI**: `tsx scripts/pwa/pushAudit.ts`
