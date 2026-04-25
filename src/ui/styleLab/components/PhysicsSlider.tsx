/**
 * PhysicsSlider.tsx
 * Slider skeuomorfico con label, valore live e descrizione.
 * Usa i token CSS del progetto (--acc-*, --go-*) via var().
 */

import React, { useId } from 'react';
import type { SliderDef } from '../config/physicsDefaults';
import type { PhysicsConfig } from '../config/physicsDefaults';

interface PhysicsSliderProps {
  def: SliderDef;
  value: number;
  onChange: (key: keyof PhysicsConfig, value: number) => void;
}

export function PhysicsSlider({ def, value, onChange }: PhysicsSliderProps) {
  const id = useId();
  const pct = ((value - def.min) / (def.max - def.min)) * 100;

  return (
    <div className="mb-[18px] last:mb-0">
      {/* Label row */}
      <div className="flex justify-between items-baseline mb-1">
        <label
          htmlFor={id}
          className="font-cinzel text-[8px] tracking-[0.12em] uppercase"
          style={{ color: 'var(--t1, #c8b88a)' }}
        >
          {def.label}
        </label>
        <span
          className="font-cinzel text-[13px] font-bold min-w-[44px] text-right"
          style={{
            color: 'var(--go6, #e0bc50)',
            textShadow: '0 0 8px var(--acc-glow, rgba(200,160,48,.38))',
          }}
        >
          {def.fmt(value)}
        </span>
      </div>

      {/* Description */}
      <p
        className="text-[10.5px] italic mb-[6px] leading-[1.45]"
        style={{ color: 'var(--t2, #806858)' }}
      >
        {def.desc}
      </p>

      {/* Track + thumb */}
      <div className="relative h-[5px] rounded-sm">
        {/* Filled track */}
        <div
          className="absolute inset-0 rounded-sm overflow-hidden"
          style={{
            boxShadow: 'inset 0 1px 4px rgba(0,0,0,.85)',
            background: 'rgba(255,255,255,.06)',
          }}
        >
          <div
            className="h-full rounded-sm transition-none"
            style={{
              width: `${pct}%`,
              background:
                'linear-gradient(90deg, var(--go4, #a08020), var(--go5, #c8a030))',
            }}
          />
        </div>

        {/* Native input (invisible, on top for interaction) */}
        <input
          id={id}
          type="range"
          min={def.min}
          max={def.max}
          step={def.step}
          value={value}
          onChange={e => onChange(def.key, parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ margin: 0 }}
        />

        {/* Custom thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[16px] h-[16px] rounded-full pointer-events-none"
          style={{
            left: `calc(${pct}% - 8px)`,
            background:
              'radial-gradient(circle, var(--go8, #faeaaa) 0%, var(--go6, #e0bc50) 45%, var(--go4, #a08020) 100%)',
            border: '1px solid var(--go6, #e0bc50)',
            boxShadow:
              '0 0 10px var(--acc-glow, rgba(200,160,48,.4)), 0 0 20px rgba(200,160,48,.15), 0 2px 6px rgba(0,0,0,.8)',
            transition: 'transform .15s cubic-bezier(.34,1.56,.64,1)',
          }}
        />
      </div>
    </div>
  );
}
