import type { PinballOptions, Point } from './types';

/**
 * Describes the arena in which the pinball simulation occurs.
 */
export interface PinballArena {
  /** Center point of the arena. */
  center: Point;
  /** Maximum radius from the center before the ball is clamped. */
  radius: number;
}

/**
 * Configuration values controlling the pinball physics simulation.
 */
export interface PinballPhysicsConfig {
  /** Maximum number of integration steps before the simulation stops. */
  maxSteps: number;
  /** Base friction applied every frame before braking logic. */
  baseFriction: number;
  /** Normalized progress where braking forces start. */
  brakeStartProgress: number;
  /** Amount of additional friction contributed by the brake curve. */
  brakeFactor: number;
  /** Scalar applied to spin bias to derive lateral forces. */
  spinScale: number;
  /** Coefficient of restitution for collisions against polygon edges. */
  restitution: number;
  /** Additional damping applied post-collision. */
  collisionEnergyRetention: number;
  /** Minimum speed that stops the simulation when reached. */
  minSpeedThreshold: number;
  /** Maximum speed clamp to avoid tunneling. */
  maxSpeed: number;
  /** Base min/max speed derived from shot power. */
  baseSpeedRange: [number, number];
  /** Factor used when clamping the ball back inside the arena. */
  clampReflectionFactor: number;
  /** Offset distance used when repositioning the ball after a collision. */
  penetrationOffset: number;
}

/**
 * Default physics constants tuned for the cinematic SkillCheck preview.
 */
export const DEFAULT_PINBALL_PHYSICS_CONFIG: PinballPhysicsConfig = {
  maxSteps: 180,
  baseFriction: 0.995,
  brakeStartProgress: 0.3,
  brakeFactor: 0.75,
  spinScale: 0.02,
  restitution: 0.92,
  collisionEnergyRetention: 0.9,
  minSpeedThreshold: 1.0,
  maxSpeed: 70,
  baseSpeedRange: [30, 70],
  clampReflectionFactor: 0.5,
  penetrationOffset: 0.8,
};

/**
 * Determines if a point lies inside the given polygon perimeter.
 */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 0.000001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Internal representation of a polygon edge segment.
 */
interface EdgeSegment {
  a: Point;
  b: Point;
}

/**
 * Generates edge segments for a closed polygon.
 */
function buildEdges(points: Point[]): EdgeSegment[] {
  if (points.length < 2) return [];
  return points.map((point, index) => ({
    a: point,
    b: points[(index + 1) % points.length],
  }));
}

/**
 * Computes the inward-facing normal of the provided edge relative to the arena center.
 */
function getInwardNormal(edge: EdgeSegment, center: Point): { x: number; y: number } {
  const ex = edge.b.x - edge.a.x;
  const ey = edge.b.y - edge.a.y;
  let nx = -ey;
  let ny = ex;
  const length = Math.hypot(nx, ny) || 1;
  nx /= length;
  ny /= length;
  const centerVectorX = center.x - edge.a.x;
  const centerVectorY = center.y - edge.a.y;
  if (nx * centerVectorX + ny * centerVectorY < 0) {
    nx *= -1;
    ny *= -1;
  }
  return { x: nx, y: ny };
}

/**
 * Returns the intersection point between two segments if present.
 */
function segmentsIntersect(p1: Point, p2: Point, q1: Point, q2: Point): { t: number; point: Point } | null {
  const rdx = p2.x - p1.x;
  const rdy = p2.y - p1.y;
  const sdx = q2.x - q1.x;
  const sdy = q2.y - q1.y;
  const denom = rdx * sdy - rdy * sdx;
  if (Math.abs(denom) < 1e-6) return null;
  const t = ((q1.x - p1.x) * sdy - (q1.y - p1.y) * sdx) / denom;
  const u = ((q1.x - p1.x) * rdy - (q1.y - p1.y) * rdx) / denom;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      t,
      point: { x: p1.x + t * rdx, y: p1.y + t * rdy },
    };
  }
  return null;
}

/**
 * Legacy pinball path simulation reused by alt visuals preview.
 */
export function simulatePinballPath(
  target: Point,
  polygon: Point[],
  options: PinballOptions,
  arena: PinballArena,
  config: PinballPhysicsConfig = DEFAULT_PINBALL_PHYSICS_CONFIG,
): Point[] {
  const path: Point[] = [];
  if (polygon.length < 3) {
    return [target];
  }

  const edges = buildEdges(polygon);

  const clampedShot = Math.max(0, Math.min(1, options.shotPower));
  const clampedSpin = Math.max(-1, Math.min(1, options.spinBias));

  const speedSpan = config.baseSpeedRange[1] - config.baseSpeedRange[0];
  const baseSpeed = config.baseSpeedRange[0] + clampedShot * speedSpan;
  const spinStrength = config.spinScale * clampedSpin;

  let pos: Point = { x: arena.center.x, y: arena.center.y };
  const initialTheta = Math.random() * Math.PI * 2;
  let vel = {
    x: Math.cos(initialTheta) * baseSpeed,
    y: Math.sin(initialTheta) * baseSpeed,
  };

  path.push({ ...pos });

  for (let step = 0; step < config.maxSteps; step += 1) {
    const progress = step / config.maxSteps;
    let friction = config.baseFriction;

    if (progress > config.brakeStartProgress) {
      const brake =
        (progress - config.brakeStartProgress) / (1 - config.brakeStartProgress);
      friction = config.baseFriction - brake * brake * config.brakeFactor;
    }

    vel.x *= friction;
    vel.y *= friction;

    if (spinStrength !== 0) {
      const spinForceX = -vel.y * spinStrength;
      const spinForceY = vel.x * spinStrength;
      vel.x += spinForceX;
      vel.y += spinForceY;
    }

    const currentSpeed = Math.hypot(vel.x, vel.y);
    if (currentSpeed > config.maxSpeed) {
      const scale = config.maxSpeed / currentSpeed;
      vel.x *= scale;
      vel.y *= scale;
    }

    const nextPos = { x: pos.x + vel.x, y: pos.y + vel.y };

    let collided = false;
    let collisionPoint: Point | null = null;
    let collisionNormal: { x: number; y: number } | null = null;

    for (const edge of edges) {
      const intersection = segmentsIntersect(pos, nextPos, edge.a, edge.b);
      if (intersection) {
        collided = true;
        collisionPoint = intersection.point;
        collisionNormal = getInwardNormal(edge, arena.center);
        break;
      }
    }

    if (collided && collisionPoint && collisionNormal) {
      pos = {
        x: collisionPoint.x + collisionNormal.x * config.penetrationOffset,
        y: collisionPoint.y + collisionNormal.y * config.penetrationOffset,
      };

      const dot = vel.x * collisionNormal.x + vel.y * collisionNormal.y;
      vel = {
        x: vel.x - (1 + config.restitution) * dot * collisionNormal.x,
        y: vel.y - (1 + config.restitution) * dot * collisionNormal.y,
      };

      vel.x *= config.collisionEnergyRetention;
      vel.y *= config.collisionEnergyRetention;
    } else {
      pos = nextPos;

      if (!pointInPolygon(pos, polygon)) {
        const angle = Math.atan2(pos.y - arena.center.y, pos.x - arena.center.x);
        const radius = Math.min(
          arena.radius,
          Math.hypot(pos.x - arena.center.x, pos.y - arena.center.y),
        );
        pos = {
          x: arena.center.x + radius * Math.cos(angle),
          y: arena.center.y + radius * Math.sin(angle),
        };
        vel.x *= -config.clampReflectionFactor;
        vel.y *= -config.clampReflectionFactor;
      }
    }

    path.push({ ...pos });

    if (currentSpeed < config.minSpeedThreshold) {
      break;
    }
  }

  if (path[path.length - 1] !== pos) {
    path.push(pos);
  }

  return path;
}
