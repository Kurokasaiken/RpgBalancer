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
    "examples": {
      "characterGreeting": "{gender, select, male {Welcome, my lord} female {Welcome, my lady} other {Welcome, adventurer}}",
      "riskLevel": "{level, select, low {Low risk} medium {Medium risk} high {High risk} other {Unknown risk}}",
      "swordCount": "{count, plural, one {one sword} other {{count} swords}}"
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
    "critPercent": "Crit Percent",
    "deathPercent": "Death Percent",
    "difficulty": "Difficulty",
    "dpr": "DPR",
    "hitStop": "Hit Stop",
    "nearMissBand": "Near Miss Band",
    "presentation": {
      "director": {
        "title": "World Presentation Director"
      },
      "inspector": {
        "title": "Output Inspector",
        "activeState": "Active State",
        "runtimeObjects": "Runtime Objects",
        "visualStateOverrides": "Visual Overrides",
        "tick": "Tick"
      },
      "layerOrder": {
        "title": "Layer Order",
        "moveUp": "move up",
        "moveDown": "move down"
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
      }
    },
    "slotRackPage": {
      "route": "Route: /minimal-slotRack",
      "subtitle": "Minimal Slice · SlotRack",
      "title": "SLOT RACK ISOLATED"
    },
    "slowMo": "Slow Mo",
    "spinDuration": "Spin Duration",
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
      "debug": {
        "activeState": "Active state",
        "anchors": "Anchors",
        "camera": "Camera",
        "clearObjects": "Clear",
        "mouseWorld": "Mouse (world)",
        "objects": "Objects",
        "regions": "Regions",
        "renderer": "Renderer",
        "spawnObjects": "Spawn 60",
        "statesTitle": "States",
        "title": "Debug"
      },
      "error": "Failed to load world surface",
      "layers": {
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
