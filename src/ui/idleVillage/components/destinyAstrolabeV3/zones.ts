```typescript
import { GeometrySnapshot } from './geometry';

export function classify(point: number[], snapshot: GeometrySnapshot): 'star' | 'near-miss' | 'crown' | 'void' | 'ruin' | 'crit' {
  // Implementazione della classificazione
  // ...
  return 'star';
}

export function zoneAreas(snapshot: GeometrySnapshot, sampleCount?: number): { [key: string]: number } {
  // Implementazione del calcolo delle aree
  // ...
  return {};
}