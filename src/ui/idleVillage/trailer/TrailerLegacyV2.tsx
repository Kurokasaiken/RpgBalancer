/**
 * @trailer-only
 *
 * TrailerLegacyV2 — Scene 6 iteration: "The Preservation Table".
 *
 * The scene opens on the same wounded field the Consequence scene left
 * behind (a desaturated teal veil over the materic field). As the veil
 * lifts, three different forms of heritage materialize on an engraved
 * horizontal axis — each with its own verb:
 *
 *   - ARTIFACT  → CONDENSE: turquoise memory particles converge into a
 *     solid golden reliquary (matter).
 *   - BLUEPRINT → DRAW: a golden line traces the Sacred Altar schematic
 *     over a faint azure ghost (knowledge).
 *   - HEROES    → REVEAL: light silhouettes resolve into living portraits
 *     (living memory).
 *
 * Instead of a success checkmark, each element is "fixed" by a golden
 * sweep followed by a sigil lock on the table line — the visual act of
 * preservation. The title condenses last, as the conclusion of the
 * transmutation, in the skin's ivory-gold engraved gradient.
 *
 * This component is part of the Steam teaser trailer production pipeline.
 * It is exempt from gameplay architecture requirements but must preserve
 * presentation architecture requirements.
 *
 * NO gameplay logic
 * NO persistence
 * NO i18n
 * NO telemetry
 */

import React, { useEffect, useMemo } from 'react';
import { MatericPortrait } from '@/ui/designSystem/primitives';
import { trailerConfig } from '@/balancing/config/idleVillage/trailerConfig';
import { TrailerSceneShell } from './TrailerSceneShell';
import type { TrailerSceneProps } from './types';
import './trailer.css';

interface LegacyV2ItemConfig {
  id: string;
  verb: 'condense' | 'draw' | 'reveal';
  label: string;
  caption: string;
  anchorX: number;
}

interface ArtifactParticleSpec {
  x: number;
  y: number;
  size: number;
  delayMs: number;
}

const ARTIFACT_PARTICLE_COUNT = 16;

/**
 * Deterministic particle ring for the artifact condensation beat.
 * No Math.random — positions derive from index on a perturbed circle.
 */
function buildArtifactParticles(count: number): ArtifactParticleSpec[] {
  const specs: ArtifactParticleSpec[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.35;
    const radius = 56 + (i % 4) * 17;
    specs.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.82,
      size: 3 + (i % 3),
      delayMs: (i % 5) * 90,
    });
  }
  return specs;
}

/**
 * Sacred Altar schematic — recognizable geometry: three stepped tiers,
 * a monolith pillar, and a radiant orb. Each stroke is drawn
 * sequentially via stroke-dashoffset (pathLength normalized to 1).
 */
const ALTAR_STROKES: string[] = [
  'M25 178 H195',
  'M48 178 V156 H172 V178',
  'M68 156 V134 H152 V156',
  'M88 134 V112 H132 V134',
  'M98 112 V72 H122 V112',
  'M92 72 H128',
  'M110 48 m-10 0 a10 10 0 1 1 20 0 a10 10 0 1 1 -20 0',
  'M110 32 V24',
  'M122 36 L128 30',
  'M98 36 L92 30',
  'M128 58 H136',
  'M92 58 H84',
];

const ALTAR_STROKE_STAGGER_MS = 150;
const ALTAR_STROKE_DURATION_S = 0.75;

/**
 * Golden amphora silhouette — the condensed relic. Filled with a
 * vertical ivory→gold→bronze gradient, thin bright rim light.
 */
const ArtifactVisual: React.FC<{ delayMs: number; particles: ArtifactParticleSpec[]; materializeDuration: number }> = ({
  delayMs,
  particles,
  materializeDuration,
}) => (
  <div className="trailer-v2-artifact-wrap">
    {particles.map((p, i) => (
      <span
        key={`p-${i}`}
        className="trailer-v2-particle"
        style={{
          width: `${p.size}px`,
          height: `${p.size}px`,
          ['--px' as string]: `${p.x.toFixed(1)}px`,
          ['--py' as string]: `${p.y.toFixed(1)}px`,
          animationDelay: `${delayMs + p.delayMs}ms`,
        }}
      />
    ))}
    <svg
      className="trailer-v2-artifact"
      viewBox="0 0 120 150"
      style={{ animationDelay: `${delayMs + 450}ms`, animationDuration: `${materializeDuration}ms` }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="v2-amphora-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff4d6" />
          <stop offset="0.45" stopColor="#f0cf6a" />
          <stop offset="1" stopColor="#9a6b2f" />
        </linearGradient>
      </defs>
      <path
        d="M46 20 Q46 10 60 10 Q74 10 74 20 Q74 25 60 25 Q46 25 46 20 Z"
        fill="url(#v2-amphora-gold)"
      />
      <path
        d="M50 26 L45 36 C28 54 26 76 33 95 C40 116 50 128 60 128 C70 128 80 116 87 95 C94 76 92 54 75 36 L70 26 Z"
        fill="url(#v2-amphora-gold)"
        stroke="rgba(255,244,214,0.5)"
        strokeWidth="1.2"
      />
      <path
        d="M46 30 C32 42 28 58 33 70"
        fill="none"
        stroke="#e8c264"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M74 30 C88 42 92 58 87 70"
        fill="none"
        stroke="#e8c264"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M53 128 L49 142 L71 142 L67 128 Z" fill="url(#v2-amphora-gold)" />
    </svg>
  </div>
);

/**
 * Blueprint visual — the altar schematic drawn in gold over a faint
 * turquoise ghost that surfaces first (memory trace → preserved sign).
 */
const BlueprintVisual: React.FC<{ delayMs: number }> = ({ delayMs }) => (
  <svg className="trailer-v2-blueprint" viewBox="0 0 220 200" aria-hidden="true">
    <g className="trailer-v2-ghost" style={{ animationDelay: `${Math.max(0, delayMs - 350)}ms` }}>
      {ALTAR_STROKES.map((d, i) => (
        <path key={`g-${i}`} d={d} pathLength={1} />
      ))}
    </g>
    {ALTAR_STROKES.map((d, i) => (
      <path
        key={`s-${i}`}
        className="trailer-v2-stroke"
        d={d}
        pathLength={1}
        style={{
          animationDelay: `${delayMs + i * ALTAR_STROKE_STAGGER_MS}ms`,
          animationDuration: `${ALTAR_STROKE_DURATION_S}s`,
        }}
      />
    ))}
  </svg>
);

/**
 * Heroes visual — the two surviving portraits resolve from light
 * silhouettes inside a fading turquoise halo.
 */
const HeroesVisual: React.FC<{ delayMs: number; portraits: readonly string[]; materializeDuration: number }> = ({
  delayMs,
  portraits,
  materializeDuration,
}) => (
  <div
    className="trailer-v2-heroes"
    style={{ animationDelay: `${delayMs}ms`, animationDuration: `${materializeDuration}ms` }}
  >
    <span className="trailer-v2-heroes-halo" />
    {portraits.map((url) => (
      <MatericPortrait key={url} portraitUrl={url} size={78} isHero />
    ))}
  </div>
);

/**
 * Scene 6 V2 — Preservation Table choreography, config-driven via
 * `trailerConfig.legacyV2.beats`.
 */
export const TrailerLegacyV2: React.FC<TrailerSceneProps> = ({
  onComplete,
  autoStart = true,
  captureMode = false,
}) => {
  const scene = trailerConfig.legacyV2;
  const beats = scene.beats;
  const items = useMemo<LegacyV2ItemConfig[]>(
    () => scene.items as unknown as LegacyV2ItemConfig[],
    [scene.items],
  );
  const particles = useMemo(() => buildArtifactParticles(ARTIFACT_PARTICLE_COUNT), []);

  useEffect(() => {
    if (!autoStart || !onComplete) return undefined;
    const timer = window.setTimeout(onComplete, scene.duration);
    return () => window.clearTimeout(timer);
  }, [autoStart, onComplete, scene.duration]);

  const itemStart = (index: number) => beats.itemStartAt + index * beats.itemStagger;

  const renderVisual = (item: LegacyV2ItemConfig, startMs: number) => {
    switch (item.verb) {
      case 'condense':
        return (
          <ArtifactVisual
            delayMs={startMs}
            particles={particles}
            materializeDuration={beats.materializeDuration}
          />
        );
      case 'draw':
        return <BlueprintVisual delayMs={startMs} />;
      case 'reveal':
        return (
          <HeroesVisual
            delayMs={startMs}
            portraits={scene.heroPortraits}
            materializeDuration={beats.materializeDuration}
          />
        );
      default:
        return null;
    }
  };

  return (
    <TrailerSceneShell captureMode={captureMode} fireflyCount={3}>
      {/* Ruins veil: keeps the wounded teal-desaturated field from
          Settlement Lost, then lifts as memory surfaces. */}
      <div
        className="trailer-v2-veil"
        style={{
          animationDelay: `${beats.veilFadeStart}ms`,
          animationDuration: `${beats.veilFadeDuration}ms`,
        }}
      />

      {/* The table: an engraved golden line the three anchors rest on. */}
      <div
        className="trailer-v2-table"
        style={{
          animationDelay: `${beats.tableDrawAt}ms`,
          animationDuration: `${beats.tableDrawDuration}ms`,
        }}
      />

      {items.map((item, index) => {
        const startMs = itemStart(index);
        return (
          <div
            key={item.id}
            className="trailer-v2-item"
            style={{ left: `${item.anchorX}%` }}
          >
            <div
              className={`trailer-v2-visual trailer-v2-visual--${item.id}`}
            >
              {renderVisual(item, startMs)}
            </div>

            {/* Filament of shared preservation energy rising from the table. */}
            <span
              className="trailer-v2-link"
              style={{ animationDelay: `${beats.linkDrawAt + index * 180}ms` }}
            />

            {/* Fixation: golden sweep passes over the object. */}
            <span
              className="trailer-v2-fixsweep"
              style={{ animationDelay: `${startMs + beats.fixationDelay}ms` }}
            />

            {/* Sigil lock: the act of preservation, replacing the checkmark. */}
            <span
              className="trailer-v2-sigil"
              style={{ animationDelay: `${startMs + beats.sigilDelay}ms` }}
            >
              <span className="trailer-v2-sigil-dot" />
            </span>

            <div
              className="trailer-v2-label"
              style={{ animationDelay: `${startMs + beats.labelDelay}ms` }}
            >
              <span className="trailer-v2-label-text">{item.label}</span>
              <span className="trailer-v2-label-caption">{item.caption}</span>
            </div>
          </div>
        );
      })}

      {/* Title condenses last — conclusion of the transmutation. */}
      <div className="trailer-v2-titleblock">
        <h2
          className="trailer-banner trailer-v2-title"
          style={{ animationDelay: `${beats.titleAt}ms` }}
        >
          {scene.title}
        </h2>
        <div
          className="trailer-v2-titleline"
          style={{ animationDelay: `${beats.titleAt + 420}ms` }}
        />
        <p
          className="trailer-subtitle trailer-v2-subtitle"
          style={{ animationDelay: `${beats.subtitleAt}ms` }}
        >
          {scene.subtitle}
        </p>
      </div>
    </TrailerSceneShell>
  );
};

export default TrailerLegacyV2;
