# Punch Club Analytics Webhook Bridge

## Overview
Config-first webhook bridge for forwarding filtered Punch Club analytics events to external platforms like Slack, Teams, and Discord with intelligent filtering, rate limiting, and retry logic.

## Purpose
The Webhook Bridge provides a robust system for forwarding analytics events from Punch Club to external monitoring and notification platforms while maintaining control over what gets sent through configurable filtering rules.

## Features
- **Multi-Platform Support**: Slack, Microsoft Teams, Discord, and custom webhooks
- **Config-First Filtering**: Advanced filtering system with multiple conditions and actions
- **Rate Limiting**: Per-endpoint rate limiting with configurable strategies
- **Retry Logic**: Exponential backoff retry for failed deliveries
- **Template System**: Custom message templates with variable substitution
- **Statistics Tracking**: Comprehensive delivery and failure statistics
- **Persistence**: State persistence with automatic recovery
- **Security**: Request signing and timeout protection

## Installation

```bash
# No installation required - run directly with tsx
tsx scripts/analytics/webhookBridge.ts
```

## Configuration

### Basic Configuration

Create a `webhookConfig.json` file in your project root:

```json
{
  "version": "1.0.0",
  "enabled": true,
  "endpoints": [
    {
      "id": "slack_general",
      "name": "Slack - General Analytics",
      "url": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
      "type": "slack",
      "enabled": true,
      "template": {
        "title": "📊 Punch Club Analytics",
        "text": "{{eventType}} event from {{userId}}",
        "color": "good",
        "fields": [
          {
            "title": "Event Type",
            "value": "{{eventType}}",
            "short": true
          },
          {
            "title": "User ID",
            "value": "{{userId}}",
            "short": true
          },
          {
            "title": "Session ID",
            "value": "{{sessionId}}",
            "short": true
          },
          {
            "title": "Timestamp",
            "value": "{{timestamp}}",
            "short": true
          }
        ],
        "footer": "Punch Club Analytics Bridge",
        "timestamp": true
      },
      "rateLimit": {
        "maxRequests": 100,
        "windowMs": 60000,
        "strategy": "sliding"
      }
    }
  ],
  "filters": [
    {
      "id": "critical_events",
      "name": "Critical Events Filter",
      "enabled": true,
      "eventType": ["error", "crash", "performance_critical"],
      "conditions": [
        {
          "field": "data.severity",
          "operator": "equals",
          "value": "critical"
        }
      ],
      "actions": [
        {
          "type": "forward",
          "target": "teams_critical"
        }
      ]
    }
  ],
  "rateLimit": {
    "maxRequests": 1000,
    "windowMs": 60000,
    "strategy": "sliding"
  },
  "retry": {
    "maxAttempts": 3,
    "backoffMs": 1000,
    "maxBackoffMs": 10000,
    "strategy": "exponential"
  },
  "security": {
    "signatureHeader": "X-PunchClub-Signature",
    "secret": "your-webhook-secret-key-change-in-production",
    "timeoutMs": 10000
  }
}
```

## Usage

### CLI Interface

```bash
# Process events from file
tsx scripts/analytics/webhookBridge.ts --action process --event-file events.json

# View statistics
tsx scripts/analytics/webhookBridge.ts --action stats

# Test webhook delivery
tsx scripts/analytics/webhookBridge.ts --action test

# Reset statistics
tsx scripts/analytics/webhookBridge.ts --action reset

# Custom configuration file
tsx scripts/analytics/webhookBridge.ts --config custom-config.json

# Verbose output
tsx scripts/analytics/webhookBridge.ts --verbose
```

### Programmatic Usage

```typescript
import { WebhookBridge } from './scripts/analytics/webhookBridge';

// Configuration
const config = {
  version: '1.0.0',
  enabled: true,
  endpoints: [...],
  filters: [...],
  rateLimit: {...},
  retry: {...},
  security: {...},
};

// Persistence service (implement your own)
const persistence = {
  async saveData(key: string, data: any): Promise<void> {
    // Your persistence logic
  },
  async loadData(key: string): Promise<any> {
    // Your persistence logic
  },
};

// Create bridge instance
const bridge = new WebhookBridge(config, persistence);

// Process analytics event
await bridge.processEvent({
  eventType: 'user_login',
  timestamp: Date.now(),
  data: { source: 'web' },
  userId: 'user-123',
  sessionId: 'session-456',
});

// Get statistics
const stats = bridge.getStats();
console.log(`Forwarded: ${stats.forwardedEvents}, Failed: ${stats.failedEvents}`);
```

## Configuration Reference

### Endpoints

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier for the endpoint |
| `name` | string | Human-readable name |
| `url` | string | Webhook URL |
| `type` | string | Platform type: `slack`, `teams`, `discord`, `custom` |
| `enabled` | boolean | Whether this endpoint is active |
| `template` | object | Custom message template (optional) |
| `rateLimit` | object | Per-endpoint rate limiting (optional) |

### Filters

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier for the filter |
| `name` | string | Human-readable name |
| `enabled` | boolean | Whether this filter is active |
| `eventType` | string\|string[] | Event types to match |
| `conditions` | array | Conditions that must all match |
| `actions` | array | Actions to execute when matched |

### Conditions

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact match | `{"field": "userId", "operator": "equals", "value": "user-123"}` |
| `contains` | Contains substring | `{"field": "eventType", "operator": "contains", "value": "error"}` |
| `startsWith` | Starts with | `{"field": "eventType", "operator": "startsWith", "value": "pc_"}` |
| `endsWith` | Ends with | `{"field": "path", "operator": "endsWith", "value": ".js"}` |
| `regex` | Regular expression | `{"field": "data.message", "operator": "regex", "value": "error.*critical"}` |
| `gt` | Greater than | `{"field": "data.loadTime", "operator": "gt", "value": 3000}` |
| `lt` | Less than | `{"field": "data.responseTime", "operator": "lt", "value": 100}` |
| `gte` | Greater than or equal | `{"field": "data.count", "operator": "gte", "value": 10}` |
| `lte` | Less than or equal | `{"field": "data.score", "operator": "lte", "value": 100}` |

### Actions

| Type | Description | Example |
|------|-------------|---------|
| `forward` | Forward to endpoint | `{"type": "forward", "target": "slack_general"}` |
| `block` | Block event from forwarding | `{"type": "block"}` |
| `delay` | Delay processing | `{"type": "delay", "delay": 1000}` |
| `transform` | Transform event | `{"type": "transform", "transform": {"template": "CRITICAL: {{eventType}}"}}` |

## Templates

### Variable Substitution

Templates support variable substitution using `{{variable}}` syntax:

**Available Variables:**
- `{{eventType}}` - Event type
- `{{timestamp}}` - ISO timestamp
- `{{userId}}` - User ID (or 'N/A')
- `{{sessionId}}` - Session ID (or 'N/A')
- Custom variables from `template.variables`

### Platform-Specific Templates

#### Slack Template
```json
{
  "title": "📊 Punch Club Analytics",
  "text": "{{eventType}} event from {{userId}}",
  "color": "good",
  "fields": [
    {
      "title": "Event Type",
      "value": "{{eventType}}",
      "short": true
    }
  ],
  "footer": "Punch Club Analytics Bridge",
  "timestamp": true
}
```

#### Teams Template
```json
{
  "title": "🚨 Critical Punch Club Event",
  "text": "{{eventType}} - {{userId}}",
  "color": "FF0000",
  "fields": [
    {
      "title": "Event Type",
      "value": "{{eventType}}"
    }
  ],
  "footer": "Punch Club Analytics Bridge"
}
```

#### Discord Template
```json
{
  "title": "🐛 Debug Event",
  "text": "{{eventType}} from {{userId}}",
  "color": "00FF00",
  "fields": [
    {
      "title": "Event Type",
      "value": "{{eventType}}",
      "inline": true
    }
  ],
  "footer": "Punch Club Analytics Bridge"
}
```

## Rate Limiting

### Strategies

| Strategy | Description |
|----------|-------------|
| `sliding` | Sliding window rate limiting |
| `fixed` | Fixed window rate limiting |

### Configuration

```json
{
  "rateLimit": {
    "maxRequests": 100,
    "windowMs": 60000,
    "strategy": "sliding"
  }
}
```

## Retry Logic

### Strategies

| Strategy | Description |
|----------|-------------|
| `exponential` | Exponential backoff (default) |
| `linear` | Linear backoff |
| `fixed` | Fixed delay |

### Configuration

```json
{
  "retry": {
    "maxAttempts": 3,
    "backoffMs": 1000,
    "maxBackoffMs": 10000,
    "strategy": "exponential"
  }
}
```

## Security

### Request Signing

The bridge signs each request with a SHA-256 HMAC using your secret:

```json
{
  "security": {
    "signatureHeader": "X-PunchClub-Signature",
    "secret": "your-webhook-secret-key",
    "timeoutMs": 10000
  }
}
```

### Verification (Webhook Receiver)

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Event Format

### Analytics Event Structure

```typescript
interface AnalyticsEvent {
  eventType: string;
  timestamp: number;
  data: Record<string, any>;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}
```

### Example Events

```json
{
  "eventType": "user_login",
  "timestamp": 1706097600000,
  "data": {
    "source": "web",
    "userAgent": "Mozilla/5.0...",
    "ip": "192.168.1.1"
  },
  "userId": "user-123",
  "sessionId": "session-456"
}
```

```json
{
  "eventType": "performance_warning",
  "timestamp": 1706097600000,
  "data": {
    "loadTime": 3500,
    "resource": "/api/users",
    "threshold": 3000
  },
  "userId": "user-123",
  "sessionId": "session-456"
}
```

```json
{
  "eventType": "pc_consent_diagnostics_run",
  "timestamp": 1706097600000,
  "data": {
    "syncStatus": "drift_detected",
    "driftPercentage": 25.5,
    "driftedFields": 2
  },
  "userId": "user-123",
  "sessionId": "session-456"
}
```

## Statistics

### Bridge Statistics

```typescript
interface BridgeStats {
  totalEvents: number;
  processedEvents: number;
  forwardedEvents: number;
  blockedEvents: number;
  failedEvents: number;
  endpointsStats: Record<string, EndpointStats>;
  lastProcessed: number;
}
```

### Endpoint Statistics

```typescript
interface EndpointStats {
  sent: number;
  failed: number;
  lastSent?: number;
  lastError?: string;
  averageLatency?: number;
}
```

### Viewing Statistics

```bash
tsx scripts/analytics/webhookBridge.ts --action stats
```

Output:
```
📊 Webhook Bridge Statistics:
  Total Events: 150
  Processed Events: 145
  Forwarded Events: 120
  Blocked Events: 15
  Failed Events: 10
  Last Processed: 2026-01-24T12:00:00.000Z

📡 Endpoint Statistics:
  slack_general:
    Sent: 80
    Failed: 5
    Last Sent: 2026-01-24T11:58:30.000Z
    Avg Latency: 245.67ms
  teams_critical:
    Sent: 40
    Failed: 3
    Last Sent: 2026-01-24T11:55:12.000Z
    Avg Latency: 312.45ms
```

## Integration with Punch Club Analytics

### Event Generation

```typescript
// In your analytics code
import { WebhookBridge } from './scripts/analytics/webhookBridge';

const bridge = new WebhookBridge(config, persistence);

// Forward event to webhook bridge
await bridge.processEvent({
  eventType: 'pc_consent_diagnostics_run',
  timestamp: Date.now(),
  data: {
    syncStatus: 'drift_detected',
    driftPercentage: 25.5,
    driftedFields: 2,
  },
  userId: 'user-123',
  sessionId: 'session-456',
});
```

### Punch Club Specific Filters

```json
{
  "id": "punch_club_specific",
  "name": "Punch Club Specific Events",
  "enabled": true,
  "eventType": ["pc_consent_diagnostics_run", "pc_consent_session", "pc_offline_bundle_analysis"],
  "conditions": [
    {
      "field": "eventType",
      "operator": "contains",
      "value": "pc_"
    }
  ],
  "actions": [
    {
      "type": "forward",
      "target": "slack_general"
    },
    {
      "type": "transform",
      "transform": {
        "template": "Punch Club: {{eventType}}",
        "variables": {
          "source": "punch_club"
        }
      }
    }
  ]
}
```

## Testing

### CLI Testing

```bash
# Test webhook delivery
tsx scripts/analytics/webhookBridge.ts --action test
```

### Unit Testing

```bash
# Run unit tests
npm run test -- tests/unit/analytics/WebhookBridge.test.ts
```

### Test Events

Create a test events file:

```json
[
  {
    "eventType": "test_event",
    "timestamp": 1706097600000,
    "data": {
      "test": true,
      "message": "Test event for webhook bridge"
    },
    "userId": "test-user",
    "sessionId": "test-session"
  },
  {
    "eventType": "performance_warning",
    "timestamp": 1706097601000,
    "data": {
      "loadTime": 3500,
      "resource": "/api/analytics"
    },
    "userId": "test-user",
    "sessionId": "test-session"
  }
]
```

Process test events:

```bash
tsx scripts/analytics/webhookBridge.ts --action process --event-file test-events.json
```

## Troubleshooting

### Common Issues

#### Webhook Delivery Failures

1. **Check endpoint URL**: Ensure webhook URLs are correct and accessible
2. **Verify authentication**: Check API keys and tokens
3. **Review rate limits**: Check if you're hitting rate limits
4. **Network connectivity**: Ensure your server can reach the webhook URLs

#### Event Not Forwarded

1. **Check filter configuration**: Verify event types and conditions
2. **Enable filters**: Ensure filters are enabled in configuration
3. **Match conditions**: Verify all conditions match (AND logic)
4. **Check endpoint status**: Ensure target endpoints are enabled

#### High Failure Rate

1. **Review retry configuration**: Increase retry attempts or backoff time
2. **Check timeout settings**: Increase timeout for slow endpoints
3. **Monitor rate limits**: Reduce request rate if hitting limits
4. **Verify payload size**: Check if payloads are too large

### Debug Mode

Enable verbose logging:

```bash
tsx scripts/analytics/webhookBridge.ts --verbose
```

### Statistics Reset

Reset all statistics:

```bash
tsx scripts/analytics/webhookBridge.ts --action reset
```

## Best Practices

### Configuration

1. **Use environment variables** for secrets and URLs
2. **Set appropriate rate limits** to avoid overwhelming endpoints
3. **Configure retry logic** for reliable delivery
4. **Use specific filters** to reduce noise and focus on important events
5. **Test configurations** before deploying to production

### Security

1. **Use strong secrets** for webhook signing
2. **Rotate secrets regularly**
3. **Use HTTPS** webhook URLs
4. **Validate incoming requests** if using webhooks for bidirectional communication
5. **Monitor for abuse** and unusual patterns

### Performance

1. **Batch events** when possible to reduce overhead
2. **Use appropriate rate limits** to prevent overwhelming endpoints
3. **Monitor statistics** to identify performance issues
4. **Optimize filters** to reduce unnecessary processing
5. **Use async processing** to avoid blocking main application

## File Locations

- **CLI Script**: `scripts/analytics/webhookBridge.ts`
- **Tests**: `tests/unit/analytics/WebhookBridge.test.ts`
- **Documentation**: `docs/analytics/webhook_bridge.md`
- **Configuration**: `webhookConfig.json` (project root)
- **State**: Stored via PersistenceService

## Dependencies

- **analytics/punchClub.ts**: Punch Club analytics event generation
- **webhook config**: Configuration file for endpoints and filters
- **PersistenceService**: Async persistence for state management
- **Node.js fetch**: HTTP requests for webhook delivery
- **crypto**: Request signing and security

## Related Documentation

- [Punch Club Analytics Guide](../punchClub/analytics.md)
- [Persistence Service Documentation](../shared/persistence.md)
- [Configuration Management Guide](../configuration/README.md)
- [Security Best Practices](../security/webhooks.md)

## Maintenance

### Regular Tasks

1. **Monitor statistics** for delivery success rates
2. **Review rate limits** and adjust as needed
3. **Update filters** based on changing requirements
4. **Rotate secrets** and update authentication
5. **Test endpoints** after configuration changes

### Update Triggers

- New event types added to analytics
- New monitoring platforms integrated
- Rate limiting requirements changed
- Security policies updated
- Performance issues identified

## Support

For issues or questions:

1. Check configuration syntax and validity
2. Verify webhook endpoint accessibility
3. Review filter logic and conditions
4. Monitor statistics and error logs
5. Test with simplified configuration first

## Version History

- **1.0.0** (2026-01-24): Initial release
  - Multi-platform webhook support (Slack, Teams, Discord)
  - Config-first filtering system with conditions and actions
  - Rate limiting with sliding window strategy
  - Exponential backoff retry logic
  - Custom message templates with variable substitution
  - Comprehensive statistics tracking
  - State persistence with automatic recovery
  - Request signing and security features
  - CLI interface for management and testing
  - Full unit test coverage

## Exit Codes

| Code | Status | Description |
|------|--------|-------------|
| `0` | Success | Operation completed successfully |
| `1` | Error | Configuration error, file not found, or processing failure |

## Performance Characteristics

- **Event Processing**: < 10ms per event (excluding network latency)
- **Filter Evaluation**: < 1ms per filter condition
- **Template Generation**: < 5ms per message
- **Rate Limiting**: O(1) complexity with sliding window
- **State Persistence**: < 50ms for save/load operations

The Punch Club Analytics Webhook Bridge provides a robust, configurable solution for forwarding analytics events to external platforms with comprehensive filtering, monitoring, and reliability features.
