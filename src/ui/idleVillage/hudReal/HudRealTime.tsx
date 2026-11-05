/**
 * HudRealTime — time control of PLAN-110 C11 (from the /game review): day readout plus pause and
 * speed ×1/×2/×4. One generated bar (build-fullbar-assets.py --square --field) with an empty plaque
 * and four empty round sockets; label and controls are live content in code. A view only: the caller
 * owns the clock (same contract as the production time controls: paused flag, speed, two callbacks).
 */
import type { ReactNode } from 'react';
import { HudTooltip } from '@/ui/idleVillage/components/gameFrame/HudTooltip';
import { EngravedIcon } from '@/ui/idleVillage/components/gameFrame/engravedIcons';
import { TIME_BAR as BAR } from './timeGeometry';

const ASSET = '/assets/ui/hud-real/time/bar.webp';
const C = { text: '#f3ead0', gold: '#f1d88a', dim: '#cdbf8e', shadow: '0 1px 2px rgba(3, 26, 30, 0.9)', focus: '#e8c766', glow: 'rgba(240, 201, 135, 0.55)' } as const;
const SCOPED_CSS = `
[data-hudreal-time] button { background: transparent; border: 0; padding: 0; cursor: pointer; border-radius: 50%; user-select: none; }
[data-hudreal-time] button:focus { outline: none; }
[data-hudreal-time] button:focus-visible { outline: 2px solid ${C.focus}; outline-offset: 2px; }
[data-hudreal-time] button:hover { filter: brightness(1.25); }
`;

export type TimeSpeed = 1 | 2 | 4;

export interface HudRealTimeProps {
  /** Already formatted, e.g. "Giorno 3". */
  dayLabel: string;
  phaseIcon?: ReactNode;
  paused: boolean;
  speed: TimeSpeed;
  onTogglePause: () => void;
  onSpeed: (speed: TimeSpeed) => void;
  labels: { pause: string; resume: string; speed: (s: TimeSpeed) => string };
}

const SPEEDS: TimeSpeed[] = [1, 2, 4];

export function HudRealTime({ dayLabel, phaseIcon, paused, speed, onTogglePause, onSpeed, labels }: HudRealTimeProps) {
  const f = BAR.field;
  const ring = (on: boolean) => (on ? { boxShadow: `0 0 0 2px ${C.gold}, 0 0 10px ${C.glow}` } : undefined);
  const pos = (i: number) => ({ position: 'absolute' as const, left: BAR.slots[i].x, top: BAR.slots[i].y, width: BAR.slots[i].w, height: BAR.slots[i].h, display: 'grid', placeItems: 'center' });
  return (
    <section data-hudreal-time="" aria-label={dayLabel} style={{ position: 'relative', userSelect: 'none', width: BAR.w, height: BAR.h }}>
      <style>{SCOPED_CSS}</style>
      <img src={ASSET} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute', left: f.x + 8, top: f.y, width: f.w - 24, height: f.h, display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 15, letterSpacing: 1.5, color: C.text, textShadow: C.shadow, whiteSpace: 'nowrap', overflow: 'hidden',
      }}>{phaseIcon}<span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{dayLabel}</span></div>
      <HudTooltip label={paused ? labels.resume : labels.pause} side="bottom" wrap>
        <button type="button" data-hr-time="pause" aria-pressed={paused} aria-label={paused ? labels.resume : labels.pause} onClick={onTogglePause}
          style={{ ...pos(0), color: paused ? C.gold : C.dim, ...ring(paused) }}>
          <EngravedIcon id={paused ? 'cmd-play' : 'cmd-pause'} size={16} />
        </button>
      </HudTooltip>
      {SPEEDS.map((s, i) => {
        const on = !paused && speed === s;
        return (
          <HudTooltip key={s} label={labels.speed(s)} side="bottom" wrap>
            <button type="button" data-hr-time={`x${s}`} aria-pressed={on} aria-label={labels.speed(s)} onClick={() => onSpeed(s)}
              style={{ ...pos(i + 1), color: on ? C.gold : C.dim, fontFamily: '"EB Garamond", serif', fontWeight: 700, fontSize: 14, textShadow: C.shadow, ...ring(on) }}>×{s}</button>
          </HudTooltip>
        );
      })}
    </section>
  );
}
