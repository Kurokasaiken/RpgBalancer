# Punch Club Consent Flow & FTUE Documentation

**Since:** NP-074 – Punch Club Consent Flow & FTUE Copy  
**Status:** ✅ Complete  
**Last Updated:** 2026-01-20

## Overview

The Punch Club Consent Flow & FTUE system provides comprehensive privacy compliance and user onboarding for the mobile PWA. This implementation ensures GDPR/CCPA compliance while delivering an engaging first-time user experience with interactive tutorials and consent management.

## Features

### 🛡️ Privacy & Compliance
- **GDPR Compliance**: Full compliance with EU General Data Protection Regulation
- **CCPA Compliance**: California Consumer Privacy Act compliance for US users
- **Age Verification**: Self-declaration age verification with minimum age requirements
- **Consent Categories**: Essential, Analytics, Marketing, and Personalization categories
- **Regional Compliance**: Automatic detection and application of regional requirements
- **Data Portability**: Export/import consent data functionality

### 🎯 FTUE Onboarding
- **Interactive Tutorial**: Step-by-step boxing controls tutorial
- **Feature Highlights**: Showcase of key game features
- **Controls Guide**: Advanced techniques and gesture instructions
- **Progress Tracking**: Visual progress indicators
- **Skip Options**: Optional tutorial with skip functionality
- **Mobile Optimized**: Touch-friendly interface for mobile devices

### 🔧 Technical Features
- **Config-First Design**: All copy and configuration centralized
- **React Hooks**: Custom hooks for state management
- **TypeScript**: Full type safety and IntelliSense support
- **Responsive Design**: Mobile-first responsive layout
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Analytics Integration**: Consent and FTUE event tracking
- **LocalStorage**: Persistent consent and FTUE state

## Architecture

### File Structure
```
src/balancing/config/punchClub/
├── consentConfig.ts                    # Consent configuration and types

src/ui/punchClub/
├── components/
│   ├── ConsentFlow.tsx                 # Consent flow component
│   ├── ConsentFlow.css                 # Consent flow styles
│   ├── FTUEOnboarding.tsx              # FTUE onboarding component
│   └── FTUEOnboarding.css              # FTUE onboarding styles
├── hooks/
│   └── useConsentFlow.ts                # Consent flow hook

tests/unit/punchClub/
└── ConsentFlow.test.tsx                # Comprehensive test suite

docs/punch_club/
└── consent_flow_ftue.md                # Documentation
```

### Core Components

#### ConsentFlow Component
- **Purpose**: Main consent flow UI with step-by-step navigation
- **Features**: Progress tracking, consent toggles, age verification
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive**: Mobile-optimized with touch targets

#### FTUEOnboarding Component
- **Purpose**: First-time user experience with interactive tutorials
- **Features**: Tutorial steps, feature highlights, controls guide
- **Animations**: Smooth transitions and engaging visual effects
- **Mobile**: Touch-friendly interface optimized for mobile devices

#### useConsentFlow Hook
- **Purpose**: State management for consent flow and FTUE
- **Features**: Consent preferences, age verification, progress tracking
- **Persistence**: LocalStorage integration for state persistence
- **Analytics**: Event tracking for consent and FTUE actions

#### Consent Configuration
- **Purpose**: Centralized configuration for consent and FTUE
- **Features**: Regional compliance, consent categories, step definitions
- **Copy Management**: All UI copy centralized and configurable
- **Legal**: Company information and legal document links

## Configuration

### Consent Categories
```typescript
interface ConsentCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabledByDefault: boolean;
  legalBasis: 'consent' | 'legitimate_interest' | 'contractual' | 'legal_obligation';
  retentionPeriod: string;
  purposes: string[];
}
```

#### Default Categories
1. **Essential** (Required): Authentication, security, basic functionality
2. **Analytics** (Optional): Performance monitoring, usage analytics
3. **Marketing** (Optional): Promotional communications, advertising
4. **Personalization** (Optional): Content recommendations, user preferences

### Consent Steps
```typescript
interface ConsentStep {
  id: string;
  title: string;
  description: string;
  type: 'welcome' | 'privacy' | 'analytics' | 'age_verification' | 'final';
  skippable: boolean;
  order: number;
  content?: {
    main?: string;
    details?: string[];
    cta?: string;
    secondaryCta?: string;
  };
}
```

#### Default Steps
1. **Welcome**: Introduction to Punch Club and consent process
2. **Privacy**: Privacy policy and consent category selection
3. **Analytics**: Optional analytics consent with detailed explanation
4. **Age Verification**: Age confirmation for compliance
5. **Final**: Summary and completion

### FTUE Steps
```typescript
interface FTUEStep {
  id: string;
  title: string;
  description: string;
  type: 'welcome' | 'tutorial' | 'features' | 'controls' | 'completion';
  order: number;
  content?: {
    main?: string;
    steps?: Array<{
      title: string;
      description: string;
      action?: string;
    }>;
    features?: Array<{
      name: string;
      description: string;
      icon?: string;
    }>;
    controls?: Array<{
      control: string;
      description: string;
      gesture?: string;
    }>;
  };
  skippable: boolean;
}
```

#### Default FTUE Steps
1. **Welcome**: Introduction to the tutorial
2. **Tutorial**: Basic boxing controls (Jab, Cross, Hook, Block)
3. **Features**: Game features showcase (Career, Training, Multiplayer, Customization)
4. **Controls**: Advanced techniques (Upper Cut, Dodge, Combo, Special Move)
5. **Completion**: Tutorial completion and start playing

### Regional Compliance
```typescript
interface RegionalCompliance {
  gdpr: {
    countries: string[];
    strictConsent: boolean;
    analyticsConsentRequired: boolean;
    marketingConsentRequired: boolean;
  };
  ccpa: {
    countries: string[];
    doNotSellRequired: boolean;
    optOutPreferenceSharing: boolean;
  };
  default: {
    consentMode: 'implicit' | 'explicit';
    analyticsEnabled: boolean;
    marketingEnabled: boolean;
  };
}
```

## Usage

### Basic Implementation
```typescript
import { ConsentFlow } from '@/ui/punchClub/components/ConsentFlow';
import { FTUEOnboarding } from '@/ui/punchClub/components/FTUEOnboarding';

function App() {
  const [showConsent, setShowConsent] = useState(true);
  const [showFTUE, setShowFTUE] = useState(false);

  const handleConsentCompleted = (consent) => {
    console.log('Consent completed:', consent);
    setShowConsent(false);
    setShowFTUE(true);
  };

  const handleConsentSkipped = () => {
    console.log('Consent skipped');
    setShowConsent(false);
  };

  const handleFTUECompleted = () => {
    console.log('FTUE completed');
    setShowFTUE(false);
  };

  const handleFTUESkipped = () => {
    console.log('FTUE skipped');
    setShowFTUE(false);
  };

  return (
    <div>
      <ConsentFlow
        initialCountryCode="US"
        showOnMount={showConsent}
        onCompleted={handleConsentCompleted}
        onSkipped={handleConsentSkipped}
      />
      
      <FTUEOnboarding
        showOnMount={showFTUE}
        onCompleted={handleFTUECompleted}
        onSkipped={handleFTUESkipped}
      />
    </div>
  );
}
```

### Using the Hook
```typescript
import { useConsentFlow } from '@/ui/punchClub/hooks/useConsentFlow';

function ConsentManager() {
  const {
    consent,
    isFlowActive,
    isFlowCompleted,
    currentStepData,
    canProceed,
    compliance,
    nextStep,
    previousStep,
    updateConsent,
    acceptAll,
    rejectAll,
    completeConsentFlow,
    verifyAge,
    exportConsentData,
    importConsentData,
  } = useConsentFlow('US');

  const handleAnalyticsConsent = (enabled: boolean) => {
    updateConsent('analytics', enabled);
  };

  const handleAgeVerification = (age: number) => {
    const verified = verifyAge(age);
    if (verified) {
      nextStep();
    }
  };

  return (
    <div>
      <div>Consent Status: {consent.hasConsented ? 'Granted' : 'Pending'}</div>
      <div>Age Verified: {consent.ageVerified ? 'Yes' : 'No'}</div>
      <div>GDPR Required: {compliance.requiresStrictConsent ? 'Yes' : 'No'}</div>
      
      <button onClick={acceptAll}>Accept All</button>
      <button onClick={rejectAll}>Reject Optional</button>
      <button onClick={completeConsentFlow}>Complete</button>
    </div>
  );
}
```

### Configuration Access
```typescript
import {
  getConsentConfig,
  getConsentCategory,
  getConsentStep,
  getFTUEStep,
  requiresStrictConsent,
  requiresCCPACompliance,
  getDefaultConsentState,
} from '@/balancing/config/punchClub/consentConfig';

// Get full configuration
const config = getConsentConfig();

// Get specific category
const essentialCategory = getConsentCategory('essential');

// Check compliance requirements
const needsGDPR = requiresStrictConsent('DE');
const needsCCPA = requiresCCPACompliance('US');

// Get default consent state
const defaultState = getDefaultConsentState('US');
```

## Testing

### Unit Tests
```bash
# Run consent flow tests
npm run test -- tests/unit/punchClub/ConsentFlow.test.tsx

# Run with coverage
npm run test -- tests/unit/punchClub/ConsentFlow.test.tsx --coverage
```

### Test Coverage
- **Configuration Tests**: Consent categories, steps, regional compliance
- **Hook Tests**: State management, consent updates, age verification
- **Component Tests**: UI rendering, user interactions, accessibility
- **Integration Tests**: End-to-end consent flow and FTUE completion

### Test Scenarios
- Consent category toggles and validation
- Age verification with valid/invalid ages
- Regional compliance (GDPR/CCA) detection
- FTUE tutorial navigation and completion
- LocalStorage persistence and recovery
- Analytics event tracking
- Accessibility features

## Compliance

### GDPR Compliance
- **Explicit Consent**: Required for all non-essential data processing
- **Granular Controls**: Separate consent for each category
- **Right to Withdraw**: Users can change consent at any time
- **Data Portability**: Export/import consent data functionality
- **Legal Basis**: Clear legal basis for each processing category
- **Retention Period**: Defined data retention periods

### CCPA Compliance
- **Do Not Sell**: Option to opt-out of data selling
- **Opt-Out Preference**: Preference sharing with third parties
- **Transparency**: Clear information about data practices
- **Consumer Rights**: Easy access to privacy controls

### Age Verification
- **Minimum Age**: 13+ age requirement
- **Self-Declaration**: User-declared age verification
- **Blocking**: Prevents underage users from proceeding
- **Error Handling**: Clear error messages for invalid inputs

## Analytics Integration

### Consent Events
```typescript
// Consent granted
gtag('event', 'consent_granted', {
  custom_parameter_1: 'US',
  custom_parameter_2: 'granted',
  custom_parameter_3: 'verified',
});

// Consent denied
gtag('event', 'consent_denied', {
  custom_parameter_1: 'US',
  custom_parameter_2: 'denied',
  custom_parameter_3: 'not_verified',
});

// Consent updated
gtag('event', 'consent_updated', {
  custom_parameter_1: 'US',
  custom_parameter_2: 'updated',
  custom_parameter_3: 'verified',
});
```

### FTUE Events
```typescript
// FTUE completed
gtag('event', 'ftue_completed', {
  custom_parameter_1: 'punch-club',
  custom_parameter_2: 'mobile',
});

// FTUE skipped
gtag('event', 'ftue_skipped', {
  custom_parameter_1: 'punch-club',
  custom_parameter_2: 'mobile',
});
```

## Styling

### CSS Architecture
- **Mobile-First**: Responsive design starting from mobile
- **Component-Based**: Modular CSS for each component
- **Theme Variables**: Configurable colors and spacing
- **Animations**: Smooth transitions and micro-interactions
- **Accessibility**: High contrast and reduced motion support

### Customization
```css
/* Theme Variables */
:root {
  --consent-primary: #ff6b35;
  --consent-secondary: #1a1a1a;
  --consent-background: #0a0a0a;
  --consent-text: #ffffff;
  --consent-text-secondary: #a0a0a0;
  --consent-error: #ff4444;
  --consent-warning: #ffaa00;
  --consent-success: #44ff44;
}

/* Responsive Breakpoints */
@media (max-width: 640px) {
  .consent-flow-container {
    border-radius: 0;
    max-height: 100vh;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .consent-flow-container,
  .ftue-container {
    animation: none;
    transition: none;
  }
}

@media (prefers-contrast: high) {
  .consent-flow-container {
    border-color: #ffffff;
  }
}
```

## Performance

### Optimization Features
- **Code Splitting**: Components loaded on demand
- **Lazy Loading**: FTUE loaded only when needed
- **LocalStorage**: Efficient state persistence
- **Memoization**: Optimized re-renders with React hooks
- **Bundle Size**: Minimal impact on bundle size

### Performance Metrics
- **Initial Load**: < 100ms for consent flow initialization
- **Navigation**: < 50ms between steps
- **Storage**: < 5ms for localStorage operations
- **Memory**: < 1MB additional memory usage

## Accessibility

### Features
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader**: ARIA labels and live regions
- **Focus Management**: Proper focus handling and trapping
- **Color Contrast**: WCAG AA compliant contrast ratios
- **Touch Targets**: 44px minimum touch targets
- **Reduced Motion**: Respect user motion preferences

### ARIA Implementation
```typescript
// Focus management
useEffect(() => {
  if (currentStepData && containerRef.current) {
    const firstFocusable = containerRef.current.querySelector('button, [tabindex="0"]');
    firstFocusable?.focus();
  }
}, [currentStepData]);

// Screen reader announcements
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  Step {currentStepIndex + 1} of {totalSteps}
</div>
```

## Localization

### Copy Management
- **Centralized Configuration**: All copy in consentConfig.ts
- **Multi-Language Ready**: Structure supports internationalization
- **Dynamic Content**: Content can be updated without code changes
- **Legal Documents**: Links to localized legal documents

### Implementation Example
```typescript
// In consentConfig.ts
const localizedContent = {
  en: {
    welcome: {
      title: 'Welcome to Punch Club',
      description: 'Your ultimate mobile boxing experience...',
    },
    // ... other content
  },
  es: {
    welcome: {
      title: 'Bienvenido a Punch Club',
      description: 'Tu experiencia de boxeo móvil definitiva...',
    },
    // ... other content
  }
};
```

## Troubleshooting

### Common Issues

#### Consent Flow Not Showing
**Cause**: Component not properly mounted or state not initialized
**Solution**: Check component props and hook initialization
```typescript
// Ensure proper mounting
<ConsentFlow
  initialCountryCode="US"
  showOnMount={true}
  onCompleted={handleCompleted}
/>
```

#### Age Verification Failing
**Cause**: Invalid age input or verification logic error
**Solution**: Check age input validation and minimum age configuration
```typescript
// Verify age input
const age = parseInt(ageInput);
if (isNaN(age) || age < config.ageVerification.minimumAge) {
  setAgeError('Please enter a valid age');
  return;
}
```

#### FTUE Not Starting
**Cause**: FTUE state not properly managed or consent not completed
**Solution**: Check consent completion and FTUE state management
```typescript
// Ensure consent is completed before FTUE
if (consent.hasConsented && !isFTUECompleted) {
  startFTUE();
}
```

#### Analytics Events Not Firing
**Cause**: Analytics not properly initialized or consent not granted
**Solution**: Check analytics setup and consent state
```typescript
// Check analytics availability
if (typeof gtag !== 'undefined' && consent.preferences.analytics) {
  gtag('event', 'consent_granted', { ... });
}
```

### Debug Mode
```typescript
// Enable debug logging
const config = getConsentConfig();
config.analytics.debug = true;

// Console logging
console.log('Consent State:', consent);
console.log('Current Step:', currentStepData);
console.log('Compliance:', compliance);
```

## Maintenance

### Regular Tasks
- **Review Legal Documents**: Update privacy policy and terms links
- **Check Compliance**: Verify GDPR/CCPA requirements haven't changed
- **Update Copy**: Review and update UI copy for clarity
- **Test Analytics**: Ensure tracking events are working correctly
- **Monitor Performance**: Check bundle size and load times

### Version Updates
- **Configuration**: Update version number in consentConfig.ts
- **Legal Links**: Verify all legal document links are current
- **Regional Data**: Update country lists for compliance regions
- **Analytics**: Update measurement IDs and tracking codes

## Security

### Data Protection
- **LocalStorage Encryption**: Sensitive data encryption (optional)
- **Consent Validation**: Server-side consent verification
- **Data Minimization**: Only collect necessary data
- **Secure Storage**: HTTPS required for consent data

### Best Practices
- **Input Validation**: Sanitize all user inputs
- **XSS Prevention**: Escape dynamic content
- **CSRF Protection**: Use secure forms and tokens
- **Data Integrity**: Validate consent data structure

## Integration

### PWA Integration
```typescript
// PWA install prompt integration
const handleInstallPrompt = () => {
  if (consent.hasConsented && consent.preferences.analytics) {
    // Show PWA install prompt
    deferredPrompt.prompt();
  }
};
```

### Analytics Integration
```typescript
// Google Analytics integration
const initializeAnalytics = () => {
  if (consent.preferences.analytics) {
    gtag('config', 'GA_MEASUREMENT_ID', {
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure',
    });
  }
};
```

### Service Worker Integration
```typescript
// Service worker consent check
self.addEventListener('install', (event) => {
  if (consent.preferences.analytics) {
    // Enable analytics caching
    event.waitUntil(
      caches.open('analytics').then((cache) => {
        return cache.addAll(analyticsFiles);
      })
    );
  }
});
```

## Future Enhancements

### Planned Features
- **Multi-Language Support**: Full internationalization
- **Advanced Analytics**: More detailed tracking options
- **Consent Dashboard**: User consent management interface
- **API Integration**: Server-side consent synchronization
- **Privacy Controls**: Enhanced privacy management features

### Technical Improvements
- **Web Components**: Framework-agnostic components
- **Service Worker**: Enhanced offline functionality
- **Performance**: Further optimization and caching
- **Testing**: Expanded test coverage and E2E tests
- **Documentation**: Interactive documentation and demos

## Contributing

When contributing to the Consent Flow & FTUE system:

1. **Follow Config-First**: All changes should be configuration-driven
2. **Test Thoroughly**: Add tests for new features and edge cases
3. **Maintain Accessibility**: Ensure all changes are accessible
4. **Document Changes**: Update documentation for new features
5. **Check Compliance**: Verify privacy compliance isn't compromised

### Code Style
- **TypeScript**: Use strict TypeScript typing
- **React Hooks**: Follow React hooks best practices
- **CSS**: Use modular, component-based CSS
- **Testing**: Write comprehensive unit and integration tests
- **Documentation**: Keep documentation up-to-date

## License

This consent flow and FTUE system is part of the RPG Balancer project and follows the same licensing terms.

## Analytics Dashboard (NP-107)

**Since:** 2026-01-24  
**Status:** ✅ Complete

### Overview
The Consent Analytics Dashboard provides comprehensive analytics for consent flow and FTUE performance with config-first widgets, KPI tracking, and export capabilities.

### Features
- **Real-time Metrics**: Live tracking of consent acceptance, cold start time, and install prompts
- **KPI Monitoring**: Automated threshold checking with visual indicators (≥90% acceptance, <3s cold start)
- **Alert System**: Critical/warning alerts for metrics below targets
- **Time Windows**: Hour, Day, Week, Month, All Time aggregation
- **Device Breakdown**: Analytics segmented by device type
- **Step Completion**: Funnel analysis for each consent step
- **Export**: JSON/CSV export with optional chart data

### Components
- `ConsentDashboard.tsx` - Main dashboard UI with Gilded Observatory theme
- `useConsentAnalytics.ts` - React hook for telemetry aggregation and KPI calculation
- `consentAnalyticsConfig.ts` - Config-first widget and threshold definitions

### KPI Targets
- **Consent Acceptance**: ≥90% (Warning: 85%, Critical: 80%)
- **Cold Start Time**: <3s (Warning: 4s, Critical: 5s)
- **Install Prompt Shown**: ≥80% (Warning: 70%, Critical: 60%)
- **Install Prompt Accepted**: ≥40% (Warning: 30%, Critical: 20%)
- **FTUE Completion**: ≥75% (Warning: 65%, Critical: 55%)
- **Step Drop-off**: <5% (Warning: 10%, Critical: 15%)

### Usage
```typescript
import { ConsentDashboard } from '@/ui/punchClub/analytics/ConsentDashboard';

// Render dashboard
<ConsentDashboard />
```

### ASCII Screenshot
```
┌─────────────────────────────────────────────────────────┐
│  CONSENT FLOW ANALYTICS                    [▼ Last Day] │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Consent Rate │  │ Cold Start   │  │ Install Rate │  │
│  │    90.0%     │  │    2.50s     │  │    43.8%     │  │
│  │ ✓ Target ≥90%│  │ ✓ Target <3s │  │ ✓ Target ≥40%│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  KPI STATUS                                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Metric              Value    Target    Status      │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ Consent acceptance  90.0%    90.0%     [OK]        │ │
│  │ Cold start time     2.50s    3.00s     [OK]        │ │
│  │ Install shown       80.0%    80.0%     [OK]        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  CONSENT STEP COMPLETION                                 │
│  Welcome     ████████████████████████████████ 100%      │
│  Analytics   ██████████████████████████████   95%       │
│  Notify      ████████████████████████████     90%       │
│  Install     ██████████████████████████       85%       │
│  Complete    ████████████████████████         80%       │
└─────────────────────────────────────────────────────────┘
```

---

**Related Documentation:**
- [PC-M3 Mobile PWA Implementation](../punch_club/mobile_pwa.md)
- [GDPR Compliance Guide](../legal/gdpr_compliance.md)
- [CCPA Compliance Guide](../legal/ccpa_compliance.md)
- [NP-074 Kanban Entry](../docs/coordinator/agent_assignments.md)
- [NP-107 Analytics Dashboard](../docs/coordinator/agent_assignments.md)
