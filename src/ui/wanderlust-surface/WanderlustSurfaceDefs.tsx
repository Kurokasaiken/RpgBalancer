import React from 'react';
import { MATERIAL_PRESETS, type MaterialTheme } from './materialPresets';

/**
 * Shared SVG `<defs>` for the Wanderlust surface system.
 *
 * Render this component **once** at the root of your app (e.g. inside `<App>`).
 * Every `<WanderlustSurface>` instance references these defs by id.
 *
 * The SVG is zero-sized and invisible — it only holds reusable definitions.
 * All gradients and filters are duplicated per material with a prefix.
 */

function cmValues(t: { r: number; g: number; b: number; a: number }) {
  return `0 0 0 0 ${t.r}  0 0 0 0 ${t.g}  0 0 0 0 ${t.b}  0 0 0 ${t.a} 0`;
}

function GradientStops({ stops }: { stops: { offset: string; color: string }[] }) {
  return (
    <>
      {stops.map((s, i) => (
        <stop key={i} offset={s.offset} stopColor={s.color} />
      ))}
    </>
  );
}

function MaterialDefs({ theme }: { theme: MaterialTheme }) {
  const p = theme.id;
  return (
    <>
      {/* ── Gradients ── */}
      <linearGradient id={`${p}-ws-gb`} x1="8%" y1="2%" x2="92%" y2="98%">
        <GradientStops stops={theme.body} />
      </linearGradient>

      <linearGradient id={`${p}-ws-gbv`} x1="0%" y1="0%" x2="100%" y2="100%">
        <GradientStops stops={theme.bevel} />
      </linearGradient>

      <linearGradient id={`${p}-ws-gri`} x1="10%" y1="5%" x2="90%" y2="95%">
        <GradientStops stops={theme.ring} />
      </linearGradient>

      <radialGradient id={`${p}-ws-gf`} cx="38%" cy="30%" r="72%">
        <GradientStops stops={theme.field} />
      </radialGradient>

      <radialGradient id={`${p}-ws-gsp`} cx="22%" cy="16%" r="50%">
        <GradientStops stops={theme.specular} />
      </radialGradient>

      <radialGradient id={`${p}-ws-gdm`} cx="38%" cy="28%" r="65%">
        <GradientStops stops={theme.diamond} />
      </radialGradient>

      <linearGradient id={`${p}-ws-bevel-t`} x1="0" y1="0" x2="0" y2="1">
        <GradientStops stops={theme.bevelEdge.top} />
      </linearGradient>
      <linearGradient id={`${p}-ws-bevel-l`} x1="0" y1="0" x2="1" y2="0">
        <GradientStops stops={theme.bevelEdge.left} />
      </linearGradient>
      <linearGradient id={`${p}-ws-bevel-b`} x1="0" y1="1" x2="0" y2="0">
        <GradientStops stops={theme.bevelEdge.bottom} />
      </linearGradient>
      <linearGradient id={`${p}-ws-bevel-r`} x1="1" y1="0" x2="0" y2="0">
        <GradientStops stops={theme.bevelEdge.right} />
      </linearGradient>

      <linearGradient id={`${p}-ws-rim-top`} x1="0%" y1="0%" x2="0%" y2="100%">
        <GradientStops stops={theme.rim.top} />
      </linearGradient>
      <linearGradient id={`${p}-ws-rim-left`} x1="0%" y1="0%" x2="100%" y2="0%">
        <GradientStops stops={theme.rim.left} />
      </linearGradient>

      <radialGradient id={`${p}-ws-g-ambient`} cx="55%" cy="60%" r="70%">
        <GradientStops stops={theme.ambient} />
      </radialGradient>

      {/* ── Filters ── */}
      <filter id={`${p}-ws-f-nm`} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves={5} seed="3" stitchTiles="stitch" result="n" />
        <feColorMatrix in="n" type="matrix" values={cmValues(theme.noise)} result="c" />
        <feBlend in="SourceGraphic" in2="c" mode="overlay" />
      </filter>

      <filter id={`${p}-ws-f-nm2`} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves={3} seed="55" stitchTiles="stitch" result="n" />
        <feColorMatrix in="n" type="matrix" values={cmValues(theme.noise2)} result="c" />
        <feBlend in="SourceGraphic" in2="c" mode="overlay" />
      </filter>

      <filter id={`${p}-ws-f-worn`} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.28" numOctaves={3} seed="77" stitchTiles="stitch" result="n" />
        <feColorMatrix in="n" type="matrix" values={cmValues(theme.worn)} result="c" />
        <feBlend in="SourceGraphic" in2="c" mode="screen" />
      </filter>

      <filter id={`${p}-ws-f-spec`} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={4} seed="3" stitchTiles="stitch" result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .6 0" result="mask" />
        <feComposite in="SourceGraphic" in2="mask" operator="in" />
      </filter>

      <filter id={`${p}-ws-f-grime`} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={4} seed="88" stitchTiles="stitch" result="n" />
        <feColorMatrix in="n" type="matrix" values={cmValues(theme.grime)} result="dark" />
        <feBlend in="SourceGraphic" in2="dark" mode="multiply" />
      </filter>

      <filter id={`${p}-ws-f-fs`} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={5} seed="11" stitchTiles="stitch" result="n" />
        <feColorMatrix in="n" type="matrix" values={cmValues(theme.fieldNoise)} result="c" />
        <feBlend in="SourceGraphic" in2="c" mode="overlay" />
      </filter>

      <filter id={`${p}-ws-f-gl`} x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="2.2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <filter id={`${p}-ws-f-warp`} x="-25%" y="-25%" width="150%" height="150%">
        <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves={4} seed="42" result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale="11" xChannelSelector="R" yChannelSelector="G" />
      </filter>

      <filter id={`${p}-ws-f-erode`} x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="turbulence" baseFrequency="0.035 0.02" numOctaves={4} seed="19" result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale="2.8" xChannelSelector="R" yChannelSelector="G" />
      </filter>

      <filter id={`${p}-ws-f-inset`} x="-5%" y="-5%" width="110%" height="110%">
        <feFlood floodColor={theme.insetFill} floodOpacity=".55" result="d" />
        <feComposite in="d" in2="SourceAlpha" operator="out" result="si" />
        <feOffset in="si" dx="3" dy="4" result="o1" />
        <feGaussianBlur in="o1" stdDeviation="5" result="b1" />
        <feComposite in="b1" in2="SourceAlpha" operator="in" result="i1" />
        <feFlood floodColor={theme.insetFill} floodOpacity=".30" result="d2" />
        <feComposite in="d2" in2="SourceAlpha" operator="out" result="si2" />
        <feOffset in="si2" dx="-1.5" dy="-2" result="o2" />
        <feGaussianBlur in="o2" stdDeviation="3" result="b2" />
        <feComposite in="b2" in2="SourceAlpha" operator="in" result="i2" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="i1" />
          <feMergeNode in="i2" />
        </feMerge>
      </filter>

      <filter id={`${p}-ws-f-ao`} x="-5%" y="-5%" width="110%" height="110%">
        <feFlood floodColor={theme.fieldFill} floodOpacity=".42" result="d" />
        <feComposite in="d" in2="SourceAlpha" operator="out" result="si" />
        <feOffset in="si" dx="0" dy="0" />
        <feGaussianBlur stdDeviation="6" result="b" />
        <feComposite in="b" in2="SourceAlpha" operator="in" result="ao" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="ao" />
        </feMerge>
      </filter>
    </>
  );
}

export const WanderlustSurfaceDefs: React.FC = () => (
  <svg
    width="0"
    height="0"
    style={{ position: 'absolute', overflow: 'hidden' }}
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      {Object.values(MATERIAL_PRESETS).map((theme) => (
        <MaterialDefs key={theme.id} theme={theme} />
      ))}
    </defs>
  </svg>
);

export default WanderlustSurfaceDefs;
