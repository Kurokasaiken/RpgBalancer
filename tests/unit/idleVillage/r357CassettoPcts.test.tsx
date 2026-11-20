/**
 * R-357 / Director ruling 2026-11-20 — «Accanto a difficoltà % morte,
 * accanto al reward % di riuscita».
 *
 * Covers INV:cassetto-risk-reward-pcts — the readouts come ONLY from the
 * party's own Monte Carlo sim (`deathPct` = `sim.anyDeathPct`,
 * `successPct` = `sim.outcomePct.reward`), painted beside the risk value and
 * beside the reward. While the estimate is pending ('computing'/'incomplete')
 * both stay absent — never fabricated, never hardcoded.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { CassettoQuest } from '@/ui/idleVillage/hudReal/HudRealCassetto';
import { HudRealCassetto } from '@/ui/idleVillage/hudReal/HudRealCassetto';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${Object.values(opts).join('|')}` : key,
  }),
}));

vi.mock('@/ui/idleVillage/components/ResidentSlotRack', () => ({
  ResidentSlotRack: () => <div data-testid="resident-slot-rack-stub" />,
}));

const QUEST: CassettoQuest = {
  title: 'Goblin Extermination',
  subtitle: 'Pianifica la spedizione',
  briefing: 'briefing',
  legs: [
    { label: 'Outbound', days: 1 },
    { label: 'At site', days: 2 },
    { label: 'Return', days: 1 },
  ],
  riskLabel: 'letale',
  deathPct: 96,
  rewards: [{ icon: 'gold', qty: '60' }],
  successPct: 4,
};

const renderCassetto = (quest: CassettoQuest = QUEST) =>
  render(
    <div style={{ position: 'relative', width: 356, height: 900 }}>
      <HudRealCassetto quest={quest} slots={[]} />
    </div>,
  );

describe('R-357 — % morte beside risk, % riuscita beside reward', () => {
  // INV:cassetto-risk-reward-pcts — the sim-derived readouts paint next to
  // the risk value (deaths) and the reward (success), from real props only.
  it('paints deathPct next to the risk value and successPct next to the reward', () => {
    renderCassetto();
    expect(screen.getByTestId('cassetto-death-pct')).toHaveTextContent('96');
    expect(screen.getByTestId('cassetto-success-pct')).toHaveTextContent('4');
    /* Same block, not scattered: the death pct follows the risk value inside
     *  the risk-rewards zone. */
    // 2026-11-20 layout: the big death % comes first, the skull level (the risk) right under it.
    const risk = screen.getByTestId('cassetto-risk-value');
    expect(screen.getByTestId('cassetto-death-pct').compareDocumentPosition(risk) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('paints nothing while the estimate is pending — never fabricated', () => {
    renderCassetto({ ...QUEST, deathPct: undefined, successPct: undefined, riskPending: 'computing' });
    expect(screen.queryByTestId('cassetto-death-pct')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cassetto-success-pct')).not.toBeInTheDocument();
  });

  // INV:cassetto-risk-reward-pcts — layout (2026-11-20): a BIG % beside each emblem; pending keeps a dash in the same slot
  it('while pending each % slot shows a dash; known shows the number (laurel icon on the success side)', () => {
    const { unmount } = render(<div style={{ width: 420, height: 900 }}><HudRealCassetto quest={{ ...QUEST, deathPct: undefined, successPct: undefined }} slots={[]} /></div>);
    expect(screen.getByTestId('cassetto-death-pct-pending')).toHaveTextContent('—');
    expect(screen.getByTestId('cassetto-success-pct-pending')).toHaveTextContent('—');
    unmount();
    const { container } = render(<div style={{ width: 420, height: 900 }}><HudRealCassetto quest={{ ...QUEST, deathPct: 96, successPct: 4 }} slots={[]} /></div>);
    expect(screen.getByTestId('cassetto-death-pct')).toHaveTextContent('96%');
    expect(screen.getByTestId('cassetto-success-pct')).toHaveTextContent('4%');
    expect(screen.getByTestId('cassetto-success-pct').querySelector('img[data-laurel]')).not.toBeNull();   // generated laurel icon
    expect(container.querySelectorAll('[data-pct-fill]')).toHaveLength(0);                       // no meters any more
  });
});
