import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { FloatingPanel } from '@/ui/idleVillage/components/FloatingPanel';

/**
 * jsdom ships no `PointerEvent`, so Testing Library falls back to a bare
 * `Event` and the coordinates the panel drags by never arrive. A MouseEvent
 * subclass is enough: it carries clientX/clientY and a pointerId.
 */
class TestPointerEvent extends MouseEvent {
  pointerId: number;
  constructor(type: string, params: MouseEventInit & { pointerId?: number } = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 1;
  }
}

beforeAll(() => {
  (globalThis as { PointerEvent?: unknown }).PointerEvent = TestPointerEvent;
  Element.prototype.setPointerCapture = function setPointerCapture() {};
  Element.prototype.releasePointerCapture = function releasePointerCapture() {};
  Element.prototype.hasPointerCapture = function hasPointerCapture() { return true; };
});

const renderPanel = (props: Partial<React.ComponentProps<typeof FloatingPanel>> = {}) =>
  render(
    <FloatingPanel panelId="p1" title="Cull Rats" {...props}>
      <p>Body content</p>
    </FloatingPanel>,
  );

/**
 * Dispatches a pointer drag.
 *
 * jsdom implements no `PointerEvent`, so `fireEvent.pointer*` delivers events
 * without coordinates. `MouseEvent` carries clientX/clientY and React routes it
 * to `onPointerDown`/`onPointerMove` by event type, which is what the component
 * actually reads.
 */
const dragFrom = (
  element: HTMLElement,
  from: [number, number],
  to: [number, number],
): void => {
  fireEvent.pointerDown(element, { clientX: from[0], clientY: from[1], pointerId: 1 });
  fireEvent.pointerMove(element, { clientX: to[0], clientY: to[1], pointerId: 1 });
  fireEvent.pointerUp(element, { clientX: to[0], clientY: to[1], pointerId: 1 });
};

const dragHeader = (from: [number, number], to: [number, number]): void =>
  dragFrom(screen.getByTestId('floating-panel-header-p1'), from, to);

describe('FloatingPanel — never blocks the page', () => {
  it('renders no backdrop that could swallow clicks', () => {
    const { container } = renderPanel();
    const covering = [...container.querySelectorAll('*')].filter((el) => {
      const style = (el as HTMLElement).style;
      return style.position === 'fixed' && style.inset === '0px';
    });
    expect(covering).toHaveLength(0);
  });

  it('is positioned rather than filling the viewport', () => {
    renderPanel({ initialPosition: { x: 200, y: 120 } });
    const panel = screen.getByTestId('floating-panel-p1');
    expect(panel.style.position).toBe('fixed');
    expect(panel.style.left).toBe('200px');
    expect(panel.style.top).toBe('120px');
  });

  it('shows its content and title', () => {
    renderPanel();
    expect(screen.getByText('Body content')).toBeTruthy();
    expect(screen.getByText('Cull Rats')).toBeTruthy();
  });
});

describe('FloatingPanel — moving', () => {
  it('follows the pointer when dragged by the header', () => {
    renderPanel({ initialPosition: { x: 300, y: 200 } });
    dragHeader([320, 210], [420, 340]);

    const panel = screen.getByTestId('floating-panel-p1');
    expect(panel.style.left).toBe('400px');
    expect(panel.style.top).toBe('330px');
  });

  it('ignores pointer moves that did not start on the header', () => {
    renderPanel({ initialPosition: { x: 300, y: 200 } });
    const header = screen.getByTestId('floating-panel-header-p1');
    fireEvent.pointerMove(header, { clientX: 900, clientY: 900, pointerId: 1 });

    const panel = screen.getByTestId('floating-panel-p1');
    expect(panel.style.left).toBe('300px');
  });

  it('does not start a drag from the header buttons', () => {
    renderPanel({ initialPosition: { x: 300, y: 200 }, onClose: vi.fn() });
    const close = screen.getByTestId('floating-panel-close-p1');
    fireEvent.pointerDown(close, { clientX: 500, clientY: 500, pointerId: 1 });
    fireEvent.pointerMove(screen.getByTestId('floating-panel-header-p1'), {
      clientX: 700,
      clientY: 700,
      pointerId: 1,
    });

    expect(screen.getByTestId('floating-panel-p1').style.left).toBe('300px');
  });

  it('keeps the panel reachable when dragged past the viewport edge', () => {
    renderPanel({ initialPosition: { x: 300, y: 200 } });
    dragHeader([320, 210], [-4000, -4000]);

    const panel = screen.getByTestId('floating-panel-p1');
    expect(Number.parseInt(panel.style.top, 10)).toBeGreaterThanOrEqual(0);
    expect(Number.parseInt(panel.style.left, 10)).toBeLessThan(window.innerWidth);
  });
});

describe('FloatingPanel — minimising', () => {
  it('collapses to a pill that keeps the title and drops the body', () => {
    renderPanel();
    fireEvent.click(screen.getByTestId('floating-panel-minimize-p1'));

    expect(screen.getByTestId('floating-panel-p1').dataset.minimized).toBe('true');
    expect(screen.getByText('Cull Rats')).toBeTruthy();
    expect(screen.queryByText('Body content')).toBeNull();
  });

  it('restores the body again', () => {
    renderPanel();
    fireEvent.click(screen.getByTestId('floating-panel-minimize-p1'));
    fireEvent.click(screen.getByTestId('floating-panel-minimize-p1'));

    expect(screen.getByTestId('floating-panel-p1').dataset.minimized).toBe('false');
    expect(screen.getByText('Body content')).toBeTruthy();
  });

  it('reports the change so the caller can react to it', () => {
    const onMinimizedChange = vi.fn();
    renderPanel({ onMinimizedChange });
    fireEvent.click(screen.getByTestId('floating-panel-minimize-p1'));

    expect(onMinimizedChange).toHaveBeenCalledWith(true);
  });

  it('honours a controlled minimised state', () => {
    renderPanel({ isMinimized: true, onMinimizedChange: vi.fn() });
    expect(screen.getByTestId('floating-panel-p1').dataset.minimized).toBe('true');
    expect(screen.queryByText('Body content')).toBeNull();
  });

  it('can be dragged while minimised', () => {
    renderPanel({ initialPosition: { x: 100, y: 100 }, isMinimized: true });
    const pill = screen.getByTestId('floating-panel-p1').firstElementChild as HTMLElement;
    dragFrom(pill, [110, 110], [210, 260]);

    expect(screen.getByTestId('floating-panel-p1').style.left).toBe('200px');
  });

  it('omits the minimise control when the caller opts out', () => {
    renderPanel({ minimizable: false });
    expect(screen.queryByTestId('floating-panel-minimize-p1')).toBeNull();
  });
});

describe('FloatingPanel — closing', () => {
  it('shows no close button unless a handler is given', () => {
    renderPanel();
    expect(screen.queryByTestId('floating-panel-close-p1')).toBeNull();
  });

  it('closes on demand', () => {
    const onClose = vi.fn();
    renderPanel({ onClose });
    fireEvent.click(screen.getByTestId('floating-panel-close-p1'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('FloatingPanel — stacking', () => {
  it('brings the touched panel in front of the other', () => {
    render(
      <>
        <FloatingPanel panelId="a" title="A">
          <p>a</p>
        </FloatingPanel>
        <FloatingPanel panelId="b" title="B">
          <p>b</p>
        </FloatingPanel>
      </>,
    );

    const zOf = (id: string): number =>
      Number(screen.getByTestId(`floating-panel-${id}`).style.zIndex);

    // B mounted last, so it starts on top.
    expect(zOf('b')).toBeGreaterThan(zOf('a'));

    fireEvent.pointerDown(screen.getByTestId('floating-panel-header-a'), {
      clientX: 5,
      clientY: 5,
      pointerId: 1,
    });
    expect(zOf('a')).toBeGreaterThan(zOf('b'));
  });
});
