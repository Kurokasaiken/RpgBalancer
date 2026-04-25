/**
 * Timer Utilities
 * 
 * Centralized timer management utilities for the RPG Balancer project.
 * Provides safe timer operations that comply with project guidelines.
 */

/**
 * Safe setTimeout wrapper that returns a timer ID
 */
export function setSafeTimeout(callback: () => void, delay: number): NodeJS.Timeout {
  return setTimeout(callback, delay);
}

/**
 * Safe clearTimeout wrapper
 */
export function clearSafeTimeout(timerId: NodeJS.Timeout | null): void {
  if (timerId) {
    clearTimeout(timerId);
  }
}

/**
 * Safe setInterval wrapper
 */
export function setSafeInterval(callback: () => void, interval: number): NodeJS.Timeout {
  return setInterval(callback, interval);
}

/**
 * Safe clearInterval wrapper
 */
export function clearSafeInterval(timerId: NodeJS.Timeout | null): void {
  if (timerId) {
    clearInterval(timerId);
  }
}
