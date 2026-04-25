# Interaction Mode Copy Documentation

This document describes the centralized copy system for Idle Village interaction modes.

## Overview

The interaction mode copy system provides:
- Centralized string management for all interaction modes
- Localization support with fallbacks
- Structured metadata for accessibility and context
- Automated synchronization between configuration and documentation

## Configuration

The copy configuration is defined in `src/ui/idleVillage/config/interactionModeCopy.ts`.

### Supported Locales

- `it-IT`: complete
- `en-US`: partial

### Copy Categories

- **mode**: Mode names and descriptions
- **action**: Action buttons and controls
- **help**: Help text and descriptions
- **tooltip**: Tooltip content

## Usage

### Getting Copy

```typescript
import { getCopyText, getCopyDescription } from '@/ui/idleVillage/config/interactionModeCopy';

// Get text for current locale
const modeText = getCopyText('mode.sandbox');

// Get description for current locale
const modeDescription = getCopyDescription('mode.sandbox');
```

### Formatting with Placeholders

```typescript
import { formatCopyText } from '@/ui/idleVillage/config/interactionModeCopy';

// Format with dynamic values
const announcement = formatCopyText('accessibility.mode_changed', { mode: 'Sandbox' });
// Result: "Modalità cambiata in Sandbox"
```

### Accessibility Support

All copy entries include accessibility attributes:
- `ariaLabel` for screen readers
- `ariaDescription` for additional context
- `keyHint` for keyboard shortcuts

```typescript
import { getCopyAccessibility } from '@/ui/idleVillage/config/interactionModeCopy';

const accessibility = getCopyAccessibility('mode.sandbox');
// Returns: { ariaLabel: "Modalità Sandbox", keyHint: "S" }
```

## File Structure

```
src/ui/idleVillage/config/
├── interactionModeCopy.ts          # Main configuration
├── interactionModeCopyTypes.ts     # Type definitions

scripts/localization/
├── interactionModeSync.ts          # Synchronization script

tests/unit/localization/
├── InteractionModeCopySync.test.ts  # Unit tests

docs/idleVillage/
├── interaction_mode_copy.md         # Documentation
```

## CLI Usage

```bash
# Export all locales to JSON
npm run localization:sync --format json --all-locales

# Export specific locale
npm run localization:sync --format json --locale en-US

# Generate documentation
npm run localization:sync --docs
```

## Translation Process

1. Update copy entries in the configuration
2. Run sync script to export translations
3. Review generated files in `data/exports/localization/`
4. Update documentation with `--docs` flag
5. Test with `npm run test:unit -- tests/unit/localization`

## Copy Entries

### Mode Names

- `mode.sandbox`: Sandbox mode
- `mode.planning`: Planning mode
- `mode.execution`: Execution mode
- `mode.analytics`: Analytics mode

### Actions

- `action.switch_mode`: Change mode
- `action.confirm_switch`: Confirm switch
- `action.cancel_switch`: Cancel

### Help Text

- `help.mode_description`: Mode selector description
- `ftue.welcome_title`: FTUE welcome title
- `ftue.mode_selection_title`: FTUE mode selection title
- `ftue.mode_selection_description`: FTUE mode selection description

### Tooltips

- `tooltip.sandbox_info`: Sandbox mode information
- `tooltip.planning_info`: Planning mode information
- `tooltip.execution_info`: Execution mode information
- `tooltip.analytics_info`: Analytics mode information

### Accessibility

- `accessibility.mode_changed`: Mode changed announcement
- `accessibility.mode_selector_open`: Selector opened announcement
- `accessibility.mode_selector_closed`: Selector closed announcement

## Integration with FTUE

The copy system integrates with the First-Time User Experience (FTUE) by providing:

- Localizable welcome messages
- Mode selection descriptions
- Help text for new users
- Accessibility announcements

## Integration with GT-3

The copy system aligns with GT-3 localization guidelines by:

- Providing structured metadata for translation
- Supporting fallback mechanisms
- Including context information for translators
- Maintaining translation status tracking

## Best Practices

1. **Use descriptive keys**: `mode.sandbox` instead of `mode1`
2. **Provide context**: Include usage context in descriptions
3. **Add fallbacks**: Always provide English fallbacks
4. **Include accessibility**: Add ARIA labels and descriptions
5. **Keep text concise**: Respect maxLength constraints
6. **Test translations**: Verify text fits in UI constraints

## Maintenance

- Update copy entries when adding new modes
- Run sync script after copy changes
- Review export files for accuracy
- Update documentation when adding new categories
- Test with different locales regularly
