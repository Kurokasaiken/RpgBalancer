/**
 * Game Intent Interface
 * 
 * Minimal intent abstraction to remove Director -> Store coupling violations
 * Only 4 allowed intent types as per architecture constraints
 */

export interface GameIntent {
  type: 'SPAWN_HERO' | 'ENABLE_JOB' | 'TRIGGER_WAVE' | 'GAME_OVER';
  payload: any;
  timestamp: number;
}

/**
 * Minimal Intent Bridge
 * 
 * Simple bridge between Director and Store without full event system rewrite
 */
export class IntentBridge {
  private static storeHandler: ((intent: GameIntent) => void) | null = null;
  
  static registerStoreHandler(handler: (intent: GameIntent) => void) {
    this.storeHandler = handler;
  }
  
  static sendToStore(intent: GameIntent) {
    if (this.storeHandler) {
      this.storeHandler(intent);
    } else {
      console.warn('[IntentBridge] No store handler registered');
    }
  }
}
