# Idle Village Drag & Drop Accessibility Guide

## Overview

This document provides comprehensive accessibility guidelines for the Idle Village resident drag and drop system, ensuring WCAG 2.1 AA compliance and optimal user experience for all users, including those using assistive technologies.

## WCAG 2.1 AA Compliance

### 1. Perceivable

#### 1.1 Text Alternatives
- **Resident Cards**: All draggable resident cards include `aria-label` attributes describing the resident's name, status, and key stats
- **Activity Slots**: Drop zones include descriptive `aria-label` attributes indicating slot type, current assignment, and availability
- **Visual Indicators**: All visual drag states have corresponding text announcements for screen readers

#### 1.2 Time-Based Media
- **Drag Animations**: Respect `prefers-reduced-motion` setting
- **Transition Durations**: Reduced to 0.1s or less when reduced motion is preferred
- **Visual Feedback**: Provides non-animated alternatives for motion-sensitive users

#### 1.3 Adaptable
- **Semantic Structure**: Uses proper HTML5 semantic elements (`<section>`, `<article>`, `<header>`)
- **Content Structure**: Maintains logical heading hierarchy and content organization
- **Keyboard Navigation**: Full keyboard access to all drag and drop functionality

#### 1.4 Distinguishable
- **Color Contrast**: All text elements meet minimum 4.5:1 contrast ratio
- **Drag States**: Use more than just color to indicate drag states (opacity, scale, borders)
- **Focus Indicators**: Clear, visible focus outlines for all interactive elements

### 2. Operable

#### 2.1 Keyboard Accessible
- **Tab Navigation**: Logical tab order through resident cards and activity slots
- **Drag Activation**: Space or Enter key to initiate drag operations
- **Drop Targets**: Arrow keys to navigate between drop zones
- **Escape Key**: Cancels active drag operations

#### 2.2 Enough Time
- **No Time Limits**: Drag operations have no time constraints
- **Pause Control**: Users can pause and resume drag operations
- **Animation Control**: Users can disable animations if needed

#### 2.3 Seizures and Physical Reactions
- **No Flashing Content**: No flashing or strobing effects during drag operations
- **Smooth Animations**: All transitions use easing functions that avoid jarring movements
- **Reduced Motion**: Respects user's motion preferences

#### 2.4 Navigable
- **Focus Management**: Proper focus trapping during drag operations
- **Skip Links**: Quick navigation to main content areas
- **Breadcrumbs**: Clear navigation path indicators

### 3. Understandable

#### 3.1 Readable
- **Language Declaration**: Proper `lang` attribute on HTML element
- **Text Content**: Clear, concise labels and instructions
- **Reading Level**: Simple language for complex drag operations

#### 3.2 Predictable
- **Consistent Behavior**: Drag and drop works consistently across all contexts
- **Clear Feedback**: Immediate and understandable feedback for all actions
- **Error Prevention**: Clear warnings before potentially destructive actions

#### 3.3 Input Assistance
- **Instructions**: Clear keyboard instructions for drag operations
- **Error Messages**: Helpful, specific error messages for invalid drops
- **Labels**: All form controls and interactive elements have labels

### 4. Robust

#### 4.1 Compatible
- **AT Support**: Works with major screen readers (NVDA, JAWS, VoiceOver)
- **Browser Support**: Compatible with modern browsers with accessibility APIs
- **Device Independence**: Works with mouse, keyboard, and touch devices

## Implementation Details

### Resident Card Accessibility

```typescript
// Example accessible resident card implementation
<div
  draggable={!isDisabled}
  aria-label={`${resident.name}, ${resident.status}, HP: ${resident.hp}%, Fatigue: ${resident.fatigue}%`}
  role="button"
  tabIndex={isInteractive ? 0 : -1}
  data-testid="pg-card"
  data-worker-id={resident.id}
  data-drag-state={getDragState(resident)}
>
  {/* Card content */}
</div>
```

### Activity Slot Accessibility

```typescript
// Example accessible activity slot implementation
<div
  role="button"
  aria-label={`Activity slot ${slot.label}, ${slot.assignedWorker ? `Assigned to ${slot.assignedWorker}` : 'Unassigned'}, ${slot.isActive ? 'In progress' : 'Available'}`}
  aria-dropeffect={canAcceptDrop ? 'move' : 'none'}
  data-drop-state={dropState}
  data-can-drop={canAcceptDrop}
  tabIndex={0}
>
  {/* Slot content */}
</div>
```

### Screen Reader Announcements

```typescript
// ARIA live regions for drag state announcements
<div
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
  id="drag-announcements"
>
  {dragAnnouncement}
</div>
```

## Keyboard Navigation

### Standard Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| Tab | Navigate to next element | Global |
| Shift+Tab | Navigate to previous element | Global |
| Enter/Space | Activate/select element | Cards, Slots |
| Arrow Keys | Navigate between options | Drop zones |
| Escape | Cancel current operation | Drag mode |
| Home/End | Jump to first/last element | Lists |

### Drag and Drop Keyboard Workflow

1. **Select Resident**: Tab to resident card, press Enter/Space
2. **Initiate Drag**: Press Enter/Space again to start drag
3. **Navigate Drop Zone**: Use arrow keys to select target slot
4. **Confirm Drop**: Press Enter/Space to complete drop
5. **Cancel**: Press Escape to cancel drag operation

## Screen Reader Support

### NVDA Configuration

- **Browse Mode**: Use arrow keys to navigate cards
- **Focus Mode**: Press Enter to interact with draggable elements
- **Virtual Cursor**: Works with standard navigation commands

### JAWS Configuration

- **Virtual Cursor**: Navigate with arrow keys
- **Forms Mode**: Activate with Enter when focused on cards
- **PC Cursor**: Standard navigation mode

### VoiceOver Configuration

- **Voice Control**: "Drag [resident name]" to initiate
- **Rotor**: Use for quick navigation between sections
- **Quick Nav**: Arrow keys for element navigation

## Testing Checklist

### Automated Testing

- [ ] Axe-core accessibility audit passes
- [ ] No WCAG 2.1 AA violations
- [ ] All interactive elements have proper ARIA attributes
- [ ] Color contrast meets 4.5:1 ratio
- [ ] Focus management is correct

### Manual Testing

- [ ] Keyboard navigation works for all features
- [ ] Screen reader announces drag states
- [ ] Reduced motion preferences are respected
- [ ] Touch device accessibility is maintained
- [ ] Error messages are accessible

### User Testing

- [ ] Test with NVDA screen reader
- [ ] Test with JAWS screen reader
- [ ] Test with VoiceOver (macOS/iOS)
- [ ] Test with keyboard-only navigation
- [ ] Test with touch-only devices

## Common Issues and Solutions

### Issue: Drag operations not announced
**Solution**: Implement ARIA live regions for drag state changes
```typescript
const [dragAnnouncement, setDragAnnouncement] = useState('');

useEffect(() => {
  if (isDragging) {
    setDragAnnouncement(`Dragging ${resident.name} to ${targetSlot}`);
  }
}, [isDragging, resident.name, targetSlot]);
```

### Issue: Focus lost during drag
**Solution**: Maintain focus on draggable element or move to drop target
```typescript
const handleDragStart = () => {
  // Keep focus on draggable element
  element.focus();
  // Or move focus to first drop target
  firstDropTarget.focus();
};
```

### Issue: Color-only drag indicators
**Solution**: Add non-color visual indicators
```css
.drag-active {
  opacity: 0.6;
  transform: scale(1.05);
  border: 2px solid #2563eb;
  box-shadow: 0 0 20px rgba(37, 99, 235, 0.4);
}
```

### Issue: No keyboard alternative
**Solution**: Implement keyboard drag and drop
```typescript
const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    startKeyboardDrag();
  }
};
```

## Performance Considerations

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .drag-transition {
    transition: none;
    animation: none;
  }
}
```

### Focus Management
- Minimize focus changes during drag operations
- Use `aria-atomic="true"` for complete announcements
- Avoid excessive DOM updates during drag

### Screen Reader Optimization
- Use `aria-live="polite"` for non-critical updates
- Use `aria-live="assertive"` for critical errors
- Group related announcements with `aria-atomic="true"`

## Browser Compatibility

### Supported Browsers
- **Chrome**: Full support with accessibility APIs
- **Firefox**: Full support with ARIA extensions
- **Safari**: VoiceOver integration tested
- **Edge**: Full support with Windows screen readers

### Legacy Support
- **IE11**: Basic functionality with reduced features
- **Older Browsers**: Graceful degradation to mouse-only

## Mobile Accessibility

### Touch Device Support
- **VoiceOver (iOS)**: Full gesture support
- **TalkBack (Android)**: Complete accessibility
- **Switch Control**: Alternative input methods

### Responsive Design
- **Touch Targets**: Minimum 44px touch targets
- **Spacing**: Adequate spacing between interactive elements
- **Zoom Support**: Maintains accessibility at 200% zoom

## Documentation and Training

### Developer Guidelines
1. Always include `aria-label` for draggable elements
2. Use semantic HTML elements
3. Test with keyboard navigation
4. Verify screen reader announcements
5. Check color contrast ratios

### User Documentation
1. Keyboard shortcut reference
2. Screen reader setup instructions
3. Touch device accessibility guide
4. Troubleshooting common issues

## Continuous Improvement

### Monitoring
- **Analytics**: Track accessibility feature usage
- **User Feedback**: Collect accessibility issues
- **Automated Testing**: Regular accessibility audits
- **Manual Testing**: Periodic screen reader testing

### Updates
- **WCAG Compliance**: Update for new standards
- **Browser Support**: Maintain compatibility
- **User Needs**: Address emerging accessibility requirements
- **Technology**: Adopt new accessibility technologies

### Outstanding Accessibility Gaps (February 2026)

The current Idle Village implementation still lacks several high-priority accessibility affordances. Each item below is a tracked TODO for future prompts:

1. **Colorblind/Contrast Modes** – No runtime toggle or alternate palettes exist yet. Config files (e.g., `dropFeedbackConfig`) define colors statically, so users with color-vision deficiencies cannot switch to daltonism-friendly palettes. *Action:* introduce a config-driven theme override exposed via Settings.
2. **Font Size / UI Scaling** – Documentation for a Settings Panel (NP-220) mentions font-size controls, but no UI or CSS variables are wired in the live game. Text remains fixed, which is problematic for older players. *Action:* add persistent font-scale sliders that adjust typography tokens across Idle Village surfaces.
3. **Rebindable Controls** – Drag/keyboard shortcuts are documented, yet there is no user-facing interface to remap inputs. *Action:* implement a key-binding manager (ideally under `/lab/settings`) and export its JSON so `/game` can honor custom bindings.
4. **Audio Cues for Critical Timers** – Drop feedback config reserves `sound` entries, but audio cues remain disabled and unhooked. Players with ADHD or low attention cues currently get only visual signals. *Action:* design an opt-in audio cue system tied to timers/alerts, respecting reduced-motion/sound settings.
5. **Pause-Friendly Mode (Slow Timers)** – Minimal gameplay only supports full pause/resume. There is no “slow motion” assist mode that lengthens timers without stopping loops. *Action:* add an accessibility flag that scales tick intervals/scheduler cadence while keeping the economy deterministic.

Documenting these gaps ensures new prompts treat them as first-class accessibility requirements instead of nice-to-have polish.

## Resources

### Tools and Libraries
- **axe-core**: Automated accessibility testing
- **playwright**: E2E testing with accessibility
- **react-aria**: Accessible React components
- **testing-library**: Accessibility-focused testing

### Guidelines and Standards
- **WCAG 2.1**: Web Content Accessibility Guidelines
- **ARIA 1.1**: Accessible Rich Internet Applications
- **Section 508**: US federal accessibility standards
- **EN 301 549**: European accessibility standards

### Testing Tools
- **NVDA**: Free screen reader for Windows
- **VoiceOver**: Built-in screen reader for macOS/iOS
- **JAWS**: Commercial screen reader
- **ChromeVox**: Chrome OS screen reader

## Conclusion

This accessibility guide ensures that the Idle Village drag and drop system provides an inclusive experience for all users. By following these guidelines and implementing the recommended solutions, we create a system that meets WCAG 2.1 AA standards and provides excellent usability for users with disabilities.

Regular testing, user feedback, and continuous improvement are essential for maintaining accessibility standards as the system evolves.
