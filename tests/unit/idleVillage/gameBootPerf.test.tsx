import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createGamePerfProbe } from '@/ui/idleVillage/utils/gamePerfProbe';
import { GameBootScreen } from '@/ui/idleVillage/components/gameFrame/GameBootScreen';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key }),
}));

describe('createGamePerfProbe', () => {
  it('collects a segment with p50/p95/worst/longFrames', async () => {
    const probe = createGamePerfProbe();
    const stats = await probe.run('unit-seg', async () => {
      await new Promise((r) => requestAnimationFrame(r));
    });
    expect(stats.name).toBe('unit-seg');
    expect(stats.frames).toBeGreaterThanOrEqual(0);
    expect(stats.p95).toBeGreaterThanOrEqual(stats.p50);
    expect(stats.worst).toBeGreaterThanOrEqual(stats.p95);
    expect(stats.longFrames).toBeGreaterThanOrEqual(0);
    expect(probe.report().segments.map((s) => s.name)).toContain('unit-seg');
  });

  it('measures between marks and reports them', async () => {
    const probe = createGamePerfProbe();
    probe.mark('a');
    await new Promise((r) => setTimeout(r, 20));
    const delta = probe.measure('a-to-now', 'a');
    expect(delta).not.toBeNull();
    expect(delta!).toBeGreaterThanOrEqual(10);
    probe.mark('b');
    expect(probe.measure('a-to-b', 'a', 'b')).toBeGreaterThanOrEqual(10);
    expect(probe.measure('missing', 'nope')).toBeNull();
    expect(probe.report().marks.a).toBeTypeOf('number');
  });

  it('end() closes the most recent open segment and reset() clears', () => {
    const probe = createGamePerfProbe();
    probe.begin('one');
    probe.begin('two');
    expect(probe.end()?.name).toBe('two');
    expect(probe.end('one')?.name).toBe('one');
    expect(probe.end()).toBeNull();
    probe.reset();
    expect(probe.report().segments).toHaveLength(0);
  });
});

describe('GameBootScreen', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders the authored logo, a labelled progress bar and the phase caption', () => {
    render(<GameBootScreen phase="assets" fraction={0.5} />);
    expect(screen.getByAltText('Wanderlust: Triumph')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('forces the bar to 100% when done and calls onExited after the fade window', async () => {
    const onExited = vi.fn();
    render(<GameBootScreen phase="ready" fraction={0.4} done onExited={onExited} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    // minDisplayMs (400) + fadeMs (550) + margin: the veil must be gone by ~1.2 s.
    await waitFor(() => expect(onExited).toHaveBeenCalledTimes(1), { timeout: 2500 });
  }, 10_000);

  it('shows the boot error instead of the progress bar', () => {
    render(<GameBootScreen phase="assets" error="manifest not found" />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('The world could not be prepared');
    expect(screen.getByText('manifest not found')).toBeInTheDocument();
  });
});
