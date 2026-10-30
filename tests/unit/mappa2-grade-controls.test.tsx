/**
 * Regression guard for .mw/bugs/2026-10-30-mappa2-lab-hide-ui-grade:
 * the look-dev grade filter on the Pixi canvas is owned by the page
 * (`useMappa2Grade`), not by the controls panel — hiding the test UI or
 * switching tabs must not remove it.
 */
import { act, render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Mappa2GradeControls } from '@/pages/mappa2-grade-controls';
import { useMappa2Grade } from '@/pages/useMappa2Grade';

const appliedFilter = { value: '' };

/** The Pixi canvas lives outside React's controls subtree; emulate it on body. */
function mountFakePixiCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  Object.defineProperty(canvas.style, 'filter', {
    configurable: true,
    get: () => appliedFilter.value,
    set: (v: string) => {
      appliedFilter.value = v;
    },
  });
  document.body.appendChild(canvas);
  return canvas;
}

function Harness() {
  const gradeCtl = useMappa2Grade();
  const [uiVisible, setUiVisible] = useState(true);
  return (
    <div>
      <button type="button" data-testid="hide-ui" onClick={() => setUiVisible(false)}>
        hide
      </button>
      {uiVisible && <Mappa2GradeControls grade={gradeCtl.grade} onPatch={gradeCtl.set} />}
    </div>
  );
}

describe('mappa2 grade lifecycle', () => {
  afterEach(() => {
    document.body.querySelectorAll('canvas').forEach((c) => c.remove());
    appliedFilter.value = '';
  });

  it('keeps the canvas filter applied when the controls unmount, clears it on page unmount', async () => {
    mountFakePixiCanvas();
    const view = render(<Harness />);

    await act(async () => undefined);
    expect(appliedFilter.value).toBe(''); // opt-in: the sapphire sea is baked, the look-dev filter starts off
    await act(async () => {
      (view.getByTestId('mappa2-grade-controls').querySelector('input[type=checkbox]') as HTMLInputElement).click();
    });
    expect(appliedFilter.value).toContain('mappa2-grade-filter');

    // "Hide test UI": the controls unmount, the page stays mounted.
    await act(async () => {
      view.getByTestId('hide-ui').click();
    });
    expect(view.queryByTestId('mappa2-grade-controls')).toBeNull();
    expect(appliedFilter.value).toContain('mappa2-grade-filter');

    // Leaving the page must still clean up the filter and the SVG host.
    view.unmount();
    expect(appliedFilter.value).toBe('');
    expect(document.getElementById('mappa2-grade-filter-host')).toBeNull();
  });
});
