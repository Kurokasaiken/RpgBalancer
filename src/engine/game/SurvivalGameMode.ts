import { Entity } from '../core/entity';
import { WaveManager } from './WaveManager';

export type GameState = 'START' | 'PLAYING' | 'SHOP' | 'GAME_OVER';

export class SurvivalGameMode {
    public state: GameState = 'START';
    public player: Entity | null = null;
    public waveManager: WaveManager;
    public currentEnemies: Entity[] = [];
    public gold: number = 0;
    public score: number = 0;

    constructor() {
        this.waveManager = new WaveManager();
    }

    startGame(player: Entity) {
        this.player = player;
        this.waveManager.reset();
        this.gold = 0;
        this.score = 0;
        this.startWave();
    }

    startWave() {
        this.state = 'PLAYING';
        this.currentEnemies = this.waveManager.generateWave();
    }

    // Called when an enemy is defeated
    onEnemyDefeated(enemyId: string) {
        this.currentEnemies = this.currentEnemies.filter(e => e.id !== enemyId);
        this.gold += 10 + (this.waveManager.getWaveInfo().waveNumber * 2);
        this.score += 100 * this.waveManager.getWaveInfo().waveNumber;

        if (this.currentEnemies.length === 0) {
            this.completeWave();
        }
    }

    // Called when player is defeated
    onPlayerDefeated() {
        this.state = 'GAME_OVER';
    }

    completeWave() {
        this.state = 'SHOP';
        this.waveManager.nextWave();
        // Heal player slightly between waves?
        // this.player?.heal(10); 
    }

    purchaseUpgrade(cost: number, applyUpgrade: () => void): boolean {
        if (this.gold >= cost) {
            this.gold -= cost;
            applyUpgrade();
            return true;
        }
        return false;
    }

    healPlayer(amount: number) {
        if (this.player) {
            this.player.heal(amount);
        }
    }

    upgradePlayerStat(stat: 'strength' | 'constitution', amount: number) {
        if (this.player) {
            if (stat === 'strength') {
                this.player.attributes.strength += amount;
                this.player.derivedStats.attackPower += amount * 2; // Simple update
            } else if (stat === 'constitution') {
                this.player.attributes.constitution += amount;
                this.player.derivedStats.maxHp += amount * 10;
                this.player.currentHp += amount * 10;
            }
        }
    }

    nextRound() {
        if (this.state === 'SHOP') {
            this.startWave();
        }
    }
}
