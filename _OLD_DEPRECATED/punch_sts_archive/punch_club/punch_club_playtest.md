# Punch Club Mobile Playtest Checklist

**Version:** 1.0.0  
**Last Updated:** 2026-01-23  
**Owner:** GT-3 Playtest Documentation  
**Related:** [Punch Club Vision](../strategy/idle_village_punch_club_vision.md) | [Surge Tutorial](../ftue/punch_club_surge_tutorial.md)

---

## Overview

This document provides a comprehensive checklist for conducting mobile-first playtests of Punch Club. It includes pre-session setup, target metrics, FTUE copy guidelines, session tagging requirements, and telemetry export formats.

**Purpose:** Ensure consistent, measurable playtest sessions that generate actionable data for improving Punch Club UX, performance, and player experience.

**Scope:** Lab-only development environment (`npm run dev`), local telemetry collection, mobile-first interaction patterns.

---

## 1. Pre-Session Checklist

### 1.1 Device Setup

- [ ] **Device Type Logged**: Record device model (e.g., iPhone 14 Pro, Pixel 7)
- [ ] **Screen Size**: Note viewport dimensions (e.g., 390x844, 412x915)
- [ ] **Browser**: Confirm browser type and version (Safari 17+, Chrome 120+)
- [ ] **Network**: Test on WiFi (stable) or 4G/5G (realistic mobile conditions)
- [ ] **Touch Targets**: Verify all interactive elements ≥44px (accessibility requirement)

### 1.2 Environment Setup

- [ ] **Dev Server Running**: `npm run dev` active on `http://127.0.0.1:5173`
- [ ] **Telemetry Enabled**: Confirm `mobilePlaytestLogger.ts` is capturing events
- [ ] **Console Clear**: Clear browser console and localStorage before session
- [ ] **Consent Flow**: Test consent modal appears and functions correctly (PC-M3)
- [ ] **Session Tag**: Generate unique session ID (format: `playtest_<testerID>_<timestamp>`)

### 1.3 Tester Information

- [ ] **Tester ID**: Assign anonymous ID (e.g., `PT-001`, `PT-002`)
- [ ] **Experience Level**: Note familiarity with idle games (beginner/intermediate/advanced)
- [ ] **Previous Sessions**: Record if returning tester (session count)
- [ ] **Test Scenario**: Define test focus (e.g., FTUE, Gym loop, Bout quest)

---

## 2. Target Metrics

### 2.1 Core KPIs (Key Performance Indicators)

| Metric | Target | Measurement | Priority |
|--------|--------|-------------|----------|
| **Cycle Duration** | <60s | Time from Gym Shift start → Rest complete → ready for next cycle | 🔴 Critical |
| **Taps Per Cycle** | <15 | Total tap/click count for one complete Gym→Rest cycle | 🔴 Critical |
| **Gold Gain Rate** | ≥10/cycle | Net gold earned per cycle (after costs) | 🟡 High |
| **Food Gain Rate** | ≥2/cycle | Net food earned per cycle (after consumption) | 🟡 High |
| **Picker Close Rate** | ≥98% | % of picker opens that result in assignment (not abandoned) | 🟢 Medium |
| **Assignment Latency** | <450ms | Time from picker open → resident selected → slot assigned | 🟢 Medium |

### 2.2 FTUE Metrics (First-Time User Experience)

| Metric | Target | Measurement | Priority |
|--------|--------|-------------|----------|
| **Tutorial Completion Rate** | ≥85% | % of new users who complete Surge tutorial | 🔴 Critical |
| **Tutorial Duration** | 3-5 min | Total time to complete all tutorial steps | 🟡 High |
| **Step Skip Rate** | <15% | % of users who skip tutorial steps | 🟡 High |
| **Tutorial Abandonment** | <10% | % of users who exit tutorial before completion | 🔴 Critical |
| **Post-Tutorial Retention** | ≥70% | % of users who complete ≥1 cycle after tutorial | 🟡 High |

### 2.3 Performance Metrics

| Metric | Target | Measurement | Priority |
|--------|--------|-------------|----------|
| **Cold Start Time** | <3s | Time from page load → interactive UI | 🔴 Critical |
| **Frame Rate** | ≥30 FPS | Consistent frame rate during animations | 🟡 High |
| **Memory Usage** | <100MB | Peak memory consumption during session | 🟢 Medium |
| **Touch Response** | <100ms | Latency from touch → visual feedback | 🔴 Critical |

### 2.4 UX Quality Metrics

| Metric | Target | Measurement | Priority |
|--------|--------|-------------|----------|
| **Error Rate** | <5% | Invalid actions / total actions | 🔴 Critical |
| **Confusion Events** | <3/session | Instances of user hesitation or backtracking | 🟡 High |
| **Haptic Feedback Success** | 100% | % of actions with appropriate haptic response | 🟢 Medium |
| **Visual Feedback Clarity** | ≥90% | User can identify action result without reading text | 🟡 High |

---

## 3. FTUE Copy Guidelines

### 3.1 Tone & Voice

**Principle:** Mobile-first means **brevity, clarity, and encouragement**.

- ✅ **DO**: Use short sentences (≤15 words)
- ✅ **DO**: Active voice ("Tap to assign" not "Assignment can be made by tapping")
- ✅ **DO**: Positive reinforcement ("Great work!" not "You didn't fail")
- ✅ **DO**: Contextual help (show when needed, hide when not)
- ❌ **DON'T**: Use jargon without explanation
- ❌ **DON'T**: Write paragraphs (max 2-3 sentences per tooltip)
- ❌ **DON'T**: Assume desktop conventions (e.g., "right-click", "hover")

### 3.2 Length Constraints

| Element | Max Length | Example |
|---------|-----------|---------|
| **Tutorial Step Title** | 40 chars | "Assign Your First Worker" |
| **Tutorial Step Body** | 120 chars | "Tap a resident card, then tap the Gym Shift slot to assign them. They'll start working immediately." |
| **Tooltip** | 60 chars | "This resident is too tired. Let them rest first." |
| **Button Label** | 20 chars | "Start Training" |
| **Error Message** | 80 chars | "Not enough gold. Complete a Gym Shift to earn more." |

### 3.3 Mobile-First Language

**Replace desktop terms with mobile equivalents:**

| Desktop | Mobile | Reason |
|---------|--------|--------|
| "Click" | "Tap" | Touch interface |
| "Hover" | "Tap and hold" | No hover on touch |
| "Drag" | "Drag" or "Swipe" | Context-dependent |
| "Right-click" | "Long press" | Touch equivalent |
| "Scroll" | "Swipe" | Natural gesture |

### 3.4 Copy Testing Checklist

- [ ] All tutorial text fits on screen without scrolling (mobile viewport)
- [ ] No technical terms without in-context definition
- [ ] Every action has immediate visual + haptic feedback
- [ ] Error messages suggest next action (not just state problem)
- [ ] Success messages reinforce learning (not just "OK")

---

## 4. Session Tagging Requirements

### 4.1 Required Session Metadata

Every playtest session MUST include these tags:

```typescript
interface PlaytestSessionMetadata {
  sessionId: string;           // Format: playtest_<testerID>_<timestamp>
  testerId: string;            // Anonymous ID (e.g., PT-001)
  deviceType: string;          // e.g., "iPhone 14 Pro", "Pixel 7"
  browserType: string;         // e.g., "Safari 17.2", "Chrome 120.0"
  viewportWidth: number;       // e.g., 390
  viewportHeight: number;      // e.g., 844
  sessionStartTime: string;    // ISO 8601 format
  sessionEndTime: string;      // ISO 8601 format
  testScenario: string;        // e.g., "FTUE", "Gym Loop", "Bout Quest"
  testerExperience: string;    // "beginner" | "intermediate" | "advanced"
  previousSessions: number;    // Count of prior sessions by this tester
}
```

### 4.2 PersistenceService Integration

Session tags are stored via `PersistenceService` with key pattern:

```typescript
const SESSION_TAG_KEY = 'punch_club_playtest_session';

// Save session tag
await PersistenceService.saveData(SESSION_TAG_KEY, sessionMetadata);

// Load session tag
const session = await PersistenceService.loadData(SESSION_TAG_KEY);
```

### 4.3 Telemetry Event Tagging

All telemetry events during playtest MUST include `sessionId`:

```typescript
interface PlaytestTelemetryEvent {
  eventType: string;
  sessionId: string;           // Links event to session
  timestamp: number;
  data: Record<string, unknown>;
}
```

---

## 5. Telemetry Export Format

### 5.1 JSON Schema

Playtest telemetry exports follow this schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["session", "metrics", "events"],
  "properties": {
    "session": {
      "type": "object",
      "required": ["sessionId", "testerId", "deviceType", "startTime", "endTime"],
      "properties": {
        "sessionId": { "type": "string" },
        "testerId": { "type": "string" },
        "deviceType": { "type": "string" },
        "browserType": { "type": "string" },
        "viewportWidth": { "type": "number" },
        "viewportHeight": { "type": "number" },
        "startTime": { "type": "string", "format": "date-time" },
        "endTime": { "type": "string", "format": "date-time" },
        "testScenario": { "type": "string" },
        "testerExperience": { "type": "string", "enum": ["beginner", "intermediate", "advanced"] },
        "previousSessions": { "type": "number" }
      }
    },
    "metrics": {
      "type": "object",
      "properties": {
        "cycleDurationMs": { "type": "number" },
        "tapsPerCycle": { "type": "number" },
        "goldGainRate": { "type": "number" },
        "foodGainRate": { "type": "number" },
        "pickerCloseRate": { "type": "number" },
        "assignmentLatencyMs": { "type": "number" },
        "errorRate": { "type": "number" },
        "tutorialCompletionRate": { "type": "number" },
        "tutorialDurationMs": { "type": "number" }
      }
    },
    "events": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["eventType", "timestamp", "sessionId"],
        "properties": {
          "eventType": { "type": "string" },
          "timestamp": { "type": "number" },
          "sessionId": { "type": "string" },
          "data": { "type": "object" }
        }
      }
    }
  }
}
```

### 5.2 Export Formats

Playtest data can be exported in multiple formats:

| Format | Use Case | Command |
|--------|----------|---------|
| **JSON** | Full data export, programmatic analysis | `npm run playtest:post-playwright` |
| **Markdown** | Human-readable reports | `npm run playtest:post-playwright:markdown` |
| **CSV** | Spreadsheet analysis, charts | `npm run playtest:post-playwright:csv` |

### 5.3 Integration with mobilePlaytestLogger

The existing `mobilePlaytestLogger.ts` script handles:

- Session data collection
- Event aggregation
- Metric calculation
- Export to multiple formats

**Usage:**

```bash
# Start interactive playtest logging
npm run playtest:log:interactive

# Export post-Playwright test results
npm run playtest:post-playwright

# Generate markdown report
npm run playtest:post-playwright:markdown
```

---

## 6. Playtest Execution Workflow

### 6.1 Pre-Session (5 min)

1. Complete Pre-Session Checklist (§1)
2. Generate session ID and tester metadata
3. Clear browser state (localStorage, console)
4. Start dev server and verify telemetry
5. Open browser DevTools (Network, Console tabs)

### 6.2 During Session (15-30 min)

1. **Observe without interrupting** (let tester explore naturally)
2. **Note confusion events** (hesitation, backtracking, errors)
3. **Record verbal feedback** (optional: think-aloud protocol)
4. **Monitor console** for errors or warnings
5. **Track time** for key actions (cycle duration, assignment latency)

### 6.3 Post-Session (10 min)

1. **Export telemetry** (`npm run playtest:post-playwright`)
2. **Review metrics** against targets (§2)
3. **Document observations** (confusion events, UX issues)
4. **Save session artifacts** (screenshots, console logs)
5. **Update Kanban** with findings (if blocking issues found)

---

## 7. Success Criteria

A playtest session is considered **successful** if:

- ✅ All target metrics meet or exceed thresholds (§2.1)
- ✅ No critical errors or crashes occur
- ✅ Tester completes test scenario without assistance
- ✅ Telemetry data is complete and valid
- ✅ Session artifacts are saved for analysis

A playtest session is considered **blocked** if:

- ❌ Critical metrics fail by >20% (e.g., cycle duration >72s)
- ❌ Tester cannot complete scenario due to bugs
- ❌ Telemetry fails to capture events
- ❌ Touch targets <44px (accessibility violation)

---

## 8. Related Documentation

- **Strategy**: [Punch Club Vision](../strategy/idle_village_punch_club_vision.md) - Overall vision and KPIs
- **FTUE**: [Surge Tutorial](../ftue/punch_club_surge_tutorial.md) - Tutorial system documentation
- **Telemetry**: `scripts/mobilePlaytestLogger.ts` - Logging implementation
- **Config**: `src/analytics/config/punchClubPlaytestMetrics.ts` - Metrics schema (see §5.4)

---

## 9. Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-23 | 1.0.0 | Initial GT-3 playtest checklist documentation |

---

## Appendix A: Sample Session Log

See `data/runs/mobile_playtests/sample-session-log.json` for a complete example of exported telemetry data.

---

## Appendix B: Troubleshooting

### Issue: Telemetry not capturing events

**Solution:** Verify `mobileLoggerSetup.ts` is configured in `playwright.config.ts` globalSetup.

### Issue: Session ID not persisting

**Solution:** Check PersistenceService is initialized before session start. Use `await PersistenceService.loadData()` to verify.

### Issue: Metrics calculation incorrect

**Solution:** Validate Zod schema in `punchClubPlaytestMetrics.ts` matches event data structure.

---

**Document Status:** ✅ Complete  
**Blocker For:** NP-091 (Surge Tutorial Visual Baseline)  
**Coordinates With:** NP-083, NP-089, NP-107, NP-117 (FTUE copy alignment)
