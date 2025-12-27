import { useBalancerConfig } from '@/balancing/hooks/useBalancerConfig';
import { useStressTesting } from '@/balancing/hooks/useStressTesting';
import MarginalUtilityTable from '@/ui/balancing/stressTesting/MarginalUtilityTable';
import SynergyHeatmap from '@/ui/balancing/stressTesting/SynergyHeatmap';

export default function StressTestDashboard() {
  const { config } = useBalancerConfig();
  const { marginalUtilities, synergies, isLoading, error } = useStressTesting(config);

  if (!config) {
    return (
      <div className="p-8 text-center text-ivory">
        <p>Loading balancer configuration...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-ivory">
        <p>Running stress tests...</p>
        <div className="mt-4 w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-ivory">
        <p className="text-rose-300">Error: {error}</p>
      </div>
    );
  }

  // Collect stat labels from config
  const statLabels: Record<string, string> = {};
  Object.values(config.stats).forEach(stat => {
    statLabels[stat.id] = stat.label;
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#020617_0,#020617_55%,#000000_100%)] text-ivory p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amber-200 mb-2">Stat Stress Testing Dashboard</h1>
          <p className="text-slate-400">
            Marginal utility analysis and synergy detection for balancer stats
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <MarginalUtilityTable results={marginalUtilities} />
          <SynergyHeatmap synergies={synergies} statLabels={statLabels} />
        </div>

        <div className="text-center text-xs text-slate-500">
          Analysis based on {marginalUtilities.length} archetypes with 1000 simulations each.
          OP synergies: &gt;1.15x expected, Weak synergies: &lt;0.95x expected.
        </div>
      </div>
    </div>
  );
}
