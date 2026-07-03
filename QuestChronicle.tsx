import type { CSSProperties } from 'react';
import React, { useEffect, useState } from 'react';
import { WanderlustSurface } from '@/ui/wanderlust-surface';
import { WanderlustAmbientField } from './WanderlustAmbientField';
import {
  WanderlustHeading,
  WanderlustField,
  WanderlustFieldGroup,
  WanderlustRequirementList,
  WanderlustRecordList,
  WanderlustDivider,
  WanderlustSectionHeader,
  SPACE,
  type WanderlustRequirement,
} from './WanderlustLayout';

/* ════════════════════════════════════════════════════════════════════════
 *  QuestChronicle — Example composition
 *
 *  Shows how to assemble the full quest detail panel from:
 *  - WanderlustSurface (border / material — already exists)
 *  - WanderlustAmbientField (atmosphere)
 *  - WanderlustLayout primitives (text, data, requirements, log)
 *  - Your own slot/rack components (plugged in via children/slots)
 *
 *  This file is an EXAMPLE, not a library component. Copy and adapt.
 * ════════════════════════════════════════════════════════════════════════ */

export interface QuestChronicleSlot {
  id: string;
  filled: boolean;
  portraitUrl?: string;
  initials?: string;
}

export interface QuestChronicleEvent {
  timestamp: string;
  message: string;
}

export interface QuestChronicleProps {
  title: string;
  category?: string;
  description?: string;
  duration?: string;
  reward?: string;
  eta?: string;
  slots?: QuestChronicleSlot[];
  requirements?: WanderlustRequirement[];
  events?: QuestChronicleEvent[];
  onClose?: () => void;
  style?: CSSProperties;
}

export const QuestChronicle: React.FC<QuestChronicleProps> = ({
  title,
  category,
  description,
  duration,
  reward,
  eta,
  slots = [],
  requirements = [],
  events = [],
  onClose,
  style,
}) => {
  // Performance: disable heavy SVG filters during open animation
  const [isOpening, setIsOpening] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setIsOpening(false), 320);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <WanderlustSurface
      shape="panel"
      isDragging={isOpening}
      style={{ width: '100%', maxWidth: 720, ...style }}
    >
      <WanderlustAmbientField paused={isOpening}>

        {/* ── Close button ── */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: 0, right: 0, zIndex: 3,
              width: 32, height: 32, borderRadius: '50%',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'rgba(201,168,78,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none"
              stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}

        {/* ── Header row: quest dot + heading ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', paddingRight: 36 }}>
          {/* Quest indicator dot — ruota lentamente */}
          <div style={{ flexShrink: 0, marginTop: 8 }}>
            <svg viewBox="0 0 28 28" width={28} height={28}
              style={{ animation: 'wl-dot-spin 40s linear infinite' }}>
              <circle cx="14" cy="14" r="12" fill="none"
                stroke="rgba(216,177,62,0.5)" strokeWidth="1" strokeDasharray="3 4" />
              <circle cx="14" cy="14" r="6" fill="none"
                stroke="rgba(240,207,106,0.4)" strokeWidth="0.8" />
              <circle cx="14" cy="14" r="2" fill="rgba(240,207,106,0.6)" />
            </svg>
          </div>

          <WanderlustHeading
            title={title}
            subtitle={category}
            description={description}
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>

        <WanderlustDivider />

        {/* ── Primary data row ── */}
        {(duration || reward || eta) && (
          <WanderlustFieldGroup layout="columns" columns={3}>
            {duration && <WanderlustField label="Durata" value={duration} />}
            {reward && <WanderlustField label="Ricompensa" value={reward} />}
            {eta && <WanderlustField label="ETA" value={eta} />}
          </WanderlustFieldGroup>
        )}

        <WanderlustDivider />

        {/* ── Assigned characters (FOCAL — primary tier) ── */}
        {slots.length > 0 && (
          <>
            <WanderlustSectionHeader tier="primary">
              Personaggi Assegnati
            </WanderlustSectionHeader>

            <div style={{ display: 'flex', gap: 20 }}>
              {slots.map((slot) => (
                <div key={slot.id} style={{
                  width: 66, height: 66, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--wl-font-display)', fontWeight: 700, fontSize: 22,
                  background: 'radial-gradient(circle at 38% 32%, #2a1810 0%, #140b06 70%, #0a0503 100%)',
                  cursor: 'pointer',
                  ...(slot.filled ? {
                    border: '1.5px solid var(--wl-gold, #d8b13e)',
                    color: 'var(--wl-gold-bright, #f0cf6a)',
                    boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.6), 0 0 16px rgba(216,177,62,0.3), 0 3px 10px rgba(120,30,10,0.35)',
                  } : {
                    border: '1px dashed rgba(201,168,78,0.3)',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.7), 0 2px 6px rgba(80,20,8,0.2)',
                  }),
                }}>
                  {slot.filled ? (
                    slot.portraitUrl
                      ? <img src={slot.portraitUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : <span>{slot.initials}</span>
                  ) : (
                    <svg viewBox="0 0 40 40" width={40} height={40} style={{ opacity: 0.32 }}>
                      <path d="M20 9 C16 9 13 12 13 16 C13 20 16 22 20 22 C24 22 27 20 27 16 C27 12 24 9 20 9 Z M11 33 C11 26 15 24 20 24 C25 24 29 26 29 33 Z"
                        fill="rgba(201,168,78,0.9)" />
                    </svg>
                  )}
                </div>
              ))}
            </div>

            <div style={{ height: SPACE.xxl }} />
          </>
        )}

        {/* ── Requirements (tertiary tier — supporting) ── */}
        {requirements.length > 0 && (
          <>
            <WanderlustSectionHeader tier="tertiary" hint="squadra attuale">
              Requisiti
            </WanderlustSectionHeader>
            <WanderlustRequirementList requirements={requirements} />
            <div style={{ height: SPACE.xl }} />
          </>
        )}

        {/* ── Event log (tertiary tier) ── */}
        {events.length > 0 && (
          <>
            <WanderlustSectionHeader tier="tertiary">
              Registro Eventi
            </WanderlustSectionHeader>
            <WanderlustRecordList
              columns={[
                { width: '60px', variant: 'caption' },
                { width: '1fr', variant: 'body' },
              ]}
              records={events.map(e => [e.timestamp, e.message])}
              rail
            />
          </>
        )}

        {/* ── Footer scroll indicator ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: SPACE.xxl }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, rgba(216,177,62,0.18), rgba(0,0,0,0.3))',
            border: '1px solid rgba(216,177,62,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px rgba(216,177,62,0.12), inset 0 1px 0 rgba(216,177,62,0.15)',
            cursor: 'pointer',
          }}>
            <svg viewBox="0 0 24 24" width={17} height={17} fill="none"
              stroke="var(--wl-gold-bright, #f0cf6a)" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
        </div>

      </WanderlustAmbientField>
    </WanderlustSurface>
  );
};

/* ── Usage example ─────────────────────────────────────────────────────

import { QuestChronicle } from './QuestChronicle';

<QuestChronicle
  title="Dangerous Hunt"
  category="quest"
  description="High-risk quest with substantial rewards but low success probability."
  duration="8000s"
  reward="Gold +15"
  eta="2800s"
  slots={[
    { id: '1', filled: true, initials: 'E' },
    { id: '2', filled: false },
    { id: '3', filled: false },
  ]}
  requirements={[
    { label: 'Forza',        current: 14, required: 12 },
    { label: 'Destrezza',    current: 9,  required: 11 },
    { label: 'Costituzione', current: 12, required: 10 },
  ]}
  events={[
    { timestamp: '17:33', message: 'Activity started' },
    { timestamp: '18:03', message: 'Worker assigned to slot 3' },
    { timestamp: '18:23', message: 'Progress update: 65%' },
  ]}
  onClose={() => console.log('close')}
/>

──────────────────────────────────────────────────────────────────────── */

export default QuestChronicle;
