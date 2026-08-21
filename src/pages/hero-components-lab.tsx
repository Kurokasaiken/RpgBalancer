import { useCallback, useEffect, useMemo, useState } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useTranslation } from '@/localization/useTranslation';
import PgDetailCard from '@/ui/idleVillage/components/PgDetailCard';
import { EquipSlotRack } from '@/ui/idleVillage/components/EquipSlotRack';
import { ItemDragToken } from '@/ui/idleVillage/components/ItemDragToken';
import { EquippableItemCard } from '@/ui/idleVillage/components/EquippableItemCard';
import { EquipmentDragToken } from '@/ui/equipment/EquipmentDragToken';
import { getAllEquipment } from '@/balancing/equipment/equipmentStorage';
import type { EquipmentItem } from '@/balancing/equipment/equipmentTypes';
import { ConsumablePile } from '@/ui/idleVillage/components/ConsumablePile';
import { SkillDeck } from '@/ui/idleVillage/components/SkillDeck';
import { useResidentHeroState } from '@/ui/idleVillage/hooks/useResidentHeroState';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import {
  equippableItems,
  skills,
} from '@/balancing/config/idleVillage/heroItems';
import type { Skill } from '@/balancing/config/idleVillage/heroItems';
import type { EquippableItem } from '@/ui/idleVillage/types/heroComponentItems';
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
  const [savedEquipment, setSavedEquipment] = useState<EquipmentItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [pendingItem, setPendingItem] = useState<string>('');
  const [selectedEquippable, setSelectedEquippable] = useState<EquippableItem | null>(null);

  useEffect(() => {
    let mounted = true;
    getAllEquipment().then((all) => {
      if (mounted) setSavedEquipment(all);
    });
    return () => { mounted = false; };
  }, []);

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
    grantedSkills,
    equip,
    unequip,
    useConsumable,
    toggleSkill,
  } = useResidentHeroState({ resident: baseResident, maxSkills: 3 });

  const availableSkills = useMemo<Skill[]>(() => {
    const granted = grantedSkills.map((id) => ({
      id,
      name: id,
      initial: id.charAt(0).toUpperCase(),
      effect: t('heroComponentsLab.grantedSkill', { defaultValue: 'Granted by equipment' }),
    }));
    return [...skills, ...granted];
  }, [grantedSkills, t]);

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
            <PgDetailCard resident={resident} onSlotClick={setSelectedSlot} />
            {selectedSlot && (
              <div style={{ marginTop: 12, padding: 12 }}>
                <div style={{ fontSize: 10, marginBottom: 8, color: 'var(--skin-text-muted)' }}>
                  {t('heroComponentsLab.selectedSlot')}: {selectedSlot}
                </div>
                {resident.statSnapshot?.equipment?.[selectedSlot] && (
                  <button
                    type="button"
                    onClick={() => { unequip(selectedSlot); setSelectedSlot(null); }}
                    style={{ fontSize: 10, color: 'var(--skin-glow-primary)' }}
                  >
                    {t('heroComponentsLab.unequip')}
                  </button>
                )}
                {!resident.statSnapshot?.equipment?.[selectedSlot] && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      value={pendingItem}
                      onChange={(e) => setPendingItem(e.target.value)}
                      style={{ flex: 1, fontSize: 10 }}
                    >
                      <option value="">{t('heroComponentsLab.selectItem')}</option>
                      {[...equippableItems, ...savedEquipment]
                        .filter((item) => item.slot === selectedSlot)
                        .map((item) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => { if (pendingItem) { equip(selectedSlot, pendingItem); setPendingItem(''); setSelectedSlot(null); } }}
                      style={{ fontSize: 10, color: 'var(--skin-glow-accent)' }}
                    >
                      {t('heroComponentsLab.equip')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <MatericSectionHeader tier="tertiary" hint="B">{t('heroComponentsLab.sectionB')}</MatericSectionHeader>
            <DndContext onDragEnd={handleDragEnd}>
              <EquipSlotRack slots={slotOrder} equipment={equipment} onUnequip={unequip} variant="flat">
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {equippableItems.map((item) => (
                    <ItemDragToken key={item.id} item={item} onClick={setSelectedEquippable} />
                  ))}
                  {savedEquipment.map((item) => (
                    <EquipmentDragToken key={item.id} item={item} />
                  ))}
                </div>
              </EquipSlotRack>
            </DndContext>
          </div>

          <div>
            <MatericSectionHeader tier="tertiary" hint="C">{t('heroComponentsLab.sectionC')}</MatericSectionHeader>
            <EquippableItemCard
              item={selectedEquippable || equippableItems[0]}
              labels={{
                rarity: t('heroComponentsLab.rarity'),
                effect: t('heroComponentsLab.effect'),
                slot: t('heroComponentsLab.slot'),
              }}
              variant="flat"
            />
          </div>

          <div>
            <MatericSectionHeader tier="tertiary" hint="D">{t('heroComponentsLab.sectionD')}</MatericSectionHeader>
            <ConsumablePile
              items={inventory}
              useLabel={t('heroComponentsLab.use')}
              onUse={useConsumable}
              variant="flat"
            />
          </div>

          <div>
            <MatericSectionHeader tier="tertiary" hint="E">{t('heroComponentsLab.sectionE')}</MatericSectionHeader>
            <SkillDeck
              skills={availableSkills}
              loadout={skillLoadout}
              labels={{
                available: t('heroComponentsLab.availableSkills'),
                equipped: t('heroComponentsLab.equippedSkills'),
                empty: t('heroComponentsLab.empty'),
              }}
              onToggle={toggleSkill}
              variant="flat"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
