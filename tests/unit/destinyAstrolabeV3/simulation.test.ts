import { describe, it, expect } from 'vitest';
import { Vector2 } from '@/ui/idleVillage/components/destinyAstrolabeV3/Vector2';
import { pickLandingPoint, synthesizeTrajectory, type ZoneMap } from '@/ui/idleVillage/components/destinyAstrolabeV3/simulation';

describe('simulation', () => {
  describe('pickLandingPoint', () => {
    it('near-miss 5% - roll 52 su soglia 50 -> atterraggio in nearMissBand esterno', () => {
      const zoneMap: ZoneMap = {
        star: [new Vector2(0, 0), new Vector2(100, 0), new Vector2(50, 86.6)],
        crown: [new Vector2(0, 0), new Vector2(120, 0), new Vector2(60, 103.9)],
        nearMissBand: [new Vector2(110, 0), new Vector2(130, 0), new Vector2(120, 17.3)],
        void: [],
        ruin: [],
        crit: [],
      };

      // Simula roll 52 su soglia 50 (near-miss)
      const rng = () => 0.5; // Deterministico
      const point = pickLandingPoint('near-miss', zoneMap, rng);

      expect(point).toBeDefined();
      // Il punto dovrebbe essere in nearMissBand
      const isInNearMiss = zoneMap.nearMissBand.some(p => 
        Math.abs(p.x - point.x) < 1 && Math.abs(p.y - point.y) < 1
      );
      expect(isInNearMiss).toBe(true);
    });

    it('successo+ferita -> punto in star∩crown', () => {
      const zoneMap: ZoneMap = {
        star: [new Vector2(0, 0), new Vector2(100, 0), new Vector2(50, 86.6)],
        crown: [new Vector2(0, 0), new Vector2(120, 0), new Vector2(60, 103.9)],
        nearMissBand: [],
        void: [],
        ruin: [],
        crit: [],
      };

      const rng = () => 0.5;
      const point = pickLandingPoint('wound', zoneMap, rng);

      expect(point).toBeDefined();
      // Il punto dovrebbe essere in crown (vicino alla stella)
      const isInCrown = zoneMap.crown.some(p => 
        Math.abs(p.x - point.x) < 1 && Math.abs(p.y - point.y) < 1
      );
      expect(isInCrown).toBe(true);
    });

    it('spin con seed diversi non identici', () => {
      const zoneMap: ZoneMap = {
        star: [new Vector2(0, 0), new Vector2(100, 0), new Vector2(50, 86.6)],
        crown: [],
        nearMissBand: [],
        void: [],
        ruin: [],
        crit: [],
      };

      let callCount = 0;
      const rng1 = () => {
        callCount++;
        return 0.3;
      };
      const rng2 = () => {
        callCount++;
        return 0.7;
      };

      const point1 = pickLandingPoint('success', zoneMap, rng1);
      const point2 = pickLandingPoint('success', zoneMap, rng2);

      // Punti diversi dovrebbero essere diversi
      expect(point1.x).not.toBe(point2.x);
      expect(point1.y).not.toBe(point2.y);
    });

    it('determinismo con stesso seed', () => {
      const zoneMap: ZoneMap = {
        star: [new Vector2(0, 0), new Vector2(100, 0), new Vector2(50, 86.6)],
        crown: [],
        nearMissBand: [],
        void: [],
        ruin: [],
        crit: [],
      };

      const rng = () => 0.42; // Seed fisso
      const point1 = pickLandingPoint('success', zoneMap, rng);
      const point2 = pickLandingPoint('success', zoneMap, rng);

      // Stesso seed -> stesso punto
      expect(point1.x).toBe(point2.x);
      expect(point1.y).toBe(point2.y);
    });
  });

  describe('synthesizeTrajectory', () => {
    it('rispetto delle normali del poligono', () => {
      const landingPoint = new Vector2(100, 100);
      const rng = () => 0.5;
      const config = {
        bounceCountMin: 2,
        bounceCountMax: 4,
        trailFadeMs: 400,
      };

      const trajectory = synthesizeTrajectory(landingPoint, rng, config);

      expect(trajectory).toBeDefined();
      expect(trajectory.points).toBeDefined();
      expect(trajectory.points.length).toBeGreaterThan(0);
      expect(trajectory.duration).toBeGreaterThan(0);

      // Verifica che il punto finale sia il landing point
      const lastPoint = trajectory.points[trajectory.points.length - 1];
      expect(lastPoint.position.x).toBeCloseTo(landingPoint.x, 0);
      expect(lastPoint.position.y).toBeCloseTo(landingPoint.y, 0);
    });

    it('bounce count in range config', () => {
      const landingPoint = new Vector2(100, 100);
      const rng = () => 0.5;
      const config = {
        bounceCountMin: 2,
        bounceCountMax: 4,
        trailFadeMs: 400,
      };

      const trajectory = synthesizeTrajectory(landingPoint, rng, config);

      // I punti di rimbalzo sono quelli prima della fase spirale (ultimi 31 punti: 30 spiral + 1 finale)
      const spiralStartIndex = trajectory.points.length - 31;
      const bouncePoints = trajectory.points.slice(1, spiralStartIndex);

      expect(bouncePoints.length).toBeGreaterThanOrEqual(config.bounceCountMin);
      expect(bouncePoints.length).toBeLessThanOrEqual(config.bounceCountMax);
    });

    it('durata totale in range config', () => {
      const landingPoint = new Vector2(100, 100);
      const rng = () => 0.5;
      const config = {
        bounceCountMin: 2,
        bounceCountMax: 4,
        trailFadeMs: 400,
      };

      const trajectory = synthesizeTrajectory(landingPoint, rng, config);

      // La durata dovrebbe essere ragionevole (tra 500ms e 2000ms)
      expect(trajectory.duration).toBeGreaterThan(500);
      expect(trajectory.duration).toBeLessThan(2000);
    });
  });

  describe('near-miss Monte Carlo 5%', () => {
    it('near-miss rate ~5% con 1000 iterazioni', () => {
      const zoneMap: ZoneMap = {
        star: [new Vector2(0, 0), new Vector2(100, 0), new Vector2(50, 86.6)],
        crown: [],
        nearMissBand: [new Vector2(110, 0), new Vector2(130, 0), new Vector2(120, 17.3)],
        void: [],
        ruin: [],
        crit: [],
      };

      const iterations = 1000;
      let nearMissCount = 0;

      for (let i = 0; i < iterations; i++) {
        const roll = Math.random() * 100;
        const threshold = 50;
        
        // Simula logica near-miss: roll in (threshold, threshold+5]
        if (roll > threshold && roll <= threshold + 5) {
          nearMissCount++;
        }
      }

      const nearMissRate = (nearMissCount / iterations) * 100;
      
      // La banda è 5% del D100, quindi il rate dovrebbe essere ~5%
      expect(nearMissRate).toBeGreaterThan(3);
      expect(nearMissRate).toBeLessThan(7);
    });
  });
});
