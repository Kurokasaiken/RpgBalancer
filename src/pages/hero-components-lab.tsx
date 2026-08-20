import { useCallback, useMemo } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useTranslation } from '@/localization/useTranslation';
import PgDetailCard from '@/ui/idleVillage/components/PgDetailCard';
import { EquipSlotRack } from '@/ui/idleVillage/components/EquipSlotRack';
import { ItemDragToken } from '@/ui/idleVillage/components/ItemDragToken';
import { EquippableItemCard } from '@/ui/idleVillage/components/EquippableItemCard';
import { ConsumablePile } from '@/ui/idleVillage/components/ConsumablePile';
import { SkillDeck } from '@/ui/idleVillage/components/SkillDeck';
import { useResidentHeroState } from '@/ui/idleVillage/hooks/useResidentHeroState';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import {
  equippableItems,
  skills,
} from '@/balancing/config/idleVillage/heroItems';
import {
  MatericHeading,
  MatericSectionHeader,
} from '@/ui/designSystem/primitives';

/**
 * HeroComponentsLabPage — vetrina collegata per i sub-plan A–E.
 *
 * A: `PgDetailCard` alimentato da `ResidentState` reale.
 * B: `EquipSlotRack` drag-and-drop con `useResidentHeroState`.
 * C: `EquippableItemCard` con dati dal config JSON.
 * D: `ConsumablePile` con consumo reale e persistenza.
 * E: `SkillDeck` con `useResidentHeroState` (senza toccare il skill check).
 */
export default function HeroComponentsLabPage(): JSX.Element {
  const { t } = useTranslation('idleVillage');

  const baseResident = useMemo<ResidentState>(
    () => ({
      id: 'hero-lab-1',
      displayName: 'Aurora',
      status: 'available',
      fatigue: 30,
      currentHp: 85,
      maxHp: 100,
      isHero: true,
      isInjured: false,
      survivalCount: 0,
      survivalScore: 0,
      statProfileId: 'archetype-1',
      statSnapshot: {
        strength: 12,
        agility: 10,
        equipment: {
          weapon: 'iron-sword',
          armor: 'leather-vest',
        },
        inventory: [],
      },
    }),
    [],
  );

  const {
    resident,
    equipment,
    inventory,
    skillLoadout,
    equip,
    unequip,
    useConsumable,
    toggleSkill,
  } = useResidentHeroState({ resident: baseResident, maxSkills: 3 });

  const slotOrder = useMemo(
    () => [
      { id: 'weapon', label: t('pgDetailCard.equipment.weapon') },
      { id: 'offhand', label: t('pgDetailCard.equipment.offhand') },
      { id: 'armor', label: t('pgDetailCard.equipment.armor') },
      { id: 'trinket', label: t('pgDetailCard.equipment.trinket') },
      { id: 'ring', label: t('pgDetailCard.equipment.ring') },
      { id: 'mount', label: t('pgDetailCard.equipment.mount') },
    ],
    [t],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !active.data.current?.itemId) return;
      const slotId = over.data.current?.slotId as string | undefined;
      if (!slotId) return;
      const itemId = active.data.current.itemId as string;
      equip(slotId, itemId);
    },
    [equip],
  );

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: 'var(--panel-surface, #08121f)' }}
    >
      <div className="mx-auto max-w-7xl">
        <MatericHeading
          as="h1"
          title={t('heroComponentsLab.title')}
          subtitle={t('heroComponentsLab.subtitle')}
          style={{ marginBottom: 24 }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 16,
            alignItems: 'start',
          }}
        >
          <div>
            <MatericSectionHeader tier="tertiary" hint="A">{t('heroComponentsLab.sectionA')}</MatericSectionHeader>
            <PgDetailCard resident={resident} />
          </div>

          <div>
            <MatericSectionHeader tier="tertiary" hint="B">{t('heroComponentsLab.sectionB')}</MatericSectionHeader>
            <DndContext onDragEnd={handleDragEnd}>
              <EquipSlotRack slots={slotOrder} equipment={equipment} onUnequip={unequip}>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {equippableItems.map((item) => (
                    <ItemDragToken key={item.id} item={item} />
                  ))}
                </div>
              </EquipSlotRack>
            </DndContext>
          </div>

          <div>
            <MatericSectionHeader tier="tertiary" hint="C">{t('heroComponentsLab.sectionC')}</MatericSectionHeader>
            <EquippableItemCard
              item={equippableItems[0]}
              labels={{
                rarity: t('heroComponentsLab.rarity'),
                effect: t('heroComponentsLab.effect'),
                slot: t('heroComponentsLab.slot'),
              }}
            />
          </div>

          <div>
            <MatericSectionHeader tier="tertiary" hint="D">{t('heroComponentsLab.sectionD')}</MatericSectionHeader>
            <ConsumablePile
              items={inventory}
              useLabel={t('heroComponentsLab.use')}
              onUse={useConsumable}
            />
          </div>

          <div>
            <MatericSectionHeader tier="tertiary" hint="E">{t('heroComponentsLab.sectionE')}</MatericSectionHeader>
            <SkillDeck
              skills={skills}
              loadout={skillLoadout}
              labels={{
                available: t('heroComponentsLab.availableSkills'),
                equipped: t('heroComponentsLab.equippedSkills'),
                empty: t('heroComponentsLab.empty'),
              }}
              onToggle={toggleSkill}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
