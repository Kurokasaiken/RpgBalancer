import '@testing-library/jest-dom/vitest';
import './src/test/setup/polyfills';

declare global {
  interface Window {
    __ENABLE_IDLE_VILLAGE_TEST_HOOKS?: boolean;
  }
  interface Array<T> {
    findLastIndex(predicate: (value: T, index: number, array: T[]) => boolean): number;
  }
}

if (typeof globalThis.Request === 'undefined') {
  class MinimalRequest {
    readonly url: string;
    readonly method: string;
    readonly headers: HeadersInit | undefined;
    readonly body: BodyInit | null | undefined;

    constructor(input: URL | string, init?: RequestInit) {
      this.url = input instanceof URL ? input.href : String(input);
      this.method = init?.method ?? 'GET';
      this.headers = init?.headers;
      this.body = init?.body ?? null;
    }
  }

  globalThis.Request = MinimalRequest as typeof globalThis.Request;
}

if (typeof HTMLCanvasElement !== 'undefined') {
  const proto = HTMLCanvasElement.prototype as HTMLCanvasElement & {
    _cascadeMocked?: boolean;
  };

  if (!proto._cascadeMocked) {
    const noop = () => undefined;
    const buildGradient = () => ({
      addColorStop: noop,
    });
    const buildContext = (): CanvasRenderingContext2D => {
      const metrics: TextMetrics = {
        width: 100,
        actualBoundingBoxAscent: 0,
        actualBoundingBoxDescent: 0,
        actualBoundingBoxLeft: 0,
        actualBoundingBoxRight: 0,
        fontBoundingBoxAscent: 0,
        fontBoundingBoxDescent: 0,
        emHeightAscent: 0,
        emHeightDescent: 0,
        hangingBaseline: 0,
        alphabeticBaseline: 0,
        ideographicBaseline: 0,
      } as TextMetrics;

      const ctx = {
        canvas: document.createElement('canvas'),
        fillStyle: '#000000',
        globalAlpha: 1,
        font: '16px monospace',
        textBaseline: 'bottom',
        textAlign: 'left',
        beginPath: noop,
        arc: noop,
        closePath: noop,
        clip: noop,
        fillRect: noop,
        fill: noop,
        drawImage: noop,
        clearRect: noop,
        save: noop,
        restore: noop,
        measureText: () => metrics,
        createRadialGradient: buildGradient,
        createLinearGradient: buildGradient,
        fillText: noop,
      } as unknown as CanvasRenderingContext2D;

      return ctx;
    };

    Object.defineProperty(proto, 'getContext', {
      configurable: true,
      writable: true,
      value(contextId: string): CanvasRenderingContext2D | null {
        return contextId === '2d' ? buildContext() : null;
      },
    });

    Object.defineProperty(proto, 'toDataURL', {
      configurable: true,
      writable: true,
      value(): string {
        return 'data:image/png;base64,live-bug-snapshotter-mock';
      },
    });

    proto._cascadeMocked = true;
  }
}

// Ensure diagnostics hooks are enabled during tests by default
Object.defineProperty(window, '__ENABLE_IDLE_VILLAGE_TEST_HOOKS', {
  writable: true,
  value: true,
});

if (typeof Array.prototype.findLastIndex !== 'function') {
  Object.defineProperty(Array.prototype, 'findLastIndex', {
    configurable: true,
    writable: true,
    value<T>(this: T[], predicate: (value: T, index: number, array: T[]) => boolean): number {
      for (let index = this.length - 1; index >= 0; index -= 1) {
        if (predicate(this[index], index, this)) {
          return index;
        }
      }
      return -1;
    },
  });
}
