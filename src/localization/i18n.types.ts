import 'i18next';

export default interface Resources {
  "common": {
    "appName": "RPG Balancer",
    "language": "Language",
    "locale": {
      "en": "English",
      "it-IT": "Italiano",
      "pseudo": "Pseudo"
    },
    "welcome": "Welcome"
  },
  "idleVillage": {
    "activityCapsule": {
      "accessibility": {
        "activityCapsule": "{label} activity capsule",
        "closeDetails": "Close activity details"
      },
      "actions": {
        "cancel": "Cancel",
        "collect": "Collect",
        "collecting": "Collecting...",
        "start": "Start"
      },
      "ariaLive": {
        "blocked": "{label} activity blocked",
        "completed": "{label} activity completed",
        "idle": "{label} activity is idle",
        "progress": "{label} progress: {percent}%",
        "readyToCollect": "{label} ready to collect",
        "slotFreed": "{count, plural, one {{count} slot freed from {label}} other {{count} slots freed from {label}}}",
        "started": "{label} activity started",
        "workerAssigned": "{count, plural, one {{count} worker assigned to {label}} other {{count} workers assigned to {label}}}"
      },
      "defaultHalo": "POI",
      "devTools": {
        "validationTitle": "Skin Validation Errors"
      },
      "dropHint": "Drop",
      "info": {
        "duration": "Duration",
        "eta": "ETA",
        "reward": "Reward"
      },
      "lore": {
        "locked": "An ancient vibration awaits in the silence of this endeavor."
      },
      "requirements": {
        "relation": {
          "all": "Required",
          "any": "One of",
          "none": "Forbidden"
        }
      },
      "sections": {
        "assignedCharacters": "Assigned Characters",
        "lore": "Journal",
        "requirements": "Requirements",
        "telemetry": "Event Log"
      },
      "slotLabel": "Slot {index}",
      "status": {
        "blocked": "Blocked",
        "completed": "Completed",
        "idle": "Idle",
        "inProgress": "In Progress"
      },
      "telemetry": {
        "empty": "No events recorded."
      },
      "type": {
        "job": "Job",
        "maintenance": "Maintenance",
        "poi-activity": "POI Activity",
        "quest": "Quest",
        "training": "Training"
      },
      "workerAlt": "Worker"
    },
    "ftue": {
      "availableActivities": "Available Activities",
      "cycleProgress": "Cycle Progress",
      "day": "Day",
      "pause": "⏸️ Pause",
      "phase": {
        "day": "☀️ Day",
        "night": "🌙 Night"
      },
      "reset": "🔄 Reset",
      "resourceLabels": {
        "food": "Food",
        "gold": "Gold"
      },
      "resources": "Resources",
      "resume": "▶️ Resume",
      "roster": "Roster",
      "slottedMetal": "SlottedMetal (Placeholder)",
      "slottedMetalPlaceholder": "SlottedMetal component — To be developed",
      "tick": "Tick",
      "timeEngine": "Time Engine"
    },
    "hudResources": {
      "day": "Current day in the village cycle. Advances with time.",
      "fatigue": "Average resident fatigue level. High fatigue reduces efficiency.",
      "food": "Food supplies remaining. Consumed daily by residents.",
      "gold": "Current gold reserves. Earned from mining and other activities."
    },
    "interactionMode": {
      "accessibility": {
        "mode_changed": {
          "accessibility": {
            "ariaDescription": "Announcement when the interaction mode is changed",
            "ariaLabel": "Mode change notification"
          },
          "category": "help",
          "context": "accessibility",
          "description": "Mode change announcement for screen readers",
          "fallback": "Mode changed to {mode}",
          "maxLength": 50,
          "text": "Mode changed to {mode}",
          "translatable": true
        },
        "mode_selector_closed": {
          "accessibility": {
            "ariaDescription": "The mode selector has been closed",
            "ariaLabel": "Mode selector closed"
          },
          "category": "help",
          "context": "accessibility",
          "description": "Mode selector closing announcement",
          "fallback": "Mode selector closed",
          "maxLength": 30,
          "text": "Mode selector closed",
          "translatable": true
        },
        "mode_selector_open": {
          "accessibility": {
            "ariaDescription": "The mode selector has been opened",
            "ariaLabel": "Mode selector opened"
          },
          "category": "help",
          "context": "accessibility",
          "description": "Mode selector opening announcement",
          "fallback": "Mode selector opened",
          "maxLength": 30,
          "text": "Mode selector opened",
          "translatable": true
        }
      },
      "action": {
        "cancel_switch": {
          "accessibility": {
            "ariaLabel": "Cancel switch",
            "keyHint": "Escape"
          },
          "category": "action",
          "context": "picker",
          "description": "Cancel the mode change",
          "fallback": "Cancel",
          "maxLength": 15,
          "text": "Cancel",
          "translatable": true
        },
        "confirm_switch": {
          "accessibility": {
            "ariaLabel": "Confirm mode switch",
            "keyHint": "Enter"
          },
          "category": "action",
          "context": "picker",
          "description": "Confirm the mode change",
          "fallback": "Confirm switch",
          "maxLength": 25,
          "text": "Confirm switch",
          "translatable": true
        },
        "switch_mode": {
          "accessibility": {
            "ariaLabel": "Switch interaction mode",
            "keyHint": "M"
          },
          "category": "action",
          "context": "picker",
          "description": "Change the current interaction mode",
          "fallback": "Switch mode",
          "maxLength": 30,
          "text": "Switch mode",
          "translatable": true
        }
      },
      "ftue": {
        "mode_selection_description": {
          "accessibility": {
            "ariaDescription": "Information about the available interaction modes",
            "ariaLabel": "Mode description"
          },
          "category": "help",
          "context": "ftue",
          "description": "Mode selection description in the FTUE",
          "fallback": "Each mode offers a different way to interact with the village. Start with Sandbox mode to learn!",
          "maxLength": 120,
          "text": "Each mode offers a different way to interact with the village. Start with Sandbox mode to learn!",
          "translatable": true
        },
        "mode_selection_title": {
          "accessibility": {
            "ariaLabel": "Mode selection"
          },
          "category": "help",
          "context": "ftue",
          "description": "Mode selection title in the FTUE",
          "fallback": "Choose your mode",
          "maxLength": 30,
          "text": "Choose your mode",
          "translatable": true
        },
        "welcome_title": {
          "accessibility": {
            "ariaLabel": "Welcome title"
          },
          "category": "help",
          "context": "ftue",
          "description": "Welcome title for the FTUE",
          "fallback": "Welcome to Idle Village",
          "maxLength": 40,
          "text": "Welcome to Idle Village",
          "translatable": true
        }
      },
      "help": {
        "mode_description": {
          "accessibility": {
            "ariaDescription": "Use the arrows to navigate between the available modes",
            "ariaLabel": "Mode selection help"
          },
          "category": "help",
          "context": "picker",
          "description": "Description of the interaction mode selector",
          "fallback": "Select interaction mode for the village",
          "maxLength": 60,
          "text": "Select the interaction mode for the village",
          "translatable": true
        }
      },
      "mode": {
        "analytics": {
          "accessibility": {
            "ariaLabel": "Analytics Mode",
            "keyHint": "A"
          },
          "category": "mode",
          "context": "picker",
          "description": "Analytics mode for statistics and reports",
          "fallback": "Analytics",
          "maxLength": 20,
          "text": "Analytics",
          "translatable": true
        },
        "execution": {
          "accessibility": {
            "ariaLabel": "Execution Mode",
            "keyHint": "E"
          },
          "category": "mode",
          "context": "picker",
          "description": "Execution mode for ongoing activities",
          "fallback": "Execution",
          "maxLength": 20,
          "text": "Execution",
          "translatable": true
        },
        "planning": {
          "accessibility": {
            "ariaLabel": "Planning Mode",
            "keyHint": "P"
          },
          "category": "mode",
          "context": "picker",
          "description": "Planning mode for organizing activities",
          "fallback": "Planning",
          "maxLength": 20,
          "text": "Planning",
          "translatable": true
        },
        "sandbox": {
          "accessibility": {
            "ariaLabel": "Sandbox Mode",
            "keyHint": "S"
          },
          "category": "mode",
          "context": "picker",
          "description": "Sandbox mode for testing and experimentation",
          "fallback": "Sandbox",
          "maxLength": 20,
          "text": "Sandbox",
          "translatable": true
        }
      },
      "tooltip": {
        "analytics_info": {
          "category": "tooltip",
          "context": "picker",
          "description": "Information about analytics mode",
          "fallback": "Analytics mode: view statistics and reports",
          "maxLength": 80,
          "text": "Analytics mode: view statistics and reports",
          "translatable": true
        },
        "execution_info": {
          "category": "tooltip",
          "context": "picker",
          "description": "Information about execution mode",
          "fallback": "Execution mode: monitor activities in real time",
          "maxLength": 80,
          "text": "Execution mode: monitor activities in real time",
          "translatable": true
        },
        "planning_info": {
          "category": "tooltip",
          "context": "picker",
          "description": "Information about planning mode",
          "fallback": "Planning mode: organize activities and assign residents",
          "maxLength": 80,
          "text": "Planning mode: organize activities and assign residents",
          "translatable": true
        },
        "sandbox_info": {
          "category": "tooltip",
          "context": "picker",
          "description": "Information about sandbox mode",
          "fallback": "Sandbox mode: test new features without persistent effects",
          "maxLength": 80,
          "text": "Sandbox mode: test new features without persistent effects",
          "translatable": true
        }
      }
    },
    "map": {
      "activeActivities": "Active Activities",
      "activitySlots": "Activity Slots",
      "error": "Something went wrong in Village Sandbox.",
      "reset": "Reset",
      "resetting": "Resetting…"
    },
    "medalOverlay": {
      "ariaLabel": "Resident medal",
      "token": "PG"
    },
    "narrative": {
      "config": {
        "availableHooks": "Available Hooks",
        "configVersion": "Config Version",
        "configurationStatus": "Configuration Status",
        "hooks": "Hooks",
        "no": "No",
        "telemetryEnabled": "Telemetry Enabled",
        "templates": "Templates",
        "yes": "Yes"
      },
      "context": {
        "location": "Location",
        "progress": "Progress: {progress}%",
        "questDifficulty": "Quest Difficulty",
        "questName": "Quest Name",
        "questType": "Quest Type",
        "residentLevel": "Resident Level",
        "residentName": "Resident Name",
        "timeOfDay": "Time of Day",
        "weather": "Weather"
      },
      "difficulty": {
        "easy": "Easy",
        "hard": "Hard",
        "nightmare": "Nightmare",
        "normal": "Normal"
      },
      "narratives": {
        "complete": "Complete Quest",
        "count": "{count} narratives",
        "details": {
          "generated": "Generated",
          "hook": "Hook",
          "id": "ID: {id}",
          "metadata": "Metadata",
          "telemetry": "Telemetry",
          "telemetryNotTracked": "Not Tracked",
          "telemetryTracked": "Tracked",
          "template": "Template",
          "text": "Text",
          "title": "Narrative Details",
          "variables": "Variables"
        },
        "fail": "Fail Quest",
        "noNarratives": "No narratives generated yet",
        "noNarrativesHint": "Click \"Play\" to start auto-generating or use the buttons above",
        "title": "Generated Narratives"
      },
      "pause": "Pause",
      "play": "Play",
      "questProgress": "Quest Progress",
      "questTypes": {
        "combat": "Combat",
        "crafting": "Crafting",
        "diplomacy": "Diplomacy",
        "exploration": "Exploration",
        "social": "Social"
      },
      "refresh": "Refresh",
      "tabs": {
        "config": "Config",
        "context": "Context",
        "narratives": "Narratives",
        "telemetry": "Telemetry"
      },
      "telemetry": {
        "connected": "Connected",
        "disconnected": "Disconnected",
        "events": "Events",
        "lastActivity": "Last Activity",
        "metrics": "Metrics",
        "status": "Status",
        "topEvents": "Top Events",
        "topMetrics": "Top Metrics"
      },
      "timeOfDay": {
        "dawn": "Dawn",
        "day": "Day",
        "dusk": "Dusk",
        "night": "Night"
      },
      "title": "Quest Narrative Panel",
      "weather": {
        "clear": "Clear",
        "fog": "Fog",
        "rain": "Rain",
        "snow": "Snow",
        "storm": "Storm",
        "windy": "Windy"
      }
    },
    "poiDetail": {
      "ariaLabel": "POI Detail: {label}",
      "badgeLabels": {
        "dangerRating": "Danger Rating",
        "deathRisk": "Death Risk",
        "injuryRisk": "Injury Risk",
        "no": "No",
        "repeatable": "Repeatable",
        "riskLevel": "Risk Level",
        "yes": "Yes"
      },
      "duration": {
        "milliseconds": "{ms}ms",
        "minutes": "{minutes}m",
        "none": "—",
        "seconds": "{seconds}s"
      },
      "openDetail": "click to open details",
      "rating": {
        "outOf": "{rating}/5"
      },
      "requirement": {
        "any": "Any"
      },
      "reward": {
        "daily": "{resourceId}/day {amountPerDay}",
        "none": "—",
        "separator": " · ",
        "single": "{resourceId}: +{amountFormula}",
        "summary": "Resources + XP"
      },
      "risk": {
        "danger": {
          "label": "DANGER: {rating}",
          "title": "Danger Rating"
        },
        "death": {
          "label": "DEATH: {risk}%",
          "title": "Death Risk"
        },
        "injury": {
          "label": "INJURY: {risk}%",
          "title": "Injury Risk"
        }
      },
      "telemetry": {
        "assigned": "{resident} → {slotId}",
        "cancelled": "Activity {label} cancelled",
        "collected": "Reward {label} collected",
        "detached": "{resident} ← {slotId}",
        "initialized": "Activity started",
        "progressUpdate": "Progress update: {percent}%",
        "started": "Activity {label} started",
        "workerAssigned": "{worker} assigned to slot {slotNumber}"
      }
    },
    "questChronicle": {
      "boardStatus": {
        "failure": "Trial failed",
        "pending": "Waiting for patrol outcome",
        "success": "Last trial passed"
      },
      "journal": "Journal",
      "openTheater": "Open Theater",
      "outcome": {
        "failure": "Failure",
        "success": "Success"
      },
      "phaseType": {
        "branch": "Branch",
        "check": "Check",
        "dialogue": "Dialogue",
        "explore": "Explore",
        "fight": "Fight",
        "stealth": "Stealth",
        "timedChoice": "Timed Choice",
        "trap": "Trap"
      },
      "risk": {
        "death": "{percent}% death",
        "injury": "{percent}% injury"
      },
      "title": "Quest Chronicle"
    },
    "questRisk": {
      "level": {
        "high": "HIGH",
        "low": "LOW",
        "med": "MED"
      },
      "noRisk": "No Risk",
      "stripeAriaLabel": {
        "death": "Death risk: {percent}%",
        "injury": "Injury risk: {percent}%"
      }
    },
    "questTelemetry": {
      "avgChoiceTime": "{duration} avg choice time",
      "choiceTime": "Choice time: {time}s",
      "clear": "Clear",
      "decisionFallback": "Decision",
      "heatmapTitle": "Quest Risk Heatmap",
      "live": "Live",
      "loading": "Loading telemetry...",
      "metrics": {
        "avgDuration": "Avg Duration",
        "heroicMoments": "Heroic Moments",
        "successRate": "Success Rate",
        "totalQuests": "Total Quests"
      },
      "noDecisions": "No decisions yet",
      "noQuestData": "No quest data yet",
      "noQuestTaxonomy": "No quest taxonomy configured. Define questTypes in IdleVillageConfig.",
      "phaseLabel": "Phase: {phaseId}",
      "questTypes": "Quest Types",
      "recentDecisions": "Recent Decisions",
      "riskAssessment": "Quest Risk Assessment",
      "riskSummary": "Injury: {injury}% | Death: {death}%",
      "title": "Quest Telemetry",
      "totalBranches": "{count} total branches"
    },
    "scheduler": {
      "alerts": {
        "contextDetails": "Context Details",
        "noAlerts": "✅ No Active Alerts",
        "noAlertsDescription": "All village schedulers are operating within normal parameters."
      },
      "comparison": {
        "analysisTimeWindow": "Analysis Time Window",
        "avgEfficiency": "Avg Efficiency",
        "bestPerformer": "Best Performer",
        "columns": {
          "assignmentSuccess": "Assignment Success",
          "queueEfficiency": "Queue Efficiency",
          "residentUtilization": "Resident Utilization",
          "throughput": "Throughput",
          "village": "Village"
        },
        "performanceRankings": "Performance Rankings",
        "rankValue": "#{rank} ({score})",
        "recommendations": "💡 Recommendations",
        "timeRanges": {
          "15m": "15 minutes",
          "1h": "1 hour",
          "24h": "24 hours",
          "30m": "30 minutes",
          "4h": "4 hours"
        },
        "variance": "Variance",
        "worstPerformer": "Worst Performer"
      },
      "details": {
        "activeActivities": "Active Activities",
        "activeCount": "{active}/{total} active",
        "activityDistribution": "Activity Distribution",
        "byType": "By Type:",
        "currentMetrics": "Current Metrics",
        "fatigueLevels": {
          "critical": "Critical",
          "high": "High",
          "low": "Low",
          "medium": "Medium"
        },
        "queueSize": "Queue Size",
        "queueUtilized": "{utilized} utilized",
        "residentFatigueDistribution": "Resident Fatigue Distribution",
        "selectVillage": "Select Village",
        "selectVillageHint": "Choose a village from the dropdown above to view detailed metrics and charts.",
        "selectVillagePlaceholder": "Select a village...",
        "selectVillagePrompt": "Select a Village",
        "successCount": "{successful}/{total}",
        "successRate": "Success Rate",
        "throughput": "Throughput",
        "throughputUnit": "assignments/min",
        "totalActivities": "Total Activities",
        "utilization": "Utilization",
        "utilizationLabel": "Utilization"
      },
      "lastUpdated": "Last updated",
      "overview": {
        "efficiency": "Efficiency",
        "queue": "Queue",
        "queueSize": "{size}/{maxSize}",
        "successRate": "Success Rate",
        "throughput": "Throughput",
        "utilization": "Utilization",
        "villageId": "{id}"
      },
      "subtitle": "Monitoring {villages} villages • {kpis} KPIs collected • {alerts} active alerts",
      "tabs": {
        "alerts": "🚨 Alerts",
        "comparison": "🏆 Comparison",
        "details": "📈 Details",
        "overview": "📊 Overview"
      },
      "title": "🏘️ Multi-Village Scheduler Monitor"
    },
    "slotRack": {
      "ariaLabel": "Slot {state}",
      "states": {
        "empty": "empty",
        "locking": "locking",
        "occupied": "occupied"
      }
    },
    "slotStatus": {
      "active": "Activity is currently in progress.",
      "blocked": "This slot is locked or unavailable.",
      "idle": "Activity slot is available for assignment.",
      "invalid_drop": "This resident cannot be assigned here.",
      "valid_drop": "This resident can be assigned here.",
      "warning": "Assignment may have risks or requirements."
    },
    "testRoster": {
      "controls": {
        "dayNightCycle": "Day/Night Cycle",
        "randomize": "Randomize",
        "reset": "Reset"
      },
      "debug": {
        "drop": "Drop",
        "dropStates": {
          "idle": "Idle",
          "invalid": "Invalid",
          "locked": "Locked",
          "valid": "Valid"
        },
        "off": "Off",
        "on": "On",
        "slots": "Slots",
        "stamina": "Stamina >",
        "toggle": "Slot debug visualization",
        "toggleDescription": "Highlight bezel, medal and token for DOM comparison.",
        "warnings": "Warnings"
      },
      "empty": {
        "configureResidents": "Configure residents in the Character Manager to run drag & drop tests.",
        "description": "The Character Manager does not contain residents to test.",
        "title": "No Residents Loaded"
      },
      "error": {
        "actions": {
          "0": "Verify the Character Manager contains residents.",
          "1": "Reload the page after configuring data.",
          "2": "Check the console for loading errors."
        },
        "description": "Load residents from the Character Manager before testing.",
        "suggestedActions": "Suggested actions:",
        "title": "Loading Error"
      },
      "ftue": {
        "availableActivities": "Available Activities",
        "cycleProgress": "Cycle Progress",
        "day": "Day",
        "pause": "⏸️ Pause",
        "phase": {
          "day": "☀️ Day",
          "night": "🌙 Night"
        },
        "reset": "🔄 Reset",
        "resourceLabels": {
          "food": "Food",
          "gold": "Gold"
        },
        "resources": "Resources",
        "resume": "▶️ Resume",
        "roster": "Roster",
        "slottedMetal": "SlottedMetal (Placeholder)",
        "slottedMetalPlaceholder": "SlottedMetal component — To be developed",
        "tick": "Tick",
        "timeEngine": "Time Engine"
      },
      "lastAttempt": {
        "error": "Error",
        "errorWithDetails": "Error · {reason}{details}",
        "none": "No interaction recorded",
        "success": "Success",
        "successWithResident": "Success · {resident}",
        "unknown": "Error · unknown"
      },
      "loading": "Loading roster…",
      "map": {
        "activeActivities": "Active Activities",
        "activitySlots": "Activity Slots",
        "error": "Something went wrong in Village Sandbox.",
        "reset": "Reset",
        "resetting": "Resetting…"
      },
      "mockRoster": {
        "description": "The Character Manager is empty: using the default minimal roster to enable drag testing.",
        "title": "Mock roster active"
      },
      "narrative": {
        "config": {
          "availableHooks": "Available Hooks",
          "configVersion": "Config Version",
          "configurationStatus": "Configuration Status",
          "hooks": "Hooks",
          "no": "No",
          "telemetryEnabled": "Telemetry Enabled",
          "templates": "Templates",
          "yes": "Yes"
        },
        "context": {
          "location": "Location",
          "progress": "Progress: {progress}%",
          "questDifficulty": "Quest Difficulty",
          "questName": "Quest Name",
          "questType": "Quest Type",
          "residentLevel": "Resident Level",
          "residentName": "Resident Name",
          "timeOfDay": "Time of Day",
          "weather": "Weather"
        },
        "difficulty": {
          "easy": "Easy",
          "hard": "Hard",
          "nightmare": "Nightmare",
          "normal": "Normal"
        },
        "narratives": {
          "complete": "Complete Quest",
          "count": "{count, plural, one {1 narrative} other {{count} narratives}}",
          "details": {
            "generated": "Generated",
            "hook": "Hook",
            "id": "ID: {id}",
            "metadata": "Metadata",
            "telemetry": "Telemetry",
            "telemetryNotTracked": "Not Tracked",
            "telemetryTracked": "Tracked",
            "template": "Template",
            "text": "Text",
            "title": "Narrative Details",
            "variables": "Variables"
          },
          "fail": "Fail Quest",
          "noNarratives": "No narratives generated yet",
          "noNarrativesHint": "Click \"Play\" to start auto-generating or use the buttons above",
          "title": "Generated Narratives"
        },
        "pause": "Pause",
        "play": "Play",
        "questProgress": "Quest Progress",
        "questTypes": {
          "combat": "Combat",
          "crafting": "Crafting",
          "diplomacy": "Diplomacy",
          "exploration": "Exploration",
          "social": "Social"
        },
        "refresh": "Refresh",
        "tabs": {
          "config": "Config",
          "context": "Context",
          "narratives": "Narratives",
          "telemetry": "Telemetry"
        },
        "telemetry": {
          "connected": "Connected",
          "disconnected": "Disconnected",
          "events": "Events",
          "lastActivity": "Last Activity",
          "metrics": "Metrics",
          "status": "Status",
          "topEvents": "Top Events",
          "topMetrics": "Top Metrics"
        },
        "timeOfDay": {
          "dawn": "Dawn",
          "day": "Day",
          "dusk": "Dusk",
          "night": "Night"
        },
        "title": "Quest Narrative Panel",
        "weather": {
          "clear": "Clear",
          "fog": "Fog",
          "rain": "Rain",
          "snow": "Snow",
          "storm": "Storm",
          "windy": "Windy"
        }
      },
      "picker": {
        "button": "Open picker"
      },
      "poiDetailPage": {
        "activityLabel": "Attività:",
        "description": "POI job reale da Idle Village config, detail completo e slot rack interattivo.",
        "pretitle": "Test Hub · Job POI Detail + Roster Integration",
        "rosterTitle": "Village Roster",
        "title": "JOB POI DETAIL + ROSTER INTEGRATION"
      },
      "rosterFeedback": {
        "assigned": "{rack} · assigned {resident}",
        "assignedNoResident": "{rack} · assigned",
        "error": "{rack} · {reason}{details}",
        "invalid": "{rack} · invalid",
        "rack": "Rack A"
      },
      "scenarios": {
        "open": {
          "hpInsufficient": "HP insufficient ({hp}/200)",
          "requirement": "HP ≥ 200",
          "subtitle": "Requires HP ≥ 200",
          "title": "Rack A · Permissive scenario"
        },
        "restricted": {
          "hpInsufficient": "HP insufficient ({hp}/200)",
          "requirement": "HP ≥ 200",
          "subtitle": "Requires HP ≥ 200",
          "title": "Rack B · Restrictive scenario"
        }
      },
      "scheduler": {
        "alerts": {
          "contextDetails": "Context Details",
          "noAlerts": "✅ No Active Alerts",
          "noAlertsDescription": "All village schedulers are operating within normal parameters."
        },
        "comparison": {
          "analysisTimeWindow": "Analysis Time Window",
          "avgEfficiency": "Avg Efficiency",
          "bestPerformer": "Best Performer",
          "columns": {
            "assignmentSuccess": "Assignment Success",
            "queueEfficiency": "Queue Efficiency",
            "residentUtilization": "Resident Utilization",
            "throughput": "Throughput",
            "village": "Village"
          },
          "performanceRankings": "Performance Rankings",
          "rankValue": "#{rank} ({score})",
          "recommendations": "💡 Recommendations",
          "timeRanges": {
            "15m": "15 minutes",
            "1h": "1 hour",
            "24h": "24 hours",
            "30m": "30 minutes",
            "4h": "4 hours"
          },
          "variance": "Variance",
          "worstPerformer": "Worst Performer"
        },
        "details": {
          "activeActivities": "Active Activities",
          "activeCount": "{active}/{total} active",
          "activityDistribution": "Activity Distribution",
          "byType": "By Type:",
          "currentMetrics": "Current Metrics",
          "fatigueLevels": {
            "critical": "Critical",
            "high": "High",
            "low": "Low",
            "medium": "Medium"
          },
          "queueSize": "Queue Size",
          "queueUtilized": "{utilized} utilized",
          "residentFatigueDistribution": "Resident Fatigue Distribution",
          "selectVillage": "Select Village",
          "selectVillageHint": "Choose a village from the dropdown above to view detailed metrics and charts.",
          "selectVillagePlaceholder": "Select a village...",
          "selectVillagePrompt": "Select a Village",
          "successCount": "{successful}/{total}",
          "successRate": "Success Rate",
          "throughput": "Throughput",
          "throughputUnit": "assignments/min",
          "totalActivities": "Total Activities",
          "utilization": "Utilization",
          "utilizationLabel": "Utilization"
        },
        "lastUpdated": "Last updated",
        "overview": {
          "efficiency": "Efficiency",
          "queue": "Queue",
          "queueSize": "{size}/{maxSize}",
          "successRate": "Success Rate",
          "throughput": "Throughput",
          "utilization": "Utilization",
          "villageId": "{id}",
          "villageName": "{name}"
        },
        "subtitle": "Monitoring {villages} villages • {kpis} KPIs collected • {alerts} active alerts",
        "tabs": {
          "alerts": "🚨 Alerts",
          "comparison": "🏆 Comparison",
          "details": "📈 Details",
          "overview": "📊 Overview"
        },
        "title": "🏘️ Multi-Village Scheduler Monitor"
      },
      "title": "Idle Village Slot Lab",
      "validation": {
        "dropOutsideValidArea": "Drop outside valid area",
        "scenarioRequirementNotMet": "Scenario requirement not met"
      }
    },
    "workerTooltip": {
      "accessibility": {
        "closeTooltip": "Close tooltip for {name}",
        "riskBadge": "{level} status",
        "tooltipDetails": "{name} - Worker details"
      },
      "actions": {
        "close": "Close tooltip"
      },
      "labels": {
        "bio": "Bio",
        "fatigue": "Fatigue",
        "hp": "HP",
        "performance": "Performance",
        "recommendations": "Recommendations",
        "risk": "Risk Level",
        "specialties": "Specialties"
      },
      "recommendations": {
        "critical": "Immediate rest required",
        "highFatigue": "High fatigue - consider rest",
        "injured": "Recovering from injury",
        "lowHp": "Rest needed - HP critical"
      },
      "riskLevels": {
        "critical": "Critical Risk",
        "high": "High Risk",
        "low": "Low Risk",
        "medium": "Medium Risk"
      },
      "sections": {
        "quote": "Quote"
      },
      "statuses": {
        "available": "Available",
        "away": "Away",
        "dead": "Fallen",
        "exhausted": "Exhausted",
        "injured": "Injured",
        "recovering": "Recovering",
        "resting": "Resting",
        "working": "On Assignment"
      }
    },
    "workerTraits": {
      "agility": "Speed and reflexes for hunting and scouting tasks.",
      "endurance": "Stamina for long-duration activities and fatigue resistance.",
      "exhausted": "This resident is too exhausted to work effectively.",
      "injured": "This resident is injured and cannot work until recovered.",
      "intelligence": "Problem-solving ability for complex quests and crafting.",
      "perception": "Awareness and detection skills for exploration.",
      "strength": "Physical power for mining and combat activities."
    }
  }
}


declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    parseInterpolation: false;
    resources: Resources;
  }
}
