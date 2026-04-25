import { z } from 'zod';

/**
 * Configuration schema for every page monitored by the Multi-App Boot Guard.
 * Values stay config-first so the CLI can evolve without touching business logic.
 */
export const bootGuardPageConfigSchema = z.object({
  /** Unique identifier used by CLI flags (e.g. --page idle-village-tools). */
  id: z.string().min(1, 'boot guard page id is required'),
  /** Human readable label surfaced inside logs/reports. */
  label: z.string().min(1, 'boot guard page label is required'),
  /** Relative route opened through the Vite dev server (must start with /). */
  route: z.string().regex(/^\/.*/, 'route must start with /'),
  /** Playwright locator (data-testid, role, etc.) that signals successful boot. */
  successLocator: z.string().min(1, 'success locator is required'),
  /**
   * List of strings the guard treats as fatal overlay/banner errors.
   * The smoke spec will scan DOM text + console logs to find them.
   */
  errorSignatures: z.array(z.string()).nonempty(),
  /**
   * Optional selector that triggers a screenshot even on success
   * (useful for regression evidence on critical screens).
   */
  captureSelector: z.string().optional(),
  /** Maximum automatic retries before the guard escalates. */
  maxRetries: z.number().int().positive().default(3),
  /**
   * Some pages (e.g. CLI simulators) require a secondary dev command; list them
   * so the orchestrator can spin them up/down deterministically.
   */
  requiredProcesses: z
    .array(
      z.object({
        name: z.string(),
        command: z.string(),
      }),
    )
    .optional(),
});

/**
 * Root schema for the dev boot guard CLI.
 */
export const devBootGuardConfigSchema = z.object({
  version: z.literal(1),
  /**
   * Command used to start the Vite dev server.
   * The CLI will ensure only one instance exists at a time.
   */
  viteCommand: z.string().default('npm run dev'),
  /**
   * Playwright project name used for smoke checks.
   * Defaults to Desktop Chrome to align with existing suites.
   */
  playwrightProject: z.string().default('Desktop Chrome'),
  /** Directory where screenshots, traces, and failure logs are written. */
  artifactDir: z.string().default('test-results/boot-guard-artifacts'),
  /** File path for the structured execution log. */
  logFile: z.string().default('test-results/np-161-multi-app-boot-guard-latest.log'),
  /** Ordered list of pages to inspect. */
  pages: z.array(bootGuardPageConfigSchema),
});

export type DevBootGuardConfig = z.infer<typeof devBootGuardConfigSchema>;
export type BootGuardPageConfig = z.infer<typeof bootGuardPageConfigSchema>;

/**
 * Default configuration aligned with NP-161 requirements.
 * Keep this data-focused; business logic belongs in the CLI.
 */
export const DEFAULT_DEV_BOOT_GUARD_CONFIG: DevBootGuardConfig = devBootGuardConfigSchema.parse({
  version: 1,
  pages: [
    {
      id: 'idle-village-tools',
      label: 'Idle Village Tools',
      route: '/idle-village/tools',
      successLocator: '[data-testid="village-sandbox-shell"]',
      errorSignatures: [
        'Something went wrong',
        'An error occurred in Village Sandbox',
        'IdleVillageToolsError',
      ],
      captureSelector: '[data-testid="village-sandbox-shell"]',
      maxRetries: 3,
    },
    {
      id: 'idle-village-sandbox',
      label: 'Idle Village Sandbox',
      route: '/idle-village/sandbox',
      successLocator: '[data-testid="idle-village-sandbox-root"]',
      errorSignatures: ['An error occurred in Village Sandbox', 'SandboxOverlayError'],
      captureSelector: '[data-testid="idle-village-sandbox-root"]',
      maxRetries: 3,
    },
    {
      id: 'sts-cli',
      label: 'STS CLI Simulator',
      route: '/sts/cli',
      successLocator: '[data-testid="sts-cli-shell"]',
      errorSignatures: ['STS CLI failed to load', 'STS Simulator Error'],
      requiredProcesses: [
        {
          name: 'sts-cli-backend',
          command: 'npm run sts:benchmark:quick',
        },
      ],
      maxRetries: 2,
    },
    {
      id: 'punch-club',
      label: 'Punch Club PWA',
      route: '/punch-club',
      successLocator: '[data-testid="pwa-shell"]',
      errorSignatures: ['Punch Club failed to load', 'PWA install rejected'],
      captureSelector: '[data-testid="pwa-shell"]',
      maxRetries: 3,
    },
    {
      id: 'idle-village-map',
      label: 'Idle Village Map',
      route: '/idle-village/map',
      successLocator: '[data-testid="idle-village-map-root"]',
      errorSignatures: ['Idle Village Map crashed', 'MapLayerError'],
      captureSelector: '[data-testid="idle-village-map-root"]',
      maxRetries: 3,
    },
  ],
});

/**
 * Helper used by the CLI to load and validate external configs if needed.
 * Consumers can extend the default list by spreading this object.
 */
export const loadDevBootGuardConfig = (
  overrides?: Partial<DevBootGuardConfig>,
): DevBootGuardConfig => {
  const merged = {
    ...DEFAULT_DEV_BOOT_GUARD_CONFIG,
    ...overrides,
    pages: overrides?.pages ?? DEFAULT_DEV_BOOT_GUARD_CONFIG.pages,
  };
  return devBootGuardConfigSchema.parse(merged);
};
