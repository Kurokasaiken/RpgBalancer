/**
 * Default macro definitions for the STS numeric simulator.
 * 
 * These macros provide convenient shortcuts for common command sequences.
 * They are loaded config-first by the command parser and UI hints.
 */

import type { STSMacroDefinition } from './commandTypes';

/**
 * Default set of terminal macros for quick gameplay shortcuts.
 */
export const DEFAULT_STS_MACROS: STSMacroDefinition[] = [
  {
    id: 'burst',
    label: 'Burst',
    description: 'Play cards 1, 2, 3 then end turn',
    hotkey: 'B',
    sample: 'burst',
    steps: [
      { type: 'play_card', value: 1 },
      { type: 'play_card', value: 2 },
      { type: 'play_card', value: 3 },
      { type: 'system', value: 'end' },
    ],
  },
  {
    id: 'all_in',
    label: 'All-In',
    description: 'Play all available cards (1-9) then end turn',
    sample: 'all_in',
    steps: [
      { type: 'play_card', value: 1 },
      { type: 'play_card', value: 2 },
      { type: 'play_card', value: 3 },
      { type: 'play_card', value: 4 },
      { type: 'play_card', value: 5 },
      { type: 'play_card', value: 6 },
      { type: 'play_card', value: 7 },
      { type: 'play_card', value: 8 },
      { type: 'play_card', value: 9 },
      { type: 'system', value: 'end' },
    ],
  },
  {
    id: 'skip',
    label: 'Skip',
    description: 'End turn without playing any cards',
    hotkey: 'S',
    sample: 'skip',
    steps: [
      { type: 'system', value: 'end' },
    ],
  },
  {
    id: 'quick_reset',
    label: 'Quick Reset',
    description: 'Reset the simulation with a new seed',
    hotkey: 'Q',
    sample: 'quick_reset',
    steps: [
      { type: 'system', value: 'reset' },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    description: 'Show available commands and macros',
    hotkey: '?',
    sample: 'help',
    steps: [
      { type: 'system', value: 'help' },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    description: 'Display current game state summary',
    sample: 'status',
    steps: [
      { type: 'system', value: 'status' },
    ],
  },
];

/**
 * Helper to build a macro by ID from the default set.
 * Returns undefined if the macro is not found.
 */
export function getDefaultMacro(id: string): STSMacroDefinition | undefined {
  return DEFAULT_STS_MACROS.find((macro) => macro.id === id);
}

/**
 * Helper to get all macros that have a hotkey assigned.
 * Useful for UI hint generation.
 */
export function getHotkeyMacros(): STSMacroDefinition[] {
  return DEFAULT_STS_MACROS.filter((macro) => macro.hotkey);
}
