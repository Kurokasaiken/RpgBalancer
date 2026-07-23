// Expiry stage machine — monotònous escalation for countdown timers
// calm (>50%) → alert (≤50%, >15%) → critical (<15%)

export type ExpiryStage = 'calm' | 'alert' | 'critical';

export interface ColorPalette {
  base: { r: number; g: number; b: number };
  alert: { r: number; g: number; b: number };
  critical: { r: number; g: number; b: number };
  glow: { r: number; g: number; b: number };
}

export interface StageState {
  stage: ExpiryStage;
  fillColor: { r: number; g: number; b: number };
  glowColor: { r: number; g: number; b: number };
  pulseIntensity: number;
  rotationActive: boolean;
}

export function getExpiryStage(remainingFraction: number): ExpiryStage {
  if (remainingFraction > 0.5) return 'calm';
  if (remainingFraction > 0.15) return 'alert';
  return 'critical';
}

function lerpColor(
  from: { r: number; g: number; b: number },
  to: { r: number; g: number; b: number },
  t: number
) {
  const clamp = (v: number) => Math.min(255, Math.max(0, v));
  return {
    r: clamp(Math.round(from.r + (to.r - from.r) * t)),
    g: clamp(Math.round(from.g + (to.g - from.g) * t)),
    b: clamp(Math.round(from.b + (to.b - from.b) * t)),
  };
}

export function computeStageState(
  remainingFraction: number,
  palette: ColorPalette
): StageState {
  const stage = getExpiryStage(remainingFraction);

  if (stage === 'calm') {
    return {
      stage: 'calm',
      fillColor: palette.base,
      glowColor: palette.glow,
      pulseIntensity: 0.2,
      rotationActive: false,
    };
  }

  // Alert: [50% to 15%]
  if (stage === 'alert') {
    const alertProgress = (0.5 - remainingFraction) / 0.35; // 0→1 as we descend 50%→15%
    const fillColor = lerpColor(palette.alert, palette.critical, alertProgress);
    const glowColor = lerpColor(palette.glow, palette.critical, alertProgress * 0.5);

    return {
      stage: 'alert',
      fillColor,
      glowColor,
      pulseIntensity: 0.4 + 0.2 * alertProgress,
      rotationActive: true,
    };
  }

  // Critical: < 15%
  return {
    stage: 'critical',
    fillColor: palette.critical,
    glowColor: palette.critical,
    pulseIntensity: 0.8,
    rotationActive: true,
  };
}

export function colorToRgba(color: { r: number; g: number; b: number }, alpha: number): string {
  return `rgba(${color.r},${color.g},${color.b},${Math.min(1, Math.max(0, alpha))})`;
}
