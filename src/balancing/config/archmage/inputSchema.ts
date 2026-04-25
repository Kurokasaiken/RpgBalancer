/**
 * Input Schema for STS Numeric Simulator
 * 
 * Defines keyboard bindings and input handling for the text-based simulator.
 * All bindings are configurable and can be customized per user preference.
 */

export type STSInputAction = 'play_card' | 'end_turn' | 'reset' | 'cancel';

export interface STSInputBinding {
  key: string;
  action: STSInputAction;
  value?: string;
}

export interface STSInputSchema {
  bindings: STSInputBinding[];
}

/**
 * Default input bindings for the STS simulator
 */
export const DEFAULT_INPUT_SCHEMA: STSInputSchema = {
  bindings: [
    // Number keys 1-9 for card selection
    { key: '1', action: 'play_card', value: '1' },
    { key: '2', action: 'play_card', value: '2' },
    { key: '3', action: 'play_card', value: '3' },
    { key: '4', action: 'play_card', value: '4' },
    { key: '5', action: 'play_card', value: '5' },
    { key: '6', action: 'play_card', value: '6' },
    { key: '7', action: 'play_card', value: '7' },
    { key: '8', action: 'play_card', value: '8' },
    { key: '9', action: 'play_card', value: '9' },
    
    // Control keys
    { key: 'Enter', action: 'end_turn' },
    { key: ' ', action: 'end_turn' }, // Spacebar as alternative
    { key: 'Backspace', action: 'cancel' },
    { key: 'Escape', action: 'reset' },
    
    // Additional shortcuts for power users
    { key: 'r', action: 'reset' },
    { key: 'n', action: 'end_turn' }, // "next turn"
    { key: 'c', action: 'cancel' }, // "cancel"
    
    // Help and info
    { key: '?', action: 'play_card', value: 'help' },
    { key: 'h', action: 'play_card', value: 'help' }
  ]
};

/**
 * Alternative input schema for mobile/compact keyboards
 */
export const COMPACT_INPUT_SCHEMA: STSInputSchema = {
  bindings: [
    // Use letter keys for card selection (easier on mobile)
    { key: 'q', action: 'play_card', value: '1' },
    { key: 'w', action: 'play_card', value: '2' },
    { key: 'e', action: 'play_card', value: '3' },
    { key: 'r', action: 'play_card', value: '4' },
    { key: 't', action: 'play_card', value: '5' },
    
    // Essential controls only
    { key: 'Enter', action: 'end_turn' },
    { key: 'Escape', action: 'reset' },
    { key: 'Backspace', action: 'cancel' }
  ]
};

/**
 * Input schema for accessibility - larger key set
 */
export const ACCESSIBILITY_INPUT_SCHEMA: STSInputSchema = {
  bindings: [
    // Number row
    { key: '1', action: 'play_card', value: '1' },
    { key: '2', action: 'play_card', value: '2' },
    { key: '3', action: 'play_card', value: '3' },
    { key: '4', action: 'play_card', value: '4' },
    { key: '5', action: 'play_card', value: '5' },
    { key: '6', action: 'play_card', value: '6' },
    { key: '7', action: 'play_card', value: '7' },
    { key: '8', action: 'play_card', value: '8' },
    { key: '9', action: 'play_card', value: '9' },
    { key: '0', action: 'play_card', value: '10' },
    
    // Numpad
    { key: 'numpad1', action: 'play_card', value: '1' },
    { key: 'numpad2', action: 'play_card', value: '2' },
    { key: 'numpad3', action: 'play_card', value: '3' },
    { key: 'numpad4', action: 'play_card', value: '4' },
    { key: 'numpad5', action: 'play_card', value: '5' },
    { key: 'numpad6', action: 'play_card', value: '6' },
    { key: 'numpad7', action: 'play_card', value: '7' },
    { key: 'numpad8', action: 'play_card', value: '8' },
    { key: 'numpad9', action: 'play_card', value: '9' },
    { key: 'numpad0', action: 'play_card', value: '10' },
    
    // Multiple end turn options
    { key: 'Enter', action: 'end_turn' },
    { key: ' ', action: 'end_turn' },
    { key: 'numpadEnter', action: 'end_turn' },
    { key: 'Tab', action: 'end_turn' },
    
    // Multiple reset options
    { key: 'Escape', action: 'reset' },
    { key: 'F1', action: 'reset' },
    { key: 'Delete', action: 'reset' },
    
    // Multiple cancel options
    { key: 'Backspace', action: 'cancel' },
    { key: 'F2', action: 'cancel' },
    { key: 'Insert', action: 'cancel' }
  ]
};
