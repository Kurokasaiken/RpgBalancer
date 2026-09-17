import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { useTranslation } from '@/localization/useTranslation';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { resolveResidentPortrait } from '@/engine/game/idleVillage/residentVisualResolver';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { getArchetypeSummary } from '@/ui/idleVillage/archetypeDirectory';
import { dispatchOpenArchetypeDetailEvent } from '@/shared/events/archetypeEvents';
import { getAllEquipment } from '@/balancing/equipment/equipmentStorage';
import type { EquipmentItem } from '@/balancing/equipment/equipmentTypes';
import { EquipmentDiabloPanel } from '@/ui/equipment/EquipmentDiabloPanel';
import StatIcon, { type StatIconType } from '@/ui/idleVillage/icons/statIcons';
import {
  STAT_DESCRIPTORS,
  STAT_CATEGORY_ORDER,
  formatStatDisplayValue,
  type StatCategory,
} from '@/balancing/config/idleVillage/statDescriptors';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import {
  MatericFrame,
  MatericSurface,
  MatericPlaque,
  MatericCloseButton,
  MatericPortrait,
  MatericStatBar,
  MatericButton,
  MatericBadge,
  MatericRecordList,
  MatericSectionHeader,
} from '@/ui/designSystem/primitives';

export interface PgDetailCardProps {
  resident: ResidentState;
  onClose?: () => void;
  onSlotClick?: (slotId: string) => void;
}

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

/** Raw storage ids must never reach the player: `longbow_oak` reads as `Longbow Oak`. */
const humanizeId = (value: string): string =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

/** One accent per stat category — the only place color carries meaning on this card. */
const CATEGORY_COLOR: Record<StatCategory, string> = {
  offense: '#d98a4a',
  defense: '#7fa8d9',
  utility: '#7bc96f',
};

/** Icon for each stat — visual language instead of text-only. */
const STAT_ICON_MAP: Record<string, StatIconType> = {
  hp: 'hp',
  damage: 'damage',
  armor: 'armor',
  resistance: 'resistance',
  txc: 'accuracy',
  regen: 'regen',
  evasion: 'evasion',
  critChance: 'critChance',
  agility: 'agility',
  lifesteal: 'lifesteal',
  movementSpeed: 'movementSpeed',
  cooldownReduction: 'cooldown',
  castSpeed: 'cooldown',
};

const DRAG_EXEMPT_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL']);

const isDragExemptTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (DRAG_EXEMPT_TAGS.has(target.tagName)) return true;
  if (target.closest('[data-drag-exempt="true"]')) return true;
  return false;
};

/**
 * PgDetailCard — scheda placeholder del personaggio.
 *
 * Skin-compliant: composizione di Materic* primitives con drag/close interno.
 */
const PgDetailCard: FC<PgDetailCardProps> = ({ resident, onClose, onSlotClick }) => {
  const { t } = useTranslation('idleVillage');
  const [equipmentMap, setEquipmentMap] = useState<Record<string, EquipmentItem>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const all = await getAllEquipment();
        const byId = Object.fromEntries(all.map((item) => [item.id, item]));
        setEquipmentMap(byId);
      } catch (error) {
        console.warn('[PgDetailCard] Failed to load equipment:', error);
      }
    };
    void load();
  }, []);

  const statusLabel = resident.isInjured
    ? t('pgDetailCard.status.injured')
    : t(`pgDetailCard.status.${resident.status}` as any, resident.status);
  /**
   * Only stats with a descriptor reach the player: `StatBlock` also carries
   * derived values (hitChance, effectiveDamage, htk...), balancing telemetry
   * (edpt, ttk, earlyImpact) and config flags, none of which a character sheet
   * should explain. HP is excluded on purpose too — the vitals bar below is
   * the single source of truth for it, not a second number in this list.
   */
  const statsByCategory = useMemo(() => {
    const snapshot = (resident.statSnapshot ?? {}) as Record<string, unknown>;
    const groups: Record<StatCategory, { label: string; display: string }[]> = {
      offense: [],
      defense: [],
      utility: [],
    };
    for (const [key, descriptor] of Object.entries(STAT_DESCRIPTORS)) {
      const value = snapshot[key];
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;
      if (!descriptor) continue;
      groups[descriptor.category].push({
        label: t(descriptor.labelKey),
        display: formatStatDisplayValue(descriptor.format, value),
      });
    }
    return STAT_CATEGORY_ORDER.map((category) => ({ category, entries: groups[category] })).filter(
      (group) => group.entries.length > 0,
    );
  }, [resident.statSnapshot, t]);
  const { portraitUrl } = useMemo(() => resolveResidentPortrait(resident), [resident]);
  const equipmentSlots = useMemo(() => {
    const snapshot = (resident.statSnapshot ?? {}) as Record<string, unknown>;
    const equipment = (snapshot.equipment as Record<string, unknown> | undefined) ?? {};
    const resolve = (value: unknown): string | undefined => {
      if (typeof value === 'string' && value.trim().length > 0) {
        const item = equipmentMap[value];
        return item?.name || humanizeId(value);
      }
      if (typeof value === 'object' && value && 'id' in value) {
        const id = String((value as { id: string }).id);
        const item = equipmentMap[id];
        return item?.name || humanizeId(id);
      }
      return undefined;
    };
    const getter = (...keys: string[]) => {
      for (const key of keys) {
        const value = equipment[key] ?? snapshot[key];
        const resolved = resolve(value);
        if (resolved) return resolved;
      }
      return undefined;
    };
    return [
      { id: 'weapon', label: t('pgDetailCard.equipment.weapon'), value: getter('weapon', 'equippedWeapon', 'primaryWeapon', 'weaponName') },
      { id: 'offhand', label: t('pgDetailCard.equipment.offhand'), value: getter('offhand', 'shield', 'secondaryWeapon') },
      { id: 'armor', label: t('pgDetailCard.equipment.armor'), value: getter('armor', 'equippedArmor', 'plate') },
      { id: 'trinket', label: t('pgDetailCard.equipment.trinket'), value: getter('trinket', 'amulet', 'relic') },
      { id: 'ring', label: t('pgDetailCard.equipment.ring'), value: getter('ring', 'ringSlot', 'sigil') },
      { id: 'mount', label: t('pgDetailCard.equipment.mount'), value: getter('companion', 'pet', 'mount') },
    ];
  }, [resident.statSnapshot, t, equipmentMap]);
  const inventoryTokens = useMemo(() => {
    const snapshot = resident.statSnapshot as Record<string, unknown> | undefined;
    const inventory = snapshot?.inventory;
    if (Array.isArray(inventory)) {
      return inventory
        .map((entry) => {
          if (typeof entry === 'string') return entry;
          if (typeof entry === 'object' && entry && 'name' in entry) {
            return String((entry as { name?: string }).name ?? '');
          }
          return '';
        })
        .filter((value) => value.length > 0);
    }
    return [];
  }, [resident.statSnapshot]);
  const archetypeSummary = useMemo(() => getArchetypeSummary(resident.statProfileId), [resident.statProfileId]);
  const staminaValue = 100 - clampPercent(resident.fatigue);

  const handleOpenArchetype = useCallback(() => {
    if (!archetypeSummary) return;
    dispatchOpenArchetypeDetailEvent(archetypeSummary.id);
  }, [archetypeSummary]);

  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!isDragging) return;
    const handlePointerMove = (event: PointerEvent) => {
      const dx = event.clientX - pointerOriginRef.current.x;
      const dy = event.clientY - pointerOriginRef.current.y;
      setPosition({
        x: dragOriginRef.current.x + dx,
        y: dragOriginRef.current.y + dy,
      });
    };
    const handlePointerUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    if (isDragExemptTarget(event.target)) return;
    if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    pointerOriginRef.current = { x: event.clientX, y: event.clientY };
    dragOriginRef.current = { ...position };
    setIsDragging(true);
  };

  const initials = resident.displayName.slice(0, 2).toUpperCase();

  return (
    <SkinScope
      data-testid="pg-detail-card"
      onPointerDown={handlePointerDown}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        width: '100%',
        maxWidth: 760,
      }}
    >
      <MatericSurface shape="panel" material="obsidian" isDragging={isDragging} style={{ padding: 12 }}>
        {/* Header — identity plaque left, state right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
            <MatericPlaque>{formatResidentLabel(resident)}</MatericPlaque>
            <span style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(141,179,165,0.62)' }}>
              {statusLabel}
            </span>
          </div>
          <MatericCloseButton onClick={onClose} style={{ width: 24, height: 24 }} aria-label={t('pgDetailCard.close')} />
        </div>

        {/* Elegant 2-column layout: large portrait (hero) + stats/loadout on right */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
          {/* Left: Portrait + archetype + tags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative' }}>
                <MatericPortrait portraitUrl={portraitUrl} initials={initials} size={180} isHero />
                {/* Ornamental corner accent */}
                <div
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    fontSize: 12,
                    color: 'rgba(201,162,39,0.4)',
                  }}
                >
                  ◇
                </div>
              </div>
            </div>

            {archetypeSummary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <MatericButton onClick={handleOpenArchetype} style={{ fontSize: 10, padding: '4px 10px', width: '100%' }}>
                  {archetypeSummary.name}
                </MatericButton>
                <span style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(141,179,165,0.65)' }}>
                  {archetypeSummary.category}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                {resident.statProfileId && (
                  <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(201,162,39,0.75)' }}>
                    {humanizeId(resident.statProfileId)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: Stats, loadout, inventory */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Statistics with icons */}
            <MatericFrame variant="molding" style={{ padding: 10 }}>
              <MatericSectionHeader tier="tertiary" marginBottom="sm">
                {t('pgDetailCard.statistics.label')}
              </MatericSectionHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {statsByCategory.map(({ category, entries }) => (
                  <div key={category}>
                    <div
                      style={{
                        fontSize: 7,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        color: CATEGORY_COLOR[category],
                        marginBottom: 6,
                        paddingBottom: 3,
                        borderBottom: `1px solid ${CATEGORY_COLOR[category]}44`,
                      }}
                    >
                      {t(`pgDetailCard.statistics.category.${category}`)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                      {entries.map(({ label, display }, i) => {
                        const key = Object.keys(STAT_DESCRIPTORS).find((k) => STAT_DESCRIPTORS[k] && t(STAT_DESCRIPTORS[k]!.labelKey) === label);
                        const iconType = key ? STAT_ICON_MAP[key] : undefined;
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {iconType && (
                              <StatIcon type={iconType} size={12} filled style={{ color: CATEGORY_COLOR[category], flexShrink: 0 }} />
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 8, color: 'rgba(237,224,196,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {label}
                              </span>
                              <span style={{ fontSize: 9, fontWeight: 600, color: CATEGORY_COLOR[category], whiteSpace: 'nowrap' }}>
                                {display}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </MatericFrame>

            {/* Loadout + Inventory */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <MatericFrame variant="molding" style={{ padding: 8 }}>
                <MatericSectionHeader tier="tertiary" marginBottom="sm" style={{ fontSize: 10 }}>
                  {t('pgDetailCard.equipment.label', 'Loadout')}
                </MatericSectionHeader>
                <EquipmentDiabloPanel slots={equipmentSlots} onSlotClick={onSlotClick} />
              </MatericFrame>

              <MatericFrame variant="molding" style={{ padding: 8 }}>
                <MatericSectionHeader tier="tertiary" marginBottom="sm" style={{ fontSize: 10 }}>
                  {t('pgDetailCard.inventory.label')}
                </MatericSectionHeader>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {inventoryTokens.length ? (
                    inventoryTokens.map((token) => (
                      <div key={token} style={{ fontSize: 8, color: 'var(--skin-body-color)', padding: '3px 4px', borderRadius: 2, background: 'rgba(201,162,39,0.08)' }}>
                        {token}
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: 8, color: 'rgba(141,179,165,0.35)' }}>
                      {t('pgDetailCard.inventory.empty')}
                    </span>
                  )}
                </div>
              </MatericFrame>
            </div>
          </div>
        </div>

        {/* Vitals strip spans full width */}
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            borderRadius: 6,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.55), rgba(4,7,9,0.8))',
            border: '1px solid rgba(141,179,165,0.12)',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.75)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <MatericStatBar
              variant="hp"
              size="sm"
              label={t('pgDetailCard.vitals.hp')}
              value={resident.currentHp}
              maxValue={resident.maxHp}
            />
            <MatericStatBar
              variant="stamina"
              size="sm"
              label={t('pgDetailCard.vitals.stamina')}
              value={staminaValue}
              maxValue={100}
            />
          </div>
        </div>
      </MatericSurface>
    </SkinScope>
  );
};

export default PgDetailCard;
