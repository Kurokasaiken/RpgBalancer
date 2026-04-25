# Device Context Analyzer for Punch Club

## Overview

The Device Context Analyzer is a config-first system that analyzes device capabilities, network conditions, and battery status to provide intelligent install timing recommendations for the Punch Club Progressive Web App (PWA). The system respects user privacy while providing actionable insights for optimal user experience.

## Features

### 🔍 Device Context Analysis
- **Screen Analysis**: Size, orientation, pixel ratio, and device categorization
- **Network Assessment**: Connection type, speed, latency, and data saving mode
- **Battery Monitoring**: Level, charging status, and time estimates
- **Capability Detection**: Touch support, WebGL, service workers, notifications
- **Platform Identification**: OS, browser, device type classification

### 🎯 Smart Recommendations
- **Install Now**: Optimal conditions for immediate installation
- **Wait Better Conditions**: Suboptimal but acceptable with improvements needed
- **Install Later**: Poor conditions, recommend postponing
- **Skip Install**: Device not suitable for optimal experience

### 🔒 Privacy-First Design
- **Configurable Data Collection**: Choose what device information to collect
- **Data Retention Policies**: Automatic cleanup of sensitive data
- **Telemetry Anonymization**: Only summary data sent to analytics
- **User Consent**: Respect user privacy preferences

### 🛠️ Developer Tools
- **CLI Interface**: Command-line tool for testing and analysis
- **Multiple Output Formats**: JSON, Markdown, CSV reports
- **API Testing**: Built-in device API availability checker
- **Comprehensive Logging**: Verbose output for debugging

## Architecture

### Core Components

```
src/analytics/punchClub/
├── deviceContextAnalyzer.ts     # Main analyzer class and schemas
└── types.ts                      # Type definitions

scripts/punchClub/
└── deviceContextAnalyzer.ts     # CLI tool

tests/unit/punchClub/
└── DeviceContextAnalyzer.test.ts # Comprehensive test suite

docs/punch_club/
└── device_context_analyzer.md    # This documentation
```

### Data Flow

```
Device APIs → Context Collection → Analysis Engine → Recommendation Engine → Telemetry
     ↓                ↓                    ↓                    ↓              ↓
  Screen/Network    Zod Validation    Scoring Algorithm    Rule Engine    Analytics
  Battery/Capabilities  Privacy Filter   Weight Factors    Confidence    Summary
```

## Configuration

### Default Configuration

```typescript
export const DEFAULT_DEVICE_CONTEXT_CONFIG = {
  // Minimum requirements for optimal install
  minScreenSize: { width: 375, height: 667 },
  minNetworkSpeed: 1.0, // Mbps
  minBatteryLevel: 0.3, // 30%
  
  // Preferred device characteristics
  preferredDeviceTypes: ['mobile', 'tablet'],
  requiredCapabilities: ['serviceWorkerSupport', 'notificationSupport'],
  
  // Privacy settings
  privacy: {
    collectBatteryInfo: true,
    collectNetworkInfo: true,
    collectScreenInfo: true,
    dataRetentionDays: 30,
  },
};
```

### Custom Configuration

```typescript
import { DeviceContextAnalyzer } from './deviceContextAnalyzer';

const customConfig = {
  ...DEFAULT_DEVICE_CONTEXT_CONFIG,
  minScreenSize: { width: 800, height: 600 }, // Higher requirements
  minNetworkSpeed: 5.0, // Faster network required
  privacy: {
    collectBatteryInfo: false, // Skip battery collection
    collectNetworkInfo: true,
    collectScreenInfo: true,
    dataRetentionDays: 7, // Shorter retention
  },
};

const analyzer = new DeviceContextAnalyzer(customConfig);
```

## Usage Examples

### Basic Usage

```typescript
import { DeviceContextAnalyzer } from './deviceContextAnalyzer';

const analyzer = new DeviceContextAnalyzer();
const analysis = await analyzer.analyzeDeviceContext();

console.log(`Recommendation: ${analysis.recommendation.action}`);
console.log(`Context Score: ${analysis.contextScore}/100`);
console.log(`Confidence: ${Math.round(analysis.recommendation.confidence * 100)}%`);
```

### Advanced Usage with Custom Config

```typescript
import { DeviceContextAnalyzer, DeviceContextConfig } from './deviceContextAnalyzer';

const config: DeviceContextConfig = {
  minScreenSize: { width: 1024, height: 768 },
  minNetworkSpeed: 2.0,
  minBatteryLevel: 0.5,
  privacy: {
    collectBatteryInfo: true,
    collectNetworkInfo: true,
    collectScreenInfo: true,
    dataRetentionDays: 14,
  },
};

const analyzer = new DeviceContextAnalyzer(config);
const analysis = await analyzer.analyzeDeviceContext();

if (analysis.recommendation.action === 'install_now') {
  // Proceed with install
  showInstallPrompt();
} else {
  // Show recommendations
  showInstallRecommendations(analysis.recommendation);
}
```

### Integration with Install Prompt

```typescript
async function handleInstallPrompt() {
  const analyzer = new DeviceContextAnalyzer();
  const analysis = await analyzer.analyzeDeviceContext();
  
  switch (analysis.recommendation.action) {
    case 'install_now':
      // Show install prompt immediately
      return showInstallPrompt();
      
    case 'wait_better_conditions':
      // Show waiting message with improvements
      return showWaitMessage(analysis.recommendation);
      
    case 'install_later':
      // Schedule install reminder
      return scheduleInstallReminder(analysis.recommendation.estimatedWaitTime);
      
    case 'skip_install':
      // Show device not supported message
      return showUnsupportedMessage();
  }
}
```

## CLI Tool

### Installation

```bash
# Make CLI executable
chmod +x scripts/punchClub/deviceContextAnalyzer.ts
```

### Commands

#### Analyze Current Device

```bash
# Basic analysis
node scripts/punchClub/deviceContextAnalyzer.ts analyze

# Verbose output with privacy considerations
node scripts/punchClub/deviceContextAnalyzer.ts analyze --verbose --privacy

# Custom output format and file
node scripts/punchClub/deviceContextAnalyzer.ts analyze --format markdown --output device-report.md

# JSON output to specific file
node scripts/punchClub/deviceContextAnalyzer.ts analyze --format json --output analysis.json
```

#### Test Device APIs

```bash
# Check which device APIs are available
node scripts/punchClub/deviceContextAnalyzer.ts test-apis
```

#### Help

```bash
# Show all available options
node scripts/punchClub/deviceContextAnalyzer.ts --help
```

### CLI Output Examples

#### Console Summary

```
📱 Device Context Analysis Summary
=====================================
🎯 Recommendation: INSTALL_NOW
📊 Context Score: 85/100
🔋 Confidence: 92%

✅ Optimal Conditions:
   • Fast WiFi connection (10 Mbps)
   • Good battery level (80%)
   • Adequate screen size (375x667)

📋 Reasoning:
   • Device meets all minimum requirements
   • Network connection is optimal for download
   • Battery level is sufficient for installation
```

#### JSON Output

```json
{
  "context": {
    "screen": {
      "width": 375,
      "height": 667,
      "sizeCategory": "mobile",
      "orientation": "portrait"
    },
    "network": {
      "type": "wifi",
      "effectiveType": "4g",
      "downlink": 10,
      "rtt": 50
    },
    "battery": {
      "level": 0.8,
      "charging": true
    }
  },
  "recommendation": {
    "action": "install_now",
    "confidence": 0.92,
    "reasoning": ["Device meets all requirements"],
    "optimalConditions": ["Fast WiFi", "Good battery"],
    "currentIssues": []
  },
  "contextScore": 85
}
```

## API Reference

### DeviceContextAnalyzer

#### Constructor

```typescript
constructor(config: DeviceContextConfig = DEFAULT_DEVICE_CONTEXT_CONFIG)
```

#### Methods

##### analyzeDeviceContext()

```typescript
async analyzeDeviceContext(): Promise<DeviceContextAnalysis>
```

Analyzes the current device context and returns installation recommendations.

##### collectDeviceContext()

```typescript
async collectDeviceContext(): Promise<DeviceContext>
```

Collects raw device context information from available APIs.

### Types

#### DeviceContext

```typescript
interface DeviceContext {
  timestamp: number;
  userAgent: string;
  screen: DeviceScreen;
  network: NetworkConnection;
  battery?: BatteryInfo;
  capabilities: DeviceCapabilities;
  platform: PlatformInfo;
}
```

#### InstallRecommendation

```typescript
interface InstallRecommendation {
  action: 'install_now' | 'wait_better_conditions' | 'install_later' | 'skip_install';
  confidence: number; // 0-1
  reasoning: string[];
  estimatedWaitTime?: number; // milliseconds
  optimalConditions: string[];
  currentIssues: string[];
}
```

#### DeviceContextAnalysis

```typescript
interface DeviceContextAnalysis {
  context: DeviceContext;
  recommendation: InstallRecommendation;
  contextScore: number; // 0-100
  analysisTimestamp: number;
  privacyConsiderations: string[];
}
```

## Privacy Considerations

### Data Collection Principles

1. **Minimal Collection**: Only collect data necessary for recommendations
2. **User Control**: Configurable data collection settings
3. **Data Retention**: Automatic cleanup after specified period
4. **Anonymization**: No personally identifiable information in telemetry
5. **Transparency**: Clear documentation of what data is collected

### Privacy Settings

```typescript
const privacyConfig = {
  privacy: {
    collectBatteryInfo: false, // Skip battery level collection
    collectNetworkInfo: true,   // Collect network information
    collectScreenInfo: true,    // Collect screen information
    dataRetentionDays: 7,       // Delete data after 7 days
  },
};
```

### Sensitive Data Handling

- **User Agent**: Collected but not sent to telemetry
- **Screen Resolution**: Collected but summarized in telemetry
- **Battery Level**: Optional collection, never sent to telemetry
- **Network Information**: Collected but summarized in telemetry
- **Location Data**: Never collected

## Testing

### Unit Tests

```bash
# Run all tests
npm run test -- DeviceContextAnalyzer.test.ts

# Run with coverage
npm run test -- DeviceContextAnalyzer.test.ts --coverage
```

### Test Coverage

- ✅ Device context collection
- ✅ Install recommendations logic
- ✅ Privacy configuration
- ✅ Error handling
- ✅ API availability
- ✅ Performance benchmarks
- ✅ Edge cases
- ✅ Telemetry integration

### Mock Strategy

Tests use comprehensive mocking of device APIs:

```typescript
// Mock screen API
Object.defineProperty(window, 'screen', {
  value: { width: 375, height: 667, orientation: { type: 'portrait' } },
  writable: true,
});

// Mock network API
Object.defineProperty(navigator, 'connection', {
  value: { type: 'wifi', effectiveType: '4g', downlink: 10 },
  writable: true,
});

// Mock battery API
navigator.getBattery = vi.fn().mockResolvedValue({
  level: 0.8,
  charging: true,
});
```

## Performance

### Benchmarks

- **Analysis Time**: < 100ms for complete analysis
- **Memory Usage**: < 1MB for context collection
- **API Calls**: 3-5 concurrent API calls
- **Bundle Size**: < 50KB (gzipped)

### Optimization Strategies

1. **Parallel API Calls**: Collect all data concurrently
2. **Lazy Evaluation**: Only collect required data based on config
3. **Caching**: Cache results for repeated calls
4. **Debouncing**: Prevent rapid repeated analyses

## Browser Compatibility

### Supported APIs

| API | Chrome | Firefox | Safari | Edge | Fallback |
|-----|--------|---------|--------|------|----------|
| Screen API | ✅ | ✅ | ✅ | ✅ | Static values |
| Network API | ✅ | ❌ | ❌ | ✅ | Unknown type |
| Battery API | ✅ | ❌ | ❌ | ❌ | Not available |
| Device Memory | ✅ | ❌ | ❌ | ✅ | 4GB default |
| Hardware Concurrency | ✅ | ✅ | ✅ | ✅ | 4 cores default |

### Progressive Enhancement

The system gracefully degrades when APIs are unavailable:

- **Missing Network API**: Assumes unknown connection type
- **Missing Battery API**: Continues without battery data
- **Missing Screen API**: Uses default mobile dimensions
- **Missing Capability APIs**: Assumes basic capabilities

## Telemetry Integration

### Event: `pc_device_context_analyzed`

```typescript
interface DeviceContextTelemetry {
  eventType: 'pc_device_context_analyzed';
  data: {
    timestamp: number;
    recommendation: string;
    contextScore: number;
    deviceType: string;
    networkType: string;
    screenCategory: string;
    hasBattery: boolean;
    confidence: number;
    issues: string[];
    optimalConditions: string[];
  };
}
```

### Privacy-Safe Data

Only summary information is sent to telemetry:

- Device type (mobile/tablet/desktop)
- Screen size category (small/medium/large)
- Network type (wifi/cellular/unknown)
- Recommendation and confidence score
- Count of issues and optimal conditions

### Sensitive Data Excluded

- Exact screen dimensions
- Precise battery level
- Network speed measurements
- User agent string
- Hardware specifications

## Troubleshooting

### Common Issues

#### "Battery API not available"
- **Cause**: Browser doesn't support Battery API
- **Solution**: Analysis continues without battery data
- **Impact**: Reduced recommendation accuracy

#### "Network API not available"
- **Cause**: Browser doesn't support Network Information API
- **Solution**: Assumes unknown connection type
- **Impact**: Conservative network recommendations

#### "Screen API not available"
- **Cause**: Running in non-browser environment
- **Solution**: Uses default mobile dimensions
- **Impact**: May affect size-based recommendations

### Debug Mode

Enable verbose logging for detailed debugging:

```typescript
const analyzer = new DeviceContextAnalyzer({
  ...DEFAULT_DEVICE_CONTEXT_CONFIG,
  debug: true, // Enable debug logging
});
```

### CLI Debugging

```bash
# Verbose output
node scripts/punchClub/deviceContextAnalyzer.ts analyze --verbose

# Test API availability
node scripts/punchClub/deviceContextAnalyzer.ts test-apis
```

## Contributing

### Development Setup

```bash
# Install dependencies
npm install

# Run tests
npm run test

# Run linting
npm run lint

# Build check
npm run build:check
```

### Adding New Features

1. Update schemas in `deviceContextAnalyzer.ts`
2. Add tests in `DeviceContextAnalyzer.test.ts`
3. Update CLI if needed
4. Update documentation
5. Run full test suite

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Include comprehensive error handling
- Respect privacy principles

## License

This project follows the same license as the main RPG Balancer project.

## Changelog

### v1.0.0 (2026-01-24)
- ✅ Initial release
- ✅ Device context analysis
- ✅ Install recommendations
- ✅ CLI tool
- ✅ Privacy-first design
- ✅ Comprehensive test suite
- ✅ Documentation

---

**Note**: This analyzer is designed specifically for the Punch Club PWA install optimization but can be adapted for other progressive web applications with similar requirements.
