import { Vector2 } from './Vector2';
import type { Trajectory, TrajectoryPoint } from './simulation';

export interface EngineV3Config {
  theSpinDurationMin: number;
  theSpinDurationMax: number;
  slowMoScale: number;
  slowMoDistance: number;
  hitStopFreeze: number;
  bounceCountMin: number;
  bounceCountMax: number;
  cameraPushIn: number;
  trailFadeMs: number;
  rngSeed: number;
}

export type EnginePhase = 'idle' | 'lancio' | 'caccia' | 'verdetto' | 'hit-stop' | 'complete';

export interface EngineState {
  phase: EnginePhase;
  trajectory: Trajectory | null;
  currentTime: number;
  ballPosition: Vector2;
  cameraOffset: Vector2;
  hitStopTimer: number;
}

/**
 * EngineV3 - Orchestrator for Destiny Astrolabe V3 canvas rendering
 * Manages trajectory playback with three acts, slow-motion, and hit-stop
 */
export class EngineV3 {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private state: EngineState;
  private config: EngineV3Config;
  private animationFrame: number | null = null;
  private lastTimestamp: number = 0;

  constructor(config: EngineV3Config) {
    this.config = config;
    this.state = {
      phase: 'idle',
      trajectory: null,
      currentTime: 0,
      ballPosition: new Vector2(0, 0),
      cameraOffset: new Vector2(0, 0),
      hitStopTimer: 0,
    };
  }

  /**
   * Initialize engine with canvas element
   */
  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Failed to get 2D context');
    }
  }

  /**
   * Start trajectory playback
   */
  playTrajectory(trajectory: Trajectory): void {
    this.state.trajectory = trajectory;
    this.state.currentTime = 0;
    this.state.phase = 'lancio';
    this.state.hitStopTimer = 0;
    this.lastTimestamp = performance.now();
    this.startAnimationLoop();
  }

  /**
   * Main animation loop
   */
  private startAnimationLoop(): void {
    const loop = (timestamp: number) => {
      if (!this.lastTimestamp) {
        this.lastTimestamp = timestamp;
      }
      
      const deltaTime = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;

      this.update(deltaTime);
      this.render();

      if (this.state.phase !== 'complete') {
        this.animationFrame = requestAnimationFrame(loop);
      }
    };

    this.animationFrame = requestAnimationFrame(loop);
  }

  /**
   * Update engine state
   */
  private update(deltaTime: number): void {
    if (!this.state.trajectory) return;

    // Handle hit-stop phase
    if (this.state.phase === 'hit-stop') {
      this.state.hitStopTimer += deltaTime;
      if (this.state.hitStopTimer >= this.config.hitStopFreeze) {
        this.state.phase = 'verdetto';
        this.state.hitStopTimer = 0;
      }
      return;
    }

    // Advance time
    this.state.currentTime += deltaTime;

    // Determine current phase based on trajectory progress
    const progress = this.state.currentTime / this.state.trajectory.duration;
    
    if (progress < 0.3) {
      this.state.phase = 'lancio';
    } else if (progress < 0.7) {
      this.state.phase = 'caccia';
      // Apply slow-motion in caccia phase
      this.state.currentTime += deltaTime * (this.config.slowMoScale - 1);
    } else if (progress < 0.95) {
      this.state.phase = 'verdetto';
    } else {
      // Trigger hit-stop at end
      if (this.state.phase as EnginePhase !== 'hit-stop') {
        this.state.phase = 'hit-stop';
        this.state.hitStopTimer = 0;
      }
    }

    // Update ball position from trajectory
    const currentPoint = this.getCurrentTrajectoryPoint();
    if (currentPoint) {
      this.state.ballPosition = currentPoint.position;
    }

    // Update camera (push-in 2D effect)
    this.updateCamera(progress);

    // Check for completion
    if (this.state.currentTime >= this.state.trajectory.duration && this.state.phase !== 'hit-stop') {
      this.state.phase = 'complete';
    }
  }

  /**
   * Get current trajectory point based on time
   */
  private getCurrentTrajectoryPoint(): TrajectoryPoint | null {
    if (!this.state.trajectory) return null;

    const points = this.state.trajectory.points;
    for (let i = 0; i < points.length - 1; i++) {
      if (this.state.currentTime >= points[i].time && this.state.currentTime < points[i + 1].time) {
        // Interpolate between points
        const t = (this.state.currentTime - points[i].time) / (points[i + 1].time - points[i].time);
        return {
          position: points[i].position.clone().lerp(points[i + 1].position, t),
          time: this.state.currentTime,
          velocity: points[i].velocity.clone().lerp(points[i + 1].velocity, t),
        };
      }
    }

    // Return last point if time exceeds duration
    return points[points.length - 1];
  }

  /**
   * Update camera offset for push-in effect
   */
  private updateCamera(progress: number): void {
    const pushInAmount = this.config.cameraPushIn * progress;
    const direction = this.state.ballPosition.clone().normalize();
    this.state.cameraOffset = direction.multiplyScalar(pushInAmount);
  }

  /**
   * Render frame
   */
  private render(): void {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply camera offset
    ctx.save();
    ctx.translate(-this.state.cameraOffset.x, -this.state.cameraOffset.y);

    // Draw ball
    this.drawBall(ctx);

    // Draw trail
    this.drawTrail(ctx);

    ctx.restore();
  }

  /**
   * Draw the ball (spark with white-gold core)
   */
  private drawBall(ctx: CanvasRenderingContext2D): void {
    const pos = this.state.ballPosition;
    const radius = 8;

    // Outer glow
    const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius * 2);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // White center
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw motion trail
   */
  private drawTrail(ctx: CanvasRenderingContext2D): void {
    if (!this.state.trajectory) return;

    const points = this.state.trajectory.points;
    const currentTime = this.state.currentTime;
    const trailDuration = this.config.trailFadeMs;

    // Find points within trail duration
    const trailPoints = points.filter(p => p.time >= currentTime - trailDuration && p.time <= currentTime);

    if (trailPoints.length < 2) return;

    // Draw trail as gradient path
    ctx.beginPath();
    ctx.moveTo(trailPoints[0].position.x, trailPoints[0].position.y);

    for (let i = 1; i < trailPoints.length; i++) {
      ctx.lineTo(trailPoints[i].position.x, trailPoints[i].position.y);
    }

    // Create gradient for trail fade
    const gradient = ctx.createLinearGradient(
      trailPoints[0].position.x,
      trailPoints[0].position.y,
      trailPoints[trailPoints.length - 1].position.x,
      trailPoints[trailPoints.length - 1].position.y
    );
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0.5)');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  /**
   * Stop animation
   */
  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Get current engine state
   */
  getState(): EngineState {
    return { ...this.state };
  }
}

/**
 * Factory function to create engine instance
 */
export function createEngineV3(config: EngineV3Config): EngineV3 {
  return new EngineV3(config);
}