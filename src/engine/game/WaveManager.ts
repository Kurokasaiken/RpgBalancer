import { Entity } from '../core/entity';
import { createEmptyAttributes } from '../core/stats';

export interface WaveConfig {
    waveNumber: number;
    enemyCount: number;
    difficultyMultiplier: number;
}

export class WaveManager {
    private currentWave: number = 1;

    getWaveInfo(): WaveConfig {
        return {
            waveNumber: this.currentWave,
            enemyCount: Math.min(1 + Math.floor(this.currentWave / 2), 5), // Cap at 5 enemies for now
            difficultyMultiplier: 1 + (this.currentWave - 1) * 0.1 // +10% stats per wave
        };
    }

    generateWave(): Entity[] {
        const config = this.getWaveInfo();
        const enemies: Entity[] = [];

        for (let i = 0; i < config.enemyCount; i++) {
            const enemy = this.createEnemy(config.difficultyMultiplier, i);
            enemies.push(enemy);
        }

        return enemies;
    }

    nextWave() {
        this.currentWave++;
    }

    reset() {
        this.currentWave = 1;
    }

    private createEnemy(multiplier: number, index: number): Entity {
        // Simple scaling logic: Base stats * multiplier
        // For now, we manually set attributes to match target stats roughly
        // In a real scenario, we might use the reverse solver or just direct stat manipulation if Entity supported it

        const attributes = createEmptyAttributes();

        // Base: 50 HP, 5 Dmg (approx)
        // Scale attributes
        attributes.constitution = Math.floor(5 * multiplier); // +50 HP base -> * mult
        attributes.strength = Math.floor(3 * multiplier);     // +6 Dmg base -> * mult
        attributes.dexterity = Math.floor(2 * multiplier);    // Speed/Crit

        const name = `Wave ${this.currentWave} Enemy ${index + 1}`;
        const enemy = new Entity(crypto.randomUUID(), name, attributes);

        return enemy;
    }
}
