export type HeadlessDiagnosticsLevel = 'log' | 'info' | 'warn' | 'debug' | 'error';

interface IdleVillageDiagnosticsEnv {
  VITE_IDLE_VILLAGE_DIAGNOSTICS?: string;
  VITE_ENABLE_SANDBOX_DIAGNOSTICS?: string;
}

interface IdleVillageDiagnosticsWindow {
  __ENABLE_IDLE_VILLAGE_TEST_HOOKS?: boolean;
  __ENABLE_IDLE_VILLAGE_DIAGNOSTICS?: boolean;
}

export interface HeadlessDiagnostics<TPayload = unknown> {
  log: (message: string, payload?: TPayload, tags?: string[]) => void;
  info: (message: string, payload?: TPayload, tags?: string[]) => void;
  warn: (message: string, payload?: TPayload, tags?: string[]) => void;
  debug: (message: string, payload?: TPayload, tags?: string[]) => void;
  error: (message: string, payload?: TPayload, tags?: string[]) => void;
  isEnabled: () => boolean;
}

function isDiagnosticsEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const win = window as IdleVillageDiagnosticsWindow;
    if (win.__ENABLE_IDLE_VILLAGE_TEST_HOOKS || win.__ENABLE_IDLE_VILLAGE_DIAGNOSTICS) {
      return true;
    }
  }

  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const env = import.meta.env as IdleVillageDiagnosticsEnv;
    if (env.VITE_IDLE_VILLAGE_DIAGNOSTICS === 'true' || env.VITE_ENABLE_SANDBOX_DIAGNOSTICS === 'true') {
      return true;
    }
  }

  return false;
}

const createConsoleLogger = (scope: string, level: Exclude<HeadlessDiagnosticsLevel, 'error'>) => {
  return (message: string, payload?: unknown, _tags?: string[]) => {
    const prefix = `[${scope}] ${message}`;
    if (payload !== undefined) {
      console[level](prefix, payload);
    } else {
      console[level](prefix);
    }
  };
};

const createConsoleErrorLogger = (scope: string) => {
  return (message: string, payload?: unknown, _tags?: string[]) => {
    const prefix = `[${scope}] ${message}`;
    if (payload instanceof Error) {
      console.error(prefix, payload);
      return;
    }
    if (payload !== undefined) {
      console.error(prefix, payload);
    } else {
      console.error(prefix);
    }
  };
};

export function createHeadlessDiagnostics<TPayload = unknown>(scope: string): HeadlessDiagnostics<TPayload> {
  const enabled = isDiagnosticsEnabled();

  const noop = () => {
    /* no-op */
  };

  if (!enabled) {
    return {
      log: noop,
      info: noop,
      warn: noop,
      debug: noop,
      error: noop,
      isEnabled: () => false,
    };
  }

  const infoLogger = createConsoleLogger(scope, 'info');
  const logLogger = createConsoleLogger(scope, 'log');
  const warnLogger = createConsoleLogger(scope, 'warn');
  const debugLogger = createConsoleLogger(scope, 'debug');
  const errorLogger = createConsoleErrorLogger(scope);

  return {
    log: (message, payload, tags) => logLogger(message, payload, tags),
    info: (message, payload, tags) => infoLogger(message, payload, tags),
    warn: (message, payload, tags) => warnLogger(message, payload, tags),
    debug: (message, payload, tags) => debugLogger(message, payload, tags),
    error: (message, payload, tags) => errorLogger(message, payload, tags),
    isEnabled: () => true,
  };
}
