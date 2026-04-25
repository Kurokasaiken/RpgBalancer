# GT-3 Mobile Playtest Checklist: Punch Club

**Document ID:** GT-3-mobile-playtest-checklist
**Version:** 1.0
**Last Updated:** 2026-01-11
**Owner:** QA Guild (Mobile Testing Pod)

## Overview

This document provides the official GT-3 (Game Testing 3) checklist for mobile playtesting of the Punch Club feature in Idle Village. The checklist ensures consistent testing procedures, KPI validation against Mind Studios targets, and proper telemetry logging for regression detection.

### Scope
- **Feature:** Punch Club Gym→Rest→Bout cycle
- **Platform:** Mobile (iOS Safari, Chrome Mobile)
- **Metrics:** Cycle duration, tap counts, resource deltas, risk visualization
- **Integration:** Mobile playtest logger, telemetry export, PWA compatibility

### Prerequisites

#### Environment Setup
- **Node.js:** 20.19.6 (via .nvmrc)
- **Device:** Physical mobile device (iPhone/Android) or emulator
- **Browser:** Chrome Mobile or iOS Safari (incognito mode)
- **Network:** Stable WiFi (avoid cellular for consistent results)
- **Permissions:** Camera/microphone disabled, notifications allowed for PWA

#### Software Dependencies
- **Logger Script:** `scripts/mobilePlaytestLogger.ts` (tsx compatible)
- **Test Data:** Preset "Punch Club" active in Village Sandbox
- **Telemetry:** `window.__sandboxTelemetry` hook enabled
- **Dev Mode:** `?dev=1` URL parameter for diagnostics

#### Tester Qualifications
- Familiar with Idle Village mechanics
- Experience with mobile testing
- Knowledge of Mind Studios KPI targets
- Access to physical mobile device

## Playtest Checklist

### Phase 1: Environment Validation

#### Device & Browser Setup
- [ ] **Device Model:** Record device model (e.g., "iPhone 15 Pro", "Pixel 8")
- [ ] **OS Version:** Note iOS/Android version
- [ ] **Browser Version:** Chrome/Safari version
- [ ] **Viewport:** Confirm 375px+ width (mobile breakpoint)
- [ ] **Incognito Mode:** Enabled to avoid cached data interference
- [ ] **Network:** WiFi connected, stable connection confirmed

#### Application Loading
- [ ] **URL Access:** Navigate to `/punch-club` with `?dev=1`
- [ ] **Load Time:** Initial page load < 3 seconds
- [ ] **Preset Loading:** "Punch Club" preset auto-selected
- [ ] **Telemetry Hook:** `window.__sandboxTelemetry` object exists
- [ ] **PWA Banner:** Service worker registration successful
- [ ] **Touch Events:** Touch interactions respond within 100ms

### Phase 2: Logger Setup

#### Logger Initialization
- [ ] **Command Execution:**
  ```bash
  npm run playtest:log -- --session punch-club-mobile-gt3 \
    --tester <your-tester-id> \
    --device <device-model> \
    --interactive
  ```
- [ ] **Session ID:** Auto-generated or custom (format: punch-club-mobile-gt3-YYYYMMDD-HHMM)
- [ ] **Tester ID:** Consistent identifier (e.g., "QA-A1", "MobileTester-01")
- [ ] **Telemetry Import:** Logger detects and imports telemetry data
- [ ] **Consent Banner:** Accept telemetry collection for PWA

#### Logger Validation
- [ ] **CLI Prompts:** All required fields available (cycle duration, tap counts, etc.)
- [ ] **Default Values:** Sensible defaults loaded from telemetry
- [ ] **Schema Validation:** No Zod validation errors on input
- [ ] **Output Directory:** `data/runs/mobile_playtests/` created
- [ ] **Help Command:** `npm run playtest:log -- --help` displays usage

### Phase 3: Core Gameplay Testing

#### Gym Phase (Activity Selection)
- [ ] **Screen Load:** Gym activities displayed within 500ms
- [ ] **Activity Count:** 3-5 activities visible (config-dependent)
- [ ] **Visual Feedback:** Activity cards highlight on touch
- [ ] **Picker Opening:** Tap activity triggers WorkerPickerSheet
- [ ] **Picker Animation:** Bottom sheet slides up smoothly (< 300ms)
- [ ] **Resident List:** Compatible residents displayed with compatibility scores
- [ ] **Assignment CTA:** "Assegna" button visible and enabled
- [ ] **Tap Count:** Record taps needed for assignment (target: ≤ 3)
- [ ] **Assignment Feedback:** Success highlight (green) appears
- [ ] **Picker Auto-Close:** Sheet closes automatically after assignment
- [ ] **Activity Progress:** Assigned resident appears on activity card

#### Rest Phase (Recovery)
- [ ] **Phase Transition:** Automatic transition to Rest screen
- [ ] **Duration Display:** Rest timer counts down accurately
- [ ] **Risk Visualization:** Injury/Death stripes visible and proportional
- [ ] **Stripe Colors:** Yellow (injury) and red (death) clearly distinguishable
- [ ] **Percentage Labels:** % values readable without zoom
- [ ] **No Interaction:** Rest phase non-interactive (auto-progress)
- [ ] **Resource Preview:** Gold/Food deltas shown if available

#### Bout Phase (Combat)
- [ ] **Phase Transition:** Automatic transition to Bout screen
- [ ] **Combat Mechanics:** Turn-based combat functional
- [ ] **Touch Controls:** Combat inputs respond to touch
- [ ] **Visual Feedback:** Combat state changes visible
- [ ] **Completion:** Bout ends with win/loss state
- [ ] **Cycle Reset:** Return to Gym screen for next cycle
- [ ] **Resource Update:** Gold/Food values update based on outcome

### Phase 4: KPI Validation

#### Performance Metrics
- [ ] **Cycle Duration:** Complete Gym→Rest→Bout < 90 seconds (target: < 45s)
- [ ] **Assignment Latency:** Time from tap to assignment < 450ms
- [ ] **Picker Close Rate:** Sheet closes within 1s after assignment (≥ 98%)
- [ ] **Tap Efficiency:** Average taps per assignment ≤ 3
- [ ] **Resource Generation:** +10 gold, +2 food minimum per cycle

#### Mobile-Specific KPIs
- [ ] **Touch Targets:** All interactive elements ≥ 44px
- [ ] **Viewport Adaptation:** Layout adjusts properly on rotation
- [ ] **Memory Usage:** No memory leaks during 5+ cycles
- [ ] **Battery Impact:** App doesn't drain battery excessively
- [ ] **Network Efficiency:** Minimal data usage during cycles

### Phase 5: Logger Data Collection

#### Manual Data Entry
- [ ] **Cycle Duration Samples:** Record 3-5 cycle times (comma-separated)
- [ ] **Tap Count Samples:** Record taps for each assignment
- [ ] **Latency Samples:** Note assignment response times
- [ ] **Picker Close Rate:** Calculate % of fast closes
- [ ] **Resource Deltas:** Final gold/food values minus starting values

#### Logger Commands
- [ ] **Interactive Mode:** Use `--interactive` flag for guided input
- [ ] **Batch Mode:** Pre-fill with telemetry using `--import telemetry.json`
- [ ] **Validation:** Logger validates all inputs against schema
- [ ] **Derived Metrics:** Logger calculates averages and target compliance
- [ ] **Export Formats:** Generate JSON, Markdown, and CSV outputs

#### Qualitative Notes
- [ ] **UX Feedback:** Note any friction points or unclear CTAs
- [ ] **Performance Issues:** Document lag, crashes, or visual glitches
- [ ] **Mobile Optimizations:** Comment on touch responsiveness
- [ ] **Risk Display:** Feedback on stripe visibility and readability
- [ ] **PWA Experience:** Note any PWA-specific issues

## Logger Template

### CLI Usage Template

```bash
# Interactive mode with pre-filled telemetry
npm run playtest:log -- \
  --session punch-club-mobile-gt3 \
  --tester QA-Mobile-01 \
  --device "iPhone 15 Pro" \
  --interactive \
  --import data/runs/mobile_playtests/telemetry.json \
  --format json,markdown

# Batch mode with manual data entry
npm run playtest:log -- \
  --session punch-club-mobile-gt3 \
  --tester QA-Mobile-01 \
  --device "Pixel 8" \
  --cycle-duration 42000,45000,38000 \
  --taps-per-assignment 2,3,2 \
  --assignment-latency 380,420,350 \
  --picker-close-rate 98 \
  --resource-gold 12 \
  --resource-food 3 \
  --notes "GT-3 checklist completed. Smooth UX, risk stripes clear."
```

### Sample Logger Output (JSON)

```json
{
  "version": "1.0.0",
  "sessionId": "punch-club-mobile-gt3-20260111-1445",
  "sessionTag": "gt3-mobile-test",
  "tester": "QA-Mobile-01",
  "device": "iPhone 15 Pro",
  "cycleDurationMs": [42000, 45000, 38000],
  "tapsPerAssignment": [2, 3, 2],
  "assignmentLatencyMs": [380, 420, 350],
  "pickerCloseRate": 98,
  "resourceDelta": {
    "gold": 12,
    "food": 3
  },
  "qualitativeNotes": "GT-3 checklist completed. Excellent mobile UX with clear CTAs and responsive touch controls. Risk stripes highly visible.",
  "telemetrySource": "sandbox-telemetry-hook",
  "createdAt": "2026-01-11T14:45:00.000Z",
  "derivedMetrics": {
    "avgCycleDurationMs": 41666.67,
    "avgTapsPerAssignment": 2.33,
    "avgAssignmentLatencyMs": 383.33,
    "meetsCycleTarget": true,
    "meetsTapTarget": true,
    "meetsLatencyTarget": true,
    "meetsPickerTarget": true,
    "meetsResourceTarget": true
  }
}
```

### Sample Logger Output (Markdown)

```markdown
# Punch Club Mobile Playtest Log

**Session:** punch-club-mobile-gt3-20260111-1445
**Tester:** QA-Mobile-01
**Device:** iPhone 15 Pro
**Created:** 2026-01-11 14:45 UTC

## Raw Metrics

- **Cycle Duration (ms):** 42000, 45000, 38000
- **Taps per Assignment:** 2, 3, 2
- **Assignment Latency (ms):** 380, 420, 350
- **Picker Close Rate:** 98%
- **Resource Delta:** +12 gold, +3 food

## Derived Metrics

- **Avg Cycle Duration:** 41.7s ✅ (< 90s target)
- **Avg Taps per Assignment:** 2.3 ✅ (≤ 3 target)
- **Avg Assignment Latency:** 383ms ✅ (< 450ms target)
- **Picker Performance:** 98% ✅ (≥ 98% target)
- **Resource Generation:** +12/+3 ✅ (≥ +10/+2 target)

## Qualitative Notes

GT-3 checklist completed. Excellent mobile UX with clear CTAs and responsive touch controls. Risk stripes highly visible.

## Target Compliance

✅ All KPI targets met
```

## Troubleshooting Guide

### Logger Issues
- **"Command not found":** Ensure `tsx` is installed and `npm run` prefix is used
- **"Schema validation failed":** Check input format (comma-separated numbers)
- **"Directory not writable":** Check permissions on `data/runs/mobile_playtests/`
- **"Telemetry not found":** Run playtest with `?dev=1` to enable hooks

### Mobile Testing Issues
- **Touch not responding:** Clear browser cache, restart device
- **Picker not opening:** Check viewport width (>375px), confirm touch events enabled
- **Performance lag:** Close other apps, ensure stable WiFi connection
- **PWA not installing:** Check browser compatibility, enable notifications

### Telemetry Problems
- **No telemetry data:** Confirm `window.__sandboxTelemetry` exists
- **Incomplete data:** Ensure all phases (Gym→Rest→Bout) completed
- **Invalid timestamps:** Check device clock synchronization

## Data Analysis Template

After completing multiple GT-3 sessions, use this template for trend analysis:

### Session Comparison Table

| Session ID | Device | Avg Cycle (s) | Avg Taps | Latency (ms) | Resources | Status |
|------------|--------|----------------|----------|--------------|-----------|--------|
| gt3-001 | iPhone 15 | 41.7 | 2.3 | 383 | +12/+3 | ✅ PASS |
| gt3-002 | Pixel 8 | 43.2 | 2.1 | 412 | +11/+4 | ✅ PASS |
| gt3-003 | iPad Mini | 39.8 | 2.5 | 378 | +13/+2 | ✅ PASS |

### Trend Analysis
- **Cycle Duration:** [Increasing/Decreasing/Stable] trend
- **Tap Efficiency:** [Improving/Declining/Stable] over sessions
- **Latency:** [Within/Outside] acceptable range
- **Resource Generation:** [Meets/Exceeds/Falls below] targets

### Issue Identification
- **Performance Regressions:** Note any >10% degradation
- **Device-Specific Issues:** iOS vs Android differences
- **Network Impact:** WiFi vs cellular performance gaps
- **Memory Leaks:** Monitor for increasing latency over time

## Checklist Completion Criteria

### Mandatory Completion
- [ ] All Phase 1-5 checklist items marked complete
- [ ] Logger script executed successfully
- [ ] Output files generated in `data/runs/mobile_playtests/`
- [ ] All KPI targets validated (or documented exceptions)
- [ ] Qualitative feedback provided

### Quality Gates
- **Data Integrity:** All logger fields populated and validated
- **Process Compliance:** Checklist followed without shortcuts
- **Documentation:** Clear notes for any issues or deviations
- **Reproducibility:** Steps can be repeated by other testers

### Sign-off Template
```
GT-3 Mobile Playtest Completed
Session: punch-club-mobile-gt3-[timestamp]
Tester: [tester-id]
Device: [device-model]
KPI Status: [PASS/FAIL/PARTIAL]
Issues Found: [count]
Evidence: data/runs/mobile_playtests/[filename].{json,md}
```

---

*This checklist ensures consistent, reproducible mobile testing of Punch Club with proper telemetry capture and KPI validation.*
