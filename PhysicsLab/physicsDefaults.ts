/**
 * physicsDefaults.ts
 * Tutti i valori di fisica del Style Lab.
 * Questi sono i valori che esporti quando trovi il feel giusto.
 */

export interface PhysicsConfig {
  // ── Card Drag ──────────────────────────────────────────
  /** Scale della card quando viene sollevata (1.01–1.20) */
  liftScale: number;
  /** Rigidità della molla — alta = segue subito, bassa = ritardo pesante (30–600) */
  springStiffness: number;
  /** Smorzamento — alto = si ferma subito, basso = oscilla (3–60) */
  springDamping: number;
  /** Massa percepita — alta = inerzia, bassa = reattiva (0.3–6) */
  mass: number;
  /** Gradi di tilt in base alla velocità (0–25) */
  tiltIntensity: number;
  // ── Button ─────────────────────────────────────────────
  /** Scale verticale al click — 0.82 = pressa profonda (0.82–0.99) */
  buttonSquash: number;
  /** Scale al hover (1.0–1.06) */
  buttonLift: number;
  // ── Slot ───────────────────────────────────────────────
  /** Intensità del glow quando la card è sopra lo slot (0.05–1.0) */
  slotGlowIntensity: number;
}

export const PHYSICS_DEFAULTS: PhysicsConfig = {
  liftScale:        1.08,
  springStiffness:  180,
  springDamping:    22,
  mass:             1.2,
  tiltIntensity:    8,
  buttonSquash:     0.94,
  buttonLift:       1.02,
  slotGlowIntensity: 0.6,
};

export interface SliderDef {
  key: keyof PhysicsConfig;
  label: string;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
  desc: string;
  section: 'drag' | 'button' | 'slot';
}

export const SLIDER_DEFS: SliderDef[] = [
  // ── DRAG ──
  {
    key: 'liftScale',
    label: 'Lift Scale',
    min: 1.01, max: 1.20, step: 0.01,
    fmt: v => v.toFixed(2),
    desc: 'Quanto si solleva la card quando la prendi. 1.01 = quasi piatta, 1.20 = vola via.',
    section: 'drag',
  },
  {
    key: 'springStiffness',
    label: 'Spring Stiffness',
    min: 30, max: 600, step: 10,
    fmt: v => String(Math.round(v)),
    desc: 'Rigidità della molla. Alto = segue subito. Basso = segue con ritardo pesante.',
    section: 'drag',
  },
  {
    key: 'springDamping',
    label: 'Spring Damping',
    min: 3, max: 60, step: 1,
    fmt: v => String(Math.round(v)),
    desc: 'Smorzamento. Alto = si ferma subito. Basso = continua a oscillare.',
    section: 'drag',
  },
  {
    key: 'mass',
    label: 'Mass',
    min: 0.3, max: 6, step: 0.1,
    fmt: v => v.toFixed(1),
    desc: 'Massa percepita. Alta = reagisce lentamente, ha inerzia. Bassa = leggera, reattiva.',
    section: 'drag',
  },
  {
    key: 'tiltIntensity',
    label: 'Tilt Intensity',
    min: 0, max: 25, step: 0.5,
    fmt: v => v.toFixed(1) + '°',
    desc: 'Gradi di rotazione in base alla velocità. 0 = nessun tilt, 25 = si piega molto.',
    section: 'drag',
  },
  // ── BUTTON ──
  {
    key: 'buttonSquash',
    label: 'Squash al Click',
    min: 0.82, max: 0.99, step: 0.01,
    fmt: v => v.toFixed(2),
    desc: 'Compressione al click. 0.82 = pressa profonda, stone-like. 0.99 = quasi impercettibile.',
    section: 'button',
  },
  {
    key: 'buttonLift',
    label: 'Lift al Hover',
    min: 1.0, max: 1.06, step: 0.005,
    fmt: v => v.toFixed(3),
    desc: 'Scale al hover. 1.0 = nessun lift. 1.06 = sale visibilmente.',
    section: 'button',
  },
  // ── SLOT ──
  {
    key: 'slotGlowIntensity',
    label: 'Slot Glow',
    min: 0.05, max: 1.0, step: 0.05,
    fmt: v => v.toFixed(2),
    desc: 'Intensità del glow dorato quando la card è sopra lo slot.',
    section: 'slot',
  },
];

export const SECTIONS: { id: SliderDef['section']; label: string }[] = [
  { id: 'drag',   label: 'Drag della Card' },
  { id: 'button', label: 'Bottone' },
  { id: 'slot',   label: 'Slot' },
];
