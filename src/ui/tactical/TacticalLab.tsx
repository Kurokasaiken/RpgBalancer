import { useState } from 'react';
import { TacticalDebugPage } from './TacticalDebugPage';
import { TACTICAL_MISSIONS } from '../../balancing/config/tacticalConfig';

type TacticalSubTab = 'debug' | 'missions';

export function TacticalLab() {
  const [activeSubTab, setActiveSubTab] = useState<TacticalSubTab>('debug');
  const missions = Object.values(TACTICAL_MISSIONS);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-amber-100">Tactical Lab</h1>
          <p className="text-xs text-amber-200/70">XCOM-like tactical tools grouped in one place.</p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900/60 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('debug')}
            className={`px-3 py-1.5 rounded-l-lg ${
              activeSubTab === 'debug' ? 'bg-amber-500 text-slate-900' : 'text-slate-200'
            }`}
          >
            Debug
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('missions')}
            className={`px-3 py-1.5 rounded-r-lg border-l border-slate-700 ${
              activeSubTab === 'missions' ? 'bg-amber-500 text-slate-900' : 'text-slate-200'
            }`}
          >
            Missions
          </button>
        </div>
      </div>

      {activeSubTab === 'debug' && <TacticalDebugPage />}

      {activeSubTab === 'missions' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <h2 className="text-sm font-semibold text-amber-100 mb-3">Configured Tactical Missions</h2>
          <div className="overflow-x-auto text-xs text-slate-100">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-slate-800/80 text-amber-100">
                  <th className="px-2 py-1 text-left border-b border-slate-700">ID</th>
                  <th className="px-2 py-1 text-left border-b border-slate-700">Name</th>
                  <th className="px-2 py-1 text-left border-b border-slate-700">Type</th>
                  <th className="px-2 py-1 text-left border-b border-slate-700">Objectives</th>
                </tr>
              </thead>
              <tbody>
                {missions.map((m) => (
                  <tr key={m.id} className="odd:bg-slate-900 even:bg-slate-900/60">
                    <td className="px-2 py-1 align-top text-amber-200/80 font-mono text-[11px]">{m.id}</td>
                    <td className="px-2 py-1 align-top">{m.name}</td>
                    <td className="px-2 py-1 align-top text-slate-300 text-[11px]">{m.kind}</td>
                    <td className="px-2 py-1 align-top text-slate-200/90 text-[11px]">
                      {m.objectives
                        .filter((o) => o.isPrimary)
                        .map((o) => o.type)
                        .join(', ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
