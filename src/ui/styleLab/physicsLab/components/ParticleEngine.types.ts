/**
 * Particle Engine Types for Physics Lab FX
 */

/**
 * Particle engine configuration interface
 */
export interface ParticleEngineConfig {
  density: number;
  lifetime: number;
  color: string;
  drawMode: 'points' | 'lines' | 'triangles';
  performanceMode?: boolean;
}
