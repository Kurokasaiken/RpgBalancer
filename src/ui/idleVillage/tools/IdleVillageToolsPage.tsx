import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { useVillageShellContext } from '@/ui/idleVillage/hooks/useVillageShellContext';
import TerrainModifierTool from '@/ui/idleVillage/tools/TerrainModifierTool';
import ResidentRelationshipGraphTool from '@/ui/idleVillage/tools/ResidentRelationshipGraph';

const sectionDescription =
  'Designer-facing utilities for terrain presets, relationship scouting, and crew diagnostics.';

export default function IdleVillageToolsPage() {
  const { config } = useVillageShellContext();

  return (
    <DragProvider>
      <div className="observatory-page space-y-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="observatory-kicker">Idle Village – Tools</p>
            <h1 className="text-2xl font-semibold text-ivory tracking-tight">Operations Toolkit</h1>
            <p className="text-sm text-slate-300">{sectionDescription}</p>
          </div>
        </header>

        <div className="space-y-8">
          <TerrainModifierTool config={config} />
          <ResidentRelationshipGraphTool title="Resident Relationship Graph" />
        </div>
      </div>
    </DragProvider>
  );
}
