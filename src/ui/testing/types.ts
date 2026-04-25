export interface Point {
  x: number;
  y: number;
}

export type AltCardPhase = 'idle' | 'rolling' | 'settled';
export type OutcomeZone = 'safe' | 'injury' | 'death';
export type OutcomeResult = 'success' | 'fail';

export interface AltCardState {
  id: string;
  profileKey: string;
  phase: AltCardPhase;
  result: OutcomeResult | null;
  zone: OutcomeZone | null;
  value: number | null;
  ballPosition: Point | null;
  path: Point[];
  pathIndex: number;
  lastUpdated: number;
}

export interface StatRow {
  id: string;
  name: string;
  questValue: number;
  heroValue: number;
  isDetrimental: boolean;
}

export interface LastOutcome {
  zone: OutcomeZone;
  result: OutcomeResult;
}

export interface PinballOptions {
  shotPower: number;
  spinBias: number;
}

export interface SkinGeometry {
  questBase: Point[];
  heroBase: Point[];
  questCard: Point[];
  heroCard: Point[];
  questCardAttr: string;
  questCardPath: string;
  questCardSmoothPath: string;
  heroCardPath: string;
  heroCardSmoothPath: string;
  projectToCard: (point: Point) => Point;
  selectedStats: StatRow[];
  maxRadius: number;
}

export type AltStructure = 'solo' | 'dual' | 'triple' | 'quattro' | 'epic';

export interface AltVisualSkin {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  structure: AltStructure;
  statCount: number;
  accent: string;
  style:
    | 'triangle'
    | 'flame'
    | 'drop'
    | 'column'
    | 'diamond'
    | 'lens'
    | 'petal'
    | 'bridge'
    | 'soft-triangle'
    | 'triskel'
    | 'tri-flower'
    | 'poker'
    | 'wind-rose'
    | 'elastic'
    | 'pentagon'
    | 'star'
    | 'pentaflower'
    | 'param-rose'
    | 'ribbon-bezier'
    | 'overlay-combo'
    | 'poker-clover'
    | 'poker-club'
    | 'poker-preset';
}
