/**
 * Global State Helper
 * 
 * Provides access to shared state from other modules (like Balancer)
 * that is stored in localStorage but not yet centralized in a manager.
 */

import { DEFAULT_STATS } from './types';
import type { StatBlock } from './types';

const BALANCER_STORAGE_KEY = 'balancer_state';

export class GlobalStateHelper {
    /**
     * Get the current stats from the Balancer (saved in localStorage)
     * Returns default stats if not found.
     */
    static getBalancerStats(): StatBlock {
        try {
            const saved = localStorage.getItem(BALANCER_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...DEFAULT_STATS, ...parsed };
            }
        } catch (e) {
            console.error("Failed to load balancer state", e);
        }
        return { ...DEFAULT_STATS };
    }

    /**
     * Get a specific base stat value (e.g. 'damage', 'hp')
     */
    static getBaseStat(stat: keyof StatBlock): number {
        const stats = this.getBalancerStats();
        return stats[stat] || 0;
    }

    /**
     * Get the Base Damage value
     */
    static getBaseDamage(): number {
        return this.getBaseStat('damage');
    }
}
