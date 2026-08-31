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
import {
  MatericFrame,
  MatericSurface,
  MatericPlaque,
  MatericCloseButton,
  MatericPortrait,
  MatericStatBar,
  MatericButton,
  MatericBadge,
  MatericField,
  MatericRecordList,
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
  const snapshotEntries = useMemo(() => {
    const snapshot = resident.statSnapshot ?? {};
    return Object.entries(snapshot)
      .filter(([key, value]) => {
        if (key === 'portraitUrl' || key === 'equipment' || key === 'inventory') return false;
        return typeof value === 'number' && Number.isFinite(value);
      })
      .sort(([, a], [, b]) => (Number(b) || 0) - (Number(a) || 0));
  }, [resident.statSnapshot]);
  const { portraitUrl, fullFigureUrl } = useMemo(() => resolveResidentPortrait(resident), [resident]);
  const equipmentSlots = useMemo(() => {
    const snapshot = (resident.statSnapshot ?? {}) as Record<string, unknown>;
    const equipment = (snapshot.equipment as Record<string, unknown> | undefined) ?? {};
    const resolve = (value: unknown): string | undefined => {
      if (typeof value === 'string' && value.trim().length > 0) {
        const item = equipmentMap[value];
        return item?.name || value;
      }
      if (typeof value === 'object' && value && 'id' in value) {
        const id = String((value as { id: string }).id);
        const item = equipmentMap[id];
        return item?.name || id;
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
    <div
      data-testid="pg-detail-card"
      onPointerDown={handlePointerDown}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        maxHeight: '80vh',
        width: '100%',
        maxWidth: 360,
      }}
    >
      <MatericFrame variant="molding" style={{ padding: 12 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <MatericPlaque>{formatResidentLabel(resident)}</MatericPlaque>
            <div style={{ fontSize: 10, color: 'var(--skin-body-color)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>{statusLabel}</div>
          </div>
          <MatericCloseButton onClick={onClose} style={{ width: 28, height: 28 }} aria-label={t('pgDetailCard.close')} />
        </div>

        {/* Portrait & identity */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
          <MatericPortrait portraitUrl={portraitUrl} initials={initials} size={80} isHero />
          <div style={{ flex: 1 }}>
            {archetypeSummary ? (
              <>
                <MatericPlaque>{archetypeSummary.name}</MatericPlaque>
                <div style={{ fontSize: 9, color: 'var(--skin-body-color)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 4 }}>{archetypeSummary.category}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                  {archetypeSummary.tags.slice(0, 3).map((tag) => (
                    <MatericBadge key={tag}>{tag}</MatericBadge>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--skin-body-color)' }}>
                {t('pgDetailCard.unknownPreset', { id: resident.statProfileId ?? '—' })}
              </p>
            )}
            {fullFigureUrl && (
              <MatericButton style={{ marginTop: 8, fontSize: 9 }}>
                <a href={fullFigureUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                  {t('pgDetailCard.fullFigure')}
                </a>
              </MatericButton>
            )}
          </div>
        </div>

        {/* Vitals — frame-only sections */}
        <MatericFrame variant="molding" style={{ padding: 10, marginBottom: 12 }}>
          <MatericStatBar variant="hp" size="sm" value={resident.currentHp} max={resident.maxHp} />
          <div style={{ marginTop: 8 }}>
            <MatericStatBar variant="stamina" size="sm" value={resident.fatigue} max={100} />
          </div>
        </MatericFrame>

        {/* Statistics */}
        <MatericFrame variant="molding" style={{ padding: 10, marginBottom: 12 }}>
          <MatericRecordList
            columns={[
              { width: '1fr', variant: 'label' },
              { width: '1fr', variant: 'value' },
            ]}
            records={[
              [t('pgDetailCard.statistics.label'), t('pgDetailCard.statistics.count', { count: snapshotEntries.length })],
              ...snapshotEntries.map(([key, value]) => [key, Number(value).toFixed(2)]),
            ]}
          />
        </MatericFrame>

        {/* Equipment */}
        <MatericFrame variant="molding" style={{ padding: 10, marginBottom: 12 }}>
          <EquipmentDiabloPanel slots={equipmentSlots} onSlotClick={onSlotClick} />
        </MatericFrame>

        {/* Inventory */}
        <MatericFrame variant="molding" style={{ padding: 10 }}>
          <MatericField label={t('pgDetailCard.inventory.label')} value="" />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {inventoryTokens.length ? (
              inventoryTokens.map((token) => (
                <MatericBadge key={token}>{token}</MatericBadge>
              ))
            ) : (
              <span style={{ fontSize: 9, color: 'var(--skin-body-color)' }}>{t('pgDetailCard.inventory.empty')}</span>
            )}
          </div>
        </MatericFrame>
      </MatericFrame>
    </div>
  );
};

export default PgDetailCard;
