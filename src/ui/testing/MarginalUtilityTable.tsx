import React from 'react';
import type { MarginalUtilityMetrics } from '../../balancing/testing/metrics';
import { Tooltip } from '../components/Tooltip';

interface MarginalUtilityTableProps {
  metrics: MarginalUtilityMetrics[];
}

export const MarginalUtilityTable: React.FC<MarginalUtilityTableProps> = ({ metrics }) => {
  const sorted = [...metrics].sort((a, b) => b.utilityScore - a.utilityScore);

  return (
    <div className="overflow-x-auto rounded-2xl border border-indigo-500/30 bg-slate-900/60 backdrop-blur-md shadow-[0_18px_45px_rgba(15,23,42,0.9)]">
      <table className="min-w-full text-xs text-slate-200">
        <thead className="bg-slate-900/80 border-b border-indigo-500/40">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-indigo-200">
              <Tooltip content="Stat base che viene potenziata nell'archetipo di test (es. Damage, TxC, Evasion). Ogni riga misura l'effetto di investire punti solo in questa stat, rispetto al baseline puro.">
                <span>Stat</span>
              </Tooltip>
            </th>
            <th className="px-2 py-2 text-right font-semibold text-indigo-200">
              <Tooltip content="Tier di punti di budget spesi in quella stat (es. +25, +50). Il generatore di archetipi converte questo budget in valore di stat usando pesi e curve attuali.">
                <span>Tier</span>
              </Tooltip>
            </th>
            <th className="px-2 py-2 text-right font-semibold text-cyan-200">
              <Tooltip content="Win rate assoluto dell'archetipo vs il baseline in Monte Carlo (0–100%). 50% significa pari col baseline; valori maggiori indicano build più forti a parità di setup.">
                <span>Win%</span>
              </Tooltip>
            </th>
            <th className="px-2 py-2 text-right font-semibold text-cyan-200">
              <Tooltip content="Delta di win rate rispetto al 50% (0 = pari al baseline). +10% significa che investire quel tier in questa stat aumenta le chance di vittoria di ~10 punti percentuali vs baseline.">
                <span>ΔWin%</span>
              </Tooltip>
            </th>
            <th className="px-2 py-2 text-right font-semibold text-cyan-200">
              <Tooltip content="Rapporto di Damage Per Turn medio vs baseline. 1.20× = l'archetipo infligge ~20% danni/turno in più del baseline nelle stesse condizioni di simulazione.">
                <span>DPT×</span>
              </Tooltip>
            </th>
            <th className="px-2 py-2 text-right font-semibold text-cyan-200">
              <Tooltip content="Numero medio di turni per conclusione del combattimento (Time To Kill effettivo nelle sim). Valori più bassi indicano fight più esplosive/veloci.">
                <span>Turns</span>
              </Tooltip>
            </th>
            <th className="px-2 py-2 text-right font-semibold text-cyan-200">
              <Tooltip content="Efficienza di scambio HP vs baseline: differenza tra (danni fatti / HP persi) dei due lati. Valori >0 indicano che l'archetipo di test di solito conclude i fight con più %HP residua.">
                <span>HP Trade</span>
              </Tooltip>
            </th>
            <th className="px-2 py-2 text-right font-semibold text-amber-200">
              <Tooltip content="Score composito (≈ 70% WinRate normalizzato + 30% HP Trade). Intorno a 1.0 è bilanciato; >1.1 suggerisce stat forte/OP per quel tier, <0.9 stat debole.">
                <span>Utility</span>
              </Tooltip>
            </th>
            <th className="px-4 py-2 text-center font-semibold text-slate-400">
              <Tooltip content="Confidenza statistica sulla stima del win rate (0–1). Dipende da varianza e numero di simulazioni: barre piene indicano risultati più stabili/affidabili.">
                <span>Conf.</span>
              </Tooltip>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => {
            // Provide safe defaults in case some fields are missing or undefined
            const winRate = m.winRate ?? 0;
            const deltaWinRate = m.deltaWinRate ?? 0;
            const dptRatioRaw = m.dptRatio ?? 1;
            const hpTrade = m.hpTradeEfficiency ?? 0;
            const avgTurns = m.avgTurns ?? 0;
            const utilityRaw = m.utilityScore ?? 0;
            const confidence = m.confidence ?? 0;

            const winPct = (winRate * 100).toFixed(1);
            const deltaWinPct = (deltaWinRate * 100).toFixed(1);
            const dptRatio = dptRatioRaw.toFixed(2);
            const tradePct = (hpTrade * 100).toFixed(1);
            const utility = utilityRaw.toFixed(2);

            const winClass = winRate > 0.55 ? 'text-emerald-300' : winRate < 0.45 ? 'text-rose-300' : 'text-slate-200';
            const deltaClass = deltaWinRate > 0.1 ? 'text-emerald-300' : deltaWinRate < -0.1 ? 'text-rose-300' : 'text-slate-400';
            const dptClass = dptRatioRaw > 1.05 ? 'text-emerald-300' : dptRatioRaw < 0.95 ? 'text-rose-300' : 'text-slate-200';
            const utilityClass = utilityRaw > 1.1 ? 'text-amber-300' : utilityRaw < 0.9 ? 'text-rose-300' : 'text-slate-200';

            return (
              <tr key={`${m.statId}-${m.pointsPerStat}`} className="border-t border-slate-800/80 hover:bg-slate-800/40">
                <td className="px-4 py-1.5 font-semibold text-indigo-200 uppercase tracking-[0.18em]">
                  {m.statId}
                </td>
                <td className="px-2 py-1.5 text-right text-slate-300">+{m.pointsPerStat}</td>
                <td className="px-2 py-1.5 text-right font-semibold">
                  <span className={winClass}>{winPct}%</span>
                </td>
                <td className="px-2 py-1.5 text-right font-semibold">
                  <span className={deltaClass}>{deltaWinPct}%</span>
                </td>
                <td className="px-2 py-1.5 text-right font-semibold">
                  <span className={dptClass}>{dptRatio}×</span>
                </td>
                <td className="px-2 py-1.5 text-right text-slate-300">{avgTurns.toFixed(2)}</td>
                <td className="px-2 py-1.5 text-right text-slate-300">{tradePct}%</td>
                <td className="px-2 py-1.5 text-right font-semibold">
                  <span className={utilityClass}>{utility}</span>
                </td>
                <td className="px-4 py-1.5">
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mx-auto">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400"
                      style={{ width: `${Math.max(0, Math.min(1, confidence)) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
