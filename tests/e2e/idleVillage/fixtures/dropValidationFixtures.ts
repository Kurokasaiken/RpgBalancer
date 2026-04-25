/**
 * Drop Validation Test Fixtures
 * 
 * Test fixtures and scenarios for Idle Village drop validation
 * Playwright smoke tests covering all validation rules and UI feedback.
 * 
 * @since NP-069 – Idle Village Drop Validation Playwright Smoke
 */

import type { Page } from '@playwright/test';

/**
 * Drop validation scenario types
 */
export type DropScenarioType = 
  | 'valid_drop'
  | 'crew_limit_violation'
  | 'fatigue_threshold_violation'
  | 'stat_tag_missing'
  | 'location_incompatible'
  | 'capacity_overflow'
  | 'multiple_violations'
  | 'edge_case_empty_tags'
  | 'edge_case_max_fatigue'
  | 'cross_type_move';

/**
 * Drop validation test scenario
 */
export interface DropValidationScenario {
  /** Scenario identifier */
  id: string;
  /** Scenario type */
  type: DropScenarioType;
  /** Scenario description */
  description: string;
  /** Expected validation result */
  expectedResult: 'allowed' | 'forbidden' | 'warning';
  /** Expected UI feedback */
  expectedFeedback: {
    /** Should show error message */
    showError: boolean;
    /** Should show warning message */
    showWarning: boolean;
    /** Should show suggestions */
    showSuggestions: boolean;
    /** Expected error keywords */
    errorKeywords?: string[];
    /** Expected warning keywords */
    warningKeywords?: string[];
    /** Expected suggestion count */
    suggestionCount?: number;
  };
  /** Source location data */
  source: {
    id: string;
    type: 'residential' | 'commercial' | 'industrial' | 'recreational' | 'special';
    currentOccupants: number;
    maxOccupants: number;
    fatigueLevel: number;
    statTags: string[];
  };
  /** Target location data */
  target: {
    id: string;
    type: 'residential' | 'commercial' | 'industrial' | 'recreational' | 'special';
    currentOccupants: number;
    maxOccupants: number;
    fatigueLevel: number;
    statTags: string[];
  };
  /** Resident data */
  resident: {
    id: string;
    name: string;
    stats: Record<string, number>;
    tags: string[];
    fatigueLevel: number;
  };
  /** Test setup requirements */
  setup: {
    /** Required UI elements */
    elements: string[];
    /** Required state */
    state?: Record<string, unknown>;
    /** Additional setup steps */
    steps?: string[];
  };
}

/**
 * Drop validation test fixtures
 */
export const DROP_VALIDATION_SCENARIOS: DropValidationScenario[] = [
  {
    id: 'valid-drop-residential',
    type: 'valid_drop',
    description: 'Valid drop from residential to residential location',
    expectedResult: 'allowed',
    expectedFeedback: {
      showError: false,
      showWarning: false,
      showSuggestions: false,
    },
    source: {
      id: 'residence-1',
      type: 'residential',
      currentOccupants: 2,
      maxOccupants: 4,
      fatigueLevel: 30,
      statTags: ['housing', 'basic_needs'],
    },
    target: {
      id: 'residence-2',
      type: 'residential',
      currentOccupants: 1,
      maxOccupants: 4,
      fatigueLevel: 20,
      statTags: ['housing', 'basic_needs'],
    },
    resident: {
      id: 'resident-1',
      name: 'Test Resident',
      stats: { strength: 10, agility: 8, intelligence: 12 },
      tags: ['housing', 'basic_needs'],
      fatigueLevel: 25,
    },
    setup: {
      elements: ['residence-1', 'residence-2', 'resident-1'],
      steps: [
        'Load idle village map',
        'Ensure both residential locations are visible',
        'Ensure resident is available for dragging',
      ],
    },
  },
  {
    id: 'crew-limit-violation',
    type: 'crew_limit_violation',
    description: 'Drop violates crew limit for target location',
    expectedResult: 'forbidden',
    expectedFeedback: {
      showError: true,
      showWarning: false,
      showSuggestions: true,
      errorKeywords: ['capacity', 'maximum', 'crew'],
      suggestionCount: 2,
    },
    source: {
      id: 'residence-1',
      type: 'residential',
      currentOccupants: 1,
      maxOccupants: 4,
      fatigueLevel: 30,
      statTags: ['housing', 'basic_needs'],
    },
    target: {
      id: 'residence-2',
      type: 'residential',
      currentOccupants: 4, // At max capacity
      maxOccupants: 4,
      fatigueLevel: 20,
      statTags: ['housing', 'basic_needs'],
    },
    resident: {
      id: 'resident-1',
      name: 'Test Resident',
      stats: { strength: 10, agility: 8, intelligence: 12 },
      tags: ['housing', 'basic_needs'],
      fatigueLevel: 25,
    },
    setup: {
      elements: ['residence-1', 'residence-2', 'resident-1'],
      steps: [
        'Load idle village map',
        'Set target location to maximum capacity',
        'Ensure resident is available for dragging',
      ],
    },
  },
  {
    id: 'fatigue-threshold-violation',
    type: 'fatigue_threshold_violation',
    description: 'Drop violates fatigue threshold for resident',
    expectedResult: 'forbidden',
    expectedFeedback: {
      showError: true,
      showWarning: false,
      showSuggestions: true,
      errorKeywords: ['fatigue', 'tired', 'rest'],
      suggestionCount: 2,
    },
    source: {
      id: 'residence-1',
      type: 'residential',
      currentOccupants: 2,
      maxOccupants: 4,
      fatigueLevel: 30,
      statTags: ['housing', 'basic_needs'],
    },
    target: {
      id: 'residence-2',
      type: 'residential',
      currentOccupants: 1,
      maxOccupants: 4,
      fatigueLevel: 20,
      statTags: ['housing', 'basic_needs'],
    },
    resident: {
      id: 'resident-1',
      name: 'Test Resident',
      stats: { strength: 10, agility: 8, intelligence: 12 },
      tags: ['housing', 'basic_needs'],
      fatigueLevel: 85, // High fatigue
    },
    setup: {
      elements: ['residence-1', 'residence-2', 'resident-1'],
      steps: [
        'Load idle village map',
        'Set resident fatigue to high level',
        'Ensure resident is available for dragging',
      ],
    },
  },
  {
    id: 'stat-tag-missing',
    type: 'stat_tag_missing',
    description: 'Drop violates stat tag requirements for location',
    expectedResult: 'forbidden',
    expectedFeedback: {
      showError: true,
      showWarning: false,
      showSuggestions: true,
      errorKeywords: ['tags', 'required', 'skills'],
      suggestionCount: 2,
    },
    source: {
      id: 'residence-1',
      type: 'residential',
      currentOccupants: 2,
      maxOccupants: 4,
      fatigueLevel: 30,
      statTags: ['housing', 'basic_needs'],
    },
    target: {
      id: 'commercial-1',
      type: 'commercial',
      currentOccupants: 1,
      maxOccupants: 6,
      fatigueLevel: 20,
      statTags: ['commerce', 'services'],
    },
    resident: {
      id: 'resident-1',
      name: 'Test Resident',
      stats: { strength: 10, agility: 8, intelligence: 12 },
      tags: [], // No required tags for commercial
      fatigueLevel: 25,
    },
    setup: {
      elements: ['residence-1', 'commercial-1', 'resident-1'],
      steps: [
        'Load idle village map',
        'Ensure commercial location is visible',
        'Ensure resident has no commercial tags',
      ],
    },
  },
  {
    id: 'location-incompatible',
    type: 'location_incompatible',
    description: 'Drop violates location type compatibility',
    expectedResult: 'forbidden',
    expectedFeedback: {
      showError: true,
      showWarning: false,
      showSuggestions: true,
      errorKeywords: ['incompatible', 'location type'],
      suggestionCount: 2,
    },
    source: {
      id: 'industrial-1',
      type: 'industrial',
      currentOccupants: 3,
      maxOccupants: 8,
      fatigueLevel: 40,
      statTags: ['production', 'manufacturing'],
    },
    target: {
      id: 'residence-1',
      type: 'residential',
      currentOccupants: 1,
      maxOccupants: 4,
      fatigueLevel: 20,
      statTags: ['housing', 'basic_needs'],
    },
    resident: {
      id: 'resident-1',
      name: 'Test Resident',
      stats: { strength: 10, agility: 8, intelligence: 12 },
      tags: ['production', 'manufacturing'],
      fatigueLevel: 25,
    },
    setup: {
      elements: ['industrial-1', 'residence-1', 'resident-1'],
      steps: [
        'Load idle village map',
        'Ensure industrial and residential locations are visible',
        'Ensure resident has industrial tags',
      ],
    },
  },
  {
    id: 'capacity-overflow',
    type: 'capacity_overflow',
    description: 'Drop causes capacity overflow in target location',
    expectedResult: 'warning',
    expectedFeedback: {
      showError: false,
      showWarning: true,
      showSuggestions: true,
      warningKeywords: ['capacity', 'utilization', 'overflow'],
      suggestionCount: 2,
    },
    source: {
      id: 'residence-1',
      type: 'residential',
      currentOccupants: 2,
      maxOccupants: 4,
      fatigueLevel: 30,
      statTags: ['housing', 'basic_needs'],
    },
    target: {
      id: 'residence-2',
      type: 'residential',
      currentOccupants: 3,
      maxOccupants: 4,
      fatigueLevel: 20,
      statTags: ['housing', 'basic_needs'],
    },
    resident: {
      id: 'resident-1',
      name: 'Test Resident',
      stats: { strength: 10, agility: 8, intelligence: 12 },
      tags: ['housing', 'basic_needs'],
      fatigueLevel: 25,
    },
    setup: {
      elements: ['residence-1', 'residence-2', 'resident-1'],
      steps: [
        'Load idle village map',
        'Set target location to near capacity',
        'Ensure resident is available for dragging',
      ],
    },
  },
  {
    id: 'multiple-violations',
    type: 'multiple_violations',
    description: 'Drop violates multiple validation rules',
    expectedResult: 'forbidden',
    expectedFeedback: {
      showError: true,
      showWarning: false,
      showSuggestions: true,
      errorKeywords: ['violations', 'multiple'],
      suggestionCount: 5,
    },
    source: {
      id: 'industrial-1',
      type: 'industrial',
      currentOccupants: 3,
      maxOccupants: 8,
      fatigueLevel: 40,
      statTags: ['production', 'manufacturing'],
    },
    target: {
      id: 'residence-1',
      type: 'residential',
      currentOccupants: 4, // At max capacity
      maxOccupants: 4,
      fatigueLevel: 20,
      statTags: ['housing', 'basic_needs'],
    },
    resident: {
      id: 'resident-1',
      name: 'Test Resident',
      stats: { strength: 10, agility: 8, intelligence: 12 },
      tags: ['production', 'manufacturing'], // Wrong tags
      fatigueLevel: 85, // High fatigue
    },
    setup: {
      elements: ['industrial-1', 'residence-1', 'resident-1'],
      steps: [
        'Load idle village map',
        'Set target location to maximum capacity',
        'Set resident to high fatigue with wrong tags',
      ],
    },
  },
  {
    id: 'edge-case-empty-tags',
    type: 'edge_case_empty_tags',
    description: 'Edge case: resident with empty tags',
    expectedResult: 'forbidden',
    expectedFeedback: {
      showError: true,
      showWarning: false,
      showSuggestions: true,
      errorKeywords: ['tags', 'missing'],
      suggestionCount: 2,
    },
    source: {
      id: 'residence-1',
      type: 'residential',
      currentOccupants: 2,
      maxOccupants: 4,
      fatigueLevel: 30,
      statTags: ['housing', 'basic_needs'],
    },
    target: {
      id: 'residence-2',
      type: 'residential',
      currentOccupants: 1,
      maxOccupants: 4,
      fatigueLevel: 20,
      statTags: ['housing', 'basic_needs'],
    },
    resident: {
      id: 'resident-1',
      name: 'Test Resident',
      stats: { strength: 10, agility: 8, intelligence: 12 },
      tags: [], // Empty tags
      fatigueLevel: 25,
    },
    setup: {
      elements: ['residence-1', 'residence-2', 'resident-1'],
      steps: [
        'Load idle village map',
        'Ensure resident has no tags',
      ],
    },
  },
  {
    id: 'edge-case-max-f fatigue',
    type: 'edge_case_max_fatigue',
    description: 'Edge case: resident with maximum fatigue',
    expectedResult: 'forbidden',
    expectedFeedback: {
      showError: true,
      showWarning: false,
      showSuggestions: true,
      errorKeywords: ['fatigue', 'critical'],
      suggestionCount: 2,
    },
    source: {
      id: 'residence-1',
      type: 'residential',
      currentOccupants: 2,
      maxOccupants: 4,
      fatigueLevel: 30,
      statTags: ['housing', 'basic_needs'],
    },
    target: {
      id: 'residence-2',
      type: 'residential',
      currentOccupants: 1,
      maxOccupants: 4,
      fatigueLevel: 20,
      statTags: ['housing', 'basic_needs'],
    },
    resident: {
      id: 'resident-1',
      name: 'Test Resident',
      stats: { strength: 10, agility: 8, intelligence: 12 },
      tags: ['housing', 'basic_needs'],
      fatigueLevel: 100, // Maximum fatigue
    },
    setup: {
      elements: ['residence-1', 'residence-2', 'resident-1'],
      steps: [
        'Load idle village map',
        'Set resident fatigue to maximum level',
      ],
    },
  },
  {
    id: 'cross-type-move',
    type: 'cross_type_move',
    description: 'Cross-type move with warning',
    expectedResult: 'warning',
    expectedFeedback: {
      showError: false,
      showWarning: true,
      showSuggestions: true,
      warningKeywords: ['cross-type', 'different'],
      suggestionCount: 2,
    },
    source: {
      id: 'residence-1',
      type: 'residential',
      currentOccupants: 2,
      maxOccupants: 4,
      fatigueLevel: 30,
      statTags: ['housing', 'basic_needs'],
    },
    target: {
      id: 'recreational-1',
      type: 'recreational',
      currentOccupants: 1,
      maxOccupants: 8,
      fatigueLevel: 20,
      statTags: ['recreation', 'leisure'],
    },
    resident: {
      id: 'resident-1',
      name: 'Test Resident',
      stats: { strength: 10, agility: 8, intelligence: 12 },
      tags: ['housing', 'basic_needs'],
      fatigueLevel: 25,
    },
    setup: {
      elements: ['residence-1', 'recreational-1', 'resident-1'],
      steps: [
        'Load idle village map',
        'Ensure recreational location is visible',
      ],
    },
  },
];

/**
 * Get scenario by ID
 */
export function getScenarioById(id: string): DropValidationScenario | undefined {
  return DROP_VALIDATION_SCENARIOS.find(scenario => scenario.id === id);
}

/**
 * Get scenarios by type
 */
export function getScenariosByType(type: DropScenarioType): DropValidationScenario[] {
  return DROP_VALIDATION_SCENARIOS.filter(scenario => scenario.type === type);
}

/**
 * Get all scenarios with expected result
 */
export function getScenariosByExpectedResult(result: 'allowed' | 'forbidden' | 'warning'): DropValidationScenario[] {
  return DROP_VALIDATION_SCENARIOS.filter(scenario => scenario.expectedResult === result);
}

/**
 * Get scenarios that require error feedback
 */
export function getErrorScenarios(): DropValidationScenario[] {
  return DROP_VALIDATION_SCENARIOS.filter(scenario => scenario.expectedFeedback.showError);
}

/**
 * Get scenarios that require warning feedback
 */
export function getWarningScenarios(): DropValidationScenario[] {
  return DROP_VALIDATION_SCENARIOS.filter(scenario => scenario.expectedFeedback.showWarning);
}

/**
 * Get scenarios that require suggestions
 */
export function getSuggestionScenarios(): DropValidationScenario[] {
  return DROP_VALIDATION_SCENARIOS.filter(scenario => scenario.expectedFeedback.showSuggestions);
}

/**
 * Get edge case scenarios
 */
export function getEdgeCaseScenarios(): DropValidationScenario[] {
  return DROP_VALIDATION_SCENARIOS.filter(scenario => 
    scenario.type === 'edge_case_empty_tags' || scenario.type === 'edge_case_max_fatigue'
  );
}

/**
 * Get mobile-specific scenarios
 */
export function getMobileScenarios(): DropValidationScenario[] {
  // Return scenarios that are particularly relevant for mobile testing
  return [
    getScenarioById('valid-drop-residential'),
    getScenarioById('crew-limit-violation'),
    getScenarioById('fatigue-threshold-violation'),
    getScenarioById('capacity-overflow'),
  ].filter(Boolean) as DropValidationScenario[];
}

/**
 * Get desktop-specific scenarios
 */
export function getDesktopScenarios(): DropValidationScenario[] {
  // Return all scenarios for comprehensive desktop testing
  return DROP_VALIDATION_SCENARIOS;
}

/**
 * Get cross-browser test scenarios
 */
export function getCrossBrowserScenarios(): DropValidationScenario[] {
  // Return scenarios that test core functionality across browsers
  return [
    getScenarioById('valid-drop-residential'),
    getScenarioById('crew-limit-violation'),
    getScenarioById('stat-tag-missing'),
    getScenarioById('multiple-violations'),
  ].filter(Boolean) as DropValidationScenario[];
}

/**
 * Setup page for drop validation testing
 */
export async function setupDropValidationPage(page: Page, scenario: DropValidationScenario): Promise<void> {
  // Navigate to idle village map
  await page.goto('/idle-village/map');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Execute setup steps if provided
  if (scenario.setup.steps) {
    for (const step of scenario.setup.steps) {
      // This would be implemented based on the actual UI
      console.log(`Setup step: ${step}`);
    }
  }
  
  // Wait for required elements to be visible
  for (const element of scenario.setup.elements) {
    await page.waitForSelector(`[data-testid="${element}"]`, { timeout: 10000 });
  }
}

/**
 * Get drag and drop selectors for scenario
 */
export function getDragDropSelectors(scenario: DropValidationScenario): {
  source: string;
  target: string;
  resident: string;
} {
  return {
    source: `[data-testid="${scenario.source.id}"]`,
    target: `[data-testid="${scenario.target.id}"]`,
    resident: `[data-testid="${scenario.resident.id}"]`,
  };
}

/**
 * Get validation feedback selectors
 */
export function getValidationFeedbackSelectors(): {
  errorMessage: string;
  warningMessage: string;
  suggestions: string;
  dropFeedback: string;
} {
  return {
    errorMessage: '[data-testid="validation-error"]',
    warningMessage: '[data-testid="validation-warning"]',
    suggestions: '[data-testid="validation-suggestions"]',
    dropFeedback: '[data-testid="drop-feedback"]',
  };
}

/**
 * Get viewport configurations for testing
 */
export const VIEWPORT_CONFIGURATIONS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
  'mobile-landscape': { width: 667, height: 375 },
};

/**
 * Get browser configurations for testing
 */
export const BROWSER_CONFIGURATIONS = [
  { name: 'chromium', channel: 'chrome' },
  { name: 'firefox', channel: 'firefox' },
  { name: 'webkit', channel: 'safari' },
];

/**
 * Get test timeout configurations
 */
export const TIMEOUT_CONFIGURATIONS = {
  default: 30000,
  drag: 10000,
  feedback: 5000,
  navigation: 15000,
};

export type {
  DropScenarioType,
  DropValidationScenario,
};
