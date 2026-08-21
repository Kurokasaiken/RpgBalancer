import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/localization/useTranslation';
import type { PoiMarkerProps } from './PoiMarker';

export interface PoiMatericV3Props extends PoiMarkerProps {
  portraitUrl?: string;
  isDragging?: boolean;
  cursorVelocity?: { x: number; y: number } | null;
  'data-testid'?: string;
}

/** One heraldic arm, repeated by rotation into a cross fleury. */
const CROSS_ARM =
  'M-3 -5 L-3 -17 L-6.4 -21 L-3.4 -22.2 L0 -18.4 L3.4 -22.2 L6.4 -21 L3 -17 L3 -5 Z';

/** Inscription vocabulary — Maou Gakuin-inspired magical script. */
const LETTERS: string[] = [
  'M -1.2,-5 L -1.2,5 M -1.2,-1.8 Q 2,-2.8 2,-0.5 Q 2,1.5 -1.2,0.8',
  'M -1.5,-5 L -1.5,5 M -1.5,-2.2 Q 1.5,-2.2 1.5,0.2 Q 1.5,2 -0.8,2.8 M 1.8,3.2 A 0.9 0.9 0 1 1 1.8 4.9 A 0.9 0.9 0 1 1 1.8 3.2',
  'M -3,-5 L -3,5 M 3,-5 L 3,5 M -3,-3 Q 0,-5.2 3,-3',
  'M 0,-2.2 A 2 2 0 1 1 0 1.8 A 2 2 0 1 1 0 -2.2 M -1.6,0.6 Q -2.2,2.8 -2.8,4.5 M 1.6,0.6 Q 2.2,2.8 2.8,4.5',
  'M -2.8,-4.5 Q -0.8,-1.5 1.2,-2.5 Q 3.2,-3.5 2.8,-0.5 Q 2.4,2.5 -1.2,2.5 Q -3.2,2.5 -2.8,4.5',
  'M -0.5,2 L -0.5,5 M 0,-2 A 2.2 2.2 0 1 1 -0.1 -2 M -0.5,1.6 Q -2,0.5 -2,-1.5',
  'M -3,-4.5 L 3,-4.5 M 0,-4.5 L 0,5 M 0,0 Q 2,0.5 2,2.5',
  'M -3,-4 L 3,-4 Q 3.6,0 0,2 Q -3.6,4 -3,0.5 Q -2.6,-2.5 0,-2.5',
  'M -3,-5 Q 0,-1 3,-5 M -3,0 Q 0,3 3,0 M -3,0 L 3,0',
  'M -3,-5 Q 0,-2 3,0 Q 0,2 -3,5',
  'M -2.5,-5 L 2.5,5 M 2.5,-5 L -2.5,5 M -1.2,-2 A 0.8 0.8 0 1 1 -1.2 -0.4 A 0.8 0.8 0 1 1 -1.2 -2',
  'M -2.2,-1.5 L 2.2,-1.5 Q 2.2,3.5 0,3.5 Q -2.2,3.5 -2.2,-1.5 M -1,-4.2 A 0.7 0.7 0 1 1 -1 -2.8 A 0.7 0.7 0 1 1 -1 -4.2 M 1,-4.2 A 0.7 0.7 0 1 1 1 -2.8 A 0.7 0.7 0 1 1 1 -4.2',
];
const RIM_LETTER_COUNT = 24;

function clamp(v: number) {
  return Math.max(0, Math.min(1, v));
}

/** Random visual wear for one medallion instance (patina spots and scratches). */
function generateImperfections() {
  const patinaSpots: { cx: number; cy: number; r: number; opacity: number }[] = [];
  const scratches: { x1: number; y1: number; x2: number; y2: number; width: number; opacity: number; color: string }[] = [];

  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 36 + Math.random() * 5; // bronze ring band, outside the field stone
    const cx = 43 + dist * Math.cos(angle);
    const cy = 43 + dist * Math.sin(angle);
    const r = 1.4 + Math.random() * 4.2;
    const opacity = 0.18 + Math.random() * 0.24;
    patinaSpots.push({ cx, cy, r, opacity });
  }

  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 35 + Math.random() * 5;
    const cx = 43 + dist * Math.cos(angle);
    const cy = 43 + dist * Math.sin(angle);
    const length = 4 + Math.random() * 9;
    const dir = angle + (Math.random() - 0.5) * 0.6;
    const x1 = cx - (length / 2) * Math.cos(dir);
    const y1 = cy - (length / 2) * Math.sin(dir);
    const x2 = cx + (length / 2) * Math.cos(dir);
    const y2 = cy + (length / 2) * Math.sin(dir);
    const width = 0.7 + Math.random() * 0.9;
    const opacity = 0.1 + Math.random() * 0.14;
    const color = Math.random() > 0.4 ? 'rgba(72,92,52,' : 'rgba(0,0,0,';
    scratches.push({ x1, y1, x2, y2, width, opacity, color: color + opacity.toFixed(2) + ')' });
  }

  return { patinaSpots, scratches };
}

function ringSegmentPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

const GLYPHS = [
  'M0 -3.6 L0 3.6 M0 -1.2 L2.2 -3.4 M0 -1.2 L-2.2 -3.4',
  'M-1.8 3.6 L-1.8 -3.6 L2 -1.2 L-1.8 0.9',
  'M-2 3.6 L0 -3.6 L2 3.6 M-1.2 0.9 L1.2 0.9',
  'M-2 -3.6 L2 3.6 M2 -3.6 L-2 3.6',
  'M-1.9 3.6 L-1.9 -3.6 L0 -0.5 L1.9 -3.6 L1.9 3.6',
  'M0 -3.6 L0 3.6 M0 0 L2.2 -2.2 M0 0 L2.2 2.2',
  'M-2 -3.6 L2 -3.6 M0 -3.6 L0 3.6',
  'M-1.8 -3.6 L1.8 -1.6 L-1.8 0.5 L1.8 2.5 L-1.8 3.6',
  'M0 -3.4 A3.4 3.4 0 1 1 -0.1 -3.4 M0 -1 L0 3',
  'M-2 0 L0 -3.4 L2 0 L0 3.4 Z',
];

/** Four-point flare, like the cardinal sparks on the reference seals. */
const FLARE = 'M0 -9 Q0.9 -1.4 8 0 Q0.9 1.4 0 9 Q-0.9 1.4 -8 0 Q-0.9 -1.4 0 -9 Z';

const GLYPH_COUNT = 14;
const LETTER_COUNT = 100;

/** Where the summoned circle hangs, clear of the medallion's rim. */
const SEAL_RADIUS = 50;

export const PoiMatericV3: React.FC<PoiMatericV3Props> = ({
  type,
  state = 'available',
  progress = 1,
  timerDirection = 'counterclockwise',
  isDragging = false,
  size: sizePx = 112,
  className = '',
  style,
  onClick,
  onPointerEnter,
  onPointerLeave,
  cursorVelocity = null,
  'data-testid': dataTestId,
}) => {
  const { t } = useTranslation('idleVillage');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rimAngleTargetRef = useRef(0);
  const rimIntensityRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [highlight, setHighlight] = useState({ x: 0, y: 0 });
  const [rimLit, setRimLit] = useState(false);
  const [rimProgress, setRimProgress] = useState(0);
  const [burst, setBurst] = useState(0);
  const prevSealProgressRef = useRef(0);

  // Randomise wear per medallion instance so the matrix does not look cloned.
  const imperfections = useMemo(() => generateImperfections(), []);

  // One clockwise pass over the medallion rim glyphs, starting at 12 o'clock.
  useEffect(() => {
    if (!rimLit) {
      setRimProgress(0);
      return;
    }
    const start = performance.now();
    const duration = 1600;
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min(1, (now - start) / duration);
      setRimProgress(next);
      if (next < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [rimLit]);

  const handlePointerEnter = () => {
    setRimLit(true);
    onPointerEnter?.();
  };
  const handlePointerLeave = () => {
    setRimLit(false);
    setHighlight({ x: 0, y: 0 });
    onPointerLeave?.();
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const node = containerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const rx = (e.clientX - rect.left - rect.width / 2) * (86 / rect.width) * 0.08;
    const ry = (e.clientY - rect.top - rect.height / 2) * (86 / rect.height) * 0.08;
    setHighlight({
      x: Math.max(-5, Math.min(5, rx)),
      y: Math.max(-5, Math.min(5, ry)),
    });
  };

  // Medallion rim script — engraved letters that light up on hover.
  const rimBand = useMemo(() => {
    const rimStep = 360 / RIM_LETTER_COUNT;
    const rimRadius = 38;
    const activeRim = Math.max(rimProgress, burst);
    const t = activeRim * RIM_LETTER_COUNT;
    let letterCursor = 0;
    return Array.from({ length: RIM_LETTER_COUNT }, (_, i) => {
      const a = -90 + i * rimStep;
      const rad = (a * Math.PI) / 180;
      const d = LETTERS[letterCursor++ % LETTERS.length];
      const dist = Math.abs(i - t);
      const lit = clamp(1.5 - 2 * dist);
      return {
        d,
        a,
        lit,
        x: 43 + rimRadius * Math.cos(rad),
        y: 43 + rimRadius * Math.sin(rad),
      };
    });
  }, [rimProgress, burst]);

  // V1-style summoned circle (halo).
  const isExpired = state === 'expired';
  const ccw = timerDirection === 'counterclockwise';
  const sealProgress = isExpired ? 0 : state === 'available' || state === 'new' ? 1 : clamp(progress);

  const glyphs = useMemo(() => {
    const written = sealProgress * GLYPH_COUNT;
    const sweep = ccw ? -1 : 1;
    return Array.from({ length: GLYPH_COUNT }, (_, i) => ({
      i,
      angle: sweep * (i + 0.5) * (360 / GLYPH_COUNT),
      lit: clamp(written - i),
      d: GLYPHS[i % GLYPHS.length],
    })).filter((g) => g.lit > 0.001);
  }, [sealProgress, ccw]);

  const flares = useMemo(
    () =>
      [0, 1, 2, 3]
        .map((i) => ({ i, angle: (ccw ? -1 : 1) * i * 90, lit: clamp((sealProgress - i / 4) * 4) }))
        .filter((f) => f.lit > 0.001),
    [sealProgress, ccw]
  );

  const letterStep = 360 / LETTER_COUNT;
  const outerRingRadius = 54;
  const innerRingRadius = 45;
  const upperBandRadius = 51.5;
  const lowerBandRadius = 47.5;

  const outerBand = useMemo(() => {
    const litCount = Math.floor(sealProgress * LETTER_COUNT);
    const stepRad = (letterStep * Math.PI) / 180;
    const halfStep = stepRad / 2;
    const tipWindow = LETTER_COUNT * 0.05;
    let letterCursor = 0;
    return Array.from({ length: LETTER_COUNT }, (_, i) => {
      const a = -90 + i * letterStep;
      const rad = (a * Math.PI) / 180;
      const lit = i < litCount ? 1 : 0;
      const tipFactor = clamp((sealProgress * LETTER_COUNT - i) / tipWindow);
      const d = LETTERS[letterCursor++ % LETTERS.length];
      return {
        d,
        a,
        lit,
        tipFactor,
        x: 43 + upperBandRadius * Math.cos(rad),
        y: 43 + upperBandRadius * Math.sin(rad),
        outerD: ringSegmentPath(43, 43, outerRingRadius, rad - halfStep, rad + halfStep),
        innerD: ringSegmentPath(43, 43, innerRingRadius, rad - halfStep, rad + halfStep),
      };
    }).filter((g) => g.lit > 0.001);
  }, [sealProgress]);

  const lowerBand = useMemo(() => {
    const litCount = Math.floor(sealProgress * LETTER_COUNT);
    const tipWindow = LETTER_COUNT * 0.05;
    let letterCursor = 0;
    return Array.from({ length: LETTER_COUNT }, (_, i) => {
      const a = -90 + (i + 0.5) * letterStep;
      const rad = (a * Math.PI) / 180;
      const lit = i < litCount ? 1 : 0;
      const tipFactor = clamp((sealProgress * LETTER_COUNT - i) / tipWindow);
      const d = LETTERS[letterCursor++ % LETTERS.length];
      return {
        d,
        a,
        lit,
        tipFactor,
        x: 43 + lowerBandRadius * Math.cos(rad),
        y: 43 + lowerBandRadius * Math.sin(rad),
      };
    }).filter((g) => g.lit > 0.001);
  }, [sealProgress]);

  const cardinals = useMemo(() => {
    const flareRadius = 54;
    return [
      { x: 43, y: 43 - flareRadius, lit: clamp(sealProgress * 4) },
      { x: 43 + flareRadius, y: 43, lit: clamp((sealProgress - 0.25) * 4) },
      { x: 43, y: 43 + flareRadius, lit: clamp((sealProgress - 0.5) * 4) },
      { x: 43 - flareRadius, y: 43, lit: clamp((sealProgress - 0.75) * 4) },
    ];
  }, [sealProgress]);

  // 100% completion burst: glow + runes flash for 200 ms.
  useEffect(() => {
    const prev = prevSealProgressRef.current;
    prevSealProgressRef.current = sealProgress;
    if (sealProgress >= 1 && prev < 1) {
      setBurst(1);
      const start = performance.now();
      const duration = 200;
      let frame = 0;
      const tick = (now: number) => {
        const next = Math.max(0, 1 - (now - start) / duration);
        setBurst(next);
        if (next > 0) {
          frame = requestAnimationFrame(tick);
        }
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    }
  }, [sealProgress]);

  useEffect(() => {
    if (!cursorVelocity) return;
    const { x, y } = cursorVelocity;
    const speed = Math.hypot(x, y);
    if (speed < 0.02) {
      rimIntensityRef.current *= 0.92;
      return;
    }
    rimAngleTargetRef.current = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    rimIntensityRef.current = Math.min(1, speed * 12); // amplify small velocities for visual impact
  }, [cursorVelocity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rimAngleCurrent = rimAngleTargetRef.current;
    let currentOp = 0;
    let animationFrameId: number;

    const drawRim = (angleDeg: number, opacity: number) => {
      ctx.clearRect(0, 0, 86, 86);
      if (opacity < 0.005) return;
      const cx = 43, cy = 43, r = 40;
      const a0 = (angleDeg - 22) * Math.PI / 180;
      const a1 = (angleDeg + 22) * Math.PI / 180;
      
      ctx.beginPath();
      ctx.arc(cx, cy, r, a0, a1);
      ctx.strokeStyle = `rgba(240,207,106,${opacity * 0.28})`;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(cx, cy, r, a0 + (a1 - a0) * 0.35, a1 - (a1 - a0) * 0.35);
      ctx.strokeStyle = `rgba(245,242,232,${opacity * 0.55})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const animRim = () => {
      const diff = rimAngleTargetRef.current - rimAngleCurrent;
      let delta = diff;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      rimAngleCurrent += delta * 0.15; // increased follow speed for less visual lag
      
      const targetOp = isDragging ? Math.min(1, Math.max(0.25, rimIntensityRef.current)) : 0;
      currentOp += (targetOp - currentOp) * 0.15;
      
      if (canvas) {
        canvas.style.opacity = currentOp.toString();
      }
      drawRim(rimAngleCurrent, currentOp);
      
      animationFrameId = requestAnimationFrame(animRim);
    };

    animRim();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDragging]);

  // Fallback gradient if no portrait is provided
  const fallbackPortrait = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCARCB9ADASIAAhEBAxEB/8QAHQAAAQUBAQEBAAAAAAAAAAAABAECAwUGAAcICf/EAEsQAAEDAwIEBAMGBAQFBAACCwEAAgMEESEFMQYSQVETImFxBzKBFCNCkaGxUmLB0RUzcuEIJEPw8RY0U4KSJaKyNWNz0hcmVMJE/8QAGwEAAgMBAQEAAAAAAAAAAAAAAgMAAQQFBgf/xAAzEQACAwACAgICAgEEAgEDBQEAAQIDEQQhEjETQQUiMlFhFCNCcQYzgRVSYhY0kaGxQ//aAAwDAQACEQMRAD8A89m/zn+5TMlPl/zn2PUpgX0BHnTikuTlKVwsM/ooyHBKdkoHdcLHoq0sTKT32TiLHCQ2VEG7YSrrEpDfZWQ4HPZLuusF2AVZR3RIbBLdduoQQ4SYLkp32XDdQo7lzdd1v0XZXWyrLYpyEt+y7I2XbKyHFI0XclsO6c0Z3UIdsndFy6xseihBMrrpQDa11xB+isgh9Su/NLb1Xbb9FRZ1he647Ltze67rZQh1vVIDhLhcRsoUMJylK4A5XW7Z6KyCYulSgE9PRLZTSDbDulH6pQ1KAqIc25PTZKD2KXl2Fl1goQ62LlPGMdUgFuqXKhYo3ylsm53S37WUKOtYpricJxPdNcdlGRoafVcT3KUhdbO6oghsF26W2crgrINK62bpy4BUQQZKkb2XNbsngdbWQtkOb6p/S64D2TsqtKEFvqnCyQDO3VPA7qyCALrFO36Jwbi37qiyK21v1S8vZTclxZJy9lEyDAL7KRoSgXG1lKxuM2UbK0SNv5p4b+Sc0JxtfZLbItG26BdbqnfokIPZAWd6Lu5XXXdSVZBrjnITfS+3dPPfCa4Z+iNFCf8AZXZIOFwC4dVCI5qUDouv6JTY9UIQnX6Jric2S7Jryp7INSdOq4ZITgMg9kWEG7905g/Nd1TtsKFCbmyVKey62FChL4Sj8ku2LLgoQ7ltuutbulC4KEwQ4Cba6VwzfdIFCjh6LgeyW2Lrh7KEOykue6W2MruqogrR/unhoSAZ26p2LFQs4ggCyTHqEueiRoyqIOAP0Sj8l2ACuCjKFAPquJBwN+qaXW9U5rLgvmIYwC5zZBKSSLSI3SHNiL';

  return (
    <div
      ref={containerRef}
      role="img"
      data-testid={dataTestId}
      aria-label={t('idleVillage:medalOverlay.ariaLabel', { defaultValue: 'Resident medal' })}
      className={`poiv3 tok-svg ${className}${burst > 0.001 ? ' poiv3--burst' : ''}`}
      onClick={onClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      style={{
        position: 'relative',
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        visibility: 'visible',
        ...style,
      }}
    >
      <div className="poiv3__vignette" aria-hidden="true" />
      <div className="poiv3__ground" aria-hidden="true" />
      <div className="poiv3__fog" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        width={sizePx}
        height={sizePx}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: sizePx,
          height: sizePx,
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: sizePx,
          height: sizePx,
          zIndex: 4,
          pointerEvents: 'none',
          willChange: isDragging ? 'transform' : 'auto',
          transform: isDragging ? 'translateZ(0)' : 'none',
          backfaceVisibility: isDragging ? 'hidden' : 'visible',
        }}
      >
        <svg
          className="poiv3__svg"
          width={sizePx}
          height={sizePx}
          viewBox="0 0 86 86"
          overflow="visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Bronze - warm oxidized */}
            <linearGradient id="g-b" x1="14%" y1="4%" x2="86%" y2="96%">
              <stop offset="0%" stopColor="#f0cf6a" />
              <stop offset="9%" stopColor="#dfb857" />
              <stop offset="28%" stopColor="#8a5a20" />
              <stop offset="52%" stopColor="#060f16" />
              <stop offset="76%" stopColor="#060f16" />
              <stop offset="100%" stopColor="#060f16" />
            </linearGradient>

            {/* Bevel diagonal */}
            <linearGradient id="g-bv" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,240,165,.30)" />
              <stop offset="22%" stopColor="rgba(255,225,135,.09)" />
              <stop offset="58%" stopColor="rgba(255,210,100,.02)" />
              <stop offset="100%" stopColor="rgba(0,0,0,.62)" />
            </linearGradient>

            {/* Inner ring */}
            <linearGradient id="g-ri" x1="12%" y1="8%" x2="88%" y2="92%">
              <stop offset="0%" stopColor="#f0cf6a" />
              <stop offset="16%" stopColor="#dfb857" />
              <stop offset="46%" stopColor="#8a5a20" />
              <stop offset="80%" stopColor="#060f16" />
              <stop offset="100%" stopColor="#060f16" />
            </linearGradient>

            {/* Field stone */}
            <radialGradient id="g-f" cx="40%" cy="33%" r="70%">
              <stop offset="0%" stopColor="#0c1517" />
              <stop offset="38%" stopColor="#060f16" />
              <stop offset="72%" stopColor="#060f16" />
              <stop offset="100%" stopColor="#050a0d" />
            </radialGradient>

            {/* Specular soft */}
            <radialGradient id="g-sp" cx="38%" cy="30%" r="56%">
              <stop offset="0%" stopColor="rgba(255,245,200,.22)" />
              <stop offset="42%" stopColor="rgba(255,232,168,.05)" />
              <stop offset="100%" stopColor="rgba(255,220,140,0)" />
            </radialGradient>

            {/* Portrait vignette */}
            <radialGradient id="g-vg" cx="50%" cy="44%" r="54%">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="48%" stopColor="rgba(0,0,0,.12)" />
              <stop offset="100%" stopColor="rgba(0,0,0,.78)" />
            </radialGradient>

            {/* Glass convex main body */}
            <radialGradient id="g-glass" cx="50%" cy="48%" r="52%">
              <stop offset="0%" stopColor="rgba(220,235,255,.0)" />
              <stop offset="60%" stopColor="rgba(200,220,255,.028)" />
              <stop offset="100%" stopColor="rgba(180,210,255,.065)" />
            </radialGradient>
            
            {/* Glass top-left reflection */}
            <radialGradient id="g-glass-hl" cx="38%" cy="30%" r="38%">
              <stop offset="0%" stopColor="rgba(255,255,255,.26)" />
              <stop offset="35%" stopColor="rgba(255,255,255,.08)" />
              <stop offset="70%" stopColor="rgba(255,255,255,.02)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>

            {/* Glass bottom-right secondary bounce */}
            <radialGradient id="g-glass-b" cx="74%" cy="78%" r="32%">
              <stop offset="0%" stopColor="rgba(255,255,255,.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>

            {/* Filters */}
            <filter id="f-nm" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.52" numOctaves={4} seed="3" stitchTiles="stitch" result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 .020  0 0 0 0 .030  0 0 0 0 .040  0 0 0 .25 0" result="c" />
              <feBlend in="SourceGraphic" in2="c" mode="overlay" />
            </filter>
            
            <filter id="f-fs" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.90" numOctaves={5} seed="11" stitchTiles="stitch" result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 .020  0 0 0 0 .030  0 0 0 0 .040  0 0 0 .18 0" result="c" />
              <feBlend in="SourceGraphic" in2="c" mode="overlay" />
            </filter>
            
            <filter id="f-dp" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="turbulence" baseFrequency="0.030" numOctaves={3} seed="7" result="t" />
              <feDisplacementMap in="SourceGraphic" in2="t" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            
            <filter id="f-gl" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <filter id="f-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="g1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="g2" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="g3" />
              <feMerge>
                <feMergeNode in="g1" />
                <feMergeNode in="g2" />
                <feMergeNode in="g3" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Patina deformation - makes circles irregular */}
            <filter id="f-patina" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves={3} seed="42" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
            </filter>

            {/* Clips */}
            <clipPath id="c-port">
              <circle cx="43" cy="43" r="27.5" />
            </clipPath>

            <clipPath id="c-medal">
              <circle cx="43" cy="43" r="42" />
            </clipPath>
          </defs>

          {/* V1 magic circle — summoned circle around the medallion */}
          {sealProgress > 0.001 && (
            <g className="poiv3__seal">
              {outerBand.map((g, i) => (
                <g key={`s-${i}`}>
                  <path
                    d={g.outerD}
                    fill="none"
                    stroke="#f0cf6a"
                    strokeOpacity={0.7 + 0.3 * g.tipFactor}
                    strokeWidth="2.4"
                    strokeLinecap="butt"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={g.innerD}
                    fill="none"
                    stroke="#f0cf6a"
                    strokeOpacity={0.7 + 0.3 * g.tipFactor}
                    strokeWidth="2.4"
                    strokeLinecap="butt"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              ))}

              {outerBand.map((g, i) => (
                <g
                  key={`u-${i}`}
                  transform={`translate(${g.x.toFixed(2)} ${g.y.toFixed(2)}) rotate(${g.a})`}
                >
                  <g transform="scale(0.28)">
                    <path
                      d={g.d}
                      fill="none"
                      stroke="#f0cf6a"
                      strokeOpacity={0.65 + 0.35 * g.tipFactor}
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                </g>
              ))}

              {lowerBand.map((g, i) => (
                <g
                  key={`o-${i}`}
                  transform={`translate(${g.x.toFixed(2)} ${g.y.toFixed(2)}) rotate(${g.a})`}
                >
                  <g transform="scale(0.28)">
                    <path
                      d={g.d}
                      fill="none"
                      stroke="#f0cf6a"
                      strokeOpacity={0.65 + 0.35 * g.tipFactor}
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                </g>
              ))}

              {cardinals.map((c, i) => (
                <g
                  key={`c-${i}`}
                  transform={`translate(${c.x} ${c.y}) scale(0.7)`}
                  opacity={c.lit}
                >
                  <path d={FLARE} fill="#f0cf6a" />
                </g>
              ))}

              {glyphs.map((g) => (
                <g
                  key={`g-${g.i}`}
                  transform={`rotate(${g.angle}) translate(0 -${SEAL_RADIUS}) scale(0.5)`}
                  opacity={g.lit}
                >
                  <path
                    d={g.d}
                    fill="none"
                    stroke="#f0cf6a"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              ))}

              {flares.map((f) => (
                <g
                  key={`f-${f.i}`}
                    transform={`rotate(${f.angle}) translate(0 -${SEAL_RADIUS}) scale(0.7)`}
                  opacity={f.lit}
                >
                  <path d={FLARE} fill="#f0cf6a" />
                </g>
              ))}

              {/* Leading tip of the seal progression */}
              <g
                transform={`rotate(${-90 + sealProgress * 360}) translate(0 -${outerRingRadius}) scale(0.5)`}
                opacity={sealProgress > 0.001 ? 1 : 0}
              >
                <path d={FLARE} fill="#fff8d7" filter="url(#f-glow)" />
              </g>
            </g>
          )}

          {/* MEDALLION BODY */}
          <g className="poiv3__medal" clipPath="url(#c-medal)">
            {/* L1: Bronze outer body + texture + bevel */}
            <circle cx="43" cy="43" r="42" fill="#060f16" />
            <circle className="poiv3__body" cx="43" cy="43" r="42" fill="url(#g-b)" filter={isDragging ? undefined : "url(#f-nm)"} opacity=".90" />
            <circle className="poiv3__bevel" cx="43" cy="43" r="42" fill="url(#g-bv)" filter={isDragging ? undefined : "url(#f-dp)"} opacity=".48" />

            {/* L2: Rim top - arc of warm light */}
            <circle cx="43" cy="43" r="40.5" fill="none"
              stroke="rgba(240,207,106,.26)" strokeWidth="3.5"
              strokeDasharray="108 148" strokeDashoffset="72"
              strokeLinecap="round" filter={isDragging ? undefined : "url(#f-gl)"} />
            <circle cx="43" cy="43" r="41" fill="none"
              stroke="rgba(240,207,106,.68)" strokeWidth=".9"
              strokeDasharray="76 178" strokeDashoffset="82"
              strokeLinecap="round" />

            {/* L3: Inner ring separator */}
            <circle cx="43" cy="43" r="34" fill="#060f16" />
            <circle cx="43" cy="43" r="34" fill="url(#g-ri)" filter={isDragging ? undefined : "url(#f-nm)"} opacity=".68" />
            <circle cx="43" cy="43" r="34" fill="none"
              stroke="rgba(0,0,0,.75)" strokeWidth="2.2"
              transform="translate(.3,.35)" />
            <circle cx="43" cy="43" r="33.4" fill="none"
              stroke="rgba(240,207,106,.18)" strokeWidth=".8" />

            {/* L4: Field stone */}
            <circle cx="43" cy="43" r="30.5" fill="url(#g-f)" />
            <circle cx="43" cy="43" r="30.5" fill="url(#g-f)" filter={isDragging ? undefined : "url(#f-fs)"} opacity=".56" />
            <circle cx="43" cy="43" r="30.5" fill="url(#g-sp)" />

            {/* L4.5: Engraved rim script */}
            <g className="poiv3__rim">
              {rimBand.map((g, i) => (
                <g
                  key={`r-${i}`}
                  transform={`translate(${g.x.toFixed(2)} ${g.y.toFixed(2)}) rotate(${g.a})`}
                  opacity={0.8 + 0.2 * g.lit}
                >
                  <g transform="scale(0.66)">
                    <path
                      d={g.d}
                      fill="none"
                      stroke={g.lit > 0.01 ? '#f0cf6a' : '#4A3B22'}
                      strokeWidth={1.4 + 1.1 * g.lit}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      filter={g.lit > 0.01 ? 'url(#f-glow)' : 'url(#f-gl)'}
                    />
                  </g>
                </g>
              ))}
            </g>

            {/* L5: V1 cross icon */}
            <g className="poiv3__cross" transform="translate(43 43) scale(0.9)">
              {[0, 90, 180, 270].map((a) => (
                <path key={a} d={CROSS_ARM} fill="#f0cf6a" transform={`rotate(${a})`} />
              ))}
              <circle cx="0" cy="0" r="4" fill="#f0cf6a" />
            </g>

            {/* Portrait rim - bronze ring */}
            <circle cx="43" cy="43" r="27.5" fill="none"
              stroke="rgba(180,110,28,.30)" strokeWidth="1.5" />
            <circle cx="43" cy="43" r="27.5" fill="none"
              stroke="rgba(0,0,0,.65)" strokeWidth="1.9"
              transform="translate(.28,.35)" />

            {/* L6: GLASS - convex crystal over portrait */}
            <g className="poiv3__glass">
              <circle cx="43" cy="43" r="27.5" fill="url(#g-glass)" />
              <circle cx="43" cy="43" r="27.5" fill="url(#g-glass-hl)" />
              <circle cx="43" cy="43" r="27.5" fill="url(#g-glass-b)" />
              <circle cx="43" cy="43" r="27.2" fill="none"
                stroke="rgba(255,255,255,.22)" strokeWidth=".6"
                strokeDasharray="58 114" strokeDashoffset="62"
                strokeLinecap="round" />
              <circle cx="43" cy="43" r="27.2" fill="none"
                stroke="rgba(0,0,0,.30)" strokeWidth=".5"
                strokeDasharray="55 117" strokeDashoffset="194"
                strokeLinecap="round" />
              <ellipse
                className="poiv3__specular"
                cx="30" cy="22"
                rx="12" ry="5"
                fill="rgba(255,255,255,0.24)"
                filter="url(#f-gl)"
                clipPath="url(#c-port)"
                style={{
                  transform: `translate(${highlight.x}px, ${highlight.y}px)`,
                }}
              />
            </g>


            {/* L7: Patina / random wear per instance */}
            {imperfections.patinaSpots.map((p, i) => (
              <circle
                key={`patina-${i}`}
                cx={p.cx.toFixed(2)}
                cy={p.cy.toFixed(2)}
                r={p.r.toFixed(2)}
                fill={`rgba(34,18,8,${p.opacity.toFixed(2)})`}
                filter={isDragging ? undefined : "url(#f-patina)"}
              />
            ))}
            {imperfections.scratches.map((s, i) => (
              <line
                key={`scratch-${i}`}
                x1={s.x1.toFixed(2)}
                y1={s.y1.toFixed(2)}
                x2={s.x2.toFixed(2)}
                y2={s.y2.toFixed(2)}
                stroke={s.color}
                strokeWidth={s.width.toFixed(2)}
                strokeLinecap="round"
              />
            ))}

            {/* L8: Bottom AO on field */}
            <circle cx="43" cy="43" r="30.5" fill="none"
              stroke="rgba(0,0,0,.52)" strokeWidth="4"
              strokeDasharray="96 96" strokeDashoffset="-48"
              strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {/* GEM - absolutely positioned below medal center */}
      <div className="poiv3__gem" style={{ position: 'absolute', left: '50%', bottom: '-14px', transform: 'translateX(-50%)', zIndex: 5, pointerEvents: 'none' }}>
        <svg width="40" height="32" viewBox="-20 -14 40 32" xmlns="http://www.w3.org/2000/svg" overflow="visible">
          <defs>
            <linearGradient id="g2-b" x1="14%" y1="4%" x2="86%" y2="96%">
              <stop offset="0%" stopColor="#fce890" /><stop offset="9%" stopColor="#e4b048" />
              <stop offset="28%" stopColor="#a05c18" /><stop offset="52%" stopColor="#602c08" />
              <stop offset="76%" stopColor="#341604" /><stop offset="100%" stopColor="#0e0602" />
            </linearGradient>
            <linearGradient id="g2-ri" x1="12%" y1="8%" x2="88%" y2="92%">
              <stop offset="0%" stopColor="#f0d070" /><stop offset="16%" stopColor="#c88430" />
              <stop offset="46%" stopColor="#7c3e10" /><stop offset="80%" stopColor="#3c1c04" />
              <stop offset="100%" stopColor="#160a02" />
            </linearGradient>
            <linearGradient id="g2-top" x1="30%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%" stopColor="#d8ffd8" /><stop offset="40%" stopColor="#72ee82" />
              <stop offset="100%" stopColor="#1a7830" />
            </linearGradient>
            <linearGradient id="g2-lu" x1="0%" y1="20%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#58d868" /><stop offset="100%" stopColor="#0e5c20" />
            </linearGradient>
            <linearGradient id="g2-ru" x1="100%" y1="20%" x2="0%" y2="80%">
              <stop offset="0%" stopColor="#88ee98" /><stop offset="100%" stopColor="#1a6828" />
            </linearGradient>
            <linearGradient id="g2-ll" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a6828" /><stop offset="100%" stopColor="#083c14" />
            </linearGradient>
            <linearGradient id="g2-rl" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2a8838" /><stop offset="100%" stopColor="#0a4818" />
            </linearGradient>
            <linearGradient id="g2-bot" x1="30%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%" stopColor="#0e5020" /><stop offset="100%" stopColor="#042810" />
            </linearGradient>
            <radialGradient id="g2-caus" cx="68%" cy="72%" r="44%">
              <stop offset="0%" stopColor="rgba(140,255,160,.30)" /><stop offset="100%" stopColor="rgba(80,220,100,0)" />
            </radialGradient>
            <radialGradient id="g2-flash" cx="32%" cy="22%" r="28%">
              <stop offset="0%" stopColor="rgba(255,255,255,.88)" /><stop offset="50%" stopColor="rgba(255,255,255,.26)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <radialGradient id="g2-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(58,215,80,.32)" /><stop offset="100%" stopColor="rgba(38,180,60,0)" />
            </radialGradient>
            <radialGradient id="g2-ao" cx="50%" cy="50%" r="50%">
              <stop offset="55%" stopColor="rgba(0,0,0,0)" /><stop offset="80%" stopColor="rgba(0,0,0,.52)" />
              <stop offset="100%" stopColor="rgba(0,0,0,.86)" />
            </radialGradient>
            <filter id="g2-fn" x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence type="fractalNoise" baseFrequency="0.52" numOctaves={4} seed="3" stitchTiles="stitch" result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 .068  0 0 0 0 .046  0 0 0 0 .021  0 0 0 .25 0" result="c" />
              <feBlend in="SourceGraphic" in2="c" mode="overlay" />
            </filter>
          </defs>

          {/* Glow */}
          <ellipse cx="0" cy="0" rx="10" ry="8" fill="url(#g2-glow)" style={{ filter: 'blur(3.5px)' }} />

          {/* 6 claws */}
          <path d="M-1,-9.5 C-.7,-8 -.5,-6.5 -.8,-5.2 C-.5,-4.5 0,-4.2 .8,-5.2 C.5,-6.5 .7,-8 1,-9.5 C.5,-10.2 -.5,-10.2 -1,-9.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".92" />
          <path d="M7.2,-5.5 C6,-4.5 5.4,-3.6 4.8,-2.6 C5.1,-2 5.8,-1.8 6.5,-2.6 C7,-3.6 7.5,-4.5 8.2,-5.3 C7.6,-6.2 6.8,-6 7.2,-5.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".90" />
          <path d="M7.2,5.5 C6,4.5 5.4,3.6 4.8,2.6 C5.1,2 5.8,1.8 6.5,2.6 C7,3.6 7.5,4.5 8.2,5.3 C7.6,6.2 6.8,6 7.2,5.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".90" />
          <path d="M-1,9.5 C-.7,8 -.5,6.5 -.8,5.2 C-.5,4.5 0,4.2 .8,5.2 C.5,6.5 .7,8 1,9.5 C.5,10.2 -.5,10.2 -1,9.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".88" />
          <path d="M-7.2,5.5 C-6,4.5 -5.4,3.6 -4.8,2.6 C-5.1,2 -5.8,1.8 -6.5,2.6 C-7,3.6 -7.5,4.5 -8.2,5.3 C-7.6,6.2 -6.8,6 -7.2,5.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".90" />
          <path d="M-7.2,-5.5 C-6,-4.5 -5.4,-3.6 -4.8,-2.6 C-5.1,-2 -5.8,-1.8 -6.5,-2.6 C-7,-3.6 -7.5,-4.5 -8.2,-5.3 C-7.6,-6.2 -6.8,-6 -7.2,-5.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".90" />

          {/* Base ring */}
          <circle cx="0" cy="0" r="6.2" fill="none" stroke="url(#g2-ri)" strokeWidth="1.4" filter="url(#g2-fn)" opacity=".80" />
          <circle cx="0" cy="0" r="6.2" fill="none" stroke="rgba(0,0,0,.65)" strokeWidth="1.6" transform="translate(.2,.3)" />
          <circle cx="0" cy="0" r="5.8" fill="none" stroke="rgba(255,218,110,.18)" strokeWidth=".6" />

          {/* Gem bed */}
          <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="#060402" />
          <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="url(#g2-ao)" />

          {/* Facets marquise */}
          <polygon points="0,-6.5 -4.2,0 0,6.5" fill="url(#g2-ll)" opacity=".88" />
          <polygon points="0,-6.5  4.2,0 0,6.5" fill="url(#g2-rl)" opacity=".88" />
          <polygon points="-2.2,3.5 2.2,3.5 0,6.5" fill="url(#g2-bot)" opacity=".95" />
          <polygon points="0,-6.5 -2.8,-2.8 0,-1.4 2.8,-2.8" fill="url(#g2-top)" opacity=".95" />
          <polygon points="0,-6.5 -4.2,0 -2.8,-2.8" fill="url(#g2-lu)" opacity=".90" />
          <polygon points="0,-6.5  4.2,0  2.8,-2.8" fill="url(#g2-ru)" opacity=".90" />
          <polygon points="-2.8,-2.8 0,-1.4 2.8,-2.8 4.2,0 0,2.2 -4.2,0" fill="url(#g2-top)" opacity=".85" />

          {/* Facet lines */}
          <line x1="0" y1="-6.5" x2="-4.2" y2="0" stroke="rgba(255,255,255,.28)" strokeWidth=".4" />
          <line x1="0" y1="-6.5" x2="4.2"  y2="0" stroke="rgba(255,255,255,.22)" strokeWidth=".4" />
          <line x1="0" y1="-6.5" x2="0"    y2="-1.4" stroke="rgba(255,255,255,.35)" strokeWidth=".4" />
          <line x1="-2.8" y1="-2.8" x2="2.8" y2="-2.8" stroke="rgba(255,255,255,.18)" strokeWidth=".35" />
          <line x1="-4.2" y1="0"    x2="4.2" y2="0" stroke="rgba(255,255,255,.14)" strokeWidth=".35" />
          <line x1="0"    y1="2.2"  x2="-4.2" y2="0" stroke="rgba(0,0,0,.20)" strokeWidth=".35" />
          <line x1="0"    y1="2.2"  x2="4.2"  y2="0" stroke="rgba(0,0,0,.16)" strokeWidth=".35" />
          <line x1="0"    y1="2.2"  x2="0"    y2="6.5" stroke="rgba(0,0,0,.24)" strokeWidth=".35" />

          <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="url(#g2-caus)" />
          <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="url(#g2-flash)" />
          <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="rgba(50,210,75,.0)">
            <animate attributeName="rx" values="6.5;9;6.5" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="ry" values="8.5;12;8.5" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="fill-opacity" values="0.055;0;0.055" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="fill" values="rgba(50,210,75,1);rgba(50,210,75,1);rgba(50,210,75,1)" dur="3.2s" repeatCount="indefinite" />
          </ellipse>
        </svg>
      </div>
    </div>
  );
};

export const poiMatericV3Styles = `
.poiv3 {
  position: relative;
  display: inline-flex;
  cursor: pointer;
  filter: drop-shadow(0 4px 3px rgba(0,0,0,0.45));
  transition: filter 250ms ease;
}
.poiv3:hover { filter: drop-shadow(0 6px 5px rgba(0,0,0,0.55)); }
.poiv3__svg { position: relative; width: 100%; height: 100%; overflow: visible; z-index: 4; }
.poiv3__seal { filter: url(#f-glow); opacity: 0.85; }
.poiv3__medal { filter: url(#f-glow) drop-shadow(0 8px 6px rgba(0,0,0,0.55)); }
.poiv3--burst .poiv3__seal { opacity: 1; filter: url(#f-glow) drop-shadow(0 0 24px rgba(240,207,106,0.55)); }
.poiv3--burst .poiv3__medal { filter: url(#f-glow) drop-shadow(0 8px 6px rgba(0,0,0,0.55)) drop-shadow(0 0 28px rgba(240,207,106,0.35)); }
.poiv3__body { transition: filter 250ms ease; }
.poiv3:hover .poiv3__body { filter: brightness(1.14); }
.poiv3__bevel { transition: filter 250ms ease; }
.poiv3:hover .poiv3__bevel { filter: brightness(1.2); }
.poiv3__cross { transition: filter 250ms ease; }
.poiv3:hover .poiv3__cross { filter: contrast(1.15) brightness(1.15); }
.poiv3__glass { transition: opacity 250ms ease; }
.poiv3:hover .poiv3__glass { opacity: 1; }
.poiv3__gem { transition: transform 250ms ease, filter 250ms ease; }
.poiv3:hover .poiv3__gem { transform: translateX(-50%) scale(1.08); filter: brightness(1.15); }
.poiv3__specular { transition: transform 80ms ease-out; }
.poiv3__vignette {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 150px;
  height: 150px;
  border-radius: 50%;
  filter: blur(10px);
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(circle at 50% 56%,
    rgba(0,0,0,0.68) 0%,
    rgba(0,0,0,0.42) 30%,
    rgba(0,0,0,0.18) 55%,
    transparent 82%
  );
}
.poiv3__ground {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 96px;
  height: 96px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 1;
  backdrop-filter: blur(1.2px) saturate(1.08);
}
.poiv3__fog {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 2;
  background: radial-gradient(circle at 50% 46%,
    rgba(240,207,106,0.12) 0%,
    rgba(240,207,106,0.05) 45%,
    transparent 72%
  );
}
`;


export default PoiMatericV3;
