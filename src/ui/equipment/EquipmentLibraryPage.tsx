import { useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Trash2 } from 'lucide-react';
import { getAllEquipment, deleteEquipment } from '@/balancing/equipment/equipmentStorage';
import type { EquipmentItem } from '@/balancing/equipment/equipmentTypes';
import { EquipmentCostModule } from '@/balancing/equipment/EquipmentCostModule';
import { MatericSurface, MatericPlaque, MatericButton } from '@/ui/designSystem/primitives';

export const EquipmentLibraryPage: FC = () => {
  const { t } = useTranslation('idleVillage');
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await getAllEquipment();
        setItems(all);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteEquipment(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--skin-surface-bg)', color: 'var(--skin-text-primary)' }}>
        {t('equipment.loading')}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-8 overflow-y-auto"
      style={{
        backgroundColor: 'var(--skin-surface-bg)',
        color: 'var(--skin-text-primary)',
      }}
    >
      <div
        className="max-w-7xl mx-auto rounded-lg p-6"
        style={{
          backgroundColor: 'var(--skin-surface-base)',
          border: '1px solid var(--skin-surface-border)',
          boxShadow: '0 0 20px rgba(0, 229, 255, 0.1)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h1
            className="text-2xl font-semibold tracking-[0.2em] flex items-center gap-3"
            style={{ color: 'var(--skin-title-color)' }}
          >
            <Shield className="w-6 h-6" style={{ color: 'var(--skin-icon-accent)' }} />
            <span>{t('equipment.library')}</span>
          </h1>
          <MatericButton variant="cta" onClick={() => { window.location.href = '/equipment-creator'; }}>
            {t('equipment.new')}
          </MatericButton>
        </div>

        <div className="grid gap-4">
          {items.length === 0 && (
            <p style={{ color: 'var(--skin-text-secondary)' }}>{t('equipment.emptyLibrary')}</p>
          )}
          {items.map((item) => {
            const { cost, budget, balance, power } = EquipmentCostModule.getCompleteCost(item);
            return (
              <MatericSurface
                key={item.id}
                shape="card"
                material="obsidian"
                style={{ padding: 12 }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <MatericPlaque>{item.name || t('equipment.unnamed')}</MatericPlaque>
                    <div className="text-[10px] mt-1" style={{ color: 'var(--skin-text-muted)' }}>
                      {t(`equipment.types.${item.type}`)} · {t(`equipment.rarity.${item.rarity}`)} · {t('equipment.power')}: {power.toFixed(1)}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--skin-text-muted)' }}>
                      {t('equipment.cost')}: {cost.toFixed(1)} / {t('equipment.budget')}: {budget} · {balance > 0 ? '+' : ''}{balance.toFixed(1)}
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: 'var(--skin-text-muted)' }}>
                      {Object.entries(item.stats)
                        .filter(([, value]) => value !== 0 && value !== undefined)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(' · ') || '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MatericButton
                      variant="utility"
                      onClick={() => { window.location.href = `/equipment-creator?id=${item.id}`; }}
                    >
                      {t('equipment.edit')}
                    </MatericButton>
                    <MatericButton variant="ghost" onClick={() => void handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </MatericButton>
                  </div>
                </div>
              </MatericSurface>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EquipmentLibraryPage;
