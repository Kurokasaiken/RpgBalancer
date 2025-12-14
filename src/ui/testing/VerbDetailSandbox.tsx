import { useMemo, useState } from 'react';
import type { ActivityDefinition, ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import VerbDetailCard, { type VerbDetailPreview, type VerbDetailAssignment } from '@/ui/idleVillage/VerbDetailCard';

const mockRewards: ResourceDeltaDefinition[] = [
  { resourceId: 'gold', amountFormula: '+8' },
  { resourceId: 'xp', amountFormula: '+5' },
];

const mockActivity: ActivityDefinition = {
  id: 'quest_city_rats',
  label: 'Cull Rats in Sewers',
  description: 'Short expedition beneath the city to clear nests and recover bounties.',
  tags: ['quest', 'combat', 'city'],
  slotTags: ['city'],
  resolutionEngineId: 'quest_combat',
  level: 1,
  dangerRating: 2,
  metadata: {
    questSpawnEnabled: true,
    injuryChanceDisplay: 35,
    deathChanceDisplay: 5,
  },
};

const mockResidents: ResidentState[] = [
  { id: 'Founder', status: 'available', fatigue: 10 },
  { id: 'Scout-A', status: 'available', fatigue: 25 },
  { id: 'Worker-B', status: 'injured', fatigue: 70 },
];

export default function VerbDetailSandbox() {
  const [selectedIds, setSelectedIds] = useState<string[]>(['Founder']);

  const preview: VerbDetailPreview = useMemo(() => {
    const headCount = selectedIds.length || 1;
    return {
      rewards: mockRewards,
      injuryPercentage: 30 + headCount * 3,
      deathPercentage: 5 + Math.max(0, headCount - 1),
      note: 'Mock preview until SkillCheckEngine is wired',
    };
  }, [selectedIds]);

  const assignments: VerbDetailAssignment[] = mockResidents.map((resident) => ({
    resident,
    isSelected: selectedIds.includes(resident.id),
    onToggle: (residentId: string) => {
      setSelectedIds((prev) =>
        prev.includes(residentId)
          ? prev.filter((id) => id !== residentId)
          : [...prev, residentId],
      );
    },
  }));

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#030712_0,#010308_60%,#000000_100%)] text-ivory flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-4">
        <p className="text-center text-[12px] uppercase tracking-[0.3em] text-slate-400">
          Verb Detail Sandbox · Mock data only
        </p>
        <VerbDetailCard
          title={mockActivity.label}
          subtitle="Quest Offer"
          activity={mockActivity}
          description={mockActivity.description}
          slotLabel="Village Square"
          preview={preview}
          assignments={assignments}
          mockWarning="Risk/reward preview uses placeholder math. Replace with SkillCheckEngine once ready."
          onStart={() => alert(`Would schedule quest with: ${selectedIds.join(', ') || 'nobody'}`)}
          onClose={() => setSelectedIds(['Founder'])}
          startDisabled={selectedIds.length === 0}
        />
      </div>
    </div>
  );
}
