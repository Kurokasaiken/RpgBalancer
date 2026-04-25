/**
 * dragPhysicsPresets.ts
 *
 * Fonte di verità per tutti i preset di fisica del drag.
 * Aggiungere un preset qui lo rende disponibile ovunque nell'app
 * senza toccare nessun componente.
 *
 * Struttura di ogni preset:
 *   spring   — comportamento del ghost durante il drag
 *   lift     — scala e tilt quando la card è sollevata
 *   shadow   — ombra al suolo (simula luce dall'alto)
 *   impact   — animazioni al drop (successo e fallimento)
 *   snap     — attrazione magnetica verso lo slot
 *   css      — CSS custom properties iniettate sul wrapper
 *              (lette dai componenti esistenti via var())
 */

export interface DragPhysicsConfig {
  // ── Spring (F = K*dx - D*vx) / M ──────────────────────
  /** Rigidità molla. Alta = reattivo/leggero. Bassa = lento/pesante. */
  stiffness: number;       // 10–800, scala log consigliata
  /** Smorzamento. Basso = oscilla dopo stop. Alto = si ferma secco. */
  damping: number;         // 2–80
  /** Massa percepita. Alta = inerzia forte. Bassa = reattiva. */
  mass: number;            // 0.1–8, scala log consigliata

  // ── Lift & Tilt ────────────────────────────────────────
  /** Scala del ghost sollevato. 1.01 = appena staccato. 1.20 = alto. */
  liftScale: number;       // 1.01–1.25
  /** Gradi massimi di tilt in base alla velocità laterale. */
  tiltMax: number;         // 0–30

  // ── Anticipazione al pickup ────────────────────────────
  /** Durata micro-squash prima del lift (ms). */
  anticDuration: number;   // 40–200
  /** ScaleY durante l'anticipazione. 0.87 = brusco. 0.97 = quasi nulla. */
  anticSquash: number;     // 0.70–0.98

  // ── Ombra al suolo ─────────────────────────────────────
  /** Blur ombra. Alto = card lontana. Basso = oggetto pesante vicino. */
  shadowBlur: number;      // 5–70
  /** Opacità ombra al suolo. Alta = pesante. Bassa = leggera. */
  shadowOpacity: number;   // 0.1–1.0
  /** Allargamento ombra al lift. Alto = luce forte dall'alto. */
  shadowSpread: number;    // 1.0–2.8

  // ── Snap magnetico ─────────────────────────────────────
  /** Distanza in px entro cui il ghost viene attirato allo slot. */
  snapRadius: number;      // 30–200
  /** Forza attrazione. 0 = nessuna. 1 = teletrasporto istantaneo. */
  snapStrength: number;    // 0–1

  // ── Impatto al drop ────────────────────────────────────
  /** ScaleY al drop valido. 0.70 = impatto pesante. 0.99 = soffice. */
  dropSquashY: number;     // 0.70–0.99
  /** Rimbalzo verso l'alto dopo squash. 1.08 = molto elastico. */
  dropOvershootY: number;  // 1.0–1.14
  /** Intensità screen shake al drop valido (0 = nessuno). */
  dropTrauma: number;      // 0–1
  /** Intensità flash bianco al drop valido. */
  dropFlash: number;       // 0–1
  /** Numero di spark particelle al drop valido. */
  dropSparks: number;      // 0–16
}

export const DRAG_PHYSICS_PRESETS = {
  /**
   * DEFAULT — bilanciato, feel RPG-inventory
   * Riferimento: Hearthstone card drag
   */
  default: {
    stiffness:      160,
    damping:         22,
    mass:           1.4,
    liftScale:     1.08,
    tiltMax:          8,
    anticDuration:   85,
    anticSquash:   0.88,
    shadowBlur:      26,
    shadowOpacity:  0.70,
    shadowSpread:   1.45,
    snapRadius:      85,
    snapStrength:   0.52,
    dropSquashY:    0.90,
    dropOvershootY: 1.04,
    dropTrauma:     0.65,
    dropFlash:      0.38,
    dropSparks:       6,
  },

  /**
   * HEAVY — ferro, piombo, oggetto pesante
   * Alta inerzia, ombra densa, impatto brutale
   */
  heavy: {
    stiffness:       55,
    damping:         38,
    mass:           5.2,
    liftScale:     1.04,
    tiltMax:          3,
    anticDuration:  140,
    anticSquash:   0.80,
    shadowBlur:      48,
    shadowOpacity:  0.92,
    shadowSpread:   1.80,
    snapRadius:     110,
    snapStrength:   0.72,
    dropSquashY:    0.76,
    dropOvershootY: 1.02,
    dropTrauma:     0.92,
    dropFlash:      0.60,
    dropSparks:      10,
  },

  /**
   * LIGHT — piuma, pergamena, oggetto leggero
   * Reattivo, tilt pronunciato, impatto morbido
   */
  light: {
    stiffness:      420,
    damping:         16,
    mass:           0.35,
    liftScale:     1.14,
    tiltMax:         18,
    anticDuration:   45,
    anticSquash:   0.94,
    shadowBlur:       9,
    shadowOpacity:  0.32,
    shadowSpread:   1.15,
    snapRadius:      60,
    snapStrength:   0.30,
    dropSquashY:    0.96,
    dropOvershootY: 1.08,
    dropTrauma:     0.28,
    dropFlash:      0.18,
    dropSparks:       4,
  },

  /**
   * MAGICAL — oggetto incantato, fluttuante
   * Poca gravità, molta oscillazione, impatto con glow
   */
  magical: {
    stiffness:      120,
    damping:          9,
    mass:           0.7,
    liftScale:     1.12,
    tiltMax:         14,
    anticDuration:   60,
    anticSquash:   0.92,
    shadowBlur:      16,
    shadowOpacity:  0.45,
    shadowSpread:   1.60,
    snapRadius:     130,
    snapStrength:   0.65,
    dropSquashY:    0.93,
    dropOvershootY: 1.09,
    dropTrauma:     0.42,
    dropFlash:      0.52,
    dropSparks:      12,
  },

  /**
   * SNAPPY — UI tool, reattivo, professionale
   * Quasi nessuna fisica percepita, feedback rapido
   */
  snappy: {
    stiffness:      600,
    damping:         40,
    mass:           0.8,
    liftScale:     1.05,
    tiltMax:          4,
    anticDuration:   40,
    anticSquash:   0.96,
    shadowBlur:      12,
    shadowOpacity:  0.50,
    shadowSpread:   1.20,
    snapRadius:      70,
    snapStrength:   0.45,
    dropSquashY:    0.94,
    dropOvershootY: 1.02,
    dropTrauma:     0.35,
    dropFlash:      0.20,
    dropSparks:       3,
  },
} satisfies Record<string, DragPhysicsConfig>;

export type DragPhysicsPresetKey = keyof typeof DRAG_PHYSICS_PRESETS;

export const PRESET_LABELS: Record<DragPhysicsPresetKey, string> = {
  default:  'Bilanciato',
  heavy:    'Pesante',
  light:    'Leggero',
  magical:  'Magico',
  snappy:   'Reattivo',
};

export const PRESET_DESCRIPTIONS: Record<DragPhysicsPresetKey, string> = {
  default:  'Feel RPG classico — bilanciato tra peso e reattività.',
  heavy:    'Ferro e piombo — alta inerzia, impatto brutale.',
  light:    'Piuma e pergamena — reattivo, tilt pronunciato.',
  magical:  'Oggetto incantato — fluttua, oscilla, brilla.',
  snappy:   'Tool UI professionale — feedback immediato, poco teatro.',
};
