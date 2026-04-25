# Theater Overlay Accessibility Documentation

## Overview
Comprehensive accessibility documentation for the Idle Village Theater Overlay, covering WCAG 2.1 AA compliance, ARIA patterns, keyboard navigation, and screen reader support.

## WCAG 2.1 AA Checklist

### Perceivable

#### 1.1 Text Alternatives
- ✅ **Hover Timers**: ARIA labels for timer countdown (`aria-label="Activity timer: 5 seconds remaining"`)
- ✅ **Mini-Cards**: Alt text for resident portraits
- ✅ **Status Icons**: Descriptive ARIA labels for activity states
- ⚠️ **Progress Indicators**: Visual progress bars need ARIA `role="progressbar"` with `aria-valuenow`

#### 1.3 Adaptable
- ✅ **Semantic Structure**: Proper heading hierarchy (h1 → h2 → h3)
- ✅ **Reading Order**: Logical DOM order matches visual presentation
- ✅ **Relationships**: ARIA `aria-describedby` links timers to activities

#### 1.4 Distinguishable
- ✅ **Color Contrast**: All text meets 4.5:1 ratio (Style Laboratory tokens)
- ✅ **Resize Text**: Layout supports 200% zoom without loss of functionality
- ✅ **Focus Indicators**: Visible focus rings on all interactive elements
- ⚠️ **Hover Content**: Hover timers need persistent display option for low vision users

### Operable

#### 2.1 Keyboard Accessible
- ✅ **Keyboard Navigation**: Tab order follows visual layout
- ✅ **No Keyboard Trap**: Escape key closes overlay
- ✅ **Focus Management**: Focus returns to trigger element on close
- ✅ **Shortcuts**: Documented keyboard shortcuts (Esc, Tab, Enter, Space)

#### 2.2 Enough Time
- ⚠️ **Adjustable Timers**: Hover timers should be pausable for users who need more time
- ✅ **No Time Limits**: No session timeouts in overlay

#### 2.4 Navigable
- ✅ **Skip Links**: Skip to main content available
- ✅ **Page Titled**: Overlay has descriptive `aria-label`
- ✅ **Focus Order**: Logical tab sequence
- ✅ **Link Purpose**: All interactive elements have clear labels

### Understandable

#### 3.1 Readable
- ✅ **Language**: `lang` attribute set on overlay container
- ✅ **Unusual Words**: Tooltips for game-specific terms

#### 3.2 Predictable
- ✅ **On Focus**: No context changes on focus
- ✅ **On Input**: No unexpected behavior on interaction
- ✅ **Consistent Navigation**: Navigation pattern consistent across overlays

#### 3.3 Input Assistance
- ✅ **Error Identification**: Clear error messages for invalid actions
- ✅ **Labels**: All form controls have associated labels
- ✅ **Error Suggestions**: Helpful error recovery suggestions

### Robust

#### 4.1 Compatible
- ✅ **Valid HTML**: No parsing errors
- ✅ **Name, Role, Value**: All custom components have proper ARIA attributes
- ✅ **Status Messages**: ARIA live regions for dynamic updates

## ARIA Patterns

### Dialog (Modal) Pattern
```typescript
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="theater-title"
  aria-describedby="theater-description"
>
  <h2 id="theater-title">Theater Overlay</h2>
  <p id="theater-description">Manage resident activities and assignments</p>
  {/* Content */}
</div>
```

### Timer Pattern
```typescript
<div
  role="timer"
  aria-live="polite"
  aria-atomic="true"
  aria-label={`Activity timer: ${seconds} seconds remaining`}
>
  {formatTime(seconds)}
</div>
```

### Progress Bar Pattern
```typescript
<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Activity progress"
>
  <div style={{ width: `${progress}%` }} />
</div>
```

### Live Region Pattern
```typescript
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {statusMessage}
</div>
```

## Keyboard Navigation

### Primary Controls
| Key | Action | Context |
|-----|--------|---------|
| `Tab` | Move focus forward | All interactive elements |
| `Shift+Tab` | Move focus backward | All interactive elements |
| `Enter` | Activate element | Buttons, links |
| `Space` | Activate element | Buttons, checkboxes |
| `Escape` | Close overlay | Anywhere in overlay |
| `Arrow Keys` | Navigate cards | Mini-card grid |
| `Home` | First element | Card grid |
| `End` | Last element | Card grid |

### Narration Toggle
| Key | Action |
|-----|--------|
| `N` | Toggle narration on/off |
| `Ctrl+N` | Open narration settings |

## Screen Reader Support

### Announcements

#### Activity Started
```
"Activity started: Gathering Wood. Resident: John. Duration: 5 minutes."
```

#### Timer Update (every 30 seconds)
```
"Activity timer: 2 minutes 30 seconds remaining."
```

#### Activity Completed
```
"Activity completed: Gathering Wood. Rewards: 10 wood, 5 experience."
```

#### Error State
```
"Error: Cannot assign resident. Resident is already assigned to another activity."
```

### Narration Copy Configuration

```typescript
export const NARRATION_CONFIG = {
  activityStarted: (activity: string, resident: string, duration: number) =>
    `Activity started: ${activity}. Resident: ${resident}. Duration: ${formatDuration(duration)}.`,
  
  timerUpdate: (remaining: number) =>
    `Activity timer: ${formatDuration(remaining)} remaining.`,
  
  activityCompleted: (activity: string, rewards: string) =>
    `Activity completed: ${activity}. Rewards: ${rewards}.`,
  
  errorMessage: (error: string) =>
    `Error: ${error}`,
  
  focusAnnouncement: (element: string) =>
    `Focused on ${element}.`,
};
```

## Focus Management

### Focus Trap
The overlay implements a focus trap to prevent keyboard users from tabbing outside the modal:

```typescript
const focusTrap = useFocusTrap({
  enabled: isOpen,
  initialFocus: firstFocusableElement,
  returnFocus: triggerElement,
  escapeDeactivates: true,
});
```

### Focus Restoration
When the overlay closes, focus returns to the element that opened it:

```typescript
const handleClose = () => {
  setIsOpen(false);
  triggerElement?.focus();
};
```

## Hover Timer Accessibility

### Visual Indicators
- **Color**: Amber progress bar (Style Laboratory `amber-400`)
- **Shape**: Circular progress indicator
- **Text**: Numeric countdown in seconds

### Non-Visual Alternatives
- **ARIA Timer**: `role="timer"` with live region updates
- **Screen Reader**: Announces remaining time every 30 seconds
- **Keyboard**: Spacebar pauses/resumes timer (when focused)

### Configuration
```typescript
export const HOVER_TIMER_CONFIG = {
  // Accessibility
  announceInterval: 30000, // Announce every 30 seconds
  pauseOnFocus: true, // Pause when timer receives focus
  showTextualCountdown: true, // Show numeric countdown
  
  // Visual
  progressColor: 'amber-400',
  warningThreshold: 5, // Show warning at 5 seconds
  warningColor: 'red-500',
};
```

## Mini-Card Accessibility

### Card Structure
```typescript
<article
  role="article"
  aria-labelledby={`resident-${id}-name`}
  aria-describedby={`resident-${id}-status`}
  tabIndex={0}
>
  <img
    src={portrait}
    alt={`${name} portrait`}
    role="img"
  />
  <h3 id={`resident-${id}-name`}>{name}</h3>
  <p id={`resident-${id}-status`}>{status}</p>
</article>
```

### Interaction States
- **Default**: `tabindex="0"`, focusable
- **Selected**: `aria-selected="true"`
- **Disabled**: `aria-disabled="true"`, `tabindex="-1"`
- **Busy**: `aria-busy="true"` during loading

## Density Modes

### Compact Mode
- **Font Size**: 14px (minimum for WCAG AA)
- **Touch Targets**: 44×44px minimum
- **Spacing**: 8px between elements

### Normal Mode (Default)
- **Font Size**: 16px
- **Touch Targets**: 48×48px
- **Spacing**: 12px between elements

### Comfortable Mode
- **Font Size**: 18px
- **Touch Targets**: 56×56px
- **Spacing**: 16px between elements

## Telemetry

### Accessibility Events

**iv_theater_a11y_checked**
```typescript
{
  timestamp: number;
  checkType: 'keyboard_nav' | 'screen_reader' | 'focus_trap' | 'timer_pause';
  passed: boolean;
  details: string;
}
```

**iv_theater_narration_toggled**
```typescript
{
  timestamp: number;
  enabled: boolean;
  method: 'keyboard' | 'button' | 'settings';
}
```

**iv_theater_timer_paused**
```typescript
{
  timestamp: number;
  timerId: string;
  remainingSeconds: number;
  reason: 'focus' | 'keyboard' | 'user_request';
}
```

## Testing Strategy

### Automated Tests
1. **Playwright A11y**: Axe-core integration for WCAG violations
2. **RTL**: ARIA attribute verification
3. **Keyboard Navigation**: Tab order and shortcuts
4. **Screen Reader**: Announcement verification

### Manual Tests
1. **Screen Reader**: NVDA, JAWS, VoiceOver testing
2. **Keyboard Only**: Complete workflow without mouse
3. **High Contrast**: Windows High Contrast Mode
4. **Zoom**: 200% browser zoom

## Known Issues & Roadmap

### Current Issues
1. ⚠️ **Hover Timers**: Not pausable on focus (planned for v2)
2. ⚠️ **Progress Bars**: Missing `aria-valuenow` updates (fix in progress)
3. ⚠️ **Mobile**: Touch target size below 44px in compact mode (design review needed)

### Planned Improvements
1. **Narration Customization**: User-configurable announcement frequency
2. **Timer Pause**: Automatic pause on focus for accessibility
3. **Reduced Motion**: Respect `prefers-reduced-motion` for animations
4. **High Contrast**: Enhanced support for Windows High Contrast Mode

## Configuration Examples

### Enable Accessibility Features
```typescript
const theaterConfig = {
  accessibility: {
    enableNarration: true,
    announceInterval: 30000,
    pauseTimersOnFocus: true,
    showTextualCountdowns: true,
    respectReducedMotion: true,
    minTouchTargetSize: 44,
  },
  
  narration: {
    activityStarted: NARRATION_CONFIG.activityStarted,
    timerUpdate: NARRATION_CONFIG.timerUpdate,
    activityCompleted: NARRATION_CONFIG.activityCompleted,
    errorMessage: NARRATION_CONFIG.errorMessage,
  },
  
  density: 'normal', // 'compact' | 'normal' | 'comfortable'
};
```

### Disable Animations (Reduced Motion)
```typescript
const theaterConfig = {
  animations: {
    enabled: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    duration: 300,
    easing: 'ease-out',
  },
};
```

## ASCII Diagram: Focus Flow

```
┌─────────────────────────────────────────────┐
│  Theater Overlay (role="dialog")           │
│  ┌───────────────────────────────────────┐ │
│  │ [X] Close Button (1)                  │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ Activity Grid                         │ │
│  │  ┌─────┐ ┌─────┐ ┌─────┐             │ │
│  │  │ (2) │ │ (3) │ │ (4) │  ← Cards    │ │
│  │  └─────┘ └─────┘ └─────┘             │ │
│  │  ┌─────┐ ┌─────┐ ┌─────┐             │ │
│  │  │ (5) │ │ (6) │ │ (7) │             │ │
│  │  └─────┘ └─────┘ └─────┘             │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ [Toggle Narration] (8)                │ │
│  │ [Settings] (9)                        │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

Tab Order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → (loops back to 1)
Escape: Closes overlay, focus returns to trigger
```

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Style Laboratory Tokens](../../src/balancing/config/styleLabTokens.ts)
- [Theater Controller API](../../src/ui/idleVillage/controllers/useTheaterController.ts)

## Recommendations for Future Variants

### Overlay Variants
1. **Quest Overlay**: Apply same focus trap and narration patterns
2. **Inventory Overlay**: Use grid navigation with arrow keys
3. **Map Overlay**: Implement spatial navigation with ARIA landmarks

### Best Practices
1. **Always** implement focus trap for modal overlays
2. **Always** provide keyboard shortcuts for common actions
3. **Always** announce dynamic content changes via ARIA live regions
4. **Always** test with actual screen readers (NVDA, JAWS, VoiceOver)
5. **Never** hardcode ARIA text - use config-first approach
6. **Never** skip accessibility tests in CI/CD pipeline
7. **Never** rely solely on automated testing - manual testing is essential

## Maintenance

### Regular Audits
- **Monthly**: Automated Axe-core scans
- **Quarterly**: Manual screen reader testing
- **Annually**: Full WCAG 2.1 AA audit

### Update Triggers
- New overlay features
- Style Laboratory token changes
- WCAG guideline updates
- User feedback on accessibility issues
