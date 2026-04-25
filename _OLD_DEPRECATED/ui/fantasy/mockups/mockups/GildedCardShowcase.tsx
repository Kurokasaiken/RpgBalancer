import React, { useState } from 'react';
import { FantasyButton } from '../../atoms/FantasyButton';
import { SmartInput } from '../../components/SmartInput';
import { BalancingSolver } from '../../../balancing/solver';
import { calculateStatBlockCost } from '../../../balancing/costs';
import { PARAM_DEFINITIONS } from '../../../balancing/registry';
import { DEFAULT_STATS, type StatBlock, type LockedParameter } from '../../../balancing/types';
import type { Spell } from '../../../balancing/spellTypes';
import { createEmptySpell } from '../../../balancing/spellTypes';
import { calculateSpellBudget, getBaselineSpell } from '../../../balancing/spellBalancingConfig';

const StatCard: React.FC<{
  title: string;
  badge: string;
  value: string;
  description: string;
}> = ({ title, badge, value, description }) => (
  <div className="rounded-2xl border border-[#384444] bg-gradient-to-br from-[#101e22] to-[#0b1315] p-6 shadow-[0_15px_45px_rgba(0,0,0,0.6)]">
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-[0.3em] text-[#aeb8b4]">{title}</p>
      <span className="text-[#f1d69c] text-sm">{badge}</span>
    </div>
    <p className="text-3xl font-display mt-3 text-[#f5f0dc]">{value}</p>
    <div className="mt-4 h-[1px] bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
    <p className="text-sm text-[#aeb8b4] mt-3">{description}</p>
  </div>
);

const DetailCard: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="rounded-2xl border border-[#3b4a4a] bg-[#0c181b]/80 p-6">
    <h2 className="font-display text-2xl text-[#f5f0dc]">{title}</h2>
    <div className="mt-4 space-y-4 text-sm text-[#9fb3af]">{children}</div>
  </div>
);

const MiniBalancerCard: React.FC = () => {
  const [stats, setStats] = useState<StatBlock>(() => BalancingSolver.recalculate(DEFAULT_STATS));
  const [lockedParam, setLockedParam] = useState<LockedParameter>('none');
  const [collapsed, setCollapsed] = useState(false);

  const handleParamChange = (param: keyof StatBlock, value: number) => {
    const next = BalancingSolver.solve(stats, param, value, lockedParam);
    setStats(next);
  };

  const handleResetParam = (paramId: string) => {
    const def = PARAM_DEFINITIONS[paramId];
    if (def) {
      handleParamChange(paramId as keyof StatBlock, def.defaultValue);
    }
  };

  const handleResetAll = () => {
    setStats(BalancingSolver.recalculate(DEFAULT_STATS));
    setLockedParam('none');
  };

  const points = calculateStatBlockCost(stats).toFixed(1);

  return (
    <div className="rounded-2xl border border-[#384444] bg-gradient-to-br from-[#101e22] to-[#0b1315] p-6 shadow-[0_15px_45px_rgba(0,0,0,0.6)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.3em] text-[#aeb8b4]">Core Budget</p>
        <div className="flex items-center gap-3">
          <span className="text-[#c7b996] text-xs">balancer · live</span>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-[#aeb8b4] hover:text-[#f5f0dc] transition-colors"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
      </div>
      <p className="text-3xl font-display mt-1 text-[#f5f0dc]">{points}</p>
      <div className="mt-2 h-[1px] bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#aeb8b4]">Lock: {lockedParam}</span>
        <button
          onClick={handleResetAll}
          className="text-xs px-2 py-1 rounded border border-[#475758] bg-[#0c1517]/60 hover:bg-[#0c1517] text-[#c9a227] transition-colors"
          title="Reset All"
        >
          ↺ Reset All
        </button>
      </div>
      {!collapsed && (
        <div className="space-y-2 text-xs">
          <SmartInput
            paramId="hp"
            value={stats.hp}
            onChange={(v) => handleParamChange('hp', v)}
            onReset={() => handleResetParam('hp')}
            lockedParam={lockedParam}
            onLockToggle={setLockedParam}
            min={10}
            max={1000}
            step={10}
          />
          <SmartInput
            paramId="damage"
            value={stats.damage}
            onChange={(v) => handleParamChange('damage', v)}
            onReset={() => handleResetParam('damage')}
            lockedParam={lockedParam}
            onLockToggle={setLockedParam}
            min={1}
            max={200}
          />
          <SmartInput
            paramId="htk"
            value={stats.htk}
            onChange={(v) => handleParamChange('htk', v)}
            onReset={() => handleResetParam('htk')}
            lockedParam={lockedParam}
            onLockToggle={setLockedParam}
            min={1}
            max={20}
            step={0.1}
          />
        </div>
      )}
    </div>
  );
};

const MiniSpellBudgetCard: React.FC = () => {
  const [spell, setSpell] = useState<Spell>(() => createEmptySpell());
  const [collapsed, setCollapsed] = useState(false);

  const updateField = (field: keyof Spell, value: any) => {
    setSpell((prev) => ({ ...prev, [field]: value }));
  };

  const cost = calculateSpellBudget(spell, undefined, getBaselineSpell());

  // Mini slider helper
  const MiniSlider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (v: number) => void;
  }> = ({ label, value, min, max, step = 1, onChange }) => (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-[#aeb8b4]">{label}</span>
        <span className="text-xs font-mono text-[#f1d69c]">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-[#1b282b] rounded-lg appearance-none cursor-pointer slider-gilded"
        style={{
          background: `linear-gradient(to right, #c9a227 0%, #c9a227 ${((value - min) / (max - min)) * 100}%, #1b282b ${((value - min) / (max - min)) * 100}%, #1b282b 100%)`
        }}
      />
    </div>
  );

  return (
    <div className="rounded-2xl border border-[#3b4a4a] bg-[#0c181b]/80 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-[#f5f0dc]">Spell Creator – Budget</h2>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#aeb8b4]">live budget</span>
          <button
            onClick={() => setSpell(createEmptySpell())}
            className="text-[11px] px-2 py-1 rounded border border-[#475758] bg-[#0c1517]/60 hover:bg-[#0c1517] text-[#f1d69c] transition-colors"
          >
            ↺ Reset spell
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-[#aeb8b4] hover:text-[#f5f0dc] transition-colors"
            title={collapsed ? 'Mostra dettagli' : 'Nascondi dettagli'}
          >
            {collapsed ? '▢' : '▣'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-2">
          <label className="flex flex-col gap-1">
            <span className="text-[#aeb8b4]">Nome</span>
            <input
              className="px-3 py-2 rounded-md bg-[#111c1e] border border-[#404f51] text-[#f5f0dc] text-xs"
              value={spell.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Es. Solar Flare"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[#aeb8b4]">Type</span>
            <select
              className="px-3 py-2 rounded-md bg-[#111c1e] border border-[#404f51] text-[#f5f0dc] text-xs"
              value={spell.type || 'damage'}
              onChange={(e) => updateField('type', e.target.value as Spell['type'])}
            >
              <option value="damage">Damage</option>
              <option value="buff">Buff</option>
              <option value="debuff">Debuff</option>
            </select>
          </label>
        </div>
        <div className="space-y-2">
          <MiniSlider
            label="Effect %"
            value={spell.effect ?? 0}
            min={0}
            max={200}
            step={5}
            onChange={(v) => updateField('effect', v)}
          />
          <MiniSlider
            label="Eco / Duration"
            value={spell.eco ?? 1}
            min={1}
            max={10}
            step={1}
            onChange={(v) => updateField('eco', v)}
          />
          <MiniSlider
            label="Mana Cost"
            value={spell.manaCost ?? 0}
            min={0}
            max={50}
            step={1}
            onChange={(v) => updateField('manaCost', v)}
          />
        </div>
      </div>
      <div className="mt-2 h-[1px] bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-[0.25em] text-[#aeb8b4]">Weighted Budget</span>
        <span className="font-display text-2xl text-[#f1d69c]">{cost.toFixed(2)}</span>
      </div>
      {!collapsed && (
        <div className="text-xs text-[#aeb8b4] space-y-1">
          <p>Questa card usa davvero <span className="font-mono">calculateSpellBudget</span> sui campi Effect, Eco e ManaCost.</p>
        </div>
      )}
    </div>
  );
};

export const GildedCardShowcase: React.FC = () => (
  <div className="min-h-full bg-gradient-to-br from-[#050509] via-[#0f1a1d] to-[#132427] text-[#f0efe4] px-6 py-8 rounded-3xl border border-[#2c3737] shadow-[0_35px_90px_rgba(0,0,0,0.85)]">
    <header className="rounded-2xl border border-[#3b4b4d] bg-[#0c1517]/80 p-6 flex flex-col gap-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
      <div>
        <p className="text-xs uppercase tracking-[0.6em] text-[#aeb8b4]">Gilded Observatory</p>
        <h1 className="text-4xl font-display text-[#f6f3e4] mt-2">Gilded Card Showcase</h1>
        <p className="text-base text-[#cfdfd8] mt-3 max-w-3xl">
          Vetrina di card ispirate al mockup Gilded Observatory. Ogni card mostra come integreremo
          contenuti reali (Balancer, Spell Creator, ecc.) nel nuovo design, senza toccare ancora le pagine produttive.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <FantasyButton variant="gold" size="lg" rightIcon="🜚">
          Preset Bilanciamento
        </FantasyButton>
        <FantasyButton variant="secondary" size="lg" rightIcon="✨" className="border-[#475758]">
          Layout Spell Creator
        </FantasyButton>
      </div>
    </header>

    {/* Row 1: metriche statiche + mini Balancer reale */}
    <section className="mt-8 grid md:grid-cols-3 gap-6">
      <StatCard
        title="Hit Harmony"
        badge="balancer"
        value="87%"
        description="Esempio di metrica aggregata (HitChance) derivata da TxC ed Evasion."
      />
      <StatCard
        title="EDPT Tier"
        badge="simulator"
        value="Tier II"
        description="Classe di efficienza del danno per turno, calcolata dal motore di simulazione."
      />
      <MiniBalancerCard />
    </section>

    {/* Row 2: mini Spell Creator reale + scenario mock */}
    <section className="mt-8 grid md:grid-cols-2 gap-6">
      <MiniSpellBudgetCard />

      <DetailCard title="Preset Scenario – Duel Orbit">
        <p>
          Card per uno scenario di test 1v1: preset che combina StatBlock, Mitigation e parametri di simulazione.
          Serve come blueprint per le future UI Scenario/Testing. Qui è solo mock visivo.
        </p>
        <div className="mt-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#96aaa6]">Initiative Curve</span>
            <span className="text-[#f1d69c]">Balanced</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#96aaa6]">TTK Window</span>
            <span className="text-[#f1d69c]">3–5 turns</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#96aaa6]">Variance</span>
            <span className="text-[#f1d69c]">Low</span>
          </div>
        </div>
      </DetailCard>
    </section>
  </div>
);
