import React, { useEffect, useMemo, useState } from 'react';

interface StatRow {
  name: string;
  questValue: number;
  heroValue: number;
}

type OutcomeZone = 'safe' | 'injury' | 'death';
type OutcomeResult = 'success' | 'fail';

interface LastOutcome {
  zone: OutcomeZone;
  result: OutcomeResult;
}

interface Point {
  x: number;
  y: number;
}

interface Radii {
  safeRadius: number;
  injuryInnerRadius: number;
  injuryOuterRadius: number;
  deathInnerRadius: number;
  deathOuterRadius: number;
}

const MAX_STATS = 6;
const MIN_STATS = 1;

const CANVAS_SIZE = 360;
const CENTER_X = CANVAS_SIZE / 2;
const CENTER_Y = CANVAS_SIZE / 2;
const RADIUS = 120;

function buildPolygonPoints(stats: StatRow[], key: keyof StatRow): Point[] {
  const n = stats.length || 1;
  const angleStep = (2 * Math.PI) / n;
  return stats.map((stat, index) => {
    const raw = Number(stat[key]);
    const clamped = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
    const radius = (clamped / 100) * RADIUS;
    const angle = -Math.PI / 2 + index * angleStep;
    const x = CENTER_X + radius * Math.cos(angle);
    const y = CENTER_Y + radius * Math.sin(angle);
    return { x, y };
  });
}

function polygonToPointsAttr(points: Point[]): string {
  if (points.length === 0) return '';
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 0.000001) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

function clampPercentage(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export const SkillCheckPreviewPage: React.FC = () => {
  const [stats, setStats] = useState<StatRow[]>([
    { name: 'Combat', questValue: 70, heroValue: 60 },
    { name: 'Vigor', questValue: 60, heroValue: 55 },
    { name: 'Mobility', questValue: 50, heroValue: 65 },
  ]);
  const [injuryPct, setInjuryPct] = useState(10);
  const [deathPct, setDeathPct] = useState(5);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [lastOutcome, setLastOutcome] = useState<LastOutcome | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [radii, setRadii] = useState<Radii>({
    safeRadius: 0,
    injuryInnerRadius: 0,
    injuryOuterRadius: 0,
    deathInnerRadius: 0,
    deathOuterRadius: 0,
  });

  const statCount = stats.length;

  const safePct = useMemo(() => {
    const total = clampPercentage(injuryPct) + clampPercentage(deathPct);
    return clampPercentage(100 - total);
  }, [injuryPct, deathPct]);

  const questPolygon = useMemo(() => buildPolygonPoints(stats, 'questValue'), [stats]);
  const heroPolygon = useMemo(() => buildPolygonPoints(stats, 'heroValue'), [stats]);

  const questPolygonAttr = useMemo(() => polygonToPointsAttr(questPolygon), [questPolygon]);
  const heroPolygonAttr = useMemo(() => polygonToPointsAttr(heroPolygon), [heroPolygon]);

  useEffect(() => {
    if (questPolygon.length < 3) {
      setRadii({
        safeRadius: 0,
        injuryInnerRadius: 0,
        injuryOuterRadius: 0,
        deathInnerRadius: 0,
        deathOuterRadius: 0,
      });
      return;
    }

    // Normalizza le percentuali in pesi che sommano a 1
    const safeBase = clampPercentage(safePct, 0, 100);
    const injuryBase = clampPercentage(injuryPct, 0, 100);
    const deathBase = clampPercentage(deathPct, 0, 100);
    let total = safeBase + injuryBase + deathBase;
    if (total <= 0) total = 1;
    const safeFraction = safeBase / total;
    const injuryFraction = injuryBase / total;

    // Stima Monte Carlo della distribuzione delle distanze dal centro dentro Q
    const sampleDistances: number[] = [];
    const sampleCount = 800;
    let attempts = 0;
    const maxAttempts = sampleCount * 10;

    while (sampleDistances.length < sampleCount && attempts < maxAttempts) {
      attempts += 1;
      const u = Math.random();
      const r = Math.sqrt(u) * RADIUS;
      const angle = Math.random() * Math.PI * 2;
      const x = CENTER_X + r * Math.cos(angle);
      const y = CENTER_Y + r * Math.sin(angle);
      const p = { x, y };
      if (pointInPolygon(p, questPolygon)) {
        const dx = x - CENTER_X;
        const dy = y - CENTER_Y;
        sampleDistances.push(Math.sqrt(dx * dx + dy * dy));
      }
    }

    if (sampleDistances.length === 0) {
      setRadii({
        safeRadius: 0,
        injuryInnerRadius: 0,
        injuryOuterRadius: 0,
        deathInnerRadius: 0,
        deathOuterRadius: 0,
      });
      return;
    }

    sampleDistances.sort((a, b) => a - b);
    const n = sampleDistances.length;

    const safeIndex = Math.max(0, Math.min(n - 1, Math.floor(n * safeFraction) - 1));
    const injuryIndex = Math.max(
      safeIndex,
      Math.min(n - 1, Math.floor(n * (safeFraction + injuryFraction)) - 1),
    );
    const maxIndex = n - 1;

    const safeRadius = sampleDistances[safeIndex];
    const injuryOuterRadius = sampleDistances[injuryIndex];
    const deathOuterRadius = sampleDistances[maxIndex];

    setRadii({
      safeRadius,
      injuryInnerRadius: safeRadius,
      injuryOuterRadius,
      deathInnerRadius: injuryOuterRadius,
      deathOuterRadius,
    });
  }, [questPolygon, safePct, injuryPct, deathPct]);

  const handleStatCountChange = (value: number) => {
    const target = Math.max(MIN_STATS, Math.min(MAX_STATS, Math.round(value)));
    setStats((prev) => {
      if (prev.length === target) return prev;
      if (prev.length < target) {
        const extra: StatRow[] = [];
        for (let i = prev.length; i < target; i += 1) {
          extra.push({ name: `Stat ${i + 1}`, questValue: 60, heroValue: 60 });
        }
        return [...prev, ...extra];
      }
      return prev.slice(0, target);
    });
  };

  const handleStatChange = (index: number, field: keyof StatRow, raw: string) => {
    setStats((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) return prev;
      if (field === 'name') {
        next[index] = { ...current, name: raw };
        return next;
      }
      const parsed = raw === '' ? 0 : Number(raw);
      const clamped = clampPercentage(parsed);
      next[index] = { ...current, [field]: clamped } as StatRow;
      return next;
    });
  };

  const handleThrow = () => {
    if (questPolygon.length < 3) return;

    const maxAttempts = 200;
    let chosen: Point | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const u = Math.random();
      const r = Math.sqrt(u) * RADIUS;
      const angle = Math.random() * Math.PI * 2;
      const x = CENTER_X + r * Math.cos(angle);
      const y = CENTER_Y + r * Math.sin(angle);
      const candidate = { x, y };
      if (pointInPolygon(candidate, questPolygon)) {
        chosen = candidate;
        break;
      }
    }

    if (!chosen) {
      chosen = { x: CENTER_X, y: CENTER_Y };
    }

    const dx = chosen.x - CENTER_X;
    const dy = chosen.y - CENTER_Y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let zone: OutcomeZone = 'safe';
    if (distance > radii.deathInnerRadius) {
      zone = 'death';
    } else if (distance > radii.injuryInnerRadius) {
      zone = 'injury';
    }

    const success = pointInPolygon(chosen, heroPolygon);
    const result: OutcomeResult = success ? 'success' : 'fail';

    const label = `Roll: ${result.toUpperCase()} + ${zone.toUpperCase()}`;

    setLastPoint(chosen);
    setLastOutcome({ zone, result });
    setLog((prev) => [label, ...prev].slice(0, 12));
  };

  const outcomeLabel = useMemo(() => {
    if (!lastOutcome) return 'Nessun tiro effettuato.';
    const { result, zone } = lastOutcome;
    const resultLabel = result === 'success' ? 'SUCCESSO' : 'FALLIMENTO';
    let zoneLabel = '';
    if (zone === 'safe') zoneLabel = 'SAFE';
    if (zone === 'injury') zoneLabel = 'INJURY';
    if (zone === 'death') zoneLabel = 'DEATH';
    return `${resultLabel} + ${zoneLabel}`;
  }, [lastOutcome]);

  return (
    <div className="p-3 md:p-4 text-ivory">
      <h1 className="text-lg md:text-xl font-cinzel tracking-[0.2em] uppercase mb-2">Skill Check Preview Lab</h1>
      <p className="text-[11px] text-slate-300 mb-3 max-w-2xl">
        Giocattolo per visualizzare lo skill check stile Dispatch. Configura numero di stat, profilo quest/PG,
        percentuali di injury/death e lancia una pallina che rimbalza dentro l&apos;area della quest.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="default-card p-3 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Numero Stat</span>
              <span className="text-[11px] text-slate-400">{statCount}</span>
            </div>
            <input
              type="range"
              min={MIN_STATS}
              max={MAX_STATS}
              value={statCount}
              onChange={(e) => handleStatCountChange(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {stats.map((stat, index) => (
              <div key={index} className="grid grid-cols-5 gap-1 items-center text-[11px]">
                <input
                  type="text"
                  value={stat.name}
                  onChange={(e) => handleStatChange(index, 'name', e.target.value)}
                  className="col-span-2 px-1.5 py-0.5 bg-obsidian border border-slate rounded text-ivory"
                  placeholder={`Stat ${index + 1}`}
                />
                <div className="col-span-1 flex flex-col">
                  <span className="text-[9px] text-slate-400">Quest</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={stat.questValue}
                    onChange={(e) => handleStatChange(index, 'questValue', e.target.value)}
                    className="px-1.5 py-0.5 bg-obsidian border border-slate rounded text-ivory text-[11px]"
                  />
                </div>
                <div className="col-span-1 flex flex-col">
                  <span className="text-[9px] text-slate-400">PG</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={stat.heroValue}
                    onChange={(e) => handleStatChange(index, 'heroValue', e.target.value)}
                    className="px-1.5 py-0.5 bg-obsidian border border-slate rounded text-ivory text-[11px]"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] mt-2">
            <div>
              <label className="block font-semibold mb-0.5">Injury %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={injuryPct}
                onChange={(e) => setInjuryPct(clampPercentage(Number(e.target.value) || 0))}
                className="w-full px-2 py-0.5 bg-obsidian border border-slate rounded text-ivory text-[11px]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-0.5">Death %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={deathPct}
                onChange={(e) => setDeathPct(clampPercentage(Number(e.target.value) || 0))}
                className="w-full px-2 py-0.5 bg-obsidian border border-slate rounded text-ivory text-[11px]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-0.5">Safe %</label>
              <div className="px-2 py-1 bg-slate-900 border border-slate rounded text-emerald-300 text-[11px]">
                {safePct}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleThrow}
              className="px-3 py-1 rounded-full border border-emerald-400/70 bg-emerald-500/10 text-[11px] uppercase tracking-[0.16em] text-emerald-200 hover:bg-emerald-500/20"
            >
              Lancia pallina
            </button>
          </div>
        </div>

        <div className="default-card p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Visuale Skill Check</span>
            <span className="text-[10px] text-slate-400">
              Safe {safePct}% · Injury {clampPercentage(injuryPct)}% · Death {clampPercentage(deathPct)}%
            </span>
          </div>

          <div className="flex justify-center items-center">
            <svg width={CANVAS_SIZE} height={CANVAS_SIZE} className="bg-slate-950/80 rounded-xl border border-slate-800">
              <defs>
                <clipPath id="quest-clip">
                  <polygon points={questPolygonAttr} />
                </clipPath>
              </defs>

              {/* Axes */}
              {questPolygon.map((p, idx) => (
                <line
                  key={idx}
                  x1={CENTER_X}
                  y1={CENTER_Y}
                  x2={p.x}
                  y2={p.y}
                  stroke="rgba(148,163,184,0.3)"
                  strokeWidth={0.5}
                />
              ))}

              {/* Rings clipped to Q */}
              <g clipPath="url(#quest-clip)">
                {/* Injury ring */}
                <circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={(radii.injuryInnerRadius + radii.injuryOuterRadius) / 2}
                  stroke="rgba(250,204,21,0.7)"
                  strokeWidth={Math.max(1, radii.injuryOuterRadius - radii.injuryInnerRadius)}
                  fill="none"
                />
                {/* Death ring */}
                <circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={(radii.deathInnerRadius + radii.deathOuterRadius) / 2}
                  stroke="rgba(248,113,113,0.85)"
                  strokeWidth={Math.max(1, radii.deathOuterRadius - radii.deathInnerRadius)}
                  fill="none"
                />
              </g>

              {/* Quest polygon */}
              <polygon points={questPolygonAttr} fill="rgba(56,189,248,0.12)" stroke="rgba(56,189,248,0.9)" strokeWidth={1} />

              {/* Hero polygon */}
              <polygon points={heroPolygonAttr} fill="rgba(52,211,153,0.16)" stroke="rgba(52,211,153,0.9)" strokeWidth={1} />

              {/* Stat labels near quest outer points */}
              {questPolygon.map((p, idx) => {
                const stat = stats[idx];
                if (!stat) return null;
                const labelX = CENTER_X + (p.x - CENTER_X) * 1.12;
                const labelY = CENTER_Y + (p.y - CENTER_Y) * 1.12;
                return (
                  <text key={idx} x={labelX} y={labelY} className="text-[9px]" fill="#cbd5f5" textAnchor="middle" dominantBaseline="middle">
                    {stat.name}
                  </text>
                );
              })}

              {/* Last roll point */}
              {lastPoint && (
                <circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill="#f97316" stroke="#fde68a" strokeWidth={1} />
              )}
            </svg>
          </div>

          <div className="text-[11px] text-slate-200">
            <div className="font-semibold mb-0.5">Ultimo tiro</div>
            <div className="text-slate-100">{outcomeLabel}</div>
          </div>

          {log.length > 0 && (
            <div className="text-[10px] text-slate-400 max-h-24 overflow-y-auto pr-1">
              {log.map((entry, idx) => (
                <div key={idx}>{entry}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillCheckPreviewPage;
