/**
 * TheaterLabPage — /theater-lab, dev-only eye-check + evidence capture for
 * PLAN-046 slice 1 (depth-parallax quest cinematics).
 *
 * State lives in React (no reloads); the URL params are honored on first
 * load so headless captures and deep links keep working:
 *   scene   art id (default `agguato-foresta`);
 *   shot    shot id or `idle` (default `enter-settle`);
 *   t       frozen shot time in ms (omit = live clock; `loop` repeats);
 *   amp     amplitude multiplier on the manifest ampMul (default 1);
 *   aspect  view aspect (default 2.4);
 *   dom=1   force the DOM path;
 *   dust=0  ambient dust off;
 *   bars    `ingresso` (letterbox scende con l'entrata) | `fisse` (in posa);
 *   shake   trauma strength 0..1 injected at t=0 — with `t=<ms>` captures a
 *           deterministic mid-wobble frame;
 *   width   theater width in px (default: fills the left column).
 *
 * Every variant mounts the same DepthScene the real Theater mounts — what
 * the Director reviews here is what runs on /game.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { DepthScene } from '@/ui/idleVillage/questS1Lab/render/DepthScene';
import { Letterbox } from '@/ui/idleVillage/skins/primitives';
import { documentClock, shotEpochFor } from '@/ui/idleVillage/questS1Lab/render/cameraEval';
import { SCENE_CINEMATICS, artIdFromSrc } from '@/ui/idleVillage/questS1Lab/render/sceneManifest';
import { LIBRARY_ART, NODE_ART } from '@/ui/idleVillage/questS1Lab/questArt';
import {
  DEFAULT_QUEST_THEATRE_FX,
  CameraShotIdSchema,
  type CameraShot,
} from '@/balancing/config/idleVillage/quests/questTheatreFx';

/** All art srcs keyed by their manifest art id (for the scene picker) —
 *  quest-node art plus unbound catalog assets (PLAN-052 candidates). */
const ART_BY_ID: Record<string, { src: string; fit: string }> = Object.fromEntries(
  [...Object.entries(NODE_ART), ...Object.entries(LIBRARY_ART)].map(([, v]) => [artIdFromSrc(v.src), v]),
);

/** Scenes that actually have a depth map — the only ones worth an eye-check. */
const DEPTH_SCENES = Object.keys(SCENE_CINEMATICS).filter((id) => ART_BY_ID[id]);

/* PLAN-050 §3 — l'unità è ingresso × posa: la personalità della
 *  transizione + la stance authored in cui la camera si adagia. */
const ENTRANCE_SHOTS: { id: string; label: string; hint: string }[] = [
  { id: 'enter-sweep', label: 'sweep', hint: 'arrivo laterale ampio → quadro composto (arrivare al limitare)' },
  { id: 'enter-creep', label: 'creep', hint: 'lento verso il dettaglio (cercare tracce)' },
  { id: 'enter-settle-cover', label: 'settle-cover', hint: 'atterra basso/laterale (spiare nascosti)' },
  { id: 'enter-direct', label: 'direct', hint: 'approccio frontale, più veloce (confronto)' },
  { id: 'enter-settle', label: 'enter-settle', hint: 'laterale + larga + sfocata → centrata e a fuoco' },
  { id: 'rack-land', label: 'rack-land', hint: 'quadro quasi fermo, solo la messa a fuoco che arriva' },
];
const POSE_SHOTS: { id: string; label: string; hint: string }[] = [
  { id: 'pose-watch', label: 'watch', hint: 'hold nascosto — basso/laterale, siamo in agguato' },
  { id: 'pose-rest', label: 'rest', hint: 'hold riposo — centrato, arioso, la scena respira' },
  { id: 'pose-tense', label: 'tense', hint: 'hold teso — più stretto, compresso, pericolo' },
];
const MOTION_SHOTS: { id: string; label: string; hint: string }[] = [
  { id: 'push-in', label: 'push-in', hint: 'zoom lento in avanti durante il beat' },
  { id: 'pan-lateral', label: 'pan-lateral', hint: 'viaggio laterale lento (truck)' },
  { id: 'verdict-zoom', label: 'verdict-zoom', hint: 'crash-in sul verdetto' },
  { id: 'hold', label: 'hold', hint: 'quadro fermo — solo il pillow shot' },
  { id: 'idle', label: 'idle', hint: 'drift ambient — nessun evento, la scena respira' },
];

/** Shake strengths for the trauma trigger (PLAN-050 §4). */
const SHAKE_LEVELS = [
  { v: 0.5, l: 'colpo' },
  { v: 0.75, l: 'impatto' },
  { v: 1, l: 'devastazione' },
] as const;

type BarsMode = 'off' | 'ingresso' | 'fisse';

const q0 = new URLSearchParams(window.location.search);

export const TheaterLabPage: React.FC = () => {
  const [sceneId, setSceneId] = useState(q0.get('scene') ?? 'agguato-foresta');
  const [shotId, setShotId] = useState(q0.get('shot') ?? 'enter-settle');
  const [dust, setDust] = useState(q0.get('dust') !== '0');
  /* Per-effect isolation: each manifest fx type toggles alone so every
   *  effect can be judged "visibile ad occhio" on its own (Director). */
  const [fxOn, setFxOn] = useState<Record<string, boolean>>({});
  const [clockMode, setClockMode] = useState<'live' | 'loop'>(
    q0.get('t') === 'loop' ? 'loop' : 'live',
  );
  /* Director 2026-10-18: "voglio 1/3 della velocità" — tempo multiplier on
   *  every shot so the pacing is tunable live, not guessed in config. */
  const [tempo, setTempo] = useState(3);
  /* Debug params — URL-driven only, hidden in the "avanzate" section. */
  const [amp, setAmp] = useState(Number(q0.get('amp') ?? 1));
  const [aspect, setAspect] = useState(Number(q0.get('aspect') ?? 2.4));
  const [domOnly, setDomOnly] = useState(q0.get('dom') === '1');
  /* PLAN-050 §5 — letterbox per-beat: 'ingresso' fa scendere le bande
   *  DURANTE l'entrata (complete a ~70%), 'fisse' le tiene in hold. */
  const [barsMode, setBarsMode] = useState<BarsMode>((q0.get('bars') as BarsMode | null) ?? 'off');
  const [barsActive, setBarsActive] = useState(false);
  /* PLAN-050 §4 — trauma shake: epoch nello stesso dominio del clock dello
   *  shot, così funziona anche in loop/frozen. `shake=<s>` injects at t=0
   *  for deterministic captures. */
  const [shakeStrength, setShakeStrength] = useState(1);
  const [shake, setShake] = useState<{ epoch: number; strength: number } | null>(() => {
    const s = Number(q0.get('shake') ?? 0);
    return s > 0 ? { epoch: 0, strength: Math.min(1, s) } : null;
  });
  const tParam = q0.get('t');
  const frozenT = tParam != null && tParam !== 'loop' ? Number(tParam) : null;

  const art = ART_BY_ID[sceneId];
  const entry = SCENE_CINEMATICS[sceneId];
  const cam = DEFAULT_QUEST_THEATRE_FX.camera;
  const baseShot: CameraShot =
    shotId === 'idle' || !CameraShotIdSchema.safeParse(shotId).success
      ? cam.idleDrift
      : cam.shots[CameraShotIdSchema.parse(shotId)];
  const shot: CameraShot = useMemo(
    () => ({ ...baseShot, durMs: Math.round(baseShot.durMs * tempo) }),
    [baseShot, tempo],
  );

  const cfg = useMemo(
    () => ({ ...DEFAULT_QUEST_THEATRE_FX.depth, enabled: !domOnly }),
    [domOnly],
  );

  /* Shot changes hot-swap via props + new epoch (no remount, no flash —
   *  same mechanism as QuestRunWindow). Only the scene remounts: new
   *  textures legitimately need a Pixi rebuild. */
  /* Re-anchor live shots on scene/shot/mode changes; these dependencies
   * intentionally define the camera epoch although the clock read is pure. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mountEpoch = useMemo(() => documentClock(), [sceneId, shotId, clockMode]);
  const shotEpoch = shotEpochFor(clockMode, frozenT, mountEpoch);
  /* DepthScene reads the clock through its live-ref (params never rebuild
   *  the app) — a plain per-render closure is safe and honest. */
  const clock = () =>
    frozenT != null
      ? frozenT
      : clockMode === 'loop' && shot.durMs > 0
        ? documentClock() % shot.durMs
        : documentClock();

  const src = art?.src;
  const depthSrc = entry?.depth ?? '/assets/depth/agguato-foresta.webp';
  const imgAspect = entry?.imgAspect ?? 2.357;
  const hasDepth = !!entry && art?.fit === 'cover';

  const sceneKey = sceneId;

  /* Bars re-close on every scene/shot/mode change so the showcase replays
   *  the entrance letterbox instead of leaving them stuck down. */
  const barsSig = `${barsMode}|${sceneId}|${shotId}|${clockMode}`;
  const [prevBarsSig, setPrevBarsSig] = useState(barsSig);
  if (barsSig !== prevBarsSig) {
    setPrevBarsSig(barsSig);
    setBarsActive(false);
  }
  useEffect(() => {
    if (barsMode === 'off') return undefined;
    const id = window.setTimeout(() => setBarsActive(true), 30);
    return () => window.clearTimeout(id);
  }, [barsSig, barsMode]);
  /* 'ingresso': la discesa dura ~70% dell'entrata — le bande atterrano
   *  prima del quadro e restano nella posa. */
  const barsInMs = barsMode === 'ingresso' ? Math.max(1, Math.round(shot.durMs * 0.7)) : DEFAULT_QUEST_THEATRE_FX.letterbox.inMs;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const btn = (active: boolean): React.CSSProperties => ({
    padding: '5px 10px',
    margin: '0 6px 6px 0',
    fontSize: 11,
    fontFamily: 'monospace',
    cursor: 'pointer',
    color: active ? '#0b0d10' : '#cfd3d8',
    background: active ? '#9fc2ff' : '#161a20',
    border: `1px solid ${active ? '#9fc2ff' : '#2a2e33'}`,
    borderRadius: 4,
  });
  const group = (label: string, hint: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: '#8a919b', marginBottom: 5, lineHeight: 1.5 }}>
        <b style={{ color: '#aeb6bf' }}>{label}</b>
        <br />
        <span style={{ color: '#6b7280' }}>{hint}</span>
      </div>
      <div>{children}</div>
    </div>
  );
  const shotButtons = (list: { id: string; label: string; hint: string }[]) =>
    list.map((s) => (
      <button
        key={s.id}
        title={s.hint}
        style={{ ...btn(s.id === shotId), display: 'block', width: '100%', textAlign: 'left' }}
        onClick={() => setShotId(s.id)}
      >
        {s.label}
        <span style={{ display: 'block', fontSize: 9, color: s.id === shotId ? '#0b0d10aa' : '#6b7280', marginTop: 2 }}>
          {s.hint}
        </span>
      </button>
    ));

  return (
    <div
      data-testid="theater-lab"
      style={{
        minHeight: '100vh',
        background: '#0b0d10',
        padding: 16,
        color: '#cfd3d8',
        fontFamily: 'monospace',
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
      }}
    >
      {/* La scena e' la protagonista — occupa tutto lo spazio a sinistra. */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          data-testid="theater-lab-frame"
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: String(aspect),
            overflow: 'hidden',
            borderRadius: 6,
            border: '1px solid #2a2e33',
            background: '#05070a',
          }}
        >
          {src && hasDepth ? (
            <DepthScene
              key={sceneKey}
              src={src}
              depthSrc={depthSrc}
              imgAspect={imgAspect}
              viewAspect={aspect}
              ampMul={amp * (entry?.ampMul ?? 1)}
              shot={shot}
              shotEpoch={shotEpoch}
              cfg={cfg}
              reducedMotion={reducedMotion}
              clock={clock}
              ambient={dust}
              ambientFx={entry?.ambient.filter((f) => fxOn[f.type] !== false)}
              atmosphere={q0.get('atmo') === '0' ? [] : entry?.atmosphere}
              traumaEpoch={shake?.epoch ?? null}
              traumaStrength={shake?.strength ?? 0}
            />
          ) : (
            src && (
              /* No manifest entry / non-cover art — the same DOM fallback the
               *  real Theater mounts (missing-depth path, OB-3). */
              <img
                src={src}
                alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%' }}
              />
            )
          )}
          <Letterbox
            active={barsActive}
            heightPct={DEFAULT_QUEST_THEATRE_FX.letterbox.heightPct}
            inMs={barsInMs}
            outMs={DEFAULT_QUEST_THEATRE_FX.letterbox.outMs}
            color="#000"
            reducedMotion={reducedMotion}
          />
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>
          {sceneId} · {shotId} · {frozenT != null ? `t=${frozenT}` : clockMode}
          {domOnly ? ' · DOM' : ''}
          {!hasDepth ? ' · [nessuna depth map → fallback DOM]' : ''}
          {entry?.entrance ? (
            <div style={{ color: '#4b5563' }}>authored: {entry.entrance} × {entry.pose ?? '—'}</div>
          ) : null}
        </div>
      </div>

      {/* Menu compatto a destra — solo quello che serve per l'eye-check. */}
      <div
        data-testid="theater-lab-controls"
        style={{
          width: 250,
          flexShrink: 0,
          background: '#10141a',
          border: '1px solid #22272e',
          borderRadius: 6,
          padding: 12,
        }}
      >
        {group(
          'scena',
          'solo le scene con depth map — le altre non hanno ancora il parallasse',
          DEPTH_SCENES.map((id) => (
            <button
              key={id}
              style={{ ...btn(id === sceneId), display: 'block', width: '100%', textAlign: 'left' }}
              onClick={() => {
                setSceneId(id);
                /* La scena propone la sua coppia authored — il picker resta libero. */
                const authored = SCENE_CINEMATICS[id]?.entrance;
                if (authored) setShotId(authored);
              }}
            >
              {id}
            </button>
          )),
        )}
        {group('entrata', 'la personalità della transizione — una per scena, mai ripetuta sullo stesso quadro', shotButtons(ENTRANCE_SHOTS))}
        {group('posa', 'la stance authored in cui la camera si adagia dopo l’ingresso (pillow shot)', shotButtons(POSE_SHOTS))}
        {group('movimento nel beat', 'cosa fa la camera mentre il testo scorre', shotButtons(MOTION_SHOTS))}
        {group(
          'bande',
          'letterbox: «ingresso» scende CON l’entrata e resta (confronto/rivelazione); «fisse» solo in posa',
          <>
            <button style={btn(barsMode === 'off')} onClick={() => setBarsMode('off')}>spente</button>
            <button style={btn(barsMode === 'ingresso')} onClick={() => setBarsMode('ingresso')}>con l'ingresso</button>
            <button style={btn(barsMode === 'fisse')} onClick={() => setBarsMode('fisse')}>fisse</button>
          </>,
        )}
        {group(
          'shake',
          'trauma additivo — il wobble pesa di più sul primo piano, con punch di zoom sull’impatto',
          <>
            {SHAKE_LEVELS.map((o) => (
              <button key={o.v} style={btn(shakeStrength === o.v)} onClick={() => setShakeStrength(o.v)}>
                {o.l}
              </button>
            ))}
            <button
              style={{ ...btn(false), display: 'block', width: '100%', marginTop: 4, borderColor: '#c66' }}
              onClick={() => setShake({ epoch: clock(), strength: shakeStrength })}
            >
              ⚡ shake!
            </button>
          </>,
        )}
        {group(
          'aria',
          'effetti ambientali della scena — attiva/disattiva UN tipo alla volta per giudicare se si vede davvero',
          <>
            <button style={btn(dust)} onClick={() => setDust(true)}>aria on</button>
            <button style={btn(!dust)} onClick={() => setDust(false)}>off</button>
            <div style={{ marginTop: 4 }}>
              {[...new Set((entry?.ambient ?? []).map((f) => f.type))].map((t) => (
                <button
                  key={t}
                  style={btn(fxOn[t] !== false)}
                  onClick={() => setFxOn((s) => ({ ...s, [t]: s[t] === false }))}
                >
                  {t}
                </button>
              ))}
            </div>
          </>,
        )}
        {group(
          'tempo',
          'moltiplicatore di durata — il cinema vive sotto il rallentato',
          [
            { v: 3, l: 'lento ×3' },
            { v: 1.5, l: '×1,5' },
            { v: 1, l: 'normale' },
            { v: 0.4, l: 'veloce' },
          ].map((o) => (
            <button key={o.v} style={btn(tempo === o.v)} onClick={() => setTempo(o.v)}>
              {o.l}
            </button>
          )),
        )}
        {group(
          'orologio',
          'live = lo shot parte ora; loop = ricomincia da capo per confrontarlo',
          <>
            <button style={btn(clockMode === 'live')} onClick={() => setClockMode('live')}>live</button>
            <button style={btn(clockMode === 'loop')} onClick={() => setClockMode('loop')}>loop</button>
          </>,
        )}
        <details style={{ fontSize: 10, color: '#6b7280', marginTop: 8 }}>
          <summary style={{ cursor: 'pointer' }}>avanzate (debug)</summary>
          <div style={{ marginTop: 8 }}>
            {group(
              'forza profondità',
              '×3 esaspera la deformazione per giudicare il tearing',
              ['1', '2', '3'].map((v) => (
                <button key={v} style={btn(amp === Number(v))} onClick={() => setAmp(Number(v))}>
                  ×{v}
                </button>
              )),
            )}
            {group(
              'render',
              'DOM = stessa camera senza parallasse (fallback)',
              <>
                <button style={btn(!domOnly)} onClick={() => setDomOnly(false)}>GPU</button>
                <button style={btn(domOnly)} onClick={() => setDomOnly(true)}>DOM</button>
              </>,
            )}
            {group(
              'aspect',
              '1.6 stressa il bound dei bordi',
              ['2.4', '1.6'].map((v) => (
                <button key={v} style={btn(aspect === Number(v))} onClick={() => setAspect(Number(v))}>
                  {v}
                </button>
              )),
            )}
          </div>
        </details>
      </div>
    </div>
  );
};

export default TheaterLabPage;
