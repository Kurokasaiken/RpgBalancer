import { Vector2 } from './Vector2';

export interface ZoneMap {
  star: Vector2[];
  crown: Vector2[];
  nearMissBand: Vector2[];
  void: Vector2[];
  ruin: Vector2[];
  crit: Vector2[];
}

export interface TrajectoryPoint {
  position: Vector2;
  time: number;
  velocity: Vector2;
}

export interface Trajectory {
  points: TrajectoryPoint[];
  duration: number;
}

/**
 * Seleziona un punto di atterraggio uniforme nella zona coerente con l'esito.
 * Per near-miss, punteggia punti vicini al bordo della stella.
 * Per successo+ferita, sceglie punto nell'intersezione star∩crown.
 */
export function pickLandingPoint(
  esito: string,
  zoneMap: ZoneMap,
  rng: () => number
): Vector2 {
  const zones = {
    'success': zoneMap.star,
    'wound': zoneMap.crown,
    'death': zoneMap.void,
    'ruin': zoneMap.ruin,
    'crit': zoneMap.crit,
    'near-miss': zoneMap.nearMissBand,
  };

  const targetZone = zones[esito as keyof typeof zones] || zoneMap.star;
  
  if (targetZone.length === 0) {
    return new Vector2(0, 0);
  }

  // Per near-miss, preferisci punti vicini al bordo della stella
  if (esito === 'near-miss' && zoneMap.star.length > 0) {
    const starCenter = getPolygonCenter(zoneMap.star);
    const starRadius = getAverageRadius(zoneMap.star, starCenter);
    
    // Scegli punto in nearMissBand ma punteggiato per vicinanza al bordo stella
    let bestPoint = targetZone[Math.floor(rng() * targetZone.length)];
    let bestScore = -Infinity;
    
    for (let i = 0; i < 10; i++) {
      const candidate = targetZone[Math.floor(rng() * targetZone.length)];
      const distToStar = candidate.distanceTo(starCenter);
      const score = Math.abs(distToStar - starRadius); // Punteggio più alto = più vicino al bordo
      
      if (score > bestScore) {
        bestScore = score;
        bestPoint = candidate;
      }
    }
    
    return bestPoint;
  }

  // Per successo+ferita, intersezione star∩crown
  if (esito === 'wound' && zoneMap.star.length > 0 && zoneMap.crown.length > 0) {
    const starCenter = getPolygonCenter(zoneMap.star);
    const starRadius = getAverageRadius(zoneMap.star, starCenter);
    
    // Scegli punto in crown ma vicino alla stella
    let bestPoint = zoneMap.crown[Math.floor(rng() * zoneMap.crown.length)];
    let bestScore = Infinity;
    
    for (let i = 0; i < 10; i++) {
      const candidate = zoneMap.crown[Math.floor(rng() * zoneMap.crown.length)];
      const distToStar = candidate.distanceTo(starCenter);
      const score = Math.abs(distToStar - starRadius);
      
      if (score < bestScore) {
        bestScore = score;
        bestPoint = candidate;
      }
    }
    
    return bestPoint;
  }

  // Selezione uniforme per altri casi
  return targetZone[Math.floor(rng() * targetZone.length)];
}

/**
 * Genera traiettoria con lancio, 2-4 rimbalzi, spirale decelerante, homing invisibile.
 * Il seed rende deterministico per test.
 */
export function synthesizeTrajectory(
  landingPoint: Vector2,
  rng: () => number,
  config: {
    bounceCountMin: number;
    bounceCountMax: number;
    trailFadeMs: number;
  }
): Trajectory {
  const points: TrajectoryPoint[] = [];
  const bounceCount = Math.floor(rng() * (config.bounceCountMax - config.bounceCountMin + 1)) + config.bounceCountMin;
  
  // Punto di partenza (centro arena)
  const startPoint = new Vector2(0, 0);
  const direction = landingPoint.clone().sub(startPoint).normalize();
  
  // Genera punti di rimbalzo
  let currentPoint = startPoint.clone();
  let currentVelocity = direction.multiplyScalar(500 + rng() * 200); // Velocità iniziale variabile
  let currentTime = 0;
  const dt = 16; // 60fps
  
  points.push({
    position: currentPoint.clone(),
    time: currentTime,
    velocity: currentVelocity.clone(),
  });

  for (let i = 0; i < bounceCount; i++) {
    // Simula rimbalzo con normale del poligono (semplificato)
    const bounceProgress = (i + 1) / (bounceCount + 1);
    const bouncePoint = startPoint.clone().lerp(landingPoint, bounceProgress);
    
    // Aggiungi variazione casuale per rendere traiettoria non lineare
    const perp = new Vector2(-direction.y, direction.x);
    const offset = perp.multiplyScalar((rng() - 0.5) * 50);
    bouncePoint.add(offset);
    
    const timeToBounce = bouncePoint.distanceTo(currentPoint) / currentVelocity.length() * 1000;
    currentTime += timeToBounce;
    
    points.push({
      position: bouncePoint.clone(),
      time: currentTime,
      velocity: currentVelocity.clone(),
    });
    
    currentPoint = bouncePoint.clone();
    currentVelocity = currentVelocity.multiplyScalar(0.7); // Decelerazione dopo rimbalzo
  }

  // Fase finale: spirale decelerante con homing invisibile
  const spiralSteps = 30;
  const spiralDuration = 400; // ms
  const spiralDt = spiralDuration / spiralSteps;
  
  for (let i = 0; i < spiralSteps; i++) {
    const t = i / spiralSteps;
    const spiralPoint = currentPoint.clone().lerp(landingPoint, t);
    
    // Aggiungi oscillazione spirale
    const perp = new Vector2(-direction.y, direction.x);
    const spiralRadius = 20 * (1 - t);
    const spiralOffset = perp.multiplyScalar(Math.sin(t * Math.PI * 2) * spiralRadius);
    spiralPoint.add(spiralOffset);
    
    currentTime += spiralDt;
    
    points.push({
      position: spiralPoint.clone(),
      time: currentTime,
      velocity: landingPoint.clone().sub(spiralPoint).multiplyScalar(1000 / spiralDuration),
    });
  }

  // Punto finale esatto (homing invisibile)
  points.push({
    position: landingPoint.clone(),
    time: currentTime + 16,
    velocity: new Vector2(0, 0),
  });

  return {
    points,
    duration: currentTime + 16,
  };
}

/**
 * Calcola il centro di un poligono.
 */
function getPolygonCenter(vertices: Vector2[]): Vector2 {
  if (vertices.length === 0) return new Vector2(0, 0);
  
  const center = new Vector2(0, 0);
  for (const v of vertices) {
    center.add(v);
  }
  return center.divideScalar(vertices.length);
}

/**
 * Calcola il raggio medio del poligono dal centro.
 */
function getAverageRadius(vertices: Vector2[], center: Vector2): number {
  if (vertices.length === 0) return 0;
  
  let totalRadius = 0;
  for (const v of vertices) {
    totalRadius += v.distanceTo(center);
  }
  return totalRadius / vertices.length;
}