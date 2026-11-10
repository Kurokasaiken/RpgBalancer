/** PLAN-102 lingua toggle — IT overlay resolution + in-place preview (R-247 regression).
 *  Bug: the `lingua: EN|IT` header toggle flipped state nothing consumed — the
 *  play surface always showed the EN manuscript. */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EditorPlaySurface, resolveItCopy } from '@/ui/idleVillage/questEditor/EditorPlaySurface';
import { createWorkingCopy, derive } from '@/ui/idleVillage/questEditor/workingCopy';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { GOBLIN_IT } from '@/balancing/config/idleVillage/quests/scenarios/goblin.it-IT';
import type { ContentOverlay } from '@/balancing/config/idleVillage/quests/questContentLocale';

const OV: ContentOverlay = { 'nodes.n1.body': ['EN source', 'IT tradotta'] };

describe('resolveItCopy — IT copy resolution', () => {
  it('session edit wins over the authored overlay', () =>
    expect(resolveItCopy('n1.body', 'EN source', OV, { 'n1.body': 'bozza' })).toEqual({ v: 'bozza' }));
  it('fresh authored entry shows the translation', () =>
    expect(resolveItCopy('n1.body', 'EN source', OV, {})).toEqual({ v: 'IT tradotta' }));
  it('stale entry (EN source changed) shows the source + stale mark', () =>
    expect(resolveItCopy('n1.body', 'EN changed', OV, {})).toEqual({ v: 'EN changed', mark: 'stale' }));
  it('no entry anywhere shows the source + missing mark', () =>
    expect(resolveItCopy('n1.body', 'EN source', undefined, {})).toEqual({ v: 'EN source', mark: 'missing' }));
});

describe('EditorPlaySurface lingua toggle', () => {
  const wc = createWorkingCopy(GOBLIN_SCENARIO);
  const props = {
    snapshot: derive(wc),
    workingCopy: wc,
    onOpsChange: vi.fn(),
    dirty: false,
    seed: 1,
    onReseed: vi.fn(),
    itEdits: {},
    onItEdit: vi.fn(),
    authoredOverlay: GOBLIN_IT,
  };

  it('EN shows the manuscript', async () => {
    render(<EditorPlaySurface {...props} lang="EN" />);
    expect(await screen.findByText('Exploration')).toBeInTheDocument();
  });

  it('IT shows the authored translation in place', async () => {
    render(<EditorPlaySurface {...props} lang="IT" />);
    expect(await screen.findByText('Esplorazione')).toBeInTheDocument();
    expect(screen.queryByText('Exploration')).not.toBeInTheDocument();
  });

  it('IT without an authored overlay marks entries missing', async () => {
    render(<EditorPlaySurface {...props} lang="IT" authoredOverlay={undefined} />);
    expect((await screen.findAllByText('IT missing')).length).toBeGreaterThan(0);
  });

  it('IT editing writes the W-03 overlay key, not the manuscript', async () => {
    const onItEdit = vi.fn();
    render(<EditorPlaySurface {...props} lang="IT" onItEdit={onItEdit} />);
    const ed = await screen.findByText('Esplorazione');
    fireEvent.click(ed);
    ed.textContent = 'Esplorazione!';
    fireEvent.blur(ed);
    expect(onItEdit).toHaveBeenCalledWith('gob-esplora.title', 'Esplorazione!');
    expect(props.onOpsChange).not.toHaveBeenCalled();
  });
});
