import { z } from 'zod';
import { StackConfigSchema, defaultStackConfig } from './stackConfig';
import { ModifierRegistry } from '../config/idleVillage/gameplayModifierRegistry';

class ModifierStack {
  private stack: any[];
  private config: z.infer<typeof StackConfigSchema>;

  constructor(config: z.infer<typeof StackConfigSchema>) {
    this.stack = [];
    this.config = config;
  }

  addModifier(modifier: any) {
    // Add modifier to stack
    this.stack.push(modifier);
  }

  removeModifier(modifier: any) {
    // Remove modifier from stack
    this.stack = this.stack.filter((m) => m !== modifier);
  }

  getActiveModifiers() {
    // Return active modifiers
    return this.stack;
  }
}

export const ModifierStack = new ModifierStack(defaultStackConfig);