/**
 * Assignment Keyboard Shortcuts - NP-020
 * 
 * Keyboard shortcut management for assignment undo/redo operations.
 * Provides platform-specific key combinations, event handling, and
 * integration with the undo engine.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import {
  type AssignmentUndoConfig,
  type KeyboardShortcutConfig,
  getPlatformShortcut,
  DEFAULT_ASSIGNMENT_UNDO_CONFIG,
} from '../config/assignmentUndoConfig';

const diagnostics = createSandboxDiagnostics('AssignmentKeyboardShortcuts', 'shortcuts');

/**
 * Keyboard shortcut events
 */
export interface KeyboardShortcutEvents {
  /** Fired when shortcut is triggered */
  'shortcut-triggered': { 
    shortcut: KeyboardShortcutConfig;
    action: string;
    platformKey: string;
  };
  /** Fired when shortcut is registered */
  'shortcut-registered': { shortcut: KeyboardShortcutConfig };
  /** Fired when shortcut is unregistered */
  'shortcut-unregistered': { key: string };
  /** Fired when shortcuts are enabled/disabled */
  'shortcuts-toggled': { enabled: boolean };
  /** Fired when error occurs */
  'error': { error: Error; context: string };
}

/**
 * Keyboard shortcut handler
 */
export class AssignmentKeyboardShortcuts {
  private config: AssignmentUndoConfig;
  private enabled: boolean = true;
  private eventListeners: Map<keyof KeyboardShortcutEvents, Array<(data: any) => void>> = new Map();
  private keydownHandler: (event: KeyboardEvent) => void;
  private activeShortcuts: Map<string, KeyboardShortcutConfig> = new Map();
  private lastKeyTime: number = 0;
  private keySequence: string[] = [];
  private sequenceTimeout?: NodeJS.Timeout;

  constructor(config?: Partial<AssignmentUndoConfig>) {
    this.config = { ...DEFAULT_ASSIGNMENT_UNDO_CONFIG, ...config };
    this.enabled = this.config.ui.shortcuts.enabled;
    
    this.keydownHandler = this.handleKeyDown.bind(this);
    this.initializeEventListeners();
    this.registerShortcuts();
    this.attachEventListeners();
  }

  /**
   * Initialize event listeners
   */
  private initializeEventListeners(): void {
    const events: (keyof KeyboardShortcutEvents)[] = [
      'shortcut-triggered',
      'shortcut-registered',
      'shortcut-unregistered',
      'shortcuts-toggled',
      'error',
    ];
    
    events.forEach(event => {
      this.eventListeners.set(event, []);
    });
  }

  /**
   * Add event listener
   */
  public addEventListener<K extends keyof KeyboardShortcutEvents>(
    event: K,
    listener: (data: KeyboardShortcutEvents[K]) => void
  ): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(listener);
    this.eventListeners.set(event, listeners);
  }

  /**
   * Remove event listener
   */
  public removeEventListener<K extends keyof KeyboardShortcutEvents>(
    event: K,
    listener: (data: KeyboardShortcutEvents[K]) => void
  ): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(event, listeners);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit<K extends keyof KeyboardShortcutEvents>(event: K, data: KeyboardShortcutEvents[K]): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        diagnostics.error('Error in event listener', { event, error });
      }
    });
  }

  /**
   * Attach DOM event listeners
   */
  private attachEventListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.keydownHandler, { passive: false });
    }
  }

  /**
   * Detach DOM event listeners
   */
  private detachEventListeners(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keydownHandler);
    }
  }

  /**
   * Register all configured shortcuts
   */
  private registerShortcuts(): void {
    this.config.keyboardShortcuts.forEach(shortcut => {
      if (shortcut.enabled) {
        this.registerShortcut(shortcut);
      }
    });
  }

  /**
   * Register a single shortcut
   */
  public registerShortcut(shortcut: KeyboardShortcutConfig): void {
    const platformKey = getPlatformShortcut(shortcut);
    
    if (this.activeShortcuts.has(platformKey)) {
      diagnostics.warn('Shortcut already registered', { platformKey });
      return;
    }

    this.activeShortcuts.set(platformKey, shortcut);
    
    diagnostics.info('Registered shortcut', {
      key: shortcut.key,
      platformKey,
      action: shortcut.action,
    });

    this.emit('shortcut-registered', { shortcut });
  }

  /**
   * Unregister a shortcut
   */
  public unregisterShortcut(key: string): void {
    const shortcut = this.activeShortcuts.get(key);
    
    if (shortcut) {
      this.activeShortcuts.delete(key);
      
      diagnostics.info('Unregistered shortcut', { key });
      
      this.emit('shortcut-unregistered', { key });
    }
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled || !this.config.ui.shortcuts.enabled) {
      return;
    }

    try {
      const keyCombination = this.getKeyCombination(event);
      
      // Check for exact match
      if (this.activeShortcuts.has(keyCombination)) {
        const shortcut = this.activeShortcuts.get(keyCombination)!;
        
        if (this.config.ui.shortcuts.preventDefaults) {
          event.preventDefault();
        }
        
        this.triggerShortcut(shortcut, keyCombination);
        return;
      }

      // Handle key sequences (for complex shortcuts)
      this.handleKeySequence(keyCombination);
      
    } catch (error) {
      diagnostics.error('Error handling keyboard event', { error });
      this.emit('error', { error: error as Error, context: 'handle-keydown' });
    }
  }

  /**
   * Get key combination string from keyboard event
   */
  private getKeyCombination(event: KeyboardEvent): string {
    const parts: string[] = [];

    // Modifier keys
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.metaKey) parts.push('Cmd');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');

    // Main key
    let key = event.key;
    
    // Handle special keys
    switch (key) {
      case ' ':
        key = 'Space';
        break;
      case 'ArrowUp':
        key = 'Up';
        break;
      case 'ArrowDown':
        key = 'Down';
        break;
      case 'ArrowLeft':
        key = 'Left';
        break;
      case 'ArrowRight':
        key = 'Right';
        break;
      default:
        // Keep as is for letters, numbers, etc.
        break;
    }

    parts.push(key);
    
    return parts.join('+');
  }

  /**
   * Handle key sequences for complex shortcuts
   */
  private handleKeySequence(key: string): void {
    const now = Date.now();
    
    // Clear sequence if too much time has passed
    if (now - this.lastKeyTime > 1000) {
      this.keySequence = [];
    }
    
    this.keySequence.push(key);
    this.lastKeyTime = now;
    
    // Clear previous timeout
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout);
    }
    
    // Set new timeout to clear sequence
    this.sequenceTimeout = setTimeout(() => {
      this.keySequence = [];
    }, 1000);
    
    // Check for sequence matches
    const sequenceKey = this.keySequence.join(',');
    
    if (this.activeShortcuts.has(sequenceKey)) {
      const shortcut = this.activeShortcuts.get(sequenceKey)!;
      this.triggerShortcut(shortcut, sequenceKey);
      this.keySequence = [];
    }
  }

  /**
   * Trigger a shortcut action
   */
  private triggerShortcut(shortcut: KeyboardShortcutConfig, platformKey: string): void {
    // Add delay if configured
    if (this.config.ui.shortcuts.delay > 0) {
      setTimeout(() => {
        this.executeShortcutAction(shortcut, platformKey);
      }, this.config.ui.shortcuts.delay);
    } else {
      this.executeShortcutAction(shortcut, platformKey);
    }
  }

  /**
   * Execute shortcut action
   */
  private executeShortcutAction(shortcut: KeyboardShortcutConfig, platformKey: string): void {
    diagnostics.info('Shortcut triggered', {
      action: shortcut.action,
      key: shortcut.key,
      platformKey,
    });

    this.emit('shortcut-triggered', {
      shortcut,
      action: shortcut.action,
      platformKey,
    });
  }

  /**
   * Enable shortcuts
   */
  public enable(): void {
    if (!this.enabled) {
      this.enabled = true;
      this.emit('shortcuts-toggled', { enabled: true });
      diagnostics.info('Keyboard shortcuts enabled');
    }
  }

  /**
   * Disable shortcuts
   */
  public disable(): void {
    if (this.enabled) {
      this.enabled = false;
      this.emit('shortcuts-toggled', { enabled: false });
      diagnostics.info('Keyboard shortcuts disabled');
    }
  }

  /**
   * Toggle shortcuts enabled state
   */
  public toggle(): void {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Check if shortcuts are enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get all registered shortcuts
   */
  public getRegisteredShortcuts(): Map<string, KeyboardShortcutConfig> {
    return new Map(this.activeShortcuts);
  }

  /**
   * Get shortcuts by action type
   */
  public getShortcutsByAction(action: string): KeyboardShortcutConfig[] {
    return Array.from(this.activeShortcuts.values())
      .filter(shortcut => shortcut.action === action);
  }

  /**
   * Check if a specific shortcut is registered
   */
  public hasShortcut(key: string): boolean {
    return this.activeShortcuts.has(key);
  }

  /**
   * Get platform-specific key for a shortcut
   */
  public getPlatformKey(shortcut: KeyboardShortcutConfig): string {
    return getPlatformShortcut(shortcut);
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<AssignmentUndoConfig>): void {
    const oldEnabled = this.config.ui.shortcuts.enabled;
    this.config = { ...this.config, ...newConfig };
    
    // Re-register shortcuts if they changed
    if (newConfig.keyboardShortcuts) {
      this.clearShortcuts();
      this.registerShortcuts();
    }
    
    // Handle enabled state change
    const newEnabled = this.config.ui.shortcuts.enabled;
    if (oldEnabled !== newEnabled) {
      if (newEnabled) {
        this.enable();
      } else {
        this.disable();
      }
    }
  }

  /**
   * Clear all shortcuts
   */
  private clearShortcuts(): void {
    this.activeShortcuts.clear();
    diagnostics.info('Cleared all shortcuts');
  }

  /**
   * Get shortcut hints for display
   */
  public getShortcutHints(): Array<{
    action: string;
    description: string;
    keys: string[];
    platformKey: string;
  }> {
    const hints: Array<{
      action: string;
      description: string;
      keys: string[];
      platformKey: string;
    }> = [];

    this.config.keyboardShortcuts
      .filter(shortcut => shortcut.enabled)
      .forEach(shortcut => {
        const platformKey = getPlatformShortcut(shortcut);
        hints.push({
          action: shortcut.action,
          description: shortcut.description,
          keys: [shortcut.key],
          platformKey,
        });
      });

    return hints;
  }

  /**
   * Validate shortcut configuration
   */
  public validateShortcuts(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for duplicate keys
    const keyMap = new Map<string, KeyboardShortcutConfig[]>();
    
    this.config.keyboardShortcuts.forEach(shortcut => {
      const platformKey = getPlatformShortcut(shortcut);
      
      if (!keyMap.has(platformKey)) {
        keyMap.set(platformKey, []);
      }
      keyMap.get(platformKey)!.push(shortcut);
    });

    // Check for conflicts
    keyMap.forEach((shortcuts, key) => {
      if (shortcuts.length > 1) {
        warnings.push(`Multiple shortcuts use the same key: ${key}`);
        shortcuts.forEach(shortcut => {
          warnings.push(`  - ${shortcut.action}: ${shortcut.description}`);
        });
      }
    });

    // Check for invalid actions
    const validActions = ['undo', 'redo', 'clear_history', 'toggle_timeline'];
    
    this.config.keyboardShortcuts.forEach(shortcut => {
      if (!validActions.includes(shortcut.action)) {
        errors.push(`Invalid action: ${shortcut.action}`);
      }
      
      if (!shortcut.key) {
        errors.push(`Shortcut missing key: ${shortcut.action}`);
      }
      
      if (!shortcut.description) {
        warnings.push(`Shortcut missing description: ${shortcut.action}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Export shortcuts configuration
   */
  public exportConfiguration(): {
    shortcuts: KeyboardShortcutConfig[];
    enabled: boolean;
    platform: string;
    timestamp: number;
  } {
    return {
      shortcuts: this.config.keyboardShortcuts,
      enabled: this.enabled,
      platform: navigator.platform,
      timestamp: Date.now(),
    };
  }

  /**
   * Import shortcuts configuration
   */
  public importConfiguration(config: {
    shortcuts: KeyboardShortcutConfig[];
    enabled?: boolean;
  }): void {
    if (config.shortcuts) {
      this.clearShortcuts();
      config.shortcuts.forEach(shortcut => {
        this.registerShortcut(shortcut);
      });
    }

    if (typeof config.enabled === 'boolean') {
      if (config.enabled) {
        this.enable();
      } else {
        this.disable();
      }
    }

    diagnostics.info('Imported shortcuts configuration', {
      shortcuts: config.shortcuts.length,
      enabled: config.enabled,
    });
  }

  /**
   * Cleanup and destroy
   */
  public destroy(): void {
    this.detachEventListeners();
    
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout);
    }
    
    this.clearShortcuts();
    this.eventListeners.clear();
    
    diagnostics.info('Keyboard shortcuts destroyed');
  }
}

/**
 * React hook for keyboard shortcuts
 */
export function useAssignmentKeyboardShortcuts(
  config?: Partial<AssignmentUndoConfig>
): {
  shortcuts: AssignmentKeyboardShortcuts;
  isEnabled: boolean;
  enable: () => void;
  disable: () => void;
  toggle: () => void;
  getHints: () => Array<{
    action: string;
    description: string;
    keys: string[];
    platformKey: string;
  }>;
} {
  const [shortcuts] = useState(() => new AssignmentKeyboardShortcuts(config));
  const [isEnabled, setIsEnabled] = useState(shortcuts.isEnabled());

  useEffect(() => {
    const handleToggle = ({ enabled }: { enabled: boolean }) => {
      setIsEnabled(enabled);
    };

    shortcuts.addEventListener('shortcuts-toggled', handleToggle);

    return () => {
      shortcuts.removeEventListener('shortcuts-toggled', handleToggle);
      shortcuts.destroy();
    };
  }, [shortcuts]);

  const enable = useCallback(() => {
    shortcuts.enable();
  }, [shortcuts]);

  const disable = useCallback(() => {
    shortcuts.disable();
  }, [shortcuts]);

  const toggle = useCallback(() => {
    shortcuts.toggle();
  }, [shortcuts]);

  const getHints = useCallback(() => {
    return shortcuts.getShortcutHints();
  }, [shortcuts]);

  return {
    shortcuts,
    isEnabled,
    enable,
    disable,
    toggle,
    getHints,
  };
}
