/**
 * TestHub — Destiny Astrolabe V4.
 * Stessa griglia di controllo della V3 (default asimmetrici, fake-item §7),
 * componente V4: ghiera materica, obelischi-cristallo, climax tipografico.
 */
import React, { useMemo, useRef, useState } from 'react';
import DestinyAstrolabeV4, {
  type DestinyAstrolabeV4Handle,
} from '../ui/idleVillage/components/destinyAstrolabeV4/DestinyAstrolabeV4';
import type { AstrolabeV4Result } from '../ui/idleVillage/components/destinyAstrolabeV4/engineV4';
import type { AstrolabeModifier } from '../ui/idleVillage/components/destinyAstrolabeV3/modifiers';

const DEFAULT_STATS = [
  { name: 'Atletica', stat: 80 },
  { name: 'Astuzia', stat: 65 },
  { name: 'Vigore', stat: 50 },
  { name: 'Arcano', stat: 35 },
  { name: 'Fortuna', stat: 20 },
];

const FAKE_ITEMS: { label: string; modifier: AstrolabeModifier }[] = [
  {
    label: 'Elisir (+15 stat asse 0)',
    modifier: {
      id: 'fake-elixir',
      target: 'stat',
      axisIndex: 0,
      delta: 15,
      source: { kind: 'item', refId: 'elixir' },
    },
  },
  {
    label: 'Benda (−5 ferita)',
    modifier: {
      id: 'fake-bandage',
      target: 'wound',
      delta: -5,
      source: { kind: 'item', refId: 'bandage' },
    },
  },
  {
    label: 'Talismano (−3 morte)',
    modifier: {
      id: 'fake-talisman',
      target: 'death',
      delta: -3,
      source: { kind: 'blessing', refId: 'talisman' },
    },
  },
];

const MinimalDestinyAstrolabeV4 = () => {
  const astroRef = useRef<DestinyAstrolabeV4Handle>(null);
  const [skillCount, setSkillCount] = useState(3);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [difficulty, setDifficulty] = useState(50);
  const [critPct, setCritPct] = useState(5);
  const [critSuccessPct, setCritSuccessPct] = useState(5);
  const [nearMissPct, setNearMissPct] = useState(5);
  const [woundPct, setWoundPct] = useState(10);
  const [deathPct, setDeathPct] = useState(5);
  const [lastResult, setLastResult] = useState<AstrolabeV4Result | null>(null);
  const [applied, setApplied] = useState<string[]>([]);

  const skills = useMemo(
    () => stats.slice(0, skillCount).map((s) => ({ ...s, difficulty })),
    [stats, skillCount, difficulty],
  );

  const num = (v: number, set: (n: number) => void, min = 0, max = 99) => (
    <input
      type="number"
      value={v}
      min={min}
      max={max}
      onChange={(e) => set(Math.max(min, Math.min(max, e.target.valueAsNumber || 0)))}
      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
    />
  );

  return (
    <div
      className="bg-gray-900 text-gray-100"
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-amber-400">Destiny Astrolabe · V4</h1>
          <div className="flex gap-2">
            <a
              href="/minimal-destiny-astrolabe"
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              V1
            </a>
            <a
              href="/minimal-destiny-astrolabe-v2"
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              V2
            </a>
            <a
              href="/minimal-destiny-astrolabe-v3"
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              V3
            </a>
            <a
              href="/minimal-destiny-astrolabe-v5"
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              V5
            </a>
            <a
              href="/minimal-destiny-astrolabe-v6"
              className="px-3 py-1 rounded text-sm font-semibold bg-amber-600 text-black hover:bg-amber-500 transition-colors"
            >
              V6
            </a>
            <a
              href="/minimal-destiny-astrolabe-v7"
              className="px-3 py-1 rounded text-sm font-semibold bg-amber-600 text-black hover:bg-amber-500 transition-colors"
            >
              V7
            </a>
            <a
              href="/minimal-destiny-astrolabe-v8"
              className="px-3 py-1 rounded text-sm font-semibold bg-amber-600 text-black hover:bg-amber-500 transition-colors"
            >
              V8
            </a>
            <a
              href="/minimal-destiny-astrolabe-v9"
              className="px-3 py-1 rounded text-sm font-semibold bg-amber-600 text-black hover:bg-amber-500 transition-colors"
            >
              V9
            </a>
            <a
              href="/minimal-destiny-astrolabe-v10"
              className="px-3 py-1 rounded text-sm font-semibold bg-emerald-600 text-black hover:bg-emerald-500 transition-colors"
            >
              V10
            </a>
            <a
              href="/minimal-skillcheck-v6"
              className="px-3 py-1 rounded text-sm font-semibold bg-indigo-700 text-indigo-100 hover:bg-indigo-600 transition-colors"
              title="AltVisuals V6 · Asterism (Skill Check Preview Lab)"
            >
              Asterism V6
            </a>
          </div>
        </div>
        {lastResult && (
          <div className="text-sm text-gray-300">
            roll <span className="text-amber-300 font-bold">{lastResult.outcome.roll}</span> · zona{' '}
            <span className="text-amber-300 font-bold">{lastResult.zone}</span>
            {lastResult.outcome.critSuccess && <span className="text-yellow-300"> · trionfo</span>}
            {lastResult.outcome.almost && <span className="text-orange-400"> · almost</span>}
            {lastResult.outcome.critFail && <span className="text-gray-400"> · crit</span>}
            {lastResult.outcome.wounded && <span className="text-red-400"> · ferito</span>}
            {lastResult.outcome.dead && <span className="text-purple-400"> · caduto</span>}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <DestinyAstrolabeV4
          ref={astroRef}
          skills={skills}
          difficulty={difficulty}
          critPct={critPct}
          woundPct={woundPct}
          deathPct={deathPct}
          config={{ critSuccessPct, nearMissPct }}
          onResolve={setLastResult}
        />
      </div>

      <div className="p-4 flex-shrink-0 overflow-auto" style={{ maxHeight: '32vh' }}>
        <div className="bg-gray-800 p-4 rounded-lg border border-amber-600/30 grid gap-4 md:grid-cols-2">
          <div>
            <h2 className="text-sm font-bold text-amber-400 mb-2">⚙️ Configurazione</h2>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">N. Skill</label>
                {num(skillCount, setSkillCount, 1, 5)}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Difficoltà</label>
                {num(difficulty, setDifficulty, 1, 99)}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Crit %</label>
                {num(critPct, setCritPct, 0, 60)}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Ferita %</label>
                {num(woundPct, setWoundPct, 0, 60)}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Morte %</label>
                {num(deathPct, setDeathPct, 0, 60)}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Crit succ %</label>
                {num(critSuccessPct, setCritSuccessPct, 0, 25)}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Near miss %</label>
                {num(nearMissPct, setNearMissPct, 0, 25)}
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 mt-3">
              {stats.slice(0, skillCount).map((s, i) => (
                <div key={s.name}>
                  <label className="block text-xs font-semibold mb-1 text-gray-300">{s.name}</label>
                  {num(s.stat, (n) =>
                    setStats((prev) => prev.map((p, j) => (j === i ? { ...p, stat: n } : p))),
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-amber-400 mb-2">
              🧪 Modifiers (placeholder API §7)
            </h2>
            <p className="text-xs text-gray-400 mb-2">
              Hover = preview ghost tratteggiato · click = apply con morph 300ms.
            </p>
            <div className="flex flex-wrap gap-2">
              {FAKE_ITEMS.map(({ label, modifier }) => {
                const isApplied = applied.includes(modifier.id);
                return (
                  <button
                    key={modifier.id}
                    type="button"
                    className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
                      isApplied
                        ? 'bg-amber-600 text-black border-amber-400'
                        : 'bg-gray-700 text-gray-200 border-gray-500 hover:bg-gray-600'
                    }`}
                    onMouseEnter={() => !isApplied && astroRef.current?.previewModifier(modifier)}
                    onMouseLeave={() => astroRef.current?.clearPreview()}
                    onClick={() => {
                      if (isApplied) {
                        astroRef.current?.revokeModifier(modifier.id);
                        setApplied((prev) => prev.filter((id) => id !== modifier.id));
                      } else {
                        astroRef.current?.applyModifier(modifier);
                        setApplied((prev) => [...prev, modifier.id]);
                      }
                    }}
                  >
                    {label}
                  </button>
                );
              })}
              <button
                type="button"
                className="px-3 py-1.5 rounded text-xs font-semibold bg-gray-700 text-gray-200 border border-gray-500 hover:bg-gray-600"
                onClick={() => astroRef.current?.roll()}
              >
                ↺ Nuovo round
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalDestinyAstrolabeV4;
