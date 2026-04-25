/**
 * Minimal Gameplay QA Checklist Generator
 *
 * Generates automated QA checklists based on Minimal Gameplay configuration.
 * Creates dynamic testing tasks covering UI, mechanics, and edge cases.
 */

import type { MinimalGameplayConfig, MinimalGameplayResidentDefinition, MinimalGameplayLocationDefinition, MinimalGameplayHUDFieldConfig } from '@/balancing/config/idleVillage/minimalGameplayConfig';

export interface QAChecklistTask {
  id: string;
  category: 'ui' | 'mechanics' | 'locations' | 'residents' | 'performance' | 'edge-cases';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  automationReady: boolean;
  estimatedTimeMinutes: number;
  prerequisites?: string[];
  relatedConfig?: string;
}

export interface QAChecklistSection {
  sectionId: string;
  sectionName: string;
  description: string;
  tasks: QAChecklistTask[];
  estimatedTotalTime: number;
}

export interface QAChecklistReport {
  generatedAt: string;
  configVersion: string;
  totalTasks: number;
  sections: QAChecklistSection[];
  estimatedTotalTime: number;
  coverage: {
    uiElements: number;
    gameMechanics: number;
    locations: number;
    residents: number;
    edgeCases: number;
    performanceTests: number;
  };
}

/**
 * Generates comprehensive QA checklist from Minimal Gameplay configuration
 */
export function generateQAChecklist(config: MinimalGameplayConfig): QAChecklistReport {
  const sections: QAChecklistSection[] = [];

  // Generate UI testing tasks
  sections.push(generateUITestingSection(config));

  // Generate location/activity testing tasks
  sections.push(generateLocationTestingSection(config));

  // Generate resident testing tasks
  sections.push(generateResidentTestingSection(config));

  // Generate game mechanics testing tasks
  sections.push(generateMechanicsTestingSection(config));

  // Generate edge cases testing tasks
  sections.push(generateEdgeCasesSection(config));

  // Generate performance testing tasks
  sections.push(generatePerformanceSection(config));

  // Calculate totals
  const totalTasks = sections.reduce((sum, section) => sum + section.tasks.length, 0);
  const estimatedTotalTime = sections.reduce((sum, section) => sum + section.estimatedTotalTime, 0);

  // Calculate coverage
  const coverage = {
    uiElements: sections.find(s => s.sectionId === 'ui-testing')?.tasks.length || 0,
    gameMechanics: sections.find(s => s.sectionId === 'mechanics-testing')?.tasks.length || 0,
    locations: sections.find(s => s.sectionId === 'location-testing')?.tasks.length || 0,
    residents: sections.find(s => s.sectionId === 'resident-testing')?.tasks.length || 0,
    edgeCases: sections.find(s => s.sectionId === 'edge-cases')?.tasks.length || 0,
    performanceTests: sections.find(s => s.sectionId === 'performance-testing')?.tasks.length || 0,
  };

  return {
    generatedAt: new Date().toISOString(),
    configVersion: config.version,
    totalTasks,
    sections,
    estimatedTotalTime,
    coverage,
  };
}

/**
 * Generate UI testing tasks
 */
function generateUITestingSection(config: MinimalGameplayConfig): QAChecklistSection {
  const tasks: QAChecklistTask[] = [];

  // Hero section testing
  tasks.push({
    id: 'ui-hero-display',
    category: 'ui',
    priority: 'critical',
    title: 'Hero Section Display',
    description: 'Verify hero section renders correctly with configured content',
    steps: [
      'Load MinimalGameplayPage',
      'Check hero subtitle displays: "' + config.ui.hero.subtitle + '"',
      'Check hero description displays: "' + config.ui.hero.description + '"',
      'Verify theme token applied correctly',
    ],
    expectedResult: 'Hero section displays all configured text and styling',
    automationReady: true,
    estimatedTimeMinutes: 5,
    relatedConfig: 'ui.hero',
  });

  // HUD fields testing
  config.ui.hudFields.forEach((field, index) => {
    tasks.push({
      id: `ui-hud-field-${field.id}`,
      category: 'ui',
      priority: 'critical',
      title: `HUD Field: ${field.label}`,
      description: `Verify ${field.label} HUD field displays and updates correctly`,
      steps: [
        'Load game with initial values',
        'Check HUD shows "' + field.label + '" label',
        'Verify value displays in correct format',
        ...(field.supportsWarningBadge ? ['Check warning badge appears when appropriate'] : []),
      ],
      expectedResult: `${field.label} displays correctly with proper formatting and warnings`,
      automationReady: true,
      estimatedTimeMinutes: 3,
      relatedConfig: `ui.hudFields[${index}]`,
    });
  });

  // Game over modal testing
  if (config.ui.showGameOverPanel) {
    tasks.push({
      id: 'ui-game-over-modal',
      category: 'ui',
      priority: 'high',
      title: 'Game Over Modal Display',
      description: 'Verify game over modal shows correct messages and stats',
      steps: [
        'Trigger game over condition',
        'Check modal displays appropriate title and description',
        'Verify configured stats are shown',
        'Test restart functionality',
      ],
      expectedResult: 'Game over modal displays correctly with all configured elements',
      automationReady: false,
      estimatedTimeMinutes: 10,
      relatedConfig: 'ui.gameOver',
    });
  }

  return {
    sectionId: 'ui-testing',
    sectionName: 'UI Testing',
    description: 'Comprehensive testing of all UI elements and displays',
    tasks,
    estimatedTotalTime: tasks.reduce((sum, task) => sum + task.estimatedTimeMinutes, 0),
  };
}

/**
 * Generate location/activity testing tasks
 */
function generateLocationTestingSection(config: MinimalGameplayConfig): QAChecklistSection {
  const tasks: QAChecklistTask[] = [];

  config.locations.forEach((location, index) => {
    // Location display
    tasks.push({
      id: `location-display-${location.id}`,
      category: 'locations',
      priority: 'high',
      title: `Location Display: ${location.label}`,
      description: `Verify ${location.label} location displays correctly`,
      steps: [
        'Load game',
        'Check location shows correct icon: ' + location.icon,
        'Verify label displays: "' + location.label + '"',
        'Check description is shown',
        'Verify location is clickable for resident assignment',
      ],
      expectedResult: `${location.label} displays all configured elements correctly`,
      automationReady: true,
      estimatedTimeMinutes: 5,
      relatedConfig: `locations[${index}]`,
    });

    // Activity execution
    tasks.push({
      id: `location-activity-${location.id}`,
      category: 'locations',
      priority: 'critical',
      title: `Activity Execution: ${location.label}`,
      description: `Test ${location.label} activity execution and rewards`,
      steps: [
        'Assign resident to location',
        'Wait for activity completion',
        'Verify correct rewards are applied',
        'Check telemetry events are emitted',
        'Verify resident fatigue increases appropriately',
      ],
      expectedResult: `Activity completes successfully with correct rewards and side effects`,
      automationReady: false,
      estimatedTimeMinutes: 15,
      relatedConfig: `locations[${index}]`,
    });

    // Recommended stats validation
    if (location.recommendedStatTags && location.recommendedStatTags.length > 0) {
      tasks.push({
        id: `location-stats-${location.id}`,
        category: 'locations',
        priority: 'medium',
        title: `Stat Requirements: ${location.label}`,
        description: `Verify recommended stats affect ${location.label} performance`,
        steps: [
          'Assign resident with high recommended stats',
          'Assign resident with low recommended stats',
          'Compare success rates and rewards',
          'Verify stat-based modifiers work correctly',
        ],
        expectedResult: `Stats correctly influence activity success and rewards`,
        automationReady: false,
        estimatedTimeMinutes: 10,
        relatedConfig: `locations[${index}].recommendedStatTags`,
      });
    }
  });

  return {
    sectionId: 'location-testing',
    sectionName: 'Location & Activity Testing',
    description: 'Testing of all game locations and their associated activities',
    tasks,
    estimatedTotalTime: tasks.reduce((sum, task) => sum + task.estimatedTimeMinutes, 0),
  };
}

/**
 * Generate resident testing tasks
 */
function generateResidentTestingSection(config: MinimalGameplayConfig): QAChecklistSection {
  const tasks: QAChecklistTask[] = [];

  config.residents.forEach((resident, index) => {
    // Resident display
    tasks.push({
      id: `resident-display-${resident.id}`,
      category: 'residents',
      priority: 'high',
      title: `Resident Display: ${resident.label}`,
      description: `Verify ${resident.label} displays correctly in UI`,
      steps: [
        'Load game',
        'Check resident appears in roster',
        'Verify name and level display',
        'Check stat values are shown',
        'Verify resident can be assigned to locations',
      ],
      expectedResult: `${resident.label} displays correctly with all stats and information`,
      automationReady: true,
      estimatedTimeMinutes: 5,
      relatedConfig: `residents[${index}]`,
    });

    // Stat validation
    tasks.push({
      id: `resident-stats-${resident.id}`,
      category: 'residents',
      priority: 'critical',
      title: `Resident Stats: ${resident.label}`,
      description: `Verify ${resident.label} stats are used correctly in activities`,
      steps: [
        'Assign resident to various activities',
        'Monitor activity success rates',
        'Verify stat-based modifiers',
        'Check stat growth over time',
      ],
      expectedResult: `Resident stats correctly affect game outcomes`,
      automationReady: false,
      estimatedTimeMinutes: 20,
      relatedConfig: `residents[${index}].stats`,
    });

    // Fatigue mechanics
    tasks.push({
      id: `resident-fatigue-${resident.id}`,
      category: 'residents',
      priority: 'high',
      title: `Fatigue Mechanics: ${resident.label}`,
      description: `Test fatigue accumulation and recovery for ${resident.label}`,
      steps: [
        'Assign resident to high-fatigue activities',
        'Monitor fatigue increase',
        'Test rest periods',
        'Verify fatigue affects activity performance',
        'Check injury risk at high fatigue',
      ],
      expectedResult: `Fatigue system works correctly with accumulation, recovery, and performance impact`,
      automationReady: false,
      estimatedTimeMinutes: 15,
      relatedConfig: `residents[${index}]`,
    });
  });

  return {
    sectionId: 'resident-testing',
    sectionName: 'Resident Testing',
    description: 'Testing of resident display, stats, and fatigue mechanics',
    tasks,
    estimatedTotalTime: tasks.reduce((sum, task) => sum + task.estimatedTimeMinutes, 0),
  };
}

/**
 * Generate game mechanics testing tasks
 */
function generateMechanicsTestingSection(config: MinimalGameplayConfig): QAChecklistSection {
  const tasks: QAChecklistTask[] = [];

  // Loop timing tests
  tasks.push({
    id: 'mechanics-loop-timing',
    category: 'mechanics',
    priority: 'critical',
    title: 'Game Loop Timing',
    description: 'Verify game loop runs at correct intervals',
    steps: [
      'Start game loop',
      'Monitor tick intervals (' + config.loop.tickIntervalMs + 'ms)',
      'Verify activities complete at expected times',
      'Check autosave triggers every ' + config.loop.autosaveIntervalMs + 'ms',
      'Test warmup delay (' + config.loop.warmupDelayMs + 'ms)',
    ],
    expectedResult: 'Game loop runs at precise intervals with correct timing',
    automationReady: false,
    estimatedTimeMinutes: 15,
    relatedConfig: 'loop',
  });

  // Speed multiplier testing
  tasks.push({
    id: 'mechanics-speed-multiplier',
    category: 'mechanics',
    priority: 'high',
    title: 'Speed Multiplier',
    description: 'Test game speed controls work correctly',
    steps: [
      'Set speed to 1x (default)',
      'Increase to maximum (' + config.loop.maxSpeedMultiplier + 'x)',
      'Verify activities complete faster',
      'Check UI updates correctly',
      'Test autosave intervals scale appropriately',
    ],
    expectedResult: 'Speed multiplier correctly affects game pacing',
    automationReady: false,
    estimatedTimeMinutes: 10,
    relatedConfig: 'loop.maxSpeedMultiplier',
  });

  // Resource management
  tasks.push({
    id: 'mechanics-resources',
    category: 'mechanics',
    priority: 'critical',
    title: 'Resource Management',
    description: 'Verify gold and food resources are managed correctly',
    steps: [
      'Start with zero resources',
      'Complete gold-generating activities',
      'Spend gold on food purchases',
      'Monitor resource balances',
      'Verify resource caps and minimums',
    ],
    expectedResult: 'Resources are earned, spent, and tracked accurately',
    automationReady: false,
    estimatedTimeMinutes: 20,
    relatedConfig: 'ui.hudFields',
  });

  return {
    sectionId: 'mechanics-testing',
    sectionName: 'Game Mechanics Testing',
    description: 'Testing of core game mechanics and systems',
    tasks,
    estimatedTotalTime: tasks.reduce((sum, task) => sum + task.estimatedTimeMinutes, 0),
  };
}

/**
 * Generate edge cases testing tasks
 */
function generateEdgeCasesSection(config: MinimalGameplayConfig): QAChecklistSection {
  const tasks: QAChecklistTask[] = [];

  // Game over conditions
  Object.entries(config.ui.gameOver.messages).forEach(([reason, message]) => {
    tasks.push({
      id: `edge-case-game-over-${reason}`,
      category: 'edge-cases',
      priority: 'critical',
      title: `Game Over: ${message.title}`,
      description: `Test game over condition: ${reason}`,
      steps: [
        'Set up conditions for ' + reason,
        'Trigger game over',
        'Verify correct message displays: "' + message.title + '"',
        'Check description: "' + message.description + '"',
        'Test restart functionality',
      ],
      expectedResult: `Game over handled correctly with appropriate messaging`,
      automationReady: false,
      estimatedTimeMinutes: 10,
      relatedConfig: `ui.gameOver.messages.${reason}`,
    });
  });

  // Resource depletion
  tasks.push({
    id: 'edge-case-resource-depletion',
    category: 'edge-cases',
    priority: 'high',
    title: 'Resource Depletion Scenarios',
    description: 'Test behavior when resources reach critical levels',
    steps: [
      'Deplete food to warning levels',
      'Verify warning badges appear',
      'Continue until food reaches zero',
      'Check game over triggers',
      'Test recovery scenarios',
    ],
    expectedResult: 'Resource depletion handled gracefully with warnings and game over',
    automationReady: false,
    estimatedTimeMinutes: 15,
    relatedConfig: 'ui.hudFields',
  });

  // Resident injury scenarios
  tasks.push({
    id: 'edge-case-resident-injury',
    category: 'edge-cases',
    priority: 'high',
    title: 'Resident Injury Scenarios',
    description: 'Test resident injury mechanics and recovery',
    steps: [
      'Cause resident injury through high fatigue',
      'Verify injured resident cannot work',
      'Test rest recovery',
      'Check all-injured game over condition',
      'Verify injury affects multiple residents',
    ],
    expectedResult: 'Injury system works correctly with proper recovery mechanics',
    automationReady: false,
    estimatedTimeMinutes: 15,
    relatedConfig: 'residents',
  });

  // Maximum capacity testing
  tasks.push({
    id: 'edge-case-max-capacity',
    category: 'edge-cases',
    priority: 'medium',
    title: 'Maximum Capacity Testing',
    description: 'Test system behavior at maximum resource/activity levels',
    steps: [
      'Maximize all resources',
      'Assign all residents to activities',
      'Test speed multiplier at maximum',
      'Verify no crashes or data corruption',
      'Check performance remains acceptable',
    ],
    expectedResult: 'System handles maximum loads without issues',
    automationReady: false,
    estimatedTimeMinutes: 10,
    relatedConfig: 'loop.maxSpeedMultiplier',
  });

  return {
    sectionId: 'edge-cases',
    sectionName: 'Edge Cases & Error Handling',
    description: 'Testing of edge cases, error conditions, and boundary scenarios',
    tasks,
    estimatedTotalTime: tasks.reduce((sum, task) => sum + task.estimatedTimeMinutes, 0),
  };
}

/**
 * Generate performance testing tasks
 */
function generatePerformanceSection(config: MinimalGameplayConfig): QAChecklistSection {
  const tasks: QAChecklistTask[] = [];

  // Load time testing
  tasks.push({
    id: 'performance-load-time',
    category: 'performance',
    priority: 'high',
    title: 'Page Load Performance',
    description: 'Measure MinimalGameplayPage load time and responsiveness',
    steps: [
      'Navigate to MinimalGameplayPage',
      'Measure time to initial render',
      'Check time to interactive state',
      'Verify no blocking operations',
      'Test with different network conditions',
    ],
    expectedResult: 'Page loads within acceptable time limits (< 3 seconds)',
    automationReady: true,
    estimatedTimeMinutes: 10,
    relatedConfig: 'version',
  });

  // Game loop performance
  tasks.push({
    id: 'performance-game-loop',
    category: 'performance',
    priority: 'high',
    title: 'Game Loop Performance',
    description: 'Monitor performance during extended gameplay sessions',
    steps: [
      'Run game for 30+ minutes',
      'Monitor frame rates',
      'Check memory usage',
      'Verify no performance degradation',
      'Test with maximum speed multiplier',
    ],
    expectedResult: 'Game maintains stable performance over time',
    automationReady: false,
    estimatedTimeMinutes: 30,
    relatedConfig: 'loop',
  });

  // Autosave performance
  tasks.push({
    id: 'performance-autosave',
    category: 'performance',
    priority: 'medium',
    title: 'Autosave Performance',
    description: 'Verify autosave operations are non-blocking',
    steps: [
      'Monitor autosave triggers',
      'Check save operation duration',
      'Verify UI remains responsive during saves',
      'Test autosave with large game state',
      'Verify save integrity',
    ],
    expectedResult: 'Autosave operations are fast and non-blocking',
    automationReady: false,
    estimatedTimeMinutes: 15,
    relatedConfig: 'loop.autosaveIntervalMs',
  });

  return {
    sectionId: 'performance-testing',
    sectionName: 'Performance Testing',
    description: 'Performance validation and optimization testing',
    tasks,
    estimatedTotalTime: tasks.reduce((sum, task) => sum + task.estimatedTimeMinutes, 0),
  };
}
