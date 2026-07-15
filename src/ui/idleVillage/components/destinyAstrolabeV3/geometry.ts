import { Vector2 } from './Vector2';

interface Obelisco {
  position: Vector2;
  shape: string;
  base: string;
  label: string;
}

const obelischi: Obelisco[] = [
  // ... existing obelischi ...
  {
    position: new Vector2(100, 100),
    shape: 'asimmetrica',
    base: 'ossidiana',
    label: 'Obelisco 1',
  },
  // ... other obelischi ...
];

export { obelischi };