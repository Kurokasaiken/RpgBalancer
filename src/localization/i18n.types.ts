import 'i18next';

export default interface Resources {
  "balancing": {
    "actions": {
      "addCard": "Add Card",
      "addStat": "Stat",
      "close": "Close",
      "export": "Export",
      "import": "Import",
      "newCard": "New Card",
      "resetAll": "Reset All",
      "scenarioLab": "Scenario Lab",
      "showCard": "Show card",
      "stressTest": "Stress Test"
    },
    "app": {
      "subtitle": "Arcane Tech Glass · Config-Driven",
      "title": "Balancer"
    },
    "labels": {
      "hiddenCards": "Hidden cards"
    },
    "metrics": {
      "earlyImpact": "Early Impact (3T)",
      "edptVsSelf": "EDPT vs Self",
      "equalFight": {
        "title": "1v1 Equal (Self vs Self)",
        "turns": "{value} turns"
      }
    },
    "reset": {
      "confirmTitle": "Click again to confirm full reset",
      "title": "Reset to initial values"
    },
    "scenario": {
      "avg": "Avg: {value}",
      "baseline": "Baseline: {value}",
      "build": "Build: {value}",
      "configTitle": "Scenario Configuration",
      "damageOverkill": "Damage/Overkill",
      "dptBase": "DPT Base: {value}",
      "dptBuild": "DPT Build: {value}",
      "draws": "Draws: {value}",
      "elitePreset": "Elite Preset",
      "iterations": "Iter",
      "median": "Median: {value}",
      "overkillAvg": "Overkill Avg: {value1} / {value2}",
      "powerSubtitle": "Based on current build",
      "powerTitle": "Scenario Power (HP eq)",
      "range": "Range: {min}-{max}",
      "runSim": "Run Sim",
      "running": "Running...",
      "simulationTitle": "Scenario Simulation (vs Baseline)",
      "subtitle": "Duel · Boss · Swarm · 5v5",
      "ttkTurns": "TTK (Turns)",
      "winrate": "Winrate"
    },
    "stressTesting": {
      "title": "Stat Stress Testing & Marginal Utility Analysis"
    },
    "viewMode": {
      "config": "Config",
      "legacy": "Legacy"
    }
  },
  "common": {
    "appName": "RPG Balancer",
    "designVsFidelity": {
      "backToHub": "Back to Test Hub",
      "designSystemColumn": "Design System /design-system",
      "designSystemFrame": "Design System",
      "kicker": "UI Audit",
      "missingCount": "{count} missing items",
      "missingSection": "Missing & Mocked Components",
      "title": "Design System vs Visual Fidelity",
      "visualFidelityColumn": "Visual Fidelity /visual-fidelity-lab",
      "visualFidelityFrame": "Visual Fidelity Lab"
    },
    "examples": {
      "characterGreeting": "{gender, select, male {Welcome, my lord} female {Welcome, my lady} other {Welcome, adventurer}}",
      "riskLevel": "{level, select, low {Low risk} medium {Medium risk} high {High risk} other {Unknown risk}}",
      "swordCount": "{count, plural, one {one sword} other {# swords}}"
    },
    "language": "Language",
    "locale": {
      "ar": "العربية",
      "de": "Deutsch",
      "en": "English",
      "it-IT": "Italiano",
      "ja": "日本語",
      "pseudo": "Pseudo",
      "zh-CN": "简体中文"
    },
    "welcome": "Welcome"
  },
  "errors": {
    "boundary": {
      "reload": "Reload app",
      "retry": "Retry",
      "title": "Something went wrong"
    },
    "fallback": {
      "loading": "Loading…",
      "unknown": "An unknown error occurred"
    }
  },
  "idleVillage": {
    "SKIP": "Skip",
    "THROW": "Throw",
    "activityCapsule": {
      "accessibility": {
        "activityCapsule": "{label} activity capsule",
        "closeDetails": "Close details"
      },
      "actions": {
        "cancel": "Cancel",
        "collect": "Collect",
        "start": "Start",
        "startPending": "Pending…"
      },
      "devTools": {
        "validationTitle": "Skin Validation Errors"
      },
      "info": {
        "duration": "Duration",
        "eta": "ETA",
        "reward": "Reward"
      },
      "lore": {
        "locked": "Lore not yet discovered"
      },
      "requirements": {
        "relation": {
          "all": "all of",
          "any": "any of",
          "none": "none of"
        }
      },
      "sections": {
        "assignedCharacters": "Assigned characters",
        "lore": "Lore",
        "requirements": "Requirements",
        "telemetry": "Telemetry"
      },
      "slotLabel": "Slot {index}",
      "status": {
        "blocked": "Blocked",
        "completed": "Completed",
        "idle": "Idle",
        "inProgress": "In progress"
      },
      "telemetry": {
        "empty": "No events yet"
      },
      "type": {
        "job": "Job",
        "maintenance": "Maintenance",
        "quest": "Quest",
        "training": "Training"
      }
    },
    "astrolabeV3": {
      "auto": "Auto",
      "dead": "Fallen",
      "mute": "Mute",
      "onboardingRisk": "Crimson crown: land there and you are wounded. Violet chasms: a lethal fall.",
      "onboardingStar": "Your strength: the higher the stat, the longer the ivory lobe stretches.",
      "onboardingThrow": "Throw the spark — where it stops is the proof of your fate.",
      "rollAgain": "Roll again",
      "skip": "Skip",
      "throwControls": "Throw controls",
      "verdictCrit": "Ruin",
      "verdictFail": "Defeat",
      "verdictNearMiss": "By a Whisker",
      "verdictSuccess": "Victory",
      "wounded": "Wounded"
    },
    "astrolabeV4": {
      "explainContinue": "Continue",
      "explainEnemy": "This surface is the Enemy. If the spark stops here, the check fails.",
      "explainLegend": "Every colour is a fate. Read the field before you throw:",
      "explainRequired": "The black columns are the values demanded by the trial: one for each axis of the check.",
      "explainStar": "The ivory star is your ground. If the spark stops inside it, the check succeeds.",
      "explainStats": "The white columns are your expedition's stats: the higher they rise, the further your star reaches.",
      "explanation": "Explanation",
      "legendAlmost": "Bronze — star rim: Almost (failed by a whisker)",
      "legendCrit": "Dark band inside the Enemy's edge: critical failure",
      "legendDeath": "Black stripe: death",
      "legendEnemy": "Slate — the Enemy: failure",
      "legendNucleus": "Central core: critical success",
      "legendStar": "White — star interior: success",
      "legendWound": "Crimson stripe: wound",
      "subBigwin": "The sun itself signs your deed.",
      "subCrit": "The abyss claims those who dare too much.",
      "subFail": "The mountain repels mortals.",
      "subNearMiss": "The spark danced on the rim… and slipped beyond.",
      "subSuccess": "The summit bows to your stride.",
      "verdictBigwin": "Triumph"
    },
    "astrolabeV5": {
      "auto": "Auto",
      "awaiting": "Awaiting the throw",
      "axisReadout": "{skill}: {stat} against difficulty {difficulty} — {relation}",
      "mute": "Mute",
      "relation_deficit": "below the threshold",
      "relation_even": "level with the threshold",
      "relation_margin": "above the threshold",
      "riskDead": "Dead",
      "riskDeclared": "{death}% death · {wound}% wound",
      "riskHeld": "Unharmed",
      "riskNone": "None",
      "riskWounded": "Wounded",
      "rollAgain": "Roll again",
      "skip": "Skip",
      "throw": "Throw",
      "throwControls": "Throw controls",
      "trackCheck": "Trial",
      "trackRisk": "Risk",
      "verdictCrit": "Ruin",
      "verdictFail": "Failure",
      "verdictNearMiss": "Almost",
      "verdictSuccess": "Success"
    },
    "astrolabeV63": {
      "check": "Check",
      "mathFmt": "D100 {roll} · TST = 50 + ({stat} − {difficulty}) = {tst}",
      "narrative": {
        "Atletica": {
          "almost": "Your foot slips, but you catch the edge.",
          "bigwin": "You clear every barrier with a legendary leap.",
          "epicfail": "You fall hard, breath knocked from your lungs.",
          "fail": "The obstacle holds against your push.",
          "win": "Your body sails past the obstacle."
        },
        "Carisma": {
          "almost": "For a moment they almost yield, then no.",
          "bigwin": "Your words bend the world to your will.",
          "epicfail": "The room turns cold: you stand alone.",
          "fail": "Your tone finds no purchase.",
          "win": "The listener relents with a sigh."
        },
        "Destrezza": {
          "almost": "A click: the trigger grazes your finger.",
          "bigwin": "Your wrists outrace the trap in an instant.",
          "epicfail": "The trap springs, merciless.",
          "fail": "The mechanism jams before the release.",
          "win": "Your fingers find the mechanism without hesitation."
        },
        "Forza": {
          "almost": "The wood splits but still holds.",
          "bigwin": "The door gives under a terrible blow.",
          "epicfail": "Your fist rebounds, hurting you.",
          "fail": "The door stands harder than you thought.",
          "win": "The hinges groan and yield."
        },
        "Intelletto": {
          "almost": "One detail escapes, but you are close.",
          "bigwin": "The pieces snap into a luminous truth.",
          "epicfail": "Your mind clouds before the mystery.",
          "fail": "The solution slips through your fingers.",
          "win": "The riddle opens like a rose."
        },
        "almost": "A breath, and the truth escapes you.",
        "bigwin": "Fate bows to your step.",
        "epicfail": "The world pushes you back.",
        "fail": "Your grip slips.",
        "win": "The trial yields to your effort."
      },
      "probability": "Success chance ~{pct}%",
      "risk": "Wound {wound}% · Death {dead}%",
      "riskDead": "Fallen",
      "riskWounded": "Wounded",
      "statVsDc": "{stat} vs difficulty {difficulty}",
      "verdict": {
        "almost": "BY A BREATH",
        "bigwin": "TRIUMPH",
        "epicfail": "DISASTER",
        "fail": "FAILURE",
        "win": "SUCCESS"
      }
    },
    "astrolabeV64": {
      "check": "Check",
      "mathFmt": "D100 {roll} · TST = 50 + ({stat} − {difficulty}) = {tst}",
      "narrative": {
        "Atletica": {
          "almost": "Your foot slips, but you catch the edge.",
          "bigwin": "You clear every barrier with a legendary leap.",
          "epicfail": "You fall hard, breath knocked from your lungs.",
          "fail": "The obstacle holds against your push.",
          "win": "Your body sails past the obstacle."
        },
        "Carisma": {
          "almost": "For a moment they almost yield, then no.",
          "bigwin": "Your words bend the world to your will.",
          "epicfail": "The room turns cold: you stand alone.",
          "fail": "Your tone finds no purchase.",
          "win": "The listener relents with a sigh."
        },
        "Destrezza": {
          "almost": "A click: the trigger grazes your finger.",
          "bigwin": "Your wrists outrace the trap in an instant.",
          "epicfail": "The trap springs, merciless.",
          "fail": "The mechanism jams before the release.",
          "win": "Your fingers find the mechanism without hesitation."
        },
        "Forza": {
          "almost": "The wood splits but still holds.",
          "bigwin": "The door gives under a terrible blow.",
          "epicfail": "Your fist rebounds, hurting you.",
          "fail": "The door stands harder than you thought.",
          "win": "The hinges groan and yield."
        },
        "Intelletto": {
          "almost": "One detail escapes, but you are close.",
          "bigwin": "The pieces snap into a luminous truth.",
          "epicfail": "Your mind clouds before the mystery.",
          "fail": "The solution slips through your fingers.",
          "win": "The riddle opens like a rose."
        },
        "almost": "A breath, and the truth escapes you.",
        "bigwin": "Fate bows to your step.",
        "epicfail": "The world pushes you back.",
        "fail": "Your grip slips.",
        "win": "The trial yields to your effort."
      },
      "probability": "Success chance ~{pct}%",
      "risk": "Wound {wound}% · Death {dead}%",
      "riskDead": "Fallen",
      "riskWounded": "Wounded",
      "statVsDc": "{stat} vs difficulty {difficulty}",
      "verdict": {
        "almost": "BY A BREATH",
        "bigwin": "TRIUMPH",
        "epicfail": "DISASTER",
        "fail": "FAILURE",
        "win": "SUCCESS"
      }
    },
    "critPercent": "Crit Percent",
    "deathPercent": "Death Percent",
    "difficulty": "Difficulty",
    "dpr": "DPR",
    "equipment": {
      "addSkill": "Add granted skill",
      "balance": "Balance",
      "balanceBar": "Budget usage",
      "balanced": "Within budget ({balance} points free)",
      "budget": "Budget",
      "cost": "Cost",
      "defaultSaved": "Default configuration saved",
      "description": "Choose an item type, adjust stat modifiers, spend your equipment budget, and save. Weapons always link a base attack skill; armor and trinkets provide passive modifiers.",
      "edit": "Edit",
      "emptyLibrary": "No equipment in library.",
      "grantedSkill": "Granted skill",
      "identity": "Identity",
      "label": "Equipment",
      "library": "Equipment library",
      "loading": "Loading...",
      "name": "Name",
      "namePlaceholder": "New equipment",
      "new": "New",
      "overBudget": "Over budget by {balance} points",
      "power": "Power",
      "preview": "Preview",
      "rarity": {
        "common": "Common",
        "epic": "Epic",
        "legendary": "Legendary",
        "masterpiece": "Masterpiece",
        "poor": "Poor",
        "rare": "Rare",
        "uncommon": "Uncommon"
      },
      "rarityLabel": "Rarity",
      "removeSkill": "Remove granted skill",
      "reset": "Reset",
      "save": "Save equipment",
      "saveDefault": "Save default",
      "saveFailed": "Failed to save equipment",
      "saved": "Equipment saved",
      "searchSkill": "Search skill...",
      "stat": {
        "armor": "Armor",
        "armorPen": "Armor pen",
        "block": "Block",
        "critChance": "Crit chance",
        "critMult": "Crit mult",
        "damage": "Damage",
        "evasion": "Evasion",
        "hp": "HP",
        "lifesteal": "Lifesteal",
        "movementSpeed": "Movement speed",
        "penPercent": "Pen %",
        "regen": "Regen",
        "resistance": "Resistance",
        "txc": "TxC",
        "ward": "Ward"
      },
      "stats": "Stat modifiers",
      "subtitle": "Forge items from base templates",
      "tier": "Tier",
      "title": "Equipment Creator",
      "type": "Type",
      "types": {
        "armor": "Armor",
        "mount": "Mount",
        "offhand": "Off hand",
        "ring": "Ring",
        "trinket": "Trinket",
        "weapon": "Weapon"
      },
      "unnamed": "Unnamed equipment"
    },
    "floatingPanel": {
      "close": "Close panel",
      "minimize": "Minimise panel",
      "pin": "Pin panel open",
      "restore": "Restore panel",
      "unpin": "Unpin panel"
    },
    "gameFrame": {
      "boot": {
        "error": "The world could not be prepared",
        "logoAlt": "Wanderlust: Triumph",
        "phase": {
          "assets": "Painting the world",
          "build": "Raising the islands",
          "manifest": "Preparing the world",
          "ready": "Ready",
          "warmup": "Waking the winds"
        },
        "progress": "Loading progress"
      },
      "buildings": {
        "stash": {
          "name": "Village warehouse"
        }
      },
      "compass": {
        "recenter": "Re-centre the map"
      },
      "director": {
        "invasion": "Goblin invasion",
        "levelUp": "Hero level-up",
        "merchantMarker": "Merchant marker",
        "move": "Move",
        "poiTypes": "POI types",
        "quest": "Show quest",
        "questRun": "Start goblin quest",
        "reset": "Reset scene",
        "resetInitial": "Initial state",
        "settlementLost": "Settlement lost",
        "skin": "Skin: {name}",
        "title": "Director",
        "wonder": "Sea wonder"
      },
      "events": {
        "daysLeft": "{count} d",
        "empty": "Nothing on the horizon.",
        "fixtures": {
          "caravan": "A merchant caravan arrives",
          "expedition": "Expedition returns from the north",
          "granary": "Granary finished",
          "harvest": "Wheat harvest ready",
          "invasion": "Goblin host reaches the village",
          "wolves": "Wolves sighted by the old woods"
        },
        "move": "Move panel",
        "showLess": "Show less",
        "showMore": "Show all ({count})",
        "sort": {
          "ariaLabel": "Sort events",
          "due": "Due",
          "type": "Type"
        },
        "title": "Events",
        "today": "today",
        "types": {
          "construction": "Construction",
          "expedition": "Expedition",
          "harvest": "Harvest",
          "other": "Other",
          "quest": "Quest",
          "threat": "Threat",
          "visit": "Visit"
        }
      },
      "heroLevel": {
        "a11y": "Level {n} hero",
        "badge": "Lv {n}",
        "floater": "Level {n}"
      },
      "heroSheet": {
        "inventory": "Inventory",
        "inventoryEmpty": "Empty",
        "loadout": "Loadout",
        "next": "Next character",
        "pin": "Pin sheet",
        "prev": "Previous character",
        "unpin": "Unpin sheet"
      },
      "hud": {
        "hide": "Hide HUD",
        "show": "Show HUD"
      },
      "invasion": {
        "body": "A goblin host arrives in {count} days."
      },
      "menu": {
        "comingSoon": "Not available yet",
        "interfaceSize": "Interface size",
        "interfaceSizeAuto": "Auto",
        "interfaceSizeAutoHint": "Auto ({percent}%)",
        "language": "Language",
        "languages": {
          "en": "English",
          "it-IT": "Italiano"
        },
        "loadGame": "Load game…",
        "options": "Options",
        "quit": "Quit to title",
        "saveNow": "Save now",
        "saved": "Saved",
        "saving": "Saving…",
        "session": "Session",
        "settings": "All settings…",
        "theme": "Theme",
        "title": "Menu"
      },
      "merchant": {
        "buy": {
          "button": "Buy",
          "previewLabel": "preview only",
          "previewTooltip": "Trading arrives with the economy update — this screen is a preview"
        },
        "currency": {
          "gold": "gold"
        },
        "markerName": "Trader's stall",
        "offers": {
          "fieldRations": {
            "desc": "Hardtack, dried apples and salted fish — food that keeps its nerve longer than you will.",
            "name": "Field rations for the long march",
            "stock": "Plenty, while the ovens hold"
          },
          "healingDraught": {
            "desc": "Bitter green glass, sealed with wax — a wound that closes before the road turns.",
            "name": "Healing draughts, three to a crate",
            "stock": "One crate left"
          },
          "smokeBomb": {
            "desc": "Clay shells of grey powder — cover for a retreat no one remembers making.",
            "name": "Smoke bombs, a pair",
            "stock": "A pair only"
          },
          "wardCharm": {
            "desc": "A cold nail of meteoric iron on a cord — luck you can hold when the dark gets close.",
            "name": "Iron ward-charm",
            "stock": "The last one he brought north"
          }
        },
        "previewBadge": "Preview",
        "priceLine": "{price} {currency}",
        "restockNote": "Rowen restocks when the road is kind",
        "title": "Trader Rowen"
      },
      "nav": {
        "ariaLabel": "Game sections",
        "locked": "Not yet",
        "map": "Map",
        "tavern": "Tavern",
        "village": "Village",
        "workshop": "Workshop"
      },
      "objective": {
        "available": "Send a party on “{name}”",
        "done": "Collect the rewards of “{name}”",
        "label": "Objective",
        "running": "“{name}” is under way"
      },
      "panel": {
        "dragHint": "Drag the title bar to move · double-click to reset"
      },
      "panels": {
        "close": "Close panel",
        "names": {
          "director": "Director",
          "events": "Events",
          "heroSheet": "Character sheet",
          "merchant": "Merchant",
          "quest": "Quest in progress",
          "questDetail": "Quest planner",
          "questForecast": "Expedition forecast",
          "roster": "Roster",
          "tuning": "Tuning",
          "villageStash": "Village stash"
        },
        "pin": "Pin panel",
        "title": "Panels",
        "unpin": "Unpin panel"
      },
      "place": "The Eastern Marches",
      "questEpilogue": {
        "consumed": "Spent and destroyed",
        "dead": "Fallen",
        "diseases": "Diseases",
        "goldAmount": "+{amount} gold",
        "info": "Learned",
        "loot": "Loot",
        "lore": "Echoes of the place",
        "memberXp": "{name} +{amount} XP",
        "recovery": "recovers in ~{days} d",
        "reward": "Reward",
        "title": "Expedition report",
        "titles": "Titles",
        "wounded": "Wounded",
        "xp": "Experience",
        "xpAmount": "+{amount} XP"
      },
      "questJourney": {
        "awaitingDecision": "Waiting for a decision",
        "days": "{days}d",
        "daysEstimate": "~{days}d",
        "lootBadge": "Party carrying loot home: {count}",
        "lootChip": "Loot ×{count}",
        "parkedBadge": "Party waiting at a crossroads",
        "phase": {
          "andata": "outbound",
          "ritorno": "returning",
          "svolgimento": "at the quest site"
        },
        "routeProgress": "Expedition route: {phase}, {progress}% traveled."
      },
      "questLog": {
        "goldLoot": "Loot: +{amount} gold ({quest}).",
        "goldReward": "Quest reward: +{amount} gold ({quest}).",
        "outcome": {
          "fled": "The expedition «{quest}» retreated.",
          "reward": "The expedition «{quest}» returned victorious.",
          "survived": "The expedition «{quest}» made it back to the village.",
          "wipe": "The expedition «{quest}» did not come back."
        },
        "residentDead": "{name} fell on the expedition.",
        "residentWounded": "{name} came back wounded from the expedition.",
        "residentXp": "{name} gained {amount} XP ({quest}).",
        "xp": "Expedition experience: +{amount} XP ({quest})."
      },
      "questPoi": {
        "decisionWaiting": "The expedition awaits your decision",
        "open": "{name} — open the quest",
        "state": {
          "completed": "expedition over, outcome to collect",
          "failed": "expedition failed, outcome to collect",
          "in_progress": "expedition under way"
        },
        "withState": "{name} — {state}"
      },
      "questWindow": {
        "abandon": "Abandon quest",
        "abandonConfirm": "Are you sure you want to abandon the quest?",
        "abandonStay": "Keep going",
        "abandonYes": "Abandon",
        "bag": "Bag",
        "bagEmpty": "Bag is empty",
        "bagStrip": {
          "armed": "armed",
          "chipName": "{label} ({qualifier})",
          "held": "carried",
          "label": "Packed bag"
        },
        "beats": {
          "clickHint": "Click or press a key to continue",
          "continue": "Continue",
          "more": "{count, plural, one {# beat left — click or press a key} other {# beats left — click or press a key}}",
          "recap": "While you were away: {scenes} scenes, {checks} checks, {deaths} fallen, {wounds} hurt"
        },
        "belt": {
          "actionArmed": "will be used at the next trial or fight",
          "armed": "armed for the next check",
          "inert": "no trial ahead needs it",
          "passive": "always in effect while packed",
          "shadowed": "covered by another armed item"
        },
        "checkOptions": "Check options",
        "checkOptionsSkipCheck": "Skip the whole check",
        "checkOptionsSkipIntro": "Skip the opening animation",
        "checkOverlay": {
          "dismiss": "Dismiss",
          "dismissHint": "Click anywhere to continue — the details stay in the log.",
          "scoreTitle": "Skill {score} vs difficulty {difficulty}",
          "titleSuffix": "skill check"
        },
        "chronicle": "Chronicle",
        "clean": "Safe",
        "close": "Close the report",
        "combat": {
          "enemiesLeft": "{count, plural, one {# goblin standing} other {# goblins standing}}",
          "exposureHint": "Chance of taking the next hit",
          "incoming": "{count, plural, one {# hit coming} other {# hits coming}}"
        },
        "day": "Day {day} of {total}",
        "dead": "fallen",
        "footer": {
          "collapse": "Fold the journey strip",
          "expand": "Unfold the journey strip"
        },
        "hiddenEvent": "Hidden event — you could have missed it",
        "hpLost": "−{hp} HP",
        "inProgress": "Phase in progress",
        "inProgressShort": "now",
        "logEmpty": "The chronicle is empty",
        "loot": "+{count, plural, one {# loot} other {# loot}}",
        "minimise": "Minimise",
        "moreLines": "+{count, plural, one {# more line in the chronicle} other {# more lines in the chronicle}}",
        "nextPhase": "Next phase",
        "noneReturned": "Nobody came back",
        "outcomeToast": {
          "dismiss": "Dismiss outcome",
          "logHint": "Recorded in the chronicle — click to dismiss."
        },
        "partyStatus": "Assigned party — {alive} of {total} standing",
        "phaseLocked": "The phase is still on the road — its choices unlock when its time comes.",
        "phaseOf": "Phase {n} of {total}",
        "restore": "Reopen",
        "returned": "Back home",
        "rewardClose": "Close",
        "rewardHint": "Click or press a key to reveal",
        "roster": "Assigned party",
        "rosterFolded": "ROSTER {alive}/{total}",
        "ticks": "{elapsed}/{total} ticks",
        "verdictCard": {
          "consequence": "Consequence",
          "death": "Death {pct}%",
          "harmNone": "No harm",
          "wound": "Wound {pct}%"
        },
        "waiting": "A decision is waiting"
      },
      "regions": {
        "eastern_mountains": "Ember Highlands",
        "eastern_woods": "Eastern Groves",
        "islands": "The Outer Isles",
        "meadows": "The Meadows",
        "northern_forest": "Whispering Woods",
        "northern_peaks": "Northern Peaks",
        "southern_forest": "Hollow Wood",
        "southern_mountains": "Southern Crags",
        "village": "The Village"
      },
      "resources": {
        "autonomy": "{count} d left",
        "food": "Food",
        "gold": "Gold",
        "incoming": "+{count} incoming",
        "iron": "Iron",
        "perDay": "−{count}/d",
        "tooltip": {
          "amount": "{label} {value}.",
          "food": "{label} {value} of {max}. Residents eat {perDay} a day: enough for {days} days.",
          "incoming": "Incoming from activities in progress: +{count}."
        },
        "wood": "Wood"
      },
      "roster": {
        "ariaLabel": "Resident roster",
        "ariaLabelNight": "Resident roster, night phase: dragging disabled",
        "filter": {
          "all": "All",
          "ariaLabel": "Filter residents by status",
          "available": "Available",
          "away": "Away",
          "dead": "Fallen",
          "exhausted": "Exhausted",
          "heroes": "Heroes",
          "injured": "Injured"
        },
        "hide": "Hide roster",
        "show": "Show roster",
        "sort": {
          "ariaLabel": "Sort residents by stat",
          "asc": "Ascending",
          "desc": "Descending",
          "placeholder": "Sort by…"
        },
        "title": "Roster"
      },
      "speed": {
        "ariaLabel": "Simulation speed",
        "pause": "Pause",
        "paused": "Paused",
        "resume": "Resume",
        "spaceKey": "Space"
      },
      "stage": {
        "expandPanel": "Show {name}",
        "openRejected": "{name} is available after the quest"
      },
      "stash": {
        "capacity": "{count} of {max} goods in store",
        "qty": "{qty} in store",
        "title": "Village stash"
      },
      "status": {
        "dayLabel": "Day"
      },
      "subtitle": "",
      "title": "Wanderlust",
      "tuning": {
        "bakeFailed": "Saved for this browser — the new defaults could not be written to the config (dev server only).",
        "reset": "Reset values",
        "save": "Save",
        "saved": "Saved ✓"
      },
      "village": {
        "ariaLabel": "Village — buildings",
        "buildings": {
          "adventurersGuild": {
            "desc": "A hall of maps, contracts and scarred regulars.",
            "effect": "Quest slots: +{value} → +{next}",
            "name": "Adventurers' Guild",
            "unlockHint": "Unlocked after completing the first quest line."
          },
          "alchemist": {
            "desc": "Bubbling flasks and powders that bite back.",
            "effect": "Potion brewing: {value} → {next}",
            "name": "Alchemist",
            "unlockHint": "Requires a recovered alchemical tome."
          },
          "barracks": {
            "desc": "Bunks and drills for the village militia.",
            "effect": "Militia capacity: {value} → {next}",
            "name": "Barracks",
            "unlockHint": "Requires Palisade at level II."
          },
          "cemetery": {
            "desc": "Quiet rows of stones at the foot of the hill.",
            "effect": "Remembrance: {value} → {next}",
            "name": "Cemetery",
            "unlockHint": "Requires the Sanctuary."
          },
          "farm": {
            "desc": "Tills the meadow along the stream.",
            "effect": "Food per day: {value} → {next}",
            "name": "Farm"
          },
          "infirmary": {
            "desc": "Herbs and quiet beds for the wounded.",
            "effect": "Injury recovery: {value} → {next}",
            "name": "Infirmary",
            "unlockHint": "Unlocked by a quest reward."
          },
          "inn": {
            "desc": "Warm beds and a hearth that draw in new folk.",
            "effect": "Villager capacity: {value} → {next}",
            "name": "Inn"
          },
          "lumbermill": {
            "desc": "Fells timber from the eastern pines.",
            "effect": "Wood per day: {value} → {next}",
            "name": "Lumbermill"
          },
          "mageTower": {
            "desc": "A crooked spire where the village witch reads the wind.",
            "effect": "Research per day: {value} → {next}",
            "name": "Mage Tower"
          },
          "market": {
            "desc": "The trader's stall on the village square.",
            "effect": "Gold per day: {value} → {next}",
            "name": "Market"
          },
          "palisade": {
            "desc": "Sharpened stakes guarding the west approach.",
            "effect": "Defense: {value} → {next}",
            "name": "Palisade"
          },
          "quarry": {
            "desc": "Cuts stone and ore from the western cliffs.",
            "effect": "Iron per day: {value} → {next}",
            "name": "Quarry"
          },
          "sanctuary": {
            "desc": "A candlelit shrine for the fallen and the faithful.",
            "effect": "Morale bonus: +{value} → +{next}",
            "name": "Sanctuary",
            "unlockHint": "Requires the Sanctuary quest reward."
          },
          "smithy": {
            "desc": "Forges tools and gear for work and quest.",
            "effect": "Forge output: {value} → {next}",
            "name": "Smithy"
          },
          "warehouse": {
            "desc": "Keeps the village's stock under lock and key.",
            "effect": "Storage capacity: {value} → {next}",
            "name": "Warehouse"
          },
          "watchtower": {
            "desc": "Eyes over the valley mouth.",
            "effect": "Raid warning: {value} → {next} d",
            "name": "Watchtower"
          }
        },
        "builtCount": "{built} of {total} built",
        "category": {
          "arcane": "Arcane",
          "civic": "Civic",
          "defense": "Defense",
          "production": "Production"
        },
        "costLabel": "Cost",
        "daysShort": "{days} d",
        "effectLabel": "Effect",
        "legend": {
          "badgeBuild": "can be built",
          "badgeLevel": "level built",
          "badgeLocked": "locked",
          "keys": "← → buildings · Enter details · Esc map",
          "title": "Legend"
        },
        "levelBadge": "Lv {level}/{max}",
        "levelShort": "Lv {level}",
        "openMerchant": "Open merchant",
        "openStash": "Open warehouse",
        "pinsToolbar": "Village buildings",
        "registry": {
          "back": "Back",
          "chip": "Registry",
          "effectLadder": "Effects by level",
          "filter": {
            "all": "All",
            "buildable": "Buildable",
            "built": "Built",
            "locked": "Locked"
          },
          "filterLabel": "Filter buildings",
          "hint": "Esc to close",
          "offMap": "Registry only",
          "onMap": "On the map",
          "pending": "{count} to build or unlock",
          "sectionCount": "{built}/{total}",
          "title": "Settlement Registry"
        },
        "state": {
          "buildable": "Buildable",
          "built": "Built",
          "locked": "Locked"
        },
        "title": "Village",
        "upgrade": {
          "build": "Build",
          "maxLevel": "Max level",
          "previewLabel": "preview only",
          "previewTooltip": "Construction arrives with the economy update — this screen is a preview",
          "upgrade": "Upgrade"
        }
      }
    },
    "heroComponentsLab": {
      "availableSkills": "Available skills",
      "effect": "Effect",
      "empty": "Empty",
      "equip": "Equip",
      "equippedSkills": "Equipped skills",
      "grantedSkill": "Granted by equipment",
      "rarity": "Rarity",
      "sectionA": "A — Character Sheet",
      "sectionB": "B — Equip Slot Rack",
      "sectionC": "C — Equippable Item Card",
      "sectionD": "D — Consumable Pile",
      "sectionE": "E — Equippable Skill Deck",
      "selectItem": "Select item",
      "selectedSlot": "Selected slot",
      "slot": "Slot",
      "subtitle": "Placeholder catalog for the hero sheet, equipment, items, consumables and skills.",
      "title": "Hero Components Lab",
      "unequip": "Unequip",
      "use": "Use"
    },
    "hitStop": "Hit Stop",
    "milestoneCheck": {
      "ariaLabel": "Quest phase skill check",
      "casualty": "A hero fell during this phase",
      "consumables": "Spend consumables",
      "difficulty": "Difficulty {value}",
      "dismiss": "Continue",
      "eyebrow": "Milestone",
      "failed": "Phase failed",
      "partyStat": "Party {value}",
      "passed": "Phase passed",
      "riskLine": "Injury {injury}% · Death {death}%",
      "roll": "Consult destiny",
      "skills": "Checks to face",
      "wounded": "A hero was wounded during this phase"
    },
    "missionPlanner": {
      "addMember": "Add to party",
      "anyDeath": "At least one fallen",
      "anyInjury": "At least one wounded",
      "available": "Available",
      "band": {
        "odds": {
          "high": "Likely",
          "low": "Unlikely",
          "mid": "Uncertain"
        },
        "risk": {
          "high": "High",
          "low": "Low",
          "mid": "Moderate"
        }
      },
      "byMember": "By member",
      "cause": {
        "cover": "{who}'s cover",
        "emptyPenalty": "Empty slots",
        "slot": "{slot} ({who})",
        "stat": "{who} · {stat}"
      },
      "company": "The company",
      "death": "Death",
      "duration": "Duration",
      "equipSlot": {
        "armor": "Armor",
        "mount": "Mount",
        "trinket": "Trinket",
        "weapon": "Weapon"
      },
      "eyebrow": "Expedition plan",
      "haloHint": "Outer ring: death · inner ring: injury",
      "hours": "{count} h",
      "hoursShort": "h",
      "hp": "HP",
      "ifEmpty": "If left empty:",
      "injury": "Injury",
      "input": "Input",
      "issue": {
        "CONSUMABLE_OVER_STOCK": "Not enough provisions",
        "EMPTY_REQUIRED_SLOT": "Required slots are empty",
        "ITEM_SLOT_MISMATCH": "Item in the wrong slot",
        "ITEM_UNKNOWN": "Unknown item",
        "PARTY_TOO_LARGE": "Company too large",
        "RESIDENT_MISSING": "A member is no longer available"
      },
      "items": {
        "draftHorse": "Draft Horse",
        "guardianBanner": "Guardian Banner",
        "healingDraught": "Healing Draught",
        "heavyPlate": "Heavy Plate",
        "ironBlade": "Iron Blade",
        "luckyCoin": "Lucky Coin"
      },
      "launch": "Depart",
      "loadout": "Loadout",
      "metric": {
        "death": "Death",
        "duration": "Duration",
        "injury": "Injury",
        "reward": "Reward",
        "success": "Success"
      },
      "modifier": {
        "death": "Death",
        "injury": "Injury",
        "power": "Power"
      },
      "noLoadout": "No equipment",
      "open": "Mission Planner",
      "outcome": "Outcome",
      "output": "Outcome",
      "party": "Party",
      "perMemberRoll": "Base risk per member, rolled at every trial",
      "phase": {
        "memberRisk": "per member ⚕ {inj}% · ☠ {dth}%",
        "retreat": "retreat → {tier} ({pct}%)",
        "surviveThrough": "party alive after: {pct}%"
      },
      "phaseType": {
        "check": "Trial",
        "event": "Event",
        "fight": "Fight",
        "trap": "Trap"
      },
      "phases": "By phase",
      "pickFromRoster": "Pick someone from the available",
      "provisions": "Provisions",
      "remove": "Remove {name}",
      "required": "required",
      "reset": "Reset",
      "reward": "Expected reward",
      "route": "The road",
      "rule": "Success = passing at least half of the trials",
      "stage": "Trial {n}",
      "stat": {
        "agility": "Agility",
        "endurance": "Endurance",
        "intelligence": "Intelligence",
        "perception": "Perception",
        "strength": "Strength"
      },
      "subtitle": "Every change updates the outcomes instantly",
      "success": "Success",
      "title": "Planner",
      "trend": {
        "better": "improves",
        "same": "unchanged",
        "worse": "worsens"
      },
      "unavailable": "unavailable",
      "undo": "Undo",
      "why": "Why",
      "whyEmpty": "Form the company to see what decides the outcome."
    },
    "nearMissBand": "Near Miss Band",
    "pgDetailCard": {
      "close": "Close character sheet",
      "equipment": {
        "armor": "Armor",
        "empty": "Empty",
        "label": "Loadout",
        "mount": "Mount",
        "offhand": "Off hand",
        "ring": "Ring",
        "trinket": "Trinket",
        "weapon": "Weapon"
      },
      "fatigue": {
        "exhausted": "Exhausted",
        "label": "Fatigue",
        "ready": "Ready"
      },
      "fullFigure": "Full figure",
      "hp": {
        "label": "HP"
      },
      "inventory": {
        "empty": "No items recorded.",
        "label": "Inventory"
      },
      "openArchetype": "Open archetype",
      "profile": "Profile",
      "statistics": {
        "category": {
          "defense": "Defense",
          "offense": "Offense",
          "utility": "Utility"
        },
        "count": "{count} values",
        "empty": "No snapshot available.",
        "label": "Statistics"
      },
      "status": {
        "available": "Available",
        "away": "Away",
        "dead": "Dead",
        "exhausted": "Exhausted",
        "injured": "Injured"
      },
      "unknownPreset": "Unknown preset: {id}",
      "vitals": {
        "hp": "HP",
        "stamina": "STA"
      }
    },
    "poiDetail": {
      "risk": {
        "danger": {
          "title": "Danger rating of this activity"
        },
        "death": {
          "title": "Chance a resident dies"
        },
        "injury": {
          "title": "Chance a resident is injured"
        }
      }
    },
    "poiMarkerLab": {
      "counterClockwise": "Counter-clockwise (deadline)",
      "grounded": "Contact shadow",
      "importance": "Importance",
      "importances": {
        "critical": "Critical",
        "important": "Important",
        "normal": "Normal"
      },
      "inContext": "In context",
      "matrix": "Type / state matrix",
      "playground": "Playground",
      "progress": "Time left",
      "showMap": "Show world surface",
      "size": "Size",
      "state": "State",
      "states": {
        "assigned": "Assigned",
        "available": "Available",
        "expired": "Expired",
        "expiring": "Expiring",
        "new": "New"
      },
      "subtitle": "Opportunity marker baseline: colour + icon = what, timer ring = when, material = where. Placed over the canonical Wanderlust surface, because that is the only honest test.",
      "title": "POI Marker Lab",
      "type": "Type",
      "types": {
        "event": "Event",
        "job": "Job",
        "quest": "Quest"
      },
      "variant": "Variant",
      "variants": {
        "runic": "Runic (V2)",
        "runicV1": "Runic V1",
        "runicV3": "Runic V3",
        "runicV5": "Runic V5"
      }
    },
    "poiVisualPreview": {
      "title": "POI Medallion Preview",
      "v1Label": "GenericPoiSkin V1 (Amber)",
      "v2Label": "GenericPoiSkin V2 (Materic)"
    },
    "presentation": {
      "director": {
        "title": "World Presentation Director"
      },
      "inspector": {
        "activeState": "Active State",
        "runtimeObjects": "Runtime Objects",
        "tick": "Tick",
        "title": "Output Inspector",
        "visualStateOverrides": "Visual Overrides"
      },
      "layerOrder": {
        "moveDown": "move down",
        "moveUp": "move up",
        "title": "Layer Order"
      },
      "layers": "Layers",
      "objects": "Objects",
      "pause": "Pause",
      "play": "Play",
      "scenarios": {
        "corruption": "Corruption",
        "peaceful": "Peaceful",
        "threat": "Threat",
        "title": "Scenario"
      },
      "seed": "Seed",
      "states": {
        "unknown": "Unknown"
      },
      "step": "Step",
      "tick": "Tick"
    },
    "questCheckpoint": {
      "continue": "Push on",
      "ifContinue": "If you push on",
      "ifRetreat": "If you retreat now",
      "member": {
        "alive": "Unscathed",
        "dead": "Dead",
        "injured": "Injured"
      },
      "retreat": "Retreat",
      "summary": "Phase {played} of {total} is behind you.",
      "title": "Checkpoint"
    },
    "questChronicle": {
      "boardStatus": {
        "failure": "Trial failed",
        "pending": "Waiting for patrol outcome",
        "success": "Last trial passed"
      },
      "closeReport": "Close the report",
      "collectRewards": "Collect rewards",
      "journal": "Journal",
      "openTheater": "Open Theater",
      "outcome": {
        "failure": "Failure",
        "success": "Success"
      },
      "phaseType": {
        "branch": "branch",
        "check": "check",
        "dialogue": "dialogue",
        "explore": "explore",
        "fight": "fight",
        "stealth": "stealth",
        "timedChoice": "timed choice",
        "trap": "trap"
      },
      "risk": {
        "death": "{percent}% death",
        "injury": "{percent}% injury"
      },
      "ropeLabel": "Quest time",
      "title": "Quest Chronicle"
    },
    "questExpedition": {
      "backToMap": "Back to map",
      "bag": {
        "covers": "Covers:",
        "emptySlot": "Empty bag slot {index}",
        "openPicker": "Choose village items",
        "pickerTitle": "Village warehouse",
        "removeSlot": "Remove {item}",
        "stock": "In store: ×{qty}"
      },
      "coverage": "Covers",
      "danger": "Danger",
      "duration": "Estimated duration ~{ticks} ticks",
      "durationDays": "{count, plural, one {# day} other {# days}}",
      "forecast": {
        "computing": "Estimating…",
        "death": "Deaths {pct}%",
        "incomplete": "Fill the required slots for an estimate.",
        "resolving": "Resolving offer…",
        "reward": "Success {pct}%",
        "title": "Forecast",
        "wipe": "Wipe {pct}%",
        "wound": "Wounds {pct}%"
      },
      "intel": {
        "scouted": "scouted",
        "title": "Intel"
      },
      "item": {
        "draftHorse": "One mount for the whole expedition — halves the pace of every leg.",
        "healingDraught": "−10% wound chance on every member's check.",
        "luckyCoin": "+10% to the expedition's reward."
      },
      "keyStats": {
        "primary": "Primary",
        "secondary": "Secondary",
        "title": "Key stats"
      },
      "loadout": "Bag — {count}/{max}",
      "marching": {
        "coda": "CODA",
        "exposure": "Exposure",
        "leader": "Leader",
        "testa": "TESTA",
        "title": "Marching order"
      },
      "members": {
        "downtime": "≈{days}d down",
        "role": {
          "bodyguard": "guard",
          "leader": "leader",
          "member": "member"
        },
        "row": "wounds {wound}% · deaths {death}%",
        "title": "By member"
      },
      "seals": {
        "danger": "Danger",
        "duration": "Duration",
        "reward": "Reward"
      },
      "send": "Send expedition",
      "statName": {
        "agi": "Agility",
        "cha": "Charisma",
        "con": "Constitution",
        "int": "Intelligence",
        "perc": "Perception",
        "str": "Strength"
      },
      "tray": {
        "close": "Close tray",
        "dragHint": "Drag a companion onto a slot",
        "empty": "No companions available",
        "modeItems": "Bag",
        "modeResidents": "Companions",
        "open": "Choose",
        "title": "Selection"
      },
      "why": {
        "row": "— in {runs}% of runs · {death}% of deaths · {wound}% of wounds",
        "title": "Where the risk comes from"
      }
    },
    "questGenLab": {
      "backToHub": "Test Hub",
      "footer": "Quest Generation Lab · authored content in Italian · R-140",
      "labels": {
        "authored": "authored",
        "inRun": "in-run",
        "mechanicsUsed": "mechanics used",
        "narrated": "narrated",
        "objective": "objective",
        "options": "options",
        "play": "play",
        "primaryStats": "primary stats",
        "reads": "reads",
        "resolution": "resolution",
        "runstart": "run-start",
        "scenarios": "scenarios",
        "scenes": "scenes",
        "tags": "tags",
        "traitsUsed": "traits used",
        "tree": "node tree",
        "twists": "twists",
        "writes": "writes"
      },
      "play": {
        "chronicle": "chronicle",
        "continue": "continue",
        "death": "death",
        "epilogue": "epilogue",
        "flags": "flags",
        "flee": "retreat",
        "gold": "gold",
        "intel": "intel",
        "loot": "loot",
        "newRun": "new run",
        "objectiveDone": "objective done",
        "outcome": {
          "fled": "Fled",
          "reward": "Reward",
          "survived": "Survived",
          "wipe": "Wipe"
        },
        "preset": "party preset",
        "reset": "reset",
        "roll": "roll",
        "seed": "seed",
        "settlement": "settlement — world effects",
        "setup": "prepare the run",
        "start": "start run",
        "success": "success",
        "wound": "wound"
      },
      "sections": {
        "catalog": "Generated catalog",
        "catalogDesc": "The v0 pre-generated scenarios: metadata, node tree and a playable run on the real engine (gen profile).",
        "consequences": "What changes afterwards",
        "consequencesDesc": "The aftermath matrix: party, village, factions, world, future quests — what exists and what does not.",
        "ingredients": "Ingredients",
        "ingredientsDesc": "Core gimmicks, domain kits (the world «tag» axis), party traits, twists and the mechanics glossary.",
        "open": "Missing / open decisions",
        "openDesc": "The things easy to forget: tag taxonomy, thresholds, narrative arcs, channels, ignored offers.",
        "pipeline": "How a quest is born",
        "pipelineDesc": "The creation tree: from input to finished run. Open each step for details, files and real status.",
        "systems": "Implementation map",
        "systemsDesc": "Every subsystem: where it lives, what it changes mechanically, which tests cover it."
      },
      "status": {
        "gated": "gated",
        "implemented": "implemented",
        "missing": "missing",
        "offline": "offline",
        "partial": "partial",
        "proposal": "proposal"
      },
      "subtitle": "Quest generation workbench (PLAN-026): how a quest is born, from which ingredients, how it plays and what changes afterwards. Statuses mark what truly runs, what lives offline and what is missing.",
      "tabs": {
        "gimmicks": "Gimmicks",
        "kits": "Kits & tags",
        "mechanics": "Mechanics",
        "traits": "Traits",
        "twists": "Twists"
      },
      "title": "Quest Generation Lab"
    },
    "questOffer": {
      "band": {
        "alta": "High",
        "bassa": "Low",
        "letale": "Lethal",
        "media": "Medium"
      },
      "tier": {
        "discreta": "Decent",
        "leggendaria": "Legendary",
        "magra": "Meagre",
        "ricca": "Rich"
      }
    },
    "questOutcome": {
      "deadly": "Disaster",
      "fail": "Failure",
      "partial": "Partial success",
      "perfect": "Perfect",
      "success": "Success"
    },
    "questReward": {
      "collect": "Collect rewards",
      "eyebrowDefeat": "Expedition broken",
      "eyebrowVictory": "Expedition returned",
      "failed": "Failed",
      "noRewards": "The expedition brought nothing home",
      "panelTitle": "Rewards",
      "party": "Party",
      "passed": "Passed",
      "rewards": "Rewards",
      "stateDead": "Fallen",
      "stateInjured": "Wounded",
      "stateNone": "Unharmed",
      "trials": "Trials",
      "trialsPassed": "{passed} of {total} trials passed"
    },
    "questS1Lab": {
      "advancing": "The expedition advances…",
      "backToQuests": "All quests",
      "belt": {
        "armTitle": "Armed: the matching consumable is spent on the next check — options show the delta",
        "label": "Belt"
      },
      "bodyguardCovers": "🛡 {name} covers the hits — wound {wound}%, death {death}% for him",
      "camp": {
        "alerted": "Camp alerted",
        "awake": "Camp awake",
        "tooltip": "The camp heard something. Another misstep and it erupts — and the quiet way out closes."
      },
      "chestLost": "Crate lost",
      "chestRecovered": "Crate recovered",
      "chestTaken": "Crate in hand — not secured",
      "chronicle": "Chronicle",
      "combatTurn": "turn {turn}/{turns}",
      "consumableArmed": "✦ {label} — armed (+{bonus})",
      "consumableAvailable": "✦ {label} available: +{bonus} to the roll",
      "consumableDelta": "{base}→{armed} ✦",
      "consumableStowed": "✦ {label} — stays in the bag",
      "days": "{days} days",
      "deathPct": "death {pct}%",
      "depart": "Depart",
      "evaluate": "▸ evaluate",
      "exposureTitle": "Chance of being hit by each incoming hit: {pct}%",
      "faceCheck": "Face the check · ~{pct}%",
      "gold": "gold",
      "harmChip": {
        "death": "FALLEN",
        "wound": "WOUNDED"
      },
      "harmInProgress": "Consequences are landing…",
      "horde": {
        "intentTitle": "Incoming hits next turn",
        "remaining": "standing {shown}/{total}"
      },
      "intel": "Intel: {items}",
      "intelBonus": "✧ Intel: {label} (+{bonus})",
      "item": {
        "bonusForza": "Strength Bonus — +15 to one check",
        "bonusPerc": "Perception Bonus — +15 to one check",
        "healing": "Healing — +20 HP to the most hurt",
        "potion": "Potion — heals a wounded member",
        "rope": "Rope — +15 climbing",
        "smoke": "Smoke bomb — +15 infiltration",
        "usePotion": "Potion → heal {name}"
      },
      "kicker": "Isolated lab · S1",
      "kickerRun": "Isolated lab · S1 · seed {seed}",
      "labTitle": "S1 — Quest Lab",
      "logToggle": "Chronicle",
      "loot": "Loot: {items}",
      "memberState": {
        "dead": "Dead",
        "fit": "In shape",
        "wounded": "Wounded"
      },
      "objective": "Goal: bring the seed crate back from the Crow Pass. The leader must survive to earn the reward. Choose the expedition:",
      "onFail": "If it fails: {text}",
      "outcome": {
        "fled": "Retreat — quest failed, loot kept",
        "reward": "VICTORY — reward earned",
        "survived": "Survived — no reward",
        "wipe": "WIPE — everything is lost"
      },
      "pace": {
        "fast": "Fast",
        "full": "Full",
        "title": "Presentation pace — chosen before the check"
      },
      "partyKicker": "Expedition",
      "pickQuest": "Choose the expedition — one authored quest, every verdict has a price.",
      "primaryNote": "almost every check resolves with these stats",
      "primaryTrial": "★ Infiltration trial — {stats}",
      "quests": {
        "cassa": {
          "desc": "Infiltration: slip into the goblin camp, grab the crate, get out with it. What you carry can still be lost on the way out.",
          "duration": "one night",
          "objective": "Goal: bring the seed crate back from the Crow Pass. The leader must survive to earn the reward. Choose the expedition:",
          "title": "The Seed Crate",
          "trial": "★ Infiltration trial — {stats}"
        },
        "goblin": {
          "desc": "Combat: hunt the raiders back to their camp and wipe them out. No stealth prize — just steel, and a price for every extra minute you linger.",
          "duration": "one day",
          "objective": "Goal: exterminate the goblins raiding the borders. The fight is won in the approach — stealth or assault set the terms of the battle. Choose the expedition:",
          "title": "Goblin Extermination",
          "trial": "★ Combat trial — {stats}"
        },
        "rovine": {
          "desc": "Exploration: cross the river, get past the guards, haul the treasure out. Time and blood are the price — how far will you push?",
          "duration": "4–9 days",
          "objective": "Goal: bring the treasure back from the ruins beneath the river. Every extra room costs days and blood. The leader must survive. Choose the expedition:",
          "title": "The Ruins beneath the River",
          "trial": "★ Strength trial — {stats}"
        }
      },
      "reset": "Reset",
      "resolving": "Resolving",
      "retreat": "Retreat",
      "retreatTitle": "Abandon the quest: keep the loot but no reward",
      "risk": {
        "high": "Risk: high",
        "medium": "Risk: medium"
      },
      "role": {
        "bodyguard": "Bodyguard",
        "leader": "Leader",
        "member": "Member"
      },
      "sim": {
        "avgDeathsOnReward": "x̄ {n} deaths on reward",
        "benchTitle": "WHAT-IF PARTY BENCH — hypothetical, never touches the run",
        "bound": "party {value}",
        "cf": {
          "anyDeath": "1+ deaths",
          "anyWound": "1+ wounded",
          "success": "Success"
        },
        "consequence": {
          "anyDeath": "1+ deaths",
          "anyWound": "1+ wounded",
          "leaderDeath": "Leader dies",
          "leaderWound": "Leader wounded",
          "noHarm": "No injury"
        },
        "consumableLast": "no later check uses it — spending is free",
        "consumableLater": "if spent: gone for later checks — {list}",
        "cp": {
          "push": "PUSH",
          "secure": "SECURE"
        },
        "cpLine": "reward {reward}% · death {death}% · wound {wound}% · {days}d · treasure {treasure}",
        "daysLine": "x̄ {avg}d · {min}–{max}d",
        "dead": "Dead",
        "deathsDist": "0: {zero}% · 1: {one}% · 2+: {twoPlus}%",
        "deathsTitle": "DEATHS",
        "downtime": "downtime {days}d",
        "healthy": "Healthy",
        "humanDays": "{hd} man-days · P50 {p50}d P90 {p90}d",
        "leaderLine": "wounded {wound}% · dead {death}%",
        "leaderTitle": "LEADER",
        "makeLeader": "make leader",
        "memberOdds": "{name} W{wound}% · D{death}%",
        "open": "QUEST FORECAST — what is likely to happen (simulation)",
        "opt": {
          "chestLoot": "goblin chest",
          "guardLoot": "guards' loot",
          "relic": "relic",
          "viandante": "traveler helped"
        },
        "outcome": {
          "fled": "Retreat",
          "reward": "Reward",
          "survived": "Survived",
          "wipe": "Wipe"
        },
        "pill": "Forecast",
        "rewardLine": "{gold} gold · {treasure} treasure · {loot} loot",
        "rewardTitle": "REWARD",
        "runsLabel": "{runs} simulated runs",
        "strategyTitle": "SIMULATED STRATEGY",
        "timeTitle": "TIME",
        "title": "QUEST FORECAST — probabilistic X-ray",
        "toggleIn": "include / exclude from the sim",
        "toll": "certain toll: −{amount} HP on {name} (−{epic} on a disaster)",
        "why": {
          "alarm": "the camp is awake — every check is harder",
          "bodyguardCover": "the bodyguard intercepts harm aimed at others",
          "pushDeeper": "the strategy pushes past the checkpoint — more reward, more exposure",
          "secureStake": "the strategy banks the stake at the checkpoint",
          "stakeOnTable": "{value} gold of treasure already in hand",
          "statStrong": "strong {stat} — {name} ({value})",
          "statWeak": "weak {stat} — best is {name} ({value})",
          "woundedParty": "{count} already wounded — +risk on every check"
        },
        "whyAlarm": "the camp is awake — checks are harder",
        "whyCarrier": "{name} carries {stat} ({value})",
        "whyConsumable": "{label} armed (+{bonus})",
        "whyCover": "{name} intercepts the blows",
        "whyIntel": "{label} (+{bonus})",
        "whyTitle": "WHY?",
        "whyWounded": "{names} already wounded (+risk)",
        "withC": "WITH",
        "without": "WITHOUT",
        "woundTest": "wound?",
        "wounded": "Wounded",
        "woundedOn": "wounded ✓",
        "woundsTitle": "WOUNDS"
      },
      "situation": "Situation",
      "skip": "Skip ▸",
      "slotRisk": "{name} W{wound}% · D{death}%",
      "spent": "Already took a hit this turn",
      "stash": {
        "coverage": "Covers",
        "desc": {
          "banner": "Guardian banner — the leader bears it: −6% wound, −4% death for every other member while he stands",
          "bonusForza": "+15 to Strength checks",
          "bonusPerc": "+15 to Perception checks",
          "healing": "+20 HP to the most hurt member — usable before a check",
          "potion": "Fully heals one wounded member",
          "rope": "+15 to Strength or Constitution checks",
          "smoke": "+15 to Agility checks"
        },
        "hint": "Pick what to pack — {used}/{slots} slots",
        "title": "The bag"
      },
      "successPct": "~{pct}% success",
      "throwCounter": "Roll {current} of {total}",
      "title": "The Seed Crate",
      "transitSkip": "Click to move on",
      "treasureValue": "treasure ~{value} gold",
      "verdict": {
        "almost": "BY A WHISKER",
        "bigwin": "TRIUMPH",
        "epicfail": "RUIN",
        "fail": "DEFEAT",
        "fail_dead": "DEFEAT · FALLEN",
        "fail_wound": "DEFEAT · WOUNDED",
        "win": "VICTORY"
      },
      "verdictAck": "Continue",
      "verdictContinue": "{verdict} — continue",
      "woundPct": "wound {pct}%",
      "woundedRisk": "already wounded: increased risk"
    },
    "roster": {
      "filter": {
        "addFilter": "Add",
        "addFilterAriaLabel": "Add filter",
        "clearFilters": "Clear",
        "clearFiltersAriaLabel": "Clear all filters",
        "label": "Filter",
        "noResults": "No residents match current filters",
        "operator": {
          "equals": "=",
          "equalsDescription": "Stat equals threshold",
          "equalsTooltip": "Equals",
          "greaterThan": ">",
          "greaterThanDescription": "Stat is greater than threshold",
          "greaterThanOrEqual": ">=",
          "greaterThanOrEqualDescription": "Stat is greater than or equal to threshold",
          "greaterThanOrEqualTooltip": "Greater than or equal",
          "greaterThanTooltip": "Greater than",
          "lessThan": "<",
          "lessThanDescription": "Stat is less than threshold",
          "lessThanOrEqual": "<=",
          "lessThanOrEqualDescription": "Stat is less than or equal to threshold",
          "lessThanOrEqualTooltip": "Less than or equal",
          "lessThanTooltip": "Less than"
        },
        "operatorLabel": "Operator",
        "removeFilterAriaLabel": "Remove filter",
        "stat": {
          "agility": "Agility",
          "agilityDescription": "Initiative stat for turn order",
          "agilityTooltip": "Agility",
          "armor": "Armor",
          "armorDescription": "Flat armor value",
          "armorTooltip": "Armor",
          "block": "Block",
          "blockDescription": "Block chance percentage",
          "blockTooltip": "Block %",
          "critChance": "Crit Chance",
          "critChanceDescription": "Critical hit chance percentage",
          "critChanceTooltip": "Critical Chance %",
          "damage": "Damage",
          "damageDescription": "Base damage value",
          "damageTooltip": "Damage",
          "effectiveDamage": "Effective Damage",
          "effectiveDamageDescription": "Damage after mitigation",
          "effectiveDamageTooltip": "Effective Damage",
          "evasion": "Evasion",
          "evasionDescription": "Flat evasion value",
          "evasionTooltip": "Evasion",
          "hitChance": "Hit Chance",
          "hitChanceDescription": "Calculated hit chance percentage",
          "hitChanceTooltip": "Hit Chance %",
          "hp": "HP",
          "hpDescription": "Current health points",
          "hpTooltip": "Health Points",
          "htk": "Hits to Kill",
          "htkDescription": "Number of hits to kill target",
          "htkTooltip": "Hits to Kill",
          "lifesteal": "Lifesteal",
          "lifestealDescription": "Lifesteal percentage",
          "lifestealTooltip": "Lifesteal %",
          "regen": "Regen",
          "regenDescription": "Health regeneration per turn",
          "regenTooltip": "Regeneration",
          "resistance": "Resistance",
          "resistanceDescription": "Damage resistance percentage",
          "resistanceTooltip": "Resistance %",
          "txc": "TxC",
          "txcDescription": "Flat to-hit chance bonus",
          "txcTooltip": "To-Hit Chance",
          "unknown": "Unknown",
          "unknownDescription": "Unknown stat",
          "unknownTooltip": "Unknown stat",
          "ward": "Ward",
          "wardDescription": "Flat shield value",
          "wardTooltip": "Ward"
        },
        "statLabel": "Stat",
        "thresholdAriaLabel": "Filter threshold value",
        "thresholdLabel": "Threshold"
      },
      "sort": {
        "fatigueAsc": "Fatigue",
        "fatigueAscDescription": "Sort by fatigue (lowest first)",
        "fatigueAscTooltip": "Sort: Fatigue (lowest first)",
        "hpDesc": "HP",
        "hpDescDescription": "Sort by current HP (highest first)",
        "hpDescTooltip": "Sort: HP (highest first)",
        "label": "Sort",
        "nameAsc": "Name A → Z",
        "nameAscDescription": "Sort by display name alphabetically (A to Z)",
        "nameAscTooltip": "Sort: Name A → Z (click to reverse)",
        "nameDesc": "Name Z → A",
        "nameDescDescription": "Sort by display name alphabetically (Z to A)",
        "nameDescTooltip": "Sort: Name Z → A (click to reverse)"
      },
      "stats": {
        "hp": "Health",
        "stamina": "Stamina",
        "xpTitle": "{name} · {xp} XP"
      },
      "status": {
        "active": "Active",
        "assigned": "Assigned",
        "away": "Away",
        "dead": "Fallen",
        "exhausted": "Exhausted",
        "injured": "Injured"
      }
    },
    "slowMo": "Slow Mo",
    "spinDuration": "Spin Duration",
    "stat": {
      "accuracy": "Accuracy",
      "agility": "Agility",
      "armor": "Armor",
      "armorPen": "Armor Pen",
      "block": "Block",
      "castSpeed": "Cast Speed",
      "cooldownReduction": "Cooldown",
      "critChance": "Crit Chance",
      "critMult": "Crit Mult.",
      "damage": "Damage",
      "energyShield": "Energy Shield",
      "evasion": "Evasion",
      "lifesteal": "Lifesteal",
      "movementSpeed": "Move Speed",
      "penPercent": "Resist. Pen",
      "regen": "Regen",
      "resistance": "Resistance",
      "thorns": "Thorns",
      "ward": "Ward"
    },
    "stats": "Stats",
    "threatStatus": {
      "page": {
        "description": "Client-only component showcase for use client directive",
        "title": "Threat Status Indicator"
      },
      "title": "THREAT STATUS",
      "type": {
        "GOBLIN_RAID": "Goblin Raid",
        "PLAGUE": "Plague",
        "SIEGE": "Siege"
      },
      "urgency": {
        "calm": "CALM",
        "critical": "CRITICAL",
        "warning": "WARNING"
      }
    },
    "verdict": "Verdict",
    "world": {
      "anchors": {
        "village_01": "Village 01"
      },
      "back": "Back",
      "camera": {
        "reset": "Reset camera"
      },
      "clouds": {
        "far": "Far",
        "mid": "Mid",
        "near": "Near",
        "scale": "scale",
        "scales": "Cloud scales"
      },
      "debug": {
        "activeState": "Active state",
        "anchors": "Anchors",
        "atmosphere": "Atmosphere",
        "breath": "Breath",
        "camera": "Camera",
        "clearObjects": "Clear",
        "despawnWonders": "Despawn wonders",
        "hideUi": "Hide UI",
        "mouseWorld": "Mouse (world)",
        "objects": "Objects",
        "reducedMotion": "reduced motion",
        "regions": "Regions",
        "renderer": "Renderer",
        "seaPattern": "Pattern",
        "seaPatternAngle": "Motion angle",
        "seaPatternClose": "Close",
        "seaPatternColor": "Line color",
        "seaPatternLive": "Authored texture A1 / micro scroll",
        "seaPatternMotion": "Motion amount",
        "seaPatternMotionEnabled": "Motion on",
        "seaPatternOpacity": "Line opacity",
        "seaPatternPeriod": "Motion period",
        "seaPatternSaveDefault": "Save as default",
        "seaPatternSaveFailed": "Save failed (dev server only)",
        "seaPatternSaved": "Defaults written to source",
        "seaPatternSaving": "Saving…",
        "seaPatternScale": "Pattern scale",
        "seaPatternTitle": "Sea pattern — live",
        "settlementLost": "Settlement Lost",
        "showUi": "Show UI",
        "spawnObjects": "Spawn 60",
        "spawnWonders": "Spawn wonders",
        "statesTitle": "States",
        "title": "Debug",
        "water": "Water"
      },
      "error": "Failed to load world surface",
      "goblinInvasion": {
        "action": "PREPARE THE DEFENSES",
        "daysRemaining": "Days Remaining: {count}",
        "eventLabel": "Goblin Invasion",
        "invasion": "Invasion",
        "reminder": {
          "band_closing": "CLOSING IN",
          "band_distant": "APPROACHING",
          "band_imminent": "TOMORROW",
          "days_plural": "DAYS",
          "days_singular": "DAY"
        },
        "subtitle": "In {count} days an army will attack!",
        "timerLabel": "DAYS REMAINING",
        "title": "GOBLIN INVASION!",
        "viewDefenses": "VIEW DEFENSES",
        "warTable": {
          "arrival": "ARRIVAL",
          "arrivalCount": "2",
          "arrivalIn": "Arrival In",
          "arrivalUnit": "DAYS",
          "days": "DAYS",
          "description": "A goblin army is marching on your lands.",
          "dismiss": "Dismiss",
          "dismissReport": "Dismiss Report",
          "enemy": "ENEMY FORCE",
          "enemyCount": "3,200+",
          "enemySub": "Moving from the north",
          "enemyUnit": "GOBLINS",
          "estimatedArrival": "Estimated Arrival",
          "eventLabel": "WORLD EVENT · THREAT",
          "faction": "GOBLIN ARMY",
          "factionSub": "Large hostile force detected",
          "hostileForce": "Hostile Force",
          "parchmentDescription": "A goblin army is marching on our lands. Our scouts have spotted large enemy forces moving in from the north toward your stronghold.",
          "remaining": "REMAINING",
          "scoutReport": "Our scouts report a massive goblin vanguard marching from the Northern Wastes. Their target is clear: your stronghold will be razed unless defenses are prepared.",
          "targetName": "YOUR VILLAGE",
          "targetObjective": "Target Objective",
          "threat": "THREAT",
          "threatLevelCritical": "Threat Level: Critical",
          "threatLevelHigh": "Threat Level: High",
          "timeRemaining": "Time Remaining",
          "village": "YOUR VILLAGE",
          "villageSub": "Primary target",
          "warbands": "~3,500 Warbands",
          "willBeAttacked": "YOUR VILLAGE WILL BE ATTACKED.",
          "worldEvent": "World Event"
        }
      },
      "lab": {
        "back": "Back",
        "baseline": "Baseline",
        "title": "Sea Effect Lab",
        "waterField": "Water field"
      },
      "layers": {
        "dragHandle": "Drag to reorder",
        "offsetX": "Offset X",
        "offsetY": "Offset Y",
        "saveDefaults": "Save defaults",
        "scale": "Scale",
        "title": "Layers"
      },
      "loading": "Loading world surface…",
      "region": {
        "enchanted_forest": "Enchanted Forest"
      },
      "settlementLost": {
        "cta": "BEGIN A NEW SETTLEMENT",
        "losses": {
          "heroes": "Your heroes have fallen",
          "stores": "The stores are lost",
          "walls": "The walls were breached"
        },
        "lossesTitle": "What was lost",
        "stats": {
          "daysSurvived": "Days survived",
          "goldEarned": "Gold earned",
          "residentsLost": "Residents lost"
        },
        "subtitle": "The settlement has fallen. What was learned carries on.",
        "title": "SETTLEMENT LOST"
      },
      "states": {
        "corrupted": "Corrupted",
        "default": "Default",
        "threat_manifesting": "Manifesting",
        "threatened": "Threatened"
      },
      "title": "World Surface"
    },
    "worldEvents": {
      "resource": "Resource",
      "resource-tint": "Resource Tint",
      "threat": "Threat",
      "threat-tint": "Threat Tint",
      "weather": "Weather",
      "weather-tint": "Weather Tint"
    },
    "woundPercent": "Wound Percent"
  },
  "lore": {
    "app": {
      "title": "Lore"
    },
    "character": {
      "sewerCartographer": {
        "body": "Nessuno ha mai disegnato le fogne del villaggio. Nessuno, tranne lui. E lui non è mai tornato su.",
        "title": "Il Cartografo delle Fogne"
      },
      "spyBlade": {
        "body": "Non tutti gli spie portano pugnali. Alcuni portano silenzi così affilati da tagliare la verità a metà.",
        "title": "La Lama della Spia"
      }
    },
    "faction": {
      "obsidianTyrant": {
        "body": "Il Tiranno Ossidiano non cerca la carne. Cerca lo specchio in cui il calore di un coraggio ancora si riflette.",
        "title": "L'Anima dell'Ossidiana"
      },
      "wolfHunger": {
        "body": "I lupi delle rovine non attaccano per fame: seguono un ordine più antico, scritto nelle fosse fuori dalle mura.",
        "title": "La Fame del Branco"
      }
    },
    "history": {
      "ashesOath": {
        "body": "«Quando l'ultima fiamma si sarà spenta, il patto sarà sigillato con la cenere, non con il sangue.»",
        "title": "Il Giuramento delle Ceneri"
      },
      "firstForge": {
        "body": "Prima che le fucine spettrali crollassero, un solo martello fu battuto sotto il sole. Ne rimane il calco.",
        "title": "La Prima Forgia"
      },
      "ghostFurnace": {
        "body": "I wraith non difendono le fornaci. Le fornaci li ricordano. E il ricordo è più forte della paura.",
        "title": "Le Fornaci Spettrali"
      }
    },
    "item": {
      "emberSigil": {
        "body": "Gli Ember Sigils non sono moneta: sono memoria compressa di un'era in cui il sole non tramontava mai.",
        "title": "Il Sigillo di Brace"
      },
      "stellarBlood": {
        "body": "Quando il sangue delle stelle tocca la terra, il terreno diventa memoria. Quando tocca un uomo, diventa legge.",
        "title": "Sangue Stellare"
      }
    },
    "location": {
      "forestResin": {
        "body": "La resina della foresta settentrionale non brucia. Canta, a bassa voce, quando il vento cambia direzione.",
        "title": "Resina del Confine"
      },
      "gateWhispers": {
        "body": "Di notte, le grate del villaggio vibrano come corde. I vecchi dicono che le mura stiano imparando a parlare.",
        "title": "I Sussurri del Cancello"
      },
      "marketScales": {
        "body": "Nel mercato del villaggio, le bilance non misurano il peso. Misurano quanto un uomo è disposto a dimenticare.",
        "title": "Le Bilance del Mercato"
      }
    },
    "questChronicle": {
      "defaultNarrative": "La pattuglia avanza tra le rovine — ogni passo potrebbe essere l'ultimo.",
      "loreLocked": "Una vibrazione antica attende nel silenzio di questa impresa."
    }
  },
  "spell": {
    "app": {
      "title": "Spell Creation"
    },
    "by": "by",
    "ccOptions": {
      "knockback": "Knockback",
      "none": "None",
      "silence": "Silence",
      "slow": "Slow",
      "stun": "Stun"
    },
    "configSaved": "Configuration saved as default!",
    "configSavedDescription": "Spell, card order, collapsed states, and slider positions saved",
    "currentMana": "Current Mana",
    "damageTypes": {
      "magical": "Magical",
      "physical": "Physical",
      "true": "True"
    },
    "decreases": "Decreases",
    "dragToSelect": "Drag to select tick",
    "editor": {
      "advancedStats": "Advanced Stats",
      "balanceRequired": "Balance Required (Cost ≠ 0)",
      "balanced": "✓ Balanced",
      "budget": "Budget: {value}",
      "cancel": "Cancel",
      "ccEffect": "CC Effect",
      "coreStats": "Core Stats",
      "damageType": "Damage Type",
      "descriptionPlaceholder": "Spell description...",
      "effectPercent": "Effect (%)",
      "hpEquivalent": "HP-equivalent",
      "mana": "mana",
      "manaCost": "Mana Cost",
      "namePlaceholder": "Spell Name",
      "none": "None",
      "overpriced": "Overpriced",
      "passive": "Passive",
      "recommended": "Recommended",
      "resetToBase": "Reset to Base",
      "resetWeight": "Reset weight",
      "resetWeights": "Reset Weights",
      "saveSpell": "Save Spell",
      "scalingStat": "Scaling Stat",
      "situationalModifiers": "Situational Modifiers (JSON array)",
      "spellPower": "Spell Power",
      "tags": "Tags",
      "tagsPlaceholder": "comma-separated tags",
      "targetStat": "Target Stat",
      "title": "Edit Spell",
      "type": "Type",
      "underpriced": "Underpriced"
    },
    "for": "for",
    "hide": "Hide",
    "increases": "Increases",
    "labels": {
      "balance": "Balance",
      "duration": "Duration (Turns)",
      "effect": "Effect",
      "modification": "Modification %"
    },
    "level": "Level",
    "library": {
      "availableCount": "{count} spells available",
      "avgDamage": "Avg Damage (effect% × base × eco)",
      "avgDamageFormula": "base = {base}, eco = {eco}",
      "baseEffect": "Base Effect",
      "configLibrary": "Config Library",
      "cooldown": "CD: {value} turns",
      "delete": "Delete",
      "editSpell": "Edit Spell",
      "newSpell": "New Spell",
      "selectPrompt": "Select a spell to view details",
      "selectSpell": "Select Spell",
      "statistics": "Statistics",
      "title": "Spell Library"
    },
    "malus": "Malus",
    "modificationPercent": "Modification %",
    "power": "Power",
    "preview": {
      "buffDebuff": "{type} for {eco} turn{turns}",
      "title": "Preview Spell"
    },
    "range": "Range",
    "recommendedMana": "Recommended Mana",
    "reset": "Reset",
    "save": {
      "defaultDescription": "Spell, card order, collapsed states, and slider positions saved",
      "defaultError": "Failed to save default",
      "defaultErrorDescription": "Please try again or check console for errors",
      "defaultSuccess": "Configuration saved as default!",
      "success": "Spell saved successfully!",
      "successDescription": "{name} has been added to your library"
    },
    "saveDefault": "Save Default",
    "saveDefaultTitle": "Save current configuration as default for new spells",
    "saveFailed": "Failed to save default",
    "saveFailedDescription": "Please try again or check console for errors",
    "scalingStats": {
      "attack": "Attack",
      "defense": "Defense",
      "health": "Health",
      "magic": "Magic",
      "mana": "Mana"
    },
    "school": "School",
    "show": "Show",
    "spellAddedToLibrary": "\"{name}\" has been added to your library",
    "spellCreator": "Spell Creator",
    "spellSaved": "Spell saved successfully!",
    "statInvestment": "Stat Investment",
    "stats": {
      "aoe": "AoE Targets",
      "cooldown": "Cooldown",
      "dangerous": "Dangerous",
      "duration": "Duration",
      "manaCost": "Mana Cost",
      "pierce": "Pierce",
      "scale": "Scale",
      "tags": "Tags"
    },
    "summary": "Summary",
    "targetCost": "Target Cost",
    "tickValue": "Tick value",
    "turns": "turns",
    "types": {
      "buff": "Buff",
      "cc": "CC",
      "crowdControl": "Crowd Control",
      "damage": "Damage",
      "debuff": "Debuff",
      "heal": "Heal",
      "shield": "Shield"
    }
  },
  "sts": {
    "app": {
      "title": "STS"
    }
  },
  "styleLab": {
    "accessibility": {
      "hide": "Hide Style Lab",
      "show": "Show Style Lab"
    },
    "actions": {
      "randomize": "Randomize",
      "reset": "Reset"
    },
    "app": {
      "title": "Style Lab"
    },
    "panel": {
      "kicker": "Style Laboratory"
    }
  },
  "wanderlust": {
    "app": {
      "title": "Wanderlust"
    },
    "mockup": {
      "error": "Failed to load mockup content",
      "help": "Please check the console for details",
      "title": "Wanderlust Mockup"
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
