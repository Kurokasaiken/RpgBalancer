# Social Share Integration

## Overview

The Social Share Integration (NP-230) provides a comprehensive social sharing system for RPG Balancer with Web Share API integration, screenshot capture, and platform-specific sharing capabilities.

## Features

### 🚀 Core Functionality
- **Web Share API Integration**: Native sharing on supported browsers
- **Platform-Specific Sharing**: Direct sharing to Twitter, Facebook, LinkedIn, Reddit, Telegram, WhatsApp
- **Screenshot Capture**: Element and tab-level screenshot functionality
- **Template System**: Pre-defined share templates with variable substitution
- **Fallback Methods**: Clipboard and custom URL fallbacks
- **Telemetry Integration**: Comprehensive event tracking

### 📱 Supported Platforms
- **Twitter/X** - 280 character limit support
- **Facebook** - URL sharing
- **LinkedIn** - Professional sharing with title and summary
- **Reddit** - Community sharing
- **Telegram** - Instant messaging
- **WhatsApp** - Mobile messaging

### 📸 Screenshot Features
- **Element Capture**: Screenshot specific DOM elements
- **Tab Capture**: Full screen/tab capture
- **Watermarking**: Configurable watermarks
- **Multiple Formats**: PNG, JPEG, WebP support
- **Quality Control**: Adjustable compression and scaling

## Architecture

### File Structure
```
src/balancing/
├── config/
│   └── socialShareConfig.ts     # Configuration schemas and defaults
├── socialShare.ts               # Core SocialShare class
└── ...

src/ui/punchClub/hooks/
└── useSocialShare.ts            # React hook for UI integration

tests/unit/punchClub/
├── SocialShare.test.ts          # Core class tests
└── useSocialShare.test.tsx      # Hook tests

docs/punch_club/
└── social_share_integration.md  # This documentation
```

### Core Components

#### 1. SocialShareConfig
Configuration system with Zod validation for:
- Platform definitions and URLs
- Share templates with variable substitution
- Screenshot settings (quality, format, watermarks)
- Fallback options
- Telemetry configuration

#### 2. SocialShare Class
Main sharing engine providing:
- Web Share API integration
- Platform-specific URL building
- Template processing
- Screenshot capture
- Fallback handling
- Telemetry emission

#### 3. useSocialShare Hook
React hook for UI integration with:
- State management (sharing, capturing, errors)
- Callback support (onShareStart, onShareComplete, etc.)
- Auto-capture functionality
- Platform and template helpers

## Usage Examples

### Basic Sharing

```typescript
import { useSocialShare } from '@/ui/punchClub/hooks/useSocialShare';

function ShareButton() {
  const { share, isSharing } = useSocialShare();

  const handleShare = async () => {
    try {
      const result = await share({
        title: 'Achievement Unlocked!',
        text: 'Just unlocked Master Warrior in RPG Balancer!',
        url: 'https://rpg-balancer.com/achievements/master-warrior'
      });
      
      if (result.success) {
        console.log('Shared successfully:', result.method);
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <button onClick={handleShare} disabled={isSharing}>
      {isSharing ? 'Sharing...' : 'Share Achievement'}
    </button>
  );
}
```

### Platform-Specific Sharing

```typescript
const { shareToPlatform } = useSocialShare();

const shareToTwitter = async () => {
  await shareToPlatform('twitter', {
    title: 'Check this out!',
    text: 'Amazing character build in RPG Balancer!',
    url: 'https://rpg-balancer.com/builds/warrior-123'
  });
};
```

### Template-Based Sharing

```typescript
const { shareWithTemplate } = useSocialShare();

const shareAchievement = async () => {
  await shareWithTemplate('achievement', {
    achievement: 'Master Warrior',
    stats: 'Strength: 100, Defense: 80, HP: 1500'
  });
};
```

### Screenshot Integration

```typescript
const { captureScreenshot, share } = useSocialShare({ autoCapture: true });

const shareWithScreenshot = async () => {
  // Auto-capture enabled - will take screenshot before sharing
  await share({
    title: 'My Character Build',
    text: 'Check out my awesome build!',
    templateId: 'character',
    metadata: { character: 'Warrior', stats: 'STR: 100, DEF: 80' }
  });
};

const manualScreenshot = async () => {
  const screenshot = await captureScreenshot({
    element: document.getElementById('character-build'),
    quality: 0.9,
    format: 'png',
    watermark: {
      text: 'RPG Balancer',
      position: 'bottom-right',
      opacity: 0.7
    }
  });
  
  console.log('Screenshot captured:', screenshot);
};
```

### Advanced Configuration

```typescript
import { SocialShare } from '@/balancing/socialShare';
import { SocialShareConfig } from '@/balancing/config/socialShareConfig';

const customConfig: SocialShareConfig = {
  platforms: [
    {
      id: 'discord',
      name: 'Discord',
      baseUrl: 'https://discord.com/channels/',
      icon: '🎮',
      color: '#7289DA',
      supported: true
    }
  ],
  templates: [
    {
      id: 'custom',
      name: 'Custom Template',
      title: 'Custom Title',
      text: 'Custom message with {variable} substitution',
      hashtags: ['custom', 'gaming']
    }
  ],
  screenshot: {
    enabled: true,
    quality: 0.95,
    format: 'webp',
    scale: 2,
    backgroundColor: '#1a1a1a',
    padding: 20,
    watermark: {
      enabled: true,
      text: 'My Game',
      position: 'top-left',
      opacity: 0.8
    }
  },
  fallback: {
    copyToClipboard: true,
    showShareDialog: true,
    customShareUrl: 'https://my-game.com/share'
  },
  telemetry: {
    enabled: true,
    events: ['custom_share_event']
  }
};

const socialShare = new SocialShare(customConfig);
```

## Templates

### Built-in Templates

#### Achievement Template
```typescript
{
  id: 'achievement',
  name: 'Achievement Unlocked',
  title: 'Achievement Unlocked!',
  text: 'Just unlocked {achievement} in RPG Balancer! 🎮 {stats}',
  hashtags: ['RPGBalancer', 'Gaming', 'Achievement']
}
```

#### Character Build Template
```typescript
{
  id: 'character',
  name: 'Character Build',
  title: 'My Character Build',
  text: 'Check out my {character} build in RPG Balancer! ⚔️ {stats}',
  hashtags: ['RPGBalancer', 'CharacterBuild', 'Gaming']
}
```

#### Victory Template
```typescript
{
  id: 'victory',
  name: 'Victory',
  title: 'Victory!',
  text: 'Just achieved {result} in RPG Balancer! 🏆 {stats}',
  hashtags: ['RPGBalancer', 'Victory', 'Gaming']
}
```

#### Milestone Template
```typescript
{
  id: 'milestone',
  name: 'Milestone',
  title: 'Milestone Reached',
  text: 'Reached {milestone} in RPG Balancer! 📈 {stats}',
  hashtags: ['RPGBalancer', 'Milestone', 'Progress']
}
```

### Variable Substitution

Templates support variable substitution using `{variable}` syntax:

```typescript
const metadata = {
  achievement: 'Master Warrior',
  character: 'Paladin',
  stats: 'STR: 100, DEF: 80, INT: 60',
  result: 'Boss Victory',
  milestone: 'Level 50'
};
```

## Screenshot Configuration

### Element Screenshots

```typescript
const options: ScreenshotOptions = {
  element: document.getElementById('target-element'),
  quality: 0.9,
  format: 'png',
  scale: 2,
  backgroundColor: '#1a1a1a',
  padding: 20,
  watermark: {
    text: 'RPG Balancer',
    position: 'bottom-right',
    opacity: 0.7
  }
};
```

### Tab Screenshots

```typescript
const options: ScreenshotOptions = {
  quality: 0.8,
  format: 'jpeg',
  scale: 1.5,
  backgroundColor: '#000000'
};
```

### Watermark Positions

- `top-left` - Upper left corner
- `top-right` - Upper right corner  
- `bottom-left` - Lower left corner
- `bottom-right` - Lower right corner

## Platform URL Formats

### Twitter/X
```
https://twitter.com/intent/tweet?text={text}&url={url}
```

### Facebook
```
https://www.facebook.com/sharer/sharer.php?u={url}
```

### LinkedIn
```
https://www.linkedin.com/sharing/share-offsite/?url={url}&title={title}&summary={text}
```

### Reddit
```
https://reddit.com/submit?url={url}&title={title}
```

### Telegram
```
https://t.me/share/url?url={url}&text={text}
```

### WhatsApp
```
https://wa.me/?text={text} {url}
```

## Telemetry Events

### Share Events
- `social_share_attempted` - Share attempt started
- `social_share_completed` - Share completed successfully
- `social_share_failed` - Share failed with error

### Screenshot Events
- `screenshot_captured` - Screenshot captured successfully
- `screenshot_failed` - Screenshot capture failed

### Event Payload

```typescript
{
  event: 'social_share_completed',
  data: {
    success: true,
    platform: 'twitter',
    method: 'web-share',
    duration: 1234,
    timestamp: 1641894400000
  }
}
```

## Browser Support

### Web Share API
- ✅ Chrome 61+
- ✅ Firefox 63+
- ✅ Safari 12.1+
- ✅ Edge 79+
- ❌ Internet Explorer

### Clipboard API
- ✅ Chrome 66+
- ✅ Firefox 63+
- ✅ Safari 13.1+
- ✅ Edge 79+
- ❌ Internet Explorer

### Screen Capture API
- ✅ Chrome 72+
- ✅ Firefox 66+
- ❌ Safari (limited)
- ✅ Edge 79+
- ❌ Internet Explorer

## Fallback Strategy

1. **Web Share API** - Primary method on supported browsers
2. **Platform URLs** - Direct platform sharing via popup windows
3. **Clipboard API** - Copy text to clipboard
4. **Custom Share URL** - Fallback to custom share page
5. **Share Dialog** - Final fallback to native share dialog

## Error Handling

### Common Errors
- **Web Share API not supported** - Falls back to platform URLs
- **Popup blocked** - Falls back to clipboard
- **Clipboard denied** - Falls back to custom URL
- **Screen capture denied** - Continues without screenshot
- **Network errors** - Shows error message to user

### Error Recovery

```typescript
const { share, error, clearError } = useSocialShare({
  onShareError: (errorMessage) => {
    console.error('Share failed:', errorMessage);
    // Show user-friendly error message
    showToast(`Sharing failed: ${errorMessage}`, 'error');
  }
});

const handleShare = async () => {
  try {
    await share(shareData);
  } catch (error) {
    // Error is already handled by the hook
    clearError(); // Clear error after user acknowledgment
  }
};
```

## Performance Considerations

### Screenshot Optimization
- Use appropriate quality settings (0.8-0.9 for balance)
- Limit screenshot resolution for mobile devices
- Cache screenshots when possible
- Use WebP format for better compression

### Share Optimization
- Pre-process templates to avoid runtime string operations
- Cache platform configurations
- Debounce share button clicks
- Use lazy loading for share dialogs

## Security Considerations

### Content Security Policy
- Ensure proper CSP headers for external URLs
- Validate user input in templates
- Sanitize URLs before sharing

### Privacy Protection
- No automatic data collection without consent
- Respect user privacy settings
- Clear sensitive data from screenshots
- Follow platform-specific privacy guidelines

## Testing

### Unit Tests
- Core SocialShare class functionality
- Platform URL building
- Template processing
- Screenshot capture
- Error handling

### Hook Tests
- State management
- Callback execution
- Auto-capture functionality
- Error recovery

### Integration Tests
- End-to-end sharing workflows
- Cross-browser compatibility
- Mobile device testing
- Performance benchmarks

### Test Coverage
- 95%+ code coverage target
- All error scenarios tested
- Browser compatibility matrix
- Performance regression testing

## Migration Guide

### From Existing Share System

1. **Replace direct navigator.share calls**:
```typescript
// Old
await navigator.share({ title, text, url });

// New
const { share } = useSocialShare();
await share({ title, text, url });
```

2. **Add template support**:
```typescript
// Old
const text = `Achievement: ${achievement} - Stats: ${stats}`;

// New
await shareWithTemplate('achievement', { achievement, stats });
```

3. **Add screenshot capability**:
```typescript
// New feature
const { captureScreenshot } = useSocialShare();
const screenshot = await captureScreenshot({ element: targetElement });
```

## Troubleshooting

### Common Issues

#### Share Dialog Not Opening
- Check popup blocker settings
- Ensure user interaction trigger
- Verify platform URL format

#### Screenshot Not Working
- Check screen capture permissions
- Ensure element exists in DOM
- Verify browser support

#### Template Variables Not Substituted
- Check metadata object structure
- Verify template variable names
- Ensure proper template ID

#### Telemetry Not Firing
- Check telemetry configuration
- Verify gtag availability
- Ensure events are enabled

### Debug Mode

Enable debug logging:

```typescript
const socialShare = new SocialShare({
  ...config,
  debug: true
});
```

## Future Enhancements

### Planned Features
- **Image Upload Support** - Direct image sharing to platforms
- **Video Sharing** - Short video clip sharing
- **Custom Platform Integration** - Plugin system for new platforms
- **Advanced Analytics** - Detailed share analytics dashboard
- **A/B Testing** - Template performance testing

### Platform Expansion
- **TikTok** - Video sharing integration
- **Instagram** - Story and post sharing
- **Snapchat** - Snap sharing
- **Twitch** - Stream sharing integration

## API Reference

### SocialShare Class

#### Constructor
```typescript
new SocialShare(config?: SocialShareConfig)
```

#### Methods
- `share(data: ShareData): Promise<ShareResult>`
- `captureScreenshot(options?: ScreenshotOptions): Promise<string>`
- `getSupportedPlatforms(): SocialPlatform[]`
- `getAvailableTemplates(): ShareTemplate[]`
- `isSupported(): boolean`

### useSocialShare Hook

#### Parameters
```typescript
useSocialShare(options?: SocialShareOptions)
```

#### Returns
- State: `isSharing`, `isCapturing`, `lastResult`, `screenshot`, `error`
- Actions: `share`, `shareToPlatform`, `shareWithTemplate`, `captureScreenshot`
- Utilities: `clearScreenshot`, `clearError`, `reset`, `getPlatform`, `getTemplate`
- Checks: `isSupported`, `isWebShareSupported`, `isClipboardSupported`, `isScreenCaptureSupported`

### Types

#### ShareData
```typescript
interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  image?: string;
  templateId?: string;
  platformId?: string;
  metadata?: Record<string, any>;
}
```

#### ShareResult
```typescript
interface ShareResult {
  success: boolean;
  platform?: string;
  method: 'web-share' | 'custom-url' | 'clipboard' | 'fallback';
  error?: string;
  screenshot?: string;
  timestamp: number;
}
```

#### ScreenshotOptions
```typescript
interface ScreenshotOptions {
  element?: HTMLElement;
  quality?: number;
  format?: 'png' | 'jpeg' | 'webp';
  scale?: number;
  backgroundColor?: string;
  padding?: number;
  watermark?: {
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    opacity: number;
  };
}
```

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm run test -- SocialShare`
4. Run hook tests: `npm run test -- useSocialShare`

### Code Style
- Follow TypeScript strict mode
- Use JSDoc comments for all public APIs
- Maintain 95%+ test coverage
- Use config-first design principles

### Pull Request Process
1. Create feature branch from main
2. Implement changes with tests
3. Update documentation
4. Run full test suite
5. Submit PR with detailed description

## License

This implementation follows the RPG Balancer project license and coding standards.

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-24  
**Author**: RPG Balancer Team
