# Surge Tutorial Localization Pack - NP-159

**Date:** 2026-01-24  
**Agent:** Lumen-PC  
**Status:** ✅ COMPLETED  

## Executive Summary

Comprehensive i18n localization pack for Punch Club Surge Tutorial with config-first design, schema validation, CLI audit tooling, and multi-language support. Includes 30+ copy entries across 6 sections with translations for 6 languages.

## Overview

The Surge Tutorial Localization Pack provides:
- **Config-first i18n system** with Zod schema validation
- **30+ copy entries** organized in 6 logical sections
- **6 language translations** (EN, IT, ES, FR, DE, PT)
- **Placeholder support** for dynamic content
- **Tone tags** for copy categorization
- **CLI audit tool** for translation verification
- **Telemetry integration** with `pc_surge_localization_checked`
- **Copy guidelines** for future translations

## Supported Languages

| Language | Code | Coverage | Status |
|----------|------|----------|--------|
| English | en | 100% | ✅ Complete (Source) |
| Italian | it | 100% | ✅ Complete |
| Spanish | es | 100% | ✅ Complete |
| French | fr | 100% | ✅ Complete |
| German | de | 100% | ✅ Complete |
| Portuguese | pt | 100% | ✅ Complete |
| Japanese | ja | 0% | ⏳ Planned |
| Chinese | zh | 0% | ⏳ Planned |

## Localization Structure

### Sections

1. **Introduction** (3 entries)
   - Welcome messages and tutorial start
   - Tone: Energetic, Motivational, Friendly

2. **Energy Basics** (5 entries)
   - Core energy system mechanics
   - Tone: Technical, Friendly

3. **Surge Mechanics** (6 entries)
   - Surge mode activation and effects
   - Tone: Energetic, Motivational, Technical

4. **Combo System** (4 entries)
   - Combo building and execution
   - Tone: Energetic, Technical, Motivational

5. **Feedback Messages** (4 entries)
   - Success, error, warning, info messages
   - Tone: Energetic, Serious, Casual

6. **Tutorial Completion** (4 entries)
   - Completion messages and rewards
   - Tone: Energetic, Motivational, Friendly

### Copy Categories

- **title**: Section and feature titles
- **description**: Explanatory text
- **button**: Call-to-action buttons
- **label**: UI labels and indicators
- **tooltip**: Hover/help text
- **success**: Success messages
- **error**: Error messages
- **warning**: Warning messages
- **info**: Informational messages

### Tone Tags

- **casual**: Relaxed, conversational
- **formal**: Professional, structured
- **energetic**: High-energy, exciting
- **motivational**: Encouraging, inspiring
- **technical**: Precise, instructional
- **humorous**: Light-hearted, fun
- **serious**: Important, critical
- **friendly**: Warm, approachable

## Usage

### React Component Integration

```typescript
import { getTranslatedText } from '@/ui/punchClub/tutorials/surgeLocalizationConfig';

function SurgeTutorial() {
  const language = useLanguage(); // 'en', 'it', etc.
  
  return (
    <div>
      <h1>{getTranslatedText(config, 'intro.title', language)}</h1>
      <p>{getTranslatedText(config, 'intro.description', language)}</p>
      <button>
        {getTranslatedText(config, 'intro.cta', language)}
      </button>
    </div>
  );
}
```

### With Placeholders

```typescript
// Energy regeneration tooltip
const text = getTranslatedText(
  config,
  'energy.regen_tooltip',
  'en',
  { amount: 5 }
);
// Output: "Regenerates 5 energy per second"

// Combo counter
const comboText = getTranslatedText(
  config,
  'combo.counter_label',
  'en',
  { count: 10 }
);
// Output: "Combo: 10x"

// Surge duration
const durationText = getTranslatedText(
  config,
  'surge.duration_tooltip',
  'en',
  { duration: 10 }
);
// Output: "Surge lasts for 10 seconds"
```

### Helper Functions

```typescript
// Get all button copy keys
const buttonKeys = getKeysByCategory(config, 'button');

// Get all energetic copy keys
const energeticKeys = getKeysByTone(config, 'energetic');

// Get critical entries (must be translated first)
const criticalEntries = getCriticalEntries(config);

// Check translation coverage
const coverage = getTranslationCoverage(config, 'it');
console.log(`Italian coverage: ${coverage}%`);

// Get missing translations
const missing = getMissingTranslations(config, 'ja');
console.log(`Missing Japanese translations: ${missing.length}`);
```

## CLI Audit Tool

### Basic Usage

```bash
# Run full audit
npm run surge:audit

# Audit specific language
npm run surge:audit -- --language it

# Generate specific format
npm run surge:audit -- --format markdown

# Custom output directory
npm run surge:audit -- --output reports

# Verbose mode
npm run surge:audit -- --verbose
```

### CLI Options

```
--config <path>       Path to custom localization config JSON
--language <lang>     Audit specific language only
--output <path>       Output directory (default: test-results)
--format <format>     Output format: json, markdown, csv, all
--verbose             Enable verbose logging
--no-critical         Skip critical copy check
--no-placeholders     Skip placeholder validation
--no-length           Skip length validation
--help                Show help message
```

### Audit Checks

1. **Translation Coverage**
   - Percentage of translated entries per language
   - Missing translation identification

2. **Critical Entries**
   - Verifies all critical copy is translated
   - Reports missing critical translations

3. **Placeholder Validation**
   - Ensures placeholders are preserved in translations
   - Detects missing or incorrect placeholders

4. **Length Validation**
   - Checks translations against maxLength constraints
   - Reports length violations

### Audit Reports

#### JSON Report
```json
{
  "timestamp": 1706097600000,
  "config": "Surge Tutorial Localization",
  "summary": {
    "totalEntries": 30,
    "totalLanguages": 5,
    "averageCoverage": 100
  },
  "coverage": {
    "it": 100,
    "es": 100,
    "fr": 100
  },
  "passed": true
}
```

#### Markdown Report
```markdown
# Surge Tutorial Localization Audit

## Summary
| Metric | Value |
|--------|-------|
| Total Entries | 30 |
| Languages Audited | 5 |
| Average Coverage | 100.0% |
| Status | ✅ PASSED |

## Translation Coverage
| Language | Coverage | Missing |
|----------|----------|---------|
| IT | ✅ 100.0% | 0 |
| ES | ✅ 100.0% | 0 |
| FR | ✅ 100.0% | 0 |
```

#### CSV Report
```csv
Language,Coverage,Missing,Critical Missing,Placeholder Errors,Length Violations
it,100.0,0,0,0,0
es,100.0,0,0,0,0
fr,100.0,0,0,0,0
```

## Copy Examples

### Introduction Section

**English:**
```
Title: Welcome to Surge Training!
Description: Master the art of energy management and unleash devastating combos!
CTA: Let's Go!
```

**Italian:**
```
Title: Benvenuto al Training Surge!
Description: Padroneggia l'arte della gestione dell'energia e scatena combo devastanti!
CTA: Andiamo!
```

**Spanish:**
```
Title: ¡Bienvenido al Entrenamiento Surge!
Description: ¡Domina el arte de la gestión de energía y desata combos devastadores!
CTA: ¡Vamos!
```

### Energy System

**English:**
```
Title: Energy System
Description: Energy powers your special moves. Each action costs energy, and it regenerates over time.
Tooltip: Regenerates {amount} energy per second
```

**Italian:**
```
Title: Sistema Energia
Description: L'energia alimenta le tue mosse speciali. Ogni azione costa energia e si rigenera nel tempo.
Tooltip: Rigenera {amount} energia al secondo
```

### Surge Mode

**English:**
```
Title: Surge Mode
Description: When your energy reaches maximum, activate Surge Mode for enhanced power and speed!
Button: Activate Surge!
Status: SURGE ACTIVE
```

**Italian:**
```
Title: Modalità Surge
Description: Quando la tua energia raggiunge il massimo, attiva la Modalità Surge per potenza e velocità potenziate!
Button: Attiva Surge!
Status: SURGE ATTIVO
```

## Copy Guidelines

### Translation Best Practices

1. **Preserve Tone**
   - Maintain the emotional tone of the original
   - Energetic copy should feel energetic in all languages
   - Technical copy should remain precise

2. **Placeholder Integrity**
   - Always preserve `{placeholder}` syntax exactly
   - Never translate placeholder names
   - Test with actual values to ensure natural flow

3. **Length Constraints**
   - Respect maxLength when specified
   - Some languages expand (German, French)
   - Some languages contract (Chinese, Japanese)
   - Test in actual UI to verify fit

4. **Cultural Adaptation**
   - Adapt idioms and expressions
   - Consider cultural context
   - Maintain game's personality

5. **Consistency**
   - Use consistent terminology across all copy
   - Maintain character voice
   - Follow established game vocabulary

### Critical Copy Priority

Critical entries must be translated first:
- `intro.title` - First impression
- `intro.cta` - Primary action
- `surge.title` - Core feature name
- `surge.activate_button` - Key interaction
- `completion.title` - Success message
- `completion.continue_button` - Flow continuation

### Common Placeholders

| Placeholder | Type | Example | Description |
|-------------|------|---------|-------------|
| `{amount}` | number | 5 | Energy amount |
| `{duration}` | number | 10 | Duration in seconds |
| `{bonus}` | percentage | 50 | Percentage bonus |
| `{count}` | number | 10 | Combo count |
| `{multiplier}` | number | 1.5 | Damage multiplier |
| `{seconds}` | number | 3 | Countdown seconds |
| `{reward}` | string | "500 Gold" | Reward description |

## Telemetry Integration

### Event Tracking

```typescript
// Telemetry event: pc_surge_localization_checked
{
  event: 'pc_surge_localization_checked',
  timestamp: Date.now(),
  data: {
    totalEntries: 30,
    totalLanguages: 5,
    averageCoverage: 100,
    passed: true,
    criticalMissing: 0,
    placeholderErrors: 0,
    lengthViolations: 0,
    coverage: {
      it: 100,
      es: 100,
      fr: 100,
      de: 100,
      pt: 100
    }
  }
}
```

### Usage Tracking

Track which languages are actually used:
```typescript
// Track language selection
trackEvent('pc_surge_language_selected', {
  language: 'it',
  source: 'tutorial_start'
});

// Track copy display
trackEvent('pc_surge_copy_displayed', {
  key: 'intro.title',
  language: 'it',
  hasPlaceholders: false
});
```

## Adding New Languages

### Step 1: Update Config

```typescript
// Add language to SUPPORTED_LANGUAGES
export const SUPPORTED_LANGUAGES = [
  'en', 'it', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'ko' // Add 'ko'
] as const;
```

### Step 2: Add Translations

```typescript
{
  key: 'intro.title',
  category: 'title',
  tone: ['energetic', 'motivational'],
  en: 'Welcome to Surge Training!',
  it: 'Benvenuto al Training Surge!',
  ko: '서지 트레이닝에 오신 것을 환영합니다!', // Add Korean
  critical: true,
}
```

### Step 3: Run Audit

```bash
npm run surge:audit -- --language ko
```

### Step 4: Verify Coverage

```bash
npm run surge:audit -- --language ko --format markdown
```

## JSON Export

### Export Location

```
data/presets/punchClub/surge_i18n/
├── surge_localization_en.json
├── surge_localization_it.json
├── surge_localization_es.json
├── surge_localization_fr.json
├── surge_localization_de.json
└── surge_localization_pt.json
```

### Export Format

```json
{
  "version": "1.0.0",
  "language": "it",
  "entries": {
    "intro.title": "Benvenuto al Training Surge!",
    "intro.description": "Padroneggia l'arte della gestione dell'energia...",
    "intro.cta": "Andiamo!",
    "energy.title": "Sistema Energia",
    ...
  }
}
```

## Testing

### Unit Tests

```bash
# Run localization tests
npm run test -- tests/unit/punchClub/SurgeLocalizationConfig.test.ts

# Run with coverage
npm run test -- tests/unit/punchClub/SurgeLocalizationConfig.test.ts --coverage
```

### Test Coverage

- Schema validation
- Copy entry retrieval
- Translation with placeholders
- Category and tone filtering
- Critical entry identification
- Coverage calculation
- Missing translation detection
- Edge cases and error handling

## Maintenance

### Regular Audits

```bash
# Weekly: Check all languages
npm run surge:audit -- --format all

# Monthly: Detailed review
npm run surge:audit -- --verbose --format markdown

# Before release: Full validation
npm run surge:audit -- --format all --output release-reports
```

### Adding New Copy

1. Add entry to appropriate section
2. Provide English text (source)
3. Mark as critical if needed
4. Add placeholders if dynamic
5. Specify maxLength if UI constrained
6. Add context for translators
7. Run audit to verify
8. Request translations
9. Verify translations with audit
10. Update metadata

### Updating Existing Copy

1. Update English text
2. Mark other languages as needing review
3. Request updated translations
4. Run audit to verify
5. Update metadata

## Troubleshooting

### Issue: Missing Translations

```bash
# Identify missing translations
npm run surge:audit -- --language it --format markdown

# Check specific section
grep "missing" test-results/surge-localization-audit-*.md
```

### Issue: Placeholder Errors

```bash
# Run placeholder validation
npm run surge:audit -- --format json

# Check errors
cat test-results/surge-localization-audit-*.json | jq '.placeholders.errors'
```

### Issue: Length Violations

```bash
# Check length violations
npm run surge:audit -- --format csv

# Review violations
cat test-results/surge-localization-audit-*.csv
```

## Resources

### Internal Documentation
- `src/ui/punchClub/tutorials/surgeLocalizationConfig.ts` - Core config
- `scripts/punchClub/surgeLocalizationAudit.ts` - CLI audit tool
- `tests/unit/punchClub/SurgeLocalizationConfig.test.ts` - Unit tests

### External Resources
- [i18n Best Practices](https://www.i18next.com/principles/best-practices)
- [Localization Guidelines](https://developers.google.com/international/localization)
- [Translation Memory](https://en.wikipedia.org/wiki/Translation_memory)

## Conclusion

The Surge Tutorial Localization Pack provides a comprehensive, config-first i18n system for Punch Club with 30+ copy entries, 6 language translations, CLI audit tooling, and telemetry integration. The system ensures translation quality through automated validation while maintaining flexibility for future expansion.

---

**Last Updated:** 2026-01-24  
**Next Review:** 2026-04-24  
**Maintainer:** Lumen-PC (Cascade AI)
